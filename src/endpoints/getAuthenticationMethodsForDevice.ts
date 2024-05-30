import { requestAppApi } from '../requestApi.js';
import { SupportedAuthenticationMethod } from '../types.js';

const defaultSupportedMethods: SupportedAuthenticationMethod[] = [
    'email_token',
    'totp',
    'duo_push',
    'dashlane_authenticator',
];

interface GetAuthenticationMethodsForDeviceParams {
    login: string;
    supportedMethods?: SupportedAuthenticationMethod[];
}

export interface GetAuthenticationMethodsForDeviceResult {
    /** The authentication methods available for the user */
    verifications: (
        | {
              type: 'sso';
              ssoInfo: {
                  serviceProviderUrl: string;
                  migration?: 'sso_member_to_admin' | 'mp_user_to_sso_member' | 'sso_member_to_mp_user';
                  /** This flag will be set to true if the service provider is using Nitro enclaves */
                  isNitroProvider?: boolean;
              };
          }
        | Record<string, never>
        | {
              type: 'email_token' | 'totp' | 'duo_push' | 'dashlane_authenticator';
          }
        | {
              type: 'u2f';
              challenges?: {
                  challenge: string;
                  version: string;
                  appId: string;
                  keyHandle: string;
              }[];
          }
    )[];
    /**
     * Indicates the type of account the user owns
     */
    accountType: 'masterPassword' | 'invisibleMasterPassword';
}

// Unused for now
export type GetAuthenticationMethodsForDeviceError =
    | 'user_not_found'
    | 'SSO_BLOCKED'
    | 'WRONG_SSO_STATUS_TO_MIGRATE'
    | 'CLIENT_VERSION_DOES_NOT_SUPPORT_SSO_MIGRATION'
    | 'expired_version';

export const getAuthenticationMethodsForDevice = ({
    login,
    supportedMethods = defaultSupportedMethods,
}: GetAuthenticationMethodsForDeviceParams) =>
    requestAppApi<GetAuthenticationMethodsForDeviceResult>({
        path: 'authentication/GetAuthenticationMethodsForDevice',
        payload: { login, methods: supportedMethods },
    });
