import winston from 'winston';
import {
    CompleteDeviceRegistrationOutput,
    completeDeviceRegistration,
    performDashlaneAuthenticatorVerification,
    performDuoPushVerification,
    performEmailTokenVerification,
    performTotpVerification,
    requestDeviceRegistration,
} from '../endpoints';
import { askOtp, askToken } from '../utils';

interface RegisterDevice {
    login: string;
}

export const registerDevice = async (params: RegisterDevice): Promise<CompleteDeviceRegistrationOutput> => {
    const { login } = params;
    winston.debug('Registering the device...');

    // Log in via a compatible verification method
    const { verification } = await requestDeviceRegistration({ login });

    let authTicket: string;
    if (verification.find((method) => method.type === 'duo_push')) {
        ({ authTicket } = await performDuoPushVerification({ login }));
    } else if (verification.find((method) => method.type === 'dashlane_authenticator')) {
        ({ authTicket } = await performDashlaneAuthenticatorVerification({ login }));
    } else if (verification.find((method) => method.type === 'totp')) {
        const otp = askOtp();
        ({ authTicket } = await performTotpVerification({
            login,
            otp: String(otp).padStart(5, '0'),
        }));
    } else if (verification.find((method) => method.type === 'email_token')) {
        const token = askToken();
        ({ authTicket } = await performEmailTokenVerification({
            login,
            token: String(token).padStart(5, '0'),
        }));
    } else {
        throw new Error('Auth verification method not supported: ' + verification[0].type);
    }

    // Complete the device registration and save the result
    return completeDeviceRegistration({ login, authTicket });
};
