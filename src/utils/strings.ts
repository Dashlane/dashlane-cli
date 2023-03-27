import { TeamDeviceCredentials } from '../types';

export const notEmpty = <TValue>(value: TValue | null | undefined): value is TValue => {
    return value !== null && value !== undefined;
};

export const parseBooleanString = (booleanString: string): boolean => {
    if (booleanString === 'true') {
        return true;
    } else if (booleanString === 'false') {
        return false;
    }
    throw new Error("The provided boolean variable should be either 'true' or 'false'");
};

// TODO move this somewhere else
export const getTeamDeviceCredentialsFromEnv = (): TeamDeviceCredentials | null => {
    const { DASHLANE_TEAM_UUID, DASHLANE_TEAM_ACCESS_KEY, DASHLANE_TEAM_SECRET_KEY } = process.env;
    if (DASHLANE_TEAM_UUID && DASHLANE_TEAM_ACCESS_KEY && DASHLANE_TEAM_SECRET_KEY) {
        return {
            uuid: DASHLANE_TEAM_UUID,
            accessKey: DASHLANE_TEAM_ACCESS_KEY,
            secretKey: DASHLANE_TEAM_SECRET_KEY,
        };
    } else {
        return null;
    }
};
