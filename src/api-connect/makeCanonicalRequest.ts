import { MakeCanonicalRequestParams } from './types';

/**
 * Canonicalize an HTTP request as described on AWS v4 documentation
 * http://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
 */
export const makeCanonicalRequest = (params: MakeCanonicalRequestParams) => {
    const headers = convertDictionaryToLowerCaseKeys(params.headers);
    const headersToSign = getHeadersToSign(headers, params);
    const canonicalURI = makeCanonicalURI(params.uri);
    const canonicalQueryString = makeCanonicalQueryString(params.query);
    const canonicalHeaders = makeCanonicalHeaders(headersToSign);
    const signedHeaders = makeSignedHeaderList(headersToSign);

    const canonicalRequest = [
        params.method,
        canonicalURI,
        canonicalQueryString,
        canonicalHeaders,
        signedHeaders,
        params.hashedPayload
    ].join('\n');

    return {
        canonicalRequest,
        signedHeaders
    };
};

const convertDictionaryToLowerCaseKeys = (obj: Dictionary<string>): Dictionary<string> => {
    return Object.entries(obj).reduce((res, [key, value]) => {
        return { ...res, [key.toLowerCase()]: value };
    }, {});
};

const getHeadersToSign = (headers: Dictionary<string>, params: MakeCanonicalRequestParams): Dictionary<string> => {
    if (!params.headersToSign) {
        return params.headers;
    }
    const lowerCaseHeadersToSign = params.headersToSign.map((header) => header.toLowerCase());
    return Object.entries(headers).reduce((res, [key, value]) => {
        if (lowerCaseHeadersToSign.indexOf(key.toLowerCase()) > -1) {
            return { ...res, [key]: value };
        } else {
            return res;
        }
    }, {});
};

/**
 * A custom encodeURI function which encodes all characters except alpha-numeric
 * and '_', '~', '.' and '-'
 */
const encodeURIFull = (uri: string): string => {
    // encode each part of the path
    return uri
        .split('/')
        .map((uriPart) => encodeURIComponentFull(uriPart))
        .join('/');
};

/**
 * A custom encodeURIComponent function which encodes all characters except alpha-numeric
 * and '_', '~', '.' and '-'
 */
const encodeURIComponentFull = (part: string): string => {
    let output = encodeURIComponent(part);
    output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);
    // AWS canonicalization percent-encodes some extra non-standard characters in a URI
    // In JS, only '*' is missing
    output = output.replace(/[*]/g, '%2A');
    return output;
};

const makeCanonicalURI = (uri: string) => {
    return encodeURIFull(uri);
};

const makeCanonicalQueryStringPair = (key: string, valueOrValues: string | string[]) => {
    const encodedKey = encodeURIComponentFull(key);
    const values = Array.isArray(valueOrValues) ? valueOrValues : [valueOrValues];
    return values
        .map((value) => encodeURIComponentFull(value))
        .sort()
        .map((encodedValue) => `${encodedKey}=${encodedValue}`)
        .join('&');
};

const makeCanonicalQueryString = (queryString?: Dictionary<string | string[]>) => {
    return Object.entries(queryString || {})
        .map(([key, valueOrValues]) => makeCanonicalQueryStringPair(key, valueOrValues))
        .sort()
        .join('&');
};

const makeCanonicalHeaderPair = (key: string, value: string) => {
    const pairKey = key.toLowerCase();
    const pairValue = value.toString().trim().replace(/\s+/g, ' ');
    return `${pairKey}:${pairValue}\n`;
};

const makeCanonicalHeaders = (headersToSign: Dictionary<string>) => {
    return Object.entries(headersToSign)
        .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
        .map(([key, value]) => makeCanonicalHeaderPair(key, value))
        .join('');
};

const makeSignedHeaderList = (headersToSign: Dictionary<string>) => {
    return Object.keys(headersToSign)
        .map((header) => header.toLowerCase())
        .sort()
        .join(';');
};
