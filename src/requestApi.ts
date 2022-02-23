import * as apiconnect from './api-connect/index.js';
import { gotImplementation } from './utils/gotImplementation.js';
import { HTTPError } from 'got';

interface RequestApi {
    login: string;
    payload: object;
    path: string;
    deviceKeys?: {
        accessKey: string;
        secretKey: string;
    };
}

class DashlaneApiError extends Error {
    public code: string; // ex "invalid_otp_already_used"
    public type: string; // ex "business_error"
    constructor(details: {type: string, code: string, message: string}) {
        super(details.message);
        this.code = details.code;
        this.type = details.type;
    }
}

export const requestApi = async (params: RequestApi): Promise<any> => {
    const { payload, path, deviceKeys, login } = params;

    let response;
    try {
        response = await apiconnect.postRequestAPI<any>({
            requestFunction: gotImplementation,
            authentication: deviceKeys
                ? {
                    type: 'userDevice',
                    appAccessKey: 'C4F8H4SEAMXNBQVSASVBWDDZNCVTESMY',
                    appSecretKey: 'Na9Dz3WcmjMZ5pdYU1AmC5TdYkeWAOzvOK6PkbU4QjfjPQTSaXY8pjPwrvHfVH14',
                    login,
                    ...deviceKeys
                }
                : {
                    type: 'app',
                    appAccessKey: 'C4F8H4SEAMXNBQVSASVBWDDZNCVTESMY',
                    appSecretKey: 'Na9Dz3WcmjMZ5pdYU1AmC5TdYkeWAOzvOK6PkbU4QjfjPQTSaXY8pjPwrvHfVH14'
                },
            path: 'v1/' + path,
            payload,
            userAgent: 'TURBOBOT' // the user agent is mandatory when using "fetch" module
        });
    } catch (error: unknown) { // Generate a DashlaneApiError if appropriate
        if (error instanceof HTTPError && typeof error.response?.body === 'string') {
            let details;
            try {
                details = JSON.parse(error.response.body).errors[0];
                // tslint:disable-next-line:no-empty
            } catch (err) {}
            if (details) {
                throw new DashlaneApiError(details);
            }
        }
        throw error;
    }

    if (response.statusCode !== 200) {
        throw new Error('Server responded an error : ' + response.body);
    }
    return JSON.parse(response.body).data;
};
