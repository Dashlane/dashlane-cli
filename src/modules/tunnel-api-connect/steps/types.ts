import type { StateAddress } from 'libsodium-wrappers';
import { ApiRequestsDefault, CryptoKX } from '../types.js';
import { EnclavePcr } from '@dashlane/nsm-attestation';

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

interface EnrolledDeviceAuthenticationParams {
    type: 'enrolledDevice';
    enrolledTeamDeviceKeys: {
        nodeWSAccessKey: string;
        nitroDeviceAccessKey: string;
        nitroDeviceSecretKey: string;
        secretKey: string;
    };
}

export type AuthenticationParams =
    AppAuthenticationParams | UserDeviceAuthenticationParams | EnrolledDeviceAuthenticationParams;

export interface SendSecureContentParams<R extends ApiRequestsDefault> {
    path: R['path'];
    clientStateIn: StateAddress;
    clientStateOut: StateAddress;
    payload: R['input'];
    authentication?: AuthenticationParams;
}

export interface TerminateHelloParams {
    attestation: Buffer;
    enclavePcrList: EnclavePcr<string>[];
}

export interface TerminateHelloResponse {
    clientStateIn: StateAddress;
    clientStateOut: StateAddress;
    sessionKeys: CryptoKX;
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
