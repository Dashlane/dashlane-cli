import { getEncryptedVaultKey } from '../../../endpoints/getEncryptedVaultKey';
import { logger } from '../../../logger';
import { askAccountRecoveryKey } from '../../../utils/dialogs';
import { decryptAesCbcHmac256, getDerivateUsingParametersFromEncryptedData } from '../../crypto/decrypt';
import { deserializeEncryptedData } from '../../crypto/encryptedDataDeserialization';

function cleanArk(input: string): string {
    return input.toUpperCase().replaceAll(/[^A-Z0-9]/g, '');
}
export async function getMasterpasswordFromArkPrompt(authTicket: string, login: string): Promise<string> {
    const { encryptedVaultKey: encryptedVaultKeyBase64 } = await getEncryptedVaultKey({
        authTicket,
        login,
    });

    const ark = cleanArk(await askAccountRecoveryKey());

    const buffer = Buffer.from(encryptedVaultKeyBase64, 'base64');
    const decodedBase64 = buffer.toString('ascii');
    const { encryptedData } = deserializeEncryptedData(decodedBase64, buffer);
    const derivatedKey = await getDerivateUsingParametersFromEncryptedData(ark, encryptedData);

    try {
        const decryptedVaultKey = decryptAesCbcHmac256({
            cipherData: encryptedData.cipherData,
            originalKey: derivatedKey,
            inflatedKey: encryptedData.cipherConfig.cipherMode === 'cbchmac64',
        });
        return decryptedVaultKey.toString('utf-8');
    } catch (e) {
        logger.error('Failed to decrypt MP. Maybe the ARK entered is incorrect');
        throw e;
    }
}
