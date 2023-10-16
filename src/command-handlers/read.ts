import { decryptTransactions } from '../modules/crypto';
import { connectAndPrepare, findVaultContent } from '../modules/database';
import {
    AuthentifiantTransactionContent,
    BackupEditTransaction,
    SecretTransactionContent,
    SecureNoteTransactionContent,
} from '../types';
import { beautifyContent, parsePath } from '../utils';

export const runRead = async (path: string) => {
    const { db, localConfiguration } = await connectAndPrepare({});

    const parsedPath = parsePath(path);

    let transactions: BackupEditTransaction[] = [];

    if (parsedPath.itemId) {
        transactions = db
            .prepare(
                `SELECT * 
                FROM transactions
                WHERE login = ?
                    AND identifier = ?
                    AND action = 'BACKUP_EDIT'
                `
            )
            .bind(localConfiguration.login, parsedPath.itemId)
            .all() as BackupEditTransaction[];
    }

    if (parsedPath.title) {
        transactions = db
            .prepare(
                `SELECT *
                FROM transactions
                WHERE login = ?
                    AND action = 'BACKUP_EDIT'
                    AND (type = 'AUTHENTIFIANT' OR type = 'SECURENOTE' or type = 'SECRET')
                `
            )
            .bind(localConfiguration.login)
            .all() as BackupEditTransaction[];
    }

    db.close();

    const credentials = transactions.filter((transaction) => transaction.type === 'AUTHENTIFIANT');
    const notes = transactions.filter((transaction) => transaction.type === 'SECURENOTE');
    const secrets = transactions.filter((transaction) => transaction.type === 'SECRET');

    const decryptedCredentials = await decryptTransactions<AuthentifiantTransactionContent>(
        credentials,
        localConfiguration
    );
    const decryptedNotes = await decryptTransactions<SecureNoteTransactionContent>(notes, localConfiguration);
    const decryptedSecrets = await decryptTransactions<SecretTransactionContent>(secrets, localConfiguration);

    const secretsDecrypted = beautifyContent({
        credentials: decryptedCredentials,
        notes: decryptedNotes,
        secrets: decryptedSecrets,
    });

    console.log(findVaultContent(secretsDecrypted, parsedPath));
};
