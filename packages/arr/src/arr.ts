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
    key: unknown,
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
export function forget<T>(
    data: ReadonlyArray<T>,
    keys: number | string | Array<number | string> | null | undefined,
): T[] {
    const removeAt = <U>(arr: ReadonlyArray<U>, index: number): U[] => {
        if (!Number.isInteger(index) || index < 0 || index >= arr.length) {
            return arr.slice();
        }

        const clone = arr.slice();
        clone.splice(index, 1);
        
        return clone;
    };

    const forgetPath = <U>(arr: ReadonlyArray<U>, path: number[]): U[] => {
        if (path.length === 0) return arr.slice();
        const head = path[0];
        const rest = path.slice(1);
        if (!Array.isArray(arr)) return arr.slice();
        const clone = arr.slice();

        if (rest.length === 0) {
            return removeAt(clone, head!);
        }

        if (!Number.isInteger(head) || head! < 0 || head! >= clone.length) {
            return clone;
        }

        const child = clone[head!] as unknown;
        if (Array.isArray(child)) {
            clone[head!] = forgetPath(child as unknown[], rest) as unknown as U;
        }

        return clone;
    };

    // Helper to immutably update a nested array at a given parent path
    const updateAtPath = <U>(
        arr: ReadonlyArray<U>,
        parentPath: number[],
        updater: (child: U[]) => U[],
    ): U[] => {
        if (parentPath.length === 0) {
            return updater(arr.slice() as unknown as U[]) as unknown as U[];
        }

        const [head, ...rest] = parentPath;
        if (!Number.isInteger(head) || head! < 0 || head! >= arr.length) {
            return arr.slice();
        }

        const clone = arr.slice();
        const child = clone[head!] as unknown;
        if (!Array.isArray(child)) {
            return clone;
        }

        clone[head!] = updateAtPath(
            child as unknown[],
            rest,
            updater as unknown as (child: unknown[]) => unknown[],
        ) as unknown as U;

        return clone;
    };

    if (keys == null) return data.slice();
    const keyList = Array.isArray(keys) ? keys : [keys];
    if (keyList.length === 0) return data.slice();

    // Single key fast-path preserves previous behavior
    if (keyList.length === 1) {
        const k = keyList[0]!;
        if (typeof k === "number") {
            return removeAt(data, k);
        }

        const parts = String(k)
            .split(".")
            .map((p) => (p.length ? Number(p) : NaN));
        
        if (parts.length === 1) {
            return removeAt(data, parts[0]!);
        }
        
        if (parts.some((n) => Number.isNaN(n))) {
            return data.slice();
        }

        return forgetPath(data, parts as number[]);
    }

    type Group = { path: number[]; indices: Set<number> };
    const groupsMap = new Map<string, Group>();

    for (const k of keyList) {
        if (typeof k === "number") {
            const key = ""; // root
            const entry = groupsMap.get(key) ?? {
                path: [],
                indices: new Set(),
            };
            entry.indices.add(k);
            groupsMap.set(key, entry);
            continue;
        }

        const parts = String(k)
            .split(".")
            .map((p) => (p.length ? Number(p) : NaN));
        if (parts.length === 0 || parts.some((n) => Number.isNaN(n))) {
            continue; // skip invalid
        }
        const parent = parts.slice(0, -1) as number[];
        const leaf = parts[parts.length - 1]! as number;
        const key = parent.join(".");
        const entry = groupsMap.get(key) ?? {
            path: parent,
            indices: new Set(),
        };
        entry.indices.add(leaf);
        groupsMap.set(key, entry);
    }

    // Apply groups sorted by deepest parent path first to avoid interfering updates
    const groups = Array.from(groupsMap.values()).sort(
        (a, b) => b.path.length - a.path.length,
    );

    let out = data.slice() as unknown[];
    for (const { path, indices } of groups) {
        const sorted = Array.from(indices)
            .filter((i) => Number.isInteger(i) && i >= 0)
            .sort((a, b) => b - a);
        if (sorted.length === 0) {
            continue;
        }

        out = updateAtPath(out, path, (child) => {
            const clone = child.slice();
            for (const idx of sorted) {
                if (idx >= 0 && idx < clone.length) {
                    clone.splice(idx, 1);
                }
            }
            return clone as unknown as T[];
        }) as unknown[];
    }

    return out as T[];
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
