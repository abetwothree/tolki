import { replaceRecursive as arrReplaceRecursive } from "@tolki/arr";
import { SortDirection } from "@tolki/enum";
import {
    dotFlatten,
    explodePluckPath,
    forgetKeys,
    getNestedValue,
    getObjectValue,
    hasMixed,
    hasObjectKey,
    resolvePluckPath,
    setObjectValue,
    undotExpandObject,
} from "@tolki/path";
import { finish, randomInt } from "@tolki/str";
import type { CaseValue, PathKey, PathKeys, SortSpec } from "@tolki/types";
import {
    arrayableValues,
    arrayValueMessage,
    compareValues,
    createSortSpecComparator,
    cssListItemToString,
    defineKey,
    isArray,
    isBoolean,
    isFalsy,
    isFunction,
    isInteger,
    isIntegerLikeKey,
    isMap,
    isNull,
    isNumber,
    isObject,
    isPhpArrayKey,
    isPhpFalsy,
    isPhpNumeric,
    isString,
    isStringable,
    isUndefined,
    isWeakMap,
    looseEqual,
    phpTypeName,
    phpValueMatch,
    phpValueMatcher,
    reindexIntegerKeys,
    resolveSliceRange,
    typeOf,
} from "@tolki/utils";

/**
 * Mutation contract: pop, shift, splice and unshift mutate their first
 * argument; every other function returns a new value. arr and obj agree
 * on this — re-read Collection.php before "aligning" one to the other.
 */

const sortSpecComparator = createSortSpecComparator((item, key) =>
    getNestedValue(item, key as PropertyKey),
);

/**
 * Determine whether the given value is object accessible.
 *
 * @param value - The value to check.
 * @returns True if the value is a plain object, false otherwise.
 *
 * @example
 *
 * accessible({}); -> true
 * accessible({ a: 1, b: 2 }); -> true
 * accessible([]); -> false
 * accessible(null); -> false
 */
export function accessible(value: unknown): value is object {
    return isObject(value);
}

/**
 * Get the key/value pairs of an object or a Map.
 *
 * A Map is the JavaScript equivalent of a PHP iterable with non numeric keys,
 * so it is read through its own entries instead of its instance properties.
 *
 * @param data - The object or Map to read the entries from.
 * @returns The key/value pairs in iteration order.
 */
function entriesOf<TValue, TKey extends PropertyKey = PropertyKey>(
    data: object,
): [TKey, TValue][] {
    if (isMap<TKey, TValue>(data)) {
        return [...data.entries()];
    }

    return Object.entries(data) as [TKey, TValue][];
}

/**
 * Determine whether the given value is objectifiable.
 *
 * @param value - The value to check.
 * @returns True if the value can be treated as an object, false otherwise.
 *
 * @example
 *
 * objectifiable({}); -> true
 * objectifiable({ a: 1, b: 2 }); -> true
 * objectifiable([]); -> false
 */
export function objectifiable(
    value: unknown,
): value is Record<string, unknown> {
    return isObject(value);
}

/**
 * Add an element to an object using "dot" notation if it doesn't exist.
 *
 * @param data - The object to add the element to.
 * @param key - The key or dot-notated path where to add the value.
 * @param value - The value to add.
 * @returns A new object with the value added if the key didn't exist.
 *
 * @example
 *
 * add({ name: 'John' }, 'age', 30); -> { name: 'John', age: 30 }
 * add({ user: { name: 'John' } }, 'user.age', 30); -> { user: { name: 'John', age: 30 } }
 * add({ name: 'John' }, 'name', 'Jane'); -> { name: 'John' } (no change, key exists)
 */
export function add<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue>,
    key: PathKey,
    value: unknown,
): Record<TKey, TValue> {
    const mutableData = { ...data };

    if (isNull(getObjectValue(mutableData, key))) {
        return setObjectValue(mutableData, key, value);
    }

    return mutableData;
}

/**
 * Get an object item from an object using "dot" notation.
 *
 * @param data - The object to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The objct value.
 * @throws Error if the value is not an object.
 *
 * @example
 *
 * objectItem({ items: ['a', 'b'] }, 'items'); -> ['a', 'b']
 * objectItem({ user: { tags: ['js', 'ts'] } }, 'user.tags'); -> ['js', 'ts']
 * objectItem({ user: { name: 'John' } }, 'user.name'); -> throws Error
 */
export function objectItem<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): Record<TKey, TValue> {
    const value = getObjectValue(data, key, defaultValue);

    if (!isObject(value)) {
        const typeName = isNull(value) ? "null" : typeOf(value);
        throw new Error(
            `Object value for key [${key}] must be an object, ${typeName} found.`,
        );
    }

    return value as Record<TKey, TValue>;
}

/**
 * Get a boolean item from an object using "dot" notation.
 * Throws an error if the value is not a boolean.
 *
 * @param data - The object to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The boolean value.
 * @throws Error if the value is not a boolean.
 *
 * @example
 *
 * boolean({ active: true }, 'active'); -> true
 * boolean({ user: { verified: false } }, 'user.verified'); -> false
 * boolean({ user: { name: 'John' } }, 'user.name'); -> throws Error
 */
export function boolean<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): boolean {
    const value = getObjectValue(data, key, defaultValue);

    if (!isBoolean(value)) {
        throw new Error(
            `Object value for key [${key}] must be a boolean, ${phpTypeName(value)} found.`,
        );
    }

    return value;
}

/**
 * Chunk the object into chunks of the given size.
 *
 * @see Collection::chunk — `packages/collection/stubs/Collection.php:1520`.
 *      Wraps `array_chunk`; `preserveKeys` defaults to `true`.
 *
 * @param data - The record to chunk
 * @param size - The size of each chunk
 * @param preserveKeys - Whether to preserve the original keys, defaults to true
 * @returns Chunked record
 */
export function chunk<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue>,
    size: number,
    preserveKeys?: true | undefined,
): Record<number, Record<TKey, TValue>>;
export function chunk<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue>,
    size: number,
    preserveKeys?: false,
): Record<number, Record<number, TValue>>;
export function chunk(
    data: unknown,
    size: number,
    preserveKeys?: false,
): Record<PropertyKey, never>;
export function chunk<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    size: number,
    preserveKeys?: boolean,
):
    | Record<number, Record<TKey, TValue>>
    | Record<number, Record<number, TValue>> {
    preserveKeys = isUndefined(preserveKeys) ? true : preserveKeys;

    if (size <= 0) {
        return {} as Record<PropertyKey, never>;
    }

    if (!accessible(data)) {
        return {} as Record<PropertyKey, never>;
    }

    const entries = Object.entries(data as Record<TKey, TValue>);
    const chunks:
        | Record<number, Record<TKey, TValue>>
        | Record<number, Record<number, TValue>> = {};
    let chunkIndex = 0;

    for (let i = 0; i < entries.length; i += size) {
        const chunkEntries = entries.slice(i, i + size);
        if (preserveKeys) {
            chunks[chunkIndex] = Object.fromEntries(chunkEntries) as Record<
                TKey,
                TValue
            >;
        } else {
            let index = 0;
            chunks[chunkIndex] = Object.fromEntries(
                chunkEntries.map(([, value]) => {
                    const data = [index, value];
                    index += 1;

                    return data;
                }),
            ) as Record<number, TValue>;
        }

        chunkIndex++;
    }

    if (preserveKeys) {
        return chunks as Record<number, Record<TKey, TValue>>;
    } else {
        return chunks as Record<number, Record<number, TValue>>;
    }
}

/**
 * Collapse an object of objects into a single object.
 *
 * @param object - The object of objects to collapse.
 * @return A new flattened object.
 *
 * @example
 *
 * collapse({ a: { x: 1 }, b: { y: 2 }, c: { z: 3 } }); -> { x: 1, y: 2, z: 3 }
 * collapse({ users: { john: { age: 30 } }, admins: { jane: { role: 'admin' } } }); -> { john: { age: 30 }, jane: { role: 'admin' } }
 */
export function collapse<
    TValue extends Record<PropertyKey, Record<PropertyKey, unknown>>,
>(object: TValue): Record<string, TValue[keyof TValue]> {
    const out: Record<string, TValue[keyof TValue]> = {};

    for (const item of Object.values(object)) {
        if (isObject(item)) {
            // Object.assign uses [[Set]] like a plain bracket assignment
            // would, so it is exposed to the same __proto__ setter risk.
            for (const [key, value] of Object.entries(item)) {
                defineKey(out as Record<string, unknown>, key, value);
            }
        }
    }

    return out;
}

/**
 * Combine two objects into one, using the values from the first object as
 * keys, mirroring PHP's `array_combine()` / `Collection::combine()`
 * (`Collection.php:933`).
 *
 * @see Collection::combine — `packages/collection/stubs/Collection.php:933`.
 *      Wraps `array_combine`.
 *
 * @param keysObject - The object containing keys.
 * @param valuesObject - The object containing values.
 * @return A new object containing combined key-value pairs.
 * @throws Error if `keysObject` and `valuesObject` do not have the same
 * number of entries.
 */
export function combine<TKeys, TValues, TCombineValue = TValues>(
    keysObject: Record<PropertyKey, TKeys>,
    valuesObject: Record<PropertyKey, TValues>,
): Record<PropertyKey, TCombineValue> {
    const maxLength = Object.keys(keysObject).length;
    // Plain String() coercion, not a function-calling one: PHP has no
    // function-typed array keys, and arr.combine agrees on plain String().
    const keys = Object.values(keysObject).map((k) => String(k));
    const values = Object.values(valuesObject);

    if (maxLength !== values.length) {
        throw new Error(
            "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
        );
    }

    const result: Record<PropertyKey, TCombineValue> = {};

    for (let i = 0; i < maxLength; i++) {
        // Always defined: i only ever ranges up to keys.length.
        const key = keys[i] as string;
        // Writes go through `defineKey` so a `__proto__` key resolved from
        // `keysObject` becomes a real own key instead of reparenting `result`
        // through the `__proto__` setter (see `isUnsafeKey`, AGENTS.md:189).
        defineKey(
            result as Record<string, TCombineValue>,
            key,
            values[i] as TCombineValue,
        );
    }

    return result;
}

/**
 * Cross join the given objects, returning all possible permutations.
 *
 * @param objects - The objects to cross join.
 * @return A new array with all combinations of the input object values.
 *
 * @example
 *
 * crossJoin({ a: [1] }, { b: ["x"] }); -> [{ a: 1, b: "x" }]
 * crossJoin({ size: ['S', 'M'] }, { color: ['red', 'blue'] }); -> [{ size: 'S', color: 'red' }, { size: 'S', color: 'blue' }, { size: 'M', color: 'red' }, { size: 'M', color: 'blue' }]
 */
export function crossJoin<TValues, TCombineValue = TValues>(
    ...objects: Record<PropertyKey, TValues>[]
): Record<PropertyKey, TCombineValue>[] {
    let results: Record<PropertyKey, TCombineValue>[] = [{}];

    for (const obj of objects) {
        const next: Record<PropertyKey, TCombineValue>[] = [];

        for (const [key, values] of Object.entries(obj)) {
            if (!isArray(values) || values.length === 0) {
                return [];
            }

            for (const product of results) {
                for (const value of values) {
                    next.push({
                        ...product,
                        [key]: value as TCombineValue,
                    });
                }
            }
        }

        results = next;
    }

    return results;
}

/**
 * Divide an object into two objects. One with keys and the other with values.
 *
 * @param object - The object to divide.
 * @return A tuple with an array of keys and an array of values.
 *
 * @example
 *
 * divide({ name: "John", age: 30, city: "NYC" }); -> [['name', 'age', 'city'], ['John', 30, 'NYC']]
 */
export function divide<TValue, TKey extends PropertyKey = PropertyKey>(
    object: Record<TKey, TValue>,
): [TKey[], TValue[]] {
    return [Object.keys(object) as TKey[], Object.values(object)];
}

/**
 * Flatten a multi-dimensional object with "dot" notation.
 *
 * @param data - The object to flatten.
 * @param prepend - An optional string to prepend to each key.
 * @param depth - Maximum depth to flatten. Defaults to Infinity.
 * @returns A new object with dot-notated keys.
 *
 * @example
 *
 * dot({ name: 'John', address: { city: 'NYC', zip: '10001' } }); -> { name: 'John', 'address.city': 'NYC', 'address.zip': '10001' }
 */
export function dot<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    prepend: string = "",
    depth: number = Infinity,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    return dotFlatten(data, prepend, depth);
}

/**
 * Convert a flatten "dot" notation object into an expanded object.
 *
 * A nested container with consecutive integer keys `0..n-1` becomes a real array;
 * out-of-order numeric keys still promote to a list here (JS always enumerates
 * integer-like keys ascending), unlike PHP's insertion-order-sensitive `array_is_list`.
 *
 * @param map - The flat object with dot-notated keys.
 * @returns A new multi-dimensional object.
 */
export function undot<TValue, TKey extends PropertyKey = PropertyKey>(
    map: Record<TKey, TValue>,
): Record<TKey, TValue> {
    return undotExpandObject(map) as Record<TKey, TValue>;
}

/**
 * Union multiple objects into one, mirroring PHP's `+` array union
 * operator: the left-most object to already hold a key wins that key's
 * value, even `null`/`undefined` — the guard is presence, not truthiness.
 *
 * @see Collection::union — `packages/collection/stubs/Collection.php:944`.
 *      Uses PHP's `+` operator (key union: left keys win), not `array_merge`.
 *
 * @param objects - The objects to union.
 * @return A new object containing all key-value pairs from the input objects.
 */
