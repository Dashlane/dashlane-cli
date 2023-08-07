import Database from 'better-sqlite3';
import { Clipboard } from '@napi-rs/clipboard';
import { authenticator } from 'otplib';
import winston from 'winston';
import { AuthentifiantTransactionContent, BackupEditTransaction, Secrets, VaultCredential } from '../types';
import { decryptTransactions } from '../modules/crypto';
import { askCredentialChoice } from '../utils';
import { connectAndPrepare } from '../modules/database';

export const runPassword = async (filters: string[] | null, options: { output: string | null }) => {
    const { db, secrets } = await connectAndPrepare({});

    if (options.output === 'json') {
        console.log(
            JSON.stringify(
                await selectCredentials({
                    filters,
                    secrets,
                    output: options.output,
                    db,
                }),
                null,
                4
            )
        );
    } else {
        await getPassword({
            filters,
            secrets,
            output: options.output,
            db,
        });
    }
    db.close();
};

export const runOtp = async (filters: string[] | null, options: { print: boolean }) => {
    const { db, secrets } = await connectAndPrepare({});
    await getOtp({
        filters,
        secrets,
        output: options.print ? 'otp' : 'clipboard',
        db,
    });
    db.close();
};

interface GetCredential {
    filters: string[] | null;
    secrets: Secrets;
    output: string | null;
    db: Database.Database;
}

export const selectCredentials = async (params: GetCredential): Promise<VaultCredential[]> => {
    const { secrets, filters, db } = params;

    winston.debug(`Retrieving: ${filters && filters.length > 0 ? filters.join(' ') : ''}`);
    const transactions = db
        .prepare(`SELECT * FROM transactions WHERE login = ? AND type = 'AUTHENTIFIANT' AND action = 'BACKUP_EDIT'`)
        .bind(secrets.login)
        .all() as BackupEditTransaction[];

    const credentialsDecrypted = await decryptTransactions<AuthentifiantTransactionContent>(transactions, secrets);

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

export const getPassword = async (params: GetCredential): Promise<void> => {
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
