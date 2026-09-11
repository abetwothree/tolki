import { SortDirection } from "@tolki/enum";
import {
    dotFlatten,
    explodePluckPath,
    forgetKeys,
    getNestedValue,
    getObjectValue,
    hasMixed,
    resolvePluckPath,
    setObjectValue,
    undotExpandObject,
} from "@tolki/path";
import { finish, randomInt } from "@tolki/str";
import type {
    ArrayableItems,
    CaseValue,
    DeepMergeObjects,
    EnsureObject,
    FlipObject,
    NonNullableObject,
    NonObjectItems,
    ObjectDeepPartial,
    ObjectFlatValue,
    ObjectKey,
    ObjectPathValue,
    ObjectResolvePath,
    ObjectValue,
    OmitObjectPath,
    OmitObjectPaths,
    PathKey,
    PathKeys,
    PluckValue,
    PrefixKeys,
    ReindexedObject,
    RenumberedObject,
    SetObjectPath,
    Simplify,
    SortSpec,
    SpreadItems,
    SpreadObjects,
    TruthyObject,
    UndotObjectValue,
} from "@tolki/types";
import {
    arrayableItems,
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
    isIterable,
    isMap,
    isNull,
    isNumber,
    isObject,
    isPhpArrayKey,
    isPhpFalsy,
    isPhpNumeric,
    isPlainObject,
    isPrototypeObject,
    isSet,
    isString,
    isStringable,
    isSymbol,
    isUndefined,
    isWeakMap,
    isWeakSet,
    looseEqual,
    phpArrayKey,
    phpTypeName,
    phpValueMatch,
    phpValueMatcher,
    reindexIntegerKeys,
    resolveSliceRange,
    strictEqual,
    toPhpKeyString,
} from "@tolki/utils";

// ObjectWriteResult (set, add, push): a widened path key can't walk SetObjectPath literally, so
// it falls back to a loose record. ObjectPullRest is pull's Omit/OmitObjectPath counterpart;
// ArrayElementOf unwraps push's existing array element type for its appended-value union.
type ObjectWriteResult<T, P, V> = string extends P
    ? Record<string, unknown>
    : number extends P
      ? Record<string, unknown>
      : SetObjectPath<T, `${P & (string | number)}`, V>;
type ObjectPullRest<T, P> = P extends keyof T
    ? Simplify<Omit<T, P>>
    : OmitObjectPath<T, `${P & (string | number)}`>;
type ArrayElementOf<T> = T extends readonly (infer E)[] ? E : never;

/**
 * Mutation contract: pop, shift, splice and unshift mutate their first
 * argument; every other function returns a new value. arr and obj agree
 * on this — re-read Collection.php before "aligning" one to the other.
 */

// Mirrors mapSpread's runtime: a list spreads its items, an object its values, and anything else (a function
// included, which isObject rejects) passes whole. An unknown or bare `object` row may be a list of any length.
type MapSpreadItems<V> = unknown extends V
    ? unknown[]
    : V extends readonly unknown[]
      ? V
      : V extends (...args: never[]) => unknown
        ? [V]
        : V extends object
          ? [keyof V] extends [never]
              ? unknown[]
              : ObjectValue<V>[]
          : [V];
// Same-length tuple rows zip into one tuple so a callback may leave off the key;
// rows of differing or open length give `false`, because the key's position then varies by row.
type SpreadZip<
    S extends readonly unknown[],
    A extends unknown[] = [],
> = S["length"] extends A["length"]
    ? A
    : A["length"] extends S["length"]
      ? false
      : SpreadZip<S, [...A, S[A["length"]]]>;
type SpreadArgs<V, K> =
    MapSpreadItems<V> extends infer S extends readonly unknown[]
        ? SpreadZip<S> extends infer Z extends unknown[]
            ? [...Z, K]
            : (S[number] | K)[]
        : never;

// A default value, or a closure that produces one, as the guard helpers accept.
type Default<TDefault> = TDefault | (() => TDefault);

const sortSpecComparator = createSortSpecComparator((item, key) =>
    getNestedValue(item, key as PropertyKey),
);

// toPhpKeyString prints a float the way PHP does (1.0E+21, 14 digits), so only an integer literal keeps its JS text.
type PhpKeyString<V> = V extends string
    ? V
    : V extends number
      ? number extends V
          ? `${number}` | "NAN" | "INF" | "-INF"
          : `${V}` extends `${bigint}`
            ? `${V}`
            : string
      : V extends true
        ? "1"
        : V extends false | null | undefined
          ? ""
          : string;
// combine reads both operands through arrayableValues(), whose values are ArrayableItems' values.
type OperandValues<X> = ObjectValue<ArrayableItems<X>>;
// Record promises every key it names, so only a key one entry must print is required: a tuple element's, or a
// required property's, of one literal type. A list, Set, Map, Collection-like or index signature holds any count.
type CombineRecord<K, V> = CombineKeyed<
    PhpKeyString<OperandValues<K>>,
    CombineSureKeys<K>,
    OperandValues<V>
>;
type CombineKeyed<All extends PropertyKey, Sure, V> = [
    Exclude<All, Sure>,
] extends [never]
    ? Record<All, V>
    : [Sure] extends [never]
      ? Partial<Record<All, V>>
      : Record<Sure & All, V> & Partial<Record<Exclude<All, Sure>, V>>;
type CombineSureKeys<K> = K extends readonly unknown[]
    ? number extends K["length"]
        ? never
        : { [I in keyof K]: CombineOneKey<K[I]> }[number]
    : K extends
            | NonObjectItems
            | Iterable<unknown>
            | { all: (...args: never[]) => unknown }
            | { toArray: (...args: never[]) => unknown }
            | { toJSON: (...args: never[]) => unknown }
      ? never
      : {
            [P in keyof K]-?: string extends P
                ? never
                : number extends P
                  ? never
                  : Record<never, never> extends Pick<K, P>
                    ? never
                    : CombineOneKey<K[P]>;
        }[keyof K];
// The key an entry of type X prints, when it can print only that one.
type CombineOneKey<X, S = PhpKeyString<X>> = S extends unknown
    ? [PhpKeyString<X>] extends [S]
        ? S
        : never
    : never;

// A symbol key is optional: keyBy stores one only when some row resolves to it.
type KeyByResult<V, S extends symbol> = [S] extends [never]
    ? Record<string, V>
    : Record<string, V> & { [K in S]?: V };
// dot() and flattenDot() keep an undefined leaf, which ObjectPathValue (get()'s reach, where undefined means missing)
// drops; a declared `| undefined` anywhere in T adds it back.
type DotUndefined<T, D extends number = 5> = [D] extends [never]
    ? undefined
    : T extends readonly (infer E)[]
      ? Extract<E, undefined> | DotUndefined<NonNullable<E>, DotDepth[D]>
      : T extends (...args: never[]) => unknown
        ? never
        : T extends object
          ? {
                [K in keyof T]-?:
                    | Extract<Required<T>[K], undefined>
                    | DotUndefined<NonNullable<T[K]>, DotDepth[D]>;
            }[keyof T]
          : never;
type DotDepth = [never, 0, 1, 2, 3, 4];

type PluckKey<TItem> =
    | string
    | readonly (string | number)[]
    | ((item: TItem) => string | number);

// At a depth, flatten() pushes a nested value as it is or reads it through all() first; ObjectPathValue (get()'s
// reach) can't stand in, because it drops undefined and never unwraps all().
type FlattenReach<T, D extends number = 5> = [D] extends [never]
    ? unknown
    :
          | T
          | FlattenReachOf<
                T extends { all: (...args: never[]) => infer R } ? R : T,
                D
            >;
type FlattenReachOf<T, D extends number> = T extends readonly (infer E)[]
    ? FlattenReach<E, FlattenDepth[D]>
    : T extends NonObjectItems | Date | RegExp | Promise<unknown>
      ? T
      : T extends object
        ? [keyof T] extends [never]
            ? unknown
            : FlattenReach<ObjectValue<T>, FlattenDepth[D]>
        : T;
