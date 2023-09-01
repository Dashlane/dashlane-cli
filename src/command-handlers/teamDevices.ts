import { connectAndPrepare } from '../modules/database/index.js';
import { listTeamDevices } from '../endpoints/index.js';
import { epochTimestampToIso } from '../utils/index.js';

export async function listAllTeamDevices(options: { json: boolean }) {
    const { db, secrets } = await connectAndPrepare({ autoSync: false });

    const listTeamDevicesResponse = await listTeamDevices({ secrets });

    db.close();

    if (options.json) {
        const result = listTeamDevicesResponse.teamDevices.map((device) => {
            return {
                accessKey: device.accessKey,
                deviceName: device.deviceName,
                platform: device.platform,
                creationDateUnix: device.creationDateUnix,
                updateDateUnix: device.updateDateUnix,
                lastActivityDateUnix: device.lastActivityDateUnix,
            };
        });

        console.log(JSON.stringify(result));
        return;
    }

    const result = listTeamDevicesResponse.teamDevices
        .sort((a, b) => a.creationDateUnix - b.creationDateUnix)
        .map((device) => {
            return {
                accessKey: device.accessKey,
                name: device.deviceName,
                platform: device.platform,
                creationDate: epochTimestampToIso(device.creationDateUnix),
                updateDate: epochTimestampToIso(device.updateDateUnix),
                lastActivityDate: epochTimestampToIso(device.lastActivityDateUnix),
            };
        });

    console.table(result);
}
