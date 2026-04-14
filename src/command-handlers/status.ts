import Database from 'better-sqlite3';
import { Entry } from '@napi-rs/keyring';
import fs from 'fs';

import { connect, getDatabasePath } from '../modules/database/connect.js';
import { DeviceConfiguration } from '../types.js';
import { logger } from '../logger.js';

const SERVICE = 'dashlane-cli';

const isVaultLocked = (deviceConfiguration: DeviceConfiguration): boolean => {
    // If the master password should not be saved, the vault is always "locked"
    if (deviceConfiguration.shouldNotSaveMasterPassword) {
        return true;
    }

    // If no encrypted master password is stored in the DB, the vault is locked
    if (!deviceConfiguration.masterPasswordEncrypted) {
        return true;
    }

    // Try to retrieve the local key from the OS keychain
    try {
        const entry = new Entry(SERVICE, deviceConfiguration.login);
        const localKeyEncoded = entry.getPassword();
        if (localKeyEncoded) {
            return false;
        }
    } catch {
        logger.error('Unable to access the keychain to determine vault lock status');
        return true;
    }

    return true;
};

export const runStatus = (): void => {
    const dbPath = getDatabasePath();
    if (!fs.existsSync(dbPath)) {
        logger.content('Logged in: no');
        return;
    }

    let db: Database.Database;
    try {
        db = connect();
    } catch {
        logger.error('Unable to access the database to determine login status');
        return;
    }

    try {
        const deviceConfiguration = db.prepare('SELECT * FROM device LIMIT 1').get() as DeviceConfiguration | undefined;

        if (!deviceConfiguration) {
            logger.content('Logged in: no');
            return;
        }

        const locked = isVaultLocked(deviceConfiguration);

        logger.content(`Logged in: yes`);
        logger.content(`Login: ${deviceConfiguration.login}`);
        logger.content(`Locked: ${locked ? 'yes' : 'no'}`);
    } finally {
        db.close();
    }
};
