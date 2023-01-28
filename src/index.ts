#!/usr/bin/env node
import { program } from 'commander';
import inquirer from 'inquirer';
import inquirerSearchList from 'inquirer-search-list';
import winston from 'winston';
import { Database } from 'better-sqlite3';
import { connectAndPrepare } from './database/index';
import { getOtp, getPassword, selectCredentials } from './middleware/getPasswords';
import { getNote } from './middleware/getSecureNotes';
import { askConfirmReset } from './utils/dialogs';
import { configureDisableAutoSync, configureSaveMasterPassword } from './middleware/configure';
import { reset } from './middleware/reset';
import { sync } from './middleware/sync';
import { parseBooleanString } from './utils';
import { Secrets } from './types';
import { connect } from './database/connect';

import PromptConstructor = inquirer.prompts.PromptConstructor;

const debugLevel = process.argv.indexOf('--debug') !== -1 ? 'debug' : 'info';

winston.configure({
    level: debugLevel,
    format: winston.format.combine(winston.format.splat(), winston.format.cli()),
    transports: [new winston.transports.Console({ stderrLevels: ['error', 'debug', 'info'] })],
});

inquirer.registerPrompt('search-list', inquirerSearchList as PromptConstructor);

program.name('dcli').description('[Non Official] Dashlane CLI').version('1.0.0');

program.option('--debug', 'Print debug messages');

program
    .command('sync')
    .alias('s')
    .description('Manually synchronize the local vault with Dashlane')
    .action(async () => {
        const { db, secrets } = await connectAndPrepare({ autoSync: false });
        await sync({ db, secrets });
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
    .argument('[filter]', 'Filter passwords based on their title (usually the website)')
    .action(async (filter: string | null, options: { output: string | null }) => {
        const { db, secrets } = await connectAndPrepare({});

        if (options.output === 'json') {
            console.log(
                JSON.stringify(
                    await selectCredentials({
                        titleFilter: filter,
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
                titleFilter: filter,
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
    .argument('[filter]', 'Filter credentials based on their title (usually the website)')
    .action(async (filter: string | null, options: { print: boolean }) => {
        const { db, secrets } = await connectAndPrepare({});
        await getOtp({
            titleFilter: filter,
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
            db.close();
        }
    });

program.parseAsync().catch((err) => {
    console.error(err);
    process.exit(1);
});
