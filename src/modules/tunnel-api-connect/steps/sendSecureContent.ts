import sodium from 'libsodium-wrappers';
import { secureContentBodyDataSchema } from './schemas.js';
import type { SecureContentRequest, SecureContentResponse, SendSecureContentParams } from './types.js';
import { SecureTunnelNotInitialized, SendSecureContentDataDecryptionError } from '../errors.js';
import type { ApiConnectInternalParams, ApiData, ApiRequestsDefault } from '../types.js';
import { TypeCheck } from '../../typecheck/index.js';
import { requestAppApi, requestEnrolledDeviceApi, requestUserApi } from '../../../requestApi.js';

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

    // We assume that this section of the code will only be calling NodeWS Proxy with this authentication
    // Inject the enrolledDeviceSecretKey when targeting NodeWS Enclave Proxy authentification
    // to provide Nitro specific key
    let injectedPayload = rawPayload;
    if (authentication.type === 'enrolledDevice') {
        injectedPayload = {
            ...(typeof rawPayload === 'object' ? rawPayload : {}),
            enrolledDeviceSecretKey: authentication.enrolledTeamDeviceKeys.nitroDeviceSecretKey,
        };
    }

    const encryptedData = encryptData(clientStateOut, injectedPayload);

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
        case 'enrolledDevice':
            response = await requestEnrolledDeviceApi<SecureContentResponse>({
                path,
                payload,
                isNitroEncryptionService: true,
                enrolledTeamDeviceKeys: authentication.enrolledTeamDeviceKeys,
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
