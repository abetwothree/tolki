import { SortDirection } from "@tolki/enum";
import { replaceRecursive as objReplaceRecursive } from "@tolki/obj";
import {
    dotFlatten,
    forgetKeys,
    getMixedValue,
    getNestedValue,
    getRaw,
    hasMixed,
    pushWithPath,
    setMixed,
    setMixedImmutable,
    undotExpandArray,
} from "@tolki/path";
import { finish, randomInt } from "@tolki/str";
import type {
    ArrayInnerValue,
    ArrayItems,
    ArrayResolvePath,
    ArrayResolvePathOrDefault,
    ArrayResolvePathOrNull,
    CaseValue,
    EnsureArray,
    FlatArrayValue,
    NonNullableArray,
    PathKey,
    PathKeys,
    PluckValue,
    SortSpec,
    TruthyArray,
    UndotArrayKey,
    UndotResult,
} from "@tolki/types";
import {
    castableToArray,
    compareValues,
    defineKey,
    getAccessibleValues,
    isArray,
    isBoolean,
    isFalsy,
    isFunction,
    isInteger,
    isIterable,
    isMap,
    isNull,
    isNumber,
    isObject,
    isPhpArrayKey,
    isPhpFalsy,
    isPhpNumeric,
    isString,
    isStringable,
    isSymbol,
    isUndefined,
    isWeakMap,
    looseEqual,
    typeOf,
} from "@tolki/utils";

/**
 * Mutation contract: pop, shift, splice and unshift mutate their first
 * argument; every other function returns a new value. arr and obj agree
 * on this — re-read Collection.php before "aligning" one to the other.
 */

/**
 * Determine whether the given value is array accessible.
 *
 * @example
 *
 * accessible([]); // true
 * accessible([1, 2]); // true
 * accessible({ a: 1, b: 2 }); // false
 */
export function accessible<TValue>(value: TValue): value is TValue & unknown[] {
    return isArray(value);
}

/**
 * Determine whether the given value is arrayable.
 *
 * @example
 *
 * arrayable([]); // true
 * arrayable([1, 2]); // true
 * arrayable({ a: 1, b: 2 }); // false
 */
export function arrayable(value: unknown): value is unknown[] {
    return isArray(value);
}

/**
 * Get something that can be walked with `for...of` for the given items.
 *
 * Plain objects hold their items as properties rather than behind an iterator,
 * so they are walked through their values. This mirrors the `Arr::from()` call
 * Laravel performs before walking the items.
 *
 * @param data - The items to walk.
 * @returns The items themselves when they are already iterable, otherwise their values.
 */
function toWalkable<TValue>(data: unknown): Iterable<TValue> {
    if (isObject(data) && !isIterable(data)) {
        return Object.values(data as object) as TValue[];
    }

    return data as Iterable<TValue>;
}

/**
 * Add an element to an array using "dot" notation if it doesn't exist.
 *
 * @param data - The array to add the element to.
 * @param key - The key or dot-notated path where to add the value.
 * @param value - The value to add.
 * @returns A new array with the value added if the key didn't exist.
 *
 * @example
 *
 * add(['products', ['desk', [100]]], '1.1', 200); -> ['products', ['desk', [100, 200]]]
 * add(['products', ['desk', [100]]], '2', ['chair', [150]]); -> ['products', ['desk', [100]], ['chair', [150]]]
 */
export function add<TValue, TAddValue>(
    data: ArrayItems<TValue>,
    key: PathKey,
    value: TAddValue,
): (TValue | TAddValue)[] {
    const mutableData = [...data];

    if (!hasMixed(mutableData, key)) {
        return setMixed(mutableData, key, value);
    }

    return mutableData;
}

/**
 * Get an array item from an array using "dot" notation.
 *
 * @param data - The array to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The array value.
 * @throws Error if the value is not an array.
 *
 * @example
 *
 * arrayItem([['a', 'b'], ['c', 'd']], 0); -> ['a', 'b']
 * arrayItem([{items: ['x', 'y']}], '0.items'); -> ['x', 'y']
 * arrayItem([{items: 'not array'}], '0.items'); -> throws Error
 */
// Overload: typed array + literal path → inferred array element type
export function arrayItem<
    TData extends readonly unknown[],
    TPath extends string | number,
>(data: TData, key: TPath): EnsureArray<ArrayResolvePath<TData, TPath>>;
// Overload: typed array + literal path + default → inferred type
export function arrayItem<
    TData extends readonly unknown[],
    TPath extends string | number,
    TDefault,
>(
    data: TData,
    key: TPath,
    defaultValue: TDefault | (() => TDefault) | null,
): EnsureArray<ArrayResolvePath<TData, TPath>>;
// Overload: generic fallback
export function arrayItem<TValue, TDefault = null>(
    data: TValue[] | unknown,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): unknown[];
export function arrayItem<TValue, TDefault = null>(
    data: TValue[] | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): unknown[] {
    const value = getMixedValue(data, key, defaultValue);

    if (!isArray(value)) {
        const typeName = isNull(value) ? "null" : typeOf(value);

        throw new Error(
            `Array value for key [${key}] must be an array, ${typeName} found.`,
        );
    }

    return value;
}

/**
 * Get a boolean item from an array using "dot" notation.
 * Throws an error if the value is not a boolean.
 *
 * @param data - The array to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The boolean value.
 * @throws Error if the value is not a boolean.
 *
 * @example
 *
 * boolean([true, false], 0); -> true
 * boolean([{active: true}], '0.active'); -> true
 * boolean([{active: 'yes'}], '0.active'); -> throws Error
 */
// Overload: typed array → boolean value
export function boolean<TValue, TDefault = null>(
    data: ArrayItems<TValue>,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): boolean;
// Overload: unknown fallback
export function boolean<TDefault = null>(
    data: unknown,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): boolean;
// Implementation
export function boolean<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): boolean {
    const value = getMixedValue(data, key, defaultValue);

    if (!isBoolean(value)) {
        throw new Error(
            `Array value for key [${key}] must be a boolean, ${typeOf(value)} found.`,
        );
    }

    return value;
}

/**
 * Chunk the array into chunks of the given size.
 *
 * @see Collection::chunk — `packages/collection/stubs/Collection.php:1520`.
 *      Wraps `array_chunk`; no `preserveKeys` param here (always reindexes).
 *
 * @param data - The array to chunk
 * @param size - The size of each chunk
 * @returns Chunked array
 */
export function chunk<TValue>(
    data: ArrayItems<TValue>,
    size: number,
): TValue[][] {
    if (size <= 0) {
        return [];
    }

    const chunks: TValue[][] = [];

    for (let i = 0; i < data.length; i += size) {
        const chunk = data.slice(i, i + size);
        chunks.push(chunk);
    }

    return chunks;
}

/**
 * Collapse an array of arrays into a single array, or an array of objects into a single object.
 *
 * @param data - The array to collapse.
 * @return A new flattened array or merged object.
 *
 * @example
 *
 * collapse([[1], [2], [3], ['foo', 'bar']]); -> [1, 2, 3, 'foo', 'bar']
 * collapse([{ a: 1, b: 2 }, { c: 3, d: 4 }]) -> { a: 1, b: 2, c: 3, d: 4 }
 */
export function collapse<TValue>(data: TValue[][]): TValue[];
export function collapse<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue>[],
): Record<TKey, TValue>;
export function collapse<TValue extends ArrayItems<ArrayItems<unknown>>>(
    data: TValue,
): ArrayInnerValue<TValue[number]>[];
export function collapse<TValue extends ArrayItems<unknown>>(
    data: TValue,
): Record<string, unknown> | ArrayInnerValue<TValue[number]>[] | unknown[];
export function collapse<TValue extends ArrayItems<unknown>>(
    data: TValue,
): Record<string, unknown> | ArrayInnerValue<TValue[number]>[] | unknown[] {
    // Check if all items are objects (but not arrays)
    const hasObjects = data.some((item) => isObject(item) && !isArray(item));

    if (hasObjects) {
        // Merge objects together
        const result: Record<string, unknown> = {};
        for (const item of data) {
            if (isObject(item) && !isArray(item)) {
                Object.assign(result, item);
            }
        }
        return result;
    }

    // Flatten arrays
    const out: unknown[] = [];
    for (const item of data) {
        if (isArray(item)) {
            out.push(...item);
        }
    }

    return out;
}

/**
 * Combine an array of keys with an array of values into an object,
 * mirroring PHP's `array_combine()` / `Collection::combine()`
 * (`Collection.php:933`).
 *
 * The previous implementation zipped an arbitrary number of arrays into an
 * array of tuples — that never corresponded to `array_combine`, whose
 * *only* two-argument shape produces a keyed map (confirmed against the
 * real `CollectionTest::testCombineWithArray`, and already how
 * `Obj.combine` behaved). It was silently mislabeled: throwing on a count
 * mismatch only makes sense once `combine` actually implements
 * `array_combine` semantics.
 *
 * Each key is coerced with `String()` (same as `flip`/`keyBy`/
 * `mapWithKeys`), so `keys`' element type is intentionally unconstrained
 * rather than `PropertyKey` — the result's key type is always `string`,
 * matching those functions' `Record<string, TValue>` convention.
 *
 * @see Collection::combine — `packages/collection/stubs/Collection.php:933`.
 *      Wraps `array_combine`.
 *
 * @param keys - The keys.
 * @param values - The values, matched to `keys` by position.
 * @returns A new object mapping each key to its corresponding value.
 * @throws Error if `keys` and `values` do not have the same length.
 *
 * @example
 *
 * combine(["a", "b"], [1, 2]); -> { a: 1, b: 2 }
 */
export function combine<TKey, TValue>(
    keys: ArrayItems<TKey>,
    values: ArrayItems<TValue>,
): Record<string, TValue> {
    if (keys.length !== values.length) {
        throw new Error(
            "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
        );
    }

    const result: Record<string, TValue> = {};

    for (let i = 0; i < keys.length; i++) {
        defineKey(result, String(keys[i]), values[i] as TValue);
    }

    return result;
}

/**
 * Cross join the given arrays, returning all possible permutations.
 *
 * @param arrays - The arrays to cross join.
 * @return A new array with all combinations of the input arrays.
 *
 * @example
 *
 * crossJoin([1], ["a"]); -> [[1, 'a']]
 */
export function crossJoin(): unknown[][];
export function crossJoin<A>(a: readonly A[]): [A][];
export function crossJoin<A, B>(a: readonly A[], b: readonly B[]): [A, B][];
export function crossJoin<A, B, C>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
): [A, B, C][];
export function crossJoin<A, B, C, D>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
): [A, B, C, D][];
export function crossJoin<A, B, C, D, E>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
    e: readonly E[],
): [A, B, C, D, E][];
export function crossJoin<A, B, C, D, E, F>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
    e: readonly E[],
    f: readonly F[],
): [A, B, C, D, E, F][];
export function crossJoin(
    ...arrays: readonly (readonly unknown[])[]
): unknown[][];
export function crossJoin(
    ...arrays: readonly (readonly unknown[])[]
): unknown[][] {
    let results: unknown[][] = [[]];

    for (const array of arrays) {
        if (!array.length) {
            return [];
        }

        const next: unknown[][] = [];

        for (const product of results) {
            for (const item of array) {
                next.push([...product, item]);
            }
        }

        results = next;
    }

    return results;
}

/**
 * Divide an array into two arrays. One with keys and the other with values.
 *
 * @param array - The array to divide.
 * @return A tuple with an array of keys and an array of values.
 *
 * @example
 *
 * divide(["Desk", 100, true]); -> [[0, 1, 2], ['Desk', 100, true]]
 */
export function divide(array: readonly []): [number[], unknown[]];
export function divide<TValue>(array: readonly TValue[]): [number[], TValue[]];
export function divide<TValue>(array: readonly TValue[]): [number[], TValue[]] {
    const keys = array.map((_, i) => i);
    return [keys, array.slice() as TValue[]];
}

/**
 * Flatten a multi-dimensional array with "dot" notation.
 *
 * @param data - The array or to flatten.
 * @param prepend - An optional string to prepend to each key.
 * @param depth - Maximum depth to flatten. Defaults to Infinity.
 * @returns A new object with dot-notated keys.
 *
 * @example
 *
 * dot(['a', ['b', 'c']]); -> { '0': 'a', '1.0': 'b', '1.1': 'c' }
 */
export function dot<TValue>(
    data: readonly TValue[],
    prepend?: string,
): Record<string, FlatArrayValue<TValue>>;
export function dot<TValue>(
    data: readonly TValue[],
    prepend: string,
    depth: number,
): Record<string, TValue | FlatArrayValue<TValue>>;
export function dot<TValue>(
    data: ArrayItems<TValue> | unknown,
    prepend?: string,
    depth?: number,
): Record<string, TValue>;
export function dot<TValue>(
    data: ArrayItems<TValue> | unknown,
    prepend: string = "",
    depth: number = Infinity,
): Record<string, TValue> {
    return dotFlatten(data, prepend, depth);
}

/**
 * Whether every dot segment of `key` is a usable array index, matching the
 * test `undotExpandArray` applies before it will build anything from a key.
 */
function isArrayIndexPath(key: string): boolean {
    return key.split(".").every((segment) => {
        const index = segment.length ? Number(segment) : NaN;

        return isInteger(index) && index >= 0;
    });
}

/**
 * Convert a flatten "dot" notation object into an expanded array.
 *
 * Only accepts numeric-first dotted keys — use `Obj.undot` for anything
 * else. The `UndotArrayKey` constraint rejects a bad key at the call site
 * only for a fresh object literal, where TypeScript's excess-property
 * check fires; anything reaching this through a variable is caught here
 * instead, because the alternative is returning an empty array and calling
 * it a result.
 *
 * @param map - The flat object with numeric-first dot-notated keys.
 * @returns A new multi-dimensional array.
 * @throws TypeError if any key has a segment that is not a non-negative integer.
 *
 * @example
 *
 * undot({ '0': 'a', '1.0': 'b', '1.1': 'c' }); -> ['a', ['b', 'c']]
 * undot({ '0.0': 'PHP', '0.1': 'C#', '1': 'Taylor' }); -> [['PHP', 'C#'], 'Taylor']
 * // undot({ "user.languages.0": "PHP" }); -> throws; use Obj.undot
 */
export function undot<TValue, TKey extends UndotArrayKey = number>(
    map: Record<TKey, TValue>,
): UndotResult<TKey, TValue> {
    for (const key of Object.keys(map ?? {})) {
        if (!isArrayIndexPath(key)) {
            throw new TypeError(
                `Arr.undot cannot build an array from the key "${key}": every dot segment must be a non-negative integer. Use Obj.undot for string keys.`,
            );
        }
    }

    return undotExpandArray(map) as UndotResult<TKey, TValue>;
}

/**
 * Union multiple arrays, mirroring PHP's `+` operator: a KEY union, not a
 * value union, folded left-to-right — the first array to occupy an index
 * keeps it. Not `array_merge`/`Collection::merge`, which concatenates.
 *
 * @see Collection::union — `packages/collection/stubs/Collection.php:944`.
 *      Uses PHP's `+` operator (key union: left keys win), not `array_merge`.
 *
 * A `null`/`undefined` operand contributes nothing, matching the
 * `(array) null` cast `getArrayableItems` performs before the `+`.
 *
 * @param arrays - The arrays to union.
 * @returns A new array combining each array's indices, left-most wins.
 */
export function union(): unknown[];
export function union<A>(a: readonly A[]): A[];
export function union<A, B>(a: readonly A[], b: readonly B[]): (A | B)[];
export function union<A, B, C>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
): (A | B | C)[];
export function union<A, B, C, D>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
): (A | B | C | D)[];
export function union<A, B, C, D, E>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
    e: readonly E[],
): (A | B | C | D | E)[];
export function union<A, B, C, D, E, F>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
    e: readonly E[],
    f: readonly F[],
): (A | B | C | D | E | F)[];
export function union(
    ...arrays: (readonly unknown[] | null | undefined)[]
): unknown[];
export function union(
    ...arrays: (readonly unknown[] | null | undefined)[]
): unknown[] {
    let result: unknown[] = [];

    for (const array of arrays) {
        // getArrayableItems casts a null operand to an empty array
        // (EnumeratesValues.php:1106), so it contributes nothing.
        if (isNull(array) || isUndefined(array)) {
            continue;
        }

        // Every index below `result.length` is already occupied by an
        // earlier (left-most-wins) array, so only the tail beyond that
        // point can still contribute — mirroring PHP's `+` key union.
        if (array.length > result.length) {
            result = [...result, ...array.slice(result.length)];
        }
    }

    return result;
}

