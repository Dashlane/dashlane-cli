import { Command, Option } from 'commander';
import { devicesCommands } from './devices';
import { teamCommands } from './team';
import { configureCommands } from './configure';
import { accountsCommands } from './accounts';
import {
    runSync,
    runOtp,
    runPassword,
    runSecureNote,
    runLogout,
    runRead,
    runInject,
    runExec,
    runBackup,
    runSecret,
} from '../command-handlers';

export const rootCommands = (params: { program: Command }) => {
    const { program } = params;

    program
        .command('sync')
        .alias('s')
        .description('Manually synchronize the local vault with Dashlane')
        .action(runSync);

    program
        .command('read')
        .description('Retrieve a secret from the local vault via its path')
        .argument('<path>', 'Path to the secret (dl://<title>/<field> or dl://<id>/<field>)')
        .action(runRead);

    program
        .command('exec')
        .description('Execute a command with secrets injected into the environment variables (-- <command>)')
        .action(runExec);

    program
        .command('inject')
        .description('Inject secrets into a templated string or file (uses stdin and stdout by default)')
        .option('-i, --in <input_file>', 'Input file of a template to inject the credential into')
        .option('-o, --out <output_file>', 'Output file to write the injected template to')
        .action(runInject);

    program
        .command('password')
        .alias('p')
        .description('Retrieve a password from the local vault and copy it to the clipboard')
        .addOption(
            new Option(
                '-o, --output <type>',
                'How to print the passwords. The JSON option outputs all the matching credentials'
            )
                .choices(['clipboard', 'password', 'json'])
                .default('clipboard')
        )
        .argument(
            '[filters...]',
            'Filter credentials based on any parameter using <param>=<value>; if <param> is not specified in the filter, will default to url and title'
        )
        .action(runPassword);

    program
        .command('otp')
        .alias('o')
        .description('Retrieve an OTP code from local vault and copy it to the clipboard')
        .option('--print', 'Prints just the OTP code, instead of copying it to the clipboard')
        .argument(
            '[filters...]',
            'Filter credentials based on any parameter using <param>=<value>; if <param> is not specified in the filter, will default to url and title'
        )
        .action(runOtp);

    program
        .command('note')
        .alias('n')
        .description('Retrieve a secure note from the local vault and open it')
        .addOption(
            new Option('-o, --output <type>', 'How to print the notes. The JSON option outputs all the matching notes')
                .choices(['text', 'json'])
                .default('text')
        )
        .argument(
            '[filters...]',
            'Filter notes based on any parameter using <param>=<value>; if <param> is not specified in the filter, will default to title only'
        )
        .action(runSecureNote);

    program
        .command('secret')
        .description('Retrieve a secret from the local vault and open it')
        .addOption(
            new Option(
                '-o, --output <type>',
                'How to print the secrets. The JSON option outputs all the matching secrets'
            )
                .choices(['text', 'json'])
                .default('text')
        )
        .argument(
            '[filters...]',
            'Filter secrets based on any parameter using <param>=<value>; if <param> is not specified in the filter, will default to title only'
        )
        .action(runSecret);

    accountsCommands({ program });

    devicesCommands({ program });

    teamCommands({ program });

    configureCommands({ program });

    program
        .command('backup')
        .option('--directory <directory>', 'Output directory of the backup ("." by default)')
        .option('--filename <filename>', 'Filename of the backup ("dashlane-backup-<unix_timestamp>.db by default")')
        .description('Backup your local vault (will use the current directory by default)')
        .action(runBackup);

    program.command('logout').description('Logout and clean your local database and OS keychain').action(runLogout);
};
