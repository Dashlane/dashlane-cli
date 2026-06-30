import { requestUserApi } from '../requestApi.js';
import { DeviceCredentials } from '../types.js';

interface completeOpaqueMPLoginParams {
    deviceCredentials: DeviceCredentials;
    finishLoginRequest: string;
    opaqueMPLoginFlowId: string;
}

export interface completeOpaqueMPLoginOutput {
    loginResponse: string;
    opaqueMPLoginFlowId: string;
}

export const completeOpaqueMPLogin = (params: completeOpaqueMPLoginParams) =>
    requestUserApi<completeOpaqueMPLoginOutput>({
        path: 'authentication/CompleteOpaqueMPLogin',
        payload: {
            finishLoginRequest: params.finishLoginRequest,
            opaqueMPLoginFlowId: params.opaqueMPLoginFlowId,
        },
        login: params.deviceCredentials.login,
        deviceKeys: {
            accessKey: params.deviceCredentials.accessKey,
            secretKey: params.deviceCredentials.secretKey,
        },
    });
