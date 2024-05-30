import { performTotpVerification } from '../../endpoints/index.js';
import { completeLoginWithAuthTicket } from '../../endpoints/completeLoginWithAuthTicket.js';
import { Get2FAStatusOutput, get2FAStatusUnauthenticated } from '../../endpoints/get2FAStatusUnauthenticated.js';
import { logger } from '../../logger.js';
import { askOtp } from '../../utils/index.js';

interface Params {
    login: string;
    deviceAccessKey: string;
}

export const perform2FAVerification = async ({ login, deviceAccessKey }: Params) => {
    // If the user is using 2FA at every login, we'll need to perform token authentication against the server
    // If the user is offline though, and not using 2FA at every login, let's not block them
    let authTicket: string;
    let twoFactorAuthStatus: Get2FAStatusOutput;
    try {
        twoFactorAuthStatus = await get2FAStatusUnauthenticated({ login });
    } catch (error) {
        logger.warn(
            'Unable to check 2FA Status. This will prevent you from logging in if you are using 2FA at each login (OTP2)'
        );
        return;
    }

    if (twoFactorAuthStatus.type === 'totp_login') {
        const otp = await askOtp();
        ({ authTicket } = await performTotpVerification({
            login,
            otp,
        }));

        const { ssoServerKey, serverKey } = await completeLoginWithAuthTicket({
            login,
            authTicket,
            deviceAccessKey,
        });
        if (ssoServerKey) {
            throw new Error('SSO Authentication not supported');
        }
        return serverKey;
    }
};
