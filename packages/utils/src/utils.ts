import type { DataItems } from "@laravel-js/types";

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
 * isObject({a: 1, b: 2}); -> true
 * isObject([1, 2, 3]); -> false
 * isObject(null); -> false
 */
export function isObject<T, K extends PropertyKey = PropertyKey>(
    value: DataItems<T, K> | unknown,
): value is Record<K, T> {
    return !isNull(value) && typeof value === "object" && !isArray(value);
}

/**
 * Check if a value is any object (including arrays, null).
 *
 * @param value - The value to check
 * @returns True if the value is any object
 *
 * @example
 *
 * isObjectAny({a: 1, b: 2}); -> true
 * isObjectAny([1, 2, 3]); -> true
 * isObjectAny(null); -> true
 */
export function isObjectAny(value: unknown): value is object {
    return typeof value === "object";
}

/**
 * Check if a value is a truthy object (not null, not undefined, and an object).
 *
 * @param value - The value to check
 * @returns True if the value is a truthy object
 *
 * @example
 *
 * isTruthyObject({a: 1, b: 2}); -> true
 * isTruthyObject([1, 2, 3]); -> true
 * isTruthyObject(null); -> false
 * isTruthyObject(undefined); -> false
 */
export function isTruthyObject(value: unknown): value is object {
    return !isNull(value) && !isUndefined(value) && isObjectAny(value);
}

/**
 * Check if a value is a string.
 *
 * @param value - The value to check
 * @returns True if the value is a string
 *
 * @example
 *
 * isString("hello"); -> true
 * isString(123); -> false
 * isString(null); -> false
 */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/**
 * Check if a value is stringable (can be converted to a string).
 *
 * @param value - The value to check
 * @returns True if the value is stringable
 *
 * @example
 *
 * isStringable("hello"); -> true
 * isStringable(new Stringable('test')); -> true
 * isStringable({ toString: () => "world" }); -> true
 * isStringable(123); -> false
 * isStringable(null); -> false
 */
export function isStringable(
    value: unknown,
): value is string | { toString(): string } {
    if (isString(value)) {
        return true;
    }

    if (isNumber(value)) {
        return true;
    }

    if (objectToString(value)) {
        return true;
    }

    return false;
}

/**
 * Check if a value is an object with a toString method.
 *
 * @param value - The value to check
 * @returns True if the value is an object with a toString method
 */
export function objectToString(
    value: unknown,
): value is { toString(): string } {
    if (
        isObject(value) &&
        isFunction((value as Record<string, unknown>).toString)
    ) {
        return true;
    }

    return false;
}

/**
 * Check if a value is a number (and not NaN).
 *
 * @param value - The value to check
 * @returns True if the value is a valid number
 *
 * @example
 *
 * isNumber(123); -> true
 * isNumber(3.14); -> true
 * isNumber(NaN); -> false
 * isNumber("123"); -> false
 */
export function isNumber(value: unknown): value is number {
    return typeof value === "number" && !isNaN(value);
}

/**
 * Check if a value is an integer.
 *
 * @param value - The value to check
 * @returns True if the value is an integer
 */
export function isInteger(value: unknown): value is number {
    return isNumber(value) && Number.isInteger(value);
}

/**
 * Check if a value is a float.
 *
 * @param value - The value to check
 * @returns True if the value is a float
 */
export function isFloat(value: unknown): value is number {
    return isNumber(value) && !Number.isInteger(value);
}

/**
 * Check if a value is a positive number.
 *
 * @param value - The value to check
 * @returns True if the value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
    return isNumber(value) && value >= 0;
}

/**
 * Check if a value is a negative number.
 *
 * @param value - The value to check
 * @returns True if the value is a negative number
 */
export function isNegativeNumber(value: unknown): value is number {
    return isNumber(value) && value < 0;
}

/**
 * Check if a value is a boolean.
 *
 * @param value - The value to check
 * @returns True if the value is a boolean
 *
 * @example
 *
 * isBoolean(true); -> true
 * isBoolean(false); -> true
 * isBoolean(0); -> false
 * isBoolean("true"); -> false
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
 * isFunction(() => {}); -> true
 * isFunction(Math.max); -> true
 * isFunction("function"); -> false
 * isFunction({}); -> false
 */
