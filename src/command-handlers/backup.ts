import winston from 'winston';
import fs from 'fs';
import { connectAndPrepare, getDatabasePath } from '../modules/database/index.js';

export const runBackup = async (options: { directory: string; filename: string }) => {
    const { db } = await connectAndPrepare({ failIfNoDB: true, forceSync: true });
    db.close();

    const databasePath = getDatabasePath();

    if (!fs.existsSync(databasePath)) {
        throw new Error('No database found');
    }

    const outputDir = options.directory || '.';
    const filename = options.filename || `dashlane-backup-${Date.now()}.db`;

    const backupPath = `${outputDir}/${filename}`;

    fs.copyFileSync(databasePath, backupPath);

    winston.info(`Backup saved to ${backupPath}`);
};
