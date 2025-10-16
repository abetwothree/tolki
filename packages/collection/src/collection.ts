import { wrap as arrWrap } from "@laravel-js/arr";
import { dataAdd, dataAfter, dataArray, dataBefore, dataBoolean, dataCollapse, dataContains, dataCrossJoin, dataDiff, dataDivide, dataDot, dataEvery, dataExcept, dataExists, dataFilter, dataFirst, dataFlatten, dataFlip, dataFloat, dataForget, dataFrom, dataGet, dataHas, dataHasAll, dataHasAny, dataInteger, dataIntersect, dataIntersectByKeys, dataItem, dataJoin, dataKeyBy, dataKeys, dataLast, dataMap, dataMapSpread, dataMapToDictionary, dataMapWithKeys, dataOnly, dataPartition, dataPluck, dataPrepend, dataPrependKeysWith, dataPull, dataPush, dataQuery, dataRandom, dataReject, dataReverse, dataSearch, dataSelect, dataSet, dataShift, dataShuffle, dataSole, dataSome, dataSort, dataSortDesc, dataSortRecursive, dataSortRecursiveDesc, dataString, dataTake, dataToCssClasses, dataToCssStyles, dataUndot, dataUnshift, dataValues, dataWhere, dataWhereNotNull } from '@laravel-js/data';
import { clamp, currency, defaultCurrency, defaultLocale, fileSize, forHumans, format, minutesToHuman, ordinal, pairs, parse, parseFloat, parseInt, percentage, secondsToHuman, spell, spellOrdinal, summarize, trim, useCurrency, useLocale, withCurrency, withLocale } from '@laravel-js/num';
import { dotFlatten, dotFlattenArray, dotFlattenObject, forgetKeys, forgetKeysArray, forgetKeysObject, getMixedValue, getNestedValue, getObjectValue, getRaw, hasMixed, hasObjectKey, hasPath, parseSegments, pushMixed, pushWithPath, setImmutable, setMixed, setMixedImmutable, setObjectValue, undotExpand, undotExpandArray, undotExpandObject } from '@laravel-js/path';
import type {
    Arrayable,
    ArrayItems,
    DataItems,
    ObjectKey,
    PathKey,
    PathKeys,
    PropertyName,
    ProxyTarget,
} from "@laravel-js/types";
import { castableToArray, compareValues, getAccessibleValues, isAccessibleData, isArray, isBoolean, isFalsy, isFunction, isNull, isNumber, isObject, isString, isStringable, isSymbol, isTruthy, isUndefined, normalizeToArray, resolveDefault, typeOf } from '@laravel-js/utils';

import { initProxyHandler } from "./proxy";

export function collect<TValue = unknown, TKey extends ObjectKey = ObjectKey>(
    items?: TValue[] | DataItems<TValue> | null,
) {
    return new Collection<TValue, TKey>(items);
}

/**
 * Laravel-style Collection class for JavaScript/TypeScript.
 * Provides a fluent interface for working with arrays and objects.
 */
export class Collection<TValue, TKey extends ObjectKey = ObjectKey> {
    /**
     * The items contained in the collection.
     */
    protected items: DataItems<TValue, TKey>;

    /**
     * Create a new collection.
     *
     * @param items - The items to initialize the collection with
     */
    constructor(
        items?: TValue[] | DataItems<TValue, TKey> | Arrayable<TValue> | null,
    ) {
        this.items = this.getRawItems(items ?? []);

        // Return a proxy that intercepts property access
        // return this.createProxy();
    }

    /**
     * Create a proxy that intercepts property access for both array and object usage
     */
    private createProxy(): this {
        return new Proxy(this, initProxyHandler<TValue>());
    }

    /**
     * Make the collection iterable with for...of loops.
     *
     * @returns An iterator for the collection values
     */
    [Symbol.iterator](): Iterator<TValue> {
        const values = Object.values(
            this.items as Record<PropertyName, TValue>,
        );
        let index = 0;

        return {
            next: (): IteratorResult<TValue> => {
                if (index < values.length) {
                    return { value: values[index++] as TValue, done: false };
                }
                return { value: undefined as never, done: true };
            },
        };
    }

