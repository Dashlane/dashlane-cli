import { requestAppApi } from '../requestApi.js';

interface PerformDuoPushVerification {
    login: string;
}

export interface PerformDuoPushVerificationOutput {
    /**
     * Authentication ticket usable several time
     */
    authTicket: string;
}

export const performDuoPushVerification = (params: PerformDuoPushVerification) =>
    requestAppApi<PerformDuoPushVerificationOutput>({
        path: 'authentication/PerformDuoPushVerification',
        payload: { login: params.login },
    });
