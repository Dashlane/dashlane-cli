import { requestAppApi } from '../requestApi.js';

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
    requestAppApi<PerformEmailTokenVerificationOutput>({
        path: 'authentication/PerformEmailTokenVerification',
        payload: { login: params.login, token: params.token },
    });