/**
 * Prepend one or more items to the beginning of the array, mutating it in
 * place, like PHP's array_unshift.
 * Undefined items are skipped.
 *
 * @see Collection::unshift — `packages/collection/stubs/Collection.php:1087`.
 *      Wraps `array_unshift`; mutates.
 *
 * @param data - The array to prepend items to. Mutated in place.
 * @param items - The items to prepend.
 * @returns The same array reference, mutated.
 */
export function unshift<TValue>(data: TValue[]): TValue[];
export function unshift<TValue, A>(data: TValue[], a: A): (TValue | A)[];
export function unshift<TValue, A, B>(
    data: TValue[],
    a: A,
    b: B,
): (TValue | A | B)[];
export function unshift<TValue, A, B, C>(
    data: TValue[],
    a: A,
    b: B,
    c: C,
): (TValue | A | B | C)[];
export function unshift<TValue, A, B, C, D>(
    data: TValue[],
    a: A,
    b: B,
    c: C,
    d: D,
): (TValue | A | B | C | D)[];
export function unshift<TValue>(data: TValue[], ...items: unknown[]): unknown[];
export function unshift<TValue>(
    data: TValue[],
    ...items: unknown[]
): unknown[] {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (!isUndefined(item)) {
            data.unshift(item as TValue);
        }
    }

    return data;
}

/**
 * Get all of the given array except for a specified array of keys.
 *
 * @param  data - The array to remove items from.
 * @param  keys - The keys of the items to remove.
 * @returns A new array with the specified items removed.
 *
 * @example
 *
 * except(["a", "b", "c"], 1); -> ['a', 'c']
 * except(["a", "b", "c"], [0, 2]); -> ['b']
 */
export function except<TValue>(
    data: readonly TValue[],
    keys: PathKeys,
): TValue[] {
    return forget(data, keys);
}

/**
 * Get all of the given array except for a specified array of values.
 *
 * @param data - The array to filter.
 * @param values - The value(s) to exclude from the array.
 * @param strict - Whether to use strict comparison (default: false).
 * @returns A new array with the specified values removed.
 *
 * @example
 *
 * exceptValues(['foo', 'bar', 'baz', 'qux'], ['foo', 'baz']); -> [1 => 'bar', 3 => 'qux']
 * exceptValues([1, 2, 3, 4, 5], [3, 4]); -> [0 => 1, 1 => 2, 4 => 5]
 * exceptValues([1, '1', 2, '2', 3], [1, 2, 3], true); -> [1 => '1', 3 => '2']
 */
export function exceptValues<TValue>(
    data: readonly TValue[],
    values: TValue | readonly TValue[],
    strict: boolean = false,
): TValue[] {
    const valueArray = isArray(values) ? values : [values];

    return data.filter((value) => {
        return !valueArray.some((v) =>
            strict ? value === v : looseEqual(value, v),
        );
    });
}

/**
 * Determine if the given key exists in the provided data structure.
 *
 * @param  data - array to check
 * @param  key  - key to check for
 * @returns True if the key exists, false otherwise.
 *
 * @example
 *
 * exists([1, 2, 3], 0); -> true
 * exists([1, 2, 3], 3); -> false
 */
export function exists<TValue>(data: readonly TValue[], key: PathKey): boolean {
    // Array: only numeric keys are supported
    const idx = isNumber(key) ? key : Number(key);

    if (Number.isNaN(idx)) {
        return false;
    }

    return idx >= 0 && idx < data.length;
}

/**
 * Get the first element of an array or iterable.
 * Optionally pass a callback to find the first matching element.
 *
 * @param data - The array or iterable to search through.
 * @param callback - Optional callback function to test elements.
 * @param defaultValue - Value to return if no element is found.
 * @returns The first element or default value.
 *
 * @example
 *
 * first([1, 2, 3]); -> 1
 * first([]); -> null
 * first([], null, 'default'); -> 'default'
 * first([1, 2, 3], x => x > 1); -> 2
 * first([1, 2, 3], x => x > 5, 'none'); -> 'none'
 */
