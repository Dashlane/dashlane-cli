import { connectAndPrepare } from './connectAndPrepare.js';
import {
    VaultContent,
    BackupEditTransaction,
    AuthentifiantTransactionContent,
    SecureNoteTransactionContent,
    ParsedPath,
    SecretTransactionContent,
} from '../../types.js';
import { beautifyContent, parsePath } from '../../utils/index.js';
import { decryptTransactions } from '../crypto/index.js';

let vaultContent: VaultContent | undefined = undefined;

export const initVaultContent = async () => {
    if (vaultContent) {
        return;
    }

    const { localConfiguration, db } = await connectAndPrepare({});

    const transactions = db
        .prepare(
            `SELECT *
                FROM transactions
                WHERE login = ?
                    AND action = 'BACKUP_EDIT'
                    AND (type = 'AUTHENTIFIANT' OR type = 'SECURENOTE' OR type = 'SECRET')
                `
        )
        .bind(localConfiguration.login)
        .all() as BackupEditTransaction[];

    const credentialItems = transactions.filter((transaction) => transaction.type === 'AUTHENTIFIANT');
    const noteItems = transactions.filter((transaction) => transaction.type === 'SECURENOTE');
    const secretItems = transactions.filter((transaction) => transaction.type === 'SECRET');

    const decryptedCredentials = await decryptTransactions<AuthentifiantTransactionContent>(
        credentialItems,
        localConfiguration
    );
    const decryptedNotes = await decryptTransactions<SecureNoteTransactionContent>(noteItems, localConfiguration);
    const decryptedSecrets = await decryptTransactions<SecretTransactionContent>(secretItems, localConfiguration);

    vaultContent = beautifyContent({
        credentials: decryptedCredentials,
        notes: decryptedNotes,
        secrets: decryptedSecrets,
    });
};

export const getVaultContent = (path: string): string => {
    if (!vaultContent) {
        throw new Error('Vault content is not initialized');
    }

    const parsedPath = parsePath(path);

    return findVaultContent(vaultContent, parsedPath);
};

const compareStringCaseUnsensitive = (a: string | undefined, b: string | undefined): boolean => {
    return a?.toLowerCase() === b?.toLowerCase();
};

export const findVaultContent = (vaultContent: VaultContent, parsedPath: ParsedPath): string => {
    const filteredVaultContent: VaultContent = {
        credentials: [],
        notes: [],
        secrets: [],
    };

    if (parsedPath.title) {
        filteredVaultContent.credentials = vaultContent.credentials.filter((credential) =>
            compareStringCaseUnsensitive(credential.title, parsedPath.title)
        );
        filteredVaultContent.notes = vaultContent.notes.filter((note) =>
            compareStringCaseUnsensitive(note.title, parsedPath.title)
        );
        filteredVaultContent.secrets = vaultContent.secrets.filter((secret) =>
            compareStringCaseUnsensitive(secret.title, parsedPath.title)
        );
    }

    if (parsedPath.itemId) {
        filteredVaultContent.credentials = vaultContent.credentials.filter(
            (credential) => credential.id === parsedPath.itemId
        );
        filteredVaultContent.notes = vaultContent.notes.filter((note) => note.id === parsedPath.itemId);
        filteredVaultContent.secrets = vaultContent.secrets.filter((secret) => secret.id === parsedPath.itemId);
    }

    if (
        filteredVaultContent.credentials.length === 0 &&
        filteredVaultContent.notes.length === 0 &&
        filteredVaultContent.secrets.length === 0
    ) {
        throw new Error(`No matching item found for "${parsedPath.itemId ?? parsedPath.title ?? ''}"`);
    }

    const secretToRender: Record<string, any> =
        filteredVaultContent.secrets[0] ?? filteredVaultContent.credentials[0] ?? filteredVaultContent.notes[0];

    if (parsedPath.field) {
        if (!secretToRender[parsedPath.field]) {
            throw new Error(
                `No matching field found for "${parsedPath.field}" in "${parsedPath.itemId ?? parsedPath.title ?? ''}"`
            );
        }

        const fieldContent = String(secretToRender[parsedPath.field]);
        if (parsedPath.transformation) {
            return parsedPath.transformation(fieldContent);
        }
        return fieldContent;
    }

    return JSON.stringify(secretToRender);
};
