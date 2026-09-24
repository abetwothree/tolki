import * as Utils from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
    it("entriesKeyValue converts numeric-like strings and preserves others", () => {
        expect(Utils.entriesKeyValue("42" as unknown as PropertyKey)).toBe(42);
        expect(Utils.entriesKeyValue("004" as unknown as PropertyKey)).toBe(4);
        expect(Utils.entriesKeyValue("abc" as unknown as PropertyKey)).toBe(
            "abc",
        );
    });

    describe("isIntegerLikeKey", () => {
        it("returns true for canonical non-negative integer strings", () => {
            expect(Utils.isIntegerLikeKey("0")).toBe(true);
            expect(Utils.isIntegerLikeKey("1")).toBe(true);
            expect(Utils.isIntegerLikeKey("23")).toBe(true);
        });

        it("returns false for strings that merely look numeric", () => {
            expect(Utils.isIntegerLikeKey("01")).toBe(false);
            expect(Utils.isIntegerLikeKey("-1")).toBe(false);
            expect(Utils.isIntegerLikeKey("1.5")).toBe(false);
            expect(Utils.isIntegerLikeKey("")).toBe(false);
            expect(Utils.isIntegerLikeKey("x")).toBe(false);
        });
    });

    describe("isPhpArrayKey", () => {
        it("returns true for strings", () => {
            expect(Utils.isPhpArrayKey("taylor")).toBe(true);
            expect(Utils.isPhpArrayKey("")).toBe(true);
            expect(Utils.isPhpArrayKey("__proto__")).toBe(true);
        });

        it("returns true for integers inside PHP's 64-bit range", () => {
            expect(Utils.isPhpArrayKey(0)).toBe(true);
            expect(Utils.isPhpArrayKey(-0)).toBe(true);
            expect(Utils.isPhpArrayKey(1)).toBe(true);
            expect(Utils.isPhpArrayKey(-42)).toBe(true);
            expect(Utils.isPhpArrayKey(1e16)).toBe(true);
        });

        it("accepts PHP_INT_MIN, whose bound is inclusive", () => {
            // PHP_INT_MIN is exactly -2^63 and is a valid PHP array key, so
            // the lower bound has to be inclusive rather than a magnitude test
            expect(Utils.isPhpArrayKey(-(2 ** 63))).toBe(true);
        });

        it("rejects magnitudes at or beyond PHP's 64-bit range", () => {
            // 2^63 is PHP_INT_MAX + 1, so it is a float in PHP, not a key
            expect(Utils.isPhpArrayKey(2 ** 63)).toBe(false);
            expect(Utils.isPhpArrayKey(-(2 ** 63) - 4096)).toBe(false);
            expect(Utils.isPhpArrayKey(1e21)).toBe(false);
            expect(Utils.isPhpArrayKey(-1e21)).toBe(false);
        });

        it("accepts the largest double below the upper bound", () => {
            // 2^63 - 1 is not representable as a double, so this is the
            // largest candidate that can reach the check
            expect(Utils.isPhpArrayKey(9223372036854774784)).toBe(true);
        });

        it("returns false for floats", () => {
            expect(Utils.isPhpArrayKey(1.5)).toBe(false);
            expect(Utils.isPhpArrayKey(-0.1)).toBe(false);
            expect(Utils.isPhpArrayKey(NaN)).toBe(false);
            expect(Utils.isPhpArrayKey(Infinity)).toBe(false);
        });

        it("returns false for values PHP cannot use as keys", () => {
            expect(Utils.isPhpArrayKey(null)).toBe(false);
            expect(Utils.isPhpArrayKey(undefined)).toBe(false);
            expect(Utils.isPhpArrayKey(true)).toBe(false);
            expect(Utils.isPhpArrayKey(false)).toBe(false);
            expect(Utils.isPhpArrayKey([])).toBe(false);
            expect(Utils.isPhpArrayKey({})).toBe(false);
            expect(Utils.isPhpArrayKey(() => {})).toBe(false);
            expect(Utils.isPhpArrayKey(Symbol("k"))).toBe(false);
        });
    });

    describe("defineKey", () => {
        it("defines an own enumerable key", () => {
            const target: Record<string, number> = {};
            Utils.defineKey(target, "a", 1);

            expect(target["a"]).toBe(1);
            expect(Object.keys(target)).toEqual(["a"]);
            expect(Object.hasOwn(target, "a")).toBe(true);
        });

        it("defines a writable and configurable property", () => {
            const target: Record<string, number> = {};
            Utils.defineKey(target, "a", 1);

            expect(Object.getOwnPropertyDescriptor(target, "a")).toStrictEqual({
                value: 1,
                enumerable: true,
                writable: true,
                configurable: true,
            });
        });

        it("overwrites a key that was already defined", () => {
            const target: Record<string, number> = {};
            Utils.defineKey(target, "a", 1);
            Utils.defineKey(target, "a", 2);

            expect(target["a"]).toBe(2);
            expect(Object.keys(target)).toEqual(["a"]);
        });

        it("stores __proto__ as a real own key without polluting the prototype", () => {
            const target: Record<string, string> = {};
            Utils.defineKey(target, "__proto__", "safe");

            expect(Object.hasOwn(target, "__proto__")).toBe(true);
            expect(target["__proto__"]).toBe("safe");
            expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
            expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
        });

        it("stores other prototype-sensitive keys as own keys", () => {
            const target: Record<string, string> = {};
            Utils.defineKey(target, "constructor", "a");
            Utils.defineKey(target, "prototype", "b");

            expect(target["constructor"]).toBe("a");
            expect(target["prototype"]).toBe("b");
            expect(Object.keys(target)).toEqual(["constructor", "prototype"]);
        });

        it.each([
            ["Object.prototype", Object.prototype],
            ["Array.prototype", Array.prototype],
            ["Function.prototype", Function.prototype],
        ])("refuses %s as a write target", (_label, target) => {
            Utils.defineKey(target as Record<string, unknown>, "PWNED", 1);

            expect(Object.getOwnPropertyNames(target)).not.toContain("PWNED");
            expect(({} as Record<string, unknown>)["PWNED"]).toBeUndefined();
            expect(
                ([] as unknown as Record<string, unknown>)["PWNED"],
            ).toBeUndefined();
        });
    });

    describe("defineKey on a non-configurable key", () => {
        it("falls back to assignment for an array's length", () => {
            const target: unknown[] = [1, 2];
            expect(() =>
                Utils.defineKey(
                    target as unknown as Record<string, unknown>,
                    "length",
                    5,
                ),
            ).not.toThrow();
            expect(target.length).toBe(5);
        });

        it("falls back to assignment for a sealed object's existing key", () => {
            const target = Object.seal({ a: 1 });
            expect(() =>
                Utils.defineKey(target as Record<string, unknown>, "a", 2),
            ).not.toThrow();
            expect(target.a).toBe(2);
        });

        it("still defines a __proto__ key as own data", () => {
            const target: Record<string, unknown> = {};
            Utils.defineKey(target, "__proto__", 5);

            expect(Object.hasOwn(target, "__proto__")).toBe(true);
            expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
        });
    });

    describe("phpArrayKey", () => {
        it("turns canonical decimal integer strings into numbers", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "K1 keys of numeric-looking string keys"
            expect(Utils.phpArrayKey("10")).toBe(10);
            expect(Utils.phpArrayKey("-1")).toBe(-1);
            expect(Utils.phpArrayKey("0")).toBe(0);
        });

        it("keeps every other string as it is", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "K1 keys of numeric-looking string keys", "K2 chunkWhile callback key types"
            for (const key of ["01", "1.5", "1e3", " 1", "Infinity", "1e+21"]) {
                expect(Utils.phpArrayKey(key)).toBe(key);
            }
        });

        it("keeps a negative-zero, alphabetic or empty string as it is too", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "phpArrayKey-extra-string-keys"
            for (const key of ["-0", "abc", ""]) {
                expect(Utils.phpArrayKey(key)).toBe(key);
            }
        });

        it("keeps an integer string JS can't hold exactly", () => {
            // JS-only: no PHP analogue; pins that phpArrayKey keeps a string beyond safe-integer precision.
            expect(Utils.phpArrayKey("9007199254740993")).toBe(
                "9007199254740993",
            );
        });

        it("casts a bool, null or float key the way PHP stores an array offset", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "keyBy-scalar-key-cast"
            expect(Utils.phpArrayKey(true)).toBe(1);
            expect(Utils.phpArrayKey(false)).toBe(0);
            expect(Utils.phpArrayKey(null)).toBe("");
            expect(Utils.phpArrayKey(1.5)).toBe(1);
            expect(Utils.phpArrayKey(-1.5)).toBe(-1);
            expect(Utils.phpArrayKey(-0)).toBe(0);
            expect(Utils.phpArrayKey(Infinity)).toBe(0);
            expect(Utils.phpArrayKey(NaN)).toBe(0);
            // JS-only: PHP has no undefined; it is cast like null.
            expect(Utils.phpArrayKey(undefined)).toBe("");
        });

        it("wraps a float past PHP's int range into 64 bits, keeping digits JS can't hold as a string", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "keyBy-scalar-key-cast"
            expect(Utils.phpArrayKey(1e20)).toBe("7766279631452241920");
        });

        it("stringifies any other key, as a JS property key would be", () => {
            // JS-only: PHP rejects an array or object offset; JS stores it under its string form.
            expect(Utils.phpArrayKey({ toString: () => "k" })).toBe("k");
        });
    });

    describe("keyedEntries", () => {
        it("answers a plain object exactly as Object.entries does", () => {
            const record = { b: 1, 2: "c", a: 2, 0: "a" };

            expect(Utils.keyedEntries(record)).toEqual(Object.entries(record));
        });

        it("reads a Map in its own insertion order, which a plain object cannot hold", () => {
            // docs/php-parity/task-30-map-order.json, "join-out-of-order"
            // PHP walks [2 => 'c', 0 => 'a', 1 => 'b'] from key 2, where a record re-sorts to 0, 1, 2.
            expect(
                Utils.keyedEntries(
                    new Map<unknown, string>([
                        [2, "c"],
                        [0, "a"],
                        [1, "b"],
                    ]),
                ),
            ).toEqual([
                ["2", "c"],
                ["0", "a"],
                ["1", "b"],
            ]);
            expect(
                Utils.keyedEntries(
                    new Map<unknown, number>([
                        ["x", 1],
                        [0, 2],
                        ["y", 3],
                    ]),
                ),
            ).toEqual([
                ["x", 1],
                ["0", 2],
                ["y", 3],
            ]);
        });

        it("folds Map keys PHP stores as one into the first one's place, holding the last value", () => {
            // docs/php-parity/task-30-map-order.json, "first-collision", "last-collision"
            // PHP's [1 => 'a', 0 => 'z', '1' => 'b'] is [1 => 'b', 0 => 'z'], so last() is 'z'.
            expect(
                Utils.keyedEntries(
                    new Map<unknown, string>([
                        [1, "a"],
                        [0, "z"],
                        ["1", "b"],
                    ]),
                ),
            ).toEqual([
                ["1", "b"],
                ["0", "z"],
            ]);
        });

        it("casts every Map key the way PHP casts an array key", () => {
            // docs/php-parity/task-30-map-order.json, "every-numeric-string-keys-callback-order",
            // "every-true-key-callback-order", "every-null-key-callback-order", "every-float-key-callback-order"
            // docs/php-parity/task-23-obj-release-readiness.json, "K1 keys of numeric-looking string keys"
            // PHP hands a callback 2, 1, "" and 1 for the "2", true, null and 1.5 keys; "01" stays a string.
            expect(
                Utils.keyedEntries(
                    new Map<unknown, string>([
                        ["2", "numeric string"],
                        ["01", "padded string"],
                        [true, "bool"],
                        [null, "null"],
                        [1.5, "float"],
                        [-1, "negative"],
                    ]),
                ),
            ).toEqual([
                ["2", "numeric string"],
                ["01", "padded string"],
                ["1", "float"],
                ["", "null"],
                ["-1", "negative"],
            ]);
        });

        it("keeps a __proto__ Map key as an ordinary entry", () => {
            // JS-only: in PHP `__proto__` is an ordinary key; here it must stay data, not reparent anything.
            const entries = Utils.keyedEntries(
                new Map<string, unknown>([
                    ["a", 1],
                    ["__proto__", { polluted: true }],
                ]),
            );

            expect(entries).toEqual([
                ["a", 1],
                ["__proto__", { polluted: true }],
            ]);
            expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
        });

        it("keeps each Map key PHP cannot store as its own entry, under its string form", () => {
            // JS-only: PHP throws for an object key and has no symbols, so there is nothing to fold these into.
            const first = { id: 1 };
            const second = { id: 2 };
            const symbol = Symbol("s");

            expect(
                Utils.keyedEntries(
                    new Map<unknown, string>([
                        [first, "first"],
                        [second, "second"],
                        [symbol, "symbol"],
                        [Symbol("s"), "other symbol"],
                        [first, "first again"],
                    ]),
                ),
            ).toEqual([
                ["[object Object]", "first again"],
                ["[object Object]", "second"],
                ["Symbol(s)", "symbol"],
                ["Symbol(s)", "other symbol"],
            ]);
        });

        it("casts a bigint Map key as PHP casts its integer", () => {
            // JS-only: PHP has no bigint; one holding an integer is stored as that integer.
            expect(
                Utils.keyedEntries(
                    new Map<unknown, string>([
                        [2n, "bigint"],
                        [2, "number"],
                    ]),
                ),
            ).toEqual([["2", "number"]]);
        });

        it("answers an empty Map with no entries", () => {
            // JS-only: an empty Map stands for PHP's [].
            expect(Utils.keyedEntries(new Map())).toEqual([]);
        });
    });

    describe("renumberPhpIntegerKeys", () => {
        it("renumbers every key PHP stores as an integer, in order", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "unshift-numeric-key-order"
            expect(
                Utils.renumberPhpIntegerKeys([
                    ["2", "c"],
                    ["0", "a"],
                    ["1", "b"],
                ]),
            ).toEqual([
                ["0", "c"],
                ["1", "a"],
                ["2", "b"],
            ]);
        });

        it("counts a negative key, which reindexIntegerKeys leaves alone", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "unshift-negative-int-key"
            expect(
                Utils.renumberPhpIntegerKeys([
                    ["-1", "first"],
                    ["5", "second"],
                ]),
            ).toEqual([
                ["0", "first"],
                ["1", "second"],
            ]);
            expect(
                Utils.reindexIntegerKeys([
                    ["-1", "first"],
                    ["5", "second"],
                ]),
            ).toEqual([
                ["-1", "first"],
                ["0", "second"],
            ]);
        });

        it("leaves a string key where it is", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "unshift-mixed-key-order"
            expect(
                Utils.renumberPhpIntegerKeys([
                    ["2", "c"],
                    ["x", "v"],
                    ["0", "a"],
                ]),
            ).toEqual([
                ["0", "c"],
                ["x", "v"],
                ["1", "a"],
            ]);
        });
    });
});
