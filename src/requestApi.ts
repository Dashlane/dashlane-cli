import * as got from 'got';
import * as apiconnect from './api-connect';
import { CLI_VERSION, cliVersionToString } from './cliVersion';
import { gotImplementation } from './utils/';

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

/**
 * Don't report security issues for having this API keys here, this is expected
 * Dashlane CLI project is explicitely allowed by Dashlane, Inc. to use those keys
 */
const dashlaneApiKeys = {
    appAccessKey: 'HB9JQATDY6Y62JYKT7KXBN4C7FH8HKC5',
    appSecretKey: 'boUtXxmDgLUtNFaigCMQ3+u+LAx0tg1ePAUE13nkR7dto+Zwq1naOHZTwbxxM7iL',
};

export const requestApi = async <T>(params: RequestApi): Promise<T> => {
    const { payload, path, deviceKeys, login } = params;

    let response;
    try {
        response = await apiconnect.postRequestAPI<got.Response<string>>({
            requestFunction: gotImplementation,
            authentication: deviceKeys
                ? {
                      type: 'userDevice',
                      ...dashlaneApiKeys,
                      login,
                      ...deviceKeys,
                  }
                : {
                      type: 'app',
                      ...dashlaneApiKeys,
                  },
            path: 'v1/' + path,
            payload,
            userAgent: `Dashlane CLI v${cliVersionToString(CLI_VERSION)}`,
        });
    } catch (error: unknown) {
        // Generate a DashlaneApiError if appropriate
        if (error instanceof got.HTTPError && typeof error.response?.body === 'string') {
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
