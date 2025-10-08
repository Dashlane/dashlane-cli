import { apiConnect } from '../modules/tunnel-api-connect/apiconnect.js';
import { logger } from '../logger.js';
import { EnrolledTeamDeviceCredentials } from '../types.js';
import { GenericLog } from '../types/logs.js';

export interface StartAuditLogsQueryParams {
    /**
     * The start of the date range to query audit logs by. The format is unix timestamp in milliseconds. Only the date is used, not the time.
     */
    startDateRangeUnixMs: number;
    /**
     * The end of the date range of to query audit logs by. The format is unix timestamp in milliseconds. Only the date is used, not the time.
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
    path: 'cli/StartAuditLogsQuery';
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
    path: 'cli/GetAuditLogQueryResults';
    input: GetAuditLogQueryResultsParams;
    output: GetAuditLogQueryResultsOutput;
}
const MAX_RESULT = 1000;

export const getAuditLogs = async (params: {
    queryParams: StartAuditLogsQueryParams;
    enrolledTeamDeviceCredentials: EnrolledTeamDeviceCredentials;
}): Promise<GenericLog[]> => {
    const { enrolledTeamDeviceCredentials, queryParams } = params;

    const api = await apiConnect({
        useProductionCertificate: true,
    });

    const { queryExecutionId } = await api.sendSecureContent<StartAuditLogsQueryRequest>({
        ...api,
        path: 'cli/StartAuditLogsQuery',
        payload: queryParams,
        authentication: {
            type: 'enrolledDevice',
            enrolledTeamDeviceKeys: enrolledTeamDeviceCredentials,
        },
    });

    let result: GetAuditLogQueryResultsOutput | undefined;
    let logs: string[] = [];

    do {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result = await api.sendSecureContent<GetAuditLogQueryResultsRequest>({
            ...api,
            path: 'cli/GetAuditLogQueryResults',
            payload: { queryExecutionId, maxResults: MAX_RESULT, nextToken: result?.nextToken },
            authentication: {
                type: 'enrolledDevice',
                enrolledTeamDeviceKeys: enrolledTeamDeviceCredentials,
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
