import { requestAppApi } from '../requestApi.js';

interface PerformTotpVerification {
    login: string;
    otp: string;
}

export interface PerformTotpVerificationOutput {
    /**
     * Authentication ticket usable several time
     */
    authTicket: string;
}

export const performTotpVerification = (params: PerformTotpVerification) =>
    requestAppApi<PerformTotpVerificationOutput>({
        path: 'authentication/PerformTotpVerification',
        payload: {
            login: params.login,
            otp: params.otp,
            activationFlow: false,
        },
    });
