import { requestApi } from '../requestApi.js';
import { DeviceKeys } from '../types';

interface GetLatestContent {
    login: string;
    timestamp: number;
    deviceKeys: DeviceKeys;
}

export interface GetLatestContentOutput {
    transactions: (
        | {
              /**
               * Version of the transaction (for treatproblems)
               */
              backupDate: number;
              /**
               * Identifiers (GUID or special identifiers XXXXXXXX_userId for unique objects)
               */
              identifier: string;
              /**
               * User local timestamp of the latest modification of this item
               */
              time: number;
              /**
               * Base 64 encoded content of the object
               */
              content: string;
              /**
               * Object type
               */
              type: string;
              /**
               * Whether this transaction is to EDIT(/ADD) an object or REMOVE it
               */
              action: 'BACKUP_EDIT';
          }
        | {
              /**
               * Version of the transaction (for treatproblems)
               */
              backupDate: number;
              /**
               * Identifiers (GUID or special identifiers XXXXXXXX_userId for unique objects)
               */
              identifier: string;
              /**
               * User local timestamp of the latest modification of this item
               */
              time: number;
              /**
               * Object type
               */
              type: string;
              /**
               * Whether this transaction is to EDIT(/ADD) an object or REMOVE it
               */
              action: 'BACKUP_REMOVE';
          }
    )[];
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
     * Is the client allowed to upload non basic data
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
        | {};
}

export const getLatestContent = (params: GetLatestContent, cb: Callback<GetLatestContentOutput>) => {
    const { login, timestamp, deviceKeys } = params;

    requestApi(
        {
            path: 'sync/GetLatestContent',
            login,
            deviceKeys,
            payload: {
                timestamp,
                needsKeys: false,
                teamAdminGroups: false,
                transactions: []
            }
        },
        cb
    );
};
