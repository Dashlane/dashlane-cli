import Database from 'better-sqlite3';
import winston from 'winston';
import { connect } from './connect';
import { prepareDB } from './prepare';
import {
    CLI_VERSION,
    breakingChangesVersions,
    cliVersionLessThan,
    cliVersionToString,
    stringToCliVersion,
} from '../cliVersion';
import { getSecrets } from '../crypto';
import { reset } from '../middleware/reset';
import { sync } from '../middleware/sync';
import { Secrets } from '../types';
import { askIgnoreBreakingChanges } from '../utils/dialogs';

export const connectAndPrepare = async (
    autoSync: boolean | undefined = undefined,
    shouldNotSaveMasterPasswordIfNoDeviceKeys = false
): Promise<{
    db: Database.Database;
    secrets: Secrets;
}> => {
    const db = connect();
    db.serialize();

    // Create the tables and load the deviceKeys if it exists
    const deviceKeys = prepareDB({ db });
    const secrets = await getSecrets(db, deviceKeys, shouldNotSaveMasterPasswordIfNoDeviceKeys);

    if (deviceKeys && deviceKeys.version !== cliVersionToString(CLI_VERSION)) {
        const version = stringToCliVersion(deviceKeys.version);

        let breakingChanges = false;
        if (version instanceof Error) {
            breakingChanges = true;
            winston.debug(`Error in CLI version: ${version.message}`);
        } else {
            breakingChanges = cliVersionLessThan(CLI_VERSION, version);
            for (const breakingVersion of breakingChangesVersions) {
                if (cliVersionLessThan(version, breakingVersion)) {
                    breakingChanges = true;
                    break;
                }
            }
        }
        if (breakingChanges) {
            if (!(await askIgnoreBreakingChanges())) {
                await reset({ db, secrets });
                db.close();
                return connectAndPrepare(undefined, shouldNotSaveMasterPasswordIfNoDeviceKeys);
            }
        }
        db.prepare('UPDATE device SET version = ? WHERE login = ?')
            .bind(cliVersionToString(CLI_VERSION), deviceKeys.login)
            .run();
    }

    if (autoSync || deviceKeys?.autoSync !== 0) {
        const lastClientSyncTimestamp =
            (
                db.prepare('SELECT lastClientSyncTimestamp FROM syncUpdates WHERE login = ?').get(secrets.login) as {
                    lastClientSyncTimestamp?: number;
                }
            )?.lastClientSyncTimestamp || 0;

        // If there were no updates during last hour, synchronize the vault
        if (Date.now() / 1000 - lastClientSyncTimestamp > 3600) {
            await sync({ db, secrets });
        }
    }

    return {
        db,
        secrets,
    };
};
