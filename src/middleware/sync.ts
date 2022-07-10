import Database from 'better-sqlite3';
import winston from 'winston';

import { getLatestContent } from '../steps';
import type { Secrets } from '../types';

interface Sync {
    db: Database.Database;
    secrets: Secrets;
}

export const sync = async (params: Sync) => {
    const { db, secrets } = params;
    winston.debug('Start syncing...');

    const lastServerSyncTimestamp =
        (
            db
                .prepare('SELECT lastServerSyncTimestamp FROM syncUpdates WHERE login = ? LIMIT 1')
                .get(secrets.login) as {
                lastServerSyncTimestamp?: number;
            }
        )?.lastServerSyncTimestamp || 0;

    const latestContent = await getLatestContent({
        login: secrets.login,
        timestamp: lastServerSyncTimestamp,
        secrets,
    });

    // insert the transactions
    const values = latestContent.transactions.map((transac) => {
        if (transac.action === 'BACKUP_EDIT') {
            return [transac.identifier, transac.type, transac.action, transac.content];
        }
        return [transac.identifier, transac.type, transac.action, ''];
    });

    winston.debug('Number of new updates:', values.length);

    const statement = db.prepare('REPLACE INTO transactions (identifier, type, action, content) VALUES (?, ?, ?, ?)');

    // execute all transactions
    const replaceTransactions = db.transaction((transactions) => {
        for (const transaction of transactions) statement.run(transaction);
    });

    replaceTransactions(values);

    // save the new transaction timestamp in the db
    db.prepare('REPLACE INTO syncUpdates (login, lastServerSyncTimestamp, lastClientSyncTimestamp) VALUES(?, ?, ?)')
        .bind(secrets.login, Number(latestContent.timestamp), Math.floor(Date.now() / 1000))
        .run();

    winston.debug(`Requested timestamp ${lastServerSyncTimestamp}, new timestamp ${latestContent.timestamp}`);

    const summaryCounted: Record<string, number> = {};
    Object.keys(latestContent.summary).forEach((key) => {
        summaryCounted[key] = Object.keys(latestContent.summary[key]).length;
    });
    winston.debug(JSON.stringify(summaryCounted, null, 4));
};
