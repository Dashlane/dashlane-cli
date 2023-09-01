import { connectAndPrepare } from './connectAndPrepare.js';
import {
    VaultSecrets,
    BackupEditTransaction,
    AuthentifiantTransactionContent,
    SecureNoteTransactionContent,
    ParsedPath,
} from '../../types.js';
import { beautifySecrets, parsePath } from '../../utils/index.js';
import { decryptTransactions } from '../crypto/index.js';

let vaultSecrets: VaultSecrets | undefined = undefined;

export const initVaultSecrets = async () => {
    if (vaultSecrets) {
        return;
    }

    const { secrets, db } = await connectAndPrepare({});

    const transactions = db
        .prepare(
            `SELECT *
                FROM transactions
                WHERE login = ?
                    AND action = 'BACKUP_EDIT'
                    AND (type = 'AUTHENTIFIANT' OR type = 'SECURENOTE')
                `
        )
        .bind(secrets.login)
        .all() as BackupEditTransaction[];

    const credentials = transactions.filter((transaction) => transaction.type === 'AUTHENTIFIANT');
    const notes = transactions.filter((transaction) => transaction.type === 'SECURENOTE');

    const decryptedCredentials = await decryptTransactions<AuthentifiantTransactionContent>(credentials, secrets);
    const decryptedNotes = await decryptTransactions<SecureNoteTransactionContent>(notes, secrets);

    vaultSecrets = beautifySecrets({ credentials: decryptedCredentials, notes: decryptedNotes });
};

export const getVaultSecret = (path: string): string => {
    if (!vaultSecrets) {
        throw new Error('Vault secrets not initialized');
    }

    const parsedPath = parsePath(path);

    return findVaultSecret(vaultSecrets, parsedPath);
};

export const findVaultSecret = (vaultSecrets: VaultSecrets, parsedPath: ParsedPath): string => {
    if (parsedPath.title) {
        vaultSecrets.credentials = vaultSecrets.credentials.filter(
            (credential) => credential.title === parsedPath.title
        );
        vaultSecrets.notes = vaultSecrets.notes.filter((note) => note.title === parsedPath.title);
    }

    if (parsedPath.secretId) {
        vaultSecrets.credentials = vaultSecrets.credentials.filter(
            (credential) => credential.id === parsedPath.secretId
        );
        vaultSecrets.notes = vaultSecrets.notes.filter((note) => note.id === parsedPath.secretId);
    }

    if (vaultSecrets.credentials.length === 0 && vaultSecrets.notes.length === 0) {
        throw new Error(`No matching secret found for "${parsedPath.secretId ?? parsedPath.title ?? ''}"`);
    }

    const secretToRender: Record<string, any> =
        vaultSecrets.credentials.length > 0 ? vaultSecrets.credentials[0] : vaultSecrets.notes[0];

    if (parsedPath.field) {
        if (!secretToRender[parsedPath.field]) {
            throw new Error(
                `No matching field found for "${parsedPath.field}" in "${
                    parsedPath.secretId ?? parsedPath.title ?? ''
                }"`
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
