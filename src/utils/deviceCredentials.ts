import { DeviceCredentialsWrongFormatError } from '../errors.js';
import { DeviceCredentials } from '../types.js';

let deviceCredentials: DeviceCredentials | null = null;

export const hasEnvDeviceCredentials = (): boolean => Boolean(process.env.DASHLANE_SERVICE_DEVICE_KEYS);

export const initDeviceCredentialsFromEnv = (): DeviceCredentials | null => {
    const { DASHLANE_SERVICE_DEVICE_KEYS } = process.env;

    if (!DASHLANE_SERVICE_DEVICE_KEYS) {
        deviceCredentials = null;
        return null;
    }

    if (!DASHLANE_SERVICE_DEVICE_KEYS.startsWith('dls_')) {
        throw new DeviceCredentialsWrongFormatError();
    }

    const [accessKey, payloadB64] = DASHLANE_SERVICE_DEVICE_KEYS.split('_').slice(1);

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8')) as {
        login: string;
        deviceSecretKey: string;
        masterPassword: string;
    };

    deviceCredentials = {
        login: payload.login,
        accessKey,
        secretKey: payload.deviceSecretKey,
        masterPassword: payload.masterPassword,
    };

    return deviceCredentials;
};

export const getEnvDeviceCredentials = (): DeviceCredentials | null => {
    return deviceCredentials;
};
