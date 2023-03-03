import Database from 'better-sqlite3';

interface RecordCount {
    CNTREC: number;
}

export const upgradeDatabase = (db: Database.Database) => {
    const authenticatioFieldCheck = db
        .prepare(`SELECT COUNT(*) AS CNTREC FROM pragma_table_info('device') WHERE name='authenticationMode'`)
        .get() as RecordCount;

    if (authenticatioFieldCheck.CNTREC === 0) {
        console.log('Database upgrade required. This will be quick...');
        try {
            db.prepare(`ALTER TABLE 'device' ADD COLUMN 'authenticationMode' VARCHAR(255)`).run();
            db.prepare(`ALTER TABLE 'device' ADD COLUMN 'serverKeyEncrypted' VARCHAR(255)`).run();
        } catch (error) {
            console.log('Error: Unable to perform Database upgrade. Please use the reset command.');
            throw error;
        }
    }
};
