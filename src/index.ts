#!/usr/bin/env node
import { program } from 'commander';
import winston from 'winston';
import { sync } from './middleware/sync.js';
import { getNote } from './middleware/getSecureNotes.js';
import { getOtp, getPassword, selectCredentials } from './middleware/getPasswords.js';
import { connectAndPrepare } from './database/index.js';

const debugLevel = process.argv.indexOf('--debug') !== -1 ? 'debug' : 'info';

winston.configure({
    level: debugLevel,
    format: winston.format.combine(winston.format.splat(), winston.format.cli()),
    transports: [new winston.transports.Console()],
});

program.name('dcli').description('[Non Official] Dashlane CLI').version('0.1.0');

program.option('--debug', 'Print debug messages');

program
    .command('sync')
    .description('Manually synchronize the local vault with Dashlane')
    .action(async () => {
        const { db, deviceKeys } = await connectAndPrepare();
        await sync({ db, deviceKeys });
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
        const { db, deviceKeys } = await connectAndPrepare();

        console.log(options.output);
        if (options.output === 'json') {
            console.log(
                JSON.stringify(
                    await selectCredentials({
                        titleFilter: filter,
                        login: deviceKeys.login,
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
                login: deviceKeys.login,
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
        const { db, deviceKeys } = await connectAndPrepare();
        await getOtp({
            titleFilter: filter,
            login: deviceKeys.login,
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
        const { db, deviceKeys } = await connectAndPrepare();
        await getNote({
            titleFilter: filter,
            login: deviceKeys.login,
            db,
        });
        db.close();
    });

program.parseAsync().catch((err) => console.error(err));
