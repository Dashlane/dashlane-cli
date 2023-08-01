import { connectAndPrepare } from '../database';
import { listTeamDevices } from '../endpoints';
import { unixTimestampToHumanReadable } from '../utils';

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
    } else {
        const result = listTeamDevicesResponse.teamDevices
            .sort((a, b) => a.creationDateUnix - b.creationDateUnix)
            .map((device) => {
                return {
                    accessKey: device.accessKey,
                    name: device.deviceName,
                    platform: device.platform,
                    creationDate: unixTimestampToHumanReadable(device.creationDateUnix),
                    updateDate: unixTimestampToHumanReadable(device.updateDateUnix),
                    lastActivityDate: unixTimestampToHumanReadable(device.lastActivityDateUnix),
                };
            });

        // print results
        console.table(result);
    }
}
