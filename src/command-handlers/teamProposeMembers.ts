import { proposeMembers as proposeMembersRequest, ProposeMembersParams } from '../endpoints/index.js';
import { logger } from '../logger.js';
import { getEnrolledTeamDeviceCredentials } from '../utils/index.js';

interface ProposeMembersOpts {
    skipAccountCreationRequiredAlerts?: boolean;
    skipProposals?: boolean;
    skipRemovals?: boolean;
    skipReproposals?: boolean;
    senderEmail?: string;
}

export const runTeamProposeMembers = async (logins: string[], options?: ProposeMembersOpts) => {
    const enrolledTeamDeviceCredentials = getEnrolledTeamDeviceCredentials();

    const requestParams: ProposeMembersParams = {
        enrolledTeamDeviceCredentials,
        proposedMemberLogins: logins,
    };

    if (options) {
        requestParams.notificationOptions = options;
    }

    const response = await proposeMembersRequest(requestParams);

    logger.content(JSON.stringify(response));
};