export function union<TValue, TKey extends PropertyKey = PropertyKey>(
    ...objects: Record<TKey, TValue>[] | unknown[]
): Record<TKey, TValue> {
    return objects.reduce(
        (
            acc: Record<PropertyKey, TValue>,
            obj: Record<TKey, TValue> | unknown,
        ) => {
            if (accessible(obj)) {
                for (const [key, value] of Object.entries(obj)) {
                    if (!Object.hasOwn(acc, key)) {
                        defineKey(
                            acc as Record<string, TValue>,
                            key,
                            value as TValue,
                        );
                    }
                }
            }

            return acc;
        },
        {} as Record<TKey, TValue>,
    );
}

/**
 * Prepend one or more items to the beginning of the object, mutating it in
 * place, like PHP's array_unshift.
 *
 * A non-object, non-nullish item gets the next available integer key rather than
 * being dropped; `null`/`undefined` items are skipped. Existing integer-like keys
 * are renumbered upward to make room, exactly as `array_unshift` does.
 *
 * @see Collection::unshift — `packages/collection/stubs/Collection.php:1087`. Wraps `array_unshift`; mutates.
 *
 * @param items - The items to prepend. The first item is the target object, mutated in place when object-accessible.
 * @returns The same object reference, mutated (or a new object when the first item isn't object-accessible).
 */
export function unshift<TValue, TKey extends PropertyKey = PropertyKey>(
    ...items: Record<TKey, TValue>[] | unknown[]
): Record<TKey, TValue> {
    if (items.length <= 1) {
        return (items[0] ?? {}) as Record<TKey, TValue>;
    }

    const data = items[0] as Record<TKey, TValue>;
    const itemsObject = {} as Record<TKey, TValue>;
    let nextIndex = 0;

    const itemsToPrepend = items.slice(1);

    for (const item of itemsToPrepend) {
        if (accessible(item)) {
            for (const [key, value] of Object.entries(item)) {
                defineKey(
                    itemsObject as Record<string, TValue>,
                    key,
                    value as TValue,
                );
            }
        } else if (!isNull(item) && !isUndefined(item)) {
            while (Object.hasOwn(itemsObject, nextIndex)) {
                nextIndex++;
            }

            itemsObject[nextIndex as TKey] = item as TValue;
            nextIndex++;
        }
    }

    if (!accessible(data)) {
        return union(itemsObject, data);
    }

    const originalEntries = Object.entries(data);

    for (const key of Object.keys(data)) {
        delete data[key as TKey];
    }

    for (const [key, value] of Object.entries(itemsObject)) {
        defineKey(data as Record<string, TValue>, key, value as TValue);
    }

    for (const [key, value] of originalEntries) {
        if (isIntegerLikeKey(key)) {
            while (Object.hasOwn(data, nextIndex)) {
                nextIndex++;
            }

            data[nextIndex as TKey] = value as TValue;
            nextIndex++;

            continue;
        }

        if (!Object.hasOwn(itemsObject, key)) {
            defineKey(data as Record<string, TValue>, key, value as TValue);
        }
    }

    return data;
}

/**
 * Get all of the given object except for a specified array of keys.
 *
 * @param  data - The object to remove items from.
 * @param  keys - The keys of the items to remove.
 * @returns A new object with the specified items removed.
 *
 * @example
 *
 * except({ name: 'John', age: 30, city: 'NYC' }, 'age'); -> { name: 'John', city: 'NYC' }
 * except({ name: 'John', age: 30, city: 'NYC' }, ['age', 'city']); -> { name: 'John' }
 */
export function except<TValue extends Record<PropertyKey, unknown>>(
    data: TValue,
    keys: PathKeys,
): Record<PropertyKey, unknown> {
    return forget(data, keys);
}

/**
 * Get all of the given object except for a specified array of values.
 *
 * @param data - The object to filter.
 * @param values - The value(s) to exclude from the object.
 * @param strict - Whether to use strict comparison (default: false).
 * @returns A new object with the specified values removed.
 *
 * @example
 *
 * exceptValues({ name: 'taylor', age: 26, city: 'austin' }, [26]); -> { name: 'taylor', city: 'austin' }
 * exceptValues({ a: 1, b: 2, c: 1, d: 3 }, 1); -> { b: 2, d: 3 }
 * exceptValues({ a: true, b: false, c: 1, d: 0 }, [1, 0], true); -> { a: true, b: false }
 */
export function exceptValues<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue>,
    values: TValue | TValue[],
    strict: boolean = false,
): Record<TKey, TValue> {
    const valueArray = isArray(values) ? values : [values];
    const result = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(data) as [TKey, TValue][]) {
        const shouldExclude = valueArray.some((v) =>
            strict ? value === v : looseEqual(value, v),
        );

        if (!shouldExclude) {
            defineKey(result as Record<string, TValue>, key as string, value);
        }
    }

    return result;
}

/**
 * Determine if the given key exists in the provided object.
 *
 * @param  data - Object to check
 * @param  key  - Key to check for
 * @returns True if the key exists, false otherwise.
 *
 * @example
 *
 * exists({ name: 'John', age: 30 }, 'name'); -> true
 * exists({ name: 'John', age: 30 }, 'email'); -> false
 * exists({ user: { name: 'John' } }, 'user.name'); -> true
 */
export function exists<TValue extends Record<PropertyKey, unknown>>(
    data: TValue | unknown,
    key: PathKey,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    return hasObjectKey(data, key);
}

/**
 * Get the first value from an object.
 * Optionally pass a callback to find the first matching value.
 *
 * @param data - The object to search through.
 * @param callback - Optional callback function to test values.
 * @param defaultValue - Value to return if no value is found.
 * @returns The first value or default value.
 *
 * @example
 *
 * first({ a: 1, b: 2, c: 3 }); -> 1
 * first({}); -> null
 * first({}, null, 'default'); -> 'default'
 * first({ a: 1, b: 2, c: 3 }, x => x > 1); -> 2
 * first({ a: 1, b: 2, c: 3 }, x => x > 5, 'none'); -> 'none'
 * first(new Map([['a', 1], ['b', 2]])); -> 1
 */
// Overload: Map type for proper key and value inference
export function first<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TFirstDefault = null,
>(
    data: Map<TKey, TValue>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: object and unknown fallback
export function first<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TFirstDefault = null,
>(
    data: Record<TKey, TValue> | unknown,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Implementation
export function first<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TFirstDefault = null,
>(
    data: Record<TKey, TValue> | unknown,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
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

    if (isNull(data) || isUndefined(data) || !accessible(data)) {
        return resolveDefault();
    }

    const entries = entriesOf<TValue, TKey>(data);

    // No callback: just return first value if it exists.
    if (!callback) {
        if (entries.length === 0) {
            return resolveDefault();
        }

        return entries[0]?.[1] as TValue;
    }

    for (const [key, value] of entries) {
        if (callback(value, key)) {
            return value;
        }
    }

    return resolveDefault();
}

/**
 * Get the last value from an object.
 * Optionally pass a callback to find the last matching value.
 *
 * @param data - The object to search through.
 * @param callback - Optional callback function to test values.
 * @param defaultValue - Value to return if no value is found.
 * @returns The last value or default value.
 *
 * @example
 *
 * last({ a: 1, b: 2, c: 3 }); -> 3
 * last({}); -> null
 * last({}, null, 'default'); -> 'default'
 * last({ a: 1, b: 2, c: 3 }, x => x < 3); -> 2
 * last({ a: 1, b: 2, c: 3 }, x => x > 5, 'none'); -> 'none'
 * last(new Map([['a', 1], ['b', 2]])); -> 2
 */
// Overload: Map type for proper key and value inference
export function last<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: Map<TKey, TValue>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TDefault | (() => TDefault),
): TValue | TDefault | null;
// Overload: object and unknown fallback
export function last<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: Record<TKey, TValue> | unknown,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TDefault | (() => TDefault),
): TValue | TDefault | null;
// Implementation
export function last<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: Record<TKey, TValue> | unknown,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TDefault | (() => TDefault),
): TValue | TDefault | null {
    const resolveDefault = (): TDefault | null => {
        if (isUndefined(defaultValue)) {
            return null;
        }

        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : (defaultValue as TDefault);
    };

    if (isNull(data) || isUndefined(data) || !accessible(data)) {
        return resolveDefault();
    }

    const entries = entriesOf<TValue, TKey>(data);

    // No predicate case
    if (!isFunction(callback)) {
        if (entries.length === 0) {
            return resolveDefault();
        }

        return entries[entries.length - 1]?.[1] as TValue;
    }

    // With callback: iterate backwards to find last match
    let found = false;
    let candidate: TValue | undefined;

    for (let i = entries.length - 1; i >= 0; i--) {
        const [key, value] = entries[i] as [TKey, TValue];
        if (callback(value, key)) {
            candidate = value;
            found = true;
            break;
        }
    }

    return found ? (candidate as TValue) : resolveDefault();
}

/**
 * Take the first or last `limit` items from an object.
 *
 * Positive limit => first `limit` items.
 * Negative limit => last `abs(limit)` items.
 *
 * @param data The object to take items from.
 * @param limit The number of items to take. Positive for first N, negative for last N.
 * @returns A new object containing the taken items.
 *
 * @example
 *
 * take({ a: 1, b: 2, c: 3, d: 4, e: 5 }, 2); -> { a: 1, b: 2 }
 * take({ a: 1, b: 2, c: 3, d: 4, e: 5 }, -2); -> { d: 4, e: 5 }
 * take({ a: 1, b: 2, c: 3 }, 5); -> { a: 1, b: 2, c: 3 }
 */
export function take<TValue extends Record<PropertyKey, unknown>>(
    data: TValue | unknown,
    limit: number,
): Record<PropertyKey, unknown> {
    if (!accessible(data) || limit === 0) {
        return {};
    }

    const obj = data as Record<string, unknown>;
    const entries = Object.entries(obj);
    const length = entries.length;

    if (length === 0) {
        return {};
    }

    let selectedEntries: [string, unknown][];

    // Positive: first N
    if (limit > 0) {
        if (limit >= length) {
            selectedEntries = entries;
        } else {
            selectedEntries = entries.slice(0, limit);
        }
    } else {
        // Negative: last abs(N)
        const count = Math.abs(limit);
        if (count >= length) {
            selectedEntries = entries;
        } else {
            selectedEntries = entries.slice(length - count);
        }
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of selectedEntries) {
        defineKey(result, key, value);
    }

    return result;
}

/**
 * Flatten a multi-dimensional object into a single-level array.
 *
 * @see Arr::flatten — `packages/arr/stubs/Arr.php:366`.
 *
 * @param data - The object (or value) to flatten.
 * @param depth - Maximum depth to flatten. Defaults to Infinity; depth 1 stops after one level (Arr.php:368).
 * @returns A new flattened array of values.
 *
 * @example
 *
 * flatten({ a: 1, b: { c: 2, d: { e: 3 } } }); -> [1, 2, 3]
 */
export function flatten<TValue>(
    data: Record<PropertyKey, TValue> | TValue,
    depth: number = Infinity,
): unknown[] {
    if (!accessible(data)) {
        return [];
    }

    const result: unknown[] = [];

    const flattenRecursive = (items: unknown, currentDepth: number) => {
        // items is always array or object when called recursively
        const values = isArray(items) ? items : Object.values(items as object);

        for (const item of values) {
            if (!isArray(item) && !isObject(item)) {
                result.push(item);
            } else if (currentDepth === 1) {
                // Arr.php:373 spends the last level of depth on the
                // container's own values, so depth 1 still unwraps once.
                const nested = isArray(item) ? item : Object.values(item);

                for (const value of nested) {
                    result.push(value);
                }
            } else {
                flattenRecursive(item, currentDepth - 1);
            }
        }
    };

    flattenRecursive(data, depth);

    return result;
}

/**
 * Flatten a multi-dimensional object into dot-notation with depth control.
 *
 * One divergence from `Arr::dot`/`Obj.dot`: an empty nested container is dropped
 * here, where PHP keeps it as a leaf value.
 * @see probe row `Arr::dot keeps a "__proto__" array value`
 *
 * @param data - The object to flatten.
 * @param depth - Maximum depth for dot-notation keys.
 * @returns A flat object with dot-notated keys.
 *
 * @example
 *
 * flattenDot({ users: { john: { name: 'John' } } }, 1); -> { 'users.john': { name: 'John' } }
 */
export function flattenDot<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    depth: number = Infinity,
): Record<PropertyKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<PropertyKey, TValue>;
    }

    const out: Record<string, unknown> = {};

    const walk = (
        node: unknown,
        pathParts: string[],
        maxSegments: number,
    ): void => {
        const pathLen = pathParts.length;
        const isObj = isObject(node);
        const isArr = isArray(node);

        // Stop if node is scalar or we've reached the target segment length
        if ((!isObj && !isArr) || pathLen >= maxSegments) {
            if (pathLen > 0) {
                defineKey(out, pathParts.join("."), node);
            }
            return;
        }

        if (isArr) {
            for (let i = 0; i < (node as unknown[]).length; i++) {
                walk(
                    (node as unknown[])[i],
                    [...pathParts, String(i)],
                    maxSegments,
                );
            }
            return;
        }

        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
            walk(v, [...pathParts, String(k)], maxSegments);
        }
    };

    // Depth represents additional levels beyond the root to flatten into keys.
    // Example: depth=1 -> two segments (root child and its child): users.john
    const maxSegments = Number.isFinite(depth)
        ? (depth as number) + 1
        : Infinity;
    walk(data as Record<string, unknown>, [], maxSegments);

    return out as Record<PropertyKey, TValue>;
}

/**
 * Flip the keys and values of an object.
 *
 * @param data - The object of items to flip
 * @return - the data items flipped
 *
 * @example
 * flip({name: 'taylor'}); -> {taylor: 'name'}
 * flip({string: 'taylor', integer: 1, null: null, float: 1.5}); -> {taylor: 'string', 1: 'integer'}
 */
