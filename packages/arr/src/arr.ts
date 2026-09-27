import { SortDirection } from "@tolki/enum";
import {
    collapse as objCollapse,
    crossJoin as objCrossJoin,
    prepend as objPrepend,
    replaceRecursive as objReplaceRecursive,
    select as objSelect,
    union as objUnion,
} from "@tolki/obj";
import {
    dotFlatten,
    explodePluckPath,
    forgetKeys,
    getMixedValue,
    getNestedValue,
    getRaw,
    hasMixed,
    isCanonicalUndotIndex,
    MAX_UNDOT_INDEX,
    pushWithPath,
    resolvePluckPath,
    setMixed,
    setMixedImmutable,
    undotExpandArray,
} from "@tolki/path";
import { finish, randomInt } from "@tolki/str";
import type {
    ArrayInnerValue,
    ArrayItems,
    ArrayResolvePath,
    ArrayResolvePathOrDefault,
    ArrayResolvePathOrNull,
    CaseValue,
    CollapsedObject,
    EnsureArray,
    FlattenItemReach,
    FlattenReach,
    MapArrayKey,
    NonNullableArray,
    NonObjectItems,
    ObjectFlatValue,
    ObjectValue,
    PathKey,
    PathKeys,
    PluckValue,
    SetObjectPath,
    Simplify,
    SortSpec,
    SpreadArgs,
    TruthyArray,
    UndotArrayKey,
    UndotResult,
} from "@tolki/types";
import {
    arrayableItems,
    arrayableValues,
    arrayValueMessage,
    castableToArray,
    compareValues,
    createSortSpecComparator,
    cssListItemToString,
    defineKey,
    getAccessibleValues,
    InvalidArgumentException,
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
    isString,
    isSymbol,
    isUndefined,
    isWeakMap,
    ItemNotFoundException,
    keyedEntries,
    looseEqual,
    MultipleItemsFoundException,
    operatorMatch,
    phpArrayKey,
    phpComputedKey,
    phpSortComparator,
    phpStringCast,
    phpTypeName,
    phpValueMatch,
    phpValueMatcher,
    resolvePadLength,
    resolveSliceRange,
    resolveSpliceRange,
    resolveTakeCount,
    strictEqual,
    toPhpKeyString,
} from "@tolki/utils";

/**
 * Mutation contract: pop, shift, splice and unshift mutate their first
 * argument; every other function returns a new value. arr and obj agree
 * on this — re-read Collection.php before "aligning" one to the other.
 */

// WrapResult (wrap): a naked conditional, so a union answers a union of one-tuples rather
// than one tuple holding the whole union — wrap only ever holds one member at a time. The
// `unknown` test always holds; distribution is the whole point of writing it as a conditional.
type WrapResult<TValue> = TValue extends unknown ? [TValue] : never;

// NonBooleanValue (contains): `unknown` minus `boolean`, which no built-in operator spells.
// The `strict` row takes a boolean third argument first, so declaring `unknown` here would
// promise a form this port never runs. `contains`'s docblock names the four shapes it costs.
type NonBooleanValue =
    | string
    | number
    | bigint
    | symbol
    | object
    | null
    | undefined;

// AnyValueOr (skipUntil, skipWhile, takeUntil, takeWhile): every value, as `{} | null | undefined`; a bare `unknown`
// would absorb the callback member that types an inline callback's parameters.
type AnyValueOr<TCallback> =
    | TCallback
    | NonNullable<unknown>
    | null
    | undefined;

// CanonicalIndex (set): only an integer's canonical spelling is an array key — the rule
// PHP's key cast and this port's `phpArrayKey` both apply, so "01", "+1" and "1e1" stay
// string keys and the write leaves every element alone.
type CanonicalIndex<TSegment extends string> =
    TSegment extends `${infer TIndex extends number}`
        ? `${TIndex}` extends TSegment
            ? TSegment
            : never
        : never;
// A negative index addresses no slot of a JS list, so `Arr::set` stores it as the list's
// own property and rebuilds no element; deeper in the path it still seeds a fresh list.
type ListIndex<TSegment extends string> = TSegment extends `-${string}`
    ? never
    : CanonicalIndex<TSegment>;
type PathHead<TPath extends string> = TPath extends `${infer THead}.${string}`
    ? THead
    : TPath;

// ArraySetPath* (set): Arr::set replaces a non-record element with a fresh container before
// writing, so only a record element is merged onto. A rest starting with an index seeds a
// list instead, whose members ArraySetPathListElement types.
// `object`, not `Record<never, never>`: an empty array's element type is `never`, and the
// record seed's own index signatures rode that through into the public answer.
type ArraySetPathTarget<TValue> = [TValue] extends [never]
    ? object
    : TValue extends readonly unknown[]
      ? object
      : TValue extends object
        ? TValue
        : object;
type ArraySetPathElement<
    TValue,
    TRest extends string,
    TSetValue,
> = SetObjectPath<ArraySetPathTarget<TValue>, TRest, TSetValue>;
// KNOWN-UNSOUND: an already-list element keeps TValue[], so Arr.set([["a"],["b"]], "1.0", 5)
// answers string[][] where the runtime makes it (string | number)[][] — a value written under
// the path reads back at the wrong type. Pinned in arr-mutations.test-d.ts.
type ArraySetPathListElement<TValue> = [TValue] extends [readonly unknown[]]
    ? TValue[]
    : (TValue | unknown[])[];
// KNOWN-UNSOUND: an out-of-range canonical head pads the gap with `undefined` elements no row
// below admits. Whether the head is in range is unknowable from TValue, so widening every row
// would be wrong the other way; the limit is pinned in arr-mutations.test-d.ts instead.
type ArraySetPathResult<
    TValue,
    TPath extends string,
    TSetValue,
> = TPath extends `${infer THead}.${infer TRest}`
    ? [ListIndex<THead>] extends [never]
        ? TValue[]
        : [CanonicalIndex<PathHead<TRest>>] extends [never]
          ? [ArraySetPathElement<TValue, TRest, TSetValue>] extends [TValue]
              ? [TValue] extends [ArraySetPathElement<TValue, TRest, TSetValue>]
                  ? TValue[]
                  : (TValue | ArraySetPathElement<TValue, TRest, TSetValue>)[]
              : (TValue | ArraySetPathElement<TValue, TRest, TSetValue>)[]
          : ArraySetPathListElement<TValue>
    : TValue[];

// DotLeaf (dot): with no depth, dot() walks every non-empty list and plain object down to its leaves; an empty one, a
// Date, Map, Set, Promise or function is a leaf. A type can't tell a class instance, which the walk also keeps whole,
// from a plain object, so it walks one.
type DotLeaf<T, D extends number = 5> = [D] extends [never]
    ? unknown
    : T extends readonly (infer E)[]
      ? DotLeaf<E, DotDepth[D]> | (0 extends T["length"] ? T : never)
      : T extends NonObjectItems | Date | RegExp | Promise<unknown>
        ? T
        : T extends object
          ? [keyof T] extends [never]
              ? unknown
              :
                    | DotLeaf<ObjectValue<T>, DotDepth[D]>
                    | (Record<never, never> extends T ? T : never)
          : T;
type DotDepth = [never, 0, 1, 2, 3, 4];

// CollapseRead (collapse): an item as collapse reads it, a Collection-like one through all().
type CollapseRead<T> = T extends { all: (...args: never[]) => infer R } ? R : T;
// A list, Date, Map, Set, Promise, function or scalar item is not a plain object, so it alone never sends the list to
// obj.collapse. Each member of an item type is judged on its own: a list is assignable to Record<number, V>, so
// Exclude would drop it along with one.
type CollapseNotPlain =
    | readonly unknown[]
    | NonObjectItems
    | Date
    | RegExp
    | Promise<unknown>;
type CollapsePlain<T> =
    CollapseRead<T> extends infer U
        ? U extends CollapseNotPlain
            ? never
            : U extends object
              ? U
              : never
        : never;
type CollapseOther<T> =
    CollapseRead<T> extends infer U
        ? U extends CollapseNotPlain
            ? U
            : U extends object
              ? never
              : U
        : never;
type CollapseListItem<T> =
    CollapseRead<T> extends infer U
        ? U extends readonly (infer E)[]
            ? E
            : never
        : never;
// ArrCollapse (collapse): a plain object among the items hands the list to obj.collapse; without one, the lists' items
// are joined and any other item is skipped. An item type that may be either kind may give either answer.
type ArrCollapse<TItem> =
    | ([CollapseOther<TItem>] extends [never]
          ? never
          : CollapseListItem<TItem>[])
    | ([CollapsePlain<TItem>] extends [never]
          ? never
          : CollapsedObject<Record<number, TItem>>);

// PrependedItem (prepend): an element type that already holds the value keeps it, since TypeScript leaves a union of
// two equal object types, such as a declared row and an object literal, unmerged.
type PrependedItem<TValue, TPrependValue> = [TPrependValue] extends [TValue]
    ? TValue
    : TValue | TPrependValue;
// ListPrepend (prepend): `[$key => $value] + $list` stays a list only while the key PHP stores is 0, which replaces
// the first item; a key that may be stored as 0 may give either, and any other key gives a record.
type ListPrepend<TValue, TPrependValue, TPrependKey> = [
    MapArrayKey<TPrependKey>,
] extends [0]
    ? PrependedItem<TValue, TPrependValue>[]
    : 0 extends MapArrayKey<TPrependKey>
      ?
            | PrependedItem<TValue, TPrependValue>[]
            | Record<string | number, PrependedItem<TValue, TPrependValue>>
      : ListPrependRecord<TValue, TPrependValue, MapArrayKey<TPrependKey>>;
// An integer key lands among the list's own indices; any other key sits beside them.
type ListPrependRecord<TValue, TPrependValue, TStoredKey> = [
    Exclude<TStoredKey, number>,
] extends [never]
    ? Record<number, PrependedItem<TValue, TPrependValue>>
    : Simplify<
          Record<
              number,
              | TValue
              | ([Extract<TStoredKey, number>] extends [never]
                    ? never
                    : TPrependValue)
          > &
              Record<
                  Extract<Exclude<TStoredKey, number>, PropertyKey>,
                  TPrependValue
              >
      >;

const sortSpecComparator = createSortSpecComparator((item, key) =>
    getNestedValue(item, key as PropertyKey),
);

/**
 * Determine whether the given value is array accessible.
 *
 * @example
 *
 * accessible([]); // true
 * accessible([1, 2]); // true
 * accessible({ a: 1, b: 2 }); // false
 */
export function accessible<TValue>(value: TValue): value is TValue & unknown[] {
    return isArray(value);
}

/**
 * Determine whether the given value is arrayable.
 *
 * @example
 *
 * arrayable([]); // true
 * arrayable([1, 2]); // true
 * arrayable({ a: 1, b: 2 }); // false
 */
export function arrayable(value: unknown): value is unknown[] {
    return isArray(value);
}

/**
 * Get something that can be walked with `for...of` for the given items.
 *
 * Plain objects hold their items as properties rather than behind an iterator,
 * so they are walked through their values. This mirrors the `Arr::from()` call
 * Laravel performs before walking the items.
 *
 * @param data - The items to walk.
 * @returns The items themselves when they are already iterable, otherwise their values.
 */
function toWalkable<TValue>(data: unknown): Iterable<TValue> {
    if (isObject(data) && !isIterable(data)) {
        return Object.values(data as object) as TValue[];
    }

    return data as Iterable<TValue>;
}

/**
 * Copy the list and every container a dot path descends into, so a write through
 * one of the in-place path helpers lands only on copies the caller never held.
 *
 * @param data - The list to copy.
 * @param key - The dot path the write will follow.
 * @param throughLeaf - Whether the container named by the last segment is written into too.
 * @returns The copied list, carrying a fresh container at every descended segment.
 */
function copyAlongPath(
    data: readonly unknown[],
    key: PathKey,
    throughLeaf: boolean = false,
): unknown[] {
    const root = [...data];

    // A nullish key names no path at all: add and push both route it to their
    // whole-value form, which descends into nothing the caller still holds.
    if (isNull(key) || isUndefined(key)) {
        return root;
    }

    const segments = isString(key) ? key.split(".") : [String(key)];
    let cursor = root as unknown as Record<string, unknown>;

    for (const segment of throughLeaf ? segments : segments.slice(0, -1)) {
        // The bail below must stay in step with setMixed's own descend test: it
        // replaces an absent or non-container child wholesale, so nothing of the
        // caller's value survives below this point to be written into.
        if (!Object.hasOwn(cursor, segment)) {
            return root;
        }

        const child = cursor[segment];
        if (!isArray(child) && !isPlainObject(child)) {
            return root;
        }

        // The spread carries the elements and the length; Arr::set also stores non-index
        // keys on the list itself, so each key it missed is replayed below.
        const clone: unknown[] | Record<string, unknown> = isArray(child)
            ? [...child]
            : {};
        const source = child as Record<PropertyKey, unknown>;

        for (const name of Reflect.ownKeys(child)) {
            if (Object.hasOwn(clone, name)) {
                continue;
            }

            // Normalised data, never the source descriptor: `writable: false` would break
            // the very write this copy exists for, and a replayed accessor would leave the
            // copy reading the caller's backing store.
            Object.defineProperty(clone, name, {
                value: source[name],
                writable: true,
                enumerable: Object.prototype.propertyIsEnumerable.call(
                    child,
                    name,
                ),
                configurable: true,
            });
        }

        defineKey(cursor, segment, clone);
        cursor = clone as Record<string, unknown>;
    }

    return root;
}

/**
 * Add an element to an array using "dot" notation if it doesn't exist.
 *
 * @param data - The array to add the element to.
 * @param key - The key or dot-notated path where to add the value.
 * @param value - The value to add.
 * @returns A new array with the value added if the key didn't exist.
 *
 * @example
 *
 * add(['products', ['desk', [100]]], '1.1', 200); -> ['products', ['desk', [100, 200]]]
 * add(['products', ['desk', [100]]], '2', ['chair', [150]]); -> ['products', ['desk', [100]], ['chair', [150]]]
 */
export function add<TValue, TAddValue>(
    data: ArrayItems<TValue>,
    key: PathKey,
    value: TAddValue,
): (TValue | TAddValue)[] {
    // Arr::add asks `is_null(Arr::get(...))`, not whether the key exists, so a key already
    // holding null is written. `obj.add` already reads it that way; this row did not.
    // `undefined` counts as null here, as it does everywhere a path PHP reads as null.
    const current = getMixedValue(data, key);

    if (!isNull(current) && !isUndefined(current)) {
        return [...data];
    }

    // setMixed writes in place, so the containers it descends into are copied
    // first: only pop, shift, splice and unshift may touch the caller's value.
    return setMixed(
        copyAlongPath(data, key) as (TValue | TAddValue)[],
        key,
        value,
    );
}

/**
 * Get an array item from an array using "dot" notation.
 *
 * @param data - The array to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The array value.
 * @throws InvalidArgumentException if the value is not an array.
 *
 * @example
 *
 * arrayItem([['a', 'b'], ['c', 'd']], 0); -> ['a', 'b']
 * arrayItem([{items: ['x', 'y']}], '0.items'); -> ['x', 'y']
 * arrayItem([{items: 'not array'}], '0.items'); -> throws InvalidArgumentException
 */
// Overload: typed array + literal path → inferred array element type
export function arrayItem<
    TData extends readonly unknown[],
    TPath extends string | number,
>(data: TData, key: TPath): EnsureArray<ArrayResolvePath<TData, TPath>>;
// Overload: typed array + literal path + default → inferred type
export function arrayItem<
    TData extends readonly unknown[],
    TPath extends string | number,
    TDefault,
>(
    data: TData,
    key: TPath,
    defaultValue: TDefault | (() => TDefault) | null,
): EnsureArray<ArrayResolvePath<TData, TPath>>;
// Overload: untyped array or nullish fallback
export function arrayItem<TDefault = null>(
    data: readonly unknown[] | null | undefined,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): unknown[];
export function arrayItem<TValue, TDefault = null>(
    data: TValue[] | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): unknown[] {
    const value = getMixedValue(data, key, defaultValue);

    if (!isArray(value)) {
        throw new InvalidArgumentException(arrayValueMessage(value, key));
    }

    return value;
}

/**
 * Get a boolean item from an array using "dot" notation.
 * Throws an error if the value is not a boolean.
 *
 * @param data - The array to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The boolean value.
 * @throws InvalidArgumentException if the value is not a boolean.
 *
 * @example
 *
 * boolean([true, false], 0); -> true
 * boolean([{active: true}], '0.active'); -> true
 * boolean([{active: 'yes'}], '0.active'); -> throws InvalidArgumentException
 */
// Overload: typed array → boolean value
export function boolean<TValue, TDefault = null>(
    data: ArrayItems<TValue>,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): boolean;
// Overload: untyped array or nullish fallback
export function boolean<TDefault = null>(
    data: readonly unknown[] | null | undefined,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): boolean;
// Implementation
export function boolean<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): boolean {
    const value = getMixedValue(data, key, defaultValue);

    if (!isBoolean(value)) {
        throw new InvalidArgumentException(
            `Array value for key [${key}] must be a boolean, ${phpTypeName(value)} found.`,
        );
    }

    return value;
}

/**
 * Chunk the array into chunks of the given size.
 *
 * @see Collection::chunk — `packages/collection/stubs/Collection.php:1533`. Wraps `array_chunk`.
 *
 * @param data - The array to chunk
 * @param size - The size of each chunk
 * @param preserveKeys - Whether to key each chunk by its source index instead of reindexing it;
 *   defaults to false, since a JS array's own keys are already just its indices
 * @returns Chunked array
 */
export function chunk<TValue>(
    data: ArrayItems<TValue>,
    size: number,
    preserveKeys?: false | undefined,
): TValue[][];
export function chunk<TValue>(
    data: ArrayItems<TValue>,
    size: number,
    preserveKeys: true | undefined,
): Record<number, TValue>[];
export function chunk<TValue>(
    data: ArrayItems<TValue>,
    size: number,
    preserveKeys: boolean | undefined,
): TValue[][] | Record<number, TValue>[];
export function chunk<TValue>(
    data: ArrayItems<TValue>,
    size: number,
    preserveKeys?: boolean,
): TValue[][] | Record<number, TValue>[] {
    if (size <= 0) {
        return [];
    }

    if (preserveKeys) {
        const chunks: Record<number, TValue>[] = [];

        for (let i = 0; i < data.length; i += size) {
            const entries = data
                .slice(i, i + size)
                .map((value, index): [number, TValue] => [i + index, value]);

            chunks.push(Object.fromEntries(entries) as Record<number, TValue>);
        }

        return chunks;
    }

    const chunks: TValue[][] = [];

    for (let i = 0; i < data.length; i += size) {
        const chunk = data.slice(i, i + size);
        chunks.push(chunk);
    }

    return chunks;
}

/**
 * Chunk the array into chunks with a callback.
 *
 * @see Collection::chunkWhile — `packages/collection/stubs/Collection.php:1554`, which runs
 *      `LazyCollection::chunkWhile`. Chunks are reindexed, as `chunk` does.
 *
 * @param data - The array to chunk
 * @param callback - Receives the value, its index and the chunk built so far; return true to keep appending
 * @returns The chunked array
 *
 * @example
 *
 * chunkWhile(['A', 'A', 'B'], (value, index, chunk) => chunk.at(-1) === value); -> [['A', 'A'], ['B']]
 */
export function chunkWhile<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number, chunk: TValue[]) => unknown,
): TValue[][] {
    const chunks: TValue[][] = [];
    let chunk: TValue[] = [];

    for (const [index, value] of data.entries()) {
        if (chunk.length > 0 && isPhpFalsy(callback(value, index, chunk))) {
            chunks.push(chunk);
            chunk = [];
        }

        chunk.push(value);
    }

    if (chunk.length > 0) {
        chunks.push(chunk);
    }

    return chunks;
}

/**
 * Chunk the array into chunks by comparing adjacent values using the given key or callback.
 *
 * @see EnumeratesValues::chunkBy — `packages/collection/stubs/EnumeratesValues.php:939`.
 *      Adjacent values compare with PHP's `==`, so `1` and `"1"` share a chunk.
 *
 * @param data - The array to chunk
 * @param key - A path into each item, or a callback receiving the value and its index
 * @returns The chunked array
 *
 * @example
 *
 * chunkBy([1, 1, 2, 2, 1], (value) => value); -> [[1, 1], [2, 2], [1]]
 * chunkBy([{ p: 'a' }, { p: 'a' }, { p: 'b' }], 'p'); -> [[{ p: 'a' }, { p: 'a' }], [{ p: 'b' }]]
 */
export function chunkBy<TValue>(
    data: ArrayItems<TValue>,
    key: PathKey | ((value: TValue, index: number) => unknown),
): TValue[][] {
    // isFunction's predicate is generic, so name the retriever's type rather than let the guard narrow it.
    const retrieve: (value: TValue, index: number) => unknown = isFunction(key)
        ? (key as (value: TValue, index: number) => unknown)
        : (value) =>
              isNull(key) || isUndefined(key)
                  ? value
                  : getNestedValue(value, key as string);

    // chunkWhile invokes the callback before pushing `value`, and even a reset pushes
    // within the same iteration, so at iteration `index` chunk is never empty and its
    // last item is always data[index - 1] (array-only: object ports must carry the key).
    return chunkWhile(data, (value, index, chunk) =>
        looseEqual(
            retrieve(value, index),
            retrieve(chunk[chunk.length - 1] as TValue, index - 1),
        ),
    );
}

