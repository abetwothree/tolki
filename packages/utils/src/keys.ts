import { isInteger, isString } from "./guards";

/**
 * The first magnitude beyond PHP's 64-bit integer range. `PHP_INT_MAX`
 * (2^63 - 1) is not representable as a JavaScript double, so this bound serves
 * as the exclusive upper limit and, negated, as the inclusive lower limit
 * (`PHP_INT_MIN`, which is exactly -2^63).
 */
const PHP_INT_BOUND = 2 ** 63;

/**
 * Figures out if the entry key should be a number or a string.
 *
 * @param value - The entry key value (number, string, or symbol)
 * @returns The entry key as a number if it can be converted, otherwise returns the original value
 */
export function entriesKeyValue<T extends PropertyKey>(
    value: T,
): T extends `${number}` ? number : T {
    if (!isNaN(Number(value)) && !isNaN(parseFloat(String(value)))) {
        return Number(value) as T extends `${number}` ? number : T;
    }

    return value as T extends `${number}` ? number : T;
}

/**
 * Check if a key is unsafe for property assignment (prototype pollution).
 * Returns true for `__proto__`, `constructor`, and `prototype`.
 *
 * @param key - The key to check
 * @returns True if the key could cause prototype pollution
 */
export function isUnsafeKey(key: string): boolean {
    return key === "__proto__" || key === "constructor" || key === "prototype";
}

/**
 * Check whether a value can be used as a PHP array key. PHP accepts strings
 * and integers in the inclusive range [-2^63, 2^63 - 1]; numbers outside that
 * range are floats there, so they are rejected rather than producing a key PHP
 * could never generate.
 *
 * @param value - The value to check
 * @returns True if the value can be used as a PHP array key
 */
export function isPhpArrayKey(value: unknown): value is string | number {
    if (isString(value)) {
        return true;
    }

    if (!isInteger(value)) {
        return false;
    }

    // The upper bound stays exclusive because 2^63 - 1 rounds to 2^63 as a
    // double, making the largest representable candidate below the bound a
    // valid key already. The lower bound is inclusive: PHP_INT_MIN is -2^63.
    return value >= -PHP_INT_BOUND && value < PHP_INT_BOUND;
}

/**
 * Whether `key` is a canonical non-negative integer string ("0", "1",
 * "23", but not "01", "-1", "1.5"). This is both the class of key the JS
 * engine itself always sorts ahead of string keys (in ascending numeric
 * order, regardless of insertion order) and the class of key PHP treats
 * as an integer array key — the one `array_splice`/`array_unshift`
 * renumber. String keys are left untouched by both.
 *
 * Negative integers such as "-1" are deliberately excluded, unlike PHP's
 * own int-cast rule (which does renumber them). That divergence is a known,
 * pinned carve-out — see `obj.spec.ts`'s unshift/splice tests — not a gap
 * to close here.
 *
 * @param key - The key to test
 * @returns True if `key` is a canonical non-negative integer string
 */
export function isIntegerLikeKey(key: string): boolean {
    return /^(0|[1-9]\d*)$/.test(key);
}

/**
 * Define an own enumerable property on the target without going through a
 * setter, so a key such as `__proto__` becomes a real own key rather than
 * reaching `Object.prototype` through the inherited setter.
 *
 * @param target - The object to define the key on
 * @param key - The key to define
 * @param value - The value to store under the key
 */
export function defineKey<TValue>(
    target: Record<string, TValue>,
    key: string,
    value: TValue,
): void {
    Object.defineProperty(target, key, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
    });
}
