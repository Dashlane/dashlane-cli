import { connectAndPrepare } from '../modules/database/index.js';

export const runWhoami = async (): Promise<void> => {
    const { secrets } = await connectAndPrepare({});

    console.log(secrets.login);
};
