import { requestApi } from '../requestApi';

interface CompleteDeviceRegistration {
    login: string;
    authTicket: string;
}

export interface CompleteDeviceRegistrationOutput {
    /**
     * The registered device access key. Must be stored unencrypted as it is required to log in
     */
    deviceAccessKey: string;
    /**
     * The registered device secret key. Must be stored securely and never transmitted over the network
     */
    deviceSecretKey: string;
    /**
     * The Master Password encryption key in base 64
     */
    mpEncryptionKey?: string;
    /**
     * The signed external authentication token for externalToken authentication in base 64
     */
    signedExternalAuthenticationToken?: {
        /**
         * External token provided by the partner
         */
        token: string;
        /**
         * Base 64 encoded signature
         */
        signature: string;
        [k: string]: any;
    };
    /**
     * Remote keys
     */
    remoteKeys?: {
        uuid: string;
        key: string;
        type: 'sso' | 'master_password';
    }[];
    [k: string]: any;
}

export const completeDeviceRegistration = (params: CompleteDeviceRegistration) =>
    requestApi<CompleteDeviceRegistrationOutput>({
        path: 'authentication/CompleteDeviceRegistrationWithAuthTicket',
        login: params.login,
        payload: {
            device: {
                deviceName: 'Dashlane CLI',
                appVersion: '1.0.0-cli',
                platform: 'server_standalone',
                osCountry: 'en_US',
                osLanguage: 'en_US',
                temporary: false,
            },
            login: params.login,
            authTicket: params.authTicket,
        },
    });
