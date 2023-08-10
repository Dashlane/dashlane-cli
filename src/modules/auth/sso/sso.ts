import { chromium } from 'playwright';
import os from 'os';
import { SSOAuthenticationInfo } from './types';
import { DASHLANE_APP_REGEX, extractSsoInfoFromUrl } from './utils';
import { performSSOVerification } from '../../../endpoints/performSSOVerification';
import { completeDeviceRegistration } from '../../../endpoints';

interface SSOParams {
    requestedLogin: string;
    serviceProviderURL: string;
}

const openIdPAndWaitForRedirectURL = async (serviceProviderURL: string): Promise<URL> => {
    return new Promise((resolve, reject) => {
        void (async () => {
            try {
                const browser = await chromium.launch({ headless: false, channel: 'chrome' });
                const context = await browser.newContext();
                const page = await context.newPage();

                page.on('framenavigated', (frame) => {
                    const url = page.url();
                    if (frame === page.mainFrame() && url.match(DASHLANE_APP_REGEX)) {
                        void browser.close();
                        resolve(new URL(url));
                    }
                });

                browser.on('disconnected', reject);

                await page.goto(serviceProviderURL);
            } catch (e) {
                reject(e);
            }
        })();
    });
};

const registerDeviceWithSSO = async (ssoInfo: SSOAuthenticationInfo) => {
    const response = await performSSOVerification({
        login: ssoInfo.login,
        ssoToken: ssoInfo.ssoToken,
    });

    const deviceRegistration = await completeDeviceRegistration({
        deviceName: `${os.hostname()} - ${os.platform()}-${os.arch()}`,
        login: ssoInfo.login,
        authTicket: response.authTicket,
    });

    console.log(ssoInfo, deviceRegistration);

    // To be continued...
};

export const doSSOVerification = async ({ requestedLogin, serviceProviderURL }: SSOParams): Promise<void> => {
    const redirectURL = await openIdPAndWaitForRedirectURL(serviceProviderURL);
    const ssoInfo = extractSsoInfoFromUrl(redirectURL);

    if (requestedLogin !== ssoInfo.login) {
        throw new Error('Login received from IdP does not match');
    }

    if (ssoInfo.currentAuths !== ssoInfo.expectedAuths) {
        throw new Error('SSO Migration is not supported');
    }

    // We should detect and ignore nitro SSO

    await registerDeviceWithSSO(ssoInfo);
};
