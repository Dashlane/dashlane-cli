import { requestUserApi } from '../requestApi';
import { Secrets } from '../types';

interface ListDeviceParams {
    secrets: Secrets;
    login: string;
}

export interface Device {
    deviceId: string;
    deviceName: string;
    devicePlatform: string;
    creationDateUnix: number;
    lastUpdateDateUnix: number;
    lastActivityDateUnix: number;
    temporary: boolean;
    isBucketOwner: boolean;
}
export interface ListDevicesOutput {
    devices: Device[];
}

export const listDevices = (params: ListDeviceParams) =>
    requestUserApi<ListDevicesOutput>({
        path: 'devices/ListDevices',
        payload: {},
        login: params.login,
        deviceKeys: {
            accessKey: params.secrets.accessKey,
            secretKey: params.secrets.secretKey,
        },
    });
