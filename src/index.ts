#!/usr/bin/env node
import { Command } from 'commander';
import winston from 'winston';
import { Database } from 'better-sqlite3';
import { connectAndPrepare } from './database/index';
import { askConfirmReset } from './utils/dialogs';
import { getTeamDeviceCredentialsFromEnv, parseBooleanString } from './utils';
import { Secrets } from './types';
import { connect } from './database/connect';
import {
    sync,
    selectCredentials,
    getOtp,
    getNote,
    getPassword,
    getTeamMembers,
    configureDisableAutoSync,
    configureSaveMasterPassword,
    reset,
    getAuditLogs,
    getTeamReport,
} from './middleware';
import { cliVersionToString, CLI_VERSION } from './cliVersion';
import { registerTeamDevice } from './endpoints/registerTeamDevice';

const teamDeviceCredentials = getTeamDeviceCredentialsFromEnv();

const debugLevel = process.argv.indexOf('--debug') !== -1 ? 'debug' : 'info';

winston.configure({
    level: debugLevel,
    format: winston.format.combine(winston.format.splat(), winston.format.cli()),
    transports: [new winston.transports.Console({ stderrLevels: ['error', 'debug', 'info'] })],
});

const program = new Command();

program.name('dcli').description('Dashlane CLI').version(cliVersionToString(CLI_VERSION));

program.option('--debug', 'Print debug messages');

program
    .command('sync')
    .alias('s')
    .description('Manually synchronize the local vault with Dashlane')
    .action(async () => {
        const { db, secrets, deviceConfiguration } = await connectAndPrepare({ autoSync: false });
        await sync({ db, secrets, deviceConfiguration });
        console.log('Successfully synced');
        db.close();
    });

program
    .command('password')
    .alias('p')
    .description('Retrieve a password from the local vault and copy it to the clipboard')
    .option(
        '-o, --output <type>',
        'How to print the passwords among `clipboard, password, json`. The JSON option outputs all the matching credentials',
        'clipboard'
    )
    .argument(
        '[filters...]',
        'Filter credentials based on any parameter using <param>=<value>; if <param> is not specified in the filter, will default to url and title'
    )
    .action(async (filters: string[] | null, options: { output: string | null }) => {
        const { db, secrets } = await connectAndPrepare({});

        if (options.output === 'json') {
            console.log(
                JSON.stringify(
                    await selectCredentials({
                        filters,
                        secrets,
                        output: options.output,
                        db,
                    }),
                    null,
                    4
                )
            );
        } else {
            await getPassword({
                filters,
                secrets,
                output: options.output,
                db,
            });
        }
        db.close();
    });

program
    .command('otp')
    .alias('o')
    .description('Retrieve an OTP code from local vault and copy it to the clipboard')
    .option('--print', 'Prints just the OTP code, instead of copying it to the clipboard')
    .argument(
        '[filters...]',
        'Filter credentials based on any parameter using <param>=<value>; if <param> is not specified in the filter, will default to url and title'
    )
    .action(async (filters: string[] | null, options: { print: boolean }) => {
        const { db, secrets } = await connectAndPrepare({});
        await getOtp({
            filters,
            secrets,
            output: options.print ? 'otp' : 'clipboard',
            db,
        });
        db.close();
    });

program
    .command('note')
    .alias('n')
    .description('Retrieve a secure note from the local vault and open it')
    .argument('[filter]', 'Filter notes based on their title')
    .action(async (filter: string | null) => {
        const { db, secrets } = await connectAndPrepare({});
        await getNote({
            titleFilter: filter,
            secrets,
            db,
        });
        db.close();
    });

const teamGroup = program.command('team').alias('t').description('Team related commands');

if (!teamDeviceCredentials) {
    teamGroup.addHelpText(
        'before',
        `/!\\ Commands in this section (except generate-credentials) require team credentials to be set in the environment.
Use generate-credentials to generate some team credentials (requires to be a team administrator).
`
    );
}

teamGroup
    .command('members')
    .alias('m')
    .description('List team members')
    .argument('[page]', 'Page number', '0')
    .argument('[limit]', 'Limit of members per page', '0')
    .action(async (page: string, limit: string) => {
        if (!teamDeviceCredentials) {
            throw new Error('Could not find team credentials');
        }
        await getTeamMembers({ teamDeviceCredentials, page: parseInt(page), limit: parseInt(limit) });
    });

teamGroup
    .command('generate-credentials')
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
            console.log(`export DASHLANE_TEAM_UUID=${credentials.teamUuid}`);
            console.log(`export DASHLANE_TEAM_ACCESS_KEY=${credentials.deviceAccessKey}`);
            console.log(`export DASHLANE_TEAM_SECRET_KEY=${credentials.deviceSecretKey}`);
        }
    });

teamGroup
    .command('logs')
    .alias('l')
    .description('List audit logs')
    .option('--start <start>', 'start timestamp', '0')
    .option('--end <end>', 'end timestamp', 'now')
    .option('--type <type>', 'log type')
    .option('--category <category>', 'log category')
    .action(async (options: { start: string; end: string; type: string; category: string }) => {
        const { start, type, category } = options;
        const end = options.end === 'now' ? Math.floor(Date.now() / 1000).toString() : options.end;

        const { db, secrets } = await connectAndPrepare({ autoSync: false });
        await getAuditLogs({
            secrets,
            startDateRangeUnix: parseInt(start),
            endDateRangeUnix: parseInt(end),
            logType: type,
            category,
        });
        db.close();
    });

teamGroup
    .command('report')
    .alias('r')
    .description('Get team report')
    .argument('[days]', 'Number of days in history', '0')
    .action(async (days: string) => {
        const { db, secrets } = await connectAndPrepare({ autoSync: false });
        await getTeamReport({ secrets, days: parseInt(days) });
        db.close();
    });

const configureGroup = program.command('configure').alias('c').description('Configure the CLI');

configureGroup
    .command('disable-auto-sync <boolean>')
    .description('Disable automatic synchronization which is done once per hour (default: false)')
    .action(async (boolean: string) => {
        const disableAutoSync = parseBooleanString(boolean);
        const { db, secrets } = await connectAndPrepare({ autoSync: false });
        configureDisableAutoSync({ db, secrets, disableAutoSync });
        db.close();
    });

configureGroup
    .command('save-master-password <boolean>')
    .description('Should the encrypted master password be saved and the OS keychain be used (default: true)')
    .action(async (boolean: string) => {
        const shouldNotSaveMasterPassword = !parseBooleanString(boolean);
        const { db, secrets } = await connectAndPrepare({
            autoSync: false,
            shouldNotSaveMasterPasswordIfNoDeviceKeys: shouldNotSaveMasterPassword,
        });
        configureSaveMasterPassword({ db, secrets, shouldNotSaveMasterPassword });
        db.close();
    });

program
    .command('reset')
    .description('Reset and clean your local database and OS keychain')
    .action(async () => {
        const resetConfirmation = await askConfirmReset();
        if (resetConfirmation) {
            let db: Database;
            let secrets: Secrets | undefined;
            try {
                ({ db, secrets } = await connectAndPrepare({ autoSync: false, failIfNoDB: true }));
            } catch (error) {
                let errorMessage = 'unknown error';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                winston.debug(`Unable to read device configuration during reset: ${errorMessage}`);

                db = connect();
                db.serialize();
            }
            reset({ db, secrets });
            console.log('The local Dashlane local storage has been reset');
            db.close();
        }
    });

program.parseAsync().catch((error: Error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
});
