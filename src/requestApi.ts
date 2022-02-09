import * as apiconnect from './api-connect/index.js';
import { gotImplementation } from './utils/index.js';

interface RequestApi {
    login: string;
    payload: object;
    path: string;
    deviceKeys?: {
        accessKey: string;
        secretKey: string;
    };
}

export const requestApi = (params: RequestApi, cb: Callback<object>) => {
    const { payload, path, deviceKeys, login } = params;

    apiconnect.postRequestAPI(
        {
            requestFunction: gotImplementation,
            authentication: deviceKeys
                ? {
                      type: 'userDevice',
                      appAccessKey: 'C4F8H4SEAMXNBQVSASVBWDDZNCVTESMY',
                      appSecretKey: 'Na9Dz3WcmjMZ5pdYU1AmC5TdYkeWAOzvOK6PkbU4QjfjPQTSaXY8pjPwrvHfVH14',
                      login,
                      ...deviceKeys
                  }
                : {
                      type: 'app',
                      appAccessKey: 'C4F8H4SEAMXNBQVSASVBWDDZNCVTESMY',
                      appSecretKey: 'Na9Dz3WcmjMZ5pdYU1AmC5TdYkeWAOzvOK6PkbU4QjfjPQTSaXY8pjPwrvHfVH14'
                  },
            path: 'v1/' + path,
            payload,
            userAgent: 'TURBOBOT' // the user agent is mandatory when using "fetch" module
        },
        (error, response) => {
            if (error) {
                return cb(error);
            }
            if (response.statusCode !== 200) {
                return cb(new Error('Server responded an error : ' + response.body));
            }

            let output = {};
            try {
                output = JSON.parse(response.body);
            } catch (error) {
                return cb(error);
            }

            // console.log('API response:', JSON.stringify(output, null, 4));
            return cb(null, output['data']);
        }
    );
};
