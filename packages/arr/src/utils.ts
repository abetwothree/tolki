import { Collection } from "@laravel-js/collection";

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
 * Handles both arrays and Collections consistently.
 *
 * @param data - The data to normalize (array, Collection, or other)
 * @returns An array representation of the data, or null if not accessible
 * 
 * @example
 * normalizeToArray([1, 2, 3]); // -> [1, 2, 3]
 * normalizeToArray(new Collection([1, 2, 3])); // -> [1, 2, 3]
 * normalizeToArray('hello'); // -> null
 */
export function normalizeToArray<T>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
): T[] | null {
    if (Array.isArray(data)) {
        return data.slice() as T[];
    }
    if (data instanceof Collection) {
        return data.all() as T[];
    }
    return null;
}

/**
 * Helper function to check if data is accessible (array or Collection).
 *
 * @param data - The data to check
 * @returns True if data is an array or Collection
 * 
 * @example
 * isAccessibleData([1, 2, 3]); // -> true
 * isAccessibleData(new Collection([1, 2, 3])); // -> true
 * isAccessibleData('hello'); // -> false
 */
export function isAccessibleData(data: unknown): boolean {
    return Array.isArray(data) || data instanceof Collection;
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
 * getAccessibleValues(new Collection([1, 2, 3])); // -> [1, 2, 3]
 * getAccessibleValues('hello'); // -> []
 */
export function getAccessibleValues<T>(
    data: ReadonlyArray<T> | Collection<T[]> | unknown,
): T[] {
    const normalized = normalizeToArray(data);
    return (normalized as T[]) || [];
}