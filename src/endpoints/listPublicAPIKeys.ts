import { requestUserApi } from '../requestApi.js';
import { LocalConfiguration } from '../types.js';

interface ListPublicAPIKeys {
    localConfiguration: LocalConfiguration;
}

export interface ListPublicAPIKeysOutput {
    /**
     * List of api keys
     */
    publicAPIKeys: {
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

export const listPublicAPIKeys = (params: ListPublicAPIKeys) =>
    requestUserApi<ListPublicAPIKeysOutput>({
        path: 'partners/ListPublicAPIKeys',
        login: params.localConfiguration.login,
        deviceKeys: {
            accessKey: params.localConfiguration.accessKey,
            secretKey: params.localConfiguration.secretKey,
        },
        payload: {},
    });
