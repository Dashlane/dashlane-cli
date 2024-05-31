import { got, Response } from 'got';
import { RequestFunction, RequestFunctionOptions } from '../modules/api-connect/index.js';

export const gotImplementation: RequestFunction<Response<string>> = (options: RequestFunctionOptions) => {
    const { headers, json, url } = options;

    return got.post(url, {
        headers,
        json,
        retry: { limit: 3 },
        throwHttpErrors: false,
    });
};
