import inquirer from 'inquirer';

export const askMasterPassword = async (): Promise<string> => {
    const { masterPassword } = await inquirer.prompt<{ masterPassword: string }>([
        {
            type: 'password',
            name: 'masterPassword',
            message: 'Please enter your master password:',
        },
    ]);
    return masterPassword;
};

export const askReplaceMasterPassword = async () => {
    const { replaceMasterPassword } = await inquirer.prompt<{ replaceMasterPassword: string }>([
        {
            type: 'list',
            name: 'replaceMasterPassword',
            message: "Couldn't decrypt any password, would you like to retry?",
            choices: ['Yes', 'No'],
        },
    ]);
    return replaceMasterPassword === 'Yes';
};

export const askEmailAddress = async (): Promise<string> => {
    const { login } = await inquirer.prompt<{ login: string }>([
        {
            type: 'input',
            name: 'login',
            message: 'Please enter your email address:',
        },
    ]);
    return login;
};

export const askConfirmReset = async () => {
    const { confirmReset } = await inquirer.prompt<{ confirmReset: string }>([
        {
            type: 'list',
            name: 'confirmReset',
            message: 'Do you really want to delete all local data from this app?',
            choices: ['Yes', 'No'],
        },
    ]);
    return confirmReset === 'Yes';
};
