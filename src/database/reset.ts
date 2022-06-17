import Database from 'better-sqlite3';
import winston from 'winston';

interface ResetDB {
    db: Database.Database;
}

export const resetDB = (params: ResetDB) => {
    const { db } = params;

    db.prepare('DROP TABLE IF EXISTS syncUpdates;').run();
    db.prepare('DROP TABLE IF EXISTS transactions;').run();
    db.prepare('DROP TABLE IF EXISTS device;').run();

    winston.debug('Database reset');
};
