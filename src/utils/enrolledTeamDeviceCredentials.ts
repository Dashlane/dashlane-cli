import {
    CouldNotFindEnrolledTeamDeviceCredentialsError,
    EnrolledTeamDeviceCredentialsWrongFormatError,
} from '../errors.js';
import { EnrolledTeamDeviceCredentials } from '../types.js';

let enrolledTeamDeviceCredentials: EnrolledTeamDeviceCredentials | null = null;

const validateEncryptedEnrolledDeviceKeys = (keys: string) =>
    new RegExp(/^(DASH_EDWSS_[a-zA-Z0-9_-]{64})-(DASH_EDNTA_[a-zA-Z0-9_-]{64})-(DASH_EDNTS_[a-zA-Z0-9_-]{64})$/).exec(
        keys
    );

export const initEnrolledTeamDeviceCredentials = (): EnrolledTeamDeviceCredentials | null => {
    const { DASHLANE_ENROLLED_TEAM_DEVICE_KEYS } = process.env;

    if (DASHLANE_ENROLLED_TEAM_DEVICE_KEYS) {
        try {
            const [nodeWSAccessKey, encryptedData] = DASHLANE_ENROLLED_TEAM_DEVICE_KEYS.split('-');
            // Validate the access key
            if (nodeWSAccessKey.match(/^DASH_EDWSS_[a-zA-Z0-9_-]{64}$/)) {
                throw new Error();
            }
            // Parsing the base64 string
            const parsedString = Buffer.from(encryptedData, 'base64').toString('utf-8');
            // Validating the keys
            const parsedKeys = validateEncryptedEnrolledDeviceKeys(parsedString);

            if (!parsedKeys) {
                throw new EnrolledTeamDeviceCredentialsWrongFormatError();
            }

            const [secretKey, nitroDeviceAccessKey, nitroDeviceSecretKey] = parsedKeys.slice(1);
            enrolledTeamDeviceCredentials = {
                nodeWSAccessKey,
                secretKey,
                nitroDeviceAccessKey,
                nitroDeviceSecretKey,
            };
        } catch {
            throw new EnrolledTeamDeviceCredentialsWrongFormatError();
        }
    }

    return enrolledTeamDeviceCredentials;
};

export const getEnrolledTeamDeviceCredentials = (): EnrolledTeamDeviceCredentials => {
    if (!enrolledTeamDeviceCredentials) {
        throw new CouldNotFindEnrolledTeamDeviceCredentialsError();
    }

    return enrolledTeamDeviceCredentials;
};
