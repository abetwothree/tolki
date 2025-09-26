import * as Arr from "@laravel-js/arr";
import * as Obj from "@laravel-js/obj";
import type { DataItems } from "@laravel-js/types";
import { isArray } from "@laravel-js/utils";

/**
 * Get all values from data (array or object).
 *
 * @param data - The data to get values from
 * @returns Array of all values
 *
 * @example
 *
 * Data.values([1, 2, 3]); // -> [1, 2, 3]
 * Data.values({a: 1, b: 2, c: 3}); // -> [1, 2, 3]
 */
export function dataValues<T>(data: DataItems<T>): T[] {
    return isArray(data) ? data : (Obj.values(data) as T[]);
}

/**
 * Get all keys from data (array or object).
 *
 * @param data - The data to get keys from
 * @returns Array of all keys
 *
 * @example
 *
 * Data.keys([1, 2, 3]); // -> [0, 1, 2]
 * Data.keys({a: 1, b: 2, c: 3}); // -> ['a', 'b', 'c']
 */
export function dataKeys<T>(data: DataItems<T>): (string | number)[] {
    return isArray(data) ? data.map((_, index) => index) : Obj.keys(data);
}

/**
 * Filter data using a callback function.
 *
 * @param data - The data to filter
 * @param callback - The callback function to test each value
 * @returns Filtered data maintaining original structure for objects, new array for arrays
 *
 * @example
 *
 * Data.filter([1, 2, 3, 4], (value) => value > 2); // -> [3, 4]
 * Data.filter({a: 1, b: 2, c: 3, d: 4}, (value) => value > 2); // -> {c: 3, d: 4}
 */
export function dataFilter<T>(
    data: DataItems<T>,
    callback?: ((value: T, key: string | number) => boolean) | null,
): DataItems<T> {
    if (isArray(data)) {
        return callback
            ? Arr.filter(data, callback as (value: T, index: number) => boolean)
            : Arr.filter(data);
    } else {
        return callback
            ? Obj.filter(data, callback)
            : Obj.filter(data, (value) => Boolean(value));
    }
}

/**
 * Transform data using a callback function.
 *
 * @param data - The data to map
 * @param callback - The callback function to transform each value
 * @returns Transformed data maintaining original structure
 *
 * @example
 *
 * Data.map([1, 2, 3], (value) => value * 2); // -> [2, 4, 6]
 * Data.map({a: 1, b: 2}, (value) => value * 2); // -> {a: 2, b: 4}
 */
export function dataMap<T, U>(
    data: DataItems<T>,
    callback: (value: T, key: string | number) => U,
): DataItems<U> {
    return isArray(data)
        ? Arr.map(data, callback as (value: T, index: number) => U)
        : Obj.map(data, callback);
}

/**
 * Get the first value from data that passes a test.
 *
 * @param data - The data to search
 * @param callback - The callback function to test each value
 * @param defaultValue - The default value to return if no match found
 * @returns The first matching value or default value
 *
 * @example
 *
 * Data.first([1, 2, 3, 4], (value) => value > 2); // -> 3
 * Data.first({a: 1, b: 2, c: 3}, (value) => value > 1); // -> 2
 */
export function dataFirst<T, D = null>(
    data: DataItems<T>,
    callback?: ((value: T, key: string | number) => boolean) | null,
    defaultValue?: D | (() => D),
): T | D | null {
    if (isArray(data)) {
        if (callback) {
            const result = Arr.first(
                data,
                callback as (value: T, index: number) => boolean,
                defaultValue,
            );
            return result === undefined ? null : result;
        } else {
            const result = Arr.first(data, undefined, defaultValue);
            return result === undefined ? null : result;
        }
    } else {
        if (callback) {
            const result = Obj.first(
                data,
                callback as (value: T, key: string) => boolean,
                defaultValue,
            );
            return result === undefined ? null : result;
        } else {
            const result = Obj.first(data, undefined, defaultValue);
            return result === undefined ? null : result;
        }
    }
}

