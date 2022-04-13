import { requestApi } from '../requestApi.js';

interface PerformEmailTokenVerification {
    login: string;
    token: string;
}

export interface PerformEmailTokenVerificationOutput {
    /**
     * Authentication ticket usable several time
     */
    authTicket: string;
}

export const performEmailTokenVerification = (params: PerformEmailTokenVerification) =>
    requestApi<PerformEmailTokenVerificationOutput>({
        path: 'authentication/PerformEmailTokenVerification',
        login: params.login,
        payload: { login: params.login, token: params.token },
    });
