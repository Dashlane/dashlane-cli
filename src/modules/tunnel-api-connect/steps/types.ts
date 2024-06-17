import type sodium from 'libsodium-wrappers';
import { ApiRequestsDefault } from '../types.js';

export interface ApiEndpointResponse<T> {
    requestId: string;
    data: T;
}

export interface ClientHelloRequest {
    clientPublicKey: string;
}

export interface ClientHelloResponse {
    attestation: string;
    tunnelUuid: string;
}

export interface ClientHelloParsedResponse {
    attestation: Buffer;
    tunnelUuid: string;
}

export interface TerminateHelloRequest {
    clientHeader: string;
    tunnelUuid: string;
}

interface AppAuthenticationParams {
    type: 'app';
}

interface UserDeviceAuthenticationParams {
    type: 'userDevice';
    login: string;
    deviceKeys: { accessKey: string; secretKey: string };
}

interface TeamDeviceAuthenticationParams {
    type: 'teamDevice';
    teamUuid: string;
    teamDeviceKeys: { accessKey: string; secretKey: string };
}

export type AuthenticationParams =
    | AppAuthenticationParams
    | UserDeviceAuthenticationParams
    | TeamDeviceAuthenticationParams;

export interface SendSecureContentParams<R extends ApiRequestsDefault> {
    path: R['path'];
    clientStateIn: sodium.StateAddress;
    clientStateOut: sodium.StateAddress;
    payload: R['input'];
    authentication?: AuthenticationParams;
}

export interface TerminateHelloParams {
    attestation: Buffer;
}

export interface TerminateHelloResponse {
    clientStateIn: sodium.StateAddress;
    clientStateOut: sodium.StateAddress;
    sessionKeys: sodium.CryptoKX;
    serverPublicKey: Buffer;
    serverHeader: Buffer;
}

export interface AttestationUserData {
    publicKey: string;
    header: string;
}

export interface SecureContentRequest {
    encryptedData: string;
    tunnelUuid: string;
}

export interface SecureContentResponse {
    encryptedData: string;
}
