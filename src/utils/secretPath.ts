import { isUuid } from './strings';
import { transformOtp } from './secretTransformation';
import { ParsedPath } from '../types';
import { InvalidDashlanePathError } from '../errors';

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

    const queryParams = path.split('?');
    if (queryParams.length > 2) {
        throw new InvalidDashlanePathError();
    }

    const cleanPath = path.slice(5, path.length - (queryParams.length === 2 ? queryParams[1].length + 1 : 0));

    const pathChunks = cleanPath.split('/');

    if (pathChunks.length > 2) {
        throw new InvalidDashlanePathError();
    }

    let secretId = undefined;
    let title = undefined;
    let field = undefined;

    if (!isUuid(pathChunks[0])) {
        title = pathChunks[0];
    } else {
        secretId = `{${pathChunks[0]}}`;
    }

    if (pathChunks.length > 1) {
        field = pathChunks[1];
    }

    let transformation = undefined;

    if (queryParams.length === 2) {
        const queryParamChunks = queryParams[1].split('=');
        if (queryParamChunks.length > 2) {
            throw new InvalidDashlanePathError();
        }

        const queryParamKey = queryParamChunks[0];
        // const queryParamValue = queryParamChunks[1];

        switch (queryParamKey) {
            case 'otp':
                transformation = transformOtp;
                break;
            default:
                throw new InvalidDashlanePathError();
        }
    }

    return { secretId, title, field, transformation };
};
