import crypto from 'crypto';
import inquirer from 'inquirer';
import keytar from 'keytar';
import { Database } from 'better-sqlite3';

import { DeviceKeysWithLogin, Secrets } from '../types.js';
import { registerDevice } from '../middleware/registerDevice.js';
import { crypt } from '../crypto/crypt.js';
import { decrypt, getDerivateWithCipheringMethod } from '../crypto/decrypt.js';
import { CipheringMethod } from '../crypto/types';
import { sha512 } from '../crypto/hash.js';

const SERVICE = 'dashlane-cli';

export const setLocalKey = async (login: string, localKey?: Buffer): Promise<Buffer> => {
    if (!localKey) {
        localKey = crypto.randomBytes(32);
        if (!localKey) {
            throw new Error('Unable to generate AES local key');
        }
    }

    await keytar.setPassword(SERVICE, login, localKey.toString('base64'));
    return localKey;
};

export const getSecrets = async (
    db: Database,
    deviceKeys: DeviceKeysWithLogin | null,
    masterPassword?: string
): Promise<Secrets> => {
    let login: string;
    if (deviceKeys) {
        login = deviceKeys.login;
    } else {
        login = (
            await inquirer.prompt<{ login: string }>([
                {
                    type: 'input',
                    name: 'login',
                    message: 'Please enter your email address:',
                },
            ])
        ).login;
    }

    const fakeTransaction: CipheringMethod = {
        keyDerivation: {
            algo: 'argon2d',
            saltLength: 16,
            tCost: 3,
            mCost: 32768,
            parallelism: 2,
        },
        cipherConfig: {
            encryption: 'aes256', // Unused parameter
            cipherMode: 'cbchmac', // Unused parameter
            ivLength: 0, // Unused parameter
        },
        cipheredContent: {
            salt: sha512(login).slice(0, 16),
            iv: Buffer.from(''), // Unused parameter
            hash: Buffer.from(''), // Unused parameter
            encryptedData: Buffer.from(''), // Unused parameter
        },
    };

    const localKeyEncoded = await keytar.getPassword(SERVICE, login);

    if (!deviceKeys) {
        if (!masterPassword) {
            masterPassword = await promptMasterPassword();
        }

        const derivate = await getDerivateWithCipheringMethod(masterPassword, fakeTransaction);

        const { deviceAccessKey, deviceSecretKey } = await registerDevice({ login });

        let localKey: Buffer;
        if (localKeyEncoded) {
            localKey = Buffer.from(localKeyEncoded, 'base64');
        } else {
            localKey = await setLocalKey(login);
        }

        const deviceSecretKeyEncrypted = crypt(localKey, Buffer.from(deviceSecretKey, 'hex'));
        const masterPasswordEncrypted = crypt(localKey, Buffer.from(masterPassword, 'utf-8'));
        const localKeyEncrypted = crypt(derivate, localKey);

        db.prepare('REPLACE INTO device VALUES (?, ?, ?, ?, ?)')
            .bind(login, deviceAccessKey, deviceSecretKeyEncrypted, masterPasswordEncrypted, localKeyEncrypted)
            .run();

        return {
            login,
            masterPassword,
            accessKey: deviceAccessKey,
            secretKey: deviceSecretKey,
        };
    } else if (!localKeyEncoded) {
        if (!masterPassword) {
            masterPassword = await promptMasterPassword();
        }

        const derivate = await getDerivateWithCipheringMethod(masterPassword, fakeTransaction);

        const localKey = decrypt(deviceKeys.localKeyEncrypted, derivate);
        const secretKey = decrypt(deviceKeys.secretKeyEncrypted, localKey).toString('hex');

        await setLocalKey(login, localKey);

        return {
            login,
            masterPassword,
            accessKey: deviceKeys.accessKey,
            secretKey,
        };
    } else {
        const localKey = Buffer.from(localKeyEncoded, 'base64');
        if (!masterPassword) {
            masterPassword = decrypt(deviceKeys.masterPasswordEncrypted, localKey).toString('utf-8');
        }

        const secretKey = decrypt(deviceKeys.secretKeyEncrypted, localKey).toString('hex');

        return {
            login,
            masterPassword,
            accessKey: deviceKeys.accessKey,
            secretKey,
        };
    }
};

export const promptMasterPassword = async (): Promise<string> => {
    return (
        await inquirer.prompt<{ masterPassword: string }>([
            {
                type: 'password',
                name: 'masterPassword',
                message: 'Please enter your master password:',
            },
        ])
    ).masterPassword;
};

export const askReplaceMasterPassword = async () => {
    const promptedReplaceMasterPassword: string = (
        await inquirer.prompt<{ replaceMasterPassword: string }>([
            {
                type: 'list',
                name: 'replaceMasterPassword',
                message: "Couldn't decrypt any password, would you like to retry?",
                choices: ['Yes', 'No'],
            },
        ])
    ).replaceMasterPassword;

    return promptedReplaceMasterPassword === 'Yes';
};
