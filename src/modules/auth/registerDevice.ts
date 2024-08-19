import { doSSOVerification } from './sso/index.js';
import { doConfidentialSSOVerification } from './confidential-sso/index.js';
import {
    completeDeviceRegistration,
    performDuoPushVerification,
    performEmailTokenVerification,
    performTotpVerification,
} from '../../endpoints/index.js';
import { askOtp, askToken, askVerificationMethod } from '../../utils/index.js';
import { getAuthenticationMethodsForDevice } from '../../endpoints/getAuthenticationMethodsForDevice.js';
import { logger } from '../../logger.js';

interface RegisterDevice {
    login: string;
    deviceName: string;
}

export const registerDevice = async (params: RegisterDevice) => {
    const { login, deviceName } = params;
    logger.debug('Registering the device...');

    // Log in via a compatible verification method
    const { verifications, accountType } = await getAuthenticationMethodsForDevice({ login });

    if (accountType === 'invisibleMasterPassword') {
        throw new Error('Master password-less is currently not supported');
    }

    const nonEmptyVerifications = verifications.filter((method) => method.type);

    // Remove dashlane_authenticator from the list of verification methods as it is a deprecated method
    nonEmptyVerifications.filter((method) => method.type !== 'dashlane_authenticator');

    const selectedVerificationMethod =
        nonEmptyVerifications.length > 1
            ? await askVerificationMethod(nonEmptyVerifications)
            : nonEmptyVerifications[0];

    let authTicket: string;
    let ssoSpKey: string | null = null;
    if (!selectedVerificationMethod || Object.keys(selectedVerificationMethod).length === 0) {
        throw new Error('No verification method selected');
    }

    if (selectedVerificationMethod.type === 'duo_push') {
        logger.info('Please accept the Duo push notification on your phone.');
        ({ authTicket } = await performDuoPushVerification({ login }));
    } else if (selectedVerificationMethod.type === 'totp') {
        const otp = await askOtp();
        ({ authTicket } = await performTotpVerification({
            login,
            otp,
        }));
    } else if (selectedVerificationMethod.type === 'email_token') {
        const urlEncodedLogin = encodeURIComponent(login);
        logger.info(
            `Please open the following URL in your browser: https://www.dashlane.com/cli-device-registration?login=${urlEncodedLogin}`
        );
        const token = await askToken();
        ({ authTicket } = await performEmailTokenVerification({
            login,
            token,
        }));
    } else if (selectedVerificationMethod.type === 'sso') {
        if (selectedVerificationMethod.ssoInfo.isNitroProvider) {
            ({ authTicket, ssoSpKey } = await doConfidentialSSOVerification({
                requestedLogin: login,
            }));
        } else {
            ({ authTicket, ssoSpKey } = await doSSOVerification({
                requestedLogin: login,
                serviceProviderURL: selectedVerificationMethod.ssoInfo.serviceProviderUrl,
            }));
        }
    } else {
        throw new Error('Auth verification method not supported: ' + selectedVerificationMethod.type);
    }

    // Complete the device registration and save the result
    const completeDeviceRegistrationResponse = await completeDeviceRegistration({ login, deviceName, authTicket });

    return { ...completeDeviceRegistrationResponse, ssoSpKey };
};
