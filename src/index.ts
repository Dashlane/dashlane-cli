#!/usr/bin/env node
import { program } from 'commander';
import winston from 'winston';
import { Database } from 'better-sqlite3';
import { connectAndPrepare } from './database/index';
import { askConfirmReset } from './utils/dialogs';
import { parseBooleanString } from './utils';
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
} from './middleware';
import { cliVersionToString, CLI_VERSION } from './cliVersion';

const debugLevel = process.argv.indexOf('--debug') !== -1 ? 'debug' : 'info';

winston.configure({
    level: debugLevel,
    format: winston.format.combine(winston.format.splat(), winston.format.cli()),
    transports: [new winston.transports.Console({ stderrLevels: ['error', 'debug', 'info'] })],
});

program.name('dcli').description('Dashlane CLI').version(cliVersionToString(CLI_VERSION));

program.option('--debug', 'Print debug messages');

program
    .command('sync')
    .alias('s')
    .description('Manually synchronize the local vault with Dashlane')
    .action(async () => {
        const { db, secrets } = await connectAndPrepare({ autoSync: false });
        await sync({ db, secrets });
        console.log('Successfully synced');
        db.close();
    });

program
    .command('teammembers')
    .alias('t')
    .description('List team members')
    .argument('[page]', 'Page number', '0')
    .action(async (page: string) => {
        const { db, secrets } = await connectAndPrepare({ autoSync: false });
        await getTeamMembers({ secrets, page: parseInt(page) });
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
        await configureSaveMasterPassword({ db, secrets, shouldNotSaveMasterPassword });
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
            await reset({ db, secrets });
            console.log('The local Dashlane local storage has been reset');
            db.close();
        }
    });

program.parseAsync().catch((error: Error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
});
