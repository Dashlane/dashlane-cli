import { connectAndPrepare } from '../modules/database';
import { listTeamDevices, registerTeamDevice } from '../endpoints';
import { epochTimestampToIso } from '../utils';
import { logger } from '../logger';

export const listAllTeamDevices = async (options: { json: boolean }) => {
    const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });

    const listTeamDevicesResponse = await listTeamDevices({ localConfiguration });

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

        logger.content(JSON.stringify(result));
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
};

export const createTeamDevice = async () => {
    const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });
    const credentials = await registerTeamDevice({ localConfiguration, deviceName: 'Dashlane CLI' });
    db.close();

    const teamDeviceKeysPayload = {
        teamUuid: credentials.teamUuid,
        deviceSecretKey: credentials.deviceSecretKey,
    };

    const teamDeviceKeysPayloadB64 = Buffer.from(JSON.stringify(teamDeviceKeysPayload)).toString('base64');

    const deviceAccountKey = `dlt_${credentials.deviceAccessKey}_${teamDeviceKeysPayloadB64}`;

    return deviceAccountKey;
};
