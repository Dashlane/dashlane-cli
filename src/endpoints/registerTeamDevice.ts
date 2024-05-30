import { LocalConfiguration } from '../types.js';
import { requestUserApi } from '../requestApi.js';

export interface RegisterTeamDeviceParams {
    deviceName: string;
    localConfiguration: LocalConfiguration;
}

export const registerTeamDevice = (params: RegisterTeamDeviceParams) =>
    requestUserApi<RegisterTeamDeviceOutput>({
        path: 'teams/RegisterTeamDevice',
        login: params.localConfiguration.login,
        deviceKeys: {
            accessKey: params.localConfiguration.accessKey,
            secretKey: params.localConfiguration.secretKey,
        },
        payload: {
            platform: 'command_line',
            deviceName: params.deviceName,
        },
    });

export interface RegisterTeamDeviceOutput {
    /**
     * team identifier
     */
    teamUuid: string;
    /**
     * The registered device access key. Must be stored unencrypted as it is required to log in
     */
    deviceAccessKey: string;
    /**
     * The registered device secret key. Must be stored securely and never transmitted over the network
     */
    deviceSecretKey: string;
}
