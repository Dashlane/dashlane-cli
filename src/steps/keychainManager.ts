import inquirer from 'inquirer';
import keytar from 'keytar';
import touchId from 'macos-touchid';

const SERVICE = 'dashlane-cli2';

export const setMasterPassword = async (login: string): Promise<string> => {
    const promptedMasterPassword = await promptMasterPassword();

    // if (SecureEnclave.isSupported) {
    //     if (!(await SecureEnclave.findKeyPair({ keyTag: SERVICE }))) {
    //         await SecureEnclave.createKeyPair({ keyTag: SERVICE });
    //     }
    //     const encryptedMasterPassword = (
    //         await SecureEnclave.encrypt({
    //             keyTag: SERVICE,
    //             data: Buffer.from(promptedMasterPassword),
    //         })
    //     ).toString();
    //     await keytar.setPassword(SERVICE, login, encryptedMasterPassword);
    // } else {
    await keytar.setPassword(SERVICE, login, promptedMasterPassword);
    // }
    return promptedMasterPassword;
};

export const getMasterPassword = async (login: string): Promise<string> => {
    let masterPassword = await keytar.getPassword(SERVICE, login);
    if (!masterPassword) {
        return setMasterPassword(login);
    }

    // if (SecureEnclave.isSupported) {
    //     masterPassword = (
    //         await SecureEnclave.decrypt({
    //             keyTag: SERVICE,
    //             data: Buffer.from(masterPassword),
    //             touchIdPrompt: 'Allow Dashlane-CLI to access your Dashlane vault',
    //         })
    //     ).toString();
    // }
    await new Promise<void>((resolve, reject) =>
        touchId.authenticate('Read your Dashlane vault', (err: any, didAuthenticate: any) => {
            if (err || !didAuthenticate) {
                return reject(err || new Error('You must authenticate to continue'));
            }
            resolve();
        })
    );
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
