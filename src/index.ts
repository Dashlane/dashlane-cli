#!/usr/bin/env node
import { Command } from 'commander';
import winston from 'winston';

import { cliVersionToString, CLI_VERSION } from './cliVersion';
import { rootCommands } from './commands';
import { initTeamDeviceCredentials } from './utils';

const debugLevel = process.argv.indexOf('--debug') !== -1 ? 'debug' : 'info';

winston.configure({
    level: debugLevel,
    format: winston.format.combine(winston.format.splat(), winston.format.cli()),
    transports: [new winston.transports.Console({ stderrLevels: ['error', 'debug', 'info'] })],
});

initTeamDeviceCredentials();

const program = new Command();

program.name('dcli').description('Dashlane CLI').version(cliVersionToString(CLI_VERSION));

program.option('--debug', 'Print debug messages');

rootCommands({ program });

program.parseAsync().catch((error: Error) => {
    console.error(`ERROR:`, error.message);
    process.exit(1);
});
