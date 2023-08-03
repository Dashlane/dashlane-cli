export interface GenericLog {
    schema_version: string;
    /**
     * The audit log's unique ID
     */
    uuid: string;
    /**
     * The team ID the user that performed the action is a member of.
     */
    team_id: number;
    /**
     * The user ID of the user that performed the action.
     */
    author_user_id: number;
    /**
     * The user ID of the user that is the target of the action.
     */
    target_user_id?: number;
    /**
     * The sharing group ID the performed action is associated with.
     */
    sharing_group_id?: number;
    /**
     * The type of the audit log. (e.g. user_device_added).
     */
    log_type: string;
    /**
     * A milliseconds timestamp of the date and time the action occurred.
     */
    date_time: number;
    author_client?: {
        /**
         * Dashlane client version of the user that did or logged the action.
         */
        version?: string | null;
        /**
         * Dashlane client platform of the user that did or logged the action.
         */
        platform?: string | null;
    };
    /**
     * The category the audit log type falls under.
     */
    category:
        | 'account'
        | 'authentication'
        | 'dark_web_monitoring'
        | 'groups'
        | 'import_export'
        | 'sharing'
        | 'team_settings'
        | 'team_settings_activedirectory'
        | 'team_settings_policies'
        | 'team_settings_samlprovisioning'
        | 'team_settings_scim'
        | 'team_settings_sso'
        | 'user_settings'
        | 'user_settings_accountrecovery'
        | 'users'
        | 'vault_ids'
        | 'vault_passwords'
        | 'vault_payments'
        | 'vault_personalinfo'
        | 'vault_securenotes';
    /**
     * The team device ID of the team that performed the action.
     */
    author_team_device_id?: number;
    /**
     * Whether the audit log contains sensitive data.
     */
    is_sensitive?: boolean;
    properties?: {
        [k: string]: any;
    };
    encrypted_properties?: {
        [k: string]: any;
    };
    server_encrypted_properties?: {
        [k: string]: any;
    };
    meta?: {
        /**
         * The encryption key used to encrypt the encrypted_properties property.
         */
        encrypted_properties_encryption_key_uuid?: string;
        /**
         * The encryption key used to encrypt the server_encrypted_properties property.
         */
        server_encrypted_properties_encryption_key_uuid?: string;
    };
}
