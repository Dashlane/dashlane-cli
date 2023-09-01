import { Command } from 'commander';
import { teamCredentialsCommands } from './credentials.js';
import { CouldNotFindTeamCredentialsError } from '../../errors.js';
import { runTeamLogs, runTeamMembers, runTeamReport } from '../../command-handlers/index.js';
import { customParseInt, getTeamDeviceCredentials } from '../../utils/index.js';

export const teamCommands = (params: { program: Command }) => {
    const { program } = params;

    const teamGroup = program.command('team').alias('t').description('Team related commands');

    try {
        getTeamDeviceCredentials();
    } catch (error) {
        if (error instanceof CouldNotFindTeamCredentialsError) {
            teamGroup.addHelpText(
                'before',
                '/!\\ Commands in this section (except credentials) require team credentials to be set in the environment.\n' +
                    'Use `dcli team credentials generate` to generate some team credentials (requires to be a team administrator).\n'
            );
        }
    }

    teamCredentialsCommands({ teamGroup });

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
        .option('--start <start>', 'start timestamp in ms', '0')
        .option('--end <end>', 'end timestamp in ms (use "now" to get the current timestamp)', 'now')
        .option('--type <type>', 'log type')
        .option('--category <category>', 'log category')
        .option('--csv', 'Output in CSV format')
        .option('--human-readable', 'Output dates in human readable format')
        .action(runTeamLogs);

    teamGroup
        .command('report')
        .alias('r')
        .description('Get team report')
        .argument('[days]', 'Number of days in history', customParseInt, 0)
        .action(runTeamReport);
};
