import * as opaque from '@serenity-kit/opaque';
import { Database } from 'better-sqlite3';
import { requestOpaqueMPLoginOutput, requestOpaqueMPLogin, completeOpaqueMPLogin } from '../../../endpoints';
import { DashlaneApiError } from '../../../requestApi';
import { DeviceCredentials } from '../../../types';
import { isDeviceProven, markDeviceAsProven } from './database';
import { serverConfig, KEY_STRETCHING_CONFIG } from './constants';

/**
 * Attempt an Opaque login for the user and mark the device as proven on success
 * Ignore if already proven. Mark the device as proven when needed
 * Throw if error while login
 */
export const loginWithOpaque = async (deviceInfo: DeviceCredentials, db: Database) => {
    // If the device is already proven, it doesn't need to go through
    // the opaque login flow
    if (isDeviceProven(db, deviceInfo.login)) {
        return;
    }

    const loginResult = opaque.client.startLogin({
        password: deviceInfo.masterPassword,
    });

    let requestLoginResult: requestOpaqueMPLoginOutput | undefined;
    try {
        requestLoginResult = await requestOpaqueMPLogin({
            deviceCredentials: deviceInfo,
            loginRequest: loginResult.startLoginRequest,
        });
    } catch (error) {
        const { code } = error as DashlaneApiError;
        if (['OPAQUE_MASTER_PASSWORD_ENDPOINT_DISABLED', 'OPAQUE_MASTER_PASSWORD_NOT_REGISTERED'].includes(code)) {
            // The flow is stopped if the endpoint is disabled or if Opaque is not setup for this user
            // The device is not marked as PROVEN though as it has not been through the full Opaque flow
            return;
        }

        throw new Error(`Error while verifying the master password (${code})`);
    }

    const finishLoginResult = opaque.client.finishLogin({
        clientLoginState: loginResult.clientLoginState,
        loginResponse: requestLoginResult.loginResponse,
        password: deviceInfo.masterPassword,
        identifiers: { server: serverConfig.serverIdentifier },
        keyStretching: { 'argon2id-custom': KEY_STRETCHING_CONFIG.v1 },
    });

    if (
        !finishLoginResult?.finishLoginRequest ||
        finishLoginResult.serverStaticPublicKey !== serverConfig.serverPublicKey
    ) {
        throw new Error(`Error while verifying the master password`);
    }

    try {
        await completeOpaqueMPLogin({
            deviceCredentials: deviceInfo,
            finishLoginRequest: finishLoginResult?.finishLoginRequest,
            opaqueMPLoginFlowId: requestLoginResult.opaqueMPLoginFlowId,
        });
    } catch (error) {
        const { code } = error as DashlaneApiError;
        // If the endpoint is disabled, we ignore the error but we don't mark the device as PROVEN
        if (['OPAQUE_MASTER_PASSWORD_ENDPOINT_DISABLED'].includes(code)) {
            return;
        }

        // If one of those errors are returned, an error is raised
        if (['LOGIN_REQUEST_NOT_FOUND', 'OPAQUE_LOGIN_FAILED', 'INVALID_LOGIN_FLOW_ID'].includes(code)) {
            throw new Error(`Error while verifying the master password`);
        }

        // Note: the error case DEVICE_ALREADY_PROVEN is not handled here to be mark the device as proven afterwards
    }

    // The device is marked as proven because the flow went well or returned a DEVICE_ALREADY_PROVEN error
    markDeviceAsProven(db, deviceInfo.login);
};
