import { requestAppApi } from '../requestApi.js';

interface GetEncryptedVaultKeyParams {
    login: string;
    authTicket: string;
}

export interface GetEncryptedVaultKeyResult {
    encryptedVaultKey: string;
}

export const getEncryptedVaultKey = ({ authTicket, login }: GetEncryptedVaultKeyParams) =>
    requestAppApi<GetEncryptedVaultKeyResult>({
        path: 'accountrecovery/GetEncryptedVaultKey',
        payload: {
            authTicket,
            login,
        },
    });
