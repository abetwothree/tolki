import { replaceRecursive as arrReplaceRecursive } from "@tolki/arr";
import { SortDirection } from "@tolki/enum";
import {
    dotFlatten,
    forgetKeys,
    getNestedValue,
    getObjectValue,
    hasMixed,
    hasObjectKey,
    setObjectValue,
    undotExpandObject,
} from "@tolki/path";
import { finish, randomInt } from "@tolki/str";
import type { CaseValue, PathKey, PathKeys, SortSpec } from "@tolki/types";
import {
    compareValues,
    defineKey,
    isArray,
    isBoolean,
    isFalsy,
    isFunction,
    isInteger,
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
    typeOf,
} from "@tolki/utils";

/**
 * Mutation contract (decided 2026-08-25, Phase 1 Task 1)
 *
 * Laravel's Collection splits cleanly: a method either ends in
 * array_pop/array_shift/array_splice/array_unshift on $this->items and
 * MUTATES, or ends in $this->newInstance(...) and does NOT.
 *
 * This package follows that split exactly. pop, shift, splice and unshift
 * mutate their first argument. replace, replaceRecursive, filter, slice,
 * chunk, reverse, union, combine, diff* and intersect* do not.
 *
 * @tolki/arr and @tolki/obj agree on this. Do not "align" one to the other
 * without re-reading Collection.php.
 */

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
            `Object value for key [${key}] must be a boolean, ${typeOf(value)} found.`,
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
            Object.assign(out, item);
        }
    }

    return out;
}

