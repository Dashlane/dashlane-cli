import { requestAppApi } from '../requestApi.js';

type GetAuthenticationMethodsParams =
    | {
          login: string;
          authTicket: string;
      }
    | {
          login: string;
          deviceAccessKey: string;
      };

export type LocalAuthenticationMethod =
    | {
          type: 'masterPassword' | 'securityKey' | 'pin' | 'passkey' | 'local';
      }
    | {
          type: 'sso';
          serviceProviderUrl: string;
          migration: 'sso_member_to_admin' | 'mp_user_to_sso_member' | 'sso_member_to_mp_user';
          isNitroProvider: boolean;
      };

export interface RemoteAuthenticationMethod {
    type: 'emailToken' | 'totp' | 'securityKey';
    requiredOnLogin: boolean;
}

export interface UserVerificationMethod {
    type: 'masterPassword' | 'securityKey' | 'pin' | 'passkey' | 'local';
}

export interface RecoveryMethod {
    type: 'aar' | 'ark' | 'd2d';
}

export interface GetAuthenticationMethodsResult {
    localAuthentications: LocalAuthenticationMethod[];
    remoteAuthentications: RemoteAuthenticationMethod[];
    userVerificationMethods: UserVerificationMethod[];
    recoveryMethods: RecoveryMethod[];
}

// Unused for now
export type GetAuthenticationMethodsError =
    | 'INVALID_AUTH_TICKET'
    | 'SSO_BLOCKED'
    | 'TEAM_SOFT_DISCONTINUED'
    | 'DEACTIVATED_USER'
    | 'EXPIRED_VERSION';

export const getAuthenticationMethods = ({ login, ...params }: GetAuthenticationMethodsParams) => {
    const payload =
        'authTicket' in params ? { authTicket: params.authTicket } : { deviceAccessKey: params.deviceAccessKey };

    return requestAppApi<GetAuthenticationMethodsResult>({
        path: 'authentication/GetAuthenticationMethods',
        payload: { login, ...payload },
    });
};
