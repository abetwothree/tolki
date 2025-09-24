import { Collection } from "@laravel-js/collection";

export type ArrayKey = number | string | null | undefined;
export type ArrayKeys =
    | number
    | string
    | null
    | undefined
    | Array<number | string | null | undefined>;

// Internal helpers shared by Arr path-based functions

export const isAccessible = (value: unknown): boolean => {
    return Array.isArray(value) || value instanceof Collection;
};

export const toArray = (value: unknown): unknown[] | null => {
    if (Array.isArray(value)) return value as unknown[];
    if (value instanceof Collection) return value.all() as unknown[];
    return null;
};

const typeOf = (v: unknown): string => {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    return typeof v;
};

export const parseSegments = (key: ArrayKey): number[] | null => {
    if (key == null) return [];
    if (typeof key === "number") {
        return Number.isInteger(key) && key >= 0 ? [key] : null;
    }

    const path = String(key);
    if (path.length === 0) {
        return [];
    }

    const parts = path.split(".");
    const segs: number[] = [];
    for (const p of parts) {
        const n = p.length ? Number(p) : NaN;
        if (!Number.isInteger(n) || n < 0) {
            return null;
        }
        segs.push(n);
    }
    return segs;
};

export const hasPath = (root: unknown[], key: ArrayKey): boolean => {
    if (key == null) return false;

    if (typeof key === "number") {
        return Number.isInteger(key) && key >= 0 && key < root.length;
    }

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) return false;

    let cursor: unknown = root;
    for (const s of segs) {
        const arr = toArray(cursor);
        if (!arr || s < 0 || s >= arr.length) return false;
        cursor = arr[s];
    }
    return true;
};

export const getRaw = (
    root: unknown[],
    key: ArrayKey,
): { found: boolean; value?: unknown } => {
    if (key == null) {
        return { found: true, value: root };
    }

    if (typeof key === "number") {
        if (!Number.isInteger(key) || key < 0 || key >= root.length) {
            return { found: false };
        }
        return { found: true, value: root[key] };
    }

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) return { found: false };

    let cursor: unknown = root;
    for (const s of segs) {
        const arr = toArray(cursor);
        if (!arr || s < 0 || s >= arr.length) return { found: false };
        cursor = arr[s];
    }
    return { found: true, value: cursor };
};

export const forgetKeys = <T>(data: ReadonlyArray<T>, keys: ArrayKeys): T[] => {
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

    if (keys == null) {
        return data.slice();
    }
    const keyList = Array.isArray(keys) ? keys : [keys];
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
    for (const k of Array.isArray(keys) ? keys : [keys]) {
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

export const setImmutable = <T>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    key: ArrayKey,
    value: T,
): T[] => {
    if (key == null) {
        return value as unknown as T[];
    }
    if (!isAccessible(data)) {
        return [] as T[];
    }
    const toArr = (value: unknown): unknown[] => {
        return Array.isArray(value)
            ? (value as unknown[]).slice()
            : (value as Collection<unknown[]>).all().slice();
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
        if (Array.isArray(next)) {
            const cloned = (next as unknown[]).slice();
            cursor[idx] = cloned;
            cursor = cloned;
            continue;
        }
        if (next instanceof Collection) {
            const cloned = (
                (next as Collection<unknown[]>).all() as unknown[]
            ).slice();
            cursor[idx] = cloned;
            cursor = cloned;
            continue;
        }
        return root as T[];
    }
    return out as T[];
};

export const pushWithPath = <T>(
    data: T[] | Collection<T[]> | unknown,
    key: ArrayKey,
    ...values: T[]
): T[] => {
    if (key == null) {
        if (Array.isArray(data)) {
            (data as unknown[]).push(...(values as unknown[]));
            return data as T[];
        }
        if (data instanceof Collection) {
            const arr = (data.all() as unknown[]).slice();
            arr.push(...(values as unknown[]));
            return arr as T[];
        }
        return [...(values as unknown[])] as T[];
    }

    if (!isAccessible(data)) {
        const out: unknown[] = [];
        const segs = parseSegments(key);
        if (!segs || segs.length === 0) return out as T[];
        const parentSegs = segs.slice(0, -1);
        const leaf = segs[segs.length - 1]!;
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
                } else if (Array.isArray(next)) {
                    cursor = next as unknown[];
                } else if (next instanceof Collection) {
                    const child = (
                        (next as Collection<unknown[]>).all() as unknown[]
                    ).slice();
                    cursor[idx] = child;
                    cursor = child;
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

    const isPlainArray = Array.isArray(data);
    const root: unknown[] = isPlainArray
        ? (data as unknown[])
        : (data as Collection<unknown[]>).all().slice();

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) {
        return isPlainArray ? (data as T[]) : (root as T[]);
    }
    const clamp = (idx: number, length: number): number => {
        return idx > length ? length : idx;
    };
    let cursor: unknown[] = root;
    for (let i = 0; i < segs.length - 1; i++) {
        const desired = segs[i]!;
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
        if (Array.isArray(next)) {
            cursor = next as unknown[];
            continue;
        }
        if (next instanceof Collection) {
            const child = (
                (next as Collection<unknown[]>).all() as unknown[]
            ).slice();
            cursor[idx] = child;
            cursor = child;
            continue;
        }
        throw new Error(
            `Array value for key [${String(key)}] must be an array, ${typeOf(next)} found.`,
        );
    }
    const leaf = segs[segs.length - 1]!;
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

export const dotFlatten = (
    data: ReadonlyArray<unknown> | Collection<unknown[]> | unknown,
    prepend: string = "",
): Record<string, unknown> => {
    if (!isAccessible(data)) return {};
    const root = (
        data instanceof Collection
            ? (data.all() as unknown[])
            : (data as unknown[])
    ) as unknown[];
    const out: Record<string, unknown> = {};
    const walk = (node: unknown, path: string): void => {
        const arr = Array.isArray(node)
            ? (node as unknown[])
            : node instanceof Collection
              ? (node.all() as unknown[])
              : null;
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
            const arr = Array.isArray(cursor) ? (cursor as unknown[]) : null;
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
                } else if (Array.isArray(next)) {
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
        if (Array.isArray(current)) {
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
 * @param data - The data to search in
 * @param key - The dot-notation key
 * @param defaultValue - Default value if not found
 * @returns The found value or default
 */
export const getMixedValue = <T, D = null>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
    key: ArrayKey,
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
        if (!isAccessible(data)) {
            return resolveDefault();
        }
        const root = toArray(data)!;
        const { found, value } = getRaw(root, key);
        return found ? value : resolveDefault();
    }

    const keyStr = String(key);
    
    // If it's a simple key without dots, try getRaw first
    if (!keyStr.includes('.')) {
        if (!isAccessible(data)) {
            return resolveDefault();
        }
        const root = toArray(data)!;
        const { found, value } = getRaw(root, key);
        return found ? value : resolveDefault();
    }

    // For dot notation, check if we have mixed notation (not all numeric)
    const segments = keyStr.split('.');
    const allNumeric = segments.every(seg => {
        const n = Number(seg);
        return Number.isInteger(n) && n >= 0;
    });

    // If all segments are numeric, use existing getRaw function
    if (allNumeric) {
        if (!isAccessible(data)) {
            return resolveDefault();
        }
        const root = toArray(data)!;
        const { found, value } = getRaw(root, key);
        return found ? value : resolveDefault();
    }

    // For mixed notation, use our helper
    const result = getNestedValue(data, keyStr);
    return result === undefined ? resolveDefault() : result;
};
