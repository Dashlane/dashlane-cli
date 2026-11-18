import { removeMembers as removeMembersRequest } from '../endpoints/index.js';
import { logger } from '../logger.js';
import { getEnrolledTeamDeviceCredentials } from '../utils/index.js';

export const runTeamRemoveMembers = async (logins: string[]) => {
    const enrolledTeamDeviceCredentials = getEnrolledTeamDeviceCredentials();

    const response = await removeMembersRequest({
        enrolledTeamDeviceCredentials,
        removedMemberLogins: logins,
    });

    logger.content(JSON.stringify(response));
};
