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

export const performDuoPushVerification = (
    params: PerformDuoPushVerification,
    cb: Callback<PerformDuoPushVerificationOutput>
) => {
    const { login } = params;

    requestApi(
        {
            path: 'authentication/PerformDuoPushVerification',
            login,
            payload: {
                login
            }
        },
        cb
    );
};
