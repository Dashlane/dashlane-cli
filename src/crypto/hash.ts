import * as crypto from 'crypto';

const toBuffer = (data: Buffer | string): Buffer => {
    return Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
};

export const hmacSha256 = (key: Buffer | string, data: Buffer | string): Buffer => {
    return crypto.createHmac('sha256', key).update(toBuffer(data)).digest();
};

export const sha512 = (data: Buffer | string): Buffer => {
    return crypto.createHash('sha512').update(toBuffer(data)).digest();
};
