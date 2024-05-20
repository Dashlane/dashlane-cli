import sodium from 'libsodium-wrappers';
import type { ClientHelloParsedResponse, ClientHelloRequest, ClientHelloResponse } from './types';
import { clientHelloResponseSchema } from './schemas';
import type { ApiConnectInternalParams } from '../types';
import { TypeCheck, TypeCheckError } from '../../typecheck';
import { requestAppApi } from '../../../requestApi';

export const clientHelloRequestSchemaValidator = new TypeCheck<ClientHelloResponse>(clientHelloResponseSchema);

export const clientHello = async (params: ApiConnectInternalParams): Promise<ClientHelloParsedResponse> => {
    const { clientKeyPair } = params;

    const payload = {
        clientPublicKey: sodium.to_hex(clientKeyPair.publicKey),
    } satisfies ClientHelloRequest;

    const response = await requestAppApi<ClientHelloResponse>({
        path: `tunnel/ClientHello`,
        payload,
        isNitroEncryptionService: true,
    });

    const validated = clientHelloRequestSchemaValidator.validate(response);
    if (validated instanceof TypeCheckError) {
        throw validated;
    }

    return {
        attestation: Buffer.from(validated.attestation, 'hex'),
        tunnelUuid: validated.tunnelUuid,
    };
};
