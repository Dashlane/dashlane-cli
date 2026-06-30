import { Database } from 'better-sqlite3';

/**
 * returns true if the device is already mark as proven in the local database
 */
export const isDeviceProven = (db: Database, login: string): boolean => {
    const isDeviceProven = db.prepare('SELECT 1 FROM proven_devices WHERE login = ?').bind(login).get();
    return !!isDeviceProven;
};

/**
 * Marks the device as proven in the local database
 */
export const markDeviceAsProven = (db: Database, login: string) => {
    return db.prepare('INSERT INTO proven_devices VALUES(?)').bind(login).run();
};