/**
 * Collapse an array of arrays into a single array, or an array of objects into a single object.
 *
 * Once any item is a plain object, the result is `array_merge`'s: list values append under the next
 * integer key, integer keys renumber and a later string key wins. A Collection-like item, a class
 * instance with an `all()` method, unwraps through it; a plain object is data whatever members it has.
 * Any other item that isn't a plain object or a list is skipped, as `Arr::collapse` skips a PHP
 * object: a `Date`, a `Map` or a class instance.
 *
 * @param data - The array to collapse.
 * @returns A new flattened array or merged object.
 *
 * @example
 *
 * collapse([[1], [2], [3], ['foo', 'bar']]); -> [1, 2, 3, 'foo', 'bar']
 * collapse([{ a: 1, b: 2 }, { c: 3, d: 4 }]) -> { a: 1, b: 2, c: 3, d: 4 }
 * collapse([[1, 2], { x: 1 }]) -> { 0: 1, 1: 2, x: 1 }
 */
export function collapse<TValue>(data: TValue[][]): TValue[];
export function collapse<TValue extends ArrayItems<ArrayItems<unknown>>>(
    data: TValue,
): ArrayInnerValue<TValue[number]>[];
// A list of objects: a Collection-like item is read through all(), and ArrCollapse answers what the runtime gives.
export function collapse<TItem extends object>(
    data: ArrayItems<TItem>,
): ArrCollapse<TItem>;
export function collapse<TValue extends ArrayItems<unknown>>(
    data: TValue,
): Record<string, unknown> | ArrayInnerValue<TValue[number]>[] | unknown[];
export function collapse<TValue extends ArrayItems<unknown>>(
    data: TValue,
): Record<string, unknown> | ArrayInnerValue<TValue[number]>[] | unknown[] {
    // Arr::collapse merges a Collection item's items; a plain object models a PHP array, so an
    // `all` member on one is data.
    const items = data.map((item) =>
        !isPlainObject(item) && isObject(item) && isFunction(item["all"])
            ? item["all"]()
            : item,
    );

    // A plain object among the items is a PHP map, making array_merge's result one; obj.collapse runs that merge.
    if (items.some((item) => isPlainObject(item))) {
        return objCollapse({ ...data } as Record<
            number,
            Record<PropertyKey, unknown> | unknown[]
        >);
    }

    const out: unknown[] = [];
    for (const item of items) {
        if (isArray(item)) {
            out.push(...item);
        }
    }

    return out;
}

/**
 * Combine an array of keys with an array of values into an object, like PHP's
 * `array_combine()` / `Collection::combine()` (`Collection.php:936`).
 *
 * Each key is cast with `toPhpKeyString()`, matching `array_combine`'s key rules, so the
 * result's key type is always `string` rather than `PropertyKey`. `values` is read by
 * `arrayableValues`, so a keyed or Collection-like operand contributes its values in order.
 *
 * @see Collection::combine — `packages/collection/stubs/Collection.php:936`. Wraps `array_combine`.
 *
 * @param keys - The keys.
 * @param values - The values, matched to `keys` by position.
 * @returns A new object mapping each key to its corresponding value.
 * @throws Error if `keys` and `values` do not have the same length.
 */
export function combine<TKey, TValue>(
    keys: ArrayItems<TKey>,
    values: ArrayItems<TValue> | Record<PropertyKey, TValue>,
): Record<string, TValue> {
    const valueList = arrayableValues<TValue>(values);

    if (keys.length !== valueList.length) {
        throw new Error(
            "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
        );
    }

    const result: Record<string, TValue> = {};

    for (let i = 0; i < keys.length; i++) {
        defineKey(result, toPhpKeyString(keys[i]), valueList[i] as TValue);
    }

    return result;
}

/**
 * Cross join the given arrays, returning all possible permutations.
 * Each argument is one dimension. The rows are array-shaped so keyed dimensions
 * fall through to `objCrossJoin`, which walks them like PHP's `foreach`.
 *
 * @param arrays - The arrays to cross join.
 * @return A new array with all combinations of the input arrays.
 *
 * @example
 *
 * crossJoin([1], ["a"]); -> [[1, 'a']]
 * crossJoin([1, 2], ["x", "y"]); -> [[1, 'x'], [1, 'y'], [2, 'x'], [2, 'y']]
 */
export function crossJoin(): unknown[][];
export function crossJoin<A>(a: readonly A[]): [A][];
export function crossJoin<A, B>(a: readonly A[], b: readonly B[]): [A, B][];
export function crossJoin<A, B, C>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
): [A, B, C][];
export function crossJoin<A, B, C, D>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
): [A, B, C, D][];
export function crossJoin<A, B, C, D, E>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
    e: readonly E[],
): [A, B, C, D, E][];
export function crossJoin<A, B, C, D, E, F>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
    e: readonly E[],
    f: readonly F[],
): [A, B, C, D, E, F][];
export function crossJoin(
    ...arrays: readonly (readonly unknown[])[]
): unknown[][];
export function crossJoin(...arrays: readonly object[]): unknown[][] {
    // Keying each argument by its position makes obj's rows list their values in argument order.
    return objCrossJoin(
        ...arrays.map((dimension, index) => ({ [index]: dimension })),
    ).map((row) => Object.values(row));
}

/**
 * Divide an array into two arrays. One with keys and the other with values.
 *
 * @param array - The array to divide.
 * @return A tuple with an array of keys and an array of values.
 *
 * @example
 *
 * divide(["Desk", 100, true]); -> [[0, 1, 2], ['Desk', 100, true]]
 */
export function divide(array: readonly []): [number[], unknown[]];
export function divide<TValue>(array: readonly TValue[]): [number[], TValue[]];
export function divide<TValue>(array: readonly TValue[]): [number[], TValue[]] {
    const keys = array.map((_, i) => i);
    return [keys, array.slice() as TValue[]];
}

/**
 * Flatten a multi-dimensional array with "dot" notation.
 *
 * @param data - The array or to flatten.
 * @param prepend - An optional string to prepend to each key.
 * @param depth - Maximum depth to flatten. Defaults to Infinity.
 * @returns A new object with dot-notated keys.
 *
 * @example
 *
 * dot(['a', ['b', 'c']]); -> { '0': 'a', '1.0': 'b', '1.1': 'c' }
 */
export function dot<TValue>(
    data: readonly TValue[],
    prepend?: string,
): Record<string, DotLeaf<TValue>>;
// A depth may stop at any level, a depth of 0 before the items themselves, so each may be a value.
export function dot<TValue>(
    data: readonly TValue[],
    prepend: string,
    depth?: number,
): Record<string, FlattenReach<TValue>>;
export function dot<TValue>(
    data: readonly unknown[] | null | undefined,
    prepend?: string,
    depth?: number,
): Record<string, TValue>;
export function dot<TValue>(
    data: ArrayItems<TValue> | unknown,
    prepend: string = "",
    depth: number = Infinity,
): Record<string, TValue> {
    return dotFlatten(data, prepend, depth);
}

/**
 * Whether every dot segment of `key` is a usable array index, matching the
 * test `undotExpandArray` applies before it will build anything from a key.
 *
 * @param key - The dot-notated key to check.
 * @returns True if every segment of `key` is a canonical array index.
 */
function isArrayIndexPath(key: string): boolean {
    return key.split(".").every(isCanonicalUndotIndex);
}

/**
 * Convert a flatten "dot" notation object into an expanded array.
 *
 * Only accepts numeric-first dotted keys — use `Obj.undot` for anything else.
 *
 * @param map - The flat object with numeric-first dot-notated keys.
 * @returns A new multi-dimensional array.
 * @throws TypeError if any key segment isn't a canonical decimal integer within
 * MAX_UNDOT_INDEX, or the resulting containers would exceed that budget.
 *
 * @example
 *
 * undot({ '0': 'a', '1.0': 'b', '1.1': 'c' }); -> ['a', ['b', 'c']]
 */
export function undot<TValue, TKey extends UndotArrayKey = number>(
    map: Record<TKey, TValue>,
): UndotResult<TKey, TValue> {
    // Sum each distinct container's own max index once, keyed by its prefix path -
    // summing leaf keys instead treats each as its own container, costing O(n^2)
    // on a flat array. Summing max INDEX (not slot count) agrees with the gate above.
    const containerMax = new Map<string, number>();
    let totalIndex = 0;

    // A Map's keys are not its own properties, so they are read through its entries.
    for (const [key] of keyedEntries(map ?? {})) {
        if (!isArrayIndexPath(key)) {
            throw new TypeError(
                `Arr.undot cannot build an array from the key "${key}": every dot segment must be a canonical decimal integer (no leading zeros, sign, or exponent) from 0 up to ${MAX_UNDOT_INDEX}. Use Obj.undot for string keys.`,
            );
        }

        const segments = key.split(".");
        for (let i = 0; i < segments.length; i++) {
            const containerPath = segments.slice(0, i).join(".");
            const index = Number(segments[i]);
            const previousMax = containerMax.get(containerPath) ?? 0;

            if (index <= previousMax) {
                continue;
            }

            totalIndex += index - previousMax;
            containerMax.set(containerPath, index);

            if (totalIndex > MAX_UNDOT_INDEX) {
                throw new TypeError(
                    `Arr.undot cannot build an array: these keys' combined container indices exceed the ${MAX_UNDOT_INDEX} budget.`,
                );
            }
        }
    }

    return undotExpandArray(map) as UndotResult<TKey, TValue>;
}

/**
 * Union multiple arrays, mirroring PHP's `+` operator: a KEY union, not a
 * value union, folded left-to-right — the first array to occupy an index
 * keeps it. Not `array_merge`/`Collection::merge`, which concatenates.
 *
 * @see Collection::union — `packages/collection/stubs/Collection.php:947`.
 *      Uses PHP's `+` operator (key union: left keys win), not `array_merge`.
 *
 * A `null`/`undefined` operand contributes nothing, matching the
 * `(array) null` cast `getArrayableItems` performs before the `+`. The rows are
 * array-shaped so keyed operands fall through to `objUnion`; at runtime such an
 * operand still joins by key — each integer key fills that index if it is free,
 * an index no operand fills holds `undefined`, and a string key, which a list
 * can't hold, is dropped.
 *
 * @param arrays - The arrays to union.
 * @returns A new array combining each array's indices, left-most wins.
 */
export function union(): unknown[];
export function union<A>(a: readonly A[]): A[];
export function union<A, B>(a: readonly A[], b: readonly B[]): (A | B)[];
export function union<A, B, C>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
): (A | B | C)[];
export function union<A, B, C, D>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
): (A | B | C | D)[];
export function union<A, B, C, D, E>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
    e: readonly E[],
): (A | B | C | D | E)[];
export function union<A, B, C, D, E, F>(
    a: readonly A[],
    b: readonly B[],
    c: readonly C[],
    d: readonly D[],
    e: readonly E[],
    f: readonly F[],
): (A | B | C | D | E | F)[];
export function union(
    ...arrays: (readonly unknown[] | null | undefined)[]
): unknown[];
export function union(
    ...arrays: (readonly unknown[] | object | null | undefined)[]
): unknown[] {
    return unionValues(...arrays);
}

/**
 * The body of `union`, reachable from inside `arr` with a keyed operand —
 * `prepend` builds one to mirror PHP's `[$key => $value] + $array`.
 *
 * @param arrays - The operands to union.
 * @returns A new array combining each operand's indices, left-most wins.
 */
function unionValues(
    ...arrays: (readonly unknown[] | object | null | undefined)[]
): unknown[] {
    // Every operand joins by key exactly as obj.union joins it, so the two backings can't drift apart;
    // this only turns obj's index-keyed result back into a list.
    const merged = objUnion(...arrays) as Record<string, unknown>;
    const result: unknown[] = [];

    for (const [key, value] of Object.entries(merged)) {
        if (!isIntegerLikeKey(key)) {
            continue;
        }

        while (result.length < Number(key)) {
            result.push(undefined);
        }

        result.push(value);
    }

    return result;
}

/**
 * Prepend one or more items to the beginning of the array, mutating it in
 * place, like PHP's array_unshift.
 * Undefined items are skipped.
 *
 * @see Collection::unshift — `packages/collection/stubs/Collection.php:1096`.
 *      Wraps `array_unshift`; mutates.
 *
 * @param data - The array to prepend items to. Mutated in place.
 * @param items - The items to prepend.
 * @returns The same array reference, mutated.
 */
export function unshift<TValue>(data: TValue[]): TValue[];
export function unshift<TValue, A>(data: TValue[], a: A): (TValue | A)[];
export function unshift<TValue, A, B>(
    data: TValue[],
    a: A,
    b: B,
): (TValue | A | B)[];
export function unshift<TValue, A, B, C>(
    data: TValue[],
    a: A,
    b: B,
    c: C,
): (TValue | A | B | C)[];
export function unshift<TValue, A, B, C, D>(
    data: TValue[],
    a: A,
    b: B,
    c: C,
    d: D,
): (TValue | A | B | C | D)[];
export function unshift<TValue>(data: TValue[], ...items: unknown[]): unknown[];
export function unshift<TValue>(
    data: TValue[],
    ...items: unknown[]
): unknown[] {
    // Mutating a prototype object in place is a write every inheritor sees,
    // so refuse it rather than prepend onto a shared global.
    if (isPrototypeObject(data)) {
        return data;
    }

    // array_unshift prepends every argument it is handed, and obj.unshift and both
    // Collection.unshift backings keep an undefined one; only this row dropped it.
    data.unshift(...(items as TValue[]));

    return data;
}

/**
 * Get all of the given array except for a specified array of keys.
 *
 * @param  data - The array to remove items from.
 * @param  keys - The keys of the items to remove.
 * @returns A new array with the specified items removed.
 *
 * @example
 *
 * except(["a", "b", "c"], 1); -> ['a', 'c']
 * except(["a", "b", "c"], [0, 2]); -> ['b']
 */
export function except<TValue>(
    data: readonly TValue[],
    keys: PathKeys,
): TValue[] {
    return forget(data, keys);
}

/**
 * Get all of the given array except for a specified array of values.
 *
 * @param data - The array to filter.
 * @param values - The value(s) to exclude from the array.
 * @param strict - Whether to use strict comparison (default: false).
 * @returns A new array with the specified values removed.
 *
 * @example
 *
 * exceptValues(['foo', 'bar', 'baz', 'qux'], ['foo', 'baz']); -> [1 => 'bar', 3 => 'qux']
 * exceptValues([1, 2, 3, 4, 5], [3, 4]); -> [0 => 1, 1 => 2, 4 => 5]
 * exceptValues([1, '1', 2, '2', 3], [1, 2, 3], true); -> [1 => '1', 3 => '2']
 */
export function exceptValues<TValue>(
    data: readonly TValue[],
    values: TValue | readonly TValue[],
    strict: boolean = false,
): TValue[] {
    const valueArray = isArray(values) ? values : [values];

    return data.filter((value) => {
        return !valueArray.some((v) =>
            strict ? value === v : looseEqual(value, v),
        );
    });
}

/**
 * Determine if the given key exists in the provided data structure.
 *
 * @param  data - array to check
 * @param  key  - key to check for
 * @returns True if the key exists, false otherwise.
 *
 * @example
 *
 * exists([1, 2, 3], 0); -> true
 * exists([1, 2, 3], 3); -> false
 * exists([1, 2, 3], '01'); -> false
 */
export function exists<TValue>(data: readonly TValue[], key: PathKey): boolean {
    // Arr::exists casts a null or float key to string; a list holds only canonical integer keys, so "01" misses.
    const index = phpArrayKey(toPhpKeyString(key));

    return isNumber(index) && Object.hasOwn(data, index);
}

/**
 * Get the first element of an array or iterable.
 * Optionally pass a callback to find the first matching element.
 *
 * @param data - The array or iterable to search through.
 * @param callback - Optional callback function to test elements.
 * @param defaultValue - Value to return if no element is found.
 * @returns The first element or default value.
 *
 * @example
 *
 * first([1, 2, 3]); -> 1
 * first([]); -> null
 * first([], null, 'default'); -> 'default'
 * first([1, 2, 3], x => x > 1); -> 2
 * first([1, 2, 3], x => x > 5, 'none'); -> 'none'
 */
