import { authenticator } from 'otplib';

export const transformOtp = (secret: string) => {
    return authenticator.generate(secret);
};
