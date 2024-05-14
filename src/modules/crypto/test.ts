import { assert } from 'chai';
import crypto from 'crypto';
import { decrypt } from './decrypt.js';
import { encryptAesCbcHmac256 } from './encrypt.js';
import { deserializeEncryptedData } from './encryptedDataDeserialization.js';

describe('Encrypt and decrypt using random symmetric key', () => {
    it('ciphering params parsed after encryption are correct', () => {
        const input = 'The input string I want to encrypt';
        const key = crypto.randomBytes(32);
        const encryptedInput = encryptAesCbcHmac256(key, Buffer.from(input));

        const buffer = Buffer.from(encryptedInput, 'base64');
        const decodedBase64 = buffer.toString('ascii');
        const { encryptedData } = deserializeEncryptedData(decodedBase64, buffer);

        assert(encryptedData.keyDerivation.algo === 'noderivation', 'Invalid key derivation algorithm');
        assert(encryptedData.cipherConfig.encryption === 'aes256', 'Invalid encryption algorithm');
        assert(encryptedData.cipherConfig.cipherMode === 'cbchmac', 'Invalid encryption mode');
        assert(encryptedData.cipherConfig.ivLength === 16, 'Invalid IV length');
        assert(encryptedData.cipherData.salt.length === 0, 'Invalid salt length');
        assert(encryptedData.cipherData.iv.length === 16, 'Invalid IV');
        assert(encryptedData.cipherData.hash.length === 32, 'Invalid hash length');
    });

    it('decryption of encryption should successfully return the input', async () => {
        const input = 'The input string I want to encrypt';
        const key = crypto.randomBytes(32);
        const encryptedInput = encryptAesCbcHmac256(key, Buffer.from(input));
        const decryptedInput = await decrypt(encryptedInput, { type: 'alreadyComputed', symmetricKey: key });
        assert(input === decryptedInput.toString(), 'Decrypted input is different from the original input');
    });
});
