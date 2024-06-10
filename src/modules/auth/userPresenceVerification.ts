import { DeviceConfiguration } from '../../types.js';

export const userPresenceVerification = async (params: { deviceConfiguration: DeviceConfiguration | null }) => {
    const { deviceConfiguration } = params;

    if (
        !deviceConfiguration ||
        deviceConfiguration.userPresenceVerification === 'none' ||
        deviceConfiguration.userPresenceVerification === null
    ) {
        return;
    }

    if (deviceConfiguration.userPresenceVerification === 'biometrics') {
        if (process.platform === 'darwin') {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const nodemacauth = require('node-mac-auth') as typeof import('node-mac-auth');
            const { canPromptTouchID, promptTouchID } = nodemacauth;
            if (canPromptTouchID()) {
                return promptTouchID({
                    reason: 'validate your identity before accessing your vault',
                }).catch((error) => {
                    throw new Error(`Touch ID verification failed: ${error}`);
                });
            }
        } else {
            throw new Error('Biometrics are only supported on macos for now.');
        }
    }
};
