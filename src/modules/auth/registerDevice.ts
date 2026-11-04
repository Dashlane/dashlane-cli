import { doSSOVerification } from './sso/index.js';
import { doConfidentialSSOVerification } from './confidential-sso/index.js';
import {
    completeDeviceRegistration,
    getAuthenticationMethods,
    performTokenVerification,
} from '../../endpoints/index.js';
import { askTokenRequestId, askToken, askMasterPassword } from '../../utils/index.js';
import { logger } from '../../logger.js';
import { loginWithOpaque } from './opaque/utils.js';

interface RegisterDevice {
    login: string;
    deviceName: string;
    isNonInteractiveDevice?: boolean;
}

export const registerDevice = async (params: RegisterDevice) => {
    let authTicket: string | null = null;
    let ssoSpKey: string | null = null;
    const { login, deviceName, isNonInteractiveDevice = false } = params;
    logger.debug('Registering the device...');

    const urlEncodedLogin = encodeURIComponent(login);
    logger.info(
        `Please open the following URL in your browser: https://www.dashlane.com/cli-device-registration?login=${urlEncodedLogin}`
    );
    const tokenRequestId = await askTokenRequestId();
    const token = await askToken();

    const {
        authTicket: { ticket: deviceRegistrationAuthTicket },
    } = await performTokenVerification({
        login,
        verification: {
            tokenRequestId,
            token,
            intent: 'token:new_device',
        },
    });

    // get authentication methods
    const { localAuthentications, remoteAuthentications } = await getAuthenticationMethods({
        login,
        authTicket: deviceRegistrationAuthTicket,
    });

    const isMPLessUser = localAuthentications.length === 0;
    const isSKUser = localAuthentications.find((auth) => auth.type === 'securityKey');
    const isMPUser = localAuthentications.find((auth) => auth.type === 'masterPassword');
    const ssoInfo = localAuthentications.find((auth) => auth.type === 'sso');
    const isOTPAtLogin = remoteAuthentications.find((auth) => auth.type === 'totp' && auth.requiredOnLogin);

    if (isMPLessUser || isSKUser) {
        throw new Error('Your account authentication methods is not supported yet');
    }

    // We prevent non interactive devices for OTP2 and SSO
    if (isNonInteractiveDevice) {
        if (isOTPAtLogin) {
            throw new Error("You can't register a non-interactive device when you have OTP at each login enabled.");
        }
        if (ssoInfo) {
            throw new Error("You can't register a non-interactive device when you are using SSO.");
        }
    }

    let masterPassword: string | undefined;
    if (ssoInfo) {
        let response;
        if (ssoInfo.isNitroProvider) {
            response = await doConfidentialSSOVerification({
                authTicket: deviceRegistrationAuthTicket,
                requestedLogin: login,
            });
        } else {
            response = await doSSOVerification({
                authTicket: deviceRegistrationAuthTicket,
                requestedLogin: login,
                serviceProviderURL: ssoInfo.serviceProviderUrl,
            });
        }

        authTicket = response.authTicket;
        ssoSpKey = response.ssoSpKey;
    } else if (isMPUser) {
        masterPassword = await askMasterPassword();
        authTicket = await loginWithOpaque(login, masterPassword, deviceRegistrationAuthTicket);
    }

    if (authTicket === null) {
        throw new Error('Error while registering your device');
    }

    // Complete the device registration and save the result
    const completeDeviceRegistrationResponse = await completeDeviceRegistration({
        login,
        deviceName,
        authTicket,
    });

    return { ...completeDeviceRegistrationResponse, ssoSpKey, masterPassword };
};
