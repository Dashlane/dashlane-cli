import { JSONPath } from 'jsonpath-plus';
import { authenticator } from 'otplib';

export const transformOtp = (secret: string) => {
    return authenticator.generate(secret);
};

export const transformOtpAndExpiry = (secret: string) => {
    const otp = authenticator.generate(secret);
    const expiry = authenticator.timeRemaining();
    return `${otp} ${expiry}`;
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
