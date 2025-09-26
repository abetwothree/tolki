import { isArray, typeOf, castableToArray } from "@laravel-js/utils";
import type { PathKey, PathKeys } from "packages/types";

/**
 * Parse a key into segments for mixed array/object path traversal.
 * Converts dot notation strings and numbers into path segments that can be
 * either numeric indices (for arrays) or string keys (for objects).
 *
 * @param {PathKey} key - The key to parse (number, string, null, or undefined).
 * @returns {(number | string)[] | null} Array of path segments, or null if invalid.
 * @example
 * Parse different key types
 * parseSegments(5); // -> [5]
 * parseSegments("1.2.3"); // -> [1, 2, 3] (numeric segments)
 * parseSegments("user.name"); // -> ["user", "name"] (string segments)
 * parseSegments("0.user.1.name"); // -> [0, "user", 1, "name"] (mixed segments)
 * parseSegments(null); // -> []
 */
export const parseSegments = (key: PathKey): (number | string)[] | null => {
    if (key == null) return [];
    if (typeof key === "number") {
        return Number.isInteger(key) && key >= 0 ? [key] : null;
    }

    const path = String(key);
    if (path.length === 0) {
        return [];
    }

    const parts = path.split(".");
    const segs: (number | string)[] = [];
    for (const p of parts) {
        if (p.length === 0) {
            // Empty segment is invalid
            return null;
        }

        // Try to parse as number first
        const n = Number(p);
        if (Number.isInteger(n) && n >= 0) {
            segs.push(n);
        } else {
            // Use as string key for object properties
            segs.push(p);
        }
    }
    return segs;
};

/**
 * Check if a path exists in a nested array/object structure.
 * Traverses the structure using dot notation with mixed array indices and object keys.
 *
 * @param {unknown[] | Record<string, unknown>} root - The root structure to search in.
 * @param {PathKey} key - The path to check (number, string, null, or undefined).
 * @returns {boolean} True if the path exists, false otherwise.
 * @example
 * Check path existence in arrays
 * hasPath([['a', 'b'], ['c', 'd']], "0.1"); // -> true
 * hasPath([['a', 'b']], "1.0"); // -> false
 * hasPath(['x', 'y'], 1); // -> true
 *
 * @example
 * Check path existence in objects
 * hasPath([{name: 'John', age: 30}], "0.name"); // -> true
 * hasPath({user: {profile: {name: 'Jane'}}}, "user.profile.name"); // -> true
 * hasPath({items: ['a', 'b']}, "items.1"); // -> true
 */
export const hasPath = (
    root: unknown[] | Record<string, unknown>,
    key: PathKey,
): boolean => {
    if (key == null) return false;

    if (typeof key === "number") {
        if (isArray(root)) {
            return Number.isInteger(key) && key >= 0 && key < root.length;
        }
        // For objects, numeric keys are treated as string keys
        return root != null && typeof root === "object" && String(key) in root;
    }

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) return false;

    let cursor: unknown = root;
    for (const s of segs) {
        if (cursor == null || typeof cursor !== "object") return false;

        if (typeof s === "number") {
            // Numeric segment - check if cursor is an array
            const arr = castableToArray(cursor);
            if (!arr || s < 0 || s >= arr.length) return false;
            cursor = arr[s];
        } else {
            // String segment - check if cursor is an object
            if (isArray(cursor)) return false; // Arrays don't have string keys
            if (!(s in cursor)) return false;
            cursor = (cursor as Record<string, unknown>)[s];
        }
    }
    return true;
};

