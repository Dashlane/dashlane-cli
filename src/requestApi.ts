import { Response, HTTPError } from 'got';
import { Authentication, postRequestAPI } from '@dashlane/apiconnect-worker';
import { CLI_VERSION, cliVersionToString } from './cliVersion.js';
import { gotImplementation } from './utils/index.js';
import { logger } from './logger.js';

interface RequestApi {
    payload: Record<string, unknown>;
    path: string;
    authentication: Authentication;
    isNitroEncryptionService?: boolean;
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
 * Dashlane CLI project is explicitly allowed by Dashlane, Inc. to use those keys
 */
const dashlaneApiKeys = {
    appAccessKey: 'HB9JQATDY6Y62JYKT7KXBN4C7FH8HKC5',
    appSecretKey: 'boUtXxmDgLUtNFaigCMQ3+u+LAx0tg1ePAUE13nkR7dto+Zwq1naOHZTwbxxM7iL',
};

const requestApi = async <T>(params: RequestApi): Promise<T> => {
    const { payload, path, authentication, isNitroEncryptionService } = params;

    let response: Response<string>;
    try {
        response = await postRequestAPI<Response<string>>({
            requestFunction: gotImplementation,
            authentication,
            path: (isNitroEncryptionService ? 'v1-nitro-encryption-service/' : 'v1/') + path,
            payload,
            userAgent: `Dashlane CLI v${cliVersionToString(CLI_VERSION)}`,
            customHost: process.env.DCLI_STAGING_HOST,
        });
    } catch (error: unknown) {
        // Generate a DashlaneApiError if appropriate
        if (error instanceof HTTPError && typeof error.response?.body === 'string') {
            let details;
            try {
                details = (JSON.parse(error.response.body) as DashlaneApiErrorResponse).errors[0];
            } catch (parseError) {
                logger.debug('Failed to parse error response', parseError);
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

export interface RequestAppApi {
    payload: Record<string, unknown>;
    path: string;
    isNitroEncryptionService?: boolean;
}

export const requestAppApi = async <T>(params: RequestAppApi): Promise<T> => {
    return requestApi({
        ...params,
        authentication: {
            type: 'app',
            ...dashlaneApiKeys,
        },
    });
};

export interface RequestUserApi {
    login: string;
    payload: Record<string, unknown>;
    path: string;
    deviceKeys: {
        accessKey: string;
        secretKey: string;
    };
    isNitroEncryptionService?: boolean;
}

export const requestUserApi = async <T>(params: RequestUserApi): Promise<T> => {
    const { login, deviceKeys, ...otherParams } = params;
    return requestApi({
        ...otherParams,
        authentication: {
            type: 'userDevice',
            ...dashlaneApiKeys,
            login,
            ...deviceKeys,
        },
    });
};

export interface RequestEnrolledDeviceApi {
    payload: Record<string, unknown>;
    path: string;
    isNitroEncryptionService?: boolean;
    enrolledTeamDeviceKeys: {
        nodeWSAccessKey: string;
        nitroDeviceAccessKey: string;
        secretKey: string;
    };
}

export const requestEnrolledDeviceApi = async <T>(params: RequestEnrolledDeviceApi): Promise<T> => {
    const { enrolledTeamDeviceKeys, ...otherParams } = params;
    return requestApi({
        ...otherParams,
        authentication: {
            type: 'enrolledDevice',
            ...dashlaneApiKeys,
            ...enrolledTeamDeviceKeys,
        },
    });
};
