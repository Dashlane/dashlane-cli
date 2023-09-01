import * as commander from 'commander';
import { Parser } from '@json2csv/plainjs';
import { flatten } from '@json2csv/transforms';

export const notEmpty = <TValue>(value: TValue | null | undefined): value is TValue => {
    return value !== null && value !== undefined;
};

export const parseBooleanString = (booleanString: string): boolean => {
    if (booleanString === 'true') {
        return true;
    } else if (booleanString === 'false') {
        return false;
    }
    throw new Error("The provided boolean variable should be either 'true' or 'false'");
};

export const customParseInt = (value: string, _dummyPrevious: unknown) => {
    // parseInt takes a string and a radix
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new commander.InvalidArgumentError('Not a number.');
    }
    return parsedValue;
};

/** Remove underscores and capitalize string */
export const removeUnderscoresAndCapitalize = (string: string): string => {
    return string
        .split('_')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
};

/** Epoch unix timestamp in seconds to ISO 8601 */
export const epochTimestampToIso = (
    timestamp: string | number | null | undefined,
    inMilliseconds?: boolean
): string => {
    if (timestamp === null || timestamp === undefined) {
        return '';
    }

    let timestampNumber = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;

    if (!inMilliseconds) {
        timestampNumber *= 1000;
    }

    return new Date(timestampNumber).toISOString();
};

export const isUuid = (uuid: string): boolean => {
    const uuidRegex = new RegExp('^[0-9A-F]{8}-[0-9A-F]{4}-[0-5][0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$');

    return uuidRegex.test(uuid);
};

export const jsonToCsv = (json: Record<string, any>): string => {
    const parser = new Parser();
    const csv = parser.parse(json);
    return csv;
};

export const flattenJsonArrayOfObject = (json: Record<string, any>[]): Record<string, any> => {
    const flattenTransform = flatten();
    const flattenedJson = json.map((entry) => flattenTransform(entry));
    return flattenedJson;
};
