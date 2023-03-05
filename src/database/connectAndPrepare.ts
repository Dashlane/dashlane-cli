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
import { DeviceConfiguration, Secrets } from '../types';
import { askIgnoreBreakingChanges } from '../utils/dialogs';

export interface ConnectAndPrepareParams {
    /* Is the vault automatically synchronized every hour */
    autoSync?: boolean;

    /* If the user logs in for the first time, does the master password not have to be saved */
    shouldNotSaveMasterPasswordIfNoDeviceKeys?: boolean;

    failIfNoDB?: true;
}

export const connectAndPrepare = async (
    params: ConnectAndPrepareParams
): Promise<{
    db: Database.Database;
    secrets: Secrets;
    deviceConfiguration: DeviceConfiguration | null;
}> => {
    const { autoSync, shouldNotSaveMasterPasswordIfNoDeviceKeys, failIfNoDB } = params;
    const db = connect();
    db.serialize();

    // Create the tables and load the deviceConfiguration if it exists
    const deviceConfiguration = prepareDB({ db });
    if (failIfNoDB && !deviceConfiguration) {
        throw new Error('No device registered in the database');
    }

    const secrets = await getSecrets(db, deviceConfiguration, shouldNotSaveMasterPasswordIfNoDeviceKeys);

    if (deviceConfiguration && deviceConfiguration.version !== cliVersionToString(CLI_VERSION)) {
        const version = stringToCliVersion(deviceConfiguration.version);

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
                reset({ db, secrets });
                db.close();
                return connectAndPrepare(params);
            }
        }
        db.prepare('UPDATE device SET version = ? WHERE login = ?')
            .bind(cliVersionToString(CLI_VERSION), deviceConfiguration.login)
            .run();
    }

    if (deviceConfiguration && ((autoSync === undefined && deviceConfiguration?.autoSync !== 0) || autoSync)) {
        const lastClientSyncTimestamp =
            (
                db.prepare('SELECT lastClientSyncTimestamp FROM syncUpdates WHERE login = ?').get(secrets.login) as {
                    lastClientSyncTimestamp?: number;
                }
            )?.lastClientSyncTimestamp || 0;

        // If there were no updates during last hour, synchronize the vault
        if (Date.now() / 1000 - lastClientSyncTimestamp > 3600) {
            await sync({ db, secrets, deviceConfiguration });
        }
    }

    return {
        db,
        secrets,
        deviceConfiguration,
    };
};
