import winston from 'winston';
import Database from 'better-sqlite3';
import inquirer from 'inquirer';

import {
    BackupEditTransaction,
    PrintableVaultNote,
    Secrets,
    SecureNoteTransactionContent,
    VaultNote,
} from '../types.js';
import {
    askReplaceMasterPassword,
    decryptTransaction,
    getDerivateUsingParametersFromTransaction,
    getSecrets,
} from '../crypto/index.js';
import { notEmpty } from '../utils.js';

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
    const settingsTransaction = transactions.find((item) => item.identifier === 'SETTINGS_userId');
    if (!settingsTransaction) {
        throw new Error('Unable to locate the settings of the vault');
    }

    const derivate = await getDerivateUsingParametersFromTransaction(secrets.masterPassword, settingsTransaction);

    if (!decryptTransaction(settingsTransaction, derivate)) {
        if (!(await askReplaceMasterPassword())) {
            return null;
        }
        return decryptSecureNotesTransactions(db, transactions, await getSecrets(db, null));
    }

    const secureNotesTransactions = transactions.filter((transaction) => transaction.type === 'SECURENOTE');

    const secureNotesDecrypted = secureNotesTransactions
        .map(
            (transaction: BackupEditTransaction) =>
                decryptTransaction(transaction, derivate) as SecureNoteTransactionContent | null
        )
        .filter(notEmpty);

    if (secureNotesTransactions.length !== secureNotesDecrypted.length) {
        winston.error('Encountered decryption errors:', secureNotesTransactions.length - secureNotesDecrypted.length);
    }
    return secureNotesDecrypted;
};

export const getNote = async (params: GetSecureNote): Promise<void> => {
    const { secrets, titleFilter, db } = params;

    winston.debug('Retrieving:', titleFilter || '');
    const transactions = db
        .prepare(
            `SELECT *
                  FROM transactions
                  WHERE action = 'BACKUP_EDIT'`
        )
        .all() as BackupEditTransaction[];

    const notesDecrypted = await decryptSecureNotesTransactions(db, transactions, secrets);

    // transform entries [{key: xx, $t: ww}] into an easier-to-use object
    const beautifiedNotes = notesDecrypted?.map(
        (item) =>
            Object.fromEntries(
                item.root.KWSecureNote.KWDataItem.map((entry) => [
                    entry.key[0].toLowerCase() + entry.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                    entry.$t,
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

        selectedNote = (
            await inquirer.prompt<{ note: PrintableVaultNote }>([
                {
                    type: 'search-list',
                    name: 'note',
                    message,
                    choices: matchedNotes.map((item) => {
                        const printableItem = new PrintableVaultNote(item);
                        return { name: printableItem.toString(), value: printableItem };
                    }),
                },
            ])
        ).note.vaultNote;
    }

    console.log(selectedNote.content);
};
