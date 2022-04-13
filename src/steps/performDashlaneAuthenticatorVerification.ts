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

export const performDashlaneAuthenticatorVerification = (
    params: PerformDashlaneAuthenticatorVerification
): Promise<PerformDashlaneAuthenticatorVerificationOutput> =>
    requestApi({
        path: 'authentication/PerformDashlaneAuthenticatorVerification',
        login: params.login,
        payload: { login: params.login }
    });