// Overload: array type with callback for proper type inference
export function first<TValue, TFirstDefault = null>(
    data: TValue[],
    callback: (value: TValue, key: number) => boolean,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: array type without callback
export function first<TValue, TFirstDefault = null>(
    data: TValue[],
    callback?: null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: iterable with callback for proper type inference
export function first<TValue, TFirstDefault = null>(
    data: Iterable<TValue>,
    callback: (value: TValue, key: number) => boolean,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: iterable without callback
export function first<TValue, TFirstDefault = null>(
    data: Iterable<TValue>,
    callback?: null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: non-array fallback
export function first<TValue, TFirstDefault = null>(
    data: unknown,
    callback?: ((value: TValue, key: number) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Implementation
export function first<TValue, TFirstDefault = null>(
    data: ArrayItems<TValue> | unknown,
    callback?: ((value: TValue, key: number) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null {
    const resolveDefault = (): TFirstDefault | null => {
        if (isUndefined(defaultValue)) {
            return null;
        }

        return isFunction(defaultValue)
            ? (defaultValue as () => TFirstDefault)()
            : (defaultValue as TFirstDefault);
    };

    if (isNull(data) || isUndefined(data)) {
        return resolveDefault();
    }

    const isArrayable = isArray(data);
    const iterable: Iterable<TValue> = isArrayable
        ? (data as readonly TValue[])
        : toWalkable<TValue>(data);

    // No callback: just return first element if it exists.
    if (!callback) {
        if (isArrayable) {
            const arr = data as readonly TValue[];
            if (arr.length === 0) {
                return resolveDefault();
            }

            // After length check arr[0] is defined
            return arr[0] as TValue;
        }

        for (const item of iterable) {
            return item; // first
        }

        return resolveDefault();
    }

    // Convert to array to ensure we can iterate properly with callback
    const array = from(data as object);

    if (!isArray(array)) {
        // If from() returns an object, iterate over values
        let index = 0;
        for (const value of Object.values(array)) {
            if (callback(value as TValue, index++)) {
                return value as TValue;
            }
        }

        return resolveDefault();
    }

    let index = 0;
    for (const item of array) {
        if (callback(item as TValue, index++)) {
            return item as TValue;
        }
    }

    return resolveDefault();
}

/**
 * Get the last element of an array or iterable.
 * Optionally pass a callback to find the last matching element.
 *
 * @param data - The array or iterable to search through.
 * @param callback - Optional callback function to test elements.
 * @param defaultValue - Value to return if no element is found.
 * @returns The last element or default value.
 *
 * @example
 *
 * last([1, 2, 3]); -> 3
 * last([]); -> null
 * last([], null, 'default'); -> 'default'
 * last([1, 2, 3], x => x < 3); -> 2
 * last([1, 2, 3], x => x > 5, 'none'); -> 'none'
 */
// Overload: array type with callback for proper type inference
export function last<TValue, TFirstDefault = null>(
    data: TValue[],
    callback: (value: TValue, key: number) => boolean,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: array type without callback
export function last<TValue, TFirstDefault = null>(
    data: TValue[],
    callback?: null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: iterable with callback for proper type inference
export function last<TValue, TFirstDefault = null>(
    data: Iterable<TValue>,
    callback: (value: TValue, key: number) => boolean,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: iterable without callback
export function last<TValue, TFirstDefault = null>(
    data: Iterable<TValue>,
    callback?: null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: non-array fallback
export function last<TValue, TFirstDefault = null>(
    data: unknown,
    callback?: ((value: TValue, key: number) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Implementation
export function last<TValue, TFirstDefault = null>(
    data: ArrayItems<TValue> | unknown,
    callback?: ((value: TValue, key: number) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null {
    const resolveDefault = (): TFirstDefault | null => {
        if (isUndefined(defaultValue)) {
            return null;
        }

        return isFunction(defaultValue)
            ? (defaultValue as () => TFirstDefault)()
            : (defaultValue as TFirstDefault);
    };

    if (isNull(data) || isUndefined(data)) {
        return resolveDefault();
    }

    const isArrayable = isArray(data);
    const iterable: Iterable<TValue> = isArrayable
        ? (data as readonly TValue[])
        : toWalkable<TValue>(data);

    // No callback case
    if (!callback) {
        if (isArrayable) {
            const arr = data as readonly TValue[];
            if (arr.length === 0) {
                return resolveDefault();
            }

            return arr[arr.length - 1] as TValue;
        }

        // Generic iterable: iterate to the end
        let last: TValue | undefined; // track last seen
        let seen = false;
        for (const item of iterable) {
            last = item;
            seen = true;
        }

        return seen ? (last as TValue) : resolveDefault();
    }

    if (isArrayable) {
        const arr = data as readonly TValue[];
        for (let i = arr.length - 1; i >= 0; i--) {
            if (callback(arr[i] as TValue, i)) {
                return arr[i] as TValue;
            }
        }

        return resolveDefault();
    }

    // Non-array iterable: iterate forward keeping last match
    let index = 0;
    let found = false;
    let candidate: TValue | undefined;
    for (const item of iterable) {
        if (callback(item, index)) {
            candidate = item;
            found = true;
        }

        index++;
    }

    return found ? (candidate as TValue) : resolveDefault();
}

/**
 * Take the first or last `limit` items from an array.
 *
 * Positive limit => first `limit` items.
 * Negative limit => last `abs(limit)` items.
 * Oversized | zero => returns entire or empty array accordingly.
 *
 * @param data The array to take items from.
 * @param limit The number of items to take. Positive for first N, negative for last N.
 * @returns A new array containing the taken items.
 *
 * @example
 *
 * take([1, 2, 3, 4, 5], 2); -> [1, 2]
 * take([1, 2, 3, 4, 5], -2); -> [4, 5]
 * take([1, 2, 3], 5); -> [1, 2, 3]
 */
export function take<TValue>(
    data: readonly TValue[] | null | undefined,
    limit: number,
): TValue[] {
    if (!data || limit === 0) {
        return [];
    }

    const length = data.length;
    if (length === 0) {
        return [];
    }

    // Positive: first N
    if (limit > 0) {
        if (limit >= length) {
            return data.slice();
        }

        return data.slice(0, limit);
    }

    // Negative: last abs(N)
    const count = Math.abs(limit);
    if (count >= length) {
        return data.slice();
    }

    return data.slice(length - count);
}

/**
 * Flatten a multi-dimensional array into a single level.
 *
 * @param data The array to flatten.
 * @param depth Maximum depth to flatten. Use Infinity for full flattening.
 * @returns A new flattened array.
 *
 * @example
 *
 * flatten([1, [2, [3, 4]], 5]); -> [1, 2, 3, 4, 5]
 * flatten([1, [2, [3, 4]], 5], 1); -> [1, 2, [3, 4], 5]
 */
export function flatten<TValue>(data: TValue[][], depth?: number): TValue[];
// Overload: readonly-of-readonly 2D array → flattened one level, matching
// the mutable `TValue[][]` overload above. Must sit above the single-level
// `TValue[]` overload below, which would otherwise catch it by inferring
// TValue as the inner (readonly) array type itself, leaving the result
// un-flattened at the type level.
export function flatten<TValue>(
    data: ArrayItems<ArrayItems<TValue>>,
    depth?: number,
): TValue[];
export function flatten<TValue>(data: TValue[], depth?: number): TValue[];
export function flatten(data: unknown, depth?: number): unknown[];
export function flatten<TValue>(
    data: ArrayItems<TValue> | unknown,
    depth: number = Infinity,
): TValue[] {
    const result: TValue[] = [];

    if (!accessible(data)) {
        return result;
    }

    for (const item of data as ArrayItems<TValue>) {
        // Convert objects to arrays of their values (ignoring keys)
        // This matches Laravel's behavior where associative arrays are flattened to just values
        if (isObject(item)) {
            const objectValues = Object.values(item);
            const values =
                depth === 1
                    ? objectValues
                    : flatten(objectValues as ArrayItems<unknown>, depth - 1);

            for (const value of values) {
                result.push(value as TValue);
            }

            continue;
        }

        if (!isArray(item)) {
            result.push(item);

            continue;
        }

        const values =
            depth === 1
                ? (item.slice() as unknown[])
                : flatten(item as ArrayItems<unknown>, depth - 1);

        for (const value of values) {
            result.push(value as TValue);
        }
    }

    return result;
}

/**
 * Flip the indices and values of an array.
 *
 * @param data - The array of items to flip
 * @return - the data items flipped
 *
 * @example
 * flip(['a', 'b', 'c']); -> {a: 0, b: 1, c: 2}
 * flip(['a', 1, null, false, true, 1.5, [], {}]); -> {a: 0, 1: 1}
 */
// Overload: typed array → flipped record
export function flip<TValue>(data: ArrayItems<TValue>): Record<string, number>;
// Overload: unknown fallback
export function flip(data: unknown): Record<string, number>;
// Implementation
export function flip<TValue>(
    data: readonly TValue[] | unknown,
): Record<string, number> {
    if (!accessible(data)) {
        return {};
    }

    // flip the array indices as values and values as keys,
    // skipping values that are not valid PHP array keys
    // e.g ['apple', 'banana', 'cherry'] -> {apple: 0, banana: 1, cherry: 2}
    const result: Record<string, number> = {};

    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (isPhpArrayKey(item)) {
            defineKey(result, String(item), i);
        }
    }

    return result;
}

/**
 * Get a float item from an array using "dot" notation.
 * Throws an error if the value is not a number.
 *
 * @param data - The array to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The float value.
 * @throws Error if the value is not a number.
 *
 * @example
 *
 * float([1.5, 2.3], 1); -> 2.3
 * float([{price: 19.99}], '0.price'); -> 19.99
 * float([{price: 'free'}], '0.price'); -> throws Error
 */
// Overload: typed array → float value
export function float<TValue, TDefault = null>(
    data: ArrayItems<TValue>,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): number;
// Overload: unknown fallback
export function float<TDefault = null>(
    data: unknown,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): number;
// Implementation
export function float<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): number {
    const value = getMixedValue(data, key, defaultValue);

    // Accept both integers and floats as valid numbers
    if (!isNumber(value)) {
        throw new Error(
            `Array value for key [${key}] must be a float, ${typeOf(value)} found.`,
        );
    }

    return value;
}

/**
 * Remove one or many array items from a given array using dot notation.
 *
 * @param  data - The array to remove items from.
 * @param  keys - The keys of the items to remove.
 * @returns A new array with the specified items removed.
 *
 * @example
 *
 * forget(['products', ['desk', [100]]], null); -> ['products', ['desk', [100]]]
 * forget(['products', ['desk', [100]]], '1'); -> ['products']
 * forget(['products', ['desk', [100]]], 1); -> ['products']
 * forget(['products', ['desk', [100]]], '1.1'); -> ['products', ['desk']]
 * forget(['products', ['desk', [100]]], 2); -> ['products', ['desk', [100]]]
 */
export function forget<TValue>(
    data: ArrayItems<TValue>,
    keys: PathKeys,
): TValue[] {
    return forgetKeys(data, keys) as TValue[];
}

/**
 * Get the underlying array or object of items from the given argument.
 *
 * @param items The array, Map, or object to extract from.
 * @returns The underlying array or object.
 *
 * @example
 *
 * from([1, 2, 3]); -> [1, 2, 3]
 * from({ foo: 'bar' }); -> { foo: 'bar' }
 * from(new Map([['foo', 'bar']])); -> { foo: 'bar' }
 * from(new Set([1, 2])); -> [1, 2]
 *
 * @throws Error if items is a WeakMap or a scalar value.
 */
export function from<TValue>(items: ArrayItems<TValue>): TValue[];
export function from<TValue, TKey extends PropertyKey = PropertyKey>(
    items: Map<PropertyKey, TValue>,
): Record<TKey, TValue>;
export function from(
    items: number | string | boolean | symbol | null | undefined,
): never;
export function from<TValue>(items: Iterable<TValue>): TValue[];
export function from(items: object): Record<string, unknown>;
export function from(items: unknown): unknown {
    // Arrays
    if (isArray(items)) {
        return items.slice();
    }

    // Map -> plain object
    if (isMap(items)) {
        const out: Record<string, unknown> = {};

        for (const [k, v] of items as Map<PropertyKey, unknown>) {
            out[String(k)] = v;
        }

        return out;
    }

    // WeakMap cannot be iterated in JS environments
    if (isWeakMap(items)) {
        throw new Error(
            "WeakMap values cannot be enumerated in JavaScript; cannot convert to array of values.",
        );
    }

    // Any other iterable (generators, Sets, iterators) -> array of values
    if (isIterable(items)) {
        return [...items];
    }

    // Plain objects (including new Object(...))
    if (!isNull(items) && isObject(items)) {
        return items as Record<string, unknown>;
    }

    // Scalars not supported
    throw new Error("Items cannot be represented by a scalar value.");
}

/**
 * Get an item from an array using numeric-only dot notation.
 *
 * @param  array - The array to get the item from.
 * @param  key - The key or dot-notated path of the item to get.
 * @param  defaultValue - The default value if key is not found
 * @returns The value or the default
 *
 * @example
 *
 * get(['foo', 'bar', 'baz'], 1); -> 'bar'
 * get(['foo', 'bar', 'baz'], null); -> ['foo', 'bar', 'baz']
 * get(['foo', 'bar', 'baz'], 9, 'default'); -> 'default'
 */
export function get<TValue>(array: TValue[], key: null | undefined): TValue[];
// Overload: literal path + default → resolved path type (trusts literal paths;
// adds | TDefault only for non-literal paths that can't be verified)
export function get<
    TData extends readonly unknown[],
    TPath extends string | number,
    TDefault,
>(
    array: TData,
    key: TPath,
    defaultValue: TDefault | (() => TDefault),
): ArrayResolvePathOrDefault<TData, TPath, TDefault>;
export function get<TValue, TDefault>(
    array: TValue[],
    key: PathKey,
    defaultValue: TDefault | (() => TDefault),
): TValue | TDefault;
// Overload: literal path → resolved path type (no | null when path resolves to
// a specific type; adds | null when path falls back to element type, matching
// TS array access conventions where resolved paths are trusted)
export function get<
    TData extends readonly unknown[],
    TPath extends string | number,
>(array: TData, key: TPath): ArrayResolvePathOrNull<TData, TPath>;
export function get<TValue>(array: TValue[], key: PathKey): TValue | null;
export function get<TValue, TDefault = unknown>(
    array: ArrayItems<TValue> | unknown,
    key: PathKey | null | undefined,
    defaultValue?: TDefault | (() => TDefault) | null,
): TValue | TValue[] | TDefault | null;
export function get<TValue, TDefault = unknown>(
    array: ArrayItems<TValue> | unknown,
    key: PathKey | null | undefined,
    defaultValue: TDefault | (() => TDefault) | null = null,
): TValue | TValue[] | TDefault | null {
    if (isNull(key) || isUndefined(key)) {
        return isArray(array)
            ? (array as TValue[] as unknown as TDefault)
            : isFunction(defaultValue)
              ? (defaultValue as () => TDefault)()
              : defaultValue;
    }

    if (!isArray(array)) {
        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : defaultValue;
    }

    const value = getMixedValue(array, key, null);

    if (!isNull(value)) {
        return value as TDefault;
    }

    return isFunction(defaultValue)
        ? (defaultValue as () => TDefault)()
        : defaultValue;
}

/**
 * Check if an item or items exist in an array using "dot" notation.
 *
 * @param  data - The array to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if the item or items exist, false otherwise.
 *
 * @example
 *
 * has(['foo', 'bar', ['baz', 'qux']], 1); -> true
 * has(['foo', 'bar'], 5); -> false
 * has(['foo', 'bar', ['baz', 'qux']], ['0', '2.1']); -> true
 * has(['foo', 'bar', ['baz', 'qux']], ['0', '2.2']); -> false
 */
// Overload: typed array → existence check
export function has<TValue>(data: ArrayItems<TValue>, keys: PathKeys): boolean;
// Overload: unknown fallback
export function has(data: unknown, keys: PathKeys): boolean;
// Implementation
export function has<TValue>(
    data: ArrayItems<TValue> | unknown,
    keys: PathKeys,
): boolean {
    const keyList = isArray(keys) ? keys : [keys];
    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const k of keyList) {
        if (isNull(k) || isUndefined(k)) {
            return false;
        }

        if (!hasMixed(data, k)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if all keys exist in an array using "dot" notation.
 *
 * @param  data - The array to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if all keys exist, false otherwise.
 *
 * @example
 *
 * hasAll(['foo', 'bar', ['baz', 'qux']], ['0', '2.1']); -> true
 * hasAll(['foo', 'bar', ['baz', 'qux']], ['0', '2.2']); -> false
 */
// Overload: typed array → existence check for all keys
export function hasAll<TValue>(
    data: ArrayItems<TValue>,
    keys: PathKeys,
): boolean;
// Overload: unknown fallback
export function hasAll(data: unknown, keys: PathKeys): boolean;
// Implementation
export function hasAll<TValue>(
    data: ArrayItems<TValue> | unknown,
    keys: PathKeys,
): boolean {
    const keyList = isArray(keys) ? keys : [keys];

    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const key of keyList) {
        if (!has(data as ArrayItems<TValue>, key)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if any of the keys exist in an array using "dot" notation.
 *
 * @param  data - The array to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if any key exists, false otherwise.
 *
 * @example
 *
 * hasAny(['foo', 'bar', ['baz', 'qux']], ['0', '2.2']); -> true
 * hasAny(['foo', 'bar', ['baz', 'qux']], ['3', '4']); -> false
 */
// Overload: typed array → existence check for any key
export function hasAny<TValue>(
    data: ArrayItems<TValue>,
    keys: PathKeys,
): boolean;
// Overload: unknown fallback
export function hasAny(data: unknown, keys: PathKeys): boolean;
// Implementation
export function hasAny<TValue>(
    data: ArrayItems<TValue> | unknown,
    keys: PathKeys,
): boolean {
    if (isNull(keys)) {
        return false;
    }

    const keyList = isArray(keys) ? keys : [keys];
    if (keyList.length === 0) {
        return false;
    }

    if (!accessible(data)) {
        return false;
    }

    for (const key of keyList) {
        if (has(data as ArrayItems<TValue>, key)) {
            return true;
        }
    }

    return false;
}

/**
 * Determine if all items pass the given truth test.
 *
 * Accepts arrays as well as any other iterable such as a generator or a Set,
 * in which case the zero based position of the item is passed as the key.
 *
 * @param  data - The array or iterable to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if all items pass the test, false otherwise.
 *
 * @example
 *
 * every([2, 4, 6], n => n % 2 === 0); -> true
 * every([1, 2, 3], n => n % 2 === 0); -> false
 * every(new Set([2, 4]), n => n % 2 === 0); -> true
 */
// Overload: array type with callback for proper type inference
export function every<TValue>(
    data: TValue[],
    callback: (value: TValue, key: number) => boolean,
): boolean;
// Overload: iterable type with callback for proper type inference
export function every<TValue>(
    data: Iterable<TValue>,
    callback: (value: TValue, key: number) => boolean,
): boolean;
// Overload: non-array fallback
export function every<TValue>(
    data: unknown,
    callback: (value: TValue, key: number) => boolean,
): boolean;
// Implementation
export function every<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, key: number) => boolean,
): boolean {
    if (accessible(data)) {
        const values = getAccessibleValues<TValue>(data);
        for (let i = 0; i < values.length; i++) {
            if (!callback(values[i] as TValue, i)) {
                return false;
            }
        }

        return true;
    }

    // Scalars hold nothing to walk. Everything else is walked positionally,
    // mirroring the foreach fallback Laravel uses for non-array iterables
    if (!isIterable<TValue>(data) && !isObject(data)) {
        return false;
    }

    let index = 0;
    for (const value of toWalkable<TValue>(data)) {
        if (!callback(value, index++)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if some items pass the given truth test.
 *
 * Accepts arrays as well as any other iterable such as a generator or a Set,
 * in which case the zero based position of the item is passed as the key.
 *
 * @param  data - The array or iterable to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if any item passes the test, false otherwise.
 *
 * @example
 *
 * some([1, 2, 3], n => n % 2 === 0); -> true
 * some([1, 3, 5], n => n % 2 === 0); -> false
 * some(new Set([1, 2]), n => n % 2 === 0); -> true
 */
// Overload: array type with callback for proper type inference
export function some<TValue>(
    data: TValue[],
    callback: (value: TValue, key: number) => boolean,
): boolean;
// Overload: iterable type with callback for proper type inference
export function some<TValue>(
    data: Iterable<TValue>,
    callback: (value: TValue, key: number) => boolean,
): boolean;
// Overload: non-array fallback
export function some<TValue>(
    data: unknown,
    callback: (value: TValue, key: number) => boolean,
): boolean;
// Implementation
export function some<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, key: number) => boolean,
): boolean {
    if (accessible(data)) {
        const values = getAccessibleValues<TValue>(data);

        for (let i = 0; i < values.length; i++) {
            if (callback(values[i] as TValue, i)) {
                return true;
            }
        }

        return false;
    }

    // Scalars hold nothing to walk. Everything else is walked positionally,
    // mirroring the foreach fallback Laravel uses for non-array iterables
    if (!isIterable<TValue>(data) && !isObject(data)) {
        return false;
    }

    let index = 0;
    for (const value of toWalkable<TValue>(data)) {
        if (callback(value, index++)) {
            return true;
        }
    }

    return false;
}

/**
 * Get an integer item from an array using "dot" notation.
 *
 * @param  data - The array to get the item from.
 * @param  key - The key or dot-notated path of the item to get.
 * @param  defaultValue - The default value if key is not found
 *
 * @returns The integer value.
 *
 * @throws Error if the value is not an integer.
 *
 * @example
 *
 * integer([10, 20, 30], 1); -> 20
 * integer([10, 20, 30], 5, 100); -> 100
 * integer(["house"], 0); -> Error: The value is not an integer.
 */
// Overload: typed array → integer value
export function integer<TValue, TDefault = null>(
    data: ArrayItems<TValue>,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): number;
// Overload: unknown fallback
export function integer<TDefault = null>(
    data: unknown,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): number;
// Implementation
export function integer<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): number {
    const value = getMixedValue(data, key, defaultValue);

    if (!isInteger(value)) {
        throw new Error(
            `Array value for key [${key}] must be an integer, ${typeOf(value)} found.`,
        );
    }

    return value;
}

/**
 * Join all items using a string. The final items can use a separate glue string.
 *
 * @param  data - The array to join.
 * @param  glue - The string to join all but the last item.
 * @param  finalGlue - The string to join the last item.
 *
 * @example
 *
 * join(['a', 'b', 'c'], ', ') => 'a, b, c'
 * join(['a', 'b', 'c'], ', ', ' and ') => 'a, b and c'
 */
// Overload: typed array → joined string
export function join<TValue>(
    data: ArrayItems<TValue>,
    glue: string,
    finalGlue?: string,
): string;
// Overload: unknown fallback
export function join(data: unknown, glue: string, finalGlue?: string): string;
// Implementation
export function join<TValue>(
    data: ArrayItems<TValue> | unknown,
    glue: string,
    finalGlue: string = "",
): string {
    const values = getAccessibleValues(data);
    const items = values.map((v) => String(v));

    if (finalGlue === "") {
        return items.join(glue);
    }

    const length = items.length;
    if (length === 0) {
        return "";
    }

    if (length === 1) {
        return items[0] as string;
    }

    const head = items.slice(0, -1).join(glue);
    const tail = items[length - 1] as string;

    return head + finalGlue + tail;
}

/**
 * Key an associative array by a field or using a callback.
 *
 * @param data - The array to key.
 * @param keyBy - The field name to key by, or a callback function.
 * @returns A new object keyed by the specified field or callback result.
 *
 * @example
 *
 * keyBy([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}], 'id'); -> {1: {id: 1, name: 'John'}, 2: {id: 2, name: 'Jane'}}
 * keyBy([{name: 'John'}, {name: 'Jane'}], (item) => item.name); -> {John: {name: 'John'}, Jane: {name: 'Jane'}}
 */
// Overload: array type with callback for proper type inference
export function keyBy<TValue extends Record<string, unknown>>(
    data: ArrayItems<TValue>,
    keyBy: ((item: TValue) => string | number | null | undefined) | string,
): Record<string, TValue>;
// Overload: non-array fallback
export function keyBy<TValue extends Record<string, unknown>>(
    data: unknown,
    keyBy: string | ((item: TValue) => string | number | null | undefined),
): Record<string, TValue>;
// Implementation
export function keyBy<TValue extends Record<string, unknown>>(
    data: ArrayItems<TValue> | unknown,
    keyBy: string | ((item: TValue) => string | number | null | undefined),
): Record<string, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const values = data as ArrayItems<TValue>;
    const results: Record<PropertyKey, TValue> = {};

    for (const item of values) {
        let key: PropertyKey;

        if (isFunction(keyBy)) {
            const result = keyBy(item);
            key = isSymbol(result) ? result : stringifyKey(result);
        } else {
            // Use dot notation to get the key value
            const keyValue = getNestedValue(item, keyBy as string);
            key = stringifyKey(keyValue);
        }

        results[key] = item;
    }

    return results;
}

/**
 * Convert a resolved key value to a string key, casting null and undefined
 * to an empty string the way PHP casts null keys.
 *
 * @param keyValue - The resolved key value to convert.
 * @returns The string key.
 */
function stringifyKey(keyValue: unknown): string {
    if (isNull(keyValue) || isUndefined(keyValue)) {
        return "";
    }

    return String(keyValue);
}

/**
 * Prepend the key names of an associative array.
 * Note: This is designed for object-like operations, adapted for arrays with string indices.
 *
 * @param data - The array to process.
 * @param prependWith - The string to prepend to each key.
 * @returns A new array with transformed string-based indices.
 *
 * @example
 *
 * prependKeysWith(['a', 'b', 'c'], 'item_'); -> Creates array with keys: item_0, item_1, item_2
 */
// Overload: typed array → keys prefixed, element type preserved
export function prependKeysWith<TValue>(
    data: ArrayItems<TValue>,
    prependWith: string,
): Record<string, TValue>;
// Overload: unknown fallback
export function prependKeysWith(
    data: unknown,
    prependWith: string,
): Record<string, unknown>;
// Implementation
export function prependKeysWith<TValue>(
    data: ArrayItems<TValue> | unknown,
    prependWith: string,
): Record<string, TValue> {
    const values = getAccessibleValues(data) as TValue[];
    const result: Record<string, TValue> = {};

    for (let i = 0; i < values.length; i++) {
        result[prependWith + i] = values[i] as TValue;
    }

    return result;
}

/**
 * Get a subset of the items from the given array.
 *
 * Mirrors PHP's `(array) $keys` cast in `Arr::only` (Arr.php:744): `null`
 * becomes no keys at all and a bare index becomes a single-index
 * selection, rather than blowing up on a non-iterable.
 *
 * @param data - The array to get items from.
 * @param keys - The index, indices, or null to select.
 * @returns A new array with only the specified indices.
 *
 * @example
 *
 * only(['a', 'b', 'c', 'd'], [0, 2]); -> ['a', 'c']
 * only(['a', 'b', 'c'], 1); -> ['b']
 * only(['a', 'b', 'c'], null); -> []
 */
export function only<TValue>(
    data: ArrayItems<TValue>,
    keys: number | number[] | null,
): TValue[];
export function only(data: unknown, keys: number | number[] | null): unknown[];
export function only<TValue>(
    data: ArrayItems<TValue> | unknown,
    keys: number | number[] | null,
): TValue[] {
    const values = getAccessibleValues(data);
    const result: TValue[] = [];
    const keyList = isArray(keys) ? keys : isNull(keys) ? [] : [keys];

    for (const key of keyList) {
        if (key >= 0 && key < values.length) {
            result.push(values[key] as TValue);
        }
    }

    return result;
}

/**
 * Get a subset of the items from the given array by value.
 *
 * @param data - The array to filter.
 * @param values - The value(s) to include in the result.
 * @param strict - Whether to use strict comparison (default: false).
 * @returns A new array containing only the specified values.
 *
 * @example
 *
 * onlyValues(['foo', 'bar', 'baz', 'qux'], ['foo', 'baz']); -> [0 => 'foo', 2 => 'baz']
 * onlyValues([1, 2, 3, 4, 5], [3, 4]); -> [2 => 3, 3 => 4]
 * onlyValues([1, '1', 2, '2', 3], [1, 2, 3], true); -> [0 => 1, 2 => 2, 4 => 3]
 */
export function onlyValues<TValue>(
    data: readonly TValue[],
    values: TValue | readonly TValue[],
    strict: boolean = false,
): TValue[] {
    const valueArray = isArray(values) ? values : [values];

    return (data as TValue[]).filter((value) => {
        return valueArray.some((v) =>
            strict ? value === v : looseEqual(value, v),
        );
    });
}

/**
 * Select an array of values from each item in the array.
 *
 * @param data - The array to select from.
 * @param keys - The key or keys to select from each item.
 * @returns A new array with selected key/value pairs from each item.
 *
 * @example
 *
 * select([{a: 1, b: 2, c: 3}, {a: 4, b: 5, c: 6}], 'a'); -> [{a: 1}, {a: 4}]
 * select([{a: 1, b: 2}, {a: 3, b: 4}], ['a', 'b']); -> [{a: 1, b: 2}, {a: 3, b: 4}]
 */
// Overload: literal key array → picked element type
export function select<
    TValue extends Record<string, unknown>,
    const TKeys extends readonly (keyof TValue & string)[],
>(data: ArrayItems<TValue>, keys: TKeys): Pick<TValue, TKeys[number]>[];
// Overload: single literal key → picked element type
export function select<
    TValue extends Record<string, unknown>,
    const TKey extends keyof TValue & string,
>(data: ArrayItems<TValue>, keys: TKey): Pick<TValue, TKey>[];
// Overload: non-literal keys or untyped data → opaque records
export function select<TValue extends Record<string, unknown>>(
    data: ArrayItems<TValue> | unknown,
    keys: PathKeys,
): Record<string, unknown>[];
// Implementation
export function select<TValue extends Record<string, unknown>>(
    data: ArrayItems<TValue> | unknown,
    keys: PathKeys,
): Record<string, unknown>[] {
    const values = getAccessibleValues(data);
    const keyList = isArray(keys) ? keys : [keys];

    return values.map((item) => {
        const typedItem = item as TValue;
        const result: Record<string, unknown> = {};

        for (const key of keyList) {
            if (
                isObject(typedItem) &&
                !isNull(key) &&
                !isUndefined(key) &&
                key in typedItem
            ) {
                result[key] = (typedItem as Record<string, unknown>)[key];
            }
        }

        return result;
    });
}

/**
 * Get the values a pluck wildcard segment iterates over, mirroring
 * `data_get()`'s `is_iterable()` check: a PHP `foreach` walks both arrays
 * and associative arrays, so both a JS array and a plain object count
 * here — deliberately not `getAccessibleValues`, which only expands arrays.
 *
 * @param target - The value a `*` segment is expanding; callers bail to
 * `null` before this runs for anything that isn't an array or an object.
 * @returns The values to recurse into.
 */
function getPluckWildcardValues(
    target: unknown[] | Record<PropertyKey, unknown>,
): unknown[] {
    if (isArray(target)) {
        return target;
    }

    return Object.values(target);
}

/**
 * Resolve a pluck path against a single item, expanding `*` segments into an
 * array of the values found at that level. Covers the `data_get()` wildcard
 * behaviour that Laravel's `Arr::pluck` tests exercise, with one known
 * divergence on inputs `ArrTest.php` never reaches: multiple wildcards nest
 * (`[[..], [..]]`) where `data_get` collapses the tail one level
 * (`Arr::collapse`). Align this before building `data_get`-equivalent
 * helpers on top of it.
 *
 * @param item - The item to resolve the path against.
 * @param segments - The already-split path segments.
 * @returns The resolved value, an array of values for a wildcard, or null.
 */
function resolvePluckPath(item: unknown, segments: readonly string[]): unknown {
    if (segments.length === 0) {
        return item;
    }

    const [segment, ...rest] = segments;

    if (segment === "*") {
        if (!isArray(item) && !isObject(item)) {
            return null;
        }

        return getPluckWildcardValues(item).map((value) =>
            resolvePluckPath(value, rest),
        );
    }

    if (isNull(item) || isUndefined(item)) {
        return null;
    }

    const next = getNestedValue(item, segment as string);

    if (isUndefined(next)) {
        return null;
    }

    return resolvePluckPath(next, rest);
}

/**
 * Split a pluck value or key argument into path segments the way Laravel's
 * `explodePluckParameters` does: strings split on dots, arrays pass through.
 *
 * @param path - The path to split.
 * @returns The path segments.
 */
function explodePluckPath(path: string | readonly string[]): string[] {
    if (isArray(path)) {
        return [...path];
    }

    return String(path).split(".");
}

/**
 * Pluck an array of values from an array.
 *
 * @param data - The array to pluck from.
 * @param value - The key path to pluck (a dot-notated string, an array of
 *   segments, or a path containing a `*` wildcard segment), or a callback function.
 * @param key - Optional key path to use as keys in result, or callback function.
 * @returns A new array of plucked values, or a record keyed by the
 *   resolved `key` values when a key is given.
 *
 * @example
 *
 * pluck([{name: 'John', age: 30}, {name: 'Jane', age: 25}], 'name'); -> ['John', 'Jane']
 * pluck([{user: {name: 'John'}}, {user: {name: 'Jane'}}], 'user.name'); -> ['John', 'Jane']
 * pluck([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}], 'name', 'id'); -> {1: 'John', 2: 'Jane'}
 * pluck([{developer: {name: 'Taylor'}}], ['developer', 'name']); -> ['Taylor']
 * pluck([{users: [{first: 'taylor'}, {first: 'dayle'}]}], 'users.*.first'); -> [['taylor', 'dayle']]
 * pluck([{name: 'John'}, {name: 'Jane'}], 'missing'); -> [null, null]
 */
// Overload: literal path + key → record keyed by the key, resolved value type
export function pluck<
    TValue extends Record<string, unknown>,
    const TPath extends string,
>(
    data: ArrayItems<TValue>,
    value: TPath,
    key: string | readonly string[] | ((item: TValue) => string | number),
): Record<string | number, PluckValue<TValue, TPath>>;
// Overload: literal path, no key → array of the resolved value type
export function pluck<
    TValue extends Record<string, unknown>,
    const TPath extends string,
>(data: ArrayItems<TValue>, value: TPath): PluckValue<TValue, TPath>[];
// Overload: closure value + key → record keyed by the key
export function pluck<TValue extends Record<string, unknown>, TResult>(
    data: ArrayItems<TValue>,
    value: (item: TValue) => TResult,
    key: string | readonly string[] | ((item: TValue) => string | number),
): Record<string | number, TResult>;
// Overload: closure value, no key → array of the closure return type
export function pluck<TValue extends Record<string, unknown>, TResult>(
    data: ArrayItems<TValue>,
    value: (item: TValue) => TResult,
): TResult[];
// Overload: with key → returns Record (keyed result)
export function pluck<TValue extends Record<string, unknown>>(
    data: ArrayItems<TValue>,
    value: string | readonly string[] | ((item: TValue) => unknown),
    key: string | readonly string[] | ((item: TValue) => string | number),
): Record<string | number, unknown>;
// Overload: without key → returns array
export function pluck<TValue extends Record<string, unknown>>(
    data: ArrayItems<TValue>,
    value: string | readonly string[] | ((item: TValue) => unknown),
): unknown[];
// Overload: non-array fallback
export function pluck<TValue extends Record<string, unknown>>(
    data: unknown,
    value: string | readonly string[] | ((item: TValue) => unknown),
    key?:
        | string
        | readonly string[]
        | ((item: TValue) => string | number)
        | null,
): unknown[] | Record<string | number, unknown>;
// Implementation
export function pluck<TValue extends Record<string, unknown>>(
    data: ArrayItems<TValue> | unknown,
    value: string | readonly string[] | ((item: TValue) => unknown),
    key:
        | string
        | readonly string[]
        | ((item: TValue) => string | number)
        | null = null,
): unknown[] | Record<string | number, unknown> {
    if (!accessible(data)) {
        return [];
    }

    const values = data as ArrayItems<TValue>;
    // Same predicate as the write branch below — JS truthiness would send
    // key = "" down the array path while the write branch does keyed writes.
    const results: unknown[] | Record<string | number, unknown> =
        isNull(key) || isUndefined(key) ? [] : {};

    for (const item of values) {
        let itemValue: unknown;
        let itemKey: string | number | undefined;

        // Get the value
        if (isFunction(value)) {
            itemValue = value(item);
        } else {
            itemValue = resolvePluckPath(
                item,
                explodePluckPath(value as string | readonly string[]),
            );
        }

        // Get the key if specified
        if (!isNull(key) && !isUndefined(key)) {
            if (isFunction(key)) {
                itemKey = (key as (item: TValue) => string | number)(item);
            } else {
                const nestedKey = resolvePluckPath(
                    item,
                    explodePluckPath(key as string | readonly string[]),
                );
                if (
                    typeof nestedKey === "string" ||
                    typeof nestedKey === "number"
                ) {
                    itemKey = nestedKey;
                } else if (typeof nestedKey === "boolean") {
                    // PHP casts a boolean array key to int (true -> 1,
                    // false -> 0), not to the string "true"/"false".
                    itemKey = nestedKey ? 1 : 0;
                } else if (!isNull(nestedKey)) {
                    itemKey = String(nestedKey) as string;
                }
            }

            // Convert objects with toString to string
            if (!isUndefined(itemKey) && isStringable(itemKey)) {
                itemKey = String(itemKey);
            }
        }

        // Add to results
        if (isNull(key) || isUndefined(key)) {
            (results as unknown[]).push(itemValue);
        } else {
            // PHP casts a null array key to "" — a key path that resolves
            // to null/undefined files the value under "", not "undefined".
            (results as Record<string | number, unknown>)[
                isUndefined(itemKey) ? "" : itemKey
            ] = itemValue;
        }
    }

    return results;
}

/**
 * Get and remove the last N items from the array, mutating it in place,
 * like PHP's array_pop.
 *
 * @see Collection::pop — `packages/collection/stubs/Collection.php:1027`.
 *      Mirrors `array_pop`, called `$count` times from the end; mutates.
 *
 * @param data - The array to pop items from. Mutated in place.
 * @param count - The number of items to pop. Defaults to 1.
 * @returns The popped item when count is 1, an array of popped items
 * (reverse order) otherwise, or null if the array had nothing to pop.
 */
export function pop<TValue>(data: TValue[]): TValue | null;
export function pop<TValue>(data: TValue[], count: number): TValue[];
export function pop<TValue>(
    data: TValue[] | Record<PropertyKey, unknown> | null | undefined,
    count?: number,
): TValue | TValue[] | null;
export function pop<TValue>(
    data: TValue[] | Record<PropertyKey, unknown> | null | undefined,
    count: number = 1,
): TValue | TValue[] | null {
    if (!accessible(data)) {
        return count === 1 ? null : [];
    }

    const values = data as TValue[];

    if (values.length === 0) {
        return count === 1 ? null : [];
    }

    if (count === 1) {
        return values.pop() as TValue;
    }

    const poppedValues: TValue[] = [];
    const actualCount = Math.min(count, values.length);

    for (let i = 0; i < actualCount; i++) {
        poppedValues.push(values.pop() as TValue);
    }

    return poppedValues;
}

/**
 * Run a map over each of the items in the array.
 *
 * @param data - The array to map over.
 * @param callback - The function to call for each item (value, index) => newValue.
 * @returns A new array with transformed values.
 *
 * @example
 *
 * map([1, 2, 3], (value) => value * 2); -> [2, 4, 6]
 * map(['a', 'b'], (value, index) => `${index}:${value}`); -> ['0:a', '1:b']
 */
// Overload: array type with callback for proper type inference
export function map<TValue, TMapReturn>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => TMapReturn,
): TMapReturn[];
// Overload: non-array fallback
export function map<TValue, TMapReturn>(
    data: unknown,
    callback: (value: TValue, index: number) => TMapReturn,
): TMapReturn[];
// Implementation
export function map<TValue, TMapReturn>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, index: number) => TMapReturn,
): TMapReturn[] {
    const values = getAccessibleValues(data) as TValue[];
    const result: TMapReturn[] = [];

    for (let i = 0; i < values.length; i++) {
        result.push(callback(values[i] as TValue, i));
    }

    return result;
}

/**
 * Run an associative map over each of the items.
 * The callback should return an object with key/value pairs.
 *
 * @param data - The array to map.
 * @param callback - Function that returns an object with key/value pairs.
 * @returns A new object with all mapped key/value pairs.
 *
 * @example
 *
 * mapWithKeys([{id: 1, name: 'John'}], (item) => ({[item.name]: item.id})); -> {John: 1}
 * mapWithKeys(['a', 'b'], (value, index) => ({[value]: index})); -> {a: 0, b: 1}
 */
// Overload: array type with callback for proper type inference
export function mapWithKeys<
    TValue,
    TMapWithKeysValue,
    TKey extends number = number,
    TMapWithKeysKey extends string = string,
>(
    data: ArrayItems<TValue>,
    callback: (
        value: TValue,
        index: TKey,
    ) => Record<TMapWithKeysKey, TMapWithKeysValue>,
): Record<TMapWithKeysKey, TMapWithKeysValue>;
// Overload: non-array fallback
export function mapWithKeys<
    TValue,
    TMapWithKeysValue,
    TKey extends number = number,
    TMapWithKeysKey extends string = string,
>(
    data: unknown,
    callback: (
        value: TValue,
        index: TKey,
    ) => Record<TMapWithKeysKey, TMapWithKeysValue>,
): Record<TMapWithKeysKey, TMapWithKeysValue>;
// Implementation
export function mapWithKeys<
    TValue,
    TMapWithKeysValue,
    TKey extends number = number,
    TMapWithKeysKey extends string = string,
>(
    data: ArrayItems<TValue> | unknown,
    callback: (
        value: TValue,
        index: TKey,
    ) => Record<TMapWithKeysKey, TMapWithKeysValue>,
): Record<TMapWithKeysKey, TMapWithKeysValue> {
    if (!accessible(data)) {
        return {} as Record<TMapWithKeysKey, TMapWithKeysValue>;
    }

    const values = data as ArrayItems<TValue>;
    const result = {} as Record<TMapWithKeysKey, TMapWithKeysValue>;

    for (let i = 0; i < values.length; i++) {
        const mappedObject = callback(values[i] as TValue, i as TKey);

        // Merge all key/value pairs from the returned object
        for (const [mapKey, mapValue] of Object.entries(mappedObject)) {
            result[mapKey as TMapWithKeysKey] = mapValue as TMapWithKeysValue;
        }
    }

    return result;
}

/**
 * Run a map over each nested chunk of items, spreading array elements as individual arguments.
 *
 * @param data - The array to map over.
 * @param callback - The function to call with spread arguments from each chunk.
 * @returns A new array with mapped values.
 *
 * @example
 *
 * mapSpread([[1, 2], [3, 4]], (a, b) => a + b); -> [3, 7]
 * mapSpread([['John', 25], ['Jane', 30]], (name, age) => `${name} is ${age}`); -> ['John is 25', 'Jane is 30']
 */
export function mapSpread<T1, TMapReturn>(
    data: ArrayItems<readonly [T1]>,
    callback: (arg1: T1, index: number) => TMapReturn,
): TMapReturn[];
export function mapSpread<T1, T2, TMapReturn>(
    data: ArrayItems<readonly [T1, T2]>,
    callback: (arg1: T1, arg2: T2, index: number) => TMapReturn,
): TMapReturn[];
export function mapSpread<T1, T2, T3, TMapReturn>(
    data: ArrayItems<readonly [T1, T2, T3]>,
    callback: (arg1: T1, arg2: T2, arg3: T3, index: number) => TMapReturn,
): TMapReturn[];
export function mapSpread<T1, T2, T3, T4, TMapReturn>(
    data: ArrayItems<readonly [T1, T2, T3, T4]>,
    callback: (
        arg1: T1,
        arg2: T2,
        arg3: T3,
        arg4: T4,
        index: number,
    ) => TMapReturn,
): TMapReturn[];
export function mapSpread<T1, T2, T3, T4, T5, TMapReturn>(
    data: ArrayItems<readonly [T1, T2, T3, T4, T5]>,
    callback: (
        arg1: T1,
        arg2: T2,
        arg3: T3,
        arg4: T4,
        arg5: T5,
        index: number,
    ) => TMapReturn,
): TMapReturn[];
export function mapSpread<TMapReturn>(
    data: unknown,
    callback: (...args: unknown[]) => TMapReturn,
): TMapReturn[];
// Note: `any[]` here (only, and only in the implementation signature) is
// intentional. The 5 typed overloads above each declare a callback with
// concrete, differently-shaped parameters (`(arg1: T1, index: number)`,
// `(arg1: T1, arg2: T2, index: number)`, ...). TypeScript requires an
// implementation signature to be compatible with every overload it
// implements, and a variadic `(...args: unknown[])` is NOT — `unknown` for
// each parameter is too narrow to accept a real callback whose parameters
// are concrete types (verified: swapping to `unknown[]` here breaks
// exactly on that overload-compatibility check, TS2394). `any[]` is the
// TypeScript-standard escape for this, and is invisible to callers, who
// only ever see the typed overloads or the `unknown[]` fallback above.
export function mapSpread<TMapReturn>(
    data: unknown,
    callback: (...args: any[]) => TMapReturn,
): TMapReturn[] {
    const values = getAccessibleValues(data);
    const result: TMapReturn[] = [];

    for (let i = 0; i < values.length; i++) {
        const chunk = values[i];
        if (isArray(chunk)) {
            // Spread the chunk elements and append the index
            result.push(callback(...chunk, i));
        } else {
            // If chunk is not an array, pass it as single argument with index
            result.push(callback(chunk, i));
        }
    }

    return result;
}

/**
 * Push an item onto the beginning of an array.
 *
 * @param data - The array to prepend to.
 * @param value - The value to prepend.
 * @param key - Optional key for the prepended value (creates object with numeric keys).
 * @returns A new array with the value prepended.
 *
 * @example
 *
 * prepend(['b', 'c'], 'a'); -> ['a', 'b', 'c']
 * prepend([1, 2, 3], 0); -> [0, 1, 2, 3]
 */
// Overload: typed array → array with the value prepended, element type preserved
export function prepend<TValue>(
    data: ArrayItems<TValue>,
    value: TValue,
    key?: number,
): TValue[];
// Overload: unknown fallback
export function prepend<TValue>(
    data: unknown,
    value: TValue,
    key?: number,
): TValue[];
// Implementation
export function prepend<TValue>(
    data: ArrayItems<TValue> | unknown,
    value: TValue,
    key?: number,
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];

    if (!isUndefined(key)) {
        // When key is provided, we need to create a new array with the key-value pair at the beginning
        // This mimics PHP's behavior where ['key' => 'value'] + $array works
        const result: TValue[] = [];
        result[key] = value;
        return result.concat(values);
    }

    return [value, ...values];
}

/**
 * Get a value from the array, and remove it.
 *
 * @param data - The array to pull the item from.
 * @param key - The key or dot-notated path of the item to pull.
 * @param defaultValue - The default value if key is not found.
 * @returns An object containing the pulled value (or default) and the updated array.
 *
 * @example
 *
 * pull(['a', 'b', 'c'], 1); -> { value: 'b', data: ['a', 'c'] }
 * pull(['a', ['b', 'c']], '1.0'); -> { value: 'b', data: ['a', ['c']] }
 * pull(['a', 'b', 'c'], 5, 'x'); -> { value: 'x', data: ['a', 'b', 'c'] }
 * pull(['a', ['b', 'c']], '1.2', 'x'); -> { value: 'x', data: ['a', ['b', 'c']] }
 */
// Overload: typed array without a default
export function pull<TValue>(
    data: ArrayItems<TValue>,
    key: PathKey,
): { value: TValue | null; data: TValue[] };
// Overload: typed array with a default
export function pull<TValue, TDefault>(
    data: ArrayItems<TValue>,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault),
): { value: TValue | TDefault; data: TValue[] };
// Overload: unknown fallback
export function pull<TValue, TDefault = null>(
    data: unknown,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): { value: TValue | TDefault | null; data: TValue[] };
// Implementation
export function pull<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): { value: TValue | TDefault | null; data: TValue[] } {
    const resolveDefault = (): TDefault | null => {
        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : (defaultValue as TDefault);
    };
    if (!accessible(data)) {
        return { value: resolveDefault(), data: [] as TValue[] };
    }

    if (isNull(key) || isUndefined(key)) {
        const original = castableToArray(data)!.slice();

        return { value: resolveDefault(), data: original as TValue[] };
    }

    const root = castableToArray(data)!;
    const { found, value } = getRaw(root, key as number | string);

    if (isFalsy(found)) {
        const original = root.slice();

        return { value: resolveDefault(), data: original as TValue[] };
    }

    const updated = forget(root as TValue[], key as number | string);

    return {
        value: value as unknown as TValue | TDefault | null,
        data: updated,
    };
}

/**
 * Convert the array into a query string.
 *
 * @param data - The array or object to convert to a query string.
 * @returns A URL-encoded query string.
 *
 * @example
 *
 * query({name: 'John', age: 30}); -> 'name=John&age=30'
 * query(['a', 'b', 'c']); -> '0=a&1=b&2=c'
 * query({tags: ['php', 'js']}); -> 'tags[0]=php&tags[1]=js'
 * query({user: {name: 'John', age: 30}}); -> 'user[name]=John&user[age]=30'
 * query({foo: 'bar', bar: true}); -> 'foo=bar&bar=1' (booleans cast like PHP's http_build_query)
 * query({foo: 'bar', bar: false}); -> 'foo=bar&bar=0'
 */
// Overload: typed array → query string
export function query<TValue>(data: ArrayItems<TValue>): string;
// Overload: unknown fallback
export function query(data: unknown): string;
// Implementation
export function query(data: unknown): string {
    if (isNull(data) || isUndefined(data)) {
        return "";
    }

    const encodeKeyComponent = (key: string): string => {
        return encodeURIComponent(key)
            .replace(/%5B/g, "[")
            .replace(/%5D/g, "]");
    };

    // Mirrors PHP's http_build_query scalar casting: booleans become "1"
    // or "0", not JavaScript's "true"/"false"/""; other scalars use
    // String().
    const stringifyQueryValue = (value: unknown): string => {
        if (isBoolean(value)) {
            return value ? "1" : "0";
        }

        return String(value);
    };

    const buildQuery = (obj: unknown, prefix: string = ""): string[] => {
        const parts: string[] = [];

        if (isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                const key = prefix ? `${prefix}[${i}]` : String(i);
                const value = obj[i];

                if (!isNull(value) && !isUndefined(value)) {
                    if (isArray(value) || isObject(value)) {
                        parts.push(...buildQuery(value, key));
                    } else {
                        // Use a custom encoder that doesn't encode [ and ] to match PHP behavior
                        const encodedKey = encodeKeyComponent(key);
                        parts.push(
                            `${encodedKey}=${encodeURIComponent(stringifyQueryValue(value))}`,
                        );
                    }
                }
            }
        } else if (isObject(obj) && !isNull(obj)) {
            for (const [objKey, value] of Object.entries(obj)) {
                const key = prefix ? `${prefix}[${objKey}]` : objKey;

                if (!isNull(value) && !isUndefined(value)) {
                    if (isArray(value) || isObject(value)) {
                        parts.push(...buildQuery(value, key));
                    } else {
                        // Use a custom encoder that doesn't encode [ and ] to match PHP behavior
                        const encodedKey = encodeKeyComponent(key);
                        parts.push(
                            `${encodedKey}=${encodeURIComponent(stringifyQueryValue(value))}`,
                        );
                    }
                }
            }
        } else {
            // Scalar value
            const key = prefix || "0";
            const encodedKey = encodeKeyComponent(key);
            parts.push(
                `${encodedKey}=${encodeURIComponent(stringifyQueryValue(obj))}`,
            );
        }

        return parts;
    };

    return buildQuery(data).join("&");
}

/**
 * Get one or a specified number of random values from an array.
 *
 * @param data - The array to get random values from. Non-array-like input is treated as absent, not as an empty array.
 * @param number - The number of items to return. If null, returns a single item.
 * @param preserveKeys - Whether to preserve the original keys when returning multiple items.
 * @returns A single random item, an array of random items, an empty array when zero or fewer items are requested, or null when no count is given and the input isn't array-like.
 * @throws Error if more items are requested than are available, including requesting a single item (or any positive count) from an empty array.
 *
 * @example
 *
 * random([1, 2, 3]); -> 2 (single random item)
 * random([1, 2, 3], 2); -> [3, 1] (two random items)
 * random(['a', 'b', 'c'], 2, true); -> {1: 'b', 2: 'c'} (with original keys)
 * random([], 0); -> [] (explicitly requesting zero items)
 * random([]); -> throws Error (no items available)
 * random([1, 2], 5); -> throws Error
 */
export function random<TValue>(data: ArrayItems<TValue>): TValue | null;
export function random<TValue>(
    data: ArrayItems<TValue>,
    number: number,
    preserveKeys: true,
): Record<number, TValue>;
export function random<TValue>(
    data: ArrayItems<TValue>,
    number: number,
    preserveKeys?: false,
): TValue[];
export function random<TValue>(
    data: ArrayItems<TValue> | unknown,
    number?: number | null,
    preserveKeys?: boolean,
): TValue | TValue[] | Record<number, TValue> | null;
export function random<TValue>(
    data: ArrayItems<TValue> | unknown,
    number?: number | null,
    preserveKeys: boolean = false,
): TValue | TValue[] | Record<number, TValue> | null {
    const numberProvided = !isNull(number) && !isUndefined(number);

    // Non-array-like input has no Laravel equivalent (PHP's count() would
    // error on it), so it degrades gracefully instead of entering the
    // ported throw/empty logic below, which only applies to real arrays.
    if (!isArray(data)) {
        return numberProvided ? [] : null;
    }

    const values = data as TValue[];
    const count = values.length;
    const requested = numberProvided ? (number as number) : 1;

    if (requested > count) {
        throw new Error(
            `You requested ${requested} items, but there are only ${count} items available.`,
        );
    }

    if (numberProvided && requested <= 0) {
        return [];
    }

    // Generate random indices
    const selectedIndices: number[] = [];
    const availableIndices = Array.from({ length: count }, (_, i) => i);

    for (let i = 0; i < requested; i++) {
        const randomIndex = randomInt(0, availableIndices.length - 1);
        selectedIndices.push(availableIndices[randomIndex] as number);
        availableIndices.splice(randomIndex, 1);
    }

    // If only one item requested, return it directly
    if (!numberProvided) {
        return values[selectedIndices[0] as number] as TValue;
    }

    // Return multiple items
    if (preserveKeys) {
        const result: Record<number, TValue> = {};
        for (const index of selectedIndices) {
            result[index] = values[index] as TValue;
        }

        return result;
    } else {
        return selectedIndices.map((index) => values[index] as TValue);
    }
}

/**
 * Get and remove the first N items from the array, mutating it in place,
 * like PHP's array_shift.
 *
 * Guard order matters: negative count throws, an empty array returns null
 * for any count, a count of zero returns an empty array, then items shift.
 *
 * @see Collection::shift — `packages/collection/stubs/Collection.php:1268`.
 *      Mirrors `array_shift`-style removal from the front, driven by `$count`; mutates.
 *
 * @param data - The array to shift items from. Mutated in place.
 * @param count - The number of items to shift. Defaults to 1.
 * @returns The shifted item(s), or null if the array had nothing to shift.
 * @throws Error if count is negative.
 */
export function shift<TValue>(data: TValue[]): TValue | null;
export function shift<TValue>(data: TValue[], count: number): TValue[];
export function shift<TValue>(
    data: TValue[] | Record<PropertyKey, unknown> | null | undefined,
    count?: number,
): TValue | TValue[] | null;
export function shift<TValue>(
    data: TValue[] | Record<PropertyKey, unknown> | null | undefined,
    count: number = 1,
): TValue | TValue[] | null {
    if (count < 0) {
        throw new Error("Number of shifted items may not be less than zero.");
    }

    if (!accessible(data)) {
        return count === 1 ? null : [];
    }

    const values = data as TValue[];

    if (values.length === 0) {
        return null;
    }

    if (count === 0) {
        return [];
    }

    if (count === 1) {
        return values.shift() as TValue;
    }

    const shiftedValues: TValue[] = [];
    const actualCount = Math.min(count, values.length);

    for (let i = 0; i < actualCount; i++) {
        shiftedValues.push(values.shift() as TValue);
    }

    return shiftedValues;
}

/**
 * Set an array item to a given value using "dot" notation.
 *
 * If no key is given to the method, the entire array will be replaced.
 *
 * @param  array - The array to set the item in.
 * @param  key - The key or dot-notated path of the item to set.
 * @param  value - The value to set.
 * @returns - A new array with the item set, or the value itself when key is null/undefined.
 *
 * @example
 * set(['a', 'b', 'c'], 1, 'x'); -> ['a', 'x', 'c']
 * set(['a', ['b', 'c']], '1.0', 'x'); -> ['a', ['x', 'c']]
 * set(['a', 'b'], null, ['x', 'y']); -> ['x', 'y']
 */
// Overload: null/undefined key → returns the value (replaces entire array)
export function set<TSetValue>(
    array: unknown,
    key: null | undefined,
    value: TSetValue,
): TSetValue;
// Overload: dot-notated path key → nested write, outer element type unchanged
export function set<TValue, TPath extends `${string}.${string}`>(
    array: ArrayItems<TValue>,
    key: TPath,
    value: unknown,
): TValue[];
// Overload: top-level key with a same-type value → preserves array type
// `NoInfer<TValue>` keeps `value` from driving `TValue` on its own, so a
// same-shaped write (e.g. an object matching the element shape) still
// resolves TValue purely from `array` instead of colliding with a second,
// structurally-identical-but-distinct inferred type in the union overload
// below.
export function set<TValue>(
    array: ArrayItems<TValue>,
    key: string | number,
    value: NoInfer<TValue>,
): TValue[];
// Overload: top-level key with a different-type value → union array type
export function set<TValue, TSetValue>(
    array: ArrayItems<TValue>,
    key: string | number,
    value: TSetValue,
): (TValue | TSetValue)[];
// Overload: generic fallback
export function set<TValue>(
    array: unknown,
    key: PathKey | null,
    value: unknown,
): TValue[];
export function set(
    array: unknown,
    key: PathKey | null,
    value: unknown,
): unknown {
    return setMixedImmutable(array, key, value);
}

/**
 * Push one or more items into an array using numeric-only dot notation and return new array.
 *
 * @param data - The array to push items into.
 * @param key - The key or dot-notated path of the array to push into. If null, push into root.
 * @param values - The values to push.
 * @returns A new array with the values pushed in.
 *
 * @example
 *
 * push(['a', 'b'], null, 'c', 'd'); -> ['a', 'b', 'c', 'd']
 * push(['a', ['b']], '1', 'c', 'd'); -> ['a', ['b', 'c', 'd']]
 * push(['a', ['b']], '1.1', 'c'); -> ['a', ['b', 'c']]
 */
// Overload: typed array → element type preserved (including unions)
export function push<TValue>(
    data: ArrayItems<TValue>,
    key: PathKey,
    ...values: TValue[]
): TValue[];
// Overload: unknown fallback
export function push<TValue>(
    data: unknown,
    key: PathKey,
    ...values: TValue[]
): TValue[];
// Implementation
export function push<TValue>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    ...values: TValue[]
): TValue[] {
    return pushWithPath(data, key, ...values);
}

/**
 * Shuffle the given array and return the result.
 *
 * @param data - The array to shuffle.
 * @returns A new shuffled array.
 *
 * @example
 *
 * shuffle([1, 2, 3, 4, 5]); -> [3, 1, 5, 2, 4] (random order)
 * shuffle(['a', 'b', 'c']); -> ['c', 'a', 'b'] (random order)
 */
export function shuffle<TValue>(data: ArrayItems<TValue>): TValue[];
export function shuffle(data: unknown): unknown[];
export function shuffle<TValue>(data: ArrayItems<TValue> | unknown): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const result = values.slice();

    // Fisher-Yates shuffle algorithm
    for (let i = result.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [result[i], result[j]] = [result[j] as TValue, result[i] as TValue];
    }

    return result;
}

/**
 * Slice the underlying array items.
 *
 * This is a READ operation that extracts a portion of the array without modifying the original.
 * Similar to JavaScript's Array.slice() and PHP's array_slice(), it returns only the subset.
 *
 * For a WRITE operation that tracks removed elements, use `splice()` instead.
 *
 * @see Collection::slice — `packages/collection/stubs/Collection.php:1369`.
 *      Wraps `array_slice($items, $offset, $length, preserveKeys: true)`.
 *
 * @param data - The array to slice
 * @param offset - The starting index
 * @param length - The number of items to include (negative means stop that many from the end)
 * @returns Sliced array (subset of the original)
 *
 * @example
 *
 * slice([1, 2, 3, 4], 1, 2); -> [2, 3]
 * slice([1, 2, 3, 4], 1, -1); -> [2, 3]
 * slice([1, 2, 3, 4], 2); -> [3, 4]
 * slice([1, 2, 3, 4, 5, 6, 7, 8], -2, 5); -> [7, 8]
 */
export function slice<TValue>(
    data: ArrayItems<TValue>,
    offset: number,
    length?: number | null,
): TValue[];
// Overload: unknown fallback — genuinely `unknown`, not `ArrayItems<TValue>
// | unknown` (which collapses to the same thing but implies TValue narrows
// when it never does).
export function slice<TValue>(
    data: unknown,
    offset: number,
    length?: number | null,
): TValue[];
export function slice<TValue>(
    data: ArrayItems<TValue> | unknown,
    offset: number,
    length: number | null = null,
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    const values = (data as ArrayItems<TValue>).slice();

    // Normalise a negative offset against the length BEFORE combining it
    // with length, matching array_slice — a raw negative offset fed
    // straight into Array.prototype.slice combines the two differently.
    const start = offset < 0 ? Math.max(values.length + offset, 0) : offset;
    const end = isNull(length)
        ? undefined
        : length >= 0
          ? start + length
          : Math.max(start, values.length + length);

    return values.slice(start, end);
}

/**
 * Get the first item in the array, but only if exactly one item exists. Otherwise, throw an exception.
 *
 * @param data - The array to check.
 * @param callback - Optional callback to filter items.
 * @returns The single item in the array.
 * @throws Error if no items or multiple items exist.
 *
 * @example
 *
 * sole([42]); -> 42
 * sole([1, 2, 3], (value) => value > 2); -> 3
 * sole([]); -> throws Error: No items found
 * sole([1, 2]); -> throws Error: Multiple items found (2 items)
 * sole([1, 2, 3], (value) => value > 1); -> throws Error: Multiple items found (2 items)
 */
// Overload: array type with callback for proper type inference
export function sole<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => boolean,
): TValue;
// Overload: array type without callback
export function sole<TValue>(
    data: ArrayItems<TValue>,
    callback?: undefined,
): TValue;
// Overload: non-array fallback
export function sole<TValue>(
    data: unknown,
    callback?: (value: TValue, index: number) => boolean,
): TValue;
// Implementation
export function sole<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback?: (value: TValue, index: number) => boolean,
): TValue {
    const values = getAccessibleValues(data) as TValue[];

    if (values.length === 0) {
        throw new Error("No items found");
    }

    let filteredValues: TValue[];

    if (callback) {
        // Filter using the callback
        filteredValues = [];
        for (let i = 0; i < values.length; i++) {
            const value = values[i] as TValue;
            if (callback(value, i)) {
                filteredValues.push(value);
            }
        }
    } else {
        // Use all values
        filteredValues = values.slice();
    }

    const count = filteredValues.length;

    if (count === 0) {
        throw new Error("No items found");
    }

    if (count > 1) {
        throw new Error(`Multiple items found (${count} items)`);
    }

    return filteredValues[0] as TValue;
}

/**
 * Build a comparator from a single sort descriptor.
 *
 * A tuple's direction follows Laravel's array-form multi-sort semantics:
 * `true`/`'asc'`/`"Ascending"` sorts ascending, any other explicit value
 * sorts descending, and an omitted direction defaults to ascending.
 *
 * @param spec - The key path, `[key]`/`[key, direction]` tuple, or comparator.
 * @param forceDescending - Forces descending on a key path or tuple; has no effect on a comparator function.
 * @returns A comparator for the descriptor.
 */
function sortSpecComparator<TValue>(
    spec: SortSpec<TValue>,
    forceDescending: boolean,
): (a: TValue, b: TValue) => number {
    if (isFunction(spec)) {
        return spec as (a: TValue, b: TValue) => number;
    }

    if (isArray(spec)) {
        const [key, direction] = spec as readonly [
            string,
            (boolean | "Ascending" | "Descending" | "asc" | "desc")?,
        ];
        const isAscending =
            isUndefined(direction) ||
            direction === true ||
            direction === "asc" ||
            direction === SortDirection.Ascending;
        const isDescending = forceDescending || !isAscending;

        return (a, b) => {
            const comparison = compareValues(
                getNestedValue(a as Record<string, unknown>, key),
                getNestedValue(b as Record<string, unknown>, key),
            );

            return isDescending ? -comparison : comparison;
        };
    }

    return (a, b) => {
        const comparison = compareValues(
            getNestedValue(a as Record<string, unknown>, spec as string),
            getNestedValue(b as Record<string, unknown>, spec as string),
        );

        return forceDescending ? -comparison : comparison;
    };
}

/**
 * Sort by a list of descriptors, falling through to the next descriptor
 * whenever the current one ties. Shared by `sort` and `sortDesc`'s
 * multi-key branches; only `forceDescending` differs between them.
 *
 * @param result - The array to sort in place.
 * @param specs - The sort descriptors to apply in order.
 * @param forceDescending - Forwarded to {@linkcode sortSpecComparator} for every descriptor.
 * @returns The sorted array (same reference as `result`).
 */
function sortByComparators<TValue>(
    result: TValue[],
    specs: readonly SortSpec<TValue>[],
    forceDescending = false,
): TValue[] {
    const comparators = specs.map((spec) =>
        sortSpecComparator<TValue>(spec, forceDescending),
    );

    return result.sort((a, b) => {
        for (const comparator of comparators) {
            const comparison = comparator(a, b);

            if (comparison !== 0) {
                return comparison;
            }
        }

        return 0;
    });
}

/**
 * Sort the array using the given callback, "dot" notation, or an array of
 * sort descriptors for multi-key sorting.
 *
 * @param data - The array to sort.
 * @param callback - The sorting callback, field name, an array of sort descriptors, or null for natural sorting.
 * @returns A new sorted array.
 *
 * @example
 *
 * sort([3, 1, 4, 1, 5]); -> [1, 1, 3, 4, 5]
 * sort(['banana', 'apple', 'cherry']); -> ['apple', 'banana', 'cherry']
 * sort([{name: 'John', age: 25}, {name: 'Jane', age: 30}], 'age'); -> sorted by age
 * sort([{name: 'John', age: 25}, {name: 'Jane', age: 30}], (item) => item.name); -> sorted by name
 * sort([{name: 'John', age: 25}, {name: 'John', age: 30}], ['name', ['age', false]]); -> sorted by name asc, then age desc
 */
// Overload: array of sort descriptors → element type preserved
export function sort<TValue>(
    data: ArrayItems<TValue>,
    callback: readonly SortSpec<TValue>[],
): TValue[];
// Overload: array type with callback for proper type inference
export function sort<TValue>(
    data: ArrayItems<TValue>,
    callback:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): TValue[];
// Overload: array type without callback (natural sorting)
export function sort<TValue>(data: ArrayItems<TValue>): TValue[];
// Overload: non-array fallback
export function sort<TValue>(
    data: unknown,
    callback?:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): TValue[];
// Implementation
export function sort<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null = null,
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const result = values.slice();

    if (isArray(callback)) {
        // Must be checked before isFalsy: an empty descriptor array is
        // falsy too, but an empty array here is a stable no-op, not a
        // natural-value sort.
        return sortByComparators(
            result,
            callback as readonly SortSpec<TValue>[],
        );
    }

    if (isFalsy(callback)) {
        // Natural sorting - use compareValues for proper numeric/string comparison
        return result.sort((a, b) => compareValues(a, b));
    }

    if (isString(callback)) {
        // Sort by field name using dot notation
        return result.sort((a, b) => {
            const aValue = getNestedValue(
                a as Record<string, unknown>,
                callback,
            );
            const bValue = getNestedValue(
                b as Record<string, unknown>,
                callback,
            );

            return compareValues(aValue, bValue);
        });
    }

    if (isFunction(callback)) {
        // Extract sort values using callback, then sort by those values
        const indexed = result.map((value, key) => ({
            value,
            sortKey: callback(value, key),
        }));

        indexed.sort((a, b) => compareValues(a.sortKey, b.sortKey));

        return indexed.map((item) => item.value);
    }

    return result;
}

/**
 * Sort the array in descending order using the given callback, "dot"
 * notation, or an array of sort descriptors for multi-key sorting.
 *
 * @param data - The array to sort.
 * @param callback - The sorting callback, field name, an array of sort descriptors, or null for natural sorting.
 * @returns A new sorted array in descending order.
 *
 * @example
 *
 * sortDesc([3, 1, 4, 1, 5]); -> [5, 4, 3, 1, 1]
 * sortDesc(['banana', 'apple', 'cherry']); -> ['cherry', 'banana', 'apple']
 * sortDesc([{name: 'John', age: 25}, {name: 'Jane', age: 30}], 'age'); -> sorted by age desc
 * sortDesc([{name: 'John', age: 25}, {name: 'Jane', age: 30}], (item) => item.name); -> sorted by name desc
 * sortDesc([{name: 'John', age: 25}, {name: 'John', age: 30}], ['name', ['age', false]]); -> each descriptor's comparison is reversed
 */
// Overload: array of sort descriptors → element type preserved
export function sortDesc<TValue>(
    data: ArrayItems<TValue>,
    callback: readonly SortSpec<TValue>[],
): TValue[];
// Overload: array type with callback for proper type inference
export function sortDesc<TValue>(
    data: ArrayItems<TValue>,
    callback:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): TValue[];
// Overload: array type without callback (natural sorting)
export function sortDesc<TValue>(data: ArrayItems<TValue>): TValue[];
// Overload: non-array fallback
export function sortDesc<TValue>(
    data: unknown,
    callback?:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): TValue[];
// Implementation
export function sortDesc<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback?:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const result = values.slice();

    if (isArray(callback)) {
        // Every descriptor's own direction is overridden to descending; a
        // comparator function is unaffected. Checked before the
        // natural-sort branch: an empty descriptor array is falsy too,
        // but is a stable no-op here, not a natural-value sort.
        return sortByComparators(
            result,
            callback as readonly SortSpec<TValue>[],
            true,
        );
    }

    if (!callback) {
        // Natural sorting in descending order - use compareValues (reversed)
        // for proper numeric/string comparison, matching `sort`'s ascending
        // branch. A bare `.sort().reverse()` coerces every element to a
        // string and compares by UTF-16 code unit, which is wrong for
        // multi-digit numbers (e.g. "10" sorts before "9" lexicographically)
        // and unstable for ties.
        return result.sort((a, b) => compareValues(b, a));
    }

    if (isString(callback)) {
        // Sort by field name using dot notation in descending order
        return result.sort((a, b) => {
            const aValue = getNestedValue(
                a as Record<string, unknown>,
                callback,
            );
            const bValue = getNestedValue(
                b as Record<string, unknown>,
                callback,
            );

            return compareValues(bValue, aValue); // Reverse order
        });
    }

    if (isFunction(callback)) {
        // Sort by callback result in descending order
        // Same indexed shape as `sort`, so the callback sees the key too.
        const indexed = result.map((value, key) => ({
            value,
            sortKey: callback(value, key),
        }));

        indexed.sort((a, b) => compareValues(b.sortKey, a.sortKey));

        return indexed.map((item) => item.value);
    }

    return result;
}

/**
 * Recursively sort an array by keys and values.
 *
 * @param data - The array to sort recursively.
 * @param options - Sort options (currently unused, for PHP compatibility).
 * @param descending - Whether to sort in descending order.
 * @returns A new recursively sorted array.
 *
 * @example
 *
 * sortRecursive({ b: [3, 1, 2], a: { d: 2, c: 1 } }); -> { a: { c: 1, d: 2 }, b: [1, 2, 3] }
 * sortRecursive([{ name: 'john', age: 30 }, { name: 'jane', age: 25 }]); -> sorted objects with sorted keys
 */
export function sortRecursive<TValue>(
    data: ArrayItems<TValue>,
    descending?: CaseValue<typeof SortDirection> | boolean,
): TValue[];
export function sortRecursive<TValue>(
    data: ArrayItems<TValue> | Record<string, unknown> | unknown,
    descending?: CaseValue<typeof SortDirection> | boolean,
): TValue[] | Record<string, unknown>;
export function sortRecursive<TValue>(
    data: ArrayItems<TValue> | Record<string, unknown> | unknown,
    descending: CaseValue<typeof SortDirection> | boolean = false,
): TValue[] | Record<string, unknown> {
    const isDesc =
        descending === true || descending === SortDirection.Descending;
    if (!accessible(data) && !isObject(data)) {
        return data as unknown as TValue[];
    }

    let result: TValue[] | Record<string, unknown>;

    if (isArray(data)) {
        result = data.slice() as TValue[];
    } else {
        result = { ...data } as Record<string, unknown>;
    }

    // Recursively sort nested arrays/objects
    if (isArray(result)) {
        // First recursively sort nested elements
        for (let i = 0; i < result.length; i++) {
            const item = result[i];
            if (isArray(item) || isObject(item)) {
                result[i] = sortRecursive(item, isDesc) as TValue;
            }
        }

        // Then sort the array values
        result.sort((a, b) => {
            const comparison = compareValues(a, b);
            return isDesc ? -comparison : comparison;
        });
    } else {
        // Sort object properties
        const entries = Object.entries(result);

        // Recursively sort nested values first
        for (const [key, value] of entries) {
            if (isArray(value) || (isObject(value) && !isNull(value))) {
                result[key] = sortRecursive(value, isDesc);
            }
        }

        // Sort object keys
        const sortedEntries = entries.sort(([keyA], [keyB]) => {
            const comparison = compareValues(keyA, keyB);
            return isDesc ? -comparison : comparison;
        });

        // Rebuild object with sorted keys
        const sortedResult: Record<string, unknown> = {};
        for (const [key] of sortedEntries) {
            sortedResult[key] = result[key];
        }
        result = sortedResult;
    }

    return result;
}

/**
 * Recursively sort an array by keys and values in descending order.
 *
 * @param data - The array to sort recursively in descending order.
 * @param options - Sort options (currently unused, for PHP compatibility).
 * @returns A new recursively sorted array in descending order.
 *
 * @example
 *
 * sortRecursiveDesc({ a: [1, 2, 3], b: { c: 1, d: 2 } }); -> { b: { d: 2, c: 1 }, a: [3, 2, 1] }
 */
export function sortRecursiveDesc<TValue>(data: ArrayItems<TValue>): TValue[];
export function sortRecursiveDesc<TValue>(
    data: ArrayItems<TValue> | Record<string, unknown> | unknown,
): TValue[] | Record<string, unknown>;
export function sortRecursiveDesc<TValue>(
    data: ArrayItems<TValue> | Record<string, unknown> | unknown,
): TValue[] | Record<string, unknown> {
    return sortRecursive(data, SortDirection.Descending);
}

/**
 * Splice a portion of the underlying array, mutating it in place, like
 * PHP's array_splice.
 *
 * This is a WRITE operation that removes and/or replaces elements and
 * returns what was removed, exactly like JavaScript's own Array.splice().
 *
 * For a READ operation that just extracts a subset without mutating, use
 * `slice()` instead.
 *
 * Replacement values that are arrays will be flattened into the result.
 *
 * @see Collection::splice — `packages/collection/stubs/Collection.php:1755`.
 *      Wraps `array_splice`; mutates.
 *
 * @param data - The array to splice. Mutated in place.
 * @param offset - The starting index
 * @param length - The number of items to remove. Defaults to everything
 * from offset to the end of the array.
 * @param replacement - The replacement items (arrays will be flattened)
 * @returns The removed elements.
 *
 * @example
 *
 * splice(['foo', 'baz'], 1, 1); -> ['baz'], data is now ['foo']
 * splice(['foo', 'baz'], 1, 1, 'bar'); -> ['baz'], data is now ['foo', 'bar']
 * splice(['foo', 'baz'], 1, 0, 'bar'); -> [], data is now ['foo', 'bar', 'baz']
 * splice(['foo', 'baz'], 1, 0, ['bar']); -> [], data is now ['foo', 'bar', 'baz'] // flattened
 * splice(['foo', 'baz'], 1); -> ['baz'], data is now ['foo']
 */
export function splice<TValue, TReplacements>(
    data: TValue[],
    offset: number,
    length?: number,
    ...replacement: TReplacements[]
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    // Flatten replacement if it's an array within an array
    const flatReplacement: TValue[] = [];
    for (const item of replacement) {
        if (accessible(item)) {
            flatReplacement.push(...(item as unknown as TValue[]));
        } else {
            flatReplacement.push(item as unknown as TValue);
        }
    }

    if (isUndefined(length)) {
        // If length is not provided, remove all elements from offset to end
        return data.splice(offset, data.length - offset, ...flatReplacement);
    }

    return data.splice(offset, length, ...flatReplacement);
}

/**
 * Get a string item from an array using "dot" notation.
 * Throws an error if the value is not a string.
 *
 * @param data - The array to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The string value.
 * @throws Error if the value is not a string.
 *
 * @example
 *
 * string(['hello', 'world'], 0); -> 'hello'
 * string([{name: 'John'}], '0.name'); -> 'John'
 * string([{name: 123}], '0.name'); -> throws Error
 */
// Overload: typed array → string value
export function string<TValue, TDefault = null>(
    data: ArrayItems<TValue>,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): string;
// Overload: unknown fallback
export function string<TDefault = null>(
    data: unknown,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): string;
// Implementation
export function string<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): string {
    const value = getMixedValue(data, key, defaultValue);

    if (!isString(value)) {
        throw new Error(
            `Array value for key [${key}] must be a string, ${typeOf(value)} found.`,
        );
    }

    return value;
}

/**
 * Cast a CSS-list value the way PHP casts it when pushed raw into
 * `implode()`/`Str::finish()`: `null` becomes `""`, a boolean becomes
 * `"1"`/`""`, and everything else goes through `String()`.
 */
function cssListItemToString(value: unknown): string {
    if (isNull(value) || isUndefined(value)) {
        return "";
    }

    if (isBoolean(value)) {
        return value ? "1" : "";
    }

    return String(value);
}

/**
 * Conditionally compile CSS classes from an array into a CSS class list.
 *
 * @param data - The array to convert to CSS classes.
 * @returns A string of CSS classes separated by spaces.
 *
 * @example
 *
 * toCssClasses(['font-bold', 'mt-4']); -> 'font-bold mt-4'
 * toCssClasses(['font-bold', 'mt-4', { 'ml-2': true, 'mr-2': false }]); -> 'font-bold mt-4 ml-2'
 * toCssClasses({ 'font-bold': true, 'text-red': false }); -> 'font-bold'
 */
// Overload: typed array or record → CSS class string
export function toCssClasses<TValue>(
    data: ArrayItems<TValue> | Record<string, TValue>,
): string;
// Overload: unknown fallback
export function toCssClasses(
    data: ArrayItems<unknown> | Record<string, unknown> | unknown,
): string;
// Implementation
export function toCssClasses(
    data: ArrayItems<unknown> | Record<string, unknown> | unknown,
): string {
    if (!accessible(data) && !isObject(data)) {
        return "";
    }

    // Handle arrays and objects directly
    let classList: Record<string, unknown>;

    if (isArray(data)) {
        classList = { ...data };
    } else {
        classList = data as Record<string, unknown>;
    }

    const classes: string[] = [];

    for (const [key, value] of Object.entries(classList)) {
        // PHP's is_numeric, not Number()/isNaN — hex, empty/blank
        // strings, and "Infinity" all parse under Number() but aren't
        // PHP-numeric (Arr.php:1214/1237); scientific notation is.
        const numericKey = isPhpNumeric(key);

        if (numericKey) {
            // Numeric key: push the value as-is (PHP-cast), like PHP
            // pushing $constraint straight into the array before implode().
            classes.push(cssListItemToString(value));
        } else {
            // String key: use key as class name if value is truthy
            if (value) {
                classes.push(key);
            }
        }
    }

    return classes.join(" ");
}

/**
 * Conditionally compile CSS styles from an array into a CSS style list.
 *
 * @param data - The array to convert to CSS styles.
 * @returns A string of CSS styles separated by spaces, each ending with semicolon.
 *
 * @example
 *
 * toCssStyles(['font-weight: bold', 'margin-top: 4px']); -> 'font-weight: bold; margin-top: 4px;'
 * toCssStyles(['font-weight: bold', { 'margin-left: 2px': true, 'margin-right: 2px': false }]); -> 'font-weight: bold; margin-left: 2px;'
 */
// Overload: typed array or record → CSS style string
export function toCssStyles<TValue>(
    data: ArrayItems<TValue> | Record<string, TValue>,
): string;
// Overload: unknown fallback
export function toCssStyles(
    data: ArrayItems<unknown> | Record<string, unknown> | unknown,
): string;
// Implementation
export function toCssStyles(
    data: ArrayItems<unknown> | Record<string, unknown> | unknown,
): string {
    if (!accessible(data) && !isObject(data)) {
        return "";
    }

    // Handle arrays and objects directly
    let styleList: Record<string, unknown>;

    if (isArray(data)) {
        styleList = { ...data };
    } else {
        styleList = data as Record<string, unknown>;
    }

    const styles: string[] = [];

    for (const [key, value] of Object.entries(styleList)) {
        // PHP's is_numeric, not Number()/isNaN — hex, empty/blank
        // strings, and "Infinity" all parse under Number() but aren't
        // PHP-numeric (Arr.php:1214/1237); scientific notation is.
        const numericKey = isPhpNumeric(key);

        if (numericKey) {
            // Numeric key: push the value as-is (PHP-cast, then finished),
            // like PHP's Str::finish($constraint, ';').
            styles.push(finish(cssListItemToString(value), ";"));
        } else {
            // String key: use key as style if value is truthy
            if (value) {
                styles.push(finish(key, ";"));
            }
        }
    }

    return styles.join(" ");
}

/**
 * Filter the array using the given callback.
 *
 * @param data - The array to filter.
 * @param callback - The function to call for each item (value, index) => boolean.
 * @returns A new filtered array.
 *
 * @example
 *
 * where([1, 2, 3, 4], (value) => value > 2); -> [3, 4]
 * where(['a', 'b', null, 'c'], (value) => value !== null); -> ['a', 'b', 'c']
 */
// Overload: array type with callback for proper type inference
export function where<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => boolean,
): TValue[];
// Overload: non-array fallback
export function where<TValue>(
    data: unknown,
    callback: (value: TValue, index: number) => boolean,
): TValue[];
// Implementation
export function where<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, index: number) => boolean,
): TValue[] {
    const values = getAccessibleValues(data);
    const result: TValue[] = [];

    for (let i = 0; i < values.length; i++) {
        const value = values[i] as TValue;
        if (callback(value, i)) {
            result.push(value);
        }
    }

    return result;
}

