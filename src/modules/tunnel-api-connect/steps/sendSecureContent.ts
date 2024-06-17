import sodium from 'libsodium-wrappers';
import { secureContentBodyDataSchema } from './schemas.js';
import type { SecureContentRequest, SecureContentResponse, SendSecureContentParams } from './types.js';
import { SecureTunnelNotInitialized, SendSecureContentDataDecryptionError } from '../errors.js';
import type { ApiConnectInternalParams, ApiData, ApiRequestsDefault } from '../types.js';
import { TypeCheck } from '../../typecheck/index.js';
import { requestAppApi, requestTeamApi, requestUserApi } from '../../../requestApi.js';

const verifySendSecureBodySchemaValidator = new TypeCheck<SecureContentResponse>(secureContentBodyDataSchema);

export const encryptData = <P = any>(clientStateOut: sodium.StateAddress, payload: P) =>
    sodium.crypto_secretstream_xchacha20poly1305_push(
        clientStateOut,
        sodium.from_string(JSON.stringify(payload)),
        null,
        sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
    );

export const sendSecureContent = async <R extends ApiRequestsDefault>(
    params: ApiConnectInternalParams & SendSecureContentParams<R>,
    apiData: Partial<ApiData>
): Promise<R['output']> => {
    if (!apiData.clientHello) {
        throw new SecureTunnelNotInitialized();
    }

    const { path, clientStateIn, clientStateOut, payload: rawPayload, authentication = { type: 'app' } } = params;
    const { tunnelUuid } = apiData.clientHello;

    const encryptedData = encryptData(clientStateOut, rawPayload);

    const payload = {
        encryptedData: sodium.to_hex(encryptedData),
        tunnelUuid,
    } satisfies SecureContentRequest;

    let response: SecureContentResponse;

    switch (authentication.type) {
        case 'userDevice':
            response = await requestUserApi<SecureContentResponse>({
                path,
                payload,
                isNitroEncryptionService: true,
                deviceKeys: authentication.deviceKeys,
                login: authentication.login,
            });
            break;
        case 'teamDevice':
            response = await requestTeamApi<SecureContentResponse>({
                path,
                payload,
                isNitroEncryptionService: true,
                teamDeviceKeys: authentication.teamDeviceKeys,
                teamUuid: authentication.teamUuid,
            });
            break;
        case 'app':
            response = await requestAppApi<SecureContentResponse>({
                path,
                payload,
                isNitroEncryptionService: true,
            });
            break;
    }

    const body = verifySendSecureBodySchemaValidator.validate(response);
    if (body instanceof Error) {
        throw body;
    }

    const decryptedResponse = sodium.crypto_secretstream_xchacha20poly1305_pull(
        clientStateIn,
        sodium.from_hex(body.encryptedData)
    ).message;

    if (decryptedResponse === undefined) {
        throw new SendSecureContentDataDecryptionError();
    }

    return JSON.parse(sodium.to_string(decryptedResponse)) as R['output'];
};