/**
 * Combine two objects into one, using the values from the first object as
 * keys, mirroring PHP's `array_combine()` / `Collection::combine()`
 * (`Collection.php:935`).
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
    // Plain String() coercion, not `isFunction(k) ? String(k()) :
    // String(k)` — review fix (Minor 6): this used to call a
    // function-typed key to resolve it, diverging from arr.combine's
    // plain String(). Neither matches PHP (no function-typed array keys),
    // so both packages now agree on plain String().
    const keys = Object.values(keysObject).map((k) => String(k));
    const values = Object.values(valuesObject);

    if (maxLength !== values.length) {
        throw new Error(
            "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
        );
    }

    const result: Record<PropertyKey, TCombineValue> = {};

    for (let i = 0; i < maxLength; i++) {
        const key = keys[i];
        // Key is always defined because we iterate up to keys.length
        // but TypeScript needs the guard for type narrowing
        /* istanbul ignore if -- @preserve TypeScript narrowing */
        if (!isUndefined(key)) {
            // Writes go through `defineKey` rather than plain assignment so
            // a `__proto__` key resolved from `keysObject` becomes a real
            // own key instead of reparenting `result` through the
            // `__proto__` setter (see `splice`'s doc comment and
            // `AGENTS.md`'s prototype-pollution guidance).
            defineKey(
                result as Record<string, TCombineValue>,
                key,
                values[i] as TCombineValue,
            );
        }
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
 * Decision D3: a nested container whose own keys are the consecutive
 * integer sequence `0..n-1` is rebuilt as a real array, not left as a
 * `{0: ..., 1: ...}` object. This mirrors PHP: `Arr::undot` walks each
 * dotted key through `Arr::set`, which auto-vivifies plain PHP arrays as it
 * descends, and a PHP array whose keys happen to be `0..n-1` in that order
 * is exactly what `array_is_list` (and therefore `json_encode`) renders as
 * a JSON array rather than an object. PHP-verified: running `Arr::set`'s
 * algorithm over
 * `["user.languages.0"=>"PHP","user.languages.1"=>"C#","user.name"=>"Taylor"]`
 * yields `{"user":{"languages":["PHP","C#"],"name":"Taylor"}}`
 * (docs/php-parity/task-09-paths.json, "Arr::undot — integer segments
 * rebuild a list"). The root of the result always stays a plain object,
 * matching this function's `Record` return type, even when its own
 * top-level keys happen to be `0..n-1` — see `undotExpandObject` in
 * `@tolki/path`, where the promotion logic (`promoteConsecutiveIntegerContainers`)
 * actually lives.
 *
 * **Correction (Task 9 review, Important 2):** an earlier version of this
 * JSDoc claimed `Arr.undot` "shares this exact rule with" `Obj.undot`. It
 * does not, and cannot: `Arr.undot`'s `undotExpandArray` only ever builds
 * arrays, so a mixed key like `"user.languages.0"` (string-first segment)
 * silently discarded the entire input rather than falling back to an
 * object. `Arr.undot`'s parameter type is now constrained to
 * `UndotArrayKey` so that shape of input no longer compiles at all — use
 * `Obj.undot` for it, as this JSDoc's own example does.
 *
 * **Caveat (JS vs. PHP array key order):** `array_is_list` in PHP is
 * insertion-order-sensitive — `['1'=>'x','0'=>'y']` (key `1` inserted
 * before key `0`) is *not* a list, since iterating it visits `1` before
 * `0`. JS objects do not preserve that: `Object.keys` always enumerates
 * integer-like keys in ascending numeric order regardless of insertion
 * order. So `Obj.undot({"a.1":"x","a.0":"y"})` promotes to
 * `{a: ["y", "x"]}` (list, keys read back out in `0,1` order) where real
 * PHP's `Arr::undot` on the equivalent input gives
 * `{"a":{"1":"x","0":"y"}}` (not a list — insertion order was `1` then
 * `0`). This is a genuine, unrepresentable-in-JS divergence from PHP for
 * out-of-order numeric insertion, not a bug: JS has no ordinary object
 * shape that preserves "these look like array indices, but were inserted
 * out of order" the way a PHP array can.
 *
 * @param map - The flat object with dot-notated keys.
 * @returns A new multi-dimensional object.
 *
 * @example
 *
 * undot({ name: 'John', 'address.city': 'NYC', 'address.zip': '10001' }); -> { name: 'John', address: { city: 'NYC', zip: '10001' } }
 * undot({ 'user.languages.0': 'PHP', 'user.languages.1': 'C#', 'user.name': 'Taylor' }); -> { user: { languages: ['PHP', 'C#'], name: 'Taylor' } }
 */
export function undot<TValue, TKey extends PropertyKey = PropertyKey>(
    map: Record<TKey, TValue>,
): Record<TKey, TValue> {
    return undotExpandObject(map) as Record<TKey, TValue>;
}

/**
 * Union multiple objects into one.
 *
 * Mirrors PHP's `+` array union operator (`["a"=>null] + ["a"=>1]` ->
 * `["a"=>null]`, PHP-verified in docs/php-parity/task-07-pad-union.json):
 * the left-most object to already hold a key wins that key's value
 * unconditionally, even when that value is `null` or `undefined`. The
 * guard is therefore presence (`Object.hasOwn`), not truthiness/definedness
 * of the existing value — the same fix as `unshift`'s equivalent
 * prototype-chain guard above.
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
                        acc[key as TKey] = value as TValue;
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
 * Prepended items that are themselves object-accessible are merged in by
 * their own keys. A non-object, non-nullish item (e.g. a bare number or
 * string) is assigned the next available non-negative integer key instead
 * of being dropped, matching array_unshift's "prepend a scalar, it gets
 * key 0 (or the next free integer key)" behaviour. `null`/`undefined`
 * items are skipped, matching this package's existing "undefined items
 * are skipped" convention.
 *
 * @param items - The items to prepend. The first item is the target
 * object, mutated in place when it is itself object-accessible.
 * @returns The same object reference, mutated (or a new object when the
 * first item is not object-accessible, since there is nothing to mutate).
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
                itemsObject[key as TKey] = value as TValue;
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

    Object.assign(data, itemsObject);

    for (const [key, value] of originalEntries) {
        if (!Object.hasOwn(itemsObject, key)) {
            data[key as TKey] = value as TValue;
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
            result[key] = value;
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
        result[key] = value;
    }

    return result;
}

/**
 * Flatten a multi-dimensional object into a single-level array.
 *
 * This mirrors Laravel's Arr::flatten behavior but for objects: it iterates over
 * the values, recursively flattening nested arrays and objects into a single
 * array of values, discarding keys.
 *
 * @param data - The object (or value) to flatten.
 * @param depth - Maximum depth to flatten. Defaults to Infinity (full flattening),
 * matching Arr.php's `Arr::flatten` default (Arr.php:368).
 * @returns A new flattened array of values.
 *
 * @example
 *
 * flatten({ a: [1, 2], b: [3, 4] }); -> [1, 2, 3, 4]
 * flatten({ a: 1, b: { c: 2, d: { e: 3 } } }); -> [1, 2, 3]
 * flatten({ a: { b: { c: { d: 1 } } } }); -> [1]
 * flatten({ a: [1, [2, 3]], b: [4] }, 1); -> [1, [2, 3], 4]
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
            } else if (currentDepth <= 1) {
                // At boundary depth, push the immediate items themselves
                // (objects or arrays) without descending further.
                result.push(item);
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
 * Creates dot-notation keys up to the specified depth, with values being the
 * nodes at that depth boundary.
 *
 * @param data - The object to flatten.
 * @param depth - Maximum depth for dot-notation keys.
 * @returns A flat object with dot-notated keys.
 *
 * @example
 *
 * flattenDot({ users: { john: { name: 'John' } } }, 1); -> { 'users.john': { name: 'John' } }
 * flattenDot({ a: { b: { c: 1 } } }, 2); -> { 'a.b.c': 1 }
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
                out[pathParts.join(".")] = node as unknown;
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
            `Object value for key [${key}] must be a float, ${typeOf(value)} found.`,
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
            out[String(k)] = v;
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
 * Mirrors `Arr::get`, which calls `Arr::exists` **before** splitting the
 * key on "." (`Arr.php:497`) — a literal key wins over path traversal even
 * when it contains dots (PHP-verified: docs/php-parity/task-09-paths.json,
 * "Arr::get — literal dotted key wins"). `Arr::exists` is a *presence*
 * check (`array_key_exists`, not `isset`), so a literal key whose value is
 * `undefined` still counts as found and does not fall through to dot-path
 * traversal — it resolves through this function's existing "found but
 * undefined -> default" convention instead, keeping `get` and `has` in
 * agreement about which key is found (Task 9 review, Important 3).
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
 * get({ "products.desk": { price: 100 } }, 'products.desk'); -> { price: 100 } (literal key wins over traversal)
 * get({ "a.b": undefined, a: { b: 2 } }, 'a.b', 'default'); -> 'default' (literal "a.b" is found but undefined; does not fall through to a.b traversal)
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

    // The literal key wins even when it contains dots. Presence -- not
    // definedness -- decides: a literal key whose stored value is
    // `undefined` is still "found" (via `in`, matching `has`'s check) and
    // falls straight to the "found but undefined -> default" convention
    // below, rather than falling through to dot-path traversal. Before
    // this fix, `get({"a.b": undefined, a: {b: 2}}, "a.b")` returned `2`
    // (it fell through and traversed "a" -> "b") while `has` on the same
    // input correctly said the literal key existed -- the two disagreed
    // (Task 9 review, Important 3).
    const keyStr = String(key);
    if (keyStr in (object as Record<string, unknown>)) {
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
            `Object value for key [${key}] must be an integer, ${typeOf(value)} found.`,
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
        result[(prependWith + key) as TKey] = value as TValue;
    }

    return result;
}

/**
 * Get a subset of the items from the given object.
 *
 * Mirrors PHP's `(array) $keys` cast in `Arr::only` (Arr.php:744): `null`
 * becomes no keys at all, and a bare string becomes a single-key selection,
 * rather than being iterated character by character.
 *
 * @param data - The object to get items from.
 * @param keys - The key, keys, or null to select.
 * @returns A new object with only the specified keys.
 *
 * @example
 *
 * only({ a: 1, b: 2, c: 3, d: 4 }, ['a', 'c']); -> { a: 1, c: 3 }
 * only({ name: 'John', age: 30, city: 'NYC' }, ['name']); -> { name: 'John' }
 * only({ foo: 1, bar: 'baz' }, 'bar'); -> { bar: 'baz' }
 * only({ a: 1 }, null); -> {}
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
        if (key in obj) {
            result[key] = obj[key] as TValue;
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
            result[key] = value;
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
            if (isObject(item) && key in item) {
                selected[key] = item[key];
            }
        }

        result[objKey] = selected;
    }

    return result;
}

/**
 * Get the values a pluck wildcard segment iterates over, mirroring
 * `data_get()`'s `is_iterable()` check (`helpers.php:90-94`): a PHP
 * `foreach` walks both arrays and (associative) objects, so both a JS
 * array and a plain object count here. This is intentionally broader than
 * `@tolki/arr`'s `getAccessibleValues` (used by `resolvePluckPath` in
 * arr.ts), which only expands actual JS arrays — a wildcard whose target
 * is a plain object silently resolves to `[]` there. `data_get` doesn't
 * distinguish; neither does this.
 *
 * @param target - The value a `*` segment is expanding.
 * @returns The values to recurse into, or `[]` for a non-iterable target.
 */
function getPluckWildcardValues(target: unknown): unknown[] {
    if (isArray(target)) {
        return target;
    }

    if (isObject(target)) {
        return Object.values(target);
    }

    return [];
}

/**
 * Resolve a pluck path against a single item, expanding `*` segments into an
 * array of the values found at that level. Ports arr.ts's `resolvePluckPath`
 * (same two documented divergences from `data_get()` apply here):
 *
 * - a wildcard over a non-iterable yields `[]` (via
 *   {@linkcode getPluckWildcardValues}) where `data_get` bails out with its
 *   default (`null`);
 * - multiple wildcards nest (`[[..], [..]]`) where `data_get` collapses the
 *   tail one level (`Arr::collapse`).
 *
 * @param item - The item to resolve the path against.
 * @param segments - The already-split path segments.
 * @returns The resolved value, an array of values for a wildcard, or null.
 */
function resolvePluckPath(item: unknown, segments: readonly string[]): unknown {
    if (segments.length === 0) {
        return item;
    }

    const [segment, ...rest] = segments;

    if (segment === "*") {
        const values = getPluckWildcardValues(item);

        return values.map((value) => resolvePluckPath(value, rest));
    }

    if (isNull(item) || isUndefined(item)) {
        return null;
    }

    const next = getNestedValue(item, segment as string);

    if (isUndefined(next)) {
        return null;
    }

    return resolvePluckPath(next, rest);
}

/**
 * Split a pluck value or key argument into path segments the way Laravel's
 * `explodePluckParameters` does: strings split on dots, arrays pass
 * through, and `null` (the "keep the whole item" value form) yields no
 * segments at all so {@linkcode resolvePluckPath} returns the item itself —
 * `data_get($item, null)` short-circuits to `$target` before ever touching
 * a segment loop, and zero segments has the same effect here.
 *
 * @param path - The path to split.
 * @returns The path segments.
 */
function explodePluckPath(path: string | readonly string[] | null): string[] {
    if (isNull(path)) {
        return [];
    }

    if (isArray(path)) {
        return [...path];
    }

    return String(path).split(".");
}

/**
 * Pluck an array of values from an object.
 *
 * @param data - The object to pluck from.
 * @param value - The key path to pluck (a dot-notated string, an array of
 *   segments, or a path containing a `*` wildcard segment), a callback
 *   function, or `null` to keep each whole item as the value.
 * @param key - Optional key path (string, array of segments, or callback)
 *   to use as keys in the result.
 * @returns A new array with plucked values or object with key-value pairs.
 *
 * @example
 *
 * pluck({ user1: { name: 'John' }, user2: { name: 'Jane' } }, 'name'); -> ['John', 'Jane']
 * pluck({ user1: { id: 1, name: 'John' }, user2: { id: 2, name: 'Jane' } }, 'name', 'id'); -> { 1: 'John', 2: 'Jane' }
 * pluck({ a: { developer: { name: 'Taylor' } } }, ['developer', 'name']); -> ['Taylor']
 * pluck({ a: { account: 'a', users: [{ first: 'taylor' }] } }, 'users.*.first'); -> [['taylor']]
 * pluck({ a: { name: 'Taylor', role: 'dev' } }, null, 'name'); -> { Taylor: { name: 'Taylor', role: 'dev' } }
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
                    // PHP-verified: docs/php-parity/task-10-pluck-sort.json,
                    // "Arr::pluck — boolean key casts to int, not string".
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
            (results as Record<string | number, unknown>)[
                isUndefined(itemKey) ? "" : itemKey
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
        const lastEntry = entries[entries.length - 1];

        /* istanbul ignore if -- @preserve TypeScript narrowing for strict null checks */
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

        /* istanbul ignore if -- @preserve TypeScript narrowing for strict null checks */
        if (!entry) {
            continue;
        }

        const [key, value] = entry;
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
        result[key] = callback(value as TValue, key as TKey);
    }

    return result;
}

