export interface RequestLogin3Data {
    login: string;
}

export interface RequestLogin3Output {
    domainName: string;
    idpAuthorizeUrl: string;
    spCallbackUrl: string;
    teamUuid: string;
    validatedDomains: string[];
}

export interface RequestLogin3Request {
    path: 'authentication/RequestLogin3';
    input: RequestLogin3Data;
    output: RequestLogin3Output;
}

export interface ConfirmLogin3Data {
    teamUuid: string;
    domainName: string;
    samlResponse: string;
}

export interface ConfirmLogin3Output {
    ssoToken: string;
    userServiceProviderKey: string;
    exists: boolean;
    currentAuthenticationMethods: string[];
    expectedAuthenticationMethods: string[];
}

export interface ConfirmLogin3Request {
    path: 'authentication/ConfirmLogin3';
    input: ConfirmLogin3Data;
    output: ConfirmLogin3Output;
}
