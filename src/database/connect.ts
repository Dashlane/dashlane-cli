import fs from 'fs';
import { promisify } from 'util';
import sqlite3 from 'sqlite3';

// The most appropriate folder to store the user's data, by OS
const USER_DATA_PATH =
    process.env.APPDATA ||
    (process.platform === 'darwin'
        ? (process.env.HOME as string) + '/Library/Application Support'
        : (process.env.HOME as string) + '/.local/share');
const DB_PATH = USER_DATA_PATH + '/dashlane-cli';

export const connect = async () => {
    // create the data folder if it doesn't exist
    if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(DB_PATH, { recursive: true });
    }

    const db = await promisify<sqlite3.Database>((cb) => {
        const db: sqlite3.Database = new sqlite3.Database(DB_PATH + '/userdata.db', (err) => cb(err, db));
    })();
    console.log('Connected to database.');

    return db;
};
