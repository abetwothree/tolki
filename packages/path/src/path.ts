import { wrap as arrWrap } from "@laravel-js/arr";
import { castableToArray, compareValues, getAccessibleValues,isAccessibleData, isArray, isBoolean, isFalsy, isFiniteNumber, isFloat, isFunction, isInteger, isMap, isNegativeNumber, isNonPrimitive, isNull, isNumber, isObject, isPositiveNumber, isPrimitive, isSet, isString, isStringable, isSymbol, isTruthy, isUndefined, isWeakMap, isWeakSet, normalizeToArray, resolveDefault, toArrayable, toJsonable, toJsonSerializable, typeOf } from '@laravel-js/utils';
import type { ArrayItems, ObjectKey, PathKey, PathKeys } from "packages/types";

/**
 * Parse a key into segments for mixed array/object path traversal.
 * Converts dot notation strings and numbers into path segments that can be
 * either numeric indices (for arrays) or string keys (for objects).
 *
 * @param key - The key to parse (number, string, null, or undefined).
 * @returns Array of path segments, or null if invalid.
 *
 * @example
 *
 * Parse different key types
 * parseSegments(5); -> [5]
 * parseSegments("1.2.3"); -> [1, 2, 3] (numeric segments)
 * parseSegments("user.name"); -> ["user", "name"] (string segments)
 * parseSegments("0.user.1.name"); -> [0, "user", 1, "name"] (mixed segments)
 * parseSegments(null); -> []
 */
export function parseSegments(key: PathKey): (number | string)[] | null {
    if (isNull(key)) {
        return [];
    }

    if (isNumber(key)) {
        return isInteger(key) && key >= 0 ? [key] : null;
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
        if (isInteger(n) && n >= 0) {
            segs.push(n);
        } else {
            // Use as string key for object properties
            segs.push(p);
        }
    }

    return segs;
}

/**
 * Check if a path exists in a nested array/object structure.
 * Traverses the structure using dot notation with mixed array indices and object keys.
 *
 * @param root - The root structure to search in.
 * @param key - The path to check (number, string, null, or undefined).
 * @returns True if the path exists, false otherwise.
 *
 * @example
 *
 * Check path existence in arrays
 * hasPath([['a', 'b'], ['c', 'd']], "0.1"); -> true
 * hasPath([['a', 'b']], "1.0"); -> false
 * hasPath(['x', 'y'], 1); -> true
 *
 * @example
 *
 * Check path existence in objects
 * hasPath([{name: 'John', age: 30}], "0.name"); -> true
 * hasPath({user: {profile: {name: 'Jane'}}}, "user.profile.name"); -> true
 * hasPath({items: ['a', 'b']}, "items.1"); -> true
 */
export function hasPath<TValue, TKey extends ObjectKey = ObjectKey>(
    root: TValue[] | Record<TKey, TValue>,
    key: PathKey,
): boolean {
    if (isNull(key)) {
        return false;
    }

    if (isNumber(key)) {
        if (isArray(root)) {
            return isInteger(key) && key >= 0 && key < root.length;
        }

        // For objects, numeric keys are treated as string keys
        return !isNull(root) && isObject(root) && String(key) in root;
    }

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) {
        return false;
    }

    let cursor: unknown = root;
    for (const s of segs) {
        if (isNull(cursor) || isObject(cursor)) {
            return false;
        }

        if (isNumber(s)) {
            // Numeric segment - check if cursor is an array
            const arr = castableToArray(cursor);
            if (!arr || s < 0 || s >= arr.length) {
                return false;
            }

            cursor = arr[s];
        } else {
            // String segment - check if cursor is an object
            if (isArray(cursor)) {
                return false; // Arrays don't have string keys
            }

            if (!isObject(cursor) || !(s in cursor)) {
                return false;
            }

            cursor = (cursor as Record<string, unknown>)[s];
        }
    }
    return true;
}

/**
 * Get a value from a nested array/object structure using dot notation.
 * Returns an object indicating whether the value was found and its value.
 *
 * @param root - The root structure to search in.
 * @param key - The path to retrieve (number, string, null, or undefined).
 * @returns Object with found status and value.
 *
 * @example
 *
 * Get values from arrays
 * getRaw([['a', 'b'], ['c']], "0.1"); -> { found: true, value: 'b' }
 * getRaw([['a']], "1.0"); -> { found: false }
 * getRaw(['x', 'y'], null); -> { found: true, value: ['x', 'y'] }
 *
 * @example
 *
 * Get values from objects
 * getRaw([{name: 'John', age: 30}], "0.name"); -> { found: true, value: 'John' }
 * getRaw({user: {profile: {name: 'Jane'}}}, "user.profile.name"); -> { found: true, value: 'Jane' }
 * getRaw({items: ['a', 'b']}, "items.1"); -> { found: true, value: 'b' }
 */
