import * as crypto from 'crypto';
import winston from 'winston';
import { hmacSha256, sha512 } from './hash.js';
import { BackupEditTransaction } from '../types';
import zlib from 'zlib';
import * as xml2json from 'xml2json';
import * as argon2 from 'argon2';

export interface Argon2d {
    algo: string;
    saltLength: number;
    tCost: number;
    mCost: number;
    parallelism: number;
}

interface CipherConfig {
    encryption: string;
    cipherMode: string;
    ivLength: number;
}

interface CypheredContent {
    salt: Buffer;
    iv: Buffer;
    hmac: Buffer;
    encryptedData: Buffer;
}

export interface CipheringMethod {
    method: 'Argon2d' | 'PBKDF2 10204' | 'PBKDF2 200000' | 'No Derivation';
    version: string;
    cypherConfig: CipherConfig;
    keyDerivation: Argon2d;
    cypheredContent: CypheredContent;
}

export const argonDecrypt = (dataBuffer: Buffer, originalKey: Buffer, iv: Buffer, signature: Buffer): Buffer => {
    const combinedKey = sha512(originalKey);
    const cipheringKey = combinedKey.slice(0, 32);
    const macKey = combinedKey.slice(32);

    const testSignature = hmacSha256(macKey, Buffer.concat([iv, dataBuffer]));
    if (testSignature.toString('base64') !== signature.toString('base64')) {
        throw new Error('mismatching signatures');
    }
    const decipher = crypto.createDecipheriv('aes-256-cbc', cipheringKey, iv);
    return Buffer.concat([decipher.update(dataBuffer), decipher.final()]);
};

export const getCipheringMethod = (cipheredData: string): CipheringMethod => {
    if (!cipheredData || cipheredData.length === 0) {
        winston.debug(cipheredData);
        throw new Error('invalid ciphered data');
    }
    const newMarkerDelimiter = '$';
    const buffer = Buffer.from(cipheredData, 'base64');
    const decodedBase64 = buffer.toString('ascii');

    if (decodedBase64[0] === newMarkerDelimiter) {
        const payloadHeader = decodedBase64.split(newMarkerDelimiter, 3);
        if (payloadHeader.length === 3) {
            const marker = payloadHeader[2] ? payloadHeader[2].toLowerCase() : null;
            if (marker !== 'argon2d') {
                throw new Error('unknown algo in marker');
            }
            return parseArgon2d(decodedBase64, buffer);
        }
    }
    throw new Error('unknown ciphering method');
};

const parseArgon2d = (decodedBase64: string, buffer: Buffer): CipheringMethod => {
    const payloadArray = decodedBase64.split('$', 10);
    if (payloadArray.length !== 10) {
        throw new Error('invalid payload for Argon2d');
    }

    const [, version, algo, saltLength, tCost, mCost, parallelism, encryption, cipherMode, ivLength] = payloadArray;
    const cypherConfig: CipherConfig = {
        encryption,
        cipherMode,
        ivLength: parseInt(ivLength, 10),
    };

    const keyDerivation: Argon2d = {
        algo,
        saltLength: parseInt(saltLength, 10),
        tCost: parseInt(tCost, 10),
        mCost: parseInt(mCost, 10),
        parallelism: parseInt(parallelism, 10),
    };

    let pos = payloadArray.join('$').length + 1;

    const salt = buffer.slice(pos, pos + keyDerivation.saltLength);
    pos = pos + keyDerivation.saltLength;
    const iv = buffer.slice(pos, pos + cypherConfig.ivLength);
    pos = pos + cypherConfig.ivLength;
    const hmac = buffer.slice(pos, pos + 32);
    pos = pos + 32;
    const encryptedData = buffer.slice(pos);

    const cypheredContent = {
        salt,
        iv,
        hmac,
        encryptedData,
    };

    return {
        method: 'Argon2d',
        version,
        cypherConfig,
        keyDerivation,
        cypheredContent,
    };
};

export const decryptTransaction = (transaction: BackupEditTransaction, derivate: Buffer): any => {
    let cypheredContent;

    try {
        cypheredContent = getCipheringMethod(transaction.content).cypheredContent;
    } catch (error) {
        if (error instanceof Error) {
            console.error(transaction.type, error.message);
        } else {
            console.error(transaction.type, error);
        }
        return null;
    }
    const { encryptedData: encD, hmac: sign, iv } = cypheredContent;

    try {
        const content = argonDecrypt(encD, derivate, iv, sign);
        const xmlContent = zlib.inflateRawSync(content.slice(6)).toString();
        return JSON.parse(xml2json.toJson(xmlContent));
    } catch (error: any) {
        if (error instanceof Error) {
            console.error(transaction.type, error.message);
        } else {
            console.error(transaction.type, error);
        }
        return null;
    }
};

export const getDerivate = async (
    masterPassword: string,
    settingsTransaction: BackupEditTransaction
): Promise<Buffer> => {
    const { keyDerivation, cypheredContent } = getCipheringMethod(settingsTransaction.content);

    const { salt } = cypheredContent;

    return argon2.hash(masterPassword, {
        type: argon2.argon2d,
        saltLength: keyDerivation.saltLength,
        timeCost: keyDerivation.tCost,
        memoryCost: keyDerivation.mCost,
        parallelism: keyDerivation.parallelism,
        salt,
        version: 19,
        hashLength: 32,
        raw: true,
    });
};