/**
 * Get a value from a nested array/object structure using dot notation.
 * Returns an object indicating whether the value was found and its value.
 *
 * @param {unknown[] | Record<string, unknown>} root - The root structure to search in.
 * @param {PathKey} key - The path to retrieve (number, string, null, or undefined).
 * @returns {{ found: boolean; value?: unknown }} Object with found status and value.
 * @example
 * Get values from arrays
 * getRaw([['a', 'b'], ['c']], "0.1"); // -> { found: true, value: 'b' }
 * getRaw([['a']], "1.0"); // -> { found: false }
 * getRaw(['x', 'y'], null); // -> { found: true, value: ['x', 'y'] }
 *
 * @example
 * Get values from objects
 * getRaw([{name: 'John', age: 30}], "0.name"); // -> { found: true, value: 'John' }
 * getRaw({user: {profile: {name: 'Jane'}}}, "user.profile.name"); // -> { found: true, value: 'Jane' }
 * getRaw({items: ['a', 'b']}, "items.1"); // -> { found: true, value: 'b' }
 */
export const getRaw = (
    root: unknown[] | Record<string, unknown>,
    key: PathKey,
): { found: boolean; value?: unknown } => {
    if (key == null) {
        return { found: true, value: root };
    }

    if (typeof key === "number") {
        if (isArray(root)) {
            if (!Number.isInteger(key) || key < 0 || key >= root.length) {
                return { found: false };
            }
            return { found: true, value: root[key] };
        } else if (root != null && typeof root === "object") {
            // For objects, numeric keys are treated as string keys
            const stringKey = String(key);
            return stringKey in root
                ? {
                      found: true,
                      value: (root as Record<string, unknown>)[stringKey],
                  }
                : { found: false };
        }
        return { found: false };
    }

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) return { found: false };

    let cursor: unknown = root;
    for (const s of segs) {
        if (cursor == null || typeof cursor !== "object")
            return { found: false };

        if (typeof s === "number") {
            // Numeric segment - check if cursor is an array
            const arr = castableToArray(cursor);
            if (!arr || s < 0 || s >= arr.length) return { found: false };
            cursor = arr[s];
        } else {
            // String segment - check if cursor is an object
            if (isArray(cursor)) return { found: false }; // Arrays don't have string keys
            if (!(s in cursor)) return { found: false };
            cursor = (cursor as Record<string, unknown>)[s];
        }
    }
    return { found: true, value: cursor };
};

/**
 * Remove items from an array using dot notation keys (immutable).
 * Creates a new array with specified items removed, supporting nested paths.
 *
 * @param {ReadonlyArray<T>} data - The array to remove items from.
 * @param {PathKeys} keys - The key(s) to remove (number, string, or array of keys).
 * @returns {T[]} A new array with the specified items removed.
 * @example
 * Remove items by keys
 * forgetKeys(['a', 'b', 'c'], 1); // -> ['a', 'c']
 * forgetKeys([['x', 'y'], ['z']], "0.1"); // -> [['x'], ['z']]
 * forgetKeys(['a', 'b', 'c'], [0, 2]); // -> ['b']
 */
