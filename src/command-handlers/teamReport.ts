import { getTeamReport as getTeamReportRequest } from '../endpoints';
import { logger } from '../logger';
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

    logger.content(JSON.stringify(response));
};
