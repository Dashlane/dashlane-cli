import { requestAppApi } from '../requestApi.js';

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
    requestAppApi<PerformDashlaneAuthenticatorVerificationOutput>({
        path: 'authentication/PerformDashlaneAuthenticatorVerification',
        payload: { login: params.login },
    });
