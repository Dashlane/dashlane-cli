import { getPremiumStatus, getTeamMembers as getTeamMembersRequest } from '../endpoints';
import { Secrets } from '../types';

interface GetTeamMembersParams {
    secrets: Secrets;
    page: number;
}

export const getTeamMembers = async (params: GetTeamMembersParams) => {
    const { secrets, page } = params;

    const premiumStatus = await getPremiumStatus({
        secrets,
    });
    const teamId = premiumStatus.b2bStatus?.currentTeam?.teamId;
    if (!teamId) {
        throw new Error('User not part of a team');
    }
    const response = await getTeamMembersRequest({
        secrets,
        teamId,
        page,
    });

    console.log(JSON.stringify(response));
};
