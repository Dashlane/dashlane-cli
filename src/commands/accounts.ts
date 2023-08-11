import { Command } from 'commander';
import { runWhoami } from '../command-handlers';

export const accountsCommands = (params: { program: Command }) => {
    const { program } = params;

    const devicesGroup = program
        .command('accounts')
        .alias('a')
        .description('Manage your accounts connected to the CLI');

    devicesGroup
        .command('whoami')
        .description('Prints the login email of the account currently in use')
        .action(runWhoami);
};
