import Database from 'better-sqlite3';
import winston from 'winston';
import { deleteLocalKey } from '../crypto/keychainManager';
import { LocalConfiguration } from '../../types';

interface ResetDB {
    db: Database.Database;
    localConfiguration?: LocalConfiguration;
}

export const reset = (params: ResetDB) => {
    const { db, localConfiguration } = params;

    db.prepare('DROP TABLE IF EXISTS syncUpdates').run();
    db.prepare('DROP TABLE IF EXISTS transactions').run();
    db.prepare('DROP TABLE IF EXISTS device').run();

    winston.debug('Database reset');

    if (localConfiguration) {
        try {
            deleteLocalKey(localConfiguration.login);
        } catch (error) {
            // Errors are ignored because the OS keychain may be unreachable
            let errorMessage = 'unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            winston.debug(`Unable to delete the local key from the keychain: ${errorMessage}`);
        }
    }
};
