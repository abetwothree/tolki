import { wrap as arrWrap } from "@tolki/arr";
import {
    dataAfter,
    dataBefore,
    dataChunk,
    dataChunkBy,
    dataChunkWhile,
    dataCollapse,
    dataCombine,
    dataContains,
    dataCrossJoin,
    dataDiff,
    dataDiffAssoc,
    dataDiffAssocUsing,
    dataDiffKeys,
    dataDiffKeysUsing,
    dataDiffUsing,
    dataDot,
    dataExcept,
    dataFilter,
    dataFirst,
    dataFlatten,
    dataIntersect,
    dataIntersectAssoc,
    dataIntersectAssocUsing,
    dataIntersectByKeys,
    dataIntersectUsing,
    dataKeys,
    dataLast,
    dataMap,
    dataOnly,
    dataPad,
    dataPartition,
    dataPluck,
    dataPop,
    dataPrepend,
    dataRandom,
    dataReplace,
    dataReplaceRecursive,
    dataReverse,
    dataSearch,
    dataSelect,
    dataShift,
    dataShuffle,
    dataSkipUntil,
    dataSkipWhile,
    dataSlice,
    dataSort,
    dataSortDesc,
    dataSplice,
    dataTakeUntil,
    dataTakeWhile,
    dataUndot,
    dataUnion,
    dataUnshift,
    dataValues,
} from "@tolki/data";
import { SortDirection } from "@tolki/enum";
import {
    explodePluckPath,
    hasPluckPath,
    readPluckKey,
    resolvePluckPath,
} from "@tolki/path";
import type {
    ArrayItems,
    CaseValue,
    DataItems,
    DataIterableItems,
    Jsonable,
    JsonSerializable,
    MapArrayKey,
    ObjectKey,
    ObjectValue,
    PathKey,
    PathKeys,
    SortSpec,
} from "@tolki/types";
import {
    arrayKeyExistsError,
    compareValues,
    createSortSpecComparator,
    defineKey,
    hasOwnToString,
    InvalidArgumentException,
    isArray,
    isBoolean,
    isEnumCase,
    isFiniteNumber,
    isFloat,
    isFunction,
    isIllegalOffset,
    isInteger,
    isIntegerLikeKey,
    isIterable,
    isMap,
    isNull,
    isNumber,
    isObject,
    isPhpAccessible,
    isPhpArrayKey,
    isPhpFalsy,
    isPhpNumeric,
    isPlainObject,
    isPrimitive,
    isString,
    isSymbol,
    isTruthyObject,
    isUndefined,
    ItemNotFoundException,
    looseEqual,
    MultipleItemsFoundException,
    operatorMatch,
    phpArrayKey,
    phpComputedKey,
    phpDebugType,
    phpIntArgument,
    phpIntCast,
    phpSortComparator,
    phpStringCast,
    phpTypeName,
    reindexIntegerKeys,
    renumberPhpIntegerKeys,
    resolveDefault,
    resolvePadLength,
    resolveRangeSize,
    resolveSliceRange,
    resolveSpliceRange,
    resolveTakeCount,
    strictEqual,
    toArrayable,
    toJsonSerializable,
    toPhpKeyString,
    typeOf,
    UnexpectedValueException,
} from "@tolki/utils";

// Collection resolves a descriptor's key with data_get, the way
// Collection::sortByMany does; Arr and Obj resolve with getNestedValue.
const sortSpecComparator = createSortSpecComparator((item, key) =>
    itemValue(item, key),
);

/** A list (`TValue[]`), a keyed record holding every key its type names, or a keyed record that may lack some. */
export type CollectionShape = "list" | "keyed" | "partial";

/** The shape a key type implies when none is named: number keys make a list, any other key a keyed record. */
type DefaultShape<TKey extends PropertyKey> = [TKey] extends [number]
    ? "list"
    : "keyed";

/** The items a collection of the given shape holds: a list, a record holding every key, or one that may lack some. */
export type CollectionItems<
    TValue,
    TKey extends PropertyKey,
    TShape extends CollectionShape,
> = [TShape] extends ["list"]
    ? TValue[]
    : [TShape] extends ["keyed"]
      ? Record<TKey, TValue>
      : [TShape] extends ["partial"]
        ? Partial<Record<TKey, TValue>>
        : TValue[] | Partial<Record<TKey, TValue>>;

/** A collection of an object's items: a list's under number keys, any other object's under its own keys. */
type ItemsCollection<TItems> = Collection<
    TItems extends readonly (infer TValue)[] ? TValue : ObjectValue<TItems>,
    TItems extends readonly unknown[] ? number : ObjectKey<TItems>,
    TItems extends readonly unknown[] ? "list" : "keyed"
>;

/**
 * The value, key and shape wrap() gives one member of its input's type: a collection's own, the items of a list, a Map
 * or a record, none for null, and a one-item list of anything else. An input of unknown type may be any of them.
 */
type WrapParts<TInput> = unknown extends TInput
    ? [unknown, PropertyKey, CollectionShape]
    : TInput extends null | undefined
      ? [never, never, "list"]
      : TInput extends Collection<
              infer TItemValue,
              infer TItemKey,
              infer TItemShape
          >
        ? [TItemValue, TItemKey, TItemShape]
        : TInput extends readonly (infer TItemValue)[]
          ? [TItemValue, number, "list"]
          : TInput extends ReadonlyMap<infer TMapKey, infer TItemValue>
            ? [TItemValue, MapArrayKey<TMapKey>, "keyed"]
            : TInput extends WrappedWhole
              ? [TInput, number, "list"]
              : TInput extends object
                ? [ObjectValue<TInput>, ObjectKey<TInput>, "keyed"]
                : [TInput, number, "list"];

/** An object wrap() keeps whole that TypeScript can tell from a record: a function, a class or a built-in. */
type WrappedWhole =
    | ((...args: never[]) => unknown)
    | (abstract new (...args: never[]) => unknown)
    | Date
    | ReadonlySet<unknown>
    | WeakMap<object, unknown>
    | WeakSet<object>
    | RegExp
    | Promise<unknown>;

/** The collection wrap() makes of a value, typed member by member when its type is a union. */
type WrapCollection<TInput> = Collection<
    WrapParts<TInput>[0],
    WrapParts<TInput>[1],
    WrapParts<TInput>[2]
>;

/** What unwrap() hands back for a value: a collection's items, and anything else unchanged. */
type Unwrapped<TValue> =
    TValue extends Collection<
        infer TItemValue,
        infer TItemKey,
        infer TItemShape
    >
        ? CollectionItems<TItemValue, TItemKey, TItemShape>
        : TValue;

/** Anything PHP's getArrayableItems() accepts as a second collection. */
type Operand = object | null | undefined;

/** The values an operand hands over, and any for an operand typed any, so a comparator declared for them still fits. */
type OperandValue<TOperand> =
    // `0 extends 1 & TOperand` misses an any argument here, where TOperand has a constraint; this check does not.
    unknown extends TOperand ? TOperand : RawValues<TOperand>;

/**
 * The values an operand holds, read in getRawItems()'s order. Own fields are the non-function members, since
 * TypeScript cannot tell a field from a method, so a record of closures loses its function values.
 * A plain object is typed like a class by its toArray, toJson or jsonSerialize member, though at runtime it is data.
 */
type RawValues<TOperand> = TOperand extends null | undefined
    ? never
    : TOperand extends Collection<infer _TValue, infer _TKey, infer _TShape>
      ? TOperand extends Iterable<infer TValue>
          ? TValue
          : never
      : TOperand extends ReadonlyMap<unknown, infer TValue>
        ? TValue
        : TOperand extends readonly (infer TValue)[]
          ? TValue
          : TOperand extends { toArray(...args: never[]): infer TItems }
            ? CastValues<TItems>
            : TOperand extends Iterable<infer TValue>
              ? TValue
              : TOperand extends { toJson(...args: never[]): unknown }
                ? unknown
                : TOperand extends {
                        jsonSerialize(...args: never[]): infer TItems;
                    }
                  ? CastValues<TItems>
                  : FieldValues<TOperand>;

/** The values castToItems() reads: none from null, a list's items, an object's own fields, else the value itself. */
type CastValues<TItems> = TItems extends null | undefined
    ? never
    : TItems extends readonly (infer TValue)[]
      ? TValue
      : TItems extends object
        ? FieldValues<TItems>
        : TItems;

/** The values of an object's own fields: its members that are neither functions nor keyed by a symbol. */
type FieldValues<TItems> = {
    [TField in keyof TItems]-?: TField extends symbol
        ? never
        : TItems[TField] extends (...args: never[]) => unknown
          ? never
          : TItems[TField];
}[keyof TItems];

/**
 * Create a collection from the given value.
 *
 * @param items - A collection, a list, a Map, an Arrayable, an iterable, a Jsonable, a JsonSerializable or a record;
 * null or nothing makes an empty collection, and a scalar is wrapped in one
 * @returns A new collection holding a copy of the items
 *
 * @remarks A plain object with a toArray, toJson or jsonSerialize member is typed by the interface it matches,
 * though at runtime every plain object is data. A class instance's methods are typed among its items, since
 * TypeScript cannot tell a method from a function-valued field, though only its own fields are copied.
 *
 * @example
 *
 * collect([1, 2, 3]); -> new Collection([1, 2, 3])
 * collect({a: 1, b: 2}); -> new Collection({a: 1, b: 2})
 * collect(new Map([['a', 1]])); -> new Collection({a: 1})
 * collect('abc'); -> new Collection(['abc'])
 * collect(null); -> new Collection([])
 */
export function collect<
    TValue,
    TKey extends PropertyKey,
    TShape extends CollectionShape,
>(items: Collection<TValue, TKey, TShape>): Collection<TValue, TKey, TShape>;
export function collect<TValue>(
    items: readonly TValue[],
): Collection<TValue, number, "list">;
export function collect<TValue, TMapKey>(
    items: ReadonlyMap<TMapKey, TValue>,
): Collection<TValue, MapArrayKey<TMapKey>, "keyed">;
export function collect<TValue>(items: {
    toArray(): readonly TValue[];
}): Collection<TValue, number, "list">;
export function collect<TItems extends object>(items: {
    toArray(): TItems;
}): ItemsCollection<TItems>;
export function collect<TValue>(
    items: Iterable<TValue> & object,
): Collection<TValue, number, "list">;
export function collect(
    items: Jsonable,
): Collection<unknown, string | number, "list" | "keyed">;
export function collect<TItems extends object>(items: {
    jsonSerialize(): TItems;
}): ItemsCollection<TItems>;
export function collect(
    items: JsonSerializable,
): Collection<unknown, string | number, "list" | "keyed">;
export function collect(
    items?: null | undefined,
): Collection<never, number, "list">;
export function collect<TValue>(
    items: readonly TValue[] | null | undefined,
): Collection<TValue, number, "list">;
export function collect(items: string): Collection<string, number, "list">;
export function collect(items: number): Collection<number, number, "list">;
export function collect(items: boolean): Collection<boolean, number, "list">;
export function collect(items: symbol): Collection<symbol, number, "list">;
export function collect<TItems extends object>(
    items: TItems,
): ItemsCollection<TItems>;
export function collect(items?: unknown): unknown {
    return new (Collection as CollectionClass<unknown, PropertyKey>)(items);
}

/**
 * Build the backing object for an already-ordered list of entries, applying
 * the reorder family's one integer-key policy: integer-like keys are
 * renumbered so the order survives the write, string keys keep theirs.
 *
 * @param entries - The sorted entries, in their intended order
 * @returns A plain object whose iteration order is `entries`' order
 */
function sortedIntoItems<TValue>(
    entries: Array<[string, TValue]>,
): Record<string, TValue> {
    const items: Record<string, TValue> = {};

    for (const [key, value] of reindexIntegerKeys(entries)) {
        defineKey(items, key, value);
    }

    return items;
}

/**
 * A Collection whose items are always array-backed, ensuring all() returns TValue[].
 * Used as the return type for methods like partition() that always produce arrays.
 */
export interface ArrayCollection<
    TValue,
    TKey extends PropertyKey,
> extends Collection<TValue, TKey> {
    all(): TValue[];
}

/**
 * A Collection containing exactly two elements, used for partition().
 * Extends ArrayCollection and adds tuple-like indexing for better type inference.
 */
export interface TupleCollection<T1, T2> extends ArrayCollection<
    T1 | T2,
    number
> {
    all(): [T1, T2];
    0: T1;
    1: T2;
}

/**
 * Laravel-style Collection class for JavaScript/TypeScript.
 * Provides a fluent interface for working with arrays and objects.
 */
export class Collection<
    TValue = never,
    TKey extends PropertyKey = number,
    TShape extends CollectionShape = DefaultShape<TKey>,
