import { connectAndPrepare } from '../modules/database';

export const runWhoami = async (): Promise<void> => {
    const { localConfiguration } = await connectAndPrepare({});

    console.log(localConfiguration.login);
};
