import {
    isArray,
    isBoolean,
    isFunction,
    isInteger,
    isNull,
    isNumber,
    isObject,
    isPlainObject,
    isString,
    isUndefined,
} from "./guards";

/**
 * Get a more specific type description for debugging purposes.
 * Reports JavaScript's `typeof` name, except that an array reports as "array".
 *
 * @param {unknown} v - The value to get the type of.
 * @returns {string} A string describing the type.
 * @example
 * Get specific types
 * typeOf(null); -> "object"
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

/**
 * Name a value's type as PHP's `get_debug_type()` does, for messages that name what they were given.
 *
 * @param value - The value to name
 * @returns null, int, float, string, bool, array, Closure for a function, or the class's name (Parent@anonymous for an
 * anonymous class extending Parent, class@anonymous for one extending none), else the JavaScript typeof name
 *
 * @example
 * phpDebugType(1.5); -> "float"
 * phpDebugType({ a: 1 }); -> "array"
 * phpDebugType(() => 1); -> "Closure"
 * phpDebugType(new Date()); -> "Date"
 */
export function phpDebugType(value: unknown): string {
    // The port reads undefined as PHP's null.
    if (isNull(value) || isUndefined(value)) {
        return "null";
    }

    if (typeOf(value) === "number") {
        return isInteger(value) ? "int" : "float";
    }

    if (isString(value)) {
        return "string";
    }

    if (isBoolean(value)) {
        return "bool";
    }

    // A plain object stands in for a PHP array.
    if (isArray(value) || isPlainObject(value)) {
        return "array";
    }

    // Every PHP closure is an instance of the Closure class.
    if (isFunction(value)) {
        return "Closure";
    }

    if (isObject(value) && isFunction(value["constructor"])) {
        return className(value["constructor"]);
    }

    // JS-only: PHP has no symbol, bigint or classless object, so each keeps its typeof name.
    return typeOf(value);
}

/**
 * Name a class as PHP's `get_debug_type()` names it.
 *
 * @param constructor - The class to name
 * @returns The class's name, or for an anonymous class the name of the class it extends and `@anonymous`
 */
function className(constructor: { name: string }): string {
    if (constructor.name) {
        return constructor.name;
    }

    const parent: unknown = Object.getPrototypeOf(constructor);

    // An anonymous class extending none has Function.prototype, whose name is empty, as its parent.
    return `${isFunction(parent) && parent.name ? parent.name : "class"}@anonymous`;
}
