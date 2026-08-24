export interface Arrayable<TValue> {
    toArray(): TValue[];
}

export interface ArrayAccess<TValue> {
    offsetExists(offset: number | string): boolean;
    offsetGet(offset: number | string): TValue | undefined;
    offsetSet(offset: number | string, value: TValue): void;
    offsetUnset(offset: number | string): void;
}

export type ArrayInnerValue<X> = X extends ReadonlyArray<infer U> ? U : never;

/**
 * Recursively extracts the deepest non-array value type.
 * Useful for inferring the leaf value type after fully flattening nested arrays.
 *
 * @example
 * FlatArrayValue<number> // number
 * FlatArrayValue<number[]> // number
 * FlatArrayValue<number[][]> // number
 * FlatArrayValue<string | number[]> // string | number
 */
export type FlatArrayValue<T> = T extends readonly (infer U)[]
    ? FlatArrayValue<U>
    : T;

export type ArrayItems<T> = readonly T[];

/**
 * Represents a value that may be nested within arrays to any depth.
 * Used by functions like `undot` that produce nested array structures
 * from flat dot-notated keys.
 *
 * @example
 * UndotValue<string> // string | UndotValue<string>[]
 * UndotValue<number> // number | UndotValue<number>[]
 */
export type UndotValue<T> = T | UndotValue<T>[];

/**
 * Checks if a string type contains a dot (.) separator.
 */
type ContainsDot<S> = S extends `${string}.${string}` ? true : false;

/**
 * Determines the return type for array undot operations.
 *
 * - When keys are generic strings (could contain dots): returns `UndotValue<TValue>[]`
 * - When keys are literal strings with dots: returns `UndotValue<TValue>[]`
 * - When keys are literal strings without dots: returns `TValue[]`
 *
 * @example
 * UndotResult<"0" | "1", string>       // string[]
 * UndotResult<"0" | "1.0", string>     // UndotValue<string>[]
 * UndotResult<string, number>          // UndotValue<number>[]
 */
export type UndotResult<
    TKey extends PropertyKey,
    TValue,
> = string extends TKey & string
    ? UndotValue<TValue>[]
    : [true] extends [ContainsDot<TKey & string>]
      ? UndotValue<TValue>[]
      : TValue[];

/**
 * Helper type to check if an array is mutable (not readonly)
 */
type IsMutableArray<T> = T extends readonly unknown[]
    ? T extends unknown[]
        ? true
        : false
    : false;

/**
 * Helper type to add a value to an array type.
 * Excludes readonly arrays as they cannot be mutated.
 */
export type AddToArray<T extends unknown[], V> =
    IsMutableArray<T> extends true
        ? T extends Array<infer U>
            ? Array<U | V>
            : never
        : never;

/**
 * Removes `null` from an array's element type.
 * Used by helpers that filter null values out of an array.
 *
 * @example
 * NonNullableArray<(string | null)[]> // string[]
 * NonNullableArray<string[]>          // string[]
 */
export type NonNullableArray<T extends readonly unknown[]> =
    T extends readonly (infer U)[] ? Exclude<U, null>[] : never;

/**
 * Removes the values PHP treats as falsy from an array's element type.
 *
 * @example
 * TruthyArray<(string | null | undefined)[]> // string[]
 * TruthyArray<(number | false)[]>            // number[]
 */
export type TruthyArray<T extends readonly unknown[]> =
    T extends readonly (infer U)[]
        ? Exclude<U, null | undefined | false | 0 | "">[]
        : never;

/**
 * A single sort descriptor accepted by array sort helpers.
 *
 * - a dot-notated key path, sorted ascending
 * - a `[key, direction]` tuple. Mirrors Laravel's `Collection::sortByMany`,
 *   where the tuple's second element behaves like the `'asc'`/`'desc'`
 *   string form rather than a `descending` boolean flag: `true` (or the
 *   `"Ascending"` case of `@tolki/enum`'s `SortDirection`) sorts ascending,
 *   `false` (or `"Descending"`) sorts descending. The literal case names are
 *   inlined here rather than imported from `@tolki/enum`, which depends on
 *   this package — importing it back would create a circular dependency.
 * - a comparator returning a negative, zero, or positive number
 */
export type SortSpec<TValue> =
    | string
    | readonly [string, boolean | "Ascending" | "Descending"]
    | ((a: TValue, b: TValue) => number);