type FlattenDepth = [never, 0, 1, 2, 3, 4];

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
export function accessible(
    value: unknown,
): value is Record<PropertyKey, unknown>;
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
// entriesOf: plain-object keys go through phpArrayKey; Map keys pass as they are.
function entriesOf<TValue, TKey extends PropertyKey = PropertyKey>(
    data: object,
): [TKey, TValue][] {
    if (isMap<TKey, TValue>(data)) {
        return [...data.entries()];
    }

    return Object.entries(data).map(([key, value]) => [
        phpArrayKey(key) as TKey,
        value as TValue,
    ]);
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
export function objectifiable(value: unknown): value is Record<string, unknown>;
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
export function add(
    data: NonObjectItems,
    key: PathKey,
    value: unknown,
): Record<string, unknown>;
export function add<T extends object, P extends string | number, V>(
    data: T,
    key: P,
    value: V,
): ObjectWriteResult<T, P, NonNullable<ObjectResolvePath<T, P, never>> | V>;
export function add(
    data: unknown,
    key: PathKey,
    value: unknown,
): Record<string, unknown>;
export function add<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    value: unknown,
): Record<TKey, TValue> {
    const mutableData = { ...(data as Record<TKey, TValue>) };

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
 * objectItem({ items: { a: 1 } }, 'items'); -> { a: 1 }
 * objectItem({ items: ['a', 'b'] }, 'items'); -> throws Error (a list is not an object)
 * objectItem({ user: { name: 'John' } }, 'user.name'); -> throws Error
 */
export function objectItem(
    data: NonObjectItems,
    key: PathKey,
    defaultValue?: unknown,
): Record<string, unknown>;
export function objectItem<
    T extends object,
    P extends string | number,
    TDefault = null,
>(
    data: T,
    key: P,
    defaultValue?: Default<TDefault> | null,
): EnsureObject<ObjectResolvePath<T, P, TDefault>>;
export function objectItem(
    data: unknown,
    key: PathKey,
    defaultValue?: unknown,
): Record<string, unknown>;
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
        const typeName = phpTypeName(value);
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
export function boolean(
    data: unknown,
    key: PathKey,
    defaultValue?: Default<boolean> | null,
): boolean;
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
export function chunk(
    data: NonObjectItems,
    size: number,
    preserveKeys?: boolean,
): Record<number, never>;
export function chunk<T extends object>(
    data: T,
    size: number,
    preserveKeys?: true | undefined,
): Record<number, Partial<T>>;
export function chunk<T extends object>(
    data: T,
    size: number,
    preserveKeys: false | undefined,
): Record<number, Record<number, ObjectValue<T>>>;
export function chunk<T extends object>(
    data: T,
    size: number,
    preserveKeys: boolean,
): Record<number, Partial<T> | Record<number, ObjectValue<T>>>;
export function chunk(
    data: unknown,
    size: number,
    preserveKeys?: boolean,
): Record<number, Record<string, unknown>>;
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
 * Chunk the object into chunks with a callback.
 *
 * @see Collection::chunkWhile — `packages/collection/stubs/Collection.php:1541`, which runs
 *      `LazyCollection::chunkWhile`. Keys are preserved inside each chunk.
 *
 * @param data - The record to chunk
 * @param callback - Receives the value, its key and the chunk built so far; return true to keep appending
 * @returns Chunked record
 *
 * @example
 *
 * chunkWhile({ a: 1, b: 1, c: 2 }, (value, key, chunk) => Object.values(chunk).at(-1) === value);
 * -> { 0: { a: 1, b: 1 }, 1: { c: 2 } }
 */
export function chunkWhile(
    data: NonObjectItems,
    callback: (
        value: unknown,
        key: string | number,
        chunk: Record<string, unknown>,
    ) => boolean,
): Record<number, never>;
export function chunkWhile<T extends object>(
    data: T,
    callback: (
        value: ObjectValue<T>,
        key: ObjectKey<T>,
        chunk: Partial<T>,
    ) => boolean,
): Record<number, Partial<T>>;
export function chunkWhile(
    data: unknown,
    callback: (
        value: unknown,
        key: string | number,
        chunk: Record<string, unknown>,
    ) => boolean,
): Record<number, Record<string, unknown>>;
export function chunkWhile<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback: (
        value: TValue,
        key: TKey,
        chunk: Record<TKey, TValue>,
    ) => boolean,
): Record<number, Record<TKey, TValue>> {
    const chunks: Record<number, Record<TKey, TValue>> = {};

    if (!accessible(data)) {
        return chunks;
    }

    let chunk = {} as Record<TKey, TValue>;
    let size = 0;
    let chunkIndex = 0;

    for (const [rawKey, value] of Object.entries(data) as [string, TValue][]) {
        const key = phpArrayKey(rawKey) as TKey;

        if (size > 0 && !callback(value, key, chunk)) {
            chunks[chunkIndex] = chunk;
            chunkIndex += 1;
            chunk = {} as Record<TKey, TValue>;
            size = 0;
        }

        defineKey(chunk as Record<string, TValue>, rawKey, value);
        size += 1;
    }

    if (size > 0) {
        chunks[chunkIndex] = chunk;
    }

    return chunks;
}

/**
 * Chunk the object into chunks by comparing adjacent values using the given key or callback.
 *
 * @see EnumeratesValues::chunkBy — `packages/collection/stubs/EnumeratesValues.php:937`.
 *      Adjacent values compare with PHP's `==`, so `1` and `"1"` share a chunk.
 *
 * @param data - The record to chunk
 * @param key - A path into each item, or a callback receiving the value and its key
 * @returns Chunked record
 *
 * @example
 *
 * chunkBy({ a: 1, b: 1, c: 2 }, (value) => value); -> { 0: { a: 1, b: 1 }, 1: { c: 2 } }
 */
export function chunkBy(
    data: NonObjectItems,
    key: PathKey | ((value: unknown, key: string | number) => unknown),
): Record<number, never>;
export function chunkBy<T extends object>(
    data: T,
    key: PathKey | ((value: ObjectValue<T>, key: ObjectKey<T>) => unknown),
): Record<number, Partial<T>>;
export function chunkBy(
    data: unknown,
    key: PathKey | ((value: unknown, key: string | number) => unknown),
): Record<number, Record<string, unknown>>;
export function chunkBy<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey | ((value: TValue, key: TKey) => unknown),
): Record<number, Record<TKey, TValue>> {
    // isFunction's predicate is generic, so name the retriever's type rather than let the guard narrow it.
    const retrieve: (value: TValue, key: TKey) => unknown = isFunction(key)
        ? (key as (value: TValue, key: TKey) => unknown)
        : (value) =>
              isNull(key) || isUndefined(key)
                  ? value
                  : getNestedValue(value, key as string);

    // The entry chunkWhile handed us last time. Reading the previous item back out of
    // `chunk` instead re-materializes every entry on every element, which is quadratic.
    let previous: { key: TKey; value: TValue } | undefined;

    // chunkWhile calls back before writing `value`, and even a reset writes within the
    // same iteration, so `chunk` is never empty here; on the first call it holds exactly
    // the one preceding entry, which is the only time it has to be read back.
    return chunkWhile(
        data as Record<TKey, TValue>,
        (value, currentKey, chunk) => {
            if (previous === undefined) {
                const [lastKey, lastValue] = Object.entries(chunk).at(-1) as [
                    string,
                    TValue,
                ];

                previous = {
                    key: phpArrayKey(lastKey) as TKey,
                    value: lastValue,
                };
            }

            const prior = previous;

            previous = { key: currentKey as TKey, value };

            return looseEqual(
                retrieve(value, currentKey as TKey),
                retrieve(prior.value, prior.key),
            );
        },
    ) as Record<number, Record<TKey, TValue>>;
}

/**
 * Collapse an object of objects or lists into a single object; integer keys
 * are renumbered, as `array_merge` does. A Collection-like item unwraps
 * through its `all()` method, and any other item that isn't an object or a list is skipped.
 *
 * @param object - The object of objects or lists to collapse.
 * @returns A new flattened object.
 *
 * @example
 *
 * collapse({ a: { x: 1 }, b: { y: 2 }, c: { z: 3 } }); -> { x: 1, y: 2, z: 3 }
 * collapse({ users: { john: { age: 30 } }, admins: { jane: { role: 'admin' } } }); -> { john: { age: 30 }, jane: { role: 'admin' } }
 */
export function collapse<
    TValue extends Record<
        PropertyKey,
        Record<PropertyKey, unknown> | readonly unknown[]
    >,
