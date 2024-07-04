import { askConfirmReset } from '../utils/index.js';
import { logout } from '../modules/auth/logout.js';

export const runLogout = async (options: { ignoreRevocation: boolean }) => {
    const resetConfirmation = await askConfirmReset();
    if (!resetConfirmation) {
        return;
    }

    await logout({ ignoreRevocation: options.ignoreRevocation });
};
