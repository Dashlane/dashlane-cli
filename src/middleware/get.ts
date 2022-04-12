import * as clipboard from 'clipboardy';
import * as sqlite3 from 'sqlite3';
import * as argon2 from 'argon2';
import * as zlib from 'zlib';
import * as xml2json from 'xml2json';
import inquirer from 'inquirer';
import inquirerAutocomplete from 'inquirer-autocomplete-prompt';
import { promisify } from 'util';
import { getCipheringMethod, argonDecrypt } from '../crypto/decrypt.js';
import { AuthentifiantTransactionContent, BackupEditTransaction } from '../types';

interface GetPassword {
    titleFilter: string | null;
    db: sqlite3.Database;
}

const notEmpty = <TValue>(value: TValue | null | undefined): value is TValue => {
    return value !== null && value !== undefined;
};

export const getPassword = async (params: GetPassword): Promise<void> => {
    const { titleFilter, db } = params;

    if (!process.env.MP) {
        throw new Error('Please set the MP env variable with your master password');
    }

    console.log('Retrieving:', titleFilter || '');
    const transactions = (await promisify(db.all).bind(db)(
        'SELECT * FROM transactions WHERE action = \'BACKUP_EDIT\''
    )) as BackupEditTransaction[];

    const settingsTransac = transactions.filter((item: any) => item.identifier === 'SETTINGS_userId');

    const { keyDerivation, cypheredContent } = getCipheringMethod(settingsTransac[0].content);
    const { salt } = cypheredContent;

    const deriv = await argon2.hash(process.env.MP, {
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
    let errorNum = 0;

    const passwordsDecrypted = transactions
        .filter((transaction) => transaction.type === 'AUTHENTIFIANT')
        .map((password) => {
            let cypheredContent;
            try {
                cypheredContent = getCipheringMethod(password.content).cypheredContent;
            } catch (error: any) {
                errorNum += 1;
                console.error(password.type, error.message);
                return null;
            }
            const { encryptedData: encD, hmac: sign, iv } = cypheredContent;

            try {
                const content = argonDecrypt(encD, deriv, iv, sign);
                const xmlContent = zlib.inflateRawSync(content.slice(6)).toString();
                return JSON.parse(xml2json.toJson(xmlContent)) as AuthentifiantTransactionContent;
            } catch (error: any) {
                errorNum += 1;
                console.error(password.identifier, error.message);
                return null;
            }
        })
        .filter(notEmpty);

    if (errorNum > 0) {
        console.log('Encountered decryption errors:', errorNum);
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

    const wantedPwd = passwordsDecrypted.filter((item) =>
        item.root.KWAuthentifiant.KWDataItem.find(
            (auth) => (auth.key === 'Url' || auth.key === 'Title') && auth.$t.includes(websiteQueried || '')
        )
    )[0].root.KWAuthentifiant.KWDataItem;

    clipboard.default.writeSync(wantedPwd.find((auth) => auth.key === 'Password')!.$t);

    console.log(`Password for "${wantedPwd.find((auth) => auth.key === 'Title')!.$t}" copied to clipboard!`);
};