export function flip<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
): Record<string, string> {
    if (!accessible(data)) {
        return {};
    }

    // flip the object keys as values and values as keys,
    // skipping values that are not valid PHP array keys
    // e.g {name: 'taylor'} -> {taylor: 'name'}
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
        if (isPhpArrayKey(value)) {
            defineKey(result, String(value), key);
        }
    }

    return result;
}

/**
 * Get a float item from an object using "dot" notation.
 * Throws an error if the value is not a number.
 *
 * Known divergence: PHP's `is_float()` rejects a whole-number int (`Arr::float`
 * throws on `1`, see docs/php-parity/task-17-second-review.json, "Arr::float
 * rejects a whole-number int"). JS has one number type, so `isNumber` accepts
 * it — narrowing to reject whole numbers would also reject `1.0`.
 *
 * @param data - The object to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The float value.
 * @throws Error if the value is not a number.
 *
 * @example
 *
 * float({ price: 19.99, discount: 0.1 }, 'price'); -> 19.99
 * float({ product: { price: 19.99 } }, 'product.price'); -> 19.99
 * float({ product: { name: 'Widget' } }, 'product.name'); -> throws Error
 */
export function float<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): number {
    const value = getObjectValue(data, key, defaultValue);

    if (!isNumber(value)) {
        throw new Error(
            `Object value for key [${key}] must be a float, ${phpTypeName(value)} found.`,
        );
    }

    return value;
}

/**
 * Remove one or many object items from a given object using dot notation.
 *
 * @param  data - The object to remove items from.
 * @param  keys - The keys of the items to remove.
 * @returns A new object with the specified items removed.
 *
 * @example
 *
 * forget({ name: 'John', age: 30, city: 'NYC' }, 'age'); -> { name: 'John', city: 'NYC' }
 * forget({ name: 'John', age: 30, city: 'NYC' }, ['age', 'city']); -> { name: 'John' }
 * forget({ user: { name: 'John', age: 30 } }, 'user.age'); -> { user: { name: 'John' } }
 */
export function forget<TValue extends Record<PropertyKey, unknown>>(
    data: TValue,
    keys: PathKeys,
): Record<PropertyKey, unknown> {
    return forgetKeys(data, keys) as Record<PropertyKey, unknown>;
}

/**
 * Get the underlying object from the given argument.
 *
 * @param items The object, Map, or other value to extract from.
 * @returns The underlying object.
 *
 * @example
 *
 * from({ foo: 'bar' }); -> { foo: 'bar' }
 * from(new Map([['foo', 'bar']])); -> { foo: 'bar' }
 *
 * @throws Error if items cannot be converted to an object.
 */
export function from(items: Record<string, unknown>): Record<string, unknown>;
export function from<V>(items: Map<PropertyKey, V>): Record<string, V>;
export function from(
    items: number | string | boolean | symbol | null | undefined,
): never;
export function from(items: object): Record<string, unknown>;
export function from(items: unknown): Record<string, unknown> {
    if (isMap(items)) {
        const out: Record<string, unknown> = {};

        for (const [k, v] of items as Map<PropertyKey, unknown>) {
            defineKey(out, String(k), v);
        }

        return out;
    }

    if (isWeakMap(items)) {
        throw new Error(
            "WeakMap values cannot be enumerated in JavaScript; cannot convert to object.",
        );
    }

    if (isArray(items)) {
        const result: Record<string, unknown> = {};

        for (let i = 0; i < items.length; i++) {
            result[i] = items[i];
        }

        return result;
    }

    if (isObject(items)) {
        return { ...items };
    }

    throw new Error("Items cannot be represented by a scalar value.");
}

/**
 * Get an item from an object using "dot" notation.
 *
 * A literal key wins over dot-path traversal even when it contains dots, and a
 * literal key whose value is `undefined` still counts as found.
 *
 * @param  data - The object to get the item from.
 * @param  key - The key or dot-notated path of the item to get.
 * @param  defaultValue - The default value if key is not found
 * @returns The value or the default
 *
 * @example
 *
 * get({ user: { name: 'John' } }, 'user.name'); -> 'John'
 * get({ "products.desk": { price: 100 } }, 'products.desk'); -> { price: 100 } (literal key wins over traversal)
 */
export function get<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = unknown,
>(
    object: Record<TKey, TValue> | unknown,
    key: PathKey | null | undefined,
    defaultValue: TDefault | (() => TDefault) | null = null,
): TDefault | null {
    if (isNull(key) || isUndefined(key)) {
        return isObject(object)
            ? (object as TDefault)
            : isFunction(defaultValue)
              ? (defaultValue as () => TDefault)()
              : defaultValue;
    }

    if (!isObject(object)) {
        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : defaultValue;
    }

    // The literal key wins even when it contains dots. Presence, not
    // definedness, decides: a literal key whose value is `undefined` is
    // still "found" and does not fall through to dot-path traversal.
    const keyStr = String(key);
    if (Object.hasOwn(object as object, keyStr)) {
        const literalValue = (object as Record<string, unknown>)[keyStr];
        return !isUndefined(literalValue)
            ? (literalValue as TDefault)
            : isFunction(defaultValue)
              ? (defaultValue as () => TDefault)()
              : defaultValue;
    }

    // A simple (dot-free) or numeric key that isn't present literally can't
    // resolve via further traversal either.
    if (isNumber(key) || !key.includes(".")) {
        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : defaultValue;
    }

    // Handle dot notation for nested object access
    const segments = String(key).split(".");
    let current: unknown = object;

    for (const segment of segments) {
        if (isNull(current) || !isObject(current)) {
            return isFunction(defaultValue)
                ? (defaultValue as () => TDefault)()
                : defaultValue;
        }

        if (!Object.hasOwn(current as object, segment)) {
            return isFunction(defaultValue)
                ? (defaultValue as () => TDefault)()
                : defaultValue;
        }

        current = (current as Record<string, unknown>)[segment];
    }

    return !isUndefined(current)
        ? (current as TDefault)
        : isFunction(defaultValue)
          ? (defaultValue as () => TDefault)()
          : defaultValue;
}

/**
 * Check if an item or items exist in an object using "dot" notation.
 *
 * @param  data - The object to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if the item or items exist, false otherwise.
 *
 * @example
 *
 * has({ name: 'John', address: { city: 'NYC' } }, 'name'); -> true
 * has({ name: 'John' }, 'email'); -> false
 * has({ name: 'John', address: { city: 'NYC' } }, ['name', 'address.city']); -> true
 * has({ name: 'John', address: { city: 'NYC' } }, ['name', 'address.country']); -> false
 */
export function has<TValue extends Record<PropertyKey, unknown>>(
    data: TValue | unknown,
    keys: PathKeys,
): boolean {
    const keyList = isArray(keys) ? keys : [keys];
    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const k of keyList) {
        if (isNull(k)) {
            return false;
        }

        if (!hasMixed(data, k)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if all keys exist in an object using "dot" notation.
 *
 * @param  data - The object to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if all keys exist, false otherwise.
 *
 * @example
 *
 * hasAll({ name: 'John', address: { city: 'NYC' } }, ['name', 'address.city']); -> true
 * hasAll({ name: 'John', address: { city: 'NYC' } }, ['name', 'address.country']); -> false
 */
export function hasAll<TValue extends Record<PropertyKey, unknown>>(
    data: TValue | unknown,
    keys: PathKeys,
): boolean {
    const keyList = isArray(keys) ? keys : [keys];

    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const key of keyList) {
        if (!has(data as Record<PropertyKey, unknown>, key)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if any of the keys exist in an object using "dot" notation.
 *
 * @param  data - The object to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if any key exists, false otherwise.
 *
 * @example
 *
 * hasAny({ name: 'John', address: { city: 'NYC' } }, ['name', 'email']); -> true
 * hasAny({ name: 'John', address: { city: 'NYC' } }, ['email', 'phone']); -> false
 */
export function hasAny<TValue extends Record<PropertyKey, unknown>>(
    data: TValue | unknown,
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
        if (has(data as Record<PropertyKey, unknown>, key)) {
            return true;
        }
    }

    return false;
}

/**
 * Determine if all items pass the given truth test.
 *
 * Accepts plain objects as well as Maps, which are the JavaScript equivalent
 * of a PHP iterable with non numeric keys.
 *
 * @param  data - The object or Map to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if all items pass the test, false otherwise.
 *
 * @example
 *
 * every({ a: 2, b: 4, c: 6 }, (n) => n % 2 === 0); -> true
 * every({ a: 1, b: 2, c: 3 }, (n) => n % 2 === 0); -> false
 * every(new Map([['a', 2], ['b', 4]]), (n) => n % 2 === 0); -> true
 */
// Overload: Map type for proper key and value inference
export function every<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Map<TKey, TValue>,
    callback: (value: TValue, key: TKey) => boolean,
): boolean;
// Overload: object and unknown fallback
export function every<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => boolean,
): boolean;
// Implementation
export function every<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => boolean,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    for (const [key, value] of entriesOf<TValue, TKey>(data)) {
        if (!callback(value, key)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if some items pass the given truth test.
 *
 * Accepts plain objects as well as Maps, which are the JavaScript equivalent
 * of a PHP iterable with non numeric keys.
 *
 * @param  data - The object or Map to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if any item passes the test, false otherwise.
 *
 * @example
 *
 * some({ a: 1, b: 2, c: 3 }, (n) => n % 2 === 0); -> true
 * some({ a: 1, b: 3, c: 5 }, (n) => n % 2 === 0); -> false
 * some(new Map([['a', 1], ['b', 2]]), (n) => n % 2 === 0); -> true
 */
// Overload: Map type for proper key and value inference
export function some<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Map<TKey, TValue>,
    callback: (value: TValue, key: TKey) => boolean,
): boolean;
// Overload: object and unknown fallback
export function some<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => boolean,
): boolean;
// Implementation
export function some<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => boolean,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    for (const [key, value] of entriesOf<TValue, TKey>(data)) {
        if (callback(value, key)) {
            return true;
        }
    }

    return false;
}

/**
 * Get an integer item from an object using "dot" notation.
 *
 * @param  data - The object to get the item from.
 * @param  key - The key or dot-notated path of the item to get.
 * @param  defaultValue - The default value if key is not found
 *
 * @returns The integer value.
 *
 * @throws Error if the value is not an integer.
 *
 * @example
 *
 * integer({ age: 30, score: 100 }, 'age'); -> 30
 * integer({ user: { age: 30 } }, 'user.age'); -> 30
 * integer({ user: { name: 'John' } }, 'user.name'); -> Error: The value is not an integer.
 */
export function integer<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): number {
    const value = getObjectValue(data, key, defaultValue);

    if (!isInteger(value)) {
        throw new Error(
            `Object value for key [${key}] must be an integer, ${phpTypeName(value)} found.`,
        );
    }

    return value;
}

/**
 * Join all items using a string. The final items can use a separate glue string.
 *
 * @param  data - The object to join.
 * @param  glue - The string to join all but the last item.
 * @param  finalGlue - The string to join the last item.
 *
 * @example
 *
 * join({ a: 'a', b: 'b', c: 'c' }, ', ') => 'a, b, c'
 * join({ a: 'a', b: 'b', c: 'c' }, ', ', ' and ') => 'a, b and c'
 */
export function join<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    glue: string,
    finalGlue: string = "",
): string {
    if (!accessible(data)) {
        return "";
    }

    const obj = data as Record<TKey, TValue>;
    const items = Object.values(obj).map((v) => String(v));

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
 * Key an object by a field or using a callback.
 *
 * @param data - The object to key.
 * @param keyBy - The field name to key by, or a callback function.
 * @returns A new object keyed by the specified field or callback result.
 *
 * @example
 *
 * keyBy({ user1: { id: 1, name: 'John' }, user2: { id: 2, name: 'Jane' } }, 'name'); -> { John: { id: 1, name: 'John' }, Jane: { id: 2, name: 'Jane' } }
 * keyBy({ a: { name: 'John' }, b: { name: 'Jane' } }, (item) => item.name); -> { John: { name: 'John' }, Jane: { name: 'Jane' } }
 */
export function keyBy<TValue extends Record<PropertyKey, unknown>>(
    data: Record<PropertyKey, TValue> | unknown,
    keyBy: PathKey | ((item: TValue) => PropertyKey | null | undefined),
): Record<PropertyKey, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<PropertyKey, TValue>;
    const results: Record<PropertyKey, TValue> = {};

    for (const item of Object.values(obj)) {
        let key: PropertyKey | null | undefined;

        if (isFunction(keyBy)) {
            key = keyBy(item) as PropertyKey | null | undefined;
        } else {
            // Use dot notation to get the key value
            key = getObjectValue(item, keyBy as PathKey) as
                | PropertyKey
                | null
                | undefined;
        }

        // Key null/undefined results under an empty string key,
        // mirroring PHP's (string) null cast for array keys
        if (isNull(key) || isUndefined(key)) {
            key = "";
        }

        defineKey(results as Record<string, TValue>, key as string, item);
    }

    return results;
}

/**
 * Prepend the key names of an object.
 *
 * @param data - The object to process.
 * @param prependWith - The string to prepend to each key.
 * @returns A new object with prepended keys.
 *
 * @example
 *
 * prependKeysWith({ a: 1, b: 2, c: 3 }, 'item_'); -> { item_a: 1, item_b: 2, item_c: 3 }
 */
export function prependKeysWith<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    prependWith: string,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    for (const [key, value] of Object.entries(obj)) {
        defineKey(
            result as Record<string, TValue>,
            prependWith + key,
            value as TValue,
        );
    }

    return result;
}

