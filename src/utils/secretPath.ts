import { isUuid } from './strings';
import { ParsedPath } from '../types';

/**
 * Function to parse a custom Dashlane path and return the query parameters for the vault lookup
 * First we check if the path is a valid Dashlane path, should start with dl://
 * Then we check if the path is a valid Dashlane vault id, should be a 32 character UUID string (ie: 11111111-1111-1111-1111-111111111111)
 * Otherwise, we assume the path is a valid Dashlane title
 * Finally, we check if the next chunk of the path is a valid Dashlane field
 * @param path
 */
export const parsePath = (path: string): ParsedPath => {
    if (!path.startsWith('dl://')) {
        throw new Error('Invalid Dashlane path');
    }

    const cleanPath = path.slice(5);

    const pathChunks = cleanPath.split('/');

    if (pathChunks.length > 2) {
        throw new Error('Invalid Dashlane path');
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

    return { secretId, title, field };
};
