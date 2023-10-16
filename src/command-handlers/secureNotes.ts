import Database from 'better-sqlite3';
import winston from 'winston';
import { BackupEditTransaction, Secrets, SecureNoteTransactionContent, VaultNote } from '../types';
import { decryptTransactions } from '../modules/crypto';
import { askSecureNoteChoice, filterMatches } from '../utils';
import { connectAndPrepare } from '../modules/database';

export const runSecureNote = async (filters: string[] | null, options: { output: 'text' | 'json' }) => {
    const { db, secrets } = await connectAndPrepare({});
    await getNote({
        filters,
        secrets,
        output: options.output,
        db,
    });
    db.close();
};

interface GetSecureNote {
    filters: string[] | null;
    secrets: Secrets;
    output: 'text' | 'json';
    db: Database.Database;
}

export const getNote = async (params: GetSecureNote): Promise<void> => {
    const { secrets, filters, db, output } = params;

    winston.debug(`Retrieving: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND type = 'SECURENOTE' AND action = 'BACKUP_EDIT'`)
        .bind(secrets.login)
        .all() as BackupEditTransaction[];

    const notesDecrypted = await decryptTransactions<SecureNoteTransactionContent>(transactions, secrets);

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

    let matchedNotes = filterMatches<VaultNote>(beautifiedNotes, filters, ['title']);

    switch (output) {
        case 'json':
            console.log(JSON.stringify(matchedNotes));
            break;
        case 'text': {
            let selectedNote: VaultNote | null = null;

            if (matchedNotes.length === 0) {
                throw new Error('No note found');
            } else if (matchedNotes.length === 1) {
                selectedNote = matchedNotes[0];
            } else {
                matchedNotes = matchedNotes?.sort();
                selectedNote = await askSecureNoteChoice({ matchedNotes, hasFilters: Boolean(filters?.length) });
            }

            console.log(selectedNote.content);
            break;
        }
        default:
            throw new Error('Unable to recognize the output mode.');
    }
};
