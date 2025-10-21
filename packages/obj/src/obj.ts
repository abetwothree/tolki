import { flip as arrFlip, replaceRecursive as arrReplaceRecursive } from "@laravel-js/arr";
import {
    dotFlatten,
    forgetKeys,
    getObjectValue,
    hasMixed,
    hasObjectKey,
    setObjectValue,
    undotExpandObject,
} from "@laravel-js/path";
import { Random, Str } from "@laravel-js/str";
import { castableToArray, compareValues, getAccessibleValues,isAccessibleData, isArray, isBoolean, isFalsy, isFiniteNumber, isFunction, isMap, isNonPrimitive, isNull, isNumber, isObject, isPrimitive, isSet, isString, isStringable, isSymbol, isTruthy, isUndefined, isWeakMap, isWeakSet, normalizeToArray, resolveDefault, typeOf } from '@laravel-js/utils';
import type { ObjectKey, PathKey, PathKeys } from "packages/types";

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
export function accessible<TValue>(value: TValue): boolean {
    return isObject(value);
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
export function add<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    key: PathKey,
    value: unknown,
): Record<TKey, TValue> {
    const mutableData = { ...data };

    if (getObjectValue(mutableData, key) === null) {
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
export function objectItem<TValue, TKey extends ObjectKey = ObjectKey, TDefault = null>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): Record<TKey, TValue> {
    const value = getObjectValue(data, key, defaultValue);

    if (! isObject(value)) {
        throw new Error(
            `Object value for key [${key}] must be an object, ${typeOf(value)} found.`,
        );
    }

    return value;
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
export function boolean<TValue, TKey extends ObjectKey = ObjectKey, TDefault = null>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): boolean {
    const value = getObjectValue(data, key, defaultValue);

    if (! isBoolean(value)) {
        throw new Error(
            `Object value for key [${key}] must be a boolean, ${typeof value} found.`,
        );
    }

    return value;
}

/**
 * Chunk the object into chunks of the given size.
 * 
 * @param data - The record to chunk
 * @param size - The size of each chunk
 * @param preserveKeys - Whether to preserve the original keys, defaults to false
 * @returns Chunked record
 */
export function chunk<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    size: number,
    preserveKeys: boolean = false,
){
    if(size <= 0){
        return {};
    }

    const entries = Object.entries(data);
    const chunks: Record<string, TValue> | Record<string, Record<string, TValue>> = {};
    let chunkIndex = 0;

    for(let i = 0; i < entries.length; i += size){
        const chunkEntries = entries.slice(i, i + size);
        if (preserveKeys) {
            chunks[chunkIndex] = Object.fromEntries(chunkEntries) as Record<string, TValue>;
        } else {
            chunks[chunkIndex] = Object.fromEntries(chunkEntries.map(([key, value]) => [key.split('.').pop()!, value])) as Record<string, TValue>;
        }
        
        chunkIndex++;
    }

    return chunks;
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
export function collapse<TValue extends Record<ObjectKey, Record<ObjectKey, unknown>>>(
    object: TValue,
): Record<string, TValue[keyof TValue]> {
    const out: Record<string, TValue[keyof TValue]> = {};

    for (const item of Object.values(object)) {
        if (isObject(item)) {
            Object.assign(out, item);
        }
    }

    return out;
}

/**
 * Combine multiple objects into one.
 * 
 * @param objects - The objects to combine.
 * @return A new object containing all key-value pairs from the input objects.
 */
export function combine<T extends Record<ObjectKey, unknown>>(
    ...objects: T[]
): Record<string, unknown> {
    return Object.assign({}, ...objects);
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
export function crossJoin<TValue extends Record<ObjectKey, readonly unknown[]>>(
    ...objects: TValue[]
): Record<ObjectKey, unknown>[] {
    let results: Record<ObjectKey, unknown>[] = [{}];

    for (const obj of objects) {
        const next: Record<ObjectKey, unknown>[] = [];

        for (const [key, values] of Object.entries(obj)) {
            if (!isArray(values) || values.length === 0) {
                return [];
            }

            for (const product of results) {
                for (const value of values) {
                    next.push({
                        ...product,
                        [key]: value,
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
export function divide<TValue extends Record<ObjectKey, unknown>>(
    object: TValue,
): [ObjectKey[], unknown[]] {
    return [Object.keys(object), Object.values(object)];
}

/**
 * Flatten a multi-dimensional object with "dot" notation.
 *
 * @param data - The object to flatten.
 * @param prepend - An optional string to prepend to each key.
 * @returns A new object with dot-notated keys.
 *
 * @example
 *
 * dot({ name: 'John', address: { city: 'NYC', zip: '10001' } }); -> { name: 'John', 'address.city': 'NYC', 'address.zip': '10001' }
 */
export function dot<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    prepend: string = "",
): Record<TKey, TValue> {
    return dotFlatten(data, prepend);
}

/**
 * Convert a flatten "dot" notation object into an expanded object.
 *
 * @param map - The flat object with dot-notated keys.
 * @returns A new multi-dimensional object.
 *
 * @example
 *
 * undot({ name: 'John', 'address.city': 'NYC', 'address.zip': '10001' }); -> { name: 'John', address: { city: 'NYC', zip: '10001' } }
 */
export function undot<TValue, TKey extends ObjectKey = ObjectKey>(
    map: Record<TKey, TValue>,
): Record<TKey, TValue> {
    return undotExpandObject(map);
}

/**
 * Union multiple objects into one.
 * 
 * @param objects - The objects to union.
 * @return A new object containing all key-value pairs from the input objects.
 */
export function union<TValue, TKey extends ObjectKey = ObjectKey>(
    ...objects: Record<TKey, TValue>[]
): Record<string, unknown> {
    return objects.reduce((acc, obj) => ({ ...acc, ...obj }), {});
}

/**
 * Prepend one or more items to the beginning of the object
 * 
 * @param data - The object to prepend items to
 * @param items - The items to prepend as [key, value] tuples
 * @returns A new object with the items prepended
 */
export function unshift<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    ...items: Array<[TKey, TValue]>
): Record<TKey, TValue> {
    const itemsObject: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of items) {
        itemsObject[key] = value;
    }

    return { ...itemsObject, ...data };
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
export function except<TValue extends Record<ObjectKey, unknown>>(
    data: TValue,
    keys: PathKeys,
): Record<ObjectKey, unknown> {
    return forget(data, keys);
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
export function exists<TValue extends Record<ObjectKey, unknown>>(
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
 */
export function first<TValue, TKey extends ObjectKey = ObjectKey, TFirstDefault = null>(
    data: Record<TKey, TValue>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
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

    if (data == null || !accessible(data)) {
        return resolveDefault();
    }

    const entries = Object.entries(data);

    // No callback: just return first value if it exists.
    if (!callback) {
        if (entries.length === 0) {
            return resolveDefault();
        }

        return entries[0]?.[1] as TValue;
    }

    for (const [key, value] of entries) {
        if (callback(value as TValue, key as TKey)) {
            return value as TValue;
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
 */
export function last<TValue, TKey extends ObjectKey = ObjectKey, TDefault = null>(
    data: Record<TKey, TValue>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: TDefault | (() => TDefault),
): TValue | TDefault | null {
    const resolveDefault = (): TDefault | null => {
        if (defaultValue === undefined) {
            return null;
        }

        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : (defaultValue as TDefault);
    };

    if (data == null || !accessible(data)) {
        return resolveDefault();
    }

    const entries = Object.entries(data);

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
        const [key, value] = entries[i] as [string, TValue];
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
export function take<TValue extends Record<ObjectKey, unknown>>(
    data: TValue | unknown,
    limit: number,
): Record<ObjectKey, unknown> {
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
        result[key] = value;
    }

    return result;
}

/**
 * Flatten a multi-dimensional object into a single level.
 *
 * @param data The object to flatten.
 * @param depth Maximum depth to flatten. Use Infinity for full flattening.
 * @returns A new flattened object.
 *
 * @example
 *
 * flatten({ a: 1, b: { c: 2, d: { e: 3 } } }); -> { a: 1, 'b.c': 2, 'b.d.e': 3 }
 * flatten({ a: 1, b: { c: 2, d: { e: 3 } } }, 1); -> { a: 1, 'b.c': 2, 'b.d': { e: 3 } }
 */
export function flatten<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | TValue,
    depth: number = Infinity,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const result: Record<string, unknown> = {};

    const flattenRecursive = (
        obj: Record<string, unknown>,
        currentDepth: number,
        prefix: string = "",
    ) => {
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (isObject(value) && currentDepth > 0) {
                flattenRecursive(
                    value as Record<string, unknown>,
                    currentDepth - 1,
                    newKey,
                );
            } else {
                result[newKey] = value;
            }
        }
    };

    flattenRecursive(data as Record<string, unknown>, depth);

    return result as Record<TKey, TValue>;
}

/**
 * Flip the keys and values of an object recursively
 * 
 * @param data - The object of items to flip
 * @return - the data items flipped
 *
 * @example
 * flip({one: 'b', two: {hi: 'hello', skip: 'bye'}}); -> {b: 'one', {hello: 'hi', bye: 'skip'}}
 */
export function flip<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
) {
    if (!accessible(data)) {
        return {};
    }

    // flip the object keys as values and values as keys
    // for values that are nested, the keys should be flipped recursively
    // e.g {one: 'b', two: {hi: 'hello', skip: 'bye'}} -> {b: 'one', {hello: 'hi', bye: 'skip'}}
    // if the value is an array, call arrFlip
    const result: Record<string, unknown> = {};

    const flipRecursive = (
        obj: Record<string, unknown>,
        prefix: string = "",
    ) => {
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (isObject(value)) {
                flipRecursive(value as Record<string, unknown>, newKey);
            } else if (isArray(value)) {
                result[key as string] = arrFlip(value);
            } else {
                result[value as string] = newKey;
            }
        }
    };

    flipRecursive(data as Record<string, unknown>);

    return result;
}

/**
 * Get a float item from an object using "dot" notation.
 * Throws an error if the value is not a number.
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
export function float<TValue, TKey extends ObjectKey = ObjectKey, TDefault = null>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): number {
    const value = getObjectValue(data, key, defaultValue);

    if (! isNumber(value)) {
        throw new Error(
            `Object value for key [${key}] must be a float, ${typeof value} found.`,
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
export function forget<TValue extends Record<ObjectKey, unknown>>(
    data: TValue,
    keys: PathKeys,
): Record<ObjectKey, unknown> {
    return forgetKeys<TValue>(data, keys) as Record<ObjectKey, unknown>;
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
    // Objects
    if (isObject(items)) {
        return { ...items };
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
            "WeakMap values cannot be enumerated in JavaScript; cannot convert to object.",
        );
    }

    // Arrays - convert to object with numeric keys
    if (isArray(items)) {
        const result: Record<string, unknown> = {};
        for (let i = 0; i < items.length; i++) {
            result[i] = items[i];
        }
        return result;
    }

    // Scalars not supported
    throw new Error("Items cannot be represented by a scalar value.");
}

/**
 * Get an item from an object using "dot" notation.
 *
 * @param  data - The object to get the item from.
 * @param  key - The key or dot-notated path of the item to get.
 * @param  defaultValue - The default value if key is not found
 * @returns The value or the default
 *
 * @example
 * 
 * get({ name: 'John', age: 30 }, 'name'); -> 'John'
 * get({ user: { name: 'John' } }, 'user.name'); -> 'John'
 * get({ name: 'John' }, 'email', 'default'); -> 'default'
 */
export function get<TValue, TKey extends ObjectKey = ObjectKey, TDefault = unknown>(
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

    // Handle simple key access
    if (isString(key) && !key.includes(".")) {
        const value = (object as Record<string, unknown>)[key];
        return ! isUndefined(value)
            ? (value as TDefault)
            : isFunction(defaultValue)
                ? (defaultValue as () => TDefault)()
                : defaultValue;
    }

    if (isNumber(key)) {
        const stringKey = String(key);
        const value = (object as Record<string, unknown>)[stringKey];
        return ! isUndefined(value)
            ? (value as TDefault)
            : isFunction(defaultValue)
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

        if (!(segment in current)) {
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
export function has<TValue extends Record<ObjectKey, unknown>>(
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
export function hasAll<TValue extends Record<ObjectKey, unknown>>(
    data: TValue | unknown,
    keys: PathKeys,
): boolean {
    const keyList = isArray(keys) ? keys : [keys];

    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const key of keyList) {
        if (!has(data as Record<ObjectKey, unknown>, key)) {
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
export function hasAny<TValue extends Record<ObjectKey, unknown>>(
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
        if (has(data as Record<ObjectKey, unknown>, key)) {
            return true;
        }
    }

    return false;
}

/**
 * Determine if all items pass the given truth test.
 *
 * @param  data - The object to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if all items pass the test, false otherwise.
 *
 * @example
 *
 * every({ a: 2, b: 4, c: 6 }, (n) => n % 2 === 0); -> true
 * every({ a: 1, b: 2, c: 3 }, (n) => n % 2 === 0); -> false
 */
export function every<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => boolean,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    const obj = data as Record<TKey, TValue>;
    for (const [key, value] of Object.entries(obj)) {
        if (!callback(value as TValue, key as TKey)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if some items pass the given truth test.
 *
 * @param  data - The object to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if any item passes the test, false otherwise.
 *
 * @example
 *
 * some({ a: 1, b: 2, c: 3 }, (n) => n % 2 === 0); -> true
 * some({ a: 1, b: 3, c: 5 }, (n) => n % 2 === 0); -> false
 */
export function some<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => boolean,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    const obj = data as Record<TKey, TValue>;
    for (const [key, value] of Object.entries(obj)) {
        if (callback(value as TValue, key as TKey)) {
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
export function integer<TValue, TKey extends ObjectKey = ObjectKey, TDefault = null>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): number {
    const value = getObjectValue(data, key, defaultValue);

    if (!isNumber(value)) {
        throw new Error(
            `Object value for key [${key}] must be an integer, ${typeof value} found.`,
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
export function join<TValue, TKey extends ObjectKey = ObjectKey>(
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
export function keyBy<TValue extends Record<ObjectKey, unknown>>(
    data: Record<ObjectKey, TValue> | unknown,
    keyBy: PathKey | ((item: TValue) => ObjectKey),
): Record<ObjectKey, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<ObjectKey, TValue>;
    const results: Record<ObjectKey, TValue> = {};

    for (const item of Object.values(obj)) {
        let key: ObjectKey;

        if (isFunction(keyBy)) {
            key = keyBy(item) as ObjectKey;
        } else {
            // Use dot notation to get the key value
            key = getObjectValue(item, keyBy as PathKey) as ObjectKey;
        }

        results[key] = item;
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
export function prependKeysWith<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    prependWith: string,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    for (const [key, value] of Object.entries(obj)) {
        result[(prependWith + key) as TKey] = value as TValue;
    }

    return result;
}

/**
 * Get a subset of the items from the given object.
 *
 * @param data - The object to get items from.
 * @param keys - The keys to select.
 * @returns A new object with only the specified keys.
 *
 * @example
 *
 * only({ a: 1, b: 2, c: 3, d: 4 }, ['a', 'c']); -> { a: 1, c: 3 }
 * only({ name: 'John', age: 30, city: 'NYC' }, ['name']); -> { name: 'John' }
 */
export function only<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    keys: string[],
): Record<ObjectKey, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<ObjectKey, TValue>;
    const result: Record<ObjectKey, TValue> = {};

    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key] as TValue;
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
export function select<TValue extends Record<ObjectKey, unknown>>(
    data: Record<ObjectKey, TValue> | unknown,
    keys: PathKeys,
): Record<ObjectKey, Record<ObjectKey, unknown>> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<ObjectKey, TValue>;
    const keyList = (isArray(keys) ? keys : [keys])
        .filter((key: unknown) => !isNull(key) && !isUndefined(key)) as ObjectKey[];
    const result: Record<ObjectKey, Record<ObjectKey, unknown>> = {};

    for (const [objKey, item] of Object.entries(obj)) {
        const selected: Record<ObjectKey, unknown> = {};

        for (const key of keyList) {
            if (isObject(item) && key in item) {
                selected[key] = item[key];
            }
        }

        result[objKey] = selected;
    }

    return result;
}

/**
 * Pluck an array of values from an object.
 *
 * @param data - The object to pluck from.
 * @param value - The key path to pluck, or a callback function.
 * @param key - Optional key path to use as keys in result, or callback function.
 * @returns A new array with plucked values or object with key-value pairs.
 *
 * @example
 *
 * pluck({ user1: { name: 'John' }, user2: { name: 'Jane' } }, 'name'); -> ['John', 'Jane']
 * pluck({ user1: { id: 1, name: 'John' }, user2: { id: 2, name: 'Jane' } }, 'name', 'id'); -> { 1: 'John', 2: 'Jane' }
 */
export function pluck<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    value: string | ((item: TValue) => unknown),
    key: string | ((item: TValue) => string | number) | null = null,
): unknown[] | Record<ObjectKey, unknown> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<string, TValue>;
    const results: unknown[] | Record<ObjectKey, unknown> = key ? {} : [];

    for (const [, item] of Object.entries(obj)) {
        let itemValue: unknown;
        let itemKey: string | number | undefined;

        // Get the value
        if (isFunction(value)) {
            itemValue = value(item);
        } else {
            // Use dot notation to get nested value
            itemValue = getObjectValue(item, value as PathKey);
        }

        // Get the key if specified
        if (!isNull(key) && !isUndefined(key)) {
            if (isFunction(key)) {
                itemKey = key(item) as string | number;
            } else {
                itemKey = getObjectValue(item, key as PathKey) as string | number;
            }

            // Convert objects with toString to string
            if (isStringable(itemKey)) {
                itemKey = itemKey.toString();
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
 * @param data - The object to pop items from.
 * @param count - The number of items to pop. Defaults to 1.
 * @returns The popped item(s) or null/empty array if none.
 */
export function pop<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | null | undefined,
    count: number = 1,
): TValue | TValue[] | null {
    if (data == null || !accessible(data)) {
        return count === 1 ? null : [];
    }

    const obj = data as Record<string, TValue>;
    const entries = Object.entries(obj);

    if (entries.length === 0) {
        return count === 1 ? null : [];
    }

    if (count === 1) {
        const lastEntry = entries[entries.length - 1];
        if (!lastEntry) {
            return null;
        }

        const [key, value] = lastEntry;
        delete obj[key];
        return value;
    }
    
    const poppedValues: TValue[] = [];
    const actualCount = Math.min(count, entries.length);

    for (let i = 0; i < actualCount; i++) {
        const entry = entries[entries.length - 1 - i];
        if (!entry) {
            continue;
        }
        const [key, value] = entry;
        delete obj[key];
        poppedValues.unshift(value);
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
export function map<TValue, TKey extends ObjectKey = ObjectKey, TMapValue = unknown>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => TMapValue,
): Record<TKey, TMapValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TMapValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const result: Record<ObjectKey, TMapValue> = {};

    for (const [key, value] of Object.entries(obj)) {
        result[key] = callback(value as TValue, key as TKey);
    }

    return result;
}

/**
 * Run an associative map over each of the items.
 * The callback should return an object with key/value pairs.
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
    TKey extends ObjectKey = ObjectKey,
    TMapWithKeysKey extends ObjectKey = ObjectKey,
>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => Record<TMapWithKeysKey, TMapWithKeysValue>,
): Record<TMapWithKeysKey, TMapWithKeysValue> {
    if (!accessible(data)) {
        return {} as Record<TMapWithKeysKey, TMapWithKeysValue>;
    }

    const obj = data as Record<string, TValue>;
    const result: Record<TMapWithKeysKey, TMapWithKeysValue> = {} as Record<TMapWithKeysKey, TMapWithKeysValue>;

    for (const [key, value] of Object.entries(obj)) {
        const mappedObject = callback(value, key as TKey);

        for (const [mapKey, mapValue] of Object.entries(mappedObject)) {
            result[mapKey as TMapWithKeysKey] = mapValue as TMapWithKeysValue;
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
export function mapSpread<TValue extends Record<ObjectKey, unknown>, TMapSpreadValue>(
    data: Record<ObjectKey, TValue> | unknown,
    callback: (...args: unknown[]) => TMapSpreadValue,
): Record<ObjectKey, TMapSpreadValue> {
    if (!accessible(data)) {
        return {} as Record<ObjectKey, TMapSpreadValue>;
    }

    const obj = data as Record<ObjectKey, TValue>;
    const result: Record<ObjectKey, TMapSpreadValue> = {};

    for (const [key, item] of Object.entries(obj)) {
        if (isObject(item)) {
            // Spread the object values as arguments to the callback
            const values = Object.values(item);
            result[key] = callback(...values, key);
        } else {
            // If item is not an object, pass it as single argument with key
            result[key] = callback(item, key);
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
export function prepend<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    value: TValue,
    key: TKey,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return { [key]: value } as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = { [key]: value } as Record<TKey, TValue>;

    // Add existing entries after the prepended one
    for (const [existingKey, existingValue] of Object.entries(obj)) {
        result[existingKey as TKey] = existingValue as TValue;
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
export function pull<TValue, TKey extends ObjectKey = ObjectKey, TDefault = null>(
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

                if (!isNull(value) && !isUndefined(value)) {
                    if (isObject(value)) {
                        parts.push(...buildQuery(value, key));
                    } else {
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
                    if (isObject(value)) {
                        parts.push(...buildQuery(value, key));
                    } else {
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
 * Get one or a specified number of random values from an object.
 *
 * @param data - The object to get random values from.
 * @param number - The number of items to return. If null, returns a single item.
 * @param preserveKeys - Whether to preserve the original keys when returning multiple items.
 * @returns A single random item, an object of random items, or null if object is empty.
 * @throws Error if more items are requested than available.
 *
 * @example
 *
 * random({ a: 1, b: 2, c: 3 }); -> 2 (single random value)
 * random({ a: 1, b: 2, c: 3 }, 2); -> { b: 2, c: 3 } (two random items)
 * random({ a: 1, b: 2, c: 3 }, 2, false); -> { 0: 2, 1: 3 } (without original keys)
 * random({}, 1); -> null
 * random({ a: 1, b: 2 }, 5); -> throws Error
 */
export function random<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    number?: number | null,
    preserveKeys: boolean = true,
): TValue | Record<TKey, TValue> | null {
    if (!accessible(data)) {
        return isNull(number) || isUndefined(number) ? null : {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const entries = Object.entries(obj);
    const count = entries.length;
    const requested = isNull(number) || isUndefined(number) ? 1 : number;

    if (count === 0 || requested <= 0) {
        return isNull(number) || isUndefined(number) ? null : {} as Record<TKey, TValue>;
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
        const [, value] = entries[selectedIndices[0] as number] as [TKey, TValue];
        return value;
    }

    // Return multiple items
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    for (let i = 0; i < selectedIndices.length; i++) {
        const entryIndex = selectedIndices[i] as number;
        const [key, value] = entries[entryIndex] as [TKey, TValue];

        if (preserveKeys) {
            result[key] = value;
        } else {
            result[i as TKey] = value;
        }
    }

    return result;
}

/**
 * Get and remove the first N items from the object
 * 
 * @param data - The object to shift items from.
 * @param count - The number of items to shift. Defaults to 1.
 * @returns The shifted item(s) or null/empty array if none.
 */
export function shift<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    count: number = 1,
): TValue | TValue[] | null {
    if (!accessible(data)) {
        return count === 1 ? null : [];
    }

    const obj = data as Record<string, TValue>;
    const entries = Object.entries(obj);

    if (entries.length === 0) {
        return count === 1 ? null : [];
    }

    if (count === 1) {
        const firstEntry = entries[0];
        if (!firstEntry) {
            return null;
        }

        const [key, value] = firstEntry;
        delete obj[key];
        return value;
    }
    
    const shiftedValues: TValue[] = [];
    const actualCount = Math.min(count, entries.length);

    for (let i = 0; i < actualCount; i++) {
        const entry = entries[i];
        if (!entry) {
            continue;
        }
        const [key, value] = entry;
        delete obj[key];
        shiftedValues.push(value);
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
export function set<T extends Record<string, unknown>>(
    object: T | unknown,
    key: PathKey | null,
    value: unknown,
): Record<string, unknown> {
    return setObjectValue(object, key, value);
}

/**
 * Push one or more items into an object at a nested path using dot notation.
 *
 * @param data - The object to push items into.
 * @param key - The key or dot-notated path of the array to push into. If null, not supported for objects.
 * @param values - The values to push.
 * @returns A new object with the values pushed in.
 *
 * @example
 *
 * push({ items: ['a', 'b'] }, 'items', 'c', 'd'); -> { items: ['a', 'b', 'c', 'd'] }
 * push({ user: { tags: ['js'] } }, 'user.tags', 'ts', 'php'); -> { user: { tags: ['js', 'ts', 'php'] } }
 */
export function push<T>(
    data: Record<string, unknown> | unknown,
    key: PathKey,
    ...values: T[]
): Record<string, unknown> {
    if (!accessible(data)) {
        if (key == null) {
            throw new Error("Cannot push to root of non-object data");
        }
        return setObjectValue({}, key, values);
    }

    if (key == null) {
        throw new Error(
            "Cannot push to root of object without specifying a key",
        );
    }

    const obj = data as Record<string, unknown>;
    const existingValue = getObjectValue(obj, key);

    if (isArray(existingValue)) {
        const newArray = [...existingValue, ...values];
        return setObjectValue(obj, key, newArray);
    } else if (existingValue === null) {
        // Create new array if path doesn't exist
        return setObjectValue(obj, key, [...values]);
    } else {
        throw new Error(`Cannot push to non-array value at key [${key}]`);
    }
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
export function shuffle<T>(
    data: Record<string, T> | unknown,
): Record<string, T> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<string, T>;
    const entries = Object.entries(obj);

    // Fisher-Yates shuffle algorithm
    for (let i = entries.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [entries[i], entries[j]] = [
            entries[j] as [string, T],
            entries[i] as [string, T],
        ];
    }

    const result: Record<string, T> = {};
    for (const [key, value] of entries) {
        result[key] = value;
    }

    return result;
}

/**
 * Slice the underlying object items
 * 
 * @param data - The object to slice
 * @param offset - The starting index
 * @param length - The number of items to include
 * @returns Sliced object
 */
export function slice<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    offset: number,
    length: number | null = null,
){
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<string, TValue>;
    const entries = Object.entries(obj);

    const slicedEntries = length === null
        ? entries.slice(offset)
        : entries.slice(offset, offset + length);

    const result: Record<string, TValue> = {};

    for (const [key, value] of slicedEntries) {
        result[key] = value;
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
export function sole<TValue, TKey extends ObjectKey = ObjectKey>(
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
            if (callback(value, key)) {
                filteredEntries.push([key, value]);
            }
        }
    } else {
        // Use all entries
        filteredEntries = entries;
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
 * Sort the object using the given callback or "dot" notation.
 *
 * @param data - The object to sort.
 * @param callback - The sorting callback, field name, or null for natural sorting.
 * @returns A new object with sorted entries.
 *
 * @example
 *
 * sort({ c: 3, a: 1, b: 4, d: 1, e: 5 }); -> { a: 1, d: 1, c: 3, b: 4, e: 5 } (sorted by values)
 * sort({ user1: { name: 'John', age: 25 }, user2: { name: 'Jane', age: 30 } }, 'age'); -> sorted by age
 * sort({ user1: { name: 'John', age: 25 }, user2: { name: 'Jane', age: 30 } }, (item) => item.name); -> sorted by name
 */
export function sort<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    callback: ((a: TValue, b: TValue) => unknown) | string | null = null,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const entries = Object.entries(obj);

    if (isFalsy(callback)) {
        // Natural sorting by values
        entries.sort(([, a], [, b]) => {
            const aValue = a as TValue;
            const bValue = b as TValue;

            if (isFalsy(aValue) && isFalsy(bValue)) {
                return 0;
            }

            if (isFalsy(aValue)) {
                return -1;
            }

            if (isFalsy(bValue)) {
                return 1;
            }

            // Safe comparison for comparable types
            if (aValue < bValue) {
                return -1;
            }

            if (aValue > bValue) {
                return 1;
            }

            return 0;
        });
    }

    if (isString(callback)) {
        // Sort by field name using dot notation
        entries.sort(([, a], [, b]) => {
            const aValue = getObjectValue(
                a as Record<string, unknown>,
                callback,
            );
            const bValue = getObjectValue(
                b as Record<string, unknown>,
                callback,
            );

            if (isFalsy(aValue) && isFalsy(bValue)) {
                return 0;
            }

            if (isFalsy(aValue)) {
                return -1;
            }

            if (isFalsy(bValue)) {
                return 1;
            }

            // Safe comparison for any comparable types
            const aComparable = aValue as string | number | boolean;
            const bComparable = bValue as string | number | boolean;

            if (aComparable < bComparable) {
                return -1;
            }

            if (aComparable > bComparable) {
                return 1;
            }

            return 0;
        });
    }

    if (isFunction(callback)) {
        // Sort by callback result
        entries.sort(([, a], [, b]) => {
            const aValue = callback(a as TValue);
            const bValue = callback(b as TValue);

            if (isNull(aValue) && isNull(bValue)) {
                return 0;
            }

            if (isNull(aValue)) {
                return -1;
            }

            if (isNull(bValue)) {
                return 1;
            }

            // Safe comparison for any comparable types
            const aComparable = aValue as string | number | boolean;
            const bComparable = bValue as string | number | boolean;

            if (aComparable < bComparable) {
                return -1;
            }

            if (aComparable > bComparable) {
                return 1;
            }

            return 0;
        });
    }

    const result: Record<string, TValue> = {};
    for (const [key, value] of entries) {
        result[key] = value as TValue;
    }

    return result as Record<TKey, TValue>;
}

/**
 * Sort the object in descending order using the given callback or "dot" notation.
 *
 * @param data - The object to sort.
 * @param callback - The sorting callback, field name, or null for natural sorting.
 * @returns A new object with sorted entries in descending order.
 *
 * @example
 *
 * sortDesc({ c: 3, a: 1, b: 4, d: 1, e: 5 }); -> { e: 5, b: 4, c: 3, a: 1, d: 1 } (sorted by values desc)
 * sortDesc({ user1: { name: 'John', age: 25 }, user2: { name: 'Jane', age: 30 } }, 'age'); -> sorted by age desc
 * sortDesc({ user1: { name: 'John', age: 25 }, user2: { name: 'Jane', age: 30 } }, (item) => item.name); -> sorted by name desc
 */
export function sortDesc<T>(
    data: Record<string, T> | unknown,
    callback?: ((item: T) => unknown) | string | null,
): Record<string, T> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<string, T>;
    const entries = Object.entries(obj);

    if (!callback) {
        // Natural sorting by values in descending order
        entries.sort(([, a], [, b]) => {
            if (a > b) {
                return -1;
            }

            if (a < b) {
                return 1;
            }

            return 0;
        });
    }

    if (typeof callback === "string") {
        // Sort by field name using dot notation in descending order
        entries.sort(([, a], [, b]) => {
            const aValue = getObjectValue(
                a as Record<string, unknown>,
                callback,
            );
            const bValue = getObjectValue(
                b as Record<string, unknown>,
                callback,
            );

            if (aValue == null && bValue == null) {
                return 0;
            }

            if (aValue == null) {
                return 1;
            }

            if (bValue == null) {
                return -1;
            }

            // Safe comparison for any comparable types
            const aComparable = aValue as string | number | boolean;
            const bComparable = bValue as string | number | boolean;

            if (aComparable > bComparable) {
                return -1;
            }

            if (aComparable < bComparable) {
                return 1;
            }

            return 0;
        });
    } else if (typeof callback === "function") {
        // Sort by callback result in descending order
        entries.sort(([, a], [, b]) => {
            const aValue = callback(a);
            const bValue = callback(b);

            if (aValue == null && bValue == null) {
                return 0;
            }

            if (aValue == null) {
                return 1;
            }

            if (bValue == null) {
                return -1;
            }

            // Safe comparison for any comparable types
            const aComparable = aValue as string | number | boolean;
            const bComparable = bValue as string | number | boolean;

            if (aComparable > bComparable) {
                return -1;
            }

            if (aComparable < bComparable) {
                return 1;
            }

            return 0;
        });
    }

    const result: Record<string, T> = {};
    for (const [key, value] of entries) {
        result[key] = value;
    }

    return result;
}

/**
 * Recursively sort an object by keys and values.
 *
 * @param data - The object to sort recursively.
 * @param options - Sort options (currently unused, for PHP compatibility).
 * @param descending - Whether to sort in descending order.
 * @returns A new recursively sorted object.
 *
 * @example
 *
 * sortRecursive({ b: { d: 2, c: 1 }, a: { f: 4, e: 3 } }); -> { a: { e: 3, f: 4 }, b: { c: 1, d: 2 } }
 * sortRecursive({ user1: { name: 'john', age: 30 }, user2: { name: 'jane', age: 25 } }); -> sorted objects with sorted keys
 */
export function sortRecursive<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    options?: number,
    descending: boolean = false,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<TKey, TValue>;
    const entries = Object.entries(obj);

    // Recursively sort nested objects first
    const processedEntries: [TKey, TValue][] = [];
    for (const [key, value] of entries) {
        if (isObject(value)) {
            processedEntries.push([
                key,
                sortRecursive(value, options, descending) as TValue,
            ]);
        } else if (isArray(value)) {
            // For arrays, sort them if they contain sortable items
            const sortedArray = [...value].sort((a, b) => {
                if (descending) {
                    if (a > b) return -1;
                    if (a < b) return 1;
                    return 0;
                } else {
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                }
            });
            processedEntries.push([key, sortedArray as T]);
        } else {
            processedEntries.push([key, value]);
        }
    }

    // Sort object keys
    processedEntries.sort(([keyA], [keyB]) => {
        if (descending) {
            if (keyA > keyB) return -1;
            if (keyA < keyB) return 1;
            return 0;
        } else {
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        }
    });

    // Rebuild object with sorted keys
    const result: Record<string, TValue> = {};
    for (const [key, value] of processedEntries) {
        result[key] = value;
    }

    return result;
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
export function sortRecursiveDesc<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    options?: number,
): Record<TKey, TValue> {
    return sortRecursive(data, options, true);
}

/**
 * Splice a portion of the underlying object
 * 
 * @param data - The object to splice
 * @param offset - The starting index
 * @param length - The number of items to remove
 * @param replacement - The replacement object
 * @returns Spliced object
 */
export function splice<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    offset: number,
    length: number = 0,
    replacement: Record<TKey, TValue> = {} as Record<TKey, TValue>,
){
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<string, TValue>;
    const entries = Object.entries(obj);

    const beforeEntries = entries.slice(0, offset);
    const afterEntries = length > 0
        ? entries.slice(offset + length)
        : entries.slice(offset);

    const replacementEntries = Object.entries(replacement);

    const splicedEntries = [
        ...beforeEntries,
        ...replacementEntries,
        ...afterEntries,
    ];

    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of splicedEntries) {
        result[key as TKey] = value as TValue;
    }

    return result as Record<TKey, TValue>;
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
export function string<D = null>(
    data: Record<string, unknown> | unknown,
    key: PathKey,
    defaultValue: D | (() => D) | null = null,
): string {
    const value = getObjectValue(data, key, defaultValue);

    if (typeof value !== "string") {
        throw new Error(
            `Object value for key [${key}] must be a string, ${typeof value} found.`,
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
 */
export function toCssClasses(data: Record<string, unknown> | unknown): string {
    if (!accessible(data)) {
        return "";
    }

    const obj = data as Record<string, unknown>;
    const classes: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        // Use key as class name if value is truthy
        if (value) {
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
 */
export function toCssStyles(data: Record<string, unknown> | unknown): string {
    if (!accessible(data)) {
        return "";
    }

    const obj = data as Record<string, unknown>;
    const styles: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        // Use key as style if value is truthy
        if (value) {
            const style = Str.finish(key, ";");
            styles.push(style);
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
export function where<TValue, TKey extends ObjectKey = ObjectKey>(
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
            result[key as TKey] = value as TValue;
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
export function reject<T>(
    data: Record<string, T> | unknown,
    callback: (value: T, key: string) => boolean,
): Record<string, T> {
    return where(data, (value, key) => !callback(value, key));
}

/**
 * Replace the data items with the given replacer items.
 * 
 * @param data - The original object to replace items in.
 * @param replacerData - The object containing items to replace.
 * @returns The modified original object with replaced items.
 */
export function replace<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    replacerData: Record<TKey, TValue>,
){
    for (const [key, value] of Object.entries(replacerData)) {
        data[key as TKey] = value as TValue;
    }

    return data;
}

/**
 * Recursively replace the data items with the given items.
 *
 * @param data - The original object to replace items in.
 * @param replacerData - The object containing items to replace.
 * @returns The modified original object with replaced items.
 */
export function replaceRecursive<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    replacerData: Record<TKey, TValue>,
){
    for (const [key, value] of Object.entries(replacerData)) {
        if (isObject(value) && isObject(data[key as TKey])) {
            data[key as TKey] = replaceRecursive(
                data[key as TKey] as Record<TKey, TValue>,
                value as Record<TKey, TValue>,
            ) as TValue;
        } else if (isArray(value) && isArray(data[key as TKey])) {
            data[key as TKey] = arrReplaceRecursive(
                data[key as TKey] as TValue[],
                value as TValue[],
            ) as TValue;
        } else {
            data[key as TKey] = value as TValue;
        }
    }

    return data;
}

/**
 * Reverse the order of the object's entries.
 * 
 * @param data - The object to reverse.
 * @returns A new object with reversed entries.
 * 
 * @example
 * 
 * reverse({ a: 1, b: 2, c: 3 }); -> { c: 3, b: 2, a: 1 }
 * reverse({ name: 'John', age: 30, city: 'NYC' }); -> { city: 'NYC', age: 30, name: 'John' }
 */
export function reverse<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const entries = Object.entries(obj);

    // Reverse the entries array
    entries.reverse();

    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    for (const [key, value] of entries) {
        result[key as TKey] = value as TValue;
    }

    return result;
}

/**
 * Pad object to the specified length with a value.
 * 
 * @param data - The object to pad.
 * @param size - The desired size of the object after padding. Positive to pad at the end, negative to pad at the beginning.
 * @param value - The value to use for padding.
 * @returns A new padded object.
 */
export function pad<TPadValue, TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
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
        return data as Record<TKey, TValue | TPadValue>;
    }

    const padCount = Math.abs(size) - currentLength;
    const padEntries: [string, TPadValue][] = [];

    for (let i = 0; i < padCount; i++) {
        padEntries.push([i.toString(), value]);
    }

    let resultEntries: [string, TValue | TPadValue][];
    if (size > 0) {
        resultEntries = [...entries, ...padEntries];
    } else {
        resultEntries = [...padEntries, ...entries];
    }

    const result: Record<string, TValue | TPadValue> = {};
    for (const [key, val] of resultEntries) {
        result[key] = val;
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
export function partition<TValue, TKey extends ObjectKey = ObjectKey>(
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
            passed[key as TKey] = value as TValue;
        } else {
            failed[key as TKey] = value as TValue;
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
export function whereNotNull<T>(
    data: Record<string, T | null> | unknown,
): Record<string, T> {
    return where(
        data as Record<string, T | null>,
        (value): value is T => value !== null,
    );
}

/**
 * Determine if an object contains a given value.
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
export function contains<T extends Record<string, unknown>>(
    data: T | unknown,
    value: T | ((value: T, key: string | number) => boolean),
    strict = false,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    if (isFunction(value)) {
        const obj = data as Record<string, unknown>;
        for (const [key, val] of Object.entries(obj)) {
            if (value(val as T, key)) {
                return true;
            }
        }
        return false;
    }

    if (strict) {
        return Object.values(data as Record<string, unknown>).includes(value);
    }

    const obj = data as Record<string, unknown>;
    for (const val of Object.values(obj)) {
        if (val == value) {
            return true;
        }
    }

    return false;
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
 * filter({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2); -> { c: 3, d: 4 }
 * filter({ name: 'John', age: null, city: 'NYC' }, (value) => value !== null); -> { name: 'John', city: 'NYC' }
 */
export function filter<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue> | unknown,
    callback?: (value: TValue, key: TKey) => boolean | null,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj)) {
        // If no callback, filter out falsy values
        const shouldInclude = isFunction(callback) ? callback(value, key) : Boolean(value);

        if (shouldInclude) {
            result[key] = value;
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
export function wrap<T>(value: T | null): Record<string | number, T> {
    if (value === null) {
        return {};
    }

    return isObject<T>(value) ? (value as Record<string, T>) : { 0: value };
}

/**
 * Get all keys from an object.
 *
 * @param data - The object to get keys from.
 * @returns An array of all keys.
 *
 * @example
 *
 * keys({ name: 'John', age: 30, city: 'NYC' }); -> ['name', 'age', 'city']
 * keys({}); -> []
 */
export function keys<T extends Record<string, unknown>>(
    data: T | unknown,
): string[] {
    if (!accessible(data)) {
        return [];
    }
    return Object.keys(data as T);
}

/**
 * Get all values from an object.
 *
 * @param data - The object to get values from.
 * @returns An array of all values.
 *
 * @example
 *
 * values({ name: 'John', age: 30, city: 'NYC' }); -> ['John', 30, 'NYC']
 * values({}); -> []
 */
export function values<T extends Record<string, unknown>>(
    data: T | unknown,
): unknown[] {
    if (!accessible(data)) {
        return [];
    }
    return Object.values(data as T);
}

/**
 * Get the items that are not present in the given object.
 *
 * @param data - The original object.
 * @param other - The object to compare against.
 * @returns A new object containing items from data that are not in other.
 *
 * @example
 *
 * diff({ a: 1, b: 2, c: 3 }, { b: 2, d: 4 }); -> { a: 1, c: 3 }
 * diff({ name: 'John', age: 30 }, { age: 30, city: 'NYC' }); -> { name: 'John' }
 */
export function diff<T extends Record<string, unknown>>(
    data: T | unknown,
    other: T | unknown,
): Record<string, unknown> {
    if (!accessible(data)) {
        return {};
    }

    if (!accessible(other)) {
        return { ...(data as Record<string, unknown>) };
    }

    const obj = data as Record<string, unknown>;
    const otherObj = other as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (!(key in otherObj) || otherObj[key] !== value) {
            result[key] = value;
        }
    }

    return result;
}

/**
 * Intersect the data object with the given other object
 * 
 * @param data - The original object
 * @param other - The object to intersect with
 * @param callable - Optional function to compare values
 * @returns A new object containing items present in both objects
 */
export function intersect<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    other: Record<TKey, TValue>,
    callable: ((a: TValue, b: TValue) => boolean) | null = null,
) {
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(data)) {
        if (key in other) {
            const otherValue = other[key as TKey];

            const isEqual = isFunction(callable)
                ? callable(value as TValue, otherValue)
                : value === otherValue;

            if (isEqual) {
                result[key as TKey] = value as TValue;
            }
        }
    }

    return result;
}

/**
 * Intersect the object with the given items by key.
 * 
 * @param data - The original object
 * @param other - The object to intersect with
 * @returns A new object containing items with keys present in both objects
 */
export function intersectByKeys<TValue, TKey extends ObjectKey = ObjectKey>(
    data: Record<TKey, TValue>,
    other: Record<TKey, TValue>,
) {
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(data)) {
        if (key in other) {
            result[key as TKey] = value as TValue;
        }
    }

    return result;
}