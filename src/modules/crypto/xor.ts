/** XOR two keys together, expects buffers to be of the same length */
export const xor = (leftKey: Buffer, rightKey: Buffer): Buffer => {
    if (leftKey.length !== rightKey.length) {
        throw new Error('Keys must be of the same length');
    }
    const res = [];
    for (let i = 0; i < 64; i++) {
        res.push(leftKey[i] ^ rightKey[i]);
    }
    return Buffer.from(res);
};
