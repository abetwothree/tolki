import * as Arr from "@laravel-js/arr";

/**
 * Type representing the items that can be stored in a Collection.
 * Can be either an array of values or a record with string/number keys.
 */
export type TKey = string | number | symbol;

export type Items<
    TValue,
    TKeyValue extends string | number | symbol = TKey
> = TValue[] | Record<TKeyValue, TValue>;

/**
 * Interface for objects that can be converted to arrays or records.
 */
export interface Arrayable<TValue> {
    toArray(): Items<TValue>;
}

/**
 * Laravel-style Collection class for JavaScript/TypeScript.
 * Provides a fluent interface for working with arrays and objects.
 *
 * @template TValue - The type of values stored in the collection
 */
export class Collection<TValue = unknown> {
    /**
     * The items contained in the collection.
     */
    protected items: Items<TValue>;

    /**
     * Create a new collection.
     *
     * @param items - The items to initialize the collection with
     */
    constructor(items?: TValue[] | Items<TValue> | Arrayable<TValue> | null) {
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
     * Collection.range(1, 5); // -> new Collection({0: 1, 1: 2, 2: 3, 3: 4, 4: 5})
     * Collection.range(1, 10, 2); // -> new Collection({0: 1, 1: 3, 2: 5, 3: 7, 4: 9})
     */
    static range(from: number, to: number, step: number = 1): Collection<number> {
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
     * collection.all(); // -> [1, 2, 3]
     */
    all(): Items<TValue> {
        return this.items;
    }

    /**
     * Collapse a collection of arrays into a single, flat collection.
     *
     * @returns A new collection with collapsed arrays or merged objects
     *
     * @example
     *
     * new Collection([[1, 2], [3, 4]]).collapse(); // -> new Collection([1, 2, 3, 4])
     * new Collection([{a: 1}, {b: 2}]).collapse(); // -> new Collection({a: 1, b: 2})
     */
    collapse(): Collection<unknown> {
        const values = this.getItemValues(this.items);
        
        // Check if we're dealing with objects or arrays
        const hasObjects = values.some(item => 
            typeof item === 'object' && item !== null && !Array.isArray(item)
        );
        
        if (hasObjects) {
            // Merge objects together
            const result: Record<string | number, unknown> = {};
            values.forEach(item => {
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    Object.assign(result, item);
                }
            });
            return new Collection(result);
        } else {
            // Flatten arrays
            const collapsed = Arr.collapse(values as readonly (readonly unknown[])[]);
            return new Collection(collapsed);
        }
    }

    /**
     * Determine if an item exists in the collection.
     *
     * @param key - The value to search for or a callback function
     * @returns True if the item exists, false otherwise
     *
     * @example
     *
     * new Collection([1, 2, 3]).contains(2); // -> true
     * new Collection([{id: 1}, {id: 2}]).contains(item => item.id === 2); // -> true
     */
    contains(key: TValue | ((value: TValue, index: string | number) => boolean)): boolean {
        if (typeof key === 'function') {
            const callback = key as (value: TValue, index: string | number) => boolean;
            if (Array.isArray(this.items)) {
                return this.items.some((value, index) => callback(value, index));
            } else {
                for (const [index, value] of Object.entries(this.items)) {
                    if (callback(value, index)) {
                        return true;
                    }
                }
                return false;
            }
        }

        return this.getItemValues(this.items).includes(key as TValue);
    }

    /**
     * Determine if an item exists in the collection using strict comparison.
     *
     * @param key - The value to search for
     * @returns True if the item exists using strict comparison, false otherwise
     *
     * @example
     *
     * new Collection([1, 2, 3]).containsStrict(2); // -> true
     * new Collection([1, 2, 3]).containsStrict('2'); // -> false
     */
    containsStrict(key: TValue): boolean {
        return this.getItemValues(this.items).some(value => value === key);
    }

    /**
     * Get the items in the collection that are not present in the given items.
     *
     * @param items - The items to diff against
     * @returns A new collection with the difference
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).diff([2, 4]); // -> new Collection({0: 1, 2: 3})
     */
    diff(items: TValue[] | Record<string | number, TValue> | Collection<TValue>): Collection<TValue> {
        let otherValues: TValue[];
        
        if (items instanceof Collection) {
            otherValues = this.getItemValues(items.all());
        } else if (Array.isArray(items)) {
            otherValues = items;
        } else {
            otherValues = Object.values(items);
        }
        
        if (Array.isArray(this.items)) {
            // For arrays, preserve original indices as keys
            const result: Record<number, TValue> = {};
            this.items.forEach((value, index) => {
                if (!otherValues.includes(value)) {
                    result[index] = value;
                }
            });
            return new Collection(result);
        } else {
            const result: Record<string | number, TValue> = {};
            for (const [key, value] of Object.entries(this.items)) {
                if (!otherValues.includes(value)) {
                    result[key] = value;
                }
            }
            return new Collection(result);
        }
    }

    /**
     * Run a filter over each of the items.
     *
     * @param callback - The callback function to filter with, or null to filter truthy values
     * @returns A new collection with filtered items
     *
     * @example
     *
     * new Collection([1, 2, 3, 4]).filter(x => x > 2); // -> new Collection([3, 4])
     * new Collection([0, 1, false, 2, '', 3]).filter(); // -> new Collection([1, 2, 3])
     */
    filter(callback?: ((value: TValue, key: string | number) => boolean) | null): Collection<TValue> {
        if (Array.isArray(this.items)) {
            // For arrays, return a new sequential array with just the values
            const result: TValue[] = [];
            this.items.forEach((value, index) => {
                if (callback) {
                    if (callback(value, index)) {
                        result.push(value);
                    }
                } else {
                    if (value) {
                        result.push(value);
                    }
                }
            });
            return new Collection(result);
        } else {
            const result: Record<string | number, TValue> = {};
            for (const [key, value] of Object.entries(this.items)) {
                if (callback) {
                    if (callback(value, key)) {
                        result[key] = value;
                    }
                } else {
                    if (value) {
                        result[key] = value;
                    }
                }
            }
            return new Collection(result);
        }
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
     * new Collection([1, 2, 3]).first(); // -> 1
     * new Collection([1, 2, 3, 4]).first(x => x > 2); // -> 3
     * new Collection([]).first(null, 'default'); // -> 'default'
     */
    first<D = null>(
        callback?: ((value: TValue, key: string | number) => boolean) | null,
        defaultValue?: D | (() => D)
    ): TValue | D | null {
        const values = this.getItemValues(this.items);
        
        if (callback) {
            const result = Arr.first(values, callback as (value: TValue, index: number) => boolean, defaultValue);
            return result === undefined ? null : result;
        }
        
        const result = Arr.first(values, null, defaultValue);
        return result === undefined ? null : result;
    }

    /**
     * Determine if the collection is empty or not.
     *
     * @returns True if the collection is empty, false otherwise
     *
     * @example
     *
     * new Collection([]).isEmpty(); // -> true
     * new Collection([1, 2, 3]).isEmpty(); // -> false
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
     * new Collection([1, 2, 3]).count(); // -> 3
     * new Collection([]).count(); // -> 0
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
     * new Collection({a: 1, b: 2, c: 3}).keys(); // -> new Collection(['a', 'b', 'c'])
     * new Collection([1, 2, 3]).keys(); // -> new Collection([0, 1, 2])
     */
    keys(): Collection<string | number> {
        if (Array.isArray(this.items)) {
            // For arrays, return numeric indices
            const keys = this.items.map((_, index) => index);
            return new Collection(keys) as Collection<string | number>;
        } else {
            // For objects, return string keys
            return new Collection(Object.keys(this.items)) as Collection<string | number>;
        }
    }

    /**
     * Reset the keys on the underlying array.
     *
     * @returns A new collection with values and numeric keys
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).values(); // -> new Collection({0: 1, 1: 2, 2: 3})
     */
    values(): Collection<TValue> {
        return new Collection(Object.values(this.items));
    }

    /**
     * Run a map over each of the items.
     *
     * @param callback - The callback function to map with
     * @returns A new collection with mapped items
     *
     * @example
     *
     * new Collection([1, 2, 3]).map(x => x * 2); // -> new Collection([2, 4, 6])
     */
    map<U>(callback: (value: TValue, key: string | number) => U): Collection<U> {
        if (Array.isArray(this.items)) {
            const result: U[] = [];
            this.items.forEach((value, index) => {
                result.push(callback(value, index));
            });
            return new Collection(result);
        } else {
            const result: Record<string | number, U> = {};
            for (const [key, value] of Object.entries(this.items)) {
                result[key] = callback(value, key);
            }
            return new Collection(result);
        }
    }

    /**
     * Get the values of a given key.
     *
     * @param value - The key path to pluck
     * @param key - Optional key path to use as keys in result
     * @returns A new collection with plucked values
     *
     * @example
     *
     * new Collection([{name: 'John'}, {name: 'Jane'}]).pluck('name'); // -> new Collection(['John', 'Jane'])
     * new Collection({a: {name: 'John'}, b: {name: 'Jane'}}).pluck('name'); // -> new Collection({a: 'John', b: 'Jane'})
     */
    pluck(value: string | ((item: TValue) => unknown), key?: string | ((item: TValue) => string | number) | null): Collection<unknown> {
        if (Array.isArray(this.items)) {
            // For arrays, use Arr.pluck which returns an array
            const result = Arr.pluck(this.items as Record<string, unknown>[], value as string | ((item: Record<string, unknown>) => unknown), key as string | ((item: Record<string, unknown>) => string | number) | null);
            return new Collection(result);
        } else {
            // For objects, preserve the original keys
            const result: Record<string | number, unknown> = {};
            for (const [objKey, item] of Object.entries(this.items)) {
                if (typeof item === 'object' && item !== null) {
                    const itemObj = item as Record<string, unknown>;
                    if (typeof value === 'string') {
                        result[objKey] = itemObj[value];
                    } else if (typeof value === 'function') {
                        result[objKey] = value(item);
                    }
                }
            }
            return new Collection(result);
        }
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
     * new Collection([1, 2, 3]).last(); // -> 3
     * new Collection([1, 2, 3, 4]).last(x => x < 4); // -> 3
     * new Collection([]).last(null, 'default'); // -> 'default'
     */
    last<D = null>(
        callback?: ((value: TValue, key: string | number) => boolean) | null,
        defaultValue?: D | (() => D)
    ): TValue | D | null {
        const values = this.getItemValues(this.items);
        
        if (callback) {
            const result = Arr.last(values, callback as (value: TValue, index: number) => boolean, defaultValue);
            return result === undefined ? null : result;
        }
        
        const result = Arr.last(values, null, defaultValue);
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
     * new Collection({a: 1, b: 2, c: 3}).get('b'); // -> 2
     * new Collection({a: 1, b: 2, c: 3}).get('d', 'default'); // -> 'default'
     */
    get<D = null>(key: string | number, defaultValue?: D | (() => D)): TValue | D | null {
        let value: TValue | undefined;
        
        if (Array.isArray(this.items)) {
            value = this.items[key as number];
        } else {
            value = this.items[key];
        }
        
        if (value !== undefined) {
            return value;
        }
        
        if (typeof defaultValue === 'function') {
            return (defaultValue as () => D)();
        }
        
        return defaultValue ?? null;
    }

    /**
     * Determine if an item exists in the collection by key.
     *
     * @param key - The key or keys to check for
     * @returns True if all keys exist, false otherwise
     *
     * @example
     *
     * new Collection({a: 1, b: 2, c: 3}).has('a'); // -> true
     * new Collection({a: 1, b: 2, c: 3}).has(['a', 'b']); // -> true
     * new Collection({a: 1, b: 2, c: 3}).has(['a', 'd']); // -> false
     */
    has(key: string | number | (string | number)[]): boolean {
        if (Array.isArray(key)) {
            return key.every(k => this.hasKey(k));
        }
        
        return this.hasKey(key);
    }

    /**
     * Check if a single key exists
     */
    private hasKey(key: string | number): boolean {
        if (Array.isArray(this.items)) {
            const numKey = typeof key === 'string' ? parseInt(key, 10) : key;
            return numKey >= 0 && numKey < this.items.length && !isNaN(numKey);
        } else {
            return Object.prototype.hasOwnProperty.call(this.items, key);
        }
    }

    /**
     * Get the values from items, whether it's an array or object
     */
    protected getItemValues(items: Items<TValue>): TValue[] {
        return Array.isArray(items) ? items : Object.values(items);
    }

    /**
     * Results array of items from Collection or Arrayable.
     *
     * @param items - The items to convert to an array or record
     * @returns The items preserving their original structure
     */
    protected getArrayableItems(items: unknown): Items<TValue> {
        if (items === null || items === undefined) {
            return {};
        }

        // If it's already a Collection, get its items
        if (items instanceof Collection) {
            return items.all();
        }

        // If it has a toArray method, use it
        if (typeof items === 'object' && items !== null && 'toArray' in items && typeof (items as unknown as { toArray: unknown }).toArray === 'function') {
            return (items as Arrayable<TValue>).toArray();
        }

        // If it's an empty array, return empty object
        if (Array.isArray(items) && items.length === 0) {
            return {};
        }

        // If it's an array, keep it as an array
        if (Array.isArray(items)) {
            return items as TValue[];
        }

        // If it's an object, keep it as an object
        if (typeof items === 'object' && items !== null) {
            return items as Record<TKey, TValue>;
        }

        // For primitives and other types, wrap in an array
        return [items as TValue];
    }
}
