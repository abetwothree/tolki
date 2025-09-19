import { Collection } from "@laravel-js/collection";
import {
    isAccessible as _isAccessible,
    toArray as _toArray,
    hasPath as _hasPath,
    getRaw as _getRaw,
    forgetKeys as _forgetKeys,
    setImmutable as _setImmutable,
    pushWithPath as _pushWithPath,
    dotFlatten as _dotFlatten,
    undotExpand as _undotExpand,
} from "./path";
import type { ArrayKey, ArrayKeys } from "./path";

// Extract the element type from either an array or a Collection
export type InnerValue<X> =
    X extends ReadonlyArray<infer U>
        ? U
        : X extends Collection<infer U>
          ? U
          : never;

/**
 * Determine whether the given value is array accessible.
 *
 * @example
 *
 * accessible([]); // true
 * accessible([1, 2]); // true
 * accessible({ a: 1, b: 2 }); // false
 * accessible(new Collection()); // true
 */
export function accessible<T>(value: T): boolean {
    return _isAccessible(value as unknown);
}

/**
 * Determine whether the given value is arrayable.
 *
 * @example
 *
 * arrayable([]); // true
 * arrayable([1, 2]); // true
 * arrayable({ a: 1, b: 2 }); // false
 * arrayable(new Collection()); // true
 */
export function arrayable(
    value: unknown,
): value is ReadonlyArray<unknown> | Collection<unknown[]> {
    return _isAccessible(value);
}

/**
 * Determine whether the given value is a Collection.
 */
export function isCollection<T>(value: T): boolean {
    if (value instanceof Collection) {
        return true;
    }

    return false;
}

/**
 * Add an element to an array using "dot" notation if it doesn't exist.
 *
 * @example
 *
 * add(['Desk'], 'Table'); // -> ['Desk', 'Table']
 * add([], 'Ferid', 'Mövsümov'); // -> ['Ferid', 'Mövsümov']
 */
export function add<T extends readonly unknown[], V extends readonly unknown[]>(
    data: T,
    ...values: V
): [...T, ...V] {
    return [...data, ...values] as [...T, ...V];
}

/**
 * Collapse an array of arrays into a single array.
 *
 * @example
 *
 * collapse([[1], [2], [3], ['foo', 'bar']]); // -> [1, 2, 3, 'foo', 'bar']
 */
export function collapse<
    T extends ReadonlyArray<ReadonlyArray<unknown> | Collection<unknown[]>>,
>(array: T): InnerValue<T[number]>[] {
    const out: InnerValue<T[number]>[] = [];

    for (const item of array) {
        if (Array.isArray(item)) {
            out.push(...(item as InnerValue<T[number]>[]));
        } else if (item instanceof Collection) {
            out.push(...(item.all() as unknown as InnerValue<T[number]>[]));
        }
    }

    return out;
}

/**
 * Cross join the given arrays, returning all possible permutations.
 *
 * @example
 *
 * crossJoin([1], ["a"]); // -> [[1, 'a']]
 */
export function crossJoin<T extends ReadonlyArray<ReadonlyArray<unknown>>>(
    ...arrays: T
): InnerValue<T[number]>[][] {
    let results: InnerValue<T[number]>[][] = [[]];

    for (const array of arrays) {
        if (!array.length) {
            return [];
        }

        const next: InnerValue<T[number]>[][] = [];

        for (const product of results) {
            for (const item of array) {
                next.push([
                    ...product,
                    item as InnerValue<T[number]>,
                ] as InnerValue<T[number]>[]);
            }
        }

        results = next;
    }

    return results;
}

/**
 * Divide an array into two arrays. One with keys and the other with values.
 *
 * @example
 *
 * divide(["Desk", 100, true]); // -> [[0, 1, 2], ['Desk', 100, true]]
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
 * Get all of the given array except for a specified array of keys.
 *
 * @param  data - The array to remove items from.
 * @param  keys - The keys of the items to remove.
 * @returns A new array with the specified items removed.
 *
 * @example
 *
 * except(["a", "b", "c"], 1); // -> ['a', 'c']
 * except(["a", "b", "c"], [0, 2]); // -> ['b']
 */
