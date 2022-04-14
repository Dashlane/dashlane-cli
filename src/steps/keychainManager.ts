import inquirer from 'inquirer';
import keytar from 'keytar';
import touchId from 'macos-touchid';

const SERVICE = 'dashlane-cli';

export const setMasterPassword = async (login: string): Promise<string> => {
    const promptedMasterPassword = await promptMasterPassword();
    await keytar.setPassword(SERVICE, login, promptedMasterPassword);
    return promptedMasterPassword;
};

export const getMasterPassword = async (login: string): Promise<string> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    if (touchId.canAuthenticate()) {
        await new Promise<void>((resolve, reject) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
            touchId.authenticate('Read your Dashlane vault', (err: any, didAuthenticate: any) => {
                if (err || !didAuthenticate) {
                    return reject(err || new Error('You must authenticate to continue'));
                }
                resolve();
            })
        );
    }

    const masterPassword = await keytar.getPassword(SERVICE, login);

    if (!masterPassword) {
        return setMasterPassword(login);
    }

    return masterPassword;
};

export const promptMasterPassword = async (): Promise<string> => {
    return (
        await inquirer.prompt<{ masterPassword: string }>([
            {
                type: 'password',
                name: 'masterPassword',
                message: 'Please enter your master password:',
            },
        ])
    ).masterPassword;
};

export const askReplaceMasterPassword = async () => {
    const promptedReplaceMasterPassword: string = (
        await inquirer.prompt<{ replaceMasterPassword: string }>([
            {
                type: 'list',
                name: 'replaceMasterPassword',
                message: "Couldn't decrypt any password, would you like to retry?",
                choices: ['Yes', 'No'],
            },
        ])
    ).replaceMasterPassword;

    return promptedReplaceMasterPassword === 'Yes';
};
