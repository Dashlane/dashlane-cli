import got from 'got';
import * as apiConnect from '../modules/api-connect/index.js';

export const gotImplementation: apiConnect.RequestFunction<got.Response<string>> = (
    options: apiConnect.RequestFunctionOptions
) => {
    const { headers, json, url } = options;

    return got.default.post(url, {
        headers,
        json,
        retry: { limit: 3 },
        throwHttpErrors: false,
    });
};