export function getRaw<TValue, TKey extends ObjectKey = ObjectKey>(
    root: TValue[] | Record<TKey, TValue>,
    key: PathKey,
): { found: boolean; value?: unknown } {
    if (isNull(key)) {
        return { found: true, value: root };
    }

    if (isNumber(key)) {
        if (isArray(root)) {
            if (!isInteger(key) || key < 0 || key >= root.length) {
                return { found: false };
            }
            return { found: true, value: root[key] };
        } else if (root != null && isObject(root)) {
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
    if (!segs || segs.length === 0) {
        return { found: false };
    }

    let cursor: unknown = root;
    for (const s of segs) {
        if (isNull(cursor) || !isObject(cursor)) {
            return { found: false };
        }

        if (isNumber(s)) {
            // Numeric segment - check if cursor is an array
            const arr = castableToArray(cursor);
            if (!arr || s < 0 || s >= arr.length) {
                return { found: false };
            }

            cursor = arr[s];
        } else {
            // String segment - check if cursor is an object
            if (isArray(cursor)) {
                return { found: false }; // Arrays don't have string keys
            }

            if (!isObject(cursor) || !(s in cursor)) {
                return { found: false };
            }

            cursor = (cursor as Record<string, unknown>)[s];
        }
    }
    return { found: true, value: cursor };
}

/**
 * Remove items from an array or object using dot notation keys (immutable).
 * Creates a new structure with specified items removed, supporting nested paths.
 *
 * @param data - The data to remove items from.
 * @param keys - The key(s) to remove (number, string, or array of keys).
 * @returns A new structure with the specified items removed.
 *
 * @example
 *
 * Remove keys from objects and arrays
 * forgetKeys({a: 1, b: 2}, 'a'); -> {b: 2}
 * forgetKeys(['x', 'y', 'z'], 1); -> ['x', 'z']
 * forgetKeys([{name: 'John', age: 30}], '0.age'); -> [{name: 'John'}]
 */
export function forgetKeys<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | ArrayItems<TValue>,
    keys: PathKeys,
): Record<TKey, TValue> | TValue[] {
    if (isObject(data)) {
        return forgetKeysObject(data, keys) as Record<TKey, TValue>;
    }

    return forgetKeysArray(data as ArrayItems<TValue>, keys) as TValue[];
}

/**
 * Remove properties from an object using dot notation keys (immutable).
 * Creates a new object with specified properties removed, supporting nested paths.
 *
 * @param data - The object to remove properties from.
 * @param keys - The key(s) to remove (string or array of strings).
 * @returns A new object with the specified properties removed.
 *
 * @example
 *
 * Remove object properties
 * forgetKeysObject({a: 1, b: {c: 2, d: 3}}, 'a'); -> {b: {c: 2, d: 3}}
 * forgetKeysObject({user: {name: 'John', age: 30}}, 'user.age'); -> {user: {name: 'John'}}
 * forgetKeysObject({a: 1, b: 2, c: 3}, ['a', 'c']); -> {b: 2}
 */
export function forgetKeysObject<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    keys: PathKeys,
): Record<TKey, TValue> {
    const keyList = isArray(keys) ? keys : [keys];
    const result = { ...data };

    for (const key of keyList) {
        if (isNull(key)) {
            continue;
        }

        const keyStr = String(key);

        // Handle simple property removal (no dots)
        if (!keyStr.includes(".")) {
            delete (result as Record<string, TValue>)[keyStr];
            continue;
        }

        // Handle nested property removal with dot notation
        const segments = keyStr.split(".");
        let current: Record<string, unknown> = result;

        // Navigate to the parent of the property to be removed
        for (let i = 0; i < segments.length - 1; i++) {
            const segment = segments[i];
            if (
                !segment ||
                !current[segment] ||
                !isObject(current[segment])
            ) {
                break; // Path doesn't exist, nothing to remove
            }

            // Clone the nested object to maintain immutability
            current[segment] = {
                ...(current[segment] as Record<string, unknown>),
            };

            current = current[segment] as Record<string, unknown>;
        }

        // Remove the final property
        const lastSegment = segments[segments.length - 1];

        if (lastSegment && !isUndefined(current[lastSegment])) {
            delete current[lastSegment];
        }
    }

    return result;
}

