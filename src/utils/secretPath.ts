import { isUuid } from './strings.js';
import { transformJsonPath, transformOtp, transformOtpAndExpiry } from './secretTransformation.js';
import { ParsedPath } from '../types.js';
import { InvalidDashlanePathError } from '../errors.js';

/**
 * Function to parse a custom Dashlane path and return the query parameters for the vault lookup
 * First we check if the path is a valid Dashlane path, should start with dl://
 * Then we check if the path is a valid Dashlane vault id, should be a 32 character UUID string (ie: 11111111-1111-1111-1111-111111111111)
 * Otherwise, we assume the path is a valid Dashlane title
 * Next, we check if the next chunk of the path is a valid Dashlane field
 * Finally, we check if there is a '?key' or '?key=value' query string at the end of the path
 * @param path
 */
export const parsePath = (path: string): ParsedPath => {
    if (!path.startsWith('dl://')) {
        throw new InvalidDashlanePathError();
    }

    const [, ...queryParamsSplitted] = path.split('?');
    const queryParams = queryParamsSplitted.join('?');

    const cleanPath = path.slice(5, path.length - (queryParams.length > 0 ? queryParams.length + 1 : 0));

    const pathChunks = cleanPath.split('/');

    if (pathChunks.length > 2) {
        throw new InvalidDashlanePathError();
    }

    let itemId = undefined;
    let title = undefined;
    let field = undefined;

    if (!isUuid(pathChunks[0])) {
        title = pathChunks[0];
    } else {
        itemId = `{${pathChunks[0]}}`;
    }

    if (pathChunks.length > 1) {
        field = pathChunks[1];
    }

    let transformation = undefined;

    if (queryParams.length) {
        const [queryParamKey, ...queryParamChunks] = queryParams.split('=');
        const queryParamValue = queryParamChunks.join('=');

        switch (queryParamKey) {
            case 'otp':
                transformation = transformOtp;
                break;
            case 'otp+expiry':
                transformation = transformOtpAndExpiry;
                break;
            case 'json':
                transformation = (json: string) => transformJsonPath(json, queryParamValue);
                break;
            default:
                throw new InvalidDashlanePathError();
        }
    }

    return { itemId, title, field, transformation };
};
