import { Command } from 'commander';
import { devicesCommands } from './devices';
import { teamCommands } from './team';
import { configureCommands } from './configure';
import { runSync, runOtp, runPassword, runSecureNote, runLogout, runRead } from '../command-handlers';

export const rootCommands = (params: { program: Command }) => {
    const { program } = params;

    program
        .command('sync')
        .alias('s')
        .description('Manually synchronize the local vault with Dashlane')
        .action(runSync);

    program
        .command('read')
        .alias('r')
        .description('Retrieve a credential from the local vault via its path')
        .argument('<path>', 'Path to the credential (dl://<title>/<field> or dl://<id>/<field>)')
        .action(runRead);

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
        .argument('[filter]', 'Filter notes based on their title')
        .action(runSecureNote);

    devicesCommands({ program });

    teamCommands({ program });

    configureCommands({ program });

    program.command('logout').description('Logout and clean your local database and OS keychain').action(runLogout);
};
