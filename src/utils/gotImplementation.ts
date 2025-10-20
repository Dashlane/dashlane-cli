import { RequestFunctionOptions } from '@dashlane/apiconnect-utils';
import os from 'os';
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

export const gotImplementation = (options: RequestFunctionOptions) => {
    const { headers, json, url } = options;

    return got.post(url, {
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