export function isFunction<T extends (...args: unknown[]) => unknown>(
    value: unknown,
): value is T {
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
 * isUndefined(undefined); -> true
 * isUndefined(null); -> false
 * isUndefined(""); -> false
 * isUndefined(0); -> false
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
 * isSymbol(Symbol('test')); -> true
 * isSymbol(Symbol.iterator); -> true
 * isSymbol("symbol"); -> false
 * isSymbol({}); -> false
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
 * isNull(null); -> true
 * isNull(undefined); -> false
 * isNull(""); -> false
 * isNull(0); -> false
 */
export function isNull(value: unknown): value is null {
    return value === null;
}

/**
 * Check if a value is a Map.
 *
 * @param value - The value to check
 * @returns True if the value is a Map
 *
 * @example
 *
 * isMap(new Map()); -> true
 * isMap({}); -> false
 * isMap([]); -> false
 */
export function isMap<K, V>(value: unknown): value is Map<K, V> {
    return value instanceof Map;
}

/**
 * Check if a value is a Set.
 *
 * @param value - The value to check
 * @returns True if the value is a Set
 *
 * @example
 *
 * isSet(new Set()); -> true
 * isSet({}); -> false
 * isSet([]); -> false
 */
export function isSet<T>(value: unknown): value is Set<T> {
    return value instanceof Set;
}

/**
 * Check if a value is a WeakMap.
 *
 * @param value - The value to check
 * @returns True if the value is a WeakMap
 */
export function isWeakMap<K extends object, V>(
    value: unknown,
): value is WeakMap<K, V> {
    return value instanceof WeakMap;
}

/**
 * Check if a value is a WeakSet.
 *
 * @param value - The value to check
 * @returns True if the value is a WeakSet
 */
export function isWeakSet<T extends object>(
    value: unknown,
): value is WeakSet<T> {
    return value instanceof WeakSet;
}

/**
 * Check if a value is arrayable (has a toArray method).
 *
 * @param value - The value to check
 * @returns True if the value is arrayable
 *
 * @example
 *
 * isArrayable({ toArray: () => [1, 2, 3] }); -> true
 * isArrayable([1, 2, 3]); -> false
 * isArrayable("hello"); -> false
 */
export function toArrayable<T>(value: unknown): value is { toArray(): T[] } {
    return (
        isObject(value) &&
        !isNull(value) &&
        isFunction((value as { toArray: () => T[] }).toArray)
    );
}

/**
 * Check if a value is jsonable (has a toJSON method).
 *
 * @param value - The value to check
 * @returns True if the value is jsonable
 *
 * @example
 *
 * isJsonable({ toJSON: () => ({ a: 1 }) }); -> true
 * isJsonable("hello"); -> false
 */
export function toJsonable<T>(value: unknown): value is { toJSON(): T } {
    return (
        isObject(value) &&
        !isNull(value) &&
        isFunction((value as { toJSON: () => T }).toJSON)
    );
}

/**
 * Check if a value is json serializable (has a jsonSerialize method).
 *
 * @param value - The value to check
 * @returns True if the value is json serializable
 *
 * @example
 *
 * isJsonSerializable({ jsonSerialize: () => ({ a: 1 }) }); -> true
 * isJsonSerializable("hello"); -> false
 */
export function toJsonSerializable<T>(
    value: unknown,
): value is { jsonSerialize(): T } {
    return (
        isObject(value) &&
        !isNull(value) &&
        isFunction((value as { jsonSerialize: () => T }).jsonSerialize)
    );
}

/**
 * Check if a value is falsy (undefined, null, false, 0, "", empty array/object).
 *
 * @param value - The value to check
 * @returns True if the value is falsy
 *
 * @example
 *
 * isFalsy(undefined); -> true
 * isFalsy(null); -> true
 * isFalsy(false); -> true
 * isFalsy(0); -> true
 * isFalsy(""); -> true
 * isFalsy([]); -> true
 * isFalsy({}); -> true
 * isFalsy("hello"); -> false
 * isFalsy([1, 2, 3]); -> false
 * isFalsy({ a: 1 }); -> false
 */
export function isFalsy<TValue = unknown>(value: TValue): boolean {
    if (Number.isNaN(value as number)) {
        return true;
    }

    if (isNumber(value)) {
        return value === 0;
    }

    if (isUndefined(value) || isNull(value)) {
        return true;
    }

    if (isBoolean(value)) {
        return value === false;
    }

    if (isString(value)) {
        return value.trim() === "";
    }

    if (isMap(value)) {
        return value.size === 0;
    }

    if (isSet(value)) {
        return value.size === 0;
    }

    if (isArray(value)) {
        return value.length === 0;
    }

    if (isObject(value)) {
        return Object.keys(value).length === 0;
    }

    return false;
}

/**
 * Check if a value is truthy (not falsy).
 *
 * @param value - The value to check
 * @returns True if the value is truthy
 *
 * @example
 *
 * isTruthy(1); -> true
 * isTruthy("hello"); -> true
 * isTruthy([1, 2, 3]); -> true
 * isTruthy({ a: 1 }); -> true
 * isTruthy(0); -> false
 * isTruthy(""); -> false
 * isTruthy([]); -> false
 * isTruthy({}); -> false
 */
export function isTruthy(value: unknown): boolean {
    return !isFalsy(value);
}

/**
 * Get a more specific type description for debugging purposes.
 * Differentiates between null, arrays, and other types.
 *
 * @param {unknown} v - The value to get the type of.
 * @returns {string} A string describing the type.
 * @example
 * Get specific types
 * typeOf(null); -> "null"
 * typeOf([]); -> "array"
 * typeOf({}); -> "object"
 */
export function typeOf(v: unknown): string {
    if (isNull(v)) return "object";
    if (isArray(v)) return "array";
    return typeof v;
}

/**
 * Check if a value is a primitive type (null, boolean, number, string, symbol, undefined).
 *
 * @param value - The value to check
 * @returns True if the value is a primitive
 *
 * @example
 *
 * isPrimitive(123); -> true
 * isPrimitive("hello"); -> true
 * isPrimitive(null); -> true
 * isPrimitive({}); -> false
 * isPrimitive([]); -> false
 */
export function isPrimitive(value: unknown): boolean {
    return (
        isNull(value) ||
        isBoolean(value) ||
        isNumber(value) ||
        isString(value) ||
        isSymbol(value) ||
        isUndefined(value)
    );
}

/**
 * Check if a value is a non-primitive type (object, array, function, etc.).
 *
 * @param value - The value to check
 * @returns True if the value is a non-primitive
 *
 * @example
 *
 * isNonPrimitive({}); -> true
 * isNonPrimitive([]); -> true
 * isNonPrimitive(() => {}); -> true
 * isNonPrimitive(123); -> false
 * isNonPrimitive("hello"); -> false
 */
export function isNonPrimitive(value: unknown): boolean {
    return !isPrimitive(value);
}

/**
 * Check if a value is a finite number.
 *
 * @param value - The value to check
 * @returns True if the value is a finite number
 *
 * @example
 *
 * isFiniteNumber(123); -> true
 * isFiniteNumber(3.14); -> true
 * isFiniteNumber(Infinity); -> false
 * isFiniteNumber(NaN); -> false
 * isFiniteNumber("123"); -> false
 */
export function isFiniteNumber(value: unknown): value is number {
    return isNumber(value) && Number.isFinite(value);
}

/**
 * Convert a value to an array if it's already an array, otherwise return null.
 * Used internally for safe array conversion without coercion.
 *
 * @param {unknown} value - The value to convert.
 * @returns {unknown[] | null} The array if value is an array, null otherwise.
 * @example
 * Convert to array
 * toArray([1, 2, 3]); -> [1, 2, 3]
 * toArray("hello"); -> null
 * toArray({}); -> null
 */
export function castableToArray<T>(value: unknown): T[] | null {
    if (isArray(value)) return value as T[];
    return null;
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
 * compareValues(1, 2); -> -1
 * compareValues('b', 'a'); -> 1
 * compareValues({x: 1}, {x: 1}); -> 0
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
 * resolveDefault('hello'); -> 'hello'
 * resolveDefault(() => 'world'); -> 'world'
 * resolveDefault(undefined); -> null
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
 * normalizeToArray([1, 2, 3]); -> [1, 2, 3]
 * normalizeToArray('hello'); -> null
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
 * isAccessibleData([1, 2, 3]); -> true
 * isAccessibleData('hello'); -> false
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
 * getAccessibleValues([1, 2, 3]); -> [1, 2, 3]
 * getAccessibleValues('hello'); -> []
 */
export function getAccessibleValues<T>(data: ReadonlyArray<T> | unknown): T[] {
    const normalized = normalizeToArray<T>(data);
    return normalized || [];
}

/**
 * PHP-like loose equality comparison.
 * Mimics PHP's == operator behavior where null, false, 0, '', and [] are considered loosely equal.
 * Also handles deep comparison for arrays and objects.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are loosely equal in PHP-like manner
 *
 * @example
 *
 * looseEqual(null, false); -> true
 * looseEqual(null, 0); -> true
 * looseEqual(null, ''); -> true
 * looseEqual(0, false); -> true
 * looseEqual(1, '1'); -> true
 * looseEqual(['a'], ['a']); -> true
 */
export function looseEqual(a: unknown, b: unknown): boolean {
    // Use JavaScript's loose equality first
    if (a == b) {
        return true;
    }

    // PHP considers these "falsy" values as loosely equal to each other:
    // null, false, 0, '', []
    const isFalsyA =
        a === null ||
        a === false ||
        a === 0 ||
        a === "" ||
        (Array.isArray(a) && a.length === 0);
    const isFalsyB =
        b === null ||
        b === false ||
        b === 0 ||
        b === "" ||
        (Array.isArray(b) && b.length === 0);

    if (isFalsyA && isFalsyB) {
        return true;
    }

    // Handle deep comparison for arrays
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }

        for (let i = 0; i < a.length; i++) {
            if (!looseEqual(a[i], b[i])) {
                return false;
            }
        }

        return true;
    }

    // Handle deep comparison for plain objects
    if (
        a !== null &&
        b !== null &&
        typeof a === "object" &&
        typeof b === "object" &&
        !Array.isArray(a) &&
        !Array.isArray(b)
    ) {
        const keysA = Object.keys(a as Record<string, unknown>);
        const keysB = Object.keys(b as Record<string, unknown>);

        if (keysA.length !== keysB.length) {
            return false;
        }

        for (const key of keysA) {
            if (!keysB.includes(key)) {
                return false;
            }

            if (
                !looseEqual(
                    (a as Record<string, unknown>)[key],
                    (b as Record<string, unknown>)[key],
                )
            ) {
                return false;
            }
        }

        return true;
    }

    return false;
}

