import got, { Response } from 'got';
import * as apiConnect from '../modules/api-connect';

export const gotImplementation: apiConnect.RequestFunction<Response<string>> = (
    options: apiConnect.RequestFunctionOptions
) => {
    const { headers, json, url } = options;

    return got.post(url, {
        headers,
        json,
        retry: { limit: 3 },
        throwHttpErrors: false,
    });
};
