import { getTeamDarkWebInsightsReport } from '../endpoints/index.js';
import { logger } from '../logger.js';
import { getTeamDeviceCredentials } from '../utils/index.js';

export const runTeamDarkWebInsightsReport = async (
    domain: string,
    options: { orderBy?: 'DEFAULT' | 'UNSEEN' | 'TEAM_MEMBERS' | 'PUBLISH_DATE'; count?: number; offset?: number }
) => {
    const { orderBy, count, offset } = options;

    const teamDeviceCredentials = getTeamDeviceCredentials();

    const response = await getTeamDarkWebInsightsReport({
        teamDeviceCredentials,
        domain,
        orderBy: orderBy ?? 'DEFAULT',
        count: count ?? 100,
        offset: offset ?? 0,
    });

    logger.content(JSON.stringify(response));
};
