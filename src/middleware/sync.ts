import Database from 'better-sqlite3';
import winston from 'winston';

import { getLatestContent } from '../steps/index.js';
import type { Secrets } from '../types.js';

interface Sync {
    db: Database.Database;
    secrets: Secrets;
}

export const sync = async (params: Sync) => {
    const { db, secrets } = params;
    winston.debug('Start syncing...');

    const formerSyncTimestamp =
        (
            db.prepare('SELECT timestamp FROM syncUpdates ORDER BY timestamp DESC LIMIT 1').get() as {
                timestamp?: number;
            }
        )?.timestamp || 0;

    const latestContent = await getLatestContent({
        login: secrets.login,
        timestamp: formerSyncTimestamp,
        secrets
    });

    // insert the transactions
    const values = latestContent.transactions.map((transac) => {
        if (transac.action === 'BACKUP_EDIT') {
            return [transac.identifier, transac.type, transac.action, transac.content];
        }
        return [transac.identifier, transac.type, transac.action, ''];
    });

    console.log('Number of new updates:', values.length);

    const statement = db.prepare(`REPLACE INTO transactions (identifier, type, action, content) VALUES (?, ?, ?, ?)`);

    // execute all transactions
    const replaceTransactions = db.transaction((transactions) => {
        for (const transaction of transactions) statement.run(transaction);
    });

    replaceTransactions(values);

    // save the new transaction timestamp in the db
    db.prepare('REPLACE INTO syncUpdates(timestamp) VALUES(?)').bind(Number(latestContent.timestamp)).run();

    winston.debug('Requested timestamp ', formerSyncTimestamp, ', new timestamp', latestContent.timestamp);

    const summaryCounted: Record<string, number> = {};
    Object.keys(latestContent.summary).forEach((key) => {
        summaryCounted[key] = Object.keys(latestContent.summary[key]).length;
    });
    winston.debug(JSON.stringify(summaryCounted, null, 4));
};
