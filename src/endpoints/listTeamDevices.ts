import { requestUserApi } from '../requestApi';
import { Secrets } from '../types';

interface ListTeamDevicesParams {
    secrets: Secrets;
}

export interface ListTeamDevicesOutput {
    teamDevices: {
        creationDateUnix: number;
        updateDateUnix: number;
        teamId: number;
        deviceName: string | null;
        platform: string;
        version: string | null;
        activated: boolean;
        accessKey: string;
        configVersion: number | null;
        hasDraftConfig: boolean;
        lastStartDateUnix: number | null;
        hosting: string | null;
        media: string | null;
        hasLatestVersion: boolean;
        hasLatestConfig: boolean;
        lastActivityDateUnix: number | null;
    }[];
}

export const listTeamDevices = (params: ListTeamDevicesParams) =>
    requestUserApi<ListTeamDevicesOutput>({
        path: 'teams/ListTeamDevices',
        login: params.secrets.login,
        deviceKeys: {
            accessKey: params.secrets.accessKey,
            secretKey: params.secrets.secretKey,
        },
        payload: {},
    });
