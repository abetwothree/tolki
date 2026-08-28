import {
    isArray,
    isBoolean,
    isFunction,
    isIterable,
    isMap,
    isNull,
    isObject,
    isUndefined,
} from "./guards";

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

/**
 * Normalize a set-operation operand the way Laravel's
 * `EnumeratesValues::getArrayableItems()` does before `array_diff`/
 * `array_intersect` sees it: nullish becomes an empty array; an
 * Enumerable/Arrayable-like object unwraps via `all()`/`toArray()`, an
 * iterable spreads, a plain object contributes its own values, and any other
 * scalar becomes a one-element array.
 *
 * @param items - The operand to normalize
 * @returns The operand's values, in iteration order
 *
 * @example
 * arrayableValues([1, 2]); -> [1, 2]
 * arrayableValues({ x: 20 }); -> [20]
 * arrayableValues({ all: () => [1, 2] }); -> [1, 2]
 * arrayableValues(new Set([1, 2])); -> [1, 2]
 * arrayableValues(null); -> []
 * arrayableValues("x"); -> ["x"]
 */
export function arrayableValues<T>(items: unknown): T[] {
    if (isNull(items) || isUndefined(items)) {
        return [];
    }

    if (isArray(items)) {
        return items.slice() as T[];
    }

    if (isObject(items)) {
        const source = items as Record<string, unknown>;

        if (isFunction(source["all"])) {
            return arrayableValues<T>((source["all"] as () => unknown)());
        }

        if (isFunction(source["toArray"])) {
            return arrayableValues<T>((source["toArray"] as () => unknown)());
        }

        if (isFunction(source["toJSON"])) {
            return arrayableValues<T>((source["toJSON"] as () => unknown)());
        }

        // A Map's default iterator yields [key, value] pairs; PHP's foreach over a
        // Traversable yields values only, so unwrap via values() instead of spreading.
        if (isMap(items)) {
            return [...items.values()] as T[];
        }

        if (isIterable(items)) {
            return [...(items as Iterable<T>)];
        }

        return Object.values(items) as T[];
    }

    return [items as T];
}

/**
 * Cast a CSS-list value the way PHP casts it when pushed raw into
 * `implode()`/`Str::finish()`: `null` becomes `""`, a boolean becomes
 * `"1"`/`""`, and everything else goes through `String()`.
 *
 * @param value - The CSS class or style fragment to cast.
 * @returns The string PHP would have interpolated.
 */
export function cssListItemToString(value: unknown): string {
    if (isNull(value) || isUndefined(value)) {
        return "";
    }

    if (isBoolean(value)) {
        return value ? "1" : "";
    }

    return String(value);
}
