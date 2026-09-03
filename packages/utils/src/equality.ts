import {
    isArray,
    isBoolean,
    isNull,
    isObject,
    isPhpFalsy,
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
 * The first magnitude beyond PHP's 64-bit `int`. `PHP_INT_MAX` (2^63 - 1) is not
 * representable as a JavaScript double, so this bound serves as the exclusive upper
 * limit and, negated, as the inclusive lower one (`PHP_INT_MIN`, exactly -2^63).
 */
const PHP_INT_BOUND = 2 ** 63;

/** The same bound as a bigint, for operands compared exactly rather than as doubles. */
const PHP_INT_BOUND_BIGINT = 2n ** 63n;

/**
 * PHP's `oflow` for an integer-shaped operand: 1 above `PHP_INT_MAX`, -1 below
 * `PHP_INT_MIN`, 0 within range.
 *
 * @param value - The exact integer the operand spells
 * @returns The side the value overflows `zend_long` on, or 0
 */
function phpIntOverflow(value: bigint): number {
    if (value >= PHP_INT_BOUND_BIGINT) {
        return 1;
    }

    if (value < -PHP_INT_BOUND_BIGINT) {
        return -1;
    }

    return 0;
}

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
        const overflow = phpIntOverflow(leftInt);

        // zendi_smart_strcmp's own tie-break: two integer strings overflowing zend_long on
        // the same side, whose doubles tie, fall back to a byte compare. That is why PHP
        // says "9223372036854775808" and "+9223372036854775808" are different.
        if (
            overflow !== 0 &&
            overflow === phpIntOverflow(rightInt) &&
            Number(a) === Number(b)
        ) {
            return compareStrings(a, b);
        }

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
 * PHP-like loose equality comparison, following PHP 8's `==` rules.
 *
 * A `null` against a string compares as `""`; a `null` or a boolean against
 * anything else compares both sides as booleans; two numeric operands compare
 * numerically; everything else scalar compares as strings. Arrays and objects
 * compare deeply.
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
 * looseEqual(0, ''); -> false
 * looseEqual(1, '1'); -> true
 * looseEqual('1e1', '10'); -> true
 * looseEqual(['a'], ['a']); -> true
 */
export function looseEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
        return true;
    }

    const aIsNull = isNullish(a);
    const bIsNull = isNullish(b);

    if (aIsNull && bIsNull) {
        return true;
    }

    // PHP 8: null against a string compares "" with the string; null or a bool against anything else compares as bools.
    if (aIsNull || bIsNull) {
        const other = aIsNull ? b : a;

        return isString(other) ? other === "" : !phpTruthy(other);
    }

    // A PLAIN JS object models a PHP associative array here, not a stdClass, so phpTruthy lets
    // isPhpFalsy (guards.ts) call {} falsy and false == {} holds as PHP's [] == false does.
    // Probed as "empty array and false"; every other object is truthy, as "plain object and false".
    if (isBoolean(a) || isBoolean(b)) {
        return phpTruthy(a) === phpTruthy(b);
    }

    // PHP refuses to compare NaN with anything, before any cast, so NAN == "NAN" is false too.
    if (isNaNValue(a) || isNaNValue(b)) {
        return false;
    }

    // PHP casts an object with __toString against a string operand. A plain object is excluded: it models
    // a PHP array here, and an array never casts, even one whose own "toString" key holds a closure. JS
    // built-ins (Date, RegExp) do carry a platform toString, where PHP's equivalents lacking one would not.
    if (isString(a) !== isString(b)) {
        const object = isString(a) ? b : a;

        if (
            isObject(object) &&
            !isPlainObject(object) &&
            hasCustomToString(object)
        ) {
            return String(object) === (isString(a) ? a : b);
        }
    }

    const aScalar = isNumberLike(a) || isString(a);
    const bScalar = isNumberLike(b) || isString(b);

    if (aScalar && bScalar) {
        if (isPhpNumericOrBigint(a) && isPhpNumericOrBigint(b)) {
            // Two strings take zendi_smart_strcmp, its overflow fallback to a string compare
            // included: that is the only reason PHP says "1e999" == "1e1000" is false.
            if (isString(a) && isString(b)) {
                return compareNumericStrings(a, b) === 0;
            }

            // Anything PHP would hold as an int compares exactly, where Number() collapses two
            // spellings past 2^53 onto one double.
            if (isPhpIntegral(a) && isPhpIntegral(b)) {
                return BigInt(a) === BigInt(b);
            }

            // The float path, which is what makes INF == "1e400" true: String(INF) is "Infinity",
            // a spelling PHP's numeric grammar does not accept.
            return Number(a) === Number(b);
        }

        return phpScalarToString(a) === phpScalarToString(b);
    }

    if (isArray(a) && isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }

        // An index loop, not `every`: `every` skips a sparse array's holes, which would
        // let a hole match whatever sits opposite it instead of comparing as undefined.
        for (let index = 0; index < a.length; index++) {
            if (!looseEqual(a[index], b[index])) {
                return false;
            }
        }

        return true;
    }

    if (isObject(a) && isObject(b)) {
        const keysA = Object.keys(a as Record<string, unknown>);
        const keysB = Object.keys(b as Record<string, unknown>);

        if (keysA.length !== keysB.length) {
            return false;
        }

        return keysA.every(
            (key) =>
                keysB.includes(key) &&
                looseEqual(
                    (a as Record<string, unknown>)[key],
                    (b as Record<string, unknown>)[key],
                ),
        );
    }

    return false;
}

