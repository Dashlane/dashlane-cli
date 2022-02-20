#!/usr/bin/env node
import sqlite3 from 'sqlite3';
import * as fs from 'fs';
import { promisify } from 'util';
import { registerDevice } from './middleware/registerDevice.js';
import { sync } from './middleware/sync.js';
import { getPassword } from './middleware/get.js';
import { prepareDB } from './middleware/prepareDB.js';
import path from 'path';

const command = process.argv[2];
const commandsParameters = process.argv.slice(3);

const login = 'apps@pixelswap.fr';

const run = async () => {
    // create the db file if it doesn't exist
    const DB_PATH = path.resolve(new URL('', import.meta.url).pathname, '../../database.db');
    console.log(DB_PATH);
    await new Promise(resolve => fs.writeFile(DB_PATH, '', { flag: 'wx' }, resolve));
    const db = await promisify<sqlite3.Database>(cb => {
        const db: sqlite3.Database =
            new sqlite3.Database(DB_PATH, (err) => cb(err, db));
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
