import { getTeamMembers as getTeamMembersRequest } from '../endpoints';
import { getTeamDeviceCredentials, flattenJsonArrayOfObject, jsonToCsv } from '../utils';

interface GetTeamMembersParams {
    page: number;
    limit: number;
    csv: boolean;
}

export const runTeamMembers = async (params: GetTeamMembersParams) => {
    const { page, limit } = params;
    const teamDeviceCredentials = getTeamDeviceCredentials();

    const response = await getTeamMembersRequest({
        teamDeviceCredentials,
        page,
        limit,
    });

    if (params.csv) {
        if (response.pages) {
            console.log(`Page ${response.page + 1} of ${response.pages}`);
        }
        console.log(jsonToCsv(flattenJsonArrayOfObject(response.members)));
        return;
    }

    console.log(JSON.stringify(response));
};