/**
 * Run an associative map over each of the items.
 * The callback should return an object with key/value pairs.
 *
 * Always returns a plain object, even when every mapped key is
 * numeric-like. `Arr::mapWithKeys` (Arr.php:880) builds a single PHP array
 * — there is no `Map` type in PHP, and PHP arrays preserve insertion order
 * for both int and string keys, so there is nothing for a `Map` to buy here.
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
            result[key as PropertyKey] = callback(...values, key);
        } else {
            // If item is not an object, pass it as single argument with key
            result[key as PropertyKey] = callback(item, key);
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
 * @param preserveKeys - Whether to preserve the original keys when returning multiple items.
 * Defaults to `false`, matching `Arr::random`'s `$preserveKeys = false` default (Arr.php:971).
 * @returns A single random item, an object of random items, or null if object is empty.
 * @throws Error if more items are requested than available — including against an
 * empty object, since `Arr.php:977` checks `$requested > $count` above the empty guard.
 *
 * @example
 *
 * random({ a: 1, b: 2, c: 3 }); -> 2 (single random value)
 * random({ a: 1, b: 2, c: 3 }, 2); -> { 0: 2, 1: 3 } (two random items, reindexed)
 * random({ a: 1, b: 2, c: 3 }, 2, true); -> { b: 2, c: 3 } (with original keys)
 * random({}, 0); -> {}
 * random({}, 1); -> throws Error
 * random({ a: 1, b: 2 }, 5); -> throws Error
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

    // Reaching this point with `number` null/undefined would mean
    // requested === 1 survived the throw guard above, which requires
    // count >= 1 — so `number` is always explicitly provided here, and
    // Arr.php:983's empty-or-non-positive short-circuit always yields [].
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
            result[key] = value;
        } else {
            result[i as TKey] = value;
        }
    }

    return result;
}

/**
 * Get and remove the first N items from the object, mutating it in place,
 * like PHP's array_shift.
 *
 * Guard order matters and is PHP-verified against Collection::shift():
 * negative count throws, an empty object returns null for any count, a
 * count of zero returns an empty array, then items are shifted off.
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

    if (count === 1) {
        const firstEntry = entries[0];
        /* istanbul ignore if -- @preserve TypeScript narrowing for strict null checks */
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
        /* istanbul ignore if -- @preserve TypeScript narrowing for strict null checks */
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
 * @param key - The key or dot-notated path of the array to push into. If null, not supported for objects.
 * @param values - The values to push.
 * @returns A new object with the values pushed in.
 *
 * @example
 *
 * push({ items: ['a', 'b'] }, 'items', 'c', 'd'); -> { items: ['a', 'b', 'c', 'd'] }
 * push({ user: { tags: ['js'] } }, 'user.tags', 'ts', 'php'); -> { user: { tags: ['js', 'ts', 'php'] } }
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

    if (isNull(key)) {
        throw new Error(
            "Cannot push to root of object without specifying a key (key is null)",
        );
    }

    const obj = data as Record<TKey, TValue>;
    const existingValue = getObjectValue(obj, key);

    if (isArray(existingValue)) {
        const newArray = [...existingValue, ...values];
        return setObjectValue(obj, key, newArray) as Record<TKey, TValue>;
    } else if (isNull(existingValue)) {
        // Create new array if path doesn't exist
        return setObjectValue(obj, key, [...values]) as Record<TKey, TValue>;
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
        result[key as TKey] = value as TValue;
    }

    return result;
}

