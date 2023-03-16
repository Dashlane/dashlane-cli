import Database from 'better-sqlite3';
import winston from 'winston';
import { BackupEditTransaction, Secrets, SecureNoteTransactionContent, VaultNote } from '../types';
import { decryptTransaction } from '../crypto';
import { askSecureNoteChoice } from '../utils';

interface GetSecureNote {
    filters: string[] | null;
    secrets: Secrets;
    output: string | null;
    one: Boolean;
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
    const { secrets, filters, db, output, one } = params;

    winston.debug(`Retrieving: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);
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

    if (filters?.length) {
        interface ItemFilter {
            keys: string[];
            value: string;
        }
        const parsedFilters: ItemFilter[] = [];

        filters.forEach((filter) => {
            const [splitFilterKey, ...splitFilterValues] = filter.split('=');

            const filterValue = splitFilterValues.join('=') || splitFilterKey;
            const filterKeys = splitFilterValues.length > 0 ? splitFilterKey.split(',') : ['title'];

            const canonicalFilterValue = filterValue.toLowerCase();

            parsedFilters.push({
                keys: filterKeys,
                value: canonicalFilterValue,
            });
        });

        matchedNotes = matchedNotes?.filter((item) =>
            parsedFilters
                .map((filter) =>
                    filter.keys.map((key) => item[key as keyof VaultNote]?.toLowerCase().includes(filter.value))
                )
                .flat()
                .some((b) => b)
        );
    }

    if (one && matchedNotes?.length !== 1) {
        throw new Error('Matched ' + (matchedNotes?.length || 0) + ' notes, required exactly one match.');
    }

    switch (output || 'text') {
        case 'json':
            let outputNotes;
            if (one && matchedNotes) {
                outputNotes = matchedNotes[0];
            } else {
                outputNotes = matchedNotes;
            }

            console.log(JSON.stringify(outputNotes, null, 4));
            break;
        case 'text':
            let selectedNote: VaultNote | null = null;

            if (!matchedNotes || matchedNotes.length === 0) {
                throw new Error('No note found');
            } else if (matchedNotes.length === 1) {
                selectedNote = matchedNotes[0];
            } else {
                matchedNotes = matchedNotes?.sort();
                selectedNote = await askSecureNoteChoice({ matchedNotes, hasFilters: Boolean(filters?.length) });
            }

            console.log(selectedNote.content);
            break;
        default:
            throw new Error('Unable to recognize the output mode.');
    }
};
