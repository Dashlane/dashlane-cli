import { Command } from 'commander';
import { logger } from '../../logger.js';

export const teamCredentialsCommands = (params: { teamGroup: Command }) => {
    const { teamGroup } = params;

    const teamCredentialsGroup = teamGroup.command('credentials').alias('c').description('Team credentials operations');

    teamCredentialsGroup
        .command('generate')
        .description('Generate new team credentials')
        .action(() => {
            logger.content(`ACTION REQUIRED: The CLI credentials are **deprecated**. 
For enhanced security and continued access, please create your new CLI keys in the Admin Console: https://universal.dashlane.com/developer-access`);
        });

    teamCredentialsGroup
        .command('list')
        .option('--json', 'Output in JSON format')
        .description('List all team credentials')
        .action(() => {
            logger.content(`ACTION REQUIRED: The CLI credentials are **deprecated**. 
For enhanced security and continued access, please view your new CLI keys in the Admin Console: https://universal.dashlane.com/developer-access`);
        });

    teamCredentialsGroup
        .command('revoke')
        .description('Revoke credentials by access key')
        .action(() => {
            logger.content(`ACTION REQUIRED: The Team Device credentials are **deprecated**. 
For enhanced security and continued access, please revoke your new CLI keys in the Admin Console: https://universal.dashlane.com/developer-access`);
        });
};
