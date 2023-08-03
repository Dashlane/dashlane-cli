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
