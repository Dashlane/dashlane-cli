#!/usr/bin/env node
import { program } from 'commander';
import inquirer from 'inquirer';
import PromptConstructor = inquirer.prompts.PromptConstructor;
import inquirerSearchList from 'inquirer-search-list';
import winston from 'winston';

import { sync } from './middleware/sync';
import { getNote } from './middleware/getSecureNotes';
import { getOtp, getPassword, selectCredentials } from './middleware/getPasswords';
import { connectAndPrepare, resetDB } from './database/index';
import { askConfirmReset } from './utils/dialogs';
import { deleteLocalKey } from './crypto/keychainManager';
import { configureSaveMasterPassword } from './middleware/configure';

const debugLevel = process.argv.indexOf('--debug') !== -1 ? 'debug' : 'info';
const autoSync = process.argv.indexOf('--disable-auto-sync') === -1;

winston.configure({
    level: debugLevel,
    format: winston.format.combine(winston.format.splat(), winston.format.cli()),
    transports: [new winston.transports.Console()],
});

inquirer.registerPrompt('search-list', inquirerSearchList as PromptConstructor);

program.name('dcli').description('[Non Official] Dashlane CLI').version('1.0.0');

program.option('--debug', 'Print debug messages');
program.option('--disable-auto-sync', 'Disable automatic synchronization which is done once per hour');

program
    .command('sync')
    .alias('s')
    .description('Manually synchronize the local vault with Dashlane')
    .action(async () => {
        const { db, secrets } = await connectAndPrepare(false);
        await sync({ db, secrets });
        db.close();
    });

program
    .command('password')
    .alias('p')
    .description('Retrieve passwords from local vault and save it in the clipboard.')
    .option(
        '--output <type>',
        'How to print the passwords among `clipboard, password, json`. The JSON option outputs all the matching credentials.',
        'clipboard'
    )
    .argument('[filter]', 'Filter passwords based on their title (usually the website)')
    .action(async (filter: string | null, options: { output: string | null }) => {
        const { db, secrets } = await connectAndPrepare(autoSync);

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
    .description('Retrieve an OTP code from local vault and save it in the clipboard.')
    .option('--print', 'Prints just the OTP code, instead of copying it inside the clipboard')
    .argument('[filter]', 'Filter credentials based on their title (usually the website)')
    .action(async (filter: string | null, options: { print: boolean }) => {
        const { db, secrets } = await connectAndPrepare(autoSync);
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
    .description('Retrieve secure notes from local vault and open it.')
    .argument('[filter]', 'Filter notes based on their title')
    .action(async (filter: string | null) => {
        const { db, secrets } = await connectAndPrepare(autoSync);
        await getNote({
            titleFilter: filter,
            secrets,
            db,
        });
        db.close();
    });

const configureGroup = program.command('configure').alias('c').description('Configure the program.');

configureGroup
    .command('save-master-password <boolean>')
    .description('Should the encrypted master password be saved and the OS keychain be used')
    .action(async (boolean: string) => {
        let shouldNotSaveMasterPassword: boolean;
        if (boolean === 'true') {
            shouldNotSaveMasterPassword = false;
        } else if (boolean === 'false') {
            shouldNotSaveMasterPassword = true;
        } else {
            throw new Error("The provided boolean variable should be either 'true' or 'false'");
        }
        const { db, secrets } = await connectAndPrepare(autoSync, shouldNotSaveMasterPassword);
        await configureSaveMasterPassword({ db, secrets, shouldNotSaveMasterPassword });
        db.close();
    });

program
    .command('reset')
    .description('Reset and clean your local database and keystore')
    .action(async () => {
        const resetConfirmation = await askConfirmReset();
        if (resetConfirmation) {
            const { db, secrets } = await connectAndPrepare(false);
            try {
                await deleteLocalKey(secrets.login);
            } catch {
                // Errors are ignored because the OS keychain may be unreachable
            }
            resetDB({ db });
            db.close();
        }
    });

program.parseAsync().catch((err) => console.error(err));
