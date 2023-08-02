import { getTeamReport as getTeamReportRequest } from '../endpoints';
import { getTeamDeviceCredentials } from '../utils';

interface GetTeamMembersParams {
    days: number;
}

export const runTeamReport = async (params: GetTeamMembersParams) => {
    const { days } = params;
    const teamDeviceCredentials = getTeamDeviceCredentials();

    const response = await getTeamReportRequest({
        teamDeviceCredentials,
        days,
    });

    console.log(JSON.stringify(response));
};
