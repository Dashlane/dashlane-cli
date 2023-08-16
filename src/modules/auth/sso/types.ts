export enum SsoMigrationServerMethod {
    SSO = 'sso',
    MP = 'master_password',
}

export interface SSOAuthenticationInfo {
    login: string;
    ssoToken: string;
    key: string;
    exists: string;
    currentAuths: SsoMigrationServerMethod;
    expectedAuths: SsoMigrationServerMethod;
}
