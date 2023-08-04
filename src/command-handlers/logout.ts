import { Database } from 'better-sqlite3';
import winston from 'winston';
import { deactivateDevices } from '../endpoints';
import { connectAndPrepare, connect, reset } from '../modules/database';
import { Secrets, DeviceConfiguration } from '../types';
import { askConfirmReset } from '../utils';

export const runLogout = async () => {
    const resetConfirmation = await askConfirmReset();
    if (!resetConfirmation) {
        return;
    }

    let db: Database;
    let secrets: Secrets | undefined;
    let deviceConfiguration: DeviceConfiguration | null | undefined;
    try {
        ({ db, secrets, deviceConfiguration } = await connectAndPrepare({
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
    if (secrets && deviceConfiguration) {
        await deactivateDevices({
            deviceIds: [deviceConfiguration.accessKey],
            login: deviceConfiguration.login,
            secrets,
        }).catch((error) => console.error('Unable to deactivate the device', error));
    }
    reset({ db, secrets });
    console.log('The local Dashlane local storage has been reset and you have been logged out');
    db.close();
};
