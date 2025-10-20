import { getTeamMembers as getTeamMembersRequest } from '../endpoints/index.js';
import { logger } from '../logger.js';
import {
    flattenJsonArrayOfObject,
    jsonToCsv,
    epochTimestampToIso,
    getEnrolledTeamDeviceCredentials,
} from '../utils/index.js';

interface GetTeamMembersOpts {
    csv: boolean;
    humanReadable: boolean;
}

export const runTeamMembers = async (page: number, limit: number, options: GetTeamMembersOpts) => {
    const enrolledTeamDeviceCredentials = getEnrolledTeamDeviceCredentials();

    const response = await getTeamMembersRequest({
        enrolledTeamDeviceCredentials,
        page,
        limit,
    });

    if (options.humanReadable) {
        response.members = response.members.map((member) => {
            const memberWithHumanReadableDates = {
                ...member,
                joinedDate: epochTimestampToIso(member.joinedDateUnix),
                invitedDate: epochTimestampToIso(member.invitedDateUnix),
                revokedDate: epochTimestampToIso(member.revokedDateUnix),
                lastUpdateDate: epochTimestampToIso(member.lastUpdateDateUnix),
            };

            delete memberWithHumanReadableDates.joinedDateUnix;
            delete memberWithHumanReadableDates.invitedDateUnix;
            delete memberWithHumanReadableDates.revokedDateUnix;
            delete memberWithHumanReadableDates.lastUpdateDateUnix;

            return memberWithHumanReadableDates;
        });
    }

    if (options.csv) {
        if (response.pages) {
            logger.content(`Page ${response.page + 1} of ${response.pages}`);
        }
        logger.content(jsonToCsv(flattenJsonArrayOfObject(response.members)));
        return;
    }

    logger.content(JSON.stringify(response));
};
