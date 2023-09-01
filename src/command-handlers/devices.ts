import winston from 'winston';
import { connectAndPrepare, reset } from '../modules/database/index.js';
import { deactivateDevices, listDevices, ListDevicesOutput } from '../endpoints/index.js';
import { askConfirmReset, epochTimestampToIso } from '../utils/index.js';
import { registerDevice } from '../modules/auth/index.js';
import { get2FAStatusUnauthenticated } from '../endpoints/get2FAStatusUnauthenticated.js';

type OutputDevice = ListDevicesOutput['devices'][number] & {
    isCurrentDevice: boolean;
};

export async function listAllDevices(options: { json: boolean }) {
    const { secrets, deviceConfiguration, db } = await connectAndPrepare({ autoSync: false });
    if (!deviceConfiguration) {
        throw new Error('Require to be connected');
    }
    const listDevicesResponse = await listDevices({ secrets, login: deviceConfiguration.login });
    db.close();

    const result: OutputDevice[] = listDevicesResponse.devices.map(
        (device) => <OutputDevice>{ ...device, isCurrentDevice: device.deviceId === secrets.accessKey }
    );

    if (options.json) {
        console.log(JSON.stringify(result));
    } else {
        // order by last activity, ascending.
        // we sort it only on non-json because it is likely that it will be used
        // for human consumption
        result.sort((a, b) => a.lastActivityDateUnix - b.lastActivityDateUnix);

        const printableResult = result.map((device) => {
            return {
                id: device.deviceId,
                name: device.deviceName,
                platform: device.devicePlatform,
                lastActivity: epochTimestampToIso(device.lastActivityDateUnix),
                current: device.isCurrentDevice,
            };
        });

        console.table(printableResult);
    }
}

export async function removeAllDevices(devices: string[] | null, options: { all: boolean; others: boolean }) {
    if (devices && devices.length > 0 && (options.all || options.others)) {
        throw new Error('Devices cannot be specified when you use --all or --others');
    }
    if (options.all && options.others) {
        throw new Error('Please use either --all, either --others, but not both');
    }

    const { secrets, deviceConfiguration, db } = await connectAndPrepare({ autoSync: false });
    if (!deviceConfiguration) {
        throw new Error('Requires to be connected');
    }

    const listDevicesResponse = await listDevices({ secrets, login: deviceConfiguration.login });
    const existingDeviceIds = listDevicesResponse.devices.map((device) => device.deviceId);

    if (options.all) {
        devices = existingDeviceIds;
    } else if (options.others) {
        devices = existingDeviceIds.filter((d) => d != secrets.accessKey);
    } else if (!devices) {
        // if there is no devices provided, well we will have an easy job
        // let's not fail
        devices = [];
    }

    const notFoundDevices = devices.filter((device) => !existingDeviceIds.includes(device));
    if (notFoundDevices.length > 0) {
        throw new Error(`These devices do not exist: ${notFoundDevices.join('\t')}`);
    }

    const shouldReset = devices.includes(secrets.accessKey);

    if (shouldReset) {
        const confirmation = await askConfirmReset();
        if (!confirmation) {
            return;
        }
    }

    await deactivateDevices({
        deviceIds: devices,
        login: deviceConfiguration.login,
        secrets,
    });

    if (shouldReset) {
        reset({ db, secrets });
    }
    db.close();
}

export const registerNonInteractiveDevice = async (deviceName: string, options: { json: boolean }) => {
    const {
        secrets: { login },
        db,
    } = await connectAndPrepare({ autoSync: false });

    const { type } = await get2FAStatusUnauthenticated({ login });

    if (type === 'totp_login') {
        throw new Error("You can't register a non-interactive device when you have OTP at each login enabled.");
    }

    if (type === 'sso') {
        throw new Error("You can't register a non-interactive device when you are using SSO.");
    }

    const { deviceAccessKey, deviceSecretKey } = await registerDevice({
        login,
        deviceName: `Non-Interactive - ${deviceName}`,
    });

    if (options.json) {
        console.log(
            JSON.stringify({
                DASHLANE_DEVICE_ACCESS_KEY: deviceAccessKey,
                DASHLANE_DEVICE_SECRET_KEY: deviceSecretKey,
            })
        );
    } else {
        winston.info('The device credentials have been generated, save and run the following commands to export them:');
        console.log(`export DASHLANE_DEVICE_ACCESS_KEY=${deviceAccessKey}`);
        console.log(`export DASHLANE_DEVICE_SECRET_KEY=${deviceSecretKey}`);
        console.log(`export DASHLANE_LOGIN=${login}`);
        console.log(`export DASHLANE_MASTER_PASSWORD=<insert your master password here>`);
    }

    db.close();
};
