import winston from 'winston';
import {
    CompleteDeviceRegistrationWithAuthTicketOutput,
    completeDeviceRegistration,
    performDashlaneAuthenticatorVerification,
    performDuoPushVerification,
    performEmailTokenVerification,
    performTotpVerification,
} from '../endpoints';
import { askOtp, askToken } from '../utils';
import { getAuthenticationMethodsForDevice } from '../endpoints/getAuthenticationMethodsForDevice';
import { requestEmailTokenVerification } from '../endpoints/requestEmailTokenVerification';

interface RegisterDevice {
    login: string;
}

export const registerDevice = async (
    params: RegisterDevice
): Promise<CompleteDeviceRegistrationWithAuthTicketOutput> => {
    const { login } = params;
    winston.debug('Registering the device...');

    // Log in via a compatible verification method
    const { verifications } = await getAuthenticationMethodsForDevice({ login });

    let authTicket: string;
    if (verifications.find((method) => method.type === 'duo_push')) {
        ({ authTicket } = await performDuoPushVerification({ login }));
    } else if (verifications.find((method) => method.type === 'dashlane_authenticator')) {
        ({ authTicket } = await performDashlaneAuthenticatorVerification({ login }));
    } else if (verifications.find((method) => method.type === 'totp')) {
        const otp = await askOtp();
        ({ authTicket } = await performTotpVerification({
            login,
            otp,
        }));
    } else if (verifications.find((method) => method.type === 'email_token')) {
        await requestEmailTokenVerification({ login });

        const token = await askToken();
        ({ authTicket } = await performEmailTokenVerification({
            login,
            token,
        }));
    } else {
        throw new Error('Auth verification method not supported: ' + verifications[0].type);
    }

    // Complete the device registration and save the result
    return completeDeviceRegistration({ login, authTicket });
};
