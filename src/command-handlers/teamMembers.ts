import { getTeamMembers as getTeamMembersRequest } from '../endpoints';
import { getTeamDeviceCredentials } from '../utils';

interface GetTeamMembersParams {
    page: number;
    limit: number;
}

export const runTeamMembers = async (params: GetTeamMembersParams) => {
    const { page, limit } = params;
    const teamDeviceCredentials = getTeamDeviceCredentials();

    const response = await getTeamMembersRequest({
        teamDeviceCredentials,
        page,
        limit,
    });

    console.log(JSON.stringify(response));
};