    /**
     * Create a collection with the given range.
     *
     * @param from - Starting number of the range
     * @param to - Ending number of the range
     * @param step - Step size for the range
     * @returns A new Collection instance containing the range of numbers
     *
     * @example
     *
     * Collection.range(1, 5); -> new Collection({0: 1, 1: 2, 2: 3, 3: 4, 4: 5})
     * Collection.range(1, 10, 2); -> new Collection({0: 1, 1: 3, 2: 5, 3: 7, 4: 9})
     */
    static range(
        from: number,
        to: number,
        step: number = 1,
    ) {
        const rangeArray: number[] = [];

        for (let i = from; i <= to; i += step) {
            rangeArray.push(i);
        }

        return new Collection<number, number>(rangeArray);
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
    median(key: null = null): number | null {
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

        return new Collection([
            values.get(middle - 1) as number,
            values.get(middle) as number,
        ]).average();
    }

    /**
     * Get the mode of a given key.
     *
     * @param key - The key to calculate the mode for, or null for the values themselves
     * @returns An array of the most frequently occurring values, or null if the collection is empty
     *
     * @example
     *
     * new Collection([1, 2, 2, 3, 3, 3]).mode(); -> [3]
     * new Collection([1, 1, 2, 2, 3, 3]).mode(); -> [1, 2, 3]
     * new Collection([{value: 1}, {value: 2}, {value: 2}, {value: 3}, {value: 3}, {value: 3}]).mode('value'); -> [3]
     * new Collection([{value: 1}, {value: 1}, {value: 2}, {value: 2}, {value: 3}, {value: 3}]).mode('value'); -> [1, 2, 3]
     */
    mode(key: null = null): number[] | null {
        if (this.count() === 0) {
            return null;
        }

        const collection = !isNull(key) ? this.pluck(key) : this;

        const counts = new Collection();

        collection.each((keyValue) => {
            counts.set(keyValue, (counts.get(keyValue) ?? 0) as number + 1);
        });

        const sorted = counts.sort();

        const highestCount = sorted.last();

        return sorted
            .filter((value) => value === highestCount)
            .sort()
            .keys()
            .values();
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
        return new Collection(dataCollapse<TValue, TKey>(this.items));
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
            return new Collection();
        }

        if (isObject(this.items)) {
            const resultsObj = {} as Record<TKey, TValue>;

            for (const [key, value] of Object.entries(
                this.items as Record<PropertyName, TValue>,
            )) {
                if (resultsObj[key as TKey]) {
                    continue;
                }

                resultsObj[key as TKey] = value;
            }

            if (Object.keys(resultsObj).length > 0) {
                return new Collection(resultsObj);
            }
        }

        const resultsArr = [];
        for (const value of Object.values(
            this.items as Record<PropertyName, TValue>,
        )) {
            if (isArray(value)) {
                resultsArr.push(...value);
            } else {
                resultsArr.push(value);
            }
        }

        if (resultsArr.length > 0) {
            return new Collection(resultsArr);
        }

        return new Collection();
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
    contains(
        key: ((value: TValue, index: TKey) => boolean) | TValue | PathKey,
        operator: unknown = null,
        value: unknown = null,
    ): boolean {
        if (value === null && operator === null) {
            if (isFunction(key)) {
                const callback = key as (
                    value: TValue,
                    index: string | number,
                ) => boolean;
                return dataContains(this.items, callback);
            }

            return dataContains(this.items, key);
        }

        return this.contains(this.operatorForWhere(key, operator, value));
    }

    /**
     * Determine if an item exists in the collection using strict comparison.
     *
     * @param key - The value to search for
     * @returns True if the item exists using strict comparison, false otherwise
     *
     * @example
     *
     * new Collection([1, 2, 3]).containsStrict(2); -> true
     * new Collection([1, 2, 3]).containsStrict('2'); -> false
     */
    containsStrict(
        key: ((value: TValue, index: TKey) => boolean) | TValue | TKey,
        value: TValue | null = null,
    ): boolean {
        if (value !== null) {
            return this.contains((item) => dataGet(item, key) === value);
        }

        if (isFunction(key)) {
            return !isNull(this.first(key));
        }

        return dataContains(this.items, (value: unknown) => value === key);
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
    doesntContain(
        key: ((value: TValue, index: TKey) => boolean) | TValue | string,
        operator: unknown = null,
        value: unknown = null,
    ) {
        return !this.contains(key, operator, value);
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
    doesntContainStrict(
        key: ((value: TValue, index: TKey) => boolean) | TValue | TKey,
        value: TValue | null = null,
    ): boolean {
        return !this.containsStrict(key, value);
    }

    /**
     * Cross join with the given lists, returning all possible permutations.
     *
     * @param items - The lists to cross join with
     * @returns A new collection with the cross joined items
     *
     * @example
     *
     * new Collection([1, 2]).crossJoin([3, 4]); -> new Collection([[1, 3], [1, 4], [2, 3], [2, 4]])
     * new Collection({a: 1, b: 2}).crossJoin({c: 3, d: 4}); -> new Collection([{a: 1, c: 3}, {a: 1, d: 4}, {b: 2, c: 3}, {b: 2, d: 4}])
     */
    crossJoin(
        ...items: Array<DataItems<TValue, TKey> | Collection<TValue, TKey>>
    ) {
        const results = dataCrossJoin(
            this.items,
            ...items.map((item) => this.getRawItems(item)),
        ) as DataItems<TValue, TKey>[];

        return new Collection(results);
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
    diff(items: DataItems<TValue, TKey> | Collection<TValue, TKey>) {
        return new Collection(
            dataDiff<TValue, TKey>(this.items, this.getRawItems(items)),
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
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
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
                (results as Record<TKey, TValue>)[key as TKey] =
                    value as TValue;
            }
        }

        return new Collection(results);
    }

    /**
     * Get the items in the collection whose keys and values are not present in the given items.
     * 
     * TODO: validate parity with Laravel's implementation
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
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
    ) {
        return new Collection(
            dataDiff<TValue, TKey>(this.items, this.getRawItems(items)),
        );
    }

    /**
     * Get the items in the collection whose keys and values are not present in the given items, using the callback.
     * 
     * TODO: validate parity with Laravel's implementation
     * 
     * @param items - The items to diff against
     * @param callback - The callback function to determine equality
     * @returns A new collection with the difference
     * 
     * @example
     * 
     * new Collection({a: {id: 1}, b: {id: 2}, c: {id: 3}}).diffAssocUsing({b: {id: 2}}, (a, b) => a.id === b.id); -> new Collection({a: {id: 1}, c: {id: 3}})
     * new Collection({a: {id: 1}, b: {id: 2}, c: {id: 3}}).diffAssocUsing({b: {id: 3}}, (a, b) => a.id === b.id); -> new Collection({a: {id: 1}, b: {id: 2}, c: {id: 3}})
     * new Collection({a: {id: 1}, b: {id: 2}, c: {id: 3}}).diffAssocUsing({d: {id: 4}}, (a, b) => a.id === b.id); -> new Collection({a: {id: 1}, b: {id: 2}, c: {id: 3}})
     */
    diffAssocUsing(
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
        callback: (a: TValue, b: TValue) => boolean,
    ) {
        return this.diffUsing(items, callback);
    }

    /**
     * Get the items in the collection whose keys are not present in the given items.
     * 
     * TODO: validate parity with Laravel's implementation
     * 
     * @param items - The items to diff against
     * @returns A new collection with the difference
     * 
     * @example
     * 
     * new Collection({a: 1, b: 2, c: 3}).diffKeys({b: 2}); -> new Collection({a: 1, c: 3})
     * new Collection([1, 3, 5]).diffKeys([1, 3, 5, 7, 8]); -> new Collection([1, 3, 5])
     */
    diffKeys(
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
    ) {
        const otherItems = this.getRawItems(items);
        const results = {} as DataItems<TValue, TKey>;

        for (const [key, value] of Object.entries(
            this.items as Record<TKey, TValue>,
        )) {
            if (!(key in otherItems)) {
                (results as Record<TKey, TValue>)[key as TKey] =
                    value as TValue;
            }
        }

        if (isArray(this.items)) {
            return new Collection(Object.values(results) as TValue[]);
        }

        return new Collection(results);
    }

    /**
     * Retrieve duplicate items from the collection.
     * 
     * TODO: validate parity with Laravel's implementation
     * 
     * @param callback - The callback function to determine the value to check for duplicates, or a string key, or null to use the values themselves
     * @param strict - Whether to use strict comparison (===) or not (==)
     * @returns A new collection with the duplicate items
     * 
     * @example
     * 
     * new Collection([1, 2, 2, 3, 3, 3]).duplicates(); -> new Collection([2, 2, 3, 3, 3])
     * new Collection([{id: 1}, {id: 2}, {id: 2}, {id: 3}, {id: 3}, {id: 3}]).duplicates('id'); -> new Collection([{id: 2}, {id: 2}, {id: 3}, {id: 3}, {id: 3}])
     * new Collection([1, '1', 2, '2', 2]).duplicates(null, true); -> new Collection([2, 2])
     * new Collection([{id: 1}, {id: '1'}, {id: 2}, {id: '2'}, {id: 2}]).duplicates('id', true); -> new Collection([{id: 2}, {id: 2}])
     * new Collection([{id: 1}, {id: 1}, {id: 2}, {id: 2}]).duplicates((item) => item.id > 1); -> new Collection([{id: 2}, {id: 2}])
     */
    duplicates<TMapValue>(
        callback: ((value: TValue, key: TKey) => TMapValue) | PathKey = null,
        strict: boolean = false,
    ) {
        const items = this.map(this.valueRetriever(callback as PathKey | ((...args: (TValue | TKey)[]) => TMapValue)));

        const uniqueItems = items.unique(null, strict);

        const compare = this.duplicateComparator(strict);

        const duplicatesItems = {} as DataItems<TValue, TKey>;

        for (const [key, value] of Object.entries(
            items.items as Record<TKey, TValue>,
        )) {
            if (uniqueItems.isNotEmpty() && compare(value as TValue, uniqueItems.first() as TValue)) {
                uniqueItems.shift();
            } else {
                (duplicatesItems as Record<TKey, TValue>)[key as TKey] = value as TValue;
            }
        }

        if (isArray(this.items)) {
            return new Collection(Object.values(duplicatesItems) as TValue[]);
        }

        return new Collection(duplicatesItems);
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
     * @param strict - Whether to use strict comparison (===) or not (==)
     * @returns A comparison function for detecting duplicates
     */
    duplicateComparator(strict: boolean) {
        if (strict) {
            return (a: TValue, b: TValue) => a === b;
        }

        return (a: TValue, b: TValue) => a == b;
    }

    /**
     * Get all items except for those with the specified keys.
     * 
     * @param keys - The keys to exclude, or a collection of keys
     * @returns A new collection without the specified keys
     * 
     * @example
     * 
     * new Collection({a: 1, b: 2, c: 3}).except(['a', 'c']); -> new Collection({b: 2})
     * new Collection({a: 1, b: 2, c: 3}).except(new Collection(['a', 'c'])); -> new Collection({b: 2})
     * new Collection([1, 2, 3, 4]).except([0, 2]); -> new Collection([1, 3])
     * new Collection([1, 2, 3, 4]).except(new Collection([0, 2])); -> new Collection([1, 3])
     */
    except(keys: PathKeys | Collection<TKey>) {
        if (isNull(keys) || isUndefined(keys)) {
            return new Collection(this.items);
        }

        keys = this.getRawItems(keys) as PathKey[];

        return new Collection(dataExcept(this.items, keys));
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
    filter(
        callback?: ((value: TValue, key: TKey) => boolean) | null,
    ) {
        return new Collection(dataFilter(this.items, callback));
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
        callback: ((value: TValue, key: TKey) => boolean) | null = null,
        defaultValue?: TFirstDefault | (() => TFirstDefault),
    ) {
        return dataFirst<TValue, TKey, TFirstDefault>(this.items, callback, defaultValue);
    }

    /**
     * Get a flattened array of the items in the collection.
     * 
     * @param depth - The depth to flatten to, defaults to Infinity
     * @returns A new collection with flattened items
     * 
     * @example
     * 
     * new Collection([1, [2, [3, 4]], 5]).flatten(); -> new Collection([1, 2, 3, 4, 5])
     * new Collection([1, [2, [3, 4]], 5]).flatten(1); -> new Collection([1, 2, [3, 4], 5])
     * new Collection({a: 1, b: {c: 2, d: {e: 3}}}).flatten(); -> new Collection({a: 1, c: 2, e: 3})
     * new Collection({a: 1, b: {c: 2, d: {e: 3}}}).flatten(1); -> new Collection({a: 1, c: 2, d: {e: 3}})
     */
    flatten(depth: number = Infinity) {
        return new Collection(dataFlatten(this.items, depth) as DataItems<TValue, TKey>);
    }

    /**
     * Flip the items in the collection.
     * 
     * @returns A new collection with flipped items
     *
     * @example
     *
     * new Collection([1, 2, 3]).flip(); -> new Collection([{1: 0}, {2: 1}, {3: 2}])
     * new Collection([{one: 'b', two: {hi: 'hello', skip: 'bye'}}]).flip(); -> new Collection([{b: 'one', {hello: 'hi', bye: 'skip'}}])
     */
    flip() {
        return new Collection(dataFlip(this.items));
    }

    /**
     * Remove one or more items from the collection by key or keys.
     * 
     * @param keys - The key or keys to remove, or a collection of keys
     * @returns The collection instance after removing the specified keys
     * 
     * @example
     * 
     * new Collection({a: 1, b: 2, c: 3}).forget('b'); -> new Collection({a: 1, c: 3})
     * new Collection({a: 1, b: 2, c: 3}).forget(['a', 'c']); -> new Collection({b: 2})
     * new Collection({a: 1, b: 2, c: 3}).forget(new Collection(['a', 'c'])); -> new Collection({b: 2})
     * new Collection([1, 2, 3, 4]).forget(1); -> new Collection([1, 3, 4])
     * new Collection([1, 2, 3, 4]).forget([0, 2]); -> new Collection([2, 4])
     * new Collection([1, 2, 3, 4]).forget(new Collection([0, 2])); -> new Collection([2, 4])
     */
    forget(keys: PathKeys | Collection<TKey>) {
        if (isNull(keys) || isUndefined(keys)) {
            return new Collection(this.items);
        }

        keys = this.getRawItems(keys) as PathKey[];

        this.items = dataForget(this.items, keys);

        return this;
    }

    /**
     * Set an item in the collection by key.
     *
     * @param key - The key to set
     * @param value - The value to set
     * @returns The collection instance after setting the item
     *
     * @example
     *
     * new Collection({a: 1, b: 2}).set('c', 3); -> new Collection({a: 1, b: 2, c: 3})
     * new Collection([1, 2, 3]).set(1, 4); -> new Collection([1, 4, 3])
     */
    set(
        key: PathKey,
        value: TValue,
    ) {
        this.items = dataSet(this.items, key, value);

        return this;
    }

    /**
     * Get an item from the collection by key.
     *
     * @param key - The key to get
     * @param defaultValue - The default value to return if key doesn't exist
     * @returns The value at the key or default value
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).get('b'); -> 2
     * new Collection({a: 1, b: 2, c: 3}).get('d', 'default'); -> 'default'
     */
    get<TGetDefault = null>(
        key: PathKey,
        defaultValue?: TGetDefault | (() => TGetDefault),
    ): TValue | TGetDefault | null {
        return dataGet(this.items, key, defaultValue);
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
        if (this.has(key)) {
            return this.get(key) as TValue;
        }

        if (isFunction(value)) {
            value = value();
        }

        this.items = dataSet(this.items, key, value);

        return value;
    }

    /**
     * Group an array or object by a field or using a callback, array of keys, or key/index
     * 
     * @param groupByValue - The key to group by, a callback function, or an array of keys/callbacks for nested grouping
     * @param preserveKeys - Whether to preserve the original keys in the grouped collections
     * @returns A new collection with grouped items
     * 
     * @example
     * 
     * new Collection([{age: 20}, {age: 30}]).groupBy('age'); -> new Collection({20: Collection([{age: 20}]), 30: Collection([{age: 30}])})
     * new Collection([{age: 20}, {age: 30}, {age: 20}]).groupBy('age', true); -> new Collection({20: Collection({0: {age: 20}, 2: {age: 20}}), 30: Collection({1: {age: 30}})})
     * new Collection([{name: 'Alice', age: 20}, {name: 'Bob', age: 30}, {name: 'Charlie', age: 20}]).groupBy(['age', 'name']); -> new Collection({20: Collection({'Alice': Collection([{name: 'Alice', age: 20}]), 'Charlie': Collection([{name: 'Charlie', age: 20}])}), 30: Collection({'Bob': Collection([{name: 'Bob', age: 30}])})})
     * new Collection([{name: 'Alice', age: 20}, {name: 'Bob', age: 30}, {name: 'Charlie', age: 20}]).groupBy([item => item.age, 'name'], true); -> new Collection({20: Collection({'0': Collection({0: {name: 'Alice', age: 20}}), '2': Collection({2: {name: 'Charlie', age: 20}})}), 30: Collection({'1': Collection({1: {name: 'Bob', age: 30}})})})
     */
    groupBy<TGroupKey extends TKey = TKey>(
        groupByValue: ((value: TValue, index: TKey) => TGroupKey) | ArrayItems<TGroupKey> | PathKey,
        preserveKeys: boolean = false,
    ): Collection<Collection<TValue, TKey>, TGroupKey> {

        let nextGroups: ArrayItems<TGroupKey> | null = null;
        if (!isFunction(groupByValue) && isArray(groupByValue)) {
            nextGroups = groupByValue;

            groupByValue = nextGroups.shift();
        }

        groupByValue = this.valueRetriever(groupByValue as PathKey | ((...args: (TValue | TKey)[]) => TGroupKey));

        const results = {} as Record<TGroupKey, Collection<TValue, TKey>>;

        const normalizeGroupKey = (groupKey: unknown) => {
            if (isBoolean(groupKey)) {
                return groupKey ? 1 : 0;
            }

            if (isNull(groupKey) || isUndefined(groupKey)) {
                return String(groupKey);
            }

            if (isObject(groupKey) || isArray(groupKey)) {
                return JSON.stringify(groupKey);
            }

            return groupKey as TGroupKey | string | number;
        }

        for (const [key, value] of Object.entries(
            this.items as Record<TKey, TValue>,
        )) {
            const groupKeys = arrWrap(groupByValue(value as TValue, key as TKey));

            for (let groupKey of groupKeys) {
                groupKey = normalizeGroupKey(groupKey);

                if (!results[groupKey]) {
                    results[groupKey] = new Collection();
                }

                results[groupKey]!.offsetSet(preserveKeys ? key : null, value);
            }
        }

        const result = new Collection(results);

        if (isArray(nextGroups) && nextGroups.length > 0) {
            return result.map((group: Collection<TValue, TKey>) => {
                return group.groupBy(nextGroups, preserveKeys);
            });
        }

        return result;
    }

    /**
     * Key an array or object by a field or using a callback, array, or key/index
     * 
     * @param keyByValue - The key to key by, or a callback function
     * @returns A new collection with keyed items
     * 
     * @example
     * 
     * new Collection([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]).keyBy('id'); -> new Collection({1: {id: 1, name: 'John'}, 2: {id: 2, name: 'Jane'}})
     * new Collection([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]).keyBy(item => item.name); -> new Collection({'John': {id: 1, name: 'John'}, 'Jane': {id: 2, name: 'Jane'}})
     * new Collection([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]).keyBy(['id', 'name']); -> new Collection({'1.John': {id: 1, name: 'John'}, '2.Jane': {id: 2, name: 'Jane'}})
     */
    keyBy<TNewKey extends TKey = TKey>(
        keyByValue: ((value: TValue, index: TKey) => TNewKey) | ArrayItems<TNewKey> | PathKey,
    ) {
        const keyByValueCallback = this.valueRetriever(keyByValue);

        const results = {} as Record<TNewKey, TValue>;

        for (const [key, value] of Object.entries(
            this.items as Record<TKey, TValue>,
        )) {
            let resolvedKey = keyByValueCallback(value as TValue, key as TKey);

            if (isObject(resolvedKey)) {
                resolvedKey = JSON.stringify(resolvedKey) as TNewKey;
            }

            if (isArray(resolvedKey)) {
                resolvedKey = resolvedKey.join('.') as TNewKey;
            }

            (results as Record<TNewKey, TValue>)[resolvedKey as TNewKey] = value as TValue;
        }

        return new Collection(results);
    }

    /**
     * Determine if an item exists in the collection by key.
     *
     * @param key - The key or keys to check for
     * @returns True if all keys exist, false otherwise
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).has('a'); -> true
     * new Collection({a: 1, b: 2, c: 3}).has(['a', 'b']); -> true
     * new Collection({a: 1, b: 2, c: 3}).has(['a', 'd']); -> false
     */
    has(key: PathKey): boolean {
        if (isArray(key)) {
            return dataHasAll(this.items, key);
        }

        return dataHas(this.items, key);
    }

    /**
     * Determine if any of the keys exist in the collection.
     * 
     * @param key - The key or keys to check for
     * @returns True if any key exists, false otherwise
     * 
     * @example
     * 
     * new Collection({a: 1, b: 2, c: 3}).hasAny('a'); -> true
     * new Collection({a: 1, b: 2, c: 3}).hasAny(['a', 'd']); -> true
     * new Collection({a: 1, b: 2, c: 3}).hasAny(['d', 'e']); -> false
     */
    hasAny(key: PathKeys) {
        if (this.isEmpty()) {
            return false;
        }

        return dataHasAny(this.items, key);
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
    implode(
        value: ((item: TValue, key: TKey) => unknown) | string | null = null,
        glue: string | null = null,
    ) {
        const joinItems = (items: Array<unknown> | Record<string, unknown>) => {
            if (isArray(items)) {
                return items.join(glue ?? '');
            }

            return Object.values(items).join(glue ?? '');
        }

        if (isFunction(value)) {
            const items = this.map(value).all();

            return joinItems(items);
        }

        const first = this.first();

        if (!isNull(value)) {
            if (isArray(first) || (isObject(first) && !isStringable(first))) {
                const items = this.pluck(value).all();

                return joinItems(items);
            }
        }

        return joinItems(this.all());
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
    intersect(
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
    ) {
        return new Collection(
            dataIntersect<TValue, TKey>(
                this.items,
                this.getRawItems(items),
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
    intersectUsing(
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
        callback: (a: TValue, b: TValue) => boolean,
    ) {
        return new Collection(
            dataIntersect<TValue, TKey>(
                this.items,
                this.getRawItems(items),
                callback,
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
    intersectByKeys(
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
    ) {
        return new Collection(
            dataIntersectByKeys<TValue, TKey>(
                this.items,
                this.getRawItems(items),
            ),
        );
    }

    /**
     * Intersect the collection with the given items by key, using the callback.
     * 
     * @param items - The items to intersect with
     * @param callback - The callback function to determine equality
     * @returns A new collection with the intersected items
     * 
     * @example 
     * 
     * new Collection({a: {id: 1}, b: {id: 2}, c: {id: 3}}).intersectByKeysUsing({b: {id: 2}}, (a, b) => a.id === b.id); -> new Collection({b: {id: 2}})
     * new Collection([{key: 'a'}, {key: 'b'}, {key: 'c'}]).intersectByKeysUsing([{key: 'b'}], (a, b) => a.key === b.key); -> new Collection([{key: 'b'}])
     */
    intersectByKeysUsing(
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
        callback: (a: TValue, b: TValue) => boolean,
    ) {
        return new Collection(
            dataIntersectByKeys<TValue, TKey>(
                this.items,
                this.getRawItems(items),
                callback,
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
        return isArray(this.items) ? this.items.length === 0 : Object.keys(this.items).length === 0;
    }

    /**
     * Determine if the collection contains exactly one item. If a callback is provided, determine if exactly one item matches the condition.
     * 
     * @param callback - The callback function to test with, or null
     * @returns True if exactly one item exists or matches the condition, false otherwise
     * 
     * @example
     * 
     * new Collection([1]).containsOneItem(); -> true
     * new Collection([]).containsOneItem(); -> false
     * new Collection([1, 2, 3]).containsOneItem(x => x >= 2); -> false
     * new Collection([1, 2, 3]).containsOneItem(x => x < 2); -> true
     */
    containsOneItem(
        callback: ((value: TValue, key: TKey) => boolean) | null = null
    ) {
        if (isFunction(callback)) {
            return this.filter(callback).count() === 1;
        }

        return this.count() === 1;
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
    join(
        glue: string,
        finalGlue: string = '',
    ) {
        if (finalGlue === '') {
            return this.implode(glue);
        }

        const count = this.count();

        if (count === 0) {
            return '';
        }

        if (count === 1) {
            return this.last();
        }

        const collection = new Collection(this.items);

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
    keys(): Collection<string | number> {
        return new Collection(dataKeys(this.items)) as Collection<string | number>;
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
        callback?: ((value: TValue, key: string | number) => boolean) | null,
        defaultValue?: D | (() => D),
    ): TValue | D | null {
        const result = dataLast(this.items, callback, defaultValue);
        return result === undefined ? null : result;
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
    pluck(
        value: string | ((item: TValue) => TValue),
        key: string | ((item: TValue) => string | number) | null = null,
    ): Collection<TValue, TKey> {
        return new Collection<TValue, TKey>(dataPluck(this.items, value, key));
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
    map<TMapValue>(
        callback: (value: TValue, key: TKey) => TMapValue,
    ): Collection<TMapValue> {
        return new Collection<TMapValue>(dataMap(this.items, callback));
    }

    /**
     * Run a dictionary map over the items.
     *
     * The callback should return an array with two elements: [key, value] or an object with a single key/value pair.
     * 
     * @param callback - The callback function to map with
     * @returns A new collection with mapped items as a dictionary
     * 
     * @example
     * 
     * new Collection([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]).mapToDictionary(item => ({[item.id]: item.name})); -> new Collection({1: 'John', 2: 'Jane'})
     * new Collection([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]).mapToDictionary(item => [item.id, item.name]); -> new Collection({1: 'John', 2: 'Jane'})
     */
    mapToDictionary<TMapToDictionaryValue, TMapToDictionaryKey extends ObjectKey = ObjectKey>(
        callback: (value: TValue, key: TKey) => Record<TMapToDictionaryKey, TMapToDictionaryValue>,
    ) {
        const dictionary = {} as Record<TMapToDictionaryKey, TMapToDictionaryValue>;

        for (const [key, value] of Object.entries(
            this.items as Record<TKey, TValue>,
        )) {
            const mapped = callback(value as TValue, key as TKey);

            if (isArray(mapped)) {
                if (mapped.length !== 2) {
                    throw new Error('When returning an array from the mapToDictionary callback, it must have exactly two elements: [key, value]');
                }

                const [mappedKey, mappedValue] = mapped;

                dictionary[mappedKey as TMapToDictionaryKey] = mappedValue as TMapToDictionaryValue;
                continue;
            }

            for (const [mappedKey, mappedValue] of Object.entries(mapped)) {
                dictionary[mappedKey as TMapToDictionaryKey] = mappedValue as TMapToDictionaryValue;
            }
        }

        return new Collection(dictionary);
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
    mapWithKeys<TMapWithKeysValue, TMapWithKeysKey extends ObjectKey = ObjectKey>(
        callback: (value: TValue, key: TKey) => Record<TMapWithKeysKey, TMapWithKeysValue>,
    ) {
        return new Collection(dataMapWithKeys(this.items, callback));
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
    merge(
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
    ) {
        items = this.getRawItems(items);

        if (isArray(this.items) && isArray(items)) {
            return new Collection([...this.items, ...items]);
        }

        if (isObject(this.items) && isObject(items)) {
            return new Collection({ ...this.items, ...items });
        }

        if (isArray(this.items)) {
            return new Collection([...this.items, items]);
        }

        if (isObject(items)) {
            return new Collection([this.items, items]);
        }

        return new Collection([this.items, items]);
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
    mergeRecursive<TMergeRecursiveValue>(
        items: DataItems<TMergeRecursiveValue, TKey> | Collection<TMergeRecursiveValue, TKey>,
    ) {
        const otherItems = this.getRawItems(items);

        // Helper function to recursively merge two values
        const mergeRecursively = (
            target: unknown,
            source: unknown
        ): unknown => {
            if (isArray(target) && isArray(source)) {
                return [...target, ...source];
            }

            if (isObject(target) && !isArray(target) && isObject(source) && !isArray(source)) {
                const result = { ...target };

                for (const [key, value] of Object.entries(source)) {
                    if (key in result) {
                        result[key] = mergeRecursively(result[key], value);
                    } else {
                        // Add new key from source
                        result[key] = value;
                    }
                }

                return result;
            }

            return source;
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

            return new Collection(result as TValue[]);
        }

        if (isObject(this.items) && isObject(otherItems)) {
            const result = mergeRecursively(
                this.items,
                otherItems
            ) as Record<TKey, TValue | TMergeRecursiveValue>;

            return new Collection(result);
        }

        return this.merge(items as DataItems<TValue, TKey>) as Collection<TValue | TMergeRecursiveValue, TKey>;
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
        const newCollection = new Collection();

        for (let i = 0; i < multiplier; i++) {
            newCollection.push(...this.getItemValues(this.items));
        }

        return newCollection;
    }

    /**
     * Create a collection by using this collection for keys and another for its values.
     * 
     * @param values - The values to combine with the keys from this collection
     * @returns A new collection with the combined keys and values
     * 
     * @example
     * 
     * new Collection([1, 2]).combine([3, 4]); -> new Collection({1: 3, 2: 4})
     * new Collection({a: 1, b: 2}).combine({c: 3, d: 4}); -> new Collection({a: 3, b: 4})
     * new Collection([1, 2]).combine({a: 3, b: 4}); -> new Collection({0: 3, 1: 4})
     */
    combine<TCombineValue>(
        values: DataItems<TCombineValue, TKey> | Collection<TCombineValue, TKey>,
    ) {
        return new Collection<TCombineValue, TKey>(dataCombine(this.items, this.getRawItems(values)));
    }

    /**
     * Union the collection with the given items.
     * 
     * @param items - The items to union with
     * @returns A new collection with the union of items
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).union([3, 4, 5]); -> new Collection([1, 2, 3, 4, 5])
     * new Collection({a: 1, b: 2}).union({b: 2, c: 3}); -> new Collection({a: 1, b: 2, c: 3})
     * new Collection([1, 2]).union({a: 3}); -> new Collection([1, 2, {a: 3}])
     */
    union(
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
    ) {
        return new Collection(
            dataUnion<TValue, TKey>(
                this.items,
                this.getRawItems(items),
            ),
        );
    }


    /**
     * Create a new collection consisting of every n-th element.
     * 
     * @param step - The step interval to take elements
     * @param offset - The offset to start from, defaults to 0
     * @returns A new collection with every n-th element
     * 
     * @example
     * 
     * new Collection([1, 2, 3, 4, 5]).nth(2); -> new Collection([1, 3, 5])
     * new Collection([1, 2, 3, 4, 5]).nth(2, 1); -> new Collection([2, 4])
     * new Collection({a: 1, b: 2, c: 3, d: 4}).nth(2); -> new Collection({a: 1, c: 3})
     * new Collection({a: 1, b: 2, c: 3, d: 4}).nth(2, 1); -> new Collection({b: 2, d: 4})
     */
    nth(step: number, offset: number = 0) {
        const newItems = [];

        let position = 0;

        for (const [_key, value] of Object.entries(
            this.slice(offset) as Record<TKey, TValue>,
        )) {
            if (position % step === 0) {
                newItems.push(value as TValue);
            }
            position++;
        }

        return new Collection(newItems);
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
    only(
        ...keys: PathKey[]
    ) {
        if (isNull(keys)) {
            return new Collection(this.items);
        }

        keys = keys.flatMap((key) => arrWrap(key)) as PathKey[];

        return new Collection(dataOnly<TValue, TKey>(this.items, keys));
    }

    /**
     * Select specific values from the items within the collection.
     * 
     * @param keys - The key or keys to select
     * @returns A new collection with only the selected values
     * 
     * @example
     * 
     * new Collection([{id: 1, name: 'John', age: 30}, {id: 2, name: 'Jane', age: 25}]).select('id', 'name'); -> new Collection([{id: 1, name: 'John'}, {id: 2, name: 'Jane'}])
     * new Collection({a: {id: 1, name: 'John'}, b: {id: 2, name: 'Jane'}}).select('id'); -> new Collection({a: {id: 1}, b: {id: 2}})
     * new Collection([{id: 1, details: {age: 30, city: 'NY'}}, {id: 2, details: {age: 25, city: 'LA'}}]).select(['id', 'details.age']); -> new Collection([{id: 1, details: {age: 30}}, {id: 2, details: {age: 25}}])
     */
    select(...keys: PathKey[]) {
        if (isNull(keys)) {
            return new Collection(this.items);
        }

        keys = keys.flatMap((key) => arrWrap(key)) as PathKey[];

        return new Collection(dataSelect<TValue, TKey>(this.items, keys));
    }

    /**
     * Get and remove the last N items from the collection.
     * 
     * @param count - The number of items to pop, defaults to 1
     * @returns A new collection with the popped items
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).pop(); -> new Collection([3])
     * new Collection([1, 2, 3]).pop(2); -> new Collection([2, 3])
     * new Collection({a: 1, b: 2, c: 3}).pop(); -> new Collection({c: 3})
     * new Collection({a: 1, b: 2, c: 3}).pop(2); -> new Collection({b: 2, c: 3})
     */
    pop(count: number = 1) {
        if (count < 1) {
            return new Collection();
        }

        if (this.isEmpty()) {
            return new Collection();
        }

        return new Collection(
            dataPop(this.items, count),
        );
    }

    /**
     * Push an item onto the beginning of the collection.
     * 
     * @param value - The value to prepend
     * @param key - The key to prepend the value at, or null to append
     * @returns The collection instance for chaining
     * 
     * @example
     * 
     * new Collection([2, 3]).prepend(1); -> new Collection([1, 2, 3])
     * new Collection({b: 2, c: 3}).prepend(1, 'a'); -> new Collection({a: 1, b: 2, c: 3})
     * new Collection([]).prepend(1); -> new Collection([1])
     * new Collection({}).prepend(1, 'a'); -> new Collection({a: 1})
     */
    prepend(value: TValue, key: TKey | null = null) {
        this.items = dataPrepend(this.items, value, key);

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
     * new Collection({a: 1}).push({b: 2}); -> new Collection({a: 1, b: 2})
     */
    push(...values: TValue[]) {
        const newItems = values.flatMap((value) => arrWrap(value));

        for (const [key, value] of Object.entries(newItems)) {
            this.items = dataPush(this.items, key, value);
        }

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
     * new Collection({b: 2}).unshift(1); -> new Collection({0: 1, b: 2})
     * new Collection({b: 2}).unshift({a: 1}, {c: 3}); -> new Collection({a: 1, c: 3, b: 2})
     */
    unshift(...values: TValue[]) {
        const newItems = values.flatMap((value) => arrWrap(value));

        for (const [key, value] of Object.entries(newItems)) {
            this.items = dataUnshift(this.items, key, value);
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
    concat<TConcatValue, TConcatKey extends ObjectKey = ObjectKey>(
        source: DataItems<TConcatValue, TConcatKey> | Collection<TConcatValue, TConcatKey>,
    ) {
        const result = new Collection(this.items);
        const items = this.getRawItems(source);

        for (const [_key, value] of Object.entries(items)) {
            result.push(value);
        }

        return result;
    }

    /**
     * Get a value from the array, and remove it.
     * 
     * @param key - The key path to pull
     * @param defaultValue - The default value to return if the key does not exist
     * @returns The value at the specified key, or the default value
     * 
     * @example
     * 
     * const collection = new Collection({a: 1, b: 2, c: 3});
     * collection.pull('b', 0); -> 2
     * collection.pull('d', 0); -> 0
     */
    pull<TPullDefault>(
        key: PathKey,
        defaultValue?: TPullDefault | (() => TPullDefault),
    ) {
        const result = dataPull(this.items, key, defaultValue);
        this.items = result.data;

        return result.value;
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
    put(key: TKey, value: TValue) {
        this.offset(key, value);

        return this;
    }

    /**
     * Get one or a specified number of items randomly from the collection.
     * 
     * @param count - The number of items to retrieve, a callback to determine the count, or null for a single item
     * @param preserveKeys - Whether to preserve the original keys, defaults to false
     * @returns A single random item or a new collection with the random items
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).random(); -> 2
     * new Collection([1, 2, 3]).random(2); -> new Collection([1, 3])
     * new Collection({a: 1, b: 2, c: 3}).random(2, true); -> new Collection({a: 1, c: 3})
     * new Collection([1, 2, 3]).random(collection => Math.floor(collection.count() / 2)); -> new Collection([2])
     * new Collection([]).random(); -> undefined
     */
    random(
        count?: ((collection: this) => number) | number | null,
        preserveKeys: boolean = false,
    ) {
        if (isNull(count)) {
            return dataRandom(this.items);
        }

        if (isFunction(count)) {
            const countValue = count(this) as number;
            return new Collection(dataRandom(this.items, countValue, preserveKeys) as DataItems<TValue, TKey>);
        }

        return new Collection(dataRandom(this.items, count as number, preserveKeys) as DataItems<TValue, TKey>);
    }

    /**
     * Replace the collection items with the given items.
     * @param items - The items to replace with
     * @returns A new collection with the replaced items
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).replace([4, 5]); -> new Collection([4, 5])
     * new Collection({a: 1, b: 2}).replace({c: 3}); -> new Collection({c: 3})
     * new Collection([1, 2]).replace({a: 3}); -> new Collection({a: 3})
     */
    replace(
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
    ) {
        return new Collection(
            dataReplace<TValue, TKey>(
                this.items,
                this.getRawItems(items),
            ),
        );
    }

    /**
     * Recursively replace the collection items with the given items.
     * 
     * @param items - The items to replace with
     * @returns A new collection with the recursively replaced items
     * 
     * @example
     * 
     * new Collection({a: {b: 1}}).replaceRecursive({a: {c: 2}}); -> new Collection({a: {c: 2}})
     * new Collection([1, [2, 3]]).replaceRecursive([4, [5]]); -> new Collection([4, [5]])
     * new Collection([1, {a: 2}]).replaceRecursive([{b: 3}, {a: 4}]); -> new Collection([{b: 3}, {a: 4}])
     */
    replaceRecursive(
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
    ) {
        return new Collection(
            dataReplaceRecursive<TValue, TKey>(
                this.items,
                this.getRawItems(items),
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
        return new Collection(
            dataReverse(this.items),
        );
    }

    /**
     * Search the collection for a given value and return the corresponding key if successful.
     * 
     * @param value - The value to search for, or a callback to determine a match
     * @param strict - Whether to use strict comparison, defaults to false
     * @returns The key of the found item, or false if not found
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).search(2); -> 1
     * new Collection({a: 1, b: 2, c: 3}).search(3); -> 'c'
     * new Collection([1, 2, 3]).search(x => x > 2); -> 2
     * new Collection([1, 2, 3]).search(4); -> false
     */
    search(
        value: TValue | ((item: TValue, key: TKey) => boolean),
        strict: boolean = false,
    ): TKey | false {
        return dataSearch(this.items, value, strict);
    }

    /**
     * Get the item before the given item.
     * 
     * @param value - The value to search for, or a callback to determine a match
     * @param strict - Whether to use strict comparison, defaults to false
     * @returns The item before the found item, or false if not found or no previous item
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).before(2); -> 1
     * new Collection({a: 1, b: 2, c: 3}).before(3); -> 2
     * new Collection([1, 2, 3]).before(x => x > 2); -> 2
     * new Collection([1, 2, 3]).before(1); -> false
     * new Collection([1, 2, 3]).before(4); -> false
     */
    before(
        value: TValue | ((item: TValue, key: TKey) => boolean),
        strict: boolean = false,
    ): TValue | false {
        return dataBefore(this.items, value, strict);
    }

    /**
     * Get the item after the given item.
     * 
     * @param value - The value to search for, or a callback to determine a match
     * @param strict - Whether to use strict comparison, defaults to false
     * @returns The item after the found item, or false if not found or no next item
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).after(2); -> 3
     * new Collection({a: 1, b: 2, c: 3}).after(2); -> 3
     * new Collection([1, 2, 3]).after(x => x < 2); -> 2
     * new Collection([1, 2, 3]).after(3); -> false
     * new Collection([1, 2, 3]).after(4); -> false
     */
    after(
        value: TValue | ((item: TValue, key: TKey) => boolean),
        strict: boolean = false,
    ): TValue | false {
        return dataAfter(this.items, value, strict);
    }

    /**
     * Get and remove the first N items from the collection.
     * 
     * @param count - The number of items to shift, defaults to 1
     * @returns A new collection with the shifted items, or null if the collection is empty
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).shift(); -> new Collection([1])
     * new Collection([1, 2, 3]).shift(2); -> new Collection([1, 2])
     * new Collection({a: 1, b: 2, c: 3}).shift(); -> new Collection({a: 1})
     * new Collection({a: 1, b: 2, c: 3}).shift(2); -> new Collection({a: 1, b: 2})
     * new Collection([]).shift(); -> null
     */
    shift(
        count: number = 1,
    ) {
        if (count < 0) {
            throw new Error('Number of shifted items may not be less than zero.');
        }

        if (this.isEmpty()) {
            return null;
        }

        const result = dataShift(this.items, count);
        this.items = result.data;

        return new Collection(result.value as DataItems<TValue, TKey>);
    }

    /**
     * Shuffle the items in the collection.
     * 
     * @returns A new collection with the items shuffled
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).shuffle(); -> new Collection([3, 1, 2])
     * new Collection({a: 1, b: 2, c: 3}).shuffle(); -> new Collection({b: 2, c: 3, a: 1})
     */
    shuffle() {
        return new Collection(
            dataShuffle(this.items),
        );
    }

    /**
     * Create chunks representing a "sliding window" view of the items in the collection.
     * 
     * @param size - The size of each chunk, defaults to 2
     * @param step - The number of items to skip between chunks, defaults to 1
     * @returns A new collection with the sliding window chunks
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
    ) {
        const chunks = Math.floor((this.count() / size) / step) + 1;

        return Collection.times(
            chunks,
            (count: number) => this.slice((count - 1) * step, size)
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
    skip(
        count: number,
    ) {
        return this.slice(count);
    }

    /**
     * Slice the underlying collection array.
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
    slice(
        offset: number,
        length: number | null = null,
    ) {
        return new Collection(
            dataSlice(this.items, offset, length),
        );
    }

    /**
     * Split a collection into a certain number of groups.
     * 
     * @param numberOfGroups - The number of groups to split into
     * @returns A new collection with the split groups
     * 
     * @example
     * 
     * new Collection([1, 2, 3, 4]).split(2); -> new Collection([ new Collection([1, 2]), new Collection([3, 4]) ])
     * new Collection({a: 1, b: 2, c: 3, d: 4}).split(2); -> new Collection([ new Collection({a: 1, b: 2}), new Collection({c: 3, d: 4}) ])
     * new Collection([1, 2, 3]).split(5); -> new Collection([ new Collection([1]), new Collection([2]), new Collection([3]) ])
     */
    split(
        numberOfGroups: number,
    ) {
        const groups = new Collection();

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
                    new Collection(
                        this.slice(start, size).items
                    )
                )

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
     * 
     * @example
     * 
     * new Collection([1, 2, 3, 4]).splitIn(2); -> new Collection([ new Collection([1, 2]), new Collection([3, 4]) ])
     * new Collection({a: 1, b: 2, c: 3, d: 4}).splitIn(2); -> new Collection([ new Collection({a: 1, b: 2}), new Collection({c: 3, d: 4}) ])
     * new Collection([1, 2, 3]).splitIn(5); -> new Collection([ new Collection([1]), new Collection([2]), new Collection([3]) ])
     */
    splitIn(
        numberOfGroups: number
    ) {
        return this.chunk(Math.ceil(this.count() / numberOfGroups));
    }

    /**
     * Get the first item in the collection, but only if exactly one item exists. Otherwise, throw an exception.
     * 
     * @param key - The key or callback to determine the item to retrieve, or null for the first item
     * @param operator - The operator to use for comparison, or null if key is a callback or null
     * @param value - The value to compare against, or null if key is a callback or null
     * @returns The single item in the collection
     * 
     * @example
     * 
     * new Collection([1]).sole(); -> 1
     * new Collection([{id: 1}, {id: 2}]).sole('id', '==', 1); -> {id: 1}
     * new Collection([{id: 1}, {id: 2}]).sole(item => item.id === 2); -> {id: 2}
     */
    sole(
        key: PathKey | ((value: TValue, index: TKey) => boolean) | null = null,
        operator: string | null = null,
        value: unknown = null,
    ) {
        const filter = arguments.length > 1
            ? this.operatorForWhere(key, operator, value)
            : key;

        const items = this.unless(isNull(filter)).filter(filter);

        const count = items.count();

        if (count === 0) {
            throw new Error('No items found in the collection.');
        }

        if (count > 1) {
            throw new Error('Multiple items found in the collection.');
        }

        return items.first();
    }

    /**
     * Get the first item in the collection but throw an exception if no matching items exist.
     * 
     * @param key - The key or callback to determine the item to retrieve
     * @param operator - The operator to use for comparison, or null if key is a callback
     * @param value - The value to compare against, or null if key is a callback
     * @returns The first matching item in the collection
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).firstOrFail(); -> 1
     * new Collection([{id: 1}, {id: 2}]).firstOrFail('id', '==', 2); -> {id: 2}
     * new Collection([{id: 1}, {id: 2}]).firstOrFail(item => item.id === 1); -> {id: 1}
     * new Collection([]).firstOrFail(); -> Error: No items found in the collection.
     */
    firstOrFail(
        key: PathKey | ((value: TValue, index: TKey) => boolean),
        operator: string | null = null,
        value: unknown = null,
    ) {
        const filter = arguments.length > 1
            ? this.operatorForWhere(key, operator, value)
            : key;

        const placeholder = null;

        const item = this.first(filter, placeholder);

        if (item === placeholder) {
            throw new Error('No items found in the collection.');
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
        preserveKeys: boolean = false,
    ) {
        if (size < 0) {
            return new Collection();
        }

        const chunks = [];

        for (const chunk of dataChunk(this.items, size, preserveKeys)) {
            chunks.push(new Collection(chunk));
        }

        return new Collection(chunks);
    }

    /**
     * Sort through each item with a callback.
     * 
     * @param callback - The callback to determine the sort order, a path key to get values from and compare, or null for default sort
     * @returns A new collection with the sorted items
     * 
     * @example
     * 
     * new Collection([3, 1, 2]).sort(); -> new Collection([1, 2, 3])
     * new Collection([{id: 2}, {id: 1}, {id: 3}]).sort('id'); -> new Collection([{id: 1}, {id: 2}, {id: 3}])
     * new Collection([{id: 2}, {id: 1}, {id: 3}]).sort((a, b) => a.id - b.id); -> new Collection([{id: 1}, {id: 2}, {id: 3}])
     */
    sort(
        callback: ((a: TValue, b: TValue) => unknown) | string | null = null,
    ) {
        return new Collection(
            dataSort(this.items, callback),
        );
    }

    /**
     * Sort items in descending order.
     * 
     * @param callback - The callback to determine the sort order, a path key to get values from and compare, or null for default sort
     * @returns A new collection with the sorted items in descending order
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).sortDesc(); -> new Collection([3, 2, 1])
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).sortDesc('id'); -> new Collection([{id: 3}, {id: 2}, {id: 1}])
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).sortDesc((a, b) => b.id - a.id); -> new Collection([{id: 3}, {id: 2}, {id: 1}])
     */
    sortDesc(
        callback: ((a: TValue, b: TValue) => unknown) | string | null = null,
    ) {
        return new Collection(
            this.sort(callback).reverse().all(),
        );
    }

    /**
     * Sort the collection using the given callback.
     * 
     * @param callback - The callback to determine the sort value, a path key to get values from and compare, or an array of such callbacks/keys for multi-level sorting
     * @param descending - Whether to sort in descending order, defaults to false
     * @returns A new collection with the sorted items
     * 
     * @example
     *
     * new Collection([{id: 1}, {id: 2}, {id: 3}]).sortBy('id'); -> new Collection([{id: 1}, {id: 2}, {id: 3}])
     * new Collection([{id: 3}, {id: 1}, {id: 2}]).sortBy('id', true); -> new Collection([{id: 3}, {id: 2}, {id: 1}])
     * new Collection([{id: 2}, {id: 1}, {id: 3}]).sortBy(item => item.id); -> new Collection([{id: 1}, {id: 2}, {id: 3}])
     * new Collection([{id: 2}, {id: 1}, {id: 3}]).sortBy(item => item.id, true); -> new Collection([{id: 3}, {id: 2}, {id: 1}])
     */
    sortBy<TSortValue>(
        callback:
            Array<((a: TValue, b: TValue) => TSortValue) | ((item: TValue, key: TKey) => TSortValue) | PathKey | [PathKey, PathKey]>
            | ((item: TValue, key: TKey) => TSortValue)
            | PathKey,
        descending: boolean = false,
    ) {
        if (isArray(callback) && !isFunction(callback)) {
            return this.sortByMany(callback, descending);
        }

        const results = {} as Record<TKey, TSortValue>;

        const callbackFn = this.valueRetriever(callback as PathKey | ((...args: (TValue | TKey)[]) => TSortValue));

        for (const [key, value] of Object.entries(this.items)) {
            results[key as TKey] = callbackFn(value as TValue, key as TKey) as TSortValue;
        }

        const resultsCollection = new Collection(results);
        const items = descending ? resultsCollection.sortDesc().all() : resultsCollection.sort().all();

        const sortedItems = {} as DataItems<TValue, TKey>;
        for (const key of Object.keys(items)) {
            (sortedItems as Record<TKey, TValue>)[key as TKey] = (this.items as Record<TKey, TValue>)[key as TKey];
        }

        return new Collection(sortedItems);
    }

    /**
     * Sort the collection using multiple comparisons.
     * 
     * @param comparisons - An array of callbacks to determine the sort value, path keys to get values from and compare, or tuples of such keys for multi-level sorting
     * @param descending - Whether to sort in descending order, defaults to false
     * @returns A new collection with the sorted items
     * 
     * @example
     *
     * new Collection([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}, {id: 1, name: 'Charlie'}]).sortByMany(['id', 'name']); -> new Collection([{id: 1, name: 'Alice'}, {id: 1, name: 'Charlie'}, {id: 2, name: 'Bob'}])
     * new Collection([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}, {id: 1, name: 'Charlie'}]).sortByMany([item => item.id, item => item.name]); -> new Collection([{id: 1, name: 'Alice'}, {id: 1, name: 'Charlie'}, {id: 2, name: 'Bob'}])
     * new Collection([{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}, {id: 1, name: 'Charlie'}]).sortByMany(['id', item => item.name], true); -> new Collection([{id: 2, name: 'Bob'}, {id: 1, name: 'Charlie'}, {id: 1, name: 'Alice'}])
     */
    sortByMany<TSortValue>(
        comparisons: Array<((a: TValue, b: TValue) => TSortValue) | ((item: TValue, key: TKey) => TSortValue) | PathKey | [PathKey, PathKey]>,
        descending: boolean = false,
    ) {
        if (!isArray(comparisons) || comparisons.length === 0) {
            throw new Error("You must provide at least one comparison.");
        }

        const entries = Object.entries(this.items);
        entries.sort(([, a], [, b]) => {
            for (const comparison of comparisons) {
                const comparisonArray = arrWrap(comparison);
                const prop = comparisonArray[0];

                let result: number;

                if (!isString(prop) && isFunction(prop)) {
                    result = (prop as ((a: TValue, b: TValue) => number))(a as TValue, b as TValue);
                } else {
                    let aValue = dataGet(a as DataItems<unknown, ObjectKey>, prop as PathKey);
                    let bValue = dataGet(b as DataItems<unknown, ObjectKey>, prop as PathKey);

                    if (descending) {
                        [aValue, bValue] = [bValue, aValue];
                    }

                    if (aValue === bValue) {
                        result = 0;
                    } else if (isNull(aValue)) {
                        result = -1;
                    } else if (isNull(bValue)) {
                        result = 1;
                    } else if (isNumber(aValue) && isNumber(bValue)) {
                        result = aValue < bValue ? -1 : 1;
                    } else {
                        result = String(aValue) < String(bValue) ? -1 : 1;
                    }
                }

                if (result === 0) {
                    continue;
                }

                return result;
            }

            return 0;
        });

        const sortedItems = {} as DataItems<TValue, TKey>;
        for (const [key, value] of entries) {
            (sortedItems as Record<TKey, TValue>)[key as TKey] = value as TValue;
        }

        return new Collection(sortedItems);
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
            Array<((a: TValue, b: TValue) => TSortValue) | ((item: TValue, key: TKey) => TSortValue) | PathKey | [PathKey, PathKey]>
            | ((item: TValue, key: TKey) => TSortValue)
            | PathKey,
    ) {
        return this.sortBy(callback, true);
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
     */
    sortKeys(
        descending: boolean = false,
    ) {
        const keys = Object.keys(this.items);

        keys.sort((a, b) => {
            if (a === b) {
                return 0;
            }

            if (descending) {
                return a < b ? 1 : -1;
            }

            return a < b ? -1 : 1;
        });

        const sortedItems = {} as DataItems<TValue, TKey>;
        for (const key of keys) {
            (sortedItems as Record<TKey, TValue>)[key as TKey] = (this.items as Record<TKey, TValue>)[key as TKey];
        }

        return new Collection(sortedItems);
    }

    /**
     * Sort the collection keys in descending order.
     * 
     * @returns A new collection with the items sorted by keys in descending order
     * 
     * @example
     * 
     * new Collection({a: 1, b: 2, c: 3}).sortKeysDesc(); -> new Collection({c: 3, b: 2, a: 1})
     */
    sortKeysDesc() {
        return this.sortKeys(true);
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
    sortKeysUsing(
        callback: (a: TKey, b: TKey) => number
    ) {
        const keys = Object.keys(this.items);

        keys.sort((a, b) => callback(a as TKey, b as TKey));

        const sortedItems = {} as DataItems<TValue, TKey>;
        for (const key of keys) {
            (sortedItems as Record<TKey, TValue>)[key as TKey] = (this.items as Record<TKey, TValue>)[key as TKey];
        }

        return new Collection(sortedItems);
    }

    /**
     * Splice a portion of the underlying collection array.
     * 
     * @param offset - The offset to start the splice
     * @param length - The number of items to remove, defaults to 0
     * @param replacement - The items to insert in place of the removed items, defaults to an empty array/object
     * @returns A new collection with the spliced items
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).splice(1); -> new Collection([2, 3]), original collection is now [1]
     * new Collection([1, 2, 3]).splice(1, 1); -> new Collection([2]), original collection is now [1, 3]
     * new Collection([1, 2, 3]).splice(1, 1, [4, 5]); -> new Collection([2]), original collection is now [1, 4, 5, 3]
     * new Collection({a: 1, b: 2, c: 3}).splice(1); -> new Collection({b: 2, c: 3}), original collection is now {a: 1}
     */
    splice(
        offset: number,
        length: number = 0,
        replacement: DataItems<TValue, TKey> = {} as DataItems<TValue, TKey>,
    ) {
        const result = dataSplice(this.items, offset, length, replacement);
        this.items = result.data;

        return new Collection(result.value as DataItems<TValue, TKey>);
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
    transform<TMapValue>(
        callback: (value: TValue, key: TKey) => TMapValue
    ) {
        this.items = this.map(callback).all() as DataItems<TValue, TKey>;

        return this;
    }

    /**
     * Flatten a multi-dimensional associative array with dots.
     * 
     * @returns A new collection with the flattened items
     * 
     * @example
     * 
     * new Collection({a: {b: 1}, c: 2}).dot(); -> new Collection({'a.b': 1, c: 2})
     * new Collection([{a: 1}, {b: {c: 2}}]).dot(); -> new Collection({'0.a': 1, '1.b.c': 2})
     */
    dot() {
        return new Collection(
            dataDot(this.items),
        );
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
        return new Collection(
            dataUndot(this.items),
        );
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
        const seen = new Set<unknown>();

        if (isNull(key) && strict === false) {
            return new Collection(
                dataFilter(this.items, (value) => {
                    if (seen.has(value)) {
                        return false;
                    }

                    seen.add(value);
                    return true;
                })
            );
        }

        const callback = this.valueRetriever(key as PathKey | ((...args: (TValue | TKey)[]) => unknown));

        return new Collection(
            dataReject(this.items, (value, key) => {
                const result = callback(value, key as TKey);
                if (seen.has(result)) {
                    return false;
                }

                seen.add(result);

                return true;
            })
        );
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
    values(): Collection<TValue> {
        return new Collection<TValue>(
            dataValues(this.items) as DataItems<TValue>,
        );
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
        items: DataItems<TZipValue> | Collection<TZipValue>
    ) {
        const zipItems = this.getRawItems(items);
        const zipped = dataZip(this.items, zipItems);

        return new Collection(zipped);
    }

    /**
     * Pad collection to the specified length with a value.
     * 
     * @param size - The size to pad to, positive to pad at the end, negative to pad at the beginning
     * @param value - The value to pad with
     * @returns A new collection padded to the specified length
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).pad(5, 0); -> new Collection([1, 2, 3, 0, 0])
     * new Collection([1, 2, 3]).pad(-5, 0); -> new Collection([0, 0, 1, 2, 3])
     * new Collection({a: 1, b: 2}).pad(4, 0); -> new Collection({a: 1, b: 2, '2': 0, '3': 0})
     * new Collection({a: 1, b: 2}).pad(-4, 0); -> new Collection({'-2': 0, '-1': 0, a: 1, b: 2})
     */
    pad<TPadValue>(
        size: number,
        value: TPadValue
    ) {
        return new Collection(
            dataPad(this.items, size, value) as DataItems<TValue, TKey>,
        );
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
        return this.getItemValues(this.items)[Symbol.iterator]();
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
    countBy(
        countByValue: ((value: TValue, key: TKey) => unknown) | PathKey,
    ) {
        const results = {} as Record<string | number, number>;

        const callback = this.valueRetriever(countByValue as PathKey | ((...args: (TValue | TKey)[]) => unknown));

        for (const [key, value] of Object.entries(this.items)) {
            const result = callback(value as TValue, key as TKey);
            const resultKey = isObject(result) || isArray(result) ? JSON.stringify(result) : String(result);
            if (resultKey in results) {
                results[resultKey] = (results[resultKey] ?? 0) + 1;
            } else {
                results[resultKey] = 1;
            }
        }

        return new Collection(results);
    }

    /**
     * Add an item to the collection.
     * 
     * @param item - The item to add to the collection
     * @returns The current collection with the item added
     * 
     * @example
     * 
     * new Collection([1, 2]).add(3); -> collection is now [1, 2, 3]
     * new Collection({a: 1, b: 2}).add(3); -> collection is now {a: 1, b: 2, '2': 3}
     * new Collection({a: 1, b: 2}).add(3, 'c'); -> collection is now {a: 1, b: 2, 'c': 3}
     */
    add(item: TValue, key: TKey | null = null) {
        if (isArray(this.items)) {
            if (!isNull(key)) {
                (this.items as TValue[])[key as number] = item;
            } else {
                (this.items as TValue[]).push(item);
            }

            return this;
        }

        if (!isNull(key)) {
            (this.items as Record<TKey, TValue>)[key] = item;
            return this;
        }

        const lengthKey = Object.keys(this.items).length as TKey;
        (this.items as Record<TKey, TValue>)[lengthKey] = item;

        return this;
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
    offsetExists(key: TKey): boolean {
        if (isArray(this.items)) {
            return isTruthy(this.items[key as number]);
        }

        return isTruthy((this.items as Record<TKey, TValue>)[key]);
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
    offsetGet(key: TKey) {
        if (isArray(this.items)) {
            return this.items[key as number];
        }

        return (this.items as Record<TKey, TValue>)[key];
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
     * objCollection.offsetSet(null, 3); -> collection is now {a: 1, b: 2, '2': 3}
     * objCollection.offsetSet('c', 4); -> collection is now {a: 1, b: 2, '2': 3, c: 4}
     */
    offsetSet(
        key: TKey | null,
        value: TValue,
    ) {
        this.add(value, key);
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
    offsetUnset(
        key: TKey
    ) {
        if (isArray(this.items)) {
            this.items.splice(key as number, 1);
            return;
        }

        delete (this.items as Record<TKey, TValue>)[key];
    }

    /** Enumerates Values Methods */

    /**
     * Create a new collection instance if the value isn't one already.
     * 
     * @param items - The items to create the collection from
     * @returns A new collection instance
     * 
     * @example
     * 
     * Collection.make([1, 2, 3]); -> new Collection([1, 2, 3])
     * Collection.make({a: 1, b: 2}); -> new Collection({a: 1, b: 2})
     * Collection.make(new Collection([1, 2, 3])); -> new Collection([1, 2, 3])
     * Collection.make(null); -> new Collection([])
     */
    static make<TMakeValue, TMakeKey extends ObjectKey = ObjectKey>(
        items: DataItems<TMakeValue, TMakeKey> = []
    ) {
        return new Collection<TMakeValue, TMakeKey>(items);
    }

    /**
     * Wrap the given value in a collection if applicable.
     * 
     * @param value - The value to wrap in a collection
     * @returns The value as a collection, or the original collection if already one
     * 
     * @example
     * 
     * Collection.wrap([1, 2, 3]); -> new Collection([1, 2, 3])
     * Collection.wrap({a: 1, b: 2}); -> new Collection({a: 1, b: 2})
     * Collection.wrap(new Collection([1, 2, 3])); -> new Collection([1, 2, 3])
     * Collection.wrap(123); -> new Collection([123])
     * Collection.wrap(null); -> new Collection([])
     */
    static wrap<TWrapValue, TWrapKey extends ObjectKey = ObjectKey>(
        value: TWrapValue | DataItems<TWrapValue, TWrapKey> | Collection<TWrapValue, TWrapKey>
    ) {
        if (value instanceof Collection) {
            return value;
        }

        if (isArray(value) || isObject(value)) {
            return new Collection<TWrapValue, TWrapKey>(value as DataItems<TWrapValue, TWrapKey>);
        }

        return new Collection<TWrapValue, TWrapKey>(arrWrap(value) as DataItems<TWrapValue, TWrapKey>);
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
    static unwrap<TUnwrapValue, TUnwrapKey extends ObjectKey = ObjectKey>(
        value: Collection<TUnwrapValue, TUnwrapKey> | DataItems<TUnwrapValue, TUnwrapKey>
    ) {
        if (value instanceof Collection) {
            return value.all();
        }

        return value;
    }

    /**
     * Create a new instance with no items.
     * 
     * @param asArray - Whether to create the empty collection as an array or object, defaults to true (array)
     * @returns A new empty collection instance
     * 
     * @example
     * 
     * Collection.empty(); -> new Collection([])
     * Collection.empty(true); -> new Collection({})
     */
    static empty(
        asArray: boolean = true
    ) {
        return new Collection(asArray ? [] : {});
    }

    /**
     * Create a new collection by invoking the callback a given amount of times.
     * 
     * @param count - The number of times to invoke the callback
     * @param callback - The callback to invoke, receives the current count (1-based) as an argument, or null to just create a range of numbers
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
        callback: ((count: number) => TTimesValue) | null = null
    ) {
        if (count < 1) {
            return new Collection<TTimesValue>();
        }

        if (isNull(callback)) {
            return Collection.range(1, count);
        }

        return Collection.range(1, count).map(callback);
    }

    /**
     * Create a new collection by decoding a JSON string.
     * 
     * @param json - The JSON string to decode
     * @returns A new collection with the decoded items
     * 
     * @example
     * 
     * Collection.fromJson('{"a":1,"b":2}'); -> new Collection({a: 1, b: 2})
     * Collection.fromJson('[1,2,3]'); -> new Collection([1, 2, 3])
     */
    static fromJson(json: string) {
        return new Collection(JSON.parse(json));
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
    avg(
        callback: ((value: TValue, key: TKey) => number) | PathKey = null
    ) {
        const callbackValue = this.valueRetriever(callback as PathKey | ((...args: (TValue | TKey)[]) => number));

        const reduced = this.reduce((carry: number[], item, key) => {
            const value = callbackValue(item, key);
            if (isNumber(value)) {
                carry[0] = (carry[0] ?? 0) + value;
                carry[1] = (carry[1] ?? 0) + 1;
            }

            return carry;
        }, [0, 0] as number[]);

        return (isArray(reduced) && isTruthy(reduced[1])) ? reduced[0]! / reduced[1]! : null;
    }

    /**
     * Alias for the "avg" method.
     * 
     * @param callback - The key or callback to determine the value to average, or null to average the items directly
     * @returns The average value, or null if no numeric values found
     * 
     * @see {@link Collection.avg}
     */
    average(
        callback: ((value: TValue, key: TKey) => number) | PathKey = null
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
        key: ((value: TValue, key: TKey) => boolean) | TValue | PathKey = null,
        operator: unknown,
        value: unknown = null,
    ) {
        return this.contains(key, operator, value);
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
    each(
        callback: (value: TValue, key: TKey) => unknown
    ) {
        for (const [key, value] of Object.entries(this.items)) {
            if (callback(value as TValue, key as TKey) === false) {
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
    eachSpread(
        callback: (...values: TValue[]) => unknown
    ) {
        return this.each((chunk) => {
            return callback(...(arrWrap(chunk) as TValue[]));
        });
    }

    /**
     * Determine if all items pass the given truth test.
     * 
     * @param key - The key or callback to determine the item to check for, or null to check the items directly
     * @param operator - The operator to use for comparison, if key is not a callback or null
     * @param value - The value to compare against, if key is not a callback or null
     * @returns True if all items pass the truth test, false otherwise
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).every(x => x > 0); -> true
     * new Collection([1, 2, 3]).every(x => x > 1); -> false
     * new Collection([{id: 1}, {id: 2}]).every('id', '>=', 1); -> true
     * new Collection([{id: 1}, {id: 2}]).every('id', '>', 1); -> false
     * new Collection([1, 2, 3]).every(2); -> false
     */
    every(
        key: ((value: TValue, key: TKey) => boolean) | TValue | PathKey = null,
        operator: unknown = null,
        value: unknown = null,
    ) {
        if (isNull(operator) && isNull(value)) {
            const callback = this.valueRetriever(key as PathKey | ((...args: (TValue | TKey)[]) => boolean));
            for (const [key, value] of Object.entries(this.items)) {
                if (!callback(value as TValue, key as TKey)) {
                    return false;
                }
            }
        }

        return this.every(this.operatorForWhere(key, operator, value));
    }

    /**
     * Get the first item by the given key value pair.
     * 
     * @param key - The key or callback to determine the item to find, or null to check the items directly
     * @param operator - The operator to use for comparison, if key is not a callback or null
     * @param value - The value to compare against, if key is not a callback or null
     * @returns The first item that matches the given key value pair, or undefined if not found
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).firstWhere(x => x > 1); -> 2
     * new Collection([1, 2, 3]).firstWhere(2); -> 2
     * new Collection([{id: 1}, {id: 2}]).firstWhere('id', '>=', 2); -> {id: 2}
     * new Collection([{id: 1}, {id: 2}]).firstWhere('id', '>', 2); -> undefined
     */
    firstWhere(
        key: ((value: TValue, key: TKey) => boolean) | TValue | PathKey = null,
        operator: unknown = null,
        value: unknown = null,
    ) {
        return this.first(this.operatorForWhere(key, operator, value));
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
        const value = this.firstWhere(key);
        if (isArray(value) || isObject(value)) {
            return dataGet(value, key, defaultValue);
        }

        return isFunction(defaultValue) ? defaultValue() : defaultValue;
    }

    /**
     * Ensure that every item in the collection is of the expected type.
     * 
     * @param type - The expected type(s) for the items, can be a string type name, constructor, array of types, or object with types as values
     * @returns The current collection instance if all items are of the expected type
     * @throws Error if any item is not of the expected type
     * 
     * @example
     * 
     * new Collection([1, 2, 3]).ensure('number'); -> collection is valid
     * new Collection([1, '2', 3]).ensure('number'); -> throws Error
     * new Collection([new Date(), new Date()]).ensure(Date); -> collection is valid
     * new Collection([new Date(), {}]).ensure(Date); -> throws Error
     * new Collection([1, '2', true]).ensure(['number', 'string', 'boolean']); -> collection is valid
     * new Collection([1, '2', null]).ensure(['number', 'string', 'boolean']); -> throws Error
     * new Collection([1, '2', null]).ensure({a: 'number', b: 'string', c: 'boolean'}); -> throws Error
     * new Collection([1, '2', true]).ensure({a: 'number', b: 'string', c: 'boolean'}); -> collection is valid
     * new Collection([1, 2, 3]).ensure('string'); -> throws Error
     * new Collection([null, undefined]).ensure('null'); -> collection is valid
     * new Collection([null, undefined]).ensure('undefined'); -> collection is valid
     * new Collection([null, undefined]).ensure(['null', 'undefined']); -> collection is valid
     */
    ensure<TEnsureOfType>(
        type: TEnsureOfType | Array<TEnsureOfType> | Record<ObjectKey, TEnsureOfType> | "string" | "number" | "symbol" | "boolean" | "undefined" | "null"
    ) {
        const types = isArray(type)
            ? type
            : isObject(type)
                ? Object.values(type)
                : [type];

        return this.each((item, index) => {
            const itemType = typeOf(item);
            for (const allowedType of types) {
                if (itemType === allowedType || (isFunction(allowedType) && item instanceof allowedType)) {
                    return true;
                }
            }

            throw new Error(
                `Collection should only include [${types.join(", ")}] items, but '${itemType}' found at position ${String(index)}.`
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
     * @param callback - The callback to execute, receives the value(s) as arguments
     * @returns A new collection with the results of the callback
     */
    mapSpread<TMapSpreadValue>(
        callback: (...values: TValue[]) => TMapSpreadValue
    ) {
        return this.map((chunk) => {
            return callback(...(arrWrap(chunk) as TValue[]));
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
    mapToGroups<TMapToGroupsValue, TMapToGroupsKey extends ObjectKey = ObjectKey>(
        callback: (value: TValue, key: TKey) => [TMapToGroupsKey, TMapToGroupsValue]
    ) {
        const groups = this.mapToDictionary(callback);

        return groups.map((group: unknown) => new Collection(group as DataItems<TMapToGroupsValue>));
    }

    /**
     * Map a collection and flatten the result by a single level.
     * 
     * @param callback - The callback to execute, receives the value and key as arguments, should return a collection or arrayable
     * @returns A new collection with the flattened results of the callback
     */
    flatMap<TFlatMapValue, TFlatMapKey extends ObjectKey = ObjectKey>(
        callback: ((value: TValue, key: TKey) => Collection<TFlatMapValue, TFlatMapKey> | DataItems<TFlatMapValue, TFlatMapKey>)
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
        className: new (...args: unknown[]) => TMapIntoValue
    ) {
        return this.map((item) => new className(item));
    }

    /**
     * Get the min value of a given key.
     * 
     * @param callback - The key or callback to determine the value to min, or null to min the items directly
     * @returns The min value, or null if no numeric values found
     */
    min(
        callback: ((value: TValue, key: TKey) => number) | PathKey = null
    ) {
        const callbackValue = this.valueRetriever(callback as PathKey | ((...args: (TValue | TKey)[]) => number));

        return this.map((value: TValue) => callbackValue(value))
            .reject((value: TValue) => !isNumber(value))
            .reduce((carry: number | null, value: number) => {
                if (isNull(carry) || value < carry) {
                    return value;
                }

                return carry;
            }, null);
    }

    /**
     * Get the max value of a given key.
     * 
     * @param callback - The key or callback to determine the value to max, or null to max the items directly
     * @returns The max value, or null if no numeric values found
     */
    max(
        callback: ((value: TValue, key: TKey) => number) | PathKey = null
    ) {
        const callbackValue = this.valueRetriever(callback as PathKey | ((...args: (TValue | TKey)[]) => number));

        return this.reject((value: TValue) => !isNumber(value))
            .reduce((carry: number | null, value: TValue, key: TKey) => {
                const numValue = callbackValue(value, key) as number;
                if (isNull(carry) || numValue > carry) {
                    return numValue;
                }

                return carry;
            }, null);
    }

    /**
     * "Paginate" the collection by slicing it into a smaller collection.
     * 
     * @param page - The page number to retrieve, starting from 1
     * @param perPage - The number of items per page
     * @returns A new collection with the items for the specified page
     */
    forPage(
        page: number,
        perPage: number,
    ) {
        const offset = Math.max(0, (page - 1) * perPage);

        return this.slice(offset, perPage);
    }

    /**
     * Partition the collection into two arrays using the given callback or key.
     * 
     * @param key - The key or callback to determine the partitioning, or null to partition the items directly
     * @param operator - The operator to use for comparison, if key is not a callback or null
     * @param value - The value to compare against, if key is not a callback or null
     * @returns An array with two collections: the first with items that pass the truth test, the second with items that fail
     */
    partition(
        key: ((value: TValue, key: TKey) => boolean) | TValue | PathKey = null,
        operator: unknown = null,
        value: unknown = null,
    ) {
        let callback;
        if (isNull(operator) && isNull(value)) {
            callback = this.valueRetriever(key as PathKey | ((...args: (TValue | TKey)[]) => boolean));
        } else {
            callback = this.operatorForWhere(key, operator, value);
        }

        const [passed, failed] = dataPartition(this.items, (item, key) => callback(item as TValue, key as TKey));

        return [
            new Collection(passed),
            new Collection(failed),
        ];
    }

    /**
     * Calculate the percentage of items that pass a given truth test.
     * 
     * @param callback - The callback to execute, receives the value and key as arguments
     * @returns The percentage of items that pass the truth test, rounded to the nearest integer, or null if the collection is empty
     */
    percentage(
        callback: (value: TValue, key: TKey) => boolean,
    ) {
        if (this.isEmpty()) {
            return null;
        }

        return Math.round(
            this.filter(callback).count() / this.count() * 100,
        );
    }

    /**
     * Get the sum of the given values.\
     * 
     * @param callback - The key or callback to determine the value to sum, or null to sum the items directly
     * @returns The sum of the values
     */
    sum<TReturnType>(
        callback: ((value: TValue, key: TKey) => TReturnType) | PathKey = null,
    ) {
        const callbackValue = isNull(callback)
            ? this.identity()
            : this.valueRetriever(callback as PathKey | ((...args: (TValue | TKey)[]) => TReturnType));

        return this.reduce((carry, value, key) => {
            return carry + callbackValue(value, key);
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
        callback: ((instance: this) => TWhenEmptyReturnType),
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
        callback: ((instance: this) => TWhenNotEmptyReturnType),
        defaultValue: ((instance: this) => TWhenNotEmptyReturnType) | null = null,
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
        callback: ((instance: this) => TUnlessEmptyReturnType),
        defaultValue: ((instance: this) => TUnlessEmptyReturnType) | null = null,
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
        callback: ((instance: this) => TUnlessNotEmptyReturnType),
        defaultValue: ((instance: this) => TUnlessNotEmptyReturnType) | null = null,
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
        operator: unknown = null,
        value: unknown = null,
    ) {
        return this.filter(this.operatorForWhere(key, operator, value));
    }

    /**
     * Filter items where the value for the given key is null.
     * 
     * @param key - The key to check for null values, or null to check the items directly
     * @returns A new collection with the items where the value for the given key is null
     */
    whereNull(
        key: PathKey = null,
    ) {
        return this.whereStrict(key, null);
    }

    /**
     * Filter items where the value for the given key is not null.
     * 
     * @param key - The key to check for non-null values, or null to check the items directly
     * @returns A new collection with the items where the value for the given key is not null
     */
    whereNotNull(
        key: PathKey = null,
    ) {
        return this.where(key, '!==', null);
    }

    /**
     * Filter items by the given key value pair using strict comparison.
     * 
     * @param key - The key or callback to determine the item to filter by to filter the items directly
     * @param value - The value to compare against
     * @returns A new collection with the items that match the given key value pair using strict comparison
     */
    whereStrict(
        key: PathKey,
        value: unknown,
    ) {
        return this.where(key, '===', value);
    }

    /**
     * Filter items by the given key value pair.
     * 
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object
     * @param strict - Whether to use strict comparison (===) or loose comparison (==), defaults to false (loose)
     * @returns A new collection with the items that match any of the given values for the specified key
     */
    whereIn<TValueSet extends DataItems<unknown, ObjectKey>>(
        key: PathKey,
        values: TValueSet,
        strict: boolean = false,
    ) {
        const valueSet = this.getRawItems(values);

        return this.filter((item: TValue) => {
            if (!isAccessibleData(item)) {
                return false;
            }

            const itemValue = dataGet(item as DataItems<unknown, ObjectKey>, key);
            if (strict) {
                return Object.values(valueSet).includes(itemValue as TValue);
            }

            return Object.values(valueSet).some(v => v == itemValue);
        });
    }

    /**
     * Filter items by the given key value pair using strict comparison.
     * 
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object
     * @returns A new collection with the items that match any of the given values for the specified key using strict comparison
     */
    whereInStrict<TValueSet extends DataItems<unknown, ObjectKey>>(
        key: PathKey,
        values: TValueSet
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
    whereBetween<TValueSet extends DataItems<unknown, ObjectKey>>(
        key: PathKey,
        values: TValueSet,
    ) {
        const valueSet = this.getRawItems(values);
        const valuesArray = Object.values(valueSet);

        return this.where(key, '>=', valuesArray[0])
            .where(key, '<=', valuesArray[valuesArray.length - 1]);
    }

    /**
     * Filter items such that the value of the given key is not between the given values.
     * 
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object, should contain exactly two values
     * @returns A new collection with the items that have the value for the specified key not between the given values
     */
    whereNotBetween<TValueSet extends DataItems<unknown, ObjectKey>>(
        key: PathKey,
        values: TValueSet,
    ) {
        return this.filter((item: TValue) => {
            if (!isAccessibleData(item)) {
                return false;
            }

            const itemValue = dataGet(item as DataItems<unknown, ObjectKey>, key);
            const valueSet = this.getRawItems(values);
            const valuesArray = Object.values(valueSet);

            return compareValues(itemValue, valuesArray[0]) < 0
                || compareValues(itemValue, valuesArray[valuesArray.length - 1]) > 0;
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
    whereNotIn<TValueSet extends DataItems<unknown, ObjectKey>>(
        key: PathKey,
        values: TValueSet,
        strict: boolean = false,
    ) {
        const valueSet = this.getRawItems(values);

        return this.reject((item: TValue) => {
            if (!isAccessibleData(item)) {
                return false;
            }

            const itemValue = dataGet(item as DataItems<unknown, ObjectKey>, key);
            if (strict) {
                return Object.values(valueSet).includes(itemValue as TValue);
            }

            return Object.values(valueSet).some(v => v == itemValue);
        });
    }

    /**
     * Filter items by the given key value pair using strict comparison.
     * 
     * @param key - The key to pluck the values from each item
     * @param values - The values to filter by, can be an array, collection, or object
     * @returns A new collection with the items that do not match any of the given values for the specified key using strict comparison
     */
    whereNotInStrict<TValueSet extends DataItems<unknown, ObjectKey>>(
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
        type: new (...args: unknown[]) => TWhereInstanceOf | DataItems<TWhereInstanceOf, ObjectKey>,
    ) {
        return this.filter((item: TValue) => {
            if (isArray(type) || isObject(type)) {
                const types = isArray(type) ? type : Object.values(type);
                return types.some(t => item instanceof t);
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
    pipe<TPipeReturnType>(
        callback: (instance: this) => TPipeReturnType
    ) {
        return callback(this);
    }

    /**
     * Pass the collection into a new class.
     * 
     * @param className - The class to instantiate with the collection
     * @returns A new instance of the given class, instantiated with the current collection
     */
    pipeInto<TPipeIntoValue>(
        className: new (instance: this) => TPipeIntoValue
    ) {
        return new className(this);
    }

    /**
     * Pass the collection through a series of callable pipes and return the result.
     * 
     * @param callbacks - An array of callbacks to execute, each receives the current instance as an argument
     * @returns The result of the final callback in the series
     */
    pipeThrough(
        callbacks: Array<(instance: this) => unknown>
    ) {
        return new Collection(callbacks)
            .reduce((carry, callback) => callback(carry as this), this as Collection<TValue, TKey>);
    }

    /**
     * Reduce the collection to a single value.
     * 
     * @param callback - The callback to execute, receives the carry, value, and key as arguments
     * @param initial - The initial value to start the reduction with
     * @returns The reduced value
     */
    reduce<TReduceInitial, TReduceReturnType>(
        callback: (carry: TReduceInitial | TReduceReturnType, value: TValue, key: TKey) => TReduceReturnType,
        initial: TReduceInitial
    ) {
        let result: TReduceInitial | TReduceReturnType = initial;

        for (const [key, value] of Object.entries(this.items)) {
            result = callback(result, value as TValue, key as TKey);
        }

        return result;
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
        callback: ((instance: this, value: TWhenParameter) => TWhenReturnType) | null = null,
        defaultCallback: ((instance: this, value: TWhenParameter) => TWhenReturnType) | null = null,
    ) {
        const resolvedValue = isFunction(value)
            ? (value as (instance: this) => TWhenParameter)(this)
            : (value as TWhenParameter);

        if (resolvedValue) {
            return (callback?.(this, resolvedValue) ?? this) as Collection<TValue, TKey>;
        } else if (defaultCallback) {
            return (defaultCallback(
                this,
                resolvedValue,
            ) ?? this) as Collection<TValue, TKey>;
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
        callback: ((instance: this, value: TUnlessParameter) => TUnlessReturnType) | null = null,
        defaultCallback: ((instance: this, value: TUnlessParameter) => TUnlessReturnType) | null = null,
    ) {
        const resolvedValue = (isFunction(value)
            ? value(this)
            : value) as TUnlessParameter;

        if (!resolvedValue) {
            return (callback?.(this, resolvedValue) ??
                this) as Collection<TValue, TKey>;
        } else if (defaultCallback) {
            return (defaultCallback(
                this,
                resolvedValue,
            ) ?? this) as Collection<TValue, TKey>;
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
     * Results array of items from Collection or Arrayable.
     *
     * @param items - The items to convert to an array or record
     * @returns The items preserving their original structure
     */
    protected getRawItems(items: unknown): DataItems<TValue, TKey> {
        if (items === null || items === undefined) {
            return {} as DataItems<TValue, TKey>;
        }

        // If it's already a Collection, get its items
        if (items instanceof Collection) {
            return items.all();
        }

        // If it has a toArray method, use it
        if (
            typeof items === "object" &&
            items !== null &&
            "toArray" in items &&
            typeof (items as unknown as { toArray: unknown }).toArray ===
            "function"
        ) {
            return (items as Arrayable<TValue>).toArray();
        }

        // If it's an empty array, return empty object
        if (isArray(items) && items.length === 0) {
            return {} as DataItems<TValue, TKey>;
        }

        // If it's an array, keep it as an array
        if (isArray(items)) {
            return items as TValue[];
        }

        // If it's an object, keep it as an object
        if (typeof items === "object" && items !== null) {
            return items as Record<TKey, TValue>;
        }

        // For primitives and other types, wrap in an array
        return [items as TValue];
    }

    /**
     * Get a value retrieving callback.
     * 
     * @param value - The value or callback to retrieve values
     * @returns A callback that retrieves the value from an item
     * 
     * @example
     * 
     * valueRetriever('id'); -> (item) => dataGet(item, 'id', null)
     * valueRetriever((item) => item.id); -> (item) => item.id
     * valueRetriever('user.name'); -> (item) => dataGet(item, 'user.name', null)
     */
    protected valueRetriever<TArgs, TReturn>(
        value: PathKey | ((...args: TArgs[]) => TReturn)
    ) {
        if (isFunction(value)) {
            return value;
        }

        return function (...args: TArgs[]) {
            if (arguments.length >= 2) {
                return dataGet(args[0] as DataItems<unknown, ObjectKey>, args[1] as PathKey, (args[2] ?? null) as unknown | null);
            }

            return dataGet(args[0] as DataItems<unknown, ObjectKey>, value as PathKey, null);
        };
    }
}
