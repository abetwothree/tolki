import type {
    ArrayItems,
    MapData,
    MapEntryValue,
    PathKey,
    PathKeys,
    UndotObjectValue,
    UndotValue,
} from "@tolki/types";
import {
    arrayKeyExistsError,
    arrayValueMessage,
    castableToArray,
    defineKey,
    InvalidArgumentException,
    isArray,
    isFloat,
    isFunction,
    isIllegalOffset,
    isInteger,
    isIntegerLikeKey,
    isMap,
    isNull,
    isNumber,
    isObject,
    isObjectAny,
    isPlainObject,
    isPrototypeObject,
    isString,
    isUndefined,
    isUnsafeKey,
    keyedEntries,
    phpArrayKey,
    readMapKey,
    toPhpKeyString,
    writeMapKey,
} from "@tolki/utils";

/**
 * Parse a key into segments for mixed array/object path traversal.
 * Converts dot notation strings and numbers into path segments that can be
 * either numeric indices (for arrays) or string keys (for objects). A segment
 * is an index only when PHP would store it as an integer key, so "01" stays a string.
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
 * parseSegments("0.01"); -> [0, "01"] (a non-canonical index is a string key)
 * parseSegments(null); -> []
 */
export function parseSegments(key: PathKey): (number | string)[] | null {
    if (isNull(key) || isUndefined(key)) {
        return [];
    }

    if (!isNumber(key) && Number.isNaN(key)) {
        return null;
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

        // Number() would also accept "01", " 1" or "1e0", which PHP keeps as string keys.
        const index = phpArrayKey(p);
        segs.push(isNumber(index) && index >= 0 ? index : p);
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
 * hasPath([{0: 'x'}], "0.0"); -> true
 */
export function hasPath<TValue, TKey extends PropertyKey = PropertyKey>(
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
        return (
            !isNull(root) &&
            isObject(root) &&
            readLiteralKey(root, String(key)).found
        );
    }

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) {
        return false;
    }

    let cursor: unknown = root;
    for (const s of segs) {
        if (isArray(cursor)) {
            // A list holds only its indices, so a string segment never names one of its items.
            if (!isNumber(s) || s >= cursor.length) {
                return false;
            }

            cursor = cursor[s];
        } else if (isMap(cursor)) {
            const entry = readMapKey(cursor, s);

            if (!entry.found) {
                return false;
            }

            cursor = entry.value;
        } else if (isObject(cursor) && Object.hasOwn(cursor, String(s))) {
            // An object stores an integer key as a string, so an index segment finds it as Arr::has does.
            cursor = cursor[String(s)];
        } else {
            return false;
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
 * getRaw([{0: 'x'}], "0.0"); -> { found: true, value: 'x' }
 */
export function getRaw<TValue, TKey extends PropertyKey = PropertyKey>(
    root: TValue[] | Record<TKey, TValue>,
    key: PathKey,
): { found: boolean; value?: unknown } {
    if (isNull(key) || isUndefined(key)) {
        return { found: true, value: root };
    }

    if (isNumber(key)) {
        if (isArray(root)) {
            if (!isInteger(key) || key < 0 || key >= root.length) {
                return { found: false };
            }
            return { found: true, value: root[key] };
        } else if (!isNull(root) && isObject(root)) {
            // For objects, numeric keys are treated as string keys
            return readLiteralKey(root, String(key));
        }
        return { found: false };
    }

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) {
        return { found: false };
    }

    let cursor: unknown = root;
    for (const s of segs) {
        if (isArray(cursor)) {
            // A list holds only its indices, so a string segment never names one of its items.
            if (!isNumber(s) || s >= cursor.length) {
                return { found: false };
            }

            cursor = cursor[s];
        } else if (isMap(cursor)) {
            const entry = readMapKey(cursor, s);

            if (!entry.found) {
                return { found: false };
            }

            cursor = entry.value;
        } else if (isObject(cursor) && Object.hasOwn(cursor, String(s))) {
            // An object stores an integer key as a string, so an index segment finds it as Arr::get does.
            cursor = cursor[String(s)];
        } else {
            return { found: false };
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
export function forgetKeys<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | ArrayItems<TValue>,
    keys: PathKeys,
): Record<TKey, TValue> | TValue[] {
    // Arr::forget asks array_key_exists about each key, which throws for one no array can hold, even over no items.
    if ((isArray(keys) ? keys : [keys]).some(isIllegalOffset)) {
        throw arrayKeyExistsError();
    }

    if (isObject(data)) {
        return forgetKeysObject(data, keys) as Record<TKey, TValue>;
    }

    return forgetKeysArray(data as ArrayItems<TValue>, keys) as TValue[];
}

/**
 * Remove properties from an object using dot notation keys (immutable).
 * Creates a new object with specified properties removed, supporting nested paths.
 * Mirrors Laravel's fixed Arr::forget behavior:
 * - Each key is resolved from the top level of the object.
 * - A key that exists literally at the top level (even if it contains dots)
 *   is removed literally instead of being dot-traversed.
 * - A null key names the '' key, and a float is looked up by its string form,
 *   as Arr::exists casts them; a float that names a literal key removes its
 *   integer part instead, as unset casts it.
 * - If an intermediate path segment is missing or not traversable, the key
 *   is skipped entirely and nothing is removed for that key.
 * - Traversal descends into both plain objects and arrays, the two shapes
 *   that stand in for a PHP array. Class instances and built-ins such as
 *   Date or Map are not traversable and are left untouched. When the final
 *   container is an array, a valid in-bounds integer leaf removes the item
 *   (via splice); otherwise the key is a no-op.
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
 * forgetKeysObject({'products.desk': {price: 100}}, 'products.desk'); -> {}
 * forgetKeysObject({a: {c: 5}}, 'a.b.c'); -> {a: {c: 5}}
 * forgetKeysObject({products: {desk: ['a', 'b']}}, 'products.desk.0'); -> {products: {desk: ['b']}}
 */
export function forgetKeysObject<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(data: Record<TKey, TValue>, keys: PathKeys): Record<TKey, TValue> {
    // Arr::forget's (array) cast makes a bare null no keys at all; a null among the keys is a key.
    const keyList =
        isNull(keys) || isUndefined(keys) ? [] : isArray(keys) ? keys : [keys];
    const result = { ...data };

    /**
     * Check whether a path segment is a valid array index for the given array.
     * Segments take PHP's array-key cast, the same convention used by
     * forgetKeysArray in this package, so "01" is a string key and not index 1.
     *
     * @param segment - The path segment to validate.
     * @param arr - The array the segment would index into.
     * @returns The integer index, or null if the segment is not a valid index.
     */
    const toArrayIndex = (segment: string, arr: unknown[]): number | null => {
        const index = phpArrayKey(segment);
        if (!isInteger(index) || index < 0 || index >= arr.length) {
            return null;
        }

        return index;
    };

    /**
     * Clone a container that a dot path may descend into, mirroring PHP's
     * accessible() check. Only arrays and plain objects stand in for PHP
     * arrays; class instances and built-ins such as Date or Map are not
     * traversable, so they are left untouched rather than being replaced by
     * a plain object that drops their contents.
     *
     * @param child - The value the path would descend into.
     * @returns A shallow clone of the container, or null if it is not traversable.
     */
    const cloneTraversable = (
        child: unknown,
    ): Record<string, unknown> | unknown[] | null => {
        if (isArray(child)) {
            return child.slice();
        }

        if (isObject(child)) {
            const prototype = Object.getPrototypeOf(child);

            if (prototype === Object.prototype || isNull(prototype)) {
                return { ...(child as Record<string, unknown>) };
            }
        }

        return null;
    };

    /**
     * Remove a single dot-notation key from the result, resolving from the
     * top level. Clones each container along the descended path (objects via
     * spread, arrays via slice) to maintain immutability.
     *
     * @param name - The key as Arr::exists looks it up and explode splits it into a path.
     * @param offset - The key unset removes when the name is a literal top-level key.
     * @returns Nothing; mutates only cloned containers inside the new result.
     */
    const forgetOne = (name: string, offset: string): void => {
        // A literal top-level key wins, even if it contains dots
        if (Object.hasOwn(result, name)) {
            delete (result as Record<string, TValue>)[offset];

            return;
        }

        const parts = name.split(".");
        let current: Record<string, unknown> | unknown[] = result as Record<
            string,
            unknown
        >;

        // Navigate to the parent of the property to be removed, cloning each
        // container along the way. If the path is broken, skip the key.
        while (parts.length > 1) {
            const part = parts.shift()!;

            if (isArray(current)) {
                const index = toArrayIndex(part, current);
                if (isNull(index)) {
                    return;
                }

                const clone = cloneTraversable(current[index]);
                if (isNull(clone)) {
                    return;
                }

                current[index] = clone;
                current = clone;

                continue;
            }

            if (!Object.hasOwn(current, part)) {
                return;
            }

            const clone = cloneTraversable(current[part]);
            if (isNull(clone)) {
                return;
            }

            current[part] = clone;
            current = clone;
        }

        // Remove the final property or array item
        const leaf = parts.shift()!;

        if (isArray(current)) {
            const index = toArrayIndex(leaf, current);
            if (!isNull(index)) {
                current.splice(index, 1);
            }

            return;
        }

        delete current[leaf];
    };

    for (const key of keyList) {
        const name = forgetName(key);

        // unset casts a float to its integer part, so a float that names a literal key removes that part instead.
        forgetOne(name, isFloat(key) ? String(phpArrayKey(key)) : name);
    }

    return result;
}

/**
 * Remove one or many array items from a copy of the given array using "dot" notation, walking lists and plain objects.
 *
 * @param data - The array to remove items from.
 * @param keys - The key(s) to remove (number, string, or array of keys).
 * @returns A new array with the specified items removed.
 *
 * @example
 *
 * Remove items by keys
 * forgetKeysArray(['a', 'b', 'c'], 1); -> ['a', 'c']
 * forgetKeysArray([['x', 'y'], ['z']], "0.1"); -> [['x'], ['z']]
 * forgetKeysArray(['a', 'b', 'c'], [0, 2]); -> ['b']
 * forgetKeysArray([{a: 1, b: 2}, {a: 3}], ['0.a', '1.a']); -> [{b: 2}, {}]
 */
export function forgetKeysArray<TValue>(
    data: ArrayItems<TValue>,
    keys: PathKeys,
): TValue[] {
    type Container = unknown[] | Record<string, unknown>;

    const result = data.slice() as unknown[];

    if (isNull(keys)) {
        return result as TValue[];
    }

    /**
     * Copy each container a parent path enters, descending only as PHP's `isset() && accessible()` lets Arr::forget.
     *
     * @param parent - The segments leading to the container a key's leaf is removed from.
     * @returns The copied container the path ends at, or null when the path meets anything else.
     */
    const copyParent = (parent: (number | string)[]): Container | null => {
        let cursor: Container = result;

        for (const segment of parent) {
            let child: unknown;

            if (isArray(cursor)) {
                // A list holds only its indices, so a string segment never names one of its items.
                child =
                    isNumber(segment) && segment >= 0
                        ? cursor[segment]
                        : undefined;
            } else if (Object.hasOwn(cursor, segment)) {
                // Only an own key counts: an inherited `__proto__` would lead the walk into Object.prototype.
                child = cursor[segment];
            }

            if (
                (!isArray(child) && !isPlainObject(child)) ||
                isPrototypeObject(child)
            ) {
                return null;
            }

            const copy: Container = isArray(child)
                ? child.slice()
                : { ...child };

            defineKey(cursor as Record<PropertyKey, unknown>, segment, copy);
            cursor = copy;
        }

        return cursor;
    };

    // Keys sharing a parent act together, so each one names the position it held before any removal, as in PHP.
    const groups = new Map<
        string,
        { parent: (number | string)[]; leaves: Set<number | string> }
    >();

    for (const key of isArray(keys) ? keys : [keys]) {
        // PHP's array-key cast, so "01" is a string key no list holds, not index 1.
        const segments = isInteger(key)
            ? [key]
            : forgetName(key).split(".").map(phpArrayKey);
        const parent = segments.slice(0, -1);
        const id = JSON.stringify(parent);
        const group = groups.get(id) ?? { parent, leaves: new Set() };

        group.leaves.add(segments[parent.length] as number | string);
        groups.set(id, group);
    }

    // Deeper parents go first, so splicing a list never shifts a path still to be walked.
    const ordered = [...groups.values()].sort(
        (a, b) => b.parent.length - a.parent.length,
    );

    for (const { parent, leaves } of ordered) {
        const container = copyParent(parent);

        if (isArray(container)) {
            const indices = [...leaves]
                .filter((leaf): leaf is number => isNumber(leaf) && leaf >= 0)
                .sort((a, b) => b - a);

            for (const index of indices) {
                container.splice(index, 1);
            }
        } else if (!isNull(container)) {
            for (const leaf of leaves) {
                delete container[leaf];
            }
        }
    }

    return result as TValue[];
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

    // At this point, data is guaranteed to be an array
    const root = (data as unknown[]).slice();

    // Clamp index to array bounds (allow one past end for appending)
    const clampIndex = (idx: number, length: number): number => {
        return idx > length ? length : idx;
    };

    if (isNumber(key) || (isString(key) && key.indexOf(".") === -1)) {
        // PHP's array-key cast, so "01" and "" are string keys, not index 1 or 0.
        const raw = isNumber(key) ? key : phpArrayKey(key);
        if (!isInteger(raw) || raw < 0) {
            return root as TValue[];
        }

        const idx = clampIndex(raw, root.length);
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
        const n = phpArrayKey(p);
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
 * Push an item into an array using "dot" notation, walking lists and plain objects and creating what is missing.
 *
 * @param data - The array to push values into.
 * @param key - The path where to push values (number, string, null, or undefined).
 * @param values - The values to push.
 * @returns The modified array with values pushed at the specified path.
 * @throws InvalidArgumentException if the value at the key is not an array.
 *
 * @example
 *
 * Push values using dot notation
 * pushWithPath(['a'], null, 'b', 'c'); -> ['a', 'b', 'c']
 * pushWithPath([['x']], "0", 'y'); -> [['x', 'y']]
 * pushWithPath([], "0", 'first'); -> [['first']]
 * pushWithPath([{x: [1]}], "0.x", 2); -> [{x: [1, 2]}]
 * pushWithPath([null], "0.child", 'v'); -> [{child: ['v']}]
 */
export function pushWithPath<TValue>(
    data: TValue[] | unknown,
    key: PathKey,
    ...values: TValue[]
): TValue[] {
    // Non-accessible data stands in for the empty array PHP's `Arr::push` would
    // have been handed, so both shapes build the same nested structure. A
    // prototype object joins it: writing there would land on a shared global.
    const root: unknown[] =
        isArray(data) && !isPrototypeObject(data) ? (data as unknown[]) : [];

    if (isNull(key) || isUndefined(key)) {
        root.push(...(values as unknown[]));

        return root as TValue[];
    }

    const segs = parseSegments(key);
    if (!segs || segs.length === 0) {
        return root as TValue[];
    }

    type Container = unknown[] | Record<PropertyKey, unknown>;

    /**
     * Find where a segment lands in a container: a list's index or a plain object's own key.
     *
     * @param container - The list or plain object the path has reached.
     * @param segment - The path segment to look up.
     * @returns The slot and whether the container holds it, or null for a string segment under a list.
     */
    const locate = (
        container: Container,
        segment: number | string,
    ): { slot: PropertyKey; present: boolean } | null => {
        if (isArray(container)) {
            // A list holds no string key; an index past its end appends, where PHP would leave a gapped key.
            if (!isNumber(segment)) {
                return null;
            }

            const slot = Math.min(segment, container.length);

            return { slot, present: slot < container.length };
        }

        const slot = String(segment);

        return { slot, present: Object.hasOwn(container, slot) };
    };

    let cursor: Container = root;

    for (const [depth, segment] of segs.slice(0, -1).entries()) {
        const place = locate(cursor, segment);
        if (isNull(place)) {
            return root as TValue[];
        }

        const next = place.present
            ? (cursor as Record<PropertyKey, unknown>)[place.slot]
            : undefined;

        if (isPrototypeObject(next)) {
            return root as TValue[];
        }

        if (isArray(next) || isPlainObject(next)) {
            cursor = next;

            continue;
        }

        // Arr::set swaps anything that is no array for a fresh one, shaped by the segment it holds next.
        const fresh: Container = isNumber(segs[depth + 1]) ? [] : {};

        defineKey(cursor as Record<PropertyKey, unknown>, place.slot, fresh);
        cursor = fresh;
    }

    const leaf = locate(cursor, segs[segs.length - 1] as number | string);
    if (isNull(leaf)) {
        return root as TValue[];
    }

    const target = cursor as Record<PropertyKey, unknown>;

    // `Arr::push` appends into the array AT the key, never beside it; an existing
    // value there must itself be an array (PHP's `Arr::array()` rule), and an
    // absent one becomes a fresh array first.
    if (!leaf.present) {
        defineKey(target, leaf.slot, []);
    }

    const list = target[leaf.slot];

    if (!isArray(list)) {
        throw new InvalidArgumentException(arrayValueMessage(list, key));
    }

    if (!isPrototypeObject(list)) {
        list.push(...(values as unknown[]));
    }

    return root as TValue[];
}

/**
 * Flatten a nested structure into a flat object with dot notation keys.
 * Converts nested arrays and plain objects into a single-level object with path-based keys;
 * any other object (a class instance, Date or Map) is kept whole as a value. The root itself
 * may be a Map, whose entries are flattened in its insertion order.
 *
 * @param data - The data to flatten.
 * @param prepend - Optional string to prepend to all keys.
 * @param depth - Optional maximum depth to flatten (default is Infinity).
 * @returns A flat object with dot-notated keys.
 *
 * @example
 *
 * Flatten mixed structures
 * dotFlatten({a: {b: 1}, c: [2, 3]}); -> {'a.b': 1, 'c.0': 2, 'c.1': 3}
 * dotFlatten(['x', {y: 'z'}], 'prefix'); -> {prefix0: 'x', 'prefix1.y': 'z'}
 */
export function dotFlatten<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | ArrayItems<TValue> | unknown,
    prepend: string = "",
    depth: number = Infinity,
): Record<PropertyKey, TValue> {
    if (isObject(data)) {
        return dotFlattenObject(data, prepend, depth);
    }

    if (isArray(data)) {
        return dotFlattenArray(data, prepend, depth);
    }

    // `Arr::wrap`'s own rule, written out: importing `wrap` from @tolki/arr for this one
    // call closed an import cycle, since arr already imports this module. Neither an object
    // nor an array reaches here, so the array pass-through arm cannot apply.
    return dotFlattenArray(
        isNull(data) ? [] : [data as TValue],
        prepend,
        depth,
    );
}

/**
 * Flatten a nested object structure into a flat object with dot notation keys.
 * Converts nested objects into a single-level object with path-based keys. A Map root is
 * read in its insertion order; a Map nested inside is kept whole as a value.
 *
 * @param data - The object or Map to flatten.
 * @param prepend - Optional string to prepend to all keys.
 * @param depth - Optional maximum depth to flatten (default is Infinity).
 * @returns A flat object with dot-notated keys.
 *
 * @example
 *
 * Flatten nested objects
 * dotFlattenObject({a: {b: {c: 1}}}); -> {'a.b.c': 1}
 * dotFlattenObject({user: {name: 'John'}}, 'data'); -> {'datauser.name': 'John'}
 */
export function dotFlattenObject<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(
    data: Record<TKey, TValue> | unknown,
    prepend: string = "",
    depth: number = Infinity,
): Record<PropertyKey, TValue> {
    if (!isObject(data)) {
        return {};
    }

    const results: Record<PropertyKey, TValue> = {} as Record<
        PropertyKey,
        TValue
    >;

    const walk = (
        obj: Record<TKey, TValue>,
        prefix: string,
        currentDepth: number,
    ): void => {
        for (const [key, value] of keyedEntries<TValue>(obj)) {
            // Arr::dot builds `$prefix.$key`, so a caller's prepend is used exactly as given.
            const newKey = `${prefix}${String(key)}`;

            if (currentDepth < depth && isArray(value) && value.length > 0) {
                walk(
                    value as unknown as Record<TKey, TValue>,
                    `${newKey}.`,
                    currentDepth + 1,
                );
            } else if (
                currentDepth < depth &&
                isPlainObject(value) &&
                Object.keys(value).length > 0
            ) {
                walk(
                    value as Record<TKey, TValue>,
                    `${newKey}.`,
                    currentDepth + 1,
                );
            } else {
                defineKey(results as Record<string, TValue>, newKey, value);
            }
        }
    };

    walk(data as Record<TKey, TValue>, prepend, 0);

    return results;
}

/**
 * Flatten a nested array structure into a flat object with dot notation keys.
 * Converts nested arrays into a single-level object with path-based keys.
 *
 * @param data - The array to flatten.
 * @param prepend - Optional string to prepend to all keys.
 * @param depth - Optional maximum depth to flatten (default is Infinity).
 * @returns A flat object with dot-notated keys.
 *
 * @example
 *
 * Flatten nested arrays
 * dotFlattenArray(['a', ['b', 'c']]); -> { '0': 'a', '1.0': 'b', '1.1': 'c' }
 * dotFlattenArray([['x']], "prefix"); -> { 'prefix0.0': 'x' }
 */
export function dotFlattenArray<TValue>(
    data: ArrayItems<TValue> | unknown,
    prepend: string = "",
    depth: number = Infinity,
): Record<PropertyKey, TValue> {
    if (!isArray(data)) {
        return {};
    }

    const root = data as TValue[];
    const out: Record<PropertyKey, TValue> = {};
    const walk = (arr: unknown[], path: string, currentDepth: number): void => {
        for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            const nextPath = `${path}${i}`;

            if (currentDepth < depth && isArray(item) && item.length > 0) {
                walk(item, `${nextPath}.`, currentDepth + 1);
            } else if (
                currentDepth < depth &&
                isPlainObject(item) &&
                Object.keys(item).length > 0
            ) {
                // PHP's is_array covers assoc arrays, which a plain object models; a class instance stays a leaf.
                for (const [key, value] of Object.entries(
                    dotFlattenObject(
                        item,
                        `${nextPath}.`,
                        depth - currentDepth - 1,
                    ),
                )) {
                    defineKey(
                        out as Record<string, TValue>,
                        key,
                        value as TValue,
                    );
                }
            } else {
                defineKey(
                    out as Record<string, TValue>,
                    nextPath,
                    item as TValue,
                );
            }
        }
    };

    walk(root, prepend, 0);

    return out;
}

/**
 * Expand a flat object with dot notation keys into a nested structure.
 *
 * Dispatches to {@link undotExpandObject} for a plain-object or Map `map`, a Map read in its insertion order;
 * nested consecutive-integer containers become real arrays, but the root always stays an object.
 *
 * @param map - The flat object or Map with dot-notated keys.
 * @returns A nested structure (array or object).
 *
 * @example
 *
 * undotExpand({'a.b.c': 1, 'a.d': 2}); -> {a: {b: {c: 1}, d: 2}}
 * undotExpand(new Map([['a.b', 1]])); -> {a: {b: 1}}
 */
// A Map takes the object branch, so it answers what undotExpandObject answers for one.
export function undotExpand<TMap>(
    map: MapData<TMap>,
): Record<string, UndotObjectValue<MapEntryValue<TMap>>>;
export function undotExpand<TValue, TKey extends PropertyKey = PropertyKey>(
    map: Record<TKey, TValue>,
): TValue[] | Record<TKey, TValue>;
export function undotExpand<TValue, TKey extends PropertyKey = PropertyKey>(
    map: Record<TKey, TValue>,
): TValue[] | Record<TKey, TValue> {
    if (isObject(map)) {
        return undotExpandObject(map);
    }

    // `map` narrows to `never` here, which the Map overload would claim, so the type arguments pick the record one.
    return undotExpandArray<TValue, TKey>(map);
}

/**
 * Replace a nested container with a real array when its own keys are exactly
 * "0".."n-1", mirroring PHP's `array_is_list`. Only touches containers the
 * expansion itself created, walked deepest-first.
 *
 * @param results - The expanded structure to mutate in place.
 * @param containerPaths - Dot-paths of containers the expansion created.
 */
function promoteConsecutiveIntegerContainers(
    results: Record<string, unknown>,
    containerPaths: Set<string>,
): void {
    const sortedPaths = [...containerPaths].sort(
        (a, b) => b.split(".").length - a.split(".").length,
    );

    for (const path of sortedPaths) {
        const segments = path.split(".");
        const lastSegment = segments[segments.length - 1] as string;
        const parentSegments = segments.slice(0, -1);

        const parent: unknown =
            parentSegments.length === 0
                ? results
                : getNestedValue(results, parentSegments.join("."));

        if (!isObject(parent)) {
            continue;
        }

        const container = (parent as Record<string, unknown>)[lastSegment];

        if (!isObject(container)) {
            continue;
        }

        const keys = Object.keys(container);
        const isConsecutiveList =
            keys.length > 0 && keys.every((k, i) => k === String(i));

        if (isConsecutiveList) {
            defineKey(
                parent as Record<string, unknown>,
                lastSegment,
                keys.map((k) => (container as Record<string, unknown>)[k]),
            );
        }
    }
}

/**
 * Expand a flat object with dot notation keys into a nested object structure.
 *
 * Nested containers whose own keys are the consecutive integers `0..n-1` are
 * rebuilt as real arrays (see {@link promoteConsecutiveIntegerContainers}); the
 * root always stays a plain object. A Map is read in its insertion order.
 *
 * @param map - The flat object or Map with dot-notated keys.
 * @returns A nested object structure.
 *
 * @example
 *
 * undotExpandObject({'user.name': 'John', 'user.age': 30}); -> {user: {name: 'John', age: 30}}
 * undotExpandObject(new Map([['a.b', 1], ['c', 2]])); -> {a: {b: 1}, c: 2}
 */
// A Map's keys are only known at runtime, so it answers a string-keyed record, as obj.undot's Map row does.
export function undotExpandObject<TMap>(
    map: MapData<TMap>,
): Record<string, UndotObjectValue<MapEntryValue<TMap>>>;
export function undotExpandObject<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(map: Record<TKey, TValue>): Record<TKey, TValue>;
export function undotExpandObject<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(map: Record<TKey, TValue>): Record<TKey, TValue> {
    const results: Record<string, TValue> = {} as Record<TKey, TValue>;
    const containerPaths = new Set<string>();

    // A Map keeps its insertion order, so when a dotted key and a plain key name the same place,
    // the later write wins, as in PHP.
    for (const [key, value] of keyedEntries<TValue>(map)) {
        const result = setObjectValue(results, key, value);
        // Object.assign uses [[Set]], so a "__proto__" key setObjectValue
        // returns as its own data would reparent results instead of copying.
        for (const [k, v] of Object.entries(result)) {
            defineKey(results, k, v);
        }

        const segments = key.split(".");
        for (let i = 1; i < segments.length; i++) {
            containerPaths.add(segments.slice(0, i).join("."));
        }
    }

    promoteConsecutiveIntegerContainers(
        results as Record<string, unknown>,
        containerPaths,
    );

    return results as Record<TKey, TValue>;
}

/**
 * Ceiling for a numeric `undot` segment: 2**24 keeps a fully materialized
 * array under ~134MB. `Arr.undot` also caps each container's own max index,
 * summed once per container, since N such containers cost N x ~134MB.
 */
export const MAX_UNDOT_INDEX = 2 ** 24 - 2;

/**
 * Whether `segment` is a canonical decimal integer PHP would treat as an
 * array key, and small enough to safely become a real array index.
 *
 * @param segment - The path segment to check.
 * @returns True if `segment` is a safe, canonical array index.
 */
export function isCanonicalUndotIndex(segment: string): boolean {
    return isIntegerLikeKey(segment) && Number(segment) <= MAX_UNDOT_INDEX;
}

/**
 * Expand a flat object with dot notation keys into a nested array structure.
 * Converts a flattened object back into its original nested array form. A Map is read
 * in its insertion order.
 *
 * @param map - The flat object or Map with dot-notated keys.
 * @returns A nested array structure.
 *
 * @example
 *
 * Expand flat object to nested arrays
 * undotExpandArray({ '0': 'a', '1.0': 'b', '1.1': 'c' }); -> ['a', ['b', 'c']]
 * undotExpandArray({ '0.0.0': 'deep' }); -> [[['deep']]]
 * undotExpandArray(new Map([['1', 'b'], ['0', 'a']])); -> ['a', 'b']
 */
// A Map's string keys may be dotted index paths, so a value may sit inside nested lists.
export function undotExpandArray<TMap>(
    map: MapData<TMap>,
): UndotValue<MapEntryValue<TMap>>[];
export function undotExpandArray<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(map: Record<TKey, TValue>): TValue[];
export function undotExpandArray<
    TValue,
    TKey extends PropertyKey = PropertyKey,
>(map: Record<TKey, TValue>): TValue[] {
    const root: unknown[] = [];
    // A Map keeps its insertion order, so the later of two writes to one place wins, as in PHP, except that a
    // dotted key running through a scalar an earlier key wrote is skipped, where PHP's later write replaces it.
    for (const [rawKey, value] of keyedEntries<TValue>(map ?? {})) {
        if (rawKey.length === 0) {
            continue;
        }

        const segments = rawKey.split(".");
        if (segments.some((s) => !isCanonicalUndotIndex(s))) {
            continue;
        }

        let cursor: unknown[] = root;
        for (let i = 0; i < segments.length; i++) {
            const idx = Number(segments[i]!);
            const atEnd = i === segments.length - 1;

            if (atEnd) {
                cursor[idx] = value as unknown;
            } else {
                const next = cursor[idx];
                if (isNull(next) || isUndefined(next)) {
                    const child: unknown[] = [];
                    cursor[idx] = child;
                    cursor = child;
                } else if (isArray(next)) {
                    cursor = next as unknown[];
                } else {
                    // Non-array value found at intermediate segment, skip this key
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
 * A Map, read by the key PHP stores
 * getNestedValue({m: new Map([[2, 'c'], [0, 'a']])}, 'm.0'); -> 'a'
 *
 * @example
 *
 * Path not found
 * getNestedValue([{items: ['x']}], '0.items.5'); -> undefined
 */
export function getNestedValue<TReturn>(
    obj: unknown,
    path: PropertyKey,
): TReturn | undefined {
    // Accept both arrays and objects - just check for null/undefined
    if (isNull(obj) || isUndefined(obj)) {
        return undefined;
    }

    // Must be an object or array to traverse
    if (!isObjectAny(obj)) {
        return undefined;
    }

    // Normalize the path to a string, whatever its original key type.
    const pathStr = String(path);

    // Split path into segments
    const segments = pathStr.split(".");
    let current: unknown = obj;

    for (const segment of segments) {
        if (isNull(current) || isUndefined(current) || !isObjectAny(current)) {
            return undefined;
        }

        // Handle array access with numeric indices
        if (isArray(current)) {
            // A list only has canonical indices; parseInt("01") == 1 would wrongly
            // accept a key no PHP array stores, unlike phpArrayKey's strict cast.
            const index = phpArrayKey(segment);
            if (!isNumber(index) || !Object.hasOwn(current, index)) {
                return undefined;
            }
            current = current[index];
        } else if (isMap(current)) {
            const entry = readMapKey(current, segment);

            if (!entry.found) {
                return undefined;
            }

            current = entry.value;
        } else {
            // Handle object property access
            if (!Object.hasOwn(current as object, segment)) {
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
    // PHP's array-key cast, so "01" and "" name string keys the mixed reader has
    // to resolve; Number() called them indices and sent them to the list reader.
    const allNumeric = segments.every((seg) => {
        const n = phpArrayKey(seg);
        return isNumber(n) && n >= 0;
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
 * Determine whether a path segment's value is a container a write descends into.
 *
 * `Arr::set` tests `is_array`, so a class instance or `Date` is not a container: the write replaces it wholesale
 * rather than merging onto it. A `Map` stands for a PHP array, so the write descends into it.
 *
 * @param value - The value found at a path segment.
 * @returns True when the value is a list, a plain object or a Map.
 */
function isWritableContainer(value: unknown): boolean {
    return isArray(value) || isPlainObject(value) || isMap(value);
}

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
    // A prototype object is shared by everything that inherits from it, so no
    // caller-supplied path may write into one, array-shaped or not.
    if (isPrototypeObject(arr)) {
        return arr;
    }

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

    // PHP subscripts the array with the segment itself, so PHP's array-key cast
    // decides: "01" and "" stay string keys and only a canonical integer indexes.
    const segments = key.toString().split(".").map(phpArrayKey);
    let current: unknown = arr;

    // A first segment that is no list index cannot address the root array, so an
    // empty root becomes the single record the rest of the path writes into.
    const firstSegment = segments[0];
    if (
        !(isNumber(firstSegment) && firstSegment >= 0) &&
        (current as unknown[]).length === 0
    ) {
        (current as unknown[]).push({});
        current = (current as unknown[])[0];
        // Otherwise fall through: Arr::set stores a key that is no array
        // index on the array itself, and a JS array is an object, so it
        // can carry it as an own property rather than losing the value.
    }

    for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        const nextSegment = segments[i + 1];

        if (isNumber(segment) && segment >= 0 && isArray(current)) {
            // Extend array if necessary
            while (current.length <= segment) {
                current.push(undefined);
            }

            // If the next level doesn't exist or isn't an object/array, create it
            const nextValue = current[segment];
            if (!isWritableContainer(nextValue)) {
                current[segment] = (isNumber(nextSegment) ? [] : {}) as TValue;
            }

            current = current[segment];
        } else if (isMap(current)) {
            const mapKey = String(segment);
            let child = readMapKey(current, mapKey).value;

            if (!isWritableContainer(child)) {
                child = isNumber(nextSegment) ? [] : {};
                writeMapKey(current, mapKey, child);
            }

            current = child;
        } else {
            // Handle non-numeric keys (object properties)
            // At this point, current is guaranteed to be an object (or array treated as object)
            // because we always create structure before navigating
            const obj = current as Record<string, unknown>;
            const property = String(segment);
            const unsafe = isUnsafeKey(property);
            // An unsafe key not yet its own risks reading the inherited
            // accessor/data value (e.g. Object.prototype); treat it as absent.
            const nextValue =
                unsafe && !Object.hasOwn(obj, property)
                    ? undefined
                    : obj[property];
            if (!isWritableContainer(nextValue)) {
                defineKey(
                    obj,
                    property,
                    (isNumber(nextSegment) ? [] : {}) as TValue,
                );
            } else if (unsafe) {
                // An owned unsafe key can itself be a live reference to a
                // global (e.g. its value literally IS Object.prototype);
                // clone it so the write below never lands on the real thing.
                defineKey(
                    obj,
                    property,
                    (isArray(nextValue)
                        ? [...(nextValue as unknown[])]
                        : isMap(nextValue)
                          ? new Map(nextValue)
                          : {
                                ...(nextValue as Record<string, unknown>),
                            }) as TValue,
                );
            }
            current = obj[property];
        }

        // Descending into one makes every write below it global, so the same
        // refusal has to apply at each step, not only at the root.
        if (isPrototypeObject(current)) {
            return arr;
        }
    }

    // JS-only: the else branch stores a non-index key as the list's OWN property, which is no
    // element — get misses it, has too EXCEPT for a negative index, and except, add and set drop
    // it, all PHP keeps (docs/php-parity/Arr/set.json, "own-key-channel-*"). only, forget agree.
    const lastSegment = segments[segments.length - 1];

    if (isNumber(lastSegment) && lastSegment >= 0 && isArray(current)) {
        while (current.length <= lastSegment) {
            current.push(undefined as TValue);
        }
        current[lastSegment] = value as TValue;
    } else if (isMap(current)) {
        writeMapKey(current, String(lastSegment), value);
    } else if (!isNull(current) && isObjectAny(current)) {
        // The traversal above builds structure as it goes, so `current` is
        // an array or plain object here for any array-shaped root — this
        // guard only matters for a caller-supplied root that never was one.
        defineKey(
            current as Record<string, unknown>,
            String(lastSegment),
            value,
        );
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
    // A prototype object is shared by everything that inherits from it, so no
    // caller-supplied path may push into one, array-shaped or not.
    if (isPrototypeObject(data)) {
        return data as TValue[];
    }

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

    // Navigate to the target using mixed paths. PHP subscripts with the segment
    // itself, so only a canonical integer names an index; "01" is a string key.
    const segments = key.toString().split(".");
    if (segments.length === 1) {
        // Simple case: push directly to root array at the specified index
        const idx = phpArrayKey(segments[0]!);
        if (isNumber(idx) && idx >= 0) {
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

        const index = phpArrayKey(segment);

        if (isNumber(index) && index >= 0 && isArray(current)) {
            // Extend array if necessary
            while (current.length <= index) {
                current.push(undefined);
            }

            // Create nested structure if needed
            if (isNull(current[index]) || !isObject(current[index])) {
                current[index] = [];
            }

            current = current[index];
        } else if (!isNull(current) && isObject(current)) {
            // Handle object properties
            const obj = current as Record<string, unknown>;
            const unsafe = isUnsafeKey(segment);
            // An unsafe key not yet its own risks reading the inherited
            // accessor/data value (e.g. Object.prototype); treat it as absent.
            const existing =
                unsafe && !Object.hasOwn(obj, segment)
                    ? undefined
                    : obj[segment];
            if (isNull(existing) || !isObject(existing)) {
                defineKey(obj, segment, []);
            } else if (unsafe) {
                // An owned unsafe key can itself be a live reference to a
                // global (e.g. its value literally IS Object.prototype);
                // clone it so later writes never land on the real thing.
                defineKey(obj, segment, {
                    ...(existing as Record<string, unknown>),
                });
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
 * The copy is deep through arrays, plain objects and Maps, which stand for PHP arrays; a Map stays a Map in its key
 * order. A class instance or a `Date` is aliased into the result rather than copied, because PHP holds an object by
 * handle where it copies an array by value — copying one's entries flattened it into a plain object.
 * Such a value is shared with the caller's input; the write path itself is never shared.
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

    // Copy every array, plain object and Map along the way, so the caller's value is never written
    // through. A class instance or Date is ALIASED into the result instead — deliberately:
    // PHP holds an object by handle, and copying its entries flattened it into a plain object.
    const deepCopy = (obj: unknown): unknown => {
        // Return primitives and null/undefined as-is
        if (isNull(obj) || isUndefined(obj) || !isObjectAny(obj)) {
            return obj;
        }

        if (isArray(obj)) {
            return obj.map(deepCopy);
        }

        if (isMap(obj)) {
            return new Map(
                [...obj].map(([mapKey, mapValue]): [unknown, unknown] => [
                    mapKey,
                    deepCopy(mapValue),
                ]),
            );
        }

        // A class instance or a Date is no PHP array: copying its entries flattened it
        // into a plain object, and setMixed then MERGED onto it where `is_array` replaces it
        // wholesale. PHP holds an object by handle, so sharing the reference is the copy.
        if (!isPlainObject(obj)) {
            return obj;
        }

        // Object case - obj is a non-null, non-array plain object
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
            defineKey(result, k, deepCopy(v));
        }
        return result;
    };

    const arr = deepCopy(data) as unknown[];

    // Use the mutable version on the copy
    return setMixed(arr, key, value) as TValue[];
}

/**
 * Check if a key exists using mixed array/object dot notation.
 *
 * A literal key wins over path traversal even when it contains dots; this
 * fast path only applies to plain objects, since a JS array's `in` operator
 * also climbs `Array.prototype`.
 *
 * @param data - The data to check.
 * @param key - The path to check.
 * @returns True if the path exists, false otherwise.
 *
 * @example
 *
 * hasMixed([{ name: "John" }], "0.name"); -> true
 */
export function hasMixed(data: unknown, key: PathKey): boolean {
    if (isNull(key) || isUndefined(key)) {
        // Check if data exists and has accessible values
        if (isNull(data) || isUndefined(data)) {
            return false;
        }

        // For arrays, check if they have elements
        if (isArray(data)) {
            return data.length > 0;
        }

        // For objects, check if they have keys
        if (isObject(data)) {
            return Object.keys(data).length > 0;
        }

        // For other types (primitives), return true as they exist
        return true;
    }

    if (isNumber(key)) {
        if (isArray(data)) {
            return key >= 0 && key < data.length;
        }

        return isObject(data) && readLiteralKey(data, String(key)).found;
    }

    if (!isArray(data) && !isObject(data)) {
        return false;
    }

    const keyStr = key.toString();

    // Literal key wins even with dots, but only for plain objects — arrays fall
    // through to bounds-checked traversal below, since a JS array's `in` climbs
    // `Array.prototype` and would wrongly report existence for keys no PHP array has.
    if (isObject(data)) {
        if (readLiteralKey(data, keyStr).found) {
            return true;
        }

        if (!keyStr.includes(".")) {
            return false;
        }
    }

    // Use getNestedValue to check existence
    const result = getNestedValue(data, keyStr);

    return !isUndefined(result);
}

/**
 * Get a value from an object using dot notation.
 * This is an object-specific version that handles object property access.
 *
 * A literal key wins over dot-path traversal even when it contains dots,
 * and a literal key whose value is `undefined` still counts as found.
 *
 * @param obj - The object to get the value from.
 * @param key - The key or dot-notated path.
 * @param defaultValue - The default value if the key is not found.
 * @returns The value or the default value.
 */
export function getObjectValue<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TReturn = unknown,
    TDefault = null,
>(
    obj: Record<TKey, TValue> | unknown,
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

    // The literal key wins even when it contains dots. Presence, not
    // definedness, decides: a literal key whose value is `undefined` is
    // still "found" and resolves to the default, not dot-path traversal.
    const literal = readLiteralKey(obj, keyStr);

    if (literal.found) {
        return !isUndefined(literal.value)
            ? (literal.value as TReturn)
            : resolveDefault();
    }

    if (!keyStr.includes(".")) {
        return resolveDefault();
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
export function setObjectValue<TValue, TKey extends PropertyKey = PropertyKey>(
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
        defineKey(result as Record<string, unknown>, keyStr, value);

        return result as Record<TKey, TValue>;
    }

    // Handle nested property access with dot notation
    const segments = keyStr.split(".");
    let current: Record<string, unknown> | Map<unknown, unknown> = result;

    const lastIndex = segments.length - 1;

    // An empty segment is a real PHP array key: `Arr::set($a, 'a..b', 9)` writes
    // `$a['a']['']['b']`. Skipping it wrote the wrong path or dropped the value.
    for (const [index, segment] of segments.entries()) {
        if (index === lastIndex) {
            if (isMap(current)) {
                writeMapKey(current, segment, value);
            } else {
                defineKey(current, segment, value);
            }

            break;
        }

        // An unsafe segment not yet its own risks reading the inherited
        // accessor/data value (e.g. Object.prototype); treat it as absent.
        const existing = isMap(current)
            ? readMapKey(current, segment).value
            : isUnsafeKey(segment) && !Object.hasOwn(current, segment)
              ? undefined
              : current[segment];

        // Arr::set descends by is_array, so a class instance or Date on the path is replaced wholesale; a list
        // or Map is a container and keeps its entries. The clone is what makes the write immutable, so it has to
        // match the container's own shape.
        const next = !isWritableContainer(existing)
            ? {}
            : isArray(existing)
              ? [...existing]
              : isMap(existing)
                ? new Map(existing)
                : { ...(existing as Record<string, unknown>) };

        if (isMap(current)) {
            writeMapKey(current, segment, next);
        } else {
            defineKey(current, segment, next);
        }

        current = next as Record<string, unknown> | Map<unknown, unknown>;
    }

    return result as Record<TKey, TValue>;
}

/**
 * Check if a key exists in an object using dot notation.
 *
 * A literal key that itself contains dots wins over path traversal:
 * `{ "products.desk": {} }` must report the literal key as found without
 * ever treating it as `products` -> `desk`.
 *
 * @param obj - The object to check.
 * @param key - The key or dot-notated path.
 * @returns True if the key exists, false otherwise.
 */
export function hasObjectKey<TValue, TKey extends PropertyKey = PropertyKey>(
    obj: Record<TKey, TValue> | unknown,
    key: PathKey,
): boolean {
    if (!isObject(obj) || isNull(key)) {
        return false;
    }

    const keyStr = String(key);

    // The literal key wins even when it contains dots.
    if (readLiteralKey(obj, keyStr).found) {
        return true;
    }

    if (!keyStr.includes(".")) {
        return false;
    }

    // Handle nested property access with dot notation
    const value = getNestedValue(obj, keyStr);

    return !isUndefined(value);
}

/**
 * The name Arr::forget reads a key by, as Arr::exists casts it: a null key is '' and a float its string form.
 *
 * @param key - The key to read.
 * @returns The name Arr::exists looks up and explode splits into a path.
 */
function forgetName(key: unknown): string {
    return isNull(key) || isUndefined(key) || isFloat(key)
        ? toPhpKeyString(key)
        : String(key);
}

/**
 * Read one literal key of an object, telling a key that holds `undefined` from a missing one.
 *
 * A Map stands for a PHP array, so it is read by the key PHP stores and its own members such as `size` are never keys.
 *
 * @param data - The object or Map to read.
 * @param key - The key, read whole even when it contains dots.
 * @returns Whether the key exists, and its value when it does.
 *
 * @example
 * readLiteralKey({ "a.b": 1 }, "a.b"); -> { found: true, value: 1 }
 * readLiteralKey(new Map([[2, "c"]]), "2"); -> { found: true, value: "c" }
 */
function readLiteralKey(
    data: object,
    key: string,
): { found: boolean; value?: unknown } {
    if (isMap(data)) {
        return readMapKey(data, key);
    }

    return Object.hasOwn(data, key)
        ? { found: true, value: (data as Record<string, unknown>)[key] }
        : { found: false };
}
