import { requestUserApi } from '../requestApi.js';
import { LocalConfiguration } from '../types.js';

interface CreateReportAPIKey {
    description: string;
    localConfiguration: LocalConfiguration;
}

export interface CreateReportAPIKeyOutput {
    /**
     * Team UUID
     */
    teamUuid: string;
    /**
     * Report Api access key
     */
    accessKey: string;
    /**
     * Report Api secret key
     */
    secretKey: string;
}

export const createReportAPIKey = (params: CreateReportAPIKey) =>
    requestUserApi<CreateReportAPIKeyOutput>({
        path: 'partners/CreateReportAPIKey',
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