/**
 * Get the last value from data that passes a test.
 *
 * @param data - The data to search
 * @param callback - The callback function to test each value
 * @param defaultValue - The default value to return if no match found
 * @returns The last matching value or default value
 *
 * @example
 *
 * Data.last([1, 2, 3, 4], (value) => value < 4); // -> 3
 * Data.last({a: 1, b: 2, c: 3}, (value) => value > 1); // -> 3
 */
export function dataLast<T, D = null>(
    data: DataItems<T>,
    callback?: ((value: T, key: string | number) => boolean) | null,
    defaultValue?: D | (() => D),
): T | D | null {
    if (isArray(data)) {
        if (callback) {
            const result = Arr.last(
                data,
                callback as (value: T, index: number) => boolean,
                defaultValue,
            );
            return result === undefined ? null : result;
        } else {
            const result = Arr.last(data, undefined, defaultValue);
            return result === undefined ? null : result;
        }
    } else {
        if (callback) {
            const result = Obj.last(
                data,
                callback as (value: T, key: string) => boolean,
                defaultValue,
            );
            return result === undefined ? null : result;
        } else {
            const result = Obj.last(data, undefined, defaultValue);
            return result === undefined ? null : result;
        }
    }
}

/**
 * Determine if data contains a value.
 *
 * @param data - The data to search
 * @param value - The value to search for or callback function
 * @returns True if the value exists, false otherwise
 *
 * @example
 *
 * Data.contains([1, 2, 3], 2); // -> true
 * Data.contains({a: 1, b: 2}, (value) => value > 1); // -> true
 */
export function dataContains<T>(
    data: DataItems<T>,
    value: T | ((value: T, key: string | number) => boolean),
): boolean {
    return isArray(data)
        ? Arr.contains(
              data,
              value as T | ((value: T, index: number) => boolean),
          )
        : Obj.contains(data, value);
}

/**
 * Get the differences between data collections.
 *
 * @param data - The source data
 * @param other - The data to compare against
 * @returns Data with differences, preserving structure
 *
 * @example
 *
 * Data.diff([1, 2, 3, 4], [2, 4]); // -> {0: 1, 2: 3} (preserves indices)
 * Data.diff({a: 1, b: 2, c: 3}, {b: 2, d: 4}); // -> {a: 1, c: 3}
 */
export function dataDiff<T>(
    data: DataItems<T>,
    other: DataItems<T>,
): DataItems<T> {
    if (isArray(data)) {
        // For arrays, return object preserving original indices
        const otherValues = dataValues(other);
        const result: Record<number, T> = {};
        data.forEach((value, index) => {
            if (!otherValues.includes(value)) {
                result[index] = value;
            }
        });
        return result as unknown as DataItems<T>;
    } else {
        return Obj.diff(data, other) as unknown as DataItems<T>;
    }
}

/**
 * Pluck values from data by a key path.
 *
 * @param data - The data to pluck from
 * @param value - The key path to pluck
 * @param key - Optional key path to use as keys in result
 * @returns Plucked values maintaining appropriate structure
 *
 * @example
 *
 * Data.pluck([{name: 'John'}, {name: 'Jane'}], 'name'); // -> ['John', 'Jane']
 * Data.pluck({a: {name: 'John'}, b: {name: 'Jane'}}, 'name'); // -> {a: 'John', b: 'Jane'}
 */
export function dataPluck<T, U>(
    data: DataItems<T>,
    value: string | ((item: T) => U),
    key?: string | ((item: T) => string | number) | null,
): DataItems<U> {
    if (isArray(data)) {
        return Arr.pluck(
            data as Record<string, unknown>[],
            value as string | ((item: Record<string, unknown>) => U),
            key as
                | string
                | ((item: Record<string, unknown>) => string | number)
                | null,
        ) as DataItems<U>;
    } else {
        return Obj.pluck(
            data as unknown as Record<string, Record<string, unknown>>,
            value as string | ((item: Record<string, unknown>) => unknown),
            key as
                | string
                | ((item: Record<string, unknown>) => string | number)
                | null,
        ) as DataItems<U>;
    }
}
