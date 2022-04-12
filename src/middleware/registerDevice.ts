import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';
import {
    requestDeviceRegistration,
    performDuoPushVerification,
    completeDeviceRegistration,
    performTotpVerification,
    performEmailTokenVerification
} from '../steps';
import type { DeviceKeysWithLogin } from '../types.js';
import inquirer from 'inquirer';

interface RegisterDevice {
    db: sqlite3.Database;
}

export const registerDevice = async (params: RegisterDevice): Promise<DeviceKeysWithLogin> => {
    const { db } = params;
    console.log('Registering the device...');

    const { login } = await inquirer.prompt([
        {
            type: 'input',
            name: 'login',
            message: 'Please enter your email address:'
        }
    ]);

    // Log in via a compatible verification method
    const { verification } = await requestDeviceRegistration({ login });

    let authTicket;
    if (verification.find((method) => method.type === 'duo_push')) {
        authTicket = (await performDuoPushVerification({ login })).authTicket;
    } else if (verification.find((method) => method.type === 'totp')) {
        const { otp } = await inquirer.prompt([
            {
                type: 'number',
                name: 'otp',
                message: 'Please enter your OTP code'
            }
        ]);
        authTicket = (await performTotpVerification({ login, otp: String(otp).padStart(5, '0') })).authTicket;
    } else if (verification.find((method) => method.type === 'email_token')) {
        const { token } = await inquirer.prompt([
            {
                type: 'number',
                name: 'token',
                message: 'Please enter the code you received by email'
            }
        ]);
        authTicket = (await performEmailTokenVerification({ login, token: String(token).padStart(5, '0') })).authTicket;
    } else {
        throw new Error('Auth verification method not supported: ' + verification[0].type);
    }

    // Complete the device registration and save the result
    const { deviceAccessKey, deviceSecretKey } = await completeDeviceRegistration({ login, authTicket });
    await promisify<string, any[], void>(db.run).bind(db)('REPLACE INTO device VALUES (?, ?, ?)', [
        login,
        deviceAccessKey,
        deviceSecretKey
    ]);
    return { login, accessKey: deviceAccessKey, secretKey: deviceSecretKey };
};
