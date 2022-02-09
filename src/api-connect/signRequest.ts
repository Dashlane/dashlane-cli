import * as crypto from 'crypto';
import { makeCanonicalRequest } from './makeCanonicalRequest.js';
import { Authentication, SignRequestParams } from './types';

export const signRequest = (params: SignRequestParams) => {
    const { method, body, uri, headers, query, authentication } = params;

    const signatureAlgorithm = 'DL1-HMAC-SHA256';

    const bodyToHash = method === 'GET' ? '' : JSON.stringify(body) || '';

    const bodyHash = crypto.createHash('sha256').update(bodyToHash).digest('hex');

    const headersToSign = ['content-type', 'user-agent'];

    const { canonicalRequest, signedHeaders } = makeCanonicalRequest({
        method: method,
        uri: uri,
        headers: headers,
        query: query,
        hashedPayload: bodyHash,
        headersToSign
    });

    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = [
        signatureAlgorithm,
        timestamp.toString(),
        crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    // Generate authorization header
    const authenticationHeader = generateAuthenticationHeader(authentication);

    // Generate signature
    const key = createSecretKey(authentication);
    const signature = crypto.createHmac('SHA256', key).update(stringToSign).digest('hex');

    const authorizationHeader =
        signatureAlgorithm +
        ' ' +
        [
            ...authenticationHeader,
            'Timestamp=' + timestamp.toString(),
            'SignedHeaders=' + signedHeaders,
            'Signature=' + signature
        ].join(',');

    return authorizationHeader;
};

const generateAuthenticationHeader = (authentication: Authentication): string[] => {
    switch (authentication.type) {
        case 'userDevice':
            return [
                `Login=${authentication.login}`,
                `AppAccessKey=${authentication.appAccessKey}`,
                `DeviceAccessKey=${authentication.accessKey}`
            ];
        case 'teamDevice':
            return [
                `TeamUuid=${authentication.teamUuid}`,
                `AppAccessKey=${authentication.appAccessKey}`,
                `DeviceAccessKey=${authentication.accessKey}`
            ];
        case 'app':
            return [`AppAccessKey=${authentication.appAccessKey}`];
        case 'none':
            return [];
        default:
            assertNever(authentication);
            return [];
    }
};

const createSecretKey = (authentication: Authentication) => {
    if (authentication.type === 'none') {
        return null;
    }
    if (authentication.type !== 'app') {
        return `${authentication.appSecretKey}\n${authentication.secretKey}`;
    }
    return authentication.appSecretKey;
};

export const assertNever = (x: never): never => {
    const isTestEnvironment = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'test';
    if (isTestEnvironment) {
        throw new Error('Should have never been here');
    }
    console.log('Should have never been here', x);
    return x;
};
