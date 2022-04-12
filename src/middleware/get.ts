import * as clipboard from 'clipboardy';
import * as sqlite3 from 'sqlite3';
import * as argon2 from 'argon2';
import * as zlib from 'zlib';
import * as xml2json from 'xml2json';
import inquirer from 'inquirer';
import inquirerAutocomplete from 'inquirer-autocomplete-prompt';
import { promisify } from 'util';
import { authenticator } from 'otplib';

import { getCipheringMethod, argonDecrypt } from '../crypto/decrypt.js';
import { AuthentifiantTransactionContent, BackupEditTransaction, VaultCredential } from '../types';
import { askReplaceMasterPassword, getMasterPassword, setMasterPassword } from '../steps/keychainManager.js';

interface GetPassword {
    titleFilter: string | null;
    login: string;
    db: sqlite3.Database;
}

const notEmpty = <TValue>(value: TValue | null | undefined): value is TValue => {
    return value !== null && value !== undefined;
};

const getDerivate = async (masterPassword: string, settingsTransaction: BackupEditTransaction): Promise<Buffer> => {
    const { keyDerivation, cypheredContent } = getCipheringMethod(settingsTransaction.content);
    const { salt } = cypheredContent;

    return await argon2.hash(masterPassword, {
        type: argon2.argon2d,
        saltLength: keyDerivation.saltLength,
        timeCost: keyDerivation.tCost,
        memoryCost: keyDerivation.mCost,
        parallelism: keyDerivation.parallelism,
        salt: salt,
        version: 19,
        hashLength: 32,
        raw: true
    });
};

const decryptTransaction = (transaction: BackupEditTransaction, derivate: Buffer): AuthentifiantTransactionContent | null => {
    let cypheredContent;

    try {
        cypheredContent = getCipheringMethod(transaction.content).cypheredContent;
    } catch (error: any) {
        console.error(transaction.type, error.message);
        return null;
    }
    const { encryptedData: encD, hmac: sign, iv } = cypheredContent;

    try {
        const content = argonDecrypt(encD, derivate, iv, sign);
        const xmlContent = zlib.inflateRawSync(content.slice(6)).toString();
        return JSON.parse(xml2json.toJson(xmlContent))as AuthentifiantTransactionContent;
    } catch (error: any) {
        console.error(transaction.identifier, error.message);
        return null;
    }
};

const decryptTransactions = async (
    transactions: BackupEditTransaction[],
    masterPassword: string,
    login: string
): Promise<AuthentifiantTransactionContent[] | null> => {
    const settingsTransaction = transactions.filter((item: any) => item.identifier === 'SETTINGS_userId')[0];
    const derivate = await getDerivate(masterPassword, settingsTransaction);

    if (!decryptTransaction(settingsTransaction, derivate)) {
        if (!(await askReplaceMasterPassword())) {
            return null;
        }
        const masterPassword = await setMasterPassword(login);
        return await decryptTransactions(transactions, masterPassword, login);
    }

    const passwordsDecrypted = transactions.filter((transaction) => transaction.type === 'AUTHENTIFIANT')
        .map((transaction: BackupEditTransaction) => decryptTransaction(transaction, derivate))
        .filter(notEmpty);

    console.log('Encountered decryption errors:', transactions.length - passwordsDecrypted.length);
    return passwordsDecrypted;
};

export const getPassword = async (params: GetPassword): Promise<void> => {
    const { login, titleFilter, db } = params;

    const masterPassword = await getMasterPassword(login);
    if (!masterPassword) {
        throw new Error("Couldn't retrieve master pasword in OS keychain.");
    }

    console.log('Retrieving:', titleFilter || '');
    const transactions = (await promisify(db.all).bind(db)(
        'SELECT * FROM transactions WHERE action = \'BACKUP_EDIT\''
    )) as BackupEditTransaction[];

    const passwordsDecrypted = await decryptTransactions(transactions, masterPassword, login);
    if (!passwordsDecrypted) {
        return;
    }

    let websiteQueried = titleFilter?.toLowerCase();
    if (!websiteQueried) {
        inquirer.registerPrompt('autocomplete', inquirerAutocomplete);
        websiteQueried = (
            await inquirer.prompt([
                {
                    type: 'autocomplete',
                    name: 'website',
                    message: 'What password would you like to get?',
                    source: (_answersSoFar: string[], input: string) =>
                        passwordsDecrypted
                            .map(
                                (item) =>
                                    item.root.KWAuthentifiant.KWDataItem.find(
                                        (auth) =>
                                            auth.key === 'Title' && auth.$t?.toLowerCase().includes(input || '')
                                    )?.$t
                            )
                            .filter(notEmpty)
                            .sort()
                }
            ])
        ).website;
    } else {
        const queryResults = passwordsDecrypted
            .map(
                (item) =>
                    item.root.KWAuthentifiant.KWDataItem.find(
                        (auth) => auth.key === 'Title' && auth.$t?.toLowerCase().includes(websiteQueried || '')
                    )?.$t
            )
            .filter(notEmpty)
            .sort();

        if (queryResults.length === 0) {
            throw new Error('No password found');
        } else {
            inquirer.registerPrompt('autocomplete', inquirerAutocomplete);
            websiteQueried = (
                await inquirer.prompt([
                    {
                        type: 'autocomplete',
                        name: 'website',
                        default: websiteQueried,
                        pageSize: 10,
                        message: 'There are multiple results for your query, pick one:',
                        source: (_answersSoFar: string[], input: string) =>
                            queryResults.filter((name) => name.toLowerCase().includes(input || '')).sort()
                    }
                ])
            ).website;
        }
    }

    const wantedPasswordEntries = passwordsDecrypted.filter((item) =>
        item.root.KWAuthentifiant.KWDataItem.find(
            (auth) => (auth.key === 'Url' || auth.key === 'Title') && auth.$t?.includes(websiteQueried || '')
        )
    )[0].root.KWAuthentifiant.KWDataItem;

    // transform entries [{key: xx, $t: ww}] into an easier-to-use object
    const wantedPassword = Object.fromEntries(
        wantedPasswordEntries.map((entry) => [
            entry.key[0].toLowerCase() + entry.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
            entry.$t,
        ])
    ) as unknown as VaultCredential;

    clipboard.default.writeSync(wantedPassword.password);

    console.log(`🔓 Password for "${wantedPassword.title}" copied to clipboard!`);

    if (wantedPassword.otpSecret) {
        const token = authenticator.generate(wantedPassword.otpSecret);
        const timeRemaining = authenticator.timeRemaining();
        console.log(`🔢 OTP code: ${token} \u001B[3m(expires in ${timeRemaining} seconds)\u001B[0m`);
    }
};
