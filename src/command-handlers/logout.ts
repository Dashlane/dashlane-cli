import { Database } from 'better-sqlite3';
import { deactivateDevices } from '../endpoints';
import { connectAndPrepare, connect, reset } from '../modules/database';
import { LocalConfiguration, DeviceConfiguration } from '../types';
import { askConfirmReset } from '../utils';
import { logger } from '../logger';

export const runLogout = async (options: { ignoreRevocation: boolean }) => {
    if (options.ignoreRevocation) {
        logger.info("The device credentials won't be revoked on Dashlane's servers.");
    }

    const resetConfirmation = await askConfirmReset();
    if (!resetConfirmation) {
        return;
    }

    let db: Database;
    let localConfiguration: LocalConfiguration | undefined;
    let deviceConfiguration: DeviceConfiguration | null | undefined;
    try {
        ({ db, localConfiguration, deviceConfiguration } = await connectAndPrepare({
            autoSync: false,
            failIfNoDB: true,
        }));
    } catch (error) {
        let errorMessage = 'unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        logger.debug(`Unable to read device configuration during logout: ${errorMessage}`);

        db = connect();
        db.serialize();
    }
    if (localConfiguration && deviceConfiguration && !options.ignoreRevocation) {
        await deactivateDevices({
            deviceIds: [deviceConfiguration.accessKey],
            login: deviceConfiguration.login,
            localConfiguration,
        }).catch((error) => logger.error('Unable to deactivate the device', error));
    }
    reset({ db, localConfiguration });
    logger.success('The local Dashlane local storage has been reset and you have been logged out.');
    db.close();
};
