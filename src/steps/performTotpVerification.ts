import { requestApi } from '../requestApi.js';

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
    requestApi<PerformTotpVerificationOutput>({
        path: 'authentication/PerformTotpVerification',
        login: params.login,
        payload: {
            login: params.login,
            otp: params.otp,
            activationFlow: false,
        },
    });
