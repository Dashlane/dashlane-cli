import { expect } from 'chai';
import * as crypto from 'crypto';
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

        expect(encryptedData.keyDerivation.algo).to.equal('noderivation', 'Invalid key derivation algorithm');
        expect(encryptedData.cipherConfig.encryption).to.equal('aes256', 'Invalid encryption algorithm');
        expect(encryptedData.cipherConfig.cipherMode).to.equal('cbchmac', 'Invalid encryption mode');
        expect(encryptedData.cipherConfig.ivLength).to.equal(16, 'Invalid IV length');
        expect(encryptedData.cipherData.salt).length(0, 'Invalid salt length');
        expect(encryptedData.cipherData.iv).length(16, 'Invalid IV');
        expect(encryptedData.cipherData.hash).length(32, 'Invalid hash length');
    });

    it('decryption of encryption should successfully return the input', async () => {
        const input = 'The input string I want to encrypt';
        const key = crypto.randomBytes(32);
        const encryptedInput = encryptAesCbcHmac256(key, Buffer.from(input));
        const decryptedInput = await decrypt(encryptedInput, { type: 'alreadyComputed', symmetricKey: key });
        expect(input).to.equal(decryptedInput.toString());
    });
});
