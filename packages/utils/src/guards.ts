import type { DataItems } from "@tolki/types";

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
 * Check if a value is iterable, meaning it implements the iterator protocol.
 *
 * Strings are excluded on purpose because they are treated as scalar values
 * rather than collections, which mirrors how PHP treats strings when a
 * function accepts an `iterable`.
 *
 * @param value - The value to check
 * @returns True if the value can be iterated over with `for...of`
 *
 * @example
 *
 * isIterable([1, 2, 3]); -> true
 * isIterable(new Set([1, 2])); -> true
 * isIterable(new Map()); -> true
 * isIterable("abc"); -> false
 * isIterable({ a: 1 }); -> false
 */
export function isIterable<T>(value: unknown): value is Iterable<T> {
    if (isNull(value) || isUndefined(value) || isString(value)) {
        return false;
    }

    return isFunction(
        (value as { [Symbol.iterator]?: unknown })[Symbol.iterator],
    );
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
 * Determine whether a value is falsy the way PHP's `array_filter()` (no
 * callback) treats it, i.e. PHP's own truthiness rules rather than JS's.
 *
 * Drops exactly `false`, `null`/`undefined`, the number `0`, the empty
 * string `""`, and the string `"0"` — but, unlike `isFalsy`, keeps `"00"`
 * and `"0.0"` (truthy in PHP) and `NaN` (PHP's `NAN` is truthy). An empty
 * array or empty plain object is also falsy, matching PHP's empty array.
 *
 * This is not a full PHP-exactness check: PHP has no equivalent of a
 * `Date`, `Map`, or `RegExp` instance, and any object with no own
 * enumerable keys (e.g. `new Date()`) is treated as falsy here purely
 * because it looks like an empty object — that's a pre-existing,
 * documented limitation, not a claim that this mirrors PHP for every JS
 * value.
 *
 * `isFalsy` cannot be reused for this: it treats `NaN` as falsy
 * (unconditional `Number.isNaN` check) and does NOT treat the exact
 * string `"0"` as falsy (its string branch is `value.trim() === ""`,
 * false for `"0"`), while also wrongly treating whitespace-only strings
 * as falsy (PHP only treats the empty string as falsy, not whitespace).
 *
 * @param value - The value to check
 * @returns True if the value is falsy under PHP's rules
 *
 * @example
 *
 * isPhpFalsy("0"); -> true
 * isPhpFalsy(""); -> true
 * isPhpFalsy(0); -> true
 * isPhpFalsy([]); -> true
 * isPhpFalsy({}); -> true
 * isPhpFalsy(false); -> true
 * isPhpFalsy(null); -> true
 * isPhpFalsy("00"); -> false
 * isPhpFalsy("0.0"); -> false
 * isPhpFalsy(NaN); -> false
 */
export function isPhpFalsy(value: unknown): boolean {
    if (
        value === false ||
        value === null ||
        isUndefined(value) ||
        value === 0 ||
        value === "" ||
        value === "0"
    ) {
        return true;
    }

    // Empty arrays are falsy in PHP
    if (isArray(value)) {
        return value.length === 0;
    }

    // Empty objects are falsy in PHP
    if (isObject(value)) {
        return Object.keys(value).length === 0;
    }

    return false;
}

/**
 * A precompiled matcher for PHP's numeric-string grammar: optional
 * surrounding whitespace (PHP's own set -- space, tab, newline, CR,
 * vertical tab, form feed, matching `_is_numeric_string`'s scan, not JS's
 * broader `\s`), an optional sign, digits with an optional decimal point
 * (either side may supply the digits, so both ".5" and "5." qualify), and
 * an optional exponent. No nested/overlapping quantifiers, so this cannot
 * backtrack catastrophically (CodeQL ReDoS).
 */
const PHP_NUMERIC_STRING_PATTERN =
    /^[ \t\n\r\v\f]*[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?[ \t\n\r\v\f]*$/;

/**
 * Determine whether a value is numeric the way PHP's `is_numeric()` treats
 * it, using PHP's numeric-string grammar rather than JS's `Number()`.
 *
 * `Number(value)` cannot be reused: `Number("")`, `Number(" ")`, and
 * `Number("0x10")` are all numeric to JS but not to PHP (hex strings
 * stopped being numeric in PHP 7), and `Number("Infinity")` is numeric to
 * JS but PHP has no numeric-string spelling for infinity.
 *
 * @param value - The value to check
 * @returns True if the value is numeric under PHP's rules
 *
 * @example
 *
 * isPhpNumeric(42); -> true
 * isPhpNumeric("42"); -> true
 * isPhpNumeric(" 42 "); -> true
 * isPhpNumeric("-3.14"); -> true
 * isPhpNumeric("1e3"); -> true
 * isPhpNumeric(".5"); -> true
 * isPhpNumeric(""); -> false
 * isPhpNumeric(" "); -> false
 * isPhpNumeric("0x10"); -> false
 * isPhpNumeric("Infinity"); -> false
 * isPhpNumeric("1_000"); -> false
 * isPhpNumeric(null); -> false
 */
export function isPhpNumeric(value: unknown): boolean {
    // typeof, not isNumber: PHP's is_numeric(NAN) and is_numeric(INF) are
    // both true (NAN/INF are still floats), but isNumber excludes NaN.
    if (typeof value === "number") {
        return true;
    }

    if (!isString(value)) {
        return false;
    }

    return PHP_NUMERIC_STRING_PATTERN.test(value);
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
 * Cast a value the way PHP's `(string)` operator does, but only for types that
 * have a real PHP scalar analogue. Returns `null` (the "no cast" sentinel) for
 * anything else, including NaN/Infinity and floats `String()` would render in
 * exponential notation — PHP's `precision=14` formatting is not ported.
 */
function toPhpScalarString(value: unknown): string | null {
    if (isString(value)) {
        return value;
    }

    if (isBoolean(value)) {
        return value ? "1" : "";
    }

    if (isNull(value)) {
        return "";
    }

    if (isFiniteNumber(value)) {
        // ECMA-262's Number::toString always lowercases the exponent marker,
        // so checking for "E" here would be dead code — no JS number produces it.
        const cast = String(value);
        return cast.includes("e") ? null : cast;
    }

    return null;
}

/**
 * Determine whether two values match the way PHP's `array_diff`/`array_intersect`
 * do: `(string) $a === (string) $b`. Only `string`, `boolean`, `null` and
 * plain finite numbers have a PHP scalar analogue to cast through; everything
 * else (`undefined`, symbols, functions, objects, arrays, `Date`, `NaN`,
 * `Infinity`, and high-precision/exponential floats) falls back to
 * SameValueZero identity instead of PHP's `"Array"` collapse or object-cast
 * fatal, neither of which has a safe JS equivalent.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if the values match under PHP's string-cast comparison, or are identical
 *
 * @example
 *
 * phpValueMatch(0, "0"); -> true
 * phpValueMatch(null, ""); -> true
 * phpValueMatch(true, "1"); -> true
 * phpValueMatch(0, ""); -> false
 * phpValueMatch(100, "1e2"); -> false (PHP's `==` agrees, but `(string)` does not)
 * phpValueMatch(NaN, NaN); -> true (SameValueZero fallback, not a string cast)
 */
export function phpValueMatch(a: unknown, b: unknown): boolean {
    const castA = toPhpScalarString(a);
    const castB = toPhpScalarString(b);

    if (castA !== null && castB !== null) {
        return castA === castB;
    }

    return (
        a === b ||
        (typeof a === "number" &&
            typeof b === "number" &&
            Number.isNaN(a) &&
            Number.isNaN(b))
    );
}
