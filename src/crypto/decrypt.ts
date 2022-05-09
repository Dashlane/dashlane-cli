import * as crypto from 'crypto';
import zlib from 'zlib';
import * as xml2json from 'xml2json';
import * as argon2 from 'argon2';
import { promisify } from 'util';
import {
    Argon2Derivation,
    CipherConfig,
    CipheredContent,
    CipheringMethod,
    DerivationConfig,
    Pbkdf2Derivation,
} from './types.js';
import { hmacSha256, sha512 } from './hash.js';
import { BackupEditTransaction } from '../types';

const decryptCipheredContext = (payload: CipheredContent, originalKey: Buffer): Buffer => {
    const combinedKey = sha512(originalKey);
    const cipheringKey = combinedKey.slice(0, 32);
    const macKey = combinedKey.slice(32);

    const { iv, hash, encryptedData } = payload;

    const testSignature = hmacSha256(macKey, Buffer.concat([iv, encryptedData]));
    if (testSignature.toString('base64') !== hash.toString('base64')) {
        throw new Error('mismatching signatures');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', cipheringKey, iv);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};

const extractNextPayloadComponent = (
    payload: string
): {
    component: string;
    cursorAfter: number;
} => {
    const cursorBefore = payload.indexOf('$');
    return {
        component: payload.substring(0, cursorBefore),
        cursorAfter: cursorBefore + 1,
    };
};

const getArgon2DerivationConfig = (
    decodedBase64: string
): {
    derivationConfig: Argon2Derivation;
    cursorAfter: number;
} => {
    const saltLength = extractNextPayloadComponent(decodedBase64);
    let cursor = saltLength.cursorAfter;

    const tCost = extractNextPayloadComponent(decodedBase64.substring(cursor));
    cursor += tCost.cursorAfter;

    const mCost = extractNextPayloadComponent(decodedBase64.substring(cursor));
    cursor += mCost.cursorAfter;

    const parallelism = extractNextPayloadComponent(decodedBase64.substring(cursor));
    cursor += parallelism.cursorAfter;

    return {
        derivationConfig: {
            algo: 'argon2d',
            saltLength: Number(saltLength.component),
            tCost: Number(tCost.component),
            mCost: Number(mCost.component),
            parallelism: Number(parallelism.component),
        },
        cursorAfter: cursor,
    };
};

const getPbkdf2DerivationConfig = (
    decodedBase64: string
): {
    derivationConfig: Pbkdf2Derivation;
    cursorAfter: number;
} => {
    const saltLength = extractNextPayloadComponent(decodedBase64);
    let cursor = saltLength.cursorAfter;

    const iterations = extractNextPayloadComponent(decodedBase64.substring(cursor));
    cursor += iterations.cursorAfter;

    const hashMethod = extractNextPayloadComponent(decodedBase64.substring(cursor));
    cursor += hashMethod.cursorAfter;

    return {
        derivationConfig: {
            algo: 'pbkdf2',
            saltLength: Number(saltLength.component),
            iterations: Number(iterations.component),
            hashMethod: hashMethod.component,
        },
        cursorAfter: cursor,
    };
};

const getDerivationConfig = (
    decodedBase64: string
): {
    derivationConfig: DerivationConfig;
    cursorAfter: number;
} => {
    const algoComponent = extractNextPayloadComponent(decodedBase64);

    if (algoComponent.component === 'argon2d') {
        const argonConfig = getArgon2DerivationConfig(decodedBase64.substring(algoComponent.cursorAfter));
        return {
            derivationConfig: argonConfig.derivationConfig,
            cursorAfter: algoComponent.cursorAfter + argonConfig.cursorAfter,
        };
    } else if (algoComponent.component === 'pbkdf2') {
        const pbkdfConfig = getPbkdf2DerivationConfig(decodedBase64.substring(algoComponent.cursorAfter));
        return {
            derivationConfig: pbkdfConfig.derivationConfig,
            cursorAfter: algoComponent.cursorAfter + pbkdfConfig.cursorAfter,
        };
    } else if (algoComponent.component === 'noderivation') {
        return {
            derivationConfig: {
                algo: 'noderivation',
            },
            cursorAfter: algoComponent.cursorAfter,
        };
    } else {
        throw new Error(`Unrecognized derivation algorithm: ${algoComponent.component}`);
    }
};

const getCipherConfig = (
    decodedBase64: string
): {
    cipherConfig: CipherConfig;
    cursorAfter: number;
} => {
    const encryption = extractNextPayloadComponent(decodedBase64);
    let cursor = encryption.cursorAfter;
    if (encryption.component !== 'aes256') {
        throw new Error(`Unrecognized cipher algorithm: ${encryption.component}`);
    }

    const mode = extractNextPayloadComponent(decodedBase64.substring(cursor));
    cursor += mode.cursorAfter;
    if (mode.component !== 'cbchmac') {
        throw new Error(`Unrecognized cipher mode: ${mode.component}`);
    }

    const ivLength = extractNextPayloadComponent(decodedBase64.substring(cursor));
    cursor += ivLength.cursorAfter;

    return {
        cipherConfig: {
            encryption: encryption.component,
            cipherMode: mode.component,
            ivLength: Number(ivLength.component),
        },
        cursorAfter: cursor,
    };
};

export const parsePayload = (decodedBase64: string, buffer: Buffer): CipheringMethod => {
    let cursor = 0;

    const initialComponent = extractNextPayloadComponent(decodedBase64);
    if (initialComponent.component !== '') {
        throw new Error('invalid payload: no initial marker');
    }
    cursor += initialComponent.cursorAfter;

    const versionComponent = extractNextPayloadComponent(decodedBase64.substring(cursor));
    const version = Number(versionComponent.component);
    if (version !== 1) {
        throw new Error(`invalid payload: version should be 1 but is ${version}`);
    }
    cursor += versionComponent.cursorAfter;

    const derivationConfig = getDerivationConfig(decodedBase64.substring(cursor));
    cursor += derivationConfig.cursorAfter;

    const cipherConfig = getCipherConfig(decodedBase64.substring(cursor));
    cursor += cipherConfig.cursorAfter;

    const saltLength =
        derivationConfig.derivationConfig.algo === 'noderivation' ? 0 : derivationConfig.derivationConfig.saltLength;
    const ivLength = cipherConfig.cipherConfig.ivLength;
    const hashLength = 32;

    const remainingBytes = buffer.slice(Buffer.from(decodedBase64.substring(0, cursor), 'ascii').length);

    const salt = remainingBytes.slice(0, saltLength);
    let readBytes = saltLength;

    const iv = remainingBytes.slice(readBytes, readBytes + ivLength);
    readBytes += ivLength;

    const hash = remainingBytes.slice(readBytes, readBytes + hashLength);
    readBytes += hashLength;

    const encryptedData = remainingBytes.slice(readBytes);

    return {
        keyDerivation: derivationConfig.derivationConfig,
        cipherConfig: cipherConfig.cipherConfig,
        cipheredContent: {
            salt,
            iv,
            hash,
            encryptedData,
        },
    };
};

export const decrypt = (encrypted: string, symmetricKey: Buffer): Buffer => {
    const buffer = Buffer.from(encrypted, 'base64');
    const decodedBase64 = buffer.toString('ascii');
    const payload = parsePayload(decodedBase64, buffer);

    return decryptCipheredContext(payload.cipheredContent, symmetricKey);
};

export const decryptTransaction = (encryptedTransaction: BackupEditTransaction, derivate: Buffer): any => {
    try {
        const xmlContent = zlib.inflateRawSync(decrypt(encryptedTransaction.content, derivate).slice(6)).toString();
        return JSON.parse(xml2json.toJson(xmlContent));
    } catch (error) {
        if (error instanceof Error) {
            console.error(encryptedTransaction.type, error.message);
        } else {
            console.error(encryptedTransaction.type, error);
        }
        return null;
    }
};

const pbkdf2Async = promisify(crypto.pbkdf2);

export const getDerivateWithCipheringMethod = async (
    masterPassword: string,
    cipheringMethod: CipheringMethod
): Promise<Buffer> => {
    switch (cipheringMethod.keyDerivation.algo) {
        case 'argon2d':
            return argon2.hash(masterPassword, {
                type: argon2.argon2d,
                saltLength: cipheringMethod.keyDerivation.saltLength,
                timeCost: cipheringMethod.keyDerivation.tCost,
                memoryCost: cipheringMethod.keyDerivation.mCost,
                parallelism: cipheringMethod.keyDerivation.parallelism,
                salt: cipheringMethod.cipheredContent.salt,
                version: 19,
                hashLength: 32,
                raw: true,
            });
        case 'pbkdf2':
            return pbkdf2Async(
                masterPassword,
                cipheringMethod.cipheredContent.salt,
                cipheringMethod.keyDerivation.iterations,
                32,
                cipheringMethod.keyDerivation.hashMethod
            );
        case 'noderivation':
            throw new Error('Impossible to compute derivate when no derivation method is provided');
    }
};

export const getDerivateWithTransaction = async (
    masterPassword: string,
    settingsTransaction: BackupEditTransaction
): Promise<Buffer> => {
    const buffer = Buffer.from(settingsTransaction.content, 'base64');
    const decodedBase64 = buffer.toString('ascii');

    const payload = parsePayload(decodedBase64, buffer);

    return getDerivateWithCipheringMethod(masterPassword, payload);
};