/**
 * Filter the array using the negation of the given callback.
 *
 * @param data - The array to filter.
 * @param callback - The function to call for each item (value, index) => boolean.
 * @returns A new filtered array with items that fail the test.
 *
 * @example
 *
 * reject([1, 2, 3, 4], (value) => value > 2); -> [1, 2]
 * reject(['a', 'b', null, 'c'], (value) => value === null); -> ['a', 'b', 'c']
 */
// Overload: array type with callback for proper type inference
export function reject<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => boolean,
): TValue[];
// Overload: non-array fallback
export function reject<TValue>(
    data: unknown,
    callback: (value: TValue, index: number) => boolean,
): TValue[];
// Implementation
export function reject<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, index: number) => boolean,
): TValue[] {
    return where(data, (value, index) => !callback(value, index));
}

/**
 * Replace the data items with the given replacer items.
 *
 * Supports both arrays and numeric keyed objects as replacement values.
 * When using a numeric keyed object, keys determine positions to replace/add.
 *
 * @see Collection::replace — `packages/collection/stubs/Collection.php:1170`.
 *      Wraps `array_replace`.
 *
 * @param data - The array to replace items in.
 * @param replacerData - The array or numeric keyed object containing items to replace.
 * @returns The modified original array with replaced items.
 *
 * @example
 *
 * replace(['a', 'b', 'c'], ['d', 'e']); -> ['d', 'e', 'c']
 * replace(['a', 'b', 'c'], { 1: 'd', 2: 'e', 3: 'f' }); -> ['a', 'd', 'e', 'f']
 */