export const forgetKeys = <T>(data: ReadonlyArray<T>, keys: PathKeys): T[] => {
    // This mirrors Arr.forget implementation (immutable)
    const removeAt = <U>(arr: ReadonlyArray<U>, index: number): U[] => {
        if (!Number.isInteger(index) || index < 0 || index >= arr.length) {
            return arr.slice();
        }
        const clone = arr.slice();
        clone.splice(index, 1);
        return clone;
    };

    const forgetPath = <U>(arr: ReadonlyArray<U>, path: number[]): U[] => {
        const head = path[0];
        const rest = path.slice(1);
        const clone = arr.slice();
        if (rest.length === 0) {
            return removeAt(clone, head!);
        }
        if (!Number.isInteger(head) || head! < 0 || head! >= clone.length) {
            return clone;
        }
        const child = clone[head!] as unknown;
        if (isArray(child)) {
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
        if (!isArray(child)) {
            return clone;
        }
        clone[head!] = updateAtPath(
            child as unknown[],
            rest,
            updater as unknown as (child: unknown[]) => unknown[],
        ) as unknown as U;
        return clone;
    };

    if (keys == null) {
        return data.slice();
    }
    const keyList = isArray(keys) ? keys : [keys];
    if (keyList.length === 0) {
        return data.slice();
    }
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
    for (const k of isArray(keys) ? keys : [keys]) {
        if (typeof k === "number") {
            const key = "";
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
            continue;
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
    const groups = Array.from(groupsMap.values()).sort(
        (a, b) => b.path.length - a.path.length,
    );
    let out = data.slice() as unknown[];
    for (const { path, indices } of groups) {
        const sorted = Array.from(indices)
            .filter((i) => Number.isInteger(i) && i >= 0)
            .sort((a, b) => b - a);
        if (sorted.length === 0) continue;
        out = updateAtPath(out, path, (child) => {
            const clone = child.slice();
            for (const idx of sorted) {
                if (idx >= 0 && idx < clone.length) clone.splice(idx, 1);
            }
            return clone as unknown as T[];
        }) as unknown[];
    }
    return out as T[];
};

/**
 * Set a value in an array using dot notation (immutable).
 * Creates a new array with the value set at the specified path.
 *
 * @param {ReadonlyArray<T> | unknown} data - The array to set the value in.
 * @param {PathKey} key - The path where to set the value (number, string, null, or undefined).
 * @param {T} value - The value to set.
 * @returns {T[]} A new array with the value set at the specified path.
 * @example
 * Set values using dot notation
 * setImmutable(['a', 'b'], 1, 'x'); // -> ['a', 'x']
 * setImmutable([['old']], "0.0", 'new'); // -> [['new']]
 * setImmutable([], 0, 'first'); // -> ['first']
 */
export const setImmutable = <T>(
    data: ReadonlyArray<T> | unknown,
    key: PathKey,
    value: T,
): T[] => {
    if (key == null) {
        return value as unknown as T[];
    }
    if (!isArray<T>(data)) {
        return [];
    }
    const toArr = (value: unknown): unknown[] => {
        return isArray(value) ? (value as unknown[]).slice() : [];
    };
    const root = toArr(data);

    const clampIndex = (idx: number, length: number): number => {
        if (!Number.isInteger(idx) || idx < 0) return -1;
        return idx > length ? length : idx;
    };

    if (
        typeof key === "number" ||
        (typeof key === "string" && key.indexOf(".") === -1)
    ) {
        const raw = typeof key === "number" ? key : Number(key);
        if (!Number.isInteger(raw) || raw < 0) return root as T[];
        const idx = clampIndex(raw, root.length);
        if (idx === -1) return root as T[];
        const out = root.slice();
        if (idx === out.length) {
            out.push(value as unknown);
        } else {
            out[idx] = value as unknown;
        }
        return out as T[];
    }

    const parts = String(key).split(".");
    const segments: number[] = [];
    for (const p of parts) {
        const n = p.length ? Number(p) : NaN;
        if (!Number.isInteger(n) || n < 0) return root as T[];
        segments.push(n);
    }

    const out = root.slice();
    let cursor: unknown[] = out;
    for (let i = 0; i < segments.length; i++) {
        const desired = segments[i]!;
        const atLast = i === segments.length - 1;
        const idx = clampIndex(desired, cursor.length);
        if (idx === -1) return root as T[];
        if (atLast) {
            if (idx === cursor.length) {
                cursor.push(value as unknown);
            } else {
                cursor[idx] = value as unknown;
            }
            break;
        }
        if (idx === cursor.length) {
            const child: unknown[] = [];
            cursor.push(child);
            cursor = child;
            continue;
        }
        const next = cursor[idx];
        if (next == null) {
            const child: unknown[] = [];
            cursor[idx] = child;
            cursor = child;
            continue;
        }
        if (isArray(next)) {
            const cloned = (next as unknown[]).slice();
            cursor[idx] = cloned;
            cursor = cloned;
            continue;
        }

        return root as T[];
    }
    return out as T[];
};

/**
 * Push values to an array at a specific path using dot notation.
 * Creates nested arrays as needed and pushes values to the target location.
 *
 * @param {T[] | unknown} data - The array to push values into.
 * @param {PathKey} key - The path where to push values (number, string, null, or undefined).
 * @param {...T[]} values - The values to push.
 * @returns {T[]} The modified array with values pushed at the specified path.
 * @example
 * Push values using dot notation
 * pushWithPath(['a'], null, 'b', 'c'); // -> ['a', 'b', 'c']
 * pushWithPath([['x']], "0", 'y'); // -> [['x', 'y']]
 * pushWithPath([], "0", 'first'); // -> [['first']]
 */
export const pushWithPath = <T>(
    data: T[] | unknown,
    key: PathKey,
    ...values: T[]
): T[] => {
    if (key == null) {
        if (isArray(data)) {
            (data as unknown[]).push(...(values as unknown[]));
            return data as T[];
        }

        return [...(values as unknown[])] as T[];
    }

    if (!isArray(data)) {
        const out: unknown[] = [];
        const segs = parseSegments(key);
        if (!segs || segs.length === 0) return out as T[];

        // Filter to only numeric segments for array operations
        const numericSegs = segs.filter(
            (s): s is number => typeof s === "number",
        );
        if (numericSegs.length !== segs.length) {
            // Mixed paths not supported in this array-only function
            return out as T[];
        }

        const parentSegs = numericSegs.slice(0, -1);
        const leaf = numericSegs[numericSegs.length - 1]!;
        let cursor: unknown[] = out;
        for (const desired of parentSegs) {
            const idx = desired > cursor.length ? cursor.length : desired;
            if (idx === cursor.length) {
                const child: unknown[] = [];
                cursor.push(child);
                cursor = child;
            } else {
                const next = cursor[idx];
                if (next == null) {
                    const child: unknown[] = [];
                    cursor[idx] = child;
                    cursor = child;
                } else if (isArray(next)) {
                    cursor = next as unknown[];
                } else {
                    throw new Error(
                        `Array value for key [${String(key)}] must be an array, ${typeOf(next)} found.`,
                    );
                }
            }
        }
        if (leaf < cursor.length) {
            const existing = cursor[leaf];
            if (typeof existing === "boolean") {
                throw new Error(
                    `Array value for key [${String(key)}] must be an array, boolean found.`,
                );
            }
        }
        cursor.push(...(values as unknown[]));
        return out as T[];
    }

    const isPlainArray = isArray(data);
    const root: unknown[] = isPlainArray ? (data as unknown[]) : [];

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) {
        return isPlainArray ? (data as T[]) : (root as T[]);
    }

    // Filter to only numeric segments for array operations
    const numericSegs = segs.filter((s): s is number => typeof s === "number");
    if (numericSegs.length !== segs.length) {
        // Mixed paths not supported in this array-only function
        return isPlainArray ? (data as T[]) : (root as T[]);
    }

    const clamp = (idx: number, length: number): number => {
        return idx > length ? length : idx;
    };
    let cursor: unknown[] = root;
    for (let i = 0; i < numericSegs.length - 1; i++) {
        const desired = numericSegs[i]!;
        const idx = clamp(desired, cursor.length);
        if (idx === cursor.length) {
            const child: unknown[] = [];
            cursor.push(child);
            cursor = child;
            continue;
        }
        const next = cursor[idx];
        if (next == null) {
            const child: unknown[] = [];
            cursor[idx] = child;
            cursor = child;
            continue;
        }
        if (isArray(next)) {
            cursor = next as unknown[];
            continue;
        }

        throw new Error(
            `Array value for key [${String(key)}] must be an array, ${typeOf(next)} found.`,
        );
    }
    const leaf = numericSegs[numericSegs.length - 1]!;
    if (leaf < cursor.length) {
        const existing = cursor[leaf];
        if (typeof existing === "boolean") {
            throw new Error(
                `Array value for key [${String(key)}] must be an array, boolean found.`,
            );
        }
    }
    cursor.push(...(values as unknown[]));
    return isPlainArray ? (data as T[]) : (root as T[]);
};

/**
 * Flatten a nested array structure into a flat object with dot notation keys.
 * Converts nested arrays into a single-level object with path-based keys.
 *
 * @param {ReadonlyArray<unknown> | unknown} data - The array to flatten.
 * @param {string} prepend - Optional string to prepend to all keys.
 * @returns {Record<string, unknown>} A flat object with dot-notated keys.
 * @example
 * Flatten nested arrays
 * dotFlatten(['a', ['b', 'c']]); // -> { '0': 'a', '1.0': 'b', '1.1': 'c' }
 * dotFlatten([['x']], "prefix"); // -> { 'prefix.0.0': 'x' }
 */
export const dotFlatten = (
    data: ReadonlyArray<unknown> | unknown,
    prepend: string = "",
): Record<string, unknown> => {
    if (!isArray(data)) return {};
    const root = data as unknown[];
    const out: Record<string, unknown> = {};
    const walk = (node: unknown, path: string): void => {
        const arr = isArray(node) ? (node as unknown[]) : null;
        if (!arr) {
            const key = prepend
                ? path
                    ? `${prepend}.${path}`
                    : prepend
                : path;
            if (key.length > 0) {
                out[key] = node as unknown;
            }
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            const nextPath = path ? `${path}.${i}` : String(i);
            walk(arr[i], nextPath);
        }
    };
    walk(root, "");
    return out;
};

/**
 * Expand a flat object with dot notation keys into a nested array structure.
 * Converts a flattened object back into its original nested array form.
 *
 * @param {Record<string, unknown>} map - The flat object with dot-notated keys.
 * @returns {unknown[]} A nested array structure.
 * @example
 * Expand flat object to nested arrays
 * undotExpand({ '0': 'a', '1.0': 'b', '1.1': 'c' }); // -> ['a', ['b', 'c']]
 * undotExpand({ '0.0.0': 'deep' }); // -> [[['deep']]]
 */
export const undotExpand = (map: Record<string, unknown>): unknown[] => {
    const root: unknown[] = [];
    const isValidIndex = (seg: string): boolean => {
        const n = seg.length ? Number(seg) : NaN;
        return Number.isInteger(n) && n >= 0;
    };
    for (const [rawKey, value] of Object.entries(map ?? {})) {
        if (typeof rawKey !== "string" || rawKey.length === 0) continue;
        const segments = rawKey.split(".");
        if (segments.some((s) => !isValidIndex(s))) continue;
        let cursor: unknown = root;
        for (let i = 0; i < segments.length; i++) {
            const idx = Number(segments[i]!);
            const atEnd = i === segments.length - 1;
            const arr = isArray(cursor) ? (cursor as unknown[]) : null;
            if (!arr) {
                cursor = null;
                break;
            }
            if (atEnd) {
                arr[idx] = value as unknown;
            } else {
                const next = arr[idx];
                if (next == null) {
                    const child: unknown[] = [];
                    arr[idx] = child;
                    cursor = child;
                } else if (isArray(next)) {
                    cursor = next as unknown[];
                } else {
                    cursor = null;
                    break;
                }
            }
        }
    }
    return root;
};

/**
 * Helper function to get nested values using mixed dot notation.
 * Supports both numeric indices for arrays and property names for objects.
 * This utility enables traversal of complex nested structures where arrays
 * and objects can be intermixed at any level.
 *
 * @param {unknown} obj - The object or array to traverse.
 * @param {string} path - The dot-notation path to traverse (e.g., "0.items.1.name").
 * @returns {unknown} The value at the specified path, or undefined if not found.
 * @example
 *
 * Array with nested objects
 * getNestedValue([{items: ['x', 'y']}], '0.items.1'); // -> 'y'
 *
 * @example
 * Object with nested arrays
 * getNestedValue({users: [{name: 'John'}, {name: 'Jane'}]}, 'users.1.name'); // -> 'Jane'
 *
 * @example
 * Mixed nesting
 * getNestedValue([{data: {values: [1, 2, 3]}}], '0.data.values.2'); // -> 3
 *
 * @example
 * Path not found
 * getNestedValue([{items: ['x']}], '0.items.5'); // -> undefined
 */
export const getNestedValue = (obj: unknown, path: string): unknown => {
    if (!obj || typeof obj !== "object") {
        return undefined;
    }

    const segments = path.split(".");
    let current: unknown = obj;

    for (const segment of segments) {
        if (current == null || typeof current !== "object") {
            return undefined;
        }

        // Handle array access with numeric indices
        if (isArray(current)) {
            const index = parseInt(segment, 10);
            if (isNaN(index) || index < 0 || index >= current.length) {
                return undefined;
            }
            current = current[index];
        } else {
            // Handle object property access
            if (!(segment in current)) {
                return undefined;
            }
            current = (current as Record<string, unknown>)[segment];
        }
    }

    return current;
};

/**
 * Get a value from a nested structure using mixed dot notation.
 * Supports both numeric indices for arrays and property names for objects.
 * This function bridges between the existing numeric-only getRaw function
 * and the new mixed notation support.
 *
 * @param {ReadonlyArray<T> | unknown} data - The data to search in.
 * @param {PathKey} key - The dot-notation key.
 * @param {D | (() => D) | null} defaultValue - Default value if not found.
 * @returns {unknown} The found value or default.
 * @example
 * Get values with mixed notation
 * getMixedValue([{name: 'John'}], '0.name'); // -> 'John'
 * getMixedValue(['a', 'b'], 1); // -> 'b'
 * getMixedValue([], '0', 'default'); // -> 'default'
 */
export const getMixedValue = <T, D = null>(
    data: ReadonlyArray<T> | unknown,
    key: PathKey,
    defaultValue: D | (() => D) | null = null,
): unknown => {
    const resolveDefault = (): D | null => {
        return typeof defaultValue === "function"
            ? (defaultValue as () => D)()
            : (defaultValue as D);
    };

    if (key == null) {
        return data;
    }

    // For simple numeric keys, use existing getRaw function
    if (typeof key === "number") {
        if (!isArray(data)) {
            return resolveDefault();
        }
        const root = castableToArray(data)!;
        const { found, value } = getRaw(root, key);
        return found ? value : resolveDefault();
    }

    const keyStr = String(key);

    // If it's a simple key without dots, try getRaw first
    if (!keyStr.includes(".")) {
        if (!isArray(data)) {
            return resolveDefault();
        }
        const root = castableToArray(data)!;
        const { found, value } = getRaw(root, key);
        return found ? value : resolveDefault();
    }

    // For dot notation, check if we have mixed notation (not all numeric)
    const segments = keyStr.split(".");
    const allNumeric = segments.every((seg) => {
        const n = Number(seg);
        return Number.isInteger(n) && n >= 0;
    });

    // If all segments are numeric, use existing getRaw function
    if (allNumeric) {
        if (!isArray(data)) {
            return resolveDefault();
        }
        const root = castableToArray(data)!;
        const { found, value } = getRaw(root, key);
        return found ? value : resolveDefault();
    }

    // For mixed notation, use our helper
    const result = getNestedValue(data, keyStr);
    return result === undefined ? resolveDefault() : result;
};

/**
 * Enhanced mixed array/object path functions for Laravel-style operations
 */

/**
 * Set a value in an array using mixed array/object dot notation (mutable version).
 * Supports both numeric array indices and object property names in paths.
 *
 * @param {unknown[]} arr - The root array to modify.
 * @param {PathKey} key - The path where to set the value.
 * @param {unknown} value - The value to set.
 * @returns {unknown[]} The modified original array.
 *
 * @example
 *
 * setMixed([{ name: "John" }], "0.age", 30); // -> [{ name: "John", age: 30 }]
 * setMixed([], "user.name", "John"); // -> [{ user: { name: "John" } }]
 */
export const setMixed = (
    arr: unknown[],
    key: PathKey,
    value: unknown,
): unknown[] => {
    if (key == null) {
        // If key is null, replace the entire array
        arr.length = 0;
        if (isArray(value)) {
            arr.push(...value);
        } else {
            arr.push(value);
        }
        return arr;
    }

    if (typeof key === "number") {
        // Direct array index
        if (Number.isInteger(key) && key >= 0) {
            // Extend array if necessary
            while (arr.length <= key) {
                arr.push(undefined);
            }
            arr[key] = value;
        }
        return arr;
    }

    // Handle dot notation
    const segments = key.toString().split(".");
    let current: unknown = arr;

    // Validate first segment for arrays
    const firstSegment = segments[0];
    if (!firstSegment) return arr;

    const firstIndex = parseInt(firstSegment, 10);
    if (isArray(current)) {
        if (!Number.isInteger(firstIndex) || firstIndex < 0) {
            // If first segment is not a valid array index and array is not empty,
            // treat this as an invalid path and return unchanged
            if (current.length > 0) {
                return arr;
            }
            // If array is empty, create object at index 0 for non-numeric first segment
            current.push({});
            current = current[0];
        }
    }

    for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        if (!segment) continue;

        const index = parseInt(segment, 10);

        if (Number.isInteger(index) && index >= 0 && isArray(current)) {
            // Extend array if necessary
            while (current.length <= index) {
                current.push(undefined);
            }

            // If the next level doesn't exist or isn't an object/array, create it
            if (current[index] == null || typeof current[index] !== "object") {
                const nextSegment = segments[i + 1];
                if (nextSegment) {
                    const nextIndex = parseInt(nextSegment, 10);
                    current[index] = Number.isInteger(nextIndex) ? [] : {};
                } else {
                    current[index] = {};
                }
            }

            current = current[index];
        } else if (current != null && typeof current === "object") {
            // Handle non-numeric keys (object properties)
            const obj = current as Record<string, unknown>;
            if (obj[segment] == null || typeof obj[segment] !== "object") {
                const nextSegment = segments[i + 1];
                if (nextSegment) {
                    const nextIndex = parseInt(nextSegment, 10);
                    obj[segment] = Number.isInteger(nextIndex) ? [] : {};
                } else {
                    obj[segment] = {};
                }
            }
            current = obj[segment];
        }
    }

    // Set the final value
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment) return arr;

    const lastIndex = parseInt(lastSegment, 10);

    if (Number.isInteger(lastIndex) && lastIndex >= 0 && isArray(current)) {
        while (current.length <= lastIndex) {
            current.push(undefined);
        }
        current[lastIndex] = value;
    } else if (current != null && typeof current === "object") {
        (current as Record<string, unknown>)[lastSegment] = value;
    }

    return arr;
};

