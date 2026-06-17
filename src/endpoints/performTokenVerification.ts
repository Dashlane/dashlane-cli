import { requestAppApi } from '../requestApi.js';

type PerformTokenVerification = {
    login: string;
    verification:
        | {
              token: string;
              intent: 'new_device';
              tokenRequestId: string;
          }
        | {
              token: string;
              intent: 'login';
              deviceAccessKey: string;
          };
};

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
            verification: params.verification,
        },
    });
