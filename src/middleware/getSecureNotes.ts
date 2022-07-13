import winston from 'winston';
import Database from 'better-sqlite3';
import inquirer from 'inquirer';

import { BackupEditTransaction, PrintableVaultNote, Secrets, SecureNoteTransactionContent, VaultNote } from '../types';
import { decryptTransaction } from '../crypto';

interface GetSecureNote {
    titleFilter: string | null;
    secrets: Secrets;
    db: Database.Database;
}

const decryptSecureNotesTransactions = async (
    db: Database.Database,
    transactions: BackupEditTransaction[],
    secrets: Secrets
): Promise<SecureNoteTransactionContent[] | null> => {
    const secureNotesTransactions = transactions.filter((transaction) => transaction.type === 'SECURENOTE');

    const secureNotesDecrypted = await Promise.all(
        secureNotesTransactions.map(
            (transaction) => decryptTransaction(transaction, secrets) as Promise<SecureNoteTransactionContent>
        )
    );

    return secureNotesDecrypted;
};

export const getNote = async (params: GetSecureNote): Promise<void> => {
    const { secrets, titleFilter, db } = params;

    winston.debug(`Retrieving: ${titleFilter || ''}`);
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND action = 'BACKUP_EDIT'`)
        .bind(secrets.login)
        .all() as BackupEditTransaction[];

    const notesDecrypted = await decryptSecureNotesTransactions(db, transactions, secrets);

    // transform entries [{_attributes: {key: xx}, _cdata: ww}] into an easier-to-use object
    const beautifiedNotes = notesDecrypted?.map(
        (item) =>
            Object.fromEntries(
                item.root.KWSecureNote.KWDataItem.map((entry) => [
                    entry._attributes.key[0].toLowerCase() + entry._attributes.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                    entry._cdata,
                ])
            ) as unknown as VaultNote
    );

    let matchedNotes = beautifiedNotes;
    if (titleFilter) {
        const canonicalTitleFilter = titleFilter.toLowerCase();
        matchedNotes = beautifiedNotes?.filter((item) => item.title.toLowerCase().includes(canonicalTitleFilter));
    }
    matchedNotes = matchedNotes?.sort();

    let selectedNote: VaultNote | null = null;

    if (!matchedNotes || matchedNotes.length === 0) {
        throw new Error('No note found');
    } else if (matchedNotes.length === 1) {
        selectedNote = matchedNotes[0];
    } else {
        const message = titleFilter
            ? 'There are multiple results for your query, pick one:'
            : 'What note would you like to get?';

        const { printableNote } = await inquirer.prompt<{ printableNote: PrintableVaultNote }>([
            {
                type: 'search-list',
                name: 'printableNote',
                message,
                choices: matchedNotes.map((item) => {
                    const printableItem = new PrintableVaultNote(item);
                    return { name: printableItem.toString(), value: printableItem };
                }),
            },
        ]);

        selectedNote = printableNote.vaultNote;
    }

    console.log(selectedNote.content);
};