// Overload: array type with callback for proper type inference
export function first<TValue, TFirstDefault = null>(
    data: TValue[],
    callback: (value: TValue, key: number) => unknown,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: array type without callback
export function first<TValue, TFirstDefault = null>(
    data: TValue[],
    callback?: null | undefined,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: iterable with callback for proper type inference
export function first<TValue, TFirstDefault = null>(
    data: Iterable<TValue>,
    callback: (value: TValue, key: number) => unknown,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: iterable without callback
export function first<TValue, TFirstDefault = null>(
    data: Iterable<TValue>,
    callback?: null | undefined,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: iterable whose callback is only known as "a callback or null" —
// neither iterable row above accepts that union, and the fallback row is
// array-shaped so the dispatch can hand keyed data to obj.
export function first<TValue, TFirstDefault = null>(
    data: Iterable<TValue>,
    callback?: ((value: TValue, key: number) => unknown) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: untyped array or nullish fallback
export function first<TValue, TFirstDefault = null>(
    data: readonly unknown[] | null | undefined,
    callback?: ((value: TValue, key: number) => unknown) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Implementation
export function first<TValue, TFirstDefault = null>(
    data: ArrayItems<TValue> | unknown,
    callback?: ((value: TValue, key: number) => unknown) | null,
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

    if (isNull(data) || isUndefined(data)) {
        return resolveDefault();
    }

    const isArrayable = isArray(data);
    const iterable: Iterable<TValue> = isArrayable
        ? (data as readonly TValue[])
        : toWalkable<TValue>(data);

    // No callback: just return first element if it exists.
    if (!callback) {
        if (isArrayable) {
            const arr = data as readonly TValue[];
            if (arr.length === 0) {
                return resolveDefault();
            }

            // After length check arr[0] is defined
            return arr[0] as TValue;
        }

        for (const item of iterable) {
            return item; // first
        }

        return resolveDefault();
    }

    // Convert to array to ensure we can iterate properly with callback
    const array = fromItems(data);

    if (!isArray(array)) {
        // If from() returns an object, iterate over values
        let index = 0;
        for (const value of Object.values(array)) {
            if (!isPhpFalsy(callback(value as TValue, index++))) {
                return value as TValue;
            }
        }

        return resolveDefault();
    }

    let index = 0;
    for (const item of array) {
        if (!isPhpFalsy(callback(item as TValue, index++))) {
            return item as TValue;
        }
    }

    return resolveDefault();
}

/**
 * Get the last element of an array or iterable.
 * Optionally pass a callback to find the last matching element.
 *
 * @param data - The array or iterable to search through.
 * @param callback - Optional callback function to test elements.
 * @param defaultValue - Value to return if no element is found.
 * @returns The last element or default value.
 *
 * @example
 *
 * last([1, 2, 3]); -> 3
 * last([]); -> null
 * last([], null, 'default'); -> 'default'
 * last([1, 2, 3], x => x < 3); -> 2
 * last([1, 2, 3], x => x > 5, 'none'); -> 'none'
 */
// Overload: array type with callback for proper type inference
export function last<TValue, TFirstDefault = null>(
    data: TValue[],
    callback: (value: TValue, key: number) => unknown,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: array type without callback
export function last<TValue, TFirstDefault = null>(
    data: TValue[],
    callback?: null | undefined,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: iterable with callback for proper type inference
export function last<TValue, TFirstDefault = null>(
    data: Iterable<TValue>,
    callback: (value: TValue, key: number) => unknown,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: iterable without callback
export function last<TValue, TFirstDefault = null>(
    data: Iterable<TValue>,
    callback?: null | undefined,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: iterable whose callback is only known as "a callback or null" —
// neither iterable row above accepts that union, and the fallback row is
// array-shaped so the dispatch can hand keyed data to obj.
export function last<TValue, TFirstDefault = null>(
    data: Iterable<TValue>,
    callback?: ((value: TValue, key: number) => unknown) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Overload: untyped array or nullish fallback
export function last<TValue, TFirstDefault = null>(
    data: readonly unknown[] | null | undefined,
    callback?: ((value: TValue, key: number) => unknown) | null,
    defaultValue?: TFirstDefault | (() => TFirstDefault),
): TValue | TFirstDefault | null;
// Implementation
export function last<TValue, TFirstDefault = null>(
    data: ArrayItems<TValue> | unknown,
    callback?: ((value: TValue, key: number) => unknown) | null,
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

    if (isNull(data) || isUndefined(data)) {
        return resolveDefault();
    }

    const isArrayable = isArray(data);
    const iterable: Iterable<TValue> = isArrayable
        ? (data as readonly TValue[])
        : toWalkable<TValue>(data);

    // No callback case
    if (!callback) {
        if (isArrayable) {
            const arr = data as readonly TValue[];
            if (arr.length === 0) {
                return resolveDefault();
            }

            return arr[arr.length - 1] as TValue;
        }

        // Generic iterable: iterate to the end
        let last: TValue | undefined; // track last seen
        let seen = false;
        for (const item of iterable) {
            last = item;
            seen = true;
        }

        return seen ? (last as TValue) : resolveDefault();
    }

    if (isArrayable) {
        const arr = data as readonly TValue[];
        for (let i = arr.length - 1; i >= 0; i--) {
            if (!isPhpFalsy(callback(arr[i] as TValue, i))) {
                return arr[i] as TValue;
            }
        }

        return resolveDefault();
    }

    // Non-array iterable: iterate forward keeping last match
    let index = 0;
    let found = false;
    let candidate: TValue | undefined;
    for (const item of iterable) {
        if (!isPhpFalsy(callback(item, index))) {
            candidate = item;
            found = true;
        }

        index++;
    }

    return found ? (candidate as TValue) : resolveDefault();
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
 * take([1, 2, 3, 4, 5], 2); -> [1, 2]
 * take([1, 2, 3, 4, 5], -2); -> [4, 5]
 * take([1, 2, 3], 5); -> [1, 2, 3]
 */
export function take<TValue>(
    data: readonly TValue[] | null | undefined,
    limit: number,
): TValue[] {
    if (!data || limit === 0) {
        return [];
    }

    const length = data.length;
    if (length === 0) {
        return [];
    }

    // Positive: first N
    if (limit > 0) {
        if (limit >= length) {
            return data.slice();
        }

        return data.slice(0, limit);
    }

    // Negative: last abs(N)
    const count = Math.abs(limit);
    if (count >= length) {
        return data.slice();
    }

    return data.slice(length - count);
}

/**
 * Flatten a multi-dimensional array into a single level.
 *
 * Only arrays and plain objects are flattened, along with the items of a Collection-like item (a class instance
 * with an `all()` method); any other object, a `Date`, `Map` or class instance included, is kept as a value.
 * A plain object is data whatever members it has, so its `all` member is one of its values.
 * TypeScript cannot tell a class instance from a plain object, so a class instance item is typed as walked while the
 * runtime keeps it whole.
 *
 * @param data The array to flatten.
 * @param depth Maximum depth to flatten. Use Infinity for full flattening.
 * @returns A new flattened array.
 *
 * @example
 *
 * flatten([1, [2, [3, 4]], 5]); -> [1, 2, 3, 4, 5]
 * flatten([1, [2, [3, 4]], 5], 1); -> [1, 2, [3, 4], 5]
 */
// With no depth every level flattens, a plain object to its values. A depth may stop sooner, so each item may then
// leave any value below it.
export function flatten<TValue>(
    data: ArrayItems<TValue>,
): ObjectFlatValue<TValue>[];
// TypeScript cannot tell a class instance from a plain object, so a class instance item is typed as walked while the
// runtime keeps it whole.
export function flatten<TValue>(
    data: ArrayItems<TValue>,
    depth?: number,
): FlattenItemReach<TValue>[];
export function flatten(
    data: readonly unknown[] | null | undefined,
    depth?: number,
): unknown[];
export function flatten<TValue>(
    data: ArrayItems<TValue> | unknown,
    depth: number = Infinity,
): TValue[] {
    const result: TValue[] = [];

    if (!accessible(data)) {
        return result;
    }

    for (const entry of data as ArrayItems<unknown>) {
        // Arr::flatten flattens a Collection item's items, and only an array otherwise; a plain
        // object models a PHP array, so an `all` member on one is data.
        const item =
            !isPlainObject(entry) && isObject(entry) && isFunction(entry["all"])
                ? entry["all"]()
                : entry;

        if (!isArray(item) && !isPlainObject(item)) {
            result.push(item as TValue);

            continue;
        }

        // A plain object models a PHP associative array, which flattens to its values.
        const values: unknown[] = isArray(item) ? item : Object.values(item);

        for (const value of depth === 1 ? values : flatten(values, depth - 1)) {
            result.push(value as TValue);
        }
    }

    return result;
}

/**
 * Flip the indices and values of an array.
 *
 * @param data - The array of items to flip
 * @return - the data items flipped
 *
 * @example
 * flip(['a', 'b', 'c']); -> {a: 0, b: 1, c: 2}
 * flip(['a', 1, null, false, true, 1.5, [], {}]); -> {a: 0, 1: 1}
 */
// Overload: typed array → flipped record
export function flip<TValue>(data: ArrayItems<TValue>): Record<string, number>;
// Overload: untyped array or nullish fallback
export function flip(
    data: readonly unknown[] | null | undefined,
): Record<string, number>;
// Implementation
export function flip<TValue>(
    data: readonly TValue[] | unknown,
): Record<string, number> {
    if (!accessible(data)) {
        return {};
    }

    // flip the array indices as values and values as keys,
    // skipping values that are not valid PHP array keys
    // e.g ['apple', 'banana', 'cherry'] -> {apple: 0, banana: 1, cherry: 2}
    const result: Record<string, number> = {};

    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (isPhpArrayKey(item)) {
            defineKey(result, String(item), i);
        }
    }

    return result;
}

/**
 * Get a float item from an array using "dot" notation.
 * Throws an error if the value is not a number.
 *
 * Known divergence: PHP's `is_float()` rejects a whole-number int (`Arr::float`
 * throws on `1`, see docs/php-parity/task-17-second-review.json, "Arr::float
 * rejects a whole-number int"). JS has one number type, so `isNumber` accepts
 * it — narrowing to reject whole numbers would also reject `1.0`.
 *
 * @param data - The array to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The float value.
 * @throws InvalidArgumentException if the value is not a number.
 *
 * @example
 *
 * float([1.5, 2.3], 1); -> 2.3
 * float([{price: 19.99}], '0.price'); -> 19.99
 * float([{price: 'free'}], '0.price'); -> throws InvalidArgumentException
 */
// Overload: typed array → float value
export function float<TValue, TDefault = null>(
    data: ArrayItems<TValue>,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): number;
// Overload: untyped array or nullish fallback
export function float<TDefault = null>(
    data: readonly unknown[] | null | undefined,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): number;
// Implementation
export function float<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): number {
    const value = getMixedValue(data, key, defaultValue);

    // Accept both integers and floats as valid numbers
    if (!isNumber(value)) {
        throw new InvalidArgumentException(
            `Array value for key [${key}] must be a float, ${phpTypeName(value)} found.`,
        );
    }

    return value;
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
 * forget(['products', ['desk', [100]]], null); -> ['products', ['desk', [100]]]
 * forget(['products', ['desk', [100]]], '1'); -> ['products']
 * forget(['products', ['desk', [100]]], 1); -> ['products']
 * forget(['products', ['desk', [100]]], '1.1'); -> ['products', ['desk']]
 * forget(['products', ['desk', [100]]], 2); -> ['products', ['desk', [100]]]
 */
export function forget<TValue>(
    data: ArrayItems<TValue>,
    keys: PathKeys,
): TValue[] {
    return forgetKeys(data, keys) as TValue[];
}

/**
 * Get the underlying array or object of items from the given argument.
 * The rows are array- and iterable-shaped so a plain object falls through to
 * `objFrom`, which is the backing that keeps its keys.
 *
 * @param items The array, Map, or iterable to extract from.
 * @returns The underlying array or object.
 *
 * @example
 *
 * from([1, 2, 3]); -> [1, 2, 3]
 * from(new Map([['foo', 'bar']])); -> { foo: 'bar' }
 * from(new Set([1, 2])); -> [1, 2]
 *
 * @throws InvalidArgumentException if items is a scalar value.
 * @throws Error if items is a WeakMap, whose values JavaScript cannot enumerate.
 */
export function from<TValue>(items: ArrayItems<TValue>): TValue[];
export function from<TValue, TKey extends PropertyKey = PropertyKey>(
    items: Map<PropertyKey, TValue>,
): Record<TKey, TValue>;
export function from(
    items: number | string | boolean | symbol | null | undefined,
): never;
export function from<TValue>(items: Iterable<TValue>): TValue[];
export function from(items: readonly unknown[] | Iterable<unknown>): unknown[];
export function from(items: unknown): unknown {
    return fromItems(items);
}

/**
 * The body of `from`, reachable from inside `arr` with any shape — the public
 * rows are array- and iterable-shaped, but `first` normalizes keyed data too.
 *
 * @param items - The value to convert.
 * @returns The underlying array, or the object itself when it is keyed.
 */
function fromItems(items: unknown): unknown[] | Record<string, unknown> {
    // Arrays
    if (isArray(items)) {
        return items.slice();
    }

    // Map -> plain object
    if (isMap(items)) {
        const out: Record<string, unknown> = {};

        for (const [k, v] of items as Map<PropertyKey, unknown>) {
            defineKey(out, String(k), v);
        }

        return out;
    }

    // WeakMap cannot be iterated in JS environments
    if (isWeakMap(items)) {
        throw new Error(
            "WeakMap values cannot be enumerated in JavaScript; cannot convert to array of values.",
        );
    }

    // Any other iterable (generators, Sets, iterators) -> array of values
    if (isIterable(items)) {
        return [...items];
    }

    // Plain objects (including new Object(...))
    if (!isNull(items) && isObject(items)) {
        return items as Record<string, unknown>;
    }

    // Scalars not supported
    throw new InvalidArgumentException(
        "Items cannot be represented by a scalar value.",
    );
}

/**
 * Get an item from an array using numeric-only dot notation.
 *
 * @param  array - The array to get the item from.
 * @param  key - The key or dot-notated path of the item to get.
 * @param  defaultValue - The default value if key is not found
 * @returns The value or the default
 *
 * @example
 *
 * get(['foo', 'bar', 'baz'], 1); -> 'bar'
 * get(['foo', 'bar', 'baz'], null); -> ['foo', 'bar', 'baz']
 * get(['foo', 'bar', 'baz'], 9, 'default'); -> 'default'
 */
export function get<TValue>(array: TValue[], key: null | undefined): TValue[];
// Overload: literal path + default → resolved path type (trusts literal paths;
// adds | TDefault only for non-literal paths that can't be verified)
export function get<
    TData extends readonly unknown[],
    TPath extends string | number,
    TDefault,
>(
    array: TData,
    key: TPath,
    defaultValue: TDefault | (() => TDefault),
): ArrayResolvePathOrDefault<TData, TPath, TDefault>;
export function get<TValue, TDefault>(
    array: TValue[],
    key: PathKey,
    defaultValue: TDefault | (() => TDefault),
): TValue | TDefault;
// Overload: literal path → resolved path type (no | null when path resolves to
// a specific type; adds | null when path falls back to element type, matching
// TS array access conventions where resolved paths are trusted)
export function get<
    TData extends readonly unknown[],
    TPath extends string | number,
>(array: TData, key: TPath): ArrayResolvePathOrNull<TData, TPath>;
export function get<TValue>(array: TValue[], key: PathKey): TValue | null;
export function get<TValue, TDefault = unknown>(
    array: readonly unknown[] | null | undefined,
    key: PathKey | null | undefined,
    defaultValue?: TDefault | (() => TDefault) | null,
): TValue | TValue[] | TDefault | null;
export function get<TValue, TDefault = unknown>(
    array: ArrayItems<TValue> | unknown,
    key: PathKey | null | undefined,
    defaultValue: TDefault | (() => TDefault) | null = null,
): TValue | TValue[] | TDefault | null {
    if (isNull(key) || isUndefined(key)) {
        return isArray(array)
            ? (array as TValue[] as unknown as TDefault)
            : isFunction(defaultValue)
              ? (defaultValue as () => TDefault)()
              : defaultValue;
    }

    if (!isArray(array)) {
        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : defaultValue;
    }

    const value = getMixedValue(array, key, null);

    if (!isNull(value)) {
        return value as TDefault;
    }

    return isFunction(defaultValue)
        ? (defaultValue as () => TDefault)()
        : defaultValue;
}

/**
 * Check if an item or items exist in an array using "dot" notation.
 *
 * @param  data - The array to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if the item or items exist, false otherwise.
 *
 * @example
 *
 * has(['foo', 'bar', ['baz', 'qux']], 1); -> true
 * has(['foo', 'bar'], 5); -> false
 * has(['foo', 'bar', ['baz', 'qux']], ['0', '2.1']); -> true
 * has(['foo', 'bar', ['baz', 'qux']], ['0', '2.2']); -> false
 */
// Overload: typed array → existence check
export function has<TValue>(data: ArrayItems<TValue>, keys: PathKeys): boolean;
// Overload: untyped array or nullish fallback
export function has(
    data: readonly unknown[] | null | undefined,
    keys: PathKeys,
): boolean;
// Implementation
export function has<TValue>(
    data: ArrayItems<TValue> | unknown,
    keys: PathKeys,
): boolean {
    // isArray's guard rejects a readonly list, so the branches are typed together instead.
    const keyList = (isArray(keys) ? keys : [keys]) as readonly PathKey[];
    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const k of keyList) {
        if (isNull(k) || isUndefined(k)) {
            return false;
        }

        if (!hasMixed(data, k)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if all keys exist in an array using "dot" notation.
 *
 * @param  data - The array to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if all keys exist, false otherwise.
 *
 * @example
 *
 * hasAll(['foo', 'bar', ['baz', 'qux']], ['0', '2.1']); -> true
 * hasAll(['foo', 'bar', ['baz', 'qux']], ['0', '2.2']); -> false
 */
// Overload: typed array → existence check for all keys
export function hasAll<TValue>(
    data: ArrayItems<TValue>,
    keys: PathKeys,
): boolean;
// Overload: untyped array or nullish fallback
export function hasAll(
    data: readonly unknown[] | null | undefined,
    keys: PathKeys,
): boolean;
// Implementation
export function hasAll<TValue>(
    data: ArrayItems<TValue> | unknown,
    keys: PathKeys,
): boolean {
    // isArray's guard rejects a readonly list, so the branches are typed together instead.
    const keyList = (isArray(keys) ? keys : [keys]) as readonly PathKey[];

    if (!accessible(data) || keyList.length === 0) {
        return false;
    }

    for (const key of keyList) {
        if (!has(data as ArrayItems<TValue>, key)) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if any of the keys exist in an array using "dot" notation.
 *
 * @param  data - The array to check.
 * @param  keys - The key or dot-notated path of the item to check.
 * @returns True if any key exists, false otherwise.
 *
 * @example
 *
 * hasAny(['foo', 'bar', ['baz', 'qux']], ['0', '2.2']); -> true
 * hasAny(['foo', 'bar', ['baz', 'qux']], ['3', '4']); -> false
 */
// Overload: typed array → existence check for any key
export function hasAny<TValue>(
    data: ArrayItems<TValue>,
    keys: PathKeys,
): boolean;
// Overload: untyped array or nullish fallback
export function hasAny(
    data: readonly unknown[] | null | undefined,
    keys: PathKeys,
): boolean;
// Implementation
export function hasAny<TValue>(
    data: ArrayItems<TValue> | unknown,
    keys: PathKeys,
): boolean {
    if (isNull(keys)) {
        return false;
    }

    // isArray's guard rejects a readonly list, so the branches are typed together instead.
    const keyList = (isArray(keys) ? keys : [keys]) as readonly PathKey[];
    if (keyList.length === 0) {
        return false;
    }

    if (!accessible(data)) {
        return false;
    }

    for (const key of keyList) {
        if (has(data as ArrayItems<TValue>, key)) {
            return true;
        }
    }

    return false;
}

/**
 * Determine if all items pass the given truth test.
 *
 * Accepts arrays as well as any other iterable such as a generator or a Set,
 * in which case the zero based position of the item is passed as the key.
 *
 * @param  data - The array or iterable to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if all items pass the test, false otherwise.
 *
 * @example
 *
 * every([2, 4, 6], n => n % 2 === 0); -> true
 * every([1, 2, 3], n => n % 2 === 0); -> false
 * every(new Set([2, 4]), n => n % 2 === 0); -> true
 */
// Overload: array type with callback for proper type inference
export function every<TValue>(
    data: TValue[],
    callback: (value: TValue, key: number) => unknown,
): boolean;
// Overload: iterable type with callback for proper type inference
export function every<TValue>(
    data: Iterable<TValue>,
    callback: (value: TValue, key: number) => unknown,
): boolean;
// Overload: untyped array or nullish fallback
export function every<TValue>(
    data: readonly unknown[] | null | undefined,
    callback: (value: TValue, key: number) => unknown,
): boolean;
// Implementation
export function every<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, key: number) => unknown,
): boolean {
    if (accessible(data)) {
        const values = getAccessibleValues<TValue>(data);
        for (let i = 0; i < values.length; i++) {
            if (isPhpFalsy(callback(values[i] as TValue, i))) {
                return false;
            }
        }

        return true;
    }

    // Scalars hold nothing to walk. Everything else is walked positionally,
    // mirroring the foreach fallback Laravel uses for non-array iterables
    if (!isIterable<TValue>(data) && !isObject(data)) {
        return false;
    }

    let index = 0;
    for (const value of toWalkable<TValue>(data)) {
        if (isPhpFalsy(callback(value, index++))) {
            return false;
        }
    }

    return true;
}

/**
 * Determine if some items pass the given truth test.
 *
 * Accepts arrays as well as any other iterable such as a generator or a Set,
 * in which case the zero based position of the item is passed as the key.
 *
 * @param  data - The array or iterable to iterate over.
 * @param  callback - The function to call for each item.
 * @returns True if any item passes the test, false otherwise.
 *
 * @example
 *
 * some([1, 2, 3], n => n % 2 === 0); -> true
 * some([1, 3, 5], n => n % 2 === 0); -> false
 * some(new Set([1, 2]), n => n % 2 === 0); -> true
 */
// Overload: array type with callback for proper type inference
export function some<TValue>(
    data: TValue[],
    callback: (value: TValue, key: number) => unknown,
): boolean;
// Overload: iterable type with callback for proper type inference
export function some<TValue>(
    data: Iterable<TValue>,
    callback: (value: TValue, key: number) => unknown,
): boolean;
// Overload: untyped array or nullish fallback
export function some<TValue>(
    data: readonly unknown[] | null | undefined,
    callback: (value: TValue, key: number) => unknown,
): boolean;
// Implementation
export function some<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, key: number) => unknown,
): boolean {
    if (accessible(data)) {
        const values = getAccessibleValues<TValue>(data);

        for (let i = 0; i < values.length; i++) {
            if (!isPhpFalsy(callback(values[i] as TValue, i))) {
                return true;
            }
        }

        return false;
    }

    // Scalars hold nothing to walk. Everything else is walked positionally,
    // mirroring the foreach fallback Laravel uses for non-array iterables
    if (!isIterable<TValue>(data) && !isObject(data)) {
        return false;
    }

    let index = 0;
    for (const value of toWalkable<TValue>(data)) {
        if (!isPhpFalsy(callback(value, index++))) {
            return true;
        }
    }

    return false;
}

/**
 * Get an integer item from an array using "dot" notation.
 *
 * @param  data - The array to get the item from.
 * @param  key - The key or dot-notated path of the item to get.
 * @param  defaultValue - The default value if key is not found
 *
 * @returns The integer value.
 *
 * @throws InvalidArgumentException if the value is not an integer.
 *
 * @example
 *
 * integer([10, 20, 30], 1); -> 20
 * integer([10, 20, 30], 5, 100); -> 100
 * integer(["house"], 0); -> throws InvalidArgumentException
 */
// Overload: typed array → integer value
export function integer<TValue, TDefault = null>(
    data: ArrayItems<TValue>,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): number;
// Overload: untyped array or nullish fallback
export function integer<TDefault = null>(
    data: readonly unknown[] | null | undefined,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): number;
// Implementation
export function integer<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): number {
    const value = getMixedValue(data, key, defaultValue);

    if (!isInteger(value)) {
        throw new InvalidArgumentException(
            `Array value for key [${key}] must be an integer, ${phpTypeName(value)} found.`,
        );
    }

    return value;
}

/**
 * Join all items using a string. The final items can use a separate glue string.
 *
 * @param  data - The array to join.
 * @param  glue - The string to join all but the last item.
 * @param  finalGlue - The string to join the last item.
 * @returns The items joined, each cast as PHP's (string) cast casts it: "Array" for an array, "1" for true.
 * @throws Error `Object of class X could not be converted to string` for an object without its own toString.
 *
 * @example
 *
 * join(['a', 'b', 'c'], ', ') => 'a, b, c'
 * join(['a', 'b', 'c'], ', ', ' and ') => 'a, b and c'
 */
// Overload: typed array → joined string
export function join<TValue>(
    data: ArrayItems<TValue>,
    glue: string,
    finalGlue?: string,
): string;
// Overload: untyped array or nullish fallback
export function join(
    data: readonly unknown[] | null | undefined,
    glue: string,
    finalGlue?: string,
): string;
// Implementation
export function join<TValue>(
    data: ArrayItems<TValue> | unknown,
    glue: string,
    finalGlue: string = "",
): string {
    const values = getAccessibleValues(data);
    // implode() casts each piece and `.` the last one. Where PHP hands a lone item back uncast, join(), which answers
    // a string, answers the string that item casts to.
    const items = values.map((value) => phpStringCast(value));

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
 * Key an associative array by a field or using a callback.
 * Each resolved key is stored the way PHP stores an array key: `null` as `""`, a boolean as `0`/`1`,
 * and a float truncated toward zero.
 *
 * @param data - The array to key.
 * @param keyBy - The field name to key by, or a callback function that receives each item and its index.
 * @returns A new object keyed by the specified field or callback result.
 *
 * @example
 *
 * keyBy([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}], 'id'); -> {1: {id: 1, name: 'John'}, 2: {id: 2, name: 'Jane'}}
 * keyBy([{name: 'John'}, {name: 'Jane'}], (item) => item.name); -> {John: {name: 'John'}, Jane: {name: 'Jane'}}
 * keyBy([{name: 'John'}], (item, index) => `k${index}`); -> {k0: {name: 'John'}}
 */
// The callback row comes before the path row: there a callback would also be inferred to the bare `P`, which then
// falls back to the whole `string`.
export function keyBy<
    TValue extends object,
    R extends string | number | null | undefined,
>(
    data: ArrayItems<TValue>,
    keyBy: (item: TValue, key: number) => R,
): Record<MapArrayKey<R>, TValue>;
export function keyBy<
    TValue extends object,
    R extends string | number | null | undefined = never,
    P extends string = never,
>(
    data: ArrayItems<TValue>,
    keyBy: P | ((item: TValue, key: number) => R),
): Record<MapArrayKey<R | PluckValue<TValue, P>>, TValue>;
// Overload: untyped array or nullish fallback. `Record<string, unknown>`, not the
// unresolved `TValue`: that row answered `Record<string, object>`, which permits no read.
export function keyBy<TValue extends object>(
    data: readonly unknown[] | null | undefined,
    keyBy:
        | string
        | ((item: TValue, key: number) => string | number | null | undefined),
): Record<string, unknown>;
// Implementation
export function keyBy<TValue extends object>(
    data: ArrayItems<TValue> | unknown,
    keyBy:
        | string
        | ((item: TValue, key: number) => string | number | null | undefined),
): Record<string, TValue> {
    if (!accessible(data)) {
        return {};
    }

    const values = data as ArrayItems<TValue>;
    const results: Record<PropertyKey, TValue> = {};

    for (const [index, item] of values.entries()) {
        const key = isFunction(keyBy)
            ? keyBy(item, index)
            : getNestedValue(item, keyBy as string);

        defineKey(
            results as Record<string, TValue>,
            isSymbol(key) ? key : phpArrayKey(key),
            item,
        );
    }

    return results;
}

/**
 * Prepend the key names of an associative array.
 * Note: This is designed for object-like operations, adapted for arrays with string indices.
 *
 * @param data - The array to process.
 * @param prependWith - The string to prepend to each key.
 * @returns A new array with transformed string-based indices.
 *
 * @example
 *
 * prependKeysWith(['a', 'b', 'c'], 'item_'); -> Creates array with keys: item_0, item_1, item_2
 */
// Overload: typed array → keys prefixed, element type preserved
export function prependKeysWith<TValue>(
    data: ArrayItems<TValue>,
    prependWith: string,
): Record<string, TValue>;
// Overload: untyped array or nullish fallback
export function prependKeysWith(
    data: readonly unknown[] | null | undefined,
    prependWith: string,
): Record<string, unknown>;
// Implementation
export function prependKeysWith<TValue>(
    data: ArrayItems<TValue> | unknown,
    prependWith: string,
): Record<string, TValue> {
    const values = getAccessibleValues(data) as TValue[];
    const result: Record<string, TValue> = {};

    for (let i = 0; i < values.length; i++) {
        result[prependWith + i] = values[i] as TValue;
    }

    return result;
}

/**
 * Get a subset of the items from the given array.
 *
 * Mirrors PHP's `(array) $keys` cast in `Arr::only` (Arr.php:744): `null` becomes
 * no keys, a bare index becomes a single-index selection.
 *
 * Items keep the array's order, not the order of `keys`, as with `array_intersect_key`.
 *
 * @param data - The array to get items from.
 * @param keys - The index, indices, or null to select.
 * @returns A new array with only the specified indices.
 *
 * @example
 *
 * only(['a', 'b', 'c', 'd'], [0, 2]); -> ['a', 'c']
 * only(['a', 'b', 'c', 'd'], [3, 1]); -> ['b', 'd']
 */
export function only<TValue>(
    data: ArrayItems<TValue>,
    keys: number | number[] | null,
): TValue[];
export function only(
    data: readonly unknown[] | null | undefined,
    keys: number | number[] | null,
): unknown[];
export function only<TValue>(
    data: ArrayItems<TValue> | unknown,
    keys: number | number[] | null,
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const keyList = isArray(keys) ? keys : isNull(keys) ? [] : [keys];
    // array_flip keys the selection by each index, so a repeated index still picks its item once, and it skips any
    // key but a string or an integer.
    const wanted = new Set(keyList.filter(isPhpArrayKey).map(String));

    return values.filter((_, index) => wanted.has(String(index)));
}

/**
 * Get a subset of the items from the given array by value.
 *
 * @param data - The array to filter.
 * @param values - The value(s) to include in the result.
 * @param strict - Whether to use strict comparison (default: false).
 * @returns A new array containing only the specified values.
 *
 * @example
 *
 * onlyValues(['foo', 'bar', 'baz', 'qux'], ['foo', 'baz']); -> [0 => 'foo', 2 => 'baz']
 * onlyValues([1, 2, 3, 4, 5], [3, 4]); -> [2 => 3, 3 => 4]
 * onlyValues([1, '1', 2, '2', 3], [1, 2, 3], true); -> [0 => 1, 2 => 2, 4 => 3]
 */
export function onlyValues<TValue>(
    data: readonly TValue[],
    values: TValue | readonly TValue[],
    strict: boolean = false,
): TValue[] {
    const valueArray = isArray(values) ? values : [values];

    return (data as TValue[]).filter((value) => {
        return valueArray.some((v) =>
            strict ? value === v : looseEqual(value, v),
        );
    });
}

/**
 * Select an array of values from each item in the array.
 *
 * @param data - The array to select from.
 * @param keys - The key or keys to select from each item.
 * @returns A new array with selected key/value pairs from each item.
 *
 * @example
 *
 * select([{a: 1, b: 2, c: 3}, {a: 4, b: 5, c: 6}], 'a'); -> [{a: 1}, {a: 4}]
 * select([{a: 1, b: 2}, {a: 3, b: 4}], ['a', 'b']); -> [{a: 1, b: 2}, {a: 3, b: 4}]
 */
// Overload: literal key array → picked element type
export function select<
    TValue extends object,
    const TKeys extends readonly (keyof TValue & string)[],
>(data: ArrayItems<TValue>, keys: TKeys): Pick<TValue, TKeys[number]>[];
// Overload: single literal key → picked element type
export function select<
    TValue extends object,
    const TKey extends keyof TValue & string,
>(data: ArrayItems<TValue>, keys: TKey): Pick<TValue, TKey>[];
// Overload: non-literal keys or untyped data → opaque records
export function select(
    data: readonly unknown[] | null | undefined,
    keys: PathKeys,
): Record<string, unknown>[];
// Implementation
export function select<TValue extends object>(
    data: ArrayItems<TValue> | unknown,
    keys: PathKeys,
): Record<string, unknown>[] {
    // Each item is selected exactly as obj.select selects one, so the two backings can't drift apart.
    const selected = objSelect(
        { ...getAccessibleValues(data) } as Record<number, unknown>,
        keys,
    ) as Record<string, Record<string, unknown>>;

    return Object.values(selected);
}

/**
 * Pluck an array of values from an array.
 *
 * @param data - The array to pluck from.
 * @param value - The key path to pluck (a dot-notated string, an array of
 *   segments, or a path containing a `*` wildcard segment), a callback, or
 *   `null`/`undefined` to keep each whole item.
 * @param key - Optional key path to use as keys in result, or callback function.
 * @returns A new array of plucked values, or a record keyed by the
 *   resolved `key` values when a key is given.
 *
 * @example
 *
 * pluck([{name: 'John', age: 30}, {name: 'Jane', age: 25}], 'name'); -> ['John', 'Jane']
 * pluck([{user: {name: 'John'}}, {user: {name: 'Jane'}}], 'user.name'); -> ['John', 'Jane']
 * pluck([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}], 'name', 'id'); -> {1: 'John', 2: 'Jane'}
 * pluck([{developer: {name: 'Taylor'}}], ['developer', 'name']); -> ['Taylor']
 * pluck([{users: [{first: 'taylor'}, {first: 'dayle'}]}], 'users.*.first'); -> [['taylor', 'dayle']]
 * pluck([{name: 'John'}, {name: 'Jane'}], 'missing'); -> [null, null]
 * pluck([{name: 'John'}, {name: 'Jane'}], null); -> [{name: 'John'}, {name: 'Jane'}]
 */
// Overload: literal path + key → record keyed by the key, resolved value type
export function pluck<TValue extends object, const TPath extends string>(
    data: ArrayItems<TValue>,
    value: TPath,
    key: string | readonly string[] | ((item: TValue) => unknown),
): Record<string | number, PluckValue<TValue, TPath>>;
// Overload: literal path, no key or a nullish one → array of the resolved value type
export function pluck<TValue extends object, const TPath extends string>(
    data: ArrayItems<TValue>,
    value: TPath,
    key?: null | undefined,
): PluckValue<TValue, TPath>[];
// Overload: closure value + key → record keyed by the key
export function pluck<TValue extends object, TResult>(
    data: ArrayItems<TValue>,
    value: (item: TValue) => TResult,
    key: string | readonly string[] | ((item: TValue) => unknown),
): Record<string | number, TResult>;
// Overload: closure value, no key or a nullish one → array of the closure return type
export function pluck<TValue extends object, TResult>(
    data: ArrayItems<TValue>,
    value: (item: TValue) => TResult,
    key?: null | undefined,
): TResult[];
// Overload: null/undefined value + key → record keyed by the key, whole items as values
export function pluck<TValue extends object>(
    data: ArrayItems<TValue>,
    value: null | undefined,
    key: string | readonly string[] | ((item: TValue) => unknown),
): Record<string | number, TValue>;
// Overload: null/undefined value, no key or a nullish one → array of whole items, matching Arr::pluck($data, null)
export function pluck<TValue extends object>(
    data: ArrayItems<TValue>,
    value: null | undefined,
    key?: null | undefined,
): TValue[];
// Overload: with key → returns Record (keyed result)
export function pluck<TValue extends object>(
    data: ArrayItems<TValue>,
    value: string | readonly string[] | ((item: TValue) => unknown),
    key: string | readonly string[] | ((item: TValue) => unknown),
): Record<string | number, unknown>;
// Overload: without key or with a nullish one → returns array
export function pluck<TValue extends object>(
    data: ArrayItems<TValue>,
    value: string | readonly string[] | ((item: TValue) => unknown),
    key?: null | undefined,
): unknown[];
// Overload: untyped array or nullish fallback
export function pluck<TValue extends object>(
    data: readonly unknown[] | null | undefined,
    value:
        | string
        | readonly string[]
        | ((item: TValue) => unknown)
        | null
        | undefined,
    key?: string | readonly string[] | ((item: TValue) => unknown) | null,
): unknown[] | Record<string | number, unknown>;
// Implementation
export function pluck<TValue extends object>(
    data: ArrayItems<TValue> | unknown,
    value:
        | string
        | readonly string[]
        | ((item: TValue) => unknown)
        | null
        | undefined,
    key: string | readonly string[] | ((item: TValue) => unknown) | null = null,
): unknown[] | Record<string | number, unknown> {
    if (!accessible(data)) {
        return [];
    }

    // JS-only: undefined has no PHP analogue; pluck treats it like null (Obj.pluck matches).
    const valuePath = isUndefined(value) ? null : value;
    const values = data as ArrayItems<TValue>;
    // Same predicate as the write branch below — JS truthiness would send
    // key = "" down the array path while the write branch does keyed writes.
    const results: unknown[] | Record<string | number, unknown> =
        isNull(key) || isUndefined(key) ? [] : {};

    for (const item of values) {
        let itemValue: unknown;

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

        if (isNull(key) || isUndefined(key)) {
            (results as unknown[]).push(itemValue);

            continue;
        }

        const itemKey = isFunction(key)
            ? (key as (item: TValue) => unknown)(item)
            : resolvePluckPath(
                  item,
                  explodePluckPath(key as string | readonly string[]),
              );

        // Arr::pluck casts an object with __toString to its string before PHP casts the array key.
        defineKey(
            results as Record<string, unknown>,
            phpComputedKey(itemKey, { stringables: true }),
            itemValue,
        );
    }

    return results;
}

/**
 * Get and remove the last N items from the array, mutating it in place,
 * like PHP's array_pop.
 *
 * @see Collection::pop — `packages/collection/stubs/Collection.php:1030`.
 *      Mirrors `array_pop`, called `$count` times from the end; mutates.
 *
 * @param data - The array to pop items from. Mutated in place.
 * @param count - The number of items to pop. Defaults to 1; a fraction is dropped, and NAN pops every item.
 * @returns The popped item when count is 1, an array of popped items
 * (reverse order) otherwise, or null if the array had nothing to pop.
 * @throws Error for a fraction between 1 and 2 that the items do not cap, as PHP's range() throws its ValueError.
 */
export function pop<TValue>(data: TValue[]): TValue | null;
export function pop<TValue>(data: TValue[], count: number): TValue[];
export function pop<TValue>(
    data: TValue[] | null | undefined,
    count?: number,
): TValue | TValue[] | null;
export function pop<TValue>(
    data: TValue[] | Record<PropertyKey, unknown> | null | undefined,
    count: number = 1,
): TValue | TValue[] | null {
    // A prototype object is never written, and popping deletes the element it took,
    // which every inheritor would see; it pops nothing, as obj.pop does.
    if (!accessible(data) || isPrototypeObject(data)) {
        return count === 1 ? null : [];
    }

    const values = data as TValue[];

    if (values.length === 0) {
        return count === 1 ? null : [];
    }

    if (count === 1) {
        return values.pop() as TValue;
    }

    if (count < 1) {
        return [];
    }

    const poppedValues: TValue[] = [];
    const actualCount = resolveTakeCount(count, values.length);

    for (let i = 0; i < actualCount; i++) {
        poppedValues.push(values.pop() as TValue);
    }

    return poppedValues;
}

/**
 * Run a map over each of the items in the array.
 *
 * @param data - The array to map over.
 * @param callback - The function to call for each item (value, index) => newValue.
 * @returns A new array with transformed values.
 *
 * @example
 *
 * map([1, 2, 3], (value) => value * 2); -> [2, 4, 6]
 * map(['a', 'b'], (value, index) => `${index}:${value}`); -> ['0:a', '1:b']
 */
// Overload: array type with callback for proper type inference
export function map<TValue, TMapReturn>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => TMapReturn,
): TMapReturn[];
// Overload: untyped array or nullish fallback
export function map<TValue, TMapReturn>(
    data: readonly unknown[] | null | undefined,
    callback: (value: TValue, index: number) => TMapReturn,
): TMapReturn[];
// Implementation
export function map<TValue, TMapReturn>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, index: number) => TMapReturn,
): TMapReturn[] {
    const values = getAccessibleValues(data) as TValue[];
    const result: TMapReturn[] = [];

    for (let i = 0; i < values.length; i++) {
        result.push(callback(values[i] as TValue, i));
    }

    return result;
}

/**
 * Run an associative map over each of the items.
 * The callback should return an object with key/value pairs.
 *
 * @param data - The array to map.
 * @param callback - Function that returns an object with key/value pairs.
 * @returns A new object with all mapped key/value pairs.
 *
 * @example
 *
 * mapWithKeys([{id: 1, name: 'John'}], (item) => ({[item.name]: item.id})); -> {John: 1}
 * mapWithKeys(['a', 'b'], (value, index) => ({[value]: index})); -> {a: 0, b: 1}
 */
// Overload: array type with callback for proper type inference
export function mapWithKeys<
    TValue,
    TMapWithKeysValue,
    TKey extends number = number,
    TMapWithKeysKey extends string = string,
>(
    data: ArrayItems<TValue>,
    callback: (
        value: TValue,
        index: TKey,
    ) => Record<TMapWithKeysKey, TMapWithKeysValue>,
): Record<TMapWithKeysKey, TMapWithKeysValue>;
// Overload: untyped array or nullish fallback
export function mapWithKeys<
    TValue,
    TMapWithKeysValue,
    TKey extends number = number,
    TMapWithKeysKey extends string = string,
>(
    data: readonly unknown[] | null | undefined,
    callback: (
        value: TValue,
        index: TKey,
    ) => Record<TMapWithKeysKey, TMapWithKeysValue>,
): Record<TMapWithKeysKey, TMapWithKeysValue>;
// Implementation
export function mapWithKeys<
    TValue,
    TMapWithKeysValue,
    TKey extends number = number,
    TMapWithKeysKey extends string = string,
>(
    data: ArrayItems<TValue> | unknown,
    callback: (
        value: TValue,
        index: TKey,
    ) => Record<TMapWithKeysKey, TMapWithKeysValue>,
): Record<TMapWithKeysKey, TMapWithKeysValue> {
    if (!accessible(data)) {
        return {} as Record<TMapWithKeysKey, TMapWithKeysValue>;
    }

    const values = data as ArrayItems<TValue>;
    const result = {} as Record<TMapWithKeysKey, TMapWithKeysValue>;

    for (let i = 0; i < values.length; i++) {
        const mappedObject = callback(values[i] as TValue, i as TKey);

        // Merge all key/value pairs from the returned object
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
 * Run a map over each nested chunk of items, spreading array elements as individual arguments.
 *
 * @param data - The array to map over.
 * @param callback - The function to call with spread arguments from each chunk.
 * @returns A new array with mapped values.
 *
 * @example
 *
 * mapSpread([[1, 2], [3, 4]], (a, b) => a + b); -> [3, 7]
 * mapSpread([['John', 25], ['Jane', 30]], (name, age) => `${name} is ${age}`); -> ['John is 25', 'Jane is 30']
 */
export function mapSpread<T1, TMapReturn>(
    data: ArrayItems<readonly [T1]>,
    callback: (arg1: T1, index: number) => TMapReturn,
): TMapReturn[];
export function mapSpread<T1, T2, TMapReturn>(
    data: ArrayItems<readonly [T1, T2]>,
    callback: (arg1: T1, arg2: T2, index: number) => TMapReturn,
): TMapReturn[];
export function mapSpread<T1, T2, T3, TMapReturn>(
    data: ArrayItems<readonly [T1, T2, T3]>,
    callback: (arg1: T1, arg2: T2, arg3: T3, index: number) => TMapReturn,
): TMapReturn[];
export function mapSpread<T1, T2, T3, T4, TMapReturn>(
    data: ArrayItems<readonly [T1, T2, T3, T4]>,
    callback: (
        arg1: T1,
        arg2: T2,
        arg3: T3,
        arg4: T4,
        index: number,
    ) => TMapReturn,
): TMapReturn[];
export function mapSpread<T1, T2, T3, T4, T5, TMapReturn>(
    data: ArrayItems<readonly [T1, T2, T3, T4, T5]>,
    callback: (
        arg1: T1,
        arg2: T2,
        arg3: T3,
        arg4: T4,
        arg5: T5,
        index: number,
    ) => TMapReturn,
): TMapReturn[];
// Any other list row: one fixed length spreads by position; otherwise each argument may be any item or the index.
export function mapSpread<TRow extends readonly unknown[], TMapReturn>(
    data: ArrayItems<TRow>,
    callback: (...args: SpreadArgs<TRow, number>) => TMapReturn,
): TMapReturn[];
export function mapSpread<TMapReturn>(
    data: readonly unknown[] | null | undefined,
    callback: (...args: unknown[]) => TMapReturn,
): TMapReturn[];
// `any[]` here (only in the implementation signature) is TypeScript's standard escape
// for satisfying every typed overload above with a variadic parameter; `unknown[]`
// fails the overload-compatibility check (TS2394). Invisible to callers.
export function mapSpread<TMapReturn>(
    data: unknown,
    callback: (...args: any[]) => TMapReturn,
): TMapReturn[] {
    const values = getAccessibleValues(data);
    const result: TMapReturn[] = [];

    for (let i = 0; i < values.length; i++) {
        const row = values[i];
        // A Collection row carries its items behind all(): `$chunk[] = $key` appends to the
        // Collection itself and `...$chunk` then walks the Traversable, not its fields. A plain
        // object models a PHP array, so an `all` member on one is data.
        const chunk =
            !isPlainObject(row) && isObject(row) && isFunction(row["all"])
                ? row["all"]()
                : row;

        if (isArray(chunk)) {
            // Spread the chunk elements and append the index
            result.push(callback(...chunk, i));
        } else {
            // If chunk is not an array, pass it as single argument with index
            result.push(callback(chunk, i));
        }
    }

    return result;
}

/**
 * Push an item onto the beginning of an array.
 *
 * @param data - The array to prepend to.
 * @param value - The value to prepend.
 * @param key - The key, cast as PHP casts an array key (null or undefined becomes ""); omit it to unshift, as
 * `Arr::prepend` does with two arguments. `[$key => $value] + $list` stays a list only for key 0, which replaces the
 * first item; any other key makes the result an object, as PHP's array is then keyed.
 * @returns A new array with the value prepended, or the object PHP's keyed array becomes.
 *
 * @example
 *
 * prepend(['b', 'c'], 'a'); -> ['a', 'b', 'c']
 * prepend([1, 2, 3], 0); -> [0, 1, 2, 3]
 * prepend(['b', 'c'], 'a', 0); -> ['a', 'c']
 * prepend(['b', 'c'], 'a', 'k'); -> { k: 'a', 0: 'b', 1: 'c' }
 */
// Overload: no key → array_unshift, the value's type joining the element type
export function prepend<TValue, TPrependValue>(
    data: ArrayItems<TValue>,
    value: TPrependValue,
): PrependedItem<TValue, TPrependValue>[];
// Overload: a key → PHP's `[$key => $value] + $list`
export function prepend<
    TValue,
    TPrependValue,
    TPrependKey extends PropertyKey | null | undefined,
>(
    data: ArrayItems<TValue>,
    value: TPrependValue,
    key: TPrependKey,
): ListPrepend<TValue, TPrependValue, TPrependKey>;
// Overload: nothing to prepend to, so the value alone
export function prepend<TValue>(
    data: null | undefined,
    value: TValue,
): TValue[];
// Overload: a list that may be missing, so the answer's items, the value's included, are typed unknown
export function prepend(
    data: readonly unknown[] | null | undefined,
    value: unknown,
): unknown[];
export function prepend(
    data: readonly unknown[] | null | undefined,
    value: unknown,
    key: PropertyKey | null | undefined,
): unknown[] | Record<string | number, unknown>;
// Implementation
export function prepend<TValue>(
    data: ArrayItems<TValue> | unknown,
    value: TValue,
    ...rest: [key?: PropertyKey | null]
): unknown[] | Record<string | number, unknown> {
    const values = getAccessibleValues(data) as TValue[];

    if (rest.length === 0) {
        return [value, ...values];
    }

    // PHP's key union starts with the new key, so it stays a list only when that key casts to 0. Array.from keeps a
    // hole as undefined, as arr.union does, where `{ ...list }` would drop it.
    const prepended = objPrepend({ ...Array.from(values) }, value, ...rest);

    return phpArrayKey(rest[0]) === 0 ? Object.values(prepended) : prepended;
}

/**
 * Get a value from the array, and remove it.
 *
 * @param data - The array to pull the item from.
 * @param key - The key or dot-notated path of the item to pull.
 * @param defaultValue - The default value if key is not found.
 * @returns An object containing the pulled value (or default) and the updated array.
 *
 * @example
 *
 * pull(['a', 'b', 'c'], 1); -> { value: 'b', data: ['a', 'c'] }
 * pull(['a', ['b', 'c']], '1.0'); -> { value: 'b', data: ['a', ['c']] }
 * pull(['a', 'b', 'c'], 5, 'x'); -> { value: 'x', data: ['a', 'b', 'c'] }
 * pull(['a', ['b', 'c']], '1.2', 'x'); -> { value: 'x', data: ['a', ['b', 'c']] }
 */
// Overload: typed array without a default
export function pull<TValue>(
    data: ArrayItems<TValue>,
    key: PathKey,
): { value: TValue | null; data: TValue[] };
// Overload: typed array with a default
export function pull<TValue, TDefault>(
    data: ArrayItems<TValue>,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault),
): { value: TValue | TDefault; data: TValue[] };
// Overload: untyped array or nullish fallback
export function pull<TValue, TDefault = null>(
    data: readonly unknown[] | null | undefined,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): { value: TValue | TDefault | null; data: TValue[] };
// Implementation
export function pull<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): { value: TValue | TDefault | null; data: TValue[] } {
    const resolveDefault = (): TDefault | null => {
        return isFunction(defaultValue)
            ? (defaultValue as () => TDefault)()
            : (defaultValue as TDefault);
    };
    if (!accessible(data)) {
        return { value: resolveDefault(), data: [] as TValue[] };
    }

    if (isNull(key) || isUndefined(key)) {
        const original = castableToArray(data)!.slice();

        return { value: resolveDefault(), data: original as TValue[] };
    }

    const root = castableToArray(data)!;
    const { found, value } = getRaw(root, key as number | string);

    if (isFalsy(found)) {
        const original = root.slice();

        return { value: resolveDefault(), data: original as TValue[] };
    }

    const updated = forget(root as TValue[], key as number | string);

    return {
        value: value as unknown as TValue | TDefault | null,
        data: updated,
    };
}

/**
 * Convert the array into a query string.
 *
 * @param data - The array or object to convert to a query string.
 * @returns A URL-encoded query string.
 *
 * @example
 *
 * query({name: 'John', age: 30}); -> 'name=John&age=30'
 * query(['a', 'b', 'c']); -> '0=a&1=b&2=c'
 * query({tags: ['php', 'js']}); -> 'tags[0]=php&tags[1]=js'
 * query({user: {name: 'John', age: 30}}); -> 'user%5Bname%5D=John&user%5Bage%5D=30'
 * query({foo: 'bar', bar: true}); -> 'foo=bar&bar=1' (booleans cast like PHP's http_build_query)
 * query({foo: 'bar', bar: false}); -> 'foo=bar&bar=0'
 */
// Overload: typed array → query string
export function query<TValue>(data: ArrayItems<TValue>): string;
// Overload: untyped array or nullish fallback
export function query(data: readonly unknown[] | null | undefined): string;
// Implementation
export function query(data: unknown): string {
    if (isNull(data) || isUndefined(data)) {
        return "";
    }

    // http_build_query runs PHP_QUERY_RFC3986, which percent-encodes every reserved
    // character in both halves — brackets included. encodeURIComponent leaves !'()*
    // alone, so those five are escaped here to land on the same string PHP emits.
    const encodeQueryComponent = (component: string): string =>
        encodeURIComponent(component).replace(
            /[!'()*]/g,
            (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
        );

    // Mirrors PHP's http_build_query scalar casting: booleans become "1"
    // or "0", not JavaScript's "true"/"false"/""; other scalars use
    // String().
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
                        const encodedKey = encodeQueryComponent(key);
                        parts.push(
                            `${encodedKey}=${encodeQueryComponent(stringifyQueryValue(value))}`,
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
                        const encodedKey = encodeQueryComponent(key);
                        parts.push(
                            `${encodedKey}=${encodeQueryComponent(stringifyQueryValue(value))}`,
                        );
                    }
                }
            }
        } else {
            // Scalar value
            const key = prefix || "0";
            const encodedKey = encodeQueryComponent(key);
            parts.push(
                `${encodedKey}=${encodeQueryComponent(stringifyQueryValue(obj))}`,
            );
        }

        return parts;
    };

    return buildQuery(data).join("&");
}

/**
 * Get one or a specified number of random values from an array.
 *
 * The picked items come back in the array's own order, as `Randomizer::pickArrayKeys` returns them.
 *
 * @param data - The array to get random values from. Non-array-like input is treated as absent, not as an empty array.
 * @param number - The number of items to return, a fraction truncated. If null, returns a single item.
 * @param preserveKeys - Whether to preserve the original keys when returning multiple items.
 * @returns A single random item, an array of random items, an empty array when zero or fewer items are requested, or null when no count is given and the input isn't array-like.
 * @throws InvalidArgumentException if more items are requested than are available, including requesting a single
 * item (or any positive count) from an empty array.
 * @throws TypeError for a NAN count or a string that is not numeric, which PHP's Randomizer rejects too.
 * @throws Error for a count between 0 and 1, which truncates to no item, as PHP's Randomizer rejects it.
 *
 * @example
 *
 * random([1, 2, 3]); -> 2 (single random item)
 * random([1, 2, 3], 2); -> [1, 3] (two random items, in the array's order)
 * random(['a', 'b', 'c'], 2, true); -> {1: 'b', 2: 'c'} (with original keys)
 * random([], 0); -> [] (explicitly requesting zero items)
 * random([]); -> throws InvalidArgumentException (no items available)
 * random([1, 2], 5); -> throws InvalidArgumentException
 */
export function random<TValue>(data: ArrayItems<TValue>): TValue | null;
export function random<TValue>(
    data: ArrayItems<TValue>,
    number: number,
    preserveKeys: true,
): Record<number, TValue>;
export function random<TValue>(
    data: ArrayItems<TValue>,
    number: number,
    preserveKeys?: false,
): TValue[];
export function random<TValue>(
    data: readonly unknown[] | null | undefined,
    number?: number | string | null,
    preserveKeys?: boolean,
): TValue | TValue[] | Record<number, TValue> | null;
export function random<TValue>(
    data: ArrayItems<TValue> | unknown,
    number?: number | string | null,
    preserveKeys: boolean = false,
): TValue | TValue[] | Record<number, TValue> | null {
    const numberProvided = !isNull(number) && !isUndefined(number);

    // Non-array-like input has no Laravel equivalent (PHP's count() would
    // error on it), so it degrades gracefully instead of entering the
    // ported throw/empty logic below, which only applies to real arrays.
    if (!isArray(data)) {
        return numberProvided ? [] : null;
    }

    const values = data as TValue[];
    const count = values.length;
    const requested = numberProvided ? number : 1;

    // PHP compares a count that is not numeric as a string, and orders NAN with nothing.
    if (operatorMatch(requested, ">", count)) {
        throw new InvalidArgumentException(
            `You requested ${toPhpKeyString(requested)} items, but there are only ${count} items available.`,
        );
    }

    // Arr::random's empty($array) guard answers before the count reaches pickArrayKeys, a NAN count included.
    if (count === 0 || (numberProvided && operatorMatch(requested, "<=", 0))) {
        return [];
    }

    const picks = pickArrayKeysCount(requested);

    // Generate random indices
    const selectedIndices: number[] = [];
    const availableIndices = Array.from({ length: count }, (_, i) => i);

    for (let i = 0; i < picks; i++) {
        const randomIndex = randomInt(0, availableIndices.length - 1);
        selectedIndices.push(availableIndices[randomIndex] as number);
        availableIndices.splice(randomIndex, 1);
    }

    // Randomizer::pickArrayKeys returns the picked keys in the array's order, not the order drawn.
    selectedIndices.sort((a, b) => a - b);

    // If only one item requested, return it directly
    if (!numberProvided) {
        return values[selectedIndices[0] as number] as TValue;
    }

    // Return multiple items
    if (preserveKeys) {
        const result: Record<number, TValue> = {};
        for (const index of selectedIndices) {
            result[index] = values[index] as TValue;
        }

        return result;
    } else {
        return selectedIndices.map((index) => values[index] as TValue);
    }
}

/**
 * The count Arr::random hands Randomizer::pickArrayKeys, cast as that int parameter casts it.
 *
 * @param requested - The count Arr::random was given, once its own checks have let it through
 * @returns The count, a fraction truncated
 * @throws TypeError for NAN or a string that is not numeric, which the int parameter rejects
 * @throws Error for a count that truncates below 1, as PHP's ValueError
 */
function pickArrayKeysCount(requested: unknown): number {
    if (
        isString(requested) ? !isPhpNumeric(requested) : Number.isNaN(requested)
    ) {
        throw new TypeError(
            `Random\\Randomizer::pickArrayKeys(): Argument #2 ($num) must be of type int, ${isString(requested) ? "string" : "float"} given`,
        );
    }

    const picks = Math.trunc(Number(requested));

    if (picks < 1) {
        throw new Error(
            "Random\\Randomizer::pickArrayKeys(): Argument #2 ($num) must be between 1 and the number of elements in argument #1 ($array)",
        );
    }

    return picks;
}

/**
 * Get and remove the first N items from the array, mutating it in place,
 * like PHP's array_shift.
 *
 * Guard order matters: negative count throws, an empty array returns null
 * for any count, a count of zero returns an empty array, then items shift.
 *
 * @see Collection::shift — `packages/collection/stubs/Collection.php:1281`.
 *      Mirrors `array_shift`-style removal from the front, driven by `$count`; mutates.
 *
 * @param data - The array to shift items from. Mutated in place.
 * @param count - The number of items to shift. Defaults to 1; a fraction is dropped, and NAN shifts every item.
 * @returns The shifted item(s), or null if the array had nothing to shift.
 * @throws InvalidArgumentException if count is negative.
 * @throws Error for a fraction below 2 that the items do not cap, as PHP's range() throws its ValueError.
 */
export function shift<TValue>(data: TValue[]): TValue | null;
export function shift<TValue>(data: TValue[], count: number): TValue[];
export function shift<TValue>(
    data: TValue[] | null | undefined,
    count?: number,
): TValue | TValue[] | null;
export function shift<TValue>(
    data: TValue[] | Record<PropertyKey, unknown> | null | undefined,
    count: number = 1,
): TValue | TValue[] | null {
    if (count < 0) {
        throw new InvalidArgumentException(
            "Number of shifted items may not be less than zero.",
        );
    }

    // Collection::shift checks isEmpty() before the count, so non-array data yields null for any count.
    // A prototype object is never written, and shifting renumbers its whole container, so it shifts nothing.
    if (!accessible(data) || isPrototypeObject(data)) {
        return null;
    }

    const values = data as TValue[];

    if (values.length === 0) {
        return null;
    }

    if (count === 0) {
        return [];
    }

    if (count === 1) {
        return values.shift() as TValue;
    }

    const shiftedValues: TValue[] = [];
    const actualCount = resolveTakeCount(count, values.length);

    for (let i = 0; i < actualCount; i++) {
        shiftedValues.push(values.shift() as TValue);
    }

    return shiftedValues;
}

/**
 * Set an array item to a given value using "dot" notation.
 *
 * If no key is given to the method, the entire array will be replaced.
 *
 * @param  array - The array to set the item in.
 * @param  key - The key or dot-notated path of the item to set.
 * @param  value - The value to set.
 * @returns - A new array with the item set, or the value itself when key is null/undefined.
 *
 * @example
 * set(['a', 'b', 'c'], 1, 'x'); -> ['a', 'x', 'c']
 * set(['a', ['b', 'c']], '1.0', 'x'); -> ['a', ['x', 'c']]
 * set(['a', 'b'], null, ['x', 'y']); -> ['x', 'y']
 */
// Overload: null/undefined key → returns the value (replaces entire array)
export function set<TSetValue>(
    array: readonly unknown[] | null | undefined,
    key: null | undefined,
    value: TSetValue,
): TSetValue;
// Overload: dot-notated path key → nested write. A path under a list index rebuilds that
// element, so the element type gains the record the write creates there.
export function set<
    TValue,
    TSetValue,
    const TPath extends `${string}.${string}`,
>(
    array: ArrayItems<TValue>,
    key: TPath,
    value: TSetValue,
): ArraySetPathResult<TValue, TPath, TSetValue>;
// Overload: top-level key with a same-type value → preserves array type
// `NoInfer<TValue>` keeps `value` from driving `TValue` on its own, so a
// same-shaped write (e.g. an object matching the element shape) still
// resolves TValue purely from `array` instead of colliding with a second,
// structurally-identical-but-distinct inferred type in the union overload
// below.
export function set<TValue>(
    array: ArrayItems<TValue>,
    key: string | number,
    value: NoInfer<TValue>,
): TValue[];
// Overload: top-level key with a different-type value → union array type
export function set<TValue, TSetValue>(
    array: ArrayItems<TValue>,
    key: string | number,
    value: TSetValue,
): (TValue | TSetValue)[];
// Overload: a key that may be null or undefined → the value itself, or the array with it written.
// NoInfer keeps TSetValue off the result's top level, where TypeScript would stop widening a literal value.
export function set<TValue, TSetValue>(
    array: ArrayItems<TValue>,
    key: PathKey,
    value: TSetValue,
): (TValue | TSetValue)[] | NoInfer<TSetValue>;
// Overload: generic fallback
export function set<TValue>(
    array: readonly unknown[] | null | undefined,
    key: string | number,
    value: unknown,
): TValue[];
// Overload: generic fallback, for a key that may be null or undefined
export function set<TValue, TSetValue>(
    array: readonly unknown[] | null | undefined,
    key: PathKey,
    value: TSetValue,
): TValue[] | NoInfer<TSetValue>;
export function set(
    array: unknown,
    key: PathKey | null,
    value: unknown,
): unknown {
    return setMixedImmutable(array, key, value);
}

/**
 * Push one or more items into the array at the given key, using numeric-only dot notation.
 *
 * Unlike PHP, the whole array is returned rather than `Arr::set`'s innermost container,
 * and an out-of-range index is clamped to an append instead of a gapped integer key.
 *
 * @param data - The array to push items into.
 * @param key - The key or dot-notated path of the array to push into. If null, push into root.
 * @param values - The values to push.
 * @returns The array with the values pushed into the array at the key.
 * @throws InvalidArgumentException if the value at the key is not an array.
 */
// Overload: typed array → element type preserved (including unions)
export function push<TValue>(
    data: ArrayItems<TValue>,
    key: PathKey,
    ...values: TValue[]
): TValue[];
// Overload: untyped array or nullish fallback
export function push<TValue>(
    data: readonly unknown[] | null | undefined,
    key: PathKey,
    ...values: TValue[]
): TValue[];
// Implementation
export function push<TValue>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    ...values: TValue[]
): TValue[] {
    // pushWithPath appends in place, down to the array AT the key, so the list
    // and every container along the path are copied before it runs.
    return pushWithPath(
        isArray(data) ? copyAlongPath(data, key, true) : data,
        key,
        ...values,
    );
}

/**
 * Shuffle the given array and return the result.
 *
 * @param data - The array to shuffle.
 * @returns A new shuffled array.
 *
 * @example
 *
 * shuffle([1, 2, 3, 4, 5]); -> [3, 1, 5, 2, 4] (random order)
 * shuffle(['a', 'b', 'c']); -> ['c', 'a', 'b'] (random order)
 */
export function shuffle<TValue>(data: ArrayItems<TValue>): TValue[];
export function shuffle(data: readonly unknown[] | null | undefined): unknown[];
export function shuffle<TValue>(data: ArrayItems<TValue> | unknown): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const result = values.slice();

    // Fisher-Yates shuffle algorithm
    for (let i = result.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [result[i], result[j]] = [result[j] as TValue, result[i] as TValue];
    }

    return result;
}

/**
 * Skip items in the array until the given condition is met.
 *
 * A value is compared with PHP's `===`; a callback gets each value and index, and PHP truthiness judges its answer.
 *
 * @param data - The array to skip items of.
 * @param value - The value to skip until, or a callback answering whether an item meets the condition.
 * @returns A new array of the items from the first that meets the condition on.
 *
 * @example
 *
 * skipUntil([1, 2, 3, 4], 3); -> [3, 4]
 * skipUntil([1, 2, 3, 4], (value) => value >= 3); -> [3, 4]
 * skipUntil([1, 2, 3, 4], 5); -> []
 */
export function skipUntil<TValue>(
    data: ArrayItems<TValue>,
    value: NoInfer<TValue> | ((value: TValue, index: number) => unknown),
): TValue[];
export function skipUntil(
    data: readonly unknown[] | null | undefined,
    value: AnyValueOr<(value: unknown, index: number) => unknown>,
): unknown[];
export function skipUntil<TValue>(
    data: ArrayItems<TValue> | null | undefined,
    value: TValue | ((value: TValue, index: number) => unknown),
): TValue[] {
    const condition = conditionFor<TValue, number>(value);

    return skipWhile(
        getAccessibleValues(data) as TValue[],
        (item: TValue, index: number) => isPhpFalsy(condition(item, index)),
    );
}

/**
 * Skip items in the array while the given condition is met.
 *
 * A value is compared with PHP's `===`; a callback gets each value and index, and PHP truthiness judges its answer.
 *
 * @param data - The array to skip items of.
 * @param value - The value to skip while items equal it, or a callback answering whether an item meets the condition.
 * @returns A new array of the items from the first that fails the condition on.
 *
 * @example
 *
 * skipWhile([1, 1, 2, 1], 1); -> [2, 1]
 * skipWhile([1, 2, 3, 4], (value) => value < 3); -> [3, 4]
 * skipWhile([1, 2, 3, 4], 5); -> [1, 2, 3, 4]
 */
export function skipWhile<TValue>(
    data: ArrayItems<TValue>,
    value: NoInfer<TValue> | ((value: TValue, index: number) => unknown),
): TValue[];
export function skipWhile(
    data: readonly unknown[] | null | undefined,
    value: AnyValueOr<(value: unknown, index: number) => unknown>,
): unknown[];
export function skipWhile<TValue>(
    data: ArrayItems<TValue> | null | undefined,
    value: TValue | ((value: TValue, index: number) => unknown),
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const condition = conditionFor<TValue, number>(value);
    const start = values.findIndex((item, index) =>
        isPhpFalsy(condition(item, index)),
    );

    return values.slice(start === -1 ? values.length : start);
}

/**
 * Slice the underlying array items, like PHP's `array_slice()`. A READ operation that
 * extracts a subset without mutating; use `splice()` for a WRITE that removes items.
 *
 * @see Collection::slice — `packages/collection/stubs/Collection.php:1382`. Wraps `array_slice`, preserveKeys: true.
 *
 * @param data - The array to slice
 * @param offset - The starting index
 * @param length - The number of items to include (negative means stop that many from the end)
 * @returns Sliced array (subset of the original)
 */
export function slice<TValue>(
    data: ArrayItems<TValue>,
    offset: number,
    length?: number | null,
): TValue[];
// Overload: untyped array or nullish fallback — genuinely `unknown`, not `ArrayItems<TValue>
// | unknown` (which collapses to the same thing but implies TValue narrows
// when it never does).
export function slice<TValue>(
    data: readonly unknown[] | null | undefined,
    offset: number,
    length?: number | null,
): TValue[];
export function slice<TValue>(
    data: ArrayItems<TValue> | unknown,
    offset: number,
    length: number | null = null,
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    const values = (data as ArrayItems<TValue>).slice();
    const { start, end } = resolveSliceRange(values.length, offset, length);

    return values.slice(start, end);
}

/**
 * Get the first item in the array, but only if exactly one item exists. Otherwise, throw an exception.
 *
 * @param data - The array to check.
 * @param callback - Optional callback to filter items.
 * @returns The single item in the array.
 * @throws ItemNotFoundException if no item matches, MultipleItemsFoundException if several do.
 *
 * @example
 *
 * sole([42]); -> 42
 * sole([1, 2, 3], (value) => value > 2); -> 3
 * sole([]); -> throws ItemNotFoundException
 * sole([1, 2]); -> throws MultipleItemsFoundException: 2 items were found.
 * sole([1, 2, 3], (value) => value > 1); -> throws MultipleItemsFoundException: 2 items were found.
 */
// Overload: array type with callback for proper type inference
export function sole<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => unknown,
): TValue;
// Overload: array type without callback
export function sole<TValue>(
    data: ArrayItems<TValue>,
    callback?: undefined,
): TValue;
// Overload: untyped array or nullish fallback
export function sole<TValue>(
    data: readonly unknown[] | null | undefined,
    callback?: (value: TValue, index: number) => unknown,
): TValue;
// Implementation
export function sole<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback?: (value: TValue, index: number) => unknown,
): TValue {
    const values = getAccessibleValues(data) as TValue[];

    if (values.length === 0) {
        throw new ItemNotFoundException();
    }

    let filteredValues: TValue[];

    if (callback) {
        // Filter using the callback
        filteredValues = [];
        for (let i = 0; i < values.length; i++) {
            const value = values[i] as TValue;
            if (!isPhpFalsy(callback(value, i))) {
                filteredValues.push(value);
            }
        }
    } else {
        // Use all values
        filteredValues = values.slice();
    }

    const count = filteredValues.length;

    if (count === 0) {
        throw new ItemNotFoundException();
    }

    if (count > 1) {
        throw new MultipleItemsFoundException(count);
    }

    return filteredValues[0] as TValue;
}

/**
 * Sort by a list of descriptors, falling through to the next descriptor
 * whenever the current one ties. Shared by `sort` and `sortDesc`'s
 * multi-key branches; only `forceDescending` differs between them.
 *
 * @param result - The array to sort in place.
 * @param specs - The sort descriptors to apply in order.
 * @param forceDescending - Forwarded to {@linkcode sortSpecComparator} for every descriptor.
 * @returns The sorted array (same reference as `result`).
 */
function sortByComparators<TValue>(
    result: TValue[],
    specs: readonly SortSpec<TValue>[],
    forceDescending = false,
): TValue[] {
    const comparators = specs.map((spec) =>
        sortSpecComparator<TValue>(spec, forceDescending),
    );

    // Collection::sortByMany hands uasort() its closure's whole answer, a comparator's bool included.
    return result.sort(
        phpSortComparator((a, b) => {
            for (const comparator of comparators) {
                const comparison = comparator(a, b);

                if (comparison !== 0) {
                    return comparison;
                }
            }

            return 0;
        }),
    );
}

/**
 * Sort the array using the given callback, "dot" notation, or an array of
 * sort descriptors for multi-key sorting.
 *
 * @param data - The array to sort.
 * @param callback - The sorting callback, field name, an array of sort descriptors, or null for natural sorting.
 * @returns A new sorted array.
 *
 * @example
 *
 * sort([3, 1, 4, 1, 5]); -> [1, 1, 3, 4, 5]
 * sort(['banana', 'apple', 'cherry']); -> ['apple', 'banana', 'cherry']
 * sort([{name: 'John', age: 25}, {name: 'Jane', age: 30}], 'age'); -> sorted by age
 * sort([{name: 'John', age: 25}, {name: 'Jane', age: 30}], (item) => item.name); -> sorted by name
 * sort([{name: 'John', age: 25}, {name: 'John', age: 30}], ['name', ['age', false]]); -> sorted by name asc, then age desc
 */
// Overload: array of sort descriptors → element type preserved
export function sort<TValue>(
    data: ArrayItems<TValue>,
    callback: readonly SortSpec<TValue>[],
): TValue[];
// Overload: array type with callback for proper type inference
export function sort<TValue>(
    data: ArrayItems<TValue>,
    callback:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): TValue[];
// Overload: array type without callback (natural sorting)
export function sort<TValue>(data: ArrayItems<TValue>): TValue[];
// Overload: untyped array or nullish fallback
export function sort<TValue>(
    data: readonly unknown[] | null | undefined,
    callback?:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): TValue[];
// Implementation
export function sort<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null = null,
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const result = values.slice();

    if (isArray(callback)) {
        // Must be checked before isFalsy: an empty descriptor array is
        // falsy too, but an empty array here is a stable no-op, not a
        // natural-value sort.
        return sortByComparators(
            result,
            callback as readonly SortSpec<TValue>[],
        );
    }

    if (isFalsy(callback)) {
        // Natural sorting - use compareValues for proper numeric/string comparison
        return result.sort((a, b) => compareValues(a, b));
    }

    if (isString(callback)) {
        // Sort by field name using dot notation
        return result.sort((a, b) => {
            const aValue = getNestedValue(
                a as Record<string, unknown>,
                callback,
            );
            const bValue = getNestedValue(
                b as Record<string, unknown>,
                callback,
            );

            return compareValues(aValue, bValue);
        });
    }

    if (isFunction(callback)) {
        // Extract sort values using callback, then sort by those values
        const indexed = result.map((value, key) => ({
            value,
            sortKey: callback(value, key),
        }));

        indexed.sort((a, b) => compareValues(a.sortKey, b.sortKey));

        return indexed.map((item) => item.value);
    }

    return result;
}

