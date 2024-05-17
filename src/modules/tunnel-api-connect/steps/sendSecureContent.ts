import sodium from 'libsodium-wrappers';
import { secureContentBodyDataSchema } from './schemas';
import type { SecureContentRequest, SecureContentResponse, SendSecureContentParams } from './types';
import { SecureTunnelNotInitialized, SendSecureContentDataDecryptionError } from '../errors';
import type { ApiConnectInternalParams, ApiData, ApiRequestsDefault } from '../types';
import { TypeCheck } from '../../typecheck';
import { requestAppApi } from '../../../requestApi';

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

    const { path, clientStateIn, clientStateOut, payload } = params;
    const { tunnelUuid } = apiData.clientHello;

    const encryptedData = encryptData(clientStateOut, payload);

    const response = await requestAppApi<SecureContentResponse>({
        path,
        payload: {
            encryptedData: sodium.to_hex(encryptedData),
            tunnelUuid,
        } satisfies SecureContentRequest,
        isNitroEncryptionService: true,
    });

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
