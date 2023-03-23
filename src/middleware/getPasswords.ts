import Database from 'better-sqlite3';
import { Clipboard } from '@napi-rs/clipboard';
import { authenticator } from 'otplib';
import winston from 'winston';
import {
    AuthentifiantTransactionContent,
    BackupEditTransaction,
    DeviceConfiguration,
    Secrets,
    VaultCredential,
} from '../types';
import { decryptTransaction } from '../crypto';
import { askCredentialChoice } from '../utils';

interface GetCredential {
    filters: string[] | null;
    secrets: Secrets;
    output: string | null;
    db: Database.Database;
}

interface GetPassword extends GetCredential {
    deviceConfiguration: DeviceConfiguration | null;
}

const decryptPasswordTransactions = async (
    db: Database.Database,
    transactions: BackupEditTransaction[],
    secrets: Secrets
): Promise<AuthentifiantTransactionContent[]> => {
    const authentifiantTransactions = transactions.filter((transaction) => transaction.type === 'AUTHENTIFIANT');

    const passwordsDecrypted = await Promise.all(
        authentifiantTransactions.map(
            (transaction) => decryptTransaction(transaction, secrets) as Promise<AuthentifiantTransactionContent>
        )
    );

    return passwordsDecrypted;
};

export const selectCredentials = async (params: GetCredential): Promise<VaultCredential[]> => {
    const { secrets, filters, db } = params;

    winston.debug(`Retrieving: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND action = 'BACKUP_EDIT'`)
        .bind(secrets.login)
        .all() as BackupEditTransaction[];

    const credentialsDecrypted = await decryptPasswordTransactions(db, transactions, secrets);

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

    let matchedCredentials = beautifiedCredentials;
    if (filters?.length) {
        interface ItemFilter {
            keys: string[];
            value: string;
        }
        const parsedFilters: ItemFilter[] = [];

        filters.forEach((filter) => {
            const [splitFilterKey, ...splitFilterValues] = filter.split('=');

            const filterValue = splitFilterValues.join('=') || splitFilterKey;
            const filterKeys = splitFilterValues.length > 0 ? splitFilterKey.split(',') : ['url', 'title'];

            const canonicalFilterValue = filterValue.toLowerCase();

            parsedFilters.push({
                keys: filterKeys,
                value: canonicalFilterValue,
            });
        });

        matchedCredentials = matchedCredentials?.filter((item) =>
            parsedFilters
                .map((filter) =>
                    filter.keys.map((key) => item[key as keyof VaultCredential]?.toLowerCase().includes(filter.value))
                )
                .flat()
                .some((b) => b)
        );
    }

    return matchedCredentials;
};

export const selectCredential = async (params: GetCredential, onlyOtpCredentials = false): Promise<VaultCredential> => {
    let matchedCredentials = await selectCredentials(params);

    if (onlyOtpCredentials) {
        matchedCredentials = matchedCredentials.filter((credential) => credential.otpSecret);
    }

    if (!matchedCredentials || matchedCredentials.length === 0) {
        throw new Error('No credential with this name found');
    } else if (matchedCredentials.length === 1) {
        return matchedCredentials[0];
    }

    return askCredentialChoice({ matchedCredentials, hasFilters: Boolean(params.filters?.length) });
};

export const getPassword = async (params: GetPassword): Promise<void> => {
    const clipboard = new Clipboard();
    const selectedCredential = await selectCredential(params);

    switch (params.output || 'clipboard') {
        case 'clipboard':
            clipboard.setText(selectedCredential.password);
            console.log(
                `🔓 Password for "${selectedCredential.title || selectedCredential.url || 'N\\C'}" copied to clipboard!`
            );

            if (selectedCredential.otpSecret) {
                const token = authenticator.generate(selectedCredential.otpSecret);
                const timeRemaining = authenticator.timeRemaining();
                console.log(`🔢 OTP code: ${token} \u001B[3m(expires in ${timeRemaining} seconds)\u001B[0m`);
            }

            if (params.deviceConfiguration && params.deviceConfiguration.sleepAfterCopy) {
                const sleepTime = params.deviceConfiguration.sleepTime
                    ? params.deviceConfiguration.sleepTime * 1000
                    : 10;
                console.log(`⏲️  Sleeping for ${params.deviceConfiguration.sleepTime} seconds`);
                await new Promise((resolve) => setTimeout(resolve, sleepTime));
            }
            break;
        case 'password':
            console.log(selectedCredential.password);
            break;
        default:
            throw new Error('Unable to recognize the output mode.');
    }
};

export const getOtp = async (params: GetCredential): Promise<void> => {
    const clipboard = new Clipboard();
    const selectedCredential = await selectCredential(params, true);

    // otpSecret can't be null because onlyOtpCredentials is set to true above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const token = authenticator.generate(selectedCredential.otpSecret!);
    const timeRemaining = authenticator.timeRemaining();
    switch (params.output || 'clipboard') {
        case 'clipboard':
            clipboard.setText(token);
            console.log(`🔢 OTP code: ${token} \u001B[3m(expires in ${timeRemaining} seconds)\u001B[0m`);
            break;
        case 'otp':
            console.log(token);
            break;
        default:
            throw new Error('Unable to recognize the output mode.');
    }
};
