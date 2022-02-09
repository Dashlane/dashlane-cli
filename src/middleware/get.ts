import * as clipboard from 'clipboardy';
import * as sqlite3 from 'sqlite3';
import * as argon2 from 'argon2';
import * as zlib from 'zlib';
import * as xml2json from 'xml2json';
import { getCipheringMethod, argonDecrypt } from '../crypto/decrypt.js';
import * as inquirer from 'inquirer';

interface GetPassword {
    command: string;
    commandsParameters: string[];
    db: sqlite3.Database;
}

export const getPassword = (params: GetPassword, cb: CallbackErrorOnly) => {
    const { command, commandsParameters, db } = params;

    if (command === 'get') {
        console.log('Retrieving:', commandsParameters[0]);

        return db.all('SELECT * FROM transactions', async (error, resluts) => {
            if (error) {
                return cb(error);
            }

            const transactions = resluts.filter((item: any) => item.action !== 'BACKUP_REMOVE');

            const settingsTransac = transactions.filter((item: any) => item.identifier === 'SETTINGS_userId');
            const passwords = transactions.filter((item: any) => true || item.type === 'AUTHENTIFIANT');

            const cipheringMethod = getCipheringMethod(settingsTransac[0]['content']);

            if (cipheringMethod instanceof Error) {
                return cb(cipheringMethod);
            }

            const { keyDerivation, cypheredContent } = cipheringMethod;
            const { encryptedData, hmac, iv, salt } = cypheredContent;

            let deriv: Buffer;
            try {
                deriv = await argon2.hash(process.env.MP, {
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
            } catch (error) {
                return cb(error);
            }

            const content = argonDecrypt(encryptedData, deriv, iv, hmac);

            if (content instanceof Error) {
                return cb(content);
            }

            let errorNum = 0;

            const passwordsDecrypted = passwords
                .map((password: any) => {
                    const c = getCipheringMethod(password['content']);

                    if (c instanceof Error) {
                        errorNum += 1;
                        console.error(password.type, c.message);
                        return null;
                    }
                    const { encryptedData: encD, hmac: sign, iv } = c.cypheredContent;

                    const content = argonDecrypt(encD, deriv, iv, sign);

                    if (content instanceof Error) {
                        errorNum += 1;
                        console.error(password.identifier, content.message);
                        return null;
                    }

                    const xmlContent = zlib.inflateRawSync(content.slice(6)).toString();

                    return JSON.parse(xml2json.toJson(xmlContent));
                })
                .filter((n: any) => n);

            console.log('Encountered decryption errors:', errorNum);

            let secretToFind = commandsParameters[0];
            if (!secretToFind) {
                inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
                inquirer
                    .prompt([
                        {
                            type: 'autocomplete',
                            name: 'from',
                            message: 'Select a state to travel from',
                            source: (_answersSoFar: any, input: string) => {
                                return passwordsDecrypted.map((item: any) =>
                                    item.root.KWAuthentifiant?.KWDataItem.find(
                                        (auth: any) => auth.key === 'Title' && auth.$t?.includes(input)
                                    )
                                );
                            }
                        }
                    ])
                    .then((answers) => {
                        secretToFind = answers;
                    });
            }

            const wantedPwd: any = passwordsDecrypted.filter((item: any) =>
                item.root.KWAuthentifiant?.KWDataItem.find(
                    (auth: any) =>
                        (auth.key === 'Url' || auth.key === 'Title') && auth.$t?.includes(commandsParameters[0])
                )
            );

            if (wantedPwd.length === 0) {
                return cb(new Error('No password found'));
            }

            clipboard.default.writeSync(
                wantedPwd[0].root.KWAuthentifiant.KWDataItem.find((auth: any) => auth.key === 'Password').$t
            );

            console.log('Password copied to clipboard!');
            return cb();
        });
    }
    return cb();
};
