import Database from 'better-sqlite3';
import winston from 'winston';
import { BackupEditTransaction, Secrets, SecureNoteTransactionContent, VaultNote } from '../types';
import { decryptTransactions } from '../modules/crypto';
import { askSecureNoteChoice } from '../utils';
import { connectAndPrepare } from '../modules/database';

export const runSecureNote = async (filter: string | null) => {
    const { db, secrets } = await connectAndPrepare({});
    await getNote({
        titleFilter: filter,
        secrets,
        db,
    });
    db.close();
};

interface GetSecureNote {
    titleFilter: string | null;
    secrets: Secrets;
    db: Database.Database;
}

export const getNote = async (params: GetSecureNote): Promise<void> => {
    const { secrets, titleFilter, db } = params;

    winston.debug(`Retrieving: ${titleFilter || ''}`);
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
        selectedNote = await askSecureNoteChoice({ matchedNotes, hasFilters: Boolean(titleFilter) });
    }

    console.log(selectedNote.content);
};
