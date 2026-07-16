import Database from 'better-sqlite3';
import { BackupEditTransaction, LocalConfiguration, PersonalInfoTransactionContent, VaultId } from '../types.js';
import { decryptTransactions } from '../modules/crypto/index.js';
import { filterMatches } from '../utils/index.js';
import { connectAndPrepare } from '../modules/database/index.js';
import { logger } from '../logger.js';

/** Vault transaction types that hold structured personal identity information. */
export const PERSONAL_INFO_TYPES = [
    'IDENTITY',
    'PASSPORT',
    'IDCARD',
    'DRIVERLICENSE',
    'SOCIALSECURITYID',
    'FISCALSTATEMENT',
] as const;

export const runId = async (filters: string[] | null, options: { output: 'text' | 'json' }) => {
    const { db, localConfiguration } = await connectAndPrepare({});
    const ids = await getIds({ filters, localConfiguration, db });
    db.close();

    switch (options.output) {
        case 'json':
            logger.content(JSON.stringify(ids));
            break;
        case 'text': {
            if (ids.length === 0) {
                throw new Error('No personal ID item found');
            }
            const blocks = ids.map((id) => {
                const lines = Object.entries(id)
                    .filter(([, value]) => typeof value === 'string' && value.length > 0)
                    .map(([key, value]) => `  ${key}: ${value}`);
                return `[${id.type}]\n${lines.join('\n')}`;
            });
            logger.content(blocks.join('\n\n'));
            break;
        }
        default:
            throw new Error('Unable to recognize the output mode.');
    }
};

interface GetIds {
    filters: string[] | null;
    localConfiguration: LocalConfiguration;
    db: Database.Database;
}

export const getIds = async (params: GetIds): Promise<VaultId[]> => {
    const { localConfiguration, filters, db } = params;

    logger.debug(`Retrieving personal ID items: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);

    const placeholders = PERSONAL_INFO_TYPES.map(() => '?').join(', ');
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND type IN (${placeholders}) AND action = 'BACKUP_EDIT'`)
        .bind(localConfiguration.login, ...PERSONAL_INFO_TYPES)
        .all() as BackupEditTransaction[];

    const decrypted = await decryptTransactions<PersonalInfoTransactionContent>(transactions, localConfiguration);

    // Each item's content is a single root element (KWPassport, KWIDCard, KWIdentity, ...) whose
    // KWDataItem entries are the fields. This is type-agnostic: any field the item carries is exposed.
    const beautifiedIds = decrypted.map((item, index) => {
        const kwType = Object.keys(item.root)[0];
        const dataItems = item.root[kwType]?.KWDataItem ?? [];
        const fields = Object.fromEntries(
            dataItems
                .filter((entry) => entry._cdata !== undefined)
                .map((entry) => [
                    entry._attributes.key[0].toLowerCase() + entry._attributes.key.slice(1), // FirstName => firstName
                    entry._cdata as string,
                ])
        ) as Record<string, string>;

        // Transaction type (PASSPORT, IDCARD, ...) is the primary, reliable classifier and filter key.
        return { ...fields, kwType, type: transactions[index].type } as VaultId;
    });

    return filterMatches<VaultId>(beautifiedIds, filters, [
        'type',
        'fullname',
        'firstName',
        'lastName',
        'number',
        'idNumber',
    ]);
};
