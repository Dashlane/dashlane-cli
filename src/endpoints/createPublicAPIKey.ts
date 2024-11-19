import { requestUserApi } from '../requestApi.js';
import { LocalConfiguration } from '../types.js';

interface CreatePublicAPIKey {
    description: string;
    localConfiguration: LocalConfiguration;
}

export interface CreatePublicAPIKeyOutput {
    /**
     * Team UUID
     */
    teamUuid: string;
    /**
     * Public Api access key
     */
    accessKey: string;
    /**
     * Public Api secret key
     */
    secretKey: string;
}

export const createPublicAPIKey = (params: CreatePublicAPIKey) =>
    requestUserApi<CreatePublicAPIKeyOutput>({
        path: 'partners/CreatePublicAPIKey',
        login: params.localConfiguration.login,
        deviceKeys: {
            accessKey: params.localConfiguration.accessKey,
            secretKey: params.localConfiguration.secretKey,
        },
        payload: {
            description: params.description,
            origin: 'server_cli',
        },
    });