/**
 * Slice the underlying object items, preserving keys — `array_slice($items,
 * $offset, $length, true)` (`Collection.php:1371`).
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

    // Normalise a negative offset against the entry count BEFORE combining
    // it with length. The old code fed a raw negative offset straight into
    // `Array.prototype.slice(offset, length)`, so `slice(data, -2, 5)`
    // became `entries.slice(-2, 5)` and returned `{}` instead of the last
    // two entries — PHP-verified in docs/php-parity/task-04-shared.json.
    const start = offset < 0 ? Math.max(entries.length + offset, 0) : offset;
    const end = isNull(length)
        ? undefined
        : length >= 0
          ? start + length
          : entries.length + length;

    const slicedEntries = entries.slice(start, end);

    const result: Record<string, TValue> = {};

    for (const [key, value] of slicedEntries) {
        // Writes go through `defineKey` rather than plain assignment so a
        // `__proto__` entry becomes a real own key instead of reparenting
        // `result` through the `__proto__` setter (see `splice`'s doc
        // comment and `AGENTS.md`'s prototype-pollution guidance).
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
 * Build a comparator from a single sort descriptor, using the shared
 * {@linkcode SortSpec} type (`@tolki/types`) rather than a package-local
 * fork of it - review round 1, Important 5: `obj` previously declared its
 * own `ObjSortSpec` with a `[key]` single-element tuple arm that
 * `@tolki/arr`'s exported `SortSpec` lacked, so `obj` consumers could name
 * a descriptor type `arr` consumers couldn't, and `arr.ts`'s
 * `sortSpecComparator` had its own, separately-fixed copy of the same
 * omitted-direction bug (see that function's JSDoc). `SortSpec` now
 * carries the `[key]` arm for both packages, and both comparator
 * functions independently implement the ascending default it documents.
 *
 * See {@linkcode SortSpec}'s JSDoc for why a 1-element tuple (and a bare
 * key path) must default to ascending.
 *
 * `forceDescending` mirrors `Collection::sortByDesc` (`Collection.php`
 * lines 1683-1693): for a key path or tuple it overrides the direction to
 * descending regardless of what was specified, but it has no effect on a
 * comparator function, which always runs exactly as authored.
 *
 * @param spec - The key path, `[key]`/`[key, direction]` tuple, or comparator.
 * @param forceDescending - When true, key paths and tuples ignore their own direction and sort descending; comparator functions are unaffected.
 * @returns A comparator for the descriptor.
 */
function objSortSpecComparator<TValue>(
    spec: SortSpec<TValue>,
    forceDescending: boolean,
): (a: TValue, b: TValue) => number {
    if (isFunction(spec)) {
        return spec as (a: TValue, b: TValue) => number;
    }

    if (isArray(spec)) {
        const [key, direction] = spec as readonly [
            string,
            (boolean | "Ascending" | "Descending" | "asc" | "desc")?,
        ];
        // Collection::sortByMany's match-arm, with the 1-element-tuple fix
        // documented on SortSpec: a missing direction defaults to `true`
        // (ascending) via Arr::get($comparison, 1, true); `true`, `'asc'`,
        // and Ascending sort ascending; everything else sorts descending.
        const isAscending =
            isUndefined(direction) ||
            direction === true ||
            direction === "asc" ||
            direction === SortDirection.Ascending;
        const isDescending = forceDescending || !isAscending;

        return (a, b) => {
            const comparison = compareValues(
                getNestedValue(a as Record<string, unknown>, key),
                getNestedValue(b as Record<string, unknown>, key),
            );

            return isDescending ? -comparison : comparison;
        };
    }

    return (a, b) => {
        const comparison = compareValues(
            getNestedValue(a as Record<string, unknown>, spec as string),
            getNestedValue(b as Record<string, unknown>, spec as string),
        );

        return forceDescending ? -comparison : comparison;
    };
}

