import { isArray, isFunction } from "@laravel-js/utils";
import {
    dataGet,
    dataHas,
    dataHasAll,
    dataValues,
    dataKeys,
    dataFilter,
    dataMap,
    dataFirst,
    dataLast,
    dataContains,
    dataPluck,
    dataDiff,
    dataCollapse,
} from "@laravel-js/data";
import type { DataItems, ObjectKey, Arrayable } from "@laravel-js/types";

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
    ): Collection<number> {
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
    all(): DataItems<TValue, TKey> {
        return this.items;
    }

    /**
     * Collapse a collection of arrays into a single, flat collection.
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
     * Determine if an item exists in the collection.
     *
     * @param key - The value to search for or a callback function
     * @returns True if the item exists, false otherwise
     *
     * @example
     *
     * new Collection([1, 2, 3]).contains(2); -> true
     * new Collection([{id: 1}, {id: 2}]).contains(item => item.id === 2); -> true
     */
    contains(
        key: TValue | ((value: TValue, index: string | number) => boolean),
    ): boolean {
        if (isFunction(key)) {
            const callback = key as (
                value: TValue,
                index: string | number,
            ) => boolean;
            return dataContains(this.items, callback);
        }

        return dataContains(this.items, key);
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
    containsStrict(key: TValue): boolean {
        return dataContains(this.items, (value: unknown) => value === key);
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
        items: DataItems<TValue, TKey> | Collection<TValue, TKey>,
    ): Collection<TValue, TKey> {
        return new Collection(
            dataDiff<TValue, TKey>(this.items, this.getArrayableItems(items)),
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
    filter(
        callback?: ((value: TValue, key: string | number) => boolean) | null,
    ): Collection<TValue> {
        return new Collection<TValue>(
            dataFilter(this.items, callback) as DataItems<TValue, TKey>,
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
     */
    first<D = null>(
        callback?: ((value: TValue, key: string | number) => boolean) | null,
        defaultValue?: D | (() => D),
    ): TValue | D | null {
        const result = dataFirst(this.items, callback, defaultValue);
        return result === undefined ? null : result;
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
        return Object.keys(this.items).length === 0;
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
    get<D = null>(
        key: string | number,
        defaultValue?: D | (() => D),
    ): TValue | D | null {
        const result = dataGet(this.items, key, defaultValue) as
            | TValue
            | D
            | null;
        return result;
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
    has(key: string | number | (string | number)[]): boolean {
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
