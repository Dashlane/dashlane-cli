import { Command } from 'commander';
import { listAllDevices, removeAllDevices } from '../command-handlers';

export const devicesCommands = (params: { program: Command }) => {
    const { program } = params;

    const devicesGroup = program.command('devices').alias('d').description('Operations on devices');

    devicesGroup
        .command('list')
        .option('--json', 'Output in JSON format')
        .description('Lists all registered devices that can access your account')
        .action(listAllDevices);

    devicesGroup
        .command('remove')
        .option('--all', 'remove all devices including this one (dangerous)')
        .option('--others', 'remove all other devices')
        .argument('[device ids...]', 'ids of the devices to remove')
        .description('De-registers a list of devices. De-registering the CLI will implies doing a "dcli logout"')
        .action(removeAllDevices);
};
