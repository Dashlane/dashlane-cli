import { Command } from 'commander';
import { listAllDevices, registerNonInteractiveDevice, removeAllDevices } from '../command-handlers/index.js';

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

    devicesGroup
        .command('register')
        .description('Registers a new device to be used in non-interactive mode')
        .argument('<device name>', 'name of the device to register')
        .option('--json', 'Output in JSON format')
        .action(registerNonInteractiveDevice);
};
