import { requestApi } from '../requestApi.js';
import type { BackupEditTransaction, BackupRemoveTransaction, Secrets } from '../types';

interface GetLatestContent {
    login: string;
    timestamp: number;
    secrets: Secrets;
}

export interface GetLatestContentOutput {
    transactions: Array<BackupEditTransaction | BackupRemoveTransaction>;
    fullBackup: {
        /**
         * List of transaction ids that should be fetched in the full backup (other transactions must be ignored)
         */
        transactions?: {
            /**
             * The transaction identifier
             */
            identifier: string;
            /**
             * The backup date of the transaction, to be used in treat problem
             */
            backupDate?: number;
        }[];
        /**
         * Base 64 encoded full backup data
         */
        content?: string | null;
    };
    timestamp: number;
    sharing2: {
        itemGroups: {
            id: string;
            revision: number;
        }[];
        items: {
            id: string;
            timestamp: number;
        }[];
        userGroups: {
            id: string;
            revision: number;
        }[];
    };
    /**
     * Is Sync allowed - DEPRECATED, use uploadEnabled instead
     */
    syncAllowed: boolean;
    /**
     * Is the client allowed to upload non-basic data
     */
    uploadEnabled: boolean;
    summary: {
        [k: string]: {
            [k: string]: number;
        };
    };
    keys?:
        | {
              publicKey: string;
              privateKey: string;
          }
        | Record<string, never>;
}

export const getLatestContent = (params: GetLatestContent) =>
    requestApi<GetLatestContentOutput>({
        path: 'sync/GetLatestContent',
        login: params.login,
        deviceKeys: {
            accessKey: params.secrets.accessKey,
            secretKey: params.secrets.secretKey,
        },
        payload: {
            timestamp: params.timestamp,
            needsKeys: false,
            teamAdminGroups: false,
            transactions: [],
        },
    });
