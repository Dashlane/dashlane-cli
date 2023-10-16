import { Database } from 'better-sqlite3';
import winston from 'winston';
import { deactivateDevices } from '../endpoints';
import { connectAndPrepare, connect, reset } from '../modules/database';
import { LocalConfiguration, DeviceConfiguration } from '../types';
import { askConfirmReset } from '../utils';

export const runLogout = async () => {
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
        winston.debug(`Unable to read device configuration during logout: ${errorMessage}`);

        db = connect();
        db.serialize();
    }
    if (localConfiguration && deviceConfiguration) {
        await deactivateDevices({
            deviceIds: [deviceConfiguration.accessKey],
            login: deviceConfiguration.login,
            localConfiguration,
        }).catch((error) => console.error('Unable to deactivate the device', error));
    }
    reset({ db, localConfiguration });
    console.log('The local Dashlane local storage has been reset and you have been logged out');
    db.close();
};
