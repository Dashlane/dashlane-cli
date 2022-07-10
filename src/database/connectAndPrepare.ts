import Database from 'better-sqlite3';

import { Secrets } from '../types';
import { prepareDB } from './prepare';
import { connect } from './connect';
import { getSecrets } from '../crypto';
import { sync } from '../middleware/sync';

export const connectAndPrepare = async (
    autoSync: boolean,
    shouldNotSaveMasterPasswordIfNoDeviceKeys = false
): Promise<{
    db: Database.Database;
    secrets: Secrets;
}> => {
    const db = connect();
    db.serialize();

    // Create the tables and load the deviceKeys if it exists
    const deviceKeys = prepareDB({ db });
    const secrets = await getSecrets(db, deviceKeys, shouldNotSaveMasterPasswordIfNoDeviceKeys);

    if (autoSync) {
        const lastClientSyncTimestamp =
            (
                db
                    .prepare('SELECT lastClientSyncTimestamp FROM syncUpdates WHERE login = ? LIMIT 1')
                    .get(secrets.login) as {
                    lastClientSyncTimestamp?: number;
                }
            )?.lastClientSyncTimestamp || 0;

        // If there were no updates during last hour, synchronize the vault
        if (Date.now() / 1000 - lastClientSyncTimestamp > 3600) {
            await sync({ db, secrets });
        }
    }

    return {
        db,
        secrets,
    };
};