/**
 * Sort the object using the given callback, "dot" notation, or an array of
 * sort descriptors for multi-key sorting.
 *
 * @param data - The object to sort.
 * @param callback - The sorting callback, field name, an array of sort descriptors, or null for natural sorting.
 * @returns A new object with sorted entries.
 *
 * @example
 *
 * sort({ c: 3, a: 1, b: 4, d: 1, e: 5 }); -> { a: 1, d: 1, c: 3, b: 4, e: 5 } (sorted by values)
 * sort({ user1: { name: 'John', age: 25 }, user2: { name: 'Jane', age: 30 } }, 'age'); -> sorted by age
 * sort({ user1: { name: 'John', age: 25 }, user2: { name: 'Jane', age: 30 } }, (item) => item.name); -> sorted by name
 * sort({ a: { name: 'Item', age: 10 }, b: { name: 'Item', age: 2 } }, ['name', ['age', false]]); -> sorted by name asc, then age desc
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
    const entries = Object.entries(obj);

    if (isArray(callback)) {
        // Multi-key sorting - mirrors Collection::sortByMany; each
        // descriptor keeps its own direction (Collection.php:1638-1640).
        const comparators = (callback as readonly SortSpec<TValue>[]).map(
            (spec) => objSortSpecComparator<TValue>(spec, false),
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
    }

    // Review round 1, Important 3: `isFalsy([])` is true (an empty array
    // is PHP-falsy), so without the `!isArray` guard an empty descriptor
    // array fell into BOTH branches - the isArray branch above correctly
    // left `entries` untouched (zero comparators, stable no-op), then this
    // branch immediately re-sorted it by raw value, corrupting the no-op.
    // Collection::sortByMany([]) is a true no-op in PHP (uasort's
    // comparator closure has an empty foreach body, so it falls off the
    // end and implicitly returns null, coerced to 0 for every pair) - not
    // "sort naturally by value". PHP-verified:
    // docs/php-parity/task-10-pluck-sort.json, "Arr::sort — empty
    // descriptor array preserves insertion order" (same principle; arr and
    // obj share it).
    if (isFalsy(callback) && !isArray(callback)) {
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
        // Extract sort values using callback, then sort by those values
        const indexed = entries.map(([key, value]) => ({
            key,
            value,
            sortKey: callback(value as TValue, key as TKey),
        }));

        indexed.sort((a, b) => compareValues(a.sortKey, b.sortKey));

        const result: Record<string, TValue> = {};
        for (const item of indexed) {
            result[item.key] = item.value as TValue;
        }

        return result as Record<TKey, TValue>;
    }

    const result: Record<string, TValue> = {};
    for (const [key, value] of entries) {
        result[key] = value as TValue;
    }

    return result as Record<TKey, TValue>;
}

/**
 * Sort the object in descending order using the given callback, "dot"
 * notation, or an array of sort descriptors for multi-key sorting.
 *
 * TODO: use the sort function with a "descending" parameter defined
 *
 * @param data - The object to sort.
 * @param callback - The value extractor callback, field name, an array of sort descriptors, or null for natural sorting.
 * @returns A new object with sorted entries in descending order.
 *
 * @example
 *
 * sortDesc({ c: 3, a: 1, b: 4, d: 1, e: 5 }); -> { e: 5, b: 4, c: 3, a: 1, d: 1 } (sorted by values desc)
 * sortDesc({ user1: { name: 'John', age: 25 }, user2: { name: 'Jane', age: 30 } }, 'age'); -> sorted by age desc
 * sortDesc({ user1: { name: 'John', age: 25 }, user2: { name: 'Jane', age: 30 } }, (item) => item.name); -> sorted by name desc
 * sortDesc({ a: { name: 'Item', age: 10 }, b: { name: 'Item', age: 2 } }, ['name', ['age', false]]); -> each descriptor's comparison is reversed
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
    const entries = Object.entries(obj);

    if (isArray(callback)) {
        // Multi-key sorting - mirrors Collection::sortByDesc: every
        // descriptor's own direction is overridden to descending (a
        // comparator function is unaffected - see objSortSpecComparator).
        const comparators = (callback as readonly SortSpec<TValue>[]).map(
            (spec) => objSortSpecComparator<TValue>(spec, true),
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
    }

    if (isUndefined(callback) || isNull(callback)) {
        // Natural sorting by values in descending order
        entries.sort(([, a], [, b]) => compareValues(b, a));
    }

    if (isString(callback)) {
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

            return compareValues(bValue, aValue);
        });
    }

    if (isFunction(callback)) {
        // Extract sort values using callback, then sort by those values in descending order
        const indexed = entries.map(([key, value]) => ({
            key,
            value,
            sortKey: callback(value as TValue, key as TKey),
        }));

        indexed.sort((a, b) => compareValues(b.sortKey, a.sortKey));

        const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
        for (const item of indexed) {
            result[item.key as TKey] = item.value as TValue;
        }

        return result;
    }

    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    for (const [key, value] of entries) {
        result[key as TKey] = value as TValue;
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
        result[key] = value;
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
 * Whether `key` is a canonical non-negative integer string ("0", "1",
 * "23", but not "01", "-1", "1.5"). This is both the class of key the JS
 * engine itself always sorts ahead of string keys (in ascending numeric
 * order, regardless of insertion order) and the class of key PHP treats
 * as an integer array key — the one `array_splice` renumbers. String keys
 * are left untouched by both.
 */
function isIntegerLikeKey(key: string): boolean {
    return /^(0|[1-9]\d*)$/.test(key);
}

/**
 * Renumber the integer-like keys in `entries` to a fresh 0-based sequence,
 * in the order they appear in `entries`; string keys pass through
 * unchanged. Mirrors `array_splice`'s "keys in input are not preserved for
 * numeric keys" rule, applied independently to the remainder and to the
 * removed portion (each starts its own count at 0), matching the
 * `array_splice([10=>a,20=>b,30=>c], 1, 1)` probe: remaining `["a","c"]`,
 * cut `["b"]` — both reindexed from 0, not from the original keys.
 */
function reindexIntegerKeys<TValue>(
    entries: [string, TValue][],
): [string, TValue][] {
    let nextIndex = 0;

    return entries.map(([key, value]) => {
        if (isIntegerLikeKey(key)) {
            return [String(nextIndex++), value] as [string, TValue];
        }

        return [key, value] as [string, TValue];
    });
}

/**
 * Splice a portion of the underlying object, mutating it in place, like
 * PHP's array_splice.
 *
 * String keys keep the exact key they had before the splice, on both the
 * remainder and the removed portion — PHP-verified:
 * `array_splice(["x"=>1,"y"=>2,"z"=>3], 1, 1)` leaves `{"x":1,"z":3}` and
 * returns `{"y":2}`. Integer-like keys reindex from 0 instead, same as
 * `arr.splice` (whose backing `array_splice` never preserves numeric
 * keys) — PHP-verified: `array_splice([10=>a,20=>b,30=>c], 1, 1)` leaves
 * `["a","c"]` (keys 0,1) and returns `["b"]` (key 0).
 *
 * Writes go through `defineKey` rather than plain assignment so a
 * `__proto__` entry — whether already present in `data` or introduced by
 * a replacement object — becomes a real own key instead of reparenting
 * the target through the `__proto__` setter (see `AGENTS.md`'s
 * prototype-pollution guidance, and `replace`/`replaceRecursive` below
 * for the same pattern applied to a non-mutating rebuild).
 *
 * @param data - The object to splice. Mutated in place.
 * @param offset - The starting index, by entry order (not by key)
 * @param length - The number of entries to remove. Defaults to everything
 * from offset to the end.
 * @param replacement - Object(s) whose own entries are spliced in at offset
 * @returns The removed entries, keyed the same way they were in `data`.
 *
 * @example
 *
 * splice({ x: 1, y: 2, z: 3 }, 1, 1); -> { y: 2 }, data is now { x: 1, z: 3 }
 * splice({ foo: 'f', baz: 'z' }, 1); -> { baz: 'z' }, data is now { foo: 'f' }
 * splice({ 10: 'a', 20: 'b', 30: 'c' }, 1, 1); -> { 0: 'b' }, data is now { 0: 'a', 1: 'c' }
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
    // Negative length clamping to "no removal" is JS Array.prototype.splice
    // semantics, not PHP's — array_splice's negative length counts that
    // many elements back from the end instead. This is a pre-existing,
    // deliberate divergence (unchanged by this fix; no probe backs
    // negative-length parity), kept rather than guessed at.
    const deleteCount = isUndefined(length)
        ? len - start
        : Math.max(0, Math.min(length, len - start));

    const beforeEntries = entries.slice(0, start);
    const removedEntries = entries.slice(start, start + deleteCount);
    const afterEntries = entries.slice(start + deleteCount);

    // Prepare replacement entries
    const replacementEntries: [string, TValue][] = [];
    for (const repObj of replacement) {
        for (const [key, value] of Object.entries(
            repObj as Record<string, TValue>,
        )) {
            replacementEntries.push([key, value as TValue]);
        }
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
            `Object value for key [${key}] must be a string, ${typeOf(value)} found.`,
        );
    }

    return value;
}

/**
 * Cast a CSS-list value the way PHP casts it when pushed raw into
 * `implode()`/`Str::finish()` at a numeric key in `toCssClasses`/
 * `toCssStyles` (Arr.php:1215/1238): `null` becomes `""` (implode's
 * silent cast; `Str::finish` also settles on `""` for it despite a
 * PHP 8.1+ deprecation notice on the internal `preg_replace` call, which
 * is non-fatal and does not change the return value), a boolean becomes
 * `"1"`/`""`, and everything else goes through `String()`. Verified
 * against docs/php-parity/task-08-arr-parity.json ("Arr::toCssClasses/
 * toCssStyles non-string value at numeric key").
 */
