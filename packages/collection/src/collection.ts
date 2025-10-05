import { parseSegments, hasPath, getRaw, forgetKeys, forgetKeysObject, forgetKeysArray, setImmutable, pushWithPath, dotFlatten, dotFlattenObject, dotFlattenArray, undotExpand, undotExpandObject, undotExpandArray, getNestedValue, getMixedValue, setMixed, pushMixed, setMixedImmutable, hasMixed, getObjectValue, setObjectValue, hasObjectKey } from '@laravel-js/path';
import { format, parse, parseInt, parseFloat, spell, ordinal, spellOrdinal, percentage, currency, fileSize, forHumans, summarize, clamp, pairs, trim, minutesToHuman, secondsToHuman, withLocale, withCurrency, useLocale, useCurrency, defaultLocale, defaultCurrency } from '@laravel-js/num';
import { isArray, isObject, isString, isNumber, isBoolean, isFunction, isUndefined, isSymbol, isNull, typeOf, castableToArray, compareValues, resolveDefault, normalizeToArray, isAccessibleData, getAccessibleValues } from '@laravel-js/utils';
import { dataAdd, dataArray, dataItem, dataBoolean, dataCollapse, dataCrossJoin, dataDivide, dataDot, dataUndot, dataExcept, dataExists, dataTake, dataFlatten, dataFlip, dataFloat, dataForget, dataFrom, dataGet, dataHas, dataHasAll, dataHasAny, dataEvery, dataSome, dataInteger, dataJoin, dataKeyBy, dataPrependKeysWith, dataOnly, dataSelect, dataMapWithKeys, dataMapSpread, dataPrepend, dataPull, dataQuery, dataRandom, dataSet, dataPush, dataShuffle, dataSole, dataSort, dataSortDesc, dataSortRecursive, dataSortRecursiveDesc, dataString, dataToCssClasses, dataToCssStyles, dataWhere, dataReject, dataPartition, dataWhereNotNull, dataValues, dataKeys, dataFilter, dataMap, dataFirst, dataLast, dataContains, dataDiff, dataPluck } from '@laravel-js/data';
import type {
    DataItems,
    ObjectKey,
    Arrayable,
    ProxyTarget,
    PropertyName,
    PathKeys,
    PathKey,
    ArrayItems,
} from "@laravel-js/types";
import { LazyCollection } from "./lazy-collection";
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
        this.items = this.getArrayableItems(items ?? []);

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
    ): Collection<number, number> {
        const rangeArray: number[] = [];
        for (let i = from; i <= to; i += step) {
            rangeArray.push(i);
        }
        return new Collection(rangeArray);
    }

    /**
     * Get all of the items in the collection.
     *
     * @returns The underlying items in the collection
     *
     * @example
     *
     * const collection = new Collection([1, 2, 3]);
     * collection.all(); -> [1, 2, 3]
     */
    all() {
        return this.items;
    }

    /**
     * Get a lazy collection for the items in this collection.
     */
    lazy(): LazyCollection<TValue, TKey> {
        return new LazyCollection(this.items);
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

        collection.each(
            (value) =>
                (counts[value] =
                    (counts[value] ?? false) ? counts[value] + 1 : 1),
        );

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
        key: ((value: TValue, index: TKey) => boolean) | TValue | string,
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
            ...items.map((item) => this.getArrayableItems(item)),
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
            dataDiff<TValue, TKey>(this.items, this.getArrayableItems(items)),
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
        const otherItems = this.getArrayableItems(items);
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
    ){
        return new Collection(
            dataDiff<TValue, TKey>(this.items, this.getArrayableItems(items)),
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
        const otherItems = this.getArrayableItems(items);
        const results = {} as DataItems<TValue, TKey>;

        for (const [key, value] of Object.entries(
            this.items as Record<TKey, TValue>,
        )) {
            if (!(key in otherItems)) {
                (results as Record<TKey, TValue>)[key as TKey] =
                    value as TValue;
            }
        }

        if(isArray(this.items)){
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
        callback: ((value: TValue) => TMapValue) | string | null = null,
        strict: boolean = false,
    ) {
        const items = this.map(this.valueRetriever(callback));

        const uniqueItems = items.unique(null, strict);

        const compare = this.duplicateComparator(strict);

        const duplicatesItems = {} as DataItems<TValue, TKey>;

        for (const [key, value] of Object.entries(
            items.items as Record<TKey, TValue>,
        )) {
            if(uniqueItems.isNotEmpty() && compare(value as TValue, uniqueItems.first() as TValue)){
                uniqueItems.shift();
            }else{
                (duplicatesItems as Record<TKey, TValue>)[key as TKey] = value as TValue;
            }
        }

        if(isArray(this.items)){
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
    ){
        return this.duplicates(callback, true);
    }

    /**
     * Get the comparison function to detect duplicates.
     *
     * @param strict - Whether to use strict comparison (===) or not (==)
     * @returns A comparison function for detecting duplicates
     */
    duplicateComparator(strict: boolean){
        if(strict){
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
    except(keys: PathKeys | Collection<TKey>){
        if(isNull(keys) || isUndefined(keys)){
            return new Collection(this.items);
        }
        
        keys = this.getArrayableItems(keys) as PathKey[];

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
    ){
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
    forget(keys: PathKeys | Collection<TKey>){
        if(isNull(keys) || isUndefined(keys)){
            return new Collection(this.items);
        }
        
        keys = this.getArrayableItems(keys) as PathKey[];

        this.items = dataForget(this.items, keys);

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
    ): TValue | TGetOrPutValue{
        if(this.has(key)){
            return this.get(key) as TValue;
        }

        if(isFunction(value)){
            value = value();
        }

        this.items = dataSet(this.items, key, value);

        return value;
    }

    groupBy<TGroupKey>(
        groupBy: ((value: TValue, index: TKey) => TGroupKey) | ArrayItems<TValue> | string,
        preserveKeys: boolean = false,
    ){}

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
        return new Collection(dataKeys(this.items)) as Collection<
            string | number
        >;
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
     * Run a map over each of the items.
     *
     * @param callback - The callback function to map with
     * @returns A new collection with mapped items
     *
     * @example
     *
     * new Collection([1, 2, 3]).map(x => x * 2); -> new Collection([2, 4, 6])
     */
    map<U>(
        callback: (value: TValue, key: string | number) => U,
    ): Collection<U> {
        const result = dataMap(this.items, callback);
        return new Collection<U>(result as DataItems<U, TKey>);
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
    protected getArrayableItems(items: unknown): DataItems<TValue, TKey> {
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
}
