#!/usr/bin/env node
import { Command } from 'commander';

import { cliVersionToString, CLI_VERSION } from './cliVersion';
import { rootCommands } from './commands';
import { initDeviceCredentials, initStagingCheck, initTeamDeviceCredentials } from './utils';
import { errorColor, initLogger } from './logger';

const debugLevel = process.argv.indexOf('--debug') !== -1 ? 'debug' : 'info';

initLogger({ debugLevel });

initStagingCheck();
initTeamDeviceCredentials();
initDeviceCredentials();

const program = new Command();

program.name('dcli').description('Dashlane CLI').version(cliVersionToString(CLI_VERSION));

program.configureOutput({
    outputError: (str, write) => write(errorColor(str)),
});

program.option('--debug', 'Print debug messages');

rootCommands({ program });

program
    .parseAsync()
    .catch((error: Error) => {
        console.error(errorColor(`error: ${error.message}`));
        process.exit(1);
    })
    .finally(() => process.stdout.write('', 'utf-8', () => process.exit(0)));
