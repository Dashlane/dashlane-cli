import { authenticator, hotp } from 'otplib';

enum HashAlgorithms {
    'SHA1' = 'sha1',
    'SHA256' = 'sha256',
    'SHA512' = 'sha512',
}

interface Otpauth {
    protocol: string;
    type: string;
    issuer: string;
    secret: string;
    algorithm: HashAlgorithms;
    digits: number;
    period: number;
    counter: number;
}

const matchAlgorithm = (algorithm: string): HashAlgorithms => {
    switch (algorithm) {
        case 'SHA1':
            return HashAlgorithms.SHA1;
        case 'SHA256':
            return HashAlgorithms.SHA256;
        case 'SHA512':
            return HashAlgorithms.SHA512;
        default:
            throw new Error('Invalid algorithm');
    }
};

const parseOtpauth = (uri: string): Otpauth => {
    const url = new URL(uri);
    const searchParams = url.searchParams;

    return {
        protocol: url.protocol.slice(0, -1),
        type: url.hostname,
        issuer: searchParams.get('issuer') ?? '',
        secret: searchParams.get('secret') ?? '',
        algorithm: matchAlgorithm(searchParams.get('algorithm') ?? 'SHA1'),
        digits: Number(searchParams.get('digits') ?? 0),
        period: Number(searchParams.get('period') ?? 0),
        counter: Number(searchParams.get('counter') ?? 0),
    };
};

export interface GenerateOtpOutput {
    token: string;
    remainingTime: number | null;
}

export const generateOtpFromUri = (uri: string): GenerateOtpOutput => {
    const otpauth = parseOtpauth(uri);

    authenticator.resetOptions();
    hotp.resetOptions();

    switch (otpauth.type) {
        case 'totp':
            authenticator.options = {
                algorithm: otpauth.algorithm,
                digits: otpauth.digits,
                period: otpauth.period,
            };
            return { token: authenticator.generate(otpauth.secret), remainingTime: authenticator.timeRemaining() };
        case 'hotp':
            hotp.options = { algorithm: otpauth.algorithm, digits: otpauth.digits };
            return { token: hotp.generate(otpauth.secret, otpauth.counter), remainingTime: null };
        default:
            throw new Error('Invalid OTP type');
    }
};

export const generateOtpFromSecret = (secret: string): GenerateOtpOutput => {
    authenticator.resetOptions();
    return { token: authenticator.generate(secret), remainingTime: authenticator.timeRemaining() };
};
