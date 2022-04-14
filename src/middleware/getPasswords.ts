import * as clipboard from 'clipboardy';
import * as argon2 from 'argon2';
import * as zlib from 'zlib';
import * as xml2json from 'xml2json';
import Database from 'better-sqlite3';
import inquirer from 'inquirer';
import inquirerAutocomplete from 'inquirer-autocomplete-prompt';
import { authenticator } from 'otplib';
import winston from 'winston';

import { getCipheringMethod, argonDecrypt } from '../crypto/decrypt.js';
import { AuthentifiantTransactionContent, BackupEditTransaction, VaultCredential } from '../types';
import { askReplaceMasterPassword, getMasterPassword, setMasterPassword } from '../steps/keychainManager.js';

interface GetPassword {
    titleFilter: string | null;
    login: string;
    db: Database.Database;
}

const notEmpty = <TValue>(value: TValue | null | undefined): value is TValue => {
    return value !== null && value !== undefined;
};

const getDerivate = async (masterPassword: string, settingsTransaction: BackupEditTransaction): Promise<Buffer> => {
    const { keyDerivation, cypheredContent } = getCipheringMethod(settingsTransaction.content);

    const { salt } = cypheredContent;

    return argon2.hash(masterPassword, {
        type: argon2.argon2d,
        saltLength: keyDerivation.saltLength,
        timeCost: keyDerivation.tCost,
        memoryCost: keyDerivation.mCost,
        parallelism: keyDerivation.parallelism,
        salt,
        version: 19,
        hashLength: 32,
        raw: true,
    });
};

const decryptTransaction = (
    transaction: BackupEditTransaction,
    derivate: Buffer
): AuthentifiantTransactionContent | null => {
    let cypheredContent;

    try {
        cypheredContent = getCipheringMethod(transaction.content).cypheredContent;
    } catch (error) {
        if (error instanceof Error) {
            console.error(transaction.type, error.message);
        } else {
            console.error(transaction.type, error);
        }
        return null;
    }
    const { encryptedData: encD, hmac: sign, iv } = cypheredContent;

    try {
        const content = argonDecrypt(encD, derivate, iv, sign);
        const xmlContent = zlib.inflateRawSync(content.slice(6)).toString();
        return JSON.parse(xml2json.toJson(xmlContent)) as AuthentifiantTransactionContent;
    } catch (error: any) {
        if (error instanceof Error) {
            console.error(transaction.type, error.message);
        } else {
            console.error(transaction.type, error);
        }
        return null;
    }
};

const decryptTransactions = async (
    transactions: BackupEditTransaction[],
    masterPassword: string,
    login: string
): Promise<AuthentifiantTransactionContent[] | null> => {
    const settingsTransaction = transactions.find((item) => item.identifier === 'SETTINGS_userId');
    if (!settingsTransaction) {
        throw new Error('Unable to locate the settings of the vault');
    } else {
        const derivate = await getDerivate(masterPassword, settingsTransaction);

        if (!decryptTransaction(settingsTransaction, derivate)) {
            if (!(await askReplaceMasterPassword())) {
                return null;
            }
            const masterPassword = await setMasterPassword(login);
            return decryptTransactions(transactions, masterPassword, login);
        }

        const authentifiantTransactions = transactions.filter((transaction) => transaction.type === 'AUTHENTIFIANT');

        const passwordsDecrypted = authentifiantTransactions
            .map((transaction: BackupEditTransaction) => decryptTransaction(transaction, derivate))
            .filter(notEmpty);

        if (authentifiantTransactions.length !== passwordsDecrypted.length) {
            console.error('Encountered decryption errors:', authentifiantTransactions.length - passwordsDecrypted.length);
        }
        return passwordsDecrypted;
    }
};

export const getPassword = async (params: GetPassword): Promise<void> => {
    const { login, titleFilter, db } = params;

    const masterPassword = await getMasterPassword(login);
    if (!masterPassword) {
        throw new Error("Couldn't retrieve master pasword in OS keychain.");
    }

    winston.debug('Retrieving:', titleFilter || '');
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE action = 'BACKUP_EDIT'`)
        .all() as BackupEditTransaction[];

    const passwordsDecrypted = await decryptTransactions(transactions, masterPassword, login);

    // transform entries [{key: xx, $t: ww}] into an easier-to-use object
    const beautifiedPasswords = passwordsDecrypted?.map((item) =>
        Object.fromEntries(
            item.root.KWAuthentifiant.KWDataItem.map((entry) =>
            [
                entry.key[0].toLowerCase() + entry.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                entry.$t,
            ])
        ) as unknown as VaultCredential
    );

    let matchedPasswords = beautifiedPasswords;
    if (titleFilter) {
        const canonicalTitleFilter = titleFilter.toLowerCase();
        matchedPasswords = beautifiedPasswords?.filter((item) => item.url?.includes(canonicalTitleFilter) || item.title?.includes(canonicalTitleFilter));
    }
    matchedPasswords = matchedPasswords?.sort();

    let selectedPassword: VaultCredential | null = null;

    if (!matchedPasswords || matchedPasswords.length === 0) {
        throw new Error('No password found');
    } else if (matchedPasswords.length === 1) {
        selectedPassword = matchedPasswords[0];
    } else {
        const message = titleFilter ? 'There are multiple results for your query, pick one:' : 'What password would you like to get?';

        inquirer.registerPrompt('autocomplete', inquirerAutocomplete);
        const websiteQueried = (
            await inquirer.prompt<{ website: string }>([
                {
                    type: 'autocomplete',
                    name: 'website',
                    message,
                    source: (_answersSoFar: string[], input: string) =>
                        matchedPasswords
                            ?.map((item, index) => item.title + ' - ' + (item.email || item.login || item.secondaryLogin || '') + ' - ' + index.toString(10))
                            .filter((title) => title && title.toLowerCase().includes(input?.toLowerCase() || ''))
                },
            ])
        ).website;
        const websiteQueriedSplit = websiteQueried.split(' - ');

        const selectedIndex = parseInt(websiteQueriedSplit[websiteQueriedSplit.length - 1], 10);
        if (selectedIndex < 0 || selectedIndex >= matchedPasswords.length) {
            throw new Error('Unable to retrieve the corresponding password entry')
        }

        selectedPassword = matchedPasswords[selectedIndex];
    }

    clipboard.default.writeSync(selectedPassword.password);

    console.log(`🔓 Password for "${selectedPassword.title}" copied to clipboard!`);

    if (selectedPassword.otpSecret) {
        const token = authenticator.generate(selectedPassword.otpSecret);
        const timeRemaining = authenticator.timeRemaining();
        console.log(`🔢 OTP code: ${token} \u001B[3m(expires in ${timeRemaining} seconds)\u001B[0m`);
    }
};