> {
    /**
     * The items contained in the collection.
     */
    protected items: TValue[] | Record<TKey, TValue>;

    /**
     * Insertion order for a Map-built collection whose keys are numeric, which
     * a plain object cannot hold (ECMA-262 `OrdinaryOwnPropertyKeys`). Only
     * `adoptRawItems` and the reorder helpers write it; the sort family
     * renumbers keys instead, so `all()` and `values()` cannot disagree.
     */
    protected itemsWithOrder?: Array<[TKey, TValue]>;

    /**
     * Indicates that the object's string representation should be escaped when toString is invoked.
     */
    protected shouldEscapeWhenCastingToString = false;

    /**
     * The shape the type declares, never set: it lets the type system tell shapes apart before all() reads the shape.
     */
    declare protected readonly collectionShape: TShape;

    /**
     * Create a new collection.
     *
     * @param items - The items, read the way collect() reads them
     *
     * @remarks A constructor declares no type parameters of its own, so collect() and make() type what it cannot:
     * the keys PHP stores for a Map, the keyed shape of a Map or record with integer keys, and a Jsonable's items.
     */
    constructor(items: Collection<TValue, TKey, TShape>);
    constructor(items: readonly TValue[]);
    constructor(items: ReadonlyMap<TKey, TValue>);
    constructor(items: { toArray(): readonly TValue[] });
    constructor(items: { toArray(): Record<TKey, TValue> });
    constructor(items: Iterable<TValue> & object);
    constructor(items: { jsonSerialize(): readonly TValue[] });
    constructor(items: { jsonSerialize(): Record<TKey, TValue> });
    constructor(items?: null | undefined);
    constructor(items: readonly TValue[] | null | undefined);
    constructor(items: TValue & (string | number | boolean | symbol));
    constructor(items: Record<TKey, TValue>);
    // A subclass hands on whatever its own constructor took, which may be any of the above.
    constructor(
        items?:
            | DataIterableItems<TValue, TKey>
            | Collection<TValue, TKey, TShape>
            | ReadonlyMap<TKey, TValue>
            | { toArray(): readonly TValue[] | Record<TKey, TValue> }
            | { jsonSerialize(): readonly TValue[] | Record<TKey, TValue> }
            | (TValue & (string | number | boolean | symbol))
            | null,
    );
    constructor(items?: unknown) {
        this.items = this.adoptRawItems(items);
    }

    /**
     * Make the collection iterable with for...of loops.
     *
     * @returns The iterator getIterator() returns, over the collection's values
     */
    [Symbol.iterator](): ArrayIterator<TValue> {
        return this.getIterator();
    }

    /**
     * Create a collection with the given range.
     *
     * @param from - Starting number of the range
     * @param to - Ending number of the range, counted down to when it is below the start
     * @param step - Step size for the range; it may be negative only on a decreasing range
     * @param args - Arguments for the constructor after the items, which a subclass may take
     * @returns A new Collection instance containing the range of numbers
     * @throws Error when an argument is not a finite number, or the step is 0, negative on an increasing range,
     * or longer than the range, or when the range would hold 2^30 items or more, as PHP's range() throws its ValueError
     *
     * @example
     *
     * Collection.range(1, 5); -> new Collection([1, 2, 3, 4, 5])
     * Collection.range(1, 10, 2); -> new Collection([1, 3, 5, 7, 9])
     * Collection.range(5, 1); -> new Collection([5, 4, 3, 2, 1])
     * Collection.range(0, 1, 0.25); -> new Collection([0, 0.25, 0.5, 0.75, 1])
     */
    static range(
        from: number,
        to: number,
        step: number = 1,
        ...args: unknown[]
    ): Collection<number, number, "list"> {
        const size = resolveRangeSize(from, to, step);
        const stride = Math.abs(step);
        const descending = to < from;
        // Each item is reckoned from the start, so a float step's rounding error never builds up. The rounded size
        // can reach one step past the end, and PHP drops that item.
        const items = Array.from({ length: size }, (_, index) =>
            descending ? from - index * stride : from + index * stride,
        ).filter((item) => (descending ? item >= to : item <= to));

        return new (this as CollectionClass<number, number>)(
            handOver(items),
            ...args,
        );
    }

    /**
     * Get all of the items in the collection.
     *
     * @returns The underlying items in the collection
     *
     * @example
     *
     * new Collection([1, 2, 3]).all(); -> [1, 2, 3]
     * new Collection({a: 1, b: 2}).all(); -> {a: 1, b: 2}
     */
    all() {
        return this.items;
    }

    /**
     * Get the median of a given key.
     *
     * @param  key - The key or path of segments to calculate the median for, or null for the values themselves
     * @returns The median value or null if the collection is empty
     *
     * @example
     *
     * new Collection([1, 3, 3, 6, 7, 8, 9]).median(); -> 6
     * new Collection([1, 2, 3, 4, 5, 6]).median(); -> 3.5
     * new Collection([{value: 1}, {value: 3}, {value: 3}, {value: 6}, {value: 7}, {value: 8}, {value: 9}]).median('value'); -> 6
     * new Collection([{a: {b: 1}}, {a: {b: 9}}, {a: {b: 5}}]).median(['a', 'b']); -> 5
     */
    median(key: PropertyKey | readonly PathKey[] | null = null): TValue | null {
        // pluck() reads an array of segments as a path, though its declared key type lists none.
        const values = (!isNull(key) ? this.pluck(key as PropertyKey) : this)
            // JS-only: undefined stands for a value PHP does not have, so it is skipped with null, as mode() skips it.
            .reject((item) => isNull(item) || isUndefined(item))
            .sort()
            .values();

        const count = values.count();

        if (count === 0) {
            return null;
        }

        const middle = Math.floor(count / 2);

        if (count % 2) {
            return values.get(middle);
        }

        return this.sameInstance(
            handOver([values.get(middle - 1), values.get(middle)]),
        ).average() as TValue;
    }

    /**
     * Get the mode of a given key.
     *
     * Null items are skipped, and each value is counted under the key PHP would store it as.
     *
     * @param key - The key to calculate the mode for, or null for the values themselves
     * @returns The most frequent values in the order first seen, or null when no non-null value remains
     *
     * @example
     *
     * new Collection([1, 2, 2, 3, 3, 3]).mode(); -> [3]
     * new Collection([1, 1, 2, 2, 3, 3]).mode(); -> [1, 2, 3]
     * new Collection([{value: 1}, {value: 2}, {value: 2}, {value: 3}, {value: 3}, {value: 3}]).mode('value'); -> [3]
     * new Collection([{foo: 5}, {foo: null}, {foo: null}]).mode('foo'); -> [5]
     * new Collection([null, null]).mode(); -> null
     */
    mode(key: PropertyKey | null = null): Array<string | number> | null {
        const values = isNull(key) ? this.values() : this.values().pluck(key);
        const counts = new Map<string | number, number>();

        values.each((value) => {
            // JS-only: undefined stands in for a value PHP does not have, so it is skipped with null.
            if (isNull(value) || isUndefined(value)) {
                return;
            }

            const countKey = phpComputedKey(value, { invalid: issetOffset });

            counts.set(countKey, (counts.get(countKey) ?? 0) + 1);
        });

        if (counts.size === 0) {
            return null;
        }

        const highestCount = [...counts.values()].reduce(
            (highest, count) => Math.max(highest, count),
            0,
        );

        return [...counts]
            .filter(([, count]) => count === highestCount)
            .map(([countKey]) => countKey);
    }

    /**
     * Collapse a collection of arrays or objects into a single, flat collection.
     *
     * @returns A new collection with collapsed arrays or merged objects
     *
     * @example
     *
     * new Collection([[1, 2], [3, 4]]).collapse(); -> new Collection([1, 2, 3, 4])
     * new Collection([{a: 1}, {b: 2}]).collapse(); -> new Collection({a: 1, b: 2})
     * new Collection({a: [1, 2], b: [3]}).collapse(); -> new Collection([1, 2, 3])
     */
    collapse() {
        // Arr::collapse merges the items alone, so the receiver's own keys never shape the result.
        const items = this.orderedValues().map((item) =>
            item instanceof Collection ? item.renumberedItems() : item,
        );

        return this.sameInstance(handOver(dataCollapse(items)));
    }

    /**
     * Collapse the collection of items into a single array while preserving its keys.
     *
     * @returns A new collection with collapsed items, a later item's key replacing an earlier one's
     *
     * @example
     *
     * new Collection([[1, 2], [3, 4]]).collapseWithKeys(); -> new Collection([3, 4])
     * new Collection([{a: 1}, {b: 2}]).collapseWithKeys(); -> new Collection({a: 1, b: 2})
     */
    collapseWithKeys() {
        if (this.isEmpty()) {
            return this.sameInstance();
        }

        // Extract raw items from nested Collections and filter out non-arrays/objects
        const results = this.orderedValues().map((value) => {
            // PHP merges only arrays, which a plain object models, so collapse() skips any other object too.
            if (
                !(value instanceof Collection) &&
                !isArray(value) &&
                !isPlainObject(value)
            ) {
                return null;
            }

            return value;
        });

        // Filter out nulls (non-arrays/objects that we skipped)
        const validResults = results.filter((item) => item !== null);

        if (validResults.length === 0) {
            return this.sameInstance();
        }

        // Check if all valid results are arrays
        const allArrays = validResults.every((item) =>
            isArray(item instanceof Collection ? item.all() : item),
        );

        // Later keys overwrite earlier ones where the first one stood, as array_replace keeps them.
        const merged = new Map<PropertyKey, unknown>();
        for (const source of validResults) {
            // A collection's own order can hold what its all() cannot: integer keys out of ascending order.
            const entries =
                source instanceof Collection
                    ? source.entriesInOrder()
                    : Object.entries(source as object);

            for (const [key, value] of entries) {
                merged.set(phpArrayKey(key), value);
            }
        }

        // If all inputs were arrays, convert the result back to an array
        // to match PHP's behavior
        if (allArrays) {
            return this.sameInstance(handOver([...merged.values()]));
        }

        return this.sameInstance(merged);
    }

    /**
     * Determine if an item exists in the collection.
     *
     * @param key - The value to search for or a callback function
     * @param operator - The operator to use for comparison (if value is provided)
     * @param value - The value to compare against (if operator is provided)
     * @returns True if the item exists, false otherwise
     *
     * @example
     *
     * new Collection([1, 2, 3]).contains(2); -> true
     * new Collection([{id: 1}, {id: 2}]).contains(item => item.id === 2); -> true
     */
    contains(key: (value: TValue, index: TKey) => unknown): boolean;
    contains(key: unknown, operator?: unknown, value?: unknown): boolean;
    contains(
        ...args: [
            key: ((value: TValue, index: TKey) => unknown) | unknown,
            operator?: unknown,
            value?: unknown,
        ]
    ): boolean {
        const [key] = args;

        if (args.length < 2) {
            if (isFunction(key)) {
                const callback = key as (value: TValue, index: TKey) => unknown;

                return dataContains(this.items, callback);
            }

            return dataContains(this.items, key as TValue);
        }

        return this.contains(this.operatorForWhereArgs(args));
    }

    /**
     * Determine if an item exists in the collection using strict comparison.
     * Given a value, each item's `key` path is compared with it the way PHP's `===` compares, even a `null` value.
     *
     * @param key - The value to search for, or the path to compare when `value` is given
     * @param value - The value the path must strictly equal
     * @returns True if the item exists using strict comparison, false otherwise
     *
     * @example
     *
     * new Collection([1, 2, 3]).containsStrict(2); -> true
     * new Collection([1, 2, 3]).containsStrict('2'); -> false
     * new Collection([{tags: ['a']}]).containsStrict('tags', ['a']); -> true
     * new Collection([1, null, 2]).containsStrict(value => value === null); -> true
     */
    containsStrict(key: (value: TValue, index: TKey) => unknown): boolean;
    containsStrict(key: unknown, value?: unknown): boolean;
    containsStrict(
        ...args: [
            key: ((value: TValue, index: TKey) => unknown) | unknown,
            value?: unknown,
        ]
    ): boolean {
        const [key, value = null] = args;

        // PHP takes the two-argument form whenever a second argument is passed, whatever it holds.
        if (args.length === 2) {
            return this.contains((item) => {
                return strictEqual(itemValue(item, key as PathKey), value);
            });
        }

        if (isFunction(key)) {
            // `array_any` counts a match holding null, so only an absent item may equal the placeholder.
            const placeholder = Symbol("containsStrict");

            return (
                this.first<typeof placeholder>(
                    key as (value: TValue, index: TKey) => unknown,
                    placeholder,
                ) !== placeholder
            );
        }

        // Routes through dataContains's strict flag rather than `===`, so an array or plain
        // object key matches by value, the way PHP's `in_array($key, $items, true)` does.
        return dataContains(this.items, key as TValue, true);
    }

    /**
     * Determine if an item is not contained in the collection.
     *
     * @param key - The value to search for or a callback function
     * @param operator - The operator to use for comparison (if value is provided)
     * @param value - The value to compare against (if operator is provided)
     * @returns True if the item does not exist, false otherwise
     *
     * @example
     *
     * new Collection([1, 2, 3]).doesntContain(4); -> true
     * new Collection([1, 2, 3]).doesntContain(2); -> false
     * new Collection([{id: 1}, {id: 2}]).doesntContain(item => item.id === 3); -> true
     */
    doesntContain(key: (value: TValue, index: TKey) => unknown): boolean;
    doesntContain(key: unknown, operator?: unknown, value?: unknown): boolean;
    doesntContain(
        ...args: [
            key: ((value: TValue, index: TKey) => unknown) | unknown,
            operator?: unknown,
            value?: unknown,
        ]
    ): boolean {
        return !this.contains(...args);
    }

    /**
     * Determine if an item is not contained in the enumerable, using strict comparison.
     *
     * @param key - The value to search for or a callback function
     * @param value - The value to compare against (if operator is provided)
     * @returns True if the item does not exist using strict comparison, false otherwise
     *
     * @example
     *
     * new Collection([1, 2, 3]).doesntContainStrict(4); -> true
     * new Collection([1, 2, 3]).doesntContainStrict(2); -> false
     * new Collection([1, 2, 3]).doesntContainStrict('2'); -> true
     * new Collection([{id: 1}, {id: 2}]).doesntContainStrict(item => item.id === 3); -> true
     */
    doesntContainStrict(key: (value: TValue, index: TKey) => unknown): boolean;
    doesntContainStrict(key: unknown, value?: unknown): boolean;
    doesntContainStrict(
        ...args: [
            key: ((value: TValue, index: TKey) => unknown) | unknown,
            value?: unknown,
        ]
    ): boolean {
        return !this.containsStrict(...args);
    }

    /**
     * Cross join with the given lists, returning all possible permutations.
     * The collection's values are one dimension and each list's values another, whatever their keys.
     *
     * @param items - The lists to cross join with
     * @returns A new collection with the cross joined items
     *
     * @example
     *
     * new Collection([1, 2]).crossJoin([3, 4]); -> new Collection([[1, 3], [1, 4], [2, 3], [2, 4]])
     * new Collection({a: 1, b: 2}).crossJoin({c: 3, d: 4}); -> new Collection([[1, 3], [1, 4], [2, 3], [2, 4]])
     */
    crossJoin<TOperands extends Operand[]>(...items: TOperands) {
        // Collection::crossJoin hands $this->items to Arr::crossJoin as one argument, so an object backing
        // is one dimension too, never obj.crossJoin's dimension per key.
        const results = dataCrossJoin(
            this.getItemValues(this.items),
            ...items.map((item) => this.getRawItems(item)),
        );

        return this.sameInstance(handOver(results));
    }

    /**
     * Get the items in the collection that are not present in the given items.
     *
     * @param items - The items to diff against
     * @returns A new collection with the difference
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).diff([2, 4]); -> new Collection([1, 3])
     */
    diff<TOperand extends Operand>(items: TOperand) {
        return this.sameInstance(
            handOver(dataDiff(this.items, this.getRawItems(items))),
        );
    }

    /**
     * Get the items in the collection that are not present in the given items, using the callback.
     *
     * @param items - The items to diff against
     * @param callback - A comparator answering 0 for equal values, as PHP's `strcasecmp` and `<=>` do, or true
     * @returns A new collection with the difference
     *
     * @example
     *
     * new Collection([1, 2, 3]).diffUsing([2], (a, b) => a - b); -> new Collection([1, 3])
     * new Collection({a: 'x', b: 'y'}).diffUsing(['y'], (a, b) => a === b); -> new Collection({a: 'x'})
     */
    diffUsing<TOperand extends Operand>(
        items: TOperand,
        callback: (a: TValue, b: OperandValue<TOperand>) => boolean | number,
    ) {
        return this.sameInstance(
            handOver(
                dataDiffUsing(
                    this.items,
                    this.getRawItems(items),
                    // `this.items` is a union, so the call lands on obj's widest row, whose
                    // comparator takes `unknown` and rejects a typed callback (contravariance).
                    equalityTest(callback) as (
                        a: unknown,
                        b: unknown,
                    ) => boolean,
                ),
            ),
        );
    }

    /**
     * Get the items in the collection whose keys and values are not present in the given items.
     *
     * This is `array_diff_assoc` (key AND value must both fail to match to
     * be excluded).
     *
     * @param items - The items to diff against
     * @returns A new collection with the difference
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).diffAssoc({b: 2}); -> new Collection({a: 1, c: 3})
     * new Collection({a: 1, b: 2, c: 3}).diffAssoc({b: 3}); -> new Collection({a: 1, b: 2, c: 3})
     * new Collection({a: 1, b: 2, c: 3}).diffAssoc({d: 4}); -> new Collection({a: 1, b: 2, c: 3})
     */
    diffAssoc<TOperand extends Operand>(items: TOperand) {
        return this.sameInstance(
            handOver(dataDiffAssoc(this.items, this.getRawItems(items))),
        );
    }

    /**
     * Get the items in the collection whose keys and values are not present in the given items, using the callback.
     * The callback is used to compare keys (case-insensitively, for example), while values are compared strictly.
     *
     * @param items - The items to diff against
     * @param callback - A comparator answering 0 for matching keys, as PHP's `strcasecmp` does, or true
     * @returns A new collection with the difference
     *
     * @example
     *
     * const strcasecmp = (a, b) => String(a).localeCompare(String(b), 'en', {sensitivity: 'base'});
     * new Collection({a: 'green', b: 'brown', c: 'blue', 0: 'red'}).diffAssocUsing({A: 'green', 0: 'yellow', 1: 'red'}, strcasecmp); -> new Collection({b: 'brown', c: 'blue', 0: 'red'})
     */
    diffAssocUsing<TOperand extends Operand>(
        items: TOperand,
        callback: (keyA: TKey, keyB: TKey) => boolean | number,
    ) {
        return this.sameInstance(
            handOver(
                dataDiffAssocUsing(
                    this.items,
                    this.getRawItems(items),
                    // `this.items` is a union, so the call lands on obj's widest row, whose
                    // comparator takes a bare key and rejects a typed callback (contravariance).
                    equalityTest(callback) as (
                        keyA: string | number,
                        keyB: string | number,
                    ) => boolean,
                ),
            ),
        );
    }

    /**
     * Get the items in the collection whose keys are not present in the given items.
     *
     * @param items - The items to diff against
     * @returns A new collection with the difference
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).diffKeys({b: 2}); -> new Collection({a: 1, c: 3})
     * new Collection([1, 3, 5, 7, 8]).diffKeys([1, 3, 5]); -> new Collection([7, 8])
     */
    diffKeys<TOperand extends Operand>(items: TOperand) {
        return this.sameInstance(
            handOver(dataDiffKeys(this.items, this.getRawItems(items))),
        );
    }

    /**
     * Get the items in the collection whose keys are not present in the given items, using the callback.
     * The callback is used to compare keys only (ignoring values).
     *
     * @param items - The items to diff against
     * @param callback - A comparator answering 0 for matching keys, as PHP's `strcasecmp` does, or true
     * @returns A new collection with the difference
     *
     * @example
     *
     * const strcasecmp = (a, b) => String(a).localeCompare(String(b), 'en', {sensitivity: 'base'});
     * new Collection({id: 1, first_word: 'Hello'}).diffKeysUsing({ID: 123, foo_bar: 'Hello'}, strcasecmp); -> new Collection({first_word: 'Hello'})
     */
    diffKeysUsing<TOperand extends Operand>(
        items: TOperand,
        callback: (keyA: TKey, keyB: TKey) => boolean | number,
    ) {
        return this.sameInstance(
            handOver(
                dataDiffKeysUsing(
                    this.items,
                    this.getRawItems(items),
                    // `this.items` is a union, so the call lands on obj's widest row, whose
                    // comparator takes a bare key and rejects a typed callback (contravariance).
                    equalityTest(callback) as (
                        keyA: string | number,
                        keyB: string | number,
                    ) => boolean,
                ),
            ),
        );
    }

    /**
     * Retrieve duplicate items from the collection.
     *
     * This method preserves the original keys/indices of duplicate items.
     * When using a callback or key, it returns the transformed values (not original items).
     *
     * @param callback - The callback function to determine the value to check for duplicates, or a string key, or null to use the values themselves
     * @param strict - Whether to use strict comparison (===) or loose comparison (like PHP's ==)
     * @returns A new collection with an object with the duplicate items preserving their original keys
     *
     * @example
     *
     * new Collection([1, 2, 1, 'a', null, 'a']).duplicates(); -> new Collection({2: 1, 5: 'a'})
     * new Collection([{id: 1}, {id: 2}, {id: 2}]).duplicates('id'); -> new Collection({2: 2})
     * new Collection([1, '1', 2, '2', 2]).duplicates(null, true); -> new Collection({4: 2})
     */
    duplicates<TMapValue>(
        callback: ((value: TValue, key: TKey) => TMapValue) | PathKey = null,
        strict: boolean = false,
    ) {
        const items = this.map(
            this.valueRetriever(
                callback as
                    | PathKey
                    | ((...args: (TValue | TKey)[]) => TMapValue),
            ),
        );

        // Get unique items and reset keys to 0, 1, 2, ... for proper iteration
        let uniqueItems = items.unique(null, strict).values();

        const compare = this.duplicateComparator(strict);

        const duplicatesItems = {} as Record<TKey, TMapValue>;

        for (const [key, value] of Object.entries(
            items.items as Record<TKey, TMapValue>,
        )) {
            if (
                uniqueItems.isNotEmpty() &&
                compare(value as TValue, uniqueItems.first() as TValue)
            ) {
                // Skip the first item (equivalent to shift() in PHP which mutates)
                // Don't call .values() again as it would reset keys unnecessarily
                uniqueItems = uniqueItems.skip(1);
            } else {
                defineKey(
                    duplicatesItems as Record<string, TMapValue>,
                    key,
                    value as TMapValue,
                );
            }
        }

        // Laravel preserves keys for both arrays and objects
        return this.sameInstance(handOver(duplicatesItems));
    }

    /**
     * Retrieve duplicate items from the collection using strict comparison.
     *
     * @param callback - The callback function to determine the value to check for duplicates, or a string key, or null to use the values themselves
     * @returns A new collection with the duplicate items
     */
    duplicatesStrict<TMapValue>(
        callback: ((value: TValue) => TMapValue) | string | null = null,
    ) {
        return this.duplicates(callback, true);
    }

    /**
     * Get the comparison function to detect duplicates.
     *
     * @param strict - Whether to use strict comparison (===) or loose comparison (like PHP's ==)
     * @returns A comparison function for detecting duplicates
     */
    protected duplicateComparator(strict: boolean) {
        if (strict) {
            return (a: TValue, b: TValue) => strictEqual(a, b);
        }

        return (a: TValue, b: TValue) => looseEqual(a, b);
    }

    /**
     * Get all items except for those with the specified keys.
     *
     * @param keys - The keys to exclude, can be: a single key, an array of keys, a Collection, null, or multiple key arguments
     * @returns A new collection without the specified keys
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).except(['a', 'c']); -> new Collection({b: 2})
     * new Collection({a: 1, b: 2, c: 3}).except('a', 'c'); -> new Collection({b: 2})
     * new Collection({a: 1, b: 2, c: 3}).except(new Collection(['a', 'c'])); -> new Collection({b: 2})
     * new Collection([1, 2, 3, 4]).except([0, 2]); -> new Collection([2, 4])
     * new Collection([1, 2, 3, 4]).except(new Collection([0, 2])); -> new Collection([2, 4])
     */
    except<TExceptValue extends PathKey, TExceptKey extends PropertyKey>(
        ...keys: (
            | PathKey
            | PathKey[]
            | Collection<TExceptValue, TExceptKey, CollectionShape>
            | null
            | undefined
        )[]
    ) {
        const keysToExcept = this.keysArgument(keys);

        if (isNull(keysToExcept)) {
            return this.sameInstance(this.items);
        }

        return this.sameInstance(
            handOver(dataExcept(this.items, keysToExcept)),
        );
    }

    /**
     * Run a filter over each of the items.
     *
     * @param callback - The callback function to filter with, or null to filter truthy values
     * @returns A new collection with filtered items
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).filter(x => x > 2); -> new Collection([3, 4])
     * new Collection([0, 1, false, 2, '', 3]).filter(); -> new Collection([1, 2, 3])
     */
    filter(callback: ((value: TValue, key: TKey) => unknown) | null = null) {
        if (isNull(callback)) {
            return this.sameInstance(handOver(dataFilter(this.items)));
        }

        // `Items` is a union, so the delegates hand the callback their own widest
        // value type; the collection's own generics are the narrower truth here.
        return this.sameInstance(
            handOver(
                dataFilter(this.items, (value, key) =>
                    callback(value as TValue, key as TKey),
                ),
            ),
        );
    }

    /**
     * Get the first item from the collection passing the given truth test.
     *
     * @param callback - The callback function to test with, or null
     * @param defaultValue - The default value to return if no item is found
     * @returns The first matching item or default value
     *
     * @example
     *
     * new Collection([1, 2, 3]).first(); -> 1
     * new Collection([1, 2, 3, 4]).first(x => x > 2); -> 3
     * new Collection([]).first(null, 'default'); -> 'default'
     * new Collection({a: 1, b: 2, c: 3}).first(); -> 1
     * new Collection({a: 1, b: 2, c: 3, d: 4}).first(x => x > 2); -> 3
     */
    first<TFirstDefault>(
        callback: ((value: TValue, key: TKey) => unknown) | null = null,
        defaultValue?: TFirstDefault | (() => TFirstDefault),
    ): TValue | TFirstDefault | null {
        const ordered = this.orderedEntries();

        if (ordered) {
            return this.firstOrdered(ordered, callback, defaultValue);
        }

        // The auto-forwarding chain ends here: `this.items` is the `DataItems` union, which
        // always picks obj's widest row, so the delegate answers `unknown`. Restating the
        // class's own generics is the only way to keep them; widening `items` is Part B work.
        return dataFirst(
            this.items,
            // The same union makes obj's row take an `unknown`-valued callback, which
            // rejects a typed one (contravariance).
            callback as
                | ((value: unknown, key: string | number) => unknown)
                | null,
            defaultValue,
        ) as TValue | TFirstDefault | null;
    }

    /**
     * Flatten a multi-dimensional collection into a single level.
     *
     * Laravel's flatten always returns an array-based collection, iterating over
     * values and recursively flattening nested arrays. A nested collection's items
     * are flattened too; any other object that isn't a plain object is kept whole.
     *
     * @param depth - The depth to flatten to, defaults to Infinity
     * @returns A new collection with flattened items (always array-based)
     *
     * @example
     *
     * new Collection([1, [2, [3, 4]], 5]).flatten(); -> new Collection([1, 2, 3, 4, 5])
     * new Collection([1, [2, [3, 4]], 5]).flatten(1); -> new Collection([1, 2, [3, 4], 5])
     * new Collection({a: [1, 2], b: [3, 4]}).flatten(); -> new Collection([1, 2, 3, 4])
     * new Collection({a: [1, [2, 3]], b: [4]}).flatten(1); -> new Collection([1, [2, 3], 4])
     */
    flatten(depth: number = Infinity) {
        // Collection::flatten is Arr::flatten($this->items, $depth), which obj and arr flatten mirror.
        return this.sameInstance(handOver(dataFlatten(this.items, depth)));
    }

    /**
     * Flip the items in the collection.
     *
     * @returns A new collection with flipped items
     *
     * @example
     *
     * new Collection(['a', 'b', 'c']).flip(); -> new Collection({a: 0, b: 1, c: 2})
     * new Collection({name: 'taylor'}).flip(); -> new Collection({taylor: 'name'})
     */
    flip() {
        const flipped = new Map<string | number, TKey>();

        for (const [key, value] of this.entriesInOrder()) {
            // array_flip skips a value it cannot store as a key.
            if (isPhpArrayKey(value)) {
                flipped.set(phpArrayKey(value), key);
            }
        }

        return this.sameInstance(flipped);
    }

    /**
     * Remove an item from the collection by key.
     *
     * Each key is unset literally, as offsetUnset does, so a dotted key never reaches a nested value.
     *
     * @param keys - The key or keys to remove, or a collection of keys
     * @returns The collection instance after removing the specified keys
     * @throws TypeError for an array, object or function key, once the keys before it are unset, as unset() refuses one
     *
     * @example
     *
     * new Collection({a: {b: 1}}).forget('a.b'); -> new Collection({a: {b: 1}})
     * new Collection({a: 1, b: 2, c: 3}).forget('b'); -> new Collection({a: 1, c: 3})
     * new Collection({a: 1, b: 2, c: 3}).forget(['a', 'c']); -> new Collection({b: 2})
     * new Collection({a: 1, b: 2, c: 3}).forget(new Collection(['a', 'c'])); -> new Collection({b: 2})
     * new Collection([1, 2, 3, 4]).forget(1); -> new Collection([1, 3, 4])
     * new Collection([1, 2, 3, 4]).forget([0, 2]); -> new Collection([2, 4])
     * new Collection([1, 2, 3, 4]).forget(new Collection([0, 2])); -> new Collection([2, 4])
     */
    forget<T extends PathKey, K extends PropertyKey = PropertyKey>(
        keys: PathKeys | Collection<T, K, CollectionShape>,
    ) {
        const requested = Object.values(this.getRawItems(keys));
        // PHP unsets each key in turn, so the keys before one it cannot hold are gone when it throws.
        const illegal = requested.findIndex((key) => isIllegalOffset(key));
        const ownKeys = new Set<string | number>();

        for (const key of illegal === -1
            ? requested
            : requested.slice(0, illegal)) {
            const ownKey = this.ownKey(key);

            if (!isUndefined(ownKey)) {
                ownKeys.add(ownKey);
            }
        }

        // Each removal shifts a list's later indexes down, so a list drops its highest index first.
        const ordered = isArray(this.items)
            ? [...ownKeys].sort((a, b) => Number(b) - Number(a))
            : ownKeys;

        for (const key of ordered) {
            this.offsetUnset(key);
        }

        if (illegal !== -1) {
            throw unsetOffset(phpDebugType(requested[illegal]));
        }

        return this;
    }

    /**
     * Get an item from the collection by key.
     *
     * The key is looked up literally, as PHP's `array_key_exists` does: a dotted key never reads a nested value,
     * and a null key reads the `""` key.
     *
     * @param key - The key to get
     * @param defaultValue - The default value to return if key doesn't exist, or a callback that returns it
     * @returns The value at the key or default value
     * @throws TypeError for an array, object or function key, as array_key_exists() refuses one
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).get('b'); -> 2
     * new Collection({a: 1, b: 2, c: 3}).get('d', 'default'); -> 'default'
     * new Collection({a: {b: 1}}).get('a.b', 'default'); -> 'default'
     */
    get<TGetDefault = null>(
        key: PathKey,
        defaultValue?: TGetDefault | (() => TGetDefault),
    ): TValue | TGetDefault | null {
        const ownKey = this.existingKey(key);

        if (isUndefined(ownKey)) {
            return resolveDefault(defaultValue);
        }

        return (this.items as Record<PropertyKey, TValue>)[ownKey] as TValue;
    }

    /**
     * Get an item from the collection by key or add it to collection if it does not exist.
     *
     * @param key - The key to get or add
     * @param value - The value to add if the key does not exist, or a callback function that returns the value
     * @returns The value at the key or the newly added value
     * @throws TypeError for an array, object or function key, as array_key_exists() refuses one
     *
     * @example
     *
     * new Collection({a: 1, b: 2}).getOrPut('b', 3); -> 2
     * new Collection({a: 1, b: 2}).getOrPut('c', 3); -> 3, collection is now {a: 1, b: 2, c: 3}
     * new Collection([1, 2, 3]).getOrPut(3, () => 4); -> 4, collection is now [1, 2, 3, 4]
     */
    getOrPut<TGetOrPutValue>(
        key: PathKey,
        value: TGetOrPutValue | (() => TGetOrPutValue),
    ): TValue | TGetOrPutValue {
        const ownKey = this.existingKey(key);

        if (!isUndefined(ownKey)) {
            return (this.items as Record<PropertyKey, TValue>)[
                ownKey
            ] as TValue;
        }

        if (isFunction(value)) {
            value = value();
        }

        this.offsetSet(key ?? null, value);

        return value;
    }

    /**
     * Group an array or object by a field or using a callback, array of keys, or key/index
     *
     * @param groupByValue - The key to group by, a callback function, or an array of keys/callbacks for nested grouping
     * @param preserveKeys - Whether to preserve the original keys in the grouped collections
     * @returns A new collection of the groups, each a collection of its items, at every level
     */
    groupBy<TGroupKey extends PropertyKey = PropertyKey>(
        groupByValue:
            | ((value: TValue, index: TKey) => unknown)
            | Array<
                  | TGroupKey
                  | PathKey
                  | ((value: TValue, index: TKey) => unknown)
              >
            | TGroupKey
            | PathKey,
        preserveKeys: boolean = false,
    ) {
        let nextGroups: Array<
            TGroupKey | PathKey | ((value: TValue, index: TKey) => unknown)
        > = [];

        // PHP shifts this level's grouping off the list, and an empty list shifts null, which groups by the values.
        if (!isFunction(groupByValue) && isArray(groupByValue)) {
            [groupByValue = null, ...nextGroups] = groupByValue;
        }

        groupByValue = this.valueRetriever(
            groupByValue as PathKey | ((...args: (TValue | TKey)[]) => unknown),
        ) as (value: TValue, key: TKey) => unknown;

        const groups = new Map<string | number, Collection<TValue, TKey>>();

        // Determine if we should use objects for grouped collections
        // When preserving keys from an object collection, use objects
        const useObjects = preserveKeys && isObject(this.items);

        for (const [key, value] of this.entriesInOrder()) {
            const rawGroupKeys = groupByValue(value, key);
            let groupKeys: unknown[] = [rawGroupKeys];

            // PHP groups by each value of an array it gets back, which a plain object that is no enum case models.
            if (isArray(rawGroupKeys)) {
                groupKeys = rawGroupKeys;
            } else if (
                isPlainObject(rawGroupKeys) &&
                !isEnumCase(rawGroupKeys)
            ) {
                groupKeys = Object.values(rawGroupKeys);
            }

            for (const rawGroupKey of groupKeys) {
                const groupKey = phpComputedKey(rawGroupKey, {
                    enumCases: true,
                    stringables: true,
                    invalid: arrayKeyExistsError,
                });

                let group = groups.get(groupKey);

                if (!group) {
                    group = (useObjects
                        ? this.sameInstance(handOver({}))
                        : this.sameInstance()) as unknown as Collection<
                        TValue,
                        TKey
                    >;
                    groups.set(groupKey, group);
                }

                group.offsetSet(preserveKeys ? key : null, value);
            }
        }

        if (nextGroups.length > 0) {
            for (const [groupKey, group] of groups) {
                groups.set(groupKey, group.groupBy(nextGroups, preserveKeys));
            }
        }

        return this.sameInstance(groups);
    }

    /**
     * Key an associative array by a field or using a callback.
     *
     * @param keyByValue - The path or callback giving each item's key, cast as PHP casts an array key
     * @returns A new collection with keyed items
     *
     * @example
     *
     * new Collection([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]).keyBy('id'); -> new Collection({1: {id: 1, name: 'John'}, 2: {id: 2, name: 'Jane'}})
     * new Collection([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]).keyBy(item => item.name); -> new Collection({'John': {id: 1, name: 'John'}, 'Jane': {id: 2, name: 'Jane'}})
     * new Collection([{user: {id: 7}}]).keyBy(['user', 'id']); -> new Collection({7: {user: {id: 7}}})
     */
    keyBy(
        keyByValue:
            | ((value: TValue, index: TKey) => unknown)
            | ArrayItems<PropertyKey>
            | PathKey,
    ) {
        const keyByValueCallback = this.valueRetriever(
            keyByValue as PathKey | ((...args: (TValue | TKey)[]) => unknown),
        );

        const results = new Map<PropertyKey, TValue>();

        for (const [key, value] of this.entriesInOrder()) {
            const resolvedKey = keyByValueCallback(value, key);

            results.set(
                // JS-only: PHP has no symbols; a symbol key is kept as it is, as arr and obj keyBy keep it.
                isSymbol(resolvedKey)
                    ? resolvedKey
                    : phpComputedKey(resolvedKey, {
                          enumCases: true,
                          stringables: true,
                          invalid: unconvertibleKey,
                      }),
                value,
            );
        }

        return this.sameInstance(results);
    }

    /**
     * Determine if an item exists in the collection by key.
     *
     * Each key is looked up literally, as PHP's `array_key_exists` does, and a null key reads the `""` key.
     *
     * @param keys - The keys to check for, as arguments or as one array given first, which ignores the rest
     * @returns True if all keys exist, false otherwise
     * @throws TypeError for an array, object or function key it reaches, as array_key_exists() refuses one
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).has('a'); -> true
     * new Collection({a: 1, b: 2, c: 3}).has(['a', 'b']); -> true
     * new Collection({a: 1, b: 2, c: 3}).has(['a', 'd']); -> false
     * new Collection({a: {b: 1}}).has('a.b'); -> false
     */
    has(...keys: PathKey[] | PathKeys[]): boolean {
        const [key, ...rest] = keys;
        // PHP reads an array first argument as the whole key list, and any other call's arguments as its keys.
        const list: readonly unknown[] = isArray(key) ? key : [key, ...rest];

        return list.every((each) => !isUndefined(this.existingKey(each)));
    }

    /**
     * Determine if any of the keys exist in the collection.
     *
     * Each key is looked up literally, as PHP's `array_key_exists` does, and a null key reads the `""` key.
     *
     * @param keys - The keys to check for, as arguments or as one array given first, which ignores the rest
     * @returns True if any key exists, false otherwise
     * @throws TypeError for an array, object or function key it reaches, as array_key_exists() refuses one
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).hasAny('a'); -> true
     * new Collection({a: 1, b: 2, c: 3}).hasAny(['a', 'd']); -> true
     * new Collection({a: 1, b: 2, c: 3}).hasAny(['d', 'e']); -> false
     */
    hasAny(...keys: PathKey[] | PathKeys[]) {
        if (this.isEmpty()) {
            return false;
        }

        const [key, ...rest] = keys;
        const list: readonly unknown[] = isArray(key) ? key : [key, ...rest];

        return list.some((each) => !isUndefined(this.existingKey(each)));
    }

    /**
     * Determine if the collection contains multiple items, optionally matching the given criteria.
     *
     * @param key - A callback, the key to compare when an operator or value follows, or null to count every item
     * @param operator - The operator to use for comparison, or the value itself when no third argument is given
     * @param value - The value to compare against (if using key-value matching)
     * @returns True if multiple items exist or match the condition, false otherwise
     * @throws TypeError for a lone key that is not callable, unless PHP compares it equal to null
     *
     * @example
     *
     * new Collection([1, 2]).hasMany(); -> true
     * new Collection([1]).hasMany(); -> false
     * new Collection([{age: 2}, {age: 3}]).hasMany('age', '>', 1); -> true
     * new Collection([{age: 2}, {age: 3}]).hasMany(item => item.age > 1); -> true
     */
    hasMany(
        key?: ((value: TValue, index: TKey) => unknown) | PathKey | null,
        operator?: unknown,
        value?: unknown,
    ): boolean;
    hasMany(
        ...args: [
            key?: ((value: TValue, index: TKey) => unknown) | PathKey | null,
            operator?: unknown,
            value?: unknown,
        ]
    ): boolean {
        return this.filterUnlessNull(args).take(2).count() === 2;
    }

    /**
     * Determine if the collection contains a single item, optionally matching the given criteria.
     *
     * @param key - A callback, the key to compare when an operator or value follows, or null to count every item
     * @param operator - The operator to use for comparison, or the value itself when no third argument is given
     * @param value - The value to compare against (if using key-value matching)
     * @returns True if exactly one item exists or matches the condition, false otherwise
     * @throws TypeError for a lone key that is not callable, unless PHP compares it equal to null
     *
     * @example
     *
     * new Collection([1]).hasSole(); -> true
     * new Collection([1, 2]).hasSole(); -> false
     * new Collection([{age: 2}, {age: 3}]).hasSole('age', 2); -> true
     * new Collection([{age: 2}, {age: 3}]).hasSole(item => item.age === 2); -> true
     */
    hasSole(
        key?: ((value: TValue, index: TKey) => unknown) | PathKey | null,
        operator?: unknown,
        value?: unknown,
    ): boolean;
    hasSole(
        ...args: [
            key?: ((value: TValue, index: TKey) => unknown) | PathKey | null,
            operator?: unknown,
            value?: unknown,
        ]
    ): boolean {
        return this.filterUnlessNull(args).count() === 1;
    }

    /**
     * Concatenate values of a given key as a string.
     *
     * @param value - The key to pluck values from, or a callback function to generate values; the glue when the
     * items are neither arrays nor objects
     * @param glue - The string to join values with, defaults to an empty string
     * @returns A string of concatenated values
     * @throws Error for a piece that is an object without its own toString, or a closure, which PHP cannot cast
     *
     * @example
     *
     * new Collection(['apple', 'banana', 'cherry']).implode(''); -> 'applebananacherry'
     * new Collection(['apple', 'banana', 'cherry']).implode(', '); -> 'apple, banana, cherry'
     * new Collection([{name: 'John'}, {name: 'Jane'}]).implode('name', ', '); -> 'John, Jane'
     * new Collection({a: {name: 'John'}, b: {name: 'Jane'}}).implode(item => item.name.toUpperCase(), ' - '); -> 'JOHN - JANE'
     */
    implode<TReturnValue>(
        value: ((item: TValue, key: TKey) => TReturnValue) | PropertyKey | null,
        glue: string | null = null,
    ) {
        const joinItems = (items: unknown[], separator: string | null) =>
            items.map(phpStringCast).join(separator ?? "");

        if (isFunction(value)) {
            const ordered = this.orderedEntries();

            // `map` answers from the plain object, which re-sorts integer keys ascending;
            // implode is positional, so a Map-built backing is read through its own pairs.
            return joinItems(
                ordered
                    ? ordered.map(([key, item]) => value(item, key))
                    : Object.values(this.map(value).all()),
                glue,
            );
        }

        const first = this.first();

        if (isArray(first) || (isObject(first) && !joinsAsString(first))) {
            // The cast re-narrows what isFunction left: its constraint takes unknown[], so it subtracts nothing.
            return joinItems(
                this.orderedValues().map((item) =>
                    itemValue(item, value as PathKey),
                ),
                glue,
            );
        }

        return joinItems(this.orderedValues(), value as string | null);
    }

    /**
     * Intersect the collection with the given items.
     *
     * @param items - The items to intersect with
     * @returns A new collection with the intersected items
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).intersect([2, 4, 6]); -> new Collection([2, 4])
     * new Collection({a: 1, b: 2, c: 3}).intersect({b: 2, d: 4}); -> new Collection({b: 2})
     */
    intersect<TOperand extends Operand>(items: TOperand) {
        if (isNull(items)) {
            return this.sameInstance(handOver(isArray(this.items) ? [] : {}));
        }

        return this.sameInstance(
            handOver(
                dataIntersect(
                    this.items,
                    this.getRawItems(items) as DataItems<TValue, TKey>,
                ),
            ),
        );
    }

    /**
     * Intersect the collection with the given items, using the callback.
     *
     * @param items - The items to intersect with
     * @param callback - A comparator answering 0 for equal values, as PHP's `strcasecmp` and `<=>` do, or true
     * @returns A new collection with the intersected items
     *
     * @example
     *
     * new Collection([1, 2, 3]).intersectUsing([2, 3], (a, b) => a - b); -> new Collection([2, 3])
     * new Collection(['apple', 'banana']).intersectUsing(['banana'], (a, b) => a === b); -> new Collection(['banana'])
     */
    intersectUsing<TOperand extends Operand>(
        items: TOperand,
        callback: (a: TValue, b: OperandValue<TOperand>) => boolean | number,
    ) {
        if (isNull(items)) {
            return this.sameInstance(handOver(isArray(this.items) ? [] : {}));
        }

        return this.sameInstance(
            handOver(
                dataIntersectUsing(
                    this.items,
                    this.getRawItems(items) as DataItems<TValue, TKey>,
                    // `this.items` is a union, so the call lands on obj's widest row, whose
                    // comparator takes `unknown` and rejects a typed callback (contravariance).
                    equalityTest(callback) as (
                        a: unknown,
                        b: unknown,
                    ) => boolean,
                ),
            ),
        );
    }

    /**
     * Intersect the collection with the given items with additional key check.
     * Returns items where both the key AND value match.
     *
     * @param items - The items to intersect with
     * @returns A new collection with the intersected items
     *
     * @example
     *
     * new Collection({a: 'green', b: 'brown', c: 'blue'}).intersectAssoc({a: 'green', b: 'yellow', c: 'blue'}); -> new Collection({a: 'green', c: 'blue'})
     * new Collection([1, 2, 3]).intersectAssoc([2, 3, 4]); -> new Collection([])
     */
    intersectAssoc<TOperand extends Operand>(items: TOperand) {
        if (isNull(items)) {
            return this.sameInstance(handOver(isArray(this.items) ? [] : {}));
        }

        return this.sameInstance(
            handOver(
                dataIntersectAssoc(
                    this.items,
                    this.getRawItems(items) as DataItems<TValue, TKey>,
                ),
            ),
        );
    }

    /**
     * Intersect the collection with the given items with additional key check, using the callback.
     * The callback is used to compare keys, while values are compared strictly.
     *
     * @param items - The items to intersect with
     * @param callback - A comparator answering 0 for matching keys, as PHP's `strcasecmp` does, or true
     * @returns A new collection with the intersected items
     *
     * @example
     *
     * const strcasecmp = (a, b) => String(a).localeCompare(String(b), 'en', {sensitivity: 'base'});
     * new Collection({a: 'x', b: 'y'}).intersectAssocUsing({A: 'X', B: 'y'}, strcasecmp); -> new Collection({b: 'y'})
     */
    intersectAssocUsing<TOperand extends Operand>(
        items: TOperand,
        callback: (keyA: TKey, keyB: TKey) => boolean | number,
    ) {
        if (isNull(items)) {
            return this.sameInstance(handOver(isArray(this.items) ? [] : {}));
        }

        return this.sameInstance(
            handOver(
                dataIntersectAssocUsing(
                    this.items,
                    this.getRawItems(items) as DataItems<TValue, TKey>,
                    // `this.items` is a union, so the call lands on obj's widest row, whose
                    // comparator takes a bare key and rejects a typed callback (contravariance).
                    equalityTest(callback) as (
                        keyA: string | number,
                        keyB: string | number,
                    ) => boolean,
                ),
            ),
        );
    }

    /**
     * Intersect the collection with the given items by key.
     *
     * @param items - The items to intersect with
     * @returns A new collection with the intersected items
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).intersectByKeys({b: 2, d: 4}); -> new Collection({b: 2})
     * new Collection([1, 2, 3, 4]).intersectByKeys([1, 3]); -> new Collection([1, 2])
     */
    intersectByKeys<TOperand extends Operand>(items: TOperand) {
        if (isNull(items)) {
            return this.sameInstance(handOver(isArray(this.items) ? [] : {}));
        }
        return this.sameInstance(
            handOver(
                dataIntersectByKeys(
                    this.items,
                    this.getRawItems(items) as DataItems<TValue, TKey>,
                ),
            ),
        );
    }

    /**
     * Determine if the collection is empty or not.
     *
     * @returns True if the collection is empty, false otherwise
     *
     * @example
     *
     * new Collection([]).isEmpty(); -> true
     * new Collection([1, 2, 3]).isEmpty(); -> false
     */
    isEmpty(): boolean {
        // some() skips a list's holes, which count() does not count, and stops at the first item.
        return isArray(this.items)
            ? !this.items.some(() => true)
            : Object.keys(this.items).length === 0;
    }

    /**
     * Determine if the collection contains exactly one item. If a callback is provided, determine if exactly one item matches the condition.
     *
     * @param callback - The callback function to test with, or null
     * @returns True if exactly one item exists or matches the condition, false otherwise
     *
     * @deprecated Use the `hasSole()` method instead.
     *
     * @example
     *
     * new Collection([1]).containsOneItem(); -> true
     * new Collection([]).containsOneItem(); -> false
     * new Collection([1, 2, 3]).containsOneItem(x => x >= 2); -> false
     * new Collection([1, 2, 3]).containsOneItem(x => x < 2); -> true
     */
    containsOneItem(
        callback: ((value: TValue, key: TKey) => unknown) | null = null,
    ) {
        return this.hasSole(callback);
    }

    /**
     * Determine if the collection contains multiple items. If a callback is provided, determine if multiple items match the condition.
     *
     * @param callback - The callback function to test with, or null
     * @returns True if multiple items exist or match the condition, false otherwise
     *
     * @deprecated Use the `hasMany()` method instead.
     *
     * @example
     *
     * new Collection([1, 2]).containsManyItems(); -> true
     * new Collection([1]).containsManyItems(); -> false
     * new Collection([1, 2, 2]).containsManyItems(x => x === 2); -> true
     * new Collection(['ant', 'bear', 'cat']).containsManyItems(x => x.length === 3); -> true
     */
    containsManyItems(
        callback: ((value: TValue, key: TKey) => unknown) | null = null,
    ): boolean {
        return this.hasMany(callback);
    }

    /**
     * Join all items from the collection using a string. The final items can use a separate glue string.
     *
     * @param glue - The string to join all but the last item with
     * @param finalGlue - The string to join the last item with, defaults to an empty string
     * @returns A string of joined items
     * @throws Error for an item that is an object without its own toString, or a closure, which PHP cannot cast
     *
     * @example
     *
     * new Collection(['apple', 'banana', 'cherry']).join(', '); -> 'apple, banana, cherry'
     * new Collection(['apple', 'banana', 'cherry']).join(', ', ' and '); -> 'apple, banana and cherry'
     * new Collection([1, 2, 3]).join(' + ', ' = '); -> '1 + 2 = 3'
     * new Collection(['apple']).join(', ', ' and '); -> 'apple'
     */
    join(glue: string, finalGlue: string = "") {
        if (finalGlue === "") {
            return this.implode(glue);
        }

        const count = this.count();

        if (count === 0) {
            return "";
        }

        if (count === 1) {
            return this.last();
        }

        // PHP's `new static($this->items)` copies the array, because an array is a value
        // there. A JS backing is a reference, so without a copy `pop` below would delete
        // this collection's last entry — a read-only call silently losing an item.
        const collection = this.detachedCopy();

        const finalItem = collection.pop();

        // PHP's . casts the last item as implode() casts the others.
        return `${collection.implode(glue)}${finalGlue}${phpStringCast(finalItem)}`;
    }

    /**
     * Get the keys of the collection items.
     *
     * @returns A new collection containing the keys
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).keys(); -> new Collection(['a', 'b', 'c'])
     * new Collection([1, 2, 3]).keys(); -> new Collection([0, 1, 2])
     */
    keys(): Collection<TKey, number> {
        const ordered = this.orderedEntries();

        // If we have preserved order for numeric keys, use it
        if (ordered) {
            return this.sameInstance(
                handOver(ordered.map(([key]) => key)),
            ) as unknown as Collection<TKey, number>;
        }

        return this.sameInstance(
            handOver(dataKeys(this.items)),
        ) as unknown as Collection<TKey, number>;
    }

    /**
     * Get the last item from the collection.
     *
     * @param callback - The callback function to test with, or null
     * @param defaultValue - The default value to return if no item is found
     * @returns The last matching item or default value
     *
     * @example
     *
     * new Collection([1, 2, 3]).last(); -> 3
     * new Collection([1, 2, 3, 4]).last(x => x < 4); -> 3
     * new Collection([]).last(null, 'default'); -> 'default'
     */
    last<D = null>(
        callback?: ((value: TValue, key: TKey) => unknown) | null,
        defaultValue?: D | (() => D),
    ): TValue | D | null {
        const ordered = this.orderedEntries();

        // array_reverse then reset: `last` is `first` over the entries read backwards.
        if (ordered) {
            return this.firstOrdered(
                [...ordered].reverse(),
                callback,
                defaultValue,
            );
        }

        // Same as `first`: the `DataItems` union picks obj's widest row, so both the
        // `unknown`-valued callback and the restated return type are forced here.
        return dataLast(
            this.items,
            callback as
                | ((value: unknown, key: string | number) => unknown)
                | null,
            defaultValue,
        ) as TValue | D | null;
    }

    /**
     * Get the values of a given key.
     *
     * @param value - The key path to pluck
     * @returns A new collection with plucked values
     *
     * @example
     *
     * new Collection([{name: 'John'}, {name: 'Jane'}]).pluck('name'); -> Collection(['John', 'Jane'])
     * new Collection({a: {name: 'John'}, b: {name: 'Jane'}}).pluck('name'); ->  Collection(['John', 'Jane'])
     * new Collection({a: { id: 1, name: "John" }, b: { id: 2, name: "Jane" }}).pluck('name', 'id'); -> Collection({1: "John", 2: "Jane"})
     */
    pluck<TPluckValue = TValue>(
        value: string | PropertyKey | ((item: TValue) => TPluckValue),
        key: PropertyKey | ((item: TValue) => unknown) | null = null,
    ): Collection<TPluckValue, TKey> {
        if (isNull(key) || isUndefined(key)) {
            return this.sameInstance(
                handOver(
                    dataPluck(
                        this.items,
                        value as string | ((item: unknown) => unknown),
                        null,
                    ),
                ),
            ) as unknown as Collection<TPluckValue, TKey>;
        }

        const results = new Map<string | number, unknown>();

        for (const item of this.orderedValues()) {
            const pluckedValue = isFunction(value)
                ? value(item)
                : itemValue(item, value as PathKey);
            const pluckedKey = isFunction(key)
                ? key(item)
                : itemValue(item, key as PathKey);

            // Arr::pluck casts an object with __toString to its string before PHP casts the array key.
            results.set(
                phpComputedKey(pluckedKey, { stringables: true }),
                pluckedValue,
            );
        }

        return this.sameInstance(results) as unknown as Collection<
            TPluckValue,
            TKey
        >;
    }

    /**
     * Run a map over each of the items.
     *
     * @param callback - The callback function to map with
     * @returns A new collection with mapped items
     *
     * @example
     *
     * new Collection([1, 2, 3]).map(x => x * 2); -> new Collection([2, 4, 6])
     * new Collection({a: 1, b: 2, c: 3}).map((value, key) => value * 2); -> new Collection({a: 2, b: 4, c: 6})
     */
    map<TMapValue>(callback: (value: TValue, key: TKey) => TMapValue) {
        return this.sameInstance(
            handOver(
                dataMap(this.items, (value, key) =>
                    callback(value as TValue, key as TKey),
                ),
            ),
        );
    }

    /**
     * Run a dictionary map over the items.
     *
     * The callback should return an object with a single key/value pair. Only its first pair is read, so a list it
     * returns files its first value under key 0.
     *
     * @param callback - The callback function to map with
     * @returns A new collection with mapped items as a dictionary where each value is an array of accumulated values
     *
     * @example
     *
     * new Collection([{id: 1, name: 'A'}, {id: 2, name: 'B'}, {id: 3, name: 'A'}]).mapToDictionary(item => ({[item.name]: item.id})); -> new Collection({A: [1, 3], B: [2]})
     * new Collection([{id: 1, name: 'A'}]).mapToDictionary(item => [item.name, item.id]); -> new Collection({0: ['A']})
     */
    mapToDictionary<
        TMapToDictionaryValue,
        TMapToDictionaryKey extends PropertyKey = PropertyKey,
    >(
        callback: (
            value: TValue,
            key: TKey,
        ) => Record<TMapToDictionaryKey, TMapToDictionaryValue>,
    ) {
        const dictionary = new Map<string | number, unknown[]>();

        for (const [key, value] of this.entriesInOrder()) {
            // PHP reads the pair with key() and reset(), which give null and false when there is none.
            const [pairKey, pairValue] = Object.entries(
                callback(value, key),
            )[0] ?? [null, false];
            const dictionaryKey = phpArrayKey(pairKey);
            const values = dictionary.get(dictionaryKey);

            if (values) {
                values.push(pairValue);
            } else {
                dictionary.set(dictionaryKey, [pairValue]);
            }
        }

        return this.sameInstance(dictionary);
    }

    /**
     * Run an associative map over each of the items.
     *
     * The callback should return an object with a single key/value pair.
     *
     * @param callback - The callback function to map with, returning its pairs as an object or a collection
     * @returns A new collection with mapped items as an associative array
     *
     * @example
     *
     * new Collection([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]).mapWithKeys(item => ({[item.id]: item.name})); -> new Collection({1: 'John', 2: 'Jane'})
     * new Collection(['apple', 'banana']).mapWithKeys((item, index) => ({[index]: item.toUpperCase()})); -> new Collection({0: 'APPLE', 1: 'BANANA'})
     */
    mapWithKeys<
        TMapWithKeysValue,
        TMapWithKeysKey extends PropertyKey = PropertyKey,
    >(
        callback: (
            value: TValue,
            key: TKey,
        ) => Record<TMapWithKeysKey, TMapWithKeysValue>,
    ) {
        const map = new Map<TMapWithKeysKey, TMapWithKeysValue>();

        for (const [key, value] of this.entriesInOrder()) {
            const result = callback(value, key);
            // PHP's foreach walks a collection by its items, never by its own fields; a Map stands for an array.
            const pairs =
                result instanceof Collection
                    ? result.entriesInOrder()
                    : isMap(result)
                      ? [...result]
                      : Object.entries(result);

            for (const [newKey, newValue] of pairs) {
                map.set(
                    newKey as TMapWithKeysKey,
                    newValue as TMapWithKeysValue,
                );
            }
        }

        return this.sameInstance(map);
    }

    /**
     * Merge the collection with the given items.
     *
     * As `array_merge` does, integer keys are renumbered and appended in order, and a string key keeps its first place.
     *
     * @param items - The items to merge with
     * @returns A new collection with merged items, a list when every key is an integer
     *
     * @example
     *
     * new Collection([1, 2]).merge([3, 4]); -> new Collection([1, 2, 3, 4])
     * new Collection({a: 1, b: 2}).merge({c: 3, a: 4}); -> new Collection({a: 4, b: 2, c: 3})
     * new Collection([1, 2]).merge({a: 3}); -> new Collection({0: 1, 1: 2, a: 3})
     * new Collection({5: 'a'}).merge({5: 'b'}); -> new Collection(['a', 'b'])
     */
    merge<TOperand extends Operand>(items: TOperand) {
        const merged = renumberIntegerKeys<unknown>([
            ...this.entriesInOrder(),
            ...this.operandEntries(items),
        ]);

        return this.sameInstance(inPhpOrder(merged));
    }

    /**
     * Recursively merge the collection with the given items.
     *
     * As `array_merge_recursive` does, integer keys append at every depth, and a string key both sides hold merges
     * both values, each one that is not an array joining the other as one.
     *
     * @param items - The items to merge with
     * @returns A new collection with merged items, a list when every key is an integer
     *
     * @example
     *
     * new Collection({a: {b: 1}}).mergeRecursive({a: {c: 2}}); -> new Collection({a: {b: 1, c: 2}})
     * new Collection({a: {b: 1}}).mergeRecursive({a: {b: 2}}); -> new Collection({a: {b: [1, 2]}})
     * new Collection([1, [2, 3]]).mergeRecursive([4, [5]]); -> new Collection([1, [2, 3], 4, [5]])
     * new Collection({a: 1}).mergeRecursive({a: [2, 3]}); -> new Collection({a: [1, 2, 3]})
     */
    mergeRecursive<TOperand extends Operand>(
        items: TOperand,
    ): this | Collection<TValue | OperandValue<TOperand>, TKey> {
        // The receiver goes in first, so its own integer keys renumber as array_merge_recursive copies it.
        const receiver = mergeRecursively(new Map(), this.entriesInOrder());

        return this.sameInstance(
            inPhpOrder(mergeRecursively(receiver, this.operandEntries(items))),
        );
    }

    /**
     * Multiply the items in the collection by the multiplier.
     *
     * @param multiplier - The number of times to repeat the items; a fraction is dropped, as PHP's int parameter does
     * @returns A new collection with the items' values repeated, as a list
     * @throws TypeError when the multiplier is NAN, infinite or outside PHP's int range, as its int parameter refuses
     *
     * @example
     *
     * new Collection([1, 2]).multiply(3); -> new Collection([1, 2, 1, 2, 1, 2])
     * new Collection({a: 1, b: 2}).multiply(2); -> new Collection([1, 2, 1, 2])
     * new Collection([1, 2]).multiply(2.5); -> new Collection([1, 2, 1, 2])
     * new Collection([1, 2]).multiply(0); -> new Collection([])
     */
    multiply(multiplier: number) {
        const times = phpIntArgument(
            multiplier,
            "Collection::multiply(): Argument #1 ($multiplier) must be of type int, float given",
        );
        const newCollection = this.sameInstance();
        const values = this.getItemValues(this.items);

        for (let i = 0; i < times; i++) {
            newCollection.push(...values);
        }

        return newCollection;
    }

    /**
     * Create a collection by using this collection's own VALUES as keys and
     * another's values as values (`array_combine($this->all(), ...)`), not this
     * collection's own keys.
     *
     * @param values - The values to combine with the keys from this collection
     * @returns A new collection with the combined keys and values
     *
     * @example
     *
     * new Collection([1, 2]).combine([3, 4]); -> new Collection({1: 3, 2: 4})
     */
    combine<TOperand extends Operand>(values: TOperand) {
        const keys = this.orderedValues();
        const combined = dataCombine(
            keys,
            this.getRawItems(values) as TValue[],
        ) as Record<string, unknown>;

        // PHP's empty array is a list, where a Map holding no entries would build an empty record.
        if (keys.length === 0) {
            return this.sameInstance(handOver([]));
        }

        // A plain object re-sorts integer keys, so the combined pairs are laid out again in the order the keys come.
        return this.sameInstance(
            new Map(
                keys.map((key) => {
                    const phpKey = toPhpKeyString(key);

                    return [phpKey, combined[phpKey]];
                }),
            ),
        );
    }

    /**
     * Union the collection with the given items, mirroring PHP's `+`
     * operator: this collection's own keys win, the argument only fills
     * keys it doesn't already have.
     *
     * @param items - The items to union with: a list or an object, whatever this collection's backing.
     * @returns A new collection with the union of items; object-backed once its keys aren't `0..n-1`
     *
     * @example
     *
     * new Collection([1, 2, 3]).union([3, 4, 5]); -> new Collection([1, 2, 3])
     * new Collection([1, 2]).union([3, 4, 5]); -> new Collection([1, 2, 5])
     * new Collection([1, 2]).union({a: 3}); -> new Collection({0: 1, 1: 2, a: 3})
     * new Collection({a: 1, b: 2}).union({b: 2, c: 3}); -> new Collection({a: 1, b: 2, c: 3})
     */
    union<TOperand extends Operand>(items: TOperand) {
        const operand = this.operandEntries(items);

        return this.sameInstance(
            this.inKeyOrder(dataUnion(this.items, new Map(operand)), operand),
        );
    }

    /**
     * Create a new collection consisting of every n-th element.
     *
     * @param step - The step interval to take elements; a fraction is dropped, as PHP's `%` drops it
     * @param offset - The offset to start from, defaults to 0, read as slice() reads it
     * @returns A new collection with every n-th element
     * @throws InvalidArgumentException if step is less than 1
     * @throws Error when the step is NAN or infinite and there is an item to step over, as PHP's `%` divides by zero
     *
     * @example
     *
     * collect(new Map([[6, "a"], [4, "b"], [7, "c"], [1, "d"], [5, "e"], [3, "f"]])).nth(4).all() -> ["a", "e"]
     */
    nth(step: number, offset: number = 0): Collection<TValue[], number> {
        if (step < 1) {
            throw new InvalidArgumentException(
                "Step value must be at least 1.",
            );
        }

        const values = this.slice(offset).orderedValues();
        // PHP's % casts the step to an int, which makes NAN or an infinity 0, and divides only once an item comes.
        const divisor = phpIntCast(step);

        if (divisor === 0 && values.length > 0) {
            throw new Error("Modulo by zero");
        }

        return this.sameInstance(
            handOver(values.filter((_, position) => position % divisor === 0)),
        ) as unknown as Collection<TValue[], number>;
    }

    /**
     * Get the items with the specified keys.
     *
     * @param keys - The key or keys to retrieve
     * @returns A new collection with only the specified keys
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).only('a'); -> new Collection({a: 1})
     * new Collection({a: 1, b: 2, c: 3}).only('a', 'c'); -> new Collection({a: 1, c: 3})
     * new Collection([1, 2, 3]).only(0, 2); -> new Collection([1, 3])
     * new Collection([1, 2, 3]).only(1); -> new Collection([2])
     * new Collection([1, 2, 3]).only(null); -> new Collection([1, 2, 3])
     * new Collection(['a', 'b', 'c', 'd']).only([3, 1]); -> new Collection(['b', 'd'])
     */
    only<T extends PathKey, K extends PropertyKey>(
        ...keys: PathKey[] | PathKeys[] | Collection<T, K, CollectionShape>[]
    ) {
        const keysToKeep = this.keysArgument(keys);

        if (isNull(keysToKeep)) {
            return this.sameInstance(this.items);
        }

        return this.sameInstance(handOver(dataOnly(this.items, keysToKeep)));
    }

    /**
     * Select specific values from the items within the collection.
     *
     * Unlike `only`, the keys are looked up inside each item rather than on the
     * collection itself, so a collection of keys is always a numerically
     * indexed collection of key paths.
     *
     * @param keys - The key or keys to select from each item
     * @returns A new collection with only the selected values
     *
     * @example
     *
     * new Collection([{id: 1, name: 'John', age: 30}, {id: 2, name: 'Jane', age: 25}]).select('id', 'name'); -> new Collection([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}])
     * new Collection({a: {id: 1, name: 'John'}, b: {id: 2, name: 'Jane'}}).select('id'); -> new Collection({a: {id: 1}, b: {id: 2}})
     * new Collection([{id: 1, details: {age: 30}}]).select(['id', 'details.age']); -> new Collection([{id: 1}])
     * new Collection([[10, 20, 30]]).select([0, 2]); -> new Collection([{0: 10, 2: 30}])
     */
    select(
        ...keys:
            | PathKey[]
            | PathKeys[]
            | Collection<string, number, CollectionShape>[]
    ) {
        const keysToSelect = this.keysArgument(keys);

        if (isNull(keysToSelect)) {
            return this.sameInstance(this.items);
        }

        return this.sameInstance(
            handOver(dataSelect(this.items, keysToSelect)),
        );
    }

    /**
     * Get and remove the last N items from the collection.
     *
     * @param count - The number of items to pop; a fraction is dropped, and NAN pops every item
     * @returns A new collection with the popped items
     * @throws Error for a fraction between 1 and 2 that the items do not cap, as PHP's range() throws its ValueError
     *
     * @example
     *
     * new Collection([1, 2, 3]).pop(2); -> new Collection([3, 2])
     * new Collection({a: 1, b: 2, c: 3}).pop(2); -> new Collection([3, 2])
     */
    pop(): TValue | null;
    pop(count: number): Collection<TValue[], number>;
    pop(count: number = 1): TValue | null | Collection<TValue[], number> {
        if (count < 1) {
            return this.sameInstance() as unknown as Collection<
                TValue[],
                number
            >;
        }

        const ordered = this.orderedEntries();

        if (ordered) {
            const taken = resolveTakeCount(count, ordered.length);
            const kept = ordered.slice(0, ordered.length - taken);
            const removed = ordered
                .slice(kept.length)
                .map(([, value]) => value)
                .reverse();

            // array_pop takes the last entry written, not the highest key, and renumbers nothing.
            this.setOrderedItems(kept, false);

            if (count === 1) {
                return removed[0] ?? null;
            }

            return this.sameInstance(
                handOver(removed),
            ) as unknown as Collection<TValue[], number>;
        }

        if (count === 1) {
            if (isArray(this.items)) {
                return (this.items as TValue[]).pop() ?? null;
            }

            // For objects, remove and return the last item
            const keys = Object.keys(this.items) as TKey[];

            if (keys.length === 0) {
                return null;
            }

            const lastKey = keys[keys.length - 1] as TKey;
            const value = (this.items as Record<TKey, TValue>)[lastKey];
            delete (this.items as Record<TKey, TValue>)[lastKey];

            return value;
        }

        if (this.isEmpty()) {
            return this.sameInstance() as unknown as Collection<
                TValue[],
                number
            >;
        }

        const poppedValues = dataPop(this.items, count) as TValue[];

        return this.sameInstance(
            handOver(poppedValues),
        ) as unknown as Collection<TValue[], number>;
    }

    /**
     * Push an item onto the beginning of the collection.
     *
     * @param value - The value to prepend
     * @param key - The key to prepend the value at, cast as PHP casts an array key (null files it under "");
     *   a list backing given any key but 0 becomes object-backed, as PHP's keyed array does
     * @returns The collection instance for chaining
     *
     * @example
     *
     * new Collection([2, 3]).prepend(1); -> new Collection([1, 2, 3])
     * new Collection([2, 3]).prepend(1, 'a'); -> new Collection({a: 1, 0: 2, 1: 3})
     * new Collection({b: 2, c: 3}).prepend(1, 'a'); -> new Collection({a: 1, b: 2, c: 3})
     * new Collection([]).prepend(1); -> new Collection([1])
     * new Collection({}).prepend(1, 'a'); -> new Collection({a: 1})
     */
    prepend<T, K extends PropertyKey>(value: T, key?: K | null) {
        const ordered = this.orderedEntries();

        if (arguments.length === 1) {
            if (ordered) {
                this.unshiftOrdered(ordered, [value as unknown as TValue]);
            } else {
                this.items = dataPrepend(this.items, value) as DataItems<
                    TValue,
                    TKey
                >;
            }

            return this;
        }

        // `[$key => $value] + $array`: the new pair leads, and wins its key outright.
        const ownKey = phpArrayKey(key ?? null);
        const prepended = ordered
            ? undefined
            : (dataPrepend(this.items, value, key ?? null) as DataItems<
                  TValue,
                  TKey
              >);

        // A plain object sorts its integer keys first, so it holds PHP's order only when the new key leads there.
        if (
            prepended &&
            (isArray(prepended) || Object.keys(prepended)[0] === String(ownKey))
        ) {
            this.items = prepended;

            return this;
        }

        this.setOrderedItems(
            [
                [ownKey, value as unknown as TValue],
                ...this.entriesInOrder().filter(
                    ([existing]) => String(existing) !== String(ownKey),
                ),
            ],
            false,
        );

        return this;
    }

    /**
     * Push one or more items onto the end of the collection.
     *
     * @param values - The values to push
     * @returns The collection instance for chaining
     *
     * @example
     *
     * new Collection([1, 2]).push(3); -> new Collection([1, 2, 3])
     * new Collection([1, 2]).push(3, 4, 5); -> new Collection([1, 2, 3, 4, 5])
     * new Collection({a: 1}).push(2); -> new Collection({a: 1, 0: 2})
     */
    push<T>(...values: T[]) {
        this.appendItems(values as unknown as TValue[]);

        return this;
    }

    /**
     * Prepend one or more items to the beginning of the collection.
     *
     * @param values - The values to unshift
     * @returns The collection instance for chaining
     *
     * @example
     *
     * new Collection([2, 3]).unshift(1); -> new Collection([1, 2, 3])
     * new Collection([3, 4]).unshift(1, 2); -> new Collection([1, 2, 3, 4])
     * new Collection([4, 5, 6]).unshift(['a', 'b', 'c']); -> new Collection([['a', 'b', 'c'], 4, 5, 6])
     * new Collection({b: 2}).unshift({a: 1}); -> new Collection({0: {a: 1}, b: 2})
     */
    unshift<T>(...values: T[]) {
        // Arrays stay on the built-in unshift, which keeps the undefined items Arr.unshift drops;
        // dataUnshift rewrites an object backing in place, as array_unshift does by reference.
        const ordered = this.orderedEntries();

        if (isArray(this.items)) {
            this.items.unshift(...(values as unknown as TValue[]));
        } else if (ordered) {
            this.unshiftOrdered(ordered, values as unknown as TValue[]);
        } else {
            dataUnshift(this.items, ...values);
        }

        return this;
    }

    /**
     * Push all of the given items onto the collection.
     *
     * @param source - The items to concatenate
     * @returns A new collection with the concatenated items
     *
     * @example
     *
     * new Collection([1, 2]).concat([3, 4]); -> new Collection([1, 2, 3, 4])
     * new Collection({a: 1, b: 2}).concat({c: 3, d: 4}); -> new Collection({a: 1, b: 2, c: 3, d: 4})
     * new Collection([1, 2]).concat({a: 3}); -> new Collection([1, 2, {a: 3}])
     */
    concat<TOperand extends NonNullable<Operand>>(source: TOperand) {
        // PHP's `new static($this)` copies the array, because an array is a value there.
        // A JS backing is a reference, so without a copy every `push` below would append
        // to this collection as well as to the result.
        const result = this.detachedCopy();

        result.appendItems(
            this.operandEntries(source).map(([, value]) => value as TValue),
        );

        return result;
    }

    /**
     * Get and remove an item from the collection.
     *
     * The key is read as `Arr::pull` reads it: a key the items hold first, even one with dots, then a dot path into
     * the arrays, plain objects and collections they hold.
     *
     * @param key - The key or dot path of the item to pull
     * @param defaultValue - The default value to return if the key does not exist, or a callback that returns it
     * @returns The value at the specified key, or the default value
     * @throws TypeError for an array, object or function key, as array_key_exists() refuses one
     *
     * @example
     *
     * const collection = new Collection({a: 1, b: 2, c: 3});
     * collection.pull('b', 0); -> 2
     * collection.pull('d', 0); -> 0
     * new Collection({a: {b: 1, c: 2}}).pull('a.b'); -> 1, collection is now {a: {c: 2}}
     */
    pull<TPullDefault>(
        key: PathKey,
        defaultValue?: TPullDefault | (() => TPullDefault),
    ): TValue | TPullDefault | null {
        // Arr::get answers the whole array for a null key, and Arr::forget removes nothing for one.
        if (isNull(key) || isUndefined(key)) {
            return this.castToItems(this.items) as unknown as TValue;
        }

        // Arr::exists checks a float key as its string form; the read and the unset that follow cast it to an integer.
        if (!isUndefined(this.existingKey(isFloat(key) ? String(key) : key))) {
            const value = this.offsetGet(key);
            this.offsetUnset(key);

            return value as TValue;
        }

        const [segment, ...path] = String(key).split(".");
        const itemKey = this.ownKey(segment);

        if (path.length === 0 || isUndefined(itemKey)) {
            return resolveDefault(defaultValue);
        }

        const item = (this.items as Record<PropertyKey, TValue>)[itemKey];
        const [value, pulled] = pullPath(
            item,
            path as [string, ...string[]],
            defaultValue,
        );

        if (pulled !== item) {
            this.putKey(itemKey, pulled as TValue);
        }

        return value as TValue | TPullDefault | null;
    }

    /**
     * Put an item in the collection by key.
     *
     * @param key - The key to set the value at
     * @param value - The value to set
     * @returns The collection instance for chaining
     * @throws TypeError for an array, object or function key, which no PHP array can hold
     *
     * @example
     *
     * new Collection().put('a', 1); -> new Collection({a: 1})
     * new Collection({a: 1}).put('b', 2); -> new Collection({a: 1, b: 2})
     * new Collection([1, 2]).put(2, 3); -> new Collection([1, 2, 3])
     */
    put<K, V>(key: K, value: V) {
        this.offsetSet(key as TKey | null, value);

        return this;
    }

    /**
     * Get one or a specified number of items randomly from the collection.
     *
     * @param count - The number of items to retrieve, a fraction truncated, a callback that answers it, or null for
     * a single item
     * @param preserveKeys - Whether to preserve the original keys, defaults to false
     * @returns A single random item or a new collection with the random items
     * @throws InvalidArgumentException when more items are requested than the collection holds
     * @throws TypeError for a NAN count or a string that is not numeric, as PHP's Randomizer rejects it
     * @throws Error for a count between 0 and 1, which truncates to no item, as PHP's Randomizer rejects it
     *
     * @example
     *
     * new Collection([1, 2, 3]).random(); -> 2
     * new Collection([1, 2, 3]).random(2); -> new Collection([1, 3])
     * new Collection({a: 1, b: 2, c: 3}).random(2, true); -> new Collection({a: 1, c: 3})
     * new Collection([1, 2, 3]).random(collection => Math.floor(collection.count() / 2)); -> new Collection([2])
     * new Collection([]).random(); -> throws InvalidArgumentException (no items available)
     */
    random(count?: null, preserveKeys?: boolean): TValue;
    random(
        count: number | string | ((collection: this) => number),
        preserveKeys?: boolean,
    ): Collection<TValue, TKey>;
    random(
        count?: ((collection: this) => number) | number | string | null,
        preserveKeys?: boolean,
    ): TValue | Collection<TValue, TKey>;
    random(
        count?: ((collection: this) => number) | number | string | null,
        preserveKeys: boolean = false,
    ): unknown {
        if (isNull(count) || isUndefined(count)) {
            return dataRandom(this.items) as TValue;
        }

        const picked = dataRandom(
            this.items,
            isFunction(count) ? (count(this) as number) : (count as number),
            preserveKeys,
        ) as TValue[] | Record<string, TValue>;

        // Arr::random appends each pick unless it keeps their keys,
        // and kept keys that run 0..n-1 in order make a list as well.
        return this.sameInstance(
            handOver(
                isListOrder(Object.keys(picked).map((key) => phpArrayKey(key)))
                    ? Object.values(picked)
                    : picked,
            ),
        );
    }

    /**
     * Replace the collection items with the given items.
     *
     * As `array_replace` does, a replaced key keeps its place and a key the replacer adds comes after the rest.
     *
     * @param items - The items to replace with; `null` replaces nothing
     * @returns A new collection with the replaced items; object-backed once its keys aren't `0..n-1`
     *
     * @example
     *
     * new Collection([1, 2, 3]).replace([4, 5]); -> new Collection([4, 5, 3])
     * new Collection([1, 2, 3]).replace({1: 9, k: 'y'}); -> new Collection({0: 1, 1: 9, 2: 3, k: 'y'})
     * new Collection({a: 1}).replace(['x']); -> new Collection({a: 1, 0: 'x'})
     */
    replace<TOperand extends Operand>(items: TOperand) {
        const operand = this.operandEntries(items);

        return this.sameInstance(
            this.inKeyOrder(dataReplace(this.items, new Map(operand)), operand),
        );
    }

    /**
     * Recursively replace the collection items with the given items.
     *
     * As in `replace`, a key the replacer adds comes after the rest.
     *
     * @param items - The items to replace with; `null` replaces nothing
     * @returns A new collection with the recursively replaced items; object-backed once its keys aren't `0..n-1`
     *
     * @example
     *
     * new Collection({a: {b: 1}}).replaceRecursive({a: {c: 2}}); -> new Collection({a: {b: 1, c: 2}})
     * new Collection(['a']).replaceRecursive({3: 'x'}); -> new Collection({0: 'a', 3: 'x'})
     * new Collection([1, [2, 3]]).replaceRecursive([4, [5]]); -> new Collection([4, [5, 3]])
     * new Collection([1, {a: 2}]).replaceRecursive([{b: 3}, {a: 4}]); -> new Collection([{b: 3}, {a: 4}])
     */
    replaceRecursive<TOperand extends Operand>(items: TOperand) {
        const operand = this.operandEntries(items);

        return this.sameInstance(
            this.inKeyOrder(
                dataReplaceRecursive(this.items, new Map(operand)),
                operand,
            ),
        );
    }

    /**
     * Reverse the order of the collection items.
     *
     * @returns A new collection with the items in reverse order
     *
     * @example
     *
     * new Collection([1, 2, 3]).reverse(); -> new Collection([3, 2, 1])
     * new Collection({a: 1, b: 2, c: 3}).reverse(); -> new Collection({c: 3, b: 2, a: 1})
     */
    reverse() {
        return this.sameInstance(handOver(dataReverse(this.items)));
    }

    /**
     * Search the collection for a given value and return the corresponding key if successful.
     *
     * @param value - The value to search for, or a callback to determine a match
     * @param strict - Whether to use strict comparison, defaults to false
     * @returns The key of the found item, or false if not found. A list backing answers its
     * index, which `TKey` need not cover, so the index is part of the answer
     *
     * @example
     *
     * new Collection([1, 2, 3]).search(2); -> 1
     * new Collection({a: 1, b: 2, c: 3}).search(3); -> 'c'
     * new Collection([1, 2, 3]).search(x => x > 2); -> 2
     * new Collection([1, 2, 3]).search(4); -> false
     */
    search(
        value: TValue | ((item: TValue, key: TKey) => unknown),
        strict: boolean = false,
    ): TKey | number | false {
        return dataSearch(this.items, value, strict);
    }

    /**
     * Get the item before the given item.
     *
     * @param value - The value to search for, or a callback to determine a match
     * @param strict - Whether to use strict comparison, defaults to false
     * @returns The item before the found item, or null if not found or no previous item
     *
     * @example
     *
     * new Collection([1, 2, 3]).before(2); -> 1
     * new Collection({a: 1, b: 2, c: 3}).before(3); -> 2
     * new Collection([1, 2, 3]).before(x => x > 2); -> 2
     * new Collection([1, 2, 3]).before(1); -> null
     * new Collection([1, 2, 3]).before(4); -> null
     */
    before(
        value: TValue | ((item: TValue, key: TKey) => unknown),
        strict: boolean = false,
    ): TValue | null {
        return dataBefore(this.items, value, strict);
    }

    /**
     * Get the item after the given item.
     *
     * @param value - The value to search for, or a callback to determine a match
     * @param strict - Whether to use strict comparison, defaults to false
     * @returns The item after the found item, or null if not found or is last item
     *
     * @example
     *
     * new Collection([1, 2, 3]).after(1); -> 2
     * new Collection({a: 1, b: 2, c: 3}).after(2); -> 3
     * new Collection([1, 2, 3]).after(x => x > 1); -> 3
     * new Collection([1, 2, 3]).after(3); -> null
     * new Collection([1, 2, 3]).after(4); -> null
     */
    after(
        value: TValue | ((item: TValue, key: TKey) => unknown),
        strict: boolean = false,
    ): TValue | null {
        return dataAfter(this.items, value, strict);
    }

    /**
     * Get and remove the first N items from the collection.
     *
     * @param count - The number of items to shift; a fraction is dropped, and NAN shifts every item
     * @returns A new collection with the shifted items
     * @throws InvalidArgumentException when the count is negative, even for an empty collection
     * @throws Error for a fraction below 2 that the items do not cap, as PHP's range() throws its ValueError
     *
     * @example
     *
     * new Collection([1, 2, 3]).shift(); -> 1
     * new Collection({a: 1, b: 2, c: 3}).shift(); -> 1
     * new Collection([]).shift(); -> null
     * new Collection([1, 2, 3]).shift(2); -> new Collection([1, 2])
     * new Collection({a: 1, b: 2, c: 3}).shift(2); -> new Collection([1, 2])
     * new Collection([1, 2, 3]).shift(0); -> new Collection([])
     */
    shift(): TValue | null;
    shift(count: number): Collection<TValue[], number>;
    shift(count: number = 1): TValue | null | Collection<TValue[], number> {
        if (count < 0) {
            throw new InvalidArgumentException(
                "Number of shifted items may not be less than zero.",
            );
        }

        if (this.isEmpty()) {
            return null;
        }

        if (count === 0) {
            return this.sameInstance(handOver([])) as unknown as Collection<
                TValue[],
                number
            >;
        }

        const ordered = this.orderedEntries();

        if (ordered) {
            const taken = resolveTakeCount(count, ordered.length);
            const removed = ordered.slice(0, taken).map(([, value]) => value);

            this.setOrderedItems(ordered.slice(taken), true);

            if (count === 1) {
                return removed[0] as TValue;
            }

            return this.sameInstance(
                handOver(removed),
            ) as unknown as Collection<TValue[], number>;
        }

        // Delegating keeps the object-backed branch on array_shift's
        // key renumbering, which the inline version here never did.
        const shifted = dataShift(this.items, count);

        if (count === 1) {
            return shifted as TValue;
        }

        return this.sameInstance(
            handOver(shifted as TValue[]),
        ) as unknown as Collection<TValue[], number>;
    }

    /**
     * Shuffle the items in the collection.
     *
     * @returns A new collection with the items shuffled, as a list whatever keys they had
     *
     * @example
     *
     * new Collection([1, 2, 3]).shuffle(); -> new Collection([3, 1, 2])
     * new Collection({a: 1, b: 2, c: 3}).shuffle(); -> new Collection([2, 3, 1])
     */
    shuffle() {
        return this.sameInstance(handOver(dataShuffle(this.orderedValues())));
    }

    /**
     * Create chunks representing a "sliding window" view of the items in the collection.
     *
     * @param size - The size of each chunk, defaults to 2 (must be at least 1)
     * @param step - The number of items to skip between chunks, defaults to 1 (must be at least 1)
     * @returns A new collection with the sliding window chunks
     * @throws InvalidArgumentException if size or step is less than 1
     * @throws Error when size or step is NAN, as range() refuses the window count static::times() hands it
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).sliding(); -> new Collection([ [1, 2], [2, 3], [3, 4] ])
     * new Collection([1, 2, 3, 4]).sliding(3); -> new Collection([ [1, 2, 3], [2, 3, 4] ])
     * new Collection([1, 2, 3, 4]).sliding(2, 2); -> new Collection([ [1, 2], [3, 4] ])
     * new Collection({a: 1, b: 2, c: 3}).sliding(); -> new Collection([ {a: 1, b: 2}, {b: 2, c: 3} ])
     */
    sliding(
        size: number = 2,
        step: number = 1,
    ): Collection<number, number> | Collection<unknown, PropertyKey> {
        if (size < 1) {
            throw new InvalidArgumentException(
                "Size value must be at least 1.",
            );
        }

        if (step < 1) {
            throw new InvalidArgumentException(
                "Step value must be at least 1.",
            );
        }

        const chunks = Math.floor((this.count() - size) / step) + 1;
        // static::times() builds no window below 1 and hands range() the rest, which refuses NAN.
        const windowCount = chunks < 1 ? 0 : resolveRangeSize(1, chunks, 1);
        const windows: this[] = [];

        for (let window = 1; window <= windowCount; window++) {
            windows.push(this.slice((window - 1) * step, size));
        }

        return this.sameInstance(handOver(windows)) as unknown as Collection<
            unknown,
            PropertyKey
        >;
    }

    /**
     * Skip the first {$count} items.
     *
     * @param count - The number of items to skip
     * @returns A new collection with the items after the skipped ones
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).skip(2); -> new Collection([3, 4])
     * new Collection({a: 1, b: 2, c: 3}).skip(1); -> new Collection({b: 2, c: 3})
     */
    skip(count: number) {
        return this.slice(count);
    }

    /**
     * Skip items in the collection until the given condition is met.
     *
     * @param value - The value to skip until, compared with PHP's `===`, or a callback judged by PHP truthiness
     * @returns A new collection of the items from the first that meets the condition on
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).skipUntil(3); -> new Collection([3, 4])
     * new Collection({a: 1, b: 2, c: 3}).skipUntil((value) => value >= 2); -> new Collection({b: 2, c: 3})
     */
    skipUntil(value: TValue | ((value: TValue, key: TKey) => unknown)) {
        return this.sameInstance(handOver(dataSkipUntil(this.items, value)));
    }

    /**
     * Skip items in the collection while the given condition is met.
     *
     * @param value - The value to skip while items equal it, compared with PHP's `===`, or a callback judged by PHP
     * truthiness
     * @returns A new collection of the items from the first that fails the condition on
     *
     * @example
     *
     * new Collection([1, 1, 2, 1]).skipWhile(1); -> new Collection([2, 1])
     * new Collection({a: 1, b: 2, c: 3}).skipWhile((value) => value < 3); -> new Collection({c: 3})
     */
    skipWhile(value: TValue | ((value: TValue, key: TKey) => unknown)) {
        return this.sameInstance(handOver(dataSkipWhile(this.items, value)));
    }

    /**
     * Slice the underlying collection data.
     *
     * @param offset - The offset to start the slice; a fraction is dropped, as array_slice()'s int parameter drops it
     * @param length - The length of the slice, a fraction dropped likewise, or null to slice to the end
     * @returns A new collection with the sliced items
     * @throws TypeError when the offset or the length is NAN, infinite or outside PHP's int range, as array_slice()
     * refuses it
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).slice(1); -> new Collection([2, 3, 4])
     * new Collection([1, 2, 3, 4]).slice(1, 2); -> new Collection([2, 3])
     * new Collection({a: 1, b: 2, c: 3}).slice(1); -> new Collection({b: 2, c: 3})
     * new Collection({a: 1, b: 2, c: 3}).slice(1, 1); -> new Collection({b: 2})
     * new Collection([1, 2, 3, 4]).slice(-1.5); -> new Collection([4])
     */
    slice(offset: number, length: number | null = null) {
        const start = phpIntArgument(
            offset,
            "array_slice(): Argument #2 ($offset) must be of type int, float given",
        );
        const count = isNull(length)
            ? null
            : phpIntArgument(
                  length,
                  "array_slice(): Argument #3 ($length) must be of type ?int, float given",
              );
        const ordered = this.orderedEntries();

        if (ordered) {
            const range = resolveSliceRange(ordered.length, start, count);

            // array_slice($items, $offset, $length, true): positional, and keys survive.
            return this.sameInstance(
                new Map(ordered.slice(range.start, range.end)),
            );
        }

        return this.sameInstance(handOver(dataSlice(this.items, start, count)));
    }

    /**
     * Split a collection into a certain number of groups.
     *
     * @param numberOfGroups - The number of groups to split into
     * @returns A new collection with the split groups, each group's integer keys renumbered from 0
     * @throws InvalidArgumentException if numberOfGroups is less than 1
     * @throws Error when numberOfGroups is NAN or infinite and there are items, as PHP's `%` divides by zero
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).split(2); -> new Collection([ new Collection([1, 2]), new Collection([3, 4]) ])
     * new Collection({a: 1, b: 2, c: 3, d: 4}).split(2); -> new Collection([ new Collection({a: 1, b: 2}), new Collection({c: 3, d: 4}) ])
     * new Collection([1, 2, 3]).split(5); -> new Collection([ new Collection([1]), new Collection([2]), new Collection([3]) ])
     */
    split(
        numberOfGroups: number,
    ): Collection<Collection<TValue, TKey>, number> {
        if (numberOfGroups < 1) {
            throw new InvalidArgumentException(
                "Number of groups must be at least 1.",
            );
        }

        const groups = this.sameInstance() as unknown as Collection<
            Collection<TValue, TKey>,
            number
        >;

        if (this.isEmpty()) {
            return groups;
        }

        const entries = this.entriesInOrder();
        // PHP's % casts the number of groups to an int, which makes NAN or an infinity 0.
        const divisor = phpIntCast(numberOfGroups);

        if (divisor === 0) {
            throw new Error("Modulo by zero");
        }

        const groupSize = Math.floor(entries.length / numberOfGroups);

        const remain = entries.length % divisor;

        let start = 0;

        for (let i = 0; i < numberOfGroups; i++) {
            let size = groupSize;

            if (i < remain) {
                size += 1;
            }

            // Every group after an empty one is empty too, so PHP's loop adds nothing more, however far it counts.
            if (size === 0) {
                break;
            }

            // array_slice() without preserve_keys renumbers each group's integer keys from 0.
            const group = renumberIntegerKeys(
                entries.slice(start, start + size),
            );

            groups.push(
                this.sameInstance(inPhpOrder(group)) as unknown as Collection<
                    TValue,
                    TKey
                >,
            );

            start += size;
        }

        return groups;
    }

    /**
     * Split a collection into a certain number of groups, and fill the first groups completely.
     *
     * @param numberOfGroups - The number of groups to split into
     * @returns A new collection with the split groups
     * @throws InvalidArgumentException if numberOfGroups is less than 1
     *
     * @example
     *
     * new Collection([1, 2, 3]).splitIn(2); -> new Collection([ new Collection({0: 1, 1: 2}), new Collection({2: 3}) ])
     * new Collection({a: 1, b: 2, c: 3, d: 4}).splitIn(2); -> new Collection([ new Collection({a: 1, b: 2}), new Collection({c: 3, d: 4}) ])
     * new Collection([1, 2]).splitIn(5); -> new Collection([ new Collection({0: 1}), new Collection({1: 2}) ])
     */
    splitIn(numberOfGroups: number) {
        if (numberOfGroups < 1) {
            throw new InvalidArgumentException(
                "Number of groups must be at least 1.",
            );
        }

        // PHP's (int) cast of the size makes NAN 0, which chunk() answers with no chunks.
        return this.chunk(phpIntCast(Math.ceil(this.count() / numberOfGroups)));
    }

    /**
     * Get the first item in the collection, but only if exactly one item exists. Otherwise, throw an exception.
     *
     * @param key - A callback, the key to compare when an operator or value follows, or null to count every item
     * @param operator - The operator to use for comparison, or the value itself when no third argument is given
     * @param value - The value to compare against, or null if key is a callback or null
     * @returns The single item in the collection
     * @throws ItemNotFoundException if no item matches, MultipleItemsFoundException if several do.
     * @throws TypeError for a lone key that is not callable, unless PHP compares it equal to null
     *
     * @example
     *
     * new Collection([1]).sole(); -> 1
     * new Collection([{id: 1}, {id: 2}]).sole('id', '==', 1); -> {id: 1}
     * new Collection([{id: 1}, {id: 2}]).sole(item => item.id === 2); -> {id: 2}
     */
    sole(
        key?: ((value: TValue, index: TKey) => unknown) | PathKey,
        operator?: unknown,
        value?: unknown,
    ): unknown;
    sole(
        ...args: [
            key?: ((value: TValue, index: TKey) => unknown) | PathKey,
            operator?: unknown,
            value?: unknown,
        ]
    ): unknown {
        const items = this.filterUnlessNull(args);

        const count = items.count();

        if (count === 0) {
            throw new ItemNotFoundException();
        }

        if (count > 1) {
            throw new MultipleItemsFoundException(count);
        }

        return items.first();
    }

    /**
     * Get the first item in the collection but throw an exception if no matching items exist.
     *
     * @param key - A callback, the key to compare when an operator or value follows, or null for the first item
     * @param operator - The operator to use for comparison, or the value itself when no third argument is given
     * @param value - The value to compare against, or null if key is a callback
     * @returns The first matching item in the collection
     * @throws ItemNotFoundException if no item matches.
     * @throws TypeError for a lone key that is neither callable nor null, as first() takes no other
     *
     * @example
     *
     * new Collection([1, 2, 3]).firstOrFail(); -> 1
     * new Collection([{id: 1}, {id: 2}]).firstOrFail('id', '==', 2); -> {id: 2}
     * new Collection([{id: 1}, {id: 2}]).firstOrFail(item => item.id === 1); -> {id: 1}
     * new Collection([]).firstOrFail(); -> throws ItemNotFoundException
     */
    firstOrFail(
        key?: ((value: TValue, index: TKey) => unknown) | PathKey,
        operator?: string,
        value?: unknown,
    ): TValue;
    firstOrFail(
        ...args: [
            key?: ((value: TValue, index: TKey) => unknown) | PathKey,
            operator?: string,
            value?: unknown,
        ]
    ): TValue {
        const filter =
            args.length > 1 ? this.operatorForWhereArgs(args) : args[0];

        // PHP hands the filter straight to first()'s ?callable, with no unless() to skip one equal to null.
        if (!isNull(filter) && !isUndefined(filter) && !isFunction(filter)) {
            throw notCallable("first", filter);
        }

        // Laravel seeds this with a fresh stdClass, so only an ABSENT item can
        // equal it and a stored null stays a found item (Collection.php:1515).
        const placeholder = Symbol("firstOrFail");

        // `first` answers `| null` only for its no-default form; this call always hands
        // one over, so the placeholder is the single stand-in for an absent item.
        const item = this.first<typeof placeholder>(filter, placeholder) as
            | TValue
            | typeof placeholder;

        if (item === placeholder) {
            throw new ItemNotFoundException();
        }

        return item;
    }

    /**
     * Chunk the collection into chunks of the given size.
     *
     * @param size - The size of each chunk; a fraction is dropped, as array_chunk()'s int parameter drops it
     * @param preserveKeys - Whether to preserve the original keys, defaults to true
     * @returns A new collection with the chunked items, or an empty one for a size of 0 or below
     * @throws TypeError when the size is NAN, infinite or outside PHP's int range, as array_chunk() refuses it
     * @throws Error when the size drops to 0, as array_chunk() refuses it
     *
     * @example
     *
     * new Collection([1, 2, 3]).chunk(2); -> new Collection([ new Collection({0: 1, 1: 2}), new Collection({2: 3}) ])
     * new Collection({a: 1, b: 2, c: 3, d: 4}).chunk(2, true); -> new Collection([ new Collection({a: 1, b: 2}), new Collection({c: 3, d: 4}) ])
     * new Collection([1, 2, 3]).chunk(5); -> new Collection([ new Collection({0: 1, 1: 2, 2: 3}) ])
     */
    chunk(
        size: number,
        preserveKeys: boolean = true,
    ): Collection<Collection<TValue, TKey>, number> {
        if (size <= 0) {
            return this.sameInstance(handOver([])) as unknown as Collection<
                Collection<TValue, TKey>,
                number
            >;
        }

        const length = phpIntArgument(
            size,
            "array_chunk(): Argument #2 ($length) must be of type int, float given",
        );

        // A size between 0 and 1 drops to 0, which array_chunk() refuses with a ValueError.
        if (length === 0) {
            throw new Error(
                "array_chunk(): Argument #2 ($length) must be greater than 0",
            );
        }

        const chunkedData = dataChunk(
            this.items as TValue[],
            length,
            preserveKeys,
        );

        if (preserveKeys) {
            return this.wrapChunks(chunkedData);
        }

        // Without preserve_keys, array_chunk() numbers each chunk from 0, so every chunk is a list.
        return this.wrapChunks(
            Object.values(chunkedData).map((chunk) => Object.values(chunk)),
        );
    }

    /**
     * Chunk the collection into chunks with a callback.
     *
     * The callback's third argument is the chunk built so far, as a collection, so `chunk.last()` works
     * exactly as it does in Laravel.
     *
     * @see Collection::chunkWhile — `packages/collection/stubs/Collection.php:1554`, which delegates to
     *      `LazyCollection::chunkWhile`.
     *
     * @param callback - Receives the value, its key and the chunk so far; return true to keep appending
     * @returns A collection of chunk collections
     *
     * @example
     *
     * new Collection(['A', 'A', 'B']).chunkWhile((value, key, chunk) => chunk.last() === value);
     * -> new Collection([new Collection(['A', 'A']), new Collection(['B'])])
     */
    chunkWhile(
        callback: (
            value: TValue,
            key: TKey,
            chunk: Collection<TValue, TKey>,
        ) => unknown,
    ): Collection<Collection<TValue, TKey>, number> {
        const chunked = dataChunkWhile(
            this.items as TValue[],
            (value, key, chunk) =>
                callback(
                    value,
                    key as unknown as TKey,
                    this.sameInstance(chunk) as unknown as Collection<
                        TValue,
                        TKey
                    >,
                ),
        );

        return this.wrapChunks(chunked);
    }

    /**
     * Chunk the collection into chunks by comparing adjacent values using the given key or callback.
     *
     * @see EnumeratesValues::chunkBy — `packages/collection/stubs/EnumeratesValues.php:939`.
     *      Adjacent values compare with PHP's `==`, so `1` and `"1"` share a chunk.
     *
     * @param key - A path into each item, or a callback receiving the value and its key
     * @returns A collection of chunk collections
     *
     * @example
     *
     * new Collection([1, 1, 2, 2, 1]).chunkBy((value) => value);
     * -> new Collection([new Collection([1, 1]), new Collection([2, 2]), new Collection([1])])
     * new Collection([{ p: 'a' }, { p: 'b' }]).chunkBy('p');
     * -> new Collection([new Collection([{ p: 'a' }]), new Collection([{ p: 'b' }])])
     */
    chunkBy(
        key: PathKey | ((value: TValue, key: TKey) => unknown),
    ): Collection<Collection<TValue, TKey>, number> {
        const chunked = dataChunkBy(
            this.items as TValue[],
            key as PathKey | ((value: TValue, index: number) => unknown),
        );

        return this.wrapChunks(chunked);
    }

    /**
     * Sort through each item with a callback.
     *
     * PHP's `sort` is key-preserving; integer-like keys can't be preserved and
     * reordered at once, so they're renumbered over the sorted sequence (same
     * policy as `sortBy`/`sortDesc`/`reverse`/`pad`/`splice`).
     *
     * @param callback - A comparator answering below, at or above zero for two items, read as uasort() reads it: cast
     * to an int, and a bool deprecated but still sorting; or null to sort the values themselves
     * @returns A new collection with the sorted items
     *
     * @example
     *
     * new Collection([3, 1, 2]).sort(); -> new Collection([1, 2, 3])
     * new Collection([5, 3, 1, 2, 4]).sort((a, b) => b - a); -> new Collection([5, 4, 3, 2, 1])
     * new Collection({a: 3, b: 1, c: 2}).sort((x, y) => x - y); -> new Collection({b: 1, c: 2, a: 3})
     */
    sort(callback: ((a: TValue, b: TValue) => number | boolean) | null = null) {
        if (!isFunction(callback)) {
            return this.sameInstance(
                handOver(dataSort(this.items as TValue[])),
            );
        }

        const entries = this.entriesInOrder().sort(
            phpSortComparator(([, a], [, b]) => callback(a, b)),
        );

        return this.sameInstance(this.sortedItems(entries));
    }

    /**
     * Sort items in descending order.
     *
     * @returns A new collection with the sorted items in descending order
     *
     * @example
     *
     * new Collection([1, 2, 3]).sortDesc(); -> new Collection([3, 2, 1])
     * new Collection({a: 1, b: 3, c: 2}).sortDesc(); -> new Collection({b: 3, c: 2, a: 1})
     */
    sortDesc() {
        return this.sameInstance(
            handOver(dataSortDesc(this.items as TValue[])),
        );
    }

    /**
     * Sort the collection using the given callback.
     *
     * Integer-like keys are renumbered over the sorted sequence, so `all()`
     * and `values()` always agree about order; see `sort` above.
     *
     * @param callback - The callback to determine the sort value, a path key to get values from and compare, or an array of such callbacks/keys for multi-level sorting
     * @param descending - Ignored when `callback` is an array, as PHP ignores it; `sortByDesc` sorts those descending
     * @returns A new collection with the sorted items
     *
     * @example
     *
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).sortBy('id'); -> new Collection([{id: 1}, {id: 2}, {id: 3}])
     */
    sortBy<TSortValue>(
        callback:
            | Array<
                  | ((a: TValue, b: TValue) => TSortValue)
                  | ((item: TValue, key: TKey) => TSortValue)
                  | PathKey
                  | [PathKey]
                  | [
                        PathKey,
                        (
                            | CaseValue<typeof SortDirection>
                            | boolean
                            | "asc"
                            | "desc"
                        ),
                    ]
              >
            | ((item: TValue, key: TKey) => TSortValue)
            | PathKey,
        descending: CaseValue<typeof SortDirection> | boolean = false,
    ) {
        const isDesc =
            descending === true || descending === SortDirection.Descending;
        if (isArray(callback) && !isFunction(callback)) {
            return this.sortByMany(callback);
        }

        const callbackFn = this.valueRetriever(
            callback as PathKey | ((...args: (TValue | TKey)[]) => TSortValue),
        );

        // Read in the order PHP holds the items, so a tie keeps it: the sort below is stable.
        const entries = this.entriesInOrder().map(
            ([key, value]) =>
                [key, value, callbackFn(value, key) as TSortValue] as const,
        );

        // Sort by the sort values
        entries.sort(([, , a], [, , b]) => {
            const comparison = compareValues(a, b);

            return isDesc ? -comparison : comparison;
        });

        return this.sameInstance(
            this.sortedItems(entries.map(([key, value]) => [key, value])),
        );
    }

    /**
     * Sort the collection in descending order using the given callback.
     *
     * @param callback - The callback to determine the sort value, a path key to get values from and compare, or an array of such callbacks/keys for multi-level sorting
     * @returns A new collection with the sorted items in descending order
     *
     * @example
     *
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).sortByDesc('id'); -> new Collection([{id: 3}, {id: 2}, {id: 1}])
     * new Collection([{id: 3}, {id: 1}, {id: 2}]).sortByDesc(item => item.id); -> new Collection([{id: 3}, {id: 2}, {id: 1}])
     * new Collection([{id: 2}, {id: 1}, {id: 3}]).sortByDesc(['id']); -> new Collection([{id: 3}, {id: 2}, {id: 1}])
     */
    sortByDesc<TSortValue>(
        callback:
            | Array<
                  | ((a: TValue, b: TValue) => TSortValue)
                  | ((item: TValue, key: TKey) => TSortValue)
                  | PathKey
                  | [PathKey]
                  | [
                        PathKey,
                        (
                            | CaseValue<typeof SortDirection>
                            | boolean
                            | "asc"
                            | "desc"
                        ),
                    ]
              >
            | ((item: TValue, key: TKey) => TSortValue)
            | PathKey,
    ) {
        if (isArray(callback) && !isFunction(callback)) {
            // sortBy() ignores its flag for descriptors, so they are forced descending here, as PHP rewrites each one.
            return this.sortByMany(callback, true);
        }

        return this.sortBy(callback, SortDirection.Descending);
    }

    /**
     * Sort the collection keys.
     *
     * @param descending - Whether to sort in descending order, defaults to false
     * @returns A new collection with the items sorted by keys
     *
     * @example
     *
     * new Collection({b: 2, a: 1, c: 3}).sortKeys(); -> new Collection({a: 1, b: 2, c: 3})
     * new Collection({b: 2, a: 1, c: 3}).sortKeys(true); -> new Collection({c: 3, b: 2, a: 1})
     * new Collection({5: "e", 2: "b", 9: "z"}).sortKeys(); -> new Collection({0: "b", 1: "e", 2: "z"})
     */
    sortKeys(descending: CaseValue<typeof SortDirection> | boolean = false) {
        const isDesc =
            descending === true || descending === SortDirection.Descending;
        const keys = Object.keys(this.items);

        keys.sort((a, b) => {
            // Object.keys() never repeats a key, so a and b always differ:
            // no third "equal" arm is reachable here, unlike a value comparator.
            const comparison =
                isIntegerLikeKey(a) && isIntegerLikeKey(b)
                    ? Number(a) - Number(b)
                    : a < b
                      ? -1
                      : 1;

            return isDesc ? -comparison : comparison;
        });

        const entries = keys.map(
            (key) =>
                [key, (this.items as Record<string, TValue>)[key]] as [
                    string,
                    TValue,
                ],
        );

        // A real array has no engine-imposed key order to fight, so the sorted
        // values slot straight in; only the object branch needs reindexIntegerKeys.
        if (isArray(this.items)) {
            return this.sameInstance(
                handOver(entries.map(([, value]) => value)),
            );
        }

        return this.sameInstance(handOver(sortedIntoItems(entries)));
    }

    /**
     * Sort the collection keys in descending order.
     *
     * @returns A new collection with the items sorted by keys in descending order
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).sortKeysDesc(); -> new Collection({c: 3, b: 2, a: 1})
     * new Collection({5: "e", 2: "b", 9: "z"}).sortKeysDesc(); -> new Collection({0: "z", 1: "e", 2: "b"})
     */
    sortKeysDesc() {
        return this.sortKeys(SortDirection.Descending);
    }

    /**
     * Sort the collection keys using a callback.
     *
     * @param callback - A comparator answering below, at or above zero for two keys, read as uksort() reads it: cast to
     * an int, and a bool deprecated but still sorting
     * @returns A new collection with the items sorted by keys using the callback
     *
     * @example
     *
     * new Collection({b: 2, a: 1, c: 3}).sortKeysUsing((a, b) => a.localeCompare(b)); -> new Collection({a: 1, b: 2, c: 3})
     * new Collection({b: 2, a: 1, c: 3}).sortKeysUsing((a, b) => b.localeCompare(a)); -> new Collection({c: 3, b: 2, a: 1})
     */
    sortKeysUsing(callback: (a: TKey, b: TKey) => number | boolean) {
        const keys = Object.keys(this.items);

        keys.sort(
            phpSortComparator((a, b) =>
                callback(phpArrayKey(a) as TKey, phpArrayKey(b) as TKey),
            ),
        );

        const entries = keys.map(
            (key) =>
                [key, (this.items as Record<string, TValue>)[key]] as [
                    string,
                    TValue,
                ],
        );

        if (isArray(this.items)) {
            return this.sameInstance(
                handOver(entries.map(([, value]) => value)),
            );
        }

        return this.sameInstance(handOver(sortedIntoItems(entries)));
    }

    /**
     * Splice a portion of the underlying collection array.
     *
     * @param offset - The offset to start the splice; a fraction is dropped, as array_splice()'s int parameter drops it
     * @param length - The number of items to remove, a fraction dropped; null or none removes everything from the
     * offset on
     * @param replacement - The items to insert in place of the removed items, or a scalar, which becomes one item
     * @returns A new collection with the removed items
     * @throws TypeError when the offset or the length is NAN, infinite or outside PHP's int range, as array_splice()
     * refuses it
     *
     * @example
     *
     * new Collection([1, 2, 3]).splice(1); -> new Collection([2, 3]), original collection is now [1]
     * new Collection([1, 2, 3]).splice(1, 1); -> new Collection([2]), original collection is now [1, 3]
     * new Collection([1, 2, 3]).splice(1, 1, [4, 5]); -> new Collection([2]), original collection is now [1, 4, 5, 3]
     * new Collection({a: 1, b: 2, c: 3}).splice(1); -> new Collection({b: 2, c: 3}), original collection is now {a: 1}
     */
    splice<TOperand extends Operand>(
        offset: number,
        length?: number | null,
        replacement?: TOperand | TValue,
    ) {
        // array_splice inserts the replacement's values in its own order, which a Map read as a record would lose.
        const values = isUndefined(replacement)
            ? []
            : this.operandEntries(replacement).map(
                  ([, value]) => value as TValue,
              );

        // A plain object lists its integer keys first, so a keyed backing is read in the order PHP's array holds it.
        if (!isArray(this.items)) {
            return this.spliceOrdered(
                this.entriesInOrder(),
                offset,
                length,
                values,
            );
        }

        return this.sameInstance(
            handOver(dataSplice(this.items, offset, length, values)),
        );
    }

    /**
     * Take the first or last {$limit} items.
     *
     * @param limit - The number of items to take, positive for first items, negative for last items; a fraction is
     * dropped, as array_slice()'s int parameters drop it
     * @returns A new collection with the taken items
     * @throws TypeError when the limit is NAN, infinite or outside PHP's int range, as array_slice() refuses it
     *
     * @example
     *
     * new Collection([1, 2, 3]).take(2); -> new Collection([1, 2])
     * new Collection([1, 2, 3]).take(-2); -> new Collection([2, 3])
     * new Collection({a: 1, b: 2, c: 3}).take(2); -> new Collection({a: 1, b: 2})
     * new Collection({a: 1, b: 2, c: 3}).take(-2); -> new Collection({b: 2, c: 3})
     */
    take(limit: number) {
        if (limit < 0) {
            return this.slice(limit, Math.abs(limit));
        }

        return this.slice(0, limit);
    }

    /**
     * Take items in the collection until the given condition is met.
     *
     * @param value - The value to take until, compared with PHP's `===`, or a callback judged by PHP truthiness
     * @returns A new collection of the items before the first that meets the condition
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).takeUntil(3); -> new Collection([1, 2])
     * new Collection({a: 1, b: 2, c: 3}).takeUntil((value, key) => key === 'c'); -> new Collection({a: 1, b: 2})
     */
    takeUntil(value: TValue | ((value: TValue, key: TKey) => unknown)) {
        return this.sameInstance(handOver(dataTakeUntil(this.items, value)));
    }

    /**
     * Take items in the collection while the given condition is met.
     *
     * @param value - The value to take while items equal it, compared with PHP's `===`, or a callback judged by PHP
     * truthiness
     * @returns A new collection of the items before the first that fails the condition
     *
     * @example
     *
     * new Collection([1, 1, 2, 2, 3, 3]).takeWhile(1); -> new Collection([1, 1])
     * new Collection({a: 1, b: 2, c: 3}).takeWhile((value) => value < 3); -> new Collection({a: 1, b: 2})
     */
    takeWhile(value: TValue | ((value: TValue, key: TKey) => unknown)) {
        return this.sameInstance(handOver(dataTakeWhile(this.items, value)));
    }

    /**
     * Transform each item in the collection using a callback.
     *
     * @param callback - The callback to transform each item
     * @returns The current collection with the transformed items
     *
     * @example
     *
     * new Collection([1, 2, 3]).transform(x => x * 2); -> new Collection([2, 4, 6])
     * new Collection({a: 1, b: 2, c: 3}).transform((value, key) => value + key); -> new Collection({a: '1a', b: '2b', c: '3c'})
     */
    transform<TMapValue>(callback: (value: TValue, key: TKey) => TMapValue) {
        if (this.itemsWithOrder) {
            this.setOrderedItems(
                this.itemsWithOrder.map(([key, value]) => [
                    key,
                    callback(value, key) as unknown as TValue,
                ]),
                false,
            );

            return this;
        }

        this.items = this.map(callback).all() as DataItems<TValue, TKey>;

        return this;
    }

    /**
     * Flatten a multi-dimensional associative array with dots.
     *
     * @param depth - Maximum depth to flatten. Defaults to Infinity.
     * @returns A new collection with the flattened items
     *
     * @example
     *
     * new Collection({a: {b: 1}, c: 2}).dot(); -> new Collection({'a.b': 1, c: 2})
     * new Collection([{a: 1}, {b: {c: 2}}]).dot(); -> new Collection({'0.a': 1, '1.b.c': 2})
     */
    dot(depth: number = Infinity) {
        return this.sameInstance(handOver(dataDot(this.items, "", depth)));
    }

    /**
     * Convert a flatten "dot" notation array into an expanded array.
     *
     * @returns A new collection with the expanded items
     *
     * @example
     *
     * new Collection({'a.b': 1, c: 2}).undot(); -> new Collection({a: {b: 1}, c: 2})
     * new Collection({'0.a': 1, '1.b.c': 2}).undot(); -> new Collection([{a: 1}, {b: {c: 2}}])
     */
    undot() {
        return this.sameInstance(handOver(dataUndot(this.items)));
    }

    /**
     * Return only unique items from the collection array.
     *
     * @param key - The key or callback to determine uniqueness, or null for direct value comparison
     * @param strict - Whether to use strict comparison (===) when no key is provided, defaults to false
     * @returns A new collection with only unique items
     *
     * @example
     *
     * new Collection([1, 2, 2, 3]).unique(); -> new Collection([1, 2, 3])
     * new Collection([1, 2, '2', 3]).unique(null, true); -> new Collection([1, 2, '2', 3])
     * new Collection([{id: 1}, {id: 2}, {id: 1}]).unique('id'); -> new Collection([{id: 1}, {id: 2}])
     * new Collection([{id: 1}, {id: 2}, {id: 1}]).unique(item => item.id); -> new Collection([{id: 1}, {id: 2}])
     */
    unique(
        key: ((item: TValue, key: TKey) => unknown) | PathKey = null,
        strict: boolean = false,
    ) {
        if (isNull(key) && strict === false) {
            // For non-strict mode without a key, we need to do loose comparison
            // We can't use Set because it uses SameValueZero (strict comparison)
            const seen: unknown[] = [];

            return this.sameInstance(
                dataFilter(this.items, (value) => {
                    // Check if we've seen this value using loose comparison
                    for (const seenValue of seen) {
                        if (looseEqual(value, seenValue)) {
                            return false;
                        }
                    }

                    seen.push(value);
                    return true;
                }),
            );
        }

        const callback = this.valueRetriever(
            key as PathKey | ((...args: (TValue | TKey)[]) => unknown),
        );

        if (strict) {
            // For strict mode, use strictEqual for PHP-like strict comparison
            // This does deep comparison for arrays/objects but strict type checking for primitives
            const seen: unknown[] = [];

            return this.sameInstance(
                dataFilter(this.items, (value, key) => {
                    const result = callback(value as TValue, key as TKey);

                    // Check if we've seen this result using strict comparison
                    for (const seenValue of seen) {
                        if (strictEqual(result, seenValue)) {
                            return false;
                        }
                    }

                    seen.push(result);
                    return true;
                }),
            );
        } else {
            // For non-strict mode with a key/callback, use loose comparison
            const seen: unknown[] = [];

            return this.sameInstance(
                dataFilter(this.items, (value, key) => {
                    const result = callback(value as TValue, key as TKey);

                    // Check if we've seen this result using loose comparison
                    for (const seenValue of seen) {
                        if (looseEqual(result, seenValue)) {
                            return false;
                        }
                    }

                    seen.push(result);
                    return true;
                }),
            );
        }
    }

    /**
     * Reset the keys on the underlying array.
     *
     * @returns A new collection with values and numeric keys
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).values(); -> new Collection({0: 1, 1: 2, 2: 3})
     * new Collection([1, 2, 3]).values(); -> new Collection([1, 2, 3])
     */
    values() {
        // Use the ordered entries when available to preserve numeric key insertion order
        const ordered = this.orderedEntries();

        if (ordered) {
            return this.sameInstance(
                handOver(ordered.map(([, value]) => value)),
            );
        }

        return this.sameInstance(handOver(dataValues(this.items)));
    }

    /**
     * Zip the collection together with one or more arrays.
     *
     * As `array_map` does, every shorter side, this collection's own values included, is padded with `null`.
     *
     * @param list - The items to zip with, each an array, an object or another collection
     * @returns A new collection with the zipped items
     *
     * @example
     *
     * new Collection([1, 2, 3]).zip(['a', 'b', 'c']); -> new Collection([[1, 'a'], [2, 'b'], [3, 'c']])
     * new Collection([1, 2]).zip(new Collection(['a', 'b', 'c'])); -> new Collection([[1, 'a'], [2, 'b'], [null, 'c']])
     * new Collection({a: 1, b: 2}).zip({x: 'a'}); -> new Collection([[1, 'a'], [2, null]])
     */
    zip<TOperands extends AtLeastOne<Operand>>(
        ...list: TOperands
    ): Collection<
        Collection<TValue | OperandValue<TOperands[number]>, number>,
        number
    > {
        const columns: unknown[][] = [
            this.getItemValues(this.items),
            ...list.map((items) => {
                const rawItems = this.getRawItems(items);

                return isArray(rawItems) ? rawItems : Object.values(rawItems);
            }),
        ];
        const length = Math.max(...columns.map((column) => column.length));
        const zipped = Array.from({ length }, (_, index) =>
            this.sameInstance(
                handOver(
                    columns.map((column) =>
                        index < column.length ? column[index] : null,
                    ),
                ),
            ),
        );

        return this.sameInstance(handOver(zipped)) as unknown as Collection<
            Collection<TValue | OperandValue<TOperands[number]>, number>,
            number
        >;
    }

    /**
     * Pad collection to the specified length with a value.
     *
     * For an object-backed collection, pad slots are numbered `0, 1, 2, ...`
     * regardless of direction — a genuine, unfixable JS/PHP divergence (see
     * `pad`'s JSDoc in `@tolki/obj`).
     *
     * @param size - The size to pad to, positive to pad at the end, negative to pad at the beginning; a fraction is
     * dropped, as array_pad()'s int parameter drops it
     * @param value - The value to pad with
     * @returns A new collection padded to the specified length
     * @throws TypeError when the size is NAN, infinite or outside PHP's int range, as array_pad() refuses it
     * @throws Error when the size is past PHP's maximum array size, as array_pad()'s ValueError
     *
     * @example
     *
     * new Collection([1, 2, 3]).pad(5, 0); -> new Collection([1, 2, 3, 0, 0])
     */
    pad<TPadValue>(size: number, value: TPadValue) {
        const length = resolvePadLength(size);
        const ordered = this.orderedEntries();

        if (ordered) {
            return this.sameInstance(this.padOrdered(ordered, length, value));
        }

        return this.sameInstance(handOver(dataPad(this.items, length, value)));
    }

    /**
     * Get an iterator for the items.
     *
     * @returns An iterator for the items
     *
     * @example
     *
     * const iterator = new Collection([1, 2, 3]).getIterator();
     * iterator.next(); -> {value: 1, done: false}
     * iterator.next(); -> {value: 2, done: false}
     * iterator.next(); -> {value: 3, done: false}
     * iterator.next(); -> {value: undefined, done: true}
     *
     * const iteratorObj = new Collection({a: 1, b: 2}).getIterator();
     * iteratorObj.next(); -> {value: 1, done: false}
     * iteratorObj.next(); -> {value: 2, done: false}
     * iteratorObj.next(); -> {value: undefined, done: true}
     */
    getIterator(): ArrayIterator<TValue> {
        // PHP's ArrayIterator holds a copy of the items, so an item pushed mid-loop is never visited.
        return Object.values(this.items)[Symbol.iterator]();
    }

    /**
     * Count the number of items in the collection.
     *
     * @returns The number of items in the collection
     *
     * @example
     *
     * new Collection([1, 2, 3]).count(); -> 3
     * new Collection([]).count(); -> 0
     */
    count(): number {
        return Object.keys(this.items).length;
    }

    /**
     * Convert the collection to a primitive: its count where a number is wanted, and its string form otherwise.
     *
     * @param hint - The kind of primitive JavaScript asks for: "number", "string" or "default"
     * @returns The number of items for the "number" hint, else what toString() returns
     *
     * @example
     *
     * const c = new Collection([1, 2, 3]);
     * +c; -> 3
     * Number(c); -> 3
     * c + ''; -> '[1,2,3]'
     * `${c}`; -> '[1,2,3]'
     */
    [Symbol.toPrimitive](hint: "number"): number;
    [Symbol.toPrimitive](hint: "string" | "default"): string;
    [Symbol.toPrimitive](hint: string): number | string;
    [Symbol.toPrimitive](hint: string): number | string {
        if (hint === "number") {
            return this.count();
        }

        return this.toString();
    }

    /**
     * Get the length of the collection.
     * This property allows the collection to work with JavaScript's length-based APIs
     * like Array.from() and testing matchers like toHaveLength().
     *
     * @returns The number of items in the collection
     *
     * @example
     *
     * const c = new Collection([1, 2, 3]);
     * c.length; -> 3
     * expect(c).toHaveLength(3); // Works in tests
     */
    get length(): number {
        return this.count();
    }

    /**
     * Count the number of items in the collection by a field or using a callback.
     *
     * @param countByValue - The key or callback to determine the count grouping, or null to count all items as one group
     * @returns A new collection with the counts grouped by the specified key or callback
     *
     * @example
     *
     * new Collection([1, 2, 2, 3]).countBy(); -> new Collection({ '1': 1, '2': 2, '3': 1 })
     * new Collection([{id: 1}, {id: 2}, {id: 1}]).countBy('id'); -> new Collection({ '1': 2, '2': 1 })
     * new Collection([{id: 1}, {id: 2}, {id: 1}]).countBy(item => item.id); -> new Collection({ '1': 2, '2': 1 })
     */
    countBy<TCountByResult>(
        countByValue:
            | ((value: TValue, key: TKey) => TCountByResult)
            | PathKey = null,
    ) {
        const results = new Map<string | number, number>();

        const callback = this.valueRetriever(
            countByValue as
                | PathKey
                | ((...args: (TValue | TKey)[]) => TCountByResult),
        );

        for (const [key, value] of this.entriesInOrder()) {
            const result = callback(value, key);
            const resultKey = phpComputedKey(result, {
                enumCases: true,
                invalid: issetOffset,
            });

            results.set(resultKey, (results.get(resultKey) ?? 0) + 1);
        }

        return this.sameInstance(results);
    }

    /**
     * Add an item to the collection.
     *
     * The item lands where PHP's `$array[] =` puts it: past the highest integer key.
     *
     * @param item - The item to add to the collection
     * @returns The current collection with the item added
     *
     * @example
     *
     * new Collection([1, 2]).add(3); -> collection is now [1, 2, 3]
     * new Collection({a: 1, b: 2}).add(3); -> collection is now {a: 1, b: 2, '0': 3}
     * new Collection({5: 'a'}).add('z'); -> collection is now {5: 'a', 6: 'z'}
     */
    add<T>(item: T) {
        this.putKey(null, item as unknown as TValue);

        return this;
    }

    /**
     * Get a base Support collection instance from this collection.
     *
     * @returns A new base Collection holding a copy of the items
     *
     * @example
     *
     * class Users extends Collection {}
     * Users.make([1, 2]).toBase(); -> new Collection([1, 2])
     */
    toBase(): Collection<TValue, TKey, TShape> {
        return new Collection<TValue, TKey, TShape>(this);
    }

    /**
     * Determine if an item exists at an offset.
     *
     * @param offset - The offset to check for existence
     * @returns True if an item exists at the offset, false otherwise
     * @throws TypeError for an array, object or function key, as isset() refuses one
     *
     * @example
     *
     * new Collection([1, 2, 3]).offsetExists(1); -> true
     * new Collection([1, 2, 3]).offsetExists(3); -> false
     * new Collection({a: 1, b: 2}).offsetExists('a'); -> true
     * new Collection({a: 1, b: 2}).offsetExists('c'); -> false
     */
    offsetExists(key: PropertyKey): boolean {
        if (isIllegalOffset(key)) {
            throw issetOffset(phpDebugType(key));
        }

        const value = this.offsetGet(key);

        return !isNull(value) && !isUndefined(value);
    }

    /**
     * Get an item at a given offset.
     *
     * @param offset - The offset to get the item from
     * @returns The item at the given offset, or undefined if not found
     * @throws TypeError for an array, object or function key, which no PHP array can hold
     *
     * @example
     *
     * new Collection([1, 2, 3]).offsetGet(1); -> 2
     * new Collection([1, 2, 3]).offsetGet(3); -> undefined
     * new Collection({a: 1, b: 2}).offsetGet('a'); -> 1
     * new Collection({a: 1, b: 2}).offsetGet('c'); -> undefined
     */
    offsetGet(key: PropertyKey) {
        if (isIllegalOffset(key)) {
            throw accessOffset(phpDebugType(key));
        }

        const ownKey = this.ownKey(key);

        if (isUndefined(ownKey)) {
            return undefined;
        }

        return (this.items as Record<PropertyKey, TValue>)[ownKey];
    }

    /**
     * Set the item at a given offset.
     *
     * @param offset - The offset to set the item at, or null to append
     * @param value - The item to set at the given offset
     * @returns Void
     * @throws TypeError for an array, object or function key, which no PHP array can hold
     *
     * @example
     *
     * const collection = new Collection([1, 2]);
     * collection.offsetSet(null, 3); -> collection is now [1, 2, 3]
     * collection.offsetSet(1, 4); -> collection is now [1, 4, 3]
     *
     * const objCollection = new Collection({a: 1, b: 2});
     * objCollection.offsetSet(null, 3); -> collection is now {a: 1, b: 2, '0': 3}
     * objCollection.offsetSet('c', 4); -> collection is now {a: 1, b: 2, '0': 3, c: 4}
     */
    offsetSet(key: PropertyKey | null, value: TValue | unknown) {
        if (isIllegalOffset(key)) {
            throw accessOffset(phpDebugType(key));
        }

        // A null or undefined offset appends, as PHP's `$items[] = $value` does.
        this.putKey(key ?? null, value as TValue);
    }

    /**
     * Unset the item at a given offset.
     *
     * @param offset - The offset to unset the item at
     * @returns Void
     * @throws TypeError for an array, object or function key, as unset() refuses one
     *
     * @example
     *
     * const collection = new Collection([1, 2, 3]);
     * collection.offsetUnset(1); -> collection is now [1, 3]
     *
     * const objCollection = new Collection({a: 1, b: 2, c: 3});
     * objCollection.offsetUnset('b'); -> collection is now {a: 1, c: 3}
     */
    offsetUnset(key: PropertyKey) {
        if (isIllegalOffset(key)) {
            throw unsetOffset(phpDebugType(key));
        }

        const ownKey = this.ownKey(key);

        if (isUndefined(ownKey)) {
            return;
        }

        if (isArray(this.items)) {
            this.items.splice(ownKey as number, 1);

            return;
        }

        delete (this.items as Record<PropertyKey, TValue>)[ownKey];

        if (this.itemsWithOrder) {
            this.reorderAfterMutation(this.itemsWithOrder);
        }
    }

    /** Enumerates Values Methods */

    /**
     * Create a new collection instance if the value isn't one already.
     *
     * @param items - The items to create the collection from
     * @param args - Further arguments for the constructor, which a subclass may take
     * @returns A new collection instance
     *
     * @example
     *
     * Collection.make([1, 2, 3]); -> new Collection([1, 2, 3])
     * Collection.make({a: 1, b: 2}); -> new Collection({a: 1, b: 2})
     * Collection.make(new Collection([1, 2, 3])); -> new Collection([1, 2, 3])
     * Collection.make(null); -> new Collection([])
     */
    static make<
        TMakeValue,
        TMakeKey extends PropertyKey,
        TMakeShape extends CollectionShape,
    >(
        items: Collection<TMakeValue, TMakeKey, TMakeShape>,
        ...args: unknown[]
    ): Collection<TMakeValue, TMakeKey, TMakeShape>;
    static make<TMakeValue>(
        items: readonly TMakeValue[],
        ...args: unknown[]
    ): Collection<TMakeValue, number, "list">;
    static make<TMakeValue, TMapKey>(
        items: ReadonlyMap<TMapKey, TMakeValue>,
        ...args: unknown[]
    ): Collection<TMakeValue, MapArrayKey<TMapKey>, "keyed">;
    static make<TMakeValue>(
        items: { toArray(): readonly TMakeValue[] },
        ...args: unknown[]
    ): Collection<TMakeValue, number, "list">;
    static make<TItems extends object>(
        items: { toArray(): TItems },
        ...args: unknown[]
    ): ItemsCollection<TItems>;
    static make<TMakeValue>(
        items: Iterable<TMakeValue> & object,
        ...args: unknown[]
    ): Collection<TMakeValue, number, "list">;
    static make(
        items: Jsonable,
        ...args: unknown[]
    ): Collection<unknown, string | number, "list" | "keyed">;
    static make<TItems extends object>(
        items: { jsonSerialize(): TItems },
        ...args: unknown[]
    ): ItemsCollection<TItems>;
    static make(
        items: JsonSerializable,
        ...args: unknown[]
    ): Collection<unknown, string | number, "list" | "keyed">;
    static make(
        items?: null | undefined,
        ...args: unknown[]
    ): Collection<never, number, "list">;
    static make<TMakeValue>(
        items: readonly TMakeValue[] | null | undefined,
        ...args: unknown[]
    ): Collection<TMakeValue, number, "list">;
    static make(
        items: string,
        ...args: unknown[]
    ): Collection<string, number, "list">;
    static make(
        items: number,
        ...args: unknown[]
    ): Collection<number, number, "list">;
    static make(
        items: boolean,
        ...args: unknown[]
    ): Collection<boolean, number, "list">;
    static make(
        items: symbol,
        ...args: unknown[]
    ): Collection<symbol, number, "list">;
    static make<TItems extends object>(
        items: TItems,
        ...args: unknown[]
    ): ItemsCollection<TItems>;
    static make(items?: unknown, ...args: unknown[]): unknown {
        return new (this as CollectionClass<unknown, PropertyKey>)(
            items,
            ...args,
        );
    }

    /**
     * Wrap the given value in a collection if applicable.
     *
     * @param value - The value to wrap in a collection
     * @param args - Further arguments for the constructor, which a subclass may take
     * @returns The value as a collection, or the original collection if already one
     *
     * @example
     *
     * Collection.wrap([1, 2, 3]); -> new Collection([1, 2, 3])
     * Collection.wrap({a: 1, b: 2}); -> new Collection({a: 1, b: 2})
     * Collection.wrap(new Map([['a', 1]])); -> new Collection({a: 1})
     * Collection.wrap(new Collection([1, 2, 3])); -> new Collection([1, 2, 3])
     * Collection.wrap(123); -> new Collection([123])
     * Collection.wrap(null); -> new Collection([])
     *
     * @remarks An instance of a class of your own is typed by its fields, like collect() types one, though wrap() keeps
     * it whole in a one-item list: TypeScript cannot tell it from a plain object, whose entries wrap() takes.
     */
    static wrap<
        TWrapValue,
        TWrapKey extends PropertyKey,
        TWrapShape extends CollectionShape,
    >(
        value: Collection<TWrapValue, TWrapKey, TWrapShape>,
        ...args: unknown[]
    ): Collection<TWrapValue, TWrapKey, TWrapShape>;
    static wrap<TWrapValue>(
        value: readonly TWrapValue[],
        ...args: unknown[]
    ): Collection<TWrapValue, number, "list">;
    static wrap<TWrapValue, TMapKey>(
        value: ReadonlyMap<TMapKey, TWrapValue>,
        ...args: unknown[]
    ): Collection<TWrapValue, MapArrayKey<TMapKey>, "keyed">;
    static wrap(
        value: null | undefined,
        ...args: unknown[]
    ): Collection<never, number, "list">;
    static wrap<TWrapInput>(
        value: TWrapInput,
        ...args: unknown[]
    ): WrapCollection<TWrapInput>;
    static wrap(value: unknown, ...args: unknown[]): unknown {
        const Static = this as CollectionClass<unknown, PropertyKey>;

        // Arr::wrap leaves an array as it is and makes null empty; a plain object and a Map stand in for arrays.
        if (
            value instanceof Collection ||
            isPhpAccessible(value) ||
            isNull(value) ||
            isUndefined(value)
        ) {
            return new Static(value, ...args);
        }

        return new Static(handOver([value]), ...args);
    }

    /**
     * Get the underlying items from the given collection if applicable.
     *
     * @param value - The collection or arrayable to unwrap
     * @returns The underlying items from the collection, or the original arrayable if not a collection
     *
     * @example
     *
     * Collection.unwrap(new Collection([1, 2, 3])); -> [1, 2, 3]
     * Collection.unwrap(new Collection({a: 1, b: 2})); -> {a: 1, b: 2}
     * Collection.unwrap([1, 2, 3]); -> [1, 2, 3]
     * Collection.unwrap({a: 1, b: 2}); -> {a: 1, b: 2}
     */
    static unwrap<
        TUnwrapValue,
        TUnwrapKey extends PropertyKey,
        TUnwrapShape extends CollectionShape,
    >(
        value: Collection<TUnwrapValue, TUnwrapKey, TUnwrapShape>,
    ): CollectionItems<TUnwrapValue, TUnwrapKey, TUnwrapShape>;
    static unwrap<TUnwrapValue>(value: TUnwrapValue): Unwrapped<TUnwrapValue>;
    static unwrap(value: unknown): unknown {
        if (value instanceof Collection) {
            return value.all();
        }

        return value;
    }

    /**
     * Create a new instance with no items.
     *
     * @param args - Arguments for the constructor after the items, which a subclass may take
     * @returns A new empty collection instance
     *
     * @example
     *
     * Collection.empty(); -> new Collection([])
     * Collection.empty<string>(); -> new Collection([]), typed to hold strings
     */
    static empty<TEmptyValue = never>(
        ...args: unknown[]
    ): Collection<TEmptyValue, number, "list"> {
        return new (this as CollectionClass<TEmptyValue, number, "list">)(
            handOver([]),
            ...args,
        );
    }

    /**
     * Create a new collection by invoking the callback a given amount of times.
     *
     * @param count - The number of times to invoke the callback
     * @param callback - The callback to invoke, receives the current count (1-based) as an argument, or null to just create a range of numbers
     * @param args - Arguments for the constructor after the items, which a subclass may take
     * @returns A new collection with the results of the callback or a range of numbers
     *
     * @example
     *
     * Collection.times(3, count => count * 2); -> new Collection([2, 4, 6])
     * Collection.times(3); -> new Collection([1, 2, 3])
     * Collection.times(0); -> new Collection()
     */
    static times(
        count: number,
        callback?: null | undefined,
        ...args: unknown[]
    ): Collection<number, number, "list">;
    static times<TTimesValue>(
        count: number,
        callback: (count: number) => TTimesValue,
        ...args: unknown[]
    ): Collection<TTimesValue, number, "list">;
    static times<TTimesValue>(
        count: number,
        callback: ((count: number) => TTimesValue) | null | undefined,
        ...args: unknown[]
    ): Collection<number | TTimesValue, number, "list">;
    static times<TTimesValue>(
        count: number,
        callback: ((count: number) => TTimesValue) | null = null,
        ...args: unknown[]
    ): unknown {
        if (count < 1) {
            return new (this as CollectionClass<unknown, PropertyKey>)(
                handOver([]),
                ...args,
            );
        }

        if (isNull(callback)) {
            return this.range(1, count, 1, ...args);
        }

        return this.range(1, count, 1, ...args).map(callback);
    }

    /**
     * Create a new collection by decoding a JSON string.
     *
     * @param json - The JSON string to decode
     * @param _depth - PHP's json_decode nesting limit, which JSON.parse has no counterpart for
     * @param _flags - PHP's json_decode flags, which JSON.parse has no counterpart for
     * @param args - Arguments for the constructor after the items, which a subclass may take
     * @returns A new collection with the decoded items, or an empty one when the JSON is invalid
     *
     * @example
     *
     * Collection.fromJson('{"a":1,"b":2}'); -> new Collection({a: 1, b: 2})
     * Collection.fromJson('[1,2,3]'); -> new Collection([1, 2, 3])
     * Collection.fromJson('{bad'); -> new Collection([])
     * Collection.fromJson<number>('[1,2]'); -> new Collection([1, 2]), typed to hold numbers
     */
    static fromJson<
        TJsonValue = unknown,
        TJsonKey extends PropertyKey = PropertyKey,
    >(
        json: string,
        _depth: number = 512,
        _flags: number = 0,
        ...args: unknown[]
    ): Collection<TJsonValue, TJsonKey, CollectionShape> {
        return new (this as CollectionClass<
            TJsonValue,
            TJsonKey,
            CollectionShape
        >)(decodeJson(json), ...args);
    }

    /**
     * Get the average value of a given key.
     *
     * @param callback - The key or callback to determine the value to average, or null to average the items directly
     * @returns The average of the values that are not null, or null when none is
     * @throws TypeError for a value PHP's `+` cannot add, such as a non-numeric string or an array
     *
     * @example
     *
     * new Collection([1, 2, 3]).avg(); -> 2
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).avg('id'); -> 2
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).avg(item => item.id); -> 2
     * new Collection(['1', '2', 3]).avg(); -> 2
     * new Collection([]).avg(); -> null
     */
    avg<TReturn>(
        callback: ((value: TValue, key: TKey) => TReturn) | PathKey = null,
    ) {
        const callbackValue = this.valueRetriever(
            callback as PathKey | ((...args: (TValue | TKey)[]) => TReturn),
        );

        const [total, count] = this.reduce<[number, number]>(
            ([sum, counted], item, key) => {
                const resolved = callbackValue(item, key);

                if (isNull(resolved) || isUndefined(resolved)) {
                    return [sum, counted];
                }

                return [phpAdd(sum, resolved), counted + 1];
            },
            [0, 0],
        );

        return count === 0 ? null : total / count;
    }

    /**
     * Alias for the "avg" method.
     *
     * @param callback - The key or callback to determine the value to average, or null to average the items directly
     * @returns The average of the values that are not null, or null when none is
     * @throws TypeError for a value PHP's `+` cannot add, such as a non-numeric string or an array
     *
     * @see {@link Collection.avg}
     */
    average<TReturn>(
        callback: ((value: TValue, key: TKey) => TReturn) | PathKey = null,
    ) {
        return this.avg(callback);
    }

    /**
     * Alias for the "contains" method.
     *
     * @param key - The key or callback to determine the item to check for, or null to check the items directly
     * @param operator - The operator to use for comparison, if key is not a callback or null
     * @param value - The value to compare against, if key is not a callback or null
     * @returns True if the item exists in the collection, false otherwise
     *
     * @see {@link Collection.contains}
     */
    some(
        key: ((value: TValue, key: TKey) => unknown) | TValue | PathKey,
        operator?: unknown,
        value?: unknown,
    ): boolean;
    some(
        ...args: [
            key: ((value: TValue, key: TKey) => unknown) | TValue | PathKey,
            operator?: unknown,
            value?: unknown,
        ]
    ): boolean {
        return this.contains(...args);
    }

    /**
     * Dump the items.
     *
     * @param args - Further values to dump after the items
     * @returns The current collection instance
     *
     * @example
     *
     * new Collection([1, 2, 3]).dump('one', 'two'); -> logs [1, 2, 3] 'one' 'two'
     */
    dump(...args: unknown[]) {
        console.log(this.all(), ...args);

        return this;
    }

    /**
     * Execute a callback over each item.
     *
     * @param callback - The callback to execute, receives the value and key as arguments, return false for early exit
     * @returns The current collection instance
     *
     * @example
     *
     * new Collection([1, 2, 3]).each((value, key) => console.log(key, value)); -> logs "0 1", "1 2", "2 3"
     * new Collection({a: 1, b: 2}).each((value, key) => console.log(key, value)); -> logs "a 1", "b 2"
     *
     * // Stop iterating when the callback returns false
     * new Collection([1, 2, 3]).each((value, key) => { console.log(key, value); if (value === 2) return false; });
     */
    each(callback: (value: TValue, key: TKey) => unknown) {
        for (const [key, value] of Object.entries(this.items)) {
            if (callback(value as TValue, phpArrayKey(key) as TKey) === false) {
                break;
            }
        }

        return this;
    }

    /**
     * Execute a callback over each nested chunk of items.
     *
     * @param callback - The callback to execute, receiving a chunk's values and then its key; false stops the loop
     * @returns The current collection instance
     *
     * @example
     *
     * new Collection([[1, 'a'], [2, 'b']]).eachSpread((n, s, k) => console.log(n, s, k)); -> logs "1 a 0", "2 b 1"
     */
    eachSpread(callback: (...values: TValue[]) => unknown) {
        return this.each((chunk, key) => {
            let values: unknown[];

            if (isArray(chunk)) {
                values = chunk as unknown[];
            } else if (chunk instanceof Collection) {
                const all = (
                    chunk as unknown as Collection<unknown, PropertyKey>
                ).all();
                values = isArray(all) ? (all as unknown[]) : [all as unknown];
            } else {
                values = arrWrap(chunk as unknown);
            }

            const loopKey = phpArrayKey(key);
            return callback(
                ...(values as TValue[]),
                loopKey as unknown as TValue,
            );
        });
    }

    /**
     * Determine if all items pass the given truth test.
     *
     * @param key - The key or callback to determine the item to check for, or null to check the items directly
     * @param operator - The operator to compare with, or the value itself when no third argument is given
     * @param value - The value to compare against, when an operator is given
     * @returns True if all items pass the truth test, false otherwise
     *
     * @example
     *
     * new Collection([1, 2, 3]).every(x => x > 0); -> true
     * new Collection([1, 2, 3]).every(x => x > 1); -> false
     * new Collection([{id: 1}, {id: 1}]).every('id', 1); -> true
     * new Collection([{id: 1}, {id: 2}]).every('id', '>=', 1); -> true
     * new Collection([{id: 1}, {id: 2}]).every('id', '>', 1); -> false
     * new Collection([1, 2, 3]).every(2); -> false
     */
    every(
        key: ((value: TValue, key: TKey) => unknown) | TValue | PathKey,
        operator?: unknown,
        value?: unknown,
    ): boolean;
    every(
        ...args: [
            key: ((value: TValue, key: TKey) => unknown) | TValue | PathKey,
            operator?: unknown,
            value?: unknown,
        ]
    ): boolean {
        const [key] = args;

        if (args.length < 2) {
            const callback = this.valueRetriever(
                key as PathKey | ((...args: (TValue | TKey)[]) => unknown),
            );
            for (const [itemKey, item] of Object.entries(this.items)) {
                if (
                    isPhpFalsy(
                        callback(item as TValue, phpArrayKey(itemKey) as TKey),
                    )
                ) {
                    return false;
                }
            }

            return true;
        }

        return this.every(this.operatorForWhereArgs(args));
    }

    /**
     * Get the first item by the given key value pair.
     *
     * @param key - The key or callback to determine the item to find, or null to check the items directly
     * @param operator - The operator to use for comparison, if key is not a callback or null
     * @param value - The value to compare against, if key is not a callback or null
     * @returns The first item that matches the given key value pair, or null if none does
     *
     * @example
     *
     * new Collection([1, 2, 3]).firstWhere(x => x > 1); -> 2
     * new Collection([{active: false}, {active: true}]).firstWhere('active'); -> {active: true}
     * new Collection([{id: 1}, {id: 2}]).firstWhere('id', '>=', 2); -> {id: 2}
     * new Collection([{id: 1}, {id: 2}]).firstWhere('id', '>', 2); -> null
     */
    firstWhere(
        key: ((value: TValue, key: TKey) => unknown) | PathKey,
        operator?: unknown,
        value?: unknown,
    ): TValue | null;
    firstWhere(
        ...args: [
            key: ((value: TValue, key: TKey) => unknown) | PathKey,
            operator?: unknown,
            value?: unknown,
        ]
    ): TValue | null {
        return this.first(this.operatorForWhereArgs(args)) as TValue | null;
    }

    /**
     * Get a single key's value from the first matching item in the collection.
     *
     * @param key - The key to retrieve the value from
     * @param defaultValue - The default value to return if the key is not found, or a closure that returns the default value
     * @returns The value of the key from the first matching item, or the default value if not found
     *
     * @example
     *
     * new Collection([{id: 1}, {id: 2}]).value('id'); -> 1
     * new Collection([{name: 'Alice'}, {name: 'Bob'}]).value('age', 30); -> 30
     * new Collection([{name: 'Alice'}, {name: 'Bob'}]).value('age', () => 25); -> 25
     * new Collection([]).value('id', 10); -> 10
     * new Collection([]).value('id'); -> null
     */
    value<TValueDefault>(
        key: PathKey,
        defaultValue: TValueDefault | (() => TValueDefault) | null = null,
    ) {
        const item = this.first((target) => itemHas(target, key));

        // An item that holds the key is never null, as data_has finds no key in null.
        if (isNull(item)) {
            return resolveDefault(defaultValue);
        }

        return itemValue(item, key);
    }

    /**
     * Ensure that every item in the collection is of the expected type.
     *
     * A class named as a string matches only that class; pass the class itself to accept its subclasses too.
     * Any other string may name a class, so a misspelt type name compiles, narrowing the values to objects.
     *
     * @param type - A class, a type name as PHP's get_debug_type() gives it ("int", "float", "string", "bool", "array",
     * "null" or a class's name) or as JavaScript's typeof does ("number", "boolean", "object", "undefined", …),
     * or a list or record of them
     * @returns The current collection instance, typed to hold the expected type, when every item is of it
     * @throws UnexpectedValueException naming the first item that is none of the types, and its position
     *
     * @example
     *
     * new Collection([1, 2, 3]).ensure('int'); -> collection is valid
     * new Collection([1, '2', 3]).ensure('int'); -> throws UnexpectedValueException
     * new Collection([new Date(), new Date()]).ensure(Date); -> collection is valid
     * new Collection([new Date(), {}]).ensure(Date); -> throws UnexpectedValueException
     * new Collection([1, '2', true]).ensure(['int', 'string', 'bool']); -> collection is valid
     * new Collection([1, '2', null]).ensure(['int', 'string', 'bool']); -> throws UnexpectedValueException
     * new Collection([1, '2', true]).ensure({a: 'int', b: 'string', c: 'bool'}); -> collection is valid
     * new Collection([null, undefined]).ensure('null'); -> collection is valid
     * new Collection([1.5, 2]).ensure('number'); -> collection is valid
     * new Collection([{}, new Date()]).ensure('object'); -> collection is valid
     */
    ensure<const TSpec extends EnsureSpec>(
        type: TSpec | readonly TSpec[] | Readonly<Record<string, TSpec>>,
    ): Collection<EnsuredType<TSpec>, TKey, TShape>;
    ensure(
        type:
            | EnsureSpec
            | readonly EnsureSpec[]
            | Readonly<Record<string, EnsureSpec>>,
    ): unknown {
        const allowedTypes: unknown[] = isArray(type)
            ? type
            : isObject(type)
              ? Object.values(type)
              : [type];

        return this.each((item, key) => {
            if (
                allowedTypes.some((allowedType) => isOfType(item, allowedType))
            ) {
                return true;
            }

            const names = allowedTypes.map((allowedType) =>
                isFunction(allowedType)
                    ? allowedType.name
                    : String(allowedType),
            );

            throw new UnexpectedValueException(
                `Collection should only include [${names.join(", ")}] items, but '${phpDebugType(item)}' found at position ${phpIntegerFormat(key)}.`,
            );
        });
    }

    /**
     * Determine if the collection is not empty.
     *
     * @returns True if the collection is not empty, false otherwise
     */
    isNotEmpty() {
        return !this.isEmpty();
    }

    /**
     * Run a map over each nested chunk of items.
     *
     * @param callback - The callback to execute, receives the value(s) as arguments, with the key as the last argument
     * @returns A new collection with the results of the callback
     */
    mapSpread<TMapSpreadValue>(
        callback: (...values: TValue[]) => TMapSpreadValue,
    ) {
        return this.map((chunk, key) => {
            const values =
                chunk instanceof Collection
                    ? (chunk.all() as TValue[])
                    : (arrWrap(chunk) as TValue[]);

            return callback(...values, key as unknown as TValue);
        });
    }

    /**
     * Run a grouping map over the items.
     *
     * The callback should return an associative array with a single key/value pair.
     *
     * @param callback - The callback to execute, receives the value and key as arguments, should return an object with
     * a single key/value pair
     * @returns A new collection with the grouped items as collections
     */
    mapToGroups<
        TMapToGroupsValue,
        TMapToGroupsKey extends PropertyKey = PropertyKey,
    >(
        callback: (
            value: TValue,
            key: TKey,
        ) => Record<TMapToGroupsKey, TMapToGroupsValue>,
    ) {
        const dictionary = this.mapToDictionary(callback);

        // map() reads the plain object, which re-sorts integer keys, so the groups follow the dictionary's order.
        const entries = (dictionary.orderedEntries() ??
            Object.entries(dictionary.all())) as Array<[PropertyKey, unknown]>;

        return this.sameInstance(
            new Map(
                entries.map(([key, group]) => [
                    key,
                    this.sameInstance(
                        group as DataItems<TMapToGroupsValue, TMapToGroupsKey>,
                    ),
                ]),
            ),
        );
    }

    /**
     * Map a collection and flatten the result by a single level.
     *
     * @param callback - The callback to execute, receives the value and key as arguments, should return a collection or arrayable
     * @returns A new collection with the flattened results of the callback
     */
    flatMap<TFlatMapValue, TFlatMapKey extends PropertyKey = PropertyKey>(
        callback: (
            value: TValue,
            key: TKey,
        ) =>
            | Collection<TFlatMapValue, TFlatMapKey, CollectionShape>
            | DataItems<TFlatMapValue, TFlatMapKey>,
    ) {
        return this.map(callback).collapse();
    }

    /**
     * Map the values into a new class.
     *
     * @param className - The class to map the values into, whose constructor receives each value and its key, or a
     * backed `@tolki/enum` definition, whose from() resolves each value to its case
     * @returns A new collection with the values mapped into the new class
     *
     * @example
     *
     * new Collection(['first']).mapInto(Wrapper); -> new Collection([new Wrapper('first', 0)])
     *
     * const Status = defineEnum({A: 1, B: 2, backed: true, _cases: ['A', 'B']});
     * new Collection([1, 2]).mapInto(Status); -> new Collection([Status.from(1), Status.from(2)])
     */
    mapInto<TMapIntoValue>(
        className:
            | (new (...args: unknown[]) => TMapIntoValue)
            | EnumDefinition<TValue>,
    ): Collection<TMapIntoValue, TKey> {
        if (isEnumDefinition(className)) {
            return this.map((value) =>
                className.from(value),
            ) as unknown as Collection<TMapIntoValue, TKey>;
        }

        return this.map(
            (value, key) => new className(value, key),
        ) as unknown as Collection<TMapIntoValue, TKey>;
    }

    /**
     * Get the min value of a given key.
     *
     * @param callback - The key or callback to determine the value to min, or null to min the items directly
     * @returns The smallest value that is not null, compared as PHP's `<` compares them, or null when none is
     */
    min(
        callback:
            | ((value: TValue, key: TKey) => number | null | undefined)
            | PathKey = null,
    ) {
        const callbackValue = this.valueRetriever(
            callback as PathKey | ((...args: (TValue | TKey)[]) => number),
        );

        // undefined stands for PHP's null, so it is skipped with it.
        return this.map((value: TValue) =>
            callbackValue(value as TValue | TKey),
        )
            .reject((value: TValue) => isNull(value) || isUndefined(value))
            .reduce(
                ((carry: number | null, value: unknown) => {
                    if (isNull(carry) || compareValues(value, carry) < 0) {
                        return value as number;
                    }

                    return carry;
                }) as (
                    carry: number | TValue | null,
                    value: TValue,
                    key: TKey,
                ) => number | null,
                null,
            );
    }

    /**
     * Get the max value of a given key.
     *
     * @param callback - The key or callback to determine the value to max, or null to max the items directly
     * @returns The largest value of an item that is not null, compared as PHP's `>` compares them, or null when none is
     */
    max(
        callback:
            | ((value: TValue, key: TKey) => number | null | undefined)
            | PathKey = null,
    ) {
        const callbackValue = this.valueRetriever(
            callback as PathKey | ((...args: (TValue | TKey)[]) => number),
        );

        // undefined stands for PHP's null, so it is skipped with it.
        return this.reject(
            (value: TValue) => isNull(value) || isUndefined(value),
        ).reduce(
            ((carry: number | null, item: TValue) => {
                // A callback's undefined is PHP's null too: the next value replaces it, and it answers when none does.
                const value = (callbackValue(item as TValue | TKey) ??
                    null) as number;

                // PHP compiles $value > $result as $result < $value, which differs where <=> answers 1 both ways.
                if (isNull(carry) || compareValues(carry, value) < 0) {
                    return value;
                }

                return carry;
            }) as (
                carry: number | TValue | null,
                value: TValue,
                key: TKey,
            ) => number | null,
            null,
        );
    }

    /**
     * "Paginate" the collection by slicing it into a smaller collection.
     *
     * @param page - The page number to retrieve, starting from 1
     * @param perPage - The number of items per page
     * @returns A new collection with the items for the specified page
     */
    forPage(page: number, perPage: number) {
        const offset = Math.max(0, (page - 1) * perPage);

        return this.slice(offset, perPage);
    }

    /**
     * Partition the collection into two arrays using the given callback or key.
     *
     * @param key - The key or callback to determine the partitioning, or null to partition the items directly
     * @param operator - The operator to use for comparison, if key is not a callback or null
     * @param value - The value to compare against, if key is not a callback or null
     * @returns A TupleCollection with two collections: the first with items that pass the truth test, the second with items that fail
     */
    partition(
        key: ((value: TValue, key: TKey) => unknown) | TValue | PathKey,
        operator?: unknown,
        value?: unknown,
    ): TupleCollection<Collection<TValue, TKey>, Collection<TValue, TKey>>;
    partition(
        ...args: [
            key: ((value: TValue, key: TKey) => unknown) | TValue | PathKey,
            operator?: unknown,
            value?: unknown,
        ]
    ): TupleCollection<Collection<TValue, TKey>, Collection<TValue, TKey>> {
        const callback: (value: TValue, key: TKey) => unknown =
            args.length === 1
                ? this.valueRetriever(
                      args[0] as
                          | PathKey
                          | ((...args: (TValue | TKey)[]) => unknown),
                  )
                : this.operatorForWhereArgs(args);

        const [passed, failed] = dataPartition(this.items, (item, key) =>
            callback(item as TValue, key as TKey),
        );

        const halves = this.sameInstance(
            handOver([
                this.sameInstance(
                    handOver(passed as DataItems<TValue, TKey>),
                ) as unknown as Collection<TValue, TKey>,
                this.sameInstance(
                    handOver(failed as DataItems<TValue, TKey>),
                ) as unknown as Collection<TValue, TKey>,
            ]),
        );

        // PHP reads $partition[0] through ArrayAccess; a non-enumerable getter reads [0] and [1] the same way.
        for (const index of [0, 1]) {
            Object.defineProperty(halves, index, {
                get: () => halves.offsetGet(index),
            });
        }

        return halves as unknown as Collection<
            Collection<TValue, TKey>,
            number
        > as TupleCollection<
            Collection<TValue, TKey>,
            Collection<TValue, TKey>
        >;
    }

    /**
     * Calculate the percentage of items that pass a given truth test.
     *
     * @param callback - The callback to execute, receives the value and key as arguments
     * @param precision - Decimal places to round to (default 2); a negative precision rounds to tens, hundreds and on,
     * and a fraction is dropped, as PHP's int parameter does
     * @returns The percentage of items that pass the truth test, rounded as PHP's round() rounds it, or null if the
     * collection is empty
     * @throws TypeError when the precision is NAN, infinite or outside PHP's int range, as its int parameter refuses
     */
    percentage(
        callback: (value: TValue, key: TKey) => unknown,
        precision: number = 2,
    ) {
        // PHP reads the precision as an int on the way in, so one it refuses throws before the items are looked at.
        const places = phpIntArgument(
            precision,
            "Collection::percentage(): Argument #2 ($precision) must be of type int, float given",
        );

        if (this.isEmpty()) {
            return null;
        }

        return phpRound(
            (this.filter(callback).count() / this.count()) * 100,
            places,
        );
    }

    /**
     * Get the sum of the given values.
     *
     * @param callback - The key or callback to determine the value to sum, or null to sum the items directly
     * @returns The sum of the values, each added as PHP's `+` adds it
     * @throws TypeError for a value PHP's `+` cannot add, such as a non-numeric string or an array
     */
    sum<TReturnType = number>(
        callback: ((value: TValue, key: TKey) => TReturnType) | PathKey = null,
    ): number {
        const callbackValue = isNull(callback)
            ? this.identity()
            : this.valueRetriever(
                  callback as
                      | PathKey
                      | ((...args: (TValue | TKey)[]) => TReturnType),
              );

        return this.reduce(
            (total, value, key) => phpAdd(total, callbackValue(value, key)),
            0,
        );
    }

    /**
     * Apply the callback if the collection is empty.
     *
     * @param callback - The callback to execute if the collection is empty, receiving it and true
     * @param defaultValue - The callback to execute if the collection is not empty, receiving it and false
     * @returns The result of the callback if executed, otherwise the current instance
     */
    whenEmpty<TWhenEmptyReturnType>(
        callback: (instance: this, value: boolean) => TWhenEmptyReturnType,
        defaultValue:
            | ((instance: this, value: boolean) => TWhenEmptyReturnType)
            | null = null,
    ) {
        return this.when(this.isEmpty(), callback, defaultValue);
    }

    /**
     * Apply the callback if the collection is not empty.
     *
     * @param callback - The callback to execute if the collection is not empty, receiving it and true
     * @param defaultValue - The callback to execute if the collection is empty, receiving it and false
     * @returns The result of the callback if executed, otherwise the current instance
     */
    whenNotEmpty<TWhenNotEmptyReturnType>(
        callback: (instance: this, value: boolean) => TWhenNotEmptyReturnType,
        defaultValue:
            | ((instance: this, value: boolean) => TWhenNotEmptyReturnType)
            | null = null,
    ) {
        return this.when(this.isNotEmpty(), callback, defaultValue);
    }

    /**
     * Apply the callback unless the collection is empty.
     *
     * @param callback - The callback to execute unless the collection is empty, receiving it and true
     * @param defaultValue - The callback to execute if the collection is empty, receiving it and false
     * @returns The result of the callback if executed, otherwise the current instance
     */
    unlessEmpty<TUnlessEmptyReturnType>(
        callback: (instance: this, value: boolean) => TUnlessEmptyReturnType,
        defaultValue:
            | ((instance: this, value: boolean) => TUnlessEmptyReturnType)
            | null = null,
    ) {
        return this.whenNotEmpty(callback, defaultValue);
    }

    /**
     * Apply the callback unless the collection is not empty.
     *
     * @param callback - The callback to execute unless the collection is not empty, receiving it and true
     * @param defaultValue - The callback to execute if the collection is not empty, receiving it and false
     * @returns The result of the callback if executed, otherwise the current instance
     */
    unlessNotEmpty<TUnlessNotEmptyReturnType>(
        callback: (instance: this, value: boolean) => TUnlessNotEmptyReturnType,
        defaultValue:
            | ((instance: this, value: boolean) => TUnlessNotEmptyReturnType)
            | null = null,
    ) {
        return this.whenEmpty(callback, defaultValue);
    }

    /**
     * Filter items by the given key value pair.
     *
     * @param key - The key or callback to determine the item to filter by to filter the items directly
     * @param operator - The operator to use for comparison, if key is not a callback or null
     * @param value - The value to compare against, if key is not a callback or null
     * @returns A new collection with the items that match the given key value pair
     */
    where(
        key: ((value: TValue, index: TKey) => unknown) | PathKey,
        operator?: unknown,
        value?: unknown,
    ): this;
    where(
        ...args: [
            key: ((value: TValue, index: TKey) => unknown) | PathKey,
            operator?: unknown,
            value?: unknown,
        ]
    ): this {
        return this.filter(this.operatorForWhereArgs(args));
    }

    /**
     * Filter items where the value for the given key is null.
     *
     * @param key - The key to check for null values, or null to check the items directly
     * @returns A new collection with the items where the value for the given key is null
     */
    whereNull(key: PathKey = null) {
        return this.whereStrict(key, null);
    }

    /**
     * Filter items where the value for the given key is not null.
     *
     * @param key - The key to check for non-null values, or null to check the items directly
     * @returns A new collection with the items where the value for the given key is not null
     */
    whereNotNull(key: PathKey = null) {
        return this.where(key, "!==", null);
    }

    /**
     * Filter items by the given key value pair using strict comparison.
     *
     * @param key - The key or callback to determine the item to filter by to filter the items directly
     * @param value - The value to compare against
     * @returns A new collection with the items that match the given key value pair using strict comparison
     */
    whereStrict(key: PathKey, value: unknown) {
        return this.where(key, "===", value);
    }

    /**
     * Filter items by the given key value pair.
     *
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object
     * @param strict - Whether to use strict comparison (===) or loose comparison (==), defaults to false (loose)
     * @returns A new collection with the items that match any of the given values for the specified key
     */
    whereIn<TOperand extends Operand>(
        key: PathKey,
        values: TOperand,
        strict: boolean = false,
    ) {
        const isIn = inArrayTest(
            Object.values(this.getRawItems(values)),
            strict,
        );

        return this.filter((item: TValue) => isIn(itemValue(item, key)));
    }

    /**
     * Filter items by the given key value pair using strict comparison.
     *
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object
     * @returns A new collection with the items that match any of the given values for the specified key using strict comparison
     */
    whereInStrict<TOperand extends Operand>(key: PathKey, values: TOperand) {
        return this.whereIn(key, values, true);
    }

    /**
     * Filter items such that the value of the given key is between the given values.
     *
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object, should contain exactly two values
     * @returns A new collection with the items that have the value for the specified key between the given values
     */
    whereBetween<TOperand extends NonNullable<Operand>>(
        key: PathKey,
        values: TOperand,
    ) {
        const valueSet = this.getRawItems(values);
        const valuesArray = Object.values(valueSet);

        return this.where(key, ">=", valuesArray[0]).where(
            key,
            "<=",
            valuesArray[valuesArray.length - 1],
        );
    }

    /**
     * Filter items such that the value of the given key is not between the given values.
     *
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object, should contain exactly two values
     * @returns A new collection with the items that have the value for the specified key not between the given values
     */
    whereNotBetween<TOperand extends NonNullable<Operand>>(
        key: PathKey,
        values: TOperand,
    ) {
        return this.filter((item: TValue) => {
            const retrieved = itemValue(item, key);
            const valueSet = this.getRawItems(values);
            const valuesArray = Object.values(valueSet);

            return (
                compareValues(retrieved, valuesArray[0]) < 0 ||
                compareValues(retrieved, valuesArray[valuesArray.length - 1]) >
                    0
            );
        });
    }

    /**
     * Filter items by the given key value pair.
     *
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object
     * @param strict - Whether to use strict comparison (===) or loose comparison (==), defaults to false (loose)
     * @returns A new collection with the items that do not match any of the given values for the specified key
     */
    whereNotIn<TOperand extends Operand>(
        key: PathKey,
        values: TOperand,
        strict: boolean = false,
    ) {
        const isIn = inArrayTest(
            Object.values(this.getRawItems(values)),
            strict,
        );

        return this.reject((item: TValue) => isIn(itemValue(item, key)));
    }

    /**
     * Filter items by the given key value pair using strict comparison.
     *
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object
     * @returns A new collection with the items that do not match any of the given values for the specified key using strict comparison
     */
    whereNotInStrict<TOperand extends Operand>(key: PathKey, values: TOperand) {
        return this.whereNotIn(key, values, true);
    }

    /**
     * Filter the items, removing any items that don't match the given type(s).
     *
     * @param type - The expected type(s) for the items, can be a constructor, array of constructors, or object with constructors as values
     * @returns A new collection with the items that match the given type(s)
     */
    whereInstanceOf<TWhereInstanceOf>(
        type:
            | (new (...args: unknown[]) => TWhereInstanceOf)
            | Array<new (...args: never[]) => unknown>
            | Record<PropertyKey, new (...args: never[]) => unknown>,
    ) {
        return this.filter((item: TValue) => {
            if (isArray(type) || isObject(type)) {
                const types = isArray(type) ? type : Object.values(type);
                return types.some((t) => isFunction(t) && item instanceof t);
            }

            return item instanceof type;
        });
    }

    /**
     * Pass the collection to the given callback and return the result.
     *
     * @param callback - The callback to execute, receives the current instance as an argument
     * @returns The result of the callback
     */
    pipe<TPipeReturnType>(callback: (instance: this) => TPipeReturnType) {
        return callback(this);
    }

    /**
     * Pass the collection into a new class.
     *
     * @param className - The class to instantiate with the collection
     * @returns A new instance of the given class, instantiated with the current collection
     */
    pipeInto<TPipeIntoValue>(
        className: new (instance: this) => TPipeIntoValue,
    ) {
        return new className(this);
    }

    /**
     * Pass the collection through a series of callable pipes and return the result.
     *
     * @param callbacks - An array of callbacks to execute, each receives the current instance as an argument
     * @returns The result of the final callback in the series
     */
    pipeThrough(callbacks: Array<(instance: this) => unknown>) {
        return this.sameInstance(callbacks).reduce<this>(
            (carry, callback) =>
                (callback as (instance: this) => unknown)(
                    carry as this,
                ) as this,
            this,
        );
    }

    /**
     * Reduce the collection to a single value.
     *
     * @param callback - The callback to execute, receives the carry, value, and key as arguments
     * @param initial - The carry the first item is reduced into, null when none is given
     * @returns The reduced value, or the initial value if the collection is empty
     */
    reduce(
        callback: (carry: TValue, value: TValue, key: TKey) => TValue,
    ): TValue | null;
    reduce<TReduce>(
        callback: (carry: TReduce, value: TValue, key: TKey) => TReduce,
        initial: TReduce,
    ): TReduce;
    reduce<TReduce = TValue>(
        callback: (
            carry: TValue | TReduce,
            value: TValue,
            key: TKey,
        ) => TReduce,
        initial?: TReduce,
    ) {
        // PHP's $initial defaults to null, so the first item reaches the callback too, unlike Array.prototype.reduce.
        let result = (isUndefined(initial) ? null : initial) as TReduce;

        for (const [key, value] of this.entriesInOrder()) {
            result = callback(result, value, key);
        }

        return result;
    }

    /**
     * Reduce the collection to a single value by mutating an initial value.
     *
     * The callback may mutate the accumulator in place (for arrays, objects,
     * Maps, and Sets). Because JavaScript cannot pass primitives by reference
     * like PHP, the callback may instead return a new accumulator value;
     * returning undefined keeps the current accumulator.
     *
     * @param initial - The initial value to reduce into
     * @param callback - The callback to execute, receives the accumulator, value, and key as arguments
     * @returns The reduced value, or the initial value if the collection is empty
     */
    reduceInto<TReduce>(
        initial: TReduce,
        callback: (result: TReduce, value: TValue, key: TKey) => TReduce | void,
    ): TReduce {
        let result = initial;

        for (const [key, value] of this.entriesInOrder()) {
            const returned = callback(result, value, key) as
                | TReduce
                | undefined;

            if (!isUndefined(returned)) {
                result = returned;
            }
        }

        return result;
    }

    /**
     * Reduce the collection to multiple aggregate values.
     *
     * @param callback - The callback to execute, receives the spread carry values, value, and key as arguments
     * @param initial - The initial values to start the reduction with
     * @returns The reduced values as an array
     * @throws UnexpectedValueException when the reducer answers anything but an array, named as gettype() names it,
     * under the name of the class it was called on, which a minified build may rename
     */
    reduceSpread<TSpread extends unknown[]>(
        callback: (...args: [...TSpread, TValue, PropertyKey]) => [...TSpread],
        ...initial: [...TSpread]
    ): [...TSpread] {
        let result = initial as unknown[];

        for (const [key, value] of this.entriesInOrder()) {
            const callbackResult = (
                callback as (...args: unknown[]) => unknown
            )(...result, value, key);

            if (!isArray(callbackResult)) {
                const type = phpTypeName(callbackResult);
                // PHP names the class with class_basename(static::class), so a subclass gives its own name.
                const name = this.constructor.name;

                throw new UnexpectedValueException(
                    `${name}::reduceSpread expects reducer to return an array, but got a '${type}' instead.`,
                );
            }

            result = callbackResult;
        }

        return result as [...TSpread];
    }

    /**
     * Reduce an associative collection to a single value.
     *
     * @param initial - The initial value to start the reduction with
     * @param callback - The callback to execute, receives the carry, value, and key as arguments
     * @returns The reduced value, or the initial value if the collection is empty
     */
    reduceWithKeys<TReduce>(
        callback: (carry: TReduce, value: TValue, key: TKey) => TReduce,
        initial: TReduce,
    ): TReduce;
    reduceWithKeys(
        callback: (
            carry: TValue | null,
            value: TValue,
            key: TKey,
        ) => TValue | null,
    ): TValue | null;
    reduceWithKeys<TReduce = TValue | null>(
        callback: (
            carry: TReduce | TValue | null,
            value: TValue,
            key: TKey,
        ) => TReduce,
        initial?: TReduce | null,
    ) {
        return this.reduce(
            callback as unknown as (
                carry: TValue | TReduce,
                value: TValue,
                key: TKey,
            ) => TReduce,
            (isUndefined(initial) ? null : initial) as TReduce,
        );
    }

    /**
     * Create a collection of all elements that do not pass a given truth test.
     *
     * @param callback - The callback to execute, receives the value and key as arguments, or a value to compare against, defaults to true
     * @returns A new collection with the items that do not pass the truth test
     */
    reject(
        callback:
            | ((value: TValue, key: TKey) => unknown)
            | boolean
            | TValue = true,
    ) {
        const useAsCallable = this.useAsCallable(callback);

        return this.filter((value: TValue, key: TKey) => {
            if (useAsCallable) {
                return isPhpFalsy(
                    (callback as (value: TValue, key: TKey) => unknown)(
                        value,
                        key,
                    ),
                );
            }

            return !looseEqual(value, callback);
        });
    }

    /**
     * Pass the collection to the given callback and then return it.
     *
     * @param callback - The callback to execute, receives the current instance as an argument
     * @returns The current instance
     */
    tap(callback: (instance: this) => unknown) {
        callback(this);

        return this;
    }

    /**
     * Return only unique items from the collection array using strict comparison.
     *
     * @param key - The key or callback to determine the item to check for uniqueness, or null to check the items directly
     * @returns A new collection with only unique items, determined using strict comparison
     */
    uniqueStrict(
        key: ((value: TValue, key: TKey) => unknown) | PathKey = null,
    ) {
        return this.unique(key, true);
    }

    /**
     * Collect the values into a collection.
     *
     * @returns A new base collection holding a copy of the current items
     */
    collect(): Collection<TValue, TKey, TShape> {
        return new Collection<TValue, TKey, TShape>(this);
    }

    /**
     * Get the collection of items as a plain array.
     *
     * @returns An array of the collection's items
     */
    toArray() {
        // A plain object is data, as a PHP array is, so only an object a class built is Arrayable.
        return this.map((value) =>
            !isPlainObject(value) && toArrayable(value)
                ? value.toArray()
                : value,
        ).all();
    }

    /**
     * Convert the object into something JSON serializable.
     *
     * @returns The items, each converted to a JSON-serializable form: a list when the keys are 0..n-1 in order
     */
    jsonSerialize() {
        const entries = this.entriesInOrder().map(
            ([key, value]) => [key, jsonSerializeItem(value)] as const,
        );

        // json_encode writes a list only for keys 0..n-1 in order, whichever backing holds them.
        if (isListOrder(entries.map(([key]) => key))) {
            return entries.map(([, value]) => value) as TValue[];
        }

        return Object.fromEntries(entries) as Record<TKey, TValue>;
    }

    /**
     * Get the collection of items as JSON.
     *
     * @param replacer - The replacer function or array for JSON.stringify
     * @param space - The number of spaces or string to use for indentation in the JSON string
     * @returns A JSON string representing the collection's items
     */
    toJson(
        replacer?:
            | ((this: unknown, key: string, value: unknown) => unknown)
            | (number | string)[]
            | null,
        space?: string | number,
    ): string {
        if (isArray(replacer)) {
            return JSON.stringify(this.jsonSerialize(), replacer, space);
        }

        return JSON.stringify(
            this.jsonSerialize(),
            replacer ?? undefined,
            space,
        );
    }

    /**
     * Give JSON.stringify the items to encode, as json_encode reads a JsonSerializable's jsonSerialize().
     *
     * @returns What jsonSerialize() returns
     *
     * @example
     *
     * JSON.stringify(new Collection([1, 2])); -> '[1,2]'
     * JSON.stringify({users: new Collection([{id: 1}])}); -> '{"users":[{"id":1}]}'
     */
    toJSON(): unknown {
        // Typed unknown so an argument with a toJSON of its own infers no item type through this one.
        return this.jsonSerialize();
    }

    /**
     * Get the collection of items as pretty print formatted JSON.
     *
     * @param replacer - The replacer function or array for JSON.stringify
     * @param space - The number of spaces or string to use for indentation in the JSON string
     * @returns A pretty-printed JSON string representing the collection's items
     */
    toPrettyJson(
        replacer?:
            | ((this: unknown, key: string, value: unknown) => unknown)
            | (number | string)[]
            | null,
        space: string | number = 4,
    ) {
        return this.toJson(replacer, space);
    }

    /**
     * Convert the collection to its string representation.
     *
     * @returns A JSON string representing the collection's items, HTML-escaped when escapeWhenCastingToString() asked
     */
    toString() {
        const json = this.toJson();

        return this.shouldEscapeWhenCastingToString ? escapeHtml(json) : json;
    }

    /**
     * Indicate that the collection's string representation should be escaped when toString is invoked.
     *
     * @param escape - Whether to escape it
     * @returns The current collection instance
     *
     * @example
     *
     * String(new Collection(['<b>']).escapeWhenCastingToString()); -> '[&quot;&lt;b&gt;&quot;]'
     */
    escapeWhenCastingToString(escape: boolean = true) {
        this.shouldEscapeWhenCastingToString = escape;

        return this;
    }

    /**
     * Get an operator checker callback.
     *
     * @param key - The key or callback to determine the item to check, or null to check the items directly
     * @param operator - The operator to use for comparison, if key is not a callback or null
     * @param value - The value to compare against, if key is not a callback or null
     * @returns A callback that checks if an item matches the given key, operator, and value
     */
    protected operatorForWhere(
        key: ((value: TValue, index: TKey) => unknown) | PathKey,
        operator?: string,
        value?: unknown,
    ): (value: TValue, index: TKey) => boolean {
        if (this.useAsCallable(key)) {
            return key as (value: TValue, index: TKey) => boolean;
        }

        // func_num_args() === 1: both operator and value are undefined
        if (isUndefined(operator) && isUndefined(value)) {
            value = true;
            operator = "=";
        }

        // func_num_args() === 2: operator has value but value is undefined
        if (!isUndefined(operator) && isUndefined(value)) {
            value = operator;
            operator = "=";
        }

        return function (item: unknown): boolean {
            const retrieved = isNull(key)
                ? item
                : itemValue(item, key as PathKey);

            // The switch this used to inline IS operatorMatch, which `contains`'s
            // key/operator/value form in arr and obj already runs; sharing it is what
            // keeps the three in step. An absent operator is PHP's `default:` arm.
            return operatorMatch(retrieved, operator ?? "=", value);
        };
    }

    /**
     * Get an operator checker callback for the arguments a method was given, counted as func_get_args() counts them.
     *
     * @param args - The key, then the operator or the value, then the value
     * @returns A callback that checks if an item matches them
     */
    protected operatorForWhereArgs(
        args: readonly unknown[],
    ): (value: TValue, index: TKey) => boolean {
        // operatorForWhere reads undefined as an argument never passed, so a given undefined becomes PHP's null.
        const [key, operator = null, value = null] = args;
        const path = key as PathKey | ((value: TValue, index: TKey) => unknown);

        if (args.length < 2) {
            return this.operatorForWhere(path);
        }

        return args.length === 2
            ? this.operatorForWhere(path, operator as string)
            : this.operatorForWhere(path, operator as string, value);
    }

    /**
     * Determine if the given value is callable, but not a string.
     *
     * @param value - The value to check
     * @returns True if the value is callable, false otherwise
     */
    protected useAsCallable(value: unknown) {
        return isFunction(value);
    }

    /**
     * Make a function that returns what's passed to it.
     *
     * @returns A function that returns its first argument
     */
    protected identity() {
        return (value: unknown) => value;
    }

    /**
     * Get a value retrieving callback.
     *
     * @param value - The value or callback to retrieve values
     * @returns A callback that retrieves the value from an item
     *
     * @example
     *
     * valueRetriever('id'); -> (item) => itemValue(item, 'id')
     * valueRetriever((item) => item.id); -> (item) => item.id
     * valueRetriever('user.name'); -> (item) => itemValue(item, 'user.name')
     */
    protected valueRetriever<TArgs, TReturn>(
        value: PathKey | ((...args: TArgs[]) => TReturn),
    ) {
        if (isFunction(value)) {
            return value;
        }

        // If value is null or undefined, return the item itself
        if (isNull(value) || isUndefined(value)) {
            return function (...args: TArgs[]) {
                return args[0];
            };
        }

        return function (...args: TArgs[]) {
            return itemValue(args[0], value as PathKey);
        };
    }

    /**
     * Filter the items by what a key-or-callback method was given, as `unless($filter == null)->filter($filter)` does.
     *
     * @param args - A lone filter, or the key, then the operator or the value, then the value
     * @returns The items that pass the filter, or this collection itself when the filter equals null
     * @throws TypeError for a filter that is neither callable nor equal to null, as filter()'s `?callable` rejects it
     */
    protected filterUnlessNull(args: readonly unknown[]): this {
        const filter =
            args.length > 1 ? this.operatorForWhereArgs(args) : args[0];

        // PHP's unless() proxy skips filter() for a filter == null, so a falsy item is still counted.
        if (looseEqual(filter, null)) {
            return this;
        }

        if (!isFunction(filter)) {
            throw notCallable("filter", filter);
        }

        return this.filter(filter as (value: TValue, key: TKey) => unknown);
    }

    /**
     * Read the keys except, only and select take, as each reads its `$keys` argument.
     *
     * @param keys - The arguments: an array or a collection of keys first, else the keys themselves
     * @returns The keys, a collection's values among them, or null when the first argument is null
     */
    protected keysArgument(keys: readonly unknown[]): PathKey[] | null {
        const [first] = keys;

        if (isNull(first) || isUndefined(first)) {
            return null;
        }

        if (first instanceof Collection) {
            return first.values().all() as PathKey[];
        }

        return (isArray(first) ? first : keys) as PathKey[];
    }

    /**
     * Wrap each plain chunk from `@tolki/data` in a collection, then wrap the list of them.
     *
     * @param chunked - The chunks as `dataChunk*` returned them
     * @returns A collection of chunk collections
     */
    protected wrapChunks(
        chunked: TValue[][] | Record<number, Record<PropertyKey, TValue>>,
    ): Collection<Collection<TValue, TKey>, number> {
        const chunks = isArray(chunked) ? chunked : Object.values(chunked);

        return this.sameInstance(
            handOver(
                chunks.map(
                    (chunk) =>
                        this.sameInstance(
                            handOver(chunk as DataItems<TValue, TKey>),
                        ) as unknown as Collection<TValue, TKey>,
                ),
            ),
        ) as unknown as Collection<Collection<TValue, TKey>, number>;
    }

    /** Conditionable Trait Methods */

    /**
     * Apply the callback if the given "value" is (or resolves to) truthy.
     *
     * @param value - The value to evaluate or a closure that returns the value
     * @param callback - The callback to execute if the value is truthy
     * @param defaultCallback - The callback to execute if the value is falsy
     * @returns The result of the callback if executed, otherwise the current instance
     * @throws Error `Value of type null is not callable` when the value is truthy and the callback null, as PHP's does
     *
     * @example
     *
     * new Collection([1, 2, 3]).when(true, coll => coll.map(x => x * 2)); -> new Collection([2, 4, 6])
     * new Collection([1, 2, 3]).when(false, coll => coll.map(x => x * 2)); -> new Collection([1, 2, 3])
     */
    when<TWhenParameter, TWhenReturnType>(
        value: ((instance: this) => TWhenParameter) | TWhenParameter | null,
        callback: (instance: this, value: TWhenParameter) => TWhenReturnType,
        defaultCallback:
            | ((instance: this, value: TWhenParameter) => TWhenReturnType)
            | null = null,
    ) {
        const resolvedValue = isFunction(value)
            ? (value as (instance: this) => TWhenParameter)(this)
            : (value as TWhenParameter);

        if (!isPhpFalsy(resolvedValue)) {
            if (!isFunction(callback)) {
                throw notCallableValue(callback);
            }

            return (callback(this, resolvedValue) ?? this) as Collection<
                TValue,
                TKey
            >;
        } else if (defaultCallback) {
            return (defaultCallback(this, resolvedValue) ?? this) as Collection<
                TValue,
                TKey
            >;
        }

        return this;
    }

    /**
     * Apply the callback if the given "value" is (or resolves to) falsy.
     *
     * @param value - The value to evaluate or a closure that returns the value
     * @param callback - The callback to execute if the value is falsy
     * @param defaultCallback - The callback to execute if the value is truthy
     * @returns The result of the callback if executed, otherwise the current instance
     * @throws Error `Value of type null is not callable` when the value is falsy and the callback null, as PHP's does
     *
     * @example
     *
     * new Collection([1, 2, 3]).unless(false, coll => coll.map(x => x * 2)); -> new Collection([2, 4, 6])
     * new Collection([1, 2, 3]).unless(true, coll => coll.map(x => x * 2)); -> new Collection([1, 2, 3])
     */
    unless<TUnlessParameter, TUnlessReturnType>(
        value: ((instance: this) => TUnlessParameter) | TUnlessParameter | null,
        callback: (
            instance: this,
            value: TUnlessParameter,
        ) => TUnlessReturnType,
        defaultCallback:
            | ((instance: this, value: TUnlessParameter) => TUnlessReturnType)
            | null = null,
    ) {
        const resolvedValue = (
            isFunction(value) ? value(this) : value
        ) as TUnlessParameter;

        if (isPhpFalsy(resolvedValue)) {
            if (!isFunction(callback)) {
                throw notCallableValue(callback);
            }

            return (callback(this, resolvedValue) ?? this) as Collection<
                TValue,
                TKey
            >;
        } else if (defaultCallback) {
            return (defaultCallback(this, resolvedValue) ?? this) as Collection<
                TValue,
                TKey
            >;
        }

        return this;
    }

    /**
     * Get the values from items, whether it's an array or object
     */
    protected getItemValues(items: DataItems<TValue, TKey>): TValue[] {
        return isArray(items) ? items : Object.values(items);
    }

    /**
     * Create a new instance of the collection.
     *
     * @param items - The new instance's items, which the method that built them hands over
     * @returns A new instance of this collection's class, typed by the value, key and shape its caller names
     */
    protected newInstance<
        TNewValue,
        TNewKey extends PropertyKey,
        TNewShape extends CollectionShape,
    >(
        items: DataItems<TNewValue, TNewKey>,
    ): Collection<TNewValue, TNewKey, TNewShape> {
        const Static = this.constructor as CollectionClass<
            TNewValue,
            TNewKey,
            TNewShape
        >;

        return new Static(items);
    }

    /**
     * Create a new instance of the collection holding this collection's value, key and shape.
     *
     * @param items - The new instance's items, which the method that built them hands over
     * @returns A new instance of this collection's class and type
     */
    protected sameInstance(items?: unknown): this {
        // A subclass overrides newInstance() to carry its own state, the way PHP's does, so every instance is built
        // there. Its callers also hand over a Map or nothing, which the constructor reads all the same.
        return this.newInstance<TValue, TKey, TShape>(
            items as DataItems<TValue, TKey>,
        ) as this;
    }

    /**
     * Sort the collection using multiple comparisons.
     *
     * @param comparisons - Paths, each alone or with its direction, and comparators of two items; a bare path or a
     * direction-less descriptor sorts ascending, and no comparisons leave the order alone
     * @param descending - Whether every path sorts descending whatever its own direction, as sortByDesc() rewrites
     * them; a comparator is never reversed
     * @returns A new collection with the sorted items
     */
    protected sortByMany<TSortValue>(
        comparisons: Array<
            | ((a: TValue, b: TValue) => TSortValue)
            | ((item: TValue, key: TKey) => TSortValue)
            | PathKey
            | [PathKey]
            | [
                  PathKey,
                  CaseValue<typeof SortDirection> | boolean | "asc" | "desc",
              ]
        >,
        descending: CaseValue<typeof SortDirection> | boolean = false,
    ) {
        const isDescGlobal =
            descending === true || descending === SortDirection.Descending;

        const comparators = comparisons.map((comparison) =>
            sortSpecComparator<TValue>(
                comparison as SortSpec<TValue>,
                isDescGlobal,
            ),
        );

        const entries = this.entriesInOrder();

        // PHP hands uasort() the closure's whole answer, so a comparator's bool or fraction ends the comparison there.
        entries.sort(
            phpSortComparator(([, a], [, b]) => {
                for (const comparator of comparators) {
                    const result = comparator(a, b);

                    if (result !== 0) {
                        return result;
                    }
                }

                return 0;
            }),
        );

        return this.sameInstance(this.sortedItems(entries));
    }

    /**
     * Lay sorted entries out as the sort family hands them back: a list stays a list, and any other backing
     * renumbers its integer keys over the sorted order, which a plain object cannot hold out of order.
     *
     * @param entries - The entries in their sorted order, each key as PHP stores it
     * @returns The sorted items, ready for the next instance to adopt
     */
    protected sortedItems(
        entries: Array<[TKey, TValue]>,
    ): DataItems<TValue, TKey> {
        if (isArray(this.items)) {
            return handOver(entries.map(([, value]) => value));
        }

        return handOver(
            sortedIntoItems(
                entries.map(([key, value]) => [String(key), value]),
            ) as DataItems<TValue, TKey>,
        );
    }

    /**
     * Write an ordered entry list back over both views of the backing.
     *
     * @param ordered - The entries in the order PHP keeps them
     * @param renumber - Whether integer-like keys renumber, as array_shift and array_splice do
     */
    protected setOrderedItems(
        ordered: Array<[PropertyKey, TValue]>,
        renumber: boolean,
    ): void {
        const entries = ordered.map(
            ([key, value]) => [String(key), value] as [string, TValue],
        );

        const written = renumber
            ? renumberPhpIntegerKeys<TValue>(entries)
            : entries;

        const items = {} as Record<TKey, TValue>;

        for (const [key, value] of written) {
            defineKey(items as Record<string, TValue>, key, value);
        }

        this.items = items;
        this.itemsWithOrder = written.map(([key, value]) => [
            phpArrayKey(key) as TKey,
            value,
        ]);
    }

    /**
     * Reconcile an insertion order against what the backing actually holds now.
     *
     * @param previous - The order the backing carried before
     * @returns The entries the backing holds, in that order
     */
    protected orderedFrom(
        previous: Array<[TKey, TValue]>,
    ): Array<[TKey, TValue]> {
        const items = this.items as Record<string, TValue>;
        const ordered: Array<[TKey, TValue]> = [];
        const placed = new Set<string>();

        for (const [key] of previous) {
            const ownKey = String(key);

            if (Object.hasOwn(items, ownKey)) {
                ordered.push([key, items[ownKey] as TValue]);
                placed.add(ownKey);
            }
        }

        // A key the mutation added lands last, where PHP's append puts it.
        for (const [key, value] of Object.entries(items)) {
            if (!placed.has(key)) {
                ordered.push([phpArrayKey(key) as TKey, value]);
            }
        }

        return ordered;
    }

    /**
     * Rebuild the insertion order after a mutation that wrote the backing in place.
     *
     * @param previous - The order the backing carried before the mutation
     */
    protected reorderAfterMutation(previous: Array<[TKey, TValue]>): void {
        this.itemsWithOrder = this.orderedFrom(previous);
    }

    /**
     * The first entry of an ordered list that passes the test, as PHP's `first` does.
     *
     * @param ordered - The entries to walk, in the order they answer
     * @param callback - The test each entry must pass, or null for the leading entry
     * @param defaultValue - What to answer when nothing passes, resolved if it is a thunk
     * @returns The matching value, or the resolved default
     */
    protected firstOrdered<TFirstDefault>(
        ordered: Array<[TKey, TValue]>,
        callback?: ((value: TValue, key: TKey) => unknown) | null,
        defaultValue?: TFirstDefault | (() => TFirstDefault),
    ): TValue | TFirstDefault | null {
        const match = callback
            ? ordered.find(([key, value]) => !isPhpFalsy(callback(value, key)))
            : ordered[0];

        // An empty backing defers to dataFirst, so the thunk-or-value default resolves in one place.
        return match ? match[1] : dataFirst([], null, defaultValue);
    }

    /**
     * The entries this collection holds, in the order PHP keeps them.
     *
     * Reconciled on every read, so a writer that does not rebuild the view cannot make a
     * reader answer with an entry the backing has dropped or miss one it has gained.
     *
     * @returns The ordered entries, or undefined when the backing object already holds the order
     */
    protected orderedEntries(): Array<[TKey, TValue]> | undefined {
        return this.itemsWithOrder && this.orderedFrom(this.itemsWithOrder);
    }

    /**
     * The values this collection holds, in the order PHP keeps them.
     *
     * @returns The values in insertion order, which `all()` cannot express for integer keys
     */
    protected orderedValues(): TValue[] {
        const ordered = this.orderedEntries();

        return ordered
            ? ordered.map(([, value]) => value)
            : this.getItemValues(this.items);
    }

    /**
     * The entries this collection holds, in the order PHP keeps them, each key as PHP stores it.
     *
     * @returns The ordered view's entries, or the backing's own entries with their keys cast
     */
    protected entriesInOrder(): Array<[TKey, TValue]> {
        return (
            this.orderedEntries() ??
            Object.entries(this.items).map(
                ([key, value]) => [phpArrayKey(key), value] as [TKey, TValue],
            )
        );
    }

    /**
     * The items as array_merge() appends them: integer keys renumbered from 0, in the order this collection holds them.
     *
     * @returns The values when every key is an integer, otherwise a record keeping the string keys
     */
    protected renumberedItems(): TValue[] | Record<string, TValue> {
        const entries = renumberPhpIntegerKeys<TValue>(
            this.entriesInOrder().map(([key, value]) => [String(key), value]),
        );

        // all() cannot express integer keys out of ascending order, so a list is handed over as its values.
        if (isListOrder(entries.map(([key]) => phpArrayKey(key)))) {
            return entries.map(([, value]) => value);
        }

        const items: Record<string, TValue> = {};

        for (const [key, value] of entries) {
            defineKey(items, key, value);
        }

        return items;
    }

    /**
     * A copy of this collection that shares no backing with it.
     *
     * PHP gets this for free: `new static($this->items)` copies the array, because an array
     * is a value. A JS backing is a reference, so a method that builds a working copy and
     * then writes to it has to detach here or it writes through to the receiver.
     *
     * @returns A new instance holding the same entries, in the same order, over its own backing
     */
    protected detachedCopy(): this {
        const ordered = this.orderedEntries();

        // A Map is the only input the constructor adopts an order from, so an ordered
        // backing has to be handed back as one or the copy loses the order on the way in.
        if (ordered) {
            return this.sameInstance(new Map(ordered));
        }

        return this.sameInstance(
            handOver(isArray(this.items) ? [...this.items] : { ...this.items }),
        );
    }

    /**
     * Splice a keyed backing in the order PHP's array holds it, as array_splice does.
     *
     * @param ordered - The backing's entries, in the order PHP's array holds them
     * @param offset - Where to start, counting back from the end when negative
     * @param length - How many entries to remove, leaving that many at the end when negative; null or none runs to the
     * end
     * @param replacement - The values to insert, whose own keys array_splice discards
     * @returns A new collection of the removed entries
     */
    protected spliceOrdered(
        ordered: Array<[TKey, TValue]>,
        offset: number,
        length: number | null | undefined,
        replacement: TValue[],
    ) {
        const entries: Array<[PropertyKey, TValue]> = [...ordered];
        const { start, count } = resolveSpliceRange(
            entries.length,
            offset,
            length,
        );

        const removed = entries.splice(
            start,
            count,
            ...replacement.map(
                (value, index) => [index, value] as [PropertyKey, TValue],
            ),
        );

        this.setOrderedItems(entries, true);

        // Both halves renumber their integer keys; a Map is the only backing that can carry the order.
        return this.sameInstance(
            new Map(
                renumberPhpIntegerKeys<TValue>(
                    removed.map(([key, value]) => [String(key), value]),
                ),
            ),
        );
    }

    /**
     * Pad a backing that carries its own insertion order, as array_pad does.
     *
     * @param ordered - The backing's entries, in insertion order
     * @param size - The size to pad to, padding at the beginning when negative
     * @param value - The value to pad with
     * @returns The padded entries, in the order PHP keeps them
     */
    protected padOrdered<TPadValue>(
        ordered: Array<[TKey, TValue]>,
        size: number,
        value: TPadValue,
    ): Map<PropertyKey, TValue | TPadValue> {
        const padCount = Math.abs(size) - ordered.length;

        // array_pad hands back the array untouched, keys and all, when it is already long enough.
        if (padCount <= 0) {
            return new Map<PropertyKey, TValue | TPadValue>(ordered);
        }

        const padding = Array.from(
            { length: padCount },
            (_, index): [PropertyKey, TValue | TPadValue] => [index, value],
        );

        const entries: Array<[PropertyKey, TValue | TPadValue]> =
            size > 0 ? [...ordered, ...padding] : [...padding, ...ordered];

        return new Map<PropertyKey, TValue | TPadValue>(
            renumberPhpIntegerKeys<TValue | TPadValue>(
                entries.map(([key, entryValue]) => [String(key), entryValue]),
            ),
        );
    }

    /**
     * Prepend values to a backing that carries its own insertion order.
     *
     * @param ordered - The backing's entries, in insertion order
     * @param values - The values to prepend
     */
    protected unshiftOrdered(
        ordered: Array<[TKey, TValue]>,
        values: TValue[],
    ): void {
        // A plain object re-sorts integer keys ascending, so delegating to dataUnshift would
        // renumber the object's order, not the Map's that PHP keeps: [2 => c, 0 => a] unshifted
        // gives [0 => x, 1 => c, 2 => a]. Renumber the ordered pairs, then rebuild both views.
        this.setOrderedItems(
            [
                ...values.map(
                    (value, index) => [index, value] as [PropertyKey, TValue],
                ),
                ...ordered,
            ],
            true,
        );
    }

    /**
     * The key PHP's `$array[] =` writes next: one past the highest integer key an
     * object backing holds, negative ones included, or 0 when it holds none.
     *
     * @returns The next free integer key
     */
    protected nextAppendKey(): number {
        let highest: number | null = null;

        // Ascending key order stops above 2**32-2, so the largest integer key may not be last.
        for (const key of Object.keys(this.items)) {
            const phpKey = phpArrayKey(key);

            if (isNumber(phpKey) && (isNull(highest) || phpKey > highest)) {
                highest = phpKey;
            }
        }

        return isNull(highest) ? 0 : highest + 1;
    }

    /**
     * The key an offset names among the backing's own entries, looked up as PHP's `array_key_exists` looks one up.
     *
     * @param key - The key to look up; null reads the "" key
     * @returns The key the backing holds the entry under, or undefined when it holds none
     * @throws TypeError for a key no PHP array can hold, as array_key_exists() refuses one
     */
    protected existingKey(key: unknown): string | number | undefined {
        if (isIllegalOffset(key)) {
            throw arrayKeyExistsError();
        }

        return this.ownKey(key ?? "");
    }

    /**
     * The key an offset names among the backing's own entries, cast as PHP casts an array key.
     *
     * @param key - The offset to look up
     * @returns The key the backing holds the entry under, or undefined when it holds none
     */
    protected ownKey(key: unknown): string | number | undefined {
        const phpKey = phpArrayKey(key);

        // A list's entries are its indexes alone; its `length` and its methods are no items.
        if (isArray(this.items) && !isNumber(phpKey)) {
            return undefined;
        }

        return Object.hasOwn(this.items, phpKey) ? phpKey : undefined;
    }

    /**
     * Write a value under a key, or append it for a null key, as PHP's `$items[$key] = $value` and
     * `$items[] = $value` do.
     *
     * @param key - The key to write, cast as PHP casts an array key, or null to append past the highest integer key
     * @param value - The value to store under the key
     */
    protected putKey(key: PropertyKey | null, value: TValue): void {
        if (isNull(key)) {
            this.appendItems([value]);

            return;
        }

        const phpKey = phpArrayKey(key);

        if (isArray(this.items)) {
            // An index up to the length overwrites or appends; any other key makes PHP's array a keyed one.
            if (
                isNumber(phpKey) &&
                phpKey >= 0 &&
                phpKey <= this.items.length
            ) {
                this.items[phpKey] = value;

                return;
            }

            // Only the indexes the list owns carry over, so a hole gains no undefined item.
            const items = Object.fromEntries(Object.entries(this.items));
            defineKey(items, phpKey, value);
            this.items = items as Record<TKey, TValue>;

            return;
        }

        defineKey(this.items as Record<string, TValue>, phpKey, value);

        if (this.itemsWithOrder) {
            this.reorderAfterMutation(this.itemsWithOrder);
        }
    }

    /**
     * Append values past the highest integer key, as PHP's `$items[] = $value` does for each in turn.
     *
     * @param values - The values to append, in order
     */
    protected appendItems(values: readonly TValue[]): void {
        if (values.length === 0) {
            return;
        }

        if (isArray(this.items)) {
            for (const value of values) {
                this.items.push(value);
            }

            return;
        }

        const items = this.items as Record<string, TValue>;
        const ordered = this.orderedEntries();
        const appended: Array<[TKey, TValue]> = [];
        let key = this.nextAppendKey();

        for (const value of values) {
            appended.push([key as TKey, value]);
            defineKey(items, key++, value);
        }

        if (ordered) {
            this.itemsWithOrder = [...ordered, ...appended];

            return;
        }

        const appendedKeys = appended.map(([appendedKey]) =>
            String(appendedKey),
        );

        // PHP keeps each appended key last in turn, where a plain object sorts every array index ahead of other keys.
        if (
            Object.keys(items)
                .slice(-appendedKeys.length)
                .every((existing, index) => existing === appendedKeys[index])
        ) {
            return;
        }

        const added = new Set(appendedKeys);

        this.itemsWithOrder = [
            ...this.entriesInOrder().filter(
                ([existing]) => !added.has(String(existing)),
            ),
            ...appended,
        ];
    }

    /**
     * Read a Map's entries as the pairs a PHP array would hold, one per key PHP stores.
     *
     * @param items - The Map to read
     * @returns The entries in the Map's own insertion order, each key cast as PHP casts an array key
     */
    protected mapEntries(
        items: ReadonlyMap<unknown, unknown>,
    ): Array<[TKey, TValue]> {
        const entries = new Map<unknown, [TKey, TValue]>();

        for (const [key, value] of items) {
            // PHP has no symbol key to cast, so a symbol stays the key it is.
            const phpKey = isSymbol(key) ? key : phpArrayKey(key);

            // Keys PHP stores as one fold into the first one's place, holding the last one's value.
            entries.set(phpKey, [phpKey as TKey, value as TValue]);
        }

        return [...entries.values()];
    }

    /**
     * The insertion order a backing carries that a plain object cannot hold.
     *
     * @param items - The items this collection is being built from
     * @returns The ordered pairs, or undefined when the backing object already holds the order
     */
    protected adoptedOrder(items: unknown): Array<[TKey, TValue]> | undefined {
        if (items instanceof Collection) {
            return items.itemsWithOrder
                ? ([...items.itemsWithOrder] as Array<[TKey, TValue]>)
                : undefined;
        }

        if (!isMap(items)) {
            return undefined;
        }

        const pairs = this.mapEntries(items);

        // Only an integer key can disagree with a plain object's ascending order, and a symbol
        // key has no PHP order to keep — so neither an all-string nor a symbol-bearing Map
        // earns an ordered view, which is also how a symbol stays out of `itemsWithOrder`.
        return pairs.some(([key]) => isNumber(key)) &&
            !pairs.some(([key]) => isSymbol(key))
            ? pairs
            : undefined;
    }

    /**
     * Read items INTO this collection, adopting the order a plain object cannot hold.
     *
     * This is the ONLY writer of `itemsWithOrder` at construction time; `getRawItems`
     * stays pure so reading an operand can never overwrite the receiver's own order.
     *
     * @param items - The items this collection is being built from
     * @returns The items preserving their original structure
     */
    protected adoptRawItems(items: unknown): DataItems<TValue, TKey> {
        const ordered = this.adoptedOrder(items);

        if (ordered) {
            this.itemsWithOrder = ordered;
        }

        // A builder's fresh items need no copy; anything a caller can still reach is copied, as PHP copies an array.
        if (isTruthyObject(items) && owned.delete(items)) {
            return items as DataItems<TValue, TKey>;
        }

        return this.getRawItems(items);
    }

    /**
     * Results array of items from Collection or Arrayable, without touching this collection.
     *
     * @param items - The items to convert to an array or record
     * @returns The items preserving their original structure
     */
    protected getRawItems(items: unknown): DataItems<TValue, TKey> {
        if (items instanceof Collection) {
            return this.castToItems(items.all());
        }

        // If it's a Map, convert to an object; `adoptedOrder` keeps the order a caller owns
        if (isMap(items)) {
            const obj = {} as Record<TKey, TValue>;

            for (const [key, value] of this.mapEntries(items)) {
                defineKey(obj as Record<string, TValue>, key, value);
            }

            return obj;
        }

        // A plain object models a PHP array, so a toArray, toJson or jsonSerialize member on one is data.
        if (isPlainObject(items) || !isObject(items)) {
            return this.castToItems(items);
        }

        if (toArrayable(items)) {
            return this.castToItems(items.toArray());
        }

        // PHP's Traversable wins over JsonSerializable; a JS iterator yields no keys, so it gives a list.
        if (isIterable(items)) {
            return Array.from(items) as TValue[];
        }

        if (isFunction(items["toJson"])) {
            return this.castToItems(decodeJson(String(items["toJson"]())));
        }

        if (toJsonSerializable(items)) {
            return this.castToItems(items.jsonSerialize());
        }

        return this.castToItems(items);
    }

    /**
     * An operand's entries in the order PHP's array holds them, each key cast as PHP casts an array key.
     *
     * @param items - The operand, read once, the way getRawItems reads it
     * @returns A collection's or a Map's entries in their insertion order, otherwise the operand's own entries
     */
    protected operandEntries(items: unknown): Array<[PropertyKey, unknown]> {
        if (items instanceof Collection) {
            return items.entriesInOrder();
        }

        // getRawItems reads a Map into a record, which lists its integer keys ascending; PHP has no symbol key.
        if (isMap(items)) {
            return this.mapEntries(items).filter(([key]) => !isSymbol(key));
        }

        return Object.entries(this.getRawItems(items)).map(([key, value]) => [
            phpArrayKey(key),
            value,
        ]);
    }

    /**
     * Lay a result out in PHP's key order: the keys this collection holds, in its order, then those the operand adds.
     *
     * @param result - The result's items, which hold each key's value
     * @param operand - The operand's entries, in the order PHP's array holds them
     * @returns A list result as it is, whose keys already run in order, otherwise a Map in PHP's key order
     */
    protected inKeyOrder(
        result: unknown,
        operand: Array<[PropertyKey, unknown]>,
    ): unknown {
        if (isArray(result)) {
            return handOver(result);
        }

        const values = result as Record<PropertyKey, unknown>;
        const ordered = new Map<PropertyKey, unknown>();

        for (const [key] of [...this.entriesInOrder(), ...operand]) {
            ordered.set(key, values[key]);
        }

        return ordered;
    }

    /**
     * Read a value as items the way PHP's `(array)` cast does.
     *
     * @param value - The value to cast
     * @returns No items for null, a copy of an array or of an object's own fields, else the value wrapped
     */
    protected castToItems(value: unknown): DataItems<TValue, TKey> {
        if (isNull(value) || isUndefined(value)) {
            return [];
        }

        if (isArray(value)) {
            return value.slice() as TValue[];
        }

        // A spread defines each own key, "__proto__" included, where an assignment would run a setter.
        if (isObject(value)) {
            return { ...value } as Record<TKey, TValue>;
        }

        return [value as TValue];
    }
}

