import Database from 'better-sqlite3';

import { Secrets } from '../types.js';
import { prepareDB } from './prepare.js';
import { connect } from './connect.js';
import { getSecrets } from '../crypto/index.js';

export const connectAndPrepare = async (
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

    return {
        db,
        secrets,
    };
};
