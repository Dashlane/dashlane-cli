import * as crypto from 'crypto';
import zlib from 'zlib';
import * as xmlJs from 'xml-js';
import * as argon2 from 'argon2';
import { promisify } from 'util';
import winston from 'winston';

import { CipherData, EncryptedData } from './types';
import { hmacSha256, sha512 } from './hash';
import { BackupEditTransaction } from '../types';
import { deserializeEncryptedData } from './encryptedDataDeserialization';

const decryptCipherData = (cipherData: CipherData, originalKey: Buffer): Buffer => {
    const combinedKey = sha512(originalKey);
    const cipheringKey = combinedKey.slice(0, 32);
    const macKey = combinedKey.slice(32);

    const { iv, hash, encryptedPayload } = cipherData;

    const testSignature = hmacSha256(macKey, Buffer.concat([iv, encryptedPayload]));
    if (testSignature.toString('base64') !== hash.toString('base64')) {
        throw new Error('mismatching signatures');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', cipheringKey, iv);
    return Buffer.concat([decipher.update(encryptedPayload), decipher.final()]);
};

export const decrypt = (encryptedAsBase64: string, symmetricKey: Buffer): Buffer => {
    const buffer = Buffer.from(encryptedAsBase64, 'base64');
    const decodedBase64 = buffer.toString('ascii');
    const encryptedData = deserializeEncryptedData(decodedBase64, buffer);

    return decryptCipherData(encryptedData.cipherData, symmetricKey);
};

export const decryptTransaction = (encryptedTransaction: BackupEditTransaction, derivate: Buffer): any => {
    try {
        const xmlContent = zlib.inflateRawSync(decrypt(encryptedTransaction.content, derivate).slice(6)).toString();
        return JSON.parse(xmlJs.xml2json(xmlContent, { compact: true }));
    } catch (error) {
        if (error instanceof Error) {
            winston.error(encryptedTransaction.type, error.message);
        } else {
            winston.error(encryptedTransaction.type, error);
        }
        return null;
    }
};

const pbkdf2Async = promisify(crypto.pbkdf2);

export const getDerivateUsingParametersFromEncryptedData = async (
    masterPassword: string,
    cipheringMethod: EncryptedData
): Promise<Buffer> => {
    switch (cipheringMethod.keyDerivation.algo) {
        case 'argon2d':
            return argon2.hash(masterPassword, {
                type: argon2.argon2d,
                saltLength: cipheringMethod.keyDerivation.saltLength,
                timeCost: cipheringMethod.keyDerivation.tCost,
                memoryCost: cipheringMethod.keyDerivation.mCost,
                parallelism: cipheringMethod.keyDerivation.parallelism,
                salt: cipheringMethod.cipherData.salt,
                version: 19,
                hashLength: 32,
                raw: true,
            });
        case 'pbkdf2':
            return pbkdf2Async(
                masterPassword,
                cipheringMethod.cipherData.salt,
                cipheringMethod.keyDerivation.iterations,
                32,
                cipheringMethod.keyDerivation.hashMethod
            );
        default:
            throw new Error(
                `Impossible to compute derivate with derivation method '${cipheringMethod.keyDerivation.algo}'`
            );
    }
};

export const getDerivateUsingParametersFromTransaction = async (
    masterPassword: string,
    settingsTransaction: BackupEditTransaction
): Promise<Buffer> => {
    const buffer = Buffer.from(settingsTransaction.content, 'base64');
    const decodedBase64 = buffer.toString('ascii');

    const encryptedData = deserializeEncryptedData(decodedBase64, buffer);

    return getDerivateUsingParametersFromEncryptedData(masterPassword, encryptedData);
};
