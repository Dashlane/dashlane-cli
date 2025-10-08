import {
    CouldNotFindEnrolledTeamDeviceCredentialsError,
    EnrolledTeamDeviceCredentialsWrongFormatError,
} from '../errors.js';
import { EnrolledTeamDeviceCredentials } from '../types.js';

let enrolledTeamDeviceCredentials: EnrolledTeamDeviceCredentials | null = null;

const validateEnrolledDeviceKeys = (keys: string) =>
    new RegExp(
        /(DASH_EDWSA_[a-zA-Z0-9_-]{64})-(DASH_EDWSS_[a-zA-Z0-9_-]{64})-(DASH_EDNTA_[a-zA-Z0-9_-]{64})-(DASH_EDNTS_[a-zA-Z0-9_-]{64})/
    ).exec(keys);

export const initEnrolledTeamDeviceCredentials = (): EnrolledTeamDeviceCredentials | null => {
    const { DASHLANE_ENROLLED_TEAM_DEVICE_KEYS } = process.env;

    if (DASHLANE_ENROLLED_TEAM_DEVICE_KEYS) {
        // Parsing the base64 string
        const parsedString = Buffer.from(DASHLANE_ENROLLED_TEAM_DEVICE_KEYS, 'base64').toString('utf-8');
        // Validating the keys
        const parsedKeys = validateEnrolledDeviceKeys(parsedString);

        if (!parsedKeys) {
            throw new EnrolledTeamDeviceCredentialsWrongFormatError();
        }

        const [nodeWSAccessKey, secretKey, nitroDeviceAccessKey, nitroDeviceSecretKey] = parsedKeys.slice(1);
        enrolledTeamDeviceCredentials = {
            nodeWSAccessKey,
            secretKey,
            nitroDeviceAccessKey,
            nitroDeviceSecretKey,
        };
    }

    return enrolledTeamDeviceCredentials;
};

export const getEnrolledTeamDeviceCredentials = (): EnrolledTeamDeviceCredentials => {
    if (!enrolledTeamDeviceCredentials) {
        throw new CouldNotFindEnrolledTeamDeviceCredentialsError();
    }

    return enrolledTeamDeviceCredentials;
};
