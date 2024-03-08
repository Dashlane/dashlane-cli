import Database from 'better-sqlite3';
import { Clipboard } from '@napi-rs/clipboard';
import { authenticator } from 'otplib';
import winston from 'winston';
import { AuthentifiantTransactionContent, BackupEditTransaction, LocalConfiguration, VaultCredential } from '../types';
import { decryptTransactions } from '../modules/crypto';
import { askCredentialChoice, filterMatches } from '../utils';
import { connectAndPrepare } from '../modules/database';

export const runPassword = async (
    filters: string[] | null,
    options: { output: 'json' | 'clipboard' | 'console'; field: 'login' | 'email' | 'password' | 'otp' }
) => {
    const { output, field } = options;
    const { db, localConfiguration } = await connectAndPrepare({});

    let foundCredentials = await findCredentials({ db, filters, localConfiguration });
    db.close();

    if (output === 'json') {
        console.log(JSON.stringify(foundCredentials));
        return;
    }

    if (field === 'otp') {
        foundCredentials = foundCredentials.filter((credential) => credential.otpSecret);
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
        case 'otp':
            if (!selectedCredential.otpSecret) {
                throw new Error('No OTP found for this credential.');
            }
            result = authenticator.generate(selectedCredential.otpSecret);
            break;
        default:
            throw new Error('Unable to recognize the field.');
    }

    if (!result) {
        throw new Error(`No ${field} found for "${selectedCredential.title ?? selectedCredential.url ?? 'N/C'}.`);
    }

    if (output === 'console') {
        console.log(result);
    }

    const clipboard = new Clipboard();
    clipboard.setText(result);
    console.log(
        `🔓 ${field} for "${selectedCredential.title || selectedCredential.url || 'N/C'}" copied to clipboard!`
    );

    if (field === 'password' && selectedCredential.otpSecret) {
        const token = authenticator.generate(selectedCredential.otpSecret);
        const timeRemaining = authenticator.timeRemaining();
        console.log(`🔢 OTP code: ${token} \u001B[3m(expires in ${timeRemaining} seconds)\u001B[0m`);
    }
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
        throw new Error('No credential found with this filters.');
    } else if (vaultCredentials.length === 1) {
        return vaultCredentials[0];
    }

    return askCredentialChoice({ matchedCredentials: vaultCredentials, hasFilters });
};
