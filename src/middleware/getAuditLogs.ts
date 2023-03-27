import { getAuditLogs as getAuditLogsRequest } from '../endpoints';
import { Secrets } from '../types';

interface GetTeamMembersParams {
    secrets: Secrets;
    page: number;
    limit: number;
}

export const getAuditLogs = async (params: GetTeamMembersParams) => {
    const { secrets, page, limit } = params;

    const response = await getAuditLogsRequest({
        secrets,
        page,
        limit,
    });

    console.log(JSON.stringify(response));
};
