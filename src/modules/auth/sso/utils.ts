import { SSOAuthenticationInfo } from './types.js';

export const DASHLANE_APP_REGEX = /https:\/\/app.dashlane.com/;

/**
 * Convert a URL into SSOAuthenticationInfo structure
 * @param url Redirection URL provided by the IdP with required data for SSO login
 * @returns SSOAuthenticationInfo data structure
 */
export const extractSsoInfoFromUrl = (url: URL): SSOAuthenticationInfo => {
    // Data is available in URL hash, within the form of search parameters.
    const search_params = new URLSearchParams(url.hash.substring(1));

    // To be rewritten properly
    return Object.fromEntries(
        Object.entries({
            login: '',
            ssoToken: '',
            key: '',
            exists: '',
            currentAuths: '',
            expectedAuths: '',
        }).map(([k]) => [k, search_params.get(k)])
    ) as unknown as SSOAuthenticationInfo;
};
