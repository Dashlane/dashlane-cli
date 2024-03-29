import { promptTouchID, canPromptTouchID } from 'node-mac-auth';
import { DeviceConfiguration } from '../../types';

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
        if (canPromptTouchID()) {
            return promptTouchID({
                reason: 'validate your identity before accessing your vault',
                reuseDuration: 60, // 1min - dies when program closes
            }).catch((error) => {
                throw new Error(`Touch ID verification failed: ${error}`);
            });
        } else {
            throw new Error('Biometrics are not supported on your device.');
        }
    }
};
