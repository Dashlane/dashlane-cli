import Database from 'better-sqlite3';
import fs from 'fs';
import { logger } from '../../logger';

// The most appropriate folder to store the user's data, by OS
const USER_DATA_PATH =
    process.env.APPDATA ||
    (process.platform === 'darwin'
        ? (process.env.HOME as string) + '/Library/Application Support'
        : (process.env.HOME as string) + '/.local/share');
const DB_PATH = USER_DATA_PATH + '/dashlane-cli';

export const getDatabasePath = () => {
    return DB_PATH + '/userdata.db';
};

export const connect = () => {
    // create the data folder if it doesn't exist
    if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(DB_PATH, { recursive: true });
    }

    const db = new Database(getDatabasePath());
    logger.debug('Connected to database.');

    return db;
};
