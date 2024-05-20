export interface RequestLogin2Data {
    login: string;
}

export interface RequestLogin2Output {
    domainName: string;
    idpAuthorizeUrl: string;
    spCallbackUrl: string;
    teamUuid: string;
    validatedDomains: string[];
}

export interface RequestLogin2Request {
    path: 'authentication/RequestLogin2';
    input: RequestLogin2Data;
    output: RequestLogin2Output;
}

export interface ConfirmLogin2Data {
    teamUuid: string;
    domainName: string;
    samlResponse: string;
}

export interface ConfirmLogin2Output {
    ssoToken: string;
    userServiceProviderKey: string;
    exists: boolean;
    currentAuthenticationMethods: string[];
    expectedAuthenticationMethods: string[];
}

export interface ConfirmLogin2Request {
    path: 'authentication/ConfirmLogin2';
    input: ConfirmLogin2Data;
    output: ConfirmLogin2Output;
}