// Overload: null/undefined replacer — returns original array unchanged
export function replace<TValue>(
    data: ArrayItems<TValue>,
    replacerData: null | undefined,
): TValue[];
// Overload: array replacer — sequential replacement, no gaps
export function replace<TValue>(
    data: ArrayItems<TValue>,
    replacerData: ArrayItems<TValue>,
): TValue[];
// Overload: array replacer with different type — sequential replacement, no gaps
export function replace<TValue, TReplace>(
    data: ArrayItems<TValue>,
    replacerData: TReplace[],
): (TValue | TReplace)[];
// Overload: object replacer — sparse indices can fill gaps with undefined
export function replace<TValue, TReplace = TValue>(
    data: ArrayItems<TValue>,
    replacerData: Record<number, TReplace>,
): (TValue | TReplace | undefined)[];
// Overload: generic fallback
export function replace<TValue, TReplace = TValue>(
    data: ArrayItems<TValue> | unknown,
    replacerData: ArrayItems<TReplace> | Record<number, TReplace> | unknown,
): (TValue | TReplace | undefined)[];
export function replace<TValue, TReplace = TValue>(
    data: ArrayItems<TValue> | unknown,
    replacerData: ArrayItems<TReplace> | Record<number, TReplace> | unknown,
): (TValue | TReplace | undefined)[] {
    const values = getAccessibleValues(data) as TValue[];

    // Handle null/undefined replacer
    if (isNull(replacerData) || isUndefined(replacerData)) {
        return values;
    }

    // If replacerData is an array, use sequential replacement
    if (isArray(replacerData)) {
        const replacerValues = replacerData as TValue[];
        for (let i = 0; i < replacerValues.length; i++) {
            if (i < values.length) {
                values[i] = replacerValues[i] as TValue;
            } else {
                values.push(replacerValues[i] as TValue);
            }
        }
        return values;
    }

    // If replacerData is an object with numeric keys, replace by index
    if (isObject(replacerData)) {
        const replacerObj = replacerData as Record<number, TValue>;
        for (const key of Object.keys(replacerObj)) {
            const index = parseInt(key, 10);
            if (!isNaN(index)) {
                if (index < values.length) {
                    values[index] = replacerObj[index] as TValue;
                } else {
                    // Fill gaps with undefined if necessary
                    while (values.length < index) {
                        values.push(undefined as unknown as TValue);
                    }
                    values.push(replacerObj[index] as TValue);
                }
            }
        }
        return values;
    }

    return values;
}

