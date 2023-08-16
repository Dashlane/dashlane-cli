import * as crypto from 'crypto';
import { serializeEncryptedData } from './encryptedDataSerialization';
import { hmacSha256, sha512 } from './hash';
import { EncryptedData } from './types';

export const encryptAesCbcHmac256 = (originalKey: Buffer, content: Buffer): string => {
    const combinedKey = sha512(originalKey);
    const cipheringKey = combinedKey.slice(0, 32);
    const macKey = combinedKey.slice(32);

    const iv = crypto.randomBytes(16);
    if (!iv) {
        throw new Error('Unable to generate IV');
    }

    const cipher = crypto.createCipheriv('aes-256-cbc', cipheringKey, iv);
    const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);

    const signature = hmacSha256(macKey, Buffer.concat([iv, encrypted]));

    const cipheringMethod: EncryptedData = {
        keyDerivation: {
            algo: 'noderivation',
        },
        cipherConfig: {
            encryption: 'aes256',
            cipherMode: 'cbchmac',
            ivLength: 16,
        },
        cipherData: {
            salt: Buffer.from(''),
            iv,
            hash: signature,
            encryptedPayload: encrypted,
        },
    };

    return serializeEncryptedData(cipheringMethod);
};
