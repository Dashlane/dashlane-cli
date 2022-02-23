import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';
import type { DeviceKeys } from '../types.js';

interface PrepareDB {
    db: sqlite3.Database;
    login: string;
}

export const prepareDB = async (params: PrepareDB): Promise<DeviceKeys | null> => {
    const { db, login } = params;

    const run = promisify(db.run).bind(db);

    await Promise.all([
        run(`CREATE TABLE IF NOT EXISTS syncUpdates (timestamp INT PRIMARY KEY);`),
        run(`CREATE TABLE IF NOT EXISTS transactions (
            identifier VARCHAR(255) PRIMARY KEY,
            type VARCHAR(255) NOT NULL,
            action VARCHAT(255) NOT NULL,
            content BLOB
        );`),
        run(`CREATE TABLE IF NOT EXISTS device (
            login VARCHAR(255) PRIMARY KEY,
            accessKey VARCHAR(255) NOT NULL,
            secretKey VARCHAR(255) NOT NULL
        );`),
    ]);

    const result = await promisify<string, any, DeviceKeys | null>(db.get).bind(db)(
        'SELECT * FROM device WHERE login=$login',
        { $login: login }
    );
    return result || null;
};
