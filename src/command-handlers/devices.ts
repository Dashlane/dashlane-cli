import { connectAndPrepare, reset } from '../modules/database/index.js';
import { deactivateDevices, listDevices, ListDevicesOutput } from '../endpoints/index.js';
import { askConfirmReset, askEmailAddress, epochTimestampToIso } from '../utils/index.js';
import { registerDevice } from '../modules/auth/index.js';
import { logger } from '../logger.js';

type OutputDevice = ListDevicesOutput['devices'][number] & {
    isCurrentDevice: boolean;
};

export async function listAllDevices(options: { json: boolean }) {
    const { localConfiguration, deviceConfiguration, db } = await connectAndPrepare({ autoSync: false });
    if (!deviceConfiguration) {
        throw new Error('Require to be connected');
    }
    const listDevicesResponse = await listDevices({ localConfiguration, login: deviceConfiguration.login });
    db.close();

    const result: OutputDevice[] = listDevicesResponse.devices.map(
        (device) => <OutputDevice>{ ...device, isCurrentDevice: device.deviceId === localConfiguration.accessKey }
    );

    if (options.json) {
        logger.content(JSON.stringify(result));
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

    const { localConfiguration, deviceConfiguration, db } = await connectAndPrepare({ autoSync: false });
    if (!deviceConfiguration) {
        throw new Error('Requires to be connected');
    }

    const listDevicesResponse = await listDevices({ localConfiguration, login: deviceConfiguration.login });
    const existingDeviceIds = listDevicesResponse.devices.map((device) => device.deviceId);

    if (options.all) {
        devices = existingDeviceIds;
    } else if (options.others) {
        devices = existingDeviceIds.filter((d) => d != localConfiguration.accessKey);
    } else if (!devices) {
        // if there is no devices provided, well we will have an easy job
        // let's not fail
        devices = [];
    }

    const notFoundDevices = devices.filter((device) => !existingDeviceIds.includes(device));
    if (notFoundDevices.length > 0) {
        throw new Error(`These devices do not exist: ${notFoundDevices.join('\t')}`);
    }

    const shouldReset = devices.includes(localConfiguration.accessKey);

    if (shouldReset) {
        const confirmation = await askConfirmReset();
        if (!confirmation) {
            return;
        }
    }

    await deactivateDevices({
        deviceIds: devices,
        login: deviceConfiguration.login,
        localConfiguration,
    });

    if (shouldReset) {
        reset({ db, localConfiguration });
    }
    db.close();
}

export const registerNonInteractiveDevice = async (deviceName: string, options: { json: boolean }) => {
    const login = await askEmailAddress();

    const { deviceAccessKey, deviceSecretKey, masterPassword } = await registerDevice({
        login,
        deviceName: `Non-Interactive - ${deviceName}`,
        isNonInteractiveDevice: true,
    });

    const serviceDeviceKeysPayload = {
        login,
        deviceSecretKey,
        masterPassword,
    };

    const serviceDeviceKeysPayloadB64 = Buffer.from(JSON.stringify(serviceDeviceKeysPayload)).toString('base64');

    const serviceDeviceKeys = `dls_${deviceAccessKey}_${serviceDeviceKeysPayloadB64}`;

    if (options.json) {
        logger.content(
            JSON.stringify({
                DASHLANE_SERVICE_DEVICE_KEYS: serviceDeviceKeys,
            })
        );
    } else {
        logger.success(
            'The device credentials have been generated, save and run the following command to export them:'
        );
        logger.content(`export DASHLANE_SERVICE_DEVICE_KEYS=${serviceDeviceKeys}`);
    }
};