function cssListItemToString(value: unknown): string {
    if (isNull(value) || isUndefined(value)) {
        return "";
    }

    if (isBoolean(value)) {
        return value ? "1" : "";
    }

    return String(value);
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
        // Numeric-like keys (Arr.php:1214's is_numeric($class)) push the
        // VALUE as the class name; other keys push the key when truthy.
        // isPhpNumeric, not Number()/isNaN: hex, "", " ", and "Infinity"
        // all parse under Number() but aren't PHP-numeric.
        if (isPhpNumeric(key)) {
            // Numeric key: push the value as-is (PHP-cast), like PHP
            // pushing $constraint straight into the array before implode().
            classes.push(cssListItemToString(value));
        } else if (value) {
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
        // Numeric-like keys (Arr.php:1237's is_numeric($class)) push the
        // VALUE as the style; other keys push the key when truthy.
        // isPhpNumeric, not Number()/isNaN: hex, "", " ", and "Infinity"
        // all parse under Number() but aren't PHP-numeric.
        if (isPhpNumeric(key)) {
            // Numeric key: push the value as-is (PHP-cast, then finished),
            // like PHP's Str::finish($constraint, ';').
            styles.push(finish(cssListItemToString(value), ";"));
        } else if (value) {
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
 * `Collection.php:1172` ends in `$this->newInstance(array_replace(...))`,
 * so this builds and returns a new object rather than writing into `data`
 * — matching this package's mutation contract (see the block comment near
 * the top of this file: `replace`/`replaceRecursive` are in the "does not
 * mutate" half of the split, alongside `filter`, `slice`, `combine`, etc.).
 *
 * A `null`/`undefined` replacer is a no-op: PHP's `getArrayableItems(null)`
 * returns `[]` (`EnumeratesValues.php:1106`), pinned by
 * `CollectionTest.php:1482`, so `data`'s values come back unchanged (in a
 * new object, still never the original reference).
 *
 * Writes go through `defineKey` rather than plain assignment so a
 * `__proto__` key on `replacerData` becomes a real own key on the result
 * instead of reparenting it through the `__proto__` setter (see `splice`'s
 * doc comment and `AGENTS.md`'s prototype-pollution guidance).
 *
 * `accessible()` gates `replacerData` the same way it gates `null`, and
 * `accessible()` excludes arrays — so an array forced past the type
 * surface (e.g. `as unknown as Record<PropertyKey, T2>`) is a deliberate
 * no-op here too, not a merge by numeric index the way
 * `array_replace(['a' => 1], ['x'])` (-> `['a' => 1, 0 => 'x']`) would
 * behave in PHP. This is intentionally out of scope: the declared type
 * surface never accepts an array for `replacerData`, and `@tolki/data`'s
 * `dataReplace` only calls this once both sides are already object-shaped.
 *
 * @param data - The original object to replace items in. Never mutated.
 * @param replacerData - The object containing items to replace. `null`/`undefined` is a no-op.
 * @returns A new object with the replaced items.
 *
 * @example
 *
 * replace({ a: 1 }, { b: 2 }); -> { a: 1, b: 2 }
 * replace({ a: 1, b: 2, c: 3 }, null); -> { a: 1, b: 2, c: 3 }
 */
export function replace<T1>(
    data: Record<PropertyKey, T1>,
    replacerData: null | undefined,
): Record<PropertyKey, T1>;
export function replace<T1, T2>(
    data: Record<PropertyKey, T1>,
    replacerData: Record<PropertyKey, T2>,
): Record<PropertyKey, T1 | T2>;
// A caller holding a `Record<PropertyKey, T2> | null` — the realistic
// shape of "a replacer that might be absent", and exactly the case X11
// exists for — matches neither overload above on its own: TypeScript
// resolves an overloaded call against the *declared* overload signatures
// only, never the implementation signature below, so such a call fails
// with TS2769 without this third, still-concrete overload. This is the
// mirror image of the `X | unknown` collapse that has bitten this branch
// before: over-narrow overloads instead of an over-wide `unknown`
// catch-all, but the same net effect of rejecting a valid caller.
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
 * `Collection.php:1183` ends in the same `$this->newInstance(...)` pattern
 * as `replace` above, so this builds and returns a new object at every
 * level of the recursion rather than writing into `data` or any nested
 * object — a shallow top-level copy alone would not be enough, since the
 * old code's mutation happened one recursion level down. Because the
 * recursive calls are themselves pure, an untouched nested value is simply
 * carried over **by reference**, not copied — nothing writes through it
 * during this call, but that is not PHP's per-array value-copy semantics:
 * a JS array/object is aliased, so a caller who later mutates
 * `result.untouchedKey` mutates the same value reachable from `data`.
 * PHP's arrays copy on write and would not show that mutation at all.
 *
 * A `null`/`undefined` replacer is a no-op, for the same reason as
 * `replace` above (`EnumeratesValues.php:1106`, `CollectionTest.php:1524`).
 *
 * `isUnsafeKey` would skip `__proto__`/`constructor`/`prototype` keys on
 * `replacerData` uniformly, but only `__proto__` is actually hazardous —
 * it is the sole key with an inherited accessor setter on
 * `Object.prototype` that can reparent an object on plain assignment;
 * `constructor` and `prototype` are ordinary writable data properties, and
 * dropping them would silently discard legitimate replacer data with no
 * PHP array key ever behaving that way. So only `__proto__` is skipped
 * here — entirely, rather than written via `defineKey` the way `replace`
 * and `splice` write it — a deliberate JS-only divergence with **no PHP
 * counterpart** (PHP arrays have no accessor-key hazard for
 * `array_replace_recursive` to guard against). `constructor` and
 * `prototype` fall through to the same `defineKey` write as every other
 * key below.
 *
 * @param data - The original object to replace items in. Never mutated.
 * @param replacerData - The object containing items to replace. `null`/`undefined` is a no-op.
 * @returns A new, recursively merged object.
 *
 * @example
 *
 * replaceRecursive({ a: { x: 1 } }, { a: { y: 2 } }); -> { a: { x: 1, y: 2 } }
 * replaceRecursive({ a: 1 }, null); -> { a: 1 }
 */
export function replaceRecursive<T1>(
    data: Record<PropertyKey, T1>,
    replacerData: null | undefined,
): Record<PropertyKey, T1>;
export function replaceRecursive<T1, T2>(
    data: Record<PropertyKey, T1>,
    replacerData: Record<PropertyKey, T2>,
): Record<PropertyKey, T1 | T2>;
// See the matching overload on `replace` above for why this third,
// concrete overload is required rather than relying on the implementation
// signature below (TS2769 otherwise, for any caller holding
// `Record<PropertyKey, T2> | null`).
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
 * Not a bug: JS spec-orders integer-like own keys ascending, ahead of
 * string keys, regardless of insertion order (ECMA-262
 * OrdinaryOwnPropertyKeys). `reverse({0: 'a', 1: 'b'})` therefore still
 * iterates `0, 1` — the reversed insertion order is lost the moment those
 * keys are written back onto a plain object. PHP's array preserves
 * positional/insertion order for integer keys, a guarantee a plain JS
 * object cannot reproduce. Do not re-file this as a bug.
 *
 * @param data - The object to reverse.
 * @returns A new object with reversed entries.
 *
 * @example
 *
 * reverse({ a: 1, b: 2, c: 3 }); -> { c: 3, b: 2, a: 1 }
 * reverse({ name: 'John', age: 30, city: 'NYC' }); -> { city: 'NYC', age: 30, name: 'John' }
 */
export function reverse<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
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
 * Mirrors PHP's `array_pad()` (Collection.php:1906, PHP-verified in
 * docs/php-parity/task-07-pad-union.json): pad slots are numbered `0,
 * 1, 2, ...` regardless of direction — a negative `size` does NOT number
 * them backwards from `-1`. For `pad({a:1,b:2}, -5, 0)` PHP's real result
 * is `{0:0, 1:0, 2:0, a:1, b:2}`, not `{-2:0, -1:0, 0:0, a:1, b:2}`.
 *
 * Not a bug: for a *positive* `size`, this is a genuine, unfixable
 * divergence from PHP. PHP appends the padding after the original keys
 * (`array_pad(['a'=>1,'b'=>2], 4, 0)` -> `{a:1, b:2, 0:0, 1:0}`, verified
 * in docs/php-parity/task-07-pad-union.json), but JS spec-orders
 * integer-like own keys ascending, ahead of string keys, regardless of
 * insertion order (ECMA-262 OrdinaryOwnPropertyKeys) — so the appended
 * `0, 1, ...` pad keys iterate *before* `a, b` here, not after. A plain
 * JS object cannot reproduce PHP's append-at-the-end positional guarantee
 * for integer keys. (For a *negative* `size` there is no divergence: PHP
 * already places the padding first positionally, and JS's key-hoisting
 * lands the same keys in the same place.) Do not re-file this as a bug.
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
            // Writes go through `defineKey` rather than plain assignment so
            // a `__proto__` key in `data` becomes a real own key instead of
            // reparenting `result` through the `__proto__` setter (see
            // `splice`'s doc comment and `AGENTS.md`'s prototype-pollution
            // guidance).
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
 * Uses `Object.keys()` — own ENUMERABLE string keys only — so its result
 * always has the same length as `values()`'s (which uses `Object.values()`,
 * the same enumerable-own-string-keys walk). They used to disagree:
 * `keys()` walked `Reflect.ownKeys()` (every own key, enumerable or not,
 * symbols included before filtering) while `values()` walked
 * `Object.values()` (enumerable only), so an object with a non-enumerable
 * own property produced a `keys()`/`values()` length mismatch and desynced
 * `combine(keys(o), values(o))`. One consequence of aligning them: symbol
 * keys are omitted, same as before, but now because `Object.keys()` never
 * returns them rather than via an explicit filter — there is no PHP array
 * concept for a symbol key to port.
 *
 * @param data - The object to get keys from.
 * @returns An array of all keys.
 *
 * @example
 *
 * keys({ name: 'John', age: 30, city: 'NYC' }); -> ['name', 'age', 'city']
 * keys({}); -> []
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
 * Mirrors PHP's `array_diff()` (what Laravel's `Collection::diff()` calls
 * under the hood): comparison is by VALUE only, and the left operand's keys
 * are kept regardless of what key (if any) held a matching value on
 * `other`. This is deliberately NOT `array_diff_assoc` — a key that exists
 * on `other` with a *different* value does not save the item; only whether
 * the value itself appears somewhere in `other`'s values matters. See
 * `diffAssocUsing`/`diffKeysUsing` above for the assoc-style (key-aware)
 * variants that still exist in this port.
 *
 * A non-accessible `other` (e.g. `null`) is treated the same way PHP's
 * `EnumeratesValues::getArrayableItems()` treats `null` — as an empty
 * array — so every item of `data` is kept unchanged.
 *
 * @param data - The original object.
 * @param other - The object to compare against.
 * @returns A new object containing items from data whose value is not present in other.
 *
 * @example
 *
 * diff({ a: 1, b: 2, c: 3 }, { b: 2, d: 4 }); -> { a: 1, c: 3 }
 * diff({ id: 1, first_word: 'Hello' }, { x: 'Hello' }); -> { id: 1 } (value-only: 'first_word' drops even though 'x' !== 'first_word')
 * diff({ id: 1 }, null); -> { id: 1 } (non-accessible other is treated as empty)
 */
