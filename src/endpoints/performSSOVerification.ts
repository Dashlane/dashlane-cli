import { requestAppApi } from '../requestApi';

interface PerformSsoVerificationPayload {
    /** The login of the user */
    login: string;
    /** The SSO token */
    ssoToken: string;
}

export interface PerformSsoVerificationBodyData {
    /** Authentication ticket usable several time */
    authTicket: string;
}

export const performSSOVerification = (params: PerformSsoVerificationPayload) =>
    requestAppApi<PerformSsoVerificationBodyData>({
        path: 'authentication/PerformSsoVerification',
        payload: {
            login: params.login,
            ssoToken: params.ssoToken,
        },
    });
