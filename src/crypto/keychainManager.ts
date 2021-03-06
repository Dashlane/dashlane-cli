import { Database } from 'better-sqlite3';
import keytar from 'keytar';
import winston from 'winston';
import crypto from 'crypto';
import { decrypt, getDerivateUsingParametersFromEncryptedData } from './decrypt';
import { encryptAES } from './encrypt';
import { sha512 } from './hash';
import { EncryptedData } from './types';
import { CLI_VERSION, cliVersionToString } from '../cliVersion';
import { registerDevice } from '../middleware/registerDevice';
import { DeviceConfiguration, DeviceKeys, Secrets } from '../types';
import { askEmailAddress, askMasterPassword } from '../utils/dialogs';

const SERVICE = 'dashlane-cli';

export const setLocalKey = async (
    login: string,
    shouldNotSaveMasterPassword: boolean,
    localKey?: Buffer
): Promise<Buffer> => {
    if (!localKey) {
        localKey = crypto.randomBytes(32);
        if (!localKey) {
            throw new Error('Unable to generate AES local key');
        }
    }

    if (!shouldNotSaveMasterPassword) {
        await keytar.setPassword(SERVICE, login, localKey.toString('base64'));
    }
    return localKey;
};

const getLocalKey = async (login: string): Promise<Buffer | undefined> => {
    const localKeyEncoded = await keytar.getPassword(SERVICE, login);

    if (localKeyEncoded) {
        return Buffer.from(localKeyEncoded, 'base64');
    } else {
        return undefined;
    }
};

export const deleteLocalKey = (login: string): Promise<boolean> => {
    return keytar.deletePassword(SERVICE, login);
};

/**
 * Fake transaction used to set derivation parameters to encrypt the local key in the DB using the master password
 */
const getDerivationParametersForLocalKey = (login: string): EncryptedData => {
    return {
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
        cipherData: {
            salt: sha512(login).slice(0, 16),
            iv: Buffer.from(''), // Unused parameter
            hash: Buffer.from(''), // Unused parameter
            encryptedPayload: Buffer.from(''), // Unused parameter
        },
    };
};

const getSecretsWithoutDB = async (
    db: Database,
    login: string,
    shouldNotSaveMasterPassword: boolean
): Promise<Secrets> => {
    let localKey: Buffer;
    try {
        localKey = await setLocalKey(login, shouldNotSaveMasterPassword);
    } catch (error) {
        let errorMessage = 'unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        winston.debug(`Unable to reach OS keychain: ${errorMessage}`);
        throw new Error(
            'Your OS keychain is probably unreachable. Install it or disable its usage via `dcli configure save-master-password false`'
        );
    }

    const { deviceAccessKey, deviceSecretKey } = await registerDevice({ login });

    const masterPassword = await askMasterPassword();

    const derivate = await getDerivateUsingParametersFromEncryptedData(
        masterPassword,
        getDerivationParametersForLocalKey(login)
    );

    const deviceSecretKeyEncrypted = encryptAES(localKey, Buffer.from(deviceSecretKey, 'hex'));
    const masterPasswordEncrypted = encryptAES(localKey, Buffer.from(masterPassword));
    const localKeyEncrypted = encryptAES(derivate, localKey);

    db.prepare('REPLACE INTO device VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
            login,
            cliVersionToString(CLI_VERSION),
            deviceAccessKey,
            deviceSecretKeyEncrypted,
            shouldNotSaveMasterPassword ? null : masterPasswordEncrypted,
            shouldNotSaveMasterPassword ? 1 : 0,
            localKeyEncrypted,
            1
        )
        .run();

    return {
        login,
        masterPassword,
        shouldNotSaveMasterPassword,
        localKey,
        accessKey: deviceAccessKey,
        secretKey: deviceSecretKey,
    };
};

const getSecretsWithoutKeychain = async (login: string, deviceKeys: DeviceKeys): Promise<Secrets> => {
    const masterPassword = await askMasterPassword();

    const derivate = await getDerivateUsingParametersFromEncryptedData(
        masterPassword,
        getDerivationParametersForLocalKey(login)
    );

    const localKey = await decrypt(deviceKeys.localKeyEncrypted, { type: 'alreadyComputed', symmetricKey: derivate });
    const secretKey = (
        await decrypt(deviceKeys.secretKeyEncrypted, { type: 'alreadyComputed', symmetricKey: localKey })
    ).toString('hex');

    await setLocalKey(login, deviceKeys.shouldNotSaveMasterPassword, localKey);

    return {
        login,
        masterPassword,
        shouldNotSaveMasterPassword: deviceKeys.shouldNotSaveMasterPassword,
        localKey,
        accessKey: deviceKeys.accessKey,
        secretKey,
    };
};

export const replaceMasterPassword = async (db: Database, secrets: Secrets): Promise<Secrets> => {
    const { localKey, login, accessKey, secretKey, shouldNotSaveMasterPassword } = secrets;

    const newMasterPassword = await askMasterPassword();

    const derivate = await getDerivateUsingParametersFromEncryptedData(
        newMasterPassword,
        getDerivationParametersForLocalKey(login)
    );

    const masterPasswordEncrypted = encryptAES(secrets.localKey, Buffer.from(newMasterPassword));
    const localKeyEncrypted = encryptAES(derivate, localKey);

    db.prepare('UPDATE device SET localKeyEncrypted = ?, masterPasswordEncrypted = ? WHERE login = ?')
        .bind(localKeyEncrypted, shouldNotSaveMasterPassword ? null : masterPasswordEncrypted, login)
        .run();

    return {
        login,
        masterPassword: newMasterPassword,
        shouldNotSaveMasterPassword,
        localKey,
        accessKey,
        secretKey,
    };
};

export const getSecrets = async (
    db: Database,
    deviceConfiguration: DeviceConfiguration | null,
    shouldNotSaveMasterPasswordIfNoDeviceKeys = false
): Promise<Secrets> => {
    let login: string;
    if (deviceConfiguration) {
        login = deviceConfiguration.login;
    } else {
        login = await askEmailAddress();
    }

    // If there are no secrets in the DB
    if (!deviceConfiguration) {
        return getSecretsWithoutDB(db, login, shouldNotSaveMasterPasswordIfNoDeviceKeys);
    }

    let localKey: Buffer | undefined = undefined;

    // If the master password is not saved or if the keychain is unreachable, or empty, the local key is retrieved from
    // the master password from the DB
    if (
        deviceConfiguration.shouldNotSaveMasterPassword ||
        !deviceConfiguration.masterPasswordEncrypted ||
        !(localKey = await getLocalKey(login))
    ) {
        return getSecretsWithoutKeychain(login, deviceConfiguration);
    }

    // Otherwise, the local key can be used to decrypt the device secret key and the master password in the DB
    const masterPassword = (
        await decrypt(deviceConfiguration.masterPasswordEncrypted, { type: 'alreadyComputed', symmetricKey: localKey })
    ).toString();
    const secretKey = (
        await decrypt(deviceConfiguration.secretKeyEncrypted, { type: 'alreadyComputed', symmetricKey: localKey })
    ).toString('hex');

    return {
        login,
        masterPassword,
        shouldNotSaveMasterPassword: deviceConfiguration.shouldNotSaveMasterPassword,
        localKey,
        accessKey: deviceConfiguration.accessKey,
        secretKey,
    };
};