/**
 * Get a subset of the items from the given object.
 *
 * Mirrors PHP's `(array) $keys` cast in `Arr::only` (Arr.php:744): `null` becomes
 * no keys, a bare string becomes a single-key selection.
 *
 * @param data - The object to get items from.
 * @param keys - The key, keys, or null to select.
 * @returns A new object with only the specified keys.
 *
 * @example
 *
 * only({ a: 1, b: 2, c: 3, d: 4 }, ['a', 'c']); -> { a: 1, c: 3 }
 */
export function only<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    keys: string | string[] | null,
): Record<PropertyKey, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<PropertyKey, TValue>;
    const result: Record<PropertyKey, TValue> = {};
    const keyList = isNull(keys) ? [] : isArray(keys) ? keys : [keys];

    for (const key of keyList) {
        if (Object.hasOwn(obj, key)) {
            defineKey(
                result as Record<string, TValue>,
                key,
                obj[key] as TValue,
            );
        }
    }

    return result;
}

/**
 * Get a subset of the items from the given object by value.
 *
 * @param data - The object to filter.
 * @param values - The value(s) to include in the result.
 * @param strict - Whether to use strict comparison (default: false).
 * @returns A new object containing only the specified values.
 *
 * @example
 *
 * onlyValues({ name: 'taylor', age: 26, city: 'austin' }, [26]); -> { age: 26 }
 * onlyValues({ a: 1, b: 2, c: 1, d: 3 }, 1); -> { a: 1, c: 1 }
 * onlyValues({ a: true, b: false, c: 1, d: 0 }, [1, 0], true); -> { c: 1, d: 0 }
 */
export function onlyValues<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue>,
    values: TValue | TValue[],
    strict: boolean = false,
): Record<TKey, TValue> {
    const valueArray = isArray(values) ? values : [values];
    const result = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(data) as [TKey, TValue][]) {
        const shouldInclude = valueArray.some((v) =>
            strict ? value === v : looseEqual(value, v),
        );

        if (shouldInclude) {
            defineKey(result as Record<string, TValue>, key as string, value);
        }
    }

    return result;
}

/**
 * Select an object of values from each item in the object.
 *
 * @param data - The object to select from.
 * @param keys - The key or keys to select from each item.
 * @returns A new object with selected key/value pairs from each item.
 *
 * @example
 *
 * select({ user1: { a: 1, b: 2, c: 3 }, user2: { a: 4, b: 5, c: 6 } }, 'a'); -> { user1: { a: 1 }, user2: { a: 4 } }
 * select({ user1: { a: 1, b: 2 }, user2: { a: 3, b: 4 } }, ['a', 'b']); -> { user1: { a: 1, b: 2 }, user2: { a: 3, b: 4 } }
 */
export function select<TValue extends Record<PropertyKey, unknown>>(
    data: Record<PropertyKey, TValue> | unknown,
    keys: PathKeys,
): Record<PropertyKey, Record<PropertyKey, unknown>> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<PropertyKey, TValue>;
    const keyList = (isArray(keys) ? keys : [keys]).filter(
        (key: unknown) => !isNull(key) && !isUndefined(key),
    ) as PropertyKey[];
    const result: Record<PropertyKey, Record<PropertyKey, unknown>> = {};

    for (const [objKey, item] of Object.entries(obj)) {
        const selected: Record<PropertyKey, unknown> = {};

        for (const key of keyList) {
            if (isObject(item) && Object.hasOwn(item, key)) {
                defineKey(
                    selected as Record<string, unknown>,
                    key as string,
                    item[key],
                );
            }
        }

        defineKey(
            result as Record<string, Record<PropertyKey, unknown>>,
            objKey,
            selected,
        );
    }

    return result;
}

/**
 * Pluck an array of values from an object.
 *
 * @param data - The object to pluck from.
 * @param value - The key path to pluck (dot-notated string, array of segments, or a
 *   `*` wildcard path), a callback, or `null` to keep each whole item.
 * @param key - Optional key path (string, array of segments, or callback) to use as keys in the result.
 * @returns A new array with plucked values or object with key-value pairs.
 *
 * @example
 *
 * pluck({ user1: { name: 'John' }, user2: { name: 'Jane' } }, 'name'); -> ['John', 'Jane']
 */
export function pluck<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    value: string | readonly string[] | ((item: TValue) => unknown) | null,
    key:
        | string
        | readonly string[]
        | ((item: TValue) => string | number)
        | null = null,
): unknown[] | Record<PropertyKey, unknown> {
    if (!accessible(data)) {
        return isNull(key) || isUndefined(key) ? [] : {};
    }

    const obj = data as Record<string, TValue>;
    // Same predicate as the write branch below — JS truthiness would send
    // key = "" down the array path while the write branch does keyed writes.
    const results: unknown[] | Record<PropertyKey, unknown> =
        isNull(key) || isUndefined(key) ? [] : {};

    for (const [, item] of Object.entries(obj)) {
        let itemValue: unknown;
        let itemKey: string | number | undefined;

        // Get the value
        if (isFunction(value)) {
            itemValue = value(item);
        } else {
            itemValue = resolvePluckPath(
                item,
                explodePluckPath(value as string | readonly string[] | null),
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
            defineKey(
                results as Record<string, unknown>,
                String(isUndefined(itemKey) ? "" : itemKey),
                itemValue,
            );
        }
    }

    return results;
}

/**
 * Get and remove the last N items from the collection.
 *
 * @see Collection::pop — `packages/collection/stubs/Collection.php:1027`.
 *      Mirrors `array_pop`, called `$count` times from the end; mutates.
 *
 * @param data - The object to pop items from.
 * @param count - The number of items to pop. Defaults to 1.
 * @returns The popped item(s) or null/empty array if none.
 */
export function pop<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | null | undefined,
    count: number = 1,
): TValue | TValue[] | null {
    if (isNull(data) || !accessible(data)) {
        return count === 1 ? null : [];
    }

    const obj = data as Record<string, TValue>;
    const entries = Object.entries(obj);

    if (entries.length === 0) {
        return count === 1 ? null : [];
    }

    if (count === 1) {
        // Always defined: entries.length > 0 checked above.
        const [key, value] = entries[entries.length - 1] as [string, TValue];
        delete obj[key];
        return value;
    }

    const poppedValues: TValue[] = [];
    const actualCount = Math.min(count, entries.length);

    for (let i = 0; i < actualCount; i++) {
        // Always defined: `i < actualCount <= entries.length`.
        const [key, value] = entries[entries.length - 1 - i] as [
            string,
            TValue,
        ];
        delete obj[key];

        poppedValues.push(value);
    }

    return poppedValues;
}

/**
 * Run a map over each of the items in the object.
 *
 * @param data - The object to map over.
 * @param callback - The function to call for each item (value, key) => newValue.
 * @returns A new object with transformed values.
 *
 * @example
 *
 * map({ a: 1, b: 2, c: 3 }, (value) => value * 2); -> { a: 2, b: 4, c: 6 }
 * map({ name: 'john', email: 'JOHN@EXAMPLE.COM' }, (value, key) => key === 'name' ? value.toUpperCase() : value.toLowerCase()); -> { name: 'JOHN', email: 'john@example.com' }
 */
export function map<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TMapValue = unknown,
>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => TMapValue,
): Record<TKey, TMapValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TMapValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const result: Record<PropertyKey, TMapValue> = {};

    for (const [key, value] of Object.entries(obj)) {
        defineKey(
            result as Record<string, TMapValue>,
            key,
            callback(value as TValue, key as TKey),
        );
    }

    return result;
}

/**
 * Run an associative map over each of the items.
 * The callback should return an object with key/value pairs.
 *
 * Always returns a plain object, even when every mapped key is numeric-like —
 * there's no PHP `Map` concept to preserve here (Arr.php:880).
 *
 * @param data - The object to map.
 * @param callback - Function that returns an object with key/value pairs.
 * @returns A new object with all mapped key/value pairs.
 *
 * @example
 *
 * mapWithKeys({ user1: { id: 1, name: 'John' } }, (item) => ({ [item.name]: item.id })); -> { John: 1 }
 * mapWithKeys({ a: 'x', b: 'y' }, (value, key) => ({ [value]: key })); -> { x: 'a', y: 'b' }
 */
export function mapWithKeys<
    TValue,
    TMapWithKeysValue,
    TKey extends PropertyKey = PropertyKey,
    TMapWithKeysKey extends PropertyKey = PropertyKey,
>(
    data: Record<TKey, TValue> | unknown,
    callback: (
        value: TValue,
        key: TKey,
    ) => Record<TMapWithKeysKey, TMapWithKeysValue>,
): Record<TMapWithKeysKey, TMapWithKeysValue> {
    if (!accessible(data)) {
        return {} as Record<TMapWithKeysKey, TMapWithKeysValue>;
    }

    const obj = data as Record<string, TValue>;
    const result: Record<TMapWithKeysKey, TMapWithKeysValue> = {} as Record<
        TMapWithKeysKey,
        TMapWithKeysValue
    >;

    for (const [key, value] of Object.entries(obj)) {
        const mappedObject = callback(value, key as TKey);

        for (const [mapKey, mapValue] of Object.entries(mappedObject)) {
            defineKey(
                result as Record<string, TMapWithKeysValue>,
                mapKey,
                mapValue as TMapWithKeysValue,
            );
        }
    }

    return result;
}

/**
 * Run a map over each nested object in the collection, spreading the object values as arguments to the callback.
 *
 * @param data - The object to map over.
 * @param callback - The callback function that receives spread object values and the key.
 * @returns A new object with mapped values.
 *
 * @example
 *
 * mapSpread({ user1: { name: 'John', age: 25 }, user2: { name: 'Jane', age: 30 } }, (name, age) => `${name} is ${age}`); -> { user1: 'John is 25', user2: 'Jane is 30' }
 * mapSpread({ item1: { x: 1, y: 2 }, item2: { x: 3, y: 4 } }, (x, y) => x + y); -> { item1: 3, item2: 7 }
 */
export function mapSpread<
    TValue extends Record<PropertyKey, unknown>,
    TMapSpreadValue,
>(
    data: Record<PropertyKey, TValue> | unknown,
    callback: (...args: unknown[]) => TMapSpreadValue,
): Record<PropertyKey, TMapSpreadValue> {
    if (!accessible(data)) {
        return {} as Record<PropertyKey, TMapSpreadValue>;
    }

    const obj = data as Record<PropertyKey, TValue>;
    const result: Record<PropertyKey, TMapSpreadValue> = {};

    for (const [key, item] of Object.entries(obj)) {
        if (isObject(item)) {
            // Spread the object values as arguments to the callback
            const values = Object.values(item);
            defineKey(
                result as Record<string, TMapSpreadValue>,
                key,
                callback(...values, key),
            );
        } else {
            // If item is not an object, pass it as single argument with key
            defineKey(
                result as Record<string, TMapSpreadValue>,
                key,
                callback(item, key),
            );
        }
    }

    return result;
}

/**
 * Push an item onto the beginning of an object (as first entry).
 *
 * @param data - The object to prepend to.
 * @param value - The value to prepend.
 * @param key - The key for the prepended value.
 * @returns A new object with the value prepended.
 *
 * @example
 *
 * prepend({ b: 2, c: 3 }, 1, 'a'); -> { a: 1, b: 2, c: 3 }
 * prepend({ x: 1, y: 2 }, 0, 'z'); -> { z: 0, x: 1, y: 2 }
 */
export function prepend<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    value: TValue,
    key: TKey,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return { [key]: value } as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = { [key]: value } as Record<
        TKey,
        TValue
    >;

    // Add existing entries after the prepended one
    for (const [existingKey, existingValue] of Object.entries(obj)) {
        defineKey(
            result as Record<string, TValue>,
            existingKey,
            existingValue as TValue,
        );
    }

    return result;
}

/**
 * Get a value from the object, and remove it.
 *
 * @param data - The object to pull the item from.
 * @param key - The key or dot-notated path of the item to pull.
 * @param defaultValue - The default value if key is not found.
 * @returns An object containing the pulled value (or default) and the updated object.
 *
 * @example
 *
 * pull({ a: 1, b: 2, c: 3 }, 'b'); -> { value: 2, data: { a: 1, c: 3 } }
 * pull({ user: { name: 'John', age: 30 } }, 'user.name'); -> { value: 'John', data: { user: { age: 30 } } }
 * pull({ a: 1, b: 2 }, 'x', 'default'); -> { value: 'default', data: { a: 1, b: 2 } }
 */
export function pull<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): { value: TValue | TDefault | null; data: Record<string, unknown> } {
    const resolveDefault = (): TDefault | null => {
        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : (defaultValue as TDefault);
    };

    if (!accessible(data)) {
        return { value: resolveDefault(), data: {} };
    }

    if (isNull(key)) {
        const original = { ...(data as Record<string, unknown>) };
        return { value: resolveDefault(), data: original };
    }

    const obj = data as Record<string, unknown>;
    const value = getObjectValue(obj, key);

    if (isNull(value)) {
        return { value: resolveDefault(), data: { ...obj } };
    }

    const updated = forget(obj, key);
    return { value: value as TValue | TDefault | null, data: updated };
}

