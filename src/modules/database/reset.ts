import Database from 'better-sqlite3';
import { deleteLocalKey } from '../crypto/keychainManager.js';
import { LocalConfiguration } from '../../types.js';
import { logger } from '../../logger.js';

interface ResetDB {
    db: Database.Database;
    localConfiguration?: LocalConfiguration;
}

export const reset = (params: ResetDB) => {
    const { db, localConfiguration } = params;

    db.prepare('DROP TABLE IF EXISTS syncUpdates').run();
    db.prepare('DROP TABLE IF EXISTS transactions').run();
    db.prepare('DROP TABLE IF EXISTS device').run();
    db.prepare('VACUUM').run();

    logger.debug('Database reset');

    if (localConfiguration) {
        try {
            deleteLocalKey(localConfiguration.login);
        } catch (error) {
            // Errors are ignored because the OS keychain may be unreachable
            let errorMessage = 'unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            logger.debug(`Unable to delete the local key from the keychain: ${errorMessage}`);
        }
    }
};
