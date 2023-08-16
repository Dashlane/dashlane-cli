import { chromium } from 'playwright';
import { DASHLANE_APP_REGEX, extractSsoInfoFromUrl } from './utils';
import { performSSOVerification } from '../../../endpoints/performSSOVerification';

interface SSOParams {
    requestedLogin: string;
    serviceProviderURL: string;
}

const openIdPAndWaitForRedirectURL = async (serviceProviderURL: string, userLogin: string): Promise<URL> => {
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

                browser.on('disconnected', () => {
                    reject(new Error('Browser closed before SSO login'));
                });

                await page.goto(serviceProviderURL);

                // attempt to fill the login field
                await page
                    .getByLabel('email')
                    .or(page.getByLabel('Username'))
                    .fill(userLogin)
                    .catch(() => null);
            } catch (error) {
                reject(error);
            }
        })();
    });
};

export const doSSOVerification = async ({ requestedLogin, serviceProviderURL }: SSOParams) => {
    const redirectURL = await openIdPAndWaitForRedirectURL(serviceProviderURL, requestedLogin);
    const ssoInfo = extractSsoInfoFromUrl(redirectURL);

    if (requestedLogin !== ssoInfo.login) {
        throw new Error('Login received from IdP does not match');
    }

    if (ssoInfo.currentAuths !== ssoInfo.expectedAuths) {
        throw new Error('SSO Migration is not supported');
    }

    const ssoVerificationResult = await performSSOVerification({
        login: ssoInfo.login,
        ssoToken: ssoInfo.ssoToken,
    });

    return { ...ssoVerificationResult, ssoSpKey: ssoInfo.key };
};
