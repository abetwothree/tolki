import { isInteger, isPrototypeObject, isString } from "./guards";

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
 * Whether `key` is a canonical non-negative integer string ("0", "1", "23",
 * but not "01", "-1", "1.5") — the key class JS always sorts ahead of string
 * keys, and PHP treats as an integer array key.
 *
 * @param key - The key to test
 * @returns True if `key` is a canonical non-negative integer string
 */
export function isIntegerLikeKey(key: string): boolean {
    return /^(0|[1-9]\d*)$/.test(key);
}

/**
 * Renumber the integer-like keys in `entries` to a fresh 0-based sequence, in
 * the order they appear; string keys pass through unchanged.
 *
 * The one integer-key policy for every reordering helper, since a plain JS
 * object always re-sorts integer-like keys ascending (ECMA-262). Negative keys
 * are excluded — JS doesn't re-sort those. A mixed object keeps neither order:
 * integer keys hoist ahead of string keys, so `sort({x: 5, 0: 9})` gives `[9, 5]`.
 *
 * @param entries - The entries to renumber, in their intended order
 * @returns The same entries with integer-like keys renumbered from 0
 */
export function reindexIntegerKeys<TValue>(
    entries: [string, TValue][],
): [string, TValue][] {
    let nextIndex = 0;

    return entries.map(([key, value]) => {
        if (isIntegerLikeKey(key)) {
            return [String(nextIndex++), value] as [string, TValue];
        }

        return [key, value] as [string, TValue];
    });
}

/**
 * Define an own enumerable property on the target without going through a
 * setter, so a key such as `__proto__` becomes a real own key rather than
 * reaching `Object.prototype` through the inherited setter.
 *
 * `defineKey` is the sanctioned way to write a computed key onto a fresh result object;
 * plain `result[key] = value` lets a `"__proto__"` key reparent `result`. A key that is
 * already non-configurable falls back to assignment, since it cannot be a setter.
 *
 * @param target - The object to define the key on
 * @param key - The key to define
 * @param value - The value to store under the key
 */
export function defineKey<TValue>(
    target: Record<string, TValue>,
    key: PropertyKey,
    value: TValue,
): void {
    // Every value inheriting from a prototype object sees a write landing there,
    // so refuse it: no caller-supplied path may reach a shared global.
    if (isPrototypeObject(target)) {
        return;
    }

    // A non-configurable own key (an array's `length`, a sealed object's entry)
    // cannot be redefined; plain assignment is both correct and safe there,
    // because such a key already exists as own data.
    if (Object.getOwnPropertyDescriptor(target, key)?.configurable === false) {
        (target as Record<PropertyKey, TValue>)[key] = value;

        return;
    }

    Object.defineProperty(target, key, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
    });
}