/**
 * Push values to an array at the specified mixed path.
 * Supports both numeric array indices and object property names in paths.
 *
 * @param data - The data to push values into.
 * @param key - The path where to push (supports mixed array/object paths).
 * @param values - The values to push.
 * @returns The modified array.
 *
 * @example
 *
 * pushMixed([], '0', 'value'); // -> [['value']]
 * pushMixed([{items: []}], '0.items', 'new'); // -> [{items: ['new']}]
 */
export const pushMixed = <T>(
    data: T[] | unknown,
    key: PathKey,
    ...values: T[]
): T[] => {
    if (key == null) {
        if (isArray(data)) {
            (data as unknown[]).push(...(values as unknown[]));
            return data as T[];
        }
        return [...(values as unknown[])] as T[];
    }

    if (!isArray(data)) {
        // Create a new array and set the values at the path
        const arr: unknown[] = [];
        setMixed(arr, key, values.length === 1 ? values[0] : values);
        return arr as T[];
    }

    // Navigate to the target using mixed paths
    const segments = key.toString().split(".");
    if (segments.length === 1) {
        // Simple case: push directly to root array at the specified index
        const idx = parseInt(segments[0]!, 10);
        if (Number.isInteger(idx) && idx >= 0) {
            // Push directly to the array - don't create nested structure
            (data as unknown[]).push(...(values as unknown[]));
        }
        return data as T[];
    }

    // Complex case: navigate through mixed path (all segments except the last)
    let current: unknown = data;
    for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        if (!segment) continue;

        const index = parseInt(segment, 10);

        if (Number.isInteger(index) && index >= 0 && isArray(current)) {
            // Extend array if necessary
            while (current.length <= index) {
                current.push(undefined);
            }

            // Create nested structure if needed
            if (current[index] == null || typeof current[index] !== "object") {
                current[index] = [];
            }

            current = current[index];
        } else if (current != null && typeof current === "object") {
            // Handle object properties
            const obj = current as Record<string, unknown>;
            if (obj[segment] == null || typeof obj[segment] !== "object") {
                obj[segment] = [];
            }
            current = obj[segment];
        } else {
            // Can't navigate further
            return data as T[];
        }
    }

    // Push values directly to the current array (don't navigate to the last segment)
    if (isArray(current)) {
        current.push(...(values as unknown[]));
    }

    return data as T[];
};

