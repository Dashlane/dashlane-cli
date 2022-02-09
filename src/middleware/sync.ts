import * as async from 'async';
import * as sqlite3 from 'sqlite3';
import { GetLatestContentOutput, getLatestContent } from '../steps/index.js';
import { DeviceKeys } from '../types.js';

interface Sync {
    command: string;
    db: sqlite3.Database;
    login: string;
    deviceKeys: DeviceKeys;
}

export const sync = (params: Sync, cb: CallbackErrorOnly) => {
    const { command, db, login, deviceKeys } = params;

    interface AsyncResultsSync {
        getTimestamp: number;
        getLatestContent: GetLatestContentOutput;
        // writeDb: void;
        insertTransactions: void;
        insertLastSyncDate: void;
    }

    if (command === 'sync') {
        console.log('Start syncing...');

        return async.auto<AsyncResultsSync>(
            {
                getTimestamp: (cb) => db.all('SELECT timestamp FROM syncUpdates ORDER BY timestamp DESC LIMIT 1', cb),
                getLatestContent: [
                    'getTimestamp',
                    (results, cb) =>
                        getLatestContent({ login, timestamp: results.getTimestamp[0].timestamp || 0, deviceKeys }, cb)
                ],
                // writeDb: [
                //     'getLatestContent',
                //     (results, cb) =>
                //         writeDbToFile({ database: JSON.stringify(results.getLatestContent['transactions']) }, cb)
                // ],
                insertTransactions: [
                    'getLatestContent',
                    (results, cb) => {
                        const transactions = results.getLatestContent.transactions;
                        const values = transactions.map((transac) => {
                            if (transac.action === 'BACKUP_EDIT') {
                                return [transac.identifier, transac.type, transac.action, transac.content];
                            }
                            return [transac.identifier, transac.type, transac.action, ''];
                        });

                        console.log('Number of new updates:', values.length);

                        const statement = db.prepare(
                            `REPLACE INTO transactions (identifier, type, action, content) VALUES (?, ?, ?, ?)`
                        );

                        for (let i = 0; i < values.length; i++) {
                            statement.run(values[i], (error) => {
                                if (error) {
                                    console.log('insert transactions, error');
                                    return cb(error);
                                }
                            });
                        }

                        statement.finalize((error) => {
                            if (error) {
                                return cb(error);
                            }
                            return cb();
                        });
                    }
                ],
                insertLastSyncDate: [
                    'getLatestContent',
                    (results, cb) =>
                        db.run(
                            'REPLACE INTO syncUpdates(timestamp) VALUES(?)',
                            [Number(results.getLatestContent['timestamp'])],
                            (error) => {
                                return cb(error);
                            }
                        )
                ]
            },
            (error, results) => {
                if (error) {
                    return cb(error);
                }

                console.log(
                    'Requested timestamp ',
                    results.getTimestamp[0].timestamp || 0,
                    ', new timestamp',
                    results.getLatestContent['timestamp']
                );

                const summary = results.getLatestContent['summary'];
                const summaryCounted = {};
                Object.keys(summary).forEach((key) => {
                    summaryCounted[key] = Object.keys(summary[key]).length;
                });
                console.log(summaryCounted);

                return cb();
            }
        );
    }
    return cb();
};