/**
 * Sort the array in descending order using the given callback, "dot"
 * notation, or an array of sort descriptors for multi-key sorting.
 *
 * @param data - The array to sort.
 * @param callback - The sorting callback, field name, an array of sort descriptors, or null for natural sorting.
 * @returns A new sorted array in descending order.
 *
 * @example
 *
 * sortDesc([3, 1, 4, 1, 5]); -> [5, 4, 3, 1, 1]
 * sortDesc(['banana', 'apple', 'cherry']); -> ['cherry', 'banana', 'apple']
 * sortDesc([{name: 'John', age: 25}, {name: 'Jane', age: 30}], 'age'); -> sorted by age desc
 * sortDesc([{name: 'John', age: 25}, {name: 'Jane', age: 30}], (item) => item.name); -> sorted by name desc
 * sortDesc([{name: 'John', age: 25}, {name: 'John', age: 30}], ['name', ['age', false]]); -> each descriptor's comparison is reversed
 */
// Overload: array of sort descriptors → element type preserved
export function sortDesc<TValue>(
    data: ArrayItems<TValue>,
    callback: readonly SortSpec<TValue>[],
): TValue[];
// Overload: array type with callback for proper type inference
export function sortDesc<TValue>(
    data: ArrayItems<TValue>,
    callback:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): TValue[];
