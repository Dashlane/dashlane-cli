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

export const askReplaceIncorrectMasterPassword = async () => {
    const { replaceMasterPassword } = await inquirer.prompt<{ replaceMasterPassword: string }>([
        {
            type: 'list',
            name: 'replaceMasterPassword',
            message: 'The master password you provided is incorrect, would you like to retry?',
            choices: ['Yes', 'No'],
        },
    ]);
    return replaceMasterPassword === 'Yes';
};

export const askIgnoreBreakingChanges = async () => {
    const { ignoreBreakingChanges } = await inquirer.prompt<{ ignoreBreakingChanges: string }>([
        {
            type: 'list',
            name: 'ignoreBreakingChanges',
            message:
                'Your local storage has been generated by a different version of the CLI and surely cannot be read. Would you like to:',
            choices: ['Reset your local storage', 'Ignore the warning'],
        },
    ]);
    return ignoreBreakingChanges === 'Ignore the warning';
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