/**
 * Convert the object into a query string.
 *
 * @param data - The object to convert to a query string.
 * @returns A URL-encoded query string.
 *
 * @example
 *
 * query({ name: 'John', age: 30 }); -> 'name=John&age=30'
 * query({ user: { name: 'John', age: 30 } }); -> 'user[name]=John&user[age]=30'
 * query({ tags: ['php', 'js'] }); -> 'tags[0]=php&tags[1]=js'
 * query({ foo: 'bar', bar: true }); -> 'foo=bar&bar=1' (booleans cast like PHP's http_build_query)
 * query({ foo: 'bar', bar: false }); -> 'foo=bar&bar=0'
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

    // Mirrors PHP's http_build_query scalar casting: booleans become "1"
    // or "0" rather than JavaScript's "true"/"false".
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
 * Get one or a specified number of random values from an object.
 *
 * @param data - The object to get random values from.
 * @param number - The number of items to return. If null, returns a single item.
 * @param preserveKeys - Preserve original keys when returning multiple items. Defaults to `false` (Arr.php:971).
 * @returns A single random item, an object of random items, or null if object is empty.
 * @throws Error if more items are requested than available, even against an empty object (Arr.php:977).
 */
export function random<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    number?: number | null,
    preserveKeys: boolean = false,
): TValue | Record<TKey, TValue> | null {
    if (!accessible(data)) {
        return isNull(number) || isUndefined(number)
            ? null
            : ({} as Record<TKey, TValue>);
    }

    const obj = data as Record<TKey, TValue>;
    const entries = Object.entries(obj);
    const count = entries.length;
    const requested = isNull(number) || isUndefined(number) ? 1 : number;

    if (requested > count) {
        throw new Error(
            `You requested ${requested} items, but there are only ${count} items available.`,
        );
    }

    // Reaching this point with `number` null/undefined would mean requested === 1
    // survived the throw guard above (which requires count >= 1), so `number` is
    // always provided here — Arr.php:983's empty-or-non-positive short-circuit yields [].
    if (requested <= 0) {
        return {} as Record<TKey, TValue>;
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
    if (isNull(number) || isUndefined(number)) {
        const [, value] = entries[selectedIndices[0] as number] as [
            TKey,
            TValue,
        ];
        return value;
    }

    // Return multiple items
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    for (let i = 0; i < selectedIndices.length; i++) {
        const entryIndex = selectedIndices[i] as number;
        const [key, value] = entries[entryIndex] as [TKey, TValue];

        if (preserveKeys) {
            defineKey(result as Record<string, TValue>, key as string, value);
        } else {
            // i is a plain loop counter (0..selectedIndices.length), never
            // attacker-controlled, so a bracket assign here is safe.
            result[i as TKey] = value;
        }
    }

    return result;
}

/**
 * Get and remove the first N items from the object, mutating it in place,
 * like PHP's array_shift.
 *
 * Survivors' integer-like keys are renumbered from 0, matching `array_shift`;
 * string keys keep theirs.
 *
 * @see Collection::shift — `packages/collection/stubs/Collection.php:1268`. Mirrors `array_shift`; mutates.
 *
 * @param data - The object to shift items from. Mutated in place.
 * @param count - The number of items to shift. Defaults to 1.
 * @returns The shifted item(s), or null if the object had nothing to shift.
 * @throws Error if count is negative.
 */
export function shift<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    count: number = 1,
): TValue | TValue[] | null {
    if (count < 0) {
        throw new Error("Number of shifted items may not be less than zero.");
    }

    if (!accessible(data)) {
        return count === 1 ? null : [];
    }

    const obj = data as Record<string, TValue>;
    const entries = Object.entries(obj);

    if (entries.length === 0) {
        return null;
    }

    const actualCount = count === 1 ? 1 : Math.min(count, entries.length);

    if (actualCount === 0) {
        return [];
    }

    const shiftedValues = entries
        .slice(0, actualCount)
        .map(([, value]) => value);

    for (const key of Object.keys(obj)) {
        delete obj[key];
    }

    for (const [key, value] of reindexIntegerKeys(entries.slice(actualCount))) {
        defineKey(obj, key, value);
    }

    if (count === 1) {
        // Always defined: entries.length > 0 checked above.
        return shiftedValues[0] as TValue;
    }

    return shiftedValues;
}

/**
 * Set an object item to a given value using "dot" notation.
 *
 * If no key is given to the method, the entire object will be replaced.
 *
 * @param  data - The object to set the item in.
 * @param  key - The key or dot-notated path of the item to set.
 * @param  value - The value to set.
 * @returns - A new object with the item set or the original object if the path is invalid.
 *
 * @example
 * set({ name: 'John', age: 30 }, 'age', 31); -> { name: 'John', age: 31 }
 * set({ user: { name: 'John' } }, 'user.age', 30); -> { user: { name: 'John', age: 30 } }
 */
export function set<TValue, TKey extends PropertyKey = PropertyKey>(
    object: Record<TKey, TValue> | unknown,
    key: PathKey | null,
    value: unknown,
): Record<TKey, TValue> {
    if (!accessible(object)) {
        return {} as Record<TKey, TValue>;
    }

    return setObjectValue(object as Record<TKey, TValue>, key, value) as Record<
        TKey,
        TValue
    >;
}

/**
 * Push one or more items into an object at a nested path using dot notation.
 *
 * @param data - The object to push items into.
 * @param key - The key or dot-notated path of the array to push into. A null key appends
 * to the object itself under the next integer-like key, mirroring Arr::push.
 * @param values - The values to push.
 * @returns A new object with the values pushed in.
 *
 * @example
 *
 * push({ items: ['a', 'b'] }, 'items', 'c', 'd'); -> { items: ['a', 'b', 'c', 'd'] }
 * push({ user: { tags: ['js'] } }, 'user.tags', 'ts', 'php'); -> { user: { tags: ['js', 'ts', 'php'] } }
 * push({ a: 1 }, null, 9); -> { a: 1, 0: 9 }
 */
export function push<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    ...values: TValue[]
): Record<TKey, TValue> {
    if (!accessible(data)) {
        if (isNull(key)) {
            throw new Error(
                "Cannot push to root of non-object data when key is null",
            );
        }

        return setObjectValue({} as Record<TKey, TValue>, key, values);
    }

    const obj = data as Record<TKey, TValue>;

    // Arr::push with a null key is Arr::get(null) (whole array) then array_push, so it
    // appends after the highest existing integer-like key instead of throwing.
    if (isNull(key)) {
        let nextIndex = 0;
        // Ascending key order only holds inside the array-index range (0 to 2**32-2);
        // isIntegerLikeKey has no such ceiling, so a PHP-scale key above it keeps
        // insertion order instead - the >= comparison is load-bearing, not redundant.
        for (const existing of Object.keys(obj)) {
            if (isIntegerLikeKey(existing) && Number(existing) >= nextIndex) {
                nextIndex = Number(existing) + 1;
            }
        }

        const result = { ...obj } as Record<PropertyKey, TValue>;
        for (const value of values) {
            result[nextIndex] = value;
            nextIndex++;
        }

        return result as Record<TKey, TValue>;
    }

    const existingValue = getObjectValue(obj, key);

    if (isArray(existingValue)) {
        const newArray = [...existingValue, ...values];
        return setObjectValue(obj, key, newArray) as Record<TKey, TValue>;
    }

    // A missing path defaults to [] like PHP's Arr::array(); an explicit null is a
    // real value at the key, so it must fail the array check instead of being created over.
    if (!hasMixed(obj, key)) {
        return setObjectValue(obj, key, [...values]) as Record<TKey, TValue>;
    }

    throw new Error(arrayValueMessage(existingValue, key));
}

/**
 * Shuffle the given object and return the result with shuffled key order.
 *
 * @param data - The object to shuffle.
 * @returns A new object with shuffled key order.
 *
 * @example
 *
 * shuffle({ a: 1, b: 2, c: 3, d: 4, e: 5 }); -> { c: 3, a: 1, e: 5, b: 2, d: 4 } (random order)
 * shuffle({ x: 'hello', y: 'world', z: 'test' }); -> { z: 'test', x: 'hello', y: 'world' } (random order)
 */
export function shuffle<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const entries = Object.entries(obj);

    // Fisher-Yates shuffle algorithm
    for (let i = entries.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = entries[i];
        entries[i] = entries[j] as [string, unknown];
        entries[j] = temp as [string, unknown];
    }

    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    for (const [key, value] of entries) {
        defineKey(result as Record<string, TValue>, key, value as TValue);
    }

    return result;
}

/**
 * Slice the underlying object items, preserving keys — `array_slice($items,
 * $offset, $length, true)` (`Collection.php:1369`).
 *
 * @see Collection::slice — `packages/collection/stubs/Collection.php:1369`.
 *      Wraps `array_slice($items, $offset, $length, preserveKeys: true)`.
 *
 * @param data - The object to slice
 * @param offset - The starting index
 * @param length - The number of items to include
 * @returns Sliced object
 *
 * @example
 *
 * slice({ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 }, -2, 5); -> { g: 7, h: 8 }
 */
export function slice<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | null | undefined,
    offset: number,
    length: number | null = null,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<string, TValue>;
    const entries = Object.entries(obj);
    const { start, end } = resolveSliceRange(entries.length, offset, length);

    const slicedEntries = entries.slice(start, end);

    const result: Record<string, TValue> = {};

    for (const [key, value] of slicedEntries) {
        // Writes go through `defineKey` so a `__proto__` entry becomes a real
        // own key instead of reparenting `result` through the `__proto__`
        // setter (see `isUnsafeKey`, AGENTS.md:189).
        defineKey(result, key, value);
    }

    return result as Record<TKey, TValue>;
}

/**
 * Get the first item in the object, but only if exactly one item exists. Otherwise, throw an exception.
 *
 * @param data - The object to check.
 * @param callback - Optional callback to filter items.
 * @returns The single item in the object.
 * @throws Error if no items or multiple items exist.
 *
 * @example
 *
 * sole({ only: 42 }); -> 42
 * sole({ a: 1, b: 2, c: 3 }, (value) => value > 2); -> 3
 * sole({}); -> throws Error: No items found
 * sole({ a: 1, b: 2 }); -> throws Error: Multiple items found (2 items)
 * sole({ a: 1, b: 2, c: 3 }, (value) => value > 1); -> throws Error: Multiple items found (2 items)
 */
export function sole<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback?: (value: TValue, key: TKey) => boolean,
): TValue {
    if (!accessible(data)) {
        throw new Error("No items found");
    }

    const obj = data as Record<TKey, TValue>;
    const entries = Object.entries(obj);

    if (entries.length === 0) {
        throw new Error("No items found");
    }

    let filteredEntries: [TKey, TValue][];

    if (callback) {
        // Filter using the callback
        filteredEntries = [];
        for (const [key, value] of entries) {
            if (callback(value as TValue, key as TKey)) {
                filteredEntries.push([key as TKey, value as TValue]);
            }
        }
    } else {
        // Use all entries
        filteredEntries = entries as [TKey, TValue][];
    }

    const count = filteredEntries.length;

    if (count === 0) {
        throw new Error("No items found");
    }

    if (count > 1) {
        throw new Error(`Multiple items found (${count} items)`);
    }

    return filteredEntries[0]![1];
}

/**
 * Sort the object using the given callback, "dot" notation, or an array of
 * sort descriptors for multi-key sorting.
 *
 * Values are ordered by `compareValues`, never by falsiness (PHP's `asort` puts
 * `-1` before `0`). Integer-like keys are renumbered over the sorted sequence.
 *
 * @see Collection::sort — `packages/collection/stubs/Collection.php:1554`. Wraps `uasort`/`asort`.
 *
 * @param data - The object to sort.
 * @param callback - The sorting callback, field name, an array of sort descriptors, or null for natural sorting.
 * @returns A new object with sorted entries.
 */
export function sort<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue>,
    callback?:
        | ((value: TValue, key: TKey) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): Record<TKey, TValue>;
export function sort(
    data: unknown,
    callback?:
        | ((value: unknown, key: PropertyKey) => unknown)
        | string
        | readonly SortSpec<unknown>[]
        | null,
): Record<PropertyKey, unknown>;
export function sort<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback:
        | ((value: TValue, key: TKey) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null = null,
): Record<TKey, TValue> | Record<PropertyKey, unknown> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    let entries = Object.entries(obj);

    if (isArray(callback)) {
        // Multi-key sorting - mirrors Collection::sortByMany (Collection.php:1627);
        // each descriptor keeps its own direction. Checked before isFalsy: an empty
        // descriptor array is PHP-falsy too, but is a no-op here, not a value sort.
        const comparators = (callback as readonly SortSpec<TValue>[]).map(
            (spec) => sortSpecComparator<TValue>(spec, false),
        );

        entries.sort(([, a], [, b]) => {
            for (const comparator of comparators) {
                const comparison = comparator(a as TValue, b as TValue);

                if (comparison !== 0) {
                    return comparison;
                }
            }

            return 0;
        });
    } else if (isFalsy(callback)) {
        // asort() on raw values: -1 sorts before 0, so falsiness must not
        // pre-empt the comparison. Same predicate and comparator as
        // Arr.sort, which is what keeps the two backings agreeing.
        entries.sort(([, a], [, b]) => compareValues(a, b));
    } else if (isString(callback)) {
        // Sort by field name using dot notation
        entries.sort(([, a], [, b]) =>
            compareValues(
                getObjectValue(a as Record<string, unknown>, callback),
                getObjectValue(b as Record<string, unknown>, callback),
            ),
        );
    } else if (isFunction(callback)) {
        // Extract sort values using callback, then sort by those values
        entries = entries
            .map(([key, value]) => ({
                key,
                value,
                sortKey: callback(value as TValue, key as TKey),
            }))
            .sort((a, b) => compareValues(a.sortKey, b.sortKey))
            .map(({ key, value }) => [key, value] as [string, unknown]);
    }

    const result: Record<string, TValue> = {};
    for (const [key, value] of reindexIntegerKeys(entries)) {
        defineKey(result, key, value as TValue);
    }

    return result as Record<TKey, TValue>;
}

