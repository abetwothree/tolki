import { Random, Str } from "@laravel-js/str";
import {
    getRaw,
    forgetKeys,
    pushWithPath,
    dotFlatten,
    undotExpandArray,
    getNestedValue,
    getMixedValue,
    setMixed,
    setMixedImmutable,
    hasMixed,
} from "@laravel-js/path";
import type { PathKey, PathKeys } from "packages/types";
import {
    compareValues,
    getAccessibleValues,
    isArray,
    isObject,
    castableToArray,
    isFunction,
} from "@laravel-js/utils";
import type { ArrayInnerValue, ArrayItems } from "@laravel-js/types";

/**
 * Determine whether the given value is array accessible.
 *
 * @example
 *
 * accessible([]); // true
 * accessible([1, 2]); // true
 * accessible({ a: 1, b: 2 }); // false
 */
export function accessible<T>(value: T): value is T & Array<T> {
    return isArray<T>(value);
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
export function arrayable<T>(value: unknown): value is ReadonlyArray<unknown> {
    return isArray<T>(value);
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

export function add<T extends readonly unknown[]>(
    data: T,
    key: PathKey,
    value: unknown,
): unknown[] {
    // Convert to mutable array if it's readonly
    const mutableData = isArray(data) ? (data as unknown[]) : [...data];

    if (getMixedValue(mutableData, key) === null) {
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
export function arrayItem<T, D = null>(
    data: ReadonlyArray<T> | unknown,
    key: PathKey,
    defaultValue: D | (() => D) | null = null,
): unknown[] {
    const value = getMixedValue(data, key, defaultValue);

    if (!isArray(value)) {
        throw new Error(
            `Array value for key [${key}] must be an array, ${typeof value} found.`,
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
export function boolean<T, D = null>(
    data: ReadonlyArray<T> | unknown,
    key: PathKey,
    defaultValue: D | (() => D) | null = null,
): boolean {
    const value = getMixedValue(data, key, defaultValue);

    if (typeof value !== "boolean") {
        throw new Error(
            `Array value for key [${key}] must be a boolean, ${typeof value} found.`,
        );
    }

    return value;
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
export function collapse<T extends Record<string, unknown>[]>(
    data: T,
): Record<string, unknown>;
export function collapse<T extends ReadonlyArray<ReadonlyArray<unknown>>>(
    data: T,
): ArrayInnerValue<T[number]>[];
export function collapse<T extends ReadonlyArray<unknown>>(
    data: T,
): Record<string, unknown> | ArrayInnerValue<T[number]>[] | unknown[];
export function collapse<T extends ReadonlyArray<unknown>>(
    data: T,
): Record<string, unknown> | ArrayInnerValue<T[number]>[] | unknown[] {
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
 * Cross join the given arrays, returning all possible permutations.
 *
 * @param arrays - The arrays to cross join.
 * @return A new array with all combinations of the input arrays.
 *
 * @example
 *
 * crossJoin([1], ["a"]); -> [[1, 'a']]
 */
export function crossJoin<T extends ReadonlyArray<ReadonlyArray<unknown>>>(
    ...arrays: T
): ArrayInnerValue<T[number]>[][] {
    let results: ArrayInnerValue<T[number]>[][] = [[]];

    for (const array of arrays) {
        if (!array.length) {
            return [];
        }

        const next: ArrayInnerValue<T[number]>[][] = [];

        for (const product of results) {
            for (const item of array) {
                next.push([
                    ...product,
                    item as ArrayInnerValue<T[number]>,
                ] as ArrayInnerValue<T[number]>[]);
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
export function divide<A extends readonly unknown[]>(
    array: A,
): [number[], A extends ReadonlyArray<infer V> ? V[] : unknown[]];
export function divide<A extends readonly unknown[]>(
    array: A,
): [number[], A extends ReadonlyArray<infer V> ? V[] : unknown[]] {
    const keys = array.map((_, i) => i);
    return [
        keys,
        array.slice() as unknown as A extends ReadonlyArray<infer V>
            ? V[]
            : unknown[],
    ];
}

/**
 * Flatten a multi-dimensional array with "dot" notation.
 *
 * @param data - The array or to flatten.
 * @param prepend - An optional string to prepend to each key.
 * @returns A new object with dot-notated keys.
 *
 * @example
 *
 * dot(['a', ['b', 'c']]); -> { '0': 'a', '1.0': 'b', '1.1': 'c' }
 */
export function dot(
    data: ReadonlyArray<unknown> | unknown,
    prepend: string = "",
): Record<string, unknown> {
    return dotFlatten(data, prepend);
}

/**
 * Convert a flatten "dot" notation object into an expanded array.
 *
 * @param map - The flat object with dot-notated keys.
 * @returns A new multi-dimensional array.
 *
 * @example
 *
 * undot({ '0': 'a', '1.0': 'b', '1.1': 'c' }); -> ['a', ['b', 'c']]
 * undot({ 'item.0': 'a', 'item.1.0': 'b', 'item.1.1': 'c' }); -> [['b', 'c']]
 */
export function undot(map: Record<string, unknown>): unknown[] {
    return undotExpandArray(map) as unknown[];
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
export function except<T>(data: ReadonlyArray<T>, keys: PathKeys): T[] {
    return forget(data, keys);
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
export function exists<T>(data: readonly T[], key: number | string): boolean {
    // Array: only numeric keys are supported
    const idx = typeof key === "number" ? key : Number(key);
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
export function first<TValue, TFirstDefault = null>(
    data: ArrayItems<TValue>,
    callback?: ((value: TValue, key: number) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null {
    const resolveDefault = (): TFirstDefault | null => {
        if (defaultValue === undefined) {
            return null;
        }

        return typeof defaultValue === "function"
            ? (defaultValue as () => TFirstDefault)()
            : (defaultValue as TFirstDefault);
    };

    if (data == null) {
        return resolveDefault();
    }

    const isArrayable = isArray(data);
    const iterable: Iterable<TValue> = isArrayable
        ? (data as readonly TValue[])
        : (data as Iterable<TValue>);

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

    let index = 0;
    for (const item of iterable) {
        if (callback(item, index++)) {
            return item;
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
export function last<TValue, TFirstDefault = null>(
    data: ArrayItems<TValue>,
    callback?: ((value: TValue, key: number) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null {
    const resolveDefault = (): TFirstDefault | null => {
        if (defaultValue === undefined) {
            return null;
        }

        return typeof defaultValue === "function"
            ? (defaultValue as () => TFirstDefault)()
            : (defaultValue as TFirstDefault);
    };

    if (data == null) {
        return resolveDefault();
    }

    const isArrayable = isArray(data);
    const iterable: Iterable<TValue> = isArrayable
        ? (data as readonly TValue[])
        : (data as Iterable<TValue>);

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
export function take<T>(
    data: readonly T[] | null | undefined,
    limit: number,
): T[] {
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
export function flatten<T>(data: ReadonlyArray<T>, depth?: number): unknown[];
export function flatten(
    data: ReadonlyArray<unknown>,
    depth: number = Infinity,
): unknown[] {
    const result: unknown[] = [];

    for (const item of data) {
        if (!isArray(item)) {
            result.push(item);
            continue;
        }

        const values =
            depth === 1
                ? (item.slice() as unknown[])
                : flatten(item as ReadonlyArray<unknown>, depth - 1);

        for (const value of values) {
            result.push(value);
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
export function float<T, D = null>(
    data: ReadonlyArray<T> | unknown,
    key: PathKey,
    defaultValue: D | (() => D) | null = null,
): number {
    const value = getMixedValue(data, key, defaultValue);

    if (typeof value !== "number") {
        throw new Error(
            `Array value for key [${key}] must be a float, ${typeof value} found.`,
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
export function forget<T>(data: ReadonlyArray<T>, keys: PathKeys): T[] {
    return forgetKeys<T>(data, keys) as T[];
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
 *
 * @throws Error if items is a WeakMap or a scalar value.
 */
export function from<T>(items: ReadonlyArray<T>): T[];
export function from<V>(items: Map<PropertyKey, V>): Record<string, V>;
export function from(
    items: number | string | boolean | symbol | null | undefined,
): never;
export function from(items: object): Record<string, unknown>;
export function from(items: unknown): unknown {
    // Arrays
    if (isArray(items)) {
        return items.slice();
    }

    // Map -> plain object
    if (items instanceof Map) {
        const out: Record<string, unknown> = {};
        for (const [k, v] of items as Map<PropertyKey, unknown>) {
            out[String(k)] = v;
        }
        return out;
    }

    // WeakMap cannot be iterated in JS environments
    if (items instanceof WeakMap) {
        throw new Error(
            "WeakMap values cannot be enumerated in JavaScript; cannot convert to array of values.",
        );
    }

    // Plain objects (including new Object(...))
    if (items !== null && typeof items === "object") {
        return items as Record<string, unknown>;
    }

    // Scalars not supported
    throw new Error("Items cannot be represented by a scalar value.");
}

/**
 * Get an item from an array using numeric-only dot notation.
 *
 * @param  data - The array to get the item from.
 * @param  key - The key or dot-notated path of the item to get.
 * @param  default - The default value if key is not found
 * @returns The value or the default
 *
 * @example
 *
 * get(['foo', 'bar', 'baz'], 1); -> 'bar'
 * get(['foo', 'bar', 'baz'], null); -> ['foo', 'bar', 'baz']
 * get(['foo', 'bar', 'baz'], 9, 'default'); -> 'default'
 */
export function get<T = unknown>(
    array: unknown,
    key: PathKey | null | undefined,
    defaultValue: T | (() => T) | null = null,
): T | null {
    if (key === null || key === undefined) {
        return isArray(array)
            ? (array as T)
            : typeof defaultValue === "function"
              ? (defaultValue as () => T)()
              : defaultValue;
    }

    if (!isArray(array)) {
        return typeof defaultValue === "function"
            ? (defaultValue as () => T)()
            : defaultValue;
    }

    const value = getMixedValue(array, key, null);

    if (value != null) {
        return value as T;
    }

    return typeof defaultValue === "function"
        ? (defaultValue as () => T)()
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
export function has<T>(
    data: ReadonlyArray<T> | unknown,
    keys: PathKeys,
): boolean {
    const keyList = isArray(keys) ? keys : [keys];
    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const k of keyList) {
        if (k == null) return false;
        if (!hasMixed(data, k)) return false;
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
export function hasAll<T>(
    data: ReadonlyArray<T> | unknown,
    keys: PathKeys,
): boolean {
    const keyList = isArray(keys) ? keys : [keys];

    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const key of keyList) {
        if (!has(data as ReadonlyArray<unknown>, key)) {
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
export function hasAny<T>(
    data: ReadonlyArray<T> | unknown,
    keys: PathKeys,
): boolean {
    if (keys == null) {
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
        if (has(data as ReadonlyArray<unknown>, key)) {
            return true;
        }
    }
    return false;
}

/**
 * Determine if all items pass the given truth test.
 *
 * @param  data - The array to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if all items pass the test, false otherwise.
 *
 * @example
 *
 * every([2, 4, 6], n => n % 2 === 0); -> true
 * every([1, 2, 3], n => n % 2 === 0); -> false
 */
export function every<T>(
    data: ReadonlyArray<T> | unknown,
    callback: (value: T, key: number) => boolean,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    const values = getAccessibleValues(data);
    for (let i = 0; i < values.length; i++) {
        if (!callback(values[i] as T, i)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if some items pass the given truth test.
 *
 * @param  data - The array to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if any item passes the test, false otherwise.
 *
 * @example
 *
 * some([1, 2, 3], n => n % 2 === 0); -> true
 * some([1, 3, 5], n => n % 2 === 0); -> false
 */
export function some<T>(
    data: ReadonlyArray<T> | unknown,
    callback: (value: T, key: number) => boolean,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    const values = getAccessibleValues(data);

    for (let i = 0; i < values.length; i++) {
        if (callback(values[i] as T, i)) {
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
 * @param  default - The default value if key is not found
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
export function integer<T, D = null>(
    data: ReadonlyArray<T> | unknown,
    key: PathKey,
    defaultValue: D | (() => D) | null = null,
): number {
    const value = getMixedValue(data, key, defaultValue);

    if (!Number.isInteger(value)) {
        throw new Error(
            `Array value for key [${key}] must be an integer, ${typeof value} found.`,
        );
    }

    return value as number;
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
export function join<T>(
    data: ReadonlyArray<T> | unknown,
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
export function keyBy<T extends Record<string, unknown>>(
    data: ReadonlyArray<T> | unknown,
    keyBy: string | ((item: T) => string | number),
): Record<string | number, T> {
    if (!accessible(data)) {
        return {};
    }

    const values = data as ReadonlyArray<T>;
    const results: Record<string | number, T> = {};

    for (const item of values) {
        let key: string | number;

        if (typeof keyBy === "function") {
            key = keyBy(item);
        } else {
            // Use dot notation to get the key value
            const keyValue = getNestedValue(item, keyBy);
            key = String(keyValue);
        }

        results[key] = item;
    }

    return results;
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
export function prependKeysWith<T>(
    data: ReadonlyArray<T> | unknown,
    prependWith: string,
): Record<string, T> {
    const values = getAccessibleValues(data) as T[];
    const result: Record<string, T> = {};

    for (let i = 0; i < values.length; i++) {
        result[prependWith + i] = values[i] as T;
    }

    return result;
}

/**
 * Get a subset of the items from the given array.
 *
 * @param data - The array to get items from.
 * @param keys - The indices to select.
 * @returns A new array with only the specified indices.
 *
 * @example
 *
 * only(['a', 'b', 'c', 'd'], [0, 2]); -> ['a', 'c']
 * only(['a', 'b', 'c'], [1]); -> ['b']
 */
export function only<T>(data: ReadonlyArray<T> | unknown, keys: number[]): T[] {
    const values = getAccessibleValues(data);
    const result: T[] = [];

    for (const key of keys) {
        if (key >= 0 && key < values.length) {
            result.push(values[key] as T);
        }
    }

    return result;
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
export function select<T extends Record<string, unknown>>(
    data: ReadonlyArray<T> | unknown,
    keys: string | string[],
): Record<string, unknown>[] {
    const values = getAccessibleValues(data);
    const keyList = isArray(keys) ? keys : [keys];

    return values.map((item) => {
        const typedItem = item as T;
        const result: Record<string, unknown> = {};

        for (const key of keyList) {
            if (
                typedItem != null &&
                typeof typedItem === "object" &&
                key in typedItem
            ) {
                result[key] = (typedItem as Record<string, unknown>)[key];
            }
        }

        return result;
    });
}

/**
 * Pluck an array of values from an array.
 *
 * @param data - The array to pluck from.
 * @param value - The key path to pluck, or a callback function.
 * @param key - Optional key path to use as keys in result, or callback function.
 * @returns A new array with plucked values.
 *
 * @example
 *
 * pluck([{name: 'John', age: 30}, {name: 'Jane', age: 25}], 'name'); -> ['John', 'Jane']
 * pluck([{user: {name: 'John'}}, {user: {name: 'Jane'}}], 'user.name'); -> ['John', 'Jane']
 * pluck([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}], 'name', 'id'); -> {1: 'John', 2: 'Jane'}
 */
export function pluck<T extends Record<string, unknown>>(
    data: ReadonlyArray<T> | unknown,
    value: string | ((item: T) => unknown),
    key: string | ((item: T) => string | number) | null = null,
): unknown[] | Record<string | number, unknown> {
    if (!accessible(data)) {
        return [];
    }

    const values = data as ReadonlyArray<T>;
    const results: unknown[] | Record<string | number, unknown> = key ? {} : [];

    for (const item of values) {
        let itemValue: unknown;
        let itemKey: string | number | undefined;

        // Get the value
        if (typeof value === "function") {
            itemValue = value(item);
        } else {
            // Use dot notation to get nested value
            itemValue = getNestedValue(item, value);
        }

        // Get the key if specified
        if (key !== null && key !== undefined) {
            if (typeof key === "function") {
                itemKey = key(item);
            } else {
                itemKey = getNestedValue(item, key) as string | number;
            }

            // Convert objects with toString to string
            if (
                itemKey != null &&
                typeof itemKey === "object" &&
                "toString" in itemKey &&
                typeof (itemKey as { toString: unknown }).toString ===
                    "function"
            ) {
                itemKey = (itemKey as { toString: () => string }).toString();
            }
        }

        // Add to results
        if (key === null || key === undefined) {
            (results as unknown[]).push(itemValue);
        } else {
            (results as Record<string | number, unknown>)[
                itemKey as string | number
            ] = itemValue;
        }
    }

    return results;
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
export function map<T, U>(
    data: ReadonlyArray<T> | unknown,
    callback: (value: T, index: number) => U,
): U[] {
    const values = getAccessibleValues(data) as T[];
    const result: U[] = [];

    for (let i = 0; i < values.length; i++) {
        result.push(callback(values[i] as T, i));
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
export function mapWithKeys<T, K extends string | number, V>(
    data: ReadonlyArray<T> | unknown,
    callback: (value: T, index: number) => Record<K, V>,
): Record<K, V> {
    if (!accessible(data)) {
        return {} as Record<K, V>;
    }

    const values = data as ReadonlyArray<T>;
    const result: Record<K, V> = {} as Record<K, V>;

    for (let i = 0; i < values.length; i++) {
        const mappedObject = callback(values[i] as T, i);

        // Merge all key/value pairs from the returned object
        for (const [mapKey, mapValue] of Object.entries(mappedObject)) {
            result[mapKey as K] = mapValue as V;
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
export function mapSpread<T, U>(
    data: ReadonlyArray<T> | unknown,
    callback: (...args: unknown[]) => U,
): U[] {
    const values = getAccessibleValues(data) as T[];
    const result: U[] = [];

    for (let i = 0; i < values.length; i++) {
        const chunk = values[i] as T;
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
export function prepend<T>(
    data: ReadonlyArray<T> | unknown,
    value: T,
    key?: number,
): T[] {
    const values = getAccessibleValues(data) as T[];

    if (key !== undefined) {
        // When key is provided, we need to create a new array with the key-value pair at the beginning
        // This mimics PHP's behavior where ['key' => 'value'] + $array works
        const result: T[] = [];
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
export function pull<T, D = null>(
    data: ReadonlyArray<T> | unknown,
    key: PathKey,
    defaultValue: D | (() => D) | null = null,
): { value: T | D | null; data: T[] } {
    const resolveDefault = (): D | null => {
        return typeof defaultValue === "function"
            ? (defaultValue as () => D)()
            : (defaultValue as D);
    };
    if (!accessible(data)) {
        return { value: resolveDefault(), data: [] as T[] };
    }
    if (key == null) {
        const original = castableToArray(data)!.slice();
        return { value: resolveDefault(), data: original as T[] };
    }
    const root = castableToArray(data)!;
    const { found, value } = getRaw(root, key as number | string);
    if (!found) {
        const original = root.slice();
        return { value: resolveDefault(), data: original as T[] };
    }
    const updated = forget(root as T[], key as number | string);
    return { value: value as unknown as T | D | null, data: updated };
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
 */
export function query(data: unknown): string {
    if (data === null || data === undefined) {
        return "";
    }

    const encodeKeyComponent = (key: string): string => {
        return encodeURIComponent(key)
            .replace(/%5B/g, "[")
            .replace(/%5D/g, "]");
    };

    const buildQuery = (obj: unknown, prefix: string = ""): string[] => {
        const parts: string[] = [];

        if (isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                const key = prefix ? `${prefix}[${i}]` : String(i);
                const value = obj[i];

                if (value !== null && value !== undefined) {
                    if (typeof value === "object") {
                        parts.push(...buildQuery(value, key));
                    } else {
                        // Use a custom encoder that doesn't encode [ and ] to match PHP behavior
                        const encodedKey = encodeKeyComponent(key);
                        parts.push(
                            `${encodedKey}=${encodeURIComponent(String(value))}`,
                        );
                    }
                }
            }
        } else if (typeof obj === "object" && obj !== null) {
            for (const [objKey, value] of Object.entries(obj)) {
                const key = prefix ? `${prefix}[${objKey}]` : objKey;

                if (value !== null && value !== undefined) {
                    if (typeof value === "object") {
                        parts.push(...buildQuery(value, key));
                    } else {
                        // Use a custom encoder that doesn't encode [ and ] to match PHP behavior
                        const encodedKey = encodeKeyComponent(key);
                        parts.push(
                            `${encodedKey}=${encodeURIComponent(String(value))}`,
                        );
                    }
                }
            }
        } else {
            // Scalar value
            const key = prefix || "0";
            const encodedKey = encodeKeyComponent(key);
            parts.push(`${encodedKey}=${encodeURIComponent(String(obj))}`);
        }

        return parts;
    };

    return buildQuery(data).join("&");
}

/**
 * Get one or a specified number of random values from an array.
 *
 * @param data - The array to get random values from.
 * @param number - The number of items to return. If null, returns a single item.
 * @param preserveKeys - Whether to preserve the original keys when returning multiple items.
 * @returns A single random item, an array of random items, or null if array is empty.
 * @throws Error if more items are requested than available.
 *
 * @example
 *
 * random([1, 2, 3]); -> 2 (single random item)
 * random([1, 2, 3], 2); -> [3, 1] (two random items)
 * random(['a', 'b', 'c'], 2, true); -> {1: 'b', 2: 'c'} (with original keys)
 * random([], 1); -> null
 * random([1, 2], 5); -> throws Error
 */
export function random<T>(
    data: ReadonlyArray<T> | unknown,
    number?: number | null,
    preserveKeys: boolean = false,
): T | T[] | Record<number, T> | null {
    const values = getAccessibleValues(data) as T[];
    const count = values.length;
    const requested = number === null || number === undefined ? 1 : number;

    if (count === 0 || requested <= 0) {
        return number === null || number === undefined ? null : [];
    }

    if (requested > count) {
        throw new Error(
            `You requested ${requested} items, but there are only ${count} items available.`,
        );
    }

    // Generate random indices
    const selectedIndices: number[] = [];
    const availableIndices = Array.from({ length: count }, (_, i) => i);

    for (let i = 0; i < requested; i++) {
        const randomIndex = Random.int(0, availableIndices.length - 1);
        selectedIndices.push(availableIndices[randomIndex] as number);
        availableIndices.splice(randomIndex, 1);
    }

    // If only one item requested, return it directly
    if (number === null || number === undefined) {
        return values[selectedIndices[0] as number] as T;
    }

    // Return multiple items
    if (preserveKeys) {
        const result: Record<number, T> = {};
        for (const index of selectedIndices) {
            result[index] = values[index] as T;
        }
        return result;
    } else {
        return selectedIndices.map((index) => values[index] as T);
    }
}

/**
 * Set an array item to a given value using "dot" notation.
 *
 * If no key is given to the method, the entire array will be replaced.
 *
 * @param  data - The array to set the item in.
 * @param  key - The key or dot-notated path of the item to set.
 * @param  value - The value to set.
 * @returns - A new array with the item set or the original array if the path is invalid.
 *
 * @example
 * set(['a', 'b', 'c'], 1, 'x'); -> ['a', 'x', 'c']
 * set(['a', ['b', 'c']], '1.0', 'x'); -> ['a', ['x', 'c']]
 */
export function set<T>(
    array: ReadonlyArray<T> | unknown,
    key: PathKey | null,
    value: unknown,
): unknown[] {
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
export function push<T>(
    data: T[] | unknown,
    key: PathKey,
    ...values: T[]
): T[] {
    return pushWithPath<T>(data, key, ...values);
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
export function shuffle<T>(data: ReadonlyArray<T> | unknown): T[] {
    const values = getAccessibleValues(data) as T[];
    const result = values.slice();

    // Fisher-Yates shuffle algorithm
    for (let i = result.length - 1; i > 0; i--) {
        // Use the Random.int from @laravel-js/str for secure randomness
        const j = Random.int(0, i);
        [result[i], result[j]] = [result[j] as T, result[i] as T];
    }

    return result;
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
export function sole<T>(
    data: ReadonlyArray<T> | unknown,
    callback?: (value: T, index: number) => boolean,
): T {
    const values = getAccessibleValues(data) as T[];

    if (values.length === 0) {
        throw new Error("No items found");
    }

    let filteredValues: T[];

    if (callback) {
        // Filter using the callback
        filteredValues = [];
        for (let i = 0; i < values.length; i++) {
            const value = values[i] as T;
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

    return filteredValues[0] as T;
}

/**
 * Sort the array using the given callback or "dot" notation.
 *
 * @param data - The array to sort.
 * @param callback - The sorting callback, field name, or null for natural sorting.
 * @returns A new sorted array.
 *
 * @example
 *
 * sort([3, 1, 4, 1, 5]); -> [1, 1, 3, 4, 5]
 * sort(['banana', 'apple', 'cherry']); -> ['apple', 'banana', 'cherry']
 * sort([{name: 'John', age: 25}, {name: 'Jane', age: 30}], 'age'); -> sorted by age
 * sort([{name: 'John', age: 25}, {name: 'Jane', age: 30}], (item) => item.name); -> sorted by name
 */
export function sort<T>(
    data: ReadonlyArray<T> | unknown,
    callback?: ((item: T) => unknown) | string | null,
): T[] {
    const values = getAccessibleValues(data) as T[];
    const result = values.slice();

    if (!callback) {
        // Natural sorting
        return result.sort();
    }

    if (typeof callback === "string") {
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

    if (typeof callback === "function") {
        // Sort by callback result
        return result.sort((a, b) => {
            const aValue = callback(a);
            const bValue = callback(b);

            return compareValues(aValue, bValue);
        });
    }

    return result;
}

/**
 * Sort the array in descending order using the given callback or "dot" notation.
 *
 * @param data - The array to sort.
 * @param callback - The sorting callback, field name, or null for natural sorting.
 * @returns A new sorted array in descending order.
 *
 * @example
 *
 * sortDesc([3, 1, 4, 1, 5]); -> [5, 4, 3, 1, 1]
 * sortDesc(['banana', 'apple', 'cherry']); -> ['cherry', 'banana', 'apple']
 * sortDesc([{name: 'John', age: 25}, {name: 'Jane', age: 30}], 'age'); -> sorted by age desc
 * sortDesc([{name: 'John', age: 25}, {name: 'Jane', age: 30}], (item) => item.name); -> sorted by name desc
 */
export function sortDesc<T>(
    data: ReadonlyArray<T> | unknown,
    callback?: ((item: T) => unknown) | string | null,
): T[] {
    const values = getAccessibleValues(data) as T[];
    const result = values.slice();

    if (!callback) {
        // Natural sorting in descending order
        return result.sort().reverse();
    }

    if (typeof callback === "string") {
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

    if (typeof callback === "function") {
        // Sort by callback result in descending order
        return result.sort((a, b) => {
            const aValue = callback(a);
            const bValue = callback(b);

            return compareValues(bValue, aValue); // Reverse order
        });
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
export function sortRecursive<T>(
    data: ReadonlyArray<T> | Record<string, unknown> | unknown,
    options?: number,
    descending: boolean = false,
): T[] | Record<string, unknown> {
    if (!accessible(data) && typeof data !== "object") {
        return data as unknown as T[];
    }

    let result: T[] | Record<string, unknown>;

    if (isArray(data)) {
        result = data.slice() as T[];
    } else if (typeof data === "object" && data !== null) {
        result = { ...data } as Record<string, unknown>;
    } else {
        result = data as unknown as T[];
    }

    // Recursively sort nested arrays/objects
    if (isArray(result)) {
        // First recursively sort nested elements
        for (let i = 0; i < result.length; i++) {
            const item = result[i];
            if (isArray(item) || (typeof item === "object" && item !== null)) {
                result[i] = sortRecursive(item, options, descending) as T;
            }
        }

        // Then sort the array values
        result.sort((a, b) => {
            const comparison = compareValues(a, b);
            return descending ? -comparison : comparison;
        });
    } else if (typeof result === "object" && result !== null) {
        // Sort object properties
        const entries = Object.entries(result);

        // Recursively sort nested values first
        for (const [key, value] of entries) {
            if (
                isArray(value) ||
                (typeof value === "object" && value !== null)
            ) {
                result[key] = sortRecursive(value, options, descending);
            }
        }

        // Sort object keys
        const sortedEntries = entries.sort(([keyA], [keyB]) => {
            const comparison = compareValues(keyA, keyB);
            return descending ? -comparison : comparison;
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
export function sortRecursiveDesc<T>(
    data: ReadonlyArray<T> | Record<string, unknown> | unknown,
    options?: number,
): T[] | Record<string, unknown> {
    return sortRecursive(data, options, true);
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
export function string<T, D = null>(
    data: ReadonlyArray<T> | unknown,
    key: PathKey,
    defaultValue: D | (() => D) | null = null,
): string {
    const value = getMixedValue(data, key, defaultValue);

    if (typeof value !== "string") {
        throw new Error(
            `Array value for key [${key}] must be a string, ${typeof value} found.`,
        );
    }

    return value;
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
export function toCssClasses(
    data: ReadonlyArray<unknown> | Record<string, unknown> | unknown,
): string {
    if (!accessible(data) && typeof data !== "object") {
        return "";
    }

    // Handle arrays and objects directly
    let classList: Record<string, unknown>;

    if (isArray(data)) {
        classList = { ...data };
    } else if (typeof data === "object" && data !== null) {
        classList = data as Record<string, unknown>;
    } else {
        return "";
    }

    const classes: string[] = [];

    for (const [key, value] of Object.entries(classList)) {
        const numericKey = !isNaN(Number(key));

        if (numericKey) {
            // Numeric key: use the value as class name
            if (typeof value === "string") {
                classes.push(value);
            }
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
export function toCssStyles(
    data: ReadonlyArray<unknown> | Record<string, unknown> | unknown,
): string {
    if (!accessible(data) && typeof data !== "object") {
        return "";
    }

    // Handle arrays and objects directly
    let styleList: Record<string, unknown>;

    if (isArray(data)) {
        styleList = { ...data };
    } else if (typeof data === "object" && data !== null) {
        styleList = data as Record<string, unknown>;
    } else {
        return "";
    }

    const styles: string[] = [];

    for (const [key, value] of Object.entries(styleList)) {
        const numericKey = !isNaN(Number(key));

        if (numericKey) {
            // Numeric key: use the value as style
            if (typeof value === "string") {
                styles.push(Str.finish(value, ";"));
            }
        } else {
            // String key: use key as style if value is truthy
            if (value) {
                styles.push(Str.finish(key, ";"));
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
export function where<T>(
    data: ReadonlyArray<T> | unknown,
    callback: (value: T, index: number) => boolean,
): T[] {
    const values = getAccessibleValues(data);
    const result: T[] = [];

    for (let i = 0; i < values.length; i++) {
        const value = values[i] as T;
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
export function reject<T>(
    data: ReadonlyArray<T> | unknown,
    callback: (value: T, index: number) => boolean,
): T[] {
    return where(data, (value, index) => !callback(value, index));
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
export function partition<T>(
    data: ReadonlyArray<T> | unknown,
    callback: (value: T, index: number) => boolean,
): [T[], T[]] {
    const values = getAccessibleValues(data);
    const passed: T[] = [];
    const failed: T[] = [];

    for (let i = 0; i < values.length; i++) {
        const value = values[i] as T;
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
export function whereNotNull<T>(data: ReadonlyArray<T | null> | unknown): T[] {
    return where(
        data as ReadonlyArray<T | null>,
        (value): value is T => value !== null,
    );
}

/**
 * Check if an array contains a given value.
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
export function contains<T>(
    data: ReadonlyArray<T> | unknown,
    value: T | ((value: T, key: string | number) => boolean),
    strict = false,
): boolean {
    if (!isArray(data)) {
        return false;
    }

    if (isFunction(value)) {
        return data.some((item, index) =>
            (value as (value: T, key: string | number) => boolean)(
                item as T,
                index,
            ),
        );
    }

    if (strict) {
        return data.includes(value);
    }

    return data.some((item) => item == value);
}

/**
 * Filter the array using a callback function.
 *
 * @param data - The array to filter.
 * @param callback - Optional callback function to filter items.
 * @returns A new filtered array.
 *
 * @example
 *
 * filter([1, 2, 3, 4], (x) => x > 2); -> [3, 4]
 * filter([1, null, 2, undefined, 3]); -> [1, 2, 3]
 */
export function filter<T>(data: ReadonlyArray<T> | unknown): T[];
export function filter<T>(
    data: ReadonlyArray<T> | unknown,
    callback: (value: T, index: number) => boolean,
): T[];
export function filter<T>(
    data: ReadonlyArray<T> | unknown,
    callback?: (value: T, index: number) => boolean,
): T[] {
    if (!isArray(data)) {
        return [];
    }

    if (!callback) {
        // Filter out falsy values by default
        return data.filter((value): value is T => Boolean(value));
    }

    return (data as T[]).filter(callback);
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
export function wrap<T>(value: T | null): T[] {
    if (value === null) {
        return [];
    }

    return isArray<T>(value) ? value : [value];
}

/**
 * Get all keys from an array.
 *
 * @param data - The array to get keys from.
 * @returns An array of all keys.
 *
 * @example
 *
 * keys(['name', 'age', 'city']); -> [0, 1, 2]
 * keys([]); -> []
 */
export function keys<T>(data: ReadonlyArray<T> | unknown): number[] {
    if (!accessible(data)) {
        return [];
    }

    return Array.from(data.keys());
}

/**
 * Get all values from an array.
 *
 * @param data - The array to get values from.
 * @returns An array of all values.
 *
 * @example
 *
 * values(['name', 'age', 'city']); -> ['name', 'age', 'city']
 * values([]); -> []
 */
export function values<T>(data: ReadonlyArray<T> | unknown): T[] {
    if (!accessible(data)) {
        return [];
    }

    return Array.from((data as ReadonlyArray<T>).values());
}

/**
 * Get the items that are not present in the given array.
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
export function diff<T>(
    data: ReadonlyArray<T> | unknown,
    other: ReadonlyArray<T> | unknown,
): T[] {
    if (!accessible(data)) {
        return [];
    }

    if (!accessible(other)) {
        return data.slice() as T[];
    }

    const dataArray = data as ReadonlyArray<T>;
    const otherArray = other as ReadonlyArray<T>;
    const result: T[] = [];

    for (const item of dataArray) {
        if (!otherArray.includes(item)) {
            result.push(item);
        }
    }

    return result;
}
