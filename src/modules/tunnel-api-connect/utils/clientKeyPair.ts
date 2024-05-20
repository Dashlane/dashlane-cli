import sodium from 'libsodium-wrappers';

export const makeClientKeyPair = () => {
    return sodium.crypto_kx_keypair();
};
