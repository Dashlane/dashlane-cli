import winston from 'winston';
import { getAuditLogQueryResults, startAuditLogsQuery, StartAuditLogsQueryParams } from '../endpoints';

const MAX_RESULT = 1000;

export const getAuditLogs = async (params: StartAuditLogsQueryParams) => {
    const { secrets } = params;

    const { queryExecutionId } = await startAuditLogsQuery(params);

    let result = await getAuditLogQueryResults({ secrets, queryExecutionId, maxResults: MAX_RESULT });
    winston.debug(`Query state: ${result.state}`);

    while (['QUEUED', 'RUNNING'].includes(result.state)) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        result = await getAuditLogQueryResults({ secrets, queryExecutionId, maxResults: MAX_RESULT });
        winston.debug(`Query state: ${result.state}`);
    }

    if (result.state !== 'SUCCEEDED') {
        throw new Error(`Query execution did not succeed: ${result.state}`);
    }

    let logs = result.results;
    while (result.nextToken) {
        result = await getAuditLogQueryResults({
            secrets,
            queryExecutionId,
            maxResults: MAX_RESULT,
            nextToken: result.nextToken,
        });
        winston.debug(`Query state: ${result.state}`);
        logs = logs.concat(result.results);
    }

    logs.forEach((log) => console.log(log));
};
