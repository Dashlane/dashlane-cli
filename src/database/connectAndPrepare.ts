import sqlite3 from 'sqlite3';
import { DeviceKeysWithLogin } from '../types';
import { promisify } from 'util';
import { registerDevice } from '../middleware/registerDevice.js';
import { prepareDB } from './prepare.js';
import { connect } from './connect.js';

export const connectAndPrepare = async (): Promise<{ db: sqlite3.Database; deviceKeys: DeviceKeysWithLogin }> => {
    const db = await connect();
    await promisify(db.serialize).bind(db)();

    // Create the tables and load the deviceKeys if it exists
    let deviceKeys = await prepareDB({ db });
    if (!deviceKeys) {
        // if deviceKeys does not exist, register this new device
        deviceKeys = await registerDevice({ db });
    }

    return {
        db,
        deviceKeys
    };
};
