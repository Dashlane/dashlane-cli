import Database from 'better-sqlite3';
import { Clipboard } from '@napi-rs/clipboard';
import { authenticator } from 'otplib';
import winston from 'winston';
import { AuthentifiantTransactionContent, BackupEditTransaction, Secrets, VaultCredential } from '../types';
import { decryptTransactions } from '../modules/crypto';
import { askCredentialChoice, filterMatches } from '../utils';
import { connectAndPrepare } from '../modules/database';

export const runPassword = async (filters: string[] | null, options: { output: 'json' | 'clipboard' | 'password' }) => {
    const { output } = options;
    const { db, secrets } = await connectAndPrepare({});

    const clipboard = new Clipboard();
    const selectedCredential = await selectCredential({ filters, secrets, db });

    switch (output) {
        case 'clipboard':
            clipboard.setText(selectedCredential.password);
            console.log(
                `🔓 Password for "${selectedCredential.title || selectedCredential.url || 'N/C'}" copied to clipboard!`
            );

            if (selectedCredential.otpSecret) {
                const token = authenticator.generate(selectedCredential.otpSecret);
                const timeRemaining = authenticator.timeRemaining();
                console.log(`🔢 OTP code: ${token} \u001B[3m(expires in ${timeRemaining} seconds)\u001B[0m`);
            }
            break;
        case 'password':
            console.log(selectedCredential.password);
            break;
        case 'json':
            console.log(JSON.stringify(selectedCredential, null, 4));
            break;
        default:
            throw new Error('Unable to recognize the output mode.');
    }

    db.close();
};

export const runOtp = async (filters: string[] | null, options: { print: boolean }) => {
    const { db, secrets } = await connectAndPrepare({});

    const clipboard = new Clipboard();
    const selectedCredential = await selectCredential({ db, filters, secrets }, true);

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
    secrets: Secrets;
    db: Database.Database;
}

export const selectCredentials = async (params: GetCredential): Promise<VaultCredential[]> => {
    const { secrets, filters, db } = params;

    winston.debug(`Retrieving: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND type = 'AUTHENTIFIANT' AND action = 'BACKUP_EDIT'`)
        .bind(secrets.login)
        .all() as BackupEditTransaction[];

    const credentialsDecrypted = await decryptTransactions<AuthentifiantTransactionContent>(transactions, secrets);

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

export const selectCredential = async (params: GetCredential, onlyOtpCredentials = false): Promise<VaultCredential> => {
    let matchedCredentials = await selectCredentials(params);

    if (onlyOtpCredentials) {
        matchedCredentials = matchedCredentials.filter((credential) => credential.otpSecret);
    }

    if (!matchedCredentials || matchedCredentials.length === 0) {
        throw new Error('No credential with this name found');
    } else if (matchedCredentials.length === 1) {
        return matchedCredentials[0];
    }

    return askCredentialChoice({ matchedCredentials, hasFilters: Boolean(params.filters?.length) });
};
