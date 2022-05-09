import * as crypto from 'crypto';
import { expect } from 'chai';

import { crypt } from './crypt.js';
import { decrypt, parsePayload } from './decrypt.js';

describe('Crypt and decrypt using random symmetric key', () => {
    it ('ciphering params parsed after encryption are correct', () => {
        const input = "The input string I want to crypt";
        const key = crypto.randomBytes(32);
        const encryptedInput = crypt(key, Buffer.from(input, 'utf-8'));

        const buffer = Buffer.from(encryptedInput, 'base64');
        const decodedBase64 = buffer.toString('ascii');
        const payload = parsePayload(decodedBase64, buffer);

        expect(payload.keyDerivation.algo).to.equal('noderivation', 'Invalid key derivation algorithm');
        expect(payload.cipherConfig.encryption).to.equal('aes256', 'Invalid encryption algorithm');
        expect(payload.cipherConfig.cipherMode).to.equal('cbchmac', 'Invalid encryption mode');
        expect(payload.cipherConfig.ivLength).to.equal(16, 'Invalid IV length');
        expect(payload.cipheredContent.salt).length(0, 'Invalid salt length');
        expect(payload.cipheredContent.iv).length(16, 'Invalid IV');
        expect(payload.cipheredContent.hash).length(32, 'Invalid hash length');
    })

    it('decryption of encryption should successfully return the input', () => {
        const input = "The input string I want to crypt";
        const key = crypto.randomBytes(32);
        const encryptedInput = crypt(key, Buffer.from(input, 'utf-8'));
        const decryptedInput = decrypt(encryptedInput, key);
        expect(input).to.equal(decryptedInput.toString('utf-8'));
    });
});
