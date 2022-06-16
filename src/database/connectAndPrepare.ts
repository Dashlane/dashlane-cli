import Database from 'better-sqlite3';

import { Secrets } from '../types';
import { prepareDB } from './prepare';
import { connect } from './connect';
import { getSecrets } from '../crypto';
import { sync } from '../middleware/sync';

export const connectAndPrepare = async (
    autoSync: boolean,
    masterPassword?: string
): Promise<{
    db: Database.Database;
    secrets: Secrets;
}> => {
    const db = connect();
    db.serialize();

    // Create the tables and load the deviceKeys if it exists
    const deviceKeys = prepareDB({ db });
    const secrets = await getSecrets(db, deviceKeys, masterPassword);

    if (autoSync) {
        const lastClientSyncTimestamp =
            (
                db
                    .prepare(
                        'SELECT lastClientSyncTimestamp FROM syncUpdates ORDER BY lastServerSyncTimestamp DESC LIMIT 1'
                    )
                    .get() as {
                    lastClientSyncTimestamp?: number;
                }
            )?.lastClientSyncTimestamp || 0;

        // If there were no updates during last day, synchronize the vault
        if (Date.now() / 1000 - lastClientSyncTimestamp > 3600 * 24) {
            await sync({ db, secrets });
        }
    }

    return {
        db,
        secrets,
    };
};
