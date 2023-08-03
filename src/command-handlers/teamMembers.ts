import { getTeamMembers as getTeamMembersRequest } from '../endpoints';
import { getTeamDeviceCredentials, flattenJsonArrayOfObject, jsonToCsv, epochTimestampToIso } from '../utils';

interface GetTeamMembersParams {
    page: number;
    limit: number;
    csv: boolean;
    humanReadable: boolean;
}

export const runTeamMembers = async (params: GetTeamMembersParams) => {
    const { page, limit } = params;
    const teamDeviceCredentials = getTeamDeviceCredentials();

    const response = await getTeamMembersRequest({
        teamDeviceCredentials,
        page,
        limit,
    });

    if (params.humanReadable) {
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

    if (params.csv) {
        if (response.pages) {
            console.log(`Page ${response.page + 1} of ${response.pages}`);
        }
        console.log(jsonToCsv(flattenJsonArrayOfObject(response.members)));
        return;
    }

    console.log(JSON.stringify(response));
};
