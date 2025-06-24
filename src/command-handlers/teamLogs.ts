// import { getAuditLogs } from '../endpoints/index.js';
// import { getTeamDeviceCredentials, jsonToCsv, epochTimestampToIso } from '../utils/index.js';
import { logger } from '../logger.js';

export const runTeamLogs = () =>
    // options: { start: string; end: string; csv: boolean; humanReadable: boolean }
    {
        logger.error(
            'We are undergoing scheduled security maintenance for the Dashlane CLI’s audit logs commands. During this time, you will not be able to access the audit logs via the CLI. We will restore service in September 2025.'
        );

        // const teamDeviceCredentials = getTeamDeviceCredentials();
        // const { start, end } = options;

        // let logs = await getAuditLogs({
        //     teamDeviceCredentials,
        //     queryParams: {
        //         startDateRangeUnixMs: parseInt(start),
        //         endDateRangeUnixMs: parseInt(end),
        //     },
        // });

        // if (options.humanReadable) {
        //     logs = logs.map((log) => {
        //         return {
        //             ...log,
        //             date_time_iso: epochTimestampToIso(log.date_time, true),
        //         };
        //     });
        // }

        // if (options.csv) {
        //     logger.content(jsonToCsv(logs));
        //     return;
        // }

        // logs.forEach((log) => logger.content(JSON.stringify(log)));
    };
