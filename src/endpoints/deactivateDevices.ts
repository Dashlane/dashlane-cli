import { requestUserApi } from '../requestApi';
import { LocalConfiguration } from '../types';

interface DeactivateDevicesParams {
    localConfiguration: LocalConfiguration;
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
            accessKey: params.localConfiguration.accessKey,
            secretKey: params.localConfiguration.secretKey,
        },
    });