/**
 * Recursively replace the data items with the given items.
 *
 * Supports both arrays and numeric keyed objects as replacement values.
 * When an array contains a numeric keyed object, that object represents sparse index replacements.
 * Nested objects with numeric keys are treated as nested array replacements.
 *
 * @see Collection::replaceRecursive — `packages/collection/stubs/Collection.php:1181`.
 *      Wraps `array_replace_recursive`.
 *
 * @param data - The original array to replace items in.
 * @param replacerData - The array or numeric keyed object containing items to replace.
 * @returns The modified original array with replaced items.
 *
 * @example
 *
 * replaceRecursive(['a', 'b', ['c', 'd']], null); -> ['a', 'b', ['c', 'd']]
 * replaceRecursive(['a', 'b', ['c', 'd']], ['z', {2: {1: 'e'}}]); -> ['z', 'b', ['c', 'e']]
 */
// Overload: null/undefined replacer — returns original type unchanged
export function replaceRecursive<TValue>(
    data: ArrayItems<TValue>,
    replacerData: null | undefined,
): TValue[];
// Overload: array replacer with same type — sequential replacement, may fill gaps
export function replaceRecursive<TValue>(
    data: ArrayItems<TValue>,
    replacerData: ArrayItems<TValue>,
): (TValue | undefined)[];
// Overload: array replacer with different type — sequential replacement, may fill gaps
export function replaceRecursive<TValue, TReplace>(
    data: ArrayItems<TValue>,
    replacerData: TReplace[],
): (TValue | TReplace | undefined)[];
// Overload: object replacer — sparse indices can fill gaps with undefined
export function replaceRecursive<TValue, TReplace = TValue>(
    data: ArrayItems<TValue>,
    replacerData: Record<number, TReplace>,
): (TValue | TReplace | undefined)[];
// Overload: generic fallback
export function replaceRecursive<TValue, TReplace = TValue>(
    data: ArrayItems<TValue> | unknown,
    replacerData: ArrayItems<TReplace> | Record<number, TReplace> | unknown,
): (TValue | TReplace | undefined)[];
export function replaceRecursive<TValue, TReplace = TValue>(
    data: ArrayItems<TValue> | unknown,
    replacerData: ArrayItems<TReplace> | Record<number, TReplace> | unknown,
): (TValue | TReplace | undefined)[] {
    const values = getAccessibleValues(data) as TValue[];

    // Handle null/undefined replacer
    if (isNull(replacerData) || isUndefined(replacerData)) {
        return values;
    }

    // Helper function to check if an object is a numeric keyed object
    // TODO: move to utils
    const isNumericKeyedObject = (
        obj: unknown,
    ): obj is Record<number, unknown> => {
        if (!isObject(obj) || isArray(obj)) {
            return false;
        }
        const keys = Object.keys(obj);
        return (
            keys.length > 0 && keys.every((key) => !isNaN(parseInt(key, 10)))
        );
    };

    // Helper function to process a single replacement value
    const processReplacement = (
        originalValue: TValue,
        replacementValue: unknown,
    ): TValue => {
        // Both are arrays or the replacement is a numeric keyed object that should be treated as array
        if (
            isArray(originalValue) &&
            (isArray(replacementValue) ||
                isNumericKeyedObject(replacementValue))
        ) {
            return replaceRecursive(
                originalValue as unknown as ArrayItems<TValue>,
                replacementValue as
                    | ArrayItems<TValue>
                    | Record<number, TReplace>,
            ) as unknown as TValue;
        }

        // Both are objects (non-array, non-numeric-keyed)
        if (
            isObject(originalValue) &&
            isObject(replacementValue) &&
            !isNumericKeyedObject(replacementValue)
        ) {
            return objReplaceRecursive(
                originalValue as unknown as Record<PropertyKey, TValue>,
                replacementValue as unknown as Record<PropertyKey, TValue>,
            ) as unknown as TValue;
        }

        // Otherwise, just replace
        return replacementValue as TValue;
    };

    // If replacerData is an array
    if (isArray(replacerData)) {
        const replacerArray = replacerData as unknown[];

        // Collect all replacements with their intended indices
        const allReplacements: Map<number, unknown> = new Map();
        let currentIndex = 0;

        for (let i = 0; i < replacerArray.length; i++) {
            const item = replacerArray[i];

            // If this item is a numeric keyed object, it represents sparse replacements
            if (isNumericKeyedObject(item)) {
                const numericObj = item as Record<number, unknown>;
                for (const key of Object.keys(numericObj)) {
                    const index = parseInt(key, 10);
                    allReplacements.set(index, numericObj[index]);
                    // Update currentIndex to be after the highest sparse index
                    if (index >= currentIndex) {
                        currentIndex = index + 1;
                    }
                }
            } else {
                // Normal sequential replacement - use currentIndex
                allReplacements.set(currentIndex, item);
                currentIndex++;
            }
        }

        // Apply all replacements
        for (const [index, replacementValue] of allReplacements) {
            if (index < values.length) {
                values[index] = processReplacement(
                    values[index]!,
                    replacementValue,
                );
            } else {
                // Fill gaps with undefined if necessary
                while (values.length < index) {
                    values.push(undefined as TValue);
                }
                values.push(replacementValue as TValue);
            }
        }

        return values;
    }

    // If replacerData is an object with numeric keys, replace by index
    if (isNumericKeyedObject(replacerData)) {
        const replacerObj = replacerData as Record<number, TReplace>;
        for (const key of Object.keys(replacerObj)) {
            const index = parseInt(key, 10);
            if (index < values.length) {
                values[index] = processReplacement(
                    values[index]!,
                    replacerObj[index],
                );
            } else {
                // Fill gaps with undefined if necessary
                while (values.length < index) {
                    values.push(undefined as TValue);
                }
                values.push(replacerObj[index] as unknown as TValue);
            }
        }
        return values;
    }

    return values;
}

