import { createPublicAPIKey, listPublicAPIKeys, revokePublicAPIKey } from '../endpoints';
import { connectAndPrepare } from '../modules/database';

export const createPublicAPIKeyHandler = async (description: string) => {
    const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });
    const key = await createPublicAPIKey({ description, localConfiguration });
    db.close();

    const { accessKey, secretKey, teamUuid } = key;

    const deviceAccountKey = `DLP_${teamUuid}_${accessKey}_${secretKey}`;

    return deviceAccountKey;
};

export const listPublicAPIKeysHandler = async () => {
    const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });
    const publicAPIKeys = await listPublicAPIKeys({ localConfiguration });
    db.close();

    return publicAPIKeys;
};

export const revokePublicAPIKeyHandler = async (accessKey: string) => {
    const { db, localConfiguration } = await connectAndPrepare({ autoSync: false });
    await revokePublicAPIKey({ accessKey, localConfiguration });
    db.close();
};
