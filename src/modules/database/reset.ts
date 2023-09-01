import Database from 'better-sqlite3';
import winston from 'winston';
import { deleteLocalKey } from '../crypto/keychainManager.js';
import { Secrets } from '../../types.js';

interface ResetDB {
    db: Database.Database;
    secrets?: Secrets;
}

export const reset = (params: ResetDB) => {
    const { db, secrets } = params;

    db.prepare('DROP TABLE IF EXISTS syncUpdates').run();
    db.prepare('DROP TABLE IF EXISTS transactions').run();
    db.prepare('DROP TABLE IF EXISTS device').run();

    winston.debug('Database reset');

    if (secrets) {
        try {
            deleteLocalKey(secrets.login);
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
