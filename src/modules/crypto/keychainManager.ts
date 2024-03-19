import { Database } from 'better-sqlite3';
import { Entry } from '@napi-rs/keyring';
import winston from 'winston';
import os from 'os';
import crypto from 'crypto';
import { decrypt, getDerivateUsingParametersFromEncryptedData } from './decrypt';
import { encryptAesCbcHmac256 } from './encrypt';
import { sha512 } from './hash';
import { EncryptedData } from './types';
import { decryptSsoRemoteKey } from './buildSsoRemoteKey';
import { CLI_VERSION, cliVersionToString } from '../../cliVersion';
import { perform2FAVerification, registerDevice } from '../auth';
import { DeviceConfiguration, LocalConfiguration } from '../../types';
import { askEmailAddress, askMasterPassword } from '../../utils/dialogs';
import { get2FAStatusUnauthenticated } from '../../endpoints/get2FAStatusUnauthenticated';
import { getDeviceCredentials } from '../../utils';

const SERVICE = 'dashlane-cli';

export const generateLocalKey = (): Buffer => {
    const localKey = crypto.randomBytes(32);
    if (!localKey) {
        throw new Error('Unable to generate AES local key');
    }
    return localKey;
};

export const setLocalKey = (login: string, localKey: Buffer, callbackOnError: (errorMessage: string) => void) => {
    try {
        const entry = new Entry(SERVICE, login);
        entry.setPassword(localKey.toString('base64'));
    } catch (error) {
        let errorMessage = 'unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        callbackOnError(errorMessage);
    }
};

const getLocalKey = (login: string): Buffer | undefined => {
    const entry = new Entry(SERVICE, login);
    const localKeyEncoded = entry.getPassword();

    if (localKeyEncoded) {
        return Buffer.from(localKeyEncoded, 'base64');
    } else {
        return undefined;
    }
};

