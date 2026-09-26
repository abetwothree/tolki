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
    dataDiffKeysUsing,
    dataDot,
    dataExcept,
    dataFilter,
    dataFirst,
    dataFlatten,
    dataIntersect,
    dataIntersectAssoc,
    dataIntersectAssocUsing,
    dataIntersectByKeys,
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
    dataSlice,
    dataSort,
    dataSortDesc,
    dataSplice,
    dataUndot,
    dataUnion,
    dataUnshift,
    dataValues,
} from "@tolki/data";
import { SortDirection } from "@tolki/enum";
import { explodePluckPath, hasPluckPath, resolvePluckPath } from "@tolki/path";
import type {
    Arrayable,
    ArrayItems,
    CaseValue,
    DataItems,
    PathKey,
    PathKeys,
    SortSpec,
} from "@tolki/types";
import {
    compareValues,
    createSortSpecComparator,
    defineKey,
    InvalidArgumentException,
    isArray,
    isBoolean,
    isEnumCase,
    isFiniteNumber,
    isFloat,
    isFunction,
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
    isPlainObject,
    isString,
    isSymbol,
    isTruthy,
    isTruthyObject,
    isUndefined,
    ItemNotFoundException,
    looseEqual,
    MultipleItemsFoundException,
    objectToString,
    operatorMatch,
    phpArrayKey,
    phpComputedKey,
    reindexIntegerKeys,
    renumberPhpIntegerKeys,
    resolveDefault,
    resolveSliceRange,
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

export function collect<TValue>(
    items: TValue[] | readonly TValue[],
): Collection<TValue, number>;
export function collect<TValue, TKey extends PropertyKey>(
    items: Collection<TValue, TKey>,
): Collection<TValue, TKey>;
export function collect<TValue>(
    items: Arrayable<TValue>,
): Collection<TValue, number>;
export function collect<TValue, TKey extends PropertyKey>(
    items: Map<TKey, TValue>,
): Collection<TValue, TKey>;
export function collect(items?: null | undefined): Collection<[], number>;
export function collect(items: string): Collection<string[], number>;
export function collect(items: number): Collection<number[], number>;
export function collect(items: boolean): Collection<boolean[], number>;
export function collect(items: symbol): Collection<symbol[], number>;
export function collect<TValue>(
    items: Record<string, TValue>,
): Collection<TValue, string>;
export function collect<TValue, TKey extends PropertyKey>(
    items?:
        | TValue[]
        | Record<TKey, TValue>
        | Collection<TValue, TKey>
        | Arrayable<TValue>
        | Map<TKey, TValue>
        | string
        | number
        | boolean
        | symbol
        | null
        | undefined,
): Collection<TValue, TKey> {
    return new Collection<TValue, TKey>(items);
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
    [Symbol.iterator](): IterableIterator<T1 | T2>;
}

/**
 * Laravel-style Collection class for JavaScript/TypeScript.
 * Provides a fluent interface for working with arrays and objects.
 */
export class Collection<TValue, TKey extends PropertyKey> {
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

    constructor(items: TValue[]);
    constructor(items: readonly TValue[]);
    constructor(items: Collection<TValue, TKey>);
    constructor(items: Arrayable<TValue>);
    constructor(items: Map<TKey, TValue>);
    constructor(items?: null | undefined);
    constructor(items: TValue extends unknown[] ? TValue : never);
    constructor(items: TValue extends readonly unknown[] ? TValue : never);
    constructor(items: Record<TKey & string, TValue>);
    constructor(
        items?:
            | TValue[]
            | readonly TValue[]
            | Record<TKey, TValue>
            | Collection<TValue, TKey>
            | Arrayable<TValue>
            | Map<TKey, TValue>
            | string
            | number
            | boolean
            | symbol
            | null
            | undefined,
    );
    constructor(
        items?:
            | TValue[]
            | readonly TValue[]
            | Record<TKey, TValue>
            | Collection<TValue, TKey>
            | Arrayable<TValue>
            | Map<TKey, TValue>
            | null
            | undefined,
    ) {
        this.items = this.adoptRawItems(items);
    }

    /**
     * Make the collection iterable with for...of loops.
     *
     * @returns The iterator getIterator() returns, over the collection's values
     */
    [Symbol.iterator](): Iterator<TValue> {
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
     * or longer than the range
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
    ): Collection<number, number> {
        if (!isFiniteNumber(step)) {
            throw nonFiniteRangeArgument("#3 ($step)", step);
        }

        if (step === 0) {
            throw new Error("range(): Argument #3 ($step) cannot be 0");
        }

        if (!isFiniteNumber(from)) {
            throw nonFiniteRangeArgument("#1 ($start)", from);
        }

        if (!isFiniteNumber(to)) {
            throw nonFiniteRangeArgument("#2 ($end)", to);
        }

        if (to > from && step < 0) {
            throw new Error(
                "range(): Argument #3 ($step) must be greater than 0 for increasing ranges",
            );
        }

        const stride = Math.abs(step);
        const span = Math.abs(to - from);

        if (span !== 0 && span < stride) {
            throw new Error(
                "range(): Argument #3 ($step) must be less than the range spanned by argument #1 ($start) and argument #2 ($end)",
            );
        }

        const descending = to < from;
        const sized = span / stride + 1;
        const whole = Math.floor(sized);
        const isFloatRange =
            !isInteger(from) || !isInteger(to) || !isInteger(step);
        // PHP rounds a float range's size half up, where an integer range's is floored.
        const size = isFloatRange && sized - whole >= 0.5 ? whole + 1 : whole;
        const items: number[] = [];

        for (let index = 0; index < size; index++) {
            // Each item is reckoned from the start, so a float step's rounding error never builds up.
            const item = descending
                ? from - index * stride
                : from + index * stride;

            // The rounded size can reach one step past the end, and PHP drops that item.
            if (descending ? item < to : item > to) {
                break;
            }

            items.push(item);
        }

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
     * @param  key - The key to calculate the median for, or null for the values themselves
     * @returns The median value or null if the collection is empty
     *
     * @example
     *
     * new Collection([1, 3, 3, 6, 7, 8, 9]).median(); -> 6
     * new Collection([1, 2, 3, 4, 5, 6]).median(); -> 3.5
     * new Collection([{value: 1}, {value: 3}, {value: 3}, {value: 6}, {value: 7}, {value: 8}, {value: 9}]).median('value'); -> 6
     */
    median(key: PropertyKey | null = null): TValue | null {
        const values = (!isNull(key) ? this.pluck(key) : this)
            .reject((item) => isNull(item))
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

        return this.newInstance(
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
     */
    collapse() {
        return this.newInstance(
            handOver(dataCollapse(this.itemsToRawValues() as TValue[])),
        );
    }

    /**
     * Collapse the collection of items into a single array while preserving its keys.
     *
     * @return A new collection with collapsed items
     *
     * @example
     *
     * new Collection([[1, 2], [3, 4]]).collapseWithKeys(); -> new Collection([1, 2, 3, 4])
     * new Collection([{a: 1}, {b: 2}]).collapseWithKeys(); -> new Collection({a: 1, b: 2})
     */
    collapseWithKeys() {
        if (this.isEmpty()) {
            return this.newInstance();
        }

        // Extract raw items from nested Collections and filter out non-arrays/objects
        const results = dataMap(this.items, (value) => {
            // If it's a Collection, get its raw items
            if (value instanceof Collection) {
                return value.all();
            }

            // If it's not an array or object, skip it
            if (!isArray(value) && !isObject(value)) {
                return null;
            }

            return value;
        });

        // Filter out nulls (non-arrays/objects that we skipped)
        const validResults = dataFilter(results, (item) => item !== null);

        if (Object.values(validResults).length === 0) {
            return this.newInstance();
        }

        // Check if all valid results are arrays
        const allArrays = Object.values(validResults).every((item) =>
            isArray(item),
        );

        // Later keys overwrite earlier ones where the first one stood, as array_replace keeps them.
        const merged = new Map<string, unknown>();
        for (const source of Object.values(validResults)) {
            for (const [key, value] of Object.entries(source as object)) {
                merged.set(key, value);
            }
        }

        // If all inputs were arrays, convert the result back to an array
        // to match PHP's behavior
        if (allArrays) {
            return this.newInstance(handOver([...merged.values()]));
        }

        return this.newInstance(merged);
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
        key: ((value: TValue, index: TKey) => unknown) | unknown,
        operator?: unknown,
        value?: unknown,
    ): boolean {
        if (isUndefined(operator) && isUndefined(value)) {
            if (isFunction(key)) {
                const callback = key as (value: TValue, index: TKey) => unknown;

                return dataContains(this.items, callback);
            }

            return dataContains(this.items, key as TValue);
        }

        return this.contains(
            this.operatorForWhere(
                key as PathKey | ((value: TValue, index: TKey) => unknown),
                operator as string | undefined,
                value,
            ),
        );
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
        key: ((value: TValue, index: TKey) => unknown) | unknown,
        value?: unknown,
    ): boolean {
        // PHP takes the two-argument form whenever a second argument is passed, a null one included.
        if (!isUndefined(value)) {
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
        key: ((value: TValue, index: TKey) => unknown) | unknown,
        operator?: unknown,
        value?: unknown,
    ): boolean {
        return !this.contains(
            key as (value: TValue, index: TKey) => unknown,
            operator,
            value,
        );
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
        key: ((value: TValue, index: TKey) => unknown) | unknown,
        value?: unknown,
    ): boolean {
        return !this.containsStrict(
            key as (value: TValue, index: TKey) => unknown,
            value,
        );
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
    crossJoin(
        // Note: Collection<any, any> is intentional here due to TypeScript contravariance.
        // Collection<unknown, PropertyKey> breaks when passing typed collections.
        ...items: Array<DataItems<unknown, PropertyKey> | Collection<any, any>>
    ) {
        // Collection::crossJoin hands $this->items to Arr::crossJoin as one argument, so an object backing
        // is one dimension too, never obj.crossJoin's dimension per key.
        const results = dataCrossJoin(
            this.getItemValues(this.items),
            ...items.map((item) => this.getRawItems(item)),
        );

        return this.newInstance(handOver(results));
    }

    /**
     * Get the items in the collection that are not present in the given items.
     *
     * @param items - The items to diff against
     * @returns A new collection with the difference
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).diff([2, 4]); -> new Collection({0: 1, 2: 3})
     */
    diff(
        // Note: Collection<any, any> is intentional due to TypeScript contravariance.
        items:
            | DataItems<unknown, PropertyKey>
            | Collection<any, any>
            | null
            | undefined,
    ) {
        return this.newInstance(
            handOver(dataDiff(this.items, this.getRawItems(items))),
        );
    }

    /**
     * Get the items in the collection that are not present in the given items, using the callback.
     *
     * @param items - The items to diff against
     * @param callback - The callback function to determine equality
     * @returns A new collection with the difference
     *
     * @example
     *
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).diffUsing([{id: 2}], (a, b) => a.id === b.id); -> new Collection({0: {id: 1}, 2: {id: 3}})
     * new Collection(['apple', 'banana', 'cherry']).diffUsing(['banana'], (a, b) => a === b); -> new Collection({0: 'apple', 2: 'cherry'})
     */
    diffUsing(
        // Note: Collection<any, any> is intentional due to TypeScript contravariance.
        items:
            | DataItems<unknown, PropertyKey>
            | Collection<any, any>
            | null
            | undefined,
        callback: (a: TValue, b: TValue) => boolean,
    ) {
        const otherItems = this.getRawItems(items);
        const results = {} as DataItems<TValue, TKey>;

        for (const [key, value] of Object.entries(
            this.items as Record<TKey, TValue>,
        )) {
            let found = false;
            for (const otherValue of Object.values(
                otherItems as Record<TKey, TValue>,
            )) {
                if (callback(value as TValue, otherValue as TValue)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                defineKey(results as Record<string, TValue>, key, value);
            }
        }

        return this.newInstance(handOver(results));
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
    diffAssoc(
        // Note: Collection<any, any> is intentional due to TypeScript contravariance.
        items: DataItems<unknown, PropertyKey> | Collection<any, any>,
    ) {
        return this.newInstance(
            handOver(dataDiffAssoc(this.items, this.getRawItems(items))),
        );
    }

    /**
     * Get the items in the collection whose keys and values are not present in the given items, using the callback.
     * The callback is used to compare keys (case-insensitively, for example), while values are compared strictly.
     *
     * @param items - The items to diff against
     * @param callback - The callback function to compare keys (returns true if keys match)
     * @returns A new collection with the difference
     *
     * @example
     *
     * const strcasecmp = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
     * new Collection({a: 'green', b: 'brown', c: 'blue', 0: 'red'}).diffAssocUsing({A: 'green', 0: 'yellow', 1: 'red'}, strcasecmp); -> new Collection({b: 'brown', c: 'blue', 0: 'red'})
     */
    diffAssocUsing(
        // Note: Collection<any, any> is intentional due to TypeScript contravariance.
        items: DataItems<unknown, PropertyKey> | Collection<any, any>,
        callback: (keyA: TKey, keyB: TKey) => boolean,
    ) {
        return this.newInstance(
            handOver(
                dataDiffAssocUsing(
                    this.items,
                    this.getRawItems(items),
                    // `this.items` is a union, so the call lands on obj's widest row, whose
                    // comparator takes a bare key and rejects a typed callback (contravariance).
                    callback as (
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
    diffKeys(
        // Note: Collection<any, any> is intentional due to TypeScript contravariance.
        items: DataItems<unknown, PropertyKey> | Collection<any, any>,
    ) {
        const otherItems = this.getRawItems(items);
        const results = {} as DataItems<TValue, TKey>;

        for (const [key, value] of Object.entries(
            this.items as Record<TKey, TValue>,
        )) {
            if (!Object.hasOwn(otherItems as object, key)) {
                defineKey(results as Record<string, TValue>, key, value);
            }
        }

        if (isArray(this.items)) {
            return this.newInstance(
                handOver(Object.values(results) as TValue[]),
            );
        }

        return this.newInstance(handOver(results));
    }

    /**
     * Get the items in the collection whose keys are not present in the given items, using the callback.
     * The callback is used to compare keys only (ignoring values).
     *
     * @param items - The items to diff against
     * @param callback - The callback function to compare keys (returns true if keys match)
     * @returns A new collection with the difference
     *
     * @example
     *
     * const strcasecmp = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
     * new Collection({id: 1, first_word: 'Hello'}).diffKeysUsing({ID: 123, foo_bar: 'Hello'}, strcasecmp); -> new Collection({first_word: 'Hello'})
     */
    diffKeysUsing(
        // Note: Collection<any, any> is intentional due to TypeScript contravariance.
        items: DataItems<unknown, PropertyKey> | Collection<any, any>,
        callback: (keyA: TKey, keyB: TKey) => boolean,
    ) {
        return this.newInstance(
            handOver(
                dataDiffKeysUsing(
                    this.items,
                    this.getRawItems(items),
                    // `this.items` is a union, so the call lands on obj's widest row, whose
                    // comparator takes a bare key and rejects a typed callback (contravariance).
                    callback as (
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
        return this.newInstance(handOver(duplicatesItems));
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
     * new Collection([1, 2, 3, 4]).except([0, 2]); -> new Collection({1: 2, 3: 4})
     * new Collection([1, 2, 3, 4]).except(new Collection([0, 2])); -> new Collection({1: 2, 3: 4})
     */
    except<TExceptValue, TExceptKey extends PropertyKey>(
        ...keys: (
            | PathKey
            | PathKey[]
            | Collection<TExceptValue, TExceptKey>
            | null
            | undefined
        )[]
    ) {
        // Handle null/undefined - return all items
        if (keys.length === 0 || isNull(keys[0]) || isUndefined(keys[0])) {
            return this.newInstance(this.items);
        }

        let keysToExcept: PathKey[];

        // If first argument is a Collection, extract its items
        if (keys[0] instanceof Collection) {
            const collectionItems = keys[0].all();
            keysToExcept = isArray(collectionItems)
                ? collectionItems
                : Object.values(collectionItems);
        }
        // If first argument is an array, use it directly
        else if (isArray(keys[0])) {
            keysToExcept = keys[0];
        }
        // Otherwise, treat all arguments as individual keys
        else {
            keysToExcept = keys as PathKey[];
        }

        return this.newInstance(handOver(dataExcept(this.items, keysToExcept)));
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
            return this.newInstance(handOver(dataFilter(this.items)));
        }

        // `Items` is a union, so the delegates hand the callback their own widest
        // value type; the collection's own generics are the narrower truth here.
        return this.newInstance(
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
        return this.newInstance(handOver(dataFlatten(this.items, depth)));
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

        return this.newInstance(flipped);
    }

    /**
     * Remove an item from the collection by key.
     *
     * Each key is unset literally, as offsetUnset does, so a dotted key never reaches a nested value.
     *
     * @param keys - The key or keys to remove, or a collection of keys
     * @returns The collection instance after removing the specified keys
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
    forget<T, K extends PropertyKey = PropertyKey>(
        keys: PathKeys | Collection<T, K>,
    ) {
        const ownKeys = new Set<string | number>();

        for (const key of Object.values(this.getRawItems(keys))) {
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
        const ownKey = this.ownKey(key ?? "");

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
        const ownKey = this.ownKey(key ?? "");

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
     * @returns A new collection with grouped items
     */
    groupBy<TGroupKey extends PropertyKey = PropertyKey>(
        groupByValue:
            | ((value: TValue, index: TKey) => unknown)
            | Array<TGroupKey | ((value: TValue, index: TKey) => unknown)>
            | TGroupKey
            | PathKey,
        preserveKeys: boolean = false,
    ) {
        let nextGroups: Array<
            TGroupKey | ((value: TValue, index: TKey) => unknown)
        > | null = null;

        if (!isFunction(groupByValue) && isArray(groupByValue)) {
            // Make a copy of the array so we don't mutate the original
            nextGroups = [...groupByValue];

            const shiftedValue = nextGroups.shift();

            if (isUndefined(shiftedValue)) {
                throw new Error(
                    "groupBy requires at least one callback or key",
                );
            }

            groupByValue = shiftedValue as
                | ((value: TValue, index: TKey) => unknown)
                | PathKey;
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
                    invalid: () =>
                        new TypeError(
                            "array_key_exists(): Argument #1 ($key) must be a valid array offset type",
                        ),
                });

                let group = groups.get(groupKey);

                if (!group) {
                    group = (useObjects
                        ? this.newInstance(handOver({}))
                        : this.newInstance()) as unknown as Collection<
                        TValue,
                        TKey
                    >;
                    groups.set(groupKey, group);
                }

                group.offsetSet(preserveKeys ? key : null, value);
            }
        }

        const nested =
            isArray(nextGroups) && nextGroups.length > 0 ? nextGroups : null;
        const results = new Map<
            string | number,
            TValue[] | Record<TKey, TValue>
        >();

        for (const [groupKey, group] of groups) {
            results.set(
                groupKey,
                (nested ? group.groupBy(nested, preserveKeys) : group).all() as
                    | TValue[]
                    | Record<TKey, TValue>,
            );
        }

        return this.newInstance(results);
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

        return this.newInstance(results);
    }

    /**
     * Determine if an item exists in the collection by key.
     *
     * Each key is looked up literally, as PHP's `array_key_exists` does, and a null key reads the `""` key.
     *
     * @param keys - The keys to check for, as arguments or as one array given first, which ignores the rest
     * @returns True if all keys exist, false otherwise
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

        return list.every((each) => !isUndefined(this.ownKey(each ?? "")));
    }

    /**
     * Determine if any of the keys exist in the collection.
     *
     * Each key is looked up literally, as PHP's `array_key_exists` does, and a null key reads the `""` key.
     *
     * @param keys - The keys to check for, as arguments or as one array given first, which ignores the rest
     * @returns True if any key exists, false otherwise
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

        return list.some((each) => !isUndefined(this.ownKey(each ?? "")));
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
        key: ((value: TValue, index: TKey) => unknown) | PathKey | null = null,
        operator?: unknown,
        value?: unknown,
    ): boolean {
        return (
            this.filterUnlessNull(key, operator, value).take(2).count() === 2
        );
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
        key: ((value: TValue, index: TKey) => unknown) | PathKey | null = null,
        operator?: unknown,
        value?: unknown,
    ): boolean {
        return this.filterUnlessNull(key, operator, value).count() === 1;
    }

    /**
     * Concatenate values of a given key as a string.
     *
     * @param value - The key to pluck values from, or a callback function to generate values
     * @param glue - The string to join values with, defaults to an empty string
     * @returns A string of concatenated values
     *
     * @example
     *
     * new Collection(['apple', 'banana', 'cherry']).implode(); -> 'applebananacherry'
     * new Collection(['apple', 'banana', 'cherry']).implode(', '); -> 'apple, banana, cherry'
     * new Collection([{name: 'John'}, {name: 'Jane'}]).implode('name', ', '); -> 'John, Jane'
     * new Collection({a: {name: 'John'}, b: {name: 'Jane'}}).implode(item => item.name.toUpperCase(), ' - '); -> 'JOHN - JANE'
     */
    implode<TReturnValue>(
        value:
            | ((item: TValue, key: TKey) => TReturnValue)
            | PropertyKey
            | null = null,
        glue: string | null = null,
    ) {
        const convertToString = (item: unknown): string => {
            if (objectToString(item)) {
                return item.toString();
            }

            return String(item);
        };

        const joinItems = (items: unknown[], separator: string | null) => {
            const stringValues = items.map(convertToString);

            return stringValues.join(separator ?? "");
        };

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

        if (!isNull(value)) {
            // Check if we should pluck: first item is an array or a plain object
            // Note: We check isArray first, then isObject. For objects, we want to pluck
            // unless they are Stringable objects (which have custom toString).
            // Plain objects inherit toString from Object.prototype, so we need to check
            // if toString is a custom method or the inherited one.
            if (
                isArray(first) ||
                (isObject(first) && first.constructor === Object)
            ) {
                // With no key argument `pluck` answers a list in iteration order, so
                // plucking the ORDERED values keeps PHP's order. The cast re-narrows what
                // isFunction left: its constraint takes unknown[], so it subtracts nothing.
                const items = dataPluck(
                    this.orderedValues(),
                    value as PropertyKey as string,
                    null,
                );

                return joinItems(items as unknown[], glue);
            }
        }

        // When dealing with simple values (strings, numbers, etc.),
        // the value parameter becomes the glue
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
     * new Collection([1, 2, 3, 4]).intersect([2, 4, 6]); -> new Collection({1: 2, 3: 4})
     * new Collection({a: 1, b: 2, c: 3}).intersect({b: 2, d: 4}); -> new Collection({b: 2})
     */
    intersect<T, K extends PropertyKey = PropertyKey>(
        items: T[] | Record<K, T> | Collection<T, K> | null,
    ) {
        if (isNull(items)) {
            return this.newInstance(handOver(isArray(this.items) ? [] : {}));
        }

        return this.newInstance(
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
     * @param callback - The callback function to determine equality
     * @returns A new collection with the intersected items
     *
     * @example
     *
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).intersectUsing([{id: 2}], (a, b) => a.id === b.id); -> new Collection([{id: 2}])
     * new Collection(['apple', 'banana', 'cherry']).intersectUsing(['banana'], (a, b) => a === b); -> new Collection(['banana'])
     */
    intersectUsing<T, K extends PropertyKey = PropertyKey>(
        items: T[] | Record<K, T> | Collection<T, K> | null,
        callback: (a: TValue, b: TValue) => boolean,
    ) {
        if (isNull(items)) {
            return this.newInstance(handOver(isArray(this.items) ? [] : {}));
        }

        return this.newInstance(
            handOver(
                dataIntersect(
                    this.items,
                    this.getRawItems(items) as DataItems<TValue, TKey>,
                    // `this.items` is a union, so the call lands on obj's widest row, whose
                    // comparator takes `unknown` and rejects a typed callback (contravariance).
                    callback as (a: unknown, b: unknown) => boolean,
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
    intersectAssoc<T, K extends PropertyKey = PropertyKey>(
        items: T[] | Record<K, T> | Collection<T, K> | null,
    ) {
        if (isNull(items)) {
            return this.newInstance(handOver(isArray(this.items) ? [] : {}));
        }

        return this.newInstance(
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
     * @param callback - The callback function to compare keys (returns true if keys match)
     * @returns A new collection with the intersected items
     *
     * @example
     *
     * const strcasecmpKeys = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
     * new Collection({a: 'green', b: 'brown'}).intersectAssocUsing({A: 'GREEN', B: 'brown'}, strcasecmpKeys); -> new Collection({b: 'brown'})
     */
    intersectAssocUsing<T, K extends PropertyKey = PropertyKey>(
        items: T[] | Record<K, T> | Collection<T, K> | null,
        callback: (keyA: TKey, keyB: TKey) => boolean,
    ) {
        if (isNull(items)) {
            return this.newInstance(handOver(isArray(this.items) ? [] : {}));
        }

        return this.newInstance(
            handOver(
                dataIntersectAssocUsing(
                    this.items,
                    this.getRawItems(items) as DataItems<TValue, TKey>,
                    // `this.items` is a union, so the call lands on obj's widest row, whose
                    // comparator takes a bare key and rejects a typed callback (contravariance).
                    callback as (
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
     * new Collection([1, 2, 3, 4]).intersectByKeys([1, 3]); -> new Collection([1, 2, 3])
     */
    intersectByKeys<T, K extends PropertyKey = PropertyKey>(
        items: T[] | Record<K, T> | Collection<T, K> | null,
    ) {
        if (isNull(items)) {
            return this.newInstance(handOver(isArray(this.items) ? [] : {}));
        }
        return this.newInstance(
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
        return this.count() === 0;
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

        return collection.implode(glue) + finalGlue + finalItem;
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
            return this.newInstance(
                handOver(ordered.map(([key]) => key)),
            ) as unknown as Collection<TKey, number>;
        }

        return this.newInstance(
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
            return this.newInstance(
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

        return this.newInstance(results) as unknown as Collection<
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
        return this.newInstance(
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
     * The callback should return an array with two elements: [key, value] or an object with a single key/value pair.
     *
     * @param callback - The callback function to map with
     * @returns A new collection with mapped items as a dictionary where each value is an array of accumulated values
     *
     * @example
     *
     * new Collection([{id: 1, name: 'A'}, {id: 2, name: 'B'}, {id: 3, name: 'A'}]).mapToDictionary(item => ({[item.name]: item.id})); -> new Collection({A: [1, 3], B: [2]})
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
        const dictionary = new Map<string | number, TMapToDictionaryValue[]>();

        const bucket = (name: PropertyKey): TMapToDictionaryValue[] => {
            const key = phpArrayKey(name);
            const existing = dictionary.get(key);

            if (existing) {
                return existing;
            }

            const created: TMapToDictionaryValue[] = [];
            dictionary.set(key, created);

            return created;
        };

        for (const [key, value] of this.entriesInOrder()) {
            const mapped = callback(value, key);

            if (isArray(mapped)) {
                if (mapped.length !== 2) {
                    throw new Error(
                        "When returning an array from the mapToDictionary callback, it must have exactly two elements: [key, value]",
                    );
                }

                const [mappedKey, mappedValue] = mapped;

                bucket(mappedKey as PropertyKey).push(
                    mappedValue as TMapToDictionaryValue,
                );
                continue;
            }

            for (const [mappedKey, mappedValue] of Object.entries(mapped)) {
                bucket(mappedKey).push(mappedValue as TMapToDictionaryValue);
            }
        }

        return this.newInstance(dictionary);
    }

    /**
     * Run an associative map over each of the items.
     *
     * The callback should return an object with a single key/value pair.
     *
     * @param callback - The callback function to map with
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
            // Spread the result object to get the key-value pairs
            for (const [newKey, newValue] of Object.entries(result)) {
                map.set(
                    newKey as TMapWithKeysKey,
                    newValue as TMapWithKeysValue,
                );
            }
        }

        return this.newInstance(map);
    }

    /**
     * Merge the collection with the given items.
     *
     * @param items - The items to merge with
     * @returns A new collection with merged items
     *
     * @example
     *
     * new Collection([1, 2]).merge([3, 4]); -> new Collection([1, 2, 3, 4])
     * new Collection({a: 1, b: 2}).merge({c: 3, d: 4}); -> new Collection({a: 1, b: 2, c: 3, d: 4})
     * new Collection([1, 2]).merge({a: 3}); -> new Collection([1, 2, {a: 3}])
     * new Collection({a: 1}).merge([2]); -> new Collection({a: 1, 0: 2})
     */
    merge<TMergeValue, TMergeKey extends PropertyKey>(
        items:
            | TMergeValue[]
            | Record<TMergeKey, TMergeValue>
            | Collection<TMergeValue, TMergeKey>
            | null,
    ) {
        if (isNull(items)) {
            return this;
        }

        const rawItems = this.getRawItems(items);

        if (isArray(this.items) && isArray(rawItems)) {
            return this.newInstance(handOver([...this.items, ...rawItems]));
        }

        if (isObject(this.items) && isObject(rawItems)) {
            return this.newInstance(handOver({ ...this.items, ...rawItems }));
        }

        return this.newInstance(handOver({ ...this.items, ...rawItems }));
    }

    /**
     * Recursively merge the collection with the given items.
     * @param items - The items to merge with
     * @returns A new collection with merged items
     *
     * @example
     *
     * new Collection({a: {b: 1}}).mergeRecursive({a: {c: 2}}); -> new Collection({a: {b: 1, c: 2}})
     * new Collection({a: {b: 1}}).mergeRecursive({a: {b: 2}}); -> new Collection({a: {b: 2}})
     * new Collection([1, [2, 3]]).mergeRecursive([4, [5]]); -> new Collection([1, [2, 3, 5], 4])
     * new Collection([1, {a: 2}]).mergeRecursive([{b: 3}, {a: 4}]); -> new Collection([1, {a: 4, b: 3}])
     * new Collection([1, 2]).mergeRecursive({a: 3}); -> new Collection([1, 2, {a: 3}])
     */
    mergeRecursive<TMergeRecursiveValue, TMergeKey extends PropertyKey>(
        items:
            | TMergeRecursiveValue[]
            | Record<TMergeKey, TMergeRecursiveValue>
            | Collection<TMergeRecursiveValue, TMergeKey>
            | null,
    ) {
        if (isNull(items)) {
            return this;
        }

        const otherItems = this.getRawItems(items);

        // Helper function to recursively merge two values
        // Mimics PHP's array_merge_recursive behavior
        const mergeRecursively = (
            target: unknown,
            source: unknown,
        ): unknown => {
            // If both are arrays, concatenate them
            if (isArray(target) && isArray(source)) {
                return [...target, ...source];
            }

            // If target is array and source is not, append source to target
            if (isArray(target) && !isArray(source)) {
                return [...target, source];
            }

            // If source is array and target is not, prepend target to source
            if (!isArray(target) && isArray(source)) {
                return [target, ...source];
            }

            // If both are objects (but not arrays), merge them recursively
            if (
                isObject(target) &&
                !isArray(target) &&
                isObject(source) &&
                !isArray(source)
            ) {
                const result = { ...target };

                for (const [key, value] of Object.entries(source)) {
                    defineKey(
                        result,
                        key,
                        Object.hasOwn(result, key)
                            ? mergeRecursively(result[key], value)
                            : value,
                    );
                }

                return result;
            }

            // If neither are arrays or objects, create an array with both values
            // This mimics PHP's array_merge_recursive where duplicate keys create arrays
            return [target, source];
        };

        if (isArray(this.items) && isArray(otherItems)) {
            const result: unknown[] = [];
            const maxLength = Math.max(this.items.length, otherItems.length);

            for (let i = 0; i < maxLength; i++) {
                if (i < this.items.length && i < otherItems.length) {
                    result[i] = mergeRecursively(this.items[i], otherItems[i]);
                } else if (i < this.items.length) {
                    result[i] = this.items[i];
                } else {
                    result[i] = otherItems[i];
                }
            }

            return this.newInstance(handOver(result as TValue[]));
        }

        if (isObject(this.items) && isObject(otherItems)) {
            const result = mergeRecursively(this.items, otherItems) as Record<
                TKey,
                TValue | TMergeRecursiveValue
            >;

            return this.newInstance(handOver(result));
        }

        return this.merge(items as DataItems<TValue, TKey>) as Collection<
            TValue | TMergeRecursiveValue,
            TKey
        >;
    }

    /**
     * Multiply the items in the collection by the multiplier.
     *
     * @param multiplier - The number of times to repeat the items
     * @returns A new collection with the items repeated
     *
     * @example
     *
     * new Collection([1, 2]).multiply(3); -> new Collection([1, 2, 1, 2, 1, 2])
     * new Collection({a: 1, b: 2}).multiply(2); -> new Collection({a: 1, b: 2})
     * new Collection([]).multiply(5); -> new Collection([])
     * new Collection([1, 2]).multiply(0); -> new Collection([1, 2])
     */
    multiply(multiplier: number) {
        const newCollection = this.newInstance();

        for (let i = 0; i < multiplier; i++) {
            newCollection.push(...this.getItemValues(this.items));
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
    combine<TCombineValue, TCombineKey extends PropertyKey>(
        values:
            | TCombineValue[]
            | Record<TCombineKey, TCombineValue>
            | Collection<TCombineValue, TCombineKey>,
    ) {
        const keys = this.orderedValues();
        const combined = dataCombine(
            keys,
            this.getRawItems(values) as TValue[],
        ) as Record<string, unknown>;

        // A plain object re-sorts integer keys, so the combined pairs are laid out again in the order the keys come.
        return this.newInstance(
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
    union<T, K extends PropertyKey>(
        items: T[] | Record<K, T> | Collection<T, K> | null,
    ) {
        if (isNull(items)) {
            return this;
        }

        return this.newInstance(
            handOver(dataUnion(this.items, this.getRawItems(items))),
        );
    }

    /**
     * Create a new collection consisting of every n-th element.
     *
     * @param step - The step interval to take elements
     * @param offset - The offset to start from, defaults to 0
     * @returns A new collection with every n-th element
     * @throws Error if step is less than 1
     *
     * @example
     *
     * collect(new Map([[6, "a"], [4, "b"], [7, "c"], [1, "d"], [5, "e"], [3, "f"]])).nth(4).all() -> ["a", "e"]
     */
    nth(step: number, offset: number = 0): Collection<TValue[], number> {
        if (step < 1) {
            throw new Error("Step value must be at least 1.");
        }

        const newItems: TValue[] = [];

        let position = 0;

        // Use the ordered entries when available to preserve numeric key insertion order
        const ordered = this.orderedEntries();
        const entries = ordered
            ? ordered.slice(offset)
            : Object.entries(this.slice(offset).all() as Record<TKey, TValue>);

        for (const [, value] of entries) {
            if (position % step === 0) {
                newItems.push(value as TValue);
            }

            position++;
        }

        return this.newInstance(handOver(newItems)) as unknown as Collection<
            TValue[],
            number
        >;
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
     */
    only<T, K extends PropertyKey>(
        ...keys: PathKey[] | PathKeys[] | Collection<T, K>[]
    ) {
        if (keys.every((key) => isNull(key))) {
            return this.newInstance(this.items);
        }

        // arrWrap's fallback distributes, so a union backing answers a union of one-tuples
        // that flatMap cannot infer an element type from; the cast below names it anyway.
        const keysParam = keys.flatMap((key): unknown[] =>
            arrWrap(this.getRawItems(key)),
        ) as PathKey[];

        return this.newInstance(handOver(dataOnly(this.items, keysParam)));
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
     * new Collection([{id: 1, details: {age: 30, city: 'NY'}}, {id: 2, details: {age: 25, city: 'LA'}}]).select(['id', 'details.age']); -> new Collection([{id: 1, details: {age: 30}}, {id: 2, details: {age: 25}}])
     */
    select(...keys: PathKey[] | PathKeys[] | Collection<string, number>[]) {
        if (keys.every((key) => isNull(key))) {
            return this.newInstance(this.items);
        }

        // arrWrap's fallback distributes, so a union backing answers a union of one-tuples
        // that flatMap cannot infer an element type from; the cast below names it anyway.
        const keysParam = keys.flatMap((key): unknown[] =>
            arrWrap(this.getRawItems(key)),
        ) as PathKey[];

        return this.newInstance(handOver(dataSelect(this.items, keysParam)));
    }

    /**
     * Get and remove the last N items from the collection.
     *
     * @param count - The number of items to pop
     * @returns A new collection with the popped items
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
            return this.newInstance() as unknown as Collection<
                TValue[],
                number
            >;
        }

        const ordered = this.orderedEntries();

        if (ordered) {
            const kept = ordered.slice(0, Math.max(ordered.length - count, 0));
            const removed = ordered
                .slice(kept.length)
                .map(([, value]) => value)
                .reverse();

            // array_pop takes the last entry written, not the highest key, and renumbers nothing.
            this.setOrderedItems(kept, false);

            if (count === 1) {
                return removed[0] ?? null;
            }

            return this.newInstance(handOver(removed)) as unknown as Collection<
                TValue[],
                number
            >;
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
            return this.newInstance() as unknown as Collection<
                TValue[],
                number
            >;
        }

        const poppedValues = dataPop(this.items, count) as TValue[];

        return this.newInstance(
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
                this.items = dataPrepend(
                    this.items,
                    value as unknown as TValue,
                );
            }

            return this;
        }

        // `[$key => $value] + $array`: the new pair leads, and wins its key outright.
        const ownKey = phpArrayKey(key ?? null);
        const prepended = ordered
            ? undefined
            : dataPrepend(this.items, value as unknown as TValue, key ?? null);

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
    concat<TConcatValue, TConcatKey extends PropertyKey = PropertyKey>(
        source:
            | TConcatValue[]
            | Record<TConcatKey, TConcatValue>
            | Collection<TConcatValue, TConcatKey>,
    ) {
        // PHP's `new static($this)` copies the array, because an array is a value there.
        // A JS backing is a reference, so without a copy every `push` below would append
        // to this collection as well as to the result.
        const result = this.detachedCopy();

        result.appendItems(Object.values(this.getRawItems(source)));

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
        if (!isUndefined(this.ownKey(isFloat(key) ? String(key) : key))) {
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
     * @param count - The number of items to retrieve, a callback to determine the count, or null for a single item
     * @param preserveKeys - Whether to preserve the original keys, defaults to false
     * @returns A single random item or a new collection with the random items
     * @throws InvalidArgumentException when more items are requested than the collection holds
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
    ): TValue | Collection<TValue, TKey> {
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
        return this.newInstance(
            handOver(
                Object.keys(picked).every((key, index) => key === String(index))
                    ? Object.values(picked)
                    : picked,
            ),
        );
    }

    /**
     * Replace the collection items with the given items.
     *
     * A `null` `items` is a no-op regardless of whether this collection is array-
     * or object-backed; it's passed straight to `dataReplace` rather than through
     * `getRawItems` (which always returns `[]`) so it dispatches on `this.items`'s shape.
     *
     * @param items - The items to replace with
     * @returns A new collection with the replaced items; object-backed once its keys aren't `0..n-1`
     *
     * @example
     *
     * new Collection([1, 2, 3]).replace([4, 5]); -> new Collection([4, 5, 3])
     * new Collection([1, 2, 3]).replace({1: 9, k: 'y'}); -> new Collection({0: 1, 1: 9, 2: 3, k: 'y'})
     */
    replace<T, K extends PropertyKey>(
        items: T[] | Record<K, T> | Collection<T, K> | null,
    ) {
        return this.newInstance(
            handOver(
                dataReplace(
                    this.items,
                    isNull(items) || isUndefined(items)
                        ? items
                        : this.getRawItems(items),
                ),
            ),
        );
    }

    /**
     * Recursively replace the collection items with the given items.
     *
     * A `null` `items` is a no-op regardless of backing, for the same
     * reason as `replace` above.
     *
     * @param items - The items to replace with
     * @returns A new collection with the recursively replaced items; object-backed once its keys aren't `0..n-1`
     *
     * @example
     *
     * new Collection({a: {b: 1}}).replaceRecursive({a: {c: 2}}); -> new Collection({a: {b: 1, c: 2}})
     * new Collection(['a']).replaceRecursive({3: 'x'}); -> new Collection({0: 'a', 3: 'x'})
     * new Collection([1, [2, 3]]).replaceRecursive([4, [5]]); -> new Collection([4, [5, 3]])
     * new Collection([1, {a: 2}]).replaceRecursive([{b: 3}, {a: 4}]); -> new Collection([{b: 3}, {a: 4}])
     */
    replaceRecursive<T, K extends PropertyKey>(
        items: T[] | Record<K, T> | Collection<T, K> | null,
    ) {
        return this.newInstance(
            handOver(
                dataReplaceRecursive(
                    this.items,
                    isNull(items) || isUndefined(items)
                        ? items
                        : this.getRawItems(items),
                ),
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
        return this.newInstance(handOver(dataReverse(this.items)));
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
     * @param count - The number of items to shift
     * @returns A new collection with the shifted items
     * @throws InvalidArgumentException when the count is negative, even for an empty collection
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
            return this.newInstance(handOver([])) as unknown as Collection<
                TValue[],
                number
            >;
        }

        const ordered = this.orderedEntries();

        if (ordered) {
            const removed = ordered.slice(0, count).map(([, value]) => value);

            this.setOrderedItems(ordered.slice(count), true);

            if (count === 1) {
                return removed[0] as TValue;
            }

            return this.newInstance(handOver(removed)) as unknown as Collection<
                TValue[],
                number
            >;
        }

        // Delegating keeps the object-backed branch on array_shift's
        // key renumbering, which the inline version here never did.
        const shifted = dataShift(this.items, count);

        if (count === 1) {
            return shifted as TValue;
        }

        return this.newInstance(
            handOver(shifted as TValue[]),
        ) as unknown as Collection<TValue[], number>;
    }

    /**
     * Shuffle the items in the collection.
     *
     * @returns A new collection with the items shuffled
     *
     * @example
     *
     * new Collection([1, 2, 3]).shuffle(); -> new Collection([3, 1, 2])
     * new Collection({a: 1, b: 2, c: 3}).shuffle(); -> new Collection({0: 2, 1: 3, 2: 1})
     */
    shuffle() {
        return this.newInstance(handOver(dataShuffle(this.items)));
    }

    /**
     * Create chunks representing a "sliding window" view of the items in the collection.
     *
     * @param size - The size of each chunk, defaults to 2 (must be at least 1)
     * @param step - The number of items to skip between chunks, defaults to 1 (must be at least 1)
     * @returns A new collection with the sliding window chunks
     * @throws Error if size or step is less than 1
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).sliding(); -> new Collection([ [1, 2], [2, 3], [3, 4] ])
     * new Collection([1, 2, 3, 4]).sliding(3); -> new Collection([ [1, 2, 3], [2, 3, 4] ])
     * new Collection([1, 2, 3, 4]).sliding(2, 2); -> new Collection([ [1, 2], [3, 4] ])
     * new Collection({a: 1, b: 2, c: 3}).sliding(); -> new Collection([ {a: 1, b: 2}, {b: 2, c: 3} ])
     */
    sliding(size: number = 2, step: number = 1) {
        if (size < 1) {
            throw new Error("Size value must be at least 1.");
        }

        if (step < 1) {
            throw new Error("Step value must be at least 1.");
        }

        const chunks = Math.floor((this.count() - size) / step) + 1;

        return Collection.times(chunks, (count: number) =>
            this.slice((count - 1) * step, size),
        );
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
     * Slice the underlying collection data.
     *
     * @param offset - The offset to start the slice
     * @param length - The length of the slice, or null to slice to the end
     * @returns A new collection with the sliced items
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).slice(1); -> new Collection([2, 3, 4])
     * new Collection([1, 2, 3, 4]).slice(1, 2); -> new Collection([2, 3])
     * new Collection({a: 1, b: 2, c: 3}).slice(1); -> new Collection({b: 2, c: 3})
     * new Collection({a: 1, b: 2, c: 3}).slice(1, 1); -> new Collection({b: 2})
     */
    slice(offset: number, length: number | null = null) {
        const ordered = this.orderedEntries();

        if (ordered) {
            const { start, end } = resolveSliceRange(
                ordered.length,
                offset,
                length,
            );

            // array_slice($items, $offset, $length, true): positional, and keys survive.
            return this.newInstance(new Map(ordered.slice(start, end)));
        }

        return this.newInstance(
            handOver(dataSlice(this.items, offset, length)),
        );
    }

    /**
     * Split a collection into a certain number of groups.
     *
     * @param numberOfGroups - The number of groups to split into
     * @returns A new collection with the split groups
     * @throws Error if numberOfGroups is less than 1
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
            throw new Error("Number of groups must be at least 1.");
        }

        const groups = this.newInstance() as unknown as Collection<
            Collection<TValue, TKey>,
            number
        >;

        if (this.isEmpty()) {
            return groups;
        }

        const groupSize = Math.floor(this.count() / numberOfGroups);

        const remain = this.count() % numberOfGroups;

        let start = 0;

        for (let i = 0; i < numberOfGroups; i++) {
            let size = groupSize;

            if (i < remain) {
                size += 1;
            }

            if (size > 0) {
                groups.push(
                    this.newInstance(
                        this.slice(start, size).items,
                    ) as unknown as Collection<TValue, TKey>,
                );

                start += size;
            }
        }

        return groups;
    }

    /**
     * Split a collection into a certain number of groups, and fill the first groups completely.
     *
     * @param numberOfGroups - The number of groups to split into
     * @returns A new collection with the split groups
     * @throws Error if numberOfGroups is less than 1
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).splitIn(2); -> new Collection([ new Collection([1, 2]), new Collection([3, 4]) ])
     * new Collection({a: 1, b: 2, c: 3, d: 4}).splitIn(2); -> new Collection([ new Collection({a: 1, b: 2}), new Collection({c: 3, d: 4}) ])
     * new Collection([1, 2, 3]).splitIn(5); -> new Collection([ new Collection([1]), new Collection([2]), new Collection([3]) ])
     */
    splitIn(numberOfGroups: number) {
        if (numberOfGroups < 1) {
            throw new Error("Number of groups must be at least 1.");
        }

        return this.chunk(Math.ceil(this.count() / numberOfGroups));
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
        key: ((value: TValue, index: TKey) => unknown) | PathKey = null,
        operator?: unknown,
        value?: unknown,
    ) {
        const items = this.filterUnlessNull(key, operator, value);

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
        key: ((value: TValue, index: TKey) => unknown) | PathKey = null,
        operator?: string,
        value?: unknown,
    ) {
        const filter =
            isUndefined(operator) && isUndefined(value)
                ? key
                : this.operatorForWhere(key, operator, value);

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
     * @param size - The size of each chunk
     * @param preserveKeys - Whether to preserve the original keys, defaults to false
     * @returns A new collection with the chunked items
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).chunk(2); -> new Collection([ new Collection([1, 2]), new Collection([3, 4]) ])
     * new Collection({a: 1, b: 2, c: 3, d: 4}).chunk(2, true); -> new Collection([ new Collection({a: 1, b: 2}), new Collection({c: 3, d: 4}) ])
     * new Collection([1, 2, 3]).chunk(5); -> new Collection([ new Collection([1, 2, 3]) ])
     */
    chunk(
        size: number,
        preserveKeys: boolean = true,
    ): Collection<Collection<TValue, TKey>, number> {
        if (size < 0) {
            return this.newInstance() as unknown as Collection<
                Collection<TValue, TKey>,
                number
            >;
        }

        const chunkedData = dataChunk(
            this.items as TValue[],
            size,
            preserveKeys,
        );

        return this.wrapChunks(chunkedData);
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
                    this.newInstance(chunk) as unknown as Collection<
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
     * @param callback - The value extractor callback, a path key to get values from, or null for default sort
     * @returns A new collection with the sorted items
     *
     * @example
     *
     * new Collection([3, 1, 2]).sort(); -> new Collection([1, 2, 3])
     */
    sort(
        callback:
            | ((value: TValue, key: PropertyKey) => unknown)
            | string
            | null = null,
    ) {
        return this.newInstance(
            handOver(dataSort(this.items as TValue[], callback)),
        );
    }

    /**
     * Sort items in descending order.
     *
     * @param callback - The value extractor callback, a path key to get values from, or null for default sort
     * @returns A new collection with the sorted items in descending order
     *
     * @example
     *
     * new Collection([1, 2, 3]).sortDesc(); -> new Collection([3, 2, 1])
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).sortDesc('id'); -> new Collection([{id: 3}, {id: 2}, {id: 1}])
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).sortDesc((item) => item.id); -> new Collection([{id: 3}, {id: 2}, {id: 1}])
     */
    sortDesc(
        callback:
            | ((value: TValue, key: PropertyKey) => unknown)
            | string
            | null = null,
    ) {
        return this.newInstance(
            handOver(dataSortDesc(this.items as TValue[], callback)),
        );
    }

    /**
     * Sort the collection using the given callback.
     *
     * Integer-like keys are renumbered over the sorted sequence, so `all()`
     * and `values()` always agree about order; see `sort` above.
     *
     * @param callback - The callback to determine the sort value, a path key to get values from and compare, or an array of such callbacks/keys for multi-level sorting
     * @param descending - Ignored when `callback` is an array (Collection.php:1601); use `sortByDesc`/`sortByMany`.
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
            // PHP's sortBy (Collection.php:1601) discards $descending
            // entirely for the array form; not passed through here either.
            // Use sortByDesc/sortByMany's forceDescending to force it.
            return this.sortByMany(callback);
        }

        const callbackFn = this.valueRetriever(
            callback as PathKey | ((...args: (TValue | TKey)[]) => TSortValue),
        );

        // Create array of [key, value, sortValue] tuples
        const entries: Array<[TKey, TValue, TSortValue]> = [];
        for (const [key, value] of Object.entries(this.items)) {
            const sortValue = callbackFn(
                value as TValue,
                phpArrayKey(key) as TKey,
            ) as TSortValue;
            entries.push([key as TKey, value as TValue, sortValue]);
        }

        // Sort by the sort values
        entries.sort(([, , a], [, , b]) => {
            const comparison = compareValues(a, b);

            return isDesc ? -comparison : comparison;
        });

        return this.newInstance(
            handOver(
                sortedIntoItems(
                    entries.map(([key, value]) => [String(key), value]),
                ) as DataItems<TValue, TKey>,
            ),
        );
    }

    /**
     * Sort the collection using multiple comparisons.
     *
     * Integer-like keys are renumbered over the sorted sequence; see `sort`.
     *
     * @param comparisons - An array of callbacks to determine the sort value, path keys
     *   to get values from and compare, or tuples of such keys for multi-level sorting.
     *   A bare key path or direction-less tuple defaults to ascending; an empty array
     *   leaves the order alone (`Collection::sortByMany`).
     * @param descending - Forces every comparison descending regardless of its own
     *   direction; has no effect on a comparator function. Defaults to false.
     * @returns A new collection with the sorted items
     *
     * @example
     *
     * new Collection([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}, {id: 1, name: 'Charlie'}]).sortByMany(['id', 'name']); -> new Collection([{id: 1, name: 'Alice'}, {id: 1, name: 'Charlie'}, {id: 2, name: 'Bob'}])
     * new Collection([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}, {id: 1, name: 'Charlie'}]).sortByMany([item => item.id, item => item.name]); -> new Collection([{id: 1, name: 'Alice'}, {id: 1, name: 'Charlie'}, {id: 2, name: 'Bob'}])
     * new Collection([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}, {id: 1, name: 'Charlie'}]).sortByMany(['id', item => item.name], true); -> new Collection([{id: 2, name: 'Bob'}, {id: 1, name: 'Charlie'}, {id: 1, name: 'Alice'}])
     */
    sortByMany<TSortValue>(
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
        if (!isArray(comparisons)) {
            throw new Error("You must provide at least one comparison.");
        }

        const isDescGlobal =
            descending === true || descending === SortDirection.Descending;

        const comparators = comparisons.map((comparison) =>
            sortSpecComparator<TValue>(
                comparison as SortSpec<TValue>,
                isDescGlobal,
            ),
        );

        const entries = Object.entries(this.items);
        entries.sort(([, a], [, b]) => {
            for (const comparator of comparators) {
                const result = comparator(a as TValue, b as TValue);

                if (result !== 0) {
                    return result;
                }
            }

            return 0;
        });

        return this.newInstance(
            handOver(
                sortedIntoItems(
                    entries.map(([key, value]) => [
                        String(key),
                        value as TValue,
                    ]),
                ) as DataItems<TValue, TKey>,
            ),
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
            // sortBy's array branch discards its own `descending` argument,
            // so forcing every descriptor descending goes through
            // sortByMany's forceDescending param (Collection.php:1700).
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
            return this.newInstance(
                handOver(entries.map(([, value]) => value)),
            );
        }

        return this.newInstance(handOver(sortedIntoItems(entries)));
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
     * @param callback - The callback to determine the sort order of keys
     * @returns A new collection with the items sorted by keys using the callback
     *
     * @example
     *
     * new Collection({b: 2, a: 1, c: 3}).sortKeysUsing((a, b) => a.localeCompare(b)); -> new Collection({a: 1, b: 2, c: 3})
     * new Collection({b: 2, a: 1, c: 3}).sortKeysUsing((a, b) => b.localeCompare(a)); -> new Collection({c: 3, b: 2, a: 1})
     */
    sortKeysUsing(callback: (a: TKey, b: TKey) => number) {
        const keys = Object.keys(this.items);

        keys.sort((a, b) =>
            callback(phpArrayKey(a) as TKey, phpArrayKey(b) as TKey),
        );

        const entries = keys.map(
            (key) =>
                [key, (this.items as Record<string, TValue>)[key]] as [
                    string,
                    TValue,
                ],
        );

        if (isArray(this.items)) {
            return this.newInstance(
                handOver(entries.map(([, value]) => value)),
            );
        }

        return this.newInstance(handOver(sortedIntoItems(entries)));
    }

    /**
     * Splice a portion of the underlying collection array.
     *
     * @param offset - The offset to start the splice
     * @param length - The number of items to remove; null or none removes everything from the offset on
     * @param replacement - The items to insert in place of the removed items
     * @returns A new collection with the removed items
     *
     * @example
     *
     * new Collection([1, 2, 3]).splice(1); -> new Collection([2, 3]), original collection is now [1]
     * new Collection([1, 2, 3]).splice(1, 1); -> new Collection([2]), original collection is now [1, 3]
     * new Collection([1, 2, 3]).splice(1, 1, [4, 5]); -> new Collection([2]), original collection is now [1, 4, 5, 3]
     * new Collection({a: 1, b: 2, c: 3}).splice(1); -> new Collection({b: 2, c: 3}), original collection is now {a: 1}
     */
    splice<TReplace, TKeyReplace extends PropertyKey>(
        offset: number,
        length?: number | null,
        replacement?:
            | DataItems<TReplace, TKeyReplace>
            | Collection<TReplace, TKeyReplace>,
    ) {
        const replacementItems =
            replacement !== undefined
                ? [this.getRawItems(replacement)]
                : ([] as []);

        // A null length reaches the end, as array_splice's does.
        const count = length ?? undefined;
        const ordered = this.orderedEntries();

        if (ordered) {
            return this.spliceOrdered(
                ordered,
                offset,
                count,
                replacementItems.flatMap(
                    (source) => Object.values(source) as TValue[],
                ),
            );
        }

        return this.newInstance(
            handOver(
                dataSplice(this.items, offset, count, ...replacementItems),
            ),
        );
    }

    /**
     * Take the first or last {$limit} items.
     *
     * @param limit - The number of items to take, positive for first items, negative for last items
     * @returns A new collection with the taken items
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
            return this.slice(Math.max(0, this.count() + limit));
        }

        return this.slice(0, limit);
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
        return this.newInstance(handOver(dataDot(this.items, "", depth)));
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
        return this.newInstance(handOver(dataUndot(this.items)));
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

            return this.newInstance(
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

            return this.newInstance(
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

            return this.newInstance(
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
            return this.newInstance(
                handOver(ordered.map(([, value]) => value)),
            );
        }

        return this.newInstance(handOver(dataValues(this.items)));
    }

    /**
     * Zip the collection together with one or more arrays.
     *
     * @param items - The items to zip with, can be an array or another collection
     * @returns A new collection with the zipped items
     *
     * @example
     *
     * new Collection([1, 2, 3]).zip(['a', 'b', 'c']); -> new Collection([[1, 'a'], [2, 'b'], [3, 'c']])
     * new Collection([1, 2]).zip(new Collection(['a', 'b', 'c'])); -> new Collection([[1, 'a'], [2, 'b']])
     * new Collection({a: 1, b: 2}).zip({x: 'a', y: 'b', z: 'c'}); -> new Collection([[1, 'a'], [2, 'b']])
     */
    zip<TZipValue>(
        // Note: Collection<any, any> is intentional due to TypeScript contravariance.
        ...list: Array<DataItems<TZipValue, PropertyKey> | Collection<any, any>>
    ): Collection<Collection<TValue | TZipValue, number>, number> {
        const arraysToZip = list.map((items) => {
            const rawItems = this.getRawItems(items) as DataItems<TZipValue>;
            return isArray(rawItems) ? rawItems : Object.values(rawItems);
        });

        const maxLength = Math.max(
            this.count(),
            ...arraysToZip.map((arr) => arr.length),
        );

        const zipped: Array<Collection<TValue | TZipValue, number>> = [];

        for (let i = 0; i < maxLength; i++) {
            const row: Array<TValue | TZipValue> = [];

            const thisValues = this.getItemValues(this.items);
            if (i < thisValues.length) {
                row.push(thisValues[i]!);
            }

            for (const arr of arraysToZip) {
                if (i < arr.length) {
                    row.push(arr[i]!);
                } else {
                    row.push(null as TZipValue);
                }
            }

            zipped.push(
                this.newInstance(handOver(row)) as unknown as Collection<
                    TValue | TZipValue,
                    number
                >,
            );
        }

        return this.newInstance(handOver(zipped)) as unknown as Collection<
            Collection<TValue | TZipValue, number>,
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
     * @param size - The size to pad to, positive to pad at the end, negative to pad at the beginning
     * @param value - The value to pad with
     * @returns A new collection padded to the specified length
     *
     * @example
     *
     * new Collection([1, 2, 3]).pad(5, 0); -> new Collection([1, 2, 3, 0, 0])
     */
    pad<TPadValue>(size: number, value: TPadValue) {
        const ordered = this.orderedEntries();

        if (ordered) {
            return this.newInstance(this.padOrdered(ordered, size, value));
        }

        return this.newInstance(handOver(dataPad(this.items, size, value)));
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
    getIterator() {
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

        return this.newInstance(results);
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
    toBase() {
        return new Collection<TValue, TKey>(this);
    }

    /**
     * Determine if an item exists at an offset.
     *
     * @param offset - The offset to check for existence
     * @returns True if an item exists at the offset, false otherwise
     *
     * @example
     *
     * new Collection([1, 2, 3]).offsetExists(1); -> true
     * new Collection([1, 2, 3]).offsetExists(3); -> false
     * new Collection({a: 1, b: 2}).offsetExists('a'); -> true
     * new Collection({a: 1, b: 2}).offsetExists('c'); -> false
     */
    offsetExists(key: PropertyKey): boolean {
        const value = this.offsetGet(key);

        return !isNull(value) && !isUndefined(value);
    }

    /**
     * Get an item at a given offset.
     *
     * @param offset - The offset to get the item from
     * @returns The item at the given offset, or undefined if not found
     *
     * @example
     *
     * new Collection([1, 2, 3]).offsetGet(1); -> 2
     * new Collection([1, 2, 3]).offsetGet(3); -> undefined
     * new Collection({a: 1, b: 2}).offsetGet('a'); -> 1
     * new Collection({a: 1, b: 2}).offsetGet('c'); -> undefined
     */
    offsetGet(key: PropertyKey) {
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
        // A null or undefined offset appends, as PHP's `$items[] = $value` does.
        this.putKey(key ?? null, value as TValue);
    }

    /**
     * Unset the item at a given offset.
     *
     * @param offset - The offset to unset the item at
     * @returns Void
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
    static make<TValue extends Record<PropertyKey, unknown>>(
        items: TValue,
        ...args: unknown[]
    ): Collection<TValue, string>;
    static make<TValue>(
        items: TValue[] | readonly TValue[],
        ...args: unknown[]
    ): Collection<TValue, number>;
    static make<TValue, TKey extends PropertyKey>(
        items: Collection<TValue, TKey>,
        ...args: unknown[]
    ): Collection<TValue, TKey>;
    static make<TValue>(
        items: Arrayable<TValue>,
        ...args: unknown[]
    ): Collection<ReturnType<Arrayable<TValue>["toArray"]>, number>;
    static make<TValue, TKey extends PropertyKey>(
        items: Map<TKey, TValue>,
        ...args: unknown[]
    ): Collection<TValue, TKey>;
    static make(
        items?: null | undefined,
        ...args: unknown[]
    ): Collection<[], number>;
    static make(
        items: string,
        ...args: unknown[]
    ): Collection<string[], number>;
    static make(
        items: number,
        ...args: unknown[]
    ): Collection<number[], number>;
    static make(
        items: boolean,
        ...args: unknown[]
    ): Collection<boolean[], number>;
    static make(
        items: symbol,
        ...args: unknown[]
    ): Collection<symbol[], number>;
    static make<TMakeValue, TMakeKey extends PropertyKey = PropertyKey>(
        items?:
            | DataItems<TMakeValue, TMakeKey>
            | string
            | number
            | boolean
            | symbol
            | null
            | undefined,
        ...args: unknown[]
    ) {
        return new (this as CollectionClass<TMakeValue, TMakeKey>)(
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
     */
    static wrap<TWrapValue, TWrapKey extends PropertyKey = PropertyKey>(
        value:
            | TWrapValue
            | DataItems<TWrapValue, TWrapKey>
            | Collection<TWrapValue, TWrapKey>,
        ...args: unknown[]
    ) {
        const Static = this as CollectionClass<TWrapValue, TWrapKey>;

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
    static unwrap<TUnwrapValue, TUnwrapKey extends PropertyKey = PropertyKey>(
        value:
            | Collection<TUnwrapValue, TUnwrapKey>
            | DataItems<TUnwrapValue, TUnwrapKey>,
    ) {
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
     */
    static empty(...args: unknown[]) {
        return new (this as unknown as CollectionClass<never, never>)(
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
    static times<TTimesValue>(
        count: number,
        callback: ((count: number) => TTimesValue) | null = null,
        ...args: unknown[]
    ) {
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
     */
    static fromJson(
        json: string,
        _depth: number = 512,
        _flags: number = 0,
        ...args: unknown[]
    ) {
        return new (this as CollectionClass<unknown, PropertyKey>)(
            decodeJson(json),
            ...args,
        );
    }

    /**
     * Get the average value of a given key.
     *
     * @param callback - The key or callback to determine the value to average, or null to average the items directly
     * @returns The average value, or null if no numeric values found
     *
     * @example
     *
     * new Collection([1, 2, 3]).avg(); -> 2
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).avg('id'); -> 2
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).avg(item => item.id); -> 2
     * new Collection([1, 'a', 3]).avg(); -> 2
     * new Collection([]).avg(); -> null
     */
    avg<TReturn>(
        callback: ((value: TValue, key: TKey) => TReturn) | PathKey = null,
    ) {
        const callbackValue = this.valueRetriever(
            callback as PathKey | ((...args: (TValue | TKey)[]) => number),
        );

        const reduced = this.reduce<number[]>(
            (carry: TValue | number[], item: TValue, key: TKey): number[] => {
                const arrCarry = carry as number[];
                const resolved = callbackValue(item, key);

                if (!isNull(resolved) && !isUndefined(resolved)) {
                    const numValue = Number(resolved);
                    if (!isNaN(numValue)) {
                        arrCarry[0] = (arrCarry[0] as number) + numValue;
                        arrCarry[1] = (arrCarry[1] as number) + 1;
                    }
                }

                return arrCarry;
            },
            [0, 0] as number[],
        );

        return isArray(reduced) && isTruthy(reduced[1])
            ? reduced[0]! / reduced[1]!
            : null;
    }

    /**
     * Alias for the "avg" method.
     *
     * @param callback - The key or callback to determine the value to average, or null to average the items directly
     * @returns The average value, or null if no numeric values found
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
    ) {
        return this.contains(key, operator, value);
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
     * Determine if all items pass the given truth test.
     *
     * @param callback - The callback to execute, receives the value(s) as arguments
     * @return True if all items pass the truth test, false otherwise
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
        // PHP tells the forms apart by func_num_args(), not by null; a given undefined becomes null,
        // since operatorForWhere reads undefined as an argument never passed.
        const [key, operator = null, value = null] = args;

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

        const path = key as PathKey | ((value: TValue, index: TKey) => unknown);

        return this.every(
            args.length === 2
                ? this.operatorForWhere(path, operator as string)
                : this.operatorForWhere(path, operator as string, value),
        );
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
    ): TValue | null {
        return this.first(
            this.operatorForWhere(key, operator as string | undefined, value),
        ) as TValue | null;
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
     *
     * @param type - A class, a type name as PHP's get_debug_type() gives it ("int", "float", "string", "bool", "array",
     * "null" or a class's name) or as JavaScript's typeof does ("number", "boolean", "object", "undefined", …),
     * or a list or record of them
     * @returns The current collection instance if all items are of the expected type
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
    ensure<TEnsureOfType>(
        type:
            | TEnsureOfType
            | Array<TEnsureOfType>
            | Record<PropertyKey, TEnsureOfType>
            | "string"
            | "number"
            | "symbol"
            | "boolean"
            | "undefined"
            | "null",
    ) {
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
                `Collection should only include [${names.join(", ")}] items, but '${getDebugType(item)}' found at position ${phpIntegerFormat(key)}.`,
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
     * @param callback - The callback to execute, receives the value and key as arguments, should return a [groupKey, groupValue] tuple
     * @returns A new collection with the grouped items as collections
     */
    mapToGroups<
        TMapToGroupsValue,
        TMapToGroupsKey extends PropertyKey = PropertyKey,
    >(
        callback: (
            value: TValue,
            key: TKey,
        ) =>
            | Record<TMapToGroupsKey, TMapToGroupsValue>
            | [TMapToGroupsKey, TMapToGroupsValue],
    ) {
        const dictionary = this.mapToDictionary(
            callback as (
                value: TValue,
                key: TKey,
            ) => Record<TMapToGroupsKey, TMapToGroupsValue>,
        );

        // map() reads the plain object, which re-sorts integer keys, so the groups follow the dictionary's order.
        const entries = (dictionary.orderedEntries() ??
            Object.entries(dictionary.all())) as Array<[PropertyKey, unknown]>;

        return this.newInstance(
            new Map(
                entries.map(([key, group]) => [
                    key,
                    this.newInstance(
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
            | Collection<TFlatMapValue, TFlatMapKey>
            | DataItems<TFlatMapValue, TFlatMapKey>,
    ) {
        return this.map(callback).collapse();
    }

    /**
     * Map the values into a new class.
     *
     * @param className - The class to map the values into, should have a constructor that accepts the value
     * @returns A new collection with the values mapped into the new class
     */
    mapInto<TMapIntoValue>(
        className: new (...args: unknown[]) => TMapIntoValue,
    ): Collection<TMapIntoValue, TKey> {
        return this.map((item) => new className(item)) as unknown as Collection<
            TMapIntoValue,
            TKey
        >;
    }

    /**
     * Get the min value of a given key.
     *
     * @param callback - The key or callback to determine the value to min, or null to min the items directly
     * @returns The min value, or null if no numeric values found
     */
    min(
        callback:
            | ((value: TValue, key: TKey) => number | null | undefined)
            | PathKey = null,
    ) {
        const callbackValue = this.valueRetriever(
            callback as PathKey | ((...args: (TValue | TKey)[]) => number),
        );

        return this.map((value: TValue) =>
            callbackValue(value as TValue | TKey),
        )
            .reject((value: TValue) => isNull(value))
            .reduce(
                ((carry: number | null, value: unknown) => {
                    if (isNull(carry) || (value as number) < carry) {
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
     * @returns The max value, or null if no numeric values found
     */
    max(callback: ((value: TValue, key: TKey) => number) | PathKey = null) {
        const callbackValue = this.valueRetriever(
            callback as PathKey | ((...args: (TValue | TKey)[]) => number),
        );

        return this.reject((value: TValue) => isNull(value)).reduce(
            ((carry: number | null, item: TValue) => {
                const value = callbackValue(item as TValue | TKey) as number;
                if (isNull(carry) || value > carry) {
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
        key: ((value: TValue, key: TKey) => unknown) | TValue | PathKey = null,
        operator?: unknown,
        value?: unknown,
    ): TupleCollection<Collection<TValue, TKey>, Collection<TValue, TKey>> {
        let callback;
        if (isUndefined(operator) && isUndefined(value)) {
            callback = this.valueRetriever(
                key as PathKey | ((...args: (TValue | TKey)[]) => unknown),
            );
        } else {
            callback = this.operatorForWhere(
                key as PathKey | ((value: TValue, index: TKey) => unknown),
                operator as string | undefined,
                value,
            );
        }

        const [passed, failed] = dataPartition(this.items, (item, key) =>
            callback(item as TValue, key as TKey),
        );

        return this.newInstance(
            handOver([
                this.newInstance(
                    handOver(passed as DataItems<TValue, TKey>),
                ) as unknown as Collection<TValue, TKey>,
                this.newInstance(
                    handOver(failed as DataItems<TValue, TKey>),
                ) as unknown as Collection<TValue, TKey>,
            ]),
        ) as unknown as Collection<
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
     * @param precision - Decimal places to round to (default 2)
     * @returns The percentage of items that pass the truth test, rounded to the given precision, or null if the collection is empty
     */
    percentage(
        callback: (value: TValue, key: TKey) => unknown,
        precision: number = 2,
    ) {
        if (this.isEmpty()) {
            return null;
        }

        const ratio = this.filter(callback).count() / this.count();
        const percent = ratio * 100;

        // Round to the specified precision (matches Laravel's round(..., precision))
        const factor = Math.pow(10, precision);

        return Math.round(percent * factor) / factor;
    }

    /**
     * Get the sum of the given values.\
     *
     * @param callback - The key or callback to determine the value to sum, or null to sum the items directly
     * @returns The sum of the values
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

        return this.reduce((carry, value, key) => {
            const result = callbackValue(value, key) as number;
            return (carry as number) + result;
        }, 0);
    }

    /**
     * Apply the callback if the collection is empty.
     *
     * @param callback - The callback to execute if the collection is empty
     * @param defaultValue - The callback to execute if the collection is not empty
     * @returns The result of the callback if executed, otherwise the current instance
     */
    whenEmpty<TWhenEmptyReturnType>(
        callback: (instance: this) => TWhenEmptyReturnType,
        defaultValue: ((instance: this) => TWhenEmptyReturnType) | null = null,
    ) {
        return this.when(this.isEmpty(), callback, defaultValue);
    }

    /**
     * Apply the callback if the collection is not empty.
     *
     * @param callback - The callback to execute if the collection is not empty
     * @param defaultValue - The callback to execute if the collection is empty
     * @returns The result of the callback if executed, otherwise the current instance
     */
    whenNotEmpty<TWhenNotEmptyReturnType>(
        callback: (instance: this) => TWhenNotEmptyReturnType,
        defaultValue:
            | ((instance: this) => TWhenNotEmptyReturnType)
            | null = null,
    ) {
        return this.when(this.isNotEmpty(), callback, defaultValue);
    }

    /**
     * Apply the callback unless the collection is empty.
     *
     * @param callback - The callback to execute unless the collection is empty
     * @param defaultValue - The callback to execute if the collection is empty
     * @returns The result of the callback if executed, otherwise the current instance
     */
    unlessEmpty<TUnlessEmptyReturnType>(
        callback: (instance: this) => TUnlessEmptyReturnType,
        defaultValue:
            | ((instance: this) => TUnlessEmptyReturnType)
            | null = null,
    ) {
        return this.whenNotEmpty(callback, defaultValue);
    }

    /**
     * Apply the callback unless the collection is not empty.
     *
     * @param callback - The callback to execute unless the collection is not empty
     * @param defaultValue - The callback to execute if the collection is not empty
     * @returns The result of the callback if executed, otherwise the current instance
     */
    unlessNotEmpty<TUnlessNotEmptyReturnType>(
        callback: (instance: this) => TUnlessNotEmptyReturnType,
        defaultValue:
            | ((instance: this) => TUnlessNotEmptyReturnType)
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
    ) {
        return this.filter(
            this.operatorForWhere(key, operator as string | undefined, value),
        );
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
    whereIn<TValueSet extends DataItems<unknown, PropertyKey>>(
        key: PathKey,
        values: TValueSet,
        strict: boolean = false,
    ) {
        const valueSet = this.getRawItems(values);

        return this.filter((item: TValue) => {
            const retrieved = itemValue(item, key);
            if (strict) {
                return Object.values(valueSet).includes(retrieved as TValue);
            }

            return Object.values(valueSet).some((v) => v == retrieved);
        });
    }

    /**
     * Filter items by the given key value pair using strict comparison.
     *
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object
     * @returns A new collection with the items that match any of the given values for the specified key using strict comparison
     */
    whereInStrict<TValueSet extends DataItems<unknown, PropertyKey>>(
        key: PathKey,
        values: TValueSet,
    ) {
        return this.whereIn(key, values, true);
    }

    /**
     * Filter items such that the value of the given key is between the given values.
     *
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object, should contain exactly two values
     * @returns A new collection with the items that have the value for the specified key between the given values
     */
    whereBetween<TValueSet extends DataItems<unknown, PropertyKey>>(
        key: PathKey,
        values: TValueSet,
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
    whereNotBetween<TValueSet extends DataItems<unknown, PropertyKey>>(
        key: PathKey,
        values: TValueSet,
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
    whereNotIn<TValueSet extends DataItems<unknown, PropertyKey>>(
        key: PathKey,
        values: TValueSet,
        strict: boolean = false,
    ) {
        const valueSet = this.getRawItems(values);

        return this.reject((item: TValue) => {
            const retrieved = itemValue(item, key);
            if (strict) {
                return Object.values(valueSet).includes(retrieved as TValue);
            }

            return Object.values(valueSet).some((v) => v == retrieved);
        });
    }

    /**
     * Filter items by the given key value pair using strict comparison.
     *
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object
     * @returns A new collection with the items that do not match any of the given values for the specified key using strict comparison
     */
    whereNotInStrict<TValueSet extends DataItems<unknown, PropertyKey>>(
        key: PathKey,
        values: TValueSet,
    ) {
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
        return this.newInstance(callbacks).reduce<this>(
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
     * @param initial - The initial value to start the reduction with
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
        const entries = Object.entries(this.items);

        if (entries.length === 0) {
            // PHP's reduce never throws: an empty backing hands back $initial,
            // which defaults to null (EnumeratesValues.php:845).
            return isUndefined(initial) ? null : (initial as TReduce);
        }

        let result: TReduce;
        let startIndex: number;

        if (isUndefined(initial)) {
            // Use first element as initial value (like native JS Array.reduce)
            result = entries[0]![1] as unknown as TReduce;
            startIndex = 1;
        } else {
            result = initial;
            startIndex = 0;
        }

        for (let i = startIndex; i < entries.length; i++) {
            const [key, value] = entries[i]!;

            result = callback(
                result,
                value as TValue,
                phpArrayKey(key) as TKey,
            );
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

        for (const [key, value] of Object.entries(this.items)) {
            const returned = callback(
                result,
                value as TValue,
                phpArrayKey(key) as TKey,
            ) as TReduce | undefined;

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
     */
    reduceSpread<TSpread extends unknown[]>(
        callback: (...args: [...TSpread, TValue, PropertyKey]) => [...TSpread],
        ...initial: [...TSpread]
    ): [...TSpread] {
        let result = initial as unknown[];

        for (const [key, value] of Object.entries(this.items)) {
            const callbackResult = (
                callback as (...args: unknown[]) => unknown
            )(...result, value, phpArrayKey(key));

            if (!isArray(callbackResult)) {
                const resultType = typeOf(callbackResult);

                throw new Error(
                    `The reduceSpread function expect the reducer callback to return an array, but got ${resultType}`,
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
    collect() {
        return new Collection<TValue, TKey>(this);
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
        if (entries.every(([key], index) => key === index)) {
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
     * @param key - A callback, the key to compare when an operator or value follows, or a lone filter
     * @param operator - The operator to use for comparison, or the value itself when no third argument is given
     * @param value - The value to compare against
     * @returns The items that pass the filter, or this collection itself when the filter equals null
     * @throws TypeError for a filter that is neither callable nor equal to null, as filter()'s `?callable` rejects it
     */
    protected filterUnlessNull(
        key: unknown,
        operator?: unknown,
        value?: unknown,
    ): this {
        const filter =
            isUndefined(operator) && isUndefined(value)
                ? key
                : this.operatorForWhere(
                      key as
                          | PathKey
                          | ((value: TValue, index: TKey) => unknown),
                      operator as string | undefined,
                      value,
                  );

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
     * Wrap each plain chunk from `@tolki/data` in a collection, then wrap the list of them.
     *
     * @param chunked - The chunks as `dataChunk*` returned them
     * @returns A collection of chunk collections
     */
    protected wrapChunks(
        chunked: TValue[][] | Record<number, Record<PropertyKey, TValue>>,
    ): Collection<Collection<TValue, TKey>, number> {
        const chunks = isArray(chunked) ? chunked : Object.values(chunked);

        return this.newInstance(
            handOver(
                chunks.map(
                    (chunk) =>
                        this.newInstance(
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
     *
     * @example
     *
     * new Collection([1, 2, 3]).when(true, coll => coll.map(x => x * 2)); -> new Collection([2, 4, 6])
     * new Collection([1, 2, 3]).when(false, coll => coll.map(x => x * 2)); -> new Collection([1, 2, 3])
     */
    when<TWhenParameter, TWhenReturnType>(
        value: ((instance: this) => TWhenParameter) | TWhenParameter | null,
        callback:
            | ((instance: this, value: TWhenParameter) => TWhenReturnType)
            | null = null,
        defaultCallback:
            | ((instance: this, value: TWhenParameter) => TWhenReturnType)
            | null = null,
    ) {
        const resolvedValue = isFunction(value)
            ? (value as (instance: this) => TWhenParameter)(this)
            : (value as TWhenParameter);

        if (!isPhpFalsy(resolvedValue)) {
            return (callback?.(this, resolvedValue) ?? this) as Collection<
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
     *
     * @example
     *
     * new Collection([1, 2, 3]).unless(false, coll => coll.map(x => x * 2)); -> new Collection([2, 4, 6])
     * new Collection([1, 2, 3]).unless(true, coll => coll.map(x => x * 2)); -> new Collection([1, 2, 3])
     */
    unless<TUnlessParameter, TUnlessReturnType>(
        value: ((instance: this) => TUnlessParameter) | TUnlessParameter | null,
        callback:
            | ((instance: this, value: TUnlessParameter) => TUnlessReturnType)
            | null = null,
        defaultCallback:
            | ((instance: this, value: TUnlessParameter) => TUnlessReturnType)
            | null = null,
    ) {
        const resolvedValue = (
            isFunction(value) ? value(this) : value
        ) as TUnlessParameter;

        if (isPhpFalsy(resolvedValue)) {
            return (callback?.(this, resolvedValue) ?? this) as Collection<
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
     * Get the raw values of all items.
     * Basically, if an item is a collection, get the underlying raw items.
     */
    protected itemsToRawValues() {
        return dataMap(this.items, (item) => {
            if (item instanceof Collection) {
                return item.all();
            }

            return item;
        });
    }

    /**
     * Create a new instance of the collection using the runtime constructor.
     * This preserves subclass behavior (equivalent to PHP's `new static()`).
     *
     * Note: Generic defaults to `unknown` because this method is called with transformed
     * data (e.g., from collapse, flip, dot, mapWithKeys) that may have different
     * TValue/TKey types than the original collection.
     *
     * @param items - The items for the new collection instance
     * @returns A new collection instance
     */
    protected newInstance<TItems = unknown>(items?: TItems): this {
        const Ctor = this.constructor as new (items?: TItems) => this;

        return new Ctor(items);
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
            return this.newInstance(new Map(ordered));
        }

        return this.newInstance(
            handOver(isArray(this.items) ? [...this.items] : { ...this.items }),
        );
    }

    /**
     * Splice a backing that carries its own insertion order, as array_splice does.
     *
     * @param ordered - The backing's entries, in insertion order
     * @param offset - Where to start, counting back from the end when negative
     * @param length - How many entries to remove, leaving that many at the end when negative
     * @param replacement - The values to insert, whose own keys array_splice discards
     * @returns A new collection of the removed entries
     */
    protected spliceOrdered(
        ordered: Array<[TKey, TValue]>,
        offset: number,
        length: number | undefined,
        replacement: TValue[],
    ) {
        const entries: Array<[PropertyKey, TValue]> = [...ordered];
        const size = entries.length;
        const start =
            offset < 0 ? Math.max(size + offset, 0) : Math.min(offset, size);
        const count = isUndefined(length)
            ? size - start
            : length < 0
              ? Math.max(size + length - start, 0)
              : length;

        const removed = entries.splice(
            start,
            count,
            ...replacement.map(
                (value, index) => [index, value] as [PropertyKey, TValue],
            ),
        );

        this.setOrderedItems(entries, true);

        // Both halves renumber their integer keys; a Map is the only backing that can carry the order.
        return this.newInstance(
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
type CollectionClass<TValue, TKey extends PropertyKey> = new (
    items?: unknown,
    ...args: unknown[]
) => Collection<TValue, TKey>;

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

    if (type === getDebugType(item)) {
        return true;
    }

    // JS-only: JavaScript's typeof names are accepted too, "object" meaning any object but null and an array.
    return !isNull(item) && type === typeOf(item);
}

/**
 * Name a value's type as PHP's `get_debug_type()` does, for ensure()'s message.
 *
 * @param value - The value to name
 * @returns null, int, float, string, bool, array or the class's name, else the JavaScript typeof name
 */
function getDebugType(value: unknown): string {
    // The port reads undefined as PHP's null.
    if (isNull(value) || isUndefined(value)) {
        return "null";
    }

    if (typeOf(value) === "number") {
        return isInteger(value) ? "int" : "float";
    }

    if (isString(value)) {
        return "string";
    }

    if (isBoolean(value)) {
        return "bool";
    }

    // A plain object stands in for a PHP array.
    if (isArray(value) || isPlainObject(value)) {
        return "array";
    }

    if (isObject(value) && isFunction(value["constructor"])) {
        return value["constructor"].name;
    }

    // JS-only: PHP has no function, symbol, bigint or classless object, so each keeps its typeof name.
    return typeOf(value);
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
 * The ValueError PHP's range() throws for an argument that is NAN or INF, as a plain Error.
 *
 * @param argument - The argument's position and name, as PHP's message prints them
 * @param value - The argument, which is not a finite number
 * @returns The error to throw
 */
function nonFiniteRangeArgument(argument: string, value: number): Error {
    // PHP prints INF for either infinity.
    const provided = Number.isNaN(value) ? "NAN" : "INF";

    return new Error(
        `range(): Argument ${argument} must be a finite number, ${provided} provided`,
    );
}

/**
 * The error keyBy's PHP throws for a key it cannot store: it casts every object with `(string)` first.
 *
 * @param type - The type name of the key
 * @returns A TypeError for an array, else the Error `(string)` throws for an object without `__toString`
 */
function unconvertibleKey(type: string): Error {
    if (type === "array") {
        return new TypeError("Cannot access offset of type array on array");
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
 * The error PHP throws when a method whose callback is `?callable` is handed something it cannot call.
 *
 * @param method - The method whose parameter rejects the argument
 * @param argument - The argument it rejects
 * @returns The TypeError PHP throws, naming the argument's type as get_debug_type() does
 */
function notCallable(method: string, argument: unknown): TypeError {
    return new TypeError(
        `Collection::${method}(): Argument #1 ($callback) must be of type ?callable, ${getDebugType(argument)} given`,
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
 * @returns What the path held, or the default, and the target with that removed: a changed copy of an array or a
 * plain object, or the same collection, changed in place
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
