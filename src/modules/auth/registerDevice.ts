import winston from 'winston';
import { doSSOVerification } from './sso/sso';
import {
    CompleteDeviceRegistrationWithAuthTicketOutput,
    completeDeviceRegistration,
    performDashlaneAuthenticatorVerification,
    performDuoPushVerification,
    performEmailTokenVerification,
    performTotpVerification,
} from '../../endpoints';
import { askOtp, askToken, askVerificationMethod } from '../../utils';
import { getAuthenticationMethodsForDevice } from '../../endpoints/getAuthenticationMethodsForDevice';
import { requestEmailTokenVerification } from '../../endpoints/requestEmailTokenVerification';
import type { SupportedAuthenticationMethod } from '../../types';

interface RegisterDevice {
    login: string;
    deviceName: string;
}

export const registerDevice = async (
    params: RegisterDevice
): Promise<CompleteDeviceRegistrationWithAuthTicketOutput> => {
    const { login, deviceName } = params;
    winston.debug('Registering the device...');

    // Log in via a compatible verification method
    const { verifications, accountType } = await getAuthenticationMethodsForDevice({ login });

    if (accountType === 'invisibleMasterPassword') {
        throw new Error('Master password-less is currently not supported');
    }

    const selectedVerificationMethod =
        verifications.length > 1
            ? await askVerificationMethod(verifications.map((method) => method.type as SupportedAuthenticationMethod))
            : verifications[0];

    let authTicket: string;
    if (selectedVerificationMethod === 'duo_push') {
        winston.info('Please accept the Duo push notification on your phone');
        ({ authTicket } = await performDuoPushVerification({ login }));
    } else if (selectedVerificationMethod === 'dashlane_authenticator') {
        winston.info('Please accept the Dashlane Authenticator push notification on your phone');
        ({ authTicket } = await performDashlaneAuthenticatorVerification({ login }));
    } else if (selectedVerificationMethod === 'totp') {
        const otp = await askOtp();
        ({ authTicket } = await performTotpVerification({
            login,
            otp,
        }));
    } else if (selectedVerificationMethod === 'email_token') {
        await requestEmailTokenVerification({ login });

        const token = await askToken();
        ({ authTicket } = await performEmailTokenVerification({
            login,
            token,
        }));
        // Following if should be reworked, but the types used above are not handy
    } else if (verifications[0].type === 'sso') {
        await doSSOVerification({
            requestedLogin: login,
            serviceProviderURL: verifications[0].ssoInfo.serviceProviderUrl,
        });
        // To be continue
    } else {
        throw new Error('Auth verification method not supported: ' + verifications[0].type);
    }

    // Complete the device registration and save the result
    return completeDeviceRegistration({ login, deviceName, authTicket });
};
