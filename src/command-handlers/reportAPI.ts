import { createReportAPIKey, listReportAPIKeys, revokeReportAPIKey } from '../endpoints';
import { connectAndPrepare } from '../modules/database';

export const createReportAPIKeyHandler = async (description: string) => {
    const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });
    const key = await createReportAPIKey({ description, localConfiguration });
    db.close();

    const { accessKey, secretKey, teamUuid } = key;

    const deviceAccountKey = `DLR_${teamUuid}_${accessKey}_${secretKey}`;

    return deviceAccountKey;
};

export const listReportAPIKeysHandler = async () => {
    const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });
    const reportAPIKeys = await listReportAPIKeys({ localConfiguration });
    db.close();

    return reportAPIKeys;
};

export const revokeReportAPIKeyHandler = async (accessKey: string) => {
    const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });
    await revokeReportAPIKey({ accessKey, localConfiguration });
    db.close();
};