export function except<T>(data: ReadonlyArray<T>, keys: ArrayKeys): T[] {
    return forget(data, keys);
}

/**
 * Determine if the given key exists in the provided data structure.
 *
 * @param  data - array or Collection to check
 * @param  key  - key to check for
 * @returns True if the key exists, false otherwise.
 *
 * @example
 *
 * exists([1, 2, 3], 0); // -> true
 * exists([1, 2, 3], 3); // -> false
 * exists(new Collection([1, 2, 3]), 2); // -> true
 * exists(new Collection([1, 2, 3]), 4); // -> false
 */
export function exists<T>(data: readonly T[], key: number | string): boolean;
export function exists<T>(data: Collection<T[]>, key: T): boolean;
export function exists(
    data: ReadonlyArray<unknown> | Collection<unknown[]>,
    key: ArrayKey,
): boolean {
    // Array: only numeric keys are supported
    if (Array.isArray(data)) {
        const idx = typeof key === "number" ? key : Number(key);
        if (Number.isNaN(idx)) {
            return false;
        }

        return idx >= 0 && idx < data.length;
    }

    // Collection: check if the value exists among items
    if (data instanceof Collection) {
        const items = data.all() as unknown[];
        return items.includes(key as never);
    }

    return false;
}

/**
 * Return the first element in an array passing a given truth test.
 *
 * @example
 *
 * first([100, 200, 300]); // -> 100
 */
// Overload: no predicate, no explicit default -> T | null
export function first<T>(
    data: readonly T[] | Iterable<T> | null | undefined,
    predicate?: null,
    defaultValue?: undefined,
): T | null;
// Overload: no predicate, explicit default value (eager or lazy)
export function first<T, D>(
    data: readonly T[] | Iterable<T> | null | undefined,
    predicate: null | undefined,
    defaultValue: D | (() => D),
): T | D;
// Overload: predicate, no explicit default
export function first<T>(
    data: readonly T[] | Iterable<T> | null | undefined,
    predicate: (value: T, index: number) => boolean,
): T | null;
// Overload: predicate with default
export function first<T, D>(
    data: readonly T[] | Iterable<T> | null | undefined,
    predicate: (value: T, index: number) => boolean,
    defaultValue: D | (() => D),
): T | D;
export function first<T, D>(
    data: readonly T[] | Iterable<T> | null | undefined,
    predicate?: ((value: T, index: number) => boolean) | null,
    defaultValue?: D | (() => D),
): T | D | null {
    const resolveDefault = (): D | null => {
        if (defaultValue === undefined) {
            return null;
        }

        return typeof defaultValue === "function"
            ? (defaultValue as () => D)()
            : (defaultValue as D);
    };

    if (data == null) {
        return resolveDefault();
    }

    const isArray = Array.isArray(data);
    const iterable: Iterable<T> = isArray
        ? (data as readonly T[])
        : (data as Iterable<T>);

    // No predicate: just return first element if it exists.
    if (!predicate) {
        if (isArray) {
            const arr = data as readonly T[];
            if (arr.length === 0) {
                return resolveDefault();
            }

            // After length check arr[0] is defined
            return arr[0] as T;
        }

        for (const item of iterable) {
            return item; // first
        }

        return resolveDefault();
    }

    let index = 0;
    for (const item of iterable) {
        if (predicate(item, index++)) {
            return item;
        }
    }

    return resolveDefault();
}

/**
 * Return the last element in an array passing a given truth test.
 *
 * @example
 * last([100, 200, 300]); // -> 300
 */
