import { requestApi } from '../requestApi';
import { TwoFactorAuthenticationType } from '../types/two-factor-authentication';

interface Get2FAStatusParams {
    login: string;
}

export interface Get2FAStatusOutput {
    type: TwoFactorAuthenticationType;
    ssoInfo?: {
        serviceProviderUrl: string;
        migration?: 'sso_member_to_admin' | 'mp_user_to_sso_member' | 'sso_member_to_mp_user';
        /** This flag will be set to true if the service provider is using Nitro enclaves */
        isNitroProvider?: boolean;
    };
}

export const get2FAStatusUnauthenticated = ({ login }: Get2FAStatusParams) =>
    requestApi<Get2FAStatusOutput>({
        path: 'authentication/Get2FAStatusUnauthenticated',
        login,
        payload: { login },
    });
