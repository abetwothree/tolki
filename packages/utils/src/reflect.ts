import {
    isArray,
    isFunction,
    isInteger,
    isNull,
    isNumber,
    isUndefined,
} from "./guards";

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

/**
 * Render a value's type the way PHP's gettype() does, for Arr::array()-style messages.
 *
 * @param value - The value whose type name is needed.
 * @returns The PHP type name ("NULL", "integer", "double", or the JS typeof otherwise).
 */
export function phpTypeName(value: unknown): string {
    if (isNull(value)) {
        return "NULL";
    }

    if (isNumber(value)) {
        return isInteger(value) ? "integer" : "double";
    }

    // `typeof []` is "object"; PHP's gettype() calls an array an array.
    if (isArray(value)) {
        return "array";
    }

    // `typeof` disagrees with gettype() on three more shapes: NaN is a float in
    // PHP, a closure is an object, and an absent value reads NULL.
    if (Number.isNaN(value)) {
        return "double";
    }

    if (isFunction(value)) {
        return "object";
    }

    if (isUndefined(value)) {
        return "NULL";
    }

    return typeof value;
}
