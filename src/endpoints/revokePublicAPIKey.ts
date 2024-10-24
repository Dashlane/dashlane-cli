import { requestUserApi } from '../requestApi.js';
import { LocalConfiguration } from '../types.js';

interface RevokePublicAPIKey {
    accessKey: string;
    localConfiguration: LocalConfiguration;
}

export interface RevokePublicAPIKeyOutput {}

export const revokePublicAPIKey = (params: RevokePublicAPIKey) =>
    requestUserApi<RevokePublicAPIKeyOutput>({
        path: 'partners/RevokePublicAPIKey',
        login: params.localConfiguration.login,
        deviceKeys: {
            accessKey: params.localConfiguration.accessKey,
            secretKey: params.localConfiguration.secretKey,
        },
        payload: {
            accessKey: params.accessKey,
        },
    });
