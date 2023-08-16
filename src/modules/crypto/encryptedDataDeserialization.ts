import {
    Argon2DerivationConfig,
    DerivationConfig,
    EncryptedData,
    Pbkdf2DerivationConfig,
    SymmetricCipherConfig,
} from './types';

const extractNextEncryptedDataStringComponent = (
    encryptedDataString: string
): {
    component: string;
    cursorAfter: number;
} => {
    const cursorBefore = encryptedDataString.indexOf('$');
    return {
        component: encryptedDataString.substring(0, cursorBefore),
        cursorAfter: cursorBefore + 1,
    };
};

const deserializeArgon2DerivationConfig = (
    encryptedDataString: string
): {
    derivationConfig: Argon2DerivationConfig;
    cursorAfter: number;
} => {
    const saltLength = extractNextEncryptedDataStringComponent(encryptedDataString);
    let cursor = saltLength.cursorAfter;

    const tCost = extractNextEncryptedDataStringComponent(encryptedDataString.substring(cursor));
    cursor += tCost.cursorAfter;

    const mCost = extractNextEncryptedDataStringComponent(encryptedDataString.substring(cursor));
    cursor += mCost.cursorAfter;

    const parallelism = extractNextEncryptedDataStringComponent(encryptedDataString.substring(cursor));
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

const deserializePbkdf2DerivationConfig = (
    encryptedDataString: string
): {
    derivationConfig: Pbkdf2DerivationConfig;
    cursorAfter: number;
} => {
    const saltLength = extractNextEncryptedDataStringComponent(encryptedDataString);
    let cursor = saltLength.cursorAfter;

    const iterations = extractNextEncryptedDataStringComponent(encryptedDataString.substring(cursor));
    cursor += iterations.cursorAfter;

    const hashMethod = extractNextEncryptedDataStringComponent(encryptedDataString.substring(cursor));
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

const deserializeDerivationConfig = (
    encryptedDataString: string
): {
    derivationConfig: DerivationConfig;
    cursorAfter: number;
} => {
    const algoComponent = extractNextEncryptedDataStringComponent(encryptedDataString);

    switch (algoComponent.component) {
        case 'argon2d': {
            const argonConfig = deserializeArgon2DerivationConfig(
                encryptedDataString.substring(algoComponent.cursorAfter)
            );
            return {
                derivationConfig: argonConfig.derivationConfig,
                cursorAfter: algoComponent.cursorAfter + argonConfig.cursorAfter,
            };
        }
        case 'noderivation':
            return {
                derivationConfig: {
                    algo: 'noderivation',
                },
                cursorAfter: algoComponent.cursorAfter,
            };
        case 'pbkdf2': {
            const pbkdfConfig = deserializePbkdf2DerivationConfig(
                encryptedDataString.substring(algoComponent.cursorAfter)
            );
            return {
                derivationConfig: pbkdfConfig.derivationConfig,
                cursorAfter: algoComponent.cursorAfter + pbkdfConfig.cursorAfter,
            };
        }
        default:
            throw new Error(`Unrecognized derivation algorithm: ${algoComponent.component}`);
    }
};

const deserializeSymmetricCipherConfig = (
    encryptedDataString: string
): {
    cipherConfig: SymmetricCipherConfig;
    cursorAfter: number;
} => {
    const encryption = extractNextEncryptedDataStringComponent(encryptedDataString);
    let cursor = encryption.cursorAfter;
    if (encryption.component !== 'aes256') {
        throw new Error(`Unrecognized cipher algorithm: ${encryption.component}`);
    }

    const mode = extractNextEncryptedDataStringComponent(encryptedDataString.substring(cursor));
    cursor += mode.cursorAfter;
    if (mode.component !== 'cbchmac' && mode.component !== 'cbchmac64') {
        throw new Error(`Unrecognized cipher mode: ${mode.component}`);
    }

    const ivLength = extractNextEncryptedDataStringComponent(encryptedDataString.substring(cursor));
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

export const deserializeEncryptedData = (
    encryptedDataStr: string,
    encryptedData: Buffer
): {
    encryptedData: EncryptedData;
    derivationMethodBytes: string;
} => {
    let cursor = 0;

    const initialComponent = extractNextEncryptedDataStringComponent(encryptedDataStr);
    if (initialComponent.component !== '') {
        throw new Error('invalid payload: no initial marker');
    }
    cursor += initialComponent.cursorAfter;

    const versionComponent = extractNextEncryptedDataStringComponent(encryptedDataStr.substring(cursor));
    const version = Number(versionComponent.component);
    if (version !== 1) {
        throw new Error(`invalid payload: version should be 1 but is ${version}`);
    }
    cursor += versionComponent.cursorAfter;

    const derivationConfig = deserializeDerivationConfig(encryptedDataStr.substring(cursor));
    cursor += derivationConfig.cursorAfter;

    const cipherConfig = deserializeSymmetricCipherConfig(encryptedDataStr.substring(cursor));
    cursor += cipherConfig.cursorAfter;

    const saltLength =
        derivationConfig.derivationConfig.algo === 'noderivation' ? 0 : derivationConfig.derivationConfig.saltLength;
    const ivLength = cipherConfig.cipherConfig.ivLength;
    const hashLength = 32;

    const remainingBytes = encryptedData.slice(Buffer.from(encryptedDataStr.substring(0, cursor), 'ascii').length);

    const salt = remainingBytes.slice(0, saltLength);
    let readBytes = saltLength;

    const derivationMethodBytes = encryptedData
        .slice(0, encryptedData.byteLength - remainingBytes.byteLength + saltLength)
        .toString('ascii');

    const iv = remainingBytes.slice(readBytes, readBytes + ivLength);
    readBytes += ivLength;

    const hash = remainingBytes.slice(readBytes, readBytes + hashLength);
    readBytes += hashLength;

    const encryptedPayload = remainingBytes.slice(readBytes);

    return {
        encryptedData: {
            keyDerivation: derivationConfig.derivationConfig,
            cipherConfig: cipherConfig.cipherConfig,
            cipherData: {
                salt,
                iv,
                hash,
                encryptedPayload,
            },
        },
        derivationMethodBytes,
    };
};
