import winston from 'winston';
import Database from 'better-sqlite3';

import { BackupEditTransaction, SecureNoteTransactionContent, VaultNote } from '../types.js';
import { decryptTransaction, getDerivate } from '../crypto/decrypt.js';
import { askReplaceMasterPassword, getMasterPassword, setMasterPassword } from '../steps/index.js';
import inquirer from 'inquirer';
import inquirerAutocomplete from 'inquirer-autocomplete-prompt';
import { notEmpty } from '../utils';

interface GetSecureNote {
    titleFilter: string | null;
    login: string;
    db: Database.Database;
}

const decryptSecureNotesTransactions = async (
    transactions: BackupEditTransaction[],
    masterPassword: string,
    login: string
): Promise<SecureNoteTransactionContent[] | null> => {
    const settingsTransaction = transactions.find((item) => item.identifier === 'SETTINGS_userId');
    if (!settingsTransaction) {
        throw new Error('Unable to locate the settings of the vault');
    } else {
        const derivate = await getDerivate(masterPassword, settingsTransaction);

        if (!decryptTransaction(settingsTransaction, derivate)) {
            if (!(await askReplaceMasterPassword())) {
                return null;
            }
            const masterPassword = await setMasterPassword(login);
            return decryptSecureNotesTransactions(transactions, masterPassword, login);
        }

        const secureNotesTransactions = transactions.filter((transaction) => transaction.type === 'SECURENOTE');

        const secureNotesDecrypted = secureNotesTransactions
            .map(
                (transaction: BackupEditTransaction) =>
                    decryptTransaction(transaction, derivate) as SecureNoteTransactionContent | null
            )
            .filter(notEmpty);

        if (secureNotesTransactions.length !== secureNotesDecrypted.length) {
            console.error(
                'Encountered decryption errors:',
                secureNotesTransactions.length - secureNotesDecrypted.length
            );
        }
        return secureNotesDecrypted;
    }
};

export const getNote = async (params: GetSecureNote): Promise<void> => {
    const { login, titleFilter, db } = params;

    const masterPassword = await getMasterPassword(login);
    if (!masterPassword) {
        throw new Error("Couldn't retrieve master password in OS keychain.");
    }

    winston.debug('Retrieving:', titleFilter || '');
    const transactions = db
        .prepare(
            `SELECT *
                  FROM transactions
                  WHERE action = 'BACKUP_EDIT'`
        )
        .all() as BackupEditTransaction[];

    const notesDecrypted = await decryptSecureNotesTransactions(transactions, masterPassword, login);

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

        inquirer.registerPrompt('autocomplete', inquirerAutocomplete);
        const noteQueried = (
            await inquirer.prompt<{ note: string }>([
                {
                    type: 'autocomplete',
                    name: 'note',
                    message,
                    source: (_answersSoFar: string[], input: string) =>
                        matchedNotes
                            ?.map((item, index) => item.title + ' - ' + index.toString(10))
                            .filter((title) => title && title.toLowerCase().includes(input?.toLowerCase() || '')),
                },
            ])
        ).note;
        const noteQueriedSplit = noteQueried.split(' - ');

        const selectedIndex = parseInt(noteQueriedSplit[noteQueriedSplit.length - 1], 10);
        if (selectedIndex < 0 || selectedIndex >= matchedNotes.length) {
            throw new Error('Unable to retrieve the corresponding note entry');
        }

        selectedNote = matchedNotes[selectedIndex];
    }

    console.log(selectedNote.content);
};
