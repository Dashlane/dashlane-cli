import { getTeamMembers as getTeamMembersRequest } from '../endpoints';
import { TeamDeviceCredentials } from '../types';

interface GetTeamMembersParams {
    teamDeviceCredentials: TeamDeviceCredentials;
    page: number;
    limit: number;
}

export const getTeamMembers = async (params: GetTeamMembersParams) => {
    const { teamDeviceCredentials, page, limit } = params;

    const response = await getTeamMembersRequest({
        teamDeviceCredentials,
        page,
        limit,
    });

    console.log(JSON.stringify(response));
};