/**
 * Sort the object in descending order using the given callback, "dot"
 * notation, or an array of sort descriptors for multi-key sorting.
 *
 * TODO: use the sort function with a "descending" parameter defined
 *
 * Integer-like keys are renumbered over the sorted sequence.
 *
 * @see Collection::sortDesc — `packages/collection/stubs/Collection.php:1571`. Wraps `arsort`.
 *
 * @param data - The object to sort.
 * @param callback - The value extractor callback, field name, sort descriptors, or null for natural sorting.
 * @returns A new object with sorted entries in descending order.
 */
export function sortDesc<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue>,
    callback?:
        | ((value: TValue, key: TKey) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): Record<TKey, TValue>;
export function sortDesc(
    data: unknown,
    callback?:
        | ((value: unknown, key: PropertyKey) => unknown)
        | string
        | readonly SortSpec<unknown>[]
        | null,
): Record<PropertyKey, unknown>;
export function sortDesc<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback?:
        | ((value: TValue, key: TKey) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): Record<TKey, TValue> | Record<PropertyKey, unknown> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    let entries = Object.entries(obj);

    if (isArray(callback)) {
        // Multi-key sorting - mirrors Collection::sortByDesc: every
        // descriptor's own direction is overridden to descending (a
        // comparator function is unaffected - see sortSpecComparator).
        const comparators = (callback as readonly SortSpec<TValue>[]).map(
            (spec) => sortSpecComparator<TValue>(spec, true),
        );

        entries.sort(([, a], [, b]) => {
            for (const comparator of comparators) {
                const comparison = comparator(a as TValue, b as TValue);

                if (comparison !== 0) {
                    return comparison;
                }
            }

            return 0;
        });
    } else if (isFalsy(callback)) {
        // arsort() on raw values. Same predicate as Arr.sortDesc and as both
        // packages' sort, which is what keeps the four in agreement — PHP
        // cannot arbitrate, since Collection::sortDesc("") throws.
        entries.sort(([, a], [, b]) => compareValues(b, a));
    } else if (isString(callback)) {
        // Sort by field name using dot notation in descending order
        entries.sort(([, a], [, b]) =>
            compareValues(
                getObjectValue(b as Record<string, unknown>, callback),
                getObjectValue(a as Record<string, unknown>, callback),
            ),
        );
    } else if (isFunction(callback)) {
        // Extract sort values using callback, then sort by those values in descending order
        entries = entries
            .map(([key, value]) => ({
                key,
                value,
                sortKey: callback(value as TValue, key as TKey),
            }))
            .sort((a, b) => compareValues(b.sortKey, a.sortKey))
            .map(({ key, value }) => [key, value] as [string, unknown]);
    }

    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    for (const [key, value] of reindexIntegerKeys(entries)) {
        defineKey(result as Record<string, TValue>, key, value as TValue);
    }

    return result;
}

/**
 * Recursively sort an object by keys and values.
 *
 * @param data - The object to sort recursively.
 * @param descending - Whether to sort in descending order.
 * @returns A new recursively sorted object.
 *
 * @example
 *
 * sortRecursive({ b: { d: 2, c: 1 }, a: { f: 4, e: 3 } }); -> { a: { e: 3, f: 4 }, b: { c: 1, d: 2 } }
 * sortRecursive({ user1: { name: 'john', age: 30 }, user2: { name: 'jane', age: 25 } }); -> sorted objects with sorted keys
 */
export function sortRecursive<T extends Record<PropertyKey, unknown>>(
    data: T,
    descending?: CaseValue<typeof SortDirection> | boolean,
): T;
export function sortRecursive(
    data: unknown,
    descending?: CaseValue<typeof SortDirection> | boolean,
): Record<PropertyKey, unknown>;
export function sortRecursive<T extends Record<PropertyKey, unknown>>(
    data: T | unknown,
    descending: CaseValue<typeof SortDirection> | boolean = false,
): T | Record<PropertyKey, unknown> {
    const isDesc =
        descending === true || descending === SortDirection.Descending;
    if (!accessible(data)) {
        return {} as T;
    }

    const obj = data as T;
    const entries = Object.entries(obj) as [PropertyKey, unknown][];

    // Recursively sort nested objects first
    const processedEntries: [PropertyKey, unknown][] = [];
    for (const [key, value] of entries) {
        if (isObject(value)) {
            processedEntries.push([key, sortRecursive(value, isDesc)]);
        } else if (isArray(value)) {
            // For arrays, sort them if they contain sortable items
            const sortedArray = [...value].sort((a, b) => {
                // Compare as strings for consistent ordering of unknown types
                const strA = String(a);
                const strB = String(b);
                const comparison = strA.localeCompare(strB);
                return isDesc ? -comparison : comparison;
            });
            processedEntries.push([key, sortedArray]);
        } else {
            processedEntries.push([key, value]);
        }
    }

    // Sort object keys
    processedEntries.sort(([keyA], [keyB]) => {
        const strKeyA = String(keyA);
        const strKeyB = String(keyB);
        const comparison = strKeyA.localeCompare(strKeyB);

        return isDesc ? -comparison : comparison;
    });

    // Rebuild object with sorted keys
    const result: Record<PropertyKey, unknown> = {};
    for (const [key, value] of processedEntries) {
        defineKey(result as Record<string, unknown>, key as string, value);
    }

    return result as T;
}

/**
 * Recursively sort an object by keys and values in descending order.
 *
 * @param data - The object to sort recursively in descending order.
 * @param options - Sort options (currently unused, for PHP compatibility).
 * @returns A new recursively sorted object in descending order.
 *
 * @example
 *
 * sortRecursiveDesc({ a: { e: 3, f: 4 }, b: { c: 1, d: 2 } }); -> { b: { d: 2, c: 1 }, a: { f: 4, e: 3 } }
 */
export function sortRecursiveDesc<T extends Record<PropertyKey, unknown>>(
    data: T,
): T;
export function sortRecursiveDesc(data: unknown): Record<PropertyKey, unknown>;
export function sortRecursiveDesc<T extends Record<PropertyKey, unknown>>(
    data: T | unknown,
): T | Record<PropertyKey, unknown> {
    return sortRecursive(data, SortDirection.Descending);
}

/**
 * Splice a portion of the underlying object, mutating it in place, like PHP's
 * `array_splice()`. String keys keep theirs; integer-like keys reindex from 0.
 * Writes go through `defineKey` so a `__proto__` entry becomes a real own key
 * (see `isUnsafeKey`, AGENTS.md:189).
 *
 * @see Collection::splice — `packages/collection/stubs/Collection.php:1755`. Wraps `array_splice`; mutates.
 *
 * @param data - The object to splice. Mutated in place.
 * @param offset - The starting index, by entry order (not by key)
 * @param length - The number of entries to remove. Defaults to everything from offset to the end.
 * @param replacement - Object(s) whose values are spliced in at offset, renumbered from 0
 * @returns The removed entries, keyed the same way they were in `data`.
 */
export function splice<TValue, TKey extends PropertyKey, TReplacements>(
    data: Record<TKey, TValue> | null | undefined,
    offset: number,
    length?: number,
    ...replacement: TReplacements[]
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<string, TValue>;
    const entries = Object.entries(obj);
    const len = entries.length;

    const start =
        offset < 0 ? Math.max(len + offset, 0) : Math.min(offset, len);
    // PHP's array_splice treats a negative length as counting back from the end.
    const deleteCount = isUndefined(length)
        ? len - start
        : length < 0
          ? Math.max(len + length - start, 0)
          : length;

    const beforeEntries = entries.slice(0, start);
    const removedEntries = entries.slice(start, start + deleteCount);
    const afterEntries = entries.slice(start + deleteCount);

    // Prepare replacement entries
    const replacementEntries: [string, TValue][] = [];
    for (const repObj of replacement) {
        if (accessible(repObj) || isArray(repObj)) {
            for (const value of Object.values(
                repObj as Record<string, TValue>,
            )) {
                replacementEntries.push(["0", value as TValue]);
            }

            continue;
        }

        // array_splice takes a bare scalar as one spliced-in element;
        // reindexIntegerKeys renumbers this placeholder by position.
        replacementEntries.push(["0", repObj as unknown as TValue]);
    }

    for (const key of Object.keys(obj)) {
        delete obj[key];
    }

    const remainderEntries = reindexIntegerKeys([
        ...beforeEntries,
        ...replacementEntries,
        ...afterEntries,
    ]);

    for (const [key, value] of remainderEntries) {
        defineKey(obj, key, value);
    }

    const removed: Record<string, TValue> = {};
    for (const [key, value] of reindexIntegerKeys(removedEntries)) {
        defineKey(removed, key, value);
    }

    return removed as Record<TKey, TValue>;
}

/**
 * Get a string item from an object using "dot" notation.
 * Throws an error if the value is not a string.
 *
 * @param data - The object to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The string value.
 * @throws Error if the value is not a string.
 *
 * @example
 *
 * string({ name: 'John', age: 30 }, 'name'); -> 'John'
 * string({ user: { name: 'John' } }, 'user.name'); -> 'John'
 * string({ user: { age: 30 } }, 'user.age'); -> throws Error
 */
export function string<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TDefault = null,
>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): string {
    const value = getObjectValue(data, key, defaultValue);

    if (!isString(value)) {
        throw new Error(
            `Object value for key [${key}] must be a string, ${phpTypeName(value)} found.`,
        );
    }

    return value;
}

/**
 * Conditionally compile CSS classes from an object into a CSS class list.
 *
 * @param data - The object to convert to CSS classes.
 * @returns A string of CSS classes separated by spaces.
 *
 * @example
 *
 * toCssClasses({ 'font-bold': true, 'mt-4': true }); -> 'font-bold mt-4'
 * toCssClasses({ 'font-bold': true, 'text-red': false, 'ml-2': true }); -> 'font-bold ml-2'
 * toCssClasses({ primary: true, secondary: false }); -> 'primary'
 * toCssClasses({ 0: 'font-bold', 1: 'mt-4', 'ml-2': true, 'mr-2': false }); -> 'font-bold mt-4 ml-2'
 */
export function toCssClasses<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
): string {
    if (!accessible(data)) {
        return "";
    }

    const obj = data as Record<TKey, TValue>;
    const classes: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        // Numeric-like keys (Arr.php:1214's is_numeric($class)) push the value as
        // the class name; other keys push the key when truthy. isPhpNumeric, not
        // Number()/isNaN: hex, "", " ", and "Infinity" parse under Number() but aren't PHP-numeric.
        if (isPhpNumeric(key)) {
            // Numeric key: push the value as-is (PHP-cast), like PHP
            // pushing $constraint straight into the array before implode().
            classes.push(cssListItemToString(value));
        } else if (!isPhpFalsy(value)) {
            classes.push(key);
        }
    }

    return classes.join(" ");
}

/**
 * Conditionally compile CSS styles from an object into a CSS style list.
 *
 * @param data - The object to convert to CSS styles.
 * @returns A string of CSS styles separated by spaces, each ending with semicolon.
 *
 * @example
 *
 * toCssStyles({ 'font-weight: bold': true, 'margin-top: 4px': true }); -> 'font-weight: bold; margin-top: 4px;'
 * toCssStyles({ 'font-weight: bold': true, 'color: red': false, 'margin-left: 2px': true }); -> 'font-weight: bold; margin-left: 2px;'
 * toCssStyles({ 0: 'font-weight: bold', 'margin-left: 2px;': true }); -> 'font-weight: bold; margin-left: 2px;'
 */
export function toCssStyles<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
): string {
    if (!accessible(data)) {
        return "";
    }

    const obj = data as Record<TKey, TValue>;
    const styles: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        // Numeric-like keys (Arr.php:1237's is_numeric($class)) push the value as
        // the style; other keys push the key when truthy. isPhpNumeric, not
        // Number()/isNaN: hex, "", " ", and "Infinity" parse under Number() but aren't PHP-numeric.
        if (isPhpNumeric(key)) {
            // Numeric key: push the value as-is (PHP-cast, then finished),
            // like PHP's Str::finish($constraint, ';').
            styles.push(finish(cssListItemToString(value), ";"));
        } else if (!isPhpFalsy(value)) {
            styles.push(finish(key, ";"));
        }
    }

    return styles.join(" ");
}

/**
 * Filter the object using the given callback.
 *
 * @param data - The object to filter.
 * @param callback - The function to call for each item (value, key) => boolean.
 * @returns A new filtered object.
 *
 * @example
 *
 * where({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2); -> { c: 3, d: 4 }
 * where({ name: 'John', age: null, city: 'NYC' }, (value) => value !== null); -> { name: 'John', city: 'NYC' }
 */
export function where<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => boolean,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj)) {
        if (callback(value as TValue, key as TKey)) {
            defineKey(result as Record<string, TValue>, key, value as TValue);
        }
    }

    return result;
}

/**
 * Filter the object using the negation of the given callback.
 *
 * @param data - The object to filter.
 * @param callback - The function to call for each item (value, key) => boolean.
 * @returns A new filtered object with items that fail the test.
 *
 * @example
 *
 * reject({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2); -> { a: 1, b: 2 }
 * reject({ name: 'John', age: null, city: 'NYC' }, (value) => value === null); -> { name: 'John', city: 'NYC' }
 */
export function reject<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => boolean,
): Record<TKey, TValue> {
    return where(data, (value, key) => !callback(value, key));
}

/**
 * Replace the data items with the given replacer items, like PHP's
 * `array_replace()` / `Collection::replace()`.
 *
 * Returns a new object rather than mutating `data`; a `null`/`undefined` replacer
 * is a no-op (`CollectionTest.php:1482`). Writes go through `defineKey` so a
 * `__proto__` key on `replacerData` becomes a real own key (see `isUnsafeKey`,
 * AGENTS.md:189).
 *
 * @see Collection::replace — `packages/collection/stubs/Collection.php:1170`. Wraps `array_replace`.
 *
 * @param data - The original object to replace items in. Never mutated.
 * @param replacerData - The object containing items to replace. `null`/`undefined` is a no-op.
 * @returns A new object with the replaced items.
 */