// Overload: typed — data and other's key sets are independent (TOtherKey),
// so a differently-shaped `other` (e.g. { x: 'Hello' } against a data of
// { id, first_word }) doesn't fail to unify. `other` may be null/undefined
// (X14: already treated as empty before this fix; kept here so a
// legitimately-typed nullable argument still matches this overload instead
// of falling through to the unknown fallback below).
export function diff<
    TValue,
    TKey extends PropertyKey = PropertyKey,
    TOtherKey extends PropertyKey = PropertyKey,
>(
    data: Record<TKey, TValue>,
    other: Record<TOtherKey, TValue> | null | undefined,
): Record<TKey, TValue>;
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

    if (!accessible(other)) {
        return { ...(data as Record<TKey, TValue>) };
    }

    const obj = data as Record<TKey, TValue>;
    const otherValues = Object.values(other as Record<TOtherKey, TValue>);
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
        if (!otherValues.includes(value)) {
            result[key] = value;
        }
    }

    return result;
}

/**
 * Diff the data object with the given other object using a callback for key comparison.
 * Compares keys using the callback and values using strict equality.
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
        if (matchingKey === undefined || otherObj[matchingKey] !== value) {
            result[key] = value;
        }
    }

    return result;
}

/**
 * Diff the data object with the given other object using a callback for key comparison only.
 * Compares keys using the callback and ignores values completely.
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
            result[key] = value;
        }
    }

    return result;
}

/**
 * Intersect the data object with the given other object.
 *
 * Mirrors PHP's `array_intersect()` (what Laravel's `Collection::intersect()`
 * calls under the hood): comparison is by VALUE only, and the left
 * operand's keys are kept for every value that also appears somewhere in
 * `other`'s values — `key in other` is NOT required. This is deliberately
 * NOT `array_intersect_assoc`; see `intersectAssoc`/`intersectAssocUsing`
 * below for the assoc-style (key-aware) variants.
 *
 * `callable`, when given, replaces strict equality with a custom value
 * comparator and is checked against every value of `other` (not just the
 * one under the same key) — this approximates PHP's `array_uintersect()`.
 * Laravel exposes this as a separate `intersectUsing()` method on
 * `Collection`; this port folds it into `intersect`'s optional third
 * parameter instead of adding a standalone `intersectUsing` at this layer
 * (the `@tolki/collection` package's `intersectUsing()` forwards here).
 *
 * A non-accessible `other` (e.g. `null`) is treated as empty, matching how
 * PHP's `EnumeratesValues::getArrayableItems()` treats `null`, so the
 * result is `{}`.
 *
 * @param data - The original object
 * @param other - The object to intersect with
 * @param callable - Optional function to compare values (array_uintersect-style)
 * @returns A new object containing data's items whose value is also present in other
 *
 * @example
 *
 * intersect({ id: 1, first_word: 'Hello' }, { first_world: 'Hello', last_word: 'World' }); -> { first_word: 'Hello' } (keys differ, value matches)
 * intersect({ id: 1 }, null); -> {} (non-accessible other is treated as empty)
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

    if (!accessible(other)) {
        return result;
    }

    const otherValues = Object.values(other as Record<PropertyKey, T2>);

    for (const [key, value] of Object.entries(
        data as Record<PropertyKey, T1>,
    )) {
        const matches = isFunction(callable)
            ? otherValues.some((otherValue) =>
                  callable(value as T1, otherValue as T2),
              )
            : otherValues.some(
                  (otherValue) =>
                      (otherValue as unknown) === (value as unknown),
              );

        if (matches) {
            result[key] = value as T1;
        }
    }

    return result;
}

/**
 * Intersect the object with the given items with additional key check.
 * Returns items where both the key AND value match.
 *
 * This is `array_intersect_assoc` — unlike `intersect` above, `key in other`
 * IS required. Do not merge this back into `intersect`; the two must stay
 * distinct (see `intersect`'s doc comment).
 *
 * A non-accessible `other` (e.g. `null`) is treated as empty, so the result
 * is `{}`.
 *
 * @param data - The original object
 * @param other - The object to intersect with
 * @returns A new object containing items where both key and value match
 *
 * @example
 *
 * intersectAssoc({a: 'green', b: 'brown', c: 'blue'}, {a: 'green', b: 'yellow', c: 'blue'}); -> {a: 'green', c: 'blue'}
 * intersectAssoc({a: 1, b: 2}, {a: 1, c: 3}); -> {a: 1}
 * intersectAssoc({a: 1}, null); -> {}
 */
