import { verifyAttestation } from '@dashlane/nsm-attestation';
import sodium from 'libsodium-wrappers';
import { attestationUserDataSchema } from './schemas.js';
import { AttestationUserData, TerminateHelloParams, TerminateHelloRequest, TerminateHelloResponse } from './types.js';
import { ApiConnectInternalParams, ApiData } from '../types.js';
import { TypeCheck } from '../../typecheck/index.js';
import { requestAppApi } from '../../../requestApi.js';
import { SecureTunnelNotInitialized } from '../errors.js';

const verifyAttestationUserDataSchemaValidator = new TypeCheck<AttestationUserData>(attestationUserDataSchema);

export const terminateHello = async (
    params: ApiConnectInternalParams & TerminateHelloParams,
    apiData: Partial<ApiData>
): Promise<TerminateHelloResponse> => {
    if (!apiData.clientHello) {
        throw new SecureTunnelNotInitialized();
    }

    const { clientKeyPair, attestation, useProductionCertificate, enclavePcrList } = params;
    const { tunnelUuid } = apiData.clientHello;

    const { userData } = await verifyAttestation({
        attestation,
        useProductionCertificate,
        pcrs: enclavePcrList,
    });

    const userDataParsed = verifyAttestationUserDataSchemaValidator.parseAndValidate(userData.toString());

    if (userDataParsed instanceof Error) {
        throw userDataParsed;
    }

    const serverPublicKey = Buffer.from(userDataParsed.publicKey, 'base64');
    const serverHeader = Buffer.from(userDataParsed.header, 'base64');

    const sessionKeys = sodium.crypto_kx_client_session_keys(
        clientKeyPair.publicKey,
        clientKeyPair.privateKey,
        serverPublicKey
    );

    const secretStream = sodium.crypto_secretstream_xchacha20poly1305_init_push(sessionKeys.sharedRx); // rx1
    const clientStateOut = secretStream.state;
    const clientHeader = secretStream.header;

    const clientStateIn = sodium.crypto_secretstream_xchacha20poly1305_init_pull(serverHeader, sessionKeys.sharedTx);

    const payload = {
        clientHeader: sodium.to_hex(clientHeader),
        tunnelUuid,
    } satisfies TerminateHelloRequest;

    await requestAppApi<TerminateHelloRequest>({
        path: `tunnel/TerminateHello`,
        payload,
        isNitroEncryptionService: true,
    });

    return { clientStateIn, clientStateOut, sessionKeys, serverPublicKey, serverHeader };
};
