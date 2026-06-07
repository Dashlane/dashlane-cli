import { doSSOVerification } from './sso/index.js';
import { doConfidentialSSOVerification } from './confidential-sso/index.js';
import {
    completeDeviceRegistration,
    getAuthenticationMethods,
    performTokenVerification,
} from '../../endpoints/index.js';
import { askTokenRequestId, askToken } from '../../utils/index.js';
import { logger } from '../../logger.js';

interface RegisterDevice {
    login: string;
    deviceName: string;
}

export const registerDevice = async (params: RegisterDevice) => {
    let authTicket: string | null = null;
    let ssoSpKey: string | null = null;
    const { login, deviceName } = params;
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
        tokenRequestId,
        token,
        intent: 'new_device',
    });

    // get authentication methods
    const { localAuthentications } = await getAuthenticationMethods({
        login,
        authTicket: deviceRegistrationAuthTicket,
    });

    const isMPLessUser = localAuthentications.length === 0;
    const isSKUser = localAuthentications.find((auth) => auth.type === 'securityKey');
    const isMPUser = localAuthentications.find((auth) => auth.type === 'masterPassword');
    const ssoInfo = localAuthentications.find((auth) => auth.type === 'sso');

    if (isMPLessUser || isSKUser) {
        throw new Error('Your account authentication methods is not supported yet');
    }

    if (ssoInfo) {
        let response;
        if (ssoInfo.isNitroProvider) {
            response = await doConfidentialSSOVerification({
                requestedLogin: login,
            });
        } else {
            response = await doSSOVerification({
                requestedLogin: login,
                serviceProviderURL: ssoInfo.serviceProviderUrl,
            });
        }

        authTicket = response.authTicket;
        ssoSpKey = response.ssoSpKey;
    } else if (isMPUser) {
        authTicket = deviceRegistrationAuthTicket;
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

    return { ...completeDeviceRegistrationResponse, ssoSpKey };
};
