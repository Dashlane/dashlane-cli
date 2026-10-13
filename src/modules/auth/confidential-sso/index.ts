import { chromium } from 'playwright-core';
import { ConfirmLogin3Request, RequestLogin3Request } from './types.js';
import { SAMLResponseNotFound } from './errors.js';
import { apiConnect } from '../../tunnel-api-connect/index.js';
import { performSSOVerificationWithAuthTicket } from '../../../endpoints/performSSOVerificationWithAuthTicket.js';

interface ConfidentialSSOParams {
    requestedLogin: string;
    authTicket: string;
}

export const doConfidentialSSOVerification = async ({ authTicket, requestedLogin }: ConfidentialSSOParams) => {
    const api = await apiConnect({
        useProductionCertificate: true,
    });
    const requestLoginResponse = await api.sendSecureContent<RequestLogin3Request>({
        ...api,
        path: 'authentication/RequestLogin3',
        payload: { login: requestedLogin },
        authentication: { type: 'app' },
    });

    const { idpAuthorizeUrl, spCallbackUrl, teamUuid, domainName } = requestLoginResponse;

    const browser = await chromium.launch({ headless: false, channel: 'chrome' });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(idpAuthorizeUrl);

    let samlResponseData;
    const samlResponsePromise = new Promise((resolve) => {
        page.on('request', (req) => {
            const reqURL = req.url();
            if (reqURL === spCallbackUrl) {
                samlResponseData = req.postData();
                if (browser) {
                    void browser.close();
                }
                resolve(undefined);
            }
        });
    });

    await samlResponsePromise;

    const samlResponse = new URLSearchParams(samlResponseData).get('SAMLResponse');

    if (!samlResponse) {
        throw new SAMLResponseNotFound();
    }

    const confirmLoginResponse = await api.sendSecureContent<ConfirmLogin3Request>({
        ...api,
        path: 'authentication/ConfirmLogin3',
        payload: { teamUuid, domainName, samlResponse },
        authentication: { type: 'app' },
    });

    const ssoVerificationResult = await performSSOVerificationWithAuthTicket({
        authTicket,
        login: requestedLogin,
        ssoToken: confirmLoginResponse.ssoToken,
    });

    return { ...ssoVerificationResult, ssoSpKey: confirmLoginResponse.userServiceProviderKey };
};
