import { replaceRecursive as objReplaceRecursive } from "@laravel-js/obj";
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
} from "@laravel-js/path";
import { Random, Str } from "@laravel-js/str";
import type { ArrayInnerValue, ArrayItems, ObjectKey, PathKey, PathKeys, } from "@laravel-js/types";
import { castableToArray, compareValues, getAccessibleValues, isArray, isBoolean, isFalsy, isFunction, isInteger, isMap, isNull, isNumber, isObject, isString, isStringable, isSymbol, isUndefined, isWeakMap, typeOf } from '@laravel-js/utils';

/**
 * Determine whether the given value is array accessible.
 *
 * @example
 *
 * accessible([]); // true
 * accessible([1, 2]); // true
 * accessible({ a: 1, b: 2 }); // false
 */
export function accessible<TValue>(value: TValue): value is TValue & Array<TValue> {
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
export function add<TValue>(
    data: ArrayItems<TValue>,
    key: PathKey,
    value: unknown,
): TValue[] {
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
export function arrayItem<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): unknown[] {
    const value = getMixedValue(data, key, defaultValue);

    if (!isArray(value)) {
        throw new Error(
            `Array value for key [${key}] must be an array, ${typeOf(value)} found.`,
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
 * @param data - The array to chunk
 * @param size - The size of each chunk
 * @param preserveKeys - Whether to preserve the original keys, defaults to false
 * @returns Chunked array
 */
export function chunk<TValue>(
    data: ArrayItems<TValue>,
    size: number,
    preserveKeys: boolean = true
): TValue[][] | [number, TValue][][] {
    if (size <= 0) {
        return [];
    }

    const chunks: TValue[][] | [number, TValue][][] = [];

    for (let i = 0; i < data.length; i += size) {
        const chunk = data.slice(i, i + size);
        if (preserveKeys) {
            (chunks as TValue[][]).push(chunk);
        } else {
            (chunks as [number, TValue][][]).push(chunk.map((item, index) => [i + index, item]));
        }
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
export function collapse<TValue, TKey extends ObjectKey = ObjectKey>(
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
 * Combine multiple arrays into a single array.
 * 
 * @param arrays - The arrays to combine.
 * @returns A new array containing all elements from the input arrays.
 */
export function combine<TValue>(
    ...arrays: ArrayItems<TValue>[]
) {
    const length = arrays[0]?.length || 0;
    const result = [];

    for (let i = 0; i < length; i++) {
        result.push(arrays.map(array => array[i]));
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
export function crossJoin<TValue extends ArrayItems<ArrayItems<unknown>>>(
    ...arrays: TValue
): ArrayInnerValue<TValue[number]>[][] {
    let results: ArrayInnerValue<TValue[number]>[][] = [[]];

    for (const array of arrays) {
        if (!array.length) {
            return [];
        }

        const next: ArrayInnerValue<TValue[number]>[][] = [];

        for (const product of results) {
            for (const item of array) {
                next.push([
                    ...product,
                    item as ArrayInnerValue<TValue[number]>,
                ] as ArrayInnerValue<TValue[number]>[]);
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
): [number[], A extends ArrayItems<infer V> ? V[] : unknown[]];
export function divide<A extends readonly unknown[]>(
    array: A,
): [number[], A extends ArrayItems<infer V> ? V[] : unknown[]] {
    const keys = array.map((_, i) => i);
    return [
        keys,
        array.slice() as unknown as A extends ArrayItems<infer V>
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
export function dot<TValue>(
    data: ArrayItems<TValue> | unknown,
    prepend: string = "",
): Record<string, TValue> {
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
export function undot<TValue, TKey extends ObjectKey = ObjectKey>(
    map: Record<TKey, TValue>,
): TValue[] {
    return undotExpandArray(map);
}

/**
 * Union multiple arrays into a single array
 * @param arrays - The arrays to union.
 * @returns A new array containing all elements from the input arrays.
 */
export function union<TValue>(
    ...arrays: ArrayItems<TValue>[]
): TValue[] {
    const result: TValue[] = [];

    for (const array of arrays) {
        for (const item of array) {
            if (result.includes(item)) {
                continue;
            }

            result.push(item);
        }
    }

    return result;
}

/**
 * Prepend one or more items to the beginning of the array
 * 
 * @param data - The array to prepend items to
 * @param items - The items to prepend as [key, value] tuples
 * @returns A new array with the items prepended
 */
export function unshift<TValue, TNewValue>(
    data: ArrayItems<TValue>,
    ...items: TNewValue[]
): ArrayItems<TValue | TNewValue> {
    const result: (TValue | TNewValue)[] = [...data];
    
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (!isUndefined(item)) {
            result.unshift(item);
        }
    }

    return result;
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
    data: ArrayItems<TValue>,
    keys: PathKeys
): TValue[] {
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

    if (isNull(data)) {
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

    if (isNull(data)) {
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
export function take<TValue>(
    data: ArrayItems<TValue> | null | undefined,
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
export function flatten<TValue>(
    data: ArrayItems<TValue>,
    depth: number = Infinity,
): TValue[] {
    const result: TValue[] = [];

    for (const item of data) {
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
 * Flip the keys and values of an array or array of objects.
 * 
 * @param data - The array of items to flip
 * @return - the data items flipped
 *
 * @example
 * flip(['a', 'b', 'c']); -> {a: 0, b: 1, c: 2}
 */
export function flip<TValue>(
    data: ArrayItems<TValue> | unknown,
) {
    if (!accessible(data)) {
        return {};
    }

    // flip the array indices as values and values as keys
    // e.g ['apple', 'banana', 'cherry'] -> {apple: 0, banana: 1, cherry: 2}
    const result: Record<string, number> = {};

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        result[String(item)] = i;
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
export function forget<TValue>(data: ArrayItems<TValue>, keys: PathKeys): TValue[] {
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
 *
 * @throws Error if items is a WeakMap or a scalar value.
 */
export function from<TValue>(items: ArrayItems<TValue>): TValue[];
export function from<TValue, TKey extends ObjectKey = ObjectKey>(items: Map<PropertyKey, TValue>): Record<TKey, TValue>;
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
export function get<TValue, TDefault = unknown>(
    array: ArrayItems<TValue> | unknown,
    key: PathKey | null | undefined,
    defaultValue: TDefault | (() => TDefault) | null = null,
): TDefault | null {
    if (isNull(key) || isUndefined(key)) {
        return isArray(array)
            ? (array as TValue[]) as unknown as TDefault
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
 * @param  data - The array to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if all items pass the test, false otherwise.
 *
 * @example
 *
 * every([2, 4, 6], n => n % 2 === 0); -> true
 * every([1, 2, 3], n => n % 2 === 0); -> false
 */
export function every<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, key: number) => boolean,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    const values = getAccessibleValues(data);
    for (let i = 0; i < values.length; i++) {
        if (!callback(values[i] as TValue, i)) {
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
    data: ArrayItems<T> | unknown,
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
export function keyBy<TValue extends Record<string, unknown>>(
    data: ArrayItems<TValue> | unknown,
    keyBy: string | ((item: TValue) => string | number),
): Record<ObjectKey, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const values = data as ArrayItems<TValue>;
    const results: Record<ObjectKey, TValue> = {};

    for (const item of values) {
        let key: ObjectKey;

        if (isFunction(keyBy)) {
            const result = keyBy(item);
            key = isSymbol(result) ? result : String(result);
        } else {
            // Use dot notation to get the key value
            const keyValue = getNestedValue(item, keyBy as string);
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
 * @param data - The array to get items from.
 * @param keys - The indices to select.
 * @returns A new array with only the specified indices.
 *
 * @example
 *
 * only(['a', 'b', 'c', 'd'], [0, 2]); -> ['a', 'c']
 * only(['a', 'b', 'c'], [1]); -> ['b']
 */
export function only<TValue>(data: ArrayItems<TValue> | unknown, keys: number[]): TValue[] {
    const values = getAccessibleValues(data);
    const result: TValue[] = [];

    for (const key of keys) {
        if (key >= 0 && key < values.length) {
            result.push(values[key] as TValue);
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
export function pluck<TValue extends Record<string, unknown>>(
    data: ArrayItems<TValue> | unknown,
    value: string | ((item: TValue) => unknown),
    key: string | ((item: TValue) => string | number) | null = null,
): unknown[] | Record<string | number, unknown> {
    if (!accessible(data)) {
        return [];
    }

    const values = data as ArrayItems<TValue>;
    const results: unknown[] | Record<string | number, unknown> = key ? {} : [];

    for (const item of values) {
        let itemValue: unknown;
        let itemKey: string | number | undefined;

        // Get the value
        if (isFunction(value)) {
            itemValue = value(item);
        } else {
            // Use dot notation to get nested value
            itemValue = getNestedValue(item, value as string);
        }

        // Get the key if specified
        if (!isNull(key) && !isUndefined(key)) {
            if (isFunction(key)) {
                itemKey = (key as (item: TValue) => string | number)(item);
            } else {
                const nestedKey = getNestedValue(item, key as string);
                if (typeof nestedKey === 'string' || typeof nestedKey === 'number') {
                    itemKey = nestedKey;
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
            (results as Record<string | number, unknown>)[
                itemKey as string | number
            ] = itemValue;
        }
    }

    return results;
}

/**
 * Get and remove the last N items from the collection.
 *
 * @param data - The array to pop items from.
 * @param count - The number of items to pop. Defaults to 1.
 * @returns The popped item, items, or null if none found
 */
export function pop<TValue>(
    data: ArrayItems<TValue> | unknown,
    count: number = 1,
): TValue | TValue[] | null {
    if (!accessible(data)) {
        return null;
    }

    const values = (data as ArrayItems<TValue>).slice();
    const poppedValues: TValue[] = [];

    for (let i = 0; i < count; i++) {
        const value = values.pop();

        if (!isUndefined(value)) {
            poppedValues.unshift(value);
        }
    }

    return poppedValues.length === 0 
        ? null 
        : poppedValues.length === 1 
            ? poppedValues[0] as TValue 
            : poppedValues;
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
export function mapWithKeys<
    TValue,
    TMapWithKeysValue,
    TKey extends number = number,
    TMapWithKeysKey extends ObjectKey = ObjectKey,
>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, index: TKey) => Record<TMapWithKeysKey, TMapWithKeysValue>,
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
export function mapSpread<TValue, TMapReturn>(
    data: ArrayItems<TValue> | unknown,
    callback: (...args: unknown[]) => TMapReturn,
): TMapReturn[] {
    const values = getAccessibleValues(data) as TValue[];
    const result: TMapReturn[] = [];

    for (let i = 0; i < values.length; i++) {
        const chunk = values[i] as TValue;
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

    return { value: value as unknown as TValue | TDefault | null, data: updated };
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
    if (isNull(data) || isUndefined(data)) {
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

                if (!isNull(value) && !isUndefined(value)) {
                    if (isArray(value) || isObject(value)) {
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
export function random<TValue>(
    data: ArrayItems<TValue> | unknown,
    number?: number | null,
    preserveKeys: boolean = false,
): TValue | TValue[] | Record<number, TValue> | null {
    const values = getAccessibleValues(data) as TValue[];
    const count = values.length;
    const requested = isNull(number) || isUndefined(number) ? 1 : number;

    if (count === 0 || requested <= 0) {
        return isNull(number) || isUndefined(number) ? null : [];
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
    if (isNull(number) || isUndefined(number)) {
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
 * Get and remove the first N items from the array
 * 
 * @param data - The array to shift items from.
 * @param count - The number of items to shift. Defaults to 1.
 * @returns The shifted item(s) or null/empty array if none.
 */
export function shift<TValue>(
    data: ArrayItems<TValue> | unknown,
    count: number = 1,
): TValue | TValue[] | null {
    if (!accessible(data)) {
        return count === 1 ? null : [] as TValue[];
    }

    const values = (data as ArrayItems<TValue>).slice();
    const shiftedValues: TValue[] = [];

    for (let i = 0; i < count; i++) {
        const value = values.shift();

        if (!isUndefined(value)) {
            shiftedValues.push(value);
        }
    }

    console.log(shiftedValues);

    return shiftedValues.length === 0 
        ? (count === 1 ? null : [] as TValue[]) 
        : (shiftedValues.length === 1 && count === 1 
            ? shiftedValues[0] as TValue 
            : shiftedValues);
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
export function set<TValue>(
    array: ArrayItems<TValue> | unknown,
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
export function push<TValue>(
    data: TValue[] | unknown,
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
export function shuffle<TValue>(data: ArrayItems<TValue> | unknown): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const result = values.slice();

    // Fisher-Yates shuffle algorithm
    for (let i = result.length - 1; i > 0; i--) {
        // Use the Random.int from @laravel-js/str for secure randomness
        const j = Random.int(0, i);
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
 */
export function slice<TValue>(
    data: ArrayItems<TValue> | unknown,
    offset: number,
    length: number | null = null,
){
    if (!accessible(data)) {
        return [] as ArrayItems<TValue>;
    }

    const values = (data as ArrayItems<TValue>).slice();

    if (isNull(length)) {
        return values.slice(offset);
    }

    // If length is negative, calculate the end index from the end of the array
    if (length < 0) {
        return values.slice(offset, length);
    }

    return values.slice(offset, offset + length);
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
export function sort<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: ((a: TValue, b: TValue) => unknown) | string | null = null,
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const result = values.slice();

    if (isFalsy(callback)) {
        // Natural sorting
        return result.sort();
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
export function sortDesc<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback?: ((item: TValue) => unknown) | string | null,
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const result = values.slice();

    if (!callback) {
        // Natural sorting in descending order
        return result.sort().reverse();
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
export function sortRecursive<TValue>(
    data: ArrayItems<TValue> | Record<string, unknown> | unknown,
    options?: number,
    descending: boolean = false,
): TValue[] | Record<string, unknown> {
    if (!accessible(data) && !isObject(data)) {
        return data as unknown as TValue[];
    }

    let result: TValue[] | Record<string, unknown>;

    if (isArray(data)) {
        result = data.slice() as TValue[];
    } else if (isObject(data) && !isNull(data)) {
        result = { ...data } as Record<string, unknown>;
    } else {
        result = data as unknown as TValue[];
    }

    // Recursively sort nested arrays/objects
    if (isArray(result)) {
        // First recursively sort nested elements
        for (let i = 0; i < result.length; i++) {
            const item = result[i];
            if (isArray(item) || isObject(item)) {
                result[i] = sortRecursive(item, options, descending) as TValue;
            }
        }

        // Then sort the array values
        result.sort((a, b) => {
            const comparison = compareValues(a, b);
            return descending ? -comparison : comparison;
        });
    } else if (isObject(result) && !isNull(result)) {
        // Sort object properties
        const entries = Object.entries(result);

        // Recursively sort nested values first
        for (const [key, value] of entries) {
            if (
                isArray(value) ||
                (isObject(value) && !isNull(value))
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
export function sortRecursiveDesc<TValue>(
    data: ArrayItems<TValue> | Record<string, unknown> | unknown,
    options?: number,
): TValue[] | Record<string, unknown> {
    return sortRecursive(data, options, true);
}

/**
 * Splice a portion of the underlying array.
 * 
 * This is a WRITE operation that removes and/or replaces elements, tracking what was removed.
 * Similar to PHP's array_splice(), it returns both the modified array and removed elements.
 * Unlike JavaScript's Array.splice() (which mutates and returns only removed elements),
 * this function is immutable and returns both values for tracking changes.
 * 
 * For a READ operation that just extracts a subset, use `slice()` instead.
 * 
 * Replacement values that are arrays will be flattened into the result.
 * 
 * @param data - The array to splice
 * @param offset - The starting index
 * @param length - The number of items to remove (undefined removes all from offset to end)
 * @param replacement - The replacement items (arrays will be flattened)
 * @returns Object with `array` (modified array) and `removed` (removed elements)
 * 
 * @example
 * 
 * splice(['foo', 'baz'], 1, 1); -> { array: ['foo'], removed: ['baz'] }
 * splice(['foo', 'baz'], 1, 1, 'bar'); -> { array: ['foo', 'bar'], removed: ['baz'] }
 * splice(['foo', 'baz'], 1, 0, 'bar'); -> { array: ['foo', 'bar', 'baz'], removed: [] }
 * splice(['foo', 'baz'], 1, 0, ['bar']); -> { array: ['foo', 'bar', 'baz'], removed: [] } // flattened
 */
export function splice<TValue>(
    data: ArrayItems<TValue>,
    offset: number,
    length?: number,
    ...replacement: TValue[]
): { array: TValue[]; removed: TValue[] } {
    if (!accessible(data)) {
        return { array: [] as TValue[], removed: [] as TValue[] };
    }

    const values = (data as ArrayItems<TValue>).slice();
    
    // Flatten replacement if it's an array within an array
    const flatReplacement: TValue[] = [];
    for (const item of replacement) {
        if (accessible(item)) {
            flatReplacement.push(...(item as unknown as TValue[]));
        } else {
            flatReplacement.push(item as TValue);
        }
    }

    let removed: TValue[];
    if (isUndefined(length)) {
        // If length is not provided, remove all elements from offset to end
        removed = values.splice(offset, values.length - offset, ...flatReplacement);
    } else {
        removed = values.splice(offset, length, ...flatReplacement);
    }

    return { array: values, removed };
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
    data: ArrayItems<unknown> | Record<string, unknown> | unknown,
): string {
    if (!accessible(data) && !isObject(data)) {
        return "";
    }

    // Handle arrays and objects directly
    let classList: Record<string, unknown>;

    if (isArray(data)) {
        classList = { ...data };
    } else if (isObject(data) && !isNull(data)) {
        classList = data as Record<string, unknown>;
    } else {
        return "";
    }

    const classes: string[] = [];

    for (const [key, value] of Object.entries(classList)) {
        const numericKey = !isNaN(Number(key));

        if (numericKey) {
            // Numeric key: use the value as class name
            if (isString(value)) {
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
    data: ArrayItems<unknown> | Record<string, unknown> | unknown,
): string {
    if (!accessible(data) && !isObject(data)) {
        return "";
    }

    // Handle arrays and objects directly
    let styleList: Record<string, unknown>;

    if (isArray(data)) {
        styleList = { ...data };
    } else if (isObject(data) && !isNull(data)) {
        styleList = data as Record<string, unknown>;
    } else {
        return "";
    }

    const styles: string[] = [];

    for (const [key, value] of Object.entries(styleList)) {
        const numericKey = !isNaN(Number(key));

        if (numericKey) {
            // Numeric key: use the value as style
            if (isString(value)) {
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
 * @param data - The array to replace items in.
 * @param replacerData - The array or numeric keyed object containing items to replace.
 * @returns The modified original array with replaced items.
 * 
 * @example
 * 
 * replace(['a', 'b', 'c'], ['d', 'e']); -> ['d', 'e', 'c']
 * replace(['a', 'b', 'c'], { 1: 'd', 2: 'e', 3: 'f' }); -> ['a', 'd', 'e', 'f']
 */
export function replace<TValue, TReplace = TValue>(
    data: ArrayItems<TValue> | unknown,
    replacerData: ArrayItems<TReplace> | Record<number, TReplace> | unknown,
){
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
 * @param data - The original array to replace items in.
 * @param replacerData - The array or numeric keyed object containing items to replace.
 * @returns The modified original array with replaced items.
 * 
 * @example
 * 
 * replaceRecursive(['a', 'b', ['c', 'd']], null); -> ['a', 'b', ['c', 'd']]
 * replaceRecursive(['a', 'b', ['c', 'd']], ['z', {2: {1: 'e'}}]); -> ['z', 'b', ['c', 'e']]
 */
export function replaceRecursive<TValue, TReplace = TValue>(
    data: ArrayItems<TValue> | unknown,
    replacerData: ArrayItems<TValue> | Record<number, TReplace> | unknown,
){
    const values = getAccessibleValues(data) as TValue[];

    // Handle null/undefined replacer
    if (isNull(replacerData) || isUndefined(replacerData)) {
        return values;
    }

    // Helper function to check if an object is a numeric keyed object
    const isNumericKeyedObject = (obj: unknown): obj is Record<number, unknown> => {
        if (!isObject(obj) || isArray(obj)) {
            return false;
        }
        const keys = Object.keys(obj);
        return keys.length > 0 && keys.every(key => !isNaN(parseInt(key, 10)));
    };

    // Helper function to process a single replacement value
    const processReplacement = (originalValue: TValue, replacementValue: unknown): TValue => {
        // Both are arrays or the replacement is a numeric keyed object that should be treated as array
        if (isArray(originalValue) && (isArray(replacementValue) || isNumericKeyedObject(replacementValue))) {
            return replaceRecursive(
                originalValue as unknown as ArrayItems<TValue>,
                replacementValue as ArrayItems<TValue> | Record<number, TReplace>,
            ) as unknown as TValue;
        }
        
        // Both are objects (non-array, non-numeric-keyed)
        if (isObject(originalValue) && isObject(replacementValue) && !isNumericKeyedObject(replacementValue)) {
            return objReplaceRecursive(
                originalValue as unknown as Record<ObjectKey, TValue>,
                replacementValue as unknown as Record<ObjectKey, TValue>,
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
                    if (!isNaN(index)) {
                        allReplacements.set(index, numericObj[index]);
                        // Update currentIndex to be after the highest sparse index
                        if (index >= currentIndex) {
                            currentIndex = index + 1;
                        }
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
                values[index] = processReplacement(values[index]!, replacementValue);
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
            if (!isNaN(index)) {
                if (index < values.length) {
                    values[index] = processReplacement(values[index]!, replacerObj[index]);
                } else {
                    // Fill gaps with undefined if necessary
                    while (values.length < index) {
                        values.push(undefined as TValue);
                    }
                    values.push(replacerObj[index] as unknown as TValue);
                }
            }
        }
        return values;
    }

    return values;
}

/**
 * Reverse the order of the array and return the result.
 * 
 * @param data - The array to reverse.
 * @returns A new array with the items in reverse order.
 * 
 * @example
 * 
 * reverse([1, 2, 3]); -> [3, 2, 1]
 * reverse(['a', 'b', 'c']); -> ['c', 'b', 'a']
 */
export function reverse<TValue>(
    data: ArrayItems<TValue> | unknown,
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];

    return values.slice().reverse();
}

/**
 * Pad array to the specified length with a value.
 * 
 * If size is positive, pads on the right (append).
 * If size is negative, pads on the left (prepend).
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
): ArrayItems<TValue | TPadValue> {
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
export function whereNotNull<TValue>(data: ArrayItems<TValue | null> | unknown): TValue[] {
    return where(
        data as ArrayItems<TValue | null>,
        (value): value is TValue => !isNull(value),
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
// Overload: callback function - infers TValue from array type
export function contains<TValue>(
    data: TValue[],
    value: (value: TValue, key: number) => boolean,
    strict?: boolean,
): boolean;
// Overload: value comparison - infers TValue from array type
export function contains<TValue>(
    data: TValue[],
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
export function filter<TValue>(data: ArrayItems<TValue> | unknown): TValue[];
export function filter<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, index: number) => boolean,
): TValue[];
export function filter<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback?: (value: TValue, index: number) => boolean,
): TValue[] {
    if (!isArray(data)) {
        return [];
    }

    if (!callback) {
        // Filter out falsy values by default
        return data.filter((value): value is TValue => Boolean(value));
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
export function wrap<TValue>(value: TValue | null): TValue[] {
    if (isNull(value)) {
        return [];
    }

    return isArray<TValue>(value) ? value : [value];
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
export function keys<TValue>(data: ArrayItems<TValue> | unknown): number[] {
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
export function values<TValue>(data: ArrayItems<TValue> | unknown): TValue[] {
    if (!accessible(data)) {
        return [];
    }

    return Array.from((data as ArrayItems<TValue>).values());
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
export function diff<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
): TValue[] {
    if (!accessible(data)) {
        return [];
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
 * @param data - The original array
 * @param other - The array to intersect with
 * @param callable - Optional function to compare values
 * @returns A new array containing items present in both arrays
 */
export function intersect<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
    callable: ((a: TValue, b: TValue) => boolean) | null = null,
) {
    if (!accessible(data) || !accessible(other)) {
        return [] as ArrayItems<TValue>;
    }

    const dataValues = getAccessibleValues(data) as TValue[];
    const otherValues = getAccessibleValues(other) as TValue[];
    const result: TValue[] = [];

    for (const item of dataValues) {
        const found = isFunction(callable)
            ? otherValues.some((otherItem) => callable(item, otherItem))
            : otherValues.includes(item);

        if (found) {
            result.push(item);
        }
    }

    return result;
}

/**
 * Intersect the array with the given items by key.
 * 
 * @param data - The original array
 * @param other - The array to intersect with
 * @returns A new array containing items with keys present in both arrays
 */
export function intersectByKeys<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
) {
    if (!accessible(data) || !accessible(other)) {
        return [] as ArrayItems<TValue>;
    }

    const dataValues = getAccessibleValues(data) as TValue[];
    const otherValues = getAccessibleValues(other) as TValue[];
    const result: TValue[] = [];

    const otherKeys = new Set<number>(
        otherValues.map((_, index) => index),
    );

    for (let index = 0; index < dataValues.length; index++) {
        if (otherKeys.has(index)) {
            result.push(dataValues[index] as TValue);
        }
    }

    return result;
}