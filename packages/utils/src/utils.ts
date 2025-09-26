import type { DataItems, ObjectKey } from "@laravel-js/types";

/**
 * Check if a value is an array.
 *
 * @param value - The value to check
 * @returns True if the value is an array
 */
export function isArray<T>(value: DataItems<T> | T[] | unknown): value is T[] {
    return Array.isArray(value);
}

/**
 * Check if a value is an object (not null, not array).
 *
 * @param value - The value to check
 * @returns True if the value is an object
 *
 * @example
 *
 * isObject({a: 1, b: 2}); // -> true
 * isObject([1, 2, 3]); // -> false
 * isObject(null); // -> false
 */
export function isObject<T, K extends ObjectKey = ObjectKey>(
    value: DataItems<T, K> | unknown,
): value is Record<K, T> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Check if a value is a string.
 *
 * @param value - The value to check
 * @returns True if the value is a string
 *
 * @example
 *
 * isString("hello"); // -> true
 * isString(123); // -> false
 * isString(null); // -> false
 */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/**
 * Check if a value is a number (and not NaN).
 *
 * @param value - The value to check
 * @returns True if the value is a valid number
 *
 * @example
 *
 * isNumber(123); // -> true
 * isNumber(3.14); // -> true
 * isNumber(NaN); // -> false
 * isNumber("123"); // -> false
 */
export function isNumber(value: unknown): value is number {
    return typeof value === "number" && !isNaN(value);
}

/**
 * Check if a value is a boolean.
 *
 * @param value - The value to check
 * @returns True if the value is a boolean
 *
 * @example
 *
 * isBoolean(true); // -> true
 * isBoolean(false); // -> true
 * isBoolean(0); // -> false
 * isBoolean("true"); // -> false
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

/**
 * Check if a value is a function.
 *
 * @param value - The value to check
 * @returns True if the value is a function
 *
 * @example
 *
 * isFunction(() => {}); // -> true
 * isFunction(Math.max); // -> true
 * isFunction("function"); // -> false
 * isFunction({}); // -> false
 */
export function isFunction(
    value: unknown,
): value is (...args: unknown[]) => unknown {
    return typeof value === "function";
}

/**
 * Check if a value is undefined.
 *
 * @param value - The value to check
 * @returns True if the value is undefined
 *
 * @example
 *
 * isUndefined(undefined); // -> true
 * isUndefined(null); // -> false
 * isUndefined(""); // -> false
 * isUndefined(0); // -> false
 */
export function isUndefined(value: unknown): value is undefined {
    return typeof value === "undefined";
}

/**
 * Check if a value is a symbol.
 *
 * @param value - The value to check
 * @returns True if the value is a symbol
 *
 * @example
 *
 * isSymbol(Symbol('test')); // -> true
 * isSymbol(Symbol.iterator); // -> true
 * isSymbol("symbol"); // -> false
 * isSymbol({}); // -> false
 */
export function isSymbol(value: unknown): value is symbol {
    return typeof value === "symbol";
}

/**
 * Check if a value is null.
 *
 * @param value - The value to check
 * @returns True if the value is null
 *
 * @example
 *
 * isNull(null); // -> true
 * isNull(undefined); // -> false
 * isNull(""); // -> false
 * isNull(0); // -> false
 */
export function isNull(value: unknown): value is null {
    return value === null;
}

/**
 * Helper function to safely compare two unknown values for sorting.
 * Provides stable comparison for objects using JSON serialization.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 *
 * @example
 * compareValues(1, 2); // -> -1
 * compareValues('b', 'a'); // -> 1
 * compareValues({x: 1}, {x: 1}); // -> 0
 */
export function compareValues(a: unknown, b: unknown): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    // For objects, compare by JSON string representation for stable sorting
    if (typeof a === "object" && typeof b === "object") {
        const aStr = JSON.stringify(a);
        const bStr = JSON.stringify(b);
        if (aStr < bStr) return -1;
        if (aStr > bStr) return 1;
        return 0;
    }

    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/**
 * Helper function to resolve a default value (either direct value or lazy function).
 *
 * @param defaultValue - The default value or lazy function
 * @returns The resolved default value
 *
 * @example
 * resolveDefault('hello'); // -> 'hello'
 * resolveDefault(() => 'world'); // -> 'world'
 * resolveDefault(undefined); // -> null
 */
export function resolveDefault<D>(defaultValue?: D | (() => D)): D | null {
    if (defaultValue === undefined) {
        return null;
    }
    return typeof defaultValue === "function"
        ? (defaultValue as () => D)()
        : (defaultValue as D);
}

/**
 * Helper function to normalize data to an array format.
 * Handles arrays only now.
 *
 * @param data - The data to normalize (array or other)
 * @returns An array representation of the data, or null if not accessible
 *
 * @example
 * normalizeToArray([1, 2, 3]); // -> [1, 2, 3]
 * normalizeToArray('hello'); // -> null
 */
export function normalizeToArray<T>(
    data: ReadonlyArray<T> | unknown,
): T[] | null {
    if (Array.isArray(data)) {
        return data.slice() as T[];
    }
    return null;
}

/**
 * Helper function to check if data is accessible (array only).
 *
 * @param data - The data to check
 * @returns True if data is an array
 *
 * @example
 * isAccessibleData([1, 2, 3]); // -> true
 * isAccessibleData('hello'); // -> false
 */
export function isAccessibleData(data: unknown): boolean {
    return Array.isArray(data);
}

/**
 * Helper function to get normalized values from data.
 * Returns array values or empty array if data is not accessible.
 *
 * @param data - The data to get values from
 * @returns Array of values or empty array
 *
 * @example
 * getAccessibleValues([1, 2, 3]); // -> [1, 2, 3]
 * getAccessibleValues('hello'); // -> []
 */
export function getAccessibleValues<T>(data: ReadonlyArray<T> | unknown): T[] {
    const normalized = normalizeToArray<T>(data);
    return normalized || [];
}