export function replace<T1>(
    data: Record<PropertyKey, T1>,
    replacerData: null | undefined,
): Record<PropertyKey, T1>;
export function replace<T1, T2>(
    data: Record<PropertyKey, T1>,
    replacerData: Record<PropertyKey, T2>,
): Record<PropertyKey, T1 | T2>;
// A caller holding `Record<PropertyKey, T2> | null` matches neither
// overload above: a call is resolved against declared overloads only,
// never the implementation signature, so this third one is required.
export function replace<T1, T2>(
    data: Record<PropertyKey, T1>,
    replacerData: Record<PropertyKey, T2> | null | undefined,
): Record<PropertyKey, T1 | T2>;
export function replace<T1, T2>(
    data: Record<PropertyKey, T1>,
    replacerData: Record<PropertyKey, T2> | null | undefined,
): Record<PropertyKey, T1 | T2> {
    const result: Record<PropertyKey, T1 | T2> = { ...data };

    if (!accessible(replacerData)) {
        return result;
    }

    for (const [key, value] of Object.entries(replacerData)) {
        defineKey(result as Record<string, T1 | T2>, key, value as T1 | T2);
    }

    return result;
}

/**
 * Recursively replace the data items with the given items, like PHP's
 * `array_replace_recursive()` / `Collection::replaceRecursive()`.
 *
 * Builds a new object at every recursion level rather than mutating `data`. A
 * `null`/`undefined` replacer is a no-op (`CollectionTest.php:1524`). Only
 * `__proto__` is skipped on `replacerData` — the sole prototype-pollution hazard
 * (see `isUnsafeKey`, AGENTS.md:189); `constructor`/`prototype` write normally.
 *
 * @see Collection::replaceRecursive — `packages/collection/stubs/Collection.php:1181`. Wraps `array_replace_recursive`.
 *
 * @param data - The original object to replace items in. Never mutated.
 * @param replacerData - The object containing items to replace. `null`/`undefined` is a no-op.
 * @returns A new, recursively merged object.
 */
export function replaceRecursive<T1>(
    data: Record<PropertyKey, T1>,
    replacerData: null | undefined,
): Record<PropertyKey, T1>;
export function replaceRecursive<T1, T2>(
    data: Record<PropertyKey, T1>,
    replacerData: Record<PropertyKey, T2>,
): Record<PropertyKey, T1 | T2>;
// See `replace`'s matching overload for why this third, concrete overload is
// required rather than relying on the implementation signature below (TS2769
// otherwise, for a caller holding `Record<PropertyKey, T2> | null`).
export function replaceRecursive<T1, T2>(
    data: Record<PropertyKey, T1>,
    replacerData: Record<PropertyKey, T2> | null | undefined,
): Record<PropertyKey, T1 | T2>;
export function replaceRecursive<T1, T2>(
    data: Record<PropertyKey, T1>,
    replacerData: Record<PropertyKey, T2> | null | undefined,
): Record<PropertyKey, T1 | T2> {
    const result: Record<PropertyKey, T1 | T2> = { ...data };

    if (!accessible(replacerData)) {
        return result;
    }

    for (const [key, value] of Object.entries(replacerData)) {
        if (key === "__proto__") {
            continue;
        }

        const existing = data[key as PropertyKey];

        if (isObject(value) && isObject(existing)) {
            defineKey(
                result as Record<string, T1 | T2>,
                key,
                replaceRecursive(
                    existing as Record<PropertyKey, T1>,
                    value as Record<PropertyKey, T2>,
                ) as T1 | T2,
            );
        } else if (isArray(value) && isArray(existing)) {
            defineKey(
                result as Record<string, T1 | T2>,
                key,
                arrReplaceRecursive(existing as T1[], value as T2[]) as T1 | T2,
            );
        } else {
            defineKey(result as Record<string, T1 | T2>, key, value as T1 | T2);
        }
    }

    return result;
}

/**
 * Reverse the order of the object's entries.
 *
 * String keys keep theirs; integer-like keys are renumbered over the reversed
 * sequence, since JS always re-sorts them ascending on write (ECMA-262).
 *
 * @see Collection::reverse — `packages/collection/stubs/Collection.php:1191`. Wraps `array_reverse($items, true)`.
 *
 * @param data - The object to reverse.
 * @returns A new object with reversed entries.
 */
export function reverse<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const entries = Object.entries(obj);

    entries.reverse();

    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    for (const [key, value] of reindexIntegerKeys(entries)) {
        defineKey(result as Record<string, TValue>, key, value as TValue);
    }

    return result;
}

/**
 * Pad object to the specified length with a value.
 *
 * Pad slots join the integer-key sequence rather than restarting it, matching
 * `array_pad`'s numbering; string keys keep theirs. Only iteration order of a
 * mixed-key object can differ, since JS enumerates integer-like keys first (ECMA-262).
 *
 * @see Collection::pad — `packages/collection/stubs/Collection.php:1904`. Wraps `array_pad`.
 *
 * @param data - The object to pad.
 * @param size - The desired size of the object after padding. Positive to pad at the end, negative to pad at the beginning.
 * @param value - The value to use for padding.
 * @returns A new padded object.
 */
export function pad<TPadValue, TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    size: number,
    value: TPadValue,
): Record<TKey, TValue | TPadValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue | TPadValue>;
    }

    const obj = data as Record<string, TValue>;
    const entries = Object.entries(obj);
    const currentLength = entries.length;

    if (Math.abs(size) <= currentLength) {
        return { ...obj } as Record<TKey, TValue | TPadValue>;
    }

    const padCount = Math.abs(size) - currentLength;
    const padEntries: [string, TPadValue][] = [];

    for (let i = 0; i < padCount; i++) {
        // Any integer-like key works here; reindexIntegerKeys below
        // renumbers the whole sequence by position anyway.
        padEntries.push(["0", value]);
    }

    const orderedEntries: [string, TValue | TPadValue][] =
        size > 0 ? [...entries, ...padEntries] : [...padEntries, ...entries];

    const result: Record<string, TValue | TPadValue> = {};
    for (const [key, val] of reindexIntegerKeys(orderedEntries)) {
        defineKey(result, key, val);
    }

    return result as Record<TKey, TValue | TPadValue>;
}

/**
 * Partition the object into two objects using the given callback.
 *
 * @param data - The object to partition.
 * @param callback - The function to call for each item (value, key) => boolean.
 * @returns A tuple containing [passed, failed] objects.
 *
 * @example
 *
 * partition({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2); -> [{ c: 3, d: 4 }, { a: 1, b: 2 }]
 * partition({ name: 'John', age: null, city: 'NYC' }, (value) => value !== null); -> [{ name: 'John', city: 'NYC' }, { age: null }]
 */
export function partition<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<string, TValue> | unknown,
    callback: (value: TValue, key: TKey) => boolean,
): [Record<string, TValue>, Record<string, TValue>] {
    if (!accessible(data)) {
        return [{}, {}];
    }

    const obj = data as Record<TKey, TValue>;
    const passed: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    const failed: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj)) {
        if (callback(value as TValue, key as TKey)) {
            defineKey(passed as Record<string, TValue>, key, value as TValue);
        } else {
            defineKey(failed as Record<string, TValue>, key, value as TValue);
        }
    }

    return [passed, failed];
}

/**
 * Filter items where the value is not null.
 *
 * @param data - The object to filter.
 * @returns A new object with null values removed.
 *
 * @example
 *
 * whereNotNull({ a: 1, b: null, c: 2, d: undefined, e: 3 }); -> { a: 1, c: 2, d: undefined, e: 3 }
 * whereNotNull({ name: 'John', age: null, city: 'NYC' }); -> { name: 'John', city: 'NYC' }
 */
export function whereNotNull<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue | null> | unknown,
): Record<TKey, TValue> {
    return where(
        data as Record<TKey, TValue | null>,
        (value): value is TValue => !isNull(value),
    );
}

/**
 * Determine if an object contains a given value.
 *
 * @see Collection::contains — `packages/collection/stubs/Collection.php:195`.
 *      Value/callback/key-operator-value search; has no `Arr.php` counterpart at all.
 *
 * @param data - The object to search in.
 * @param value - The value to search for.
 * @returns True if the value is found, false otherwise.
 *
 * @example
 *
 * contains({ name: 'John', age: 30, city: 'NYC' }, 'John'); -> true
 * contains({ name: 'John', age: 30, city: 'NYC' }, 'Jane'); -> false
 * contains({ users: { 1: 'John', 2: 'Jane' } }, 'John'); -> false (nested values)
 */
export function contains<TValue>(
    data: Record<PropertyKey, TValue>,
    value: (value: TValue, key: PropertyKey) => boolean,
    strict?: boolean,
): boolean;
export function contains(
    data: unknown,
    value: unknown,
    strict?: boolean,
): boolean;
export function contains<TValue>(
    data: Record<PropertyKey, TValue> | unknown,
    value: TValue | ((value: TValue, key: PropertyKey) => boolean),
    strict = false,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    if (isFunction(value)) {
        const obj = data as Record<PropertyKey, TValue>;
        for (const [key, val] of Object.entries(obj)) {
            if (value(val as TValue, key as PropertyKey)) {
                return true;
            }
        }

        return false;
    }

    if (strict) {
        return Object.values(data as Record<PropertyKey, TValue>).includes(
            value as TValue,
        );
    }

    // Use PHP-like loose comparison
    const obj = data as Record<PropertyKey, TValue>;
    for (const val of Object.values(obj)) {
        if (looseEqual(val, value)) {
            return true;
        }
    }

    return false;
}

/**
 * Filter the object using the given callback.
 *
 * @see Collection::filter — `packages/collection/stubs/Collection.php:424`.
 *      With a callback, delegates to `Arr::where()`; without one, wraps `array_filter`.
 *
 * @param data - The object to filter.
 * @param callback - The function to call for each item (value, key) => boolean.
 * @returns A new filtered object.
 *
 * @example
 *
 * filter({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2); -> { c: 3, d: 4 }
 * filter({ name: 'John', age: null, city: 'NYC' }, (value) => value !== null); -> { name: 'John', city: 'NYC' }
 * filter({ a: "0", b: "", c: 0, d: "x" }); -> { d: "x" }
 * filter({ a: "00", b: "0.0" }); -> { a: "00", b: "0.0" }
 */
export function filter<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | null | undefined,
    callback?: (value: TValue, key: TKey) => boolean | null,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
        // If no callback, filter out PHP-falsy values by default
        const shouldInclude = isFunction(callback)
            ? callback(value, key)
            : !isPhpFalsy(value);

        if (shouldInclude) {
            // Writes go through `defineKey` so a `__proto__` key in `data`
            // becomes a real own key instead of reparenting `result` through
            // the `__proto__` setter (see `isUnsafeKey`, AGENTS.md:189).
            defineKey(result as Record<string, TValue>, String(key), value);
        }
    }

    return result;
}

/**
 * If the given value is not an object and not null, wrap it in one.
 *
 * @param value - The value to wrap.
 * @returns An object containing the value, or an empty object if null.
 *
 * @example
 *
 * wrap('hello'); -> { 0: 'hello' }
 * wrap({ hello: 'world' }); -> { hello: 'world' }
 * wrap(null); -> {}
 * wrap(undefined); -> { 0: undefined }
 */
export function wrap<TValue>(
    value: TValue | null,
): Record<PropertyKey, TValue> {
    if (isNull(value)) {
        return {};
    }

    return isObject<TValue>(value)
        ? (value as Record<PropertyKey, TValue>)
        : { 0: value };
}

/**
 * Get all keys from an object.
 *
 * Uses `Object.keys()` — own enumerable string keys only — so its length always
 * matches `values()`'s, which walks the same enumerable-own-string-keys set.
 *
 * @see Collection::keys — `packages/collection/stubs/Collection.php:790`. Wraps `array_keys`.
 *
 * @param data - The object to get keys from.
 * @returns An array of all keys.
 */
export function keys<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
): (string | number)[] {
    if (!accessible(data)) {
        return [];
    }

    // Convert numeric string keys back to numbers, matching PHP's array
    // keys being ints when they look like ints.
    const result: (string | number)[] = [];

    for (const key of Object.keys(data as Record<TKey, TValue>)) {
        const numericKey = Number(key);

        if (!Number.isNaN(numericKey) && String(numericKey) === key) {
            result.push(numericKey);
        } else {
            result.push(key);
        }
    }

    return result;
}

/**
 * Get all values from an object.
 *
 * @see Collection::values — `packages/collection/stubs/Collection.php:1870`.
 *      Wraps `array_values`.
 *
 * @param data - The object to get values from.
 * @returns An array of all values.
 *
 * @example
 *
 * values({ name: 'John', age: 30, city: 'NYC' }); -> ['John', 30, 'NYC']
 * values({}); -> []
 */
export function values<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
): TValue[] {
    if (!accessible(data)) {
        return [];
    }

    return Object.values(data as Record<TKey, TValue>);
}

/**
 * Get the items that are not present in the given object.
 *
 * Compares by value only, using PHP's `(string) $a === (string) $b` rule (see
 * `phpValueMatch`); unlike `diffAssoc`, a matching key on `other` with a different
 * value does not save the item. `other` is normalized by `arrayableValues`.
 *
 * @see Collection::diff — `packages/collection/stubs/Collection.php:276`. Wraps `array_diff`.
 *
 * @param data - The original object.
 * @param other - The object (or array) to compare against.
 * @returns A new object containing items from data whose value is not present in other.
 */
