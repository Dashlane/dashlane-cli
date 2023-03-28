import { connectAndPrepare } from '../database';
import { deactivateDevices, listDevices } from '../endpoints';
import { reset } from '../middleware';
import { askConfirmRemoveAllDevices } from '../utils';

export async function listAllDevices() {
    const { secrets, deviceConfiguration } = await connectAndPrepare({ autoSync: false });
    if (!deviceConfiguration) {
        throw new Error('Require to be connected');
    }
    const devices = await listDevices({ secrets, login: deviceConfiguration.login });

    // order by last activity, ascending.
    devices.devices.sort((a, b) => a.lastActivityDateUnix - b.lastActivityDateUnix);

    // print results
    for (const device of devices.devices) {
        console.log([device.deviceId, device.deviceName, device.devicePlatform].join('\t'));
    }
}

export async function removeAllDevices() {
    const confirmation = await askConfirmRemoveAllDevices();
    if (!confirmation) {
        return;
    }

    const { secrets, deviceConfiguration, db } = await connectAndPrepare({ autoSync: false });
    if (!deviceConfiguration) {
        throw new Error('Requires to be connected');
    }
    const devices = await listDevices({ secrets, login: deviceConfiguration.login });
    const deviceIdsToDelete = devices.devices.map((d) => d.deviceId);
    await deactivateDevices({
        deviceIds: deviceIdsToDelete,
        login: deviceConfiguration.login,
        secrets,
        pairingGroupIds: [],
    });
    reset({ db, secrets });
    db.close();
}
