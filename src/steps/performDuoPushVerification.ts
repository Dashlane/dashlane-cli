import { requestApi } from '../requestApi.js';

interface PerformDuoPushVerification {
    login: string;
}

export interface PerformDuoPushVerificationOutput {
    /**
     * Authentication ticket usable several time
     */
    authTicket: string;
}

export const performDuoPushVerification =
    (params: PerformDuoPushVerification): Promise<PerformDuoPushVerificationOutput> =>
        requestApi({
            path: 'authentication/PerformDuoPushVerification',
            login: params.login,
            payload: { login: params.login },
        });
