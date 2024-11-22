import Database from 'better-sqlite3';
import { Clipboard } from '@napi-rs/clipboard';
import {
    AuthentifiantTransactionContent,
    BackupEditTransaction,
    LocalConfiguration,
    VaultCredential,
} from '../types.js';
import { decryptTransactions, generateOtpFromSecret, generateOtpFromUri } from '../modules/crypto/index.js';
import { askCredentialChoice, filterMatches } from '../utils/index.js';
import { connectAndPrepare } from '../modules/database/index.js';
import { logger } from '../logger.js';

export const runPassword = async (
    filters: string[] | null,
    options: { output: 'json' | 'clipboard' | 'console'; field: 'login' | 'email' | 'password' | 'otp' }
) => {
    const { output, field } = options;
    const { db, localConfiguration } = await connectAndPrepare({});

    let foundCredentials = await findCredentials({ db, filters, localConfiguration });
    db.close();

    if (output === 'json') {
        logger.content(JSON.stringify(foundCredentials));
        return;
    }

    if (field === 'otp') {
        foundCredentials = foundCredentials.filter((credential) => credential.otpSecret || credential.otpUrl);

        if (foundCredentials.length === 0) {
            throw new Error('No credential found with OTP.');
        }
    }

    const selectedCredential = await selectCredential(foundCredentials, Boolean(filters?.length));

    let result;
    switch (field) {
        case 'login':
            result = selectedCredential.login;
            break;
        case 'email':
            result = selectedCredential.email;
            break;
        case 'password':
            result = selectedCredential.password;
            break;
        case 'otp':
            if (!selectedCredential.otpSecret && !selectedCredential.otpUrl) {
                throw new Error('No OTP found for this credential.');
            }
            if (selectedCredential.otpSecret) {
                result = generateOtpFromSecret(selectedCredential.otpSecret).token;
            }
            if (selectedCredential.otpUrl) {
                result = generateOtpFromUri(selectedCredential.otpUrl).token;
            }
            break;
        default:
            throw new Error('Unable to recognize the field.');
    }

    if (!result) {
        throw new Error(`No ${field} found for "${selectedCredential.title ?? selectedCredential.url ?? 'N/C'}".`);
    }

    if (output === 'console') {
        logger.content(result);
        return;
    }

    const clipboard = new Clipboard();
    clipboard.setText(result);
    logger.content(
        `🔓 ${field} for "${selectedCredential.title || selectedCredential.url || 'N/C'}" copied to clipboard!`
    );

    if (field === 'password' && (selectedCredential.otpSecret || selectedCredential.otpUrl)) {
        let token = '';
        let remainingTime: number | null = null;
        if (selectedCredential.otpSecret) {
            ({ token, remainingTime } = generateOtpFromSecret(selectedCredential.otpSecret));
        }
        if (selectedCredential.otpUrl) {
            ({ token, remainingTime } = generateOtpFromUri(selectedCredential.otpUrl));
        }

        logger.content(`🔢 OTP code: ${token}`);
        if (remainingTime) {
            logger.content(`⏳ Remaining time: ${remainingTime} seconds`);
        }
    }
};

interface GetCredential {
    filters: string[] | null;
    localConfiguration: LocalConfiguration;
    db: Database.Database;
}

export const findCredentials = async (params: GetCredential): Promise<VaultCredential[]> => {
    const { localConfiguration, filters, db } = params;

    logger.debug(`Retrieving: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND type = 'AUTHENTIFIANT' AND action = 'BACKUP_EDIT'`)
        .bind(localConfiguration.login)
        .all() as BackupEditTransaction[];

    const credentialsDecrypted = await decryptTransactions<AuthentifiantTransactionContent>(
        transactions,
        localConfiguration
    );

    // transform entries [{_attributes: {key:xx}, _cdata: ww}] into an easier-to-use object
    const beautifiedCredentials = credentialsDecrypted.map(
        (item) =>
            Object.fromEntries(
                item.root.KWAuthentifiant.KWDataItem.map((entry) => [
                    entry._attributes.key[0].toLowerCase() + entry._attributes.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                    entry._cdata,
                ])
            ) as unknown as VaultCredential
    );

    return filterMatches<VaultCredential>(beautifiedCredentials, filters);
};

export const selectCredential = async (
    vaultCredentials: VaultCredential[],
    hasFilters: boolean
): Promise<VaultCredential> => {
    if (!vaultCredentials || vaultCredentials.length === 0) {
        throw new Error('No credential found with this filters.');
    } else if (vaultCredentials.length === 1) {
        return vaultCredentials[0];
    }

    return askCredentialChoice({ matchedCredentials: vaultCredentials, hasFilters });
};
