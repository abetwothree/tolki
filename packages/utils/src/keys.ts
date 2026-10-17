import {
    isArray,
    isBoolean,
    isEnumCase,
    isFunction,
    isInteger,
    isMap,
    isNull,
    isNumber,
    isObject,
    isPrototypeObject,
    isString,
    isSymbol,
    isTruthyObject,
    isUndefined,
} from "./guards";
import { phpDebugType } from "./reflect";

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
 * @deprecated Use `phpArrayKey` instead. This conversion is `Number()`/`parseFloat`, which is
 * looser than PHP's: it turns `"01"` into `1`, `"1.5"` into `1.5` and `"0x10"` into `16`, keys
 * PHP would all keep as strings. `phpArrayKey` converts only a canonical integer string, so a
 * key handed to a callback is the key PHP stores. Kept because it is a published export.
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
 * The key PHP stores for an array key: a canonical decimal integer string
 * becomes a number and any other string stays the same string; `null` becomes
 * `""`, a boolean `0` or `1`, and a float is truncated toward zero (INF and NAN become `0`).
 *
 * @param key - The key, as `Object.keys` reports it or as a value used as an array offset
 * @returns The key PHP would report
 *
 * @example
 * phpArrayKey("10"); -> 10
 * phpArrayKey("01"); -> "01"
 * phpArrayKey(true); -> 1
 * phpArrayKey(1.5); -> 1
 */
export function phpArrayKey(key: unknown): string | number {
    if (isString(key)) {
        if (/^(0|-?[1-9]\d*)$/.test(key)) {
            const value = Number(key);

            // PHP holds up to 2^63 - 1; past 2^53 a JS number would silently change the key.
            if (Number.isSafeInteger(value)) {
                return value;
            }
        }

        return key;
    }

    if (isNull(key) || isUndefined(key)) {
        return "";
    }

    if (isBoolean(key)) {
        return key ? 1 : 0;
    }

    if (isNumber(key) || Number.isNaN(key)) {
        // PHP wraps a float past its int range into 64 bits; digits a JS number can't hold stay a string.
        const integer = Number.isFinite(key)
            ? BigInt.asIntN(64, BigInt(Math.trunc(key as number)))
            : 0n;

        return Number.isSafeInteger(Number(integer))
            ? Number(integer)
            : String(integer);
    }

    return String(key);
}

/**
 * The key a Laravel method stores for a value it computed, cast the way that method casts it.
 *
 * @param value - The computed key
 * @param options - `enumCases` reads an `@tolki/enum` case as its value, as `enum_value()` does; `stringables`
 * reads an object with its own `toString` as that string; `invalid` builds the error the method's PHP throws
 * @returns The key PHP stores, cast as {@linkcode phpArrayKey} casts it
 * @throws TypeError `Cannot access offset of type X on array` for any other object, or the error `invalid` builds
 *
 * @example
 * phpComputedKey(true); -> 1
 * phpComputedKey(1.5); -> 1
 * phpComputedKey({ value: 2, backed: true, name: "B" }, { enumCases: true }); -> 2
 * phpComputedKey([1, 2]); -> throws TypeError("Cannot access offset of type array on array")
 */
export function phpComputedKey(
    value: unknown,
    options: {
        enumCases?: boolean;
        stringables?: boolean;
        invalid?: (type: string) => Error;
    } = {},
): string | number {
    const { enumCases = false, stringables = false } = options;
    let key = value;

    if (enumCases && isEnumCase(key)) {
        key = key["value"];
    }

    if (stringables && hasOwnToString(key)) {
        key = String(key.toString());
    }

    if (isIllegalOffset(key)) {
        const invalid = options.invalid ?? illegalOffset;

        throw invalid(phpDebugType(key));
    }

    return phpArrayKey(key);
}

/**
 * Determine whether a value is a key no PHP array can hold, which PHP throws for wherever it reads or writes one.
 *
 * @param value - The key to test
 * @returns True for an array, an object or a function, which PHP reads as a Closure
 *
 * @example
 * isIllegalOffset(["b"]); -> true
 * isIllegalOffset(null); -> false
 */
export function isIllegalOffset(value: unknown): value is object {
    return isArray(value) || isObject(value) || isFunction(value);
}