/** A collection class as its static factories call it: `new static($items, ...$args)`. */
type CollectionClass<
    TValue,
    TKey extends PropertyKey,
    TShape extends CollectionShape = DefaultShape<TKey>,
> = new (
    items?: unknown,
    ...args: unknown[]
) => Collection<TValue, TKey, TShape>;

/** A rest parameter holding at least one argument, as a required PHP parameter read on with func_get_args(). */
type AtLeastOne<TItem> = [TItem, ...TItem[]];

/** An `@tolki/enum` definition, whose from() resolves a backing value to its case, as BackedEnum::from() does. */
type EnumDefinition<TValue> = {
    // A method signature, so a definition typed for its own case values still takes the collection's values.
    from(value: TValue): unknown;
};

/** The values each of ensure()'s type names lets through: JavaScript's typeof names and get_debug_type()'s. */
interface EnsureTypeMap {
    string: string;
    number: number;
    int: number;
    float: number;
    boolean: boolean;
    bool: boolean;
    symbol: symbol;
    bigint: bigint;
    undefined: undefined;
    // undefined stands in for PHP's null.
    null: null | undefined;
    object: object;
    // A plain object stands in for a PHP array.
    array: unknown[] | Record<PropertyKey, unknown>;
    // typeof calls a class a function too, and a class called without new throws.
    function:
        | ((...args: never[]) => unknown)
        | (abstract new (...args: never[]) => unknown);
}