// Overload: array type without callback (natural sorting)
export function sortDesc<TValue>(data: ArrayItems<TValue>): TValue[];
// Overload: untyped array or nullish fallback
export function sortDesc<TValue>(
    data: readonly unknown[] | null | undefined,
    callback?:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): TValue[];
// Implementation
export function sortDesc<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback?:
        | ((value: TValue, key: number) => unknown)
        | string
        | readonly SortSpec<TValue>[]
        | null,
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const result = values.slice();

    if (isArray(callback)) {
        // Every descriptor's own direction is overridden to descending; a comparator is
        // unaffected. Checked first since an empty descriptor array is falsy too, but
        // must stay a stable no-op here, not fall through to a natural-value sort.
        return sortByComparators(
            result,
            callback as readonly SortSpec<TValue>[],
            true,
        );
    }

    if (isFalsy(callback)) {
        // PHP 8 orders numeric strings numerically; compareValues carries that rule.
        return result.sort((a, b) => compareValues(b, a));
    }

    if (isString(callback)) {
        // Sort by field name using dot notation in descending order
        return result.sort((a, b) => {
            const aValue = getNestedValue(
                a as Record<string, unknown>,
                callback,
            );
            const bValue = getNestedValue(
                b as Record<string, unknown>,
                callback,
            );

            return compareValues(bValue, aValue); // Reverse order
        });
    }

    if (isFunction(callback)) {
        // Sort by callback result in descending order
        // Same indexed shape as `sort`, so the callback sees the key too.
        const indexed = result.map((value, key) => ({
            value,
            sortKey: callback(value, key),
        }));

        indexed.sort((a, b) => compareValues(b.sortKey, a.sortKey));

        return indexed.map((item) => item.value);
    }

    return result;
}