/**
 * The error `array_key_exists` throws for a key no PHP array can hold, called from a namespace as Laravel calls it.
 *
 * @returns The TypeError PHP throws
 */
export function arrayKeyExistsError(): TypeError {
    return new TypeError(
        "array_key_exists(): Argument #1 ($key) must be a valid array offset type",
    );
}

/**
 * Determine whether a value is an object with its own `toString`, the JS reading of a PHP Stringable.
 *
 * @param value - The value to test
 * @returns True unless the value is no object, inherits `Object.prototype`'s `toString`, or is a Date
 *
 * @example
 * hasOwnToString(new (class { toString() { return "a"; } })()); -> true
 * hasOwnToString(new Date(0)); -> false
 */
export function hasOwnToString(
    value: unknown,
): value is { toString(): unknown } {
    // A Date's toString is built in, but PHP's DateTime has no __toString.
    return (
        isObject(value) &&
        !(value instanceof Date) &&
        isFunction(value["toString"]) &&
        value["toString"] !== Object.prototype.toString
    );
}

/**
 * The error PHP throws when an array is written under a key it cannot store.
 *
 * @param type - The type name of the key
 * @returns The TypeError PHP throws
 */
function illegalOffset(type: string): TypeError {
    return new TypeError(`Cannot access offset of type ${type} on array`);
}

/**
 * Get the entries of a plain object or a Map, each keyed by the string PHP stores for its key.
 *
 * A Map keeps its insertion order, which a plain object cannot hold for integer keys. Keys PHP
 * stores as one (`1` and `"1"`) fold into the first one's place with the last one's value.
 *
 * @param data - The plain object or Map to read.
 * @returns The `[key, value]` pairs in iteration order.
 *
 * @example
 * keyedEntries({ b: 1, a: 2 }); -> [["b", 1], ["a", 2]]
 * keyedEntries(new Map([[2, "c"], [0, "a"]])); -> [["2", "c"], ["0", "a"]]
 * keyedEntries(new Map([[1, "a"], ["1", "b"]])); -> [["1", "b"]]
 */
export function keyedEntries<TValue = unknown>(
    data: object,
): [string, TValue][] {
    if (!isMap<unknown, TValue>(data)) {
        return Object.entries(data) as [string, TValue][];
    }

    // Map.set keeps a repeated key in its first place with its last value, as PHP does. PHP throws for an
    // object or closure key and has no symbols, so each of those keeps its own entry rather than merging.
    const byKey = new Map<unknown, [string, TValue]>();

    for (const [key, value] of data) {
        const phpKey = isPhpStorableKey(key)
            ? String(phpArrayKey(key))
            : undefined;

        byKey.set(phpKey ?? key, [phpKey ?? String(key), value]);
    }

    return [...byKey.values()];
}

/**
 * Read a Map entry by the key PHP stores for the given key.
 *
 * Of several Map keys PHP stores as one, the last value wins, as in {@linkcode keyedEntries}.
 * A stored `null` or `undefined` counts as found.
 *
 * @param map - The Map to read.
 * @param key - The key to look up, cast as PHP casts an array key.
 * @returns Whether a key matched, and its value when one did.
 *
 * @example
 * readMapKey(new Map([[1, "a"]]), "1"); -> { found: true, value: "a" }
 * readMapKey(new Map([["01", "a"]]), 1); -> { found: false }
 */
export function readMapKey(
    map: ReadonlyMap<unknown, unknown>,
    key: string | number,
): { found: boolean; value?: unknown } {
    let result: { found: boolean; value?: unknown } = { found: false };

    for (const [mapKey, value] of map) {
        if (isSamePhpKey(mapKey, key)) {
            result = { found: true, value };
        }
    }

    return result;
}

/**
 * Set a Map entry under the key PHP stores for the given key.
 *
 * An existing key keeps its place, and any later key PHP stores as the same one is removed.
 *
 * @param map - The Map to write into, changed in place.
 * @param key - The key to write, cast as PHP casts an array key.
 * @param value - The value to store.
 *
 * @example
 * const map = new Map([[2, "c"], [0, "a"]]);
 * writeMapKey(map, "2", "C"); -> map is [[2, "C"], [0, "a"]]
 * writeMapKey(map, "1", "b"); -> map is [[2, "C"], [0, "a"], [1, "b"]]
 */
