import { getPremiumStatus } from '../../endpoints';
import { LocalConfiguration } from '../../types';
import { TwoFactorAuthenticationType } from '../../types/two-factor-authentication';

export const twoFactorAuthEnforcedChecker = async (
    localConfiguration: LocalConfiguration,
    authType: TwoFactorAuthenticationType
) => {
    const premiumStatus = await getPremiumStatus({ localConfiguration });

    const twoFAEnforced = premiumStatus.b2bStatus?.currentTeam?.teamInfo.twoFAEnforced;

    if (twoFAEnforced && ['newDevice', 'login'].includes(twoFAEnforced) && authType === 'email_token') {
        throw new Error(
            'Two-factor authentication (2FA) is enforced on this account. Please go to the Dashlane web extension to set up 2FA.'
        );
    }
};
