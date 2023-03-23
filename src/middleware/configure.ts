import Database from 'better-sqlite3';
import winston from 'winston';
import { encryptAES } from '../crypto/encrypt';
import { deleteLocalKey, setLocalKey, warnUnreachableKeychainDisabled } from '../crypto/keychainManager';
import { Secrets } from '../types';

interface ConfigureSaveMasterPassword {
    db: Database.Database;
    secrets: Secrets;
    shouldNotSaveMasterPassword: boolean;
}

interface ConfigureDisableAutoSync {
    db: Database.Database;
    secrets: Secrets;
    disableAutoSync: boolean;
}

interface ConfigureSleepAfterCopy {
    db: Database.Database;
    secrets: Secrets;
    enableSleepAfterCopy: boolean;
    sleepTime: number;
}

export const configureSaveMasterPassword = (params: ConfigureSaveMasterPassword) => {
    const { db, secrets } = params;
    let shouldNotSaveMasterPassword = params.shouldNotSaveMasterPassword;

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
};

export const configureDisableAutoSync = (params: ConfigureDisableAutoSync) => {
    const { db, secrets, disableAutoSync } = params;

    db.prepare('UPDATE device SET autoSync = ? WHERE login = ?')
        .bind(disableAutoSync ? 0 : 1, secrets.login)
        .run();
};

export const configureSleepAfterCopy = (params: ConfigureSleepAfterCopy) => {
    const { db, secrets, enableSleepAfterCopy, sleepTime } = params;

    db.prepare('UPDATE device SET sleepAfterCopy = ?, sleepTime = ? WHERE login = ?')
        .bind(enableSleepAfterCopy ? 0 : 1, sleepTime, secrets.login)
        .run();
};