export function intersectAssoc<T1, T2 = T1>(
    data: Record<PropertyKey, T1>,
    other: Record<PropertyKey, T2> | null | undefined,
): Record<PropertyKey, T1> {
    const result: Record<PropertyKey, T1> = {};

    if (!accessible(other)) {
        return result;
    }

    const otherObj = other as Record<PropertyKey, T2>;

    for (const [key, value] of Object.entries(data)) {
        if (
            key in otherObj &&
            (value as unknown) === (otherObj[key as PropertyKey] as unknown)
        ) {
            result[key] = value as T1;
        }
    }

    return result;
}

/**
 * Intersect the object with the given items with additional key check, using the callback.
 * The callback is used to compare keys, while values are compared strictly.
 *
 * A non-accessible `other` (e.g. `null`) is treated as empty, so the result
 * is `{}`.
 *
 * @param data - The original object
 * @param other - The object to intersect with
 * @param callback - The callback function to compare keys (returns true if keys match)
 * @returns A new object containing items where both key (via callback) and value match
 *
 * @example
 *
 * const strcasecmpKeys = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
 * intersectAssocUsing({a: 'green', b: 'brown'}, {A: 'GREEN', B: 'brown'}, strcasecmpKeys); -> {b: 'brown'}
 * intersectAssocUsing({a: 'green'}, null, strcasecmpKeys); -> {}
 */
export function intersectAssocUsing<T1, T2 = T1>(
    data: Record<PropertyKey, T1>,
    other: Record<PropertyKey, T2> | null | undefined,
    callback: (keyA: PropertyKey, keyB: PropertyKey) => boolean,
): Record<PropertyKey, T1> {
    const result: Record<PropertyKey, T1> = {};

    if (!accessible(other)) {
        return result;
    }

    for (const [dataKey, dataValue] of Object.entries(data)) {
        for (const [otherKey, otherValue] of Object.entries(other)) {
            if (
                callback(dataKey, otherKey) &&
                (dataValue as unknown) === (otherValue as unknown)
            ) {
                result[dataKey] = dataValue as T1;
                break; // Only add once per dataKey
            }
        }
    }

    return result;
}

/**
 * Intersect the object with the given items by key.
 *
 * A non-accessible `other` (e.g. `null`) is treated as empty, so the result
 * is `{}`.
 *
 * @param data - The original object
 * @param other - The object to intersect with
 * @returns A new object containing items with keys present in both objects
 *
 * @example
 *
 * intersectByKeys({a: 1, b: 2}, {a: 20, c: 30}); -> {a: 1}
 * intersectByKeys({name: 'M'}, null); -> {}
 */
export function intersectByKeys<T1, T2 = T1>(
    data: Record<PropertyKey, T1>,
    other: Record<PropertyKey, T2> | null | undefined,
): Record<PropertyKey, T1> {
    const result: Record<PropertyKey, T1> = {};

    if (!accessible(other)) {
        return result;
    }

    const otherObj = other as Record<PropertyKey, T2>;

    for (const [key, value] of Object.entries(data)) {
        if (key in otherObj) {
            result[key] = value as T1;
        }
    }

    return result;
}
