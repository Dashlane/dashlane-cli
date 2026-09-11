import { requestAppApi } from '../requestApi.js';

interface PerformSsoVerificationWithAuthTicketPayload {
    authTicket: string;
    /** The login of the user */
    login: string;
    /** The SSO token */
    ssoToken: string;
}

export interface PerformSsoVerificationWithAuthTicketBodyData {
    /** Authentication ticket usable several time */
    authTicket: string;
}

export const performSSOVerificationWithAuthTicket = (params: PerformSsoVerificationWithAuthTicketPayload) =>
    requestAppApi<PerformSsoVerificationWithAuthTicketBodyData>({
        path: 'authentication/PerformSsoVerificationWithAuthTicket',
        payload: {
            authTicket: params.authTicket,
            login: params.login,
            ssoToken: params.ssoToken,
        },
    });
