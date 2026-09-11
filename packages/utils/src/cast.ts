import {
    isArray,
    isBoolean,
    isFunction,
    isIterable,
    isMap,
    isNull,
    isNumber,
    isObject,
    isUndefined,
} from "./guards";
import { defineKey, isPhpArrayKey } from "./keys";

/** PHP's default `precision` ini setting: the significant digits its `(string)` cast prints for a float. */
const PHP_FLOAT_PRECISION = 14;

/**
 * Cast a value to the string key PHP's `array_combine` stores it under:
 * `null`, `undefined` and `false` become `""`, `true` becomes `"1"`, a number prints the way PHP's
 * `(string)` cast prints it (`INF`, `-0`, `1.0E+21`, 14 significant digits), anything else is stringified.
 *
 * A whole-number JS number always prints as an integer: JS has one number type, so it can't tell
 * PHP's float `123456789012345.0` from the integer `123456789012345`.
 *
 * @param value - The value to use as a key
 * @returns The key string
 *
 * @example
 * toPhpKeyString(true); -> "1"
 * toPhpKeyString(0.1 + 0.2); -> "0.3"
 */
export function toPhpKeyString(value: unknown): string {
    if (isNull(value) || isUndefined(value) || value === false) {
        return "";
    }

    if (value === true) {
        return "1";
    }

    return isNumber(value) || Number.isNaN(value)
        ? phpNumberToString(value as number)
        : String(value);
}

/**
 * Print a number the way PHP 8's `(string)` cast does. An integer in PHP's int range prints exactly;
 * any other number is a float there, printed by `zend_gcvt` with 14 significant digits.
 *
 * @param value - The number to print
 * @returns The string PHP would produce
 */
function phpNumberToString(value: number): string {
    if (Number.isNaN(value)) {
        return "NAN";
    }

    if (!Number.isFinite(value)) {
        return value > 0 ? "INF" : "-INF";
    }

    // PHP has no integer -0, so -0 can only be the float -0.0.
    if (isPhpArrayKey(value) && !Object.is(value, -0)) {
        return BigInt(value).toString();
    }

    const [digits, point] = phpFloatDigits(Math.abs(value));
    const sign = value < 0 || Object.is(value, -0) ? "-" : "";

    if (point < -3 || point > PHP_FLOAT_PRECISION) {
        const exponent = point - 1;
        const mantissa = `${digits.charAt(0)}.${digits.slice(1) || "0"}`;

        return `${sign}${mantissa}E${exponent < 0 ? "-" : "+"}${Math.abs(exponent)}`;
    }

    if (point <= 0) {
        return `${sign}0.${"0".repeat(-point)}${digits}`;
    }

    const whole = digits.slice(0, point).padEnd(point, "0");
    const fraction = digits.slice(point);

    return fraction === "" ? `${sign}${whole}` : `${sign}${whole}.${fraction}`;
}

/**
 * The significant digits PHP prints for a non-negative finite float, and where the decimal point falls in them:
 * the exact value rounded to 14 digits, half to even as `zend_dtoa` rounds, without trailing zeros.
 *
 * @param value - The float's magnitude
 * @returns The digits, and how many of them come before the decimal point (negative for leading zeros)
 */
function phpFloatDigits(value: number): [digits: string, point: number] {
    if (value === 0) {
        return ["0", 1];
    }

    // Doubling is exact, so the value is scaled / 2^places, whose exact decimal digits are scaled * 5^places.
    let scaled = value;
    let places = 0;

    while (!Number.isInteger(scaled)) {
        scaled *= 2;
        places++;
    }

    const exact = (BigInt(scaled) * 5n ** BigInt(places)).toString();
    const rest = exact.slice(PHP_FLOAT_PRECISION);
    const half = "5".padEnd(rest.length, "0");
    let digits = exact.slice(0, PHP_FLOAT_PRECISION);
    let point = exact.length - places;

    if (rest > half || (rest === half && Number(digits.at(-1)) % 2 === 1)) {
        const rounded = String(BigInt(digits) + 1n);

        // A carry out of the last digit (99…9 + 1) moves the decimal point one place right.
        point += rounded.length - digits.length;
        digits = rounded;
    }

    while (digits.endsWith("0")) {
        digits = digits.slice(0, -1);
    }

    return [digits, point];
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
 * Unwrap an Enumerable/Arrayable-like operand the way Laravel's `getArrayableItems()` does:
 * call `all()`, else `toArray()`, else `toJSON()`, and repeat on the result.
 *
 * @param items - The operand to unwrap
 * @returns The first value in the chain that exposes none of those methods
 */
function unwrapArrayable(items: unknown): unknown {
    if (!isObject(items)) {
        return items;
    }

    for (const method of ["all", "toArray", "toJSON"] as const) {
        if (isFunction(items[method])) {
            return unwrapArrayable((items[method] as () => unknown)());
        }
    }

    return items;
}

/**
 * Normalize a set-operation operand the way Laravel's
 * `EnumeratesValues::getArrayableItems()` does: nullish becomes an empty array,
 * an Enumerable/Arrayable-like object unwraps via `all()`/`toArray()`, an
 * iterable spreads, a plain object contributes its values, anything else
 * becomes a one-element array.
 *
 * @param items - The operand to normalize
 * @returns The operand's values, in iteration order
 *
 * @example
 * arrayableValues({ x: 20 }); -> [20]
 */
export function arrayableValues<T>(items: unknown): T[] {
    const unwrapped = unwrapArrayable(items);

    if (isNull(unwrapped) || isUndefined(unwrapped)) {
        return [];
    }

    if (isArray(unwrapped)) {
        return unwrapped.slice() as T[];
    }

    if (isObject(unwrapped)) {
        // A Map's default iterator yields [key, value] pairs; PHP's foreach over a
        // Traversable yields values only, so unwrap via values() instead of spreading.
        if (isMap(unwrapped)) {
            return [...unwrapped.values()] as T[];
        }

        if (isIterable(unwrapped)) {
            return [...(unwrapped as Iterable<T>)];
        }

        return Object.values(unwrapped) as T[];
    }

    return [unwrapped as T];
}

/**
 * Normalize a keyed operand the way Laravel's `getArrayableItems()` does:
 * nullish becomes `{}`, an Enumerable/Arrayable-like object unwraps via `all()`/`toArray()`/`toJSON()`,
 * a Map or other iterable becomes an object, and a list becomes an index-keyed object.
 *
 * @param items - The operand to normalize
 * @returns The operand's entries as a plain object
 *
 * @example
 * arrayableItems({ all: () => ({ a: 1 }) }); -> { a: 1 }
 */
export function arrayableItems(items: unknown): Record<string, unknown> {
    const unwrapped = unwrapArrayable(items);

    if (isNull(unwrapped) || isUndefined(unwrapped)) {
        return {};
    }

    if (isArray(unwrapped)) {
        return { ...unwrapped };
    }

    if (isObject(unwrapped)) {
        if (isMap(unwrapped)) {
            const out: Record<string, unknown> = {};

            for (const [key, value] of unwrapped) {
                defineKey(out, String(key), value);
            }

            return out;
        }

        if (isIterable(unwrapped)) {
            return { ...[...(unwrapped as Iterable<unknown>)] };
        }

        return unwrapped;
    }

    return { 0: unwrapped };
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
