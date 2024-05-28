import { logger } from '../logger';
import { connectAndPrepare } from '../modules/database';

export const runWhoami = async (): Promise<void> => {
    const { localConfiguration } = await connectAndPrepare({});

    logger.content(localConfiguration.login);
};
