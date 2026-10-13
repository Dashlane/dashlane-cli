import * as opaque from '@serenity-kit/opaque';
import {
    requestOpaqueMPLoginWithAuthTicket,
    requestOpaqueMPLoginWithAuthTicketOutput,
    completeOpaqueMPLoginWithAuthTicket,
} from '../../../endpoints';
import { DashlaneApiError } from '../../../requestApi';

import { serverConfig, KEY_STRETCHING_CONFIG } from './constants';

/**
 * Attempt an Opaque login for the user and mark the device as proven on success
 * Ignore if already proven. Mark the device as proven when needed
 * Throw if error while login
 */
export const loginWithOpaque = async (login: string, password: string, authTicket: string) => {
    // Opaque need to be ready before we go further
    await opaque.ready;

    // start the login flow
    const loginResult = opaque.client.startLogin({
        password,
    });

    let requestLoginResult: requestOpaqueMPLoginWithAuthTicketOutput | undefined;
    try {
        requestLoginResult = await requestOpaqueMPLoginWithAuthTicket({
            authTicket,
            login,
            loginRequest: loginResult.startLoginRequest,
        });
    } catch (error) {
        const { code } = error as DashlaneApiError;
        switch (code) {
            case 'INVALID_AUTH_TICKET':
                throw new Error('Error while verifying the master password, authTicket not valid');
            case 'OPAQUE_MASTER_PASSWORD_NOT_REGISTERED':
                throw new Error(
                    'Error while verifying the master password, you should login through another client (extension, mobile app) first'
                );
        }

        throw new Error(`Error while verifying the master password (${code})`);
    }

    const finishLoginResult = opaque.client.finishLogin({
        password,
        clientLoginState: loginResult.clientLoginState,
        loginResponse: requestLoginResult.loginResponse,
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
        const strongAuthTicket = await completeOpaqueMPLoginWithAuthTicket({
            authTicket,
            login,
            finishLoginRequest: finishLoginResult?.finishLoginRequest,
            opaqueMPLoginFlowId: requestLoginResult.opaqueMPLoginFlowId,
        });

        return strongAuthTicket.authTicket.ticket;
    } catch (error) {
        const { code } = error as DashlaneApiError;

        switch (code) {
            case 'INVALID_AUTH_TICKET':
                throw new Error('Error while verifying the master password, authTicket not valid');
            case 'LOGIN_REQUEST_NOT_FOUND':
                throw new Error('Error while verifying the master password, opaque request not found');
            case 'INVALID_LOGIN_FLOW_ID':
                throw new Error('Error while verifying the master password, invalid flow id');
            case 'OPAQUE_LOGIN_FAILED':
                throw new Error('Error while verifying the master password, wrong master password');
        }
        throw new Error(`Error while verifying the master password (${code})`);
    }
};
