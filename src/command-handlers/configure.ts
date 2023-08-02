import winston from 'winston';
import { encryptAES } from '../modules/crypto/encrypt';
import { deleteLocalKey, setLocalKey, warnUnreachableKeychainDisabled } from '../modules/crypto/keychainManager';
import { connectAndPrepare } from '../modules/database';
import { parseBooleanString } from '../utils';

export const configureSaveMasterPassword = async (boolean: string) => {
    let shouldNotSaveMasterPassword = !parseBooleanString(boolean);
    const { db, secrets } = await connectAndPrepare({
        autoSync: false,
        shouldNotSaveMasterPasswordIfNoDeviceKeys: shouldNotSaveMasterPassword,
    });

    if (shouldNotSaveMasterPassword) {
        // Forget the local key stored in the OS keychain because the master password and the DB are enough to retrieve the
        // local key
        try {
            deleteLocalKey(secrets.login);
        } catch (error) {
            // Errors are ignored because the OS keychain may be unreachable
            let errorMessage = 'unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            winston.warn(`Unable to delete the local key from the keychain: ${errorMessage}`);
        }
    }

    let masterPasswordEncrypted: string | null;
    if (shouldNotSaveMasterPassword) {
        masterPasswordEncrypted = null;
    } else {
        // Set encrypted master password in the DB
        masterPasswordEncrypted = encryptAES(secrets.localKey, Buffer.from(secrets.masterPassword));

        if (!shouldNotSaveMasterPassword) {
            // Set local key in the OS keychain
            setLocalKey(secrets.login, secrets.localKey, (errorMessage: string) => {
                warnUnreachableKeychainDisabled(errorMessage);
                shouldNotSaveMasterPassword = true;
            });
        }
    }

    db.prepare('UPDATE device SET masterPasswordEncrypted = ?, shouldNotSaveMasterPassword = ? WHERE login = ?')
        .bind(masterPasswordEncrypted, shouldNotSaveMasterPassword ? 1 : 0, secrets.login)
        .run();

    db.close();
};

export const configureDisableAutoSync = async (boolean: string) => {
    const disableAutoSync = parseBooleanString(boolean);
    const { db, secrets } = await connectAndPrepare({ autoSync: false });

    db.prepare('UPDATE device SET autoSync = ? WHERE login = ?')
        .bind(disableAutoSync ? 0 : 1, secrets.login)
        .run();

    db.close();
};
