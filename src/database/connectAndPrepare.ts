import Database from 'better-sqlite3';
import { DeviceKeysWithLogin } from '../types';
import { registerDevice } from '../middleware/registerDevice.js';
import { prepareDB } from './prepare.js';
import { connect } from './connect.js';

export const connectAndPrepare = async (): Promise<{
    db: Database.Database;
    deviceKeys: DeviceKeysWithLogin;
}> => {
    const db = connect();
    db.serialize();

    // Create the tables and load the deviceKeys if it exists
    let deviceKeys = prepareDB({ db });
    if (!deviceKeys) {
        // if deviceKeys does not exist, register this new device
        deviceKeys = await registerDevice({ db });
    }

    return {
        db,
        deviceKeys,
    };
};
