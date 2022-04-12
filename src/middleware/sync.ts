import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { getLatestContent } from '../steps';
import type { DeviceKeysWithLogin } from '../types.js';

interface Sync {
    db: sqlite3.Database;
    deviceKeys: DeviceKeysWithLogin;
}

export const sync = async (params: Sync) => {
    const { db, deviceKeys } = params;
    console.log('Start syncing...');

    const formerSyncTimestamp =
        ((
            await promisify<string, any>(db.get).bind(db)(
                'SELECT timestamp FROM syncUpdates ORDER BY timestamp DESC LIMIT 1'
            )
        )?.timestamp as number) || 0;

    const latestContent = await getLatestContent({
        login: deviceKeys.login,
        timestamp: formerSyncTimestamp,
        deviceKeys
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
    await Promise.all(values.map((value) => promisify<any, void>(statement.run).bind(statement)(value)));
    await promisify(statement.finalize).bind(statement)();

    // save the new transaction timestamp in the db
    await promisify<string, any, void>(db.run).bind(db)('REPLACE INTO syncUpdates(timestamp) VALUES(?)', [
        Number(latestContent.timestamp)
    ]);

    console.log('Requested timestamp ', formerSyncTimestamp, ', new timestamp', latestContent.timestamp);

    const summaryCounted: Record<string, number> = {};
    Object.keys(latestContent.summary).forEach((key) => {
        summaryCounted[key] = Object.keys(latestContent.summary[key]).length;
    });
    console.log(summaryCounted);
};
