import { RequestFunctionOptions } from '@dashlane/apiconnect-utils';
import os from 'os';
import https from 'node:https';
import { got } from 'got';
import { cliVersionToString, CLI_VERSION } from '../cliVersion';

const makeStagingCloudflareHeaders = () =>
    process.env.CLOUDFLARE_SERVICE_TOKEN_ACCESS
        ? {
              'CF-Access-Client-Id': process.env.CLOUDFLARE_SERVICE_TOKEN_ACCESS ?? '',
              'CF-Access-Client-Secret': process.env.CLOUDFLARE_SERVICE_TOKEN_SECRET ?? '',
          }
        : undefined;

const makeDashlaneClientAgent = () =>
    JSON.stringify({
        version: `${cliVersionToString(CLI_VERSION)}`,
        platform: 'server_cli',
        osversion: `${os.platform()}-${os.arch()}`,
        partner: 'dashlane',
    });

// Override TLS fingerprint to avoid Cloudflare WAF blocks when running in pkg-bundled binaries.
// pkg embeds Node.js with OpenSSL 3.0.x whose default TLS fingerprint (JA3) is blocked
// by Cloudflare on Dashlane's authentication endpoints.
const httpsAgent = new https.Agent({
    ecdhCurve: 'X25519:P-256:P-384:P-521',
    sigalgs:
        'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512',
});

export const gotImplementation = (options: RequestFunctionOptions) => {
    const { headers, json, url } = options;

    return got.post(url, {
        agent: { https: httpsAgent },
        headers: {
            ...headers,
            ...(process.env.CLOUDFLARE_SERVICE_TOKEN_ACCESS ? makeStagingCloudflareHeaders() : {}),
            'dashlane-client-agent': makeDashlaneClientAgent(),
        },
        json,
        retry: { limit: 3 },
        throwHttpErrors: false,
    });
};
