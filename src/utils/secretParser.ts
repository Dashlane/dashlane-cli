import {
    AuthentifiantTransactionContent,
    SecretTransactionContent,
    SecureNoteTransactionContent,
    VaultCredential,
    VaultNote,
    VaultSecret,
} from '../types';

/**
 * Transform entries [{_attributes: {key:xx}, _cdata: ww}] into an easier-to-use object
 * @param content
 * @returns beautified content
 */
export const beautifyContent = (content: {
    credentials: AuthentifiantTransactionContent[];
    notes: SecureNoteTransactionContent[];
    secrets: SecretTransactionContent[];
}): { credentials: VaultCredential[]; notes: VaultNote[]; secrets: VaultSecret[] } => {
    const credentials = content.credentials.map((credential) => {
        const credentialObject = Object.fromEntries(
            credential.root.KWAuthentifiant.KWDataItem.map((entry) => [
                entry._attributes.key[0].toLowerCase() + entry._attributes.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                entry._cdata,
            ])
        ) as unknown as VaultCredential;

        return credentialObject;
    });

    const notes = content.notes.map((note) => {
        const noteObject = Object.fromEntries(
            note.root.KWSecureNote.KWDataItem.map((entry) => [
                entry._attributes.key[0].toLowerCase() + entry._attributes.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                entry._cdata,
            ])
        ) as unknown as VaultNote;

        return noteObject;
    });

    const secrets = content.secrets.map((secret) => {
        const secretObject = Object.fromEntries(
            secret.root.KWSecret.KWDataItem.map((entry) => [
                entry._attributes.key[0].toLowerCase() + entry._attributes.key.slice(1),
                entry._cdata,
            ])
        ) as unknown as VaultSecret;

        return secretObject;
    });

    return { credentials, notes, secrets };
};