/**
 * Recursively sort an array by keys and values.
 * Only arrays and plain objects are sorted; any other object (a class instance, Date or Map) is kept as it is.
 *
 * @param data - The array to sort recursively.
 * @param options - Sort options (currently unused, for PHP compatibility).
 * @param descending - Whether to sort in descending order.
 * @returns A new recursively sorted array.
 *
 * @example
 *
 * sortRecursive({ b: [3, 1, 2], a: { d: 2, c: 1 } }); -> { a: { c: 1, d: 2 }, b: [1, 2, 3] }
 * sortRecursive([{ name: 'john', age: 30 }, { name: 'jane', age: 25 }]); -> sorted objects with sorted keys
 */
export function sortRecursive<TValue>(
    data: ArrayItems<TValue>,
    descending?: CaseValue<typeof SortDirection> | boolean,
): TValue[];
export function sortRecursive<TValue>(
    data: readonly unknown[] | null | undefined,
    descending?: CaseValue<typeof SortDirection> | boolean,
): TValue[] | Record<string, unknown>;
export function sortRecursive<TValue>(
    data: ArrayItems<TValue> | Record<string, unknown> | unknown,
    descending: CaseValue<typeof SortDirection> | boolean = false,
): TValue[] | Record<string, unknown> {
    return sortRecursiveValue(data, descending) as
        | TValue[]
        | Record<string, unknown>;
}

/**
 * Recursively sort a value by keys and values.
 *
 * The public rows are array-shaped so `data`'s dispatch can hand keyed data to
 * obj, but the recursion itself still walks nested objects.
 *
 * @param data - The value to sort recursively.
 * @param descending - Whether to sort in descending order.
 * @returns A new recursively sorted value.
 */
function sortRecursiveValue(
    data: unknown,
    descending: CaseValue<typeof SortDirection> | boolean,
): unknown[] | Record<string, unknown> {
    const isDesc =
        descending === true || descending === SortDirection.Descending;
    if (!accessible(data) && !isObject(data)) {
        return data as unknown[];
    }

    let result: unknown[] | Record<string, unknown>;

    if (isArray(data)) {
        result = data.slice();
    } else {
        result = { ...data } as Record<string, unknown>;
    }

    // Recursively sort nested arrays/objects
    if (isArray(result)) {
        // First recursively sort nested elements
        for (let i = 0; i < result.length; i++) {
            const item = result[i];
            if (isArray(item) || isPlainObject(item)) {
                result[i] = sortRecursiveValue(item, isDesc);
            }
        }

        // Then sort the array values
        result.sort((a, b) => {
            const comparison = compareValues(a, b);
            return isDesc ? -comparison : comparison;
        });
    } else {
        // Sort object properties
        const entries = Object.entries(result);

        // Recursively sort nested values first
        for (const [key, value] of entries) {
            if (isArray(value) || isPlainObject(value)) {
                defineKey(result, key, sortRecursiveValue(value, isDesc));
            }
        }

        const sortedResult: Record<string, unknown> = {};

        // array_is_list: keys exactly 0..n-1 spell a PHP LIST, which Arr::sortRecursive
        // sorts by VALUE and reindexes rather than by key.
        if (entries.every(([key], index) => key === String(index))) {
            entries
                .map(([key]) => result[key])
                .sort((a, b) => {
                    const comparison = compareValues(a, b);
                    return isDesc ? -comparison : comparison;
                })
                .forEach((value, index) => {
                    defineKey(sortedResult, String(index), value);
                });

            return sortedResult;
        }

        // Sort object keys
        const sortedEntries = entries.sort(([keyA], [keyB]) => {
            const comparison = compareValues(keyA, keyB);
            return isDesc ? -comparison : comparison;
        });

        // Rebuild object with sorted keys
        for (const [key] of sortedEntries) {
            defineKey(sortedResult, key, result[key]);
        }
        result = sortedResult;
    }

    return result;
}

/**
 * Recursively sort an array by keys and values in descending order.
 *
 * @param data - The array to sort recursively in descending order.
 * @param options - Sort options (currently unused, for PHP compatibility).
 * @returns A new recursively sorted array in descending order.
 *
 * @example
 *
 * sortRecursiveDesc({ a: [1, 2, 3], b: { c: 1, d: 2 } }); -> { b: { d: 2, c: 1 }, a: [3, 2, 1] }
 */
export function sortRecursiveDesc<TValue>(data: ArrayItems<TValue>): TValue[];
export function sortRecursiveDesc<TValue>(
    data: readonly unknown[] | null | undefined,
): TValue[] | Record<string, unknown>;
export function sortRecursiveDesc<TValue>(
    data: ArrayItems<TValue> | Record<string, unknown> | unknown,
): TValue[] | Record<string, unknown> {
    return sortRecursiveValue(data, SortDirection.Descending) as
        | TValue[]
        | Record<string, unknown>;
}

/**
 * Splice a portion of the underlying array, mutating it in place, like PHP's
 * `array_splice()`. Returns what was removed; use `slice()` for a non-mutating read.
 * Replacement arrays are flattened into the result.
 *
 * @see Collection::splice — `packages/collection/stubs/Collection.php:1768`. Wraps `array_splice`; mutates.
 *
 * @param data - The array to splice. Mutated in place.
 * @param offset - The starting index; a fraction is dropped, as array_splice()'s int parameter drops it
 * @param length - The number of items to remove, a fraction dropped. Null or none removes everything from offset on.
 * @param replacement - The replacement items (arrays will be flattened)
 * @returns The removed elements.
 * @throws TypeError when the offset or the length is NAN, infinite or outside PHP's int range, which array_splice()
 * refuses.
 */
export function splice<TValue, TReplacements>(
    data: TValue[],
    offset: number,
    length?: number | null,
    ...replacement: TReplacements[]
): TValue[] {
    // A prototype object is never written, and splicing removes and inserts elements every
    // inheritor would see; it splices nothing, as obj.splice does.
    if (!accessible(data) || isPrototypeObject(data)) {
        return [] as TValue[];
    }

    // Flatten replacement if it's an array within an array
    const flatReplacement: TValue[] = [];
    for (const item of replacement) {
        // array_splice takes the replacement's values; an object's keys are discarded.
        if (accessible(item) || isObject(item)) {
            flatReplacement.push(
                ...(Object.values(item as object) as TValue[]),
            );
        } else {
            flatReplacement.push(item as unknown as TValue);
        }
    }

    const { start, count } = resolveSpliceRange(data.length, offset, length);

    return data.splice(start, count, ...flatReplacement);
}

/**
 * Take items in the array until the given condition is met.
 *
 * A value is compared with PHP's `===`; a callback gets each value and index, and PHP truthiness judges its answer.
 *
 * @param data - The array to take items from.
 * @param value - The value to take until, or a callback answering whether an item meets the condition.
 * @returns A new array of the items before the first that meets the condition.
 *
 * @example
 *
 * takeUntil([1, 2, 3, 4], 3); -> [1, 2]
 * takeUntil([1, 2, 3, 4], (value) => value >= 3); -> [1, 2]
 * takeUntil([1, 2, 3, 4], 99); -> [1, 2, 3, 4]
 */
export function takeUntil<TValue>(
    data: ArrayItems<TValue>,
    value: NoInfer<TValue> | ((value: TValue, index: number) => unknown),
): TValue[];
export function takeUntil(
    data: readonly unknown[] | null | undefined,
    value: AnyValueOr<(value: unknown, index: number) => unknown>,
): unknown[];
export function takeUntil<TValue>(
    data: ArrayItems<TValue> | null | undefined,
    value: TValue | ((value: TValue, index: number) => unknown),
): TValue[] {
    const values = getAccessibleValues(data) as TValue[];
    const condition = conditionFor<TValue, number>(value);
    const end = values.findIndex(
        (item, index) => !isPhpFalsy(condition(item, index)),
    );

    return values.slice(0, end === -1 ? values.length : end);
}

/**
 * Take items in the array while the given condition is met.
 *
 * A value is compared with PHP's `===`; a callback gets each value and index, and PHP truthiness judges its answer.
 *
 * @param data - The array to take items from.
 * @param value - The value to take while items equal it, or a callback answering whether an item meets the condition.
 * @returns A new array of the items before the first that fails the condition.
 *
 * @example
 *
 * takeWhile([1, 1, 2, 2, 3, 3], 1); -> [1, 1]
 * takeWhile([1, 2, 3, 4], (value) => value < 3); -> [1, 2]
 * takeWhile([1, 2, 3, 4], 2); -> []
 */
export function takeWhile<TValue>(
    data: ArrayItems<TValue>,
    value: NoInfer<TValue> | ((value: TValue, index: number) => unknown),
): TValue[];
export function takeWhile(
    data: readonly unknown[] | null | undefined,
    value: AnyValueOr<(value: unknown, index: number) => unknown>,
): unknown[];
export function takeWhile<TValue>(
    data: ArrayItems<TValue> | null | undefined,
    value: TValue | ((value: TValue, index: number) => unknown),
): TValue[] {
    const condition = conditionFor<TValue, number>(value);

    return takeUntil(
        getAccessibleValues(data) as TValue[],
        (item: TValue, index: number) => isPhpFalsy(condition(item, index)),
    );
}

/**
 * Get a string item from an array using "dot" notation.
 * Throws an error if the value is not a string.
 *
 * @param data - The array to get the item from.
 * @param key - The key or dot-notated path of the item to get.
 * @param defaultValue - The default value if key is not found.
 * @returns The string value.
 * @throws InvalidArgumentException if the value is not a string.
 *
 * @example
 *
 * string(['hello', 'world'], 0); -> 'hello'
 * string([{name: 'John'}], '0.name'); -> 'John'
 * string([{name: 123}], '0.name'); -> throws InvalidArgumentException
 */
// Overload: typed array → string value
export function string<TValue, TDefault = null>(
    data: ArrayItems<TValue>,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): string;
// Overload: untyped array or nullish fallback
export function string<TDefault = null>(
    data: readonly unknown[] | null | undefined,
    key: PathKey,
    defaultValue?: TDefault | (() => TDefault) | null,
): string;
// Implementation
export function string<TValue, TDefault = null>(
    data: ArrayItems<TValue> | unknown,
    key: PathKey,
    defaultValue: TDefault | (() => TDefault) | null = null,
): string {
    const value = getMixedValue(data, key, defaultValue);

    if (!isString(value)) {
        throw new InvalidArgumentException(
            `Array value for key [${key}] must be a string, ${phpTypeName(value)} found.`,
        );
    }

    return value;
}

/**
 * Conditionally compile CSS classes from an array into a CSS class list.
 *
 * @param data - The array to convert to CSS classes.
 * @returns A string of CSS classes separated by spaces.
 *
 * @example
 *
 * toCssClasses(['font-bold', 'mt-4']); -> 'font-bold mt-4'
 * toCssClasses(['font-bold', 'mt-4', { 'ml-2': true, 'mr-2': false }]); -> 'font-bold mt-4 ml-2'
 * toCssClasses({ 'font-bold': true, 'text-red': false }); -> 'font-bold'
 */
// Overload: typed array → CSS class string
export function toCssClasses<TValue>(data: ArrayItems<TValue>): string;
// Overload: untyped array or nullish fallback
export function toCssClasses(
    data: readonly unknown[] | null | undefined,
): string;
// Implementation
export function toCssClasses(
    data: ArrayItems<unknown> | Record<string, unknown> | unknown,
): string {
    if (!accessible(data) && !isObject(data)) {
        return "";
    }

    // Handle arrays and objects directly
    let classList: Record<string, unknown>;

    if (isArray(data)) {
        classList = { ...data };
    } else {
        classList = data as Record<string, unknown>;
    }

    const classes: string[] = [];

    for (const [key, value] of Object.entries(classList)) {
        // PHP's is_numeric, not Number()/isNaN — hex, empty/blank
        // strings, and "Infinity" all parse under Number() but aren't
        // PHP-numeric (Arr.php:1214/1237); scientific notation is.
        const numericKey = isPhpNumeric(key);

        if (numericKey) {
            // Numeric key: push the value as-is (PHP-cast), like PHP
            // pushing $constraint straight into the array before implode().
            classes.push(cssListItemToString(value));
        } else {
            // String key: use key as class name if value is truthy
            if (!isPhpFalsy(value)) {
                classes.push(key);
            }
        }
    }

    return classes.join(" ");
}