/** A type ensure() checks for: a type name, a class's name, or the class itself, which takes its subclasses too. */
type EnsureSpec =
    | keyof EnsureTypeMap
    | (string & {})
    | (abstract new (...args: never[]) => unknown);

/**
 * The values ensure() lets through for a type: a name's values, a class's instances, and objects for any other name,
 * which only a class's name can match. A string that may be one of the names narrows nothing.
 */
type EnsuredType<TSpec> = TSpec extends keyof EnsureTypeMap
    ? EnsureTypeMap[TSpec]
    : TSpec extends abstract new (...args: never[]) => infer TInstance
      ? TInstance
      : [Extract<keyof EnsureTypeMap, TSpec>] extends [never]
        ? object
        : unknown;

/** Items a builder created for a new instance; the constructor adopts them instead of copying. */
const owned = new WeakSet<object>();

/**
 * Hand items a builder just created to the constructor it calls next, which adopts them without a copy.
 *
 * @param items - The freshly built items, which nothing else may hold
 * @returns The same items
 */
function handOver<TItems extends object>(items: TItems): TItems {
    owned.add(items);

    return items;
}

/**
 * Whether keys run 0..n-1 in order, as a PHP list's keys do.
 *
 * @param keys - The keys, each as PHP stores it, in the order PHP's array holds them
 * @returns True when the keys are exactly 0, 1, 2 and on, in turn
 */
