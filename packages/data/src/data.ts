import {
    values as objValues,
    keys as objKeys,
    filter as objFilter,
    map as objMap,
    first as objFirst,
    last as objLast,
    contains as objContains,
    diff as objDiff,
    pluck as objPluck,
} from "@laravel-js/obj";
import {
    values as arrValues,
    keys as arrKeys,
    filter as arrFilter,
    map as arrMap,
    first as arrFirst,
    last as arrLast,
    contains as arrContains,
    diff as arrDiff,
    pluck as arrPluck,
    wrap as arrWrap,
} from "@laravel-js/arr";
import type { DataItems, ObjectKey } from "@laravel-js/types";
import {
    isArray,
    isObject,
    isFunction,
    typeOf,
    isNull,
    isNumber,
    isUndefined,
} from "@laravel-js/utils";

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
export function dataValues<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
): T[] {
    if (isObject(data)) {
        return objValues(data as Record<K, T>) as T[];
    }

    return arrValues(arrWrap(data));
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
export function dataKeys<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
): (string | number)[] {
    if (isObject(data)) {
        return objKeys(data as Record<K, T>);
    }

    return arrKeys(arrWrap(data));
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
export function dataFilter<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    callback?: ((value: T, key: string | number) => boolean) | null,
): DataItems<T, K> {
    if (isObject(data)) {
        return objFilter(
            data as Record<string, T>,
            callback as (value: T, key: string) => boolean,
        ) as DataItems<T, K>;
    }

    return arrFilter(
        arrWrap(data),
        callback as (value: T, index: number) => boolean,
    ) as DataItems<T>;
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
export function dataMap<T, K extends ObjectKey = ObjectKey, U>(
    data: DataItems<T, K>,
    callback: (value: T, key: string | number) => U,
): DataItems<U, K> {
    if (isObject(data)) {
        return objMap(
            data as Record<string, T>,
            callback as (value: T, key: string) => U,
        ) as DataItems<U, K>;
    }

    return arrMap(
        arrWrap(data),
        callback as (value: T, index: number) => U,
    ) as DataItems<U>;
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
export function dataFirst<T, K extends ObjectKey = ObjectKey, D = null>(
    data: DataItems<T, K>,
    callback?: ((value: T, key: string | number) => boolean) | null,
    defaultValue?: D | (() => D),
): T | D | null {
    if (isObject(data)) {
        if (callback) {
            const result = objFirst(
                data,
                callback as (value: T, key: string) => boolean,
                defaultValue,
            );
            return result === undefined ? null : result;
        } else {
            const result = objFirst(data, undefined, defaultValue);
            return result === undefined ? null : result;
        }
    }

    if (callback) {
        const result = arrFirst(
            data,
            callback as (value: T, index: number) => boolean,
            defaultValue,
        );
        return result === undefined ? null : result;
    } else {
        const result = arrFirst(data, undefined, defaultValue);
        return result === undefined ? null : result;
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
export function dataLast<T, K extends ObjectKey = ObjectKey, D = null>(
    data: DataItems<T, K>,
    callback?: ((value: T, key: string | number) => boolean) | null,
    defaultValue?: D | (() => D),
): T | D | null {
    if (isObject(data)) {
        if (callback) {
            const result = objLast(
                data,
                callback as (value: T, key: string) => boolean,
                defaultValue,
            );
            return result === undefined ? null : result;
        } else {
            const result = objLast(data, undefined, defaultValue);
            return result === undefined ? null : result;
        }
    }

    if (callback) {
        const result = arrLast(
            data,
            callback as (value: T, index: number) => boolean,
            defaultValue,
        );
        return result === undefined ? null : result;
    } else {
        const result = arrLast(data, undefined, defaultValue);
        return result === undefined ? null : result;
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
export function dataContains<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    value: T | ((value: T, key: string | number) => boolean),
    strict = false,
): boolean {
    if (isObject(data)) {
        return objContains(
            data as Record<string, T>,
            value as
                | Record<string, unknown>
                | ((
                      value: Record<string, unknown>,
                      key: string | number,
                  ) => boolean),
            strict,
        );
    }

    return arrContains(arrWrap(data), value, strict);
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
 * Data.diff([1, 2, 3, 4], [2, 4]); -> [1, 3]
 * Data.diff({a: 1, b: 2, c: 3}, {b: 2, d: 4}); -> {a: 1, c: 3}
 */
export function dataDiff<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    other: DataItems<T, K>,
): DataItems<T, K> {
    if (isObject(data) && isObject(other)) {
        return objDiff(
            data as Record<string, T>,
            other as Record<string, T>,
        ) as DataItems<T, K>;
    }

    return arrDiff(arrWrap(data), arrWrap(other)) as DataItems<T>;
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
 * Data.pluck({a: {name: 'John'}, b: {name: 'Jane'}}, 'name'); // -> ['John', 'Jane']
 */
export function dataPluck<T, K extends ObjectKey = ObjectKey>(
    data: DataItems<T, K>,
    value: string | ((item: T) => T),
    key?: string | ((item: T) => string | number) | null,
): DataItems<T, K> {
    if (isObject(data)) {
        return objPluck(
            data as unknown as Record<string, Record<string, unknown>>,
            value as string | ((item: Record<string, unknown>) => unknown),
            key as
                | string
                | ((item: Record<string, unknown>) => string | number)
                | null,
        ) as DataItems<T, K>;
    }

    return arrPluck(
        arrWrap(data) as unknown as Record<string, unknown>[],
        value as string | ((item: Record<string, unknown>) => T),
        key as
            | string
            | ((item: Record<string, unknown>) => string | number)
            | null,
    ) as DataItems<T>;
}
