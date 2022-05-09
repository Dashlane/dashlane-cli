import * as crypto from 'crypto';

import { hmacSha256, sha512 } from './hash.js';
import { Argon2Derivation, CipherConfig, CipheringMethod, DerivationConfig, Pbkdf2Derivation } from './types.js';

export const crypt = (originalKey: Buffer, content: Buffer): string => {
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

    const cipheringMethod: CipheringMethod = {
        keyDerivation: {
            algo: 'noderivation'
        },
        cipherConfig: {
            encryption: 'aes256',
            cipherMode: 'cbchmac',
            ivLength: 16
        },
        cipheredContent: {
            salt: Buffer.from(''),
            iv,
            hash: signature,
            encryptedData: encrypted
        }
    };

    return serializePayload(cipheringMethod);
};

const serializeArgon2DerivationConfig = (config: Argon2Derivation): Buffer => {
    const { saltLength, tCost, mCost, parallelism } = config;

    return Buffer.from(`${saltLength}$${tCost}$${mCost}$${parallelism}$`, 'ascii');
}

const serializePbkdf2DerivationConfig = (config: Pbkdf2Derivation): Buffer => {
    const { saltLength, iterations, hashMethod } = config;

    return Buffer.from(`${saltLength}$${iterations}$${hashMethod}$`);
}

const serializeDerivationConfig = (config: DerivationConfig): Buffer => {
    let result = Buffer.from(`${config.algo}$`, 'ascii');

    switch (config.algo) {
        case 'argon2d':
            result = Buffer.concat([result, serializeArgon2DerivationConfig(config)]);
            break;
        case 'pbkdf2':
            result = Buffer.concat([result, serializePbkdf2DerivationConfig(config)]);
            break;
        case 'noderivation':
            break;
    }
    return result;
}

const serializeCipherConfig = (config: CipherConfig): Buffer => {
    const { encryption, cipherMode, ivLength } = config;

    return Buffer.from(`${encryption}$${cipherMode}$${ivLength}$`, 'ascii')
}

const serializePayload = (payload: CipheringMethod): string => {
    const version = Buffer.from('$1$', 'ascii');
    const derivationConfig = serializeDerivationConfig(payload.keyDerivation);
    const cipherConfig = serializeCipherConfig(payload.cipherConfig);
    const { salt, iv, hash, encryptedData } = payload.cipheredContent;

    return Buffer.concat([version, derivationConfig, cipherConfig, salt, iv, hash, encryptedData]).toString('base64');
};
