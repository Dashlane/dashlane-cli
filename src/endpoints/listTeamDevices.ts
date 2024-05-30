import { requestUserApi } from '../requestApi.js';
import { LocalConfiguration } from '../types.js';

interface ListTeamDevicesParams {
    localConfiguration: LocalConfiguration;
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
        login: params.localConfiguration.login,
        deviceKeys: {
            accessKey: params.localConfiguration.accessKey,
            secretKey: params.localConfiguration.secretKey,
        },
        payload: {},
    });
