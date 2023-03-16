export const filterMatches = <VaultType>(
    values: VaultType[] | undefined,
    filters: string[] | null,
    defaultMatch: string[] = ['url', 'title'],
): VaultType[] => {
    if (!values) {
        return [] as VaultType[];
    }

    let matches = values;

    if (filters?.length) {
        interface ItemFilter {
            keys: string[];
            value: string;
        }
        const parsedFilters: ItemFilter[] = [];

        filters.forEach((filter) => {
            const [splitFilterKey, ...splitFilterValues] = filter.split('=');

            const filterValue = splitFilterValues.join('=') || splitFilterKey;
            const filterKeys = splitFilterValues.length > 0 ? splitFilterKey.split(',') : defaultMatch;

            const canonicalFilterValue = filterValue.toLowerCase();

            parsedFilters.push({
                keys: filterKeys,
                value: canonicalFilterValue,
            });
        });

        matches = matches?.filter((item) =>
            parsedFilters
                .map((filter) =>
                    filter.keys.map((key) => {
                        const val = item[key as keyof VaultType];
                        return typeof val === 'string' && val.toLowerCase().includes(filter.value);
                    })
                )
                .flat()
                .some((b) => b)
        );
    }

    return matches;
}