/**
 * Set a value in an array using mixed array/object dot notation (immutable version).
 * Supports both numeric array indices and object property names in paths.
 *
 * @param {ReadonlyArray<T> | unknown} data - The data to set the value in.
 * @param {PathKey} key - The path where to set the value.
 * @param {T} value - The value to set.
 * @returns {T[]} A new array with the value set.
 *
 * @example
 *
 * setMixedImmutable([{ name: "John" }], "0.age", 30); // -> [{ name: "John", age: 30 }]
 * setMixedImmutable([], "user.name", "John"); // -> [{ user: { name: "John" } }]
 */
export const setMixedImmutable = <T>(
    data: ReadonlyArray<T> | unknown,
    key: PathKey,
    value: T,
): T[] => {
    // Handle null key - replace entire data structure
    if (key === null || key === undefined) {
        return value as unknown as T[];
    }

    // If data is not accessible (not an array), return empty array
    if (!isArray(data)) {
        return [] as T[];
    }

    // Create a deep copy for immutable operation
    const deepCopy = (obj: unknown): unknown => {
        if (obj === null || typeof obj !== "object") return obj;
        if (isArray(obj)) return obj.map(deepCopy);
        if (typeof obj === "object") {
            const result: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(obj)) {
                result[k] = deepCopy(v);
            }
            return result;
        }
        return obj;
    };

    const arr = deepCopy(data) as unknown[];

    // Use the mutable version on the copy
    return setMixed(arr, key, value) as T[];
};

/**
 * Check if a key exists using mixed array/object dot notation.
 * Supports both numeric array indices and object property names in paths.
 *
 * @param {unknown} data - The data to check.
 * @param {PathKey} key - The path to check.
 * @returns {boolean} True if the path exists, false otherwise.
 *
 * @example
 *
 * hasMixed([{ name: "John" }], "0.name"); // -> true
 * hasMixed([{ name: "John" }], "0.age"); // -> false
 * hasMixed([], "user.name"); // -> false
 */
export const hasMixed = (data: unknown, key: PathKey): boolean => {
    if (key == null) {
        return data != null;
    }

    if (typeof key === "number") {
        return isArray(data) && key >= 0 && key < data.length;
    }

    // Use getNestedValue to check existence
    const result = getNestedValue(data, key.toString());
    return result !== undefined;
};
