import { CouldNotFindTeamCredentialsError } from '../errors';
import { TeamDeviceCredentials } from '../types';

let teamDeviceCredentials: TeamDeviceCredentials | null = null;

export const initTeamDeviceCredentials = (): TeamDeviceCredentials | null => {
    const { DASHLANE_TEAM_UUID, DASHLANE_TEAM_ACCESS_KEY, DASHLANE_TEAM_SECRET_KEY } = process.env;
    if (DASHLANE_TEAM_UUID && DASHLANE_TEAM_ACCESS_KEY && DASHLANE_TEAM_SECRET_KEY) {
        teamDeviceCredentials = {
            uuid: DASHLANE_TEAM_UUID,
            accessKey: DASHLANE_TEAM_ACCESS_KEY,
            secretKey: DASHLANE_TEAM_SECRET_KEY,
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
