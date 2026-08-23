import { isArray, isNull } from "./guards";

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
    if (isNull(v)) {
        return "object";
    }

    if (isArray(v)) {
        return "array";
    }
    return typeof v;
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
