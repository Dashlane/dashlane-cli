import winston from 'winston';
import { Command } from 'commander';
import { listAllTeamDevices } from '../../command-handlers';
import { connectAndPrepare } from '../../modules/database';
import { deactivateTeamDevice, registerTeamDevice } from '../../endpoints';

export const teamCredentialsCommands = (params: { teamGroup: Command }) => {
    const { teamGroup } = params;

    const teamCredentialsGroup = teamGroup.command('credentials').alias('c').description('Team credentials operations');

    teamCredentialsGroup
        .command('generate')
        .option('--json', 'Output in JSON format')
        .description('Generate new team credentials')
        .action(async (options: { json: boolean }) => {
            const { db, secrets } = await connectAndPrepare({ autoSync: false });
            const credentials = await registerTeamDevice({ secrets, deviceName: 'Dashlane CLI' });
            db.close();

            if (options.json) {
                console.log(
                    JSON.stringify({
                        DASHLANE_TEAM_UUID: credentials.teamUuid,
                        DASHLANE_TEAM_ACCESS_KEY: credentials.deviceAccessKey,
                        DASHLANE_TEAM_SECRET_KEY: credentials.deviceSecretKey,
                    })
                );
            } else {
                winston.info('The credentials have been generated, run the following commands to export them:');
                console.log(`export DASHLANE_TEAM_UUID=${credentials.teamUuid}`);
                console.log(`export DASHLANE_TEAM_ACCESS_KEY=${credentials.deviceAccessKey}`);
                console.log(`export DASHLANE_TEAM_SECRET_KEY=${credentials.deviceSecretKey}`);
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
            const { db, secrets } = await connectAndPrepare({ autoSync: false });
            await deactivateTeamDevice({ secrets, teamDeviceAccessKey: accessKey });
            db.close();

            console.log('The credentials have been revoked');
        });
};