>(object: TValue): Record<string, TValue[keyof TValue]> {
    const out: Record<string, TValue[keyof TValue]> = {};
    let nextIndex = 0;

    for (const group of Object.values(object)) {
        // Arr::collapse merges a Collection item's items, never the Collection's own fields.
        const item =
            isObject(group) && isFunction(group["all"])
                ? group["all"]()
                : group;

        if (!isObject(item) && !isArray(item)) {
            continue;
        }

        for (const [key, value] of Object.entries(item)) {
            // array_merge appends every integer key, negative ones included, and lets a later string key win.
            if (isNumber(phpArrayKey(key))) {
                defineKey(
                    out as Record<PropertyKey, unknown>,
                    nextIndex,
                    value,
                );
                nextIndex++;
            } else {
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
 * @param keysObject - The object or list whose values become the keys.
 * @param valuesObject - The object or list whose values become the values.
 * @returns A new object containing combined key-value pairs.
 * @throws Error if `keysObject` and `valuesObject` do not have the same
 * number of entries.
 */
export function combine<K extends object, V extends object>(
    keys: K,
    values: V,
): CombineRecord<K, V>;
export function combine(
    keys: unknown,
    values: unknown,
): Record<string, unknown>;
export function combine<TKeys, TValues, TCombineValue = TValues>(
    keysObject: Record<PropertyKey, TKeys> | readonly TKeys[] | unknown,
    valuesObject: Record<PropertyKey, TValues> | readonly TValues[] | unknown,
): Record<PropertyKey, TCombineValue> {
    const keys = arrayableValues<TKeys>(keysObject).map((key) =>
        toPhpKeyString(key),
    );
    const values = arrayableValues<TValues>(valuesObject);
    const maxLength = keys.length;

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
 * Each key is one dimension, walked like PHP's `foreach`: an array, a plain object,
 * a Map or a Set gives its values, and a scalar gives none.
 *
 * @param objects - The objects to cross join.
 * @returns A new array with all combinations of the input object values.
 *
 * @example
 *
 * crossJoin({ a: [1] }, { b: ["x"] }); -> [{ a: 1, b: "x" }]
 * crossJoin({ size: ['S', 'M'] }, { color: ['red', 'blue'] }); -> [{ size: 'S', color: 'red' }, { size: 'S', color: 'blue' }, { size: 'M', color: 'red' }, { size: 'M', color: 'blue' }]
 * crossJoin({ a: [1], b: { k: "x", j: "y" } }); -> [{ a: 1, b: "x" }, { a: 1, b: "y" }]
 */
export function crossJoin<TValues, TCombineValue = TValues>(
    ...objects: Record<PropertyKey, TValues>[]
): Record<PropertyKey, TCombineValue>[] {
    let results: Record<PropertyKey, TCombineValue>[] = [{}];

    for (const obj of objects) {
        // Each key is its own dimension, as with Arr::crossJoin over a string-keyed spread.
        for (const [key, dimension] of Object.entries(obj)) {
            const values = foreachValues(dimension);

            if (values.length === 0) {
                return [];
            }

            const next: Record<PropertyKey, TCombineValue>[] = [];

            for (const product of results) {
                for (const value of values) {
                    const row = { ...product };

                    defineKey(
                        row as Record<string, TCombineValue>,
                        key,
                        value as TCombineValue,
                    );
                    next.push(row);
                }
            }

            results = next;
        }
    }

    return results;
}

/**
 * Get the values PHP's `foreach` visits in a value.
 *
 * @param value - The value to walk.
 * @returns An array's items, a Map's or other iterable's values, an object's own values, or nothing for a scalar.
 */
function foreachValues(value: unknown): unknown[] {
    if (isArray(value)) {
        return value;
    }

    // A Map's iterator yields [key, value] pairs, where `foreach ($map as $value)` reads only the values.
    if (isMap(value)) {
        return [...value.values()];
    }

    if (isIterable(value)) {
        return [...value];
    }

    return isObject(value) ? Object.values(value) : [];
}

/**
 * Divide an object into two objects. One with keys and the other with values.
 *
 * @param object - The object to divide; `null` or `undefined` gives two empty lists.
 * @returns A tuple with an array of keys and an array of values.
 *
 * @example
 *
 * divide({ name: "John", age: 30, city: "NYC" }); -> [['name', 'age', 'city'], ['John', 30, 'NYC']]
 */
export function divide(data: NonObjectItems): [(string | number)[], unknown[]];
export function divide<T extends object>(
    data: T,
): [ObjectKey<T>[], ObjectValue<T>[]];
export function divide(data: unknown): [(string | number)[], unknown[]];
export function divide<TValue, TKey extends PropertyKey = PropertyKey>(
    object: Record<TKey, TValue> | unknown,
): [TKey[], TValue[]] {
    if (!accessible(object)) {
        return [[], []];
    }

    return [
        Object.keys(object).map(phpArrayKey) as TKey[],
        Object.values(object) as TValue[],
    ];
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
export function dot(
    data: NonObjectItems,
    prepend?: string,
    depth?: number,
): Record<string, never>;
export function dot<T extends object>(
    data: T,
    prepend?: string,
    depth?: number,
): Record<string, ObjectPathValue<T> | DotUndefined<T>>;
export function dot(
    data: unknown,
    prepend?: string,
    depth?: number,
): Record<string, unknown>;
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
export function undot(data: NonObjectItems): Record<number, unknown>;
export function undot<T extends object>(
    data: T,
): Record<string, UndotObjectValue<ObjectValue<T>>>;
export function undot(data: unknown): Record<string, unknown>;
export function undot<TValue, TKey extends PropertyKey = PropertyKey>(
    map: Record<TKey, TValue> | unknown,
): Record<TKey, TValue> {
    if (isNull(map) || isUndefined(map)) {
        return {} as Record<TKey, TValue>;
    }

    return undotExpandObject(map as Record<TKey, TValue>);
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
 * @returns A new object containing all key-value pairs from the input objects.
 */
export function union<TValue, TKey extends PropertyKey = PropertyKey>(
    ...objects: Record<TKey, TValue>[] | unknown[]
): Record<TKey, TValue> {
    return objects.map(arrayableItems).reduce(
        (acc: Record<PropertyKey, TValue>, obj: Record<string, unknown>) => {
            for (const [key, value] of Object.entries(obj)) {
                if (!Object.hasOwn(acc, key)) {
                    defineKey(
                        acc as Record<string, TValue>,
                        key,
                        value as TValue,
                    );
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
 * Each item, including an object or `null`, is prepended as one element under the next integer key. Existing
 * integer keys are renumbered after the items, even when there are none, as `array_unshift` does.
 *
 * @see Collection::unshift — `packages/collection/stubs/Collection.php:1087`. Wraps `array_unshift`; mutates.
 *
 * @param items - The items to prepend. The first item is the target object, mutated in place when object-accessible.
 * @returns The same object reference, mutated (or a new object when the first item isn't object-accessible).
 */
export function unshift(): Record<string, never>;
export function unshift<TItems extends readonly unknown[]>(
    data: NonObjectItems | null | undefined,
    ...items: TItems
): Record<number, TItems[number]>;
// array_unshift renumbers integer keys even with no items, so only a T without them comes back unchanged.
export function unshift<T extends object>(
    data: T,
): [Extract<keyof T, number | `${number}`>] extends [never]
    ? T
    : RenumberedObject<T, never>;
export function unshift<T extends object, TItems extends readonly unknown[]>(
    data: T,
    ...items: TItems
): RenumberedObject<T, TItems[number]>;
export function unshift(
    data: unknown,
    ...items: unknown[]
): Record<string | number, unknown>;
export function unshift<TValue, TKey extends PropertyKey = PropertyKey>(
    ...items: Record<TKey, TValue>[] | unknown[]
): Record<TKey, TValue> {
    const [data, ...values] = items as unknown[];

    if (!accessible(data)) {
        const fresh: Record<number, unknown> = {};

        values.forEach((value, index) => {
            fresh[index] = value;
        });

        return fresh as Record<TKey, TValue>;
    }

    if (isPrototypeObject(data)) {
        return data as Record<TKey, TValue>;
    }

    const target = data as Record<string, unknown>;
    const originalEntries = Object.entries(target);

    for (const key of Object.keys(target)) {
        delete target[key];
    }

    // array_unshift prepends each argument as one element, then renumbers every integer key, negative ones included.
    let nextIndex = 0;

    for (const value of values) {
        defineKey(target, nextIndex, value);
        nextIndex++;
    }

    for (const [key, value] of originalEntries) {
        if (isNumber(phpArrayKey(key))) {
            defineKey(target, nextIndex, value);
            nextIndex++;
        } else {
            defineKey(target, key, value);
        }
    }

    return data as Record<TKey, TValue>;
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
export function except(
    data: NonObjectItems,
    keys: PathKeys,
): Record<string, never>;
export function except<T extends object, const K extends keyof T>(
    data: T,
    keys: K,
): Simplify<Omit<T, K>>;
export function except<T extends object, const Ks extends readonly (keyof T)[]>(
    data: T,
    keys: Ks,
): Simplify<Omit<T, Ks[number]>>;
export function except<T extends object, const P extends string>(
    data: T,
    keys: P,
): OmitObjectPath<T, P>;
export function except<T extends object, const Ps extends readonly string[]>(
    data: T,
    keys: Ps,
): OmitObjectPaths<T, Ps>;
export function except<T extends object>(
    data: T,
    keys: PathKeys,
): ObjectDeepPartial<T>;
export function except(data: unknown, keys: PathKeys): Record<string, unknown>;
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
export function exceptValues(
    data: NonObjectItems,
    values: unknown,
    strict?: boolean,
): Record<number, unknown>;
export function exceptValues<T extends object>(
    data: T,
    values: unknown,
    strict?: boolean,
): Partial<T>;
export function exceptValues(
    data: unknown,
    values: unknown,
    strict?: boolean,
): Record<string, unknown>;
export function exceptValues<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    values: TValue | TValue[],
    strict: boolean = false,
): Record<TKey, TValue> {
    if (isNull(data) || isUndefined(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const valueArray = isArray(values) ? values : [values];
    const result = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
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
 */
export function exists(data: unknown, key: PathKey): boolean;
export function exists<TValue extends Record<PropertyKey, unknown>>(
    data: TValue | unknown,
    key: PathKey,
): boolean {
    if (!accessible(data)) {
        return false;
    }

    // Arr::exists casts a null or float key to string and never walks a dot path.
    return Object.hasOwn(data, toPhpKeyString(key));
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
export function first<TValue, TKey, TDefault = null>(
    data: ReadonlyMap<TKey, TValue>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: Default<TDefault>,
): TValue | TDefault;
export function first<TDefault = null>(
    data: NonObjectItems,
    callback?: ((value: unknown, key: string | number) => boolean) | null,
    defaultValue?: Default<TDefault>,
): TDefault;
export function first<T extends object, TDefault = null>(
    data: T,
    callback?: ((value: ObjectValue<T>, key: ObjectKey<T>) => boolean) | null,
    defaultValue?: Default<TDefault>,
): ObjectValue<T> | TDefault;
export function first<TDefault = null>(
    data: unknown,
    callback?: ((value: unknown, key: string | number) => boolean) | null,
    defaultValue?: Default<TDefault>,
): unknown;
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
export function last<TValue, TKey, TDefault = null>(
    data: ReadonlyMap<TKey, TValue>,
    callback?: ((value: TValue, key: TKey) => boolean) | null,
    defaultValue?: Default<TDefault>,
): TValue | TDefault;
export function last<TDefault = null>(
    data: NonObjectItems,
    callback?: ((value: unknown, key: string | number) => boolean) | null,
    defaultValue?: Default<TDefault>,
): TDefault;
export function last<T extends object, TDefault = null>(
    data: T,
    callback?: ((value: ObjectValue<T>, key: ObjectKey<T>) => boolean) | null,
    defaultValue?: Default<TDefault>,
): ObjectValue<T> | TDefault;
export function last<TDefault = null>(
    data: unknown,
    callback?: ((value: unknown, key: string | number) => boolean) | null,
    defaultValue?: Default<TDefault>,
): unknown;
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
export function take(
    data: NonObjectItems,
    limit: number,
): Record<string, never>;
export function take<T extends object>(data: T, limit: number): Partial<T>;
export function take(data: unknown, limit: number): Record<string, unknown>;
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
 * Only arrays and plain objects are flattened, along with the items of a Collection-like item (one with an
 * `all()` method); any other object, a `Date`, `Map` or class instance included, is kept as a value.
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
export function flatten(data: NonObjectItems, depth?: number): unknown[];
export function flatten<T extends object>(
    data: T,
): ObjectFlatValue<ObjectValue<T>>[];
export function flatten<T extends object>(
    data: T,
    depth: number,
): FlattenReach<ObjectValue<T>>[];
export function flatten(data: unknown, depth?: number): unknown[];
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

        for (const value of values) {
            // Arr::flatten flattens a Collection item's items, and only an array otherwise.
            const item =
                isObject(value) && isFunction(value["all"])
                    ? value["all"]()
                    : value;

            if (!isArray(item) && !isPlainObject(item)) {
                result.push(item);
            } else if (currentDepth === 1) {
                // Arr.php:373 spends the last level of depth on the
                // container's own values, so depth 1 still unwraps once.
                const nested = isArray(item) ? item : Object.values(item);

                for (const nestedValue of nested) {
                    result.push(nestedValue);
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
 * Like `dot`, it walks only arrays and plain objects below the root; any other object is a leaf.
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
export function flattenDot(
    data: NonObjectItems,
    depth?: number,
): Record<string, never>;
export function flattenDot<T extends object>(
    data: T,
    depth?: number,
): Record<string, ObjectPathValue<T> | DotUndefined<T>>;
export function flattenDot(
    data: unknown,
    depth?: number,
): Record<string, unknown>;
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
        const isObj = pathLen === 0 ? isObject(node) : isPlainObject(node);
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
 * @returns The data items flipped
 *
 * @example
 * flip({name: 'taylor'}); -> {taylor: 'name'}
 * flip({string: 'taylor', integer: 1, null: null, float: 1.5}); -> {taylor: 'string', 1: 'integer'}
 */
export function flip(data: NonObjectItems): Record<string, never>;
export function flip<T extends object>(data: T): FlipObject<T>;
export function flip(data: unknown): Record<string, string | number>;
export function flip<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
): Record<string, string | number> {
    if (!accessible(data)) {
        return {};
    }

    // flip the object keys as values and values as keys,
    // skipping values that are not valid PHP array keys
    // e.g {name: 'taylor'} -> {taylor: 'name'}
    const result: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(data)) {
        if (isPhpArrayKey(value)) {
            defineKey(result, String(value), phpArrayKey(key));
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
export function float(
    data: unknown,
    key: PathKey,
    defaultValue?: Default<number> | null,
): number;
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
export function forget(
    data: NonObjectItems,
    keys: PathKeys,
): Record<string, never>;
export function forget<T extends object, const K extends keyof T>(
    data: T,
    keys: K,
): Simplify<Omit<T, K>>;
export function forget<T extends object, const Ks extends readonly (keyof T)[]>(
    data: T,
    keys: Ks,
): Simplify<Omit<T, Ks[number]>>;
export function forget<T extends object, const P extends string>(
    data: T,
    keys: P,
): OmitObjectPath<T, P>;
export function forget<T extends object, const Ps extends readonly string[]>(
    data: T,
    keys: Ps,
): OmitObjectPaths<T, Ps>;
export function forget<T extends object>(
    data: T,
    keys: PathKeys,
): ObjectDeepPartial<T>;
export function forget(data: unknown, keys: PathKeys): Record<string, unknown>;
export function forget<TValue extends Record<PropertyKey, unknown>>(
    data: TValue,
    keys: PathKeys,
): Record<PropertyKey, unknown> {
    if (!accessible(data)) {
        return {};
    }

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
export function from<V>(items: ReadonlyMap<unknown, V>): Record<string, V>;
export function from(items: WeakMap<object, unknown>): never;
export function from<T extends readonly unknown[]>(
    items: T,
): Record<number, T[number]>;
export function from(
    items: ReadonlySet<unknown> | WeakSet<object>,
): Record<string, never>;
export function from(
    items:
        | number
        | string
        | boolean
        | symbol
        | bigint
        | null
        | undefined
        | ((...args: never[]) => unknown),
): never;
export function from<T extends object>(items: T): SpreadItems<T>;
export function from(items: unknown): Record<string, unknown>;
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
export function get<TDefault = null>(
    data: NonObjectItems,
    key: PathKey,
    defaultValue?: Default<TDefault>,
): TDefault;
export function get<T extends object>(data: T, key: null | undefined): T;
export function get<T extends object, P extends string | number, TDefault>(
    data: T,
    key: P,
    defaultValue: Default<TDefault>,
): ObjectResolvePath<T, P, TDefault>;
export function get<T extends object, P extends string | number>(
    data: T,
    key: P,
): ObjectResolvePath<T, P, null>;
export function get(
    data: unknown,
    key: PathKey,
    defaultValue?: unknown,
): unknown;
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
        if (!isObject(current) && !isArray(current)) {
            return isFunction(defaultValue)
                ? (defaultValue as () => TDefault)()
                : defaultValue;
        }

        // A list only has canonical numeric indices; every JS array also owns
        // "length", so a raw Object.hasOwn(current, "length") would wrongly hit.
        const segmentKey = isArray(current) ? phpArrayKey(segment) : segment;

        if (
            (isArray(current) && !isNumber(segmentKey)) ||
            !Object.hasOwn(current as object, segmentKey)
        ) {
            return isFunction(defaultValue)
                ? (defaultValue as () => TDefault)()
                : defaultValue;
        }

        current = (current as Record<string | number, unknown>)[segmentKey];
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
export function has(data: unknown, keys: PathKeys): boolean;
export function has<TValue extends Record<PropertyKey, unknown>>(
    data: TValue | unknown,
    keys: PathKeys,
): boolean {
    if (isNull(keys) || isUndefined(keys)) {
        return false;
    }

    const keyList = isArray(keys) ? keys : [keys];

    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const k of keyList) {
        // A null inside a key list reaches Arr::exists, which casts it to "".
        if (!hasMixed(data, isNull(k) || isUndefined(k) ? "" : k)) {
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
export function hasAll(data: unknown, keys: PathKeys): boolean;
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
export function hasAny(data: unknown, keys: PathKeys): boolean;
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
export function every<TValue, TKey>(
    data: ReadonlyMap<TKey, TValue>,
    callback: (value: TValue, key: TKey) => boolean,
): boolean;
export function every(
    data: NonObjectItems,
    callback: (value: unknown, key: string | number) => boolean,
): boolean;
export function every<T extends object>(
    data: T,
    callback: (value: ObjectValue<T>, key: ObjectKey<T>) => boolean,
): boolean;
export function every(
    data: unknown,
    callback: (value: unknown, key: string | number) => boolean,
): boolean;
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
export function some<TValue, TKey>(
    data: ReadonlyMap<TKey, TValue>,
    callback: (value: TValue, key: TKey) => boolean,
): boolean;
export function some(
    data: NonObjectItems,
    callback: (value: unknown, key: string | number) => boolean,
): boolean;
export function some<T extends object>(
    data: T,
    callback: (value: ObjectValue<T>, key: ObjectKey<T>) => boolean,
): boolean;
export function some(
    data: unknown,
    callback: (value: unknown, key: string | number) => boolean,
): boolean;
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
export function integer(
    data: unknown,
    key: PathKey,
    defaultValue?: Default<number> | null,
): number;
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
 * Each resolved key is stored the way PHP stores an array key: `null` as `""`, a boolean as `0`/`1`,
 * and a float truncated toward zero.
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
export function keyBy(
    data: NonObjectItems,
    keyBy:
        | PathKey
        | ((
              item: unknown,
              key: string | number,
          ) => PropertyKey | boolean | null | undefined),
): Record<string, never>;
// The runtime keeps a symbol the callback returns, or a path reaches, as a key, and casts a bool or float key the
// way PHP does.
export function keyBy<
    T extends object,
    R extends PropertyKey | boolean | null | undefined = never,
>(
    data: T,
    keyBy: PathKey | ((item: ObjectValue<T>, key: ObjectKey<T>) => R),
): KeyByResult<
    ObjectValue<T>,
    Extract<R | ObjectPathValue<ObjectValue<T>>, symbol>
>;
export function keyBy(
    data: unknown,
    keyBy:
        | PathKey
        | ((
              item: unknown,
              key: string | number,
          ) => PropertyKey | boolean | null | undefined),
): Record<string, unknown>;
export function keyBy<TValue extends Record<PropertyKey, unknown>>(
    data: Record<PropertyKey, TValue> | unknown,
    keyBy:
        | PathKey
        | ((
              item: TValue,
              key: string | number,
          ) => PropertyKey | boolean | null | undefined),
): Record<PropertyKey, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<PropertyKey, TValue>;
    const results: Record<PropertyKey, TValue> = {};

    for (const [itemKey, item] of Object.entries(obj)) {
        const key = isFunction(keyBy)
            ? keyBy(item, phpArrayKey(itemKey))
            : getObjectValue(item, keyBy as PathKey);

        defineKey(
            results as Record<string, TValue>,
            isSymbol(key) ? key : phpArrayKey(key),
            item,
        );
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
export function prependKeysWith(
    data: NonObjectItems,
    prependWith: string,
): Record<string, never>;
export function prependKeysWith<T extends object, const P extends string>(
    data: T,
    prependWith: P,
): PrefixKeys<T, P>;
export function prependKeysWith(
    data: unknown,
    prependWith: string,
): Record<string, unknown>;
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
export function only(
    data: NonObjectItems,
    keys: PathKeys,
): Record<string, never>;
export function only<T extends object>(
    data: T,
    keys: null | undefined,
): Record<string, never>;
export function only<T extends object, const K extends keyof T>(
    data: T,
    keys: K,
): Simplify<Pick<T, K>>;
export function only<T extends object, const Ks extends readonly (keyof T)[]>(
    data: T,
    keys: Ks,
): Simplify<Pick<T, Ks[number]>>;
export function only<T extends object>(data: T, keys: PathKeys): Partial<T>;
export function only(data: unknown, keys: PathKeys): Record<string, unknown>;
export function only<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    keys: string | string[] | null | unknown,
): Record<PropertyKey, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const obj = data as Record<PropertyKey, TValue>;
    const result: Record<PropertyKey, TValue> = {};
    const keyList = (
        isNull(keys) ? [] : isArray(keys) ? keys : [keys]
    ) as PropertyKey[];

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
export function onlyValues(
    data: NonObjectItems,
    values: unknown,
    strict?: boolean,
): Record<number, unknown>;
export function onlyValues<T extends object>(
    data: T,
    values: unknown,
    strict?: boolean,
): Partial<T>;
export function onlyValues(
    data: unknown,
    values: unknown,
    strict?: boolean,
): Record<string, unknown>;
export function onlyValues<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    values: TValue | TValue[],
    strict: boolean = false,
): Record<TKey, TValue> {
    if (isNull(data) || isUndefined(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const valueArray = isArray(values) ? values : [values];
    const result = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
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
export function select(
    data: NonObjectItems,
    keys: PathKeys,
): Record<string, never>;
export function select<
    T extends object,
    const K extends keyof ObjectValue<T> & string,
>(
    data: T,
    keys: K,
): { -readonly [R in keyof T]: Simplify<Pick<T[R], K & keyof T[R]>> };
export function select<
    T extends object,
    const Ks extends readonly (keyof ObjectValue<T> & string)[],
>(
    data: T,
    keys: Ks,
): { -readonly [R in keyof T]: Simplify<Pick<T[R], Ks[number] & keyof T[R]>> };
export function select<T extends object>(
    data: T,
    keys: PathKeys,
): { -readonly [R in keyof T]: Partial<T[R]> };
export function select(
    data: unknown,
    keys: PathKeys,
): Record<string, Record<string, unknown>>;
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
 *   `*` wildcard path), a callback, or `null`/`undefined` to keep each whole item.
 * @param key - Optional key path (string, array of segments, or callback) to use as keys in the result.
 * @returns A new array with plucked values or object with key-value pairs.
 *
 * @example
 *
 * pluck({ user1: { name: 'John' }, user2: { name: 'Jane' } }, 'name'); -> ['John', 'Jane']
 */
export function pluck(
    data: NonObjectItems,
    value:
        | string
        | readonly (string | number)[]
        | ((item: unknown) => unknown)
        | null,
    key: PluckKey<unknown>,
): Record<string | number, never>;
export function pluck(
    data: NonObjectItems,
    value:
        | string
        | readonly (string | number)[]
        | ((item: unknown) => unknown)
        | null,
): never[];
export function pluck<T extends object, const P extends string>(
    data: T,
    value: P,
    key: PluckKey<ObjectValue<T>>,
): Record<string | number, PluckValue<ObjectValue<T>, P>>;
export function pluck<T extends object, const P extends string>(
    data: T,
    value: P,
): PluckValue<ObjectValue<T>, P>[];
export function pluck<T extends object, R>(
    data: T,
    value: (item: ObjectValue<T>) => R,
    key: PluckKey<ObjectValue<T>>,
): Record<string | number, R>;
export function pluck<T extends object, R>(
    data: T,
    value: (item: ObjectValue<T>) => R,
): R[];
export function pluck<T extends object>(
    data: T,
    value: null | undefined,
    key: PluckKey<ObjectValue<T>>,
): Record<string | number, ObjectValue<T>>;
export function pluck<T extends object>(
    data: T,
    value: null | undefined,
): ObjectValue<T>[];
export function pluck<T extends object>(
    data: T,
    value: readonly (string | number)[],
    key: PluckKey<ObjectValue<T>>,
): Record<string | number, unknown>;
export function pluck<T extends object>(
    data: T,
    value: readonly (string | number)[],
): unknown[];
export function pluck(
    data: unknown,
    value:
        | string
        | readonly (string | number)[]
        | ((item: unknown) => unknown)
        | null,
    key?: PluckKey<unknown> | null,
): unknown[] | Record<string | number, unknown>;
export function pluck<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    value:
        | string
        | readonly string[]
        | ((item: TValue) => unknown)
        | null
        | unknown,
    key:
        | string
        | readonly string[]
        | ((item: TValue) => string | number)
        | null
        | unknown = null,
): unknown[] | Record<PropertyKey, unknown> {
    const valuePath = isUndefined(value) ? null : value;

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
        if (isFunction(valuePath)) {
            itemValue = valuePath(item);
        } else {
            itemValue = resolvePluckPath(
                item,
                explodePluckPath(
                    valuePath as string | readonly string[] | null,
                ),
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
export function pop(
    data: NonObjectItems | null | undefined,
    count?: number,
): null | never[];
export function pop<T extends object>(
    data: T,
    count?: 1 | undefined,
): ObjectValue<T> | null;
export function pop<T extends object, const N extends number>(
    data: T,
    count: N,
): number extends N
    ? ObjectValue<T> | ObjectValue<T>[] | null
    : ObjectValue<T>[];
export function pop(data: unknown, count?: number): unknown;
export function pop<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
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
export function map<R>(
    data: NonObjectItems,
    callback: (value: unknown, key: string | number) => R,
): Record<string, never>;
export function map<T extends object, R>(
    data: T,
    callback: (value: ObjectValue<T>, key: ObjectKey<T>) => R,
): { -readonly [K in keyof T]: R };
export function map<R>(
    data: unknown,
    callback: (value: unknown, key: string | number) => R,
): Record<string, R>;
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
            callback(value as TValue, phpArrayKey(key) as TKey),
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
export function mapWithKeys(
    data: NonObjectItems,
    callback: (
        value: unknown,
        key: string | number,
    ) => Record<PropertyKey, unknown>,
): Record<string, never>;
export function mapWithKeys<
    T extends object,
    TMapKey extends PropertyKey,
    TMapValue,
>(
    data: T,
    callback: (
        value: ObjectValue<T>,
        key: ObjectKey<T>,
    ) => Record<TMapKey, TMapValue>,
): Record<TMapKey, TMapValue>;
export function mapWithKeys<TMapKey extends PropertyKey, TMapValue>(
    data: unknown,
    callback: (
        value: unknown,
        key: string | number,
    ) => Record<TMapKey, TMapValue>,
): Record<TMapKey, TMapValue>;
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
        const mappedObject = callback(value, phpArrayKey(key) as TKey);

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
 * Run a map over each row, spreading a list row (or an object row's values) as arguments, followed by the key.
 *
 * @param data - The object to map over.
 * @param callback - The callback function that receives spread object values and the key.
 * @returns A new object with mapped values.
 *
 * @example
 *
 * mapSpread({ x: [1, 'a'], y: [2, 'b'] }, (n, c) => `${n}-${c}`); -> { x: '1-a', y: '2-b' }
 * mapSpread({ x: [1, 'a'], y: [2, 'b'] }, (n, c, key) => `${n}-${c}-${key}`); -> { x: '1-a-x', y: '2-b-y' }
 */
export function mapSpread<R>(
    data: NonObjectItems,
    callback: (...args: unknown[]) => R,
): Record<string, never>;
export function mapSpread<T extends object, R>(
    data: T,
    callback: (...args: SpreadArgs<ObjectValue<T>, ObjectKey<T>>) => R,
): { -readonly [K in keyof T]: R };
export function mapSpread<R>(
    data: unknown,
    callback: (...args: unknown[]) => R,
): Record<string, R>;
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
        // Arr::mapSpread spreads a list row; a plain-object row spreads its values and a scalar
        // passes whole, which PHP rejects but is kept as JS leniency.
        const args = isArray(item)
            ? item
            : isObject(item)
              ? Object.values(item)
              : [item];

        defineKey(
            result as Record<string, TMapSpreadValue>,
            key,
            callback(...args, phpArrayKey(key)),
        );
    }

    return result;
}

/**
 * Push an item onto the beginning of an object (as first entry).
 *
 * @param data - The object to prepend to.
 * @param value - The value to prepend.
 * @param key - The key for the prepended value; omit it to unshift under key 0, as `Arr::prepend`
 * does with two arguments.
 * @returns A new object with the value prepended.
 *
 * @example
 *
 * prepend({ b: 2, c: 3 }, 1, 'a'); -> { a: 1, b: 2, c: 3 }
 * prepend({ x: 1, y: 2 }, 0, 'z'); -> { z: 0, x: 1, y: 2 }
 */
export function prepend(
    data: NonObjectItems,
    value: unknown,
    key?: PropertyKey | null,
): Record<string | number, unknown>;
export function prepend<T extends object, V, const K extends string | number>(
    data: T,
    value: V,
    key: K,
): Simplify<{ [P in `${K}`]: V } & Omit<T, K | `${K}`>>;
export function prepend<T extends object, V>(
    data: T,
    value: V,
    key: null | undefined,
): Simplify<{ "": V } & Omit<T, "">>;
export function prepend<T extends object, V>(
    data: T,
    value: V,
): RenumberedObject<T, V>;
export function prepend(
    data: unknown,
    value: unknown,
    key?: PropertyKey | null,
): Record<string | number, unknown>;
export function prepend<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    value: TValue,
    ...rest: [key?: TKey | null]
): Record<TKey, TValue> {
    // Arr::prepend with two arguments is array_unshift: the value takes key 0 and integer keys renumber.
    if (rest.length === 0) {
        return unshift({ ...(accessible(data) ? data : {}) }, value) as Record<
            TKey,
            TValue
        >;
    }

    const [key] = rest;
    const prependKey = isNull(key) || isUndefined(key) ? "" : String(key);
    const result: Record<string, TValue> = {};

    defineKey(result, prependKey, value);

    if (accessible(data)) {
        for (const [existingKey, existingValue] of Object.entries(data)) {
            // `[$key => $value] + $array`: the prepended entry wins its key.
            if (existingKey !== prependKey) {
                defineKey(result, existingKey, existingValue as TValue);
            }
        }
    }

    return result as Record<TKey, TValue>;
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
export function pull<TDefault = null>(
    data: NonObjectItems,
    key: PathKey,
    defaultValue?: Default<TDefault>,
): { value: TDefault; data: Record<string, never> };
export function pull<T extends object, P extends string | number, TDefault>(
    data: T,
    key: P,
    defaultValue: Default<TDefault>,
): { value: ObjectResolvePath<T, P, TDefault>; data: ObjectPullRest<T, P> };
export function pull<T extends object, P extends string | number>(
    data: T,
    key: P,
): { value: ObjectResolvePath<T, P, null>; data: ObjectPullRest<T, P> };
export function pull(
    data: unknown,
    key: PathKey,
    defaultValue?: unknown,
): { value: unknown; data: Record<string, unknown> };
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
export function random(
    data: NonObjectItems,
    number?: number | null,
    preserveKeys?: boolean,
): null | Record<string, never>;
export function random<T extends object>(
    data: T,
    number?: null | undefined,
): ObjectValue<T>;
export function random<T extends object>(
    data: T,
    number: number,
    preserveKeys?: false | undefined,
): Record<number, ObjectValue<T>>;
export function random<T extends object>(
    data: T,
    number: number,
    preserveKeys: true | undefined,
): Partial<T>;
export function random<T extends object>(
    data: T,
    number: number,
    preserveKeys: boolean,
): Partial<T> | Record<number, ObjectValue<T>>;
export function random(
    data: unknown,
    number?: number | null,
    preserveKeys?: boolean,
): unknown;
export function random<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    number?: number | null,
    preserveKeys: boolean = false,
): TValue | Record<TKey, TValue> | null {
    // Map/Set/WeakMap/WeakSet pass accessible() (they are objects) but have no own
    // enumerable entries, so they join the NonObjectItems row instead of throwing.
    if (
        !accessible(data) ||
        isMap(data) ||
        isSet(data) ||
        isWeakMap(data) ||
        isWeakSet(data)
    ) {
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
export function shift(
    data: NonObjectItems | null | undefined,
    count?: number,
): null;
export function shift<T extends object>(
    data: T,
    count?: 1 | undefined,
): ObjectValue<T> | null;
export function shift<T extends object, const N extends number>(
    data: T,
    count: N,
): number extends N
    ? ObjectValue<T> | ObjectValue<T>[] | null
    : ObjectValue<T>[] | null;
export function shift(data: unknown, count?: number): unknown;
export function shift<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    count: number = 1,
): TValue | TValue[] | null {
    if (count < 0) {
        throw new Error("Number of shifted items may not be less than zero.");
    }

    // Collection::shift checks isEmpty() before the count, so non-object data yields null for any count.
    if (!accessible(data)) {
        return null;
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
export function set<V>(data: unknown, key: null | undefined, value: V): V;
export function set(
    data: NonObjectItems,
    key: PathKey,
    value: unknown,
): Record<string, never>;
export function set<T extends object, P extends string | number, V>(
    data: T,
    key: P,
    value: V,
): ObjectWriteResult<T, P, V>;
export function set(
    data: unknown,
    key: PathKey,
    value: unknown,
): Record<string, unknown>;
export function set<TValue, TKey extends PropertyKey = PropertyKey>(
    object: Record<TKey, TValue> | unknown,
    key: PathKey | null,
    value: unknown,
): Record<TKey, TValue> {
    // Arr::set checks is_null($key) before touching $array, so a null/undefined key
    // returns value even for non-object data; check this ahead of the accessible guard.
    if (isNull(key) || isUndefined(key)) {
        return value as Record<TKey, TValue>;
    }

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
export function push<V>(
    data: NonObjectItems,
    key: PathKey,
    ...values: V[]
): Record<string, unknown>;
export function push<T extends object, V>(
    data: T,
    key: null | undefined,
    ...values: V[]
): RenumberedObject<T, V>;
export function push<T extends object, P extends string | number, V>(
    data: T,
    key: P,
    ...values: V[]
): ObjectWriteResult<
    T,
    P,
    (ArrayElementOf<ObjectResolvePath<T, P, never>> | V)[]
>;
export function push(
    data: unknown,
    key: PathKey,
    ...values: unknown[]
): Record<string, unknown>;
export function push<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    key: PathKey,
    ...values: TValue[]
): Record<TKey, TValue> {
    if (!accessible(data)) {
        if (isNull(key) || isUndefined(key)) {
            throw new Error(
                "Cannot push to root of non-object data when key is null or undefined",
            );
        }

        return setObjectValue({} as Record<TKey, TValue>, key, values);
    }

    const obj = data as Record<TKey, TValue>;

    // Arr::push with a null key is Arr::get(null) (whole array) then array_push, so it
    // appends after the highest existing integer-like key instead of throwing; an
    // undefined key is treated the same way, JS-only (no PHP analogue for undefined).
    if (isNull(key) || isUndefined(key)) {
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
 * Shuffle the object's values and return them under keys `0..n-1`, as `Arr::shuffle` returns a list.
 *
 * @param data - The object to shuffle.
 * @returns A new object holding the shuffled values under keys `0..n-1`.
 *
 * @example
 *
 * shuffle({ a: 1, b: 2, c: 3, d: 4, e: 5 }); -> { 0: 3, 1: 1, 2: 5, 3: 2, 4: 4 } (random order)
 * shuffle({ x: 'hello', y: 'world', z: 'test' }); -> { 0: 'test', 1: 'hello', 2: 'world' } (random order)
 */
export function shuffle(data: NonObjectItems): Record<number, never>;
export function shuffle<T extends object>(
    data: T,
): Record<number, ObjectValue<T>>;
export function shuffle(data: unknown): Record<number, unknown>;
export function shuffle<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const values = Object.values(data as Record<TKey, TValue>) as TValue[];

    // Fisher-Yates; Arr::shuffle returns a list, so keys become 0..n-1.
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [values[i], values[j]] = [values[j] as TValue, values[i] as TValue];
    }

    const result: Record<number, TValue> = {};

    values.forEach((value, index) => {
        result[index] = value;
    });

    return result as Record<TKey, TValue>;
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
export function slice(
    data: NonObjectItems | null | undefined,
    offset: number,
    length?: number | null,
): Record<string, never>;
export function slice<T extends object>(
    data: T,
    offset: number,
    length?: number | null,
): Partial<T>;
export function slice(
    data: unknown,
    offset: number,
    length?: number | null,
): Record<string, unknown>;
export function slice<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
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
export function sole(
    data: NonObjectItems,
    callback?: (value: unknown, key: string | number) => boolean,
): never;
export function sole<T extends object>(
    data: T,
    callback?: (value: ObjectValue<T>, key: ObjectKey<T>) => boolean,
): ObjectValue<T>;
export function sole(
    data: unknown,
    callback?: (value: unknown, key: string | number) => boolean,
): unknown;
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
            if (callback(value as TValue, phpArrayKey(key) as TKey)) {
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
                sortKey: callback(value as TValue, phpArrayKey(key) as TKey),
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
                sortKey: callback(value as TValue, phpArrayKey(key) as TKey),
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
 * Only arrays and plain objects are sorted; any other object value (a class instance, Date or Map) is kept as it is.
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

    const direction = (comparison: number): number =>
        isDesc ? -comparison : comparison;
    // Arr::sortRecursive sorts every list by value and every other array by key, recursing first.
    const sortNested = (value: unknown): unknown => {
        if (isArray(value)) {
            return value
                .map(sortNested)
                .sort((a, b) => direction(compareValues(a, b)));
        }

        return isPlainObject(value) ? sortRecursive(value, isDesc) : value;
    };

    const entries = Object.entries(data as T).map(
        ([key, value]) => [key, sortNested(value)] as [string, unknown],
    );

    entries.sort(([keyA], [keyB]) =>
        direction(compareValues(phpArrayKey(keyA), phpArrayKey(keyB))),
    );

    const result: Record<string, unknown> = {};

    for (const [key, value] of entries) {
        defineKey(result, key, value);
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
export function splice(
    data: NonObjectItems | null | undefined,
    offset: number,
    length?: number,
    ...replacement: unknown[]
): Record<string, never>;
export function splice<T extends object>(
    data: T,
    offset: number,
    length?: number,
    ...replacement: unknown[]
): Partial<ReindexedObject<T>>;
export function splice(
    data: unknown,
    offset: number,
    length?: number,
    ...replacement: unknown[]
): Record<string, unknown>;
export function splice<TValue, TKey extends PropertyKey, TReplacements>(
    data: Record<TKey, TValue> | unknown,
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
export function string(
    data: unknown,
    key: PathKey,
    defaultValue?: Default<string> | null,
): string;
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
export function where(
    data: NonObjectItems,
    callback: (value: unknown, key: string | number) => boolean,
): Record<string, never>;
export function where<T extends object>(
    data: T,
    callback: (value: ObjectValue<T>, key: ObjectKey<T>) => boolean,
): Partial<T>;
export function where(
    data: unknown,
    callback: (value: unknown, key: string | number) => boolean,
): Record<string, unknown>;
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
        if (callback(value as TValue, phpArrayKey(key) as TKey)) {
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
export function reject(
    data: NonObjectItems,
    callback: (value: unknown, key: string | number) => boolean,
): Record<string, never>;
export function reject<T extends object>(
    data: T,
    callback: (value: ObjectValue<T>, key: ObjectKey<T>) => boolean,
): Partial<T>;
export function reject(
    data: unknown,
    callback: (value: unknown, key: string | number) => boolean,
): Record<string, unknown>;
export function reject<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback: (value: TValue, key: TKey) => boolean,
): Record<TKey, TValue> {
    return where(
        data,
        (value, key) => !callback(value as TValue, key as TKey),
    ) as Record<TKey, TValue>;
}

/**
 * Replace the data items with the given replacer items, like PHP's
 * `array_replace()` / `Collection::replace()`.
 *
 * Returns a new object rather than mutating `data`; a `null`/`undefined` replacer
 * is a no-op (`CollectionTest.php:1490`). Writes go through `defineKey` so a
 * `__proto__` key on `replacerData` becomes a real own key (see `isUnsafeKey`,
 * AGENTS.md:189).
 *
 * @see Collection::replace — `packages/collection/stubs/Collection.php:1170`. Wraps `array_replace`.
 *
 * @param data - The original object to replace items in. Never mutated.
 * @param replacerData - The object or list containing items to replace. `null`/`undefined` is a no-op.
 * @returns A new object with the replaced items.
 */
export function replace<T2>(
    data: NonObjectItems | null | undefined,
    replacerData: T2,
): SpreadObjects<Record<number, unknown>, ArrayableItems<T2>>;
export function replace<T1 extends object>(
    data: T1,
    replacerData: null | undefined,
): T1;
export function replace<T1 extends object, T2 extends object>(
    data: T1,
    replacerData: T2,
): SpreadObjects<T1, ArrayableItems<T2>>;
export function replace<T1 extends object, T2 extends object>(
    data: T1,
    replacerData: T2 | null | undefined,
): T1 | SpreadObjects<T1, ArrayableItems<T2>>;
export function replace(
    data: unknown,
    replacerData: unknown,
): Record<string, unknown>;
export function replace<T1, T2>(
    data: Record<PropertyKey, T1> | unknown,
    replacerData: Record<PropertyKey, T2> | unknown,
): Record<PropertyKey, T1 | T2> {
    const result: Record<PropertyKey, T1 | T2> = {
        ...(data as Record<PropertyKey, T1>),
    };
    const replacer = arrayableItems(replacerData);

    for (const [key, value] of Object.entries(replacer)) {
        defineKey(result as Record<string, T1 | T2>, key, value as T1 | T2);
    }

    return result;
}

/**
 * Recursively replace the data items with the given items, like PHP's
 * `array_replace_recursive()` / `Collection::replaceRecursive()`.
 *
 * Builds a new object at every recursion level rather than mutating `data`. A
 * `null`/`undefined` replacer is a no-op (`CollectionTest.php:1532`). Only
 * `__proto__` is skipped on `replacerData` — the sole prototype-pollution hazard
 * (see `isUnsafeKey`, AGENTS.md:189); `constructor`/`prototype` write normally.
 *
 * @see Collection::replaceRecursive — `packages/collection/stubs/Collection.php:1181`. Wraps `array_replace_recursive`.
 *
 * @param data - The original object to replace items in. Never mutated. `null`/`undefined` is treated as empty.
 * @param replacerData - The object containing items to replace. `null`/`undefined` is a no-op.
 * @returns A new, recursively merged object.
 */
export function replaceRecursive<T2>(
    data: NonObjectItems | null | undefined,
    replacerData: T2,
): DeepMergeObjects<Record<number, unknown>, T2>;
export function replaceRecursive<T1 extends object>(
    data: T1,
    replacerData: null | undefined,
): T1;
export function replaceRecursive<T1 extends object, T2 extends object>(
    data: T1,
    replacerData: T2,
): DeepMergeObjects<T1, T2>;
export function replaceRecursive<T1 extends object, T2 extends object>(
    data: T1,
    replacerData: T2 | null | undefined,
): T1 | DeepMergeObjects<T1, T2>;
export function replaceRecursive(
    data: unknown,
    replacerData: unknown,
): Record<string, unknown>;
export function replaceRecursive<T1, T2>(
    data: Record<PropertyKey, T1> | unknown,
    replacerData: Record<PropertyKey, T2> | unknown,
): Record<PropertyKey, T1 | T2> {
    // getArrayableItems() unwraps the operand once; the merge below never unwraps a nested value.
    return mergeRecursive(
        data as Record<PropertyKey, T1>,
        arrayableItems(replacerData),
    ) as Record<PropertyKey, T1 | T2>;
}

/**
 * Merge replacer entries into a copy of the base, the way `array_replace_recursive` does.
 *
 * @param base - The list or object to merge into; never mutated
 * @param replacer - The entries that replace or merge into the base's
 * @returns A new object holding the merged entries
 */
function mergeRecursive(
    base: object,
    replacer: object,
): Record<string, unknown> {
    const source = base as Record<string, unknown>;
    const result: Record<string, unknown> = { ...source };

    for (const [key, value] of Object.entries(replacer)) {
        if (key === "__proto__") {
            continue;
        }

        const existing = result[key];

        if (
            (isArray(value) || isPlainObject(value)) &&
            (isArray(existing) || isPlainObject(existing))
        ) {
            // Lists and plain objects are PHP arrays, so they merge by key; if either was a list,
            // the result is a list again while its keys stay 0..n-1.
            const merged = mergeRecursive(existing, value);
            const isList =
                (isArray(existing) || isArray(value)) &&
                Object.keys(merged).every(
                    (mergedKey, index) => mergedKey === String(index),
                );

            defineKey(result, key, isList ? Object.values(merged) : merged);
        } else {
            // PHP recurses only into two arrays: a scalar, a Date, a Map or a class instance is replaced whole.
            defineKey(result, key, value);
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
export function reverse(data: NonObjectItems): Record<string, never>;
export function reverse<T extends object>(data: T): ReindexedObject<T>;
export function reverse(data: unknown): Record<string, unknown>;
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
export function pad<P>(
    data: NonObjectItems,
    size: number,
    value: P,
): Record<number, P>;
export function pad<T extends object, P>(
    data: T,
    size: number,
    value: P,
): RenumberedObject<T, P>;
export function pad<P>(
    data: unknown,
    size: number,
    value: P,
): Record<string | number, unknown>;
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
export function partition(
    data: NonObjectItems,
    callback: (value: unknown, key: string | number) => boolean,
): [Record<string, never>, Record<string, never>];
export function partition<T extends object>(
    data: T,
    callback: (value: ObjectValue<T>, key: ObjectKey<T>) => boolean,
): [Partial<T>, Partial<T>];
export function partition(
    data: unknown,
    callback: (value: unknown, key: string | number) => boolean,
): [Record<string, unknown>, Record<string, unknown>];
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
        if (callback(value as TValue, phpArrayKey(key) as TKey)) {
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
export function whereNotNull(data: NonObjectItems): Record<string, never>;
export function whereNotNull<T extends object>(data: T): NonNullableObject<T>;
export function whereNotNull(data: unknown): Record<string, unknown>;
export function whereNotNull<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue | null> | unknown,
): Record<TKey, TValue> {
    return where(
        data as Record<TKey, TValue | null>,
        (value): value is TValue => !isNull(value),
    ) as Record<TKey, TValue>;
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
export function contains(
    data: NonObjectItems,
    value: unknown,
    strict?: boolean,
): boolean;
export function contains<T extends object>(
    data: T,
    value: (value: ObjectValue<T>, key: ObjectKey<T>) => boolean,
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
        for (const [key, val] of Object.entries(
            data as Record<PropertyKey, TValue>,
        )) {
            if (value(val as TValue, phpArrayKey(key))) {
                // containsStrict(callback) is `! is_null($this->first($callback))`: a null match doesn't count.
                return strict ? !isNull(val) : true;
            }
        }

        return false;
    }

    if (strict) {
        return Object.values(data as Record<PropertyKey, TValue>).some((val) =>
            strictEqual(val, value),
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
export function filter(
    data: NonObjectItems | null | undefined,
    callback?: ((value: unknown, key: string | number) => boolean) | null,
): Record<string, never>;
export function filter<T extends object>(
    data: T,
    callback?: null | undefined,
): TruthyObject<T>;
export function filter<T extends object>(
    data: T,
    callback: (value: ObjectValue<T>, key: ObjectKey<T>) => boolean,
): Partial<T>;
export function filter(
    data: unknown,
    callback?: ((value: unknown, key: string | number) => boolean) | null,
): Record<string, unknown>;
export function filter<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
    callback?: ((value: TValue, key: TKey) => boolean | null) | unknown,
): Record<TKey, TValue> {
    if (!accessible(data)) {
        return {} as Record<TKey, TValue>;
    }

    const obj = data as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
        // If no callback, filter out PHP-falsy values by default
        const shouldInclude = isFunction(callback)
            ? callback(value, phpArrayKey(String(key)) as TKey)
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
export function wrap(value: null): Record<string, never>;
export function wrap<T extends NonObjectItems>(value: T): Record<0, T>;
export function wrap<T extends object>(value: T): T;
export function wrap<T>(value: T): Record<0, T>;
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
export function keys(data: NonObjectItems): [];
export function keys<T extends object>(data: T): ObjectKey<T>[];
export function keys(data: unknown): (string | number)[];
export function keys<TValue, TKey extends PropertyKey = PropertyKey>(
    data: Record<TKey, TValue> | unknown,
): (string | number)[] {
    if (!accessible(data)) {
        return [];
    }

    return Object.keys(data as Record<TKey, TValue>).map(phpArrayKey);
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
export function values(data: NonObjectItems): [];
export function values<T extends object>(data: T): ObjectValue<T>[];
export function values(data: unknown): unknown[];
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

    const obj = data as Record<TKey, TValue>;
    const otherItems = arrayableItems(other) as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
        if (
            !Object.hasOwn(otherItems, key) ||
            !phpValueMatch(otherItems[key as TKey], value)
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

    const obj = data as Record<TKey, TValue>;
    const otherItems = arrayableItems(other) as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    const otherKeys = Object.keys(otherItems) as TKey[];

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
        // Find if there's a matching key in other object using callback
        const matchingKey = otherKeys.find((otherKey) =>
            callback(
                phpArrayKey(String(key)) as TKey,
                phpArrayKey(String(otherKey)) as TKey,
            ),
        );

        // Include if: no matching key found OR matching key has different value
        if (
            matchingKey === undefined ||
            !phpValueMatch(otherItems[matchingKey], value)
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

    const obj = data as Record<TKey, TValue>;
    const otherItems = arrayableItems(other) as Record<TKey, TValue>;
    const result: Record<TKey, TValue> = {} as Record<TKey, TValue>;
    const otherKeys = Object.keys(otherItems) as TKey[];

    for (const [key, value] of Object.entries(obj) as [TKey, TValue][]) {
        // Find if there's a matching key in other object using callback
        const matchingKey = otherKeys.find((otherKey) =>
            callback(
                phpArrayKey(String(key)) as TKey,
                phpArrayKey(String(otherKey)) as TKey,
            ),
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

    if (!accessible(data)) {
        return result;
    }

    const otherItems = arrayableItems(other) as Record<PropertyKey, T2>;

    for (const [key, value] of Object.entries(
        data as Record<PropertyKey, T1>,
    )) {
        if (
            Object.hasOwn(otherItems, key) &&
            phpValueMatch(
                value as unknown,
                otherItems[key as PropertyKey] as unknown,
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

    if (!accessible(data)) {
        return result;
    }

    const otherItems = arrayableItems(other) as Record<PropertyKey, T2>;

    for (const [dataKey, dataValue] of Object.entries(
        data as Record<PropertyKey, T1>,
    )) {
        for (const [otherKey, otherValue] of Object.entries(otherItems)) {
            if (
                callback(phpArrayKey(dataKey), phpArrayKey(otherKey)) &&
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

    if (!accessible(data)) {
        return result;
    }

    const otherItems = arrayableItems(other) as Record<PropertyKey, T2>;

    for (const [key, value] of Object.entries(
        data as Record<PropertyKey, T1>,
    )) {
        if (Object.hasOwn(otherItems, key)) {
            defineKey(result as Record<string, T1>, key, value as T1);
        }
    }

    return result;
}
