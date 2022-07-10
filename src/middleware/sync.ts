import Database from 'better-sqlite3';
import winston from 'winston';

import { getLatestContent } from '../steps';
import type { Secrets } from '../types';
import { decrypt } from '../crypto/decrypt';
import { encryptAES } from '../crypto/encrypt';
import { askReplaceMasterPassword } from '../utils/dialogs';
import { notEmpty } from '../utils';
import { replaceMasterPassword } from '../crypto/keychainManager';

interface Sync {
    db: Database.Database;
    secrets: Secrets;
}

export const sync = async (params: Sync) => {
    const { db } = params;
    let { secrets } = params;
    winston.debug('Start syncing...');

    const lastServerSyncTimestamp =
        (
            db.prepare('SELECT lastServerSyncTimestamp FROM syncUpdates WHERE login = ?').get(secrets.login) as {
                lastServerSyncTimestamp?: number;
            }
        )?.lastServerSyncTimestamp || 0;

    const latestContent = await getLatestContent({
        login: secrets.login,
        timestamp: lastServerSyncTimestamp,
        secrets,
    });

    let values: string[][] = [];
    let masterPasswordValid = false;
    while (!masterPasswordValid) {
        const derivates = new Map<string, Promise<Buffer>>();
        masterPasswordValid = true;

        // insert the transactions
        const valuesWithErrors = await Promise.all(
            latestContent.transactions.map(async (transac) => {
                if (transac.action === 'BACKUP_EDIT') {
                    let transactionContent: Buffer;
                    try {
                        transactionContent = await decrypt(transac.content, {
                            type: 'memoize',
                            secrets: params.secrets,
                            derivates,
                        });
                    } catch (error) {
                        let errorMessage = 'unknown error';
                        if (error instanceof Error) {
                            errorMessage = error.message;
                        }
                        winston.debug(`Unable to decrypt a transactions while sync: ${errorMessage}`);

                        if (transac.identifier === 'SETTINGS_userId') {
                            if (!(await askReplaceMasterPassword())) {
                                throw new Error('The master password is incorrect.');
                            }
                            secrets = await replaceMasterPassword(db, secrets);
                            masterPasswordValid = false;
                        }
                        return null;
                    }
                    const encryptedTransactionContent = encryptAES(params.secrets.localKey, transactionContent);
                    return [
                        secrets.login,
                        transac.identifier,
                        transac.type,
                        transac.action,
                        encryptedTransactionContent,
                    ];
                }
                return [secrets.login, transac.identifier, transac.type, transac.action, ''];
            })
        );
        values = valuesWithErrors.filter(notEmpty);
    }
    const nbErrors = latestContent.transactions.length - values.length;

    if (nbErrors !== 0) {
        winston.debug(`Ignored ${nbErrors} decryption errors`);
    }

    winston.debug(`Number of new updates: ${values.length}`);

    const statement = db.prepare(
        'REPLACE INTO transactions (login, identifier, type, action, content) VALUES (?, ?, ?, ?, ?)'
    );

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
