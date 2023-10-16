import Database from 'better-sqlite3';
import winston from 'winston';
import { connectAndPrepare } from '../modules/database';
import { decrypt } from '../modules/crypto/decrypt';
import { encryptAesCbcHmac256 } from '../modules/crypto/encrypt';
import { replaceMasterPassword } from '../modules/crypto/keychainManager';
import { getLatestContent } from '../endpoints';
import type { DeviceConfiguration, LocalConfiguration } from '../types';
import { notEmpty } from '../utils';
import { askReplaceIncorrectMasterPassword } from '../utils/dialogs';

export const runSync = async () => {
    const { db, localConfiguration, deviceConfiguration } = await connectAndPrepare({ autoSync: false });
    await sync({ db, localConfiguration, deviceConfiguration });
    winston.info('Successfully synced');
    db.close();
};

interface Sync {
    db: Database.Database;
    localConfiguration: LocalConfiguration;
    deviceConfiguration: DeviceConfiguration | null;
}

export const sync = async (params: Sync) => {
    const { db } = params;
    let { localConfiguration } = params;
    winston.debug('Start syncing...');

    const lastServerSyncTimestamp =
        (
            db
                .prepare('SELECT lastServerSyncTimestamp FROM syncUpdates WHERE login = ?')
                .get(localConfiguration.login) as {
                lastServerSyncTimestamp?: number;
            }
        )?.lastServerSyncTimestamp || 0;

    const latestContent = await getLatestContent({
        login: localConfiguration.login,
        timestamp: lastServerSyncTimestamp,
        localConfiguration,
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
                            localConfiguration,
                            derivates,
                        });
                    } catch (error) {
                        let errorMessage = 'unknown error';
                        if (error instanceof Error) {
                            errorMessage = error.message;
                        }
                        winston.debug(`Unable to decrypt a transactions while sync: ${errorMessage}`);

                        if (transac.identifier === 'SETTINGS_userId') {
                            if (!(await askReplaceIncorrectMasterPassword())) {
                                throw new Error('The master password is incorrect.');
                            }
                            localConfiguration = await replaceMasterPassword(
                                db,
                                localConfiguration,
                                params.deviceConfiguration
                            );
                            masterPasswordValid = false;
                        }
                        return null;
                    }
                    const encryptedTransactionContent = encryptAesCbcHmac256(
                        localConfiguration.localKey,
                        transactionContent
                    );
                    return [
                        localConfiguration.login,
                        transac.identifier,
                        transac.type,
                        transac.action,
                        encryptedTransactionContent,
                    ];
                }
                return [localConfiguration.login, transac.identifier, transac.type, transac.action, ''];
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
        .bind(localConfiguration.login, Number(latestContent.timestamp), Math.floor(Date.now() / 1000))
        .run();

    winston.debug(`Requested timestamp ${lastServerSyncTimestamp}, new timestamp ${latestContent.timestamp}`);

    const summaryCounted: Record<string, number> = {};
    Object.keys(latestContent.summary).forEach((key) => {
        summaryCounted[key] = Object.keys(latestContent.summary[key]).length;
    });
    winston.debug(JSON.stringify(summaryCounted, null, 4));
};
