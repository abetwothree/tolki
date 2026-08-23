import { isArray, isFunction, isNull, isObject } from "./guards";

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
export function toJsonable<T>(
    value: unknown,
): value is { toJson(): T } | { toJSON(): T } {
    if (!isObject(value) || isNull(value)) {
        return false;
    }

    const hasToJson = isFunction((value as { toJson: () => T }).toJson);
    const hasToJSON = isFunction((value as { toJSON: () => T }).toJSON);

    return hasToJson || hasToJSON;
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
