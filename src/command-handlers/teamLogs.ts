import { getAuditLogs } from '../endpoints/index.js';
import { jsonToCsv, epochTimestampToIso, getEnrolledTeamDeviceCredentials } from '../utils/index.js';
import { logger } from '../logger.js';

export const runTeamLogs = async (options: { start: string; end: string; csv: boolean; humanReadable: boolean }) => {
    const enrolledTeamDeviceCredentials = getEnrolledTeamDeviceCredentials();
    const { start, end } = options;

    let logs = await getAuditLogs({
        enrolledTeamDeviceCredentials,
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
