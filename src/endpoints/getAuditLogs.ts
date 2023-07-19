import { requestTeamApi } from '../requestApi';
import { TeamDeviceCredentials } from '../types';

export interface StartAuditLogsQueryParams {
    teamDeviceCredentials: TeamDeviceCredentials;

    /**
     * The start of the date range to query audit logs by. The format is unix timestamp in seconds. Only the date is used, not the time.
     */
    startDateRangeUnix: number;
    /**
     * The end of the date range of to query audit logs by. The format is unix timestamp in seconds. Only the date is used, not the time.
     */
    endDateRangeUnix: number;
    /**
     * The user ID of the author of the audit log.
     */
    authorUserId?: number;
    /**
     * The ID of the user targeted by the audit log action.
     */
    targetUserId?: number;
    /**
     * The ID of the sharing group targeted by the audit log action.
     */
    sharingGroupId?: number;
    /**
     * The types of audit logs to filter by.
     */
    logType?: string;
    /**
     * The categories audit logs to filter by.
     */
    category?: string;
    /**
     * Additional properties to filter by. Refer to the specific audit log schema for property details.
     */
    properties?: {
        propName: string;
        value: string;
    }[];
}

export interface StartAuditLogsQueryOutput {
    /**
     * The query execution ID. Use this value to retrieve the results of the query.
     */
    queryExecutionId: string;
}

export const startAuditLogsQuery = (params: StartAuditLogsQueryParams) => {
    const { teamDeviceCredentials, ...payload } = params;
    return requestTeamApi<StartAuditLogsQueryOutput>({
        path: 'auditlogs-teamdevice/StartAuditLogsQuery',
        teamUuid: teamDeviceCredentials.uuid,
        teamDeviceKeys: {
            accessKey: teamDeviceCredentials.accessKey,
            secretKey: teamDeviceCredentials.secretKey,
        },
        payload,
    });
};

export interface GetAuditLogQueryResultsParams {
    teamDeviceCredentials: TeamDeviceCredentials;

    /**
     * The ID associated with the query executed by the RequestAuditLogs endpoint.
     */
    queryExecutionId: string;
    /**
     * A token that specifies where to continue pagination. To retrieve the next page, pass the nextToken from the response of the previous page call.
     */
    nextToken?: string;
    /**
     * The maximum number of results to return for this request.
     */
    maxResults?: number;
}

export interface GetAuditLogQueryResultsOutput {
    /**
     * The state of the query associated with the provided query execution ID.
     */
    state: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
    /**
     * The results of the query.
     */
    results: string[];
    /**
     * A token to retrieve the next page of results.
     */
    nextToken?: string;
}

export const getAuditLogQueryResults = (params: GetAuditLogQueryResultsParams) => {
    const { teamDeviceCredentials, ...payload } = params;
    return requestTeamApi<GetAuditLogQueryResultsOutput>({
        path: 'auditlogs-teamdevice/GetAuditLogQueryResults',
        teamUuid: teamDeviceCredentials.uuid,
        teamDeviceKeys: {
            accessKey: teamDeviceCredentials.accessKey,
            secretKey: teamDeviceCredentials.secretKey,
        },
        payload,
    });
};