/**
 * Reverse the order of the array and return the result.
 *
 * @see Collection::reverse — `packages/collection/stubs/Collection.php:1191`.
 *      Wraps `array_reverse($items, true)` — preserves keys.
 *
 * @param data - The array to reverse.
 * @returns A new array with the items in reverse order.
 *
 * @example
 *
 * reverse([1, 2, 3]); -> [3, 2, 1]
 * reverse(['a', 'b', 'c']); -> ['c', 'b', 'a']
 */
export function reverse<TValue>(data: ArrayItems<TValue>): TValue[];
export function reverse(data: unknown): unknown[];
export function reverse<TValue>(data: ArrayItems<TValue> | unknown): TValue[] {
    const values = getAccessibleValues(data) as TValue[];

    return values.slice().reverse();
}

/**
 * Pad array to the specified length with a value.
 *
 * If size is positive, pads on the right (append).
 * If size is negative, pads on the left (prepend).
 *
 * @see Collection::pad — `packages/collection/stubs/Collection.php:1904`.
 *      Wraps `array_pad`.
 *
 * @param data - The array to pad.
 * @param size - The desired length of the array (negative means pad left).
 * @param value - The value to pad with.
 * @returns A new padded array.
 *
 * @example
 *
 * pad([1, 2, 3], 5, 0); -> [1, 2, 3, 0, 0]
 * pad([1, 2, 3], -5, 0); -> [0, 0, 1, 2, 3]
 */
