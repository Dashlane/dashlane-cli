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

/** Unix timestamp to human readable string */
export const unixTimestampToHumanReadable = (timestamp: number | null): string => {
    return timestamp ? new Date(timestamp * 1000).toLocaleString() : 'N/A';
};
