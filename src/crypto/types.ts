export type DerivationConfig = Argon2Derivation | Pbkdf2Derivation | NoDerivation;

export interface Argon2Derivation {
    algo: 'argon2d';
    saltLength: number;
    tCost: number;
    mCost: number;
    parallelism: number;
}

export interface Pbkdf2Derivation {
    algo: 'pbkdf2';
    saltLength: number;
    iterations: number;
    hashMethod: string;
}

export interface NoDerivation {
    algo: 'noderivation';
}

export interface CipherConfig {
    encryption: 'aes256';
    cipherMode: 'cbchmac' | 'cbchmac64';
    ivLength: number;
}

export interface CipheredContent {
    salt: Buffer;
    iv: Buffer;
    hash: Buffer;
    encryptedData: Buffer;
}

export interface CipheringMethod {
    keyDerivation: DerivationConfig;
    cipherConfig: CipherConfig;
    cipheredContent: CipheredContent;
}
