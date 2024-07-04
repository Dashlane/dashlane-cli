import { logger } from '../logger';
import { logout } from '../modules/auth';
import { connectAndPrepare } from '../modules/database/connectAndPrepare';
import { askConfirmRecovery, askConfirmShowMp } from '../utils';
import { sync } from './sync';

export const runAccountRecovery = async () => {
    const doRecovery = await askConfirmRecovery();
    if (!doRecovery) {
        return;
    }
    const shouldShowMp = await askConfirmShowMp();

    await logout({ ignoreRevocation: false });
    const { db, localConfiguration, deviceConfiguration } = await connectAndPrepare({
        autoSync: false,
        recoveryOptions: {
            promptForArk: true,
            displayMasterpassword: shouldShowMp,
        },
    });

    try {
        await sync({ db, localConfiguration, deviceConfiguration });
        logger.success('Account recovered! you can use the CLI to export its data.');
    } catch (error) {
        logger.error(
            'Sync failed. It probably means that the masterpassword locked behind the recovery key\n' +
                'is not matching. Try running the command again and show the masterpassword. Maybe you will\n' +
                'remember the one you initially set up'
        );

        throw error;
    } finally {
        db.close();
    }
};
