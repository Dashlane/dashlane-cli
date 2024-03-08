import Database from 'better-sqlite3';
import { Clipboard } from '@napi-rs/clipboard';
import { authenticator } from 'otplib';
import winston from 'winston';
import { AuthentifiantTransactionContent, BackupEditTransaction, LocalConfiguration, VaultCredential } from '../types';
import { decryptTransactions } from '../modules/crypto';
import { askCredentialChoice, filterMatches } from '../utils';
import { connectAndPrepare } from '../modules/database';

export const runPassword = async (filters: string[] | null, options: { output: 'json' | 'clipboard' | 'console', field: 'login' | 'email' | 'password' }) => {
    const { output, field } = options;
    const { db, localConfiguration } = await connectAndPrepare({});

    const foundCredentials = await findCredentials({ db, filters, localConfiguration });

    if (output === 'json') {
        console.log(JSON.stringify(foundCredentials));
        return;
    }

    const selectedCredential = await selectCredential(foundCredentials, Boolean(filters?.length));

    let result;
    switch (field) {
        case 'login':
            result = selectedCredential.login;
            break;
        case 'email':
            result = selectedCredential.email;
            break;
        case 'password':
            result = selectedCredential.password;
            break;
        default:
            throw new Error('Unable to recognize the field.');
    }

    switch (output) {
        case 'clipboard':
            if (result) {
                const clipboard = new Clipboard();
                clipboard.setText(result);

                console.log(
                    `🔓 ${field} for "${selectedCredential.title || selectedCredential.url || 'N/C'}" copied to clipboard!`
                );

                if (selectedCredential.otpSecret) {
                    const token = authenticator.generate(selectedCredential.otpSecret);
                    const timeRemaining = authenticator.timeRemaining();
                    console.log(`🔢 OTP code: ${token} \u001B[3m(expires in ${timeRemaining} seconds)\u001B[0m`);
                }
            } else {
                console.log(
                    `⚠ No ${field} found for "${selectedCredential.title || selectedCredential.url || 'N/C'}.`
                );
            }
            break;
        case 'console':
            if (result) {
                console.log(result);
            } else {
                console.log(
                    `⚠ No ${field} found for "${selectedCredential.title || selectedCredential.url || 'N/C'}.`
                );
            }
            break;
        default:
            throw new Error('Unable to recognize the output mode.');
    }

    db.close();
};

export const runOtp = async (filters: string[] | null, options: { print: boolean }) => {
    const { db, localConfiguration } = await connectAndPrepare({});

    const clipboard = new Clipboard();
    const foundCredentials = (await findCredentials({ db, filters, localConfiguration })).filter(
        (credential) => credential.otpSecret
    );
    const selectedCredential = await selectCredential(foundCredentials, Boolean(filters?.length));

    const output = options.print ? 'otp' : 'clipboard';

    // otpSecret can't be null because onlyOtpCredentials is set to true above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const token = authenticator.generate(selectedCredential.otpSecret!);
    const timeRemaining = authenticator.timeRemaining();
    switch (output) {
        case 'clipboard':
            clipboard.setText(token);
            console.log(`🔢 OTP code: ${token} \u001B[3m(expires in ${timeRemaining} seconds)\u001B[0m`);
            break;
        case 'otp':
            console.log(token);
            break;
        default:
            throw new Error('Unable to recognize the output mode.');
    }

    db.close();
};

interface GetCredential {
    filters: string[] | null;
    localConfiguration: LocalConfiguration;
    db: Database.Database;
}

export const findCredentials = async (params: GetCredential): Promise<VaultCredential[]> => {
    const { localConfiguration, filters, db } = params;

    winston.debug(`Retrieving: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND type = 'AUTHENTIFIANT' AND action = 'BACKUP_EDIT'`)
        .bind(localConfiguration.login)
        .all() as BackupEditTransaction[];

    const credentialsDecrypted = await decryptTransactions<AuthentifiantTransactionContent>(
        transactions,
        localConfiguration
    );

    // transform entries [{_attributes: {key:xx}, _cdata: ww}] into an easier-to-use object
    const beautifiedCredentials = credentialsDecrypted.map(
        (item) =>
            Object.fromEntries(
                item.root.KWAuthentifiant.KWDataItem.map((entry) => [
                    entry._attributes.key[0].toLowerCase() + entry._attributes.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                    entry._cdata,
                ])
            ) as unknown as VaultCredential
    );

    return filterMatches<VaultCredential>(beautifiedCredentials, filters);
};

export const selectCredential = async (
    vaultCredentials: VaultCredential[],
    hasFilters: boolean
): Promise<VaultCredential> => {
    if (!vaultCredentials || vaultCredentials.length === 0) {
        throw new Error('No credential with this name found');
    } else if (vaultCredentials.length === 1) {
        return vaultCredentials[0];
    }

    return askCredentialChoice({ matchedCredentials: vaultCredentials, hasFilters });
};
