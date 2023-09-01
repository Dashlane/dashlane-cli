import { Secrets } from '../types.js';
import { requestUserApi } from '../requestApi.js';

export interface RegisterTeamDeviceParams {
    deviceName: string;
    secrets: Secrets;
}

export const registerTeamDevice = (params: RegisterTeamDeviceParams) =>
    requestUserApi<RegisterTeamDeviceOutput>({
        path: 'teams/RegisterTeamDevice',
        login: params.secrets.login,
        deviceKeys: {
            accessKey: params.secrets.accessKey,
            secretKey: params.secrets.secretKey,
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
     * The registered device secret key. Must be stored securely and never transmited over the network
     */
    deviceSecretKey: string;
}