/**
 * Remove items from an array using dot notation keys (immutable).
 * Creates a new array with specified items removed, supporting nested paths.
 *
 * @param data - The array to remove items from.
 * @param keys - The key(s) to remove (number, string, or array of keys).
 * @returns A new array with the specified items removed.
 *
 * @example
 *
 * Remove items by keys
 * forgetKeys(['a', 'b', 'c'], 1); -> ['a', 'c']
 * forgetKeys([['x', 'y'], ['z']], "0.1"); -> [['x'], ['z']]
 * forgetKeys(['a', 'b', 'c'], [0, 2]); -> ['b']
 */
export function forgetKeysArray<TValue>(
    data: ArrayItems<TValue>,
    keys: PathKeys,
): TValue[] {
    // This mirrors Arr.forget implementation (immutable)
    const removeAt = <U>(arr: ArrayItems<U>, index: number): U[] => {
        if (!isInteger(index) || index < 0 || index >= arr.length) {
            return arr.slice();
        }
        
        const clone = arr.slice();
        clone.splice(index, 1);

        return clone;
    };

    const forgetPath = <U>(arr: ArrayItems<U>, path: number[]): U[] => {
        const head = path[0];
        const rest = path.slice(1);
        const clone = arr.slice();
        
        if (rest.length === 0) {
            return removeAt(clone, head!);
        }
        
        if (!isInteger(head) || head! < 0 || head! >= clone.length) {
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
        arr: ArrayItems<U>,
        parentPath: number[],
        updater: (child: U[]) => U[],
    ): U[] => {
        if (parentPath.length === 0) {
            return updater(arr.slice() as unknown as U[]) as unknown as U[];
        }
        
        const [head, ...rest] = parentPath;
        
        if (!isInteger(head) || head! < 0 || head! >= arr.length) {
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

    if (isNull(keys)) {
        return data.slice();
    }

    const keyList = isArray(keys) ? keys : [keys];
    if (keyList.length === 0) {
        return data.slice();
    }

    if (keyList.length === 1) {
        const k = keyList[0]!;
        if (isNumber(k)) {
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
        if (isNumber(k)) {
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
            .filter((i) => isInteger(i) && i >= 0)
            .sort((a, b) => b - a);
        
            if (sorted.length === 0) {
            continue;
        }

        out = updateAtPath(out, path, (child) => {
            const clone = child.slice();
            for (const idx of sorted) {
                if (idx >= 0 && idx < clone.length) clone.splice(idx, 1);
            }

            return clone as unknown as TValue[];
        }) as unknown[];
    }

    return out as TValue[];
}

/**
 * Set a value in an array using dot notation (immutable).
 * Creates a new array with the value set at the specified path.
 *
 * @param data - The array to set the value in.
 * @param key - The path where to set the value (number, string, null, or undefined).
 * @param value - The value to set.
 * @returns A new array with the value set at the specified path.
 *
 * @example
 *
 * Set values using dot notation
 * setImmutable(['a', 'b'], 1, 'x'); -> ['a', 'x']
 * setImmutable([['old']], "0.0", 'new'); -> [['new']]
 * setImmutable([], 0, 'first'); -> ['first']
 */
export function setImmutable<TValue>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    value: TValue,
): TValue[] {
    if (isNull(key)) {
        return value as unknown as TValue[];
    }

    if (!isArray(data)) {
        return [];
    }

    const toArr = (value: unknown): unknown[] => {
        return isArray(value) ? (value as unknown[]).slice() : [];
    };

    const root = toArr(data);

    const clampIndex = (idx: number, length: number): number => {
        if (!isInteger(idx) || idx < 0) {
            return -1;
        }

        return idx > length ? length : idx;
    };

    if (
        isNumber(key) ||
        (isString(key) && key.indexOf(".") === -1)
    ) {
        const raw = isNumber(key) ? key : Number(key);
        if (!isInteger(raw) || raw < 0) {
            return root as TValue[];
        }

        const idx = clampIndex(raw, root.length);
        if (idx === -1) {
            return root as TValue[];
        }

        const out = root.slice();
        if (idx === out.length) {
            out.push(value as unknown);
        } else {
            out[idx] = value as unknown;
        }

        return out as TValue[];
    }

    const parts = String(key).split(".");
    const segments: number[] = [];
    for (const p of parts) {
        const n = p.length ? Number(p) : NaN;
        if (!isInteger(n) || n < 0) {
            return root as TValue[];
        }

        segments.push(n);
    }

    const out = root.slice();
    let cursor: unknown[] = out;
    for (let i = 0; i < segments.length; i++) {
        const desired = segments[i]!;
        const atLast = i === segments.length - 1;
        const idx = clampIndex(desired, cursor.length);
        if (idx === -1) {
            return root as TValue[];
        }

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
        if (isNull(next)) {
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

        return root as TValue[];
    }
    return out as TValue[];
}

/**
 * Push values to an array at a specific path using dot notation.
 * Creates nested arrays as needed and pushes values to the target location.
 *
 * @param data - The array to push values into.
 * @param key - The path where to push values (number, string, null, or undefined).
 * @param values - The values to push.
 * @returns The modified array with values pushed at the specified path.
 *
 * @example
 *
 * Push values using dot notation
 * pushWithPath(['a'], null, 'b', 'c'); -> ['a', 'b', 'c']
 * pushWithPath([['x']], "0", 'y'); -> [['x', 'y']]
 * pushWithPath([], "0", 'first'); -> [['first']]
 */
export function pushWithPath<TValue>(
    data: TValue[] | unknown,
    key: PathKey,
    ...values: TValue[]
): TValue[] {
    if (isNull(key)) {
        if (isArray(data)) {
            (data as unknown[]).push(...(values as unknown[]));
            return data as TValue[];
        }

        return [...(values as unknown[])] as TValue[];
    }

    if (!isArray(data)) {
        const out: unknown[] = [];
        const segs = parseSegments(key);
        if (!segs || segs.length === 0) {
            return out as TValue[];
        }

        // Filter to only numeric segments for array operations
        const numericSegs = segs.filter(
            (s): s is number => isNumber(s),
        );
        if (numericSegs.length !== segs.length) {
            // Mixed paths not supported in this array-only function
            return out as TValue[];
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
                if (isNull(next)) {
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
            if (isBoolean(existing)) {
                throw new Error(
                    `Array value for key [${String(key)}] must be an array, boolean found.`,
                );
            }
        }

        cursor.push(...(values as unknown[]));

        return out as TValue[];
    }

    const isPlainArray = isArray(data);
    const root: unknown[] = isPlainArray ? (data as unknown[]) : [];

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) {
        return isPlainArray ? (data as TValue[]) : (root as TValue[]);
    }

    // Filter to only numeric segments for array operations
    const numericSegs = segs.filter((s): s is number => isNumber(s));
    if (numericSegs.length !== segs.length) {
        // Mixed paths not supported in this array-only function
        return isPlainArray ? (data as TValue[]) : (root as TValue[]);
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
        if (isNull(next)) {
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
        if (isBoolean(existing)) {
            throw new Error(
                `Array value for key [${String(key)}] must be an array, boolean found.`,
            );
        }
    }

    cursor.push(...(values as unknown[]));

    return isPlainArray ? (data as TValue[]) : (root as TValue[]);
}

/**
 * Flatten a nested structure into a flat object with dot notation keys.
 * Converts nested arrays and objects into a single-level object with path-based keys.
 *
 * @param data - The data to flatten.
 * @param prepend - Optional string to prepend to all keys.
 * @returns A flat object with dot-notated keys.
 *
 * @example
 *
 * Flatten mixed structures
 * dotFlatten({a: {b: 1}, c: [2, 3]}); -> {'a.b': 1, 'c.0': 2, 'c.1': 3}
 * dotFlatten(['x', {y: 'z'}], 'prefix'); -> {'prefix.0': 'x', 'prefix.1.y': 'z'}
 */
export function dotFlatten<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | ArrayItems<TValue> | unknown,
    prepend: string = "",
): Record<ObjectKey, TValue> {
    if (isObject(data)) {
        return dotFlattenObject(data, prepend);
    }

    if (isArray(data)) {
        return dotFlattenArray(data, prepend);
    }

    return dotFlattenArray(arrWrap(data), prepend);
}

/**
 * Flatten a nested object structure into a flat object with dot notation keys.
 * Converts nested objects into a single-level object with path-based keys.
 *
 * @param data - The object to flatten.
 * @param prepend - Optional string to prepend to all keys.
 * @returns A flat object with dot-notated keys.
 *
 * @example
 *
 * Flatten nested objects
 * dotFlattenObject({a: {b: {c: 1}}}); -> {'a.b.c': 1}
 * dotFlattenObject({user: {name: 'John'}}, 'data'); -> {'data.user.name': 'John'}
 */
export function dotFlattenObject<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    prepend: string = "",
): Record<ObjectKey, TValue> {
    if (!isObject(data)) {
        return {};
    }

    const results: Record<ObjectKey, TValue> = {} as Record<ObjectKey, TValue>;

    const walk = (obj: Record<TKey, TValue>, prefix: string): void => {
        for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
            const keyStr = String(key);
            const newKey = prefix ? prefix + "." + keyStr : keyStr;

            if (isObject(value) && Object.keys(value).length > 0) {
                walk(value as Record<TKey, TValue>, newKey);
            } else {
                results[newKey] = value;
            }
        }
    };

    walk(data as Record<TKey, TValue>, prepend);

    return results;
}

/**
 * Flatten a nested array structure into a flat object with dot notation keys.
 * Converts nested arrays into a single-level object with path-based keys.
 *
 * @param data - The array to flatten.
 * @param prepend - Optional string to prepend to all keys.
 * @returns A flat object with dot-notated keys.
 *
 * @example
 *
 * Flatten nested arrays
 * dotFlattenArray(['a', ['b', 'c']]); -> { '0': 'a', '1.0': 'b', '1.1': 'c' }
 * dotFlattenArray([['x']], "prefix"); -> { 'prefix.0.0': 'x' }
 */
export function dotFlattenArray<TValue>(
    data: ArrayItems<TValue> | unknown,
    prepend: string = "",
): Record<ObjectKey, TValue> {
    if (!isArray(data)) {
        return {};
    }

    const root = data as TValue[];
    const out: Record<ObjectKey, TValue> = {};
    const walk = (node: unknown, path: string): void => {
        const arr = isArray(node) ? (node as unknown[]) : null;
        if (!arr) {
            const key = prepend
                ? path
                    ? `${prepend}.${path}`
                    : prepend
                : path;
            if (key.length > 0) {
                out[key] = node as TValue;
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
}

/**
 * Expand a flat object with dot notation keys into a nested structure.
 * Converts a flattened object back into its original nested form, supporting both arrays and objects.
 *
 * @param map - The flat object with dot-notated keys.
 * @returns A nested structure (array or object).
 *
 * @example
 *
 * Expand flat objects to nested structures
 * undotExpand({'a.b.c': 1, 'a.d': 2}); -> {a: {b: {c: 1}, d: 2}}
 * undotExpand({'0': 'x', '1.name': 'John'}); -> ['x', {name: 'John'}]
 */
export function undotExpand<TValue, TKey extends ObjectKey = ObjectKey>(
    map: Record<TKey, TValue>,
): TValue[] | Record<TKey, TValue> {
    if (isObject(map)) {
        return undotExpandObject(map);
    }

    return undotExpandArray(map);
}

/**
 * Expand a flat object with dot notation keys into a nested object structure.
 * Converts a flattened object back into its original nested object form.
 *
 * @param map - The flat object with dot-notated keys.
 * @returns A nested object structure.
 *
 * @example
 *
 * Expand flat object to nested object
 * undotExpandObject({'user.name': 'John', 'user.age': 30}); -> {user: {name: 'John', age: 30}}
 * undotExpandObject({'a.b.c': 1, 'a.d': 2}); -> {a: {b: {c: 1}, d: 2}}
 */
export function undotExpandObject<TValue, TKey extends ObjectKey = ObjectKey>(
    map: Record<TKey, TValue>,
): Record<TKey, TValue> {
    const results: Record<string, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(map) as [TKey, TValue][]) {
        const keyStr = isSymbol(key) ? key.toString() : String(key);
        const result = setObjectValue(results, keyStr, value);
        Object.assign(results, result);
    }

    return results as Record<TKey, TValue>;
}

/**
 * Expand a flat object with dot notation keys into a nested array structure.
 * Converts a flattened object back into its original nested array form.
 *
 * @param map - The flat object with dot-notated keys.
 * @returns A nested array structure.
 *
 * @example
 *
 * Expand flat object to nested arrays
 * undotExpandArray({ '0': 'a', '1.0': 'b', '1.1': 'c' }); -> ['a', ['b', 'c']]
 * undotExpandArray({ '0.0.0': 'deep' }); -> [[['deep']]]
 */
export function undotExpandArray<TValue, TKey extends ObjectKey = ObjectKey>(
    map: Record<TKey, TValue>,
): TValue[] {
    const root: unknown[] = [];
    const isValidIndex = (seg: string): boolean => {
        const n = seg.length ? Number(seg) : NaN;
        return isInteger(n) && n >= 0;
    };
    for (const [rawKey, value] of Object.entries(map ?? {})) {
        if (!isString(rawKey) || rawKey.length === 0) {
            continue;
        }
        
        const segments = rawKey.split(".");
        if (segments.some((s) => !isValidIndex(s))) {
            continue;
        }

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
                if (isNull(next)) {
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
    
    return root as TValue[];
}

/**
 * Helper function to get nested values using mixed dot notation.
 * Supports both numeric indices for arrays and property names for objects.
 * This utility enables traversal of complex nested structures where arrays
 * and objects can be intermixed at any level.
 *
 * @param The object or array to traverse.
 * @param path - The dot-notation path to traverse (e.g., "0.items.1.name").
 * @returns The value at the specified path, or undefined if not found.
 *
 * @example
 *
 * Array with nested objects
 * getNestedValue([{items: ['x', 'y']}], '0.items.1'); -> 'y'
 *
 * @example
 *
 * Object with nested arrays
 * getNestedValue({users: [{name: 'John'}, {name: 'Jane'}]}, 'users.1.name'); -> 'Jane'
 *
 * @example
 *
 * Mixed nesting
 * getNestedValue([{data: {values: [1, 2, 3]}}], '0.data.values.2'); -> 3
 *
 * @example
 *
 * Path not found
 * getNestedValue([{items: ['x']}], '0.items.5'); -> undefined
 */
export function getNestedValue<TReturn>(
    obj: unknown, 
    path: string,
): TReturn | undefined {
    if (isFalsy(obj) || !isObject(obj)) {
        return undefined;
    }

    const segments = path.split(".");
    let current: unknown = obj;

    for (const segment of segments) {
        if (isNull(current) || !isObject(current)) {
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

    return current as TReturn | undefined;
}

/**
 * Get a value from a nested structure using mixed dot notation.
 * Supports both numeric indices for arrays and property names for objects.
 * This function bridges between the existing numeric-only getRaw function
 * and the new mixed notation support.
 *
 * @param data - The data to search in.
 * @param key - The dot-notation key.
 * @param defaultValue - Default value if not found.
 * @returns The found value or default.
 *
 * @example
 *
 * Get values with mixed notation
 * getMixedValue([{name: 'John'}], '0.name'); -> 'John'
 * getMixedValue(['a', 'b'], 1); -> 'b'
 * getMixedValue([], '0', 'default'); -> 'default'
 */
export function getMixedValue<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): TValue | TDefault | null {
    const resolveDefault = (): TDefault | null => {
        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : (defaultValue as TDefault);
    };

    if (isNull(key)) {
        return data as TValue;
    }

    // For simple numeric keys, use existing getRaw function
    if (isNumber(key)) {
        if (!isArray(data)) {
            return resolveDefault();
        }
        const root = castableToArray(data)!;
        const { found, value } = getRaw(root, key);
        return found ? (value as TValue) : resolveDefault();
    }

    const keyStr = String(key);

    // If it's a simple key without dots, try getRaw first
    if (!keyStr.includes(".")) {
        if (!isArray(data)) {
            return resolveDefault();
        }
        const root = castableToArray(data)!;
        const { found, value } = getRaw(root, key);
        return found ? (value as TValue) : resolveDefault();
    }

    // For dot notation, check if we have mixed notation (not all numeric)
    const segments = keyStr.split(".");
    const allNumeric = segments.every((seg) => {
        const n = Number(seg);
        return isInteger(n) && n >= 0;
    });

    // If all segments are numeric, use existing getRaw function
    if (allNumeric) {
        if (!isArray(data)) {
            return resolveDefault();
        }
        const root = castableToArray(data)!;
        const { found, value } = getRaw(root, key);
        return found ? (value as TValue) : resolveDefault();
    }

    // For mixed notation, use our helper
    const result = getNestedValue<TValue>(data, keyStr);

    return isUndefined(result) ? resolveDefault() : (result as TValue);
}

/**
 * Enhanced mixed array/object path functions for Laravel-style operations
 */

/**
 * Set a value in an array using mixed array/object dot notation (mutable version).
 * Supports both numeric array indices and object property names in paths.
 *
 * @param The root array to modify.
 * @param key - The path where to set the value.
 * @param value - The value to set.
 * @returns The modified original array.
 *
 * @example
 *
 * setMixed([{ name: "John" }], "0.age", 30); -> [{ name: "John", age: 30 }]
 * setMixed([], "user.name", "John"); -> [{ user: { name: "John" } }]
 */
export function setMixed<TValue>(
    arr: TValue[],
    key: PathKey,
    value: unknown,
): TValue[] {
    if (isNull(key) || isUndefined(key)) {
        // If key is null, replace the entire array
        arr.length = 0;
        if (isArray(value)) {
            arr.push(...(value as TValue[]));
        } else {
            arr.push(value as TValue);
        }
        return arr;
    }

    if (isNumber(key)) {
        // Direct array index
        if (isInteger(key) && key >= 0) {
            // Extend array if necessary
            while (arr.length <= key) {
                arr.push(undefined as unknown as TValue);
            }

            arr[key] = value as TValue;
        }

        return arr;
    }

    // Handle dot notation
    const segments = key.toString().split(".");
    let current: unknown = arr;

    // Validate first segment for arrays
    const firstSegment = segments[0];
    if (!firstSegment) {
        return arr;
    }

    const firstIndex = parseInt(firstSegment, 10);
    if (isArray(current)) {
        if (!isInteger(firstIndex) || firstIndex < 0) {
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

        if (isInteger(index) && index >= 0 && isArray(current)) {
            // Extend array if necessary
            while (current.length <= index) {
                current.push(undefined);
            }

            // If the next level doesn't exist or isn't an object/array, create it
            if (isNull(current[index]) || !isObject(current[index])) {
                const nextSegment = segments[i + 1];
                if (nextSegment) {
                    const nextIndex = parseInt(nextSegment, 10);
                    current[index] = (isInteger(nextIndex) ? [] : {}) as TValue;
                } else {
                    current[index] = {} as TValue;
                }
            }

            current = current[index];
        } else if (current != null && isObject(current)) {
            // Handle non-numeric keys (object properties)
            const obj = current as Record<string, unknown>;
            if (isNull(obj[segment]) || !isObject(obj[segment])) {
                const nextSegment = segments[i + 1];
                if (nextSegment) {
                    const nextIndex = parseInt(nextSegment, 10);
                    obj[segment] = isInteger(nextIndex) ? [] : {};
                } else {
                    obj[segment] = {};
                }
            }
            current = obj[segment];
        }
    }

    // Set the final value
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment) {
        return arr;
    }

    const lastIndex = parseInt(lastSegment, 10);

    if (isInteger(lastIndex) && lastIndex >= 0 && isArray(current)) {
        while (current.length <= lastIndex) {
            current.push(undefined as TValue);
        }
        current[lastIndex] = value as TValue;
    } else if (current != null && isObject(current)) {
        (current as Record<string, unknown>)[lastSegment] = value;
    }

    return arr;
}

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
 * pushMixed([], '0', 'value'); -> [['value']]
 * pushMixed([{items: []}], '0.items', 'new'); -> [{items: ['new']}]
 */
export function pushMixed<TValue>(
    data: TValue[] | unknown,
    key: PathKey,
    ...values: TValue[]
): TValue[] {
    if (isNull(key) || isUndefined(key)) {
        if (isArray(data)) {
            (data as unknown[]).push(...(values as unknown[]));
            return data as TValue[];
        }

        return [...(values as unknown[])] as TValue[];
    }

    if (!isArray(data)) {
        // Create a new array and set the values at the path
        const arr: unknown[] = [];
        setMixed(arr, key, values.length === 1 ? values[0] : values);
        return arr as TValue[];
    }

    // Navigate to the target using mixed paths
    const segments = key.toString().split(".");
    if (segments.length === 1) {
        // Simple case: push directly to root array at the specified index
        const idx = parseInt(segments[0]!, 10);
        if (isInteger(idx) && idx >= 0) {
            // Push directly to the array - don't create nested structure
            (data as unknown[]).push(...(values as unknown[]));
        }
        return data as TValue[];
    }

    // Complex case: navigate through mixed path (all segments except the last)
    let current: unknown = data;
    for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        if (!segment) continue;

        const index = parseInt(segment, 10);

        if (isInteger(index) && index >= 0 && isArray(current)) {
            // Extend array if necessary
            while (current.length <= index) {
                current.push(undefined);
            }

            // Create nested structure if needed
            if (isNull(current[index]) || !isObject(current[index])) {
                current[index] = [];
            }

            current = current[index];
        } else if (current != null && isObject(current)) {
            // Handle object properties
            const obj = current as Record<string, unknown>;
            if (isNull(obj[segment]) || !isObject(obj[segment])) {
                obj[segment] = [];
            }
            current = obj[segment];
        } else {
            // Can't navigate further
            return data as TValue[];
        }
    }

    // Push values directly to the current array (don't navigate to the last segment)
    if (isArray(current)) {
        current.push(...(values as unknown[]));
    }

    return data as TValue[];
}

/**
 * Set a value in an array using mixed array/object dot notation (immutable version).
 * Supports both numeric array indices and object property names in paths.
 *
 * @param data - The data to set the value in.
 * @param key - The path where to set the value.
 * @param value - The value to set.
 * @returns A new array with the value set.
 *
 * @example
 *
 * setMixedImmutable([{ name: "John" }], "0.age", 30); -> [{ name: "John", age: 30 }]
 * setMixedImmutable([], "user.name", "John"); -> [{ user: { name: "John" } }]
 */
export function setMixedImmutable<TValue>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    value: TValue,
): TValue[] {
    // Handle null key - replace entire data structure
    if (isNull(key) || isUndefined(key)) {
        return value as unknown as TValue[];
    }

    // If data is not accessible (not an array), return empty array
    if (!isArray(data)) {
        return [] as TValue[];
    }

    // Create a deep copy for immutable operation
    const deepCopy = (obj: unknown): unknown => {
        if (isNull(obj) || !isObject(obj)) {
            return obj;
        }

        if (isArray(obj)) {
            return obj.map(deepCopy);
        }

        if (isObject(obj)) {
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
    return setMixed(arr, key, value) as TValue[];
}

/**
 * Check if a key exists using mixed array/object dot notation.
 * Supports both numeric array indices and object property names in paths.
 *
 * @param data - The data to check.
 * @param key - The path to check.
 * @returns True if the path exists, false otherwise.
 *
 * @example
 *
 * hasMixed([{ name: "John" }], "0.name"); -> true
 * hasMixed([{ name: "John" }], "0.age"); -> false
 * hasMixed([], "user.name"); -> false
 */
export function hasMixed(data: unknown, key: PathKey): boolean {
    if (isNull(key)) {
        return data != null;
    }

    if (isNumber(key)) {
        return isArray(data) && key >= 0 && key < data.length;
    }

    if (isUndefined(key)) {
        return false;
    }

    // Use getNestedValue to check existence
    const result = getNestedValue(data, key.toString());

    return !isUndefined(result);
}

/**
 * Get a value from an object using dot notation.
 * This is an object-specific version that handles object property access.
 *
 * @param obj - The object to get the value from.
 * @param key - The key or dot-notated path.
 * @param defaultValue - The default value if the key is not found.
 * @returns The value or the default value.
 */
export function getObjectValue<TReturn = unknown, TDefault = null>(
    obj: unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): TReturn | TDefault | null {
    const resolveDefault = (): TDefault | null => {
        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : (defaultValue as TDefault);
    };

    if (isNull(key)) {
        return obj as TReturn;
    }

    if (!isObject(obj)) {
        return resolveDefault();
    }

    const keyStr = String(key);

    // Handle simple property access (no dots)
    if (!keyStr.includes(".")) {
        const value = (obj as Record<string, unknown>)[keyStr];

        return !isUndefined(value) ? (value as TReturn) : resolveDefault();
    }

    // Handle nested property access with dot notation
    const value = getNestedValue(obj, keyStr);

    return !isUndefined(value) ? (value as TReturn) : resolveDefault();
}

/**
 * Set a value in an object using dot notation.
 * This is an object-specific version that creates a new object.
 *
 * @param obj - The object to set the value in.
 * @param key - The key or dot-notated path.
 * @param value - The value to set.
 * @returns A new object with the value set.
 */
export function setObjectValue<TValue, TKey extends ObjectKey = ObjectKey>(
    obj: Record<TKey, TValue>,
    key: PathKey | null,
    value: unknown,
): Record<TKey, TValue> {
    if (isNull(key)) {
        return value as Record<TKey, TValue>;
    }

    if (!isObject(obj)) {
        obj = {} as Record<TKey, TValue>;
    }

    const result = { ...(obj as Record<TKey, unknown>) };
    const keyStr = String(key);

    // Handle simple property access (no dots)
    if (!keyStr.includes(".")) {
        result[keyStr as TKey] = value;
        
        return result as Record<TKey, TValue>;
    }

    // Handle nested property access with dot notation
    const segments = keyStr.split(".");
    let current: Record<string, unknown> = result;

    for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        if (!segment) {
            continue;
        }

        if (!current[segment] || !isObject(current[segment])) {
            current[segment] = {};
        } else {
            // Clone nested objects to maintain immutability
            current[segment] = {
                ...(current[segment] as Record<string, unknown>),
            };
        }

        current = current[segment] as Record<string, unknown>;
    }

    const lastSegment = segments[segments.length - 1];
    if (lastSegment) {
        current[lastSegment] = value;
    }

    return result as Record<TKey, TValue>;
}

/**
 * Check if a key exists in an object using dot notation.
 *
 * @param obj - The object to check.
 * @param key - The key or dot-notated path.
 * @returns True if the key exists, false otherwise.
 */
export function hasObjectKey<TValue, TKey extends ObjectKey = ObjectKey>(
    obj: Record<TKey, TValue> | unknown, 
    key: PathKey
): boolean {
    if (!isObject(obj) || isNull(key)) {
        return false;
    }

    const keyStr = String(key);

    // Handle simple property access (no dots)
    if (!keyStr.includes(".")) {
        return keyStr in (obj as Record<string, unknown>);
    }

    // Handle nested property access with dot notation
    const value = getNestedValue(obj, keyStr);

    return !isUndefined(value);
}
