import * as clipboard from 'clipboardy';
import Database from 'better-sqlite3';
import inquirer from 'inquirer';
import inquirerAutocomplete from 'inquirer-autocomplete-prompt';
import { authenticator } from 'otplib';
import winston from 'winston';

import { decryptTransaction, getDerivate } from '../crypto/decrypt.js';
import { BackupEditTransaction, VaultCredential, AuthentifiantTransactionContent } from '../types.js';
import { askReplaceMasterPassword, getMasterPassword, setMasterPassword } from '../steps/keychainManager.js';
import { notEmpty } from '../utils.js';

interface GetCredential {
    titleFilter: string | null;
    login: string;
    output: string | null;
    db: Database.Database;
}

const decryptPasswordTransactions = async (
    transactions: BackupEditTransaction[],
    masterPassword: string,
    login: string
): Promise<AuthentifiantTransactionContent[]> => {
    const settingsTransaction = transactions.find((item) => item.identifier === 'SETTINGS_userId');
    if (!settingsTransaction) {
        throw new Error('Unable to locate the settings of the vault');
    } else {
        const derivate = await getDerivate(masterPassword, settingsTransaction);

        if (!decryptTransaction(settingsTransaction, derivate)) {
            if (!(await askReplaceMasterPassword())) {
                throw new Error('The master password is incorrect.');
            }
            const masterPassword = await setMasterPassword(login);
            return decryptPasswordTransactions(transactions, masterPassword, login);
        }

        const authentifiantTransactions = transactions.filter((transaction) => transaction.type === 'AUTHENTIFIANT');

        const passwordsDecrypted = authentifiantTransactions
            .map(
                (transaction: BackupEditTransaction) =>
                    decryptTransaction(transaction, derivate) as AuthentifiantTransactionContent | null
            )
            .filter(notEmpty);

        if (authentifiantTransactions.length !== passwordsDecrypted.length) {
            winston.debug(
                'Encountered decryption errors:',
                authentifiantTransactions.length - passwordsDecrypted.length
            );
        }
        return passwordsDecrypted;
    }
};

export const selectCredentials = async (params: GetCredential): Promise<VaultCredential[]> => {
    const { login, titleFilter, db } = params;

    const masterPassword = await getMasterPassword(login);
    if (!masterPassword) {
        throw new Error("Couldn't retrieve master password in OS keychain.");
    }

    winston.debug('Retrieving:', titleFilter || '');
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE action = 'BACKUP_EDIT'`)
        .all() as BackupEditTransaction[];

    const credentialsDecrypted = await decryptPasswordTransactions(transactions, masterPassword, login);

    // transform entries [{key: xx, $t: ww}] into an easier-to-use object
    const beautifiedCredentials = credentialsDecrypted.map(
        (item) =>
            Object.fromEntries(
                item.root.KWAuthentifiant.KWDataItem.map((entry) => [
                    entry.key[0].toLowerCase() + entry.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                    entry.$t,
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

    inquirer.registerPrompt('autocomplete', inquirerAutocomplete);

    const websiteQueried = (
        await inquirer.prompt<{ website: string }>([
            {
                type: 'autocomplete',
                name: 'website',
                message,
                source: (_answersSoFar: string[], input: string) =>
                    matchedCredentials
                        .sort()
                        .map(
                            (item, index) =>
                                item.title +
                                ' - ' +
                                (item.email || item.login || item.secondaryLogin || '') +
                                ' - ' +
                                index.toString(10)
                        )
                        .filter((title) => title && title.toLowerCase().includes(input?.toLowerCase() || '')),
            },
        ])
    ).website;
    const websiteQueriedSplit = websiteQueried.split(' - ');

    const selectedIndex = parseInt(websiteQueriedSplit[websiteQueriedSplit.length - 1], 10);
    if (selectedIndex < 0 || selectedIndex >= matchedCredentials.length) {
        throw new Error('Unable to retrieve the corresponding password entry');
    }

    return matchedCredentials[selectedIndex];
};

export const getPassword = async (params: GetCredential): Promise<void> => {
    const selectedCredential = await selectCredential(params);

    switch (params.output || 'clipboard') {
        case 'clipboard':
            clipboard.default.writeSync(selectedCredential.password);
            console.log(`🔓 Password for "${selectedCredential.title}" copied to clipboard!`);

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
            throw new Error("Unable to recognize the output mode.");
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
            throw new Error("Unable to recognize the output mode.");
    }
};
