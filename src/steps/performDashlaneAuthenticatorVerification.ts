import { requestApi } from '../requestApi.js';

interface PerformDashlaneAuthenticatorVerification {
    login: string;
}

export interface PerformDashlaneAuthenticatorVerificationOutput {
    /**
     * Authentication ticket usable several time
     */
    authTicket: string;
}

export const performDashlaneAuthenticatorVerification = (params: PerformDashlaneAuthenticatorVerification) =>
    requestApi<PerformDashlaneAuthenticatorVerificationOutput>({
        path: 'authentication/PerformDashlaneAuthenticatorVerification',
        login: params.login,
        payload: { login: params.login },
    });