// Overload: typed — TOtherKey lets a differently-shaped `other` unify without
// failing, and `other` may be null/undefined (treated as empty) without falling
// through to the unknown fallback below.
export function diff<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TOtherKey extends PropertyKey = PropertyKey,
>(
    data: Record<TKey, TValue>,
    other: Record<TOtherKey, TValue> | null | undefined,
): Record<TKey, TValue>;
// Overload: data typed, other opaque (e.g. Enumerable/Arrayable-like) — keys
// widen to PropertyKey since other's shape is unknown, but TValue still comes
// from data, so the result isn't a plain `unknown` record.
export function diff<TValue>(
    data: Record<PropertyKey, TValue>,
    other: unknown,
): Record<PropertyKey, TValue>;
// Overload: unknown fallback
export function diff(
    data: unknown,
    other: unknown,
): Record<PropertyKey, unknown>;
// Implementation
export function diff<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TOtherKey extends PropertyKey = PropertyKey,
>(
    data: Record<TKey, TValue> | unknown,
    other: Record<TOtherKey, TValue> | unknown,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const otherValues = arrayableValues<TValue>(other);
    const matches = phpValueMatcher(otherValues);
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
        if (!matches(value)) {
            defineKey(result as Record<string, TValue>, key as string, value);
        }
    }

    return result;
}

/**
 * Diff the object with the given other object, comparing both keys and values.
 *
 * This is `array_diff_assoc` — unlike `diff`, matching by key+value, not by value
 * alone. A non-accessible `other` is treated as empty, so every entry of `data` survives.
 *
 * @see Collection::diffAssoc — `packages/collection/stubs/Collection.php:299`. Wraps `array_diff_assoc`.
 *
 * @param data - The original object
 * @param other - The object to diff against
 * @returns A new object containing key-value pairs not present in other
 */
export function diffAssoc<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    other: Record<TKey, TValue> | unknown,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    if (!accessible(other)) {
        return { ...(data as Record<TKey, TValue>) };
    }

    const obj = data as Record<TKey, TValue>;
    const otherObj = other as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
        if (
            !Object.hasOwn(otherObj, key) ||
            !phpValueMatch(otherObj[key as TKey], value)
        ) {
            defineKey(result as Record<string, TValue>, key as string, value);
        }
    }

    return result;
}

/**
 * Diff the data object with the given other object using a callback for key comparison.
 * Compares keys using the callback and values using PHP's `(string)` cast rule.
 *
 * @see Collection::diffAssocUsing — `packages/collection/stubs/Collection.php:311`.
 *      Wraps `array_diff_uassoc`. Obj-only — `Arr.php` has no equivalent, so there is no `arr.diffAssocUsing`.
 *
 * @param data - The original object
 * @param other - The object to diff against
 * @param callback - Function to compare keys (returns true if keys match)
 * @returns A new object containing key-value pairs not present in other
 *
 * @example
 *
 * const strcasecmp = (a: unknown, b: unknown) => String(a).toLowerCase() === String(b).toLowerCase();
 * diffAssocUsing({a: 'green', b: 'brown'}, {A: 'green', c: 'blue'}, strcasecmp); -> {b: 'brown'}
 * diffAssocUsing({a: 'green', b: 'brown'}, {A: 'yellow'}, strcasecmp); -> {a: 'green', b: 'brown'}
 */
export function diffAssocUsing<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    other: Record<TKey, TValue> | unknown,
    callback: (keyA: TKey, keyB: TKey) => boolean,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    if (!accessible(other)) {
        return { ...(data as Record<TKey, TValue>) };
    }

    const obj = data as Record<TKey, TValue>;
    const otherObj = other as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    const otherKeys = Object.keys(otherObj) as TKey[];

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
        // Find if there's a matching key in other object using callback
        const matchingKey = otherKeys.find((otherKey) =>
            callback(key, otherKey),
        );

        // Include if: no matching key found OR matching key has different value
        if (
            matchingKey === undefined ||
            !phpValueMatch(otherObj[matchingKey], value)
        ) {
            defineKey(result as Record<string, TValue>, key as string, value);
        }
    }

    return result;
}

/**
 * Diff the data object with the given other object using a callback for key comparison only.
 * Compares keys using the callback and ignores values completely.
 *
 * @see Collection::diffKeysUsing — `packages/collection/stubs/Collection.php:334`.
 *      Wraps `array_diff_ukey`. Obj-only — `Arr.php` has no equivalent, so there is no `arr.diffKeysUsing`.
 *
 * @param data - The original object
 * @param other - The object to diff against
 * @param callback - Function to compare keys (returns true if keys match)
 * @returns A new object containing key-value pairs whose keys are not present in other
 *
 * @example
 *
 * const strcasecmp = (a: unknown, b: unknown) => String(a).toLowerCase() === String(b).toLowerCase();
 * diffKeysUsing({id: 1, first_word: 'Hello'}, {ID: 123, foo_bar: 'Hello'}, strcasecmp); -> {first_word: 'Hello'}
 * diffKeysUsing({a: 1, b: 2}, {A: 999}, strcasecmp); -> {b: 2}
 */
export function diffKeysUsing<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    other: Record<TKey, TValue> | unknown,
    callback: (keyA: TKey, keyB: TKey) => boolean,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    if (!accessible(other)) {
        return { ...(data as Record<TKey, TValue>) };
    }

    const obj = data as Record<TKey, TValue>;
    const otherObj = other as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    const otherKeys = Object.keys(otherObj) as TKey[];

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
        // Find if there's a matching key in other object using callback
        const matchingKey = otherKeys.find((otherKey) =>
            callback(key, otherKey),
        );

        // Include if: no matching key found (values are ignored)
        if (matchingKey === undefined) {
            defineKey(result as Record<string, TValue>, key as string, value);
        }
    }

    return result;
}

/**
 * Intersect the data object with the given other object.
 *
 * Compares by value only, using PHP's `(string) $a === (string) $b` rule (see
 * `phpValueMatch`); unlike `intersectAssoc`, `key in other` is not required.
 * `callable`, when given, replaces the comparator (PHP's `array_uintersect()`
 * style; folds Laravel's `intersectUsing()` into this parameter). `other` is
 * normalized by `arrayableValues`.
 *
 * @see Collection::intersect — `packages/collection/stubs/Collection.php:660`. Wraps `array_intersect`.
 *
 * @param data - The original object
 * @param other - The object to intersect with
 * @param callable - Optional function to compare values (array_uintersect-style)
 * @returns A new object containing data's items whose value is also present in other
 */
// Overload: with callback — T1 and T2 inferred independently
export function intersect<T1, T2>(
    data: Record<PropertyKey, T1>,
    other: Record<PropertyKey, T2> | null | undefined,
    callable: (a: T1, b: T2) => boolean,
): Record<PropertyKey, T1>;
// Overload: without callback — same value type on both sides
export function intersect<T1>(
    data: Record<PropertyKey, T1>,
    other: Record<PropertyKey, T1> | null | undefined,
    callable?: null,
): Record<PropertyKey, T1>;
// Overload: data typed, other opaque (e.g. Enumerable/Arrayable-like) — mirrors
// diff's equivalent overload above; T1 still comes from data instead of
// collapsing to a plain `unknown` record.
export function intersect<T1>(
    data: Record<PropertyKey, T1>,
    other: unknown,
    callable?: null,
): Record<PropertyKey, T1>;
// Overload: unknown fallback
export function intersect<T1, T2 = T1>(
    data: unknown,
    other: unknown,
    callable?: ((a: T1, b: T2) => boolean) | null,
): Record<PropertyKey, T1>;
// Implementation
export function intersect<T1, T2 = T1>(
    data: Record<PropertyKey, T1> | unknown,
    other: Record<PropertyKey, T2> | unknown,
    callable: ((a: T1, b: T2) => boolean) | null = null,
): Record<PropertyKey, T1> {
    const result: Record<PropertyKey, T1> = {};

    if (!accessible(data)) {
        return result;
    }

    const otherValues = arrayableValues<T2>(other);
    const entries = Object.entries(data as Record<PropertyKey, T1>);

    if (isFunction(callable)) {
        for (const [key, value] of entries) {
            if (
                otherValues.some((otherValue) =>
                    callable(value as T1, otherValue),
                )
            ) {
                defineKey(result as Record<string, T1>, key, value as T1);
            }
        }

        return result;
    }

    const matches = phpValueMatcher(otherValues);

    for (const [key, value] of entries) {
        if (matches(value)) {
            defineKey(result as Record<string, T1>, key, value as T1);
        }
    }

    return result;
}

/**
 * Intersect the object with the given items with additional key check.
 * Returns items where both the key AND value match.
 *
 * This is `array_intersect_assoc` — unlike `intersect`, `key in other` is required.
 * A non-accessible `data` or `other` is treated as empty, so the result is `{}`.
 *
 * @see Collection::intersectAssoc — `packages/collection/stubs/Collection.php:683`. Wraps `array_intersect_assoc`.
 *
 * @param data - The original object
 * @param other - The object to intersect with
 * @returns A new object containing items where both key and value match
 */
// Overload: typed
export function intersectAssoc<T1, T2 = T1>(
    data: Record<PropertyKey, T1>,
    other: Record<PropertyKey, T2> | null | undefined,
): Record<PropertyKey, T1>;
// Overload: unknown fallback — agrees with intersect's null-data acceptance (R5)
export function intersectAssoc<T1>(
    data: unknown,
    other: unknown,
): Record<PropertyKey, T1>;
// Implementation
export function intersectAssoc<T1, T2 = T1>(
    data: Record<PropertyKey, T1> | unknown,
    other: Record<PropertyKey, T2> | unknown,
): Record<PropertyKey, T1> {
    const result: Record<PropertyKey, T1> = {};

    if (!accessible(data) || !accessible(other)) {
        return result;
    }

    const otherObj = other as Record<PropertyKey, T2>;

    for (const [key, value] of Object.entries(
        data as Record<PropertyKey, T1>,
    )) {
        if (
            Object.hasOwn(otherObj, key) &&
            phpValueMatch(
                value as unknown,
                otherObj[key as PropertyKey] as unknown,
            )
        ) {
            defineKey(result as Record<string, T1>, key, value as T1);
        }
    }

    return result;
}

/**
 * Intersect the object with the given items with additional key check, using the callback.
 * Values are compared by PHP's `(string)` cast rule; `callback` compares keys.
 *
 * A non-accessible `data` or `other` is treated as empty, so the result is `{}`.
 *
 * @see Collection::intersectAssocUsing — `packages/collection/stubs/Collection.php:695`. Wraps `array_intersect_uassoc`
 *
 * @param data - The original object
 * @param other - The object to intersect with
 * @param callback - The callback function to compare keys (returns true if keys match)
 * @returns A new object containing items where both key (via callback) and value match
 */
// Overload: typed
export function intersectAssocUsing<T1, T2 = T1>(
    data: Record<PropertyKey, T1>,
    other: Record<PropertyKey, T2> | null | undefined,
    callback: (keyA: PropertyKey, keyB: PropertyKey) => boolean,
): Record<PropertyKey, T1>;
// Overload: unknown fallback — agrees with intersect's null-data acceptance (R5)
export function intersectAssocUsing<T1>(
    data: unknown,
    other: unknown,
    callback: (keyA: PropertyKey, keyB: PropertyKey) => boolean,
): Record<PropertyKey, T1>;
// Implementation
export function intersectAssocUsing<T1, T2 = T1>(
    data: Record<PropertyKey, T1> | unknown,
    other: Record<PropertyKey, T2> | unknown,
    callback: (keyA: PropertyKey, keyB: PropertyKey) => boolean,
): Record<PropertyKey, T1> {
    const result: Record<PropertyKey, T1> = {};

    if (!accessible(data) || !accessible(other)) {
        return result;
    }

    for (const [dataKey, dataValue] of Object.entries(
        data as Record<PropertyKey, T1>,
    )) {
        for (const [otherKey, otherValue] of Object.entries(
            other as Record<PropertyKey, T2>,
        )) {
            if (
                callback(dataKey, otherKey) &&
                phpValueMatch(dataValue as unknown, otherValue as unknown)
            ) {
                defineKey(
                    result as Record<string, T1>,
                    dataKey,
                    dataValue as T1,
                );
                break; // Only add once per dataKey
            }
        }
    }

    return result;
}

/**
 * Intersect the object with the given items by key.
 *
 * A non-accessible `data` or `other` is treated as empty, so the result is `{}`.
 *
 * @see Collection::intersectByKeys — `packages/collection/stubs/Collection.php:706`. Wraps `array_intersect_key`.
 *
 * @param data - The original object
 * @param other - The object to intersect with
 * @returns A new object containing items with keys present in both objects
 */
// Overload: typed
export function intersectByKeys<T1, T2 = T1>(
    data: Record<PropertyKey, T1>,
    other: Record<PropertyKey, T2> | null | undefined,
): Record<PropertyKey, T1>;
// Overload: unknown fallback — agrees with intersect's null-data acceptance (R5)
export function intersectByKeys<T1>(
    data: unknown,
    other: unknown,
): Record<PropertyKey, T1>;
// Implementation
export function intersectByKeys<T1, T2 = T1>(
    data: Record<PropertyKey, T1> | unknown,
    other: Record<PropertyKey, T2> | unknown,
): Record<PropertyKey, T1> {
    const result: Record<PropertyKey, T1> = {};

    if (!accessible(data) || !accessible(other)) {
        return result;
    }

    const otherObj = other as Record<PropertyKey, T2>;

    for (const [key, value] of Object.entries(
        data as Record<PropertyKey, T1>,
    )) {
        if (Object.hasOwn(otherObj, key)) {
            defineKey(result as Record<string, T1>, key, value as T1);
        }
    }

    return result;
}
