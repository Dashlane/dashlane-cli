import { requestUserApi } from '../requestApi';
import { Secrets } from '../types';

interface ListDeviceParams {
    secrets: Secrets;
    login: string;
}

export interface ListDevicesOutput {
    pairingGroups: {
        pairingGroupUUID: string;
        /**
         * A computed name for the pairing group null if we don't manage to compute one.
         */
        name: string;
        /**
         * A computed platform for the pairing group null if we don't manage to compute one.
         */
        platform: string;
        devices: string[];
        isBucketOwner?: boolean;
    }[];
    /**
     * @minItems 1
     */
    devices: {
        deviceId: string;
        deviceName: null | string;
        devicePlatform: null | string;
        creationDateUnix: number;
        lastUpdateDateUnix: number;
        lastActivityDateUnix: number;
        temporary: boolean;
        /**
         * FALSE if the device is in a pairing group with isBucketOwner = true
         */
        isBucketOwner?: boolean;
    }[];
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
