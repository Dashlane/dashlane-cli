import { apiConnect } from '../modules/tunnel-api-connect/apiconnect.js';
import { logger } from '../logger.js';
import { TeamDeviceCredentials } from '../types.js';
import { GenericLog } from '../types/logs.js';

export interface StartAuditLogsQueryParams {
    /**
     * The start of the date range to query audit logs by. The format is unix timestamp in seconds. Only the date is used, not the time.
     */
    startDateRangeUnixMs: number;
    /**
     * The end of the date range of to query audit logs by. The format is unix timestamp in seconds. Only the date is used, not the time.
     */
    endDateRangeUnixMs: number;
}

export interface StartAuditLogsQueryOutput {
    /**
     * The query execution ID. Use this value to retrieve the results of the query.
     */
    queryExecutionId: string;
}

export interface StartAuditLogsQueryRequest {
    path: 'logs-teamdevice/StartAuditLogsQuery';
    input: StartAuditLogsQueryParams;
    output: StartAuditLogsQueryOutput;
}

export interface GetAuditLogQueryResultsParams {
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

export interface GetAuditLogQueryResultsRequest {
    path: 'logs-teamdevice/GetAuditLogQueryResults';
    input: GetAuditLogQueryResultsParams;
    output: GetAuditLogQueryResultsOutput;
}

const MAX_RESULT = 1000;

export const getAuditLogs = async (params: {
    queryParams: StartAuditLogsQueryParams;
    teamDeviceCredentials: TeamDeviceCredentials;
}): Promise<GenericLog[]> => {
    const { teamDeviceCredentials, queryParams } = params;

    const api = await apiConnect({
        isProduction: true,
        enclavePcrList: [
            [3, 'dfb6428f132530b8c021bea8cbdba2c87c96308ba7e81c7aff0655ec71228122a9297fd31fe5db7927a7322e396e4c16'],
            [8, '4dbb92401207e019e132d86677857081d8e4d21f946f3561b264b7389c6982d3a86bcf9560cef4a2327eac5c5c6ab820'],
        ],
    });

    const { queryExecutionId } = await api.sendSecureContent<StartAuditLogsQueryRequest>({
        ...api,
        path: 'logs-teamdevice/StartAuditLogsQuery',
        payload: queryParams,
        authentication: {
            type: 'teamDevice',
            teamDeviceKeys: teamDeviceCredentials,
            teamUuid: teamDeviceCredentials.uuid,
        },
    });

    let result: GetAuditLogQueryResultsOutput | undefined;
    let logs: string[] = [];

    do {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result = await api.sendSecureContent<GetAuditLogQueryResultsRequest>({
            ...api,
            path: 'logs-teamdevice/GetAuditLogQueryResults',
            payload: { queryExecutionId, maxResults: MAX_RESULT, nextToken: result?.nextToken },
            authentication: {
                type: 'teamDevice',
                teamDeviceKeys: teamDeviceCredentials,
                teamUuid: teamDeviceCredentials.uuid,
            },
        });
        logger.debug(`Query state: ${result.state}`);
        if (result.state === 'SUCCEEDED') {
            logs = logs.concat(result.results);
        } else if (['QUEUED', 'RUNNING'].includes(result.state)) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
            throw new Error(`Query execution did not succeed: ${result.state}`);
        }
    } while (result.state !== 'SUCCEEDED' || result.nextToken);

    return logs.map((log) => JSON.parse(log) as GenericLog);
};
