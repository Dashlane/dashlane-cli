import { StartAuditLogsQueryParams, startAuditLogsQuery, getAuditLogQueryResults } from '../endpoints';
import { getTeamDeviceCredentials, jsonToCsv, epochTimestampToIso } from '../utils';
import { GenericLog } from '../types/logs';
import { logger } from '../logger';

export const runTeamLogs = async (options: {
    start: string;
    end: string;
    type: string;
    category: string;
    csv: boolean;
    humanReadable: boolean;
}) => {
    const teamDeviceCredentials = getTeamDeviceCredentials();

    const { start, end, type, category } = options;

    let logs = await getAuditLogs({
        teamDeviceCredentials,
        startDateRangeUnix: parseInt(start),
        endDateRangeUnix: parseInt(end),
        logType: type,
        category,
    });

    if (options.humanReadable) {
        logs = logs.map((log) => {
            return {
                ...log,
                date_time_iso: epochTimestampToIso(log.date_time, true),
            };
        });
    }

    if (options.csv) {
        logger.content(jsonToCsv(logs));
        return;
    }

    logs.forEach((log) => logger.content(JSON.stringify(log)));
};

const MAX_RESULT = 1000;

export const getAuditLogs = async (params: StartAuditLogsQueryParams): Promise<GenericLog[]> => {
    const { teamDeviceCredentials } = params;

    const { queryExecutionId } = await startAuditLogsQuery(params);

    let result = await getAuditLogQueryResults({ teamDeviceCredentials, queryExecutionId, maxResults: MAX_RESULT });
    logger.debug(`Query state: ${result.state}`);

    while (['QUEUED', 'RUNNING'].includes(result.state)) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result = await getAuditLogQueryResults({ teamDeviceCredentials, queryExecutionId, maxResults: MAX_RESULT });
        logger.debug(`Query state: ${result.state}`);
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
        logger.debug(`Query state: ${result.state}`);
        logs = logs.concat(result.results);
    }

    return logs.map((log) => JSON.parse(log) as GenericLog);
};