export function pad<TPadValue, TValue>(
    data: ArrayItems<TValue>,
    size: number,
    value: TPadValue,
): (TValue | TPadValue)[] {
    const values = getAccessibleValues(data) as TValue[];
    const currentLength = values.length;
    const absSize = Math.abs(size);

    // If current length is already >= desired size, no padding needed
    if (absSize <= currentLength) {
        return values;
    }

    const padLength = absSize - currentLength;
    const padArray = Array(padLength).fill(value) as TPadValue[];

    // Negative size means pad at the beginning (prepend)
    if (size < 0) {
        return [...padArray, ...values];
    }

    // Positive size means pad at the end (append)
    return [...values, ...padArray];
}

/**
 * Partition the array into two arrays using the given callback.
 *
 * @param data - The array to partition.
 * @param callback - The function to call for each item (value, index) => boolean.
 * @returns A tuple containing [passed, failed] arrays.
 *
 * @example
 *
 * partition([1, 2, 3, 4], (value) => value > 2); -> [[3, 4], [1, 2]]
 * partition(['a', 'b', null, 'c'], (value) => value !== null); -> [['a', 'b', 'c'], [null]]
 */
// Overload: array type with callback for proper type inference
export function partition<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => boolean,
): [TValue[], TValue[]];
// Overload: non-array fallback
export function partition<TValue>(
    data: unknown,
    callback: (value: TValue, index: number) => boolean,
): [TValue[], TValue[]];
// Implementation
export function partition<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, index: number) => boolean,
): [TValue[], TValue[]] {
    const values = getAccessibleValues(data);
    const passed: TValue[] = [];
    const failed: TValue[] = [];

    for (let i = 0; i < values.length; i++) {
        const value = values[i] as TValue;
        if (callback(value, i)) {
            passed.push(value);
        } else {
            failed.push(value);
        }
    }

    return [passed, failed];
}

/**
 * Filter items where the value is not null.
 *
 * @param data - The array to filter.
 * @returns A new array with null values removed.
 *
 * @example
 *
 * whereNotNull([1, null, 2, undefined, 3]); -> [1, 2, undefined, 3]
 * whereNotNull(['a', null, 'b', null]); -> ['a', 'b']
 */
// Overload: typed array → null removed from the element type
export function whereNotNull<TData extends readonly unknown[]>(
    data: TData,
): NonNullableArray<TData>;
// Overload: unknown fallback
export function whereNotNull(data: unknown): unknown[];
// Implementation
export function whereNotNull<TValue>(
    data: ArrayItems<TValue> | unknown,
): TValue[] {
    return where(data, (value) => !isNull(value));
}

/**
 * Check if an array contains a given value.
 *
 * @see Collection::contains — `packages/collection/stubs/Collection.php:195`.
 *      Value/callback/key-operator-value search; has no `Arr.php` counterpart at all.
 *
 * @param data - The array to search in.
 * @param value - The value to search for.
 * @param strict - Whether to use strict comparison.
 * @returns True if the value is found, false otherwise.
 *
 * @example
 *
 * contains([1, 2, 3], 2); -> true
 * contains(['a', 'b', 'c'], 'd'); -> false
 * contains([1, '1'], '1', true); -> true
 */
// Overload: callback function - infers TValue from array type
export function contains<TValue>(
    data: ArrayItems<TValue>,
    value: (value: TValue, key: number) => boolean,
    strict?: boolean,
): boolean;
// Overload: value comparison - infers TValue from array type
export function contains<TValue>(
    data: ArrayItems<TValue>,
    value: TValue,
    strict?: boolean,
): boolean;
// Overload: non-array fallback
export function contains<TValue>(
    data: unknown,
    value: TValue | ((value: TValue, key: number) => boolean),
    strict?: boolean,
): boolean;
// Implementation
export function contains<TValue>(
    data: ArrayItems<TValue> | unknown,
    value: TValue | ((value: TValue, key: number) => boolean),
    strict = false,
): boolean {
    if (!isArray(data)) {
        return false;
    }

    if (isFunction(value)) {
        return data.some((item, index) =>
            (value as (value: TValue, key: number) => boolean)(
                item as TValue,
                index,
            ),
        );
    }

    if (strict) {
        return data.some((item) => item === value);
    }

    // Use PHP-like loose comparison
    return data.some((item) => looseEqual(item, value));
}

/**
 * Filter the array using a callback function.
 *
 * @see Collection::filter — `packages/collection/stubs/Collection.php:424`.
 *      With a callback, delegates to `Arr::where()`; without one, wraps `array_filter`.
 *
 * @param data - The array to filter.
 * @param callback - Optional callback function to filter items.
 * @returns A new filtered array.
 *
 * @example
 *
 * filter([1, 2, 3, 4], (x) => x > 2); -> [3, 4]
 * filter([1, null, 2, undefined, 3]); -> [1, 2, 3]
 * filter(["0", "", 0, "x"]); -> ["x"]
 * filter(["00", "0.0"]); -> ["00", "0.0"]
 */
// Overload: no callback → PHP-falsy values removed from the element type
export function filter<TData extends readonly unknown[]>(
    data: TData,
): TruthyArray<TData>;
// Overload: with callback → element type preserved
export function filter<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => boolean,
): TValue[];
// Overload: unknown fallback
export function filter<TValue>(
    data: unknown,
    callback?: (value: TValue, index: number) => boolean,
): TValue[];
// Implementation
export function filter<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback?: (value: TValue, index: number) => boolean,
): TValue[] {
    if (!isArray(data)) {
        return [];
    }

    if (!isFunction(callback)) {
        // Filter out PHP-falsy values by default
        return data.filter((value): value is TValue => !isPhpFalsy(value));
    }

    return (data as TValue[]).filter(callback);
}

/**
 * If the given value is not an array and not null, wrap it in one.
 *
 * @param value - The value to wrap.
 * @returns An array containing the value, or an empty array if null.
 *
 * @example
 *
 * wrap('hello'); -> ['hello']
 * wrap(['hello']); -> ['hello']
 * wrap(null); -> []
 * wrap(undefined); -> [undefined]
 */
export function wrap(value: null): [];
export function wrap<TValue>(value: TValue[]): TValue[];
// Overload: readonly array → passed through unchanged (must sit above the
// scalar overload below, which would otherwise match any readonly array as
// a single value to wrap in a one-tuple). Returns `readonly TValue[]`
// because wrap aliases its input array rather than copying it — a mutable
// return type here would allow writes through to the readonly source.
export function wrap<TValue>(value: readonly TValue[]): readonly TValue[];
export function wrap<TValue>(value: TValue): [TValue];
export function wrap<TValue>(value: TValue | null): TValue[] | [] {
    if (isNull(value)) {
        return [];
    }

    return isArray<TValue>(value) ? value : [value];
}

/**
 * Get all keys from an array.
 *
 * @see Collection::keys — `packages/collection/stubs/Collection.php:790`.
 *      Wraps `array_keys`.
 *
 * @param data - The array to get keys from.
 * @returns An array of all keys.
 *
 * @example
 *
 * keys(['name', 'age', 'city']); -> [0, 1, 2]
 * keys([]); -> []
 */
// Overload: typed array → numeric index list
export function keys<TValue>(data: ArrayItems<TValue>): number[];
// Overload: unknown fallback
export function keys(data: unknown): number[];
// Implementation
export function keys<TValue>(data: ArrayItems<TValue> | unknown): number[] {
    if (!accessible(data)) {
        return [];
    }

    return Array.from(data.keys());
}

/**
 * Get all values from an array.
 *
 * @see Collection::values — `packages/collection/stubs/Collection.php:1870`.
 *      Wraps `array_values`.
 *
 * @param data - The array to get values from.
 * @returns An array of all values.
 *
 * @example
 *
 * values(['name', 'age', 'city']); -> ['name', 'age', 'city']
 * values([]); -> []
 */
export function values<TValue>(data: ArrayItems<TValue>): TValue[];
export function values(data: unknown): unknown[];
export function values<TValue>(data: ArrayItems<TValue> | unknown): TValue[] {
    if (!accessible(data)) {
        return [];
    }

    return Array.from((data as ArrayItems<TValue>).values());
}

/**
 * Get the items that are not present in the given array.
 *
 * @see Collection::diff — `packages/collection/stubs/Collection.php:276`.
 *      Wraps `array_diff`.
 *
 * @param data - The original array.
 * @param other - The array to compare against.
 * @returns A new array containing items from data that are not in other.
 *
 * @example
 *
 * diff([1, 2, 3], [2, 3, 4]); -> [1]
 * diff(['a', 'b', 'c'], ['b', 'c', 'd']); -> ['a']
 */
export function diff<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
): TValue[];
export function diff<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
): TValue[];
export function diff<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
): TValue[] {
    if (!accessible(data) && !accessible(other)) {
        return [];
    }

    if (!accessible(data)) {
        return (other as TValue[]).slice() as TValue[];
    }

    if (!accessible(other)) {
        return data.slice() as TValue[];
    }

    const dataArray = data as ArrayItems<TValue>;
    const otherArray = other as ArrayItems<TValue>;
    const result: TValue[] = [];

    for (const item of dataArray) {
        if (!otherArray.includes(item)) {
            result.push(item);
        }
    }

    return result;
}

/**
 * Intersect the data array with the given other array
 *
 * @see Collection::intersect — `packages/collection/stubs/Collection.php:660`.
 *      Wraps `array_intersect`.
 *
 * @param data - The original array
 * @param other - The array to intersect with
 * @param callable - Optional function to compare values
 * @returns A new array containing items present in both arrays
 */
// Overload: with callback - infers TValue and TOther from array types
export function intersect<TValue, TOther>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TOther>,
    callable: (a: TValue, b: TOther) => boolean,
): TValue[];
// Overload: without callback - same type comparison
export function intersect<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
    callable?: null,
): TValue[];
// Overload: non-array fallback
export function intersect<TValue, TOther>(
    data: unknown,
    other: unknown,
    callable?: ((a: TValue, b: TOther) => boolean) | null,
): TValue[];
// Implementation
export function intersect<TValue, TOther = TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TOther> | unknown,
    callable: ((a: TValue, b: TOther) => boolean) | null = null,
): TValue[] {
    if (!accessible(data) || !accessible(other)) {
        return [] as TValue[];
    }

    const dataValues = getAccessibleValues(data) as TValue[];
    const otherValues = getAccessibleValues(other) as TOther[];
    const result: TValue[] = [];

    for (const item of dataValues) {
        const found = isFunction(callable)
            ? otherValues.some((otherItem) => callable(item, otherItem))
            : otherValues.some(
                  (otherItem) => otherItem === (item as unknown as TOther),
              );

        if (found) {
            result.push(item);
        }
    }

    return result;
}

/**
 * Intersect the array with the given items with additional index check.
 * Returns items where both the index AND value match.
 *
 * @see Collection::intersectAssoc — `packages/collection/stubs/Collection.php:683`.
 *      Wraps `array_intersect_assoc`.
 *
 * @param data - The original array
 * @param other - The array to intersect with
 * @returns A new array containing items where both index and value match
 *
 * @example
 *
 * intersectAssoc([1, 2, 3], [2, 3, 4]); -> []
 * intersectAssoc(['a', 'b', 'c'], ['a', 'b', 'd']); -> ['a', 'b']
 * intersectAssoc([1, 2, 3, 4], [5, 2, 3]); -> [2, 3]
 */
// Overload: typed arrays → element type preserved
export function intersectAssoc<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
): TValue[];
// Overload: unknown fallback
export function intersectAssoc(data: unknown, other: unknown): unknown[];
// Implementation
export function intersectAssoc<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
): TValue[] {
    if (!accessible(data) || !accessible(other)) {
        return [] as TValue[];
    }

    const dataValues = getAccessibleValues(data) as TValue[];
    const otherValues = getAccessibleValues(other) as TValue[];
    const result: TValue[] = [];

    for (let index = 0; index < dataValues.length; index++) {
        if (
            index < otherValues.length &&
            dataValues[index] === otherValues[index]
        ) {
            result.push(dataValues[index] as TValue);
        }
    }

    return result;
}

/**
 * Intersect the array with the given items with additional index check, using the callback.
 * The callback is used to compare indices, while values are compared strictly.
 *
 * @see Collection::intersectAssocUsing — `packages/collection/stubs/Collection.php:695`.
 *      Wraps `array_intersect_uassoc`.
 *
 * @param data - The original array
 * @param other - The array to intersect with
 * @param callback - The callback function to compare indices (returns true if indices match)
 * @returns A new array containing items where both index (via callback) and value match
 *
 * @example
 *
 * Example: treat all indices as equal (not very useful, but demonstrates the concept)
 * const alwaysEqual = (a: number, b: number) => true;
 * intersectAssocUsing([1, 2, 3], [1, 2, 3], alwaysEqual); -> [1, 2, 3]
 */
export function intersectAssocUsing<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
    callback: (keyA: number, keyB: number) => boolean,
): TValue[];
export function intersectAssocUsing<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
    callback: (keyA: number, keyB: number) => boolean,
): TValue[];
export function intersectAssocUsing<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
    callback: (keyA: number, keyB: number) => boolean,
): TValue[] {
    if (!accessible(data) || !accessible(other)) {
        return [] as TValue[];
    }

    const dataValues = getAccessibleValues(data) as TValue[];
    const otherValues = getAccessibleValues(other) as TValue[];
    const result: TValue[] = [];

    for (let dataIndex = 0; dataIndex < dataValues.length; dataIndex++) {
        for (
            let otherIndex = 0;
            otherIndex < otherValues.length;
            otherIndex++
        ) {
            if (
                callback(dataIndex, otherIndex) &&
                dataValues[dataIndex] === otherValues[otherIndex]
            ) {
                result.push(dataValues[dataIndex] as TValue);
                break; // Only add once per dataIndex
            }
        }
    }

    return result;
}

/**
 * Intersect the array with the given items by key.
 *
 * @see Collection::intersectByKeys — `packages/collection/stubs/Collection.php:706`.
 *      Wraps `array_intersect_key`.
 *
 * @param data - The original array
 * @param other - The array to intersect with
 * @returns A new array containing items with keys present in both arrays
 */
// Overload: typed array → element type preserved, other array read for indices only
export function intersectByKeys<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<unknown>,
): TValue[];
export function intersectByKeys<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
): TValue[];
export function intersectByKeys<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
): TValue[] {
    if (!accessible(data) || !accessible(other)) {
        return [] as TValue[];
    }

    const dataValues = getAccessibleValues(data) as TValue[];
    const otherValues = getAccessibleValues(other) as TValue[];
    const result: TValue[] = [];

    const otherKeys = new Set<number>(otherValues.map((_, index) => index));

    for (let index = 0; index < dataValues.length; index++) {
        if (otherKeys.has(index)) {
            result.push(dataValues[index] as TValue);
        }
    }

    return result;
}
