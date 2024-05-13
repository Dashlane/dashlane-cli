import os from 'os';
import { signRequest } from './signRequest';
import { PostRequestAPIParams } from './types';
import { cliVersionToString, CLI_VERSION } from '../../cliVersion';

export const postRequestAPI = <T>(params: PostRequestAPIParams<T>) => {
    const { path, authentication, payload, query, method, userAgent, customHeaders, customHost, requestFunction } =
        params;

    const apiHost = customHost ?? 'api.dashlane.com';
    const apiUrl = `https://${apiHost}/`;

    const forgedHeaders = {
        'content-type': 'application/json',
        'user-agent': userAgent || 'CI',
        'dashlane-client-agent': JSON.stringify({
            version: `${cliVersionToString(CLI_VERSION)}`,
            platform: 'server_cli',
            osversion: `${os.platform()}-${os.arch()}`,
            partner: 'dashlane',
        }),
        host: apiHost,
        ...(customHeaders || {}),
    };

    let authorizationHeader: string | null = null;

    if (authentication.type !== 'none') {
        authorizationHeader = signRequest({
            authentication,
            method: 'POST',
            body: payload,
            uri: '/' + path,
            headers: forgedHeaders,
            query,
        });
    }

    return requestFunction({
        method: method || 'POST',
        url: apiUrl + path,
        json: payload,
        query: query || {},
        headers: {
            ...forgedHeaders,
            ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
        },
    });
};
