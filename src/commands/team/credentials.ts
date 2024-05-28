import { Command } from 'commander';
import { createTeamDevice, listAllTeamDevices } from '../../command-handlers';
import { connectAndPrepare } from '../../modules/database';
import { deactivateTeamDevice } from '../../endpoints';
import { logger } from '../../logger';

export const teamCredentialsCommands = (params: { teamGroup: Command }) => {
    const { teamGroup } = params;

    const teamCredentialsGroup = teamGroup.command('credentials').alias('c').description('Team credentials operations');

    teamCredentialsGroup
        .command('generate')
        .option('--json', 'Output in JSON format')
        .description('Generate new team credentials')
        .action(async (options: { json: boolean }) => {
            const teamDeviceKeys = await createTeamDevice();

            if (options.json) {
                logger.content(
                    JSON.stringify({
                        DASHLANE_TEAM_DEVICE_KEYS: teamDeviceKeys,
                    })
                );
            } else {
                logger.success(
                    'The credentials have been generated, run the following command to export them in your env:'
                );
                logger.content(`export DASHLANE_TEAM_DEVICE_KEYS=${teamDeviceKeys}`);
            }
        });

    teamCredentialsGroup
        .command('list')
        .option('--json', 'Output in JSON format')
        .description('List all team credentials')
        .action(listAllTeamDevices);

    teamCredentialsGroup
        .command('revoke')
        .description('Revoke credentials by access key')
        .argument('<accessKey>', 'Access key of the credentials to revoke')
        .action(async (accessKey: string) => {
            const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });
            await deactivateTeamDevice({ localConfiguration, teamDeviceAccessKey: accessKey });
            db.close();

            logger.success('The credentials have been revoked.');
        });
};
