import { DeviceCredentials } from '../types.js';

let deviceCredentials: DeviceCredentials | null = null;

export const initDeviceCredentials = (): DeviceCredentials | null => {
    const { DASHLANE_DEVICE_ACCESS_KEY, DASHLANE_DEVICE_SECRET_KEY, DASHLANE_LOGIN, DASHLANE_MASTER_PASSWORD } =
        process.env;
    if (DASHLANE_DEVICE_ACCESS_KEY && DASHLANE_DEVICE_SECRET_KEY && DASHLANE_LOGIN && DASHLANE_MASTER_PASSWORD) {
        deviceCredentials = {
            login: DASHLANE_LOGIN,
            accessKey: DASHLANE_DEVICE_ACCESS_KEY,
            secretKey: DASHLANE_DEVICE_SECRET_KEY,
            masterPassword: DASHLANE_MASTER_PASSWORD,
        };
    }
    return deviceCredentials;
};

export const getDeviceCredentials = (): DeviceCredentials | null => {
    return deviceCredentials;
};
