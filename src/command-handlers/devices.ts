import { connectAndPrepare } from '../database';
import { deactivateDevices, listDevices, ListDevicesOutput } from '../endpoints';
import { reset } from '../middleware';
import { askConfirmReset, unixTimestampToHumanReadable } from '../utils';

type OutputDevice = ListDevicesOutput['devices'][number] & {
    isCurrentDevice: boolean;
};

export async function listAllDevices(options: { json: boolean }) {
    const { secrets, deviceConfiguration } = await connectAndPrepare({ autoSync: false });
    if (!deviceConfiguration) {
        throw new Error('Require to be connected');
    }
    const listDevicesResponse = await listDevices({ secrets, login: deviceConfiguration.login });
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
                lastActivity: unixTimestampToHumanReadable(device.lastActivityDateUnix),
                current: device.isCurrentDevice,
            };
        });

        console.table(printableResult);
    }
}

export async function removeAllDevices(devices: string[] | null, options: { all: boolean; others: boolean }) {
    if (devices && devices.length > 0 && (options.all || options.others)) {
        throw new Error('devices cannot be specified when you use --all or --others');
    }
    if (options.all && options.others) {
        throw new Error('Please use either --all, either --other, but not both');
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

    const shouldReset = devices.includes(secrets.accessKey);

    if (shouldReset) {
        const confirmation = await askConfirmReset();
        if (!confirmation) {
            return;
        }
    }
    const notFoundDevices = devices.filter((d) => !existingDeviceIds.includes(d));
    if (notFoundDevices.length > 0) {
        throw new Error(`These devices do not exist: ${notFoundDevices.join('\t')}`);
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
