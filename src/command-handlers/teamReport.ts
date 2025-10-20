import { getTeamReport as getTeamReportRequest } from '../endpoints/index.js';
import { logger } from '../logger.js';
import { getEnrolledTeamDeviceCredentials } from '../utils/index.js';

interface GetTeamMembersParams {
    days: number;
}

export const runTeamReport = async (params: GetTeamMembersParams) => {
    const { days } = params;
    const enrolledTeamDeviceCredentials = getEnrolledTeamDeviceCredentials();

    const response = await getTeamReportRequest({
        enrolledTeamDeviceCredentials,
        days,
    });

    logger.content(JSON.stringify(response));
};
