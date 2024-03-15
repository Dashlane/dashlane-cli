import { CouldNotFindTeamCredentialsError, TeamCredentialsWrongFormatError } from '../errors';
import { TeamDeviceCredentials } from '../types';

let teamDeviceCredentials: TeamDeviceCredentials | null = null;

export const initTeamDeviceCredentials = (): TeamDeviceCredentials | null => {
    const { DASHLANE_TEAM_DEVICE_KEYS } = process.env;
    if (DASHLANE_TEAM_DEVICE_KEYS) {
        if (!DASHLANE_TEAM_DEVICE_KEYS.startsWith('dlt_')) {
            throw new TeamCredentialsWrongFormatError();
        }

        const [accessKey, payloadB64] = DASHLANE_TEAM_DEVICE_KEYS.split('_').slice(1);

        // TODO: Run AJV validation on the payload
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8')) as {
            teamUuid: string;
            deviceSecretKey: string;
        };

        teamDeviceCredentials = {
            uuid: payload.teamUuid,
            accessKey,
            secretKey: payload.deviceSecretKey,
        };
    }
    return teamDeviceCredentials;
};

export const getTeamDeviceCredentials = (): TeamDeviceCredentials => {
    if (!teamDeviceCredentials) {
        throw new CouldNotFindTeamCredentialsError();
    }

    return teamDeviceCredentials;
};
