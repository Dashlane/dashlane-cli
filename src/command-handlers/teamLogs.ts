import winston from 'winston';
import { connectAndPrepare } from '../modules/database';
import { StartAuditLogsQueryParams, startAuditLogsQuery, getAuditLogQueryResults } from '../endpoints';
import { getTeamDeviceCredentials, jsonToCsv } from '../utils';

export const runTeamLogs = async (options: {
    start: string;
    end: string;
    type: string;
    category: string;
    csv: boolean;
}) => {
    const teamDeviceCredentials = getTeamDeviceCredentials();

    const { start, type, category } = options;
    const end = options.end === 'now' ? Date.now().toString() : options.end;

    const { db } = await connectAndPrepare({ autoSync: false });
    const logs = await getAuditLogs({
        teamDeviceCredentials,
        startDateRangeUnix: parseInt(start),
        endDateRangeUnix: parseInt(end),
        logType: type,
        category,
    });
    db.close();

    if (options.csv) {
        console.log(jsonToCsv(logs.map((log) => JSON.parse(log) as object)));
        return;
    }

    logs.forEach((log) => console.log(log));
};

const MAX_RESULT = 1000;

export const getAuditLogs = async (params: StartAuditLogsQueryParams): Promise<string[]> => {
    const { teamDeviceCredentials } = params;

    const { queryExecutionId } = await startAuditLogsQuery(params);

    let result = await getAuditLogQueryResults({ teamDeviceCredentials, queryExecutionId, maxResults: MAX_RESULT });
    winston.debug(`Query state: ${result.state}`);

    while (['QUEUED', 'RUNNING'].includes(result.state)) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result = await getAuditLogQueryResults({ teamDeviceCredentials, queryExecutionId, maxResults: MAX_RESULT });
        winston.debug(`Query state: ${result.state}`);
    }

    if (result.state !== 'SUCCEEDED') {
        throw new Error(`Query execution did not succeed: ${result.state}`);
    }

    let logs = result.results;
    while (result.nextToken) {
        result = await getAuditLogQueryResults({
            teamDeviceCredentials,
            queryExecutionId,
            maxResults: MAX_RESULT,
            nextToken: result.nextToken,
        });
        winston.debug(`Query state: ${result.state}`);
        logs = logs.concat(result.results);
    }

    return logs;
};
