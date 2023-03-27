import { getPremiumStatus, getTeamMembers as getTeamMembersRequest } from '../endpoints';
import { Secrets } from '../types';

interface GetTeamMembersParams {
    secrets: Secrets;
    page: number;
    limit: number;
}

export const getTeamMembers = async (params: GetTeamMembersParams) => {
    const { secrets, page, limit } = params;

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
        limit,
    });

    console.log(JSON.stringify(response));
};
