import { decryptTransactions } from '../modules/crypto';
import { connectAndPrepare } from '../modules/database';
import { AuthentifiantTransactionContent, BackupEditTransaction, SecureNoteTransactionContent } from '../types';
import { beautifySecrets, parsePath } from '../utils';

export const runRead = async (path: string) => {
    const { db, secrets } = await connectAndPrepare({});

    const parsedPath = parsePath(path);

    let transactions: BackupEditTransaction[] = [];

    if (parsedPath.secretId) {
        transactions = db
            .prepare(
                `SELECT * 
                FROM transactions
                WHERE login = ?
                    AND identifier = ?
                    AND action = 'BACKUP_EDIT'
                `
            )
            .bind(secrets.login, parsedPath.secretId)
            .all() as BackupEditTransaction[];
    }

    if (parsedPath.title) {
        transactions = db
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
    }

    db.close();

    const credentials = transactions.filter((transaction) => transaction.type === 'AUTHENTIFIANT');
    const notes = transactions.filter((transaction) => transaction.type === 'SECURENOTE');

    const decryptedCredentials = await decryptTransactions<AuthentifiantTransactionContent>(credentials, secrets);
    const decryptedNotes = await decryptTransactions<SecureNoteTransactionContent>(notes, secrets);

    const secretsDecrypted = beautifySecrets({ credentials: decryptedCredentials, notes: decryptedNotes });

    if (parsedPath.title) {
        secretsDecrypted.credentials = secretsDecrypted.credentials.filter(
            (credential) => credential.title === parsedPath.title
        );
        secretsDecrypted.notes = secretsDecrypted.notes.filter((note) => note.title === parsedPath.title);
    }

    if (secretsDecrypted.credentials.length === 0 && secretsDecrypted.notes.length === 0) {
        throw new Error('No matching secret found');
    }

    const secretToRender: Record<string, any> =
        secretsDecrypted.credentials.length > 0 ? secretsDecrypted.credentials[0] : secretsDecrypted.notes[0];

    if (parsedPath.field) {
        if (!secretToRender[parsedPath.field]) {
            throw new Error('No matching field found');
        }
        return console.log(secretToRender[parsedPath.field]);
    }

    console.log(JSON.stringify(secretToRender, null, 4));
};