/**
 * Whether an object is the plain associative-array analogue this port models a PHP
 * array with: one whose prototype is `Object.prototype` or `null`.
 *
 * @param value - The object to check
 * @returns True if the object is a plain object
 */
function isPlainObject(value: object): boolean {
    const prototype: unknown = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
}

/**
 * PHP truthiness with bigint folded in, since PHP has no bigint but JS callers may pass one.
 *
 * @param value - The value to cast
 * @returns The value's PHP truthiness
 */
function phpTruthy(value: unknown): boolean {
    if (typeof value === "bigint") {
        return value !== 0n;
    }

    // An object is always truthy in PHP; only the plain object standing in for an
    // associative array may be empty-and-falsy, and its state is its own keys. A Date,
    // Map, Set, RegExp or class instance keeps state elsewhere, so emptiness says nothing.
    if (isObject(value) && !isPlainObject(value)) {
        return true;
    }

    return !isPhpFalsy(value);
}

/**
 * Check whether a value is one of the two types PHP would treat as a number.
 *
 * @param value - The value to check
 * @returns True if the value is a number or a bigint
 */
function isNumberLike(value: unknown): value is number | bigint {
    return typeof value === "number" || typeof value === "bigint";
}

/**
 * Check whether a value takes `==`'s numeric arm, counting bigint as numeric.
 *
 * @param value - The value to check
 * @returns True if the value is a bigint or PHP-numeric
 */
function isPhpNumericOrBigint(value: unknown): boolean {
    return typeof value === "bigint" || isPhpNumeric(value);
}

/**
 * Whether an operand is an exact integer PHP would hold as an `int`: an integral finite number, a
 * bigint, or a PHP integer string, in every case within `[PHP_INT_MIN, PHP_INT_MAX]`. `Infinity`,
 * `NaN` and anything out of range take the float path, where PHP compares two doubles as well.
 *
 * @param value - The numeric operand to check
 * @returns True if the value compares exactly as a bigint
 */
function isPhpIntegral(value: number | bigint | string): boolean {
    // A bigint is not a spelling PHP could have produced, so it is always compared exactly;
    // collapsing a pair of them onto one double would lose the very digits they carry.
    if (typeof value === "bigint") {
        return true;
    }

    if (typeof value === "number") {
        return (
            Number.isInteger(value) &&
            value >= -PHP_INT_BOUND &&
            value < PHP_INT_BOUND
        );
    }

    return (
        PHP_INTEGER_STRING_PATTERN.test(value) &&
        phpIntOverflow(BigInt(value)) === 0
    );
}

/**
 * PHP treats NAN as uncomparable before any cast, so it needs a short-circuit of its own.
 *
 * @param value - The value to check
 * @returns True if the value is the number NaN
 */
function isNaNValue(value: unknown): boolean {
    return typeof value === "number" && Number.isNaN(value);
}

/**
 * A `toString` that is not `Object.prototype`'s is what PHP's `__toString` looks like from JavaScript.
 *
 * @param value - The object to check
 * @returns True if the object carries a `toString` of its own
 */
function hasCustomToString(value: object): boolean {
    const cast = (value as { toString?: unknown }).toString;

    return typeof cast === "function" && cast !== Object.prototype.toString;
}

/**
 * The string PHP prints for a scalar on the non-numeric arm of `==`: INF by name, everything else as String().
 * NaN never reaches here; it short-circuits to false above.
 *
 * @param value - The scalar to print
 * @returns The value as PHP would render it in a string comparison
 */
function phpScalarToString(value: unknown): string {
    if (typeof value === "number") {
        if (value === Number.POSITIVE_INFINITY) {
            return "INF";
        }

        if (value === Number.NEGATIVE_INFINITY) {
            return "-INF";
        }
    }

    return String(value);
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
