import { logger } from '../logger.js';
import { connectAndPrepare } from '../modules/database/index.js';

export const runWhoami = async (): Promise<void> => {
    const { localConfiguration } = await connectAndPrepare({});

    logger.content(localConfiguration.login);
};
