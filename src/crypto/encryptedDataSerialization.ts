import {
    Argon2DerivationConfig,
    SymmetricCipherConfig,
    EncryptedData,
    DerivationConfig,
    Pbkdf2DerivationConfig,
} from './types';

const serializeArgon2DerivationConfig = (config: Argon2DerivationConfig): Buffer => {
    const { saltLength, tCost, mCost, parallelism } = config;

    return Buffer.from(`${saltLength}$${tCost}$${mCost}$${parallelism}$`, 'ascii');
};

const serializePbkdf2DerivationConfig = (config: Pbkdf2DerivationConfig): Buffer => {
    const { saltLength, iterations, hashMethod } = config;

    return Buffer.from(`${saltLength}$${iterations}$${hashMethod}$`);
};

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
};

const serializeCipherConfig = (config: SymmetricCipherConfig): Buffer => {
    const { encryption, cipherMode, ivLength } = config;

    return Buffer.from(`${encryption}$${cipherMode}$${ivLength}$`, 'ascii');
};

/**
 * Serialize encrypted data into base64 string
 */
export const serializeEncryptedData = (encryptedData: EncryptedData): string => {
    const version = Buffer.from('$1$', 'ascii');
    const derivationConfig = serializeDerivationConfig(encryptedData.keyDerivation);
    const cipherConfig = serializeCipherConfig(encryptedData.cipherConfig);
    const { salt, iv, hash, encryptedPayload } = encryptedData.cipherData;

    return Buffer.concat([version, derivationConfig, cipherConfig, salt, iv, hash, encryptedPayload]).toString(
        'base64'
    );
};
