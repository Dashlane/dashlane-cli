import * as sqlite3 from 'sqlite3';
import { DeviceKeys } from '../types.js';

interface PrepareDB {
    db: sqlite3.Database;
    login: string;
}

export const prepareDB = (params: PrepareDB, cb: Callback<DeviceKeys>) => {
    const { db, login } = params;

    db.run(
        `CREATE TABLE IF NOT EXISTS syncUpdates (
        timestamp INT PRIMARY KEY);`,
        (error) => error && cb(error)
    );
    db.run(
        `CREATE TABLE IF NOT EXISTS transactions (
        identifier VARCHAR(255) PRIMARY KEY,
        type VARCHAR(255) NOT NULL,
        action VARCHAT(255) NOT NULL,
        content BLOB);`,
        (error) => error && cb(error)
    );
    db.run(
        `CREATE TABLE IF NOT EXISTS device (
        login VARCHAR(255) PRIMARY KEY,
        accessKey VARCHAR(255) NOT NULL,
        secretKey VARCHAR(255) NOT NULL);`,
        (error) => error && cb(error)
    );

    db.all('SELECT * FROM device WHERE login=$login', { $login: login }, (error, result) => {
        if (error) {
            return cb(error);
        }

        if (result.length === 1) {
            return cb(null, { accessKey: result[0].accessKey, secretKey: result[0].secretKey });
        }

        return cb(null, null);
    });
};
