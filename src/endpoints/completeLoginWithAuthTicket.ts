import { requestApi } from '../requestApi';

export interface CompleteLoginWithAuthTicketRequest {
    login: string;
    deviceAccessKey?: string;
    /**
     * The auth ticket
     * @pattern ^[0-9a-f]{64}$
     */
    authTicket: string;
}

export interface CompleteLoginWithAuthTicketOutput {
    remoteKeys?: {
        uuid: string;
        key: string;
        type: 'sso' | 'master_password';
    }[];
    /** SSO server key, if the user is an SSO User */
    ssoServerKey?: string;
    /** Server key used to decipher local data, if the user has OTP for login */
    serverKey?: string;
}

export const completeLoginWithAuthTicket = (params: CompleteLoginWithAuthTicketRequest) =>
    requestApi<CompleteLoginWithAuthTicketOutput>({
        path: 'authentication/CompleteLoginWithAuthTicket',
        login: params.login,
        payload: {
            login: params.login,
            authTicket: params.authTicket,
            deviceAccessKey: params.deviceAccessKey,
        },
    });
