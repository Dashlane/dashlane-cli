import { Command, Option } from 'commander';
import { teamCredentialsCommands } from './credentials.js';
import { PublicAPICommands } from './publicAPI.js';
import { CouldNotFindEnrolledTeamDeviceCredentialsError } from '../../errors.js';
import {
    runTeamDarkWebInsightsReport,
    runTeamLogs,
    runTeamMembers,
    runTeamReport,
} from '../../command-handlers/index.js';
import {
    customParseInt,
    customParseTimestampMilliseconds,
    getEnrolledTeamDeviceCredentials,
} from '../../utils/index.js';

export const teamCommands = (params: { program: Command }) => {
    const { program } = params;

    const teamGroup = program.command('team').alias('t').description('Team related commands');

    try {
        getEnrolledTeamDeviceCredentials();
    } catch (error) {
        if (error instanceof CouldNotFindEnrolledTeamDeviceCredentialsError) {
            teamGroup.addHelpText(
                'before',
                '/!\\ Commands in this section require enrolled team device credentials to be set in the environment.\n' +
                    'You will first need to access the Dashlane Admin Console. From there, navigate to Integrations > [Developer Access](https://universal.dashlane.com/developer-access) page to generate your CLI key with the desired scope(s) and expiration date (of maximum 12 months).\n' +
                    'After generating the key, you will receive a variable to export to your environment. Simply copy/paste it into your terminal.'
            );
        }
    }

    teamCredentialsCommands({ teamGroup });

    PublicAPICommands({ teamGroup });

    teamGroup
        .command('members')
        .alias('m')
        .description('List team members')
        .argument('[page]', 'Page number', customParseInt, 0)
        .argument('[limit]', 'Limit of members per page', customParseInt, 0)
        .option('--csv', 'Output in CSV format')
        .option('--human-readable', 'Output dates in human readable format')
        .action(runTeamMembers);

    teamGroup
        .command('logs')
        .alias('l')
        .description('List audit logs')
        .option('--start <start>', 'Start timestamp in ms', customParseTimestampMilliseconds, '0')
        .option(
            '--end <end>',
            'End timestamp in ms (use "now" to get the current timestamp)',
            customParseTimestampMilliseconds,
            Date.now()
        )
        .option('--csv', 'Output in CSV format')
        .option('--human-readable', 'Output dates in human readable format')
        .action(runTeamLogs);

    teamGroup
        .command('report')
        .alias('r')
        .description('Get team report')
        .argument('[days]', 'Number of days in history', customParseInt, 0)
        .action(runTeamReport);

    teamGroup
        .command('dark-web-insights')
        .alias('dwi')
        .description("Get Dark Web Insights detailed report for your team's domain (results are paginated)")
        .argument('<domain>', 'Domain name')
        .addOption(
            new Option('--order-by <orderBy>', 'Order results by')
                .choices(['DEFAULT', 'UNSEEN', 'TEAM_MEMBERS', 'PUBLISH_DATE'])
                .default('DEFAULT')
        )
        .option('--count <count>', 'Results count per page', customParseInt, 100)
        .option('--offset <offset>', 'Page offset', customParseInt, 0)
        .action(runTeamDarkWebInsightsReport);
};
