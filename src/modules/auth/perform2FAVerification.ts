import { performTokenVerification } from '../../endpoints/index.js';
import { completeLoginWithAuthTicket } from '../../endpoints/completeLoginWithAuthTicket.js';
import { logger } from '../../logger.js';
import { askOtp } from '../../utils/index.js';
import { getRemoteAuthenticationAndSSOInfo, RemoteOrSSOAuthenticationType } from './utils';

interface Params {
    login: string;
    deviceAccessKey: string;
}

export const perform2FAVerification = async ({ login, deviceAccessKey }: Params) => {
    // If the user is using 2FA at every login, we'll need to perform token authentication against the server
    // If the user is offline though, and not using 2FA at every login, let's not block them
    let ticket: string;
    let remoteAuthentication: RemoteOrSSOAuthenticationType;
    try {
        const authInfo = await getRemoteAuthenticationAndSSOInfo({ login, deviceAccessKey });
        remoteAuthentication = authInfo.remoteAuthentication;
    } catch (error) {
        logger.debug(error);
        logger.warn(
            'Unable to check 2FA Status. This will prevent you from logging in if you are using 2FA at each login (OTP2)'
        );
        return;
    }

    if (remoteAuthentication === RemoteOrSSOAuthenticationType.totp_login) {
        const otp = await askOtp();
        ({
            authTicket: { ticket },
        } = await performTokenVerification({
            login,
            verification: {
                token: otp,
                intent: 'login',
                deviceAccessKey,
            },
        }));

        const { ssoServerKey, serverKey } = await completeLoginWithAuthTicket({
            login,
            authTicket: ticket,
            deviceAccessKey,
        });
        if (ssoServerKey) {
            throw new Error('SSO Authentication not supported');
        }
        return serverKey;
    }
};
