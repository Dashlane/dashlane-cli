import { requestApi } from '../requestApi';

type SupportedAuthenticationMethod = 'email_token' | 'totp' | 'duo_push' | 'dashlane_authenticator';

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

interface GetAuthenticationMethodsForDeviceResult {
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
    requestApi<GetAuthenticationMethodsForDeviceResult>({
        path: 'authentication/GetAuthenticationMethodsForDevice',
        login,
        payload: { login, methods: supportedMethods },
    });
