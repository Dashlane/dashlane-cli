import Database from 'better-sqlite3';

import { Secrets } from '../types';
import { prepareDB } from './prepare';
import { connect } from './connect';
import { getSecrets } from '../crypto';
import { sync } from '../middleware/sync';
import { breakingChangesVersions, CLI_VERSION, cliVersionToString, lessThan, stringToCliVersion } from '../cliVersion';
import { askIgnoreBreakingChanges } from '../utils/dialogs';
import { reset } from '../middleware/reset';

export const connectAndPrepare = async (
    autoSync: boolean,
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

        let breakingChanges = lessThan(CLI_VERSION, version);
        for (const breakingVersion of breakingChangesVersions) {
            if (lessThan(version, breakingVersion)) {
                breakingChanges = true;
                break;
            }
        }
        if (breakingChanges) {
            if (!(await askIgnoreBreakingChanges())) {
                await reset({ db, secrets });
                db.close();
                return connectAndPrepare(autoSync, shouldNotSaveMasterPasswordIfNoDeviceKeys);
            }
        }
        db.prepare('UPDATE device SET version = ? WHERE login = ?')
            .bind(cliVersionToString(CLI_VERSION), deviceKeys.login)
            .run();
    }

    if (autoSync) {
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
