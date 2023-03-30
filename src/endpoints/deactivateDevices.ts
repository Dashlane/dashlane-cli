import { requestUserApi } from '../requestApi';
import { Secrets } from '../types';

interface DeactivateDevicesParams {
    secrets: Secrets;
    login: string;

    /**
     * List of deviceIds to deactivate
     */
    deviceIds?: string[];
    /**
     * List of pairingGroupIds to deactivate
     */
    pairingGroupIds?: string[];
}

export interface DeactivateDevicesOutput {}

export const deactivateDevices = (params: DeactivateDevicesParams) =>
    requestUserApi<DeactivateDevicesOutput>({
        path: 'devices/DeactivateDevices',
        payload: {
            deviceIds: params.deviceIds,
            pairingGroupIds: params.pairingGroupIds,
        },
        login: params.login,
        deviceKeys: {
            accessKey: params.secrets.accessKey,
            secretKey: params.secrets.secretKey,
        },
    });
