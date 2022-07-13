import Database from 'better-sqlite3';
import { DeviceKeysWithLogin } from '../types';

interface PrepareDB {
    db: Database.Database;
}

export const prepareDB = (params: PrepareDB): DeviceKeysWithLogin | null => {
    const { db } = params;

    db.prepare(
        `CREATE TABLE IF NOT EXISTS syncUpdates (
            login VARCHAR(255) PRIMARY KEY,
            lastServerSyncTimestamp INT,
            lastClientSyncTimestamp INT
        );`
    ).run();
    db.prepare(
        `CREATE TABLE IF NOT EXISTS transactions (
            login VARCHAR(255),
            identifier VARCHAR(255),
            type VARCHAR(255) NOT NULL,
            action VARCHAR(255) NOT NULL,
            content BLOB,
            PRIMARY KEY (login, identifier)
        );`
    ).run();
    db.prepare(
        `CREATE TABLE IF NOT EXISTS device (
            login VARCHAR(255) PRIMARY KEY,
            version VARCHAR(255) NOT NULL,
            accessKey VARCHAR(255) NOT NULL,
            secretKeyEncrypted VARCHAR(255) NOT NULL,
            masterPasswordEncrypted VARCHAR(255),
            shouldNotSaveMasterPassword BIT NOT NULL,
            localKeyEncrypted VARCHAR(255) NOT NULL
        );`
    ).run();

    return db.prepare('SELECT * FROM device LIMIT 1').get() as DeviceKeysWithLogin | null;
};
