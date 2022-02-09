import { signRequest } from './signRequest.js';
import { PostRequestAPIParams } from './types';

export const postRequestAPI = <T>(params: PostRequestAPIParams<T>, cb: Callback<T>) => {
    const { path, authentication, payload, query, method, userAgent, requestFunction } = params;

    const apiHost = `https://api.dashlane.com/`;

    const forgedHeaders = {
        'content-type': 'application/json',
        'user-agent': userAgent || 'CI',
        'host': 'api.dashlane.com'
    };

    let authorizationHeader = null;

    if (authentication.type !== 'none') {
        authorizationHeader = signRequest({
            authentication,
            method: 'POST',
            body: payload,
            uri: '/' + path,
            headers: forgedHeaders,
            query
        });
    }

    requestFunction(
        {
            method: method || 'POST',
            url: apiHost + path,
            json: payload,
            query: query || {},
            headers: Object.assign(
                {},
                forgedHeaders,
                {
                    host: 'api.dashlane.com'
                },
                authorizationHeader
                    ? {
                          Authorization: authorizationHeader
                      }
                    : {}
            )
        },
        cb
    );
};
