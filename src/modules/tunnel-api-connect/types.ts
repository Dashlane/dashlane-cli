import type { EnclavePcr } from '@dashlane/nsm-attestation';
import type sodium from 'libsodium-wrappers';
import type { ClientHelloParsedResponse, SendSecureContentParams, TerminateHelloResponse } from './steps/index.js';

export interface ApiRequestsDefault {
    input: Record<string, unknown> | NonNullable<unknown> | undefined;
    output: Record<string, unknown> | NonNullable<unknown> | undefined;
    path: string;
}

export interface ApiData {
    clientHello: {
        attestation: Buffer;
        tunnelUuid: string;
    };
    terminateHello: {
        clientStateIn: sodium.StateAddress;
        clientStateOut: sodium.StateAddress;
        sessionKeys: sodium.CryptoKX;
        serverPublicKey: Buffer;
        serverHeader: Buffer;
    };
}

export interface ApiConnectParams {
    isProduction: boolean;
    clientKeyPair?: sodium.KeyPair;
    enclavePcrList: EnclavePcr<string>[];
}

export interface ApiConnectInternalParams extends ApiConnectParams {
    clientKeyPair: sodium.KeyPair;
}

export interface ApiConnect {
    /** Stored data */
    apiData: Partial<ApiData>;
    /** Parameters passed to Api connect */
    apiParameters: ApiConnectInternalParams;
    /** Tunnel initialization step 1/2 */
    clientHello: () => Promise<ClientHelloParsedResponse>;
    /** Tunnel initialization step 2/2 */
    terminateHello: (
        { attestation }: { attestation: Buffer },
        apiData: Partial<ApiData>
    ) => Promise<TerminateHelloResponse>;
    /** Initialize or refresh the tunnel */
    makeOrRefreshSession: (params: RefreshSessionParams) => Promise<void>;
    /** Reinitialize the tunnel when the session has expired (cookie) */
    sendSecureContent: <R extends ApiRequestsDefault>(
        params: Pick<SendSecureContentParams<R>, 'path' | 'payload'>
    ) => Promise<R['output']>;
}

export interface RefreshSessionParams {
    apiData: Partial<ApiData>;
    api: ApiConnect;
}