/**
 * Conditionally compile CSS styles from an array into a CSS style list.
 *
 * @param data - The array to convert to CSS styles.
 * @returns A string of CSS styles separated by spaces, each ending with semicolon.
 *
 * @example
 *
 * toCssStyles(['font-weight: bold', 'margin-top: 4px']); -> 'font-weight: bold; margin-top: 4px;'
 * toCssStyles(['font-weight: bold', { 'margin-left: 2px': true, 'margin-right: 2px': false }]); -> 'font-weight: bold; margin-left: 2px;'
 */
// Overload: typed array → CSS style string
export function toCssStyles<TValue>(data: ArrayItems<TValue>): string;
// Overload: untyped array or nullish fallback
export function toCssStyles(
    data: readonly unknown[] | null | undefined,
): string;
// Implementation
export function toCssStyles(
    data: ArrayItems<unknown> | Record<string, unknown> | unknown,
): string {
    if (!accessible(data) && !isObject(data)) {
        return "";
    }

    // Handle arrays and objects directly
    let styleList: Record<string, unknown>;

    if (isArray(data)) {
        styleList = { ...data };
    } else {
        styleList = data as Record<string, unknown>;
    }

    const styles: string[] = [];

    for (const [key, value] of Object.entries(styleList)) {
        // PHP's is_numeric, not Number()/isNaN — hex, empty/blank
        // strings, and "Infinity" all parse under Number() but aren't
        // PHP-numeric (Arr.php:1214/1237); scientific notation is.
        const numericKey = isPhpNumeric(key);

        if (numericKey) {
            // Numeric key: push the value as-is (PHP-cast, then finished),
            // like PHP's Str::finish($constraint, ';').
            styles.push(finish(cssListItemToString(value), ";"));
        } else {
            // String key: use key as style if value is truthy
            if (!isPhpFalsy(value)) {
                styles.push(finish(key, ";"));
            }
        }
    }

    return styles.join(" ");
}

/**
 * Filter the array using the given callback.
 *
 * @param data - The array to filter.
 * @param callback - The function to call for each item (value, index) => boolean.
 * @returns A new filtered array.
 *
 * @example
 *
 * where([1, 2, 3, 4], (value) => value > 2); -> [3, 4]
 * where(['a', 'b', null, 'c'], (value) => value !== null); -> ['a', 'b', 'c']
 */
// Overload: array type with callback for proper type inference
export function where<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => unknown,
): TValue[];
// Overload: untyped array or nullish fallback
export function where<TValue>(
    data: readonly unknown[] | null | undefined,
    callback: (value: TValue, index: number) => unknown,
): TValue[];
// Implementation
export function where<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, index: number) => unknown,
): TValue[] {
    const values = getAccessibleValues(data);
    const result: TValue[] = [];

    for (let i = 0; i < values.length; i++) {
        const value = values[i] as TValue;
        if (!isPhpFalsy(callback(value, i))) {
            result.push(value);
        }
    }

    return result;
}

/**
 * Filter the array using the negation of the given callback.
 *
 * @param data - The array to filter.
 * @param callback - The function to call for each item (value, index) => boolean.
 * @returns A new filtered array with items that fail the test.
 *
 * @example
 *
 * reject([1, 2, 3, 4], (value) => value > 2); -> [1, 2]
 * reject(['a', 'b', null, 'c'], (value) => value === null); -> ['a', 'b', 'c']
 */
// Overload: array type with callback for proper type inference
export function reject<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => unknown,
): TValue[];
// Overload: untyped array or nullish fallback
export function reject<TValue>(
    data: readonly unknown[] | null | undefined,
    callback: (value: TValue, index: number) => unknown,
): TValue[];
// Implementation
export function reject<TValue>(
    data: ArrayItems<TValue> | null | undefined,
    callback: (value: TValue, index: number) => unknown,
): TValue[] {
    return where(data, (value, index) => isPhpFalsy(callback(value, index)));
}

/**
 * Replace the data items with the given replacer items.
 *
 * The replacer is read the way `getArrayableItems()` reads it (a scalar as `[scalar]`), and each of
 * its integer keys replaces or adds that index, an index none fills holding `undefined`. A string key,
 * which a list can't hold, is dropped, as `union` drops one.
 *
 * @see Collection::replace — `packages/collection/stubs/Collection.php:1183`.
 *      Wraps `array_replace`.
 *
 * @param data - The array to replace items in.
 * @param replacerData - The list, object or Collection-like operand holding the items to replace.
 * @returns A new array with the replaced items.
 *
 * @example
 *
 * replace(['a', 'b', 'c'], ['d', 'e']); -> ['d', 'e', 'c']
 * replace(['a', 'b', 'c'], { 1: 'd', 2: 'e', 3: 'f' }); -> ['a', 'd', 'e', 'f']
 */
// Overload: null/undefined replacer — returns original array unchanged
export function replace<TValue>(
    data: ArrayItems<TValue>,
    replacerData: null | undefined,
): TValue[];
// Overload: array replacer — sequential replacement, no gaps
export function replace<TValue>(
    data: ArrayItems<TValue>,
    replacerData: ArrayItems<TValue>,
): TValue[];
// Overload: array replacer with different type — sequential replacement, no gaps
export function replace<TValue, TReplace>(
    data: ArrayItems<TValue>,
    replacerData: TReplace[],
): (TValue | TReplace)[];
// Overload: object replacer — sparse indices can fill gaps with undefined
export function replace<TValue, TReplace = TValue>(
    data: ArrayItems<TValue>,
    replacerData: Record<number, TReplace>,
): (TValue | TReplace | undefined)[];
// Overload: generic fallback
export function replace<TValue, TReplace = TValue>(
    data: readonly unknown[] | null | undefined,
    replacerData: ArrayItems<TReplace> | Record<number, TReplace> | unknown,
): (TValue | TReplace | undefined)[];
export function replace<TValue, TReplace = TValue>(
    data: ArrayItems<TValue> | unknown,
    replacerData: ArrayItems<TReplace> | Record<number, TReplace> | unknown,
): (TValue | TReplace | undefined)[] {
    const values: (TValue | TReplace | undefined)[] = getAccessibleValues(data);

    for (const [key, value] of Object.entries(arrayableItems(replacerData))) {
        // PHP keeps "k", "01", "-1" or "1.5" as a key of its keyed result; a list holds only integer keys, as in union.
        if (!isIntegerLikeKey(key)) {
            continue;
        }

        while (values.length < Number(key)) {
            values.push(undefined);
        }

        values[Number(key)] = value as TReplace;
    }

    return values;
}

/**
 * Recursively replace the data items with the given items.
 *
 * The replacer is read the way `getArrayableItems()` reads it (a scalar as `[scalar]`), and only its
 * integer keys apply: a string key, which a list can't hold, is dropped, as `union` drops one. Each index
 * merges the way `@tolki/obj`'s `replaceRecursive` merges a key: two arrays or plain objects merge,
 * and anything else, a `Date` or class instance included, is replaced whole.
 *
 * @see Collection::replaceRecursive — `packages/collection/stubs/Collection.php:1194`. Wraps `array_replace_recursive`.
 *
 * @param data - The original array to replace items in.
 * @param replacerData - The list, object or Collection-like operand holding the items to replace.
 * @returns A new array with the replaced items.
 */
// Overload: null/undefined replacer — returns original type unchanged
export function replaceRecursive<TValue>(
    data: ArrayItems<TValue>,
    replacerData: null | undefined,
): TValue[];
// Overload: array replacer with same type — replaces by index
export function replaceRecursive<TValue>(
    data: ArrayItems<TValue>,
    replacerData: ArrayItems<TValue>,
): (TValue | undefined)[];
// Overload: array replacer with different type — replaces by index
export function replaceRecursive<TValue, TReplace>(
    data: ArrayItems<TValue>,
    replacerData: TReplace[],
): (TValue | TReplace | undefined)[];
// Overload: object replacer — sparse indices can fill gaps with undefined
export function replaceRecursive<TValue, TReplace = TValue>(
    data: ArrayItems<TValue>,
    replacerData: Record<number, TReplace>,
): (TValue | TReplace | undefined)[];
// Overload: generic fallback
export function replaceRecursive<TValue, TReplace = TValue>(
    data: readonly unknown[] | null | undefined,
    replacerData: ArrayItems<TReplace> | Record<number, TReplace> | unknown,
): (TValue | TReplace | undefined)[];
export function replaceRecursive<TValue, TReplace = TValue>(
    data: ArrayItems<TValue> | unknown,
    replacerData: ArrayItems<TReplace> | Record<number, TReplace> | unknown,
): (TValue | TReplace | undefined)[] {
    const values = getAccessibleValues(data) as TValue[];
    // PHP keeps "k", "01", "-1" or "1.5" as a key of its keyed result; a list holds only integer keys, as in union.
    const replacer = Object.fromEntries(
        Object.entries(arrayableItems(replacerData)).filter(([key]) =>
            isIntegerLikeKey(key),
        ),
    ) as Record<number, TReplace>;

    // Each index merges exactly as obj.replaceRecursive merges a key, so the two backings can't drift apart;
    // this only turns obj's index-keyed result back into a list, filling any gap with undefined.
    const merged = objReplaceRecursive(
        { ...(values as object) } as Record<PropertyKey, TValue>,
        replacer,
    ) as Record<string, TValue | TReplace>;
    const result: (TValue | TReplace | undefined)[] = [];

    for (const [key, value] of Object.entries(merged)) {
        while (result.length < Number(key)) {
            result.push(undefined);
        }

        result.push(value);
    }

    return result;
}

/**
 * Reverse the order of the array and return the result.
 *
 * @see Collection::reverse — `packages/collection/stubs/Collection.php:1204`.
 *      Wraps `array_reverse($items, true)` — preserves keys.
 *
 * @param data - The array to reverse.
 * @returns A new array with the items in reverse order.
 *
 * @example
 *
 * reverse([1, 2, 3]); -> [3, 2, 1]
 * reverse(['a', 'b', 'c']); -> ['c', 'b', 'a']
 */
export function reverse<TValue>(data: ArrayItems<TValue>): TValue[];
export function reverse(data: readonly unknown[] | null | undefined): unknown[];
export function reverse<TValue>(data: ArrayItems<TValue> | unknown): TValue[] {
    const values = getAccessibleValues(data) as TValue[];

    return values.slice().reverse();
}

/**
 * Pad array to the specified length with a value.
 *
 * If size is positive, pads on the right (append).
 * If size is negative, pads on the left (prepend).
 *
 * @see Collection::pad — `packages/collection/stubs/Collection.php:1917`.
 *      Wraps `array_pad`.
 *
 * @param data - The array to pad.
 * @param size - The desired length of the array (negative means pad left); a fraction is dropped.
 * @param value - The value to pad with.
 * @returns A new padded array.
 * @throws TypeError when the size is NAN, infinite or outside PHP's int range, as array_pad() refuses it.
 * @throws Error when the size is past PHP's maximum array size, as array_pad()'s ValueError.
 *
 * @example
 *
 * pad([1, 2, 3], 5, 0); -> [1, 2, 3, 0, 0]
 * pad([1, 2, 3], -5, 0); -> [0, 0, 1, 2, 3]
 */
export function pad<TPadValue, TValue>(
    data: ArrayItems<TValue>,
    size: number,
    value: TPadValue,
): (TValue | TPadValue)[] {
    const length = resolvePadLength(size);
    const values = getAccessibleValues(data) as TValue[];
    const currentLength = values.length;
    const absSize = Math.abs(length);

    // If current length is already >= desired size, no padding needed
    if (absSize <= currentLength) {
        return values;
    }

    const padLength = absSize - currentLength;
    const padArray = Array(padLength).fill(value) as TPadValue[];

    // Negative size means pad at the beginning (prepend)
    if (length < 0) {
        return [...padArray, ...values];
    }

    // Positive size means pad at the end (append)
    return [...values, ...padArray];
}

/**
 * Partition the array into two arrays using the given callback.
 *
 * @param data - The array to partition.
 * @param callback - The function to call for each item (value, index) => boolean.
 * @returns A tuple containing [passed, failed] arrays.
 *
 * @example
 *
 * partition([1, 2, 3, 4], (value) => value > 2); -> [[3, 4], [1, 2]]
 * partition(['a', 'b', null, 'c'], (value) => value !== null); -> [['a', 'b', 'c'], [null]]
 */
// Overload: array type with callback for proper type inference
export function partition<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => unknown,
): [TValue[], TValue[]];
// Overload: untyped array or nullish fallback
export function partition<TValue>(
    data: readonly unknown[] | null | undefined,
    callback: (value: TValue, index: number) => unknown,
): [TValue[], TValue[]];
// Implementation
export function partition<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback: (value: TValue, index: number) => unknown,
): [TValue[], TValue[]] {
    const values = getAccessibleValues(data);
    const passed: TValue[] = [];
    const failed: TValue[] = [];

    for (let i = 0; i < values.length; i++) {
        const value = values[i] as TValue;
        if (!isPhpFalsy(callback(value, i))) {
            passed.push(value);
        } else {
            failed.push(value);
        }
    }

    return [passed, failed];
}

/**
 * Filter items where the value is not null.
 *
 * @param data - The array to filter.
 * @returns A new array with null values removed.
 *
 * @example
 *
 * whereNotNull([1, null, 2, undefined, 3]); -> [1, 2, undefined, 3]
 * whereNotNull(['a', null, 'b', null]); -> ['a', 'b']
 */
// Overload: typed array → null removed from the element type
export function whereNotNull<TData extends readonly unknown[]>(
    data: TData,
): NonNullableArray<TData>;
// Overload: untyped array or nullish fallback
export function whereNotNull(
    data: readonly unknown[] | null | undefined,
): unknown[];
// Implementation
export function whereNotNull<TValue>(
    data: ArrayItems<TValue> | null | undefined,
): TValue[] {
    return where(data, (value) => !isNull(value));
}

/**
 * Build the predicate `contains`'s key/operator/value form searches with, the way
 * `EnumeratesValues::operatorForWhere()` does: a callable key is the predicate itself,
 * and a null key compares the item rather than a path within it.
 *
 * @param key - The path to read from each item, a ready-made predicate, or null for the item
 * @param operator - The comparison operator
 * @param value - The value to compare against
 * @returns A predicate over one item
 */
function operatorPredicate<TValue>(
    key: unknown,
    operator: string,
    value: unknown,
): (item: TValue) => boolean {
    if (isFunction(key)) {
        return key as (item: TValue) => boolean;
    }

    return (item: TValue): boolean =>
        operatorMatch(readItemPath(item, key), operator, value);
}

/**
 * Read `key` from one item the way PHP's `data_get()` does: a null key answers the item
 * itself, a missing path answers null rather than JavaScript's undefined.
 *
 * @param item - The item to read from
 * @param key - The dot-notated path, or null for the item itself
 * @returns The value at the path, or null when the path is missing
 */
function readItemPath(item: unknown, key: unknown): unknown {
    if (isNull(key) || isUndefined(key)) {
        return item;
    }

    return getNestedValue(item, key as PropertyKey) ?? null;
}

/**
 * Check if an array contains a given value, a matching item, or a matching key path.
 *
 * A third argument that is a boolean or absent is this port's `strict` flag, so PHP's
 * key/value form `contains($key, $flag)` is written with an explicit operator here.
 * Otherwise a third argument is the key/value form's value, and a fourth makes the
 * third the operator. A null or undefined key compares the item itself, and a callable
 * key is the predicate, as `operatorForWhere` treats one.
 *
 * The key/value row therefore declares `NonBooleanValue`, and four third-argument shapes
 * pay for it — each rejected, each written as `contains(data, key, "=", value)` instead:
 * an `unknown` value; a union holding `boolean` (`string | boolean`, `null | boolean`);
 * an unconstrained type parameter, which could be instantiated with `boolean`; and a type
 * parameter whose constraint holds `boolean`. A plain `boolean` is NOT among them: it
 * matches the earlier `strict` row, which is what the runtime does with it.
 *
 * @see Collection::contains — `packages/collection/stubs/Collection.php:196`.
 *      Value/callback/key-operator-value search; has no `Arr.php` counterpart at all.
 *
 * @param data - The array to search in.
 * @param value - The value to search for, or the key path when a third argument follows.
 * @param key - The dot path read from each item, a predicate, or null for the item itself.
 * @param operator - One of PHP's `where()` operators when a fourth argument follows; any
 *                   other value shares the `=` arm, as PHP's `switch` default does.
 * @param strict - Whether to use strict comparison.
 * @returns True if the value is found, false otherwise.
 *
 * @example
 *
 * contains([1, 2, 3], 2); -> true
 * contains(['a', 'b', 'c'], 'd'); -> false
 * contains([1, '1'], '1', true); -> true
 * contains([{ age: 30 }], 'age', 30); -> true (key/value)
 * contains([{ age: 30 }], 'age', '>', 25); -> true (key/operator/value)
 * contains([{ on: true }], 'on', '=', true); -> true (a boolean value needs the operator)
 */
// Overload: callback function - infers TValue from array type
export function contains<TValue>(
    data: ArrayItems<TValue>,
    value: (value: TValue, key: number) => unknown,
    strict?: boolean,
): boolean;
// Overload: value comparison - infers TValue from array type
export function contains<TValue>(
    data: ArrayItems<TValue>,
    value: TValue,
    strict?: boolean,
): boolean;
// Overload: untyped array or nullish fallback
export function contains<TValue>(
    data: readonly unknown[] | null | undefined,
    value: TValue | ((value: TValue, key: number) => unknown),
    strict?: boolean,
): boolean;
// Overload: PHP's key/operator/value form — `contains('age', '>', 30)`. A callable key
// is the predicate itself, as `operatorForWhere` treats one, so the rest is ignored. The
// operator is `unknown` because PHP's is `mixed`: anything its switch does not name shares
// the `=` arm ("r3-contains-boolean-value", "non-string-operator").
export function contains<TValue>(
    data: readonly unknown[] | null | undefined,
    key: PathKey | ((value: TValue, key: number) => unknown),
    operator: unknown,
    value: unknown,
): boolean;
// Overload: PHP's key/value form — `contains('age', 30)`, an `=` comparison. The value is
// every type but `boolean`: a boolean third argument is this port's `strict` flag, which
// takes it first, so PHP's `contains($key, $flag)` is written `contains(data, key, "=", flag)`.
export function contains<TValue>(
    data: readonly unknown[] | null | undefined,
    key: PathKey | ((value: TValue, key: number) => unknown),
    value: NonBooleanValue,
): boolean;
// Implementation
export function contains<TValue>(
    data: ArrayItems<TValue> | unknown,
    value: TValue | ((value: TValue, key: number) => unknown),
    ...rest: readonly unknown[]
): boolean {
    // PHP overloads on func_num_args(); this port's third parameter is `strict`, so the
    // operator form is taken only when a non-boolean lands there or a fourth follows.
    const [third, fourth] = rest;

    if (
        rest.length > 1 ||
        (rest.length === 1 && !isBoolean(third) && !isUndefined(third))
    ) {
        const operator = rest.length > 1 ? String(third) : "=";

        return contains(
            data as readonly unknown[],
            operatorPredicate<TValue>(
                value,
                operator,
                rest.length > 1 ? fourth : third,
            ),
        );
    }

    const strict = third === true;

    if (!isArray(data)) {
        return false;
    }

    if (isFunction(value)) {
        const callback = value as (value: TValue, key: number) => unknown;

        for (const [index, item] of data.entries()) {
            if (!isPhpFalsy(callback(item as TValue, index))) {
                return true;
            }
        }

        return false;
    }

    if (strict) {
        return data.some((item) => strictEqual(item, value));
    }

    // Use PHP-like loose comparison
    return data.some((item) => looseEqual(item, value));
}

/**
 * Check if an array contains a given value, using strict comparison.
 *
 * With a second argument, each item's `key` path is compared with it the way PHP's
 * `===` compares — so an array or plain object matches by value, in order. Without one,
 * this is `contains(data, key, true)`: `in_array($key, $items, true)` for a value, and
 * `array_any($items, $key)` for a callback, so a match holding null counts.
 *
 * @see Collection::containsStrict — `packages/collection/stubs/Collection.php:216`.
 *
 * @param data - The array to search in.
 * @param key - The value to search for, or the path to compare when `value` is given.
 * @param value - The value the path must strictly equal.
 * @returns True if the item is found, false otherwise.
 *
 * @example
 *
 * containsStrict([1, 3, 5, '02'], '02'); -> true
 * containsStrict([1, 3, 5, '02'], 2); -> false
 * containsStrict([{ tags: ['a', 'b'] }], 'tags', ['a', 'b']); -> true
 * containsStrict([1, null, 2], (value) => value === null); -> true
 */
