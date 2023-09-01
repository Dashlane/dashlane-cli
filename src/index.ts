#!/usr/bin/env node
import { Command } from 'commander';
import winston from 'winston';

import { cliVersionToString, CLI_VERSION } from './cliVersion.js';
import { rootCommands } from './commands/index.js';
import { initDeviceCredentials, initTeamDeviceCredentials } from './utils/index.js';

const errorColor = (str: string) => {
    // Add ANSI escape codes to display text in red.
    return `\x1b[31m${str}\x1b[0m`;
};

const debugLevel = process.argv.indexOf('--debug') !== -1 ? 'debug' : 'info';

winston.configure({
    level: debugLevel,
    format: winston.format.combine(winston.format.splat(), winston.format.cli()),
    transports: [new winston.transports.Console({ stderrLevels: ['error', 'debug', 'info'] })],
});

initTeamDeviceCredentials();
initDeviceCredentials();

const program = new Command();

program.name('dcli').description('Dashlane CLI').version(cliVersionToString(CLI_VERSION));

program.configureOutput({
    outputError: (str, write) => write(errorColor(str)),
});

program.option('--debug', 'Print debug messages');

rootCommands({ program });

program.parseAsync().catch((error: Error) => {
    console.error(errorColor(`error: ${error.message}`));
    process.exit(1);
});
