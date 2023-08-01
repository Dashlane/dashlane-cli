import os from 'os';
import { CLI_VERSION, cliVersionToString } from '../cliVersion';
import { requestAppApi } from '../requestApi';

interface CompleteDeviceRegistration {
    login: string;
    authTicket: string;
}

export interface CompleteDeviceRegistrationWithAuthTicketOutput {
    /**
     * The generated device access key
     */
    deviceAccessKey: string;
    /**
     * The device secret key
     */
    deviceSecretKey: string;
    settings: {
        /** Version of the transaction (for treatproblems) */
        backupDate: number;
        /** Identifiers (GUID or special identifiers XXXXXXXX_userId for unique objects) */
        identifier: string;
        /** User local timestamp of the latest modification of this item */
        time: number;
        /** Base 64 encoded content of the object */
        content: string;
        type: 'SETTINGS';
        /** Whether this transaction is to EDIT(/ADD) an object or REMOVE it */
        action: 'BACKUP_EDIT';
    };
    /**
     * When provided, this will set or update the sharing keys
     * @example {"privateKey":"","publicKey":""}
     */
    sharingKeys?: {
        privateKey: string;
        publicKey: string;
    };
    /** Remote keys */
    remoteKeys?: {
        uuid: string;
        key: string;
        type: 'sso' | 'master_password';
    }[];
    /** Number of non temporary devices */
    numberOfDevices: number;
    /** Is a desktop device already registered. */
    hasDesktopDevices: boolean;
    /** User public identifier */
    publicUserId: string;
    /** Unique identifier for user used to log data analytics */
    userAnalyticsId: string;
    /** Unique identifier for device used to log data analytics */
    deviceAnalyticsId: string;
    /** SSO server key, if the user is an SSO User */
    ssoServerKey?: string;
    /** Server key used to decipher local data, if the user has OTP for login */
    serverKey?: string;
}

export const completeDeviceRegistration = (params: CompleteDeviceRegistration) =>
    requestAppApi<CompleteDeviceRegistrationWithAuthTicketOutput>({
        path: 'authentication/CompleteDeviceRegistrationWithAuthTicket',
        payload: {
            device: {
                deviceName: `${os.hostname()} - ${os.platform()}-${os.arch()}`,
                appVersion: `${cliVersionToString(CLI_VERSION)}`,
                platform: 'server_cli',
                osCountry: 'en_US',
                osLanguage: 'en_US',
                temporary: false,
            },
            login: params.login,
            authTicket: params.authTicket,
        },
    });
