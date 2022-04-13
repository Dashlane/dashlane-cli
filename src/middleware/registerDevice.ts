import inquirer from 'inquirer';
import Database from 'better-sqlite3';
import winston from 'winston';
import {
    completeDeviceRegistration,
    performDuoPushVerification,
    performEmailTokenVerification,
    performTotpVerification,
    requestDeviceRegistration,
} from '../steps/index.js';
import { performDashlaneAuthenticatorVerification } from '../steps/performDashlaneAuthenticatorVerification.js';
import type { DeviceKeysWithLogin } from '../types.js';

interface RegisterDevice {
    db: Database.Database;
}

export const registerDevice = async (params: RegisterDevice): Promise<DeviceKeysWithLogin> => {
    const { db } = params;
    winston.debug('Registering the device...');

    const { login } = await inquirer.prompt<{ login: string }>([
        {
            type: 'input',
            name: 'login',
            message: 'Please enter your email address:',
        },
    ]);

    // Log in via a compatible verification method
    const { verification } = await requestDeviceRegistration({ login });

    let authTicket;
    if (verification.find((method) => method.type === 'duo_push')) {
        authTicket = (await performDuoPushVerification({ login })).authTicket;
    } else if (verification.find((method) => method.type === 'dashlane_authenticator')) {
        authTicket = (await performDashlaneAuthenticatorVerification({ login })).authTicket;
    } else if (verification.find((method) => method.type === 'totp')) {
        const { otp } = await inquirer.prompt<{ otp: number }>([
            {
                type: 'number',
                name: 'otp',
                message: 'Please enter your OTP code',
            },
        ]);
        authTicket = (
            await performTotpVerification({
                login,
                otp: String(otp).padStart(5, '0'),
            })
        ).authTicket;
    } else if (verification.find((method) => method.type === 'email_token')) {
        const { token } = await inquirer.prompt<{ token: number }>([
            {
                type: 'number',
                name: 'token',
                message: 'Please enter the code you received by email',
            },
        ]);
        authTicket = (
            await performEmailTokenVerification({
                login,
                token: String(token).padStart(5, '0'),
            })
        ).authTicket;
    } else {
        throw new Error('Auth verification method not supported: ' + verification[0].type);
    }

    // Complete the device registration and save the result
    const { deviceAccessKey, deviceSecretKey } = await completeDeviceRegistration({ login, authTicket });

    db.prepare('REPLACE INTO device VALUES (?, ?, ?)').bind(login, deviceAccessKey, deviceSecretKey).run();
    return { login, accessKey: deviceAccessKey, secretKey: deviceSecretKey };
};
