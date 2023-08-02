import { getTeamReport as getTeamReportRequest } from '../endpoints';
import { TeamDeviceCredentials } from '../types';

interface GetTeamMembersParams {
    teamDeviceCredentials: TeamDeviceCredentials;
    days: number;
}

export const getTeamReport = async (params: GetTeamMembersParams) => {
    const { teamDeviceCredentials, days } = params;

    const response = await getTeamReportRequest({
        teamDeviceCredentials,
        days,
    });

    console.log(JSON.stringify(response));
};
