import { JSONPath } from 'jsonpath-plus';
import { generateOtpFromSecret, generateOtpFromUri } from '../modules/crypto';

export const transformOtp = (secret: string) => {
    return generateOtpFromSecret(secret).token;
};

export const transformOtpAndExpiry = (secret: string) => {
    const { token, remainingTime } = generateOtpFromSecret(secret);
    return `${token} ${remainingTime}`;
};

export const transformOtpUri = (uri: string) => {
    return generateOtpFromUri(uri).token;
};

export const transformOtpUriAndExpiry = (uri: string) => {
    const { token, remainingTime } = generateOtpFromUri(uri);
    return `${token} ${remainingTime}`;
};

export const transformJsonPath = (json: string, path: string) => {
    const result = JSONPath<unknown>({ path, json: JSON.parse(json) as object, wrap: false });
    if (result === undefined) {
        throw new Error(`No matching json path found for "${path}"`);
    }

    if (typeof result === 'string') {
        return result;
    }
    return JSON.stringify(result);
};
