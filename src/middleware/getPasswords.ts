import Database from 'better-sqlite3';
import { Clipboard } from '@napi-rs/clipboard';
import { authenticator } from 'otplib';
import winston from 'winston';
import { AuthentifiantTransactionContent, BackupEditTransaction, Secrets, VaultCredential } from '../types';
import { decryptTransaction } from '../crypto';
import { askCredentialChoice } from '../utils';
import { filterMatches } from './utils';

interface GetCredential {
    filters: string[] | null;
    secrets: Secrets;
    output: string | null;
    one: Boolean;
    db: Database.Database;
}

const decryptPasswordTransactions = async (
    db: Database.Database,
    transactions: BackupEditTransaction[],
    secrets: Secrets
): Promise<AuthentifiantTransactionContent[]> => {
    const authentifiantTransactions = transactions.filter((transaction) => transaction.type === 'AUTHENTIFIANT');

    const passwordsDecrypted = await Promise.all(
        authentifiantTransactions.map(
            (transaction) => decryptTransaction(transaction, secrets) as Promise<AuthentifiantTransactionContent>
        )
    );

    return passwordsDecrypted;
};

export const selectCredentials = async (params: GetCredential): Promise<VaultCredential[]> => {
    const { secrets, filters, db, one } = params;

    winston.debug(`Retrieving: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND action = 'BACKUP_EDIT'`)
        .bind(secrets.login)
        .all() as BackupEditTransaction[];

    const credentialsDecrypted = await decryptPasswordTransactions(db, transactions, secrets);

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

    let matchedCredentials = await filterMatches<VaultCredential>(beautifiedCredentials, filters);

    if (one && matchedCredentials?.length !== 1) {
        throw new Error('Matched ' + (matchedCredentials?.length || 0) + ' credentials, required exactly one match.');
    }

    return matchedCredentials;
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

export const getPassword = async (params: GetCredential): Promise<void> => {
    const clipboard = new Clipboard();

    if (params.output == 'json') {
        const selectedCredentials = await selectCredentials(params);

        let outputCredentials;
        if (params.one && selectedCredentials) {
            outputCredentials = selectedCredentials[0];
        } else {
            outputCredentials = selectedCredentials;
        }

        console.log(JSON.stringify(outputCredentials, null, 4));
        return;
    }

    const selectedCredential = await selectCredential(params, false);

    switch (params.output || 'clipboard') {
        case 'clipboard':
            clipboard.setText(selectedCredential.password);
            console.log(
                `🔓 Password for "${selectedCredential.title || selectedCredential.url || 'N\\C'}" copied to clipboard!`
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
        default:
            throw new Error('Unable to recognize the output mode.');
    }
};

export const getOtp = async (params: GetCredential): Promise<void> => {
    const clipboard = new Clipboard();
    const selectedCredential = await selectCredential(params, true);

    // otpSecret can't be null because onlyOtpCredentials is set to true above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const token = authenticator.generate(selectedCredential.otpSecret!);
    const timeRemaining = authenticator.timeRemaining();
    switch (params.output || 'clipboard') {
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
};
