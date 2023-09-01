declare global {
    type CallbackErrorOnly = (error?: Error) => void;

    type CallbackTypedErrorOnly<E extends Error> = (error?: E) => void;

    type CallbackWithTypedError<E extends Error, T> = (error: E, results?: T) => void;

    type Callback<T> = (error: Error, results?: T) => void;

    type Callback2<T1, T2> = (error: Error, result1?: T1, result2?: T2) => void;

    type Returns<T> = () => T;

    type Resolvable<T> = Returns<T> | T;

    type Deferred<T> = {
        [P in keyof T]?: Returns<T[P]> | T[P];
    };

    type PartialOrFunctions<T> = {
        [P in keyof T]?: T[P] | ((P: T[P]) => boolean);
    };

    type ConstructorOf<T> = {
        new (): T;
    };

    type Dictionary<T> = { [key: string]: T };

    type SafeDictionary<K extends string, T> = { [key in K]: T };
}

export type Anything = any;
