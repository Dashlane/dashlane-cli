import Database from 'better-sqlite3';

import { Secrets } from '../types';
import { prepareDB } from './prepare';
import { connect } from './connect';
import { getSecrets } from '../crypto';

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
