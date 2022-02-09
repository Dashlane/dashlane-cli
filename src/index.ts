import * as async from 'async';

import sqlite3 from 'sqlite3';
import { DeviceKeys } from './types.js';
import { registerDevice } from './middleware/registerDevice.js';
import { sync } from './middleware/sync.js';
import { getPassword } from './middleware/get.js';
import { prepareDB } from './middleware/prepareDB.js';

const command = process.argv[2];
const commandsParameters = process.argv.slice(3);

const login = 'apps@pixelswap.fr';

const db = new sqlite3.Database('./database/vault.db', sqlite3.OPEN_READWRITE || sqlite3.OPEN_CREATE, (error) => {
    if (error) {
        console.error(error.message);
        process.exit(2);
    }
    console.log('Connected to database.');
});

db.serialize(() => {
    interface AsyncResults {
        prepareDB: DeviceKeys | null;
        registerDevice: DeviceKeys | null;
        sync: void;
        getPassword: void;
    }

    async.auto<AsyncResults>(
        {
            prepareDB: (cb) => prepareDB({ db, login }, cb),
            registerDevice: [
                'prepareDB',
                (results, cb) => registerDevice({ login, deviceKeys: results.prepareDB, db }, cb)
            ],
            sync: [
                'prepareDB',
                'registerDevice',
                (results, cb) =>
                    sync({ deviceKeys: results.registerDevice || results.prepareDB, login, db, command }, cb)
            ],
            getPassword: [
                'prepareDB',
                'registerDevice',
                'sync',
                (_results, cb) => getPassword({ db, command, commandsParameters }, cb)
            ]
        },
        (error) => {
            if (error) {
                console.error(error);
                process.exit(2);
            }
        }
    );
});
