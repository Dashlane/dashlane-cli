import Database from 'better-sqlite3';
import * as clipboard from 'clipboardy';
import inquirer from 'inquirer';
import { authenticator } from 'otplib';
import winston from 'winston';
import {
    AuthentifiantTransactionContent,
    BackupEditTransaction,
    PrintableVaultCredential,
    Secrets,
    VaultCredential,
} from '../types';
import { decryptTransaction } from '../crypto';

interface GetCredential {
    titleFilter: string | null;
    secrets: Secrets;
    output: string | null;
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
    const { secrets, titleFilter, db } = params;

    winston.debug(`Retrieving: ${titleFilter || ''}`);
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

    let matchedCredentials = beautifiedCredentials;
    if (titleFilter) {
        const canonicalTitleFilter = titleFilter.toLowerCase();
        matchedCredentials = beautifiedCredentials?.filter(
            (item) =>
                item.url?.toLowerCase().includes(canonicalTitleFilter) ||
                item.title?.toLowerCase().includes(canonicalTitleFilter)
        );
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

    const message = params.titleFilter
        ? 'There are multiple results for your query, pick one:'
        : 'What password would you like to get?';

    const { printableCredential } = await inquirer.prompt<{ printableCredential: PrintableVaultCredential }>([
        {
            type: 'search-list',
            name: 'printableCredential',
            message,
            choices: matchedCredentials.map((item) => {
                const printableItem = new PrintableVaultCredential(item);
                return { name: printableItem.toString(), value: printableItem };
            }),
        },
    ]);

    return printableCredential.vaultCredential;
};

export const getPassword = async (params: GetCredential): Promise<void> => {
    const selectedCredential = await selectCredential(params);

    switch (params.output || 'clipboard') {
        case 'clipboard':
            clipboard.writeSync(selectedCredential.password);
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
    const selectedCredential = await selectCredential(params, true);

    // otpSecret can't be null because onlyOtpCredentials is set to true above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const token = authenticator.generate(selectedCredential.otpSecret!);
    const timeRemaining = authenticator.timeRemaining();
    switch (params.output || 'clipboard') {
        case 'clipboard':
            console.log(`🔢 OTP code: ${token} \u001B[3m(expires in ${timeRemaining} seconds)\u001B[0m`);
            break;
        case 'otp':
            console.log(token);
            break;
        default:
            throw new Error('Unable to recognize the output mode.');
    }
};