function isListOrder(keys: Iterable<PropertyKey>): boolean {
    return [...keys].every((key, index) => key === index);
}

/**
 * Hand over entries in PHP's order: as a list while their keys run 0..n-1, otherwise as the Map that holds the order.
 *
 * @param entries - The entries, in the order PHP's array holds them
 * @returns The values as a list, or the entries themselves
 */
function inPhpOrder<TValue>(
    entries: Map<PropertyKey, TValue>,
): TValue[] | Map<PropertyKey, TValue> {
    if (isListOrder(entries.keys())) {
        return handOver([...entries.values()]);
    }

    return entries;
}

/**
 * Renumber entries' integer keys from 0 in the order they come, as array_merge() and array_slice() do.
 *
 * @param entries - The entries, in the order PHP's array holds them
 * @returns The entries in that order, each integer key renumbered and each string key kept, a repeated one in its
 * first place with its last value
 */
function renumberIntegerKeys<TValue>(
    entries: Array<[PropertyKey, TValue]>,
): Map<PropertyKey, TValue> {
    // A Map folds a repeated string key as array_merge() does, where utils' renumberPhpIntegerKeys() keeps both.
    const renumbered = new Map<PropertyKey, TValue>();
    let next = 0;

    for (const [key, value] of entries) {
        renumbered.set(isNumber(key) ? next++ : key, value);
    }

    return renumbered;
}

