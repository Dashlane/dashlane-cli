import { getTeamReport as getTeamReportRequest } from '../endpoints/index.js';
import { logger } from '../logger.js';
import { getTeamDeviceCredentials } from '../utils/index.js';

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
