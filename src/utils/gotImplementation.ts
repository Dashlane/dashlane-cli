import * as apiconnect from '../api-connect';
import * as got from 'got';

export const gotImplementation: apiconnect.RequestFunction<got.Response<string>> = (
    options: apiconnect.RequestFunctionOptions
) => {
    const { headers, json, url } = options;

    return got.default.post(url, {
        headers,
        json,
        retry: { limit: 3 },
    });
};