// Overload: no predicate, no default
export function last<T>(
    data: readonly T[] | Iterable<T> | null | undefined,
    predicate?: null,
    defaultValue?: undefined,
): T | null;
// Overload: no predicate with default (value or lazy)
export function last<T, D>(
    data: readonly T[] | Iterable<T> | null | undefined,
    predicate: null | undefined,
    defaultValue: D | (() => D),
): T | D;
// Overload: predicate, no default
export function last<T>(
    data: readonly T[] | Iterable<T> | null | undefined,
    predicate: (value: T, index: number) => boolean,
): T | null;
// Overload: predicate with default
export function last<T, D>(
    data: readonly T[] | Iterable<T> | null | undefined,
    predicate: (value: T, index: number) => boolean,
    defaultValue: D | (() => D),
): T | D;
export function last<T, D>(
    data: readonly T[] | Iterable<T> | null | undefined,
    predicate?: ((value: T, index: number) => boolean) | null,
    defaultValue?: D | (() => D),
): T | D | null {
    const resolveDefault = (): D | null => {
        if (defaultValue === undefined) {
            return null;
        }

        return typeof defaultValue === "function"
            ? (defaultValue as () => D)()
            : (defaultValue as D);
    };

    if (data == null) {
        return resolveDefault();
    }

    const isArray = Array.isArray(data);
    const iterable: Iterable<T> = isArray
        ? (data as readonly T[])
        : (data as Iterable<T>);

    // No predicate case
    if (!predicate) {
        if (isArray) {
            const arr = data as readonly T[];
            if (arr.length === 0) {
                return resolveDefault();
            }

            return arr[arr.length - 1] as T;
        }

        // Generic iterable: iterate to the end
        let last: T | undefined; // track last seen
        let seen = false;
        for (const item of iterable) {
            last = item;
            seen = true;
        }

        return seen ? (last as T) : resolveDefault();
    }

    if (isArray) {
        const arr = data as readonly T[];
        for (let i = arr.length - 1; i >= 0; i--) {
            if (predicate(arr[i] as T, i)) {
                return arr[i] as T;
            }
        }

        return resolveDefault();
    }

    // Non-array iterable: iterate forward keeping last match
    let index = 0;
    let found = false;
    let candidate: T | undefined;
    for (const item of iterable) {
        if (predicate(item, index)) {
            candidate = item;
            found = true;
        }

        index++;
    }

    return found ? (candidate as T) : resolveDefault();
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
 * take([1, 2, 3, 4, 5], 2); // -> [1, 2]
 * take([1, 2, 3, 4, 5], -2); // -> [4, 5]
 * take([1, 2, 3], 5); // -> [1, 2, 3]
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
 * @param data The array (or Collection) to flatten.
 * @param depth Maximum depth to flatten. Use Infinity for full flattening.
 * @returns A new flattened array.
 *
 * @example
 *
 * flatten([1, [2, [3, 4]], 5]); // -> [1, 2, 3, 4, 5]
 * flatten([1, [2, [3, 4]], 5], 1); // -> [1, 2, [3, 4], 5]
 * flatten(new Collection([1, new Collection([2, 3]), 4])); // -> [1, 2, 3, 4]
 * flatten(new Collection([1, new Collection([2, new Collection([3])]), 4]), 2); // -> [1, 2, 3, 4]
 */
export function flatten<T>(data: ReadonlyArray<T>, depth?: number): unknown[];
export function flatten<T extends unknown[]>(
    data: Collection<T>,
    depth?: number,
): unknown[];
export function flatten(
    data: ReadonlyArray<unknown> | Collection<unknown[]>,
    depth: number = Infinity,
): unknown[] {
    const result: unknown[] = [];

    const array =
        data instanceof Collection
            ? (data.all() as unknown[])
            : (data as ReadonlyArray<unknown>);

    for (const raw of array) {
        const item = raw instanceof Collection ? (raw.all() as unknown) : raw;

        if (!Array.isArray(item)) {
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
 * Remove one or many array items from a given array using dot notation.
 *
 * @param  data - The array to remove items from.
 * @param  keys - The keys of the items to remove.
 * @returns A new array with the specified items removed.
 *
 * @example
 *
 * forget(['products', ['desk', [100]]], null); // -> ['products', ['desk', [100]]]
 * forget(['products', ['desk', [100]]], '1'); // -> ['products']
 * forget(['products', ['desk', [100]]], 1); // -> ['products']
 * forget(['products', ['desk', [100]]], '1.1'); // -> ['products', ['desk']]
 * forget(['products', ['desk', [100]]], 2); // -> ['products', ['desk', [100]]]
 */
export function forget<T>(data: ReadonlyArray<T>, keys: ArrayKeys): T[] {
    return _forgetKeys<T>(data, keys);
}

/**
 * Get the underlying array or object of items from the given argument.
 *
 * @param items The array, Collection, Map, or object to extract from.
 * @returns The underlying array or object.
 *
 * @example
 *
 * from([1, 2, 3]); // -> [1, 2, 3]
 * from(new Collection([1, 2, 3])); // -> [1, 2, 3]
 * from({ foo: 'bar' }); // -> { foo: 'bar' }
 * from(new Map([['foo', 'bar']])); // -> { foo: 'bar' }
 *
 * @throws Error if items is a WeakMap or a scalar value.
 */
export function from<T>(items: ReadonlyArray<T>): T[];
export function from<T extends unknown[]>(items: Collection<T>): T[];
export function from<V>(items: Map<PropertyKey, V>): Record<string, V>;
export function from(
    items: number | string | boolean | symbol | null | undefined,
): never;
export function from(items: object): Record<string, unknown>;
export function from(items: unknown): unknown {
    // Arrays
    if (Array.isArray(items)) {
        return items.slice();
    }

    // Collections
    if (items instanceof Collection) {
        return items.all();
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
 * Get an item from an array (or Collection) using numeric-only dot notation.
 *
 * @param  data - The array or Collection to get the item from.
 * @param  key - The key or dot-notated path of the item to get.
 * @param  default - The default value if key is not found
 * @returns The value or the default
 *
 * @example
 *
 * get(['foo', 'bar', 'baz'], 1); // -> 'bar'
 * get(['foo', 'bar', 'baz'], null); // -> ['foo', 'bar', 'baz']
 * get(['foo', 'bar', 'baz'], 9, 'default'); // -> 'default'
 */
export function get<T, D = null>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    key: ArrayKey,
    defaultValue: D | (() => D) | null = null,
): T | D | ReadonlyArray<T> | null {
    const resolveDefault = (): D | null => {
        return typeof defaultValue === "function"
            ? (defaultValue as () => D)()
            : (defaultValue as D);
    };
    if (!accessible(data)) {
        return resolveDefault();
    }
    const root = _toArray(data)!;
    const { found, value } = _getRaw(root, key);
    if (!found) {
        return resolveDefault();
    }
    return value == null ? resolveDefault() : (value as T);
}

/**
 * Check if an item or items exist in an array using "dot" notation.
 *
 * @param  data - The array or Collection to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if the item or items exist, false otherwise.
 *
 * @example
 *
 * has(['foo', 'bar', ['baz', 'qux']], 1); // -> true
 * has(['foo', 'bar'], 5); // -> false
 * has(['foo', 'bar', ['baz', 'qux']], ['0', '2.1']); // -> true
 * has(['foo', 'bar', ['baz', 'qux']], ['0', '2.2']); // -> false
 */
export function has<T>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    keys: ArrayKeys,
): boolean {
    const keyList = Array.isArray(keys) ? keys : [keys];
    if (!accessible(data) || keyList.length === 0) {
        return false;
    }
    const root = _toArray(data)!;
    for (const k of keyList) {
        if (k == null) return false;
        if (!_hasPath(root, k)) return false;
    }
    return true;
}

/**
 * Determine if all keys exist in an array using "dot" notation.
 *
 * @param  data - The array or Collection to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if all keys exist, false otherwise.
 *
 * @example
 *
 * hasAll(['foo', 'bar', ['baz', 'qux']], ['0', '2.1']); // -> true
 * hasAll(['foo', 'bar', ['baz', 'qux']], ['0', '2.2']); // -> false
 */
export function hasAll<T>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    keys: ArrayKeys,
): boolean {
    const keyList = Array.isArray(keys) ? keys : [keys];

    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const key of keyList) {
        if (!has(data, key)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if any of the keys exist in an array using "dot" notation.
 *
 * @param  data - The array or Collection to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if any key exists, false otherwise.
 *
 * @example
 *
 * hasAny(['foo', 'bar', ['baz', 'qux']], ['0', '2.2']); // -> true
 * hasAny(['foo', 'bar', ['baz', 'qux']], ['3', '4']); // -> false
 */
export function hasAny<T>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    keys: ArrayKeys,
): boolean {
    if (keys == null) {
        return false;
    }
    const keyList = Array.isArray(keys) ? keys : [keys];
    if (keyList.length === 0) {
        return false;
    }
    if (!accessible(data)) {
        return false;
    }
    for (const key of keyList) {
        if (has(data, key)) {
            return true;
        }
    }
    return false;
}

/**
 * Determine if all items pass the given truth test.
 *
 * @param  data - The array or Collection to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if all items pass the test, false otherwise.
 *
 * @example
 *
 * every([2, 4, 6], n => n % 2 === 0); // -> true
 * every([1, 2, 3], n => n % 2 === 0); // -> false
 * every(new Collection([2, 4, 6]), n => n % 2 === 0); // -> true
 * every(new Collection([1, 2, 3]), n => n % 2 === 0); // -> false
 */
export function every<T>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    callback: (value: T, key: number) => boolean,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    const values =
        data instanceof Collection ? data.all() : (data as ReadonlyArray<T>);
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
 * @param  data - The array or Collection to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if any item passes the test, false otherwise.
 *
 * @example
 *
 * some([1, 2, 3], n => n % 2 === 0); // -> true
 * some([1, 3, 5], n => n % 2 === 0); // -> false
 * some(new Collection([1, 2, 3]), n => n % 2 === 0); // -> true
 * some(new Collection([1, 3, 5]), n => n % 2 === 0); // -> false
 */
export function some<T>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    callback: (value: T, key: number) => boolean,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    const values =
        data instanceof Collection ? data.all() : (data as ReadonlyArray<T>);

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
 * @param  data - The array or Collection to get the item from.
 * @param  key - The key or dot-notated path of the item to get.
 * @param  default - The default value if key is not found
 *
 * @returns The integer value.
 *
 * @throws Error if the value is not an integer.
 *
 * @example
 *
 * integer([10, 20, 30], 1); // -> 20
 * integer([10, 20, 30], 5, 100); // -> 100
 * integer(["house"], 0); // -> Error: The value is not an integer.
 */
export function integer<T, D = null>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    key: ArrayKey,
    defaultValue: D | (() => D) | null = null,
): number {
    const value = get(data, key, defaultValue);

    if (!Number.isInteger(value)) {
        throw new Error("The value is not an integer.");
    }

    return value as number;
}

/**
 * Join all items using a string. The final items can use a separate glue string.
 *
 * @param  data - The array or Collection to join.
 * @param  glue - The string to join all but the last item.
 * @param  finalGlue - The string to join the last item.
 *
 * @example
 *
 * join(['a', 'b', 'c'], ', ') => 'a, b, c'
 * join(['a', 'b', 'c'], ', ', ' and ') => 'a, b and c'
 */
export function join<T>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    glue: string,
    finalGlue: string = "",
): string {
    if (!accessible(data)) {
        return "";
    }

    const raw: unknown[] =
        data instanceof Collection
            ? (data.all() as unknown[])
            : (data as unknown[]);
    const items = raw.map((v) => String(v));

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
 * Set an array item to a given value using "dot" notation.
 *
 * If no key is given to the method, the entire array will be replaced.
 *
 * @param  data - The array or Collection to set the item in.
 * @param  key - The key or dot-notated path of the item to set.
 * @param  value - The value to set.
 * @returns - A new array with the item set or the original array if the path is invalid.
 *
 * @example
 * set(['a', 'b', 'c'], 1, 'x'); // -> ['a', 'x', 'c']
 * set(['a', ['b', 'c']], '1.0', 'x'); // -> ['a', ['x', 'c']]
 */
export function set<T>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    key: ArrayKey,
    value: T,
): T[] {
    return _setImmutable<T>(data, key, value);
}

/**
 * Push one or more items into an array using numeric-only dot notation and return new array.
 *
 * @param data - The array or Collection to push items into.
 * @param key - The key or dot-notated path of the array to push into. If null, push into root.
 * @param values - The values to push.
 * @returns A new array with the values pushed in.
 *
 * @example
 *
 * push(['a', 'b'], null, 'c', 'd'); // -> ['a', 'b', 'c', 'd']
 * push(['a', ['b']], '1', 'c', 'd'); // -> ['a', ['b', 'c', 'd']]
 * push(['a', ['b']], '1.1', 'c'); // -> ['a', ['b', 'c']]
 */
export function push<T>(
    data: T[] | Collection<T[]> | unknown,
    key: ArrayKey,
    ...values: T[]
): T[] {
    return _pushWithPath<T>(data, key, ...values);
}
/**
 * Get a value from the array, and remove it.
 *
 * @param data - The array or Collection to pull the item from.
 * @param key - The key or dot-notated path of the item to pull.
 * @param defaultValue - The default value if key is not found.
 * @returns An object containing the pulled value (or default) and the updated array.
 *
 * @example
 *
 * pull(['a', 'b', 'c'], 1); // -> { value: 'b', data: ['a', 'c'] }
 * pull(['a', ['b', 'c']], '1.0'); // -> { value: 'b', data: ['a', ['c']] }
 * pull(['a', 'b', 'c'], 5, 'x'); // -> { value: 'x', data: ['a', 'b', 'c'] }
 * pull(['a', ['b', 'c']], '1.2', 'x'); // -> { value: 'x', data: ['a', ['b', 'c']] }
 */
export function pull<T, D = null>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    key: ArrayKey,
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
        const original = _toArray(data)!.slice();
        return { value: resolveDefault(), data: original as T[] };
    }
    const root = _toArray(data)!;
    const { found, value } = _getRaw(root, key as number | string);
    if (!found) {
        const original = root.slice();
        return { value: resolveDefault(), data: original as T[] };
    }
    const updated = forget(root as T[], key as number | string);
    return { value: value as unknown as T | D | null, data: updated };
}

