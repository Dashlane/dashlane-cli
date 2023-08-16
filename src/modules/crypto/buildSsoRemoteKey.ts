import { decryptAesCbcHmac256 } from './decrypt';
import { deserializeEncryptedData } from './encryptedDataDeserialization';
import { RemoteKey } from './types';
import { xor } from './xor';

interface BuildSsoRemoteKey {
    ssoServerKey: string | undefined;
    ssoSpKey: string | undefined | null;
    remoteKeys: RemoteKey[] | undefined;
}

export const decryptSsoRemoteKey = (params: BuildSsoRemoteKey) => {
    const { ssoServerKey, ssoSpKey, remoteKeys } = params;

    if (!ssoServerKey) {
        throw new Error('SSO server key is missing');
    }
    if (!ssoSpKey) {
        throw new Error('SSO Service Provider key is missing');
    }
    if (!remoteKeys || remoteKeys.length === 0) {
        throw new Error('Remote keys are missing');
    }

    const remoteKey = remoteKeys.filter((key) => key.type === 'sso')[0];

    if (!remoteKey) {
        throw new Error('Remote SSO key is missing');
    }

    const ssoKeysXored = xor(Buffer.from(ssoServerKey, 'base64'), Buffer.from(ssoSpKey, 'base64'));

    const remoteKeyBase64 = Buffer.from(remoteKey.key, 'base64');
    const decodedBase64 = remoteKeyBase64.toString('ascii');
    const { encryptedData } = deserializeEncryptedData(decodedBase64, remoteKeyBase64);

    const decryptedRemoteKey = decryptAesCbcHmac256({
        cipherData: encryptedData.cipherData,
        originalKey: ssoKeysXored,
        inflatedKey: true,
    });

    return decryptedRemoteKey.toString('base64');
};
