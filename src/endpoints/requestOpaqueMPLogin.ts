import { requestUserApi } from '../requestApi.js';
import { DeviceCredentials } from '../types.js';

interface requestOpaqueMPLoginParams {
    deviceCredentials: DeviceCredentials;
    loginRequest: string;
}

export interface requestOpaqueMPLoginOutput {
    loginResponse: string;
    opaqueMPLoginFlowId: string;
}

export const requestOpaqueMPLogin = (params: requestOpaqueMPLoginParams) =>
    requestUserApi<requestOpaqueMPLoginOutput>({
        path: 'authentication/RequestOpaqueMPLogin',
        payload: {
            loginRequest: params.loginRequest,
        },
        login: params.deviceCredentials.login,
        deviceKeys: {
            accessKey: params.deviceCredentials.accessKey,
            secretKey: params.deviceCredentials.secretKey,
        },
    });
