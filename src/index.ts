#!/usr/bin/env node
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import * as fs from 'fs';
import { registerDevice } from './middleware/registerDevice.js';
import { sync } from './middleware/sync.js';
import { getPassword } from './middleware/get.js';
import { prepareDB } from './middleware/prepareDB.js';

const command = process.argv[2];
const commandsParameters = process.argv.slice(3);

const login = 'paullouis.hery@gmail.com';

// The most appropriate folder to store the user's data, by OS
const USER_DATA_PATH = process.env.APPDATA || (process.platform === 'darwin' ?
        process.env.HOME + '/Library/Application Support' :
        process.env.HOME + '/.local/share'
);
const DB_PATH = USER_DATA_PATH + '/dashlane-cli';

const run = async () => {
    // create the data folder if it doesn't exist
    if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(DB_PATH, { recursive: true });
    }

    const db = await promisify<sqlite3.Database>(cb => {
        const db: sqlite3.Database =
            new sqlite3.Database(DB_PATH + '/userdata.db', (err) => cb(err, db));
    })();
    console.log('Connected to database.');

    await promisify(db.serialize).bind(db)();

    // Create the tables and load the deviceKeys if it exists
    let deviceKeys = await prepareDB({ db, login });
    if (!deviceKeys) {
        // if deviceKeys does not exists, register this new device
        deviceKeys = await registerDevice({ login, db });
    }
    if (command === 'sync') {
        await sync({ deviceKeys, login, db });
    } else if (command === 'password') {
        await getPassword({ db, commandsParameters });
    } else {
        console.error('Unknown command. Try "sync" or "password XXX"');
    }
};

run().catch(err => console.error(err));