export const deleteLocalKey = (login: string) => {
    const entry = new Entry(SERVICE, login);
    entry.deletePassword();
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

const getLocalConfigurationWithoutDB = async (
    db: Database,
    login: string,
    shouldNotSaveMasterPassword: boolean
): Promise<LocalConfiguration> => {
    const localKey = generateLocalKey();

    // Register the user's device
    const deviceCredentials = getDeviceCredentials();
    const { deviceAccessKey, deviceSecretKey, serverKey, ssoServerKey, ssoSpKey, remoteKeys } = deviceCredentials
        ? {
              deviceAccessKey: deviceCredentials.accessKey,
              deviceSecretKey: deviceCredentials.secretKey,
              serverKey: undefined,
              ssoServerKey: undefined,
              ssoSpKey: undefined,
              remoteKeys: [],
          }
        : await registerDevice({
              login,
              deviceName: `${os.hostname()} - ${os.platform()}-${os.arch()}`,
          });

    // Get the authentication type (mainly to identify if the user is with OTP2)
    // if non-interactive device, we consider it as email_token, so we don't need to call the API
    const { type } = deviceCredentials ? { type: 'email_token' } : await get2FAStatusUnauthenticated({ login });

    let masterPassword = '';
    const masterPasswordEnv = process.env.DASHLANE_MASTER_PASSWORD;
    let serverKeyEncrypted = null;
    const isSSO = type === 'sso';

    // In case of SSO
    if (isSSO) {
        masterPassword = decryptSsoRemoteKey({ ssoServerKey, ssoSpKey, remoteKeys });
    } else {
        masterPassword = masterPasswordEnv ?? (await askMasterPassword());

        // In case of OTP2
        if (type === 'totp_login' && serverKey) {
            serverKeyEncrypted = encryptAesCbcHmac256(localKey, Buffer.from(serverKey));
            masterPassword = serverKey + masterPassword;
        }
    }

    const derivate = await getDerivateUsingParametersFromEncryptedData(
        masterPassword,
        getDerivationParametersForLocalKey(login)
    );

    const deviceSecretKeyEncrypted = encryptAesCbcHmac256(localKey, Buffer.from(deviceSecretKey, 'hex'));
    const masterPasswordEncrypted = encryptAesCbcHmac256(localKey, Buffer.from(masterPassword));
    const localKeyEncrypted = encryptAesCbcHmac256(derivate, localKey);

    const shouldSaveMasterPassword = !shouldNotSaveMasterPassword || isSSO;
    if (shouldSaveMasterPassword) {
        setLocalKey(login, localKey, (errorMessage) => {
            warnUnreachableKeychainDisabled(errorMessage);
            shouldNotSaveMasterPassword = true;
        });
    }

    db.prepare('REPLACE INTO device VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
            login,
            cliVersionToString(CLI_VERSION),
            deviceAccessKey,
            deviceSecretKeyEncrypted,
            shouldSaveMasterPassword ? masterPasswordEncrypted : null,
            shouldSaveMasterPassword ? 0 : 1,
            localKeyEncrypted,
            1,
            type,
            serverKeyEncrypted
        )
        .run();

    return {
        login,
        masterPassword,
        shouldNotSaveMasterPassword,
        isSSO,
        localKey,
        accessKey: deviceAccessKey,
        secretKey: deviceSecretKey,
    };
};

const getLocalConfigurationWithoutKeychain = async (
    login: string,
    deviceConfiguration: DeviceConfiguration
): Promise<LocalConfiguration> => {
    if (deviceConfiguration.authenticationMode === 'sso') {
        throw new Error('SSO is currently not supported without the keychain');
    }

    /** The master password is a utf-8 string and in case it comes from a remote key with no derivation encoded in base64 */
    let masterPassword = '';
    let serverKey: string | undefined;
    if (deviceConfiguration.authenticationMode === 'totp_login') {
        serverKey = await perform2FAVerification({ login, deviceAccessKey: deviceConfiguration.accessKey });
        masterPassword = serverKey ?? '';
    }

    masterPassword += await askMasterPassword();

    const derivate = await getDerivateUsingParametersFromEncryptedData(
        masterPassword,
        getDerivationParametersForLocalKey(login)
    );

    const localKey = await decrypt(deviceConfiguration.localKeyEncrypted, {
        type: 'alreadyComputed',
        symmetricKey: derivate,
    });
    const secretKey = (
        await decrypt(deviceConfiguration.secretKeyEncrypted, { type: 'alreadyComputed', symmetricKey: localKey })
    ).toString('hex');

    if (!deviceConfiguration.shouldNotSaveMasterPassword) {
        setLocalKey(login, localKey, (errorMessage) => {
            winston.warn(`Unable to reach OS keychain because of error: "${errorMessage}". \
Install it or disable its usage via \`dcli configure save-master-password false\`.`);
        });
    }

    return {
        login,
        masterPassword,
        shouldNotSaveMasterPassword: deviceConfiguration.shouldNotSaveMasterPassword,
        isSSO: false,
        localKey,
        accessKey: deviceConfiguration.accessKey,
        secretKey,
    };
};

export const replaceMasterPassword = async (
    db: Database,
    localConfiguration: LocalConfiguration,
    deviceConfiguration: DeviceConfiguration | null
): Promise<LocalConfiguration> => {
    if (deviceConfiguration && deviceConfiguration.authenticationMode === 'sso') {
        throw new Error("You can't replace the master password of an SSO account");
    }

    const { localKey, login, accessKey, secretKey, shouldNotSaveMasterPassword } = localConfiguration;

    let newMasterPassword = '';
    let serverKey;
    let serverKeyEncrypted = null;

    if (deviceConfiguration && deviceConfiguration.authenticationMode === 'totp_login') {
        serverKey = await perform2FAVerification({ login, deviceAccessKey: deviceConfiguration.accessKey });
        newMasterPassword = serverKey ?? '';
        serverKeyEncrypted = encryptAesCbcHmac256(localConfiguration.localKey, Buffer.from(serverKey ?? ''));
    }

    newMasterPassword += await askMasterPassword();

    const derivate = await getDerivateUsingParametersFromEncryptedData(
        newMasterPassword,
        getDerivationParametersForLocalKey(login)
    );

    const masterPasswordEncrypted = encryptAesCbcHmac256(localConfiguration.localKey, Buffer.from(newMasterPassword));
    const localKeyEncrypted = encryptAesCbcHmac256(derivate, localKey);

    db.prepare(
        'UPDATE device SET localKeyEncrypted = ?, masterPasswordEncrypted = ?, serverKeyEncrypted = ? WHERE login = ?'
    )
        .bind(
            localKeyEncrypted,
            shouldNotSaveMasterPassword ? null : masterPasswordEncrypted,
            serverKeyEncrypted,
            login
        )
        .run();

    return {
        login,
        masterPassword: newMasterPassword,
        shouldNotSaveMasterPassword,
        isSSO: false,
        localKey,
        accessKey,
        secretKey,
    };
};

export const getLocalConfiguration = async (
    db: Database,
    deviceConfiguration: DeviceConfiguration | null,
    shouldNotSaveMasterPasswordIfNoDeviceKeys = false
): Promise<LocalConfiguration> => {
    let login: string;
    if (deviceConfiguration) {
        login = deviceConfiguration.login;
    } else {
        login = await askEmailAddress();
    }

    // If there are no configuration and secrets in the DB
    if (!deviceConfiguration) {
        return getLocalConfigurationWithoutDB(db, login, shouldNotSaveMasterPasswordIfNoDeviceKeys);
    }

    let localKey: Buffer | undefined = undefined;

    // If the master password is not saved or if the keychain is unreachable, or empty, the local key is retrieved from
    // the master password from the DB
    if (
        deviceConfiguration.shouldNotSaveMasterPassword ||
        !deviceConfiguration.masterPasswordEncrypted ||
        !(localKey = getLocalKey(login))
    ) {
        return getLocalConfigurationWithoutKeychain(login, deviceConfiguration);
    }

    // Otherwise, the local key can be used to decrypt the device secret key and the master password in the DB
    // In case of OTP2, the masterPassword here is already concatenated with the serverKey
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
        isSSO: deviceConfiguration.authenticationMode === 'sso',
        localKey,
        accessKey: deviceConfiguration.accessKey,
        secretKey,
    };
};

export const warnUnreachableKeychainDisabled = (errorMessage: string) => {
    winston.warn(`Unable to reach OS keychain because of error: "${errorMessage}", so its use has been disabled. \
To retry using it, please execute \`dcli configure save-master-password true\`. \
Until then, you will have to retype your master password each time you run the CLI.`);
};