export function containsStrict<TValue>(
    data: ArrayItems<TValue>,
    key: TValue | ((value: TValue, index: number) => unknown),
): boolean;
export function containsStrict(
    data: readonly unknown[] | null | undefined,
    key: unknown,
    value?: unknown,
): boolean;
export function containsStrict<TValue>(
    data: ArrayItems<TValue> | unknown,
    key: TValue | ((value: TValue, index: number) => unknown),
    value?: unknown,
): boolean {
    // PHP takes the two-argument form whenever a second argument is passed, a null one included.
    if (!isUndefined(value)) {
        return contains(data as readonly unknown[], (item) =>
            strictEqual(readItemPath(item, key), value),
        );
    }

    return contains(data as readonly unknown[], key, true);
}

/**
 * Filter the array using a callback function.
 *
 * @see Collection::filter — `packages/collection/stubs/Collection.php:425`.
 *      With a callback, delegates to `Arr::where()`; without one, wraps `array_filter`.
 *
 * @param data - The array to filter.
 * @param callback - Optional callback function to filter items.
 * @returns A new filtered array.
 *
 * @example
 *
 * filter([1, 2, 3, 4], (x) => x > 2); -> [3, 4]
 * filter([1, null, 2, undefined, 3]); -> [1, 2, 3]
 * filter(["0", "", 0, "x"]); -> ["x"]
 * filter(["00", "0.0"]); -> ["00", "0.0"]
 */
// Overload: no callback → PHP-falsy values removed from the element type
export function filter<TData extends readonly unknown[]>(
    data: TData,
): TruthyArray<TData>;
// Overload: with callback → element type preserved
export function filter<TValue>(
    data: ArrayItems<TValue>,
    callback: (value: TValue, index: number) => unknown,
): TValue[];
// Overload: untyped array or nullish fallback
export function filter<TValue>(
    data: readonly unknown[] | null | undefined,
    callback?: (value: TValue, index: number) => unknown,
): TValue[];
// Implementation
export function filter<TValue>(
    data: ArrayItems<TValue> | unknown,
    callback?: (value: TValue, index: number) => unknown,
): TValue[] {
    if (!isArray(data)) {
        return [];
    }

    if (!isFunction(callback)) {
        // Filter out PHP-falsy values by default
        return data.filter((value): value is TValue => !isPhpFalsy(value));
    }

    return (data as TValue[]).filter(
        (value, index) => !isPhpFalsy(callback(value, index)),
    );
}

/**
 * If the given value is not an array and not null, wrap it in one.
 *
 * @param value - The value to wrap.
 * @returns An array containing the value, or an empty array if null.
 *
 * @example
 *
 * wrap('hello'); -> ['hello']
 * wrap(['hello']); -> ['hello']
 * wrap(null); -> []
 * wrap(undefined); -> [undefined]
 */
// A bare literal makes this row specialized, so TypeScript tries it first — which is
// where it belongs anyway. Deliberate, not the violation it keeps being read as.
export function wrap(value: null): [];
export function wrap<TValue>(value: TValue[]): TValue[];
// Overload: readonly array → passed through unchanged (must sit above the
// scalar overload below, which would otherwise match any readonly array as
// a single value to wrap in a one-tuple). Returns `readonly TValue[]`
// because wrap aliases its input array rather than copying it — a mutable
// return type here would allow writes through to the readonly source.
export function wrap<TValue>(value: readonly TValue[]): readonly TValue[];
export function wrap<TValue>(value: TValue): WrapResult<TValue>;
export function wrap<TValue>(value: TValue | null): TValue[] | [] {
    if (isNull(value)) {
        return [];
    }

    return isArray<TValue>(value) ? value : [value];
}

/**
 * Get all keys from an array.
 *
 * @see Collection::keys — `packages/collection/stubs/Collection.php:793`.
 *      Wraps `array_keys`.
 *
 * @param data - The array to get keys from.
 * @returns An array of all keys.
 *
 * @example
 *
 * keys(['name', 'age', 'city']); -> [0, 1, 2]
 * keys([]); -> []
 */
// Overload: typed array → numeric index list
export function keys<TValue>(data: ArrayItems<TValue>): number[];
// Overload: untyped array or nullish fallback
export function keys(data: readonly unknown[] | null | undefined): number[];
// Implementation
export function keys<TValue>(data: ArrayItems<TValue> | unknown): number[] {
    if (!accessible(data)) {
        return [];
    }

    return Array.from(data.keys());
}

/**
 * Get all values from an array.
 *
 * @see Collection::values — `packages/collection/stubs/Collection.php:1883`.
 *      Wraps `array_values`.
 *
 * @param data - The array to get values from.
 * @returns An array of all values.
 *
 * @example
 *
 * values(['name', 'age', 'city']); -> ['name', 'age', 'city']
 * values([]); -> []
 */
export function values<TValue>(data: ArrayItems<TValue>): TValue[];
export function values(data: readonly unknown[] | null | undefined): unknown[];
export function values<TValue>(data: ArrayItems<TValue> | unknown): TValue[] {
    if (!accessible(data)) {
        return [];
    }

    return Array.from((data as ArrayItems<TValue>).values());
}

/**
 * Get the items that are not present in the given array.
 *
 * Compares scalars the way PHP's `(string) $a === (string) $b` does (see
 * `phpValueMatch`); `other` is normalized by `arrayableValues`.
 *
 * @see Collection::diff — `packages/collection/stubs/Collection.php:277`. Wraps `array_diff`.
 *
 * @param data - The original array.
 * @param other - The items to compare against (array, object, scalar or nullish).
 * @returns A new array containing items from data that are not in other.
 */
export function diff<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
): TValue[];
export function diff<TValue>(
    data: readonly unknown[] | null | undefined,
    other: ArrayItems<TValue> | unknown,
): TValue[];
export function diff<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
): TValue[] {
    if (!accessible(data)) {
        return [];
    }

    const otherValues = arrayableValues<TValue>(other);
    const matches = phpValueMatcher(otherValues);
    const result: TValue[] = [];

    for (const item of data as ArrayItems<TValue>) {
        if (!matches(item)) {
            result.push(item);
        }
    }

    return result;
}

/**
 * Get the items whose index and value are not both present in the given other array.
 *
 * This is `array_diff_assoc` — unlike `diff`, matching by index+value, not by value
 * alone. `other` is normalized by `arrayableItems`, so each index is looked up among
 * its keys: a keyed operand matches by key, never by position, and a nullish one is empty.
 *
 * @see Collection::diffAssoc — `packages/collection/stubs/Collection.php:300`. Wraps `array_diff_assoc`.
 *
 * @param data - The original array
 * @param other - The array to diff against
 * @returns A new array containing items whose index+value pair is not in other
 */
export function diffAssoc<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
): TValue[];
export function diffAssoc(
    data: readonly unknown[] | null | undefined,
    other: unknown,
): unknown[];
export function diffAssoc<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    const otherItems = arrayableItems(other);

    return (getAccessibleValues(data) as TValue[]).filter(
        (value, index) =>
            !Object.hasOwn(otherItems, index) ||
            !phpValueMatch(value, otherItems[index]),
    );
}

/**
 * Get the items whose index is not present in the given other data.
 *
 * This is `array_diff_key` — values are ignored entirely; only the index decides.
 * `other` is normalized by `arrayableItems`, so a keyed operand matches by key.
 * PHP keeps each survivor's original index; a JavaScript list cannot hold the gap,
 * so the survivors are reindexed, as every other list-returning helper here does.
 *
 * @see Collection::diffKeys — `packages/collection/stubs/Collection.php:323`. Wraps `array_diff_key`.
 *
 * @param data - The original array
 * @param other - The data to diff against
 * @returns A new array holding the items whose index is not in other
 *
 * @example
 *
 * diffKeys([1, 2, 3], [9, 9]); -> [3]
 * diffKeys([1, 2], { a: 1, 1: 5 }); -> [1]
 */
export function diffKeys<TValue>(
    data: ArrayItems<TValue>,
    other: unknown,
): TValue[];
export function diffKeys(
    data: readonly unknown[] | null | undefined,
    other: unknown,
): unknown[];
export function diffKeys<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: unknown,
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    const otherItems = arrayableItems(other);

    return (getAccessibleValues(data) as TValue[]).filter(
        (_value, index) => !Object.hasOwn(otherItems, index),
    );
}

/**
 * Get the items whose value is not present in the given other data, comparing with a callback.
 *
 * This is `array_udiff` — the callback replaces the default `(string)` cast comparison,
 * and reports whether two values are equal. `other` is normalized by `arrayableValues`.
 *
 * @see Collection::diffUsing — `packages/collection/stubs/Collection.php:289`. Wraps `array_udiff`.
 *
 * @param data - The original array
 * @param other - The data to diff against
 * @param callable - Function that reports whether two values are equal
 * @returns A new array holding the items no value of other is equal to
 *
 * @example
 *
 * const strcasecmp = (a: unknown, b: unknown) => String(a).toLowerCase() === String(b).toLowerCase();
 * diffUsing(['green', 'brown', 'blue'], ['GREEN', 'yellow'], strcasecmp); -> ['brown', 'blue']
 */
export function diffUsing<TValue, TOther>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TOther>,
    callable: (a: TValue, b: TOther) => boolean,
): TValue[];
export function diffUsing<TValue, TOther>(
    data: readonly unknown[] | null | undefined,
    other: unknown,
    callable: (a: TValue, b: TOther) => boolean,
): TValue[];
export function diffUsing<TValue, TOther = TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TOther> | unknown,
    callable: (a: TValue, b: TOther) => boolean,
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    const otherValues = arrayableValues<TOther>(other);

    return (getAccessibleValues(data) as TValue[]).filter(
        (value) =>
            !otherValues.some((otherValue) => callable(value, otherValue)),
    );
}

/**
 * Get the items whose index and value are not both present in the given other data,
 * comparing indexes with a callback.
 *
 * This is `array_diff_uassoc` — the callback reports whether two keys match, and the
 * values of a matching pair are compared with PHP's `(string)` cast rule. `other` is
 * normalized by `arrayableItems`, and the survivors are reindexed.
 *
 * @see Collection::diffAssocUsing — `packages/collection/stubs/Collection.php:312`.
 *      Wraps `array_diff_uassoc`.
 *
 * @param data - The original array
 * @param other - The data to diff against
 * @param callback - Function that reports whether two keys match
 * @returns A new array holding the items no matching key/value pair of other covers
 *
 * @example
 *
 * const same = (a: unknown, b: unknown) => String(a) === String(b);
 * diffAssocUsing([1, 2, 3], [1, 9, 3], same); -> [2]
 */
export function diffAssocUsing<TValue>(
    data: ArrayItems<TValue>,
    other: unknown,
    callback: (keyA: number, keyB: string | number) => boolean,
): TValue[];
export function diffAssocUsing(
    data: readonly unknown[] | null | undefined,
    other: unknown,
    callback: (keyA: number, keyB: string | number) => boolean,
): unknown[];
export function diffAssocUsing<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: unknown,
    callback: (keyA: number, keyB: string | number) => boolean,
): TValue[] {
    return diffKeyedUsing(data, other, callback, true);
}

/**
 * Get the items whose index is not present in the given other data, comparing indexes
 * with a callback.
 *
 * This is `array_diff_ukey` — values are ignored entirely. `other` is normalized by
 * `arrayableItems`, and the survivors are reindexed.
 *
 * @see Collection::diffKeysUsing — `packages/collection/stubs/Collection.php:335`.
 *      Wraps `array_diff_ukey`.
 *
 * @param data - The original array
 * @param other - The data to diff against
 * @param callback - Function that reports whether two keys match
 * @returns A new array holding the items whose index no key of other matches
 *
 * @example
 *
 * const same = (a: unknown, b: unknown) => String(a) === String(b);
 * diffKeysUsing([1, 2], { a: 1, 1: 5 }, same); -> [1]
 */
export function diffKeysUsing<TValue>(
    data: ArrayItems<TValue>,
    other: unknown,
    callback: (keyA: number, keyB: string | number) => boolean,
): TValue[];
export function diffKeysUsing(
    data: readonly unknown[] | null | undefined,
    other: unknown,
    callback: (keyA: number, keyB: string | number) => boolean,
): unknown[];
export function diffKeysUsing<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: unknown,
    callback: (keyA: number, keyB: string | number) => boolean,
): TValue[] {
    return diffKeyedUsing(data, other, callback, false);
}

/**
 * The shared walk behind `diffAssocUsing` and `diffKeysUsing`: find the first key of
 * `other` the callback matches, then either compare the values or ignore them.
 *
 * @param data - The original array
 * @param other - The data to diff against
 * @param callback - Function that reports whether two keys match
 * @param compareValue - Whether a matching key still has to carry a matching value
 * @returns The surviving items, reindexed
 */
function diffKeyedUsing<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: unknown,
    callback: (keyA: number, keyB: string | number) => boolean,
    compareValue: boolean,
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    const otherItems = arrayableItems(other);
    const otherKeys = Object.keys(otherItems);

    return (getAccessibleValues(data) as TValue[]).filter((value, index) => {
        const matchingKey = otherKeys.find((otherKey) =>
            callback(index, phpArrayKey(otherKey)),
        );

        return (
            matchingKey === undefined ||
            (compareValue && !phpValueMatch(otherItems[matchingKey], value))
        );
    });
}

/**
 * Intersect the data array with the given other array.
 *
 * Compares scalars the way PHP's `(string) $a === (string) $b` does (see
 * `phpValueMatch`); `other` is normalized by `arrayableValues`. `callable`, when
 * given, replaces the default comparator.
 *
 * @see Collection::intersect — `packages/collection/stubs/Collection.php:663`. Wraps `array_intersect`.
 *
 * @param data - The original array
 * @param other - The items to intersect with (array, object, scalar or nullish)
 * @param callable - Optional function to compare values
 * @returns A new array containing items present in both arrays
 */
// Overload: with callback - infers TValue and TOther from array types
export function intersect<TValue, TOther>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TOther>,
    callable: (a: TValue, b: TOther) => boolean,
): TValue[];
// Overload: without callback - same type comparison
export function intersect<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
    callable?: null,
): TValue[];
// Overload: untyped array or nullish fallback
export function intersect<TValue, TOther>(
    data: readonly unknown[] | null | undefined,
    other: unknown,
    callable?: ((a: TValue, b: TOther) => boolean) | null,
): TValue[];
// Implementation
export function intersect<TValue, TOther = TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TOther> | unknown,
    callable: ((a: TValue, b: TOther) => boolean) | null = null,
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    const dataValues = getAccessibleValues(data) as TValue[];
    const otherValues = arrayableValues<TOther>(other);
    const result: TValue[] = [];

    if (isFunction(callable)) {
        for (const item of dataValues) {
            if (otherValues.some((otherItem) => callable(item, otherItem))) {
                result.push(item);
            }
        }

        return result;
    }

    const matches = phpValueMatcher(otherValues);

    for (const item of dataValues) {
        if (matches(item)) {
            result.push(item);
        }
    }

    return result;
}

/**
 * Intersect the array with the given items, comparing values with a callback.
 *
 * This is `array_uintersect`. It is `intersect`'s third parameter under its own name,
 * so the two share one algorithm; the callback reports whether two values are equal.
 *
 * @see Collection::intersectUsing — `packages/collection/stubs/Collection.php:675`.
 *      Wraps `array_uintersect`.
 *
 * @param data - The original array
 * @param other - The items to intersect with
 * @param callable - Function that reports whether two values are equal
 * @returns A new array holding the items some value of other is equal to
 *
 * @example
 *
 * const strcasecmp = (a: unknown, b: unknown) => String(a).toLowerCase() === String(b).toLowerCase();
 * intersectUsing(['green', 'brown', 'blue'], ['GREEN', 'yellow'], strcasecmp); -> ['green']
 */
export function intersectUsing<TValue, TOther>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TOther>,
    callable: (a: TValue, b: TOther) => boolean,
): TValue[];
export function intersectUsing<TValue, TOther>(
    data: readonly unknown[] | null | undefined,
    other: unknown,
    callable: (a: TValue, b: TOther) => boolean,
): TValue[];
export function intersectUsing<TValue, TOther = TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TOther> | unknown,
    callable: (a: TValue, b: TOther) => boolean,
): TValue[] {
    return intersect(
        data as ArrayItems<TValue>,
        other as ArrayItems<TOther>,
        callable,
    );
}

/**
 * Intersect the array with the given items with additional index check.
 * Returns items where both the index AND value match.
 *
 * `other` is normalized by `arrayableItems`, so each index is looked up among its keys:
 * a keyed operand matches by key, never by position.
 *
 * @see Collection::intersectAssoc — `packages/collection/stubs/Collection.php:686`.
 *      Wraps `array_intersect_assoc`.
 *
 * @param data - The original array
 * @param other - The array to intersect with
 * @returns A new array containing items where both index and value match
 *
 * @example
 *
 * intersectAssoc([1, 2, 3], [2, 3, 4]); -> []
 * intersectAssoc(['a', 'b', 'c'], ['a', 'b', 'd']); -> ['a', 'b']
 * intersectAssoc([1, 2, 3, 4], [5, 2, 3]); -> [2, 3]
 */
// Overload: typed arrays → element type preserved
export function intersectAssoc<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
): TValue[];
// Overload: untyped array or nullish fallback
export function intersectAssoc(
    data: readonly unknown[] | null | undefined,
    other: unknown,
): unknown[];
// Implementation
export function intersectAssoc<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    const otherItems = arrayableItems(other);

    return (getAccessibleValues(data) as TValue[]).filter(
        (value, index) =>
            Object.hasOwn(otherItems, index) &&
            phpValueMatch(value, otherItems[index]),
    );
}

/**
 * Intersect the array with the given items with additional index check, using the callback.
 * The callback is used to compare indices, while values are compared by PHP's `(string)` cast rule.
 *
 * `other` is normalized by `arrayableItems`, so the callback receives each of its real keys: an
 * index for a list, or the key PHP would store (a number for a canonical integer) for a keyed operand.
 *
 * @see Collection::intersectAssocUsing — `packages/collection/stubs/Collection.php:698`.
 *      Wraps `array_intersect_uassoc`.
 *
 * @param data - The original array
 * @param other - The array to intersect with
 * @param callback - The callback function to compare indices (returns true if indices match)
 * @returns A new array containing items where both index (via callback) and value match
 *
 * @example
 *
 * Example: treat all indices as equal (not very useful, but demonstrates the concept)
 * const alwaysEqual = (a: number, b: number) => true;
 * intersectAssocUsing([1, 2, 3], [1, 2, 3], alwaysEqual); -> [1, 2, 3]
 */
export function intersectAssocUsing<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<TValue>,
    callback: (keyA: number, keyB: number) => boolean,
): TValue[];
// Overload: a list, nullish or scalar operand only has integer keys
export function intersectAssocUsing<TValue>(
    data: readonly unknown[] | null | undefined,
    other: ArrayItems<unknown> | string | number | boolean | null | undefined,
    callback: (keyA: number, keyB: number) => boolean,
): TValue[];
// Overload: a keyed operand (object, Map, Collection-like) can hand the callback a string key
export function intersectAssocUsing<TValue>(
    data: readonly unknown[] | null | undefined,
    other: unknown,
    callback: (keyA: number, keyB: number | string) => boolean,
): TValue[];
export function intersectAssocUsing<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
    callback: (keyA: number, keyB: number) => boolean,
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    const otherEntries = Object.entries(arrayableItems(other));

    return (getAccessibleValues(data) as TValue[]).filter((value, index) =>
        otherEntries.some(
            ([otherKey, otherValue]) =>
                // Only the keyed overload's operand yields a string key, and its callback accepts one.
                callback(index, phpArrayKey(otherKey) as number) &&
                phpValueMatch(value, otherValue),
        ),
    );
}

/**
 * Intersect the array with the given items by key.
 *
 * `other` is normalized by `arrayableItems`, so an index survives only when it is one of
 * `other`'s keys: a keyed operand matches by key, never by position.
 *
 * @see Collection::intersectByKeys — `packages/collection/stubs/Collection.php:709`.
 *      Wraps `array_intersect_key`.
 *
 * @param data - The original array
 * @param other - The array to intersect with
 * @returns A new array containing items with keys present in both arrays
 */
// Overload: typed array → element type preserved, other array read for indices only
export function intersectByKeys<TValue>(
    data: ArrayItems<TValue>,
    other: ArrayItems<unknown>,
): TValue[];
export function intersectByKeys<TValue>(
    data: readonly unknown[] | null | undefined,
    other: ArrayItems<TValue> | unknown,
): TValue[];
export function intersectByKeys<TValue>(
    data: ArrayItems<TValue> | unknown,
    other: ArrayItems<TValue> | unknown,
): TValue[] {
    if (!accessible(data)) {
        return [] as TValue[];
    }

    const otherItems = arrayableItems(other);

    return (getAccessibleValues(data) as TValue[]).filter((_, index) =>
        Object.hasOwn(otherItems, index),
    );
}

/**
 * Make the test skipUntil, skipWhile, takeUntil and takeWhile run, as LazyCollection builds it.
 *
 * @param value - A callback, used as it is, or the value an item must be identical to
 * @returns The test each item is handed to, with its index or key
 */
function conditionFor<TValue, TKey>(
    value: unknown,
): (item: TValue, key: TKey) => unknown {
    if (isFunction(value)) {
        return value as (item: TValue, key: TKey) => unknown;
    }

    return (item) => strictEqual(item, value);
}
