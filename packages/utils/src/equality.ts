import {
    isArray,
    isBoolean,
    isNull,
    isPhpNumeric,
    isString,
    isUndefined,
} from "./guards";

/**
 * PHP has no `undefined`; this port uses it for the missing value `data_get` answers with null.
 *
 * @param value - The value to check.
 * @returns True if `value` is `null` or `undefined`.
 */
function isNullish(value: unknown): value is null | undefined {
    return isNull(value) || isUndefined(value);
}

/**
 * Order two strings by UTF-16 code unit, which is PHP's non-numeric string comparison.
 *
 * @param a - First string
 * @param b - Second string
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 */
function compareStrings(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * PHP's integer-string shape: its own whitespace set, an optional sign, digits.
 * No nested quantifiers, so it cannot backtrack catastrophically (CodeQL ReDoS).
 */
const PHP_INTEGER_STRING_PATTERN = /^[ \t\n\r\v\f]*[+-]?\d+[ \t\n\r\v\f]*$/;

/**
 * Order two numeric strings the way PHP does, which `Number()` alone cannot.
 *
 * Two integer strings compare exactly, because a double collapses them past
 * 2^53 — `"9007199254740993"` and `"…992"` are one `Number()` value. A pair
 * that overflows to the same infinity falls back to string order, as PHP's
 * `zendi_smart_strcmp` does.
 *
 * @param a - First numeric string
 * @param b - Second numeric string
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 */
function compareNumericStrings(a: string, b: string): number {
    if (
        PHP_INTEGER_STRING_PATTERN.test(a) &&
        PHP_INTEGER_STRING_PATTERN.test(b)
    ) {
        const leftInt = BigInt(a);
        const rightInt = BigInt(b);

        return leftInt < rightInt ? -1 : leftInt > rightInt ? 1 : 0;
    }

    const left = Number(a);
    const right = Number(b);

    if (left === right && !Number.isFinite(left)) {
        return compareStrings(a, b);
    }

    return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Cast a value the way PHP's `(bool)` does, for `<=>`'s rule that a null or a
 * boolean on either side compares both sides as booleans.
 *
 * @param value - The value to cast
 * @returns The value's PHP truthiness
 */
function toPhpBool(value: unknown): boolean {
    // typeof, not isNumber: PHP's (bool) NAN is true, so only a real zero is falsy.
    if (typeof value === "number") {
        return value !== 0;
    }

    if (isString(value)) {
        return value !== "" && value !== "0";
    }

    if (isArray(value)) {
        return value.length > 0;
    }

    return Boolean(value);
}

/**
 * Order two values the way PHP 8's `<=>` does.
 *
 * Numeric operands compare numerically (`"9"` sorts below `"10"`); null/boolean
 * compares both sides as booleans; arrays/objects order by JSON form.
 *
 * Faithful to PHP, this order is **not transitive** — `null` ties `0` and `""`,
 * yet `0 > ""`.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 *
 * @example
 * compareValues(0, ""); -> 1
 */
export function compareValues(a: unknown, b: unknown): number {
    // PHP takes the null-against-string arm before the boolean one, so null
    // compares as "" there and ends up below "0" rather than tying it.
    if (isNullish(a) && isString(b)) {
        return compareStrings("", b);
    }

    if (isString(a) && isNullish(b)) {
        return compareStrings(a, "");
    }

    if (isNullish(a) || isNullish(b) || isBoolean(a) || isBoolean(b)) {
        const left = toPhpBool(a);
        const right = toPhpBool(b);

        return left === right ? 0 : left ? 1 : -1;
    }

    // Stable JSON ordering, not PHP's array rule -- see the note on the docblock.
    if (typeof a === "object" && typeof b === "object") {
        return compareStrings(JSON.stringify(a), JSON.stringify(b));
    }

    if (isPhpNumeric(a) && isPhpNumeric(b)) {
        if (isString(a) && isString(b)) {
            return compareNumericStrings(a, b);
        }

        const left = Number(a);
        const right = Number(b);

        return left < right ? -1 : left > right ? 1 : 0;
    }

    if (isString(a) || isString(b)) {
        return compareStrings(String(a), String(b));
    }

    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
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

    // PHP's boolean comparison rules:
    // - true == any truthy value
    // - false == any falsy value
    if (typeof a === "boolean" || typeof b === "boolean") {
        const boolValue = typeof a === "boolean" ? a : b;
        const otherValue = typeof a === "boolean" ? b : a;

        // In PHP, true == any truthy value, false == any falsy value
        if (boolValue === true) {
            // Check if otherValue is truthy in PHP terms
            return !(
                otherValue === null ||
                otherValue === false ||
                otherValue === 0 ||
                otherValue === "" ||
                (Array.isArray(otherValue) && otherValue.length === 0)
            );
        } else {
            // boolValue === false
            // Check if otherValue is falsy in PHP terms
            // Note: otherValue === false and [] == false are already handled by JS loose equality above
            return otherValue === null || otherValue === 0 || otherValue === "";
        }
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
