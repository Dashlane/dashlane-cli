import { requestApi } from '../requestApi';

interface RequestDeviceRegistration {
    login: string;
}

export interface RequestDeviceRegistrationOutput {
    ssoInfo?: {
        serviceProviderUrl: string;
        migration?: 'sso_member_to_admin' | 'mp_user_to_sso_member' | 'sso_member_to_mp_user';
    };
    /**
     * The authentication methods available for this user
     */
    verification: (
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
        | {
              type: 'sso';
              /**
               * DEPRECATED: Please use the "serviceProviderUrl" attribute in the ssoInfo object
               */
              ssoServiceProviderUrl: string;
          }
    )[];
}
/**
 * @deprecated Use getAuthenticationMethodsForDevice
 */
export const requestDeviceRegistration = (params: RequestDeviceRegistration) =>
    requestApi<RequestDeviceRegistrationOutput>({
        path: 'authentication/RequestDeviceRegistration',
        login: params.login,
        payload: { login: params.login, hasDashlaneAuthenticatorSupport: true },
    });
