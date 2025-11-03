/**
 * A key used to access a path in an object or array.
 */
export type PathKey = number | string | null | undefined;

/**
 * A set of keys used to access a path in an object or array.
 */
export type PathKeys = number | string | null | undefined | Array<PathKey>;

/**
 * Unwraps a value or function that returns a value.
 */
export type UnwrapFn<T> = T extends (...args: unknown[]) => infer R ? R : T;

/**
 * Helper to get array element type
 */
type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Helper to check if a type is an array
 */
type IsArray<T> = T extends readonly unknown[] ? true : false;

/**
 * Helper to check if a type is a tuple with at least one element
 */
type IsTuple<T> = T extends readonly [unknown, ...unknown[]] 
    ? true 
    : T extends readonly [] 
        ? true 
        : false;

/**
 * Helper to get element at specific index in tuple
 * For unions of tuples, returns the union of elements at that index
 */
type TupleElement<T extends readonly unknown[], N extends number> = 
    T extends readonly unknown[]
        ? N extends keyof T 
            ? T[N] 
            : ArrayElement<T>
        : never;

/**
 * Gets the type of a value at a given path in an object or array.
 * Supports dot notation (a.b.c) and array indexing (a.0.b).
 */
export type GetFieldType<T, P extends string | number, TDefault = never> =
    P extends keyof T
        ? T[P]
    : P extends `${infer First}.${infer Rest}`
        ? First extends keyof T
            ? GetFieldType<T[First], Rest, TDefault>
            : First extends `${infer N extends number}`
                ? IsArray<T> extends true
                    ? T extends readonly unknown[]
                        ? GetFieldType<T[N], Rest, TDefault>
                        : TDefault
                    : TDefault
                : TDefault
        : P extends `${infer N extends number}`
            ? IsArray<T> extends true
                ? T extends readonly unknown[]
                    ? T[N]
                    : TDefault
                : TDefault
    : TDefault;