import { LocalConfiguration } from '../types';
import { requestUserApi } from '../requestApi';

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
