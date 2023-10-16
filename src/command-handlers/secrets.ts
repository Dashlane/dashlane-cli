import Database from 'better-sqlite3';
import winston from 'winston';
import { BackupEditTransaction, Secrets, SecretTransactionContent, VaultSecret } from '../types';
import { decryptTransactions } from '../modules/crypto';
import { askSecretChoice, filterMatches } from '../utils';
import { connectAndPrepare } from '../modules/database';

export const runSecret = async (filters: string[] | null, options: { output: 'text' | 'json' }) => {
    const { db, secrets } = await connectAndPrepare({});
    await getSecret({
        filters,
        secrets,
        output: options.output,
        db,
    });
    db.close();
};

interface GetSecret {
    filters: string[] | null;
    secrets: Secrets;
    output: 'text' | 'json';
    db: Database.Database;
}

export const getSecret = async (params: GetSecret): Promise<void> => {
    const { secrets, filters, db, output } = params;

    winston.debug(`Retrieving: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND type = 'SECRET' AND action = 'BACKUP_EDIT'`)
        .bind(secrets.login)
        .all() as BackupEditTransaction[];

    const secretDecrypted = await decryptTransactions<SecretTransactionContent>(transactions, secrets);

    // transform entries [{_attributes: {key: xx}, _cdata: ww}] into an easier-to-use object
    const beautifiedSecrets = secretDecrypted?.map(
        (item) =>
            Object.fromEntries(
                item.root.KWSecret.KWDataItem.map((entry) => [
                    entry._attributes.key[0].toLowerCase() + entry._attributes.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                    entry._cdata,
                ])
            ) as unknown as VaultSecret
    );

    let matchedSecrets = filterMatches<VaultSecret>(beautifiedSecrets, filters, ['title']);

    switch (output) {
        case 'json':
            console.log(JSON.stringify(matchedSecrets));
            break;
        case 'text': {
            let selectedSecret: VaultSecret | null = null;

            if (matchedSecrets.length === 0) {
                throw new Error('No secret found');
            } else if (matchedSecrets.length === 1) {
                selectedSecret = matchedSecrets[0];
            } else {
                matchedSecrets = matchedSecrets?.sort();
                selectedSecret = await askSecretChoice({ matchedSecrets, hasFilters: Boolean(filters?.length) });
            }

            console.log(selectedSecret.content);
            break;
        }
        default:
            throw new Error('Unable to recognize the output mode.');
    }
};
