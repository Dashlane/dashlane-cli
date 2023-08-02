/**
 * Parameters of the chosen derivation method
 */
export type DerivationConfig = Argon2DerivationConfig | Pbkdf2DerivationConfig | NoDerivationConfig;

/**
 * Parameters of Argon2d derivation method
 */
export interface Argon2DerivationConfig {
    algo: 'argon2d';
    saltLength: number;
    tCost: number;
    mCost: number;
    parallelism: number;
}

/**
 * Parameters of PBKDF2 derivation method
 *
 * An array of supported `hashMethod` functions can be retrieved using {@link crypto.getHashes}.
 */
export interface Pbkdf2DerivationConfig {
    algo: 'pbkdf2';
    saltLength: number;
    iterations: number;
    hashMethod: string;
}

/**
 * Derivation configuration to provide when the symmetric key is not derived from a master password
 */
export interface NoDerivationConfig {
    algo: 'noderivation';
}

/**
 * Parameters of the symmetric cipher used to encrypt the data, especially the mode of operation
 */
export interface SymmetricCipherConfig {
    encryption: 'aes256';
    cipherMode: 'cbchmac' | 'cbchmac64';
    ivLength: number;
}

/**
 * Cipher data that are not cipher parameters
 *
 * @param salt Salt to use with the derivation method. When no derivation method is provided it can be empty
 * @param iv Initialization Vector used in the symmetric cipher mode of operation described in {@link SymmetricCipherConfig.cipherMode}
 * @param hash Authenticated hash of the concatenation of the `iv` and the `encryptedData` using {@link SymmetricCipherConfig.cipherMode} algorithm
 */
export interface CipherData {
    salt: Buffer;
    iv: Buffer;
    hash: Buffer;
    encryptedPayload: Buffer;
}

/**
 * Encrypted data containing all the data and parameters to decrypt, authenticate and verify integrity of the message
 */
export interface EncryptedData {
    keyDerivation: DerivationConfig;
    cipherConfig: SymmetricCipherConfig;
    cipherData: CipherData;
}