export function writeMapKey(
    map: Map<unknown, unknown>,
    key: string | number,
    value: unknown,
): void {
    let written = false;

    for (const mapKey of [...map.keys()]) {
        if (!isSamePhpKey(mapKey, key)) {
            continue;
        }

        if (written) {
            map.delete(mapKey);
        } else {
            map.set(mapKey, value);
            written = true;
        }
    }

    if (!written) {
        map.set(phpArrayKey(key), value);
    }
}

/**
 * Delete every Map entry whose key PHP stores as the given key.
 *
 * @param map - The Map to remove from, changed in place.
 * @param key - The key to remove, cast as PHP casts an array key.
 *
 * @example
 * const map = new Map([[1, "a"], ["1", "b"], [2, "c"]]);
 * deleteMapKey(map, "1"); -> map is [[2, "c"]]
 */
export function deleteMapKey(
    map: Map<unknown, unknown>,
    key: string | number,
): void {
    for (const mapKey of [...map.keys()]) {
        if (isSamePhpKey(mapKey, key)) {
            map.delete(mapKey);
        }
    }
}

/**
 * Get the key PHP gives the next value appended to a plain object or Map.
 *
 * That is one past the highest integer key, negative ones included (PHP 8.3+), or 0 with none.
 *
 * @param container - The plain object or Map to inspect.
 * @returns The next integer key.
 *
 * @example
 * nextIntegerKey({ k: 1, 5: "z" }); -> 6
 * nextIntegerKey(new Map([[2, "c"], [0, "a"]])); -> 3
 * nextIntegerKey({ "-5": "n" }); -> -4
 */
export function nextIntegerKey(container: object): number {
    let highest: number | undefined;

    for (const [key] of keyedEntries(container)) {
        const phpKey = phpArrayKey(key);

        if (isNumber(phpKey) && (highest === undefined || phpKey > highest)) {
            highest = phpKey;
        }
    }

    return highest === undefined ? 0 : highest + 1;
}

/**
 * Determine whether a Map key is one PHP stores under the same array key as the given key.
 *
 * @param mapKey - The Map key to test.
 * @param key - The key being read, written or deleted.
 * @returns True when both cast to the same PHP array key.
 */
function isSamePhpKey(mapKey: unknown, key: string | number): boolean {
    // Compared as strings, as keyedEntries lists them: a bigint key casts to its digits, never to a number.
    return (
        isPhpStorableKey(mapKey) &&
        String(phpArrayKey(mapKey)) === String(phpArrayKey(key))
    );
}

/**
 * Determine whether PHP can store the given key as an array key, casting it if need be.
 *
 * @param key - The Map key to test.
 * @returns True unless the key is an object, a function or a symbol.
 */
function isPhpStorableKey(key: unknown): boolean {
    return !isTruthyObject(key) && !isFunction(key) && !isSymbol(key);
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
 * Renumber every key PHP stores as an integer to a fresh 0-based sequence, in order, as `array_shift`,
 * `array_splice` and `array_unshift` do. Unlike `reindexIntegerKeys`, a negative key such as "-1" counts too.
 *
 * @param entries - The entries to renumber, in their intended order
 * @returns The same entries with every integer key renumbered from 0
 */
export function renumberPhpIntegerKeys<TValue>(
    entries: [string, TValue][],
): [string, TValue][] {
    let nextIndex = 0;

    return entries.map(([key, value]) =>
        isNumber(phpArrayKey(key))
            ? [String(nextIndex++), value]
            : [key, value],
    );
}

/**
 * Define an own enumerable property on the target without going through a
 * setter, so a key such as `__proto__` becomes a real own key rather than
 * reaching `Object.prototype` through the inherited setter.
 *
 * `defineKey` is the sanctioned way to write a computed key onto a fresh result object;
 * plain `result[key] = value` lets a `"__proto__"` key reparent `result`. A key other than
 * `__proto__` that is already non-configurable falls back to assignment, since it cannot be a setter.
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
    // because such a key already exists as own data. `__proto__` is never assigned.
    if (
        key !== "__proto__" &&
        Object.getOwnPropertyDescriptor(target, key)?.configurable === false
    ) {
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
