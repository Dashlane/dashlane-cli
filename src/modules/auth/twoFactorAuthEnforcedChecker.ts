import { getPremiumStatus } from '../../endpoints/index.js';
import { LocalConfiguration } from '../../types.js';
import { hasEnvDeviceCredentials } from '../../utils/index.js';
import { get2FAStatusUnauthenticated } from '../../endpoints/get2FAStatusUnauthenticated.js';

export const twoFactorAuthEnforcedChecker = async (localConfiguration: LocalConfiguration, login: string) => {
    const { type } = hasEnvDeviceCredentials()
        ? { type: 'email_token' as const }
        : await get2FAStatusUnauthenticated({ login });
    const premiumStatus = await getPremiumStatus({ localConfiguration });

    const twoFAEnforced = premiumStatus.b2bStatus?.currentTeam?.teamInfo.twoFAEnforced;

    if (twoFAEnforced && ['newDevice', 'login'].includes(twoFAEnforced) && type === 'email_token') {
        throw new Error(
            'Two-factor authentication (2FA) is enforced on this account. Please go to the Dashlane web extension to set up 2FA.'
        );
    }
};
