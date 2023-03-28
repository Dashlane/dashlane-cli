import { requestUserApi } from '../requestApi';
import { Secrets } from '../types';

interface GetTeamMembersParams {
    secrets: Secrets;
    page: number;
    limit: number;
}

export const getAuditLogs = (params: GetTeamMembersParams) => {
    return requestUserApi<GetAuditLogsOutput>({
        path: 'teams/GetAuditLogs',
        login: params.secrets.login,
        deviceKeys: {
            accessKey: params.secrets.accessKey,
            secretKey: params.secrets.secretKey,
        },
        payload: {
            pageNumber: params.page,
            pageCount: params.limit,
        },
    });
};

export interface GetAuditLogsOutput {
    /**
     * Array of audit logs
     */
    auditLogs: string[];
}
