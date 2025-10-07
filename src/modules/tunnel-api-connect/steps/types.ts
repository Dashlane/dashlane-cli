import type sodium from 'libsodium-wrappers';
import { ApiRequestsDefault } from '../types.js';
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

interface TeamDeviceAuthenticationParams {
    type: 'teamDevice';
    teamUuid: string;
    teamDeviceKeys: { accessKey: string; secretKey: string };
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
    | AppAuthenticationParams
    | UserDeviceAuthenticationParams
    | TeamDeviceAuthenticationParams
    | EnrolledDeviceAuthenticationParams;

export interface SendSecureContentParams<R extends ApiRequestsDefault> {
    path: R['path'];
    clientStateIn: sodium.StateAddress;
    clientStateOut: sodium.StateAddress;
    payload: R['input'];
    authentication?: AuthenticationParams;
}

export interface TerminateHelloParams {
    attestation: Buffer;
    enclavePcrList: EnclavePcr<string>[];
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
