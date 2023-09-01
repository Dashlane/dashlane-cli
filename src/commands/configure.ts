import { Command } from 'commander';
import { configureDisableAutoSync, configureSaveMasterPassword } from '../command-handlers/index.js';

export const configureCommands = (params: { program: Command }) => {
    const { program } = params;

    const configureGroup = program.command('configure').alias('c').description('Configure the CLI');

    configureGroup
        .command('disable-auto-sync <boolean>')
        .description('Disable automatic synchronization which is done once per hour (default: false)')
        .action(configureDisableAutoSync);

    configureGroup
        .command('save-master-password <boolean>')
        .description('Should the encrypted master password be saved and the OS keychain be used (default: true)')
        .action(configureSaveMasterPassword);
};
