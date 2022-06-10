import { requestApi } from '../requestApi';

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
    requestApi<PerformDuoPushVerificationOutput>({
        path: 'authentication/PerformDuoPushVerification',
        login: params.login,
        payload: { login: params.login },
    });
