import { requestApi } from '../requestApi.js';

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
              type: 'email_token' | 'totp' | 'duo_push';
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
               * DEPRECATED: Please use the "serviceProviderUrl" attribute in the the ssoInfo object
               */
              ssoServiceProviderUrl: string;
          }
    )[];
}

export const requestDeviceRegistration =
    (params: RequestDeviceRegistration): Promise<RequestDeviceRegistrationOutput> =>
        requestApi({
            path: 'authentication/RequestDeviceRegistration',
            login: params.login,
            payload: { login: params.login }
        });
