export type RequestFunctionOptions = {
    method: 'POST' | 'GET';
    headers: Dictionary<string>;
    url: string;
    json: Object;
    query?: Dictionary<string | string[]>;
};

export type RequestFunction<T> = (options: RequestFunctionOptions) => Promise<T>;

type TeamDeviceAuthentication = {
    type: 'teamDevice';
    teamUuid: string;
    accessKey: string;
    secretKey: string;
    appAccessKey: string;
    appSecretKey: string;
};

type UserDeviceAuthentication = {
    type: 'userDevice';
    login: string;
    accessKey: string;
    secretKey: string;
    appAccessKey: string;
    appSecretKey: string;
};

type AppAuthentication = {
    type: 'app';
    appAccessKey: string;
    appSecretKey: string;
};

type NoneAuthentication = {
    type: 'none';
};

export type Authentication =
    | UserDeviceAuthentication
    | TeamDeviceAuthentication
    | AppAuthentication
    | NoneAuthentication;

export interface PostRequestAPIParams<T> {
    requestFunction: RequestFunction<T>;
    path: string;
    authentication: Authentication;
    payload: object;
    query?: Dictionary<string | string[]>;
    method?: 'POST' | 'GET';
    userAgent?: string;
    testPort?: string;
    customHost?: string;
}

export interface SignRequestParams {
    authentication: Authentication;
    method: string;
    body: object;
    uri: string;
    headers: Dictionary<string>;
    query: Dictionary<string | string[]>;
}

export interface MakeCanonicalRequestParams {
    method: string;
    uri: string;
    query: Dictionary<string | string[]>;
    headers: Dictionary<string>;
    headersToSign: string[];
    hashedPayload: string;
}