/**
 * Flatten a multi-dimensional array with "dot" notation.
 *
 * @param data - The array or Collection to flatten.
 * @param prepend - An optional string to prepend to each key.
 * @returns A new object with dot-notated keys.
 *
 * @example
 *
 * dot(['a', ['b', 'c']]); // -> { '0': 'a', '1.0': 'b', '1.1': 'c' }
 * dot(new Collection(['a', new Collection(['b', 'c'])]), 'item'); // -> { 'item.0': 'a', 'item.1.0': 'b', 'item.1.1': 'c' }
 */
export function dot(
    data: ReadonlyArray<unknown> | Collection<unknown[]> | unknown,
    prepend: string = "",
): Record<string, unknown> {
    return _dotFlatten(data, prepend);
}

/**
 * Convert a flatten "dot" notation object into an expanded array.
 *
 * @param map - The flat object with dot-notated keys.
 * @returns A new multi-dimensional array.
 *
 * @example
 *
 * undot({ '0': 'a', '1.0': 'b', '1.1': 'c' }); // -> ['a', ['b', 'c']]
 * undot({ 'item.0': 'a', 'item.1.0': 'b', 'item.1.1': 'c' }); // -> [['b', 'c']]
 */
export function undot(map: Record<string, unknown>): unknown[] {
    return _undotExpand(map);
}