/**
 * Merge entries into a PHP array's as array_merge_recursive does: an integer key appends under the next free one, a
 * string key both hold merges both values, and a new string key joins with its value.
 *
 * @param target - The entries merged into, in order, which this writes
 * @param source - The entries to merge in, in order
 * @returns The target
 */
function mergeRecursively(
    target: Map<PropertyKey, unknown>,
    source: Array<[PropertyKey, unknown]>,
): Map<PropertyKey, unknown> {
    let next = nextIntegerKey(target);

    for (const [key, value] of source) {
        if (isNumber(key)) {
            target.set(next++, value);
        } else if (target.has(key)) {
            const merged = mergeRecursively(
                new Map(phpArrayEntries(target.get(key))),
                phpArrayEntries(value),
            );

            target.set(key, phpArrayValue(merged));
        } else {
            target.set(key, value);
        }
    }

    return target;
}

/**
 * A value's entries as PHP's array cast reads them in array_merge_recursive.
 *
 * @param value - A list or plain object, which model a PHP array, or any other value
 * @returns The entries, each key cast as PHP casts an array key, or the value alone under key 0
 */
function phpArrayEntries(value: unknown): Array<[PropertyKey, unknown]> {
    // JS-only: PHP casts an object to its properties; a Date, Map or class instance stays one value here.
    if (isArray(value) || isPlainObject(value)) {
        return Object.entries(value).map(([key, entry]) => [
            phpArrayKey(key),
            entry,
        ]);
    }

    return [[0, value]];
}

