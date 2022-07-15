import Database from 'better-sqlite3';
import winston from 'winston';
import { encryptAES } from '../crypto/encrypt';
import { deleteLocalKey, setLocalKey } from '../crypto/keychainManager';
import { Secrets } from '../types';

interface ConfigureSaveMasterPassword {
    db: Database.Database;
    secrets: Secrets;
    shouldNotSaveMasterPassword: boolean;
}

export const configureSaveMasterPassword = async (params: ConfigureSaveMasterPassword) => {
    const { db, secrets, shouldNotSaveMasterPassword } = params;

    if (shouldNotSaveMasterPassword) {
        // Forget the local key stored in the OS keychain because the master password and the DB are enough to retrieve the
        // local key
        try {
            await deleteLocalKey(secrets.login);
        } catch (error) {
            // Errors are ignored because the OS keychain may be unreachable
            let errorMessage = 'unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            winston.debug(`Unable to delete the local key from the keychain: ${errorMessage}`);
        }
    }

    let masterPasswordEncrypted: string | null;
    if (shouldNotSaveMasterPassword) {
        masterPasswordEncrypted = null;
    } else {
        // Set encrypted master password in the DB
        masterPasswordEncrypted = encryptAES(secrets.localKey, Buffer.from(secrets.masterPassword));

        // Set local key in the OS keychain
        await setLocalKey(secrets.login, shouldNotSaveMasterPassword, secrets.localKey);
    }

    db.prepare('UPDATE device SET masterPasswordEncrypted = ?, shouldNotSaveMasterPassword = ? WHERE login = ?')
        .bind(masterPasswordEncrypted, shouldNotSaveMasterPassword ? 1 : 0, secrets.login)
        .run();
};
