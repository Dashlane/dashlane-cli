import * as winston from 'winston';
import { deleteLocalKey } from '../modules/crypto/keychainManager.js';
import { connectAndPrepare } from '../modules/database/index.js';

export const runLock = async () => {
    const { db, localConfiguration } = await connectAndPrepare({
        autoSync: false,
        shouldNotSaveMasterPasswordIfNoDeviceKeys: true,
    });

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
        winston.warn(`Unable to lock the vault: ${errorMessage}`);
    }

    db.prepare('UPDATE device SET masterPasswordEncrypted = ? WHERE login = ?')
        .bind(null, localConfiguration.login)
        .run();

    db.close();
};
