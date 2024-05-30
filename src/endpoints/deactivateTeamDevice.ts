import { LocalConfiguration } from '../types.js';
import { requestUserApi } from '../requestApi.js';

export interface DeactivateTeamDeviceParams {
    teamDeviceAccessKey: string;
    localConfiguration: LocalConfiguration;
}

export const deactivateTeamDevice = (params: DeactivateTeamDeviceParams) =>
    requestUserApi<DeactivateTeamDeviceOutput>({
        path: 'teams/DeactivateTeamDevice',
        login: params.localConfiguration.login,
        deviceKeys: {
            accessKey: params.localConfiguration.accessKey,
            secretKey: params.localConfiguration.secretKey,
        },
        payload: {
            teamDeviceAccessKey: params.teamDeviceAccessKey,
        },
    });

export interface DeactivateTeamDeviceOutput {}
