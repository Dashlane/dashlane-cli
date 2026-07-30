import { getAuthenticationMethods, RemoteAuthenticationMethod } from '../../../endpoints';
interface GetRemoteAuthenticationAndSSOInfoParams {
    login: string;
    deviceAccessKey: string;
}

export enum RemoteOrSSOAuthenticationType {
    totp_login = 'totp_login',
    totp_new_device = 'totp_new_device',
    security_key = 'security_key',
    email_token = 'email_token',
    none = 'none',
}

interface GetRemoteAuthenticationAndSSOInfoResult {
    remoteAuthentication: RemoteOrSSOAuthenticationType;
    isSSO: boolean;
}

export const getRemoteAuthenticationAndSSOInfo = async ({
    login,
    deviceAccessKey,
}: GetRemoteAuthenticationAndSSOInfoParams): Promise<GetRemoteAuthenticationAndSSOInfoResult> => {
    const { localAuthentications, remoteAuthentications } = await getAuthenticationMethods({ deviceAccessKey, login });

    const isSSO = localAuthentications.some((auth) => auth.type === 'sso');

    return {
        isSSO,
        remoteAuthentication: getRemoteAuthenticationInfo(remoteAuthentications),
    };
};

const getRemoteAuthenticationInfo = (
    remoteAuthentications: RemoteAuthenticationMethod[]
): RemoteOrSSOAuthenticationType => {
    const totp = remoteAuthentications.find((auth) => auth.type === 'totp');
    const isSecurityKey = remoteAuthentications.some((auth) => auth.type === 'securityKey');
    const isEmailToken = remoteAuthentications.some((auth) => auth.type === 'emailToken');

    if (totp) {
        return totp.requiredOnLogin
            ? RemoteOrSSOAuthenticationType.totp_login
            : RemoteOrSSOAuthenticationType.totp_new_device;
    }

    if (isSecurityKey) {
        return RemoteOrSSOAuthenticationType.security_key;
    }

    if (isEmailToken) {
        return RemoteOrSSOAuthenticationType.email_token;
    }

    throw new Error('Remote Authentication not supported');
};
