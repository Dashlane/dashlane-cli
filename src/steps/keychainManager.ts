import inquirer from 'inquirer';
import keytar from 'keytar';

const SERVICE = 'dashlane-cli';

export const setMasterPassword = async (login: string): Promise<string> => {
    const promptedMasterPassword = await promptMasterPassword();
    await keytar.setPassword(SERVICE, login, promptedMasterPassword);
    return promptedMasterPassword;
};

export const getMasterPassword = async (login: string): Promise<string> => {
    const masterPassword = await keytar.getPassword(SERVICE, login);

    if (!masterPassword) {
        return await setMasterPassword(login);
    }

    return masterPassword;
};

export const promptMasterPassword = async (): Promise<string> => {
    return (
        await inquirer.prompt([
            {
                type: 'password',
                name: 'masterPassword',
                message: 'Please enter your master password:'
            }
        ])
    )?.masterPassword as string;
};

export const askReplaceMasterPassword = async () => {
    const promptedReplaceMasterPassword: string = (
        await inquirer.prompt([
            {
                type: 'list',
                name: 'replaceMasterPassword',
                message: "Couldn't decrypt any password, would you like to retry?",
                choices: ['Yes', 'No']
            }
        ])
    )?.replaceMasterPassword as string;

    return promptedReplaceMasterPassword === 'Yes';
};