/**
 * PHP-like strict equality comparison (=== operator).
 * Performs strict type checking for primitives but value-based comparison for arrays and objects.
 * NOTE: For class instances (objects with constructors other than Object), uses reference equality.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are strictly equal in PHP-like manner
 *
 * @example
 *
 * strictEqual(1, 1); -> true
 * strictEqual(1, '1'); -> false (different types)
 * strictEqual(['a'], ['a']); -> true (same array content)
 * strictEqual({a: 1}, {a: 1}); -> true (same object content)
 */
export function strictEqual(a: unknown, b: unknown): boolean {
    // Use JavaScript's strict equality first (handles primitives and same reference)
    if (a === b) {
        return true;
    }

    // Handle deep comparison for arrays with strict element comparison
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }

        for (let i = 0; i < a.length; i++) {
            if (!strictEqual(a[i], b[i])) {
                return false;
            }
        }

        return true;
    }

    // Handle deep comparison for plain objects with strict value comparison
    // But NOT for class instances - those should only match by reference
    if (
        a !== null &&
        b !== null &&
        typeof a === "object" &&
        typeof b === "object" &&
        !Array.isArray(a) &&
        !Array.isArray(b)
    ) {
        // Check if these are plain objects (constructor is Object)
        // If they're class instances, they should only match by reference (already failed above)
        const isPlainA =
            a.constructor === Object || a.constructor === undefined;
        const isPlainB =
            b.constructor === Object || b.constructor === undefined;

        if (!isPlainA || !isPlainB) {
            // At least one is a class instance, use reference equality (already failed)
            return false;
        }

        const keysA = Object.keys(a as Record<string, unknown>);
        const keysB = Object.keys(b as Record<string, unknown>);

        if (keysA.length !== keysB.length) {
            return false;
        }

        for (const key of keysA) {
            if (!keysB.includes(key)) {
                return false;
            }

            if (
                !strictEqual(
                    (a as Record<string, unknown>)[key],
                    (b as Record<string, unknown>)[key],
                )
            ) {
                return false;
            }
        }

        return true;
    }

    return false;
}
