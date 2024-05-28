import fs from 'fs';
import { connectAndPrepare, getDatabasePath } from '../modules/database';
import { logger } from '../logger';

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

    logger.success(`Backup saved to ${backupPath}.`);
};
