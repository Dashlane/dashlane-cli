import { AuthentifiantTransactionContent, SecureNoteTransactionContent, VaultCredential, VaultNote } from '../types';

/**
 * Transform entries [{_attributes: {key:xx}, _cdata: ww}] into an easier-to-use object
 * @param secrets
 * @returns beautified secrets
 */
export const beautifySecrets = (secrets: {
    credentials: AuthentifiantTransactionContent[];
    notes: SecureNoteTransactionContent[];
}): { credentials: VaultCredential[]; notes: VaultNote[] } => {
    const credentials = secrets.credentials.map((credential) => {
        const credentialObject = Object.fromEntries(
            credential.root.KWAuthentifiant.KWDataItem.map((entry) => [
                entry._attributes.key[0].toLowerCase() + entry._attributes.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                entry._cdata,
            ])
        ) as unknown as VaultCredential;

        return credentialObject;
    });

    const notes = secrets.notes.map((note) => {
        const noteObject = Object.fromEntries(
            note.root.KWSecureNote.KWDataItem.map((entry) => [
                entry._attributes.key[0].toLowerCase() + entry._attributes.key.slice(1), // lowercase the first letter: OtpSecret => otpSecret
                entry._cdata,
            ])
        ) as unknown as VaultNote;

        return noteObject;
    });

    return { credentials, notes };
};
