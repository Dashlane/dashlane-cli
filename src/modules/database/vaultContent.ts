import { connectAndPrepare } from './connectAndPrepare';
import {
    VaultContent,
    BackupEditTransaction,
    AuthentifiantTransactionContent,
    SecureNoteTransactionContent,
    ParsedPath,
    SecretTransactionContent,
} from '../../types';
import { beautifyContent, parsePath } from '../../utils';
import { decryptTransactions } from '../crypto';

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

export const findVaultContent = (vaultContent: VaultContent, parsedPath: ParsedPath): string => {
    if (parsedPath.title) {
        vaultContent.credentials = vaultContent.credentials.filter(
            (credential) => credential.title === parsedPath.title
        );
        vaultContent.notes = vaultContent.notes.filter((note) => note.title === parsedPath.title);
        vaultContent.secrets = vaultContent.secrets.filter((secret) => secret.title === parsedPath.title);
    }

    if (parsedPath.itemId) {
        vaultContent.credentials = vaultContent.credentials.filter((credential) => credential.id === parsedPath.itemId);
        vaultContent.notes = vaultContent.notes.filter((note) => note.id === parsedPath.itemId);
        vaultContent.secrets = vaultContent.secrets.filter((secret) => secret.id === parsedPath.itemId);
    }

    if (vaultContent.credentials.length === 0 && vaultContent.notes.length === 0 && vaultContent.secrets.length === 0) {
        throw new Error(`No matching item found for "${parsedPath.itemId ?? parsedPath.title ?? ''}"`);
    }

    const secretToRender: Record<string, any> =
        vaultContent.secrets[0] ?? vaultContent.credentials[0] ?? vaultContent.notes[0];

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
