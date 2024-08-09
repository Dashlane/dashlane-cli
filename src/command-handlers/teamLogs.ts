import { getAuditLogs } from '../endpoints/index.js';
import { getTeamDeviceCredentials, jsonToCsv, epochTimestampToIso } from '../utils/index.js';
import { logger } from '../logger.js';

export const runTeamLogs = async (options: { start: string; end: string; csv: boolean; humanReadable: boolean }) => {
    const teamDeviceCredentials = getTeamDeviceCredentials();
    const { start, end } = options;

    let logs = await getAuditLogs({
        teamDeviceCredentials,
        queryParams: {
            startDateRangeUnixMs: parseInt(start),
            endDateRangeUnixMs: parseInt(end),
        },
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
