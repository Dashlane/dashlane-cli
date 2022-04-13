import Database from 'better-sqlite3';
import { DeviceKeysWithLogin } from '../types';

interface PrepareDB {
    db: Database.Database;
}

export const prepareDB = (params: PrepareDB): DeviceKeysWithLogin | null => {
    const { db } = params;

    db.prepare(`CREATE TABLE IF NOT EXISTS syncUpdates (timestamp INT PRIMARY KEY);`).run();
    db.prepare(
        `CREATE TABLE IF NOT EXISTS transactions (
            identifier VARCHAR(255) PRIMARY KEY,
            type VARCHAR(255) NOT NULL,
            action VARCHAT(255) NOT NULL,
            content BLOB
        );`
    ).run();
    db.prepare(
        `CREATE TABLE IF NOT EXISTS device (
            login VARCHAR(255) PRIMARY KEY,
            accessKey VARCHAR(255) NOT NULL,
            secretKey VARCHAR(255) NOT NULL
        );`
    ).run();

    return db.prepare('SELECT * FROM device LIMIT 1').get() as DeviceKeysWithLogin | null;
};
