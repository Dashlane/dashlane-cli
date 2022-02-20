import * as clipboard from 'clipboardy';
import * as sqlite3 from 'sqlite3';
import * as argon2 from 'argon2';
import * as zlib from 'zlib';
import * as xml2json from 'xml2json';
import inquirer from 'inquirer';
import { promisify } from 'util';
import { getCipheringMethod, argonDecrypt } from '../crypto/decrypt.js';
import { BackupEditTransaction } from '../types';
import inquirerAutocomplete from 'inquirer-autocomplete-prompt';

interface GetPassword {
    commandsParameters: string[];
    db: sqlite3.Database;
}

export const getPassword = async (params: GetPassword): Promise<void> => {
    const { commandsParameters, db } = params;

    if (!process.env.MP) {
        throw new Error('Please set the MP env variable with your master password');
    }

    console.log('Retrieving:', commandsParameters[0]);
    const transactions = await promisify(db.all).bind(db)(
        'SELECT * FROM transactions WHERE action = "BACKUP_EDIT"'
    ) as BackupEditTransaction[];

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
        .map((password: any) => {
            let cypheredContent;
            try {
                cypheredContent = getCipheringMethod(password['content']).cypheredContent;
            } catch (error: any) {
                errorNum += 1;
                console.error(password.type, error.message);
                return null;
            }
            const { encryptedData: encD, hmac: sign, iv } = cypheredContent;

            try {
                const content = argonDecrypt(encD, deriv, iv, sign);
                const xmlContent = zlib.inflateRawSync(content.slice(6)).toString();
                return JSON.parse(xml2json.toJson(xmlContent));
            } catch (error: any) {
                errorNum += 1;
                console.error(password.identifier, error.message);
                return null;
            }
        })
        .filter((n: any) => n);

    console.log('Encountered decryption errors:', errorNum);

    let websiteQueried = commandsParameters[0];
    if (!websiteQueried) {
        inquirer.registerPrompt('autocomplete', inquirerAutocomplete as any);
        websiteQueried = (await inquirer
            .prompt([
                {
                    type: 'autocomplete',
                    name: 'website',
                    message: 'What password would you like to get?',
                    source: (_answersSoFar: any, input: string) =>
                        passwordsDecrypted.map((item: any) =>
                            item.root.KWAuthentifiant?.KWDataItem.find((auth: any) =>
                                auth.key === 'Title' && auth.$t?.includes(input || '')
                            )?.$t
                        )
                            .filter(name => name)
                            .sort()
                }
            ])).website;
    }

    const wantedPwd: any = passwordsDecrypted.filter((item: any) =>
        item.root.KWAuthentifiant?.KWDataItem.find(
            (auth: any) =>
                (auth.key === 'Url' || auth.key === 'Title') && auth.$t?.includes(websiteQueried)
        )
    );

    if (wantedPwd.length === 0) {
        throw new Error('No password found');
    }

    clipboard.default.writeSync(
        wantedPwd[0].root.KWAuthentifiant.KWDataItem.find((auth: any) => auth.key === 'Password').$t
    );

    console.log('Password copied to clipboard!');
};
