import * as apiconnect from '../api-connect';
import * as got from 'got';

export const gotImplementation: apiconnect.RequestFunction<got.Response<string>> = (
    options: apiconnect.RequestFunctionOptions,
    cb: Callback<got.Response<string>>
) => {
    const { headers, json, url } = options;

    got.default
        .post(url, {
            headers,
            json,
            retry: { limit: 3 }
        })
        .then((result) => cb(null, result))
        .catch((error) => cb(error));
};
