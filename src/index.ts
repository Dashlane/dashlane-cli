#!/usr/bin/env node
import { program } from 'commander';
import { sync } from './middleware/sync.js';
import { getPassword } from './middleware/get.js';
import { connectAndPrepare } from './database/index.js';

program.name('dcli').description('[Non Official] Dashlane CLI').version('0.1.0');

program
    .command('sync')
    .description('Manually synchronize the local vault with Dashlane')
    .action(async () => {
        return sync(await connectAndPrepare());
    });

program
    .command('password')
    .description(
        'Retrieve passwords from local vault and save it in the clipboard.\n' +
            'Please provide the master password in the environment variable `MP`.'
    )
    .argument('[filter]', 'Filter passwords based on their title (usually the website)')
    .action(async (filter: string | null) => {
        const { db, deviceKeys } = await connectAndPrepare();
        return getPassword({
            titleFilter: filter,
            login: deviceKeys.login,
            db,
        });
    });

program.parseAsync().catch((err) => console.error(err));
