export interface DeviceKeys {
    accessKey: string;
    secretKey: string;
}

export interface DeviceKeysWithLogin extends DeviceKeys {
    login: string;
}

export interface BackupEditTransaction {
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

export interface BackupRemoveTransaction {
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