/**
 * The key PHP's `$array[] =` writes next: one past the highest integer key, negative ones included, or 0 when none.
 *
 * @param entries - The entries of the array written to
 * @returns The next free integer key
 */
function nextIntegerKey(entries: Map<PropertyKey, unknown>): number {
    let highest: number | null = null;

    for (const key of entries.keys()) {
        if (isNumber(key) && (isNull(highest) || key > highest)) {
            highest = key;
        }
    }

    return isNull(highest) ? 0 : highest + 1;
}

/**
 * Build a nested value from entries in PHP's order: a list while their keys run 0..n-1, otherwise a plain object.
 *
 * @param entries - The entries, in the order PHP's array holds them
 * @returns The values as a list, or an object holding every entry
 */
function phpArrayValue(
    entries: Map<PropertyKey, unknown>,
): unknown[] | Record<string, unknown> {
    if (isListOrder(entries.keys())) {
        return [...entries.values()];
    }

    const value: Record<string, unknown> = {};

    for (const [key, entry] of entries) {
        defineKey(value, key, entry);
    }

    return value;
}

/** The number a string opens with, as PHP's arithmetic reads it: optional whitespace, then a decimal or exponent. */
const PHP_LEADING_NUMBER =
    /^[ \t\n\r\v\f]*[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/;

/**
 * Add a value to a running total as PHP's `+` does.
 *
 * JS has one number type, so a whole-number total is named "int" where PHP's may be a float: sum([0.5, 0.5, 'a']) says
 * "int + string" where PHP says "float + string". A Map is named "Map", though the port reads it as a PHP array.
 *
 * @param total - The total so far, an int or a float to PHP
 * @param value - The value to add: a number, a string that is or opens with a number, a boolean or null
 * @returns The new total
 * @throws TypeError `Unsupported operand types: int + string` for any other value, naming both operands' types
 */
function phpAdd(total: number, value: unknown): number {
    // The port reads undefined as PHP's null, which adds nothing.
    if (isNull(value) || isUndefined(value)) {
        return total;
    }

    if (isBoolean(value)) {
        return total + Number(value);
    }

    if (typeOf(value) === "number") {
        return total + (value as number);
    }

    // PHP adds the number a string opens with, warning when anything follows it.
    const leading = isString(value) ? PHP_LEADING_NUMBER.exec(value) : null;

    if (!isNull(leading)) {
        return total + Number(leading[0]);
    }

    throw new TypeError(
        `Unsupported operand types: ${isInteger(total) ? "int" : "float"} + ${phpDebugType(value)}`,
    );
}

/**
 * Round a number as PHP's round() does in its default mode, half away from zero.
 *
 * @param value - The number to round, which is never negative, as no percentage is
 * @param precision - The decimal places to keep; a negative precision rounds to tens, hundreds and on
 * @returns The rounded number, or the number itself once a double has no digits left to round at the precision
 */
function phpRound(value: number, precision: number): number {
    // 10 ** 309 is INF, and 0 × INF is NaN; the largest finite power gives PHP's answers past it.
    const exponent = 10 ** Math.min(Math.abs(precision), 308);
    const toScale = (amount: number) =>
        precision > 0 ? amount * exponent : amount / exponent;
    const fromScale = (amount: number) =>
        precision > 0 ? amount / exponent : amount * exponent;
    let integral = Math.floor(toScale(value));

    // Scaling can fall just short of the whole number that maps back onto the value, which PHP takes instead.
    if (fromScale(integral + 1) === value) {
        integral += 1;
    }

    if (integral >= 1e16) {
        return value;
    }

    // PHP compares with the double nearest the midpoint, not the exact midpoint, so 0.285 rounds up to 0.29.
    return fromScale(
        value >= fromScale(integral + 0.5) ? integral + 1 : integral,
    );
}

/**
 * Read a `*Using` callback as the equality test the data helpers take, so a PHP comparator gives PHP's answer.
 *
 * @param callback - A comparator answering a number, equal where PHP's int cast makes it 0, or a boolean test
 * @returns A test answering whether its two arguments are equal
 */
function equalityTest<TLeft, TRight>(
    callback: (left: TLeft, right: TRight) => boolean | number,
): (left: TLeft, right: TRight) => boolean {
    return (left, right) => {
        const answer = callback(left, right);

        // PHP casts the answer to an int, so a number means equal only where that cast makes it 0.
        if (typeOf(answer) === "number") {
            return phpIntCast(answer as number) === 0;
        }

        return answer as boolean;
    };
}

/**
 * Determine whether an item is of a type ensure() names, as PHP matches get_debug_type() or instanceof.
 *
 * @param item - The item to check
 * @param type - A class, a get_debug_type() name such as "int", "array", "null" or a class's name, or a typeof name
 * @returns True when the item is of the type
 */
function isOfType(item: unknown, type: unknown): boolean {
    if (isFunction(type)) {
        return item instanceof type;
    }

    if (type === phpDebugType(item)) {
        return true;
    }

    // JS-only: JavaScript's typeof names are accepted too, "object" meaning any object but null and an array.
    return !isNull(item) && type === typeOf(item);
}

/**
 * Print a key the way PHP's `sprintf('%d', $key)` does: an integer as itself, a string by its leading number, else 0.
 *
 * @param key - The key to print
 * @returns The integer PHP prints
 */
function phpIntegerFormat(key: PropertyKey): number {
    if (isNumber(key)) {
        return key;
    }

    const leading = Number.parseFloat(String(key));

    return isFiniteNumber(leading) ? Math.trunc(leading) : 0;
}

/**
 * Determine whether mapInto() was handed a backed `@tolki/enum` definition rather than a class.
 *
 * @param value - The class or the enum definition
 * @returns True for a definition marked backed, whose from() resolves a value to its case
 */
function isEnumDefinition(value: unknown): value is EnumDefinition<never> {
    // PHP resolves only a BackedEnum through from(); a pure enum is built as a class would be, and throws.
    return (
        isObject(value) && value["backed"] === true && isFunction(value["from"])
    );
}

/**
 * Escape HTML's special characters as Laravel's `e()` helper does, an existing entity included.
 *
 * @param value - The text to escape
 * @returns The text with &, <, >, " and ' written as HTML entities
 */
function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * Decode JSON the way PHP's `json_decode($json, true)` does, where invalid JSON decodes to null.
 *
 * @param json - The JSON text to decode
 * @returns The decoded value, or null when the text is not JSON
 */
function decodeJson(json: string): unknown {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Convert one item as `jsonSerialize()` does: JsonSerializable first, then Jsonable, then Arrayable.
 *
 * @param value - The item to convert
 * @returns What the item serializes as, or the item itself when it converts through none of them
 */
function jsonSerializeItem(value: unknown): unknown {
    // A plain object is data, as a PHP array is, whatever conversion members it holds.
    if (isPlainObject(value) || !isObject(value)) {
        return value;
    }

    if (toJsonSerializable(value)) {
        return value.jsonSerialize();
    }

    if (isFunction(value["toJson"])) {
        const json = value["toJson"]();

        // PHP's toJson() must answer a string; any other answer is taken as already decoded.
        return isString(json) ? decodeJson(json) : json;
    }

    if (toArrayable(value)) {
        return value.toArray();
    }

    // JavaScript's own toJSON hook comes last, so it never overrides one of PHP's interfaces.
    if (isFunction(value["toJSON"])) {
        return decodeJson(JSON.stringify(value));
    }

    return value;
}

/**
 * The error keyBy's PHP throws for a key it cannot store: it casts every object with `(string)` first.
 *
 * @param type - The type name of the key
 * @returns A TypeError for an array, else the Error `(string)` throws for an object without `__toString`
 */
function unconvertibleKey(type: string): Error {
    if (type === "array") {
        return accessOffset(type);
    }

    return new Error(
        `Object of class ${type} could not be converted to string`,
    );
}

/**
 * The error PHP throws when it looks up, through `isset` or `empty`, a key it cannot store.
 *
 * @param type - The type name of the key
 * @returns The TypeError PHP throws
 */
function issetOffset(type: string): TypeError {
    return new TypeError(
        `Cannot access offset of type ${type} in isset or empty`,
    );
}

/**
 * The error PHP throws when it reads or writes an array's entry under a key it cannot store.
 *
 * @param type - The type name of the key
 * @returns The TypeError PHP throws
 */
function accessOffset(type: string): TypeError {
    return new TypeError(`Cannot access offset of type ${type} on array`);
}

/**
 * The error PHP throws when it unsets an array's entry under a key it cannot store.
 *
 * @param type - The type name of the key
 * @returns The TypeError PHP throws
 */
function unsetOffset(type: string): TypeError {
    return new TypeError(`Cannot unset offset of type ${type} on array`);
}

/**
 * The error PHP throws when a method whose callback is `?callable` is handed something it cannot call.
 *
 * @param method - The method whose parameter rejects the argument
 * @param argument - The argument it rejects
 * @returns The TypeError PHP throws, naming the argument's type as get_debug_type() does
 */
function notCallable(method: string, argument: unknown): TypeError {
    return new TypeError(
        `Collection::${method}(): Argument #1 ($callback) must be of type ?callable, ${phpDebugType(argument)} given`,
    );
}

/**
 * The error PHP throws when it calls a value that is not callable, as when() and unless() call a null callback.
 *
 * @param value - The value called
 * @returns The Error PHP throws, naming the value's type as get_debug_type() does
 */
function notCallableValue(value: unknown): Error {
    return new Error(`Value of type ${phpDebugType(value)} is not callable`);
}

/**
 * Build a test of whether a value is among the given values, as PHP's `in_array` compares them.
 *
 * @param haystack - The values to look among
 * @param strict - Whether to compare with PHP's `===` rather than its `==`
 * @returns A test answering whether a value in the haystack equals the one it is given
 */
function inArrayTest(
    haystack: readonly unknown[],
    strict: boolean,
): (needle: unknown) => boolean {
    const equals = strict ? strictEqual : looseEqual;
    const keyOf = strict ? strictKey : looseKey;
    const keyed = new Set<unknown>();
    const unkeyed: unknown[] = [];

    for (const value of haystack) {
        const key = keyOf(value);

        if (isUndefined(key)) {
            unkeyed.push(value);
        } else {
            keyed.add(key);
        }
    }

    return (needle) => {
        const key = keyOf(needle);

        if (isUndefined(key)) {
            return haystack.some((value) => equals(needle, value));
        }

        return keyed.has(key) || unkeyed.some((value) => equals(needle, value));
    };
}

/**
 * The key two values share exactly when PHP's `===` holds between them.
 *
 * @param value - The value to key
 * @returns The value itself when it is a primitive, else undefined; NAN, which equals nothing, has no key
 */
function strictKey(value: unknown): unknown {
    return isPrimitive(value) ? value : undefined;
}

/**
 * The key two values share exactly when PHP's `==` holds between them, for the values it can key.
 *
 * @param value - The value to key
 * @returns A string that is not numeric, the number a number or numeric string stands for, else undefined
 */
function looseKey(value: unknown): string | number | undefined {
    if (isString(value) && !isPhpNumeric(value)) {
        return value;
    }

    const number =
        isNumber(value) || isString(value) ? Number(value) : Number.NaN;

    // Past 2^53 a double drops the digits PHP compares an integer string by, and INF compares by rules of its own.
    return Math.abs(number) <= Number.MAX_SAFE_INTEGER ? number : undefined;
}

/**
 * Determine whether implode() joins an item as it is, as PHP's does an Illuminate\Support\Stringable, over plucking it.
 *
 * @param item - The collection's first item, an object
 * @returns True for an object with its own toString, as hasOwnToString() reads one, so never a Date, unless it is a
 * collection, whose toString is its JSON
 */
function joinsAsString(item: unknown): boolean {
    // JS-only: any object with its own toString is exempt; @tolki/str is not a dependency
    return (
        hasOwnToString(item) &&
        // PHP plucks a collection, which is no Illuminate\Support\Stringable.
        !(item instanceof Collection)
    );
}

/**
 * Read the value an item holds at a path, the way PHP's `data_get` does.
 *
 * @param item - The item to read
 * @param path - A dot-separated path or its segments; null reads the item itself
 * @returns The value at the path, or null when the item holds none there
 */
function itemValue(item: unknown, path: PathKey | readonly PathKey[]): unknown {
    return resolvePluckPath(item, pathSegments(path));
}

/**
 * Determine whether an item holds a value at a path, the way PHP's `data_has` does.
 *
 * @param item - The item to check
 * @param path - A dot-separated path or its segments; null names no path, which no item holds
 * @returns True when the item holds a value at the path, null included
 */
function itemHas(item: unknown, path: PathKey | readonly PathKey[]): boolean {
    return hasPluckPath(item, pathSegments(path));
}

/**
 * Split a path into the segments `data_get` reads one at a time.
 *
 * @param path - A dot-separated path or its segments
 * @returns The segments, as strings
 */
function pathSegments(path: PathKey | readonly PathKey[]): string[] {
    if (isArray(path)) {
        return path.map((segment) => String(segment));
    }

    return explodePluckPath(
        isNull(path) || isUndefined(path) ? null : String(path),
    );
}

/**
 * Pull a dot path out of an item, the way `Arr::pull` reads and removes one below the collection's own keys.
 *
 * @param target - The item the path is read in
 * @param path - The path's segments, each read as a literal key
 * @param defaultValue - What to answer when the path holds nothing, resolved if it is a callback
 * @returns What the path held, or the default, and the target with that removed: a changed copy of an array, a
 * plain object or a Map, or the same collection, changed in place
 */
function pullPath(
    target: unknown,
    path: readonly [string, ...string[]],
    defaultValue: unknown,
): [unknown, unknown] {
    const [segment, ...rest] = path;

    if (target instanceof Collection) {
        if (!target.has(segment)) {
            return [resolveDefault(defaultValue), target];
        }

        const child: unknown = target.offsetGet(segment);

        if (rest.length === 0) {
            target.offsetUnset(segment);

            return [child, target];
        }

        // PHP writes below an ArrayAccess element on a copy it discards, so only a collection further down changes.
        return [
            pullPath(child, rest as [string, ...string[]], defaultValue)[0],
            target,
        ];
    }

    // A Map stands in for a PHP array: its keys are read as PHP casts them, and a change lands on a copy.
    if (isMap(target)) {
        const [found, child] = readPluckKey(target, segment);

        if (!found) {
            return [resolveDefault(defaultValue), target];
        }

        const phpKey = String(phpArrayKey(segment));
        const keys = [...target.keys()].filter(
            (key) => String(phpArrayKey(key)) === phpKey,
        );
        const copy = new Map(target);

        if (rest.length === 0) {
            for (const key of keys) {
                copy.delete(key);
            }

            return [child, copy];
        }

        const [value, pulled] = pullPath(
            child,
            rest as [string, ...string[]],
            defaultValue,
        );

        if (pulled === child) {
            return [value, target];
        }

        for (const key of keys) {
            copy.set(key, pulled);
        }

        return [value, copy];
    }

    const key = isArray(target) ? phpArrayKey(segment) : segment;
    // A list's own keys are its indexes alone; its length is no item.
    const found = isArray(target)
        ? isNumber(key) && Object.hasOwn(target, key)
        : isPlainObject(target) && Object.hasOwn(target, key);

    if (!found) {
        return [resolveDefault(defaultValue), target];
    }

    const child = (target as Record<PropertyKey, unknown>)[key];

    if (rest.length > 0) {
        const [value, pulled] = pullPath(
            child,
            rest as [string, ...string[]],
            defaultValue,
        );

        if (pulled === child) {
            return [value, target];
        }

        // An array and a plain object are PHP arrays, which are values, so the change lands on a copy.
        const copy = isArray(target)
            ? target.slice()
            : { ...(target as Record<PropertyKey, unknown>) };
        defineKey(copy as Record<PropertyKey, unknown>, key, pulled);

        return [value, copy];
    }

    if (isArray(target)) {
        return [child, target.filter((_, index) => index !== key)];
    }

    const copy = { ...(target as Record<PropertyKey, unknown>) };
    delete copy[key];

    return [child, copy];
}
