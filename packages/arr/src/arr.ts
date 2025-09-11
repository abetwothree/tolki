import { Collection } from "@laravel-js/collection";

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
    if (Array.isArray(value)) {
        return true;
    }

    return isCollection(value);
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
    if (Array.isArray(value)) {
        return true;
    }

    return isCollection(value);
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
    if (length === 0) return [];

    // Positive: first N
    if (limit > 0) {
        if (limit >= length) return data.slice();
        return data.slice(0, limit);
    }

    // Negative: last abs(N)
    const count = Math.abs(limit);
    if (count >= length) return data.slice();
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
