import * as apiconnect from './api-connect';
import { gotImplementation } from './utils/';
import { HTTPError } from 'got';
import * as got from 'got';

interface RequestApi {
    login: string;
    payload: Dictionary<unknown>;
    path: string;
    deviceKeys?: {
        accessKey: string;
        secretKey: string;
    };
}

interface DashlaneApiErrorResponse {
    errors: { type: string; code: string; message: string }[];
}

class DashlaneApiError extends Error {
    public code: string; // ex "invalid_otp_already_used"
    public type: string; // ex "business_error"
    constructor(details: DashlaneApiErrorResponse['errors'][0]) {
        super(details.message);
        this.code = details.code;
        this.type = details.type;
    }
}

export const requestApi = async <T>(params: RequestApi): Promise<T> => {
    const { payload, path, deviceKeys, login } = params;

    let response;
    try {
        response = await apiconnect.postRequestAPI<got.Response<string>>({
            requestFunction: gotImplementation,
            authentication: deviceKeys
                ? {
                      type: 'userDevice',
                      appAccessKey: 'C4F8H4SEAMXNBQVSASVBWDDZNCVTESMY',
                      appSecretKey: 'Na9Dz3WcmjMZ5pdYU1AmC5TdYkeWAOzvOK6PkbU4QjfjPQTSaXY8pjPwrvHfVH14',
                      login,
                      ...deviceKeys,
                  }
                : {
                      type: 'app',
                      appAccessKey: 'C4F8H4SEAMXNBQVSASVBWDDZNCVTESMY',
                      appSecretKey: 'Na9Dz3WcmjMZ5pdYU1AmC5TdYkeWAOzvOK6PkbU4QjfjPQTSaXY8pjPwrvHfVH14',
                  },
            path: 'v1/' + path,
            payload,
            userAgent: 'TURBOBOT', // the user agent is mandatory when using "fetch" module
        });
    } catch (error: unknown) {
        // Generate a DashlaneApiError if appropriate
        if (error instanceof HTTPError && typeof error.response?.body === 'string') {
            let details;
            try {
                details = (JSON.parse(error.response.body) as DashlaneApiErrorResponse).errors[0];
            } catch (_) {
                throw error;
            }
            if (details) {
                throw new DashlaneApiError(details);
            }
        }
        throw error;
    }

    if (response.statusCode !== 200) {
        throw new Error('Server responded an error : ' + response.body);
    }
    return (JSON.parse(response.body) as { data: T }).data;
};
