import { requestAppApi } from '../requestApi.js';

type PerformTokenVerification = {
    login: string;
    token: string;
    intent: 'new_device';
} & ({ tokenRequestId: string } | { deviceAccessKey: string });

export interface PerformTokenVerificationOutput {
    /**
     * Authentication ticket usable several time
     */
    authTicket: {
        ticket: string;
        expireDateUnix: number;
    };
}

export const performTokenVerification = (params: PerformTokenVerification) =>
    requestAppApi<PerformTokenVerificationOutput>({
        path: 'authentication/PerformTokenVerification',
        payload: {
            login: params.login,
            token: params.token,
            intent: params.intent,
            ...('tokenRequestId' in params ? { tokenRequestId: params.tokenRequestId } : {}),
            ...('deviceAccessKey' in params ? { deviceAccessKey: params.deviceAccessKey } : {}),
        },
    });
