import { requestUserApi } from '../requestApi.js';
import { LocalConfiguration } from '../types.js';

interface RevokeReportAPIKey {
    accessKey: string;
    localConfiguration: LocalConfiguration;
}

export interface RevokeReportAPIKeyOutput {}

export const revokeReportAPIKey = (params: RevokeReportAPIKey) =>
    requestUserApi<RevokeReportAPIKeyOutput>({
        path: 'partners/RevokeReportAPIKey',
        login: params.localConfiguration.login,
        deviceKeys: {
            accessKey: params.localConfiguration.accessKey,
            secretKey: params.localConfiguration.secretKey,
        },
        payload: {
            accessKey: params.accessKey,
        },
    });
