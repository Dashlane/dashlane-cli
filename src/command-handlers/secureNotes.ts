import Database from 'better-sqlite3';
import { BackupEditTransaction, LocalConfiguration, SecureNoteTransactionContent, VaultNote } from '../types.js';
import { decryptTransactions } from '../modules/crypto/index.js';
import { askSecureNoteChoice, filterMatches } from '../utils/index.js';
import { connectAndPrepare } from '../modules/database/index.js';
import { logger } from '../logger.js';

export const runSecureNote = async (filters: string[] | null, options: { output: 'text' | 'json' }) => {
    const { db, localConfiguration } = await connectAndPrepare({});
    await getNote({
        filters,
        localConfiguration,
        output: options.output,
        db,
    });
    db.close();
};

interface GetSecureNote {
    filters: string[] | null;
    localConfiguration: LocalConfiguration;
    output: 'text' | 'json';
    db: Database.Database;
}

export const getNote = async (params: GetSecureNote): Promise<void> => {
    const { localConfiguration, filters, db, output } = params;

    logger.debug(`Retrieving: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND type = 'SECURENOTE' AND action = 'BACKUP_EDIT'`)
        .bind(localConfiguration.login)
        .all() as BackupEditTransaction[];

    const notesDecrypted = await decryptTransactions<SecureNoteTransactionContent>(transactions, localConfiguration);

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
            logger.content(JSON.stringify(matchedNotes));
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

            logger.content(selectedNote.content);
            break;
        }
        default:
            throw new Error('Unable to recognize the output mode.');
    }
};
