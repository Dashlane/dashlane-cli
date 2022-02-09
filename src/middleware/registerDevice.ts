import * as async from 'async';
import * as sqlite3 from 'sqlite3';
import {
    RequestDeviceRegistrationOutput,
    PerformDuoPushVerificationOutput,
    CompleteDeviceRegistrationOutput,
    requestDeviceRegistration,
    performDuoPushVerification,
    completeDeviceRegistration
} from '../steps/index.js';
import { DeviceKeys } from '../types.js';

interface RegisterDevice {
    login: string;
    deviceKeys: DeviceKeys;
    db: sqlite3.Database;
}

export const registerDevice = (params: RegisterDevice, cb: Callback<DeviceKeys>) => {
    const { db, login, deviceKeys } = params;

    if (!deviceKeys) {
        console.log('Register the device...');

        interface AsyncResultsRegister {
            requestDeviceRegistration: RequestDeviceRegistrationOutput;
            performRegistration: PerformDuoPushVerificationOutput;
            completeDeviceRegistration: CompleteDeviceRegistrationOutput;
            saveDeviceKeys: void;
        }
        return async.auto<AsyncResultsRegister>(
            {
                requestDeviceRegistration: (cb) => requestDeviceRegistration({ login }, cb),
                performRegistration: [
                    'requestDeviceRegistration',
                    (results, cb) => {
                        const verificationMethods = results.requestDeviceRegistration.verification;
                        if (verificationMethods.findIndex((method) => method.type === 'duo_push')) {
                            return performDuoPushVerification({ login }, cb);
                        }
                        return cb(new Error('Auth not supported'));
                    }
                ],
                completeDeviceRegistration: [
                    'performRegistration',
                    (results, cb) => {
                        const authTicket = results.performRegistration.authTicket;
                        completeDeviceRegistration({ login, authTicket }, cb);
                    }
                ],
                saveDeviceKeys: [
                    'completeDeviceRegistration',
                    (results, cb) => {
                        const { deviceAccessKey, deviceSecretKey } = results.completeDeviceRegistration;
                        db.run('REPLACE INTO device VALUES (?, ?, ?)', [login, deviceAccessKey, deviceSecretKey], cb);
                    }
                ]
            },
            (error, results) => {
                if (error) {
                    return cb(error);
                }

                const { deviceAccessKey, deviceSecretKey } = results.completeDeviceRegistration;
                return cb(null, { accessKey: deviceAccessKey, secretKey: deviceSecretKey });
            }
        );
    }
    return cb(null, null);
};
