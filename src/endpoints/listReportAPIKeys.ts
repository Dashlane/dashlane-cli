import { requestUserApi } from '../requestApi.js';
import { LocalConfiguration } from '../types.js';

interface ListReportAPIKeys {
    localConfiguration: LocalConfiguration;
}

export interface ListReportAPIKeysOutput {
    /**
     * List of api keys
     */
    reportAPIKeys: {
        /**
         * The creation date
         */
        creationDateUnix: number;
        /**
         * The last modification date
         */
        updateDateUnix: number;
        /**
         * The last invalidation date
         */
        invalidationDateUnix: null | number;
        /**
         * The access key
         */
        accessKey: string;
        /**
         * The description of the api key
         */
        description: string;
        /**
         * Platform used to create the report api key
         */
        origin: string;
        /**
         * Is the report api key activated or not
         */
        valid: boolean;
    }[];
}

export const listReportAPIKeys = (params: ListReportAPIKeys) =>
    requestUserApi<ListReportAPIKeysOutput>({
        path: 'partners/ListReportAPIKeys',
        login: params.localConfiguration.login,
        deviceKeys: {
            accessKey: params.localConfiguration.accessKey,
            secretKey: params.localConfiguration.secretKey,
        },
        payload: {},
    });
