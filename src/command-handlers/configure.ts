import { encryptAesCbcHmac256 } from '../modules/crypto/encrypt.js';
import { deleteLocalKey, setLocalKey, warnUnreachableKeychainDisabled } from '../modules/crypto/keychainManager.js';
import { connectAndPrepare } from '../modules/database/index.js';
import { parseBooleanString } from '../utils/index.js';
import { DeviceConfiguration } from '../types.js';
import { logger } from '../logger.js';

export const configureSaveMasterPassword = async (boolean: string) => {
    let shouldNotSaveMasterPassword = !parseBooleanString(boolean);
    const { db, localConfiguration } = await connectAndPrepare({
        autoSync: false,
        shouldNotSaveMasterPasswordIfNoDeviceKeys: shouldNotSaveMasterPassword,
    });

    if (shouldNotSaveMasterPassword) {
        // Forget the local key stored in the OS keychain because the master password and the DB are enough to retrieve the
        // local key
        try {
            deleteLocalKey(localConfiguration.login);
        } catch (error) {
            // Errors are ignored because the OS keychain may be unreachable
            let errorMessage = 'unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            logger.warn(`Unable to delete the local key from the keychain: ${errorMessage}`);
        }
    }

    let masterPasswordEncrypted: string | null;
    if (shouldNotSaveMasterPassword) {
        masterPasswordEncrypted = null;
    } else {
        // Set encrypted master password in the DB
        masterPasswordEncrypted = encryptAesCbcHmac256(
            localConfiguration.localKey,
            Buffer.from(localConfiguration.masterPassword)
        );

        if (!shouldNotSaveMasterPassword) {
            // Set local key in the OS keychain
            setLocalKey(localConfiguration.login, localConfiguration.localKey, (errorMessage: string) => {
                warnUnreachableKeychainDisabled(errorMessage);
                shouldNotSaveMasterPassword = true;
            });
        }
    }

    db.prepare('UPDATE device SET masterPasswordEncrypted = ?, shouldNotSaveMasterPassword = ? WHERE login = ?')
        .bind(masterPasswordEncrypted, shouldNotSaveMasterPassword ? 1 : 0, localConfiguration.login)
        .run();

    db.close();
};

export const configureDisableAutoSync = async (boolean: string) => {
    const disableAutoSync = parseBooleanString(boolean);
    const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });

    db.prepare('UPDATE device SET autoSync = ? WHERE login = ?')
        .bind(disableAutoSync ? 0 : 1, localConfiguration.login)
        .run();

    db.close();
};

export const configureUserPresenceVerification = async (options: {
    method: DeviceConfiguration['userPresenceVerification'];
}) => {
    const { method } = options;
    const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });

    if (method === 'biometrics') {
        if (process.platform === 'darwin') {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const nodemacauth = require('node-mac-auth') as typeof import('node-mac-auth');
            if (!nodemacauth.canPromptTouchID()) {
                throw new Error('Biometrics are not supported on your device.');
            }
        }
    }

    db.prepare('UPDATE device SET userPresenceVerification = ? WHERE login = ?')
        .bind(method, localConfiguration.login)
        .run();

    db.close();
};
