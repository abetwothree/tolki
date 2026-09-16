import * as Arr from "@tolki/arr";
import { SortDirection } from "@tolki/enum";
import * as Obj from "@tolki/obj";
import {
    isString,
    ItemNotFoundException,
    MultipleItemsFoundException,
} from "@tolki/utils";
import { afterEach, assertType, describe, expect, it, vi } from "vitest";

/**
 * Wrap items in the smallest Collection-like operand, which obj unwraps through `all()` as Laravel does.
 *
 * @param items - The items `all()` returns
 * @returns An object whose `all()` returns the items
 */
const collectionLike = <T>(items: T) => ({ all: () => items });

/** A case-insensitive value comparator, the JavaScript twin of PHP's `strcasecmp` as array_udiff uses it. */
const caseless = (a: unknown, b: unknown): boolean =>
    String(a).toLowerCase() === String(b).toLowerCase();

/**
 * A class instance with own fields, which PHP's array helpers keep whole instead of walking.
 */
class Point {
    x = 1;
    y = 2;
}

/** The single-field instance the write-path probes use, so a citation names the same call. */
class D4Point {
    x = 1;
}

describe("Obj", () => {
    describe("accessible", () => {
        it("should return true for objects", () => {
            expect(Obj.accessible({})).toBe(true);
            expect(Obj.accessible({ a: 1, b: 2 })).toBe(true);
            expect(Obj.accessible(Object.create(null))).toBe(true);
        });

        it("should return false for non-objects", () => {
            expect(Obj.accessible([])).toBe(false);
            expect(Obj.accessible(null)).toBe(false);
            expect(Obj.accessible(undefined)).toBe(false);
            expect(Obj.accessible("string")).toBe(false);
            expect(Obj.accessible(123)).toBe(false);
            expect(Obj.accessible(true)).toBe(false);
        });

        it("returns false for a float and a closure", () => {
            // ArrTest::testAccessible
            expect(Obj.accessible(12.34)).toBe(false);
            expect(Obj.accessible(() => null)).toBe(false);
        });

        it("rejects a Date or class instance but keeps a Map", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "accessible-datetime".
            // A Map is JS's shape for a PHP array with non-string keys, so it stays accessible.
            expect(Obj.accessible(new Date(0))).toBe(false);
            expect(Obj.accessible(new Point())).toBe(false);
            expect(Obj.accessible(new Set([1]))).toBe(false);
            expect(Obj.accessible(new Map([["a", 1]]))).toBe(true);
        });
    });

    describe("objectifiable", () => {
        it("should return true for objects", () => {
            expect(Obj.objectifiable({})).toBe(true);
            expect(Obj.objectifiable({ a: 1, b: 2 })).toBe(true);
            expect(Obj.objectifiable(Object.create(null))).toBe(true);
        });

        it("should return false for non-objects", () => {
            expect(Obj.objectifiable([])).toBe(false);
            expect(Obj.objectifiable(null)).toBe(false);
            expect(Obj.objectifiable(undefined)).toBe(false);
            expect(Obj.objectifiable("string")).toBe(false);
            expect(Obj.objectifiable(123)).toBe(false);
            expect(Obj.objectifiable(true)).toBe(false);
        });

        it("returns false for a float and a closure", () => {
            // ArrTest::testArrayable
            expect(Obj.objectifiable(12.34)).toBe(false);
            expect(Obj.objectifiable(() => null)).toBe(false);
        });

        it("rejects a Date or class instance but keeps a Map", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "arrayable-datetime".
            // A Map is JS's shape for a PHP array with non-string keys, so it stays objectifiable.
            expect(Obj.objectifiable(new Date(0))).toBe(false);
            expect(Obj.objectifiable(new Point())).toBe(false);
            expect(Obj.objectifiable(new Set([1]))).toBe(false);
            expect(Obj.objectifiable(new Map([["a", 1]]))).toBe(true);
        });
    });

    describe("add", () => {
        it("should add a value if key doesn't exist", () => {
            const obj = { name: "John" };
            const result = Obj.add(obj, "age", 30);
            expect(result).toEqual({ name: "John", age: 30 });
            expect(result).not.toBe(obj); // should be immutable
            assertType<{ name: string; age: number }>(result);
        });

        it("should not add a value if key exists", () => {
            const obj = { name: "John", age: 25 };
            const result = Obj.add(obj, "age", 30);
            expect(result).toEqual({ name: "John", age: 25 });
            assertType<{ name: string; age: number }>(result);
        });

        it("should add nested values using dot notation", () => {
            const obj = { user: { name: "John" } };
            const result = Obj.add(obj, "user.age", 30);
            expect(result).toEqual({ user: { name: "John", age: 30 } });
            assertType<{ user: { name: string; age: number } }>(result);
        });

        it("should add to empty objects", () => {
            const obj = {};
            const result = Obj.add(obj, "name", "John");
            expect(result).toEqual({ name: "John" });
            assertType<{ name: string }>(result);
        });

        it("replaces a nested class instance instead of writing into it", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "add-assoc-nested-
            // object-is-replaced-wholesale": ['a' => new D4Point(1)] plus
            // Arr::add($src, 'a.y', 2) answers {"a": {"y": 2}}, a plain array.
            const point = new D4Point();
            const result = Obj.add({ a: point }, "a.y", 2);

            expect(result).toEqual({ a: { y: 2 } });
            expect(result.a).not.toBe(point);
            expect(result.a).not.toBeInstanceOf(D4Point);
            expect(Object.entries(point)).toEqual([["x", 1]]);
        });

        it("descends into a nested list instead of replacing it", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "d6-nested-list-is-descended-not-replaced": ['a' => ['q']] plus
            // Arr::add($src, 'a.1', 'y') answers {"a": ["q", "y"]} and leaves the source.
            const inner = ["q"];
            const result = Obj.add({ a: inner }, "a.1", "y");

            expect(result).toEqual({ a: ["q", "y"] });
            expect(result.a).not.toBe(inner);
            expect(inner).toEqual(["q"]);
        });

        it("should preserve type when nested key exists", () => {
            const obj = { user: { name: "John", age: 25 } };
            const result = Obj.add(obj, "user.age", 30);
            expect(result).toEqual({ user: { name: "John", age: 25 } });
            // Type should remain unchanged when nested key exists
            assertType<{ user: { name: string; age: number } }>(result);
        });

        it("creates the parent when adding a dotted key to an empty object", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "add-empty-dotted"
            expect(Obj.add({}, "developer.name", "Ferid")).toEqual({
                developer: { name: "Ferid" },
            });
        });

        it("adds under an integer key, and splits a float key on its dot", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "add-int-key", "add-float-key"
            expect(Obj.add({}, 1, "hAz")).toEqual({ 1: "hAz" });
            expect(Obj.add({}, 1.1, "hAz")).toEqual({ 1: { 1: "hAz" } });
        });
    });

    describe("objectItem", () => {
        it("should return array values", () => {
            const obj = { items: { 0: "a", 1: "b", 2: "c" } };
            expect(Obj.objectItem(obj, "items")).toEqual({
                0: "a",
                1: "b",
                2: "c",
            });
        });

        it("should return nested array values", () => {
            const obj = { user: { tags: { 0: "js", 1: "ts" } } };
            expect(Obj.objectItem(obj, "user.tags")).toEqual({
                0: "js",
                1: "ts",
            });
        });

        it("throws for list data, which has no object keys", () => {
            const obj = [{ name: "John" }];
            expect(() => Obj.objectItem(obj, "name")).toThrow(
                "Object value for key [name] must be an object, NULL found.",
            );
        });

        it("should throw error for non-object scalar values", () => {
            const obj = { name: "John" };
            expect(() => Obj.objectItem(obj, "name")).toThrow(
                "Object value for key [name] must be an object, string found.",
            );
        });

        it("names the found type the way PHP's gettype does", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "array-int-value", "array-float-value", "array-bool-value", "array-null-value"
            expect(() => Obj.objectItem({ a: 5 }, "a")).toThrow(
                "Object value for key [a] must be an object, integer found.",
            );
            expect(() => Obj.objectItem({ a: 1.5 }, "a")).toThrow(
                "Object value for key [a] must be an object, double found.",
            );
            expect(() => Obj.objectItem({ a: true }, "a")).toThrow(
                "Object value for key [a] must be an object, boolean found.",
            );
            expect(() => Obj.objectItem({ a: null }, "a")).toThrow(
                "Object value for key [a] must be an object, NULL found.",
            );
        });

        it("returns an object default for a missing key", () => {
            const obj = { name: "John" };
            expect(Obj.objectItem(obj, "missing", { default: 1 })).toEqual({
                default: 1,
            });
        });

        it("throws for a list value, which Arr::array returns", () => {
            // JS-only: obj's analogue of a PHP array is an object, so a list is rejected where Arr::array returns it
            // (docs/php-parity/task-23-obj-release-readiness.json, "array-list-value"); the type name is gettype's
            // (docs/php-parity/task-17-second-review.json, "gettype of an array").
            expect(() =>
                Obj.objectItem({ items: ["a", "b"] }, "items"),
            ).toThrow(
                "Object value for key [items] must be an object, array found.",
            );
        });
    });

    describe("boolean", () => {
        it("should return boolean values", () => {
            const obj = { active: true, disabled: false };
            expect(Obj.boolean(obj, "active")).toBe(true);
            expect(Obj.boolean(obj, "disabled")).toBe(false);
        });

        it("should return nested boolean values", () => {
            const obj = { user: { verified: true } };
            expect(Obj.boolean(obj, "user.verified")).toBe(true);
        });

        it("should throw error for non-boolean values", () => {
            const obj = { name: "John" };
            expect(() => Obj.boolean(obj, "name")).toThrow(
                "Object value for key [name] must be a boolean, string found.",
            );
        });

        it("reports the PHP type name for a number or null", () => {
            // docs/php-parity/task-17-second-review.json, "gettype of an integer"
            expect(() => Obj.boolean({ count: 5 }, "count")).toThrow(
                "Object value for key [count] must be a boolean, integer found.",
            );
            // docs/php-parity/task-17-second-review.json, "gettype of null"
            expect(() => Obj.boolean({ name: null }, "name")).toThrow(
                "Object value for key [name] must be a boolean, NULL found.",
            );
            // docs/php-parity/task-17-second-review.json, "gettype of an array"
            expect(() => Obj.boolean({ tags: [1] }, "tags")).toThrow(
                "Object value for key [tags] must be a boolean, array found.",
            );
        });

        it("should return default value if key not found and default is boolean", () => {
            const obj = { name: "John" };
            expect(Obj.boolean(obj, "missing", false)).toBe(false);
        });
    });

    describe("chunk", () => {
        const baseData = { a: 1, b: 2, c: 3, d: 4, e: 5 };

        it("keeps keys by default and when preserveKeys is true", () => {
            const expected = {
                0: { a: 1, b: 2 },
                1: { c: 3, d: 4 },
                2: { e: 5 },
            };

            expect(Obj.chunk(baseData, 2)).toEqual(expected);
            expect(Obj.chunk(baseData, 2, true)).toEqual(expected);
        });

        it("renumbers each chunk's keys when preserveKeys is false", () => {
            expect(Obj.chunk(baseData, 2, false)).toEqual({
                0: { 0: 1, 1: 2 },
                1: { 0: 3, 1: 4 },
                2: { 0: 5 },
            });
        });

        it("returns no chunks for a size below 1", () => {
            expect(Obj.chunk(baseData, 0)).toEqual({});
            expect(Obj.chunk(baseData, -2)).toEqual({});
        });

        it("returns no chunks for non-object data", () => {
            expect(Obj.chunk(null, 4)).toEqual({});
            expect(Obj.chunk("", 5)).toEqual({});
            expect(Obj.chunk(false, 2)).toEqual({});
        });
    });

    describe("chunkWhile", () => {
        // docs/php-parity/task-21-chunk-while-by.json
        it("chunks equal adjacent values and preserves string keys", () => {
            const result = Obj.chunkWhile(
                { a: 1, b: 1, c: 2, d: 2, e: 3, f: 3, g: 3 },
                (value, _key, chunk) => Object.values(chunk).at(-1) === value,
            );

            expect(result).toEqual({
                0: { a: 1, b: 1 },
                1: { c: 2, d: 2 },
                2: { e: 3, f: 3, g: 3 },
            });
        });

        it("passes the value, its key and the chunk so far, skipping the first item", () => {
            const calls: [number, string, Record<string, number>][] = [];

            Obj.chunkWhile({ x: 10, y: 11, z: 20 }, (value, key, chunk) => {
                calls.push([value, key, { ...chunk }]);

                return (Object.values(chunk).at(-1) as number) + 1 === value;
            });

            expect(calls).toEqual([
                [11, "y", { x: 10 }],
                [20, "z", { x: 10, y: 11 }],
            ]);
        });

        it("returns an empty object for empty or non-object input", () => {
            expect(Obj.chunkWhile({}, () => true)).toEqual({});
            expect(Obj.chunkWhile(null, () => true)).toEqual({});
            expect(Obj.chunkWhile("", () => true)).toEqual({});
            expect(Obj.chunkWhile(false, () => true)).toEqual({});
        });

        it("keeps a single entry in one chunk without calling back", () => {
            const callback = vi.fn(() => false);

            expect(Obj.chunkWhile({ a: 5 }, callback)).toEqual({ 0: { a: 5 } });
            expect(callback).not.toHaveBeenCalled();
        });

        it("splits on every false and merges on every true", () => {
            expect(Obj.chunkWhile({ a: 1, b: 2, c: 3 }, () => false)).toEqual({
                0: { a: 1 },
                1: { b: 2 },
                2: { c: 3 },
            });
            expect(Obj.chunkWhile({ a: 1, b: 2, c: 3 }, () => true)).toEqual({
                0: { a: 1, b: 2, c: 3 },
            });
        });

        it("gives integer-like keys back as numbers", () => {
            const keys: PropertyKey[] = [];

            Obj.chunkWhile({ 10: "a", 20: "b" }, (_value, key) => {
                keys.push(key);

                return true;
            });

            expect(keys).toEqual([20]);
        });

        it("keeps non-canonical numeric keys distinct instead of colliding them", () => {
            // A Number()/parseFloat conversion of the key handed to the callback is lossy for
            // "01": Number("01") === Number("1") === 1. Writing that converted key back would
            // collapse two entries into one, so phpArrayKey leaves "01" a string and it survives.
            const result = Obj.chunkWhile({ 1: "a", "01": "b" }, () => true);

            expect(result).toEqual({ 0: { 1: "a", "01": "b" } });
            expect(Object.keys(result[0] as Record<string, unknown>)).toEqual([
                "1",
                "01",
            ]);
        });

        it("does not rename a non-canonical numeric key on write", () => {
            const result = Obj.chunkWhile(
                { "1e3": "a", " 1": "b" },
                () => true,
            );

            expect(Object.keys(result[0] as Record<string, unknown>)).toEqual([
                "1e3",
                " 1",
            ]);
        });

        it("does not mutate the input", () => {
            const data = { a: 1, b: 1 };
            Obj.chunkWhile(data, () => true);

            expect(data).toEqual({ a: 1, b: 1 });
        });

        it("keeps a __proto__ key on the chunk itself, never on its prototype", () => {
            // JSON.parse is the only way to get __proto__ as an own enumerable key (house pattern).
            const data = JSON.parse(
                '{"a":1,"__proto__":{"polluted":true},"c":1}',
            ) as Record<string, unknown>;
            const chunk = Obj.chunkWhile(data, () => true)[0] as Record<
                string,
                unknown
            >;

            expect(Object.getPrototypeOf(chunk)).toBe(Object.prototype);
            expect(Object.hasOwn(chunk, "__proto__")).toBe(true);
        });

        it("hands the callback PHP's key types, converting only canonical integers", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "K2 chunkWhile callback key types"
            const seen: unknown[] = [];

            Obj.chunkWhile(
                {
                    a: 0,
                    "01": "d",
                    "1.5": "x",
                    "1e3": "e",
                    " 1": "g",
                    "-1": "c",
                    "10": "f",
                },
                (_value, key) => {
                    seen.push(key);

                    return true;
                },
            );

            // The first entry never reaches the callback; JS hoists "10" to the front.
            expect(seen).toEqual(["a", "01", "1.5", "1e3", " 1", -1]);
        });
    });

    describe("chunkBy", () => {
        // docs/php-parity/task-21-chunk-while-by.json
        it("chunks by a callback and preserves keys", () => {
            expect(
                Obj.chunkBy({ a: 1, b: 1, c: 2, d: 2, e: 1 }, (value) => value),
            ).toEqual({
                0: { a: 1, b: 1 },
                1: { c: 2, d: 2 },
                2: { e: 1 },
            });
        });

        it("chunks by a bare string key", () => {
            expect(
                Obj.chunkBy(
                    {
                        p: { parent: "a" },
                        q: { parent: "a" },
                        r: { parent: "b" },
                    },
                    "parent",
                ),
            ).toEqual({
                0: { p: { parent: "a" }, q: { parent: "a" } },
                1: { r: { parent: "b" } },
            });
        });

        it("chunks by a dotted key", () => {
            expect(
                Obj.chunkBy(
                    {
                        p: { address: { city: "NY" } },
                        q: { address: { city: "NY" } },
                        r: { address: { city: "LA" } },
                    },
                    "address.city",
                ),
            ).toEqual({
                0: {
                    p: { address: { city: "NY" } },
                    q: { address: { city: "NY" } },
                },
                1: { r: { address: { city: "LA" } } },
            });
        });

        it("passes the value and its key to the callback", () => {
            expect(
                Obj.chunkBy({ a: 1, b: 1, c: 1 }, (_value, key) =>
                    key === "b" ? "x" : "y",
                ),
            ).toEqual({ 0: { a: 1 }, 1: { b: 1 }, 2: { c: 1 } });
        });

        it("hands the callback a non-canonical key as PHP's string, not a canonicalized number", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "chunkBy-noncanonical-key-type"
            const seen: [string, unknown][] = [];

            Obj.chunkBy({ "01": "a", x: "b" }, (_value, key) => {
                seen.push([typeof key, key]);

                return key;
            });

            expect(seen).toEqual([
                ["string", "x"],
                ["string", "01"],
            ]);
        });

        it("compares adjacent values with PHP 8 loose equality", () => {
            // Same sequence as the arr case; `null == 0`, `"" == false` merge, `0 == ""` does not.
            expect(
                Obj.chunkBy(
                    {
                        a: 1,
                        b: "1",
                        c: 2,
                        d: "2",
                        e: null,
                        f: 0,
                        g: "",
                        h: false,
                        i: "a",
                        j: "A",
                    },
                    (value) => value,
                ),
            ).toEqual({
                0: { a: 1, b: "1" },
                1: { c: 2, d: "2" },
                2: { e: null, f: 0 },
                3: { g: "", h: false },
                4: { i: "a" },
                5: { j: "A" },
            });
        });

        // docs/php-parity/task-21-chunk-while-by.json, "chunkBy with a null key falls back to
        // identity comparison, like a callback" — PHP has no `undefined`, so that one probe
        // backs both the `null` and `undefined` cases below (valueRetriever(null) === identity).
        it("treats a null or undefined key as the identity, like a callback", () => {
            expect(Obj.chunkBy({ a: 1, b: 1, c: 2, d: 2, e: 3 }, null)).toEqual(
                {
                    0: { a: 1, b: 1 },
                    1: { c: 2, d: 2 },
                    2: { e: 3 },
                },
            );
            expect(Obj.chunkBy({ a: 1, b: 1, c: 2 }, undefined)).toEqual({
                0: { a: 1, b: 1 },
                1: { c: 2 },
            });
        });

        it("puts entries that all lack the key into one chunk", () => {
            expect(Obj.chunkBy({ a: { x: 1 }, b: { y: 2 } }, "key")).toEqual({
                0: { a: { x: 1 }, b: { y: 2 } },
            });
        });

        it("returns an empty object for empty or non-object input", () => {
            expect(Obj.chunkBy({}, "key")).toEqual({});
            expect(Obj.chunkBy(null, "key")).toEqual({});
        });

        it("puts a single entry in one chunk", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "L7 chunkBy single item assoc"
            expect(Obj.chunkBy({ x: { key: "a" } }, "key")).toEqual({
                0: { x: { key: "a" } },
            });
        });
    });

    describe("combine", () => {
        it("should combine two objects into an object", () => {
            // Four keys, four values, so the undefined-valued key doesn't trip the count-mismatch guard.
            // JS-only: PHP has no undefined; toPhpKeyString keys it "" as array_combine keys null.
            const keys = {
                1: "name",
                2: "family",
                3: "role",
                4: undefined,
            };
            const values = { 0: "John", 1: "Doe", 2: "admin", 3: "N/A" };
            expect(Obj.combine(keys, values)).toEqual({
                name: "John",
                family: "Doe",
                role: "admin",
                "": "N/A",
            });
        });

        it("casts null, true and false keys the way array_combine does", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D5 combine null/bool/float keys"
            expect(Obj.combine({ k: null }, { v: 1 })).toEqual({ "": 1 });
            expect(Obj.combine({ k: true }, { v: 1 })).toEqual({ 1: 1 });
            expect(Obj.combine({ k: false }, { v: 1 })).toEqual({ "": 1 });
            expect(Obj.combine({ k: 1.5 }, { v: 1 })).toEqual({ "1.5": 1 });
        });

        it("keys a float by PHP's (string) cast", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "combine-float-keys"
            const result = Obj.combine(
                { a: -Infinity, b: -0, c: 0.1 + 0.2, d: 0.00001 },
                { a: 1, b: 2, c: 3, d: 4 },
            );
            expect(Object.keys(result)).toEqual([
                "-INF",
                "-0",
                "0.3",
                "1.0E-5",
            ]);
        });

        // obj.combine used to resolve a function-typed key by *calling* it
        // (`isFunction(k) ? String(k)`); arr.combine always used plain `String(k)`.
        it("stringifies a function key instead of calling it", () => {
            const fn = () => "callback";
            const result = Obj.combine({ a: fn }, { a: 1 });
            expect(result).toEqual({ [String(fn)]: 1 });
            expect(Object.keys(result)).not.toContain("callback");
        });

        // keysObject's own keys don't need JSON.parse (only its resolved *values*
        // become combine's keys, and a plain value "__proto__" needs no special
        // construction); the risk is entirely on the write side.
        it("does not reparent the result via a __proto__ key resolved from keysObject", () => {
            const keys = { a: "x", b: "__proto__", c: "y" };
            const values = { a: 1, b: { polluted: true }, c: 3 };
            const result = Obj.combine(keys, values);
            expect((result as { polluted?: boolean }).polluted).toBeUndefined();
            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        });

        // PHP raises a `ValueError`; PHP-verified message
        // (docs/php-parity/task-04-shared.json, "array_combine mismatch").
        it("throws when keys have more entries than values", () => {
            const keys = { 0: "a", 1: "b", 2: "c" };
            const values = { 0: 1, 1: 2 };
            expect(() => Obj.combine(keys, values)).toThrow(
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
            );
        });

        it("pairs keys and values by position, ignoring both operands' own keys", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "C10 combine list keys, offset values", "C11 combine offset keys, list values", "C12 combine offset both"
            expect(
                Obj.combine(
                    { 0: "name", 1: "family" },
                    { 1: "taylor", 2: "otwell" },
                ),
            ).toEqual({ name: "taylor", family: "otwell" });
            expect(
                Obj.combine(
                    { 1: "name", 2: "family" },
                    { 0: "taylor", 1: "otwell" },
                ),
            ).toEqual({ name: "taylor", family: "otwell" });
            expect(
                Obj.combine(
                    { 1: "name", 2: "family" },
                    { 2: "taylor", 3: "otwell" },
                ),
            ).toEqual({ name: "taylor", family: "otwell" });
        });

        it("unwraps Collection-like and list operands", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C10 combine list keys, offset values"
            expect(
                Obj.combine(collectionLike(["name", "family"]), [
                    "taylor",
                    "otwell",
                ]),
            ).toEqual({ name: "taylor", family: "otwell" });
        });

        it("unwraps a Collection-like values operand too", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "combine-collection-values"
            expect(Obj.combine(["a", "b"], collectionLike(["x", "y"]))).toEqual(
                { a: "x", b: "y" },
            );
        });

        it("returns an empty object for a nullish values operand instead of throwing", () => {
            // JS-only: array_combine() has no nullish operand to compare against;
            // arrayableValues treats a nullish operand as empty, unlike Object.values.
            expect(Obj.combine({}, null as never)).toEqual({});
        });
    });

    describe("collapse", () => {
        it("skips a class instance, a Date or a Map item, as Arr::collapse skips a PHP object", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-skips-objects"
            class Point {
                x = 1;
                y = 2;
            }

            expect(Obj.collapse({ g1: { a: 1 }, g2: new Point() })).toEqual({
                a: 1,
            });
            expect(
                Obj.collapse({
                    g1: [1],
                    g2: new Date(0),
                    g3: new Map([["x", 1]]),
                    g4: [2],
                }),
            ).toEqual({ 0: 1, 1: 2 });
        });

        it("should collapse object of objects into single object", () => {
            const obj = { a: { x: 1 }, b: { y: 2 }, c: { z: 3 } };
            expect(Obj.collapse(obj)).toEqual({ x: 1, y: 2, z: 3 });
        });

        it("should merge overlapping keys with later values winning", () => {
            const obj = { a: { x: 1, y: 2 }, b: { x: 3, z: 4 } };
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-string-keys"
            expect(Obj.collapse(obj)).toEqual({ x: 3, y: 2, z: 4 });
        });

        it("should handle empty objects", () => {
            expect(Obj.collapse({})).toEqual({});
        });

        it("should skip non-object values", () => {
            const obj = { a: { x: 1 }, b: "string", c: { y: 2 } };
            expect(Obj.collapse(obj)).toEqual({ x: 1, y: 2 });
        });

        it("appends integer keys instead of letting a later one overwrite", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-int-keys"
            expect(
                Obj.collapse({ g1: { a: 1, 5: "x" }, g2: { 5: "y" } }),
            ).toEqual({ a: 1, 0: "x", 1: "y" });
        });

        it("collapses list values, appending their elements", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-assoc-of-lists"
            expect(Obj.collapse({ a: [1, 2], b: [3] })).toEqual({
                0: 1,
                1: 2,
                2: 3,
            });
        });

        it("merges a Collection-like item's items instead of its own fields", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-assoc-collection-item"
            expect(
                Obj.collapse({ a: collectionLike({ x: 1 }), b: { y: 2 } }),
            ).toEqual({ x: 1, y: 2 });
        });

        it("renumbers a negative integer key like any other integer key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-negative-int-keys"
            expect(
                Obj.collapse({ g1: { "-1": "a", k: "b" }, g2: { "-1": "c" } }),
            ).toEqual({ 0: "a", 1: "c", k: "b" });
        });

        it("returns an empty object for null or undefined data", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "collapse-null"
            expect(Obj.collapse(null)).toEqual({});
            // JS-only: PHP has no undefined; collapse treats it like null.
            expect(Obj.collapse(undefined)).toEqual({});
        });
    });

    describe("crossJoin", () => {
        it("should cross join objects with single values", () => {
            const result = Obj.crossJoin({ a: [1] }, { b: ["x"] });
            expect(result).toEqual([{ a: 1, b: "x" }]);
        });

        it("should cross join objects with multiple values", () => {
            const result = Obj.crossJoin(
                { size: ["S", "M"] },
                { color: ["red", "blue"] },
            );
            expect(result).toEqual([
                { size: "S", color: "red" },
                { size: "S", color: "blue" },
                { size: "M", color: "red" },
                { size: "M", color: "blue" },
            ]);
        });

        it("should return empty array if any object has empty values", () => {
            const result = Obj.crossJoin({ a: [] }, { b: ["x"] });
            expect(result).toEqual([]);
        });

        it("should handle multiple objects", () => {
            const result = Obj.crossJoin(
                { a: [1, 2] },
                { b: ["x"] },
                { c: ["I", "II"] },
            );
            expect(result).toEqual([
                { a: 1, b: "x", c: "I" },
                { a: 1, b: "x", c: "II" },
                { a: 2, b: "x", c: "I" },
                { a: 2, b: "x", c: "II" },
            ]);
        });

        it("returns one empty product when called with no arguments", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "crossJoin-no-args"
            expect(Obj.crossJoin()).toEqual([{}]);
        });

        it("multiplies every key of one argument, and of several", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "crossJoin-string-spread", "crossJoin-string-spread-3"
            expect(
                Obj.crossJoin({ size: ["S", "M"], color: ["red", "blue"] }),
            ).toEqual([
                { size: "S", color: "red" },
                { size: "S", color: "blue" },
                { size: "M", color: "red" },
                { size: "M", color: "blue" },
            ]);
            expect(
                Obj.crossJoin({ a: [1, 2] }, { b: ["x"], c: ["I", "II"] }),
            ).toEqual([
                { a: 1, b: "x", c: "I" },
                { a: 1, b: "x", c: "II" },
                { a: 2, b: "x", c: "I" },
                { a: 2, b: "x", c: "II" },
            ]);
        });

        it("returns no rows when any key has no values", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "crossJoin-string-spread-empty"
            expect(Obj.crossJoin({ a: [], b: ["x"] })).toEqual([]);
        });

        it("walks the values of a plain object, Map or Set dimension", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "crossJoin-string-spread-map-dimension"
            expect(Obj.crossJoin({ a: [1, 2], b: { k: "x", j: "y" } })).toEqual(
                [
                    { a: 1, b: "x" },
                    { a: 1, b: "y" },
                    { a: 2, b: "x" },
                    { a: 2, b: "y" },
                ],
            );
            expect(
                Obj.crossJoin({
                    a: [1],
                    b: new Map([
                        ["k", "x"],
                        ["j", "y"],
                    ]),
                }),
            ).toEqual([
                { a: 1, b: "x" },
                { a: 1, b: "y" },
            ]);
            expect(Obj.crossJoin({ a: [1], b: new Set(["x", "y"]) })).toEqual([
                { a: 1, b: "x" },
                { a: 1, b: "y" },
            ]);
        });

        it("returns no rows for a scalar or Date dimension, where PHP's foreach visits nothing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "crossJoin-string-spread-no-values"
            expect(Obj.crossJoin({ a: [1], b: "x" })).toEqual([]);
            expect(Obj.crossJoin({ a: [1], b: new Date(0) })).toEqual([]);
        });
    });

    describe("divide", () => {
        it("should divide object into keys and values", () => {
            const obj = { name: "John", age: 30, city: "NYC" };
            const [keys, values] = Obj.divide(obj);
            expect(keys).toEqual(["name", "age", "city"]);
            expect(values).toEqual(["John", 30, "NYC"]);
        });

        it("should handle empty objects", () => {
            const [keys, values] = Obj.divide({});
            expect(keys).toEqual([]);
            expect(values).toEqual([]);
        });

        it("reports an integer key as a number", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "divide-empty-and-int-key", "divide-int-key-types"
            // JS hoists the integer key 1 to the front; PHP keeps insertion order.
            expect(Obj.divide({ "": "Null", 1: "one" })).toEqual([
                [1, ""],
                ["one", "Null"],
            ]);
        });

        it("returns two empty lists for non-object data", () => {
            // JS-only: Arr::divide(null) is a TypeError in PHP; obj returns empty halves like its other helpers.
            expect(Obj.divide(null)).toEqual([[], []]);
        });
    });

    describe("dot", () => {
        it("should flatten nested objects with dot notation", () => {
            const obj = {
                name: "John",
                address: { city: "NYC", zip: "10001" },
            };
            expect(Obj.dot(obj)).toEqual({
                name: "John",
                "address.city": "NYC",
                "address.zip": "10001",
            });
        });

        it("concatenates the prepend string without adding a dot", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "dot-prepend-no-dot"
            expect(Obj.dot({ name: "John" }, "user")).toEqual({
                username: "John",
            });
        });

        it("keeps a class instance as a leaf, as a value or inside a nested list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "dot-object-leaf"
            const point = new Point();
            const result = Obj.dot({ p: point, l: [point] });
            expect(Object.keys(result)).toEqual(["p", "l.0"]);
            expect(result["p"]).toBe(point);
            expect(result["l.0"]).toBe(point);
        });

        it("should handle empty objects", () => {
            expect(Obj.dot({})).toEqual({});
        });

        it("should handle deeply nested objects", () => {
            const obj = { a: { b: { c: { d: "value" } } } };
            expect(Obj.dot(obj)).toEqual({ "a.b.c.d": "value" });
        });

        it("passes non-object values", () => {
            expect(Obj.dot("")).toEqual({});
        });

        it("should flatten with depth limit", () => {
            const obj = {
                user: {
                    name: "Taylor",
                    address: { city: "Dallas" },
                },
            };

            // Depth 1: flatten one level
            expect(Obj.dot(obj, "", 1)).toEqual({
                "user.name": "Taylor",
                "user.address": { city: "Dallas" },
            });

            // Depth 2: flatten two levels
            expect(
                Obj.dot(
                    { user: { address: { city: { name: "Dallas" } } } },
                    "",
                    2,
                ),
            ).toEqual({
                "user.address.city": { name: "Dallas" },
            });

            // Depth Infinity: fully flatten (same as default)
            expect(
                Obj.dot(
                    { user: { address: { city: { name: "Dallas" } } } },
                    "",
                    Infinity,
                ),
            ).toEqual({
                "user.address.city.name": "Dallas",
            });

            // Mixed values with depth 1
            expect(
                Obj.dot(
                    {
                        name: "taylor",
                        languages: {
                            php: true,
                            js: { react: true },
                        },
                    },
                    "",
                    1,
                ),
            ).toEqual({
                name: "taylor",
                "languages.php": true,
                "languages.js": { react: true },
            });

            // Depth 1 with empty nested objects
            expect(Obj.dot({ foo: { bar: {} } }, "", 1)).toEqual({
                "foo.bar": {},
            });

            // Depth 0: no flattening
            expect(
                Obj.dot(
                    {
                        user: {
                            name: "Taylor",
                            address: { city: "Dallas" },
                        },
                    },
                    "",
                    0,
                ),
            ).toEqual({
                user: {
                    name: "Taylor",
                    address: { city: "Dallas" },
                },
            });

            // docs/php-parity/task-23-obj-release-readiness.json, "dot-prepend-no-dot-depth"
            expect(Obj.dot({ user: { name: "Taylor" } }, "prefix", 1)).toEqual({
                "prefixuser.name": "Taylor",
            });
        });

        // Only JSON.parse produces a real own enumerable "__proto__" key; a literal
        // `{ __proto__: ... }` sets the prototype at construction time instead.
        describe("with a hostile __proto__ key (B8)", () => {
            afterEach(() => {
                expect(
                    ({} as { polluted?: unknown; isAdmin?: unknown }).polluted,
                ).toBeUndefined();
                expect(
                    ({} as { polluted?: unknown; isAdmin?: unknown }).isAdmin,
                ).toBeUndefined();
            });

            const hostile = () =>
                JSON.parse('{"a":1,"__proto__":{"polluted":true},"c":3}');

            // docs/php-parity/task-17-second-review.json, "Arr::dot keeps a \"__proto__\" key"
            it("dot keeps a __proto__ key as data instead of reparenting the result", () => {
                const result = Obj.dot(hostile(), "", 0);
                expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
                expect(Object.hasOwn(result, "__proto__")).toBe(true);
                expect(
                    (result as { polluted?: unknown }).polluted,
                ).toBeUndefined();
            });
        });

        it("keeps integer keys, top-level and nested", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "dot-int-key", "dot-nested-int-key"
            expect(Obj.dot({ 10: 100 })).toEqual({ 10: 100 });
            expect(Obj.dot({ foo: { 10: 100 } })).toEqual({ "foo.10": 100 });
        });

        it("keeps an empty container as a leaf at full depth", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "dot-empty-leaf", "dot-nested-empty-leaf".
            // PHP's [] is both an empty array and an empty list; {} pins the same case here.
            expect(Obj.dot({ foo: [] })).toEqual({ foo: [] });
            expect(Obj.dot({ foo: {} })).toEqual({ foo: {} });
            expect(Obj.dot({ foo: { bar: [] } })).toEqual({ "foo.bar": [] });
            expect(Obj.dot({ foo: { bar: {} } })).toEqual({ "foo.bar": {} });
        });

        it("flattens a nested list with numeric segments", () => {
            // ArrTest::testDot
            expect(
                Obj.dot({
                    user: { name: "Taylor", age: 25, languages: ["PHP", "C#"] },
                }),
            ).toEqual({
                "user.name": "Taylor",
                "user.age": 25,
                "user.languages.0": "PHP",
                "user.languages.1": "C#",
            });
        });

        it("flattens an object with both integer and string keys", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "dot-mixed-keys"
            expect(
                Obj.dot({ 0: "foo", foo: { bar: "baz", baz: { a: "b" } } }),
            ).toEqual({
                0: "foo",
                "foo.bar": "baz",
                "foo.baz.a": "b",
            });
        });

        it("keeps an empty list in place and preserves key order", () => {
            // ArrTest::testDot
            const result = Obj.dot({
                foo: "bar",
                empty_array: [],
                user: { name: "Taylor" },
                key: "value",
            });

            expect(result).toEqual({
                foo: "bar",
                empty_array: [],
                "user.name": "Taylor",
                key: "value",
            });
            expect(Object.keys(result)).toEqual([
                "foo",
                "empty_array",
                "user.name",
                "key",
            ]);
        });

        it("accepts a prepend that already ends in a dot", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "dot-prepend-with-dot-depth"
            expect(Obj.dot({ user: { name: "Taylor" } }, "prefix.", 1)).toEqual(
                { "prefix.user.name": "Taylor" },
            );
        });
    });

    describe("undot", () => {
        it("should expand dot notation back to nested objects", () => {
            const obj = {
                name: "John",
                "address.city": "NYC",
                "address.zip": "10001",
            };
            expect(Obj.undot(obj)).toEqual({
                name: "John",
                address: { city: "NYC", zip: "10001" },
            });
        });

        it("should handle deeply nested dot notation", () => {
            const obj = { "a.b.c.d": "value" };
            expect(Obj.undot(obj)).toEqual({ a: { b: { c: { d: "value" } } } });
        });

        it("should handle empty objects", () => {
            expect(Obj.undot({})).toEqual({});
        });

        it("rebuilds a list from consecutive integer segments starting at 0", () => {
            // PHP-verified in docs/php-parity/task-09-paths.json: Arr::set's algorithm
            // over this input yields {"user":{"languages":["PHP","C#"],"name":"Taylor"}},
            // so integer segments rebuild a list rather than a keyed map.
            expect(
                Obj.undot({
                    "user.languages.0": "PHP",
                    "user.languages.1": "C#",
                    "user.name": "Taylor",
                }),
            ).toEqual({ user: { languages: ["PHP", "C#"], name: "Taylor" } });
        });

        // Object.assign uses [[Set]]; once setObjectValue returns "__proto__"
        // as real data, merging it via assign reparented the result instead.
        it("keeps a __proto__ key as own data instead of reparenting the result", () => {
            const result = Obj.undot(JSON.parse('{"__proto__.PWN":"yes"}'));
            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
            expect(Object.hasOwn(result, "__proto__")).toBe(true);
            expect(
                (result["__proto__"] as Record<string, unknown>)["PWN"],
            ).toBe("yes");
            expect((result as { PWN?: unknown }).PWN).toBeUndefined();
        });

        it("expands an object with both integer and string keys", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "undot-mixed-keys"
            expect(
                Obj.undot({
                    0: "foo",
                    "foo.bar": "baz",
                    "foo.baz": { a: "b" },
                }),
            ).toEqual({
                0: "foo",
                foo: { bar: "baz", baz: { a: "b" } },
            });
        });

        it("returns an empty object for null or undefined data", () => {
            // JS-only: nullish data is treated as empty instead of throwing, like divide(null).
            expect(Obj.undot(null)).toEqual({});
            expect(Obj.undot(undefined)).toEqual({});
        });

        it("rebuilds a list from integer segments given out of order, which PHP keeps keyed", () => {
            // JS-only: JS enumerates integer keys ascending, so it can't hold PHP's [1 => 'y', 0 => 'x'] in that order
            // (docs/php-parity/task-23-obj-release-readiness.json, "undot-out-of-order-int-keys").
            expect(Obj.undot({ "a.1": "y", "a.0": "x" })).toStrictEqual({
                a: ["x", "y"],
            });
            expect(Obj.undot({ "a.0": "x", "a.1": "y" })).toStrictEqual({
                a: ["x", "y"],
            });
        });
    });

    describe("union", () => {
        it("test union null", () => {
            expect(Obj.union(null, { a: 1 })).toEqual({ a: 1 });
            expect(Obj.union({ a: 1 }, null)).toEqual({ a: 1 });
        });

        it("union objects", () => {
            expect(Obj.union({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
            expect(Obj.union({ a: 1 }, { a: 2 })).toEqual({ a: 1 });
            expect(
                Obj.union(
                    { a: "house", b: 3, c: 4 },
                    { a: "home", b: 2 },
                    { d: 5 },
                ),
            ).toEqual({ a: "house", b: 3, c: 4, d: 5 });
        });

        it("lets the left operand win even when its value is undefined", () => {
            // PHP-verified: ["a"=>null] + ["a"=>1] -> {"a":null}
            // (docs/php-parity/task-07-pad-union.json).
            const result = Obj.union({ a: undefined }, { a: 1 });
            expect(result).toEqual({ a: undefined });
            // toEqual({ a: undefined }) alone would also pass against {}
            // (Vitest 4 treats an undefined-valued key as equal to an
            // absent one); assert the key actually exists too.
            expect(result).toHaveProperty("a");
        });

        it("does not walk the prototype chain when checking for an existing key", () => {
            // Twin of unshift's equivalent pin: `in` would treat an
            // inherited property (like a plain object's toString) as
            // already-claimed and skip a legitimate right-operand value.
            expect(Obj.union({ toString: 1 }, { a: 9 })).toEqual({
                toString: 1,
                a: 9,
            });
        });

        it("keeps a __proto__ key as data instead of reparenting the result", () => {
            // PHP-verified: Collection::union keeps "__proto__" as an ordinary key.
            const hostile = JSON.parse(
                '{"a":1,"__proto__":{"polluted":true},"c":3}',
            );

            const result = Obj.union(hostile, { z: 9 });

            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
            expect(Object.hasOwn(result, "__proto__")).toBe(true);
            expect(Object.keys(result)).toEqual(["a", "__proto__", "c", "z"]);
        });

        it("unwraps a Collection-like operand and adds a list operand's indices", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C18 union collection", "union-list-operand"
            expect(
                Obj.union(
                    { name: "Hello" },
                    collectionLike({ name: "World", id: 1 }),
                ),
            ).toEqual({ name: "Hello", id: 1 });
            expect(Obj.union({ a: 1 }, [5])).toEqual({ a: 1, 0: 5 });
        });

        it("reads the data by its own entries, never calling a function-valued all, toArray or toJSON member", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-function-valued-member"
            const all = vi.fn(() => "X");
            const toArray = vi.fn(() => [9]);
            const toJSON = vi.fn(() => "J");

            expect(Obj.union({ all, admin: "a" }, { guest: 1 })).toEqual({
                all,
                admin: "a",
                guest: 1,
            });
            expect(Obj.union({ toArray, b: 2 }, { c: 3 })).toEqual({
                toArray,
                b: 2,
                c: 3,
            });
            expect(Obj.union({ toJSON, b: 2 }, { c: 3 })).toEqual({
                toJSON,
                b: 2,
                c: 3,
            });
            expect(all).not.toHaveBeenCalled();
            expect(toArray).not.toHaveBeenCalled();
            expect(toJSON).not.toHaveBeenCalled();
        });

        it("reads a class instance's own fields as the data, not its all() method's result", () => {
            // JS-only: PHP's $this->items is an array, which has no methods; a JS object can inherit one.
            class Repo {
                name = "repo";

                all() {
                    return "CALLED";
                }
            }

            expect(Obj.union(new Repo(), { x: 1 })).toEqual({
                name: "repo",
                x: 1,
            });
        });
    });

    describe("unshift", () => {
        it("leaves a prototype object untouched instead of clearing it", () => {
            class Holder {}
            Object.defineProperty(Holder.prototype, "kept", {
                value: "str",
                enumerable: true,
                configurable: true,
                writable: true,
            });

            // unshift rebuilds its container in place, so a target defineKey
            // declines would be cleared and never written back.
            const result = Obj.unshift(Holder.prototype as never, 5 as never);

            expect((Holder.prototype as Record<string, unknown>)["kept"]).toBe(
                "str",
            );
            expect(result).toBe(Holder.prototype);
            expect(({} as Record<string, unknown>)["kept"]).toBeUndefined();
        });

        it("prepends an object item as one element, like array_unshift", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "D1 unshift assoc item onto assoc", "D1b unshift two assoc items onto assoc"
            const one = { b: 2 };
            const two = { b: 2 };

            Obj.unshift(one, { a: 1 });
            Obj.unshift(two, { a: 1 }, { d: "house" });

            expect(one).toEqual({ 0: { a: 1 }, b: 2 });
            expect(two).toEqual({ 0: { a: 1 }, 1: { d: "house" }, b: 2 });
        });

        it("renumbers existing integer keys after the prepended items", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "D1c testUnshiftWithOneItem sequence on assoc", "D1e unshift int-keyed item overlapping"
            const data: Record<string | number, unknown> = { x: 4 };

            Obj.unshift(data, ["a", "b", "c"]);
            Obj.unshift(data, {
                who: "Jonny",
                preposition: "from",
                where: "Laroe",
            });
            Obj.unshift(data, "Jonny from Laroe");

            expect(data).toEqual({
                0: "Jonny from Laroe",
                1: { who: "Jonny", preposition: "from", where: "Laroe" },
                2: ["a", "b", "c"],
                x: 4,
            });

            const overlap = { z: 3 };

            Obj.unshift(overlap, ["zero"], 9);

            expect(overlap).toEqual({ 0: ["zero"], 1: 9, z: 3 });
        });

        it("renumbers integer keys even with no items, like array_unshift", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D1f unshift with no items on assoc"
            const data = { 5: "a", x: "b" };

            Obj.unshift(data);

            expect(data).toEqual({ 0: "a", x: "b" });
        });

        it("prepends null as an element", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "U1 unshift(null) onto assoc"
            const data = { a: 1 };

            Obj.unshift(data, null);

            expect(data).toEqual({ 0: null, a: 1 });
        });

        it("unshift with one object or none", () => {
            expect(Obj.unshift({ a: 1 })).toEqual({ a: 1 });
            expect(Obj.unshift()).toEqual({});
        });

        it("treats non-object data as empty, keying the items in order", () => {
            // JS-only: non-object data is treated as empty, the same branch the
            // zero-argument case above uses.
            expect(Obj.unshift(null, "a", "b")).toEqual({ 0: "a", 1: "b" });
        });

        it("prepends an object or null item as one element too, on that same branch", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "unshift-fresh-object-and-null-items"
            expect(Obj.unshift(null, { a: 1 }, null, "x")).toEqual({
                0: { a: 1 },
                1: null,
                2: "x",
            });
        });

        it("assigns a scalar prepend item the next integer key, like array_unshift", () => {
            expect(Obj.unshift({ x: 1, y: 2 }, 9)).toEqual({
                0: 9,
                x: 1,
                y: 2,
            });
        });

        it("renumbers existing integer keys instead of overwriting them", () => {
            // array_unshift([10,20,30,40],1,2) -> [1,2,10,20,30,40].
            expect(Obj.unshift({ 0: 10, 1: 20, 2: 30, 3: 40 }, 1, 2)).toEqual({
                0: 1,
                1: 2,
                2: 10,
                3: 20,
                4: 30,
                5: 40,
            });
        });

        it("renumbers integer keys and leaves string keys alone", () => {
            // array_unshift([0=>'a','x'=>1,1=>'b'],9) -> {0:9,1:'a',x:1,2:'b'}.
            expect(Obj.unshift({ 0: "a", x: 1, 1: "b" }, 9)).toEqual({
                0: 9,
                1: "a",
                2: "b",
                x: 1,
            });
        });

        it("renumbers a negative integer key like any other integer key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "unshift-negative-int-key"
            const result = Obj.unshift({ "-1": "a", x: "b" }, "z");
            expect(result).toEqual({ 0: "z", 1: "a", x: "b" });
        });

        it("does not reparent a hostile target", () => {
            const hostile = JSON.parse('{"a":1,"__proto__":{"polluted":true}}');

            const result = Obj.unshift(hostile, 9);

            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        });
    });

    describe("except", () => {
        it("should remove specified keys", () => {
            const obj = { name: "John", age: 30, city: "NYC" };
            expect(Obj.except(obj, "age")).toEqual({
                name: "John",
                city: "NYC",
            });
        });

        it("should remove multiple keys", () => {
            const obj = { name: "John", age: 30, city: "NYC" };
            expect(Obj.except(obj, ["age", "city"])).toEqual({ name: "John" });
        });

        it("should handle dot notation", () => {
            const obj = { user: { name: "John", age: 30 } };
            expect(Obj.except(obj, "user.age")).toEqual({
                user: { name: "John" },
            });
        });

        it("removes a top-level key and a dotted key in one call", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "except-mixed-list"
            const obj = {
                name: "taylor",
                framework: { language: "PHP", name: "Laravel" },
            };

            expect(Obj.except(obj, ["name", "framework.name"])).toEqual({
                framework: { language: "PHP" },
            });
        });

        it("removes by integer key, and follows a float key's dot into the nested object", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "except-int-key", "except-float-key"
            const obj = { 1: "hAz", 2: { 5: "foo", 12: "baz" } };

            expect(Obj.except(obj, 2)).toEqual({ 1: "hAz" });
            expect(Obj.except(obj, 2.5)).toEqual({
                1: "hAz",
                2: { 12: "baz" },
            });
        });

        it("returns an empty object for non-accessible data", () => {
            // JS-only: except delegates to forget, which used to hand non-object data straight
            // to forgetKeys and either throw or return the input unchanged; accessible() rejects
            // it first, matching only's guard.
            expect(Obj.except([1, 2, 3], 0)).toEqual({});
            expect(Obj.except(() => 1, "a")).toEqual({});
            expect(Obj.except("str", "a")).toEqual({});
            expect(Obj.except(42, "a")).toEqual({});
        });
    });

    describe("forget", () => {
        it("should remove specified keys", () => {
            const obj = { name: "John", age: 30, city: "NYC" };
            expect(Obj.forget(obj, "age")).toEqual({
                name: "John",
                city: "NYC",
            });
        });

        it("should remove multiple keys", () => {
            const obj = { name: "John", age: 30, city: "NYC" };
            expect(Obj.forget(obj, ["age", "city"])).toEqual({ name: "John" });
        });

        it("should handle dot notation for nested removal", () => {
            const obj = { user: { name: "John", age: 30 } };
            expect(Obj.forget(obj, "user.age")).toEqual({
                user: { name: "John" },
            });
        });

        it("should handle non-existent keys gracefully", () => {
            const obj = { name: "John" };
            expect(Obj.forget(obj, "age")).toEqual({ name: "John" });
        });

        it("should resolve a top-level key following a dot key against the top level", () => {
            const obj = { users: { name: "Joe", id: 1 }, id: 99 };
            expect(Obj.forget(obj, ["users.name", "id"])).toEqual({
                users: { id: 1 },
            });
        });

        it("should resolve a top-level key following a deeper dot key against the top level", () => {
            const obj = {
                products: { desk: { price: 100 } },
                desk: "top-level",
            };
            expect(Obj.forget(obj, ["products.desk.price", "desk"])).toEqual({
                products: { desk: {} },
            });
        });

        it("should resolve a dot key following a deeper dot key from the top level", () => {
            const obj = { a: { b: { c: 1, "e.d": "literal" } }, e: { d: 3 } };
            expect(Obj.forget(obj, ["a.b.c", "e.d"])).toEqual({
                a: { b: { "e.d": "literal" } },
                e: {},
            });
        });

        it("should not replace a non-traversable value on the path", () => {
            // PHP's accessible() is false for objects, so nothing is removed
            // and the value is returned intact rather than emptied
            const date = new Date(0);
            expect(Obj.forget({ a: date }, "a.b")).toEqual({ a: date });
        });

        it("removes a literal dotted first-level key without traversing it (pin)", () => {
            // Arr::forget also calls Arr::exists first (Arr.php's fixed forget) — this
            // already worked before the fix to hasObjectKey/hasMixed/getObjectValue
            // (forgetKeysObject checks Object.hasOwn on the literal key up front).
            expect(
                Obj.forget(
                    { "products.desk": { price: 100 } },
                    "products.desk",
                ),
            ).toEqual({});
        });

        it("is a no-op for a null key or an empty key list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "forget-null", "forget-empty-array"
            const data = { products: { desk: { price: 100 } } };

            expect(Obj.forget(data, null)).toEqual({
                products: { desk: { price: 100 } },
            });
            expect(Obj.forget(data, [])).toEqual({
                products: { desk: { price: 100 } },
            });
        });

        it("leaves an emptied parent behind", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "forget-products.desk"
            expect(
                Obj.forget(
                    { products: { desk: { price: 100 } } },
                    "products.desk",
                ),
            ).toEqual({ products: {} });
        });

        it("skips a path whose intermediate segment is missing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "forget-missing-intermediate", "forget-shop", "forget-final-taxes"
            expect(
                Obj.forget(
                    { products: { desk: { price: 100 } } },
                    "products.final.price",
                ),
            ).toEqual({
                products: { desk: { price: 100 } },
            });
            expect(
                Obj.forget({ shop: { cart: { 150: 0 } } }, "shop.final.cart"),
            ).toEqual({ shop: { cart: { 150: 0 } } });
            expect(
                Obj.forget(
                    {
                        products: {
                            desk: { price: { original: 50, taxes: 60 } },
                        },
                    },
                    "products.desk.final.taxes",
                ),
            ).toEqual({
                products: { desk: { price: { original: 50, taxes: 60 } } },
            });
        });

        it("keeps an empty-string sibling when one listed path is missing", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "forget-empty-string-sibling"
            expect(
                Obj.forget(
                    { products: { desk: { price: 50 }, "": "something" } },
                    ["products.amount.all", "products.desk.price"],
                ),
            ).toEqual({
                products: { desk: {}, "": "something" },
            });
        });

        it("cannot reach a nested key that contains dots", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "forget-emails-nested"
            expect(
                Obj.forget(
                    {
                        emails: {
                            "joe@example.com": { name: "Joe" },
                            "jane@localhost": { name: "Jane" },
                        },
                    },
                    ["emails.joe@example.com", "emails.jane@localhost"],
                ),
            ).toEqual({ emails: { "joe@example.com": { name: "Joe" } } });
        });

        it("accepts integer and float keys", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "forget-int-key", "forget-float"
            expect(Obj.forget({ name: "hAz", 1: "test", 2: "bAz" }, 1)).toEqual(
                { name: "hAz", 2: "bAz" },
            );
            expect(
                Obj.forget({ 2: { 1: "products", 3: "users" } }, 2.3),
            ).toEqual({ 2: { 1: "products" } });
        });

        it("returns an empty object for non-accessible data", () => {
            // JS-only: forget used to hand non-object data straight to forgetKeys, whose
            // array path threw on scalars/functions; accessible() rejects it first, like only.
            expect(Obj.forget(42, "a")).toEqual({});
            expect(Obj.forget(null, "a")).toEqual({});
            expect(Obj.forget([1, 2, 3], 0)).toEqual({});
        });
    });

    describe("from", () => {
        it("converts a list to an index-keyed object", () => {
            const items = [1, 2, 3];
            const result = Obj.from(items);
            expect(result).toEqual({ 0: 1, 1: 2, 2: 3 });
        });

        it("should return an object", () => {
            const items = { a: 1, b: 2, c: 3 };
            const result = Obj.from(items);
            expect(result).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("should return the values of a Map", () => {
            const keys = new Map<string, string | number>([
                ["name", "John"],
                ["age", 30],
                ["city", "NYC"],
            ]);

            expect(Obj.from(keys)).toEqual({
                name: "John",
                age: 30,
                city: "NYC",
            });
        });

        it("throws error on WeakMap input", () => {
            const weakMap = new WeakMap();
            weakMap.set({}, "value");

            expect(() => Obj.from(weakMap)).toThrow(
                "WeakMap values cannot be enumerated in JavaScript; cannot convert to object.",
            );
        });

        it("should create object from entries", () => {
            const entries = [
                ["name", "John"],
                ["age", 30],
                ["city", "NYC"],
            ];

            expect(Obj.from(entries)).toEqual({
                "0": ["name", "John"],
                "1": ["age", 30],
                "2": ["city", "NYC"],
            });
        });

        it("should handle empty input", () => {
            expect(Obj.from([])).toEqual({});
        });

        it("throw error on scalar values", () => {
            expect(() => Obj.from("string")).toThrow(
                "Items cannot be represented by a scalar value.",
            );

            expect(() => Obj.from(42)).toThrow(
                "Items cannot be represented by a scalar value.",
            );

            expect(() => Obj.from(false)).toThrow(
                "Items cannot be represented by a scalar value.",
            );
        });

        it("copies a class instance's own properties", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "from-stdclass"
            class Thing {
                foo = "bar";
            }

            expect(Obj.from(new Thing())).toEqual({ foo: "bar" });
        });
    });

    describe("exists", () => {
        it("should return true for existing keys", () => {
            const obj = { name: "John", age: 30 };
            expect(Obj.exists(obj, "name")).toBe(true);
            expect(Obj.exists(obj, "age")).toBe(true);
        });

        it("should return false for non-existing keys", () => {
            const obj = { name: "John" };
            expect(Obj.exists(obj, "age")).toBe(false);
        });

        it("does not traverse dot paths", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "exists-no-dot-traversal", "exists-no-dot-traversal-miss", "exists-literal-dotted"
            expect(Obj.exists({ user: { name: "John" } }, "user.name")).toBe(
                false,
            );
            expect(Obj.exists({ user: { name: "John" } }, "user.age")).toBe(
                false,
            );
            expect(Obj.exists({ "user.name": "John" }, "user.name")).toBe(true);
        });

        it("should return false for non-accessible data", () => {
            expect(Obj.exists(null as unknown, "name")).toBe(false);
            expect(Obj.exists([] as unknown, "name")).toBe(false);
        });

        it("resolves a literal dotted key before traversing", () => {
            // Arr::exists is a literal array_key_exists check (Arr.php:497, :534) — it
            // must win over dot-path traversal. PHP-verified:
            // docs/php-parity/task-09-paths.json, "Arr::exists — literal dotted key".
            expect(Obj.exists({ "products.desk": {} }, "products.desk")).toBe(
                true,
            );
        });

        it("finds a key holding null and misses an absent integer key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "exists-null-value", "exists-int-miss"
            expect(Obj.exists({ a: null }, "a")).toBe(true);
            expect(Obj.exists({ a: 1 }, 0)).toBe(false);
        });

        it("casts a null key to the empty string and a float key to its string form", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "exists-null-key-empty-string", "exists-float-key"
            expect(Obj.exists({ "": 1 }, null)).toBe(true);
            expect(Obj.exists({ "1.5": 1 }, 1.5)).toBe(true);
        });

        it("casts an undefined key to the empty string too, same as null", () => {
            // JS-only: PHP has no `undefined`; toPhpKeyString maps it to "" like null.
            expect(Obj.exists({ "": 1 }, undefined)).toBe(true);
        });

        it("looks a float key up by PHP's (string) cast, so -0 is the key '-0'", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "exists-float-key-cast"
            expect(Obj.exists({ 0: 1 }, -0)).toBe(false);
            expect(Obj.exists({ "-0": 1 }, -0)).toBe(true);
            expect(Obj.exists({ INF: 1 }, Infinity)).toBe(true);
            expect(Obj.exists({ "1.0E+21": 1 }, 1e21)).toBe(true);
            expect(Obj.exists({ "0.3": 1 }, 0.1 + 0.2)).toBe(true);
        });
    });

    describe("first", () => {
        it("should return first value", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.first(obj)).toBe(1);
        });

        it("should return null for empty objects", () => {
            expect(Obj.first({})).toBe(null);
        });

        it("should return default value for empty objects", () => {
            expect(Obj.first({}, null, "default")).toBe("default");
        });

        it("should use predicate to find first matching value", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.first(obj, (x) => x > 1)).toBe(2);
        });

        it("should return default when predicate finds no match", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.first(obj, (x) => x > 5, "none")).toBe("none");
        });

        it("should handle null/undefined data", () => {
            expect(Obj.first(null)).toBe(null);
            expect(Obj.first(undefined, null, "default")).toBe("default");
        });

        it("should call function defaults", () => {
            expect(Obj.first({}, null, () => "function-default")).toBe(
                "function-default",
            );
        });

        it("should accept a Map as a keyed iterable", () => {
            const items = new Map([
                ["first", 100],
                ["second", 200],
                ["third", 300],
            ]);

            expect(Obj.first(items)).toBe(100);
            expect(Obj.first(items, (_value, key) => key === "second")).toBe(
                200,
            );
            expect(Obj.first(items, (value) => value > 500, "default")).toBe(
                "default",
            );
            expect(Obj.first(new Map(), null, "default")).toBe("default");
        });

        it("returns null or a lazy default when nothing matches, and can match a falsy value", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "first-assoc-no-match", "first-assoc-closure-default", "first-assoc-falsy-match"
            const obj = { a: 100, b: 200, c: 300 };

            expect(Obj.first(obj, (value) => value > 300)).toBe(null);
            expect(
                Obj.first(
                    obj,
                    (value) => value > 300,
                    () => "baz",
                ),
            ).toBe("baz");
            expect(
                Obj.first({ a: 0, b: 10, c: 20 }, (value) => value === 0),
            ).toBe(0);
        });
    });

    describe("last", () => {
        it("should return last value", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.last(obj)).toBe(3);
        });

        it("should return null for empty objects", () => {
            expect(Obj.last({})).toBe(null);
        });

        it("should return default value for empty objects", () => {
            expect(Obj.last({}, null, "default")).toBe("default");
        });

        it("should use predicate to find last matching value", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.last(obj, (x) => x < 3)).toBe(2);
        });

        it("should return default when predicate finds no match", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.last(obj, (x) => x > 5, "none")).toBe("none");
        });

        it("should handle null/undefined data", () => {
            expect(Obj.last(null)).toBe(null);
            expect(Obj.last(undefined, null, "default")).toBe("default");
        });

        it("should call function defaults", () => {
            expect(Obj.last({}, null, () => "function-default")).toBe(
                "function-default",
            );
        });

        it("should accept a Map as a keyed iterable", () => {
            const items = new Map([
                ["first", 100],
                ["second", 200],
                ["third", 300],
            ]);

            expect(Obj.last(items)).toBe(300);
            expect(Obj.last(items, (_value, key) => key !== "third")).toBe(200);
            expect(Obj.last(new Map(), null, "default")).toBe("default");
        });

        it("returns null or a lazy default when nothing matches", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "last-assoc-no-match", "last-assoc-closure-default"
            const obj = { a: 100, b: 200, c: 300 };

            expect(Obj.last(obj, (value) => value > 300)).toBe(null);
            expect(
                Obj.last(
                    obj,
                    (value) => value > 300,
                    () => "baz",
                ),
            ).toBe("baz");
        });

        it("hands last's callback the keys in reverse, the integer key as a number", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "callback-key last"
            const seen: string[] = [];

            Obj.last({ 1: "a", x: "b" }, (_value, key) => {
                seen.push(typeof key);

                return false;
            });

            expect(seen).toEqual(["string", "number"]);
        });
    });

    describe("get", () => {
        it("should get simple values", () => {
            const obj = { name: "John", age: 30 };
            expect(Obj.get(obj, "name")).toBe("John");
            expect(Obj.get(obj, "age")).toBe(30);
        });

        it("should get nested values with dot notation", () => {
            const obj = { user: { name: "John", address: { city: "NYC" } } };
            expect(Obj.get(obj, "user.name")).toBe("John");
            expect(Obj.get(obj, "user.address.city")).toBe("NYC");
        });

        it("should return default for missing keys", () => {
            const obj = { name: "John" };
            expect(Obj.get(obj, "age", 25)).toBe(25);
            expect(Obj.get(obj, "user.name", "default")).toBe("default");
        });

        it("should handle null/undefined keys", () => {
            const obj = { name: "John" };
            expect(Obj.get(obj, null)).toEqual(obj);
            expect(Obj.get(obj, undefined)).toEqual(obj);
        });

        it("should return default when null key with non-object data", () => {
            expect(Obj.get("string", null, "default")).toBe("default");
            expect(Obj.get(null, null, "default")).toBe("default");
            expect(Obj.get("string", null, () => "fn-default")).toBe(
                "fn-default",
            );
        });

        it("should handle non-object data", () => {
            expect(Obj.get("string", "key", "default")).toBe("default");
            expect(Obj.get(null, "key", "default")).toBe("default");
        });

        it("should handle non-object data with function default", () => {
            expect(Obj.get("string", "key", () => "fn-default")).toBe(
                "fn-default",
            );
        });

        it("should handle numeric keys", () => {
            const obj = { "123": "value" };
            expect(Obj.get(obj, 123)).toBe("value");
        });

        it("should handle numeric key with function default when missing", () => {
            const obj = { "123": "value" };
            expect(Obj.get(obj, 999, () => "fn-default")).toBe("fn-default");
        });

        it("should handle numeric key with non-function default when missing", () => {
            const obj = { "123": "value" };
            expect(Obj.get(obj, 999, "regular-default")).toBe(
                "regular-default",
            );
        });

        it("should call function defaults", () => {
            expect(Obj.get({}, "missing", () => "function-default")).toBe(
                "function-default",
            );
        });

        it("should handle dot notation path with null in chain", () => {
            const obj = { user: null };
            expect(Obj.get(obj, "user.name", "default")).toBe("default");
            expect(Obj.get(obj, "user.name", () => "fn-default")).toBe(
                "fn-default",
            );
        });

        it("should handle dot notation path with non-object in chain", () => {
            const obj = { user: "string-value" };
            expect(Obj.get(obj, "user.name", "default")).toBe("default");
            expect(Obj.get(obj, "user.name", () => "fn-default")).toBe(
                "fn-default",
            );
        });

        it("should handle dot notation when segment not in object", () => {
            const obj = { user: { name: "John" } };
            expect(Obj.get(obj, "user.age.years", "default")).toBe("default");
            expect(Obj.get(obj, "user.age.years", () => "fn-default")).toBe(
                "fn-default",
            );
        });

        it("returns the default when a present key holds undefined", () => {
            const obj = { name: undefined };
            expect(Obj.get(obj, "name", "default")).toBe("default");
        });

        it("should handle dot notation when final value is undefined", () => {
            const obj = { user: { name: undefined } };
            expect(Obj.get(obj, "user.name", "default")).toBe("default");
            expect(Obj.get(obj, "user.name", () => "fn-default")).toBe(
                "fn-default",
            );
        });

        it("should handle simple key when value exists", () => {
            const obj = { name: "John" };
            expect(Obj.get(obj, "name", () => "fn-default")).toBe("John");
        });

        it("should handle simple key when value is undefined with function default", () => {
            const obj = { name: undefined };
            expect(Obj.get(obj, "name", () => "fn-default")).toBe("fn-default");
        });

        it("resolves a literal dotted key before traversing", () => {
            // Arr::get calls Arr::exists first (Arr.php:497) — a literal key wins over
            // path traversal even when it contains dots. PHP-verified:
            // docs/php-parity/task-09-paths.json, "Arr::get — literal dotted key wins".
            expect(
                Obj.get({ "products.desk": { price: 100 } }, "products.desk"),
            ).toEqual({
                price: 100,
            });
        });

        it("agrees with has() on an undefined-valued literal dotted key", () => {
            // Arr::exists uses array_key_exists (presence), not isset: the literal "a.b"
            // key counts as found even with an undefined value, so this must not fall
            // through to traversing a -> b.
            const data = { "a.b": undefined, a: { b: 2 } };
            expect(Obj.get(data, "a.b", "default")).toBe("default");
            expect(Obj.has(data, "a.b")).toBe(true);
        });

        it("returns a present null instead of the default", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "get-null-value", "get-nested-null-value"
            const obj = { foo: null, bar: { baz: null } };

            expect(Obj.get(obj, "foo", "default")).toBe(null);
            expect(Obj.get(obj, "bar.baz", "default")).toBe(null);
        });

        it("returns the default when the data is false", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "get-false"
            expect(Obj.get(false, "foo", "default")).toBe("default");
        });

        it("returns the empty object for a null key, ignoring the default", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "get-empty-null-key", "get-empty-null-key-default"
            expect(Obj.get({}, null)).toEqual({});
            expect(Obj.get({}, null, "default")).toEqual({});
        });

        it("reads an empty-string key directly and through a lone dot", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "get-empty-string-key", "get-dot-only-key"
            expect(Obj.get({ "": "bar" }, "")).toBe("bar");
            expect(Obj.get({ "": { "": "bar" } }, ".")).toBe("bar");
        });

        it("traverses a nested list with numeric segments", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "get-through-list", "get-through-list-2", "get-through-list-missing"
            const obj = { products: [{ name: "desk" }, { name: "chair" }] };

            expect(Obj.get(obj, "products.0.name")).toBe("desk");
            expect(Obj.get(obj, "products.1.name")).toBe("chair");
            expect(Obj.get(obj, "products.2.name", "none")).toBe("none");
        });

        it("does not resolve a JS array's own keys as list indices", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "get-through-list-length", "get-through-list-leading-zero"
            const obj = { products: [1, 2, 3] };

            expect(Obj.get(obj, "products.length", "none")).toBe("none");
            expect(Obj.get(obj, "products.01", "none")).toBe("none");
        });
    });

    describe("has", () => {
        it("should check for simple keys", () => {
            const obj = { name: "John", age: 30 };
            expect(Obj.has(obj, "name")).toBe(true);
            expect(Obj.has(obj, "email")).toBe(false);
        });

        it("should check for nested keys with dot notation", () => {
            const obj = { user: { name: "John", address: { city: "NYC" } } };
            expect(Obj.has(obj, "user.name")).toBe(true);
            expect(Obj.has(obj, "user.address.city")).toBe(true);
            expect(Obj.has(obj, "user.email")).toBe(false);
        });

        it("should check for multiple keys", () => {
            const obj = { name: "John", age: 30 };
            expect(Obj.has(obj, ["name", "age"])).toBe(true);
            expect(Obj.has(obj, ["name", "email"])).toBe(false);
        });

        it("should handle non-accessible data", () => {
            expect(Obj.has(null, "key")).toBe(false);
            expect(Obj.has([], "key")).toBe(false);
        });

        it("should return false when key array contains null", () => {
            const obj = { name: "John", age: 30 };
            expect(Obj.has(obj, [null as unknown as string, "name"])).toBe(
                false,
            );
        });

        it("resolves a literal dotted key before traversing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::has
            // — literal dotted key".
            expect(
                Obj.has({ "products.desk": { price: 100 } }, "products.desk"),
            ).toBe(true);
        });

        it("finds a numeric key on a plain object, not only on arrays", () => {
            // hasMixed returned `isArray(data) && ...` for numeric keys, so a numeric key
            // on a plain object was always false. PHP-verified in
            // docs/php-parity/task-09-paths.json.
            expect(Obj.has({ 123: "x" }, 123)).toBe(true);
        });

        it("counts a key holding null as present", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "has-null-value", "has-nested-null-value"
            const obj = { foo: null, bar: { baz: null } };

            expect(Obj.has(obj, "foo")).toBe(true);
            expect(Obj.has(obj, "bar.baz")).toBe(true);
        });

        it("fails a path missing at the root or running through a scalar", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "has-plain-tens-bar", "has-plain-tens-bar.baz", "has-plain-tens-xxx.yyy", "has-plain-tens-foo.xxx"
            // "has-plain-tens-bar.xxx"
            const obj = { foo: 10, bar: { baz: 10 } };

            expect(Obj.has(obj, "bar")).toBe(true);
            expect(Obj.has(obj, "bar.baz")).toBe(true);
            expect(Obj.has(obj, "xxx.yyy")).toBe(false);
            expect(Obj.has(obj, "foo.xxx")).toBe(false);
            expect(Obj.has(obj, "bar.xxx")).toBe(false);
        });

        it("returns false for false data or a bare null key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "has-false", "has-null-null", "has-empty-null", "has-assoc-null-key"
            expect(Obj.has(false, "foo")).toBe(false);
            expect(Obj.has(null, null)).toBe(false);
            expect(Obj.has({}, null)).toBe(false);
            expect(Obj.has({ a: 1 }, null)).toBe(false);
            // A literal undefined for the whole `keys` argument takes the
            // same early-return path as null; not just null-coerced-to-"".
            expect(Obj.has({ a: 1 }, undefined)).toBe(false);
        });

        it("returns false for a bare null keys argument, even when the empty-string key is present", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "has-empty-string-key-null-key"
            expect(Obj.has({ "": "some" }, null)).toBe(false);
            // JS-only: undefined takes the same (array) null -> [] early-return path.
            expect(Obj.has({ "": "some" }, undefined)).toBe(false);
        });

        it("checks an array of dotted keys", () => {
            // ArrTest::testHas
            const obj = { products: { desk: { price: 100 } } };

            expect(Obj.has(obj, ["products.desk"])).toBe(true);
            expect(Obj.has(obj, ["products.desk", "products.desk.price"])).toBe(
                true,
            );
            expect(Obj.has(obj, ["products", "products"])).toBe(true);
            expect(Obj.has(obj, ["foo"])).toBe(false);
            expect(Obj.has(obj, [])).toBe(false);
            expect(Obj.has(obj, ["products.desk", "products.price"])).toBe(
                false,
            );
        });

        it("traverses a nested list with numeric segments", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "has-through-list", "has-through-list-miss"
            const obj = { products: [{ name: "desk" }] };

            expect(Obj.has(obj, "products.0.name")).toBe(true);
            expect(Obj.has(obj, "products.0.price")).toBe(false);
        });

        it("returns false for a [null] key list on empty or null data", () => {
            // ArrTest::testHas
            expect(Obj.has({}, [null])).toBe(false);
            expect(Obj.has(null, [null])).toBe(false);
        });

        it("finds an empty-string key only when it is present", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "has-empty-key", "has-empty-key-list", "has-empty-key-missing", "has-empty-key-list-missing"
            expect(Obj.has({ "": "some" }, "")).toBe(true);
            expect(Obj.has({ "": "some" }, [""])).toBe(true);
            expect(Obj.has({}, "")).toBe(false);
            expect(Obj.has({}, [""])).toBe(false);
        });

        it("looks up the empty-string key for a null inside a key list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "has-empty-string-key-null-in-list", "has-null-key-nonempty-assoc"
            expect(Obj.has({ "": "some" }, [null])).toBe(true);
            expect(Obj.has({ a: 1 }, [null, "a"])).toBe(false);
            // A literal undefined element casts to "" the same way null does.
            expect(Obj.has({ "": "some" }, [undefined])).toBe(true);
            expect(Obj.has({ a: 1 }, [undefined, "a"])).toBe(false);
        });
    });

    describe("own-property checks (inherited keys)", () => {
        it.each(["toString", "constructor", "valueOf", "hasOwnProperty"])(
            "does not see the inherited key %s",
            (key) => {
                // PHP-verified: Arr::has(['a'=>1],'toString') === false.
                expect(Obj.has({ a: 1 }, key)).toBe(false);
                expect(Obj.get({}, key, "D")).toBe("D");
                expect(Obj.exists({}, key)).toBe(false);
            },
        );

        it("does not see an inherited key through a dot path", () => {
            expect(Obj.get({ a: {} }, "a.constructor", "D")).toBe("D");
        });

        it("ignores inherited keys in only and intersectByKeys", () => {
            expect(Obj.only({ a: 1 }, ["constructor"])).toEqual({});
            expect(Obj.intersectByKeys({ constructor: 1 }, {})).toEqual({});
        });

        it("ignores inherited keys in select and intersectAssoc", () => {
            expect(Obj.select({ item: { a: 1 } }, ["constructor"])).toEqual({
                item: {},
            });

            // `{}` inherits toString, and `{}.toString` equals this same
            // reference, so a naive `in` check would wrongly pass both
            // the key-presence and value-equality tests here.
            const inheritedToString = Object.prototype.toString;
            expect(
                Obj.intersectAssoc({ toString: inheritedToString }, {}),
            ).toEqual({});
        });

        it("does not see an inherited key through getObjectValue", () => {
            // PHP-verified: Arr::add([], 'toString', 1) -> {"toString": 1}.
            // `in` found the inherited toString and skipped the write.
            expect(Obj.add({}, "toString", 1)).toEqual({ toString: 1 });

            // PHP-verified: keyBy('constructor') on an empty item resolves
            // to null (Arr::exists is false), falling back to the ""
            // key -- not the inherited constructor function.
            expect(Obj.keyBy({ a: {} }, "constructor")).toEqual({ "": {} });
        });
    });

    describe("hasAll", () => {
        it("should return true when all keys exist", () => {
            const obj = { name: "John", age: 30, city: "NYC" };
            expect(Obj.hasAll(obj, ["name", "age"])).toBe(true);
            expect(Obj.hasAll(obj, ["name", "age", "city"])).toBe(true);
        });

        it("should return false when any key is missing", () => {
            const obj = { name: "John", age: 30 };
            expect(Obj.hasAll(obj, ["name", "email"])).toBe(false);
        });

        it("should handle dot notation", () => {
            const obj = { user: { name: "John", address: { city: "NYC" } } };
            expect(Obj.hasAll(obj, ["user.name", "user.address.city"])).toBe(
                true,
            );
            expect(Obj.hasAll(obj, ["user.name", "user.email"])).toBe(false);
        });

        it("should handle non-accessible data", () => {
            expect(Obj.hasAll(null, ["key"])).toBe(false);
            expect(Obj.hasAll([], ["key"])).toBe(false);
        });

        it("should return false for empty keys array", () => {
            const obj = { name: "John" };
            expect(Obj.hasAll(obj, [])).toBe(false);
        });

        it("should handle single key as string", () => {
            const obj = { name: "John" };
            expect(Obj.hasAll(obj, "name")).toBe(true);
            expect(Obj.hasAll(obj, "missing")).toBe(false);
        });

        it("counts empty-string and null values as present", () => {
            // ArrTest::testHasAllMethod
            const obj = { name: "Taylor", age: "", city: null };

            expect(Obj.hasAll(obj, "age")).toBe(true);
            expect(Obj.hasAll(obj, "city")).toBe(true);
            expect(Obj.hasAll(obj, ["age", "car"])).toBe(false);
            expect(Obj.hasAll(obj, ["city", "some"])).toBe(false);
            expect(Obj.hasAll(obj, ["name", "age", "city"])).toBe(true);
            expect(Obj.hasAll(obj, ["name", "age", "city", "country"])).toBe(
                false,
            );
            expect(Obj.hasAll(obj, ["foo", "bar", "baz", "bar"])).toBe(false);
        });
    });

    describe("hasAny", () => {
        it("should return true when any key exists", () => {
            const obj = { name: "John", age: 30 };
            expect(Obj.hasAny(obj, ["name", "email"])).toBe(true);
            expect(Obj.hasAny(obj, ["email", "phone"])).toBe(false);
        });

        it("should handle single key as string (non-array)", () => {
            const obj = { name: "John", age: 30 };
            expect(Obj.hasAny(obj, "name")).toBe(true);
            expect(Obj.hasAny(obj, "email")).toBe(false);
        });

        it("should handle dot notation", () => {
            const obj = { user: { name: "John" } };
            expect(Obj.hasAny(obj, ["user.name", "user.email"])).toBe(true);
            expect(Obj.hasAny(obj, ["user.email", "user.phone"])).toBe(false);
        });

        it("should handle non-accessible data", () => {
            expect(Obj.hasAny(null, ["key"])).toBe(false);
            expect(Obj.hasAny([], ["key"])).toBe(false);
        });

        it("should handle null/empty keys", () => {
            expect(Obj.hasAny({}, null)).toBe(false);
            expect(Obj.hasAny({}, [])).toBe(false);
        });

        it("should return false for empty keys array on non-empty object", () => {
            const obj = { name: "John" };
            expect(Obj.hasAny(obj, [])).toBe(false);
        });

        it("counts empty-string and null values as present, top-level and dotted", () => {
            // ArrTest::testHasAnyMethod
            const obj = { name: "Taylor", age: "", city: null };
            const nested = { foo: { bar: null, baz: "" } };

            expect(Obj.hasAny(obj, "age")).toBe(true);
            expect(Obj.hasAny(obj, "city")).toBe(true);
            expect(Obj.hasAny(nested, "foo.bar")).toBe(true);
            expect(Obj.hasAny(nested, "foo.baz")).toBe(true);
            expect(Obj.hasAny(nested, "foo.bax")).toBe(false);
            expect(Obj.hasAny(nested, ["foo.bax", "foo.baz"])).toBe(true);
        });
    });

    describe("keys", () => {
        it("should return all keys", () => {
            const obj = { name: "John", age: 30, city: "NYC" };
            expect(Obj.keys(obj)).toEqual(["name", "age", "city"]);
        });

        it("should return empty array for empty objects", () => {
            expect(Obj.keys({})).toEqual([]);
        });

        it("should return empty array for non-accessible data", () => {
            expect(Obj.keys(null)).toEqual([]);
            expect(Obj.keys([])).toEqual([]);
        });

        it("should skip symbol keys", () => {
            const sym = Symbol("test");
            const obj = { a: 1, b: 2, [sym]: 3 };
            expect(Obj.keys(obj)).toEqual(["a", "b"]);
        });

        it("should convert numeric string keys back to numbers", () => {
            const obj = { "1": "a", "2": "b", foo: "c" };
            const keys = Obj.keys(obj);
            expect(keys).toContain(1);
            expect(keys).toContain(2);
            expect(keys).toContain("foo");
        });

        it("reports the same number of keys as values, even with a non-enumerable own property", () => {
            // Keys used to walk Reflect.ownKeys (every own key) while values walked
            // Object.values (enumerable only), so they desynced on a non-enumerable own
            // property and combine(keys(o), values(o)) broke.
            const data = Object.defineProperty({ a: 1 }, "hidden", {
                value: 2,
                enumerable: false,
            });
            expect(Obj.keys(data).length).toBe(Obj.values(data).length);
            expect(Obj.keys(data)).toEqual(["a"]);
            expect(Obj.values(data)).toEqual([1]);
        });

        it("reports canonical integer keys as numbers and keeps every other key a string", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "K1 keys of numeric-looking string keys"
            // JS hoists the canonical index "10" to the front; PHP keeps insertion order.
            expect(
                Obj.keys({
                    "1.5": "a",
                    Infinity: "b",
                    "-1": "c",
                    "01": "d",
                    "1e3": "e",
                    "10": "f",
                    "1e+21": "g",
                }),
            ).toEqual([10, "1.5", "Infinity", -1, "01", "1e3", "1e+21"]);
        });
    });

    describe("values", () => {
        it("should return all values", () => {
            const obj = { name: "John", age: 30, city: "NYC" };
            expect(Obj.values(obj)).toEqual(["John", 30, "NYC"]);
        });

        it("should return empty array for empty objects", () => {
            expect(Obj.values({})).toEqual([]);
        });

        it("should return empty array for non-accessible data", () => {
            expect(Obj.values(null)).toEqual([]);
            expect(Obj.values([])).toEqual([]);
        });

        it("drops sparse integer keys and returns a list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C1 values resets int keys"
            expect(Obj.values({ 1: "a", 2: "b", 3: "c" })).toEqual([
                "a",
                "b",
                "c",
            ]);
        });
    });

    describe("map", () => {
        it("should transform values", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.map(obj, (value) => value * 2);
            expect(result).toEqual({ a: 2, b: 4, c: 6 });
        });

        it("should pass key to callback", () => {
            const obj = { name: "john", email: "JOHN@EXAMPLE.COM" };
            const result = Obj.map(obj, (value, key) =>
                key === "name" ? value.toUpperCase() : value.toLowerCase(),
            );
            expect(result).toEqual({ name: "JOHN", email: "john@example.com" });
        });

        it("should handle empty objects", () => {
            expect(Obj.map({}, (x) => x)).toEqual({});
        });

        it("should handle non-accessible data", () => {
            expect(Obj.map(null, (x) => x)).toEqual({});
            expect(Obj.map([], (x) => x)).toEqual({});
        });

        it("passes the key and leaves the input untouched", () => {
            // ArrTest::testMap, ArrTest::testMapByReference
            const data = { first: "taylor", last: "otwell" };
            const mapped = Obj.map(
                data,
                (value, key) =>
                    `${String(key)}-${[...String(value)].reverse().join("")}`,
            );

            expect(mapped).toEqual({
                first: "first-rolyat",
                last: "last-llewto",
            });
            expect(data).toEqual({ first: "taylor", last: "otwell" });
        });

        it("still calls back for null values", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "map-null-values"
            expect(
                Obj.map(
                    { first: "taylor", last: null },
                    (value, key) => `${String(key)}-${String(value ?? "")}`,
                ),
            ).toEqual({
                first: "first-taylor",
                last: "last-",
            });
        });
    });

    describe("filter", () => {
        it("should filter values with callback", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.filter(obj, (value) => value > 2);
            expect(result).toEqual({ c: 3, d: 4 });
        });

        it("should filter falsy values when no callback", () => {
            const obj = { name: "John", age: null, city: "NYC", active: false };
            const result = Obj.filter(obj);
            expect(result).toEqual({ name: "John", city: "NYC" });
        });

        it("should filter empty arrays when no callback (PHP behavior)", () => {
            const obj = { name: "John", items: [], tags: ["a", "b"] };
            const result = Obj.filter(obj);
            expect(result).toEqual({ name: "John", tags: ["a", "b"] });
        });

        it("should filter empty objects when no callback (PHP behavior)", () => {
            const obj = { name: "John", metadata: {}, profile: { age: 30 } };
            const result = Obj.filter(obj);
            expect(result).toEqual({ name: "John", profile: { age: 30 } });
        });

        it("should pass key to callback", () => {
            const obj = { a: 1, b: 2, aa: 3 };
            const result = Obj.filter(
                obj,
                (_value, key) => typeof key === "string" && key.length === 1,
            );
            expect(result).toEqual({ a: 1, b: 2 });
        });

        it("should handle empty objects", () => {
            expect(Obj.filter({})).toEqual({});
        });

        it("should handle non-accessible data", () => {
            expect(Obj.filter(null)).toEqual({});
            expect(Obj.filter([])).toEqual({});
        });

        // array_filter's falsy set is narrower than Boolean: it drops "0", "", 0, [],
        // false and null, but keeps "00" and "0.0". PHP-verified in
        // docs/php-parity/task-04-shared.json.
        it("drops PHP-falsy values including the string zero", () => {
            expect(
                Obj.filter({ a: "0", b: "", c: 0, d: [], e: {}, f: "x" }),
            ).toEqual({ f: "x" });
        });

        it("keeps strings that merely look like zero", () => {
            expect(Obj.filter({ a: "00", b: "0.0", c: "0" })).toEqual({
                a: "00",
                b: "0.0",
            });
        });

        // PHP-verified (docs/php-parity/task-04-shared.json, "NAN is truthy for array_filter").
        it("keeps NaN, which is truthy in PHP", () => {
            expect(Obj.filter({ a: NaN, b: 0, c: 1 })).toEqual({
                a: NaN,
                c: 1,
            });
        });

        // The full nine-value probe set from docs/php-parity/task-04-shared.json,
        // pinned once: only 'g', 'h' and 'i' survive filter().
        it("matches the full probed falsy set", () => {
            expect(
                Obj.filter({
                    a: "0",
                    b: "",
                    c: 0,
                    d: [],
                    e: false,
                    f: null,
                    g: "x",
                    h: "00",
                    i: "0.0",
                }),
            ).toEqual({ g: "x", h: "00", i: "0.0" });
        });

        // JSON.parse produces a real own enumerable "__proto__" key (a literal `{
        // __proto__:... }` would set the prototype instead and never reach this code
        // path) — see obj.spec.ts's splice tests for the same pattern.
        it("does not reparent the result via a __proto__ entry", () => {
            const src = JSON.parse(
                '{"a":1,"__proto__":{"polluted":true},"c":3}',
            ) as Record<string, unknown>;
            const result = Obj.filter(src);
            expect((result as { polluted?: boolean }).polluted).toBeUndefined();
            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        });

        it("keeps a filter match on an integer key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "F1 filter callback key type for int key"
            expect(
                Obj.filter({ 1: "a", x: "b" }, (_value, key) => key === 1),
            ).toEqual({ 1: "a" });
        });
    });

    describe("set", () => {
        it("should set simple values", () => {
            const obj = { name: "John" };
            const result = Obj.set(obj, "age", 30);
            expect(result).toEqual({ name: "John", age: 30 });
            expect(result).not.toBe(obj); // should be immutable
        });

        it("should set nested values with dot notation", () => {
            const obj = { user: { name: "John" } };
            const result = Obj.set(obj, "user.age", 30);
            expect(result).toEqual({ user: { name: "John", age: 30 } });
        });

        it("replaces a nested class instance instead of writing into it", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "d6-set-assoc-nested-
            // object-is-replaced-wholesale": ['a' => new D4Point(1)] plus
            // Arr::set($src, 'a.y', 2) answers {"a": {"y": 2}}, recorded type `array`.
            const point = new D4Point();
            const result = Obj.set({ a: point }, "a.y", 2);

            expect(result).toEqual({ a: { y: 2 } });
            expect(result.a).not.toBe(point);
            expect(result.a).not.toBeInstanceOf(D4Point);
            expect(Object.entries(point)).toEqual([["x", 1]]);
        });

        it("descends into a nested list instead of replacing it", () => {
            // docs/php-parity/task-24-data-release-readiness.json,
            // "d6-nested-list-is-descended-not-replaced": ['a' => ['q']] plus
            // Arr::set($src, 'a.1', 'y') answers {"a": ["q", "y"]}.
            const inner = ["q"];
            const result = Obj.set({ a: inner }, "a.1", "y");

            expect(result).toEqual({ a: ["q", "y"] });
            expect(result.a).not.toBe(inner);
            expect(inner).toEqual(["q"]);
        });

        it("replaces a nested Date or Map, which carry no array entries", () => {
            // JS-only: PHP has neither, but Arr::set's is_array test replaces every
            // non-array, and both fail isPlainObject here for the same reason.
            expect(Obj.set({ a: new Date(0) }, "a.y", 2)).toEqual({
                a: { y: 2 },
            });
            expect(Obj.set({ a: new Map() }, "a.y", 2)).toEqual({
                a: { y: 2 },
            });
        });

        it("should replace entire object when key is null", () => {
            const result = Obj.set({ name: "John" }, null, { age: 30 });
            expect(result).toEqual({ age: 30 });
        });

        it("replaces the entire object for an undefined key, like null", () => {
            // JS-only: undefined has no PHP analogue; set treats it like null.
            expect(Obj.set({ name: "John" }, undefined, { age: 30 })).toEqual({
                age: 30,
            });
        });

        // docs/php-parity/task-23-obj-release-readiness.json: "set-null-array-null-key"
        // ($a = null; Arr::set($a, null, 5)) -> { value: 5, array: 5 }; is_null($key) is
        // checked before $array is touched, so a null array still returns the value.
        it("returns the value for a null key even when data is null", () => {
            expect(Obj.set(null, null, 5)).toEqual(5);
        });

        it("returns the value for an undefined key even when data is null, like null", () => {
            // JS-only: undefined has no PHP analogue; set treats it like null.
            expect(Obj.set(null, undefined, 5)).toEqual(5);
        });

        it("should handle deep nesting creation", () => {
            const result = Obj.set({}, "a.b.c.d", "value");
            expect(result).toEqual({ a: { b: { c: { d: "value" } } } });
        });

        it("should handle non-objects", () => {
            expect(Obj.set(null, "key", "value")).toEqual({});
            expect(Obj.set("string", "key", "value")).toEqual({});
        });

        // docs/php-parity/task-17-second-review.json: "Arr::set writes a
        // \"constructor\" key", "...a \"prototype\" key", "...a \"__proto__\" key"
        describe("unsafe-key write policy", () => {
            afterEach(() => {
                expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
                expect(Object.getPrototypeOf({})).toBe(Object.prototype);
            });

            it.each(["constructor", "prototype", "__proto__"])(
                "keeps a %s key as own data",
                (key) => {
                    expect(Object.hasOwn(Obj.set({}, key, 5), key)).toBe(true);
                },
            );

            // docs/php-parity/task-17-second-review.json, "Arr::set writes a nested \"constructor.prototype\" path"
            it("builds a nested constructor.prototype path without polluting", () => {
                const result = Obj.set({}, "constructor.prototype.polluted", 5);
                expect(result).toEqual({
                    constructor: { prototype: { polluted: 5 } },
                });
                expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
            });

            // setObjectValue clones every existing nested value it descends
            // through, unsafe key or not, so Obj.set stays immune here.
            it("never writes onto Object.prototype through an item's own aliased __proto__ key", () => {
                const item = Object.create(null) as Record<string, unknown>;
                item["__proto__"] = Object.prototype;
                Obj.set(item, "__proto__.PWN", 1);
                expect(({} as { PWN?: unknown }).PWN).toBeUndefined();
                expect(
                    Object.getOwnPropertyNames(Object.prototype),
                ).not.toContain("PWN");
            });
        });

        it("overwrites a nested leaf and replaces a scalar on the path", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "set-overwrite-nested", "set-scalar-intermediate"
            expect(
                Obj.set(
                    { products: { desk: { price: 100 } } },
                    "products.desk.price",
                    200,
                ),
            ).toEqual({
                products: { desk: { price: 200 } },
            });
            expect(
                Obj.set({ products: "desk" }, "products.desk.price", 200),
            ).toEqual({ products: { desk: { price: 200 } } });
        });

        it("sets an integer key and adds a string branch beside one", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "set-int-key", "set-list-input"
            expect(Obj.set({ 1: "test" }, 1, "hAz")).toEqual({ 1: "hAz" });
            expect(
                Obj.set({ 0: "products" }, "products.desk.price", 200),
            ).toEqual({
                0: "products",
                products: { desk: { price: 200 } },
            });
        });
    });

    describe("string", () => {
        it("should return string values", () => {
            const obj = { name: "John", title: "Developer" };
            expect(Obj.string(obj, "name")).toBe("John");
            expect(Obj.string(obj, "title")).toBe("Developer");
        });

        it("should return nested string values", () => {
            const obj = { user: { name: "John" } };
            expect(Obj.string(obj, "user.name")).toBe("John");
        });

        it("should throw error for non-string values", () => {
            // docs/php-parity/task-17-second-review.json, "gettype of an integer"
            const obj = { age: 30 };
            expect(() => Obj.string(obj, "age")).toThrow(
                "Object value for key [age] must be a string, integer found.",
            );
        });

        it("should return default value if key not found and default is string", () => {
            const obj = { name: "John" };
            expect(Obj.string(obj, "missing", "default")).toBe("default");
        });
    });

    describe("float", () => {
        it("should return float values", () => {
            const obj = { price: 19.99, discount: 0.1 };
            expect(Obj.float(obj, "price")).toBe(19.99);
            expect(Obj.float(obj, "discount")).toBe(0.1);
        });

        it("should return nested float values", () => {
            const obj = { product: { price: 29.99 } };
            expect(Obj.float(obj, "product.price")).toBe(29.99);
        });

        it("should throw error for non-number values", () => {
            const obj = { name: "John" };
            expect(() => Obj.float(obj, "name")).toThrow(
                "Object value for key [name] must be a float, string found.",
            );
        });

        it("reports the PHP type name for a null value", () => {
            // docs/php-parity/task-17-second-review.json, "gettype of null"
            expect(() => Obj.float({ name: null }, "name")).toThrow(
                "Object value for key [name] must be a float, NULL found.",
            );
        });

        it("should return default value if key not found and default is number", () => {
            const obj = { name: "John" };
            expect(Obj.float(obj, "missing", 0.0)).toBe(0.0);
        });

        it("returns a whole number, which PHP's is_float rejects", () => {
            // JS-only: JS has one number type, so 1 and 1.0 are the same value; Arr::float throws on an int
            // (docs/php-parity/task-17-second-review.json, "Arr::float rejects a whole-number int").
            expect(Obj.float({ k: 1 }, "k")).toBe(1);
        });
    });

    describe("integer", () => {
        it("should return integer values", () => {
            const obj = { age: 30, count: 100 };
            expect(Obj.integer(obj, "age")).toBe(30);
            expect(Obj.integer(obj, "count")).toBe(100);
        });

        it("should return nested integer values", () => {
            const obj = { user: { age: 25 } };
            expect(Obj.integer(obj, "user.age")).toBe(25);
        });

        it("should throw error for non-integer values", () => {
            // docs/php-parity/task-17-second-review.json, "gettype of a float"
            const obj = { price: 19.99 };
            expect(() => Obj.integer(obj, "price")).toThrow(
                "Object value for key [price] must be an integer, double found.",
            );
        });

        it("should throw error for string values", () => {
            const obj = { name: "John" };
            expect(() => Obj.integer(obj, "name")).toThrow(
                "Object value for key [name] must be an integer, string found.",
            );
        });

        it("should return default value if key not found and default is integer", () => {
            const obj = { name: "John" };
            expect(Obj.integer(obj, "missing", 42)).toBe(42);
        });
    });

    describe("contains", () => {
        it("should handle non-object data", () => {
            expect(Obj.contains(null, "value")).toBe(false);
            expect(Obj.contains([], "value")).toBe(false);
        });

        it("should find values in object", () => {
            const obj = { name: "John", age: 30, city: "NYC", zip: "35" };
            expect(Obj.contains(obj, "John")).toBe(true);
            expect(Obj.contains(obj, 30)).toBe(true);
            expect(Obj.contains(obj, "Jane")).toBe(false);
            expect(Obj.contains(obj, 35, true)).toBe(false);
        });

        it("should not find nested values", () => {
            const obj = { user: { name: "John", age: 30 } };
            expect(Obj.contains(obj, "John")).toBe(false);
        });

        it("should handle value as callback function", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.contains(obj, (x) => x > 2)).toBe(true);
            expect(Obj.contains(obj, (x) => x > 5)).toBe(false);
        });

        it("compares with PHP loose equality", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "L8 contains loose (assoc)"
            const odds = { a: 1, b: 3, c: 5 };

            expect(Obj.contains(odds, 1)).toBe(true);
            expect(Obj.contains(odds, "1")).toBe(true);
            expect(Obj.contains(odds, 2)).toBe(false);
            expect(Obj.contains(odds, "2")).toBe(false);
            expect(Obj.contains({ a: "1" }, 1)).toBe(true);
            for (const needle of [false, null, [], 0, ""]) {
                expect(Obj.contains({ a: null }, needle)).toBe(true);
            }
            for (const needle of [0, "0", false, null]) {
                expect(Obj.contains({ a: 0 }, needle)).toBe(true);
            }
            expect(Obj.contains({ a: 0 }, (value) => value < 5)).toBe(true);
            expect(Obj.contains({ a: 0 }, (value) => value > 5)).toBe(false);
            expect(
                Obj.contains({ a: "date", b: "class", c: { foo: 50 } }, "foo"),
            ).toBe(false);
            expect(
                Obj.contains(
                    { a: null, b: 1, c: 2 },
                    (value) => value === null,
                ),
            ).toBe(true);
        });

        it("compares with === when strict", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "L9 containsStrict (assoc)"
            const items = { a: 1, b: 3, c: 5, d: "02" };

            expect(Obj.contains(items, 1, true)).toBe(true);
            expect(Obj.contains(items, "1", true)).toBe(false);
            expect(Obj.contains(items, "02", true)).toBe(true);
            expect(Obj.contains(items, true, true)).toBe(false);
            expect(
                Obj.contains(items, (value) => Number(value) < 5, true),
            ).toBe(true);
            expect(Obj.contains({ a: 0 }, "0", true)).toBe(false);
            expect(Obj.contains({ a: 0 }, false, true)).toBe(false);
            expect(Obj.contains({ a: 1, b: null }, null, true)).toBe(true);
            expect(
                Obj.contains(
                    { a: "date", b: "class", c: { foo: 50 }, d: "" },
                    "",
                    true,
                ),
            ).toBe(true);
        });

        it("ignores a callback match holding null when strict", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D2 containsStrict callback matching a null value"
            expect(
                Obj.contains(
                    { a: null, b: 1 },
                    (value) => value === null,
                    true,
                ),
            ).toBe(false);
            expect(
                Obj.contains({ a: null, b: 1 }, (value) => value === null),
            ).toBe(true);
        });

        it("compares strictly the way PHP's === does", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "D3 containsStrict NAN", "D4 containsStrict array by value"
            expect(Obj.contains({ a: NaN }, NaN, true)).toBe(false);
            expect(Obj.contains({ a: [1] }, [1], true)).toBe(true);
            expect(Obj.contains({ a: { x: 1 } }, { x: 1 }, true)).toBe(true);
        });

        it("misses an object with the same entries in another order when strict", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "containsStrict-key-order"
            expect(
                Obj.contains({ a: { x: 1, y: 2 } }, { y: 2, x: 1 }, true),
            ).toBe(false);
            expect(
                Obj.contains({ a: { x: 1, y: 2 } }, { x: 1, y: 2 }, true),
            ).toBe(true);
        });

        it("compares loosely by default, the way PHP's == does", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "D3 containsStrict NAN", "D4 containsStrict array by value"
            expect(Obj.contains({ a: NaN }, NaN)).toBe(false);
            expect(Obj.contains({ a: { x: 1 } }, { x: "1" })).toBe(true);
        });

        it("compares a key path with an operator when a fourth argument follows", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "contains-three-args-operator"
            const rows = {
                a: { v: 1 },
                b: { v: 3 },
                c: { v: "4" },
                d: { v: 5 },
            };

            expect(Obj.contains(rows, "v", "=", 4)).toBe(true);
            expect(Obj.contains(rows, "v", "==", 4)).toBe(true);
            expect(Obj.contains(rows, "v", "===", 4)).toBe(false);
            expect(Obj.contains(rows, "v", ">", 4)).toBe(true);
        });

        it("compares a key path loosely in the three-argument form", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "contains-two-args-key-value"
            const rows = { a: { v: 1 }, b: { v: 3 }, c: { v: 5 } };

            expect(Obj.contains(rows, "v", 1)).toBe(true);
            expect(Obj.contains(rows, "v", 2)).toBe(false);
            // JS-only: an omitted third argument is the port's `strict` default, so
            // PHP's `contains($k, null)` is written with an explicit null, not undefined.
            expect(Obj.contains(rows, "v", undefined)).toBe(false);
        });

        it("reads the entry itself for a null key and takes a callable key whole", () => {
            // EnumeratesValues.php:1138-1155 — a callable key is the predicate, and
            // `data_get($item, null)` answers the item.
            expect(Obj.contains({ a: 1, b: 2 }, null, ">", 1)).toBe(true);
            expect(Obj.contains({ a: 1, b: 2 }, null, ">", 9)).toBe(false);
            expect(
                Obj.contains(
                    { a: 1, b: 2 },
                    (item: number) => item === 2,
                    "=",
                    1,
                ),
            ).toBe(true);
        });
    });

    describe("containsStrict", () => {
        it("compares by value with PHP's ===", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "containsStrict-numeric-string"
            expect(
                Obj.containsStrict({ a: 1, b: 3, c: 5, d: "02" }, "02"),
            ).toBe(true);
            expect(Obj.containsStrict({ a: 1, b: 3, c: 5, d: "02" }, 2)).toBe(
                false,
            );
        });

        it("compares a key path strictly when a second argument is given", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "containsStrict-two-args-by-value"
            expect(
                Obj.containsStrict({ r: { tags: ["a", "b"] } }, "tags", [
                    "a",
                    "b",
                ]),
            ).toBe(true);
            expect(
                Obj.containsStrict({ r: { t: { x: 1, y: 2 } } }, "t", {
                    y: 2,
                    x: 1,
                }),
            ).toBe(false);
            expect(
                Obj.containsStrict(
                    { r: { name: null }, s: { name: "x" } },
                    "name",
                    null,
                ),
            ).toBe(true);
            expect(Obj.containsStrict({ r: { a: 1 } }, "name", null)).toBe(
                true,
            );
            expect(Obj.containsStrict({ r: { name: "x" } }, "name", null)).toBe(
                false,
            );
        });

        it("ignores a callback match holding null, as first() does", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "D2 containsStrict callback matching a null value"
            expect(
                Obj.containsStrict(
                    { a: null, b: 1 },
                    (value) => value === null,
                ),
            ).toBe(false);
        });

        it("returns false for non-object data", () => {
            expect(Obj.containsStrict(null, "x")).toBe(false);
            expect(Obj.containsStrict([], "x")).toBe(false);
        });
    });

    describe("diff", () => {
        it("should return items not present in other object", () => {
            const obj1 = { a: 1, b: 2, c: 3 };
            const obj2 = { b: 2, d: 4 };
            expect(Obj.diff(obj1, obj2)).toEqual({ a: 1, c: 3 });
        });

        it("should consider different values as different", () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { a: 1, b: 3 };
            expect(Obj.diff(obj1, obj2)).toEqual({ b: 2 });
        });

        it("should handle non-accessible data", () => {
            const obj = { a: 1, b: 2 };
            expect(Obj.diff(obj, null)).toEqual({ a: 1, b: 2 });
            expect(Obj.diff(null, obj)).toEqual({});
        });

        it("diffs on values only, ignoring which key held the value on other", () => {
            // The pre-fix implementation matched array_diff_assoc (key present in other
            // AND same value excludes the item), so it would have returned { id: 1,
            // first_word: "Hello" } here since neither key exists on `other`.
            expect(
                Obj.diff({ id: 1, first_word: "Hello" }, { x: "Hello" }),
            ).toEqual({ id: 1 });
        });

        it("wraps a scalar other into a one-value array, as getArrayableItems does", () => {
            // A scalar other was treated as empty and the docblock attributed that to
            // PHP, which actually casts it to ['x']. PHP-verified:
            // docs/php-parity/task-16-final-review.json ("diff accepts an operand of any shape").
            expect(Obj.diff({ a: 1, b: "x" }, "x")).toEqual({ a: 1 });
            expect(Obj.diff({ a: 1, b: 2 }, 2)).toEqual({ a: 1 });
            expect(Obj.diff({ a: 1 }, undefined)).toEqual({ a: 1 });
        });

        it("is case-sensitive", () => {
            // Captured via docs/php-parity/task-06-setops.json ("diff is
            // case-sensitive"). CollectionTest.php:1590.
            expect(
                Obj.diff(
                    { 0: "en_GB", 1: "fr", 2: "HR" },
                    { 0: "en_gb", 1: "hr" },
                ),
            ).toEqual({ 0: "en_GB", 1: "fr", 2: "HR" });
        });

        it("treats a null other as empty rather than throwing", () => {
            // Captured via docs/php-parity/task-06-setops.json ("diff(null) returns
            // items unchanged").
            expect(Obj.diff({ id: 1 }, null)).toEqual({ id: 1 });
        });

        it("diffs an object against a list by value, as PHP does", () => {
            // PHP-verified via docs/php-parity/task-06-setops.json ("diff and
            // intersect accept any array operand"): collect(['a'=>10,'b'=>20])
            // ->diff([20]) === ['a'=>10]; the pre-fix guard rejected arrays outright.
            expect(Obj.diff({ a: 10, b: 20 }, [20])).toEqual({ a: 10 });
        });

        it("compares values with PHP's (string) cast, not strict equality", () => {
            // Captured: docs/php-parity/task-06-setops.json ("diff and
            // intersect compare by string cast"): array_diff([0],["0"]) === [].
            expect(Obj.diff({ a: 0 }, { x: "0" })).toEqual({});
            expect(Obj.diff({ a: null }, { x: "" })).toEqual({});
            expect(Obj.diff({ a: 0 }, { x: "" })).toEqual({ a: 0 });
        });

        // docs/php-parity/task-17-second-review.json, "diff with a Collection operand"
        it("unwraps a Collection-like operand instead of reading its fields", () => {
            const enumerable = { all: () => [20] };
            expect(Obj.diff({ a: 10, b: 20 }, enumerable)).toEqual({
                a: 10,
            });
        });

        // docs/php-parity/task-17-second-review.json, "diff with a Traversable operand"
        it("unwraps an iterable operand", () => {
            expect(Obj.diff({ a: 10, b: 20 }, new Set([20]))).toEqual({
                a: 10,
            });
        });
    });

    describe("diffKeys", () => {
        // docs/php-parity/task-24-data-release-readiness.json, "d6-diff-keys"
        it("keeps the entries whose key other does not carry", () => {
            expect(
                Obj.diffKeys(
                    { id: 1, first_word: "Hello" },
                    { id: 123, foo_bar: "Hello" },
                ),
            ).toEqual({ first_word: "Hello" });
        });

        it("ignores values entirely", () => {
            // Same row, "assoc-value-ignored".
            expect(Obj.diffKeys({ a: 1, b: 2 }, { a: 999 })).toEqual({ b: 2 });
        });

        it("keeps a matching key's own integer index out of the result", () => {
            // Same row, "list": diffKeys([1,2,3], [9,9]) -> [2 => 3].
            expect(Obj.diffKeys({ 0: 1, 1: 2, 2: 3 }, { 0: 9, 1: 9 })).toEqual({
                2: 3,
            });
        });

        it("keeps everything for a nullish operand", () => {
            // Same row, "nullish-operand": (['a' => 1])->diffKeys(null) answers {a: 1}.
            expect(Obj.diffKeys({ a: 1 }, null)).toEqual({ a: 1 });
        });

        it("returns nothing for nullish data", () => {
            // JS-only: PHP's Collection has no null backing, so no call records this;
            // it is the `accessible` guard every helper here shares.
            expect(Obj.diffKeys(null, { a: 1 })).toEqual({});
        });

        it("unwraps a Collection-like operand", () => {
            // Same row, "collection-operand".
            expect(
                Obj.diffKeys({ a: 1, b: 2 }, collectionLike({ a: 9 })),
            ).toEqual({ b: 2 });
        });
    });

    describe("diffUsing", () => {
        // docs/php-parity/task-24-data-release-readiness.json, "d6-diff-using"
        it("drops the entries the callback calls equal to some value of other", () => {
            expect(
                Obj.diffUsing(
                    { a: "green", b: "brown", c: "blue" },
                    { A: "GREEN", 0: "yellow" },
                    caseless,
                ),
            ).toEqual({ b: "brown", c: "blue" });
        });

        it("keeps everything for a nullish operand", () => {
            // Same row, "nullish-operand": (['a' => 'green'])->diffUsing(null, …)
            // answers {a: 'green'}.
            expect(Obj.diffUsing({ a: "green" }, null, caseless)).toEqual({
                a: "green",
            });
        });

        it("returns nothing for nullish data", () => {
            // JS-only: PHP's Collection has no null backing, so no call records this;
            // it is the `accessible` guard every helper here shares.
            expect(Obj.diffUsing(null, { a: "green" }, caseless)).toEqual({});
        });

        it("unwraps a Collection-like operand", () => {
            // Same row, "collection-operand".
            expect(
                Obj.diffUsing(
                    { a: "green", b: "brown" },
                    collectionLike(["GREEN"]),
                    caseless,
                ),
            ).toEqual({ b: "brown" });
        });
    });

    describe("intersectUsing", () => {
        // docs/php-parity/task-24-data-release-readiness.json, "d6-intersect-using"
        it("keeps the entries the callback calls equal to some value of other", () => {
            expect(
                Obj.intersectUsing(
                    { a: "green", b: "brown", c: "blue" },
                    { A: "GREEN", 0: "yellow" },
                    caseless,
                ),
            ).toEqual({ a: "green" });
        });

        it("keeps nothing for a nullish operand", () => {
            // Same row, "nullish-operand": (['a' => 'green'])->intersectUsing(null, …)
            // answers [].
            expect(Obj.intersectUsing({ a: "green" }, null, caseless)).toEqual(
                {},
            );
        });

        it("returns nothing for nullish data", () => {
            // JS-only: PHP's Collection has no null backing, so no call records this;
            // it is the `accessible` guard every helper here shares.
            expect(Obj.intersectUsing(null, { a: "green" }, caseless)).toEqual(
                {},
            );
        });

        it("unwraps a Collection-like operand", () => {
            // Same row, "collection-operand".
            expect(
                Obj.intersectUsing(
                    { a: "green", b: "brown" },
                    collectionLike(["GREEN"]),
                    caseless,
                ),
            ).toEqual({ a: "green" });
        });
    });

    describe("intersect", () => {
        it("should return items present in both objects", () => {
            const obj1 = { a: 1, b: 2, c: 3 };
            const obj2 = { b: 2, c: 4 };
            expect(Obj.intersect(obj1, obj2)).toEqual({ b: 2 });
        });

        it("should consider different values as different", () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { a: 1, b: 3 };
            expect(Obj.intersect(obj1, obj2)).toEqual({ a: 1 });
        });

        it("should handle closure callable third param", () => {
            const obj1 = { a: 1, b: 2, c: "3" };
            const obj2 = { b: 2, c: 3 };
            expect(Obj.intersect(obj1, obj2, (a, b) => a === b)).toEqual({
                b: 2,
            });
        });

        it("accepts an operand of any shape, as getArrayableItems does", () => {
            // An array or scalar other was rejected by the `accessible(other)` guard
            // while diff's own guard already accepted one. PHP-verified:
            // docs/php-parity/task-16-final-review.json ("intersect accepts an operand of any shape").
            expect(Obj.intersect({ a: 1 }, [1])).toEqual({ a: 1 });
            expect(Obj.intersect({ a: 1, b: 2 }, [2])).toEqual({ b: 2 });
            expect(Obj.intersect({ a: 1, b: "x" }, "x")).toEqual({ b: "x" });
        });

        it("compares values only, keeping the left keys", () => {
            // pre-fix this returned {}, since the pre-fix implementation required `key
            // in other` (array_intersect_assoc semantics).
            expect(
                Obj.intersect(
                    { id: 1, first_word: "Hello" },
                    { first_world: "Hello", last_word: "World" },
                ),
            ).toEqual({ first_word: "Hello" });
        });

        it("treats a null other as empty rather than throwing", () => {
            // Captured via docs/php-parity/task-06-setops.json ("intersect(null)").
            expect(Obj.intersect({ id: 1 }, null)).toEqual({});
        });

        it("compares values with PHP's (string) cast, not strict equality", () => {
            // Captured: docs/php-parity/task-06-setops.json ("diff and intersect
            // compare by string cast"): intersect_int_string is [0], intersect_bool_one
            // is [true], intersect_int_empty (array_intersect([0],[""])) is [].
            expect(Obj.intersect({ a: 0 }, { x: "0" })).toEqual({ a: 0 });
            expect(Obj.intersect({ a: true }, { x: "1" })).toEqual({
                a: true,
            });
            expect(Obj.intersect({ a: 0 }, { x: "" })).toEqual({});
        });

        it("treats NaN as matching itself, unlike the pre-fix strict ===", () => {
            // Pre-fix, diff (SameValueZero via .includes) and intersect (===)
            // disagreed on NaN: it vanished from both outputs instead of being
            // excluded from diff and kept by intersect, like any other match.
            expect(Obj.diff({ a: NaN }, { x: NaN })).toEqual({});
            expect(Obj.intersect({ a: NaN }, { x: NaN })).toEqual({ a: NaN });
        });

        // docs/php-parity/task-17-second-review.json, "intersect with a Collection operand"
        it("intersects against a Collection-like operand's values", () => {
            const enumerable = { all: () => [20] };
            expect(Obj.intersect({ a: 10, b: 20 }, enumerable)).toEqual({
                b: 20,
            });
        });
    });

    describe("intersectByKeys", () => {
        it("should return items with keys present in other object", () => {
            const obj1 = { a: 1, b: 2, c: 3 };
            const obj2 = { b: 20, d: 40 };
            expect(Obj.intersectByKeys(obj1, obj2)).toEqual({ b: 2 });
        });

        it("should handle empty objects", () => {
            expect(Obj.intersectByKeys({}, {})).toEqual({});
        });

        it("treats a null other as empty rather than throwing", () => {
            // Captured via docs/php-parity/task-06-setops.json
            // ("intersectByKeys(null)").
            expect(Obj.intersectByKeys({ name: "M" }, null)).toEqual({});
        });

        // docs/php-parity/task-17-second-review.json, "array_intersect_key never compares values"
        it("still ignores values entirely, even PHP-matching ones", () => {
            expect(Obj.intersectByKeys({ a: 0 }, { a: "zzz" })).toEqual({
                a: 0,
            });
        });
    });

    describe("intersectAssoc", () => {
        it("should return items where both key and value match", () => {
            const obj1 = { a: 1, b: 2, c: 3 };
            const obj2 = { a: 1, b: 20, d: 4 };
            expect(Obj.intersectAssoc(obj1, obj2)).toEqual({ a: 1 });
        });

        // docs/php-parity/task-17-second-review.json, "array_intersect_assoc casts values to string"
        it("matches values by PHP's string cast", () => {
            expect(Obj.intersectAssoc({ a: 0 }, { a: "0" })).toEqual({
                a: 0,
            });
        });

        it("should return empty when no matches", () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { a: 2, b: 3 };
            expect(Obj.intersectAssoc(obj1, obj2)).toEqual({});
        });

        it("should handle empty objects", () => {
            expect(Obj.intersectAssoc({}, {})).toEqual({});
        });

        it("still matches on key AND value together (must not collapse into intersect)", () => {
            // intersectAssoc keeps array_intersect_assoc semantics (CollectionTest.php:1809),
            // pinned so a future edit cannot collapse it into intersect's value-only rule.
            expect(
                Obj.intersectAssoc(
                    { a: "green", b: "brown", c: "blue", 0: "red" },
                    { a: "green", b: "yellow", 0: "blue", 1: "red" },
                ),
            ).toEqual({ a: "green" });
        });

        it("treats a null other as empty rather than throwing", () => {
            // Captured via docs/php-parity/task-06-setops.json
            // ("intersectAssoc(null)").
            expect(Obj.intersectAssoc({ a: "green" }, null)).toEqual({});
        });
    });

    describe("intersectAssocUsing", () => {
        it("should return items where keys match via callback and values are equal", () => {
            const obj1 = { a: "green", b: "brown" };
            const obj2 = { A: "GREEN", B: "brown" };
            const strcasecmpKeys = (a: PropertyKey, b: PropertyKey) =>
                String(a).toLowerCase() === String(b).toLowerCase();
            expect(Obj.intersectAssocUsing(obj1, obj2, strcasecmpKeys)).toEqual(
                {
                    b: "brown",
                },
            );
        });

        it("should return empty when no matches", () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { c: 1, d: 2 };
            expect(
                Obj.intersectAssocUsing(obj1, obj2, (a, b) => a === b),
            ).toEqual({});
        });

        it("treats a null other as empty rather than throwing", () => {
            // This value previously had no captured probe row backing it. Captured via
            // docs/php-parity/task-06-setops.json ("intersectAssocUsing(null)").
            expect(
                Obj.intersectAssocUsing({ a: "green" }, null, () => true),
            ).toEqual({});
        });

        // docs/php-parity/task-17-second-review.json, "array_intersect_assoc casts values to string"
        it("matches values by PHP's string cast, like intersectAssoc", () => {
            expect(
                Obj.intersectAssocUsing(
                    { a: 0 },
                    { a: "0" },
                    (x, y) => x === y,
                ),
            ).toEqual({ a: 0 });
        });

        it("matches keys via the callback but values case-sensitively", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C9 intersectAssocUsing strcasecmp"
            const strcasecmpKeys = (a: PropertyKey, b: PropertyKey) =>
                String(a).toLowerCase() === String(b).toLowerCase();

            expect(
                Obj.intersectAssocUsing(
                    { a: "green", b: "brown", c: "blue", 0: "red" },
                    { a: "GREEN", B: "brown", 0: "yellow", 1: "red" },
                    strcasecmpKeys,
                ),
            ).toEqual({ b: "brown" });
        });
    });

    describe("intersect family nullish data guard (C6)", () => {
        type IntersectFamilyFn = (
            data: unknown,
            other: unknown,
            // Matches intersectAssocUsing's real arity, so a future guard-order
            // change fails this as an assertion, not a `TypeError` on `undefined`.
            callback?: (a: unknown, b: unknown) => boolean,
        ) => Record<PropertyKey, unknown>;
        // Dispatches by name instead of `as never`, which `tsc --strict` rejects.
        const family = Obj as unknown as Record<string, IntersectFamilyFn>;
        const alwaysMatch = () => true;

        it.each([
            "intersect",
            "intersectAssoc",
            "intersectAssocUsing",
            "intersectByKeys",
        ])("%s returns empty for a nullish first operand, like diff", (fn) => {
            // PHP-verified via docs/php-parity/task-06-setops.json ("...treat a
            // nullish first operand as empty too"): getArrayableItems(null) === [],
            // so collect(null)->intersect*(...) is always empty.
            expect(family[fn]?.(null, { a: 1 }, alwaysMatch)).toEqual({});
        });
    });

    describe("pluck", () => {
        it("should pluck values with string key", () => {
            const obj = {
                user1: { name: "John", age: 30 },
                user2: { name: "Jane", age: 25 },
            };
            expect(Obj.pluck(obj, "name")).toEqual(["John", "Jane"]);
        });

        it("should pluck values with key mapping", () => {
            const obj = {
                user1: { id: 1, name: "John" },
                user2: { id: 2, name: "Jane" },
            };
            expect(Obj.pluck(obj, "name", "id")).toEqual({
                1: "John",
                2: "Jane",
            });
        });

        it("should pluck values with function value selector", () => {
            const obj = {
                user1: { name: "John", age: 30 },
                user2: { name: "Jane", age: 25 },
            };
            expect(Obj.pluck(obj, (item) => item.age * 2)).toEqual([60, 50]);
        });

        it("should pluck values with function key selector", () => {
            const obj = {
                user1: { name: "John", age: 30 },
                user2: { name: "Jane", age: 25 },
            };
            expect(
                Obj.pluck(obj, "name", (item) => `user_${item.age}`),
            ).toEqual({
                user_30: "John",
                user_25: "Jane",
            });
        });

        it("should handle dot notation in pluck", () => {
            const obj = {
                item1: { user: { profile: { name: "John" } } },
                item2: { user: { profile: { name: "Jane" } } },
            };
            expect(Obj.pluck(obj, "user.profile.name")).toEqual([
                "John",
                "Jane",
            ]);
        });

        it("should handle non-accessible data", () => {
            expect(Obj.pluck(null, "key")).toEqual([]);
            expect(Obj.pluck([], "key")).toEqual([]);
        });

        it("should handle non-accessible data with key", () => {
            expect(Obj.pluck(null, "value", "key")).toEqual({});
        });

        it("should handle stringable itemKey", () => {
            const obj = {
                user1: {
                    name: "John",
                    id: { toString: () => "custom-id-1" },
                },
                user2: {
                    name: "Jane",
                    id: { toString: () => "custom-id-2" },
                },
            };
            expect(Obj.pluck(obj, "name", "id")).toEqual({
                "custom-id-1": "John",
                "custom-id-2": "Jane",
            });
        });

        it("should handle missing key field (itemKey is null/undefined)", () => {
            const obj = {
                user1: { name: "John" }, // no 'id' field
                user2: { name: "Jane", id: null }, // 'id' is null
            };
            // PHP casts a null array key to "" (PHP-verified:
            // docs/php-parity/task-10-pluck-sort.json, "Arr::pluck — missing key field
            // vs explicit null key").
            const result = Obj.pluck(obj, "name", "id");
            expect(result).toEqual({
                "": "Jane",
            });
        });

        it("plucks values through a wildcard path", () => {
            const data = {
                a: { account: "a", users: [{ first: "taylor" }] },
                b: {
                    account: "b",
                    users: [{ first: "abigail" }, { first: "dayle" }],
                },
            };
            // PHP-verified: docs/php-parity/task-10-pluck-sort.json,
            // "Arr::pluck wildcard path" / "Arr::pluck wildcard + key".
            expect(Obj.pluck(data, "users.*.first")).toEqual([
                ["taylor"],
                ["abigail", "dayle"],
            ]);
            expect(Obj.pluck(data, "users.*.first", "account")).toEqual({
                a: ["taylor"],
                b: ["abigail", "dayle"],
            });
        });

        it("plucks values through an array path", () => {
            const data = {
                a: { developer: { name: "Taylor" } },
                b: { developer: { name: "Abigail" } },
            };
            // PHP-verified: docs/php-parity/task-10-pluck-sort.json,
            // "Arr::pluck array path".
            expect(Obj.pluck(data, ["developer", "name"])).toEqual([
                "Taylor",
                "Abigail",
            ]);
        });

        it("keeps the whole item when the value path is null", () => {
            const data = { a: { name: "Taylor", role: "dev" } };
            // PHP-verified: docs/php-parity/task-10-pluck-sort.json,
            // "Arr::pluck null value keeps the item".
            expect(Obj.pluck(data, null, "name")).toEqual({
                Taylor: { name: "Taylor", role: "dev" },
            });
        });

        it("keeps whole rows for an undefined value path, like null", () => {
            // JS-only: undefined has no PHP analogue; pluck treats it like null.
            expect(Obj.pluck({ a: { n: 1 } }, undefined)).toEqual([{ n: 1 }]);
        });

        it("yields null placeholders for a missing path", () => {
            const data = { a: { name: "x" }, b: { name: "y" } };
            // PHP-verified: docs/php-parity/task-10-pluck-sort.json,
            // "Arr::pluck missing path".
            expect(Obj.pluck(data, "foo")).toEqual([null, null]);
        });

        it("yields null when an intermediate segment is null", () => {
            // Distinct from a *missing* segment (which getNestedValue
            // reports as undefined): here "mid" exists and is explicitly
            // null, so there's nothing further to traverse for ".deeper".
            const data = { a: { mid: null } };
            expect(Obj.pluck(data, "mid.deeper")).toEqual([null]);
        });

        it('casts a boolean key to int, not the string "true"/"false"', () => {
            // PHP-verified:
            // docs/php-parity/task-10-pluck-sort.json, "Arr::pluck — boolean key casts
            // to int, not string".
            const data = {
                a: { flag: true, name: "X" },
                b: { flag: false, name: "Y" },
            };

            expect(Obj.pluck(data, "name", "flag")).toEqual({
                1: "X",
                0: "Y",
            });
        });

        it("expands a wildcard over a plain object, matching arr.pluck", () => {
            // Both packages expand object-shaped wildcard targets, matching
            // data_get's is_iterable.
            const data = {
                a: { meta: { x: { value: 1 }, y: { value: 2 } } },
            };
            expect(Obj.pluck(data, "meta.*.value")).toEqual([[1, 2]]);
        });

        it("yields null for a wildcard over a non-iterable target", () => {
            // PHP-verified in docs/php-parity/task-10-pluck-sort.json: data_get
            // bails to its default when the target is not iterable.
            expect(
                Obj.pluck({ a: { meta: "not-iterable" } }, "meta.*.value"),
            ).toEqual([null]);
            expect(Obj.pluck({ a: { meta: null } }, "meta.*.value")).toEqual([
                null,
            ]);
        });

        it("plucks containers and dot paths from string-keyed posts", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "pluck-comments", "pluck-comments.tags", "pluck-foo", "pluck-foo.bar"
            const data = {
                "post-1": { comments: { tags: ["#foo", "#bar"] } },
                "post-2": { comments: { tags: ["#baz"] } },
            };

            expect(Obj.pluck(data, "comments")).toEqual([
                { tags: ["#foo", "#bar"] },
                { tags: ["#baz"] },
            ]);
            expect(Obj.pluck(data, "comments.tags")).toEqual([
                ["#foo", "#bar"],
                ["#baz"],
            ]);
            expect(Obj.pluck(data, "foo")).toEqual([null, null]);
            expect(Obj.pluck(data, "foo.bar")).toEqual([null, null]);
        });

        it("plucks through a numeric segment into a nested list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "pluck-nested-user.0", "pluck-nested-arr-user-0str", "pluck-nested-user.1-by-user.0"
            // "pluck-nested-arr-1-by-0-str"
            const data = {
                a: { user: ["taylor", "otwell"] },
                b: { user: ["dayle", "rees"] },
            };

            expect(Obj.pluck(data, "user.0")).toEqual(["taylor", "dayle"]);
            expect(Obj.pluck(data, ["user", "0"])).toEqual(["taylor", "dayle"]);
            expect(Obj.pluck(data, "user.1", "user.0")).toEqual({
                taylor: "otwell",
                dayle: "rees",
            });
            expect(Obj.pluck(data, ["user", "1"], ["user", "0"])).toEqual({
                taylor: "otwell",
                dayle: "rees",
            });
        });

        it("yields null for each wildcard element missing the leaf", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "pluck-wildcard-email"
            const data = {
                x: {
                    account: "a",
                    users: [
                        {
                            first: "taylor",
                            last: "otwell",
                            email: "taylorotwell@gmail.com",
                        },
                    ],
                },
                y: {
                    account: "b",
                    users: [
                        { first: "abigail", last: "otwell" },
                        { first: "dayle", last: "rees" },
                    ],
                },
            };

            expect(Obj.pluck(data, "users.*.email")).toEqual([
                ["taylorotwell@gmail.com"],
                [null, null],
            ]);
        });

        it("reads class-instance rows alongside plain-object rows", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "pluck-obj-and-array-rows-name", "pluck-obj-and-array-rows-email-by-name"
            class Person {
                name = "taylor";
                email = "foo";
            }
            const data = {
                a: new Person(),
                b: { name: "dayle", email: "bar" },
            };

            expect(Obj.pluck(data, "name")).toEqual(["taylor", "dayle"]);
            expect(Obj.pluck(data, "email", "name")).toEqual({
                taylor: "foo",
                dayle: "bar",
            });
        });
    });

    describe("pop", () => {
        it("should remove and return last item", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.pop(obj);
            expect(result).toBe(3);
            expect(obj).toEqual({ a: 1, b: 2 });
        });

        it("should remove and return last items", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.pop(obj, 2);
            expect(result).toEqual([3, 2]);
            expect(obj).toEqual({ a: 1 });
        });

        it("returns every item when the count exceeds the length", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.pop(obj, 5);
            expect(result).toEqual([3, 2, 1]);
            expect(obj).toEqual({});
        });

        it("should return null for empty objects", () => {
            const obj = {};
            const result = Obj.pop(obj);
            expect(result).toBe(null);
            expect(obj).toEqual({});

            expect(Obj.pop(obj, 3)).toEqual([]);
        });

        it("should return null for non-object values", () => {
            expect(Obj.pop(null)).toBe(null);
            expect(Obj.pop([])).toBe(null);

            expect(Obj.pop(null, 3)).toEqual([]);
            expect(Obj.pop([], 3)).toEqual([]);
        });

        it("leaves a prototype object untouched instead of deleting from it", () => {
            // JS-only: a PHP array has no prototype; a delete on one is a write every inheritor sees.
            class Holder {}
            Object.defineProperty(Holder.prototype, "kept", {
                value: "str",
                enumerable: true,
                configurable: true,
                writable: true,
            });

            expect(Obj.pop(Holder.prototype)).toBeNull();
            expect(Obj.pop(Holder.prototype, 2)).toEqual([]);
            expect(Object.entries(Holder.prototype)).toEqual([["kept", "str"]]);
        });

        it("refuses a hostile prototype object carrying its own __proto__ key", () => {
            // JS-only: Object.create(null) is the only way to give a prototype object an own
            // enumerable "__proto__" key; a literal `{ __proto__: ... }` sets the link instead.
            const hostile = Object.create(null) as Record<string, unknown>;
            hostile["__proto__"] = { polluted: true };
            hostile["kept"] = "str";
            const Hostile = function () {} as unknown as { prototype: unknown };
            Hostile.prototype = hostile;
            hostile["constructor"] = Hostile;

            expect(Obj.pop(hostile)).toBeNull();
            expect(Obj.pop(hostile, 3)).toEqual([]);
            expect(Object.keys(hostile)).toEqual([
                "__proto__",
                "kept",
                "constructor",
            ]);
        });
    });

    describe("take", () => {
        it("should take first n items", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            expect(Obj.take(obj, 2)).toEqual({ a: 1, b: 2 });
        });

        it("should take all items if count is larger", () => {
            const obj = { a: 1, b: 2 };
            expect(Obj.take(obj, 5)).toEqual({ a: 1, b: 2 });
        });

        it("should return empty object for zero count", () => {
            const obj = { a: 1, b: 2 };
            expect(Obj.take(obj, 0)).toEqual({});
        });

        it("should handle negative count", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            expect(Obj.take(obj, -2)).toEqual({ c: 3, d: 4 });
        });

        it("should return all items when limit equals length (positive)", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.take(obj, 3)).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("should return all items when negative limit abs equals length", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.take(obj, -3)).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("should return all items when negative limit abs exceeds length", () => {
            const obj = { a: 1, b: 2 };
            expect(Obj.take(obj, -5)).toEqual({ a: 1, b: 2 });
        });

        it("should return empty object for empty input", () => {
            expect(Obj.take({}, 5)).toEqual({});
        });
    });

    describe("flatten", () => {
        it("flattens fully by default, matching Arr::flatten's INF default (Arr.php:368)", () => {
            // Flatten used to default to depth 2, pinning a divergence from
            // Arr::flatten, whose $depth defaults to INF.
            const obj = {
                users: { john: { name: "John" }, jane: { name: "Jane" } },
                posts: { "1": { title: "Hello" } },
            };

            const result = Obj.flatten(obj);

            expect(result).toEqual(["John", "Jane", "Hello"]);
        });

        // docs/php-parity/task-17-second-review.json, "Arr::flatten defaults to unlimited depth"
        it("flattens to unlimited depth by default", () => {
            expect(Obj.flatten({ a: { b: { c: { d: 1 } } } })).toEqual([1]);
        });

        // docs/php-parity/task-17-second-review.json, "Arr::flatten honours an explicit depth of 2"
        it("stops at an explicit depth", () => {
            expect(Obj.flatten({ a: { b: { c: { d: 1 } } } }, 2)).toEqual([
                { d: 1 },
            ]);
        });

        it("spends the last level of depth on the container's own values", () => {
            const obj = {
                users: { john: { name: "John" }, jane: { name: "Jane" } },
                posts: { "1": { title: "Hello" } },
            };

            expect(Obj.flatten(obj, 2)).toEqual(["John", "Jane", "Hello"]);
        });

        it("respects the depth parameter", () => {
            const obj = { a: { b: { c: { d: "value" } } } };

            expect(Obj.flatten(obj, 1)).toEqual([{ c: { d: "value" } }]);
            expect(Obj.flatten(obj, 2)).toEqual([{ d: "value" }]);
            expect(Obj.flatten(obj, 3)).toEqual(["value"]);
        });

        it("handles arrays within object values at boundary depth", () => {
            const obj = { items: [{ v: 1 }, { v: 2 }] };

            expect(Obj.flatten(obj)).toEqual([1, 2]);
            expect(Obj.flatten(obj, 2)).toEqual([1, 2]);
            expect(Obj.flatten(obj, 1)).toEqual([{ v: 1 }, { v: 2 }]);
        });

        it("returns empty array for non-accessible data", () => {
            expect(
                Obj.flatten(null as unknown as Record<string, unknown>),
            ).toEqual([]);
            expect(
                Obj.flatten(undefined as unknown as Record<string, unknown>),
            ).toEqual([]);
        });

        it("keeps descending at depth 0, since only depth 1 stops it", () => {
            const obj = {
                users: { john: { name: "John" }, jane: { name: "Jane" } },
                posts: { "1": { title: "Hello" } },
            };

            expect(Obj.flatten(obj, 0)).toEqual(["John", "Jane", "Hello"]);
        });

        it("flattens objects with primitive values", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.flatten(obj, 1)).toEqual([1, 2, 3]);
        });

        it("returns empty array for scalar values that are not accessible", () => {
            // Scalar values are not "accessible" (not objects or arrays), so return empty
            expect(Obj.flatten("scalar")).toEqual([]);
            expect(Obj.flatten(42)).toEqual([]);
            expect(Obj.flatten(null)).toEqual([]);
        });

        it("keeps null items", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "flatten-assoc-nulls"
            expect(
                Obj.flatten({ a: ["#foo", null], b: "#baz", c: null }),
            ).toEqual(["#foo", null, "#baz", null]);
        });

        it("keeps an object that isn't a plain object whole", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "flatten-object-leaf"
            const point = new Point();
            const date = new Date(0);
            const map = new Map([["a", 1]]);
            const result = Obj.flatten({
                a: point,
                b: { c: date, d: [2] },
                m: map,
            });

            expect(result).toHaveLength(4);
            expect(result[0]).toBe(point);
            expect(result[1]).toBe(date);
            expect(result[2]).toBe(2);
            expect(result[3]).toBe(map);
        });

        it("flattens a Collection-like item's items", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "flatten-collection-item"
            expect(
                Obj.flatten({ a: collectionLike([1, [2, 3]]), b: 4 }),
            ).toEqual([1, 2, 3, 4]);
            expect(
                Obj.flatten({
                    a: collectionLike({ a: 1, b: collectionLike([2]) }),
                }),
            ).toEqual([1, 2]);
            expect(Obj.flatten({ a: collectionLike([[1, 2], 3]) }, 1)).toEqual([
                [1, 2],
                3,
            ]);

            const kept = collectionLike([2, 3]);
            expect(Obj.flatten({ a: [kept] }, 1)).toEqual([kept]);
        });
    });

    describe("flattenDot", () => {
        it("should flatten nested objects with dot notation keys", () => {
            const obj = {
                users: {
                    john: { name: "John", age: 30 },
                    jane: { name: "Jane", age: 25 },
                },
            };

            expect(Obj.flattenDot(obj)).toEqual({
                "users.john.name": "John",
                "users.john.age": 30,
                "users.jane.name": "Jane",
                "users.jane.age": 25,
            });
        });

        it("should respect the depth parameter", () => {
            const obj = { a: { b: { c: { d: "value" } } } };

            // depth = 1: flatten to one level below root
            expect(Obj.flattenDot(obj, 1)).toEqual({
                "a.b": { c: { d: "value" } },
            });

            // depth = 2: flatten to two levels
            expect(Obj.flattenDot(obj, 2)).toEqual({
                "a.b.c": { d: "value" },
            });
        });

        it("should handle arrays within objects", () => {
            const obj = { items: [1, 2, 3] };
            expect(Obj.flattenDot(obj)).toEqual({
                "items.0": 1,
                "items.1": 2,
                "items.2": 3,
            });
        });

        it("should return empty object for non-accessible data", () => {
            expect(Obj.flattenDot(null)).toEqual({});
            expect(Obj.flattenDot(undefined)).toEqual({});
            expect(Obj.flattenDot("string")).toEqual({});
            expect(Obj.flattenDot(123)).toEqual({});
        });

        it("should handle nested arrays", () => {
            const obj = {
                matrix: [
                    [1, 2],
                    [3, 4],
                ],
            };
            expect(Obj.flattenDot(obj)).toEqual({
                "matrix.0.0": 1,
                "matrix.0.1": 2,
                "matrix.1.0": 3,
                "matrix.1.1": 4,
            });
        });

        it("should handle mixed nested structures", () => {
            const obj = {
                users: [{ name: "John" }, { name: "Jane" }],
            };
            expect(Obj.flattenDot(obj)).toEqual({
                "users.0.name": "John",
                "users.1.name": "Jane",
            });
        });

        it("should handle depth limiting with arrays", () => {
            const obj = { items: [{ nested: { deep: "value" } }] };

            // depth = 1: only one level
            expect(Obj.flattenDot(obj, 1)).toEqual({
                "items.0": { nested: { deep: "value" } },
            });

            // depth = 2: two levels
            expect(Obj.flattenDot(obj, 2)).toEqual({
                "items.0.nested": { deep: "value" },
            });
        });

        it("should return empty object with empty path for scalars at root", () => {
            // Scalar at root level with no path should produce empty result
            const obj = { value: "scalar" };
            expect(Obj.flattenDot(obj)).toEqual({ value: "scalar" });
        });

        it("should handle depth=-1 which outputs nothing at root level", () => {
            const obj = { a: { b: 1 } };
            // depth=-1 means maxSegments=0, so pathLen (0) >= maxSegments (0) is true
            // at root level, but pathLen is 0, so nothing is output
            expect(Obj.flattenDot(obj, -1)).toEqual({});
        });

        it("drops an empty nested container, which Arr::dot keeps as a leaf", () => {
            // JS-only: flattenDot has no PHP source; Arr::dot gives {"foo": []} and {"foo.bar": []} here
            // (docs/php-parity/task-23-obj-release-readiness.json, "dot-empty-leaf", "dot-nested-empty-leaf").
            expect(Obj.flattenDot({ foo: [] })).toStrictEqual({});
            expect(Obj.flattenDot({ foo: { bar: [] } })).toStrictEqual({});
            expect(Obj.flattenDot({ foo: {}, bar: 1 })).toStrictEqual({
                bar: 1,
            });
        });

        it("keeps an object that isn't a plain object as a leaf, like dot", () => {
            // JS-only: flattenDot has no PHP source; it follows dot's leaf rule ("dot-object-leaf").
            const point = new Point();
            const date = new Date(0);
            const result = Obj.flattenDot({
                a: point,
                b: { c: date },
                l: [point],
            });

            expect(Object.keys(result)).toEqual(["a", "b.c", "l.0"]);
            expect(result["a"]).toBe(point);
            expect(result["b.c"]).toBe(date);
            expect(result["l.0"]).toBe(point);
        });
    });

    describe("flip", () => {
        it("should flip keys and values", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.flip(obj)).toEqual({ 1: "a", 2: "b", 3: "c" });
        });

        it("should handle duplicate values", () => {
            const obj = { a: 1, b: 2, c: 1 };
            expect(Obj.flip(obj)).toEqual({ 1: "c", 2: "b" });
        });

        it("should handle empty objects", () => {
            expect(Obj.flip({})).toEqual({});
        });

        it("should handle non-object values", () => {
            expect(Obj.flip(null)).toEqual({});
        });

        it("should skip values that are not valid PHP array keys", () => {
            const obj = {
                string: "taylor",
                integer: 1,
                null: null,
                false: false,
                true: true,
                float: 1.5,
                array: [],
                object: {},
            };
            expect(Obj.flip(obj)).toEqual({ taylor: "string", 1: "integer" });
        });

        it("should skip numbers beyond PHP's integer range", () => {
            // these are floats in PHP, so array_flip skips them rather than
            // producing an exponent-notation key
            expect(Obj.flip({ huge: 1e21, negative: -1e21 })).toEqual({});
            expect(Obj.flip({ large: 1e16 })).toEqual({
                10000000000000000: "large",
            });
        });

        it("should keep PHP_INT_MIN, whose integer bound is inclusive", () => {
            // PHP_INT_MIN is exactly -2^63 and is a valid PHP array key, so
            // array_flip keeps it rather than skipping it as an out-of-range
            // float
            expect(Obj.flip({ min: -(2 ** 63) })).toEqual({
                [String(-(2 ** 63))]: "min",
            });

            // 2^63 is PHP_INT_MAX + 1, which is a float in PHP, so it is
            // skipped
            expect(Obj.flip({ overflow: 2 ** 63 })).toEqual({});
        });

        it("should keep __proto__ as an own key without polluting the prototype", () => {
            const result = Obj.flip({ a: "__proto__", b: "constructor" });

            expect(Object.hasOwn(result, "__proto__")).toBe(true);
            expect(result["__proto__"]).toBe("a");
            expect(result["constructor"]).toBe("b");
            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
            expect(({} as Record<string, unknown>)["a"]).toBeUndefined();
        });

        it("flips string values into keys", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C2 flip one", "C3 flip two"
            expect(Obj.flip({ name: "taylor" })).toEqual({ taylor: "name" });
            expect(Obj.flip({ name: "taylor", framework: "laravel" })).toEqual({
                taylor: "name",
                laravel: "framework",
            });
        });

        it("hands an integer key back as a number", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "flip-int-key-type"
            const flipped = Obj.flip({ 0: "a", b: "c" });

            expect(flipped).toEqual({ a: 0, c: "b" });
            expect(typeof flipped["a"]).toBe("number");
        });
    });

    describe("every", () => {
        it("should return true if all items pass test", () => {
            const obj = { a: 2, b: 4, c: 6 };
            expect(Obj.every(obj, (value) => value % 2 === 0)).toBe(true);
        });

        it("should return false if any item fails test", () => {
            const obj = { a: 2, b: 3, c: 6 };
            expect(Obj.every(obj, (value) => value % 2 === 0)).toBe(false);
        });

        it("should return true for empty objects", () => {
            expect(Obj.every({}, () => false)).toBe(true);
        });

        it("returns false for non-object data", () => {
            expect(Obj.every(false, () => false)).toBe(false);
            expect(Obj.every(null, () => false)).toBe(false);
            expect(Obj.every(undefined, () => false)).toBe(false);
            expect(Obj.every(42, () => false)).toBe(false);
        });

        it("should accept a Map as a keyed iterable", () => {
            const items = new Map([
                ["first", 1],
                ["second", 2],
            ]);

            expect(
                Obj.every(items, (value, key) => isString(key) && value > 0),
            ).toBe(true);
            expect(Obj.every(items, (value) => value > 1)).toBe(false);
            expect(Obj.every(new Map<string, number>(), () => false)).toBe(
                true,
            );
        });
    });

    describe("some", () => {
        it("should return false for non-object values", () => {
            expect(Obj.some(false, () => true)).toBe(false);
            expect(Obj.some(null, () => true)).toBe(false);
            expect(Obj.some(undefined, () => true)).toBe(false);
            expect(Obj.some(42, () => true)).toBe(false);
        });

        it("should return true if any item passes test", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.some(obj, (value) => value % 2 === 0)).toBe(true);
        });

        it("should return false if no items pass test", () => {
            const obj = { a: 1, b: 3, c: 5 };
            expect(Obj.some(obj, (value) => value % 2 === 0)).toBe(false);
        });

        it("should return false for empty objects", () => {
            expect(Obj.some({}, () => true)).toBe(false);
        });

        it("should accept a Map as a keyed iterable", () => {
            const items = new Map([
                ["first", 1],
                ["second", 2],
            ]);

            expect(
                Obj.some(
                    items,
                    (value, key) => key === "second" && value === 2,
                ),
            ).toBe(true);
            expect(Obj.some(items, (value) => value > 5)).toBe(false);
            expect(Obj.some(new Map<string, number>(), () => true)).toBe(false);
        });
    });

    describe("join", () => {
        it("should return empty string for non-object values", () => {
            expect(Obj.join(null, ",")).toBe("");
            expect(Obj.join(undefined, ",")).toBe("");
            expect(Obj.join(42, ",")).toBe("");
            expect(Obj.join("string", ",")).toBe("");
        });

        it("should join values with glue", () => {
            const obj = { a: "hello", b: "world", c: "test" };
            expect(Obj.join(obj, ", ")).toBe("hello, world, test");
        });

        it("should handle final glue", () => {
            const obj = { a: "apple", b: "banana", c: "cherry" };
            expect(Obj.join(obj, ", ", " and ")).toBe(
                "apple, banana and cherry",
            );
        });

        it("should handle single item", () => {
            const obj = { a: "only" };
            expect(Obj.join(obj, ", ", " and ")).toBe("only");
        });

        it("should handle empty object", () => {
            const obj = {};
            expect(Obj.join(obj, ", ", " and ")).toBe("");
        });

        it("uses only the final glue for two items", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "join-assoc-two"
            expect(Obj.join({ a: "a", b: "b" }, ", ", " and ")).toBe("a and b");
        });
    });

    describe("keyBy", () => {
        it("should key object by callback result", () => {
            const obj = {
                user1: { id: 10, name: "John" },
                user2: { id: 20, name: "Jane" },
            };
            const result = Obj.keyBy(obj, (item) => item.id.toString());
            expect(result).toEqual({
                10: { id: 10, name: "John" },
                20: { id: 20, name: "Jane" },
            });
        });

        it("should key by string property", () => {
            const obj = {
                user1: { id: 10, name: "John" },
                user2: { id: 20, name: "Jane" },
            };
            const result = Obj.keyBy(obj, "name");
            expect(result).toEqual({
                John: { id: 10, name: "John" },
                Jane: { id: 20, name: "Jane" },
            });
        });

        it("should return empty object for non-accessible data", () => {
            expect(Obj.keyBy(null, "id")).toEqual({});
            expect(Obj.keyBy(undefined, "id")).toEqual({});
            expect(Obj.keyBy([], "id")).toEqual({});
        });

        it("should key items with a null key value under an empty string key", () => {
            const obj = {
                first: { rating: 1, name: "1" },
                second: { rating: 2, name: null },
            };

            expect(Obj.keyBy(obj, "name")).toEqual({
                1: { rating: 1, name: "1" },
                "": { rating: 2, name: null },
            });

            // Callback returning null behaves the same way
            expect(Obj.keyBy(obj, (item) => item["name"])).toEqual({
                1: { rating: 1, name: "1" },
                "": { rating: 2, name: null },
            });
        });

        it("should key items with a missing key under an empty string key", () => {
            const obj = {
                first: { rating: 1, name: "1" },
                second: { rating: 2 },
            };

            expect(Obj.keyBy(obj, "name")).toEqual({
                1: { rating: 1, name: "1" },
                "": { rating: 2 },
            });
        });

        it("passes keyBy's callback the item's key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "keyBy callback receives the key"
            expect(Obj.keyBy({ x: { id: 1 } }, (_item, key) => key)).toEqual({
                x: { id: 1 },
            });
        });

        it("casts a bool, null or float key the way PHP stores an array offset", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "keyBy-scalar-key-cast"
            const rows = { a: { k: true }, b: { k: false }, c: { k: null } };
            expect(Obj.keyBy(rows, "k")).toEqual({
                1: { k: true },
                0: { k: false },
                "": { k: null },
            });

            const keyOf = (key: number) =>
                Object.keys(Obj.keyBy({ a: { v: 1 } }, () => key));
            expect(keyOf(1.5)).toEqual(["1"]);
            expect(keyOf(-1.5)).toEqual(["-1"]);
            expect(keyOf(-0)).toEqual(["0"]);
            expect(keyOf(Infinity)).toEqual(["0"]);
            expect(keyOf(NaN)).toEqual(["0"]);
            expect(keyOf(1e20)).toEqual(["7766279631452241920"]);
        });

        it("keys an item under a symbol the callback returns", () => {
            // JS-only: PHP has no symbols; a symbol key is kept as it is, as arr.keyBy keeps it.
            const sym = Symbol("test");
            expect(Obj.keyBy({ a: { v: 1 } }, () => sym)[sym]).toEqual({
                v: 1,
            });
        });
    });

    describe("prependKeysWith", () => {
        it("should prepend all keys with prefix", () => {
            const obj = { name: "John", age: 30 };
            expect(Obj.prependKeysWith(obj, "user_")).toEqual({
                user_name: "John",
                user_age: 30,
            });
        });

        it("should handle empty objects", () => {
            expect(Obj.prependKeysWith({}, "prefix_")).toEqual({});
        });

        it("should return empty object for non-accessible data", () => {
            expect(Obj.prependKeysWith(null, "prefix_")).toEqual({});
            expect(Obj.prependKeysWith(undefined, "prefix_")).toEqual({});
            expect(Obj.prependKeysWith([], "prefix_")).toEqual({});
        });

        it("prefixes only top-level keys and leaves nested values alone", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prependKeysWith-literal"
            expect(
                Obj.prependKeysWith(
                    {
                        id: "123",
                        data: "456",
                        list: [1, 2, 3],
                        meta: { key: 1 },
                    },
                    "test.",
                ),
            ).toEqual({
                "test.id": "123",
                "test.data": "456",
                "test.list": [1, 2, 3],
                "test.meta": { key: 1 },
            });
        });
    });

    describe("only", () => {
        it("should return only specified keys", () => {
            const obj = { name: "John", age: 30, city: "NYC" };
            expect(Obj.only(obj, ["name", "age"])).toEqual({
                name: "John",
                age: 30,
            });
        });

        it("should handle non-existent keys", () => {
            const obj = { name: "John" };
            expect(Obj.only(obj, ["name", "age"])).toEqual({ name: "John" });
        });

        it("should return empty object for non-accessible data", () => {
            expect(Obj.only(null, ["name"])).toEqual({});
            expect(Obj.only(undefined, ["name"])).toEqual({});
            expect(Obj.only([], ["name"])).toEqual({});
        });

        it("accepts a bare string key and a null key, like PHP's (array) cast", () => {
            // Arr.php:744 casts via (array) $keys: null -> [], a bare string -> [key].
            // obj used to iterate a bare string's characters and throw on null.
            expect(Obj.only({ foo: 1, bar: "baz" }, "bar")).toEqual({
                bar: "baz",
            });
            expect(Obj.only({ a: 1 }, null)).toEqual({});
        });

        it("returns an empty object when none of the keys exist", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "only-none-exist"
            expect(
                Obj.only({ name: "Desk", price: 100 }, ["nonExistingKey"]),
            ).toEqual({});
        });

        it("selects from a mixed integer/string-keyed object", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "only-mixed-int-as-string", "only-mixed-string"
            const data = { 0: "foo", bar: "baz" };

            expect(Obj.only(data, "0")).toEqual({ 0: "foo" });
            expect(Obj.only(data, "bar")).toEqual({ bar: "baz" });
        });
    });

    describe("select", () => {
        it("should select specific keys from nested objects", () => {
            const obj = {
                user1: { name: "John", age: 30, city: "NYC" },
                user2: { name: "Jane", age: 25, city: "LA" },
            };
            expect(Obj.select(obj, ["name", "city"])).toEqual({
                user1: { name: "John", city: "NYC" },
                user2: { name: "Jane", city: "LA" },
            });
        });

        it("should handle missing keys gracefully", () => {
            const obj = {
                user1: { name: "John" },
                user2: { name: "Jane", email: "jane@example.com" },
            };
            expect(Obj.select(obj, ["name", "email"])).toEqual({
                user1: { name: "John" },
                user2: { name: "Jane", email: "jane@example.com" },
            });
        });

        it("should return empty object for non-accessible data", () => {
            expect(Obj.select(null, ["name"])).toEqual({});
            expect(Obj.select(undefined, ["name"])).toEqual({});
            expect(Obj.select([], ["name"])).toEqual({});
        });

        it("should handle items that are not objects", () => {
            const obj = {
                user1: "John",
                user2: { name: "Jane" },
            };
            expect(Obj.select(obj, ["name"])).toEqual({
                user1: {},
                user2: { name: "Jane" },
            });
        });

        it("should handle single key as string (non-array)", () => {
            const obj = {
                user1: { name: "John", age: 30 },
                user2: { name: "Jane", age: 25 },
            };
            expect(Obj.select(obj, "name")).toEqual({
                user1: { name: "John" },
                user2: { name: "Jane" },
            });
        });

        it("yields empty rows for a missing or null key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "select-missing", "select-null"
            const data = {
                a: { name: "Taylor", role: "Developer", age: 1 },
                b: { name: "Abigail", role: "Infrastructure", age: 2 },
            };

            expect(Obj.select(data, "nonExistingKey")).toEqual({
                a: {},
                b: {},
            });
            expect(Obj.select(data, null)).toEqual({ a: {}, b: {} });
        });
    });

    describe("mapWithKeys", () => {
        it("should map with new keys", () => {
            const obj = { user1: "John", user2: "Jane" };
            const result = Obj.mapWithKeys(obj, (value, key) => ({
                [`name_${String(key)}`]: value.toUpperCase(),
            }));
            expect(result).toEqual({ name_user1: "JOHN", name_user2: "JANE" });
        });

        it("should handle object values", () => {
            const obj = {
                john: { name: "John", age: 30 },
                jane: { name: "Jane", age: 25 },
            };
            const result = Obj.mapWithKeys(obj, (value) => ({
                [value.name]: value.age,
            }));
            expect(result).toEqual({ John: 30, Jane: 25 });
        });

        it("files a list return under its own indexes, letting the last row win", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "d6-map-with-keys-list-return"
            expect(
                Obj.mapWithKeys({ a: 1, b: 2 }, (value, key) => [
                    `key_${String(key)}`,
                    value * 2,
                ]),
            ).toEqual({ 0: "key_b", 1: 4 });
            expect(
                Obj.mapWithKeys({ a: 1 }, (value, key) => [
                    `key_${String(key)}`,
                    value * 2,
                ]),
            ).toEqual({ 0: "key_a", 1: 2 });
            // Same row, "arr-pair-return": a single-pair record is the idiomatic return.
            expect(
                Obj.mapWithKeys({ a: 1, b: 2 }, (value, key) => ({
                    [key]: value * 2,
                })),
            ).toEqual({ a: 2, b: 4 });
        });

        it("should handle non-objects", () => {
            expect(Obj.mapWithKeys(null, () => ({}))).toEqual({});
            expect(Obj.mapWithKeys([], () => ({}))).toEqual({});
            expect(Obj.mapWithKeys("string", () => ({}))).toEqual({});
        });

        it("returns a plain object even for numeric-like mapped keys", () => {
            // Arr::mapWithKeys (Arr.php:880) builds one plain array; there is no Map in
            // PHP, so obj must not special-case numeric-like keys by returning a Map
            // either.
            const obj = { a: "x", b: "y" };
            const result = Obj.mapWithKeys(obj, (value, key) => ({
                [key === "a" ? "1" : "2"]: value,
            }));
            expect(result instanceof Map).toBe(false);
            expect(result).toEqual({ 1: "x", 2: "y" });
        });
    });

    describe("prepend", () => {
        it("should prepend values to object", () => {
            const obj = { b: 2, c: 3 };
            expect(Obj.prepend(obj, 1, "a")).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("should prepend with numeric key", () => {
            const obj = { a: 1, b: 2 };
            expect(Obj.prepend(obj, 0, "0")).toEqual({ "0": 0, a: 1, b: 2 });
        });

        it("should handle non-objects", () => {
            expect(Obj.prepend(null, 1, "a")).toEqual({ a: 1 });
            expect(Obj.prepend([], 1, "a")).toEqual({ a: 1 });
            expect(Obj.prepend("string", 1, "a")).toEqual({ a: 1 });
        });

        it("puts the prepended key first, including an empty-string key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-zero-key-order", "prepend-empty-key"
            const zero = Obj.prepend({ one: 1, two: 2 }, 0, "zero");
            const empty = Obj.prepend({ one: 1, two: 2 }, 0, "");

            expect(Object.keys(zero)).toEqual(["zero", "one", "two"]);
            expect(empty).toEqual({ "": 0, one: 1, two: 2 });
            expect(Object.keys(empty)).toEqual(["", "one", "two"]);
        });

        it("prepends a keyed value onto an integer-keyed object", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "prepend-list-null-empty-key", "prepend-list-array-key", "prepend-list-array-empty-key"
            expect(Obj.prepend({ 0: "one", 1: "two" }, null, "")).toEqual({
                "": null,
                0: "one",
                1: "two",
            });
            expect(
                Obj.prepend({ 0: "one", 1: "two" }, ["zero"], "key"),
            ).toEqual({ key: ["zero"], 0: "one", 1: "two" });
            expect(Obj.prepend({ 0: "one", 1: "two" }, ["zero"], "")).toEqual({
                "": ["zero"],
                0: "one",
                1: "two",
            });
        });

        it("files a null key under the empty string", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-null-key"
            const result = Obj.prepend({ one: 1, two: 2 }, 0, null);

            expect(result).toEqual({ "": 0, one: 1, two: 2 });
            expect(Object.keys(result)).toEqual(["", "one", "two"]);
        });

        it("keeps the prepended value when the key already exists", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "prepend-existing-key-assoc", "prepend-existing-key-assoc-keys", "prepend-existing-empty-key"
            const moved = Obj.prepend({ a: 1, b: 2 }, 9, "b");

            expect(moved).toEqual({ b: 9, a: 1 });
            expect(Object.keys(moved)).toEqual(["b", "a"]);
            expect(
                Obj.prepend({ 0: "one", 1: "two", "": "three" }, ["zero"], ""),
            ).toEqual({ "": ["zero"], 0: "one", 1: "two" });
        });

        it("unshifts under key 0 when no key is given", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-assoc-no-key", "prepend-mixed-no-key"
            expect(Obj.prepend({ one: 1, two: 2 }, 0)).toEqual({
                0: 0,
                one: 1,
                two: 2,
            });
            expect(Obj.prepend({ 5: "five", one: 1 }, 0)).toEqual({
                0: 0,
                1: "five",
                one: 1,
            });
        });

        it("renumbers a negative integer key when no key is given", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-negative-int-key-no-key"
            expect(Obj.prepend({ "-1": "a", x: "b" }, "z")).toEqual({
                0: "z",
                1: "a",
                x: "b",
            });
        });

        it("treats non-object data as empty when no key is given", () => {
            // JS-only: Arr::prepend(null, …) is a TypeError in PHP; the no-key form starts from an empty object.
            expect(Obj.prepend(null, 1)).toEqual({ 0: 1 });
            expect(Obj.prepend("ab", 1)).toEqual({ 0: 1 });
        });

        it("casts its key the way PHP casts an array key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-key-cast"
            expect(Obj.prepend({ a: 1, 1: "x" }, "v", 1.5)).toEqual({
                1: "v",
                a: 1,
            });
            expect(Obj.prepend({ a: 1 }, "v", -2.7)).toEqual({
                "-2": "v",
                a: 1,
            });
            expect(Obj.prepend({ a: 1 }, "v", true as never)).toEqual({
                1: "v",
                a: 1,
            });
            expect(Obj.prepend({ a: 1, 0: "x" }, "v", false as never)).toEqual({
                0: "v",
                a: 1,
            });
        });

        it("keeps a symbol key as a symbol, as keyBy does", () => {
            // JS-only: PHP has no symbol keys; String() used to store this one under "Symbol(k)".
            const key = Symbol("k");
            const result = Obj.prepend({ a: 1 }, "v", key);

            expect(Object.getOwnPropertySymbols(result)).toEqual([key]);
            expect(Object.keys(result)).toEqual(["a"]);
        });
    });

    describe("pull", () => {
        it("should pull and return value with remaining data", () => {
            const obj = { name: "John", age: 30 };
            const result = Obj.pull(obj, "name");
            expect(result.value).toBe("John");
            expect(result.data).toEqual({ age: 30 });
        });

        it("should return default for missing keys", () => {
            const obj = { name: "John" };
            const result = Obj.pull(obj, "age", 25);
            expect(result.value).toBe(25);
            expect(result.data).toEqual({ name: "John" });
        });

        it("should handle dot notation", () => {
            const obj = { user: { name: "John", age: 30 } };
            const result = Obj.pull(obj, "user.name");
            expect(result.value).toBe("John");
            expect(result.data).toEqual({ user: { age: 30 } });
        });

        it("should handle non-object values", () => {
            const result = Obj.pull(null, "key", "default");
            expect(result.value).toBe("default");
            expect(result.data).toEqual({});
        });

        it("should handle when the key is null", () => {
            const obj = { name: "John", age: 30 };
            const result = Obj.pull(obj, null);
            expect(result.value).toBeNull();
            expect(result.data).toEqual({ name: "John", age: 30 });
        });

        it("should handle the key is null and the defaultValue is a closure", () => {
            const obj = { name: "John", age: 30 };
            const result = Obj.pull(obj, null, () => "default");
            expect(result.value).toBe("default");
            expect(result.data).toEqual({ name: "John", age: 30 });
        });

        it("pulls a first-level key that contains dots", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::pull
            // — first-level key containing dots".
            const result = Obj.pull(
                { "joe@example.com": "Joe", "jane@localhost": "Jane" },
                "joe@example.com",
            );
            expect(result.value).toBe("Joe");
            expect(result.data).toEqual({ "jane@localhost": "Jane" });
        });

        it("cannot reach a nested key that itself contains dots", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "pull-nested-dotted-key"
            const result = Obj.pull(
                {
                    emails: {
                        "joe@example.com": "Joe",
                        "jane@localhost": "Jane",
                    },
                },
                "emails.joe@example.com",
            );

            expect(result.value).toBeNull();
            expect(result.data).toEqual({
                emails: { "joe@example.com": "Joe", "jane@localhost": "Jane" },
            });
        });
    });

    describe("query", () => {
        it("should build query string from object", () => {
            const obj = { name: "John", age: "30", active: "true" };
            expect(Obj.query(obj)).toBe("name=John&age=30&active=true");
        });

        it("should handle nested objects", () => {
            const obj = { user: { name: "John", age: 30 } };
            expect(Obj.query(obj)).toBe("user[name]=John&user[age]=30");
        });

        it("should handle arrays with various types", () => {
            const obj = {
                tags: ["js", "ts", null, undefined, { home: "page" }],
            };
            expect(Obj.query(obj)).toBe(
                "tags[0]=js&tags[1]=ts&tags[4][home]=page",
            );
        });

        it("should handle when query is null or undefined", () => {
            expect(Obj.query(null)).toBe("");
            expect(Obj.query(undefined)).toBe("");
        });

        it("should handle passing in scalar values", () => {
            expect(Obj.query(42)).toBe("0=42");
            expect(Obj.query("house")).toBe("0=house");
        });

        it("should handle deeply nested objects with scalar values", () => {
            const obj = {
                level1: {
                    level2: {
                        value: "deep",
                    },
                },
            };
            expect(Obj.query(obj)).toBe("level1[level2][value]=deep");
        });

        it("should handle object values with null and undefined mixed", () => {
            const obj = {
                valid: "yes",
                empty: null,
                missing: undefined,
                another: "value",
            };
            expect(Obj.query(obj)).toBe("valid=yes&another=value");
        });

        it("should handle nested array containing nested arrays", () => {
            const obj = {
                matrix: [
                    [1, 2],
                    [3, 4],
                ],
            };
            expect(Obj.query(obj)).toBe(
                "matrix[0][0]=1&matrix[0][1]=2&matrix[1][0]=3&matrix[1][1]=4",
            );
        });

        it("should handle root-level array", () => {
            // Root array without prefix
            expect(Obj.query(["a", "b", "c"])).toBe("0=a&1=b&2=c");
        });

        it("casts booleans like PHP's http_build_query", () => {
            // Captured via docs/php-parity/task-08-arr-parity.json: Arr::query casts
            // true -> "1" and false -> "0" (http_build_query scalar casting), not JS's
            // "true"/"false" string coercion.
            expect(Obj.query({ foo: "bar", bar: true })).toBe("foo=bar&bar=1");
            expect(Obj.query({ foo: "bar", bar: false })).toBe("foo=bar&bar=0");
            expect(Obj.query({ foo: "bar", bar: "" })).toBe("foo=bar&bar=");
            expect(Obj.query({})).toBe("");
        });
    });

    describe("random", () => {
        it("should return single random value", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.random(obj);
            expect([1, 2, 3]).toContain(result);
        });

        it("throws when more items are requested than exist, even against an empty object", () => {
            // Arr.php:977 checks `$requested > $count` ABOVE the empty guard, so an
            // empty object throws rather than returning null; a request of 0 or fewer
            // still short-circuits to {}.
            const obj = {};
            expect(() => Obj.random(obj)).toThrow(
                "You requested 1 items, but there are only 0 items available.",
            );
            expect(() => Obj.random(obj, 1)).toThrow(
                "You requested 1 items, but there are only 0 items available.",
            );
            expect(Obj.random(obj, 0)).toEqual({});
        });

        it("should return multiple random values", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.random(obj, 2);
            expect(Object.keys(result)).toHaveLength(2);
        });

        it("reindexes from zero by default", () => {
            // Arr.php:971 defaults $preserveKeys = false.
            const result = Obj.random(
                { one: "foo", two: "bar", three: "baz" },
                2,
            );
            expect(Object.keys(result)).toEqual(["0", "1"]);
        });

        it("preserves original keys when preserveKeys is explicitly true", () => {
            const obj = { one: "foo", two: "bar", three: "baz" };
            const result = Obj.random(obj, 2, true);
            expect(Object.keys(result)).toHaveLength(2);
            for (const key of Object.keys(result)) {
                expect(obj).toHaveProperty(key);
            }
        });

        it("should return multiple random values while not preserving keys", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.random(obj, 2, false);
            expect(Object.keys(result)).toHaveLength(2);
        });

        it("should throw error if requesting too many items", () => {
            const obj = { a: 1, b: 2 };
            expect(() => Obj.random(obj, 5)).toThrow(
                "You requested 5 items, but there are only 2 items available.",
            );
        });

        it("should handle non-object values", () => {
            expect(Obj.random(null)).toBeNull();
            expect(Obj.random(undefined)).toBeNull();
        });

        it("should return empty object when non-object passed with number parameter", () => {
            expect(Obj.random(null, 2)).toEqual({});
            expect(Obj.random(undefined, 3)).toEqual({});
        });

        it("returns a single value when number is null", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.random(obj, null);
            expect([1, 2, 3]).toContain(result);
        });

        it("pairs each preserved key with its original value", () => {
            // ArrTest::testRandom (array_intersect_assoc)
            const source = { one: "foo", two: "bar", three: "baz" };
            const result = Obj.random(source, 2, true);

            expect(Object.keys(result)).toHaveLength(2);
            for (const [key, value] of Object.entries(result)) {
                expect(source[key as keyof typeof source]).toBe(value);
            }
        });

        it("throws when requesting two items from an empty object", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "random-empty-2"
            expect(() => Obj.random({}, 2)).toThrow(
                "You requested 2 items, but there are only 0 items available.",
            );
        });

        it("returns null for a Map or Set without a count, matching the NonObjectItems row", () => {
            // JS-only: Map/Set pass accessible() but have no own enumerable entries.
            expect(Obj.random(new Map([["a", 1]]))).toBeNull();
            expect(Obj.random(new Set([1, 2, 3]))).toBeNull();
        });

        it("returns an empty object for a Map or Set when a count is given", () => {
            // JS-only: same NonObjectItems row as lists/functions, not a throw.
            expect(Obj.random(new Map([["a", 1]]), 2)).toEqual({});
            expect(Obj.random(new Set([1, 2, 3]), 2)).toEqual({});
        });
    });

    describe("shift", () => {
        it("leaves a prototype object untouched instead of clearing it", () => {
            // JS-only: a PHP array has no prototype; defineKey won't write into one, so the survivors would be lost.
            class Holder {}
            Object.defineProperty(Holder.prototype, "kept", {
                value: "str",
                enumerable: true,
                configurable: true,
                writable: true,
            });

            expect(Obj.shift(Holder.prototype)).toBeNull();
            expect(Obj.shift(Holder.prototype, 2)).toBeNull();
            expect(Object.entries(Holder.prototype)).toEqual([["kept", "str"]]);
        });

        it("renumbers a negative integer key among the survivors", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "shift-negative-int-keys"
            const one = { x: "a", "-1": "b", y: "c" };
            const two = { x: "a", "-1": "b", "-2": "c", y: "d" };

            expect(Obj.shift(one)).toBe("a");
            expect(one).toEqual({ 0: "b", y: "c" });
            expect(Obj.shift(two, 2)).toEqual(["a", "b"]);
            expect(two).toEqual({ 0: "c", y: "d" });
        });

        it("returns null for non-object data, whatever the count", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D6 shift/pop on collect(null)"
            expect(Obj.shift(null, 2)).toBeNull();
            expect(Obj.shift([], 2)).toBeNull();
            expect(Obj.shift(null)).toBeNull();
        });

        it("should remove and return first item", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.shift(obj);
            expect(result).toBe(1);
            expect(obj).toEqual({ b: 2, c: 3 });
        });

        it("should remove and return first n items", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.shift(obj, 2);
            expect(result).toEqual([1, 2]);
            expect(obj).toEqual({ c: 3, d: 4 });
        });

        it("should remove and return all items if n exceeds length", () => {
            const obj = { a: 1, b: 2 };
            const result = Obj.shift(obj, 5);
            expect(result).toEqual([1, 2]);
            expect(obj).toEqual({});
        });

        it("should handle empty object", () => {
            const obj = {};
            const result = Obj.shift(obj);
            expect(result).toBeNull();
            expect(obj).toEqual({});

            // Collection::shift($count) returns null once isEmpty is true, for any
            // count — not an empty array. Matches the captured Collection::shift(3)
            // ground truth on an empty source.
            const resultMultiple = Obj.shift(obj, 3);
            expect(resultMultiple).toBeNull();
            expect(obj).toEqual({});
        });

        it("throws when the shift count is negative", () => {
            expect(() => Obj.shift({ a: 1 }, -1)).toThrow(
                "Number of shifted items may not be less than zero.",
            );
        });

        it("returns null when shifting an empty object, for any count", () => {
            expect(Obj.shift({}, 3)).toBeNull();
            expect(Obj.shift({})).toBeNull();
        });

        it("returns an empty array when the requested count is zero", () => {
            const data = { 0: "a", 1: "b" };

            expect(Obj.shift(data, 0)).toEqual([]);
            // A no-op count must not renumber anything either.
            expect(Object.entries(data)).toEqual([
                ["0", "a"],
                ["1", "b"],
            ]);
        });

        it("renumbers the survivors' integer keys, like array_shift", () => {
            // array_shift([10,20,30,40]) leaves [20,30,40], not
            // {1:20,2:30,3:40} — the gap at 0 is not a PHP array shape.
            const data: Record<string, number> = { 0: 10, 1: 20, 2: 30, 3: 40 };

            expect(Obj.shift(data)).toBe(10);
            expect(Object.entries(data)).toEqual([
                ["0", 20],
                ["1", 30],
                ["2", 40],
            ]);
        });

        it("renumbers integer keys but leaves string keys alone", () => {
            // array_shift([0=>'a','x'=>1,1=>'b']) -> {x:1,0:'b'}.
            const data: Record<string, unknown> = { 0: "a", x: 1, 1: "b" };

            expect(Obj.shift(data)).toBe("a");
            expect(data).toEqual({ 0: "b", x: 1 });
        });

        it("renumbers after a multi-item shift too", () => {
            const data: Record<string, number> = { 0: 10, 1: 20, 2: 30, 3: 40 };

            expect(Obj.shift(data, 2)).toEqual([10, 20]);
            expect(Object.entries(data)).toEqual([
                ["0", 30],
                ["1", 40],
            ]);
        });
    });

    describe("push", () => {
        it("pushes several values onto a top-level list", () => {
            const obj = { items: ["a", "b"] };
            const result = Obj.push(obj, "items", "c", "d");
            expect(result).toEqual({ items: ["a", "b", "c", "d"] });
        });

        it("should create new array if path doesn't exist", () => {
            const obj = {};
            const result = Obj.push(obj, "items", "a", "b");
            expect(result).toEqual({ items: ["a", "b"] });
        });

        it("leaves the caller's nested value alone for an integer key", () => {
            // JS-only: the arr sibling of this case (task-24-data-release-readiness.json,
            // "push-integer-key-mutates-the-caller-by-reference" is what PHP does instead);
            // obj already answered this way, so it pins the agreement.
            const inner = ["x"];
            const result = Obj.push({ 0: inner }, 0, "y");

            expect(result).toEqual({ 0: ["x", "y"] });
            expect(inner).toEqual(["x"]);
            expect(result[0]).not.toBe(inner);
        });

        it("throws PHP's message when the key holds a non-array", () => {
            // PHP-verified in docs/php-parity/task-12-regression-pins.json
            // ("push requires an array at the key").
            expect(() => Obj.push({ 0: 1, 1: 2, 2: 3 }, "0", 9)).toThrow(
                "Array value for key [0] must be an array, integer found.",
            );
        });

        it("creates the array at a missing key but rejects an explicit null", () => {
            // PHP-verified in docs/php-parity/task-12-regression-pins.json
            // ("push at a missing key creates the array" / "push through an explicit null").
            expect(Obj.push({}, "name", 9)).toEqual({ name: [9] });
            expect(() => Obj.push({ name: null }, "name", 9)).toThrow(
                "Array value for key [name] must be an array, NULL found.",
            );
        });

        it("makes the same null-vs-missing distinction through a dotted path", () => {
            // Same hasOwn distinction, one path segment deeper. PHP-verified in
            // docs/php-parity/task-12-regression-pins.json ("push through an explicit null
            // at a dotted path" / "push at a missing dotted path creates the array").
            expect(Obj.push({ a: {} }, "a.b", 9)).toEqual({ a: { b: [9] } });
            expect(() => Obj.push({ a: { b: null } }, "a.b", 9)).toThrow(
                "Array value for key [a.b] must be an array, NULL found.",
            );
        });

        it("should handle non-object values", () => {
            const result = Obj.push(null, "items", "a");
            expect(result).toEqual({ items: ["a"] });

            const result2 = Obj.push("string", "items", "a");
            expect(result2).toEqual({ items: ["a"] });

            expect(() => Obj.push(null, null, "value")).toThrow(
                "Cannot push to root of non-object data when key is null or undefined",
            );
        });

        it("appends with the next integer key when the key is null", () => {
            // docs/php-parity/task-17-second-review.json, "Arr::push with a null key appends"
            expect(Obj.push({ a: 1 }, null, 9)).toEqual({ a: 1, 0: 9 });
        });

        it("appends under the next integer key for an undefined key, like null", () => {
            // JS-only: undefined has no PHP analogue; push treats it like null.
            expect(Obj.push({ a: "x" }, undefined, 1)).toEqual({
                a: "x",
                0: 1,
            });
        });

        it("agrees with the array backing on a null key", () => {
            // Integer-like keys always enumerate first, so compare values as sets.
            const objValues = Object.values(Obj.push({ a: 1, b: 2 }, null, 9));
            const arrValues = Arr.push([1, 2], null, 9);

            expect([...objValues].sort((a, b) => a - b)).toEqual(
                [...arrValues].sort((a, b) => a - b),
            );
        });

        it("finds the true max key above the array-index range, not the last enumerated one", () => {
            // Above 2**32-2, Object.keys keeps insertion order instead of sorting ascending,
            // so the smaller key here is enumerated second - the naive "last one wins" reading
            // of key order would pick 5000000000 and collide with an existing 5000000001.
            const obj = { "6000000000": "a", "5000000000": "b" };

            expect(Obj.push(obj, null, "NEW")).toEqual({
                "6000000000": "a",
                "5000000000": "b",
                "6000000001": "NEW",
            });
        });

        it("creates a dotted path from an empty object, then appends several values", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "push-dotted-chain"
            const first = Obj.push({}, "office.furniture", "Desk");

            expect(first).toEqual({ office: { furniture: ["Desk"] } });
            expect(
                Obj.push(first, "office.furniture", "Chair", "Lamp"),
            ).toEqual({
                office: { furniture: ["Desk", "Chair", "Lamp"] },
            });
        });

        it("throws PHP's message for a boolean at a dotted key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "push-boolean-at-dotted"
            expect(() =>
                Obj.push({ foo: { bar: false } }, "foo.bar", "baz"),
            ).toThrow(
                "Array value for key [foo.bar] must be an array, boolean found.",
            );
        });
    });

    describe("shuffle", () => {
        it("returns the values under keys 0..n-1, like Arr::shuffle", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "shuffle-assoc-keys", "shuffle-assoc-values-sorted"
            const result = Obj.shuffle({ a: 1, b: 2, c: 3 });

            expect(Object.keys(result)).toEqual(["0", "1", "2"]);
            expect(Object.values(result).sort()).toEqual([1, 2, 3]);
        });

        it("actually reorders the values", () => {
            // JS-only: pins this repo's Fisher-Yates output for a mocked Math.random; PHP's shuffle isn't comparable.
            const random = vi.spyOn(Math, "random").mockReturnValue(0);

            expect(Obj.shuffle({ a: 1, b: 2, c: 3 })).toEqual({
                0: 2,
                1: 3,
                2: 1,
            });
            random.mockRestore();
        });

        it("should handle empty objects", () => {
            expect(Obj.shuffle({})).toEqual({});
        });

        it("should handle non-object values", () => {
            expect(Obj.shuffle(null)).toEqual({});
            expect(Obj.shuffle([])).toEqual({});
        });
    });

    describe("slice", () => {
        it("should handle non-object data", () => {
            expect(Obj.slice(null, 0, 2)).toEqual({});
            expect(Obj.slice([], 0, 2)).toEqual({});
        });

        it("should slice object from offset with length", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
            expect(Obj.slice(obj, 1, 3)).toEqual({ b: 2, c: 3, d: 4 });
        });

        it("should slice object with negative offset", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
            expect(Obj.slice(obj, -2)).toEqual({ d: 4, e: 5 });
        });

        it("should slice object with negative length", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
            expect(Obj.slice(obj, 3, -2)).toEqual({});
            expect(Obj.slice(obj, 0, -2)).toEqual({ a: 1, b: 2, c: 3 });
            expect(Obj.slice(obj, 1, -1)).toEqual({ b: 2, c: 3, d: 4 });
        });

        // array_slice($a, -2, 5, true) and array_slice($a, -2, 2, true) both leave the
        // last two entries; a length beyond the remaining tail is not an empty result.
        // PHP-verified in docs/php-parity/task-04-shared.json.
        it("slices from the end for a negative offset with a length", () => {
            const data = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };
            expect(Obj.slice(data, -2, 5)).toEqual({ g: 7, h: 8 });
            expect(Obj.slice(data, -2, 2)).toEqual({ g: 7, h: 8 });
        });

        it("returns an empty object for a zero length", () => {
            // PHP-verified: array_slice(['a'=>1,'b'=>2,'c'=>3], 1, 0, true) -> []
            expect(Obj.slice({ a: 1, b: 2, c: 3 }, 1, 0)).toEqual({});
        });

        // No test exercised an offset more negative than the container, so dropping the
        // `Math.max(len + offset, 0)` clamp would have silently regressed to `{}`
        // without failing anything.
        it("clamps an offset more negative than the container to the start", () => {
            expect(Obj.slice({ a: 1, b: 2, c: 3 }, -10, 2)).toEqual({
                a: 1,
                b: 2,
            });
        });

        it("returns an empty object for an offset larger than the container", () => {
            expect(Obj.slice({ a: 1, b: 2, c: 3 }, 10, 2)).toEqual({});
        });

        it("returns empty when a negative length exceeds the remaining tail", () => {
            // PHP-verified in docs/php-parity/task-12-regression-pins.json.
            expect(Obj.slice({ a: 1, b: 2, c: 3 }, 0, -5)).toEqual({});
            expect(Obj.slice({ a: 1, b: 2, c: 3 }, -5, -5)).toEqual({});
            expect(Obj.slice({ a: 1, b: 2, c: 3, d: 4, e: 5 }, 0, -6)).toEqual(
                {},
            );
        });

        // JSON.parse produces a real own enumerable "__proto__" key (a literal `{
        // __proto__:... }` would set the prototype instead and never reach this code
        // path) — see obj.spec.ts's splice tests for the same pattern.
        it("does not reparent the result via a __proto__ entry", () => {
            const src = JSON.parse(
                '{"a":1,"__proto__":{"polluted":true},"c":3}',
            ) as Record<string, unknown>;
            const result = Obj.slice(src, 0, 3);
            expect((result as { polluted?: boolean }).polluted).toBeUndefined();
            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        });

        it("slices from a positive offset to the end, and between two negative bounds", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "L1 slice(3) assoc", "L6 slice(-6,-2) assoc"
            const data = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };

            expect(Obj.slice(data, 3)).toEqual({
                d: 4,
                e: 5,
                f: 6,
                g: 7,
                h: 8,
            });
            expect(Obj.slice(data, -6, -2)).toEqual({ c: 3, d: 4, e: 5, f: 6 });
        });
    });

    describe("sole", () => {
        it("should return single item", () => {
            const obj = { only: 42 };
            expect(Obj.sole(obj)).toBe(42);
        });

        it("should throw error for empty objects", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "sole-empty-no-callback"
            expect(() => Obj.sole({})).toThrow(ItemNotFoundException);
        });

        it("should throw error for multiple items", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "sole-multi-no-callback"
            const obj = { a: 1, b: 2 };
            expect(() => Obj.sole(obj)).toThrow(MultipleItemsFoundException);
            expect(() => Obj.sole(obj)).toThrow("2 items were found.");
        });

        it("should work with callback", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.sole(obj, (value) => value > 2)).toBe(3);

            expect(() => Obj.sole(obj, (value) => value > 3)).toThrow(
                ItemNotFoundException,
            );
        });

        it("should handle non-objects", () => {
            expect(() => Obj.sole(null)).toThrow(ItemNotFoundException);
            expect(() => Obj.sole([])).toThrow(ItemNotFoundException);
        });

        it("throws when the callback matches more than one item", () => {
            // ArrTest::testSoleThrowsExceptionIfMoreThanOneItemExists;
            // docs/php-parity/task-23-obj-release-readiness.json, "sole-assoc-multi-callback"
            expect(() =>
                Obj.sole(
                    { a: "baz", b: "foo", c: "baz" },
                    (value) => value === "baz",
                ),
            ).toThrow("2 items were found.");
        });
    });

    describe("sort", () => {
        describe("sort.objects", () => {
            it("should sort by values", () => {
                const obj = { c: 3, a: 1, b: 2 };
                const result = Obj.sort(obj);
                expect(Object.values(result)).toEqual([1, 2, 3]);
                // Keys should be in order of their values
                expect(Object.keys(result)).toEqual(["a", "b", "c"]);
            });

            // task-19-spaceship.json, "asort over a keyed mix of numeric
            // strings and an int" and "arsort over a keyed mix of numeric
            // strings and an int" - probed over this literal, not a list.
            it("orders numeric strings numerically, not lexically", () => {
                const obj = { a: "9", b: "10", c: "1", d: 5 };

                expect(Object.values(Obj.sort(obj))).toEqual([
                    "1",
                    5,
                    "9",
                    "10",
                ]);
                expect(Object.values(Obj.sortDesc(obj))).toEqual([
                    "10",
                    "9",
                    5,
                    "1",
                ]);
            });

            it("should handle when values are falsy", () => {
                // PHP ties 0, null, false and [] and so leaves them in insertion
                // order (task-10-pluck-sort.json, "asort over PHP-falsy mixed
                // values": falsy_keys is ["a","b","d","e"]).
                const obj = { a: 0, b: null, c: undefined, d: false, e: [] };
                expect(Object.values(Obj.sort(obj))).toEqual([
                    0,
                    null,
                    undefined,
                    false,
                    [],
                ]);

                // Arr.sort cannot join this row: Array.prototype.sort hoists an
                // `undefined` element past the comparator, which obj's [key, value]
                // entries never trigger. PHP has no undefined, so it cannot arbitrate.
                const defined = { a: 0, b: null, d: false, e: [] };
                expect(Object.values(Obj.sort(defined))).toEqual(
                    Arr.sort(Object.values(defined)),
                );
            });

            it("orders falsy values by value, not ahead of everything", () => {
                // PHP-verified in docs/php-parity/task-10-pluck-sort.json,
                // "sort orders falsy values by value, not by falsiness":
                // asort(['a'=>-1,'b'=>0,'c'=>5]) -> {"a":-1,"b":0,"c":5}.
                expect(Object.entries(Obj.sort({ a: -1, b: 0, c: 5 }))).toEqual(
                    [
                        ["a", -1],
                        ["b", 0],
                        ["c", 5],
                    ],
                );
            });

            it("agrees with arr.sort on the same values", () => {
                // Same probe row: arr_sort -> [-1,0,5].
                expect(Object.values(Obj.sort({ a: -1, b: 0, c: 5 }))).toEqual(
                    Arr.sort([-1, 0, 5]),
                );
            });

            it("renumbers integer-like keys instead of silently no-opping", () => {
                // Same file, "sort/sortDesc/reverse preserve integer keys and their
                // order": sort_values [1,2,3], sortdesc_values [3,2,1]. JS re-sorts
                // integer keys, so the order survives only if they are renumbered.
                expect(Object.values(Obj.sort({ 0: 3, 1: 1, 2: 2 }))).toEqual([
                    1, 2, 3,
                ]);
                expect(
                    Object.values(Obj.sortDesc({ 0: 3, 1: 1, 2: 2 })),
                ).toEqual([3, 2, 1]);
            });

            it("cannot order a mixed-key object, whatever the policy", () => {
                // Integer-like keys are hoisted ahead of string keys on write
                // (ECMA-262 OrdinaryOwnPropertyKeys), so a mixed object keeps
                // neither PHP's key names nor its order - reverse included.
                const mixed = { x: 5, 0: 9 };
                const hoisted: [string, number][] = [
                    ["0", 9],
                    ["x", 5],
                ];

                expect(Object.entries(Obj.sort(mixed))).toEqual(hoisted);
                expect(Object.entries(Obj.sortDesc(mixed))).toEqual(hoisted);
                expect(Object.entries(Obj.reverse(mixed))).toEqual(hoisted);
            });

            it("leaves negative integer keys alone, as reverse does", () => {
                // Same file, "negative integer keys under the sort/reverse family":
                // asort([-1=>'b',-2=>'a','x'=>'c']) -> {"-2":"a","-1":"b","x":"c"}. JS
                // never re-sorts negative keys, so leaving them alone IS the PHP answer.
                const source = Object.create(null) as Record<string, string>;
                source["-1"] = "b";
                source["-2"] = "a";
                source["x"] = "c";

                expect(Object.entries(Obj.sort(source))).toEqual([
                    ["-2", "a"],
                    ["-1", "b"],
                    ["x", "c"],
                ]);
            });

            it("returns the object unchanged when the callback is neither a string nor a function", () => {
                const source = { a: 3, b: 1, c: 2 };

                // @ts-expect-error Testing edge case with invalid callback type
                expect(Obj.sort(source, 123)).toEqual({ a: 3, b: 1, c: 2 });
                // @ts-expect-error Testing edge case with invalid callback type
                expect(Obj.sort(source, { key: "value" })).toEqual({
                    a: 3,
                    b: 1,
                    c: 2,
                });
            });

            it("should handle a few values are falsy", () => {
                // An empty container coerces to 0 against a number, so it
                // leads; PHP disagrees ([] <=> 1 is 1 in empty_array_vs_one),
                // a compareValues divergence both backings share.
                const obj = { x: 1000, b: 1, c: 2, d: [], y: 1000 };
                const result = Obj.sort(obj);
                expect(Object.values(result)).toEqual([[], 1, 2, 1000, 1000]);
                expect(Object.values(result)).toEqual(
                    Arr.sort(Object.values(obj)),
                );
            });

            it("ties two empty containers, as PHP's array rule does", () => {
                // docs/php-parity/task-25-spaceship-arrays.json, "spaceship on
                // two empty arrays": neither shape holds an entry, so the pair
                // ties and the stable sort leaves it in insertion order.
                expect(Object.values(Obj.sort({ a: {}, d: [] }))).toEqual([
                    {},
                    [],
                ]);
            });
        });

        describe("sort callback is string", () => {
            it("should sort by string key", () => {
                const obj = {
                    user1: { name: "John", age: 30 },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sort(obj, "age");
                expect(Object.keys(result)).toEqual(["user2", "user1"]);
            });

            it("does not re-sort by an empty path after the natural sort", () => {
                // The branches were if/if/if, so a falsy string ran the natural sort and then the field sort over it.
                // The "" key sits second, so the natural walk (which reads "z" first) and the field walk disagree.
                // PHP cannot arbitrate - Collection::sort("") throws TypeError.
                const source = { a: { z: 1, "": 9 }, b: { z: 2, "": 8 } };

                expect(Object.keys(Obj.sort(source, ""))).toEqual(["a", "b"]);
                expect(Object.values(Obj.sort(source, ""))).toEqual(
                    Arr.sort(Object.values(source), ""),
                );
            });

            it("should handle missing keys", () => {
                const obj = {
                    user1: { name: "John" },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sort(obj, "age");
                expect(Object.keys(result)).toEqual(["user1", "user2"]);
            });

            it("should handle when values are falsy", () => {
                // PHP ties null with 0, so both keep their insertion order
                // (task-19-spaceship.json, "asort ties zero and null, keeping
                // insertion order"). The callback form must land in the same place.
                const obj = {
                    user1: { name: "John", age: 0 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                };
                const result = Obj.sort(obj, "age");
                expect(Object.keys(result)).toEqual([
                    "user1",
                    "user2",
                    "user3",
                ]);
                expect(Object.keys(result)).toEqual(
                    Object.keys(Obj.sort(obj, (item) => item.age)),
                );
            });

            it("should handle when some values are falsy", () => {
                const obj = {
                    user0: { name: "John", age: 100 },
                    user1: { name: "John", age: 30 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                    user4: { name: "Doe", age: [] },
                    user5: { name: "Jane", age: undefined },
                    user6: { name: "Jane", age: 100 },
                };
                const result = Obj.sort(obj, "age");
                // PHP ties null with [] (task-19-spaceship.json, "spaceship on
                // null and an empty array"), but ranks [] above every number,
                // which this port does not - see compareValues' docblock.
                expect(Object.keys(result)).toEqual([
                    "user2",
                    "user4",
                    "user5",
                    "user3",
                    "user1",
                    "user0",
                    "user6",
                ]);
                expect(Object.keys(result)).toEqual(
                    Object.keys(Obj.sort(obj, (item) => item.age)),
                );
            });
        });

        describe("sort callback is function", () => {
            it("should sort by callback", () => {
                const obj = {
                    user1: { name: "John", age: 30 },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sort(obj, (item) => item.age);
                expect(Object.keys(result)).toEqual(["user2", "user1"]);
            });

            it("should handle missing keys in callback", () => {
                const obj = {
                    user1: { name: "John" },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sort(obj, (item) =>
                    "age" in item ? item.age : undefined,
                );
                expect(Object.keys(result)).toEqual(["user1", "user2"]);
            });

            it("should handle when values are falsy in callback", () => {
                // task-19-spaceship.json, "asort ties zero and null, keeping
                // insertion order".
                const obj = {
                    user1: { name: "John", age: 0 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                };
                const result = Obj.sort(obj, (item) => item.age);
                expect(Object.keys(result)).toEqual([
                    "user1",
                    "user2",
                    "user3",
                ]);
            });

            it("should handle when some values are falsy in callback", () => {
                const obj = {
                    user0: { name: "John", age: 100 },
                    user1: { name: "John", age: 30 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                    user4: { name: "Doe", age: null },
                    user5: { name: "Jane", age: undefined },
                    user6: { name: "Jane", age: 100 },
                };
                const result = Obj.sort(obj, (item) => item.age);
                // null/undefined values come first (ascending), then numeric values
                expect(Object.keys(result)).toEqual([
                    "user2",
                    "user4",
                    "user5",
                    "user3",
                    "user1",
                    "user0",
                    "user6",
                ]);
            });
        });

        it("should handle non-objects", () => {
            expect(Obj.sort(null)).toEqual({});
            expect(Obj.sort([])).toEqual({});
        });

        describe("multi-key descriptors", () => {
            it("sorts by multiple keys in order", () => {
                const unsorted = {
                    d: { name: "Item", age: 10, meta: { key: 3 } },
                    a: { name: "Item", age: 2, meta: { key: 1 } },
                    c: { name: "Apple", age: 10, meta: { key: 2 } },
                };
                // PHP-verified: docs/php-parity/task-10-pluck-sort.json,
                // "Arr::sort multi-key". Assert on Object.values, not key
                // order - Arr::sort/Obj.sort preserve original keys.
                expect(
                    Object.values(
                        Obj.sort(unsorted, ["name", "age", "meta.key"]),
                    ),
                ).toEqual([
                    { name: "Apple", age: 10, meta: { key: 2 } },
                    { name: "Item", age: 2, meta: { key: 1 } },
                    { name: "Item", age: 10, meta: { key: 3 } },
                ]);
            });

            it("honours per-key direction tuples", () => {
                // Laravel: `true` and 'asc' sort ASCENDING (Collection.php:1638).
                const unsorted = {
                    a: { name: "Item", age: 2 },
                    b: { name: "Item", age: 10 },
                };
                // PHP-verified: docs/php-parity/task-10-pluck-sort.json,
                // "direction tuple [age,false] — descending".
                expect(
                    Object.values(Obj.sort(unsorted, ["name", ["age", false]])),
                ).toEqual([
                    { name: "Item", age: 10 },
                    { name: "Item", age: 2 },
                ]);
            });

            it("honours [key, true] and [key, 'asc'] as ascending", () => {
                const unsorted = {
                    a: { name: "Item", age: 10 },
                    b: { name: "Item", age: 2 },
                };
                // PHP-verified: docs/php-parity/task-10-pluck-sort.json,
                // "direction tuple [age,true] — ascending".
                expect(
                    Object.values(Obj.sort(unsorted, ["name", ["age", true]])),
                ).toEqual([
                    { name: "Item", age: 2 },
                    { name: "Item", age: 10 },
                ]);

                // PHP-verified: docs/php-parity/task-18-sort-comparator.json,
                // "direction tuple [age,"asc"] — string form".
                expect(
                    Object.values(
                        Obj.sort({ a: { age: 10 }, b: { age: 2 } }, [
                            ["age", "asc"],
                        ]),
                    ),
                ).toEqual([{ age: 2 }, { age: 10 }]);
            });

            it("honours [key, SortDirection.Ascending] as ascending", () => {
                // PHP-verified: docs/php-parity/task-18-sort-comparator.json,
                // "direction tuple [age,SortDirection::Ascending]".
                expect(
                    Object.values(
                        Obj.sort({ a: { age: 10 }, b: { age: 2 } }, [
                            ["age", SortDirection.Ascending],
                        ]),
                    ),
                ).toEqual([{ age: 2 }, { age: 10 }]);
            });

            it("honours [key, 'desc'] as descending", () => {
                // PHP-verified: docs/php-parity/task-10-pluck-sort.json,
                // "direction tuple [age,"desc"] — string form".
                expect(
                    Object.values(
                        Obj.sort({ a: { age: 2 }, b: { age: 10 } }, [
                            ["age", "desc"],
                        ]),
                    ),
                ).toEqual([{ age: 10 }, { age: 2 }]);
            });

            it("runs a comparator nested in a one-element descriptor", () => {
                // PHP-verified: docs/php-parity/task-18-sort-comparator.json,
                // "Arr::sort runs a comparator nested in a one-element
                // descriptor" - Obj.sort shares Arr.sort's descriptor handling.
                const byAge = (a: { age: number }, b: { age: number }) =>
                    a.age - b.age;
                const data = { x: { age: 3 }, y: { age: 1 }, z: { age: 2 } };

                expect(
                    Object.values(Obj.sort(data, [[byAge]] as never)),
                ).toEqual([{ age: 1 }, { age: 2 }, { age: 3 }]);
            });

            it("defaults an omitted direction to ascending", () => {
                const unsorted = {
                    a: { age: 10 },
                    b: { age: 2 },
                };
                // PHP-verified: docs/php-parity/task-10-pluck-sort.json, "direction
                // tuple [age] — omitted defaults to ascending".
                expect(Object.values(Obj.sort(unsorted, [["age"]]))).toEqual([
                    { age: 2 },
                    { age: 10 },
                ]);
            });

            it("falls through an unrecognized direction to descending", () => {
                const unsorted = {
                    a: { age: 2 },
                    b: { age: 10 },
                };
                // PHP-verified: docs/php-parity/task-10-pluck-sort.json, "direction
                // tuple [age,"BOGUS"] — default arm is DESCENDING".
                expect(
                    Object.values(
                        Obj.sort(unsorted, [
                            ["age", "BOGUS" as unknown as "asc"],
                        ]),
                    ),
                ).toEqual([{ age: 10 }, { age: 2 }]);
            });

            it("uses a comparator descriptor as-authored", () => {
                const unsorted = {
                    a: { age: 30 },
                    b: { age: 10 },
                    c: { age: 20 },
                };
                const byAgeDesc = (x: { age: number }, y: { age: number }) =>
                    y.age - x.age;
                expect(Object.values(Obj.sort(unsorted, [byAgeDesc]))).toEqual([
                    { age: 30 },
                    { age: 20 },
                    { age: 10 },
                ]);
            });

            it("falls through to a stable no-op when every descriptor ties", () => {
                const unsorted = { a: { name: "Item" }, b: { name: "Item" } };
                // Exercises the "no comparator produced a decision"
                // fallback: Array.prototype.sort is stable, so a tie on
                // every descriptor preserves insertion order.
                expect(Object.keys(Obj.sort(unsorted, ["name"]))).toEqual([
                    "a",
                    "b",
                ]);
            });

            it("preserves insertion order for an empty descriptor array", () => {
                // isFalsy([]) is true, so without an explicit guard an empty descriptor
                // array falls through to the natural value-sort branch instead of the
                // no-op Collection::sortByMany([]) performs.
                const unsorted = { x: 5, y: 1, z: 3 };
                expect(Object.entries(Obj.sort(unsorted, []))).toEqual([
                    ["x", 5],
                    ["y", 1],
                    ["z", 3],
                ]);
            });
        });

        it("orders row objects naturally when no callback is given", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "sort-rows-natural-keys"
            const sorted = Obj.sort({
                a: { name: "Desk" },
                b: { name: "Chair" },
            });

            expect(Object.keys(sorted)).toEqual(["b", "a"]);
        });

        it("sorts rows by keys, per-key directions, and chained comparators", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "sortByMany-keys-order", "sortByMany-order", "sortByMany-callable-keys"
            const unsorted = {
                a: { name: "John", age: 8, meta: { key: 3 } },
                b: { name: "John", age: 10, meta: { key: 5 } },
                c: { name: "Dave", age: 10, meta: { key: 3 } },
                d: { name: "John", age: 8, meta: { key: 2 } },
            };

            expect(
                Object.keys(Obj.sort(unsorted, ["name", "age", "meta.key"])),
            ).toEqual(["c", "d", "a", "b"]);
            expect(
                Object.keys(
                    Obj.sort(unsorted, [
                        "name",
                        ["age", false],
                        ["meta.key", true],
                    ]),
                ),
            ).toEqual(["c", "b", "d", "a"]);
            expect(
                Object.keys(
                    Obj.sort(unsorted, [
                        (x, y) =>
                            x.name < y.name ? -1 : x.name > y.name ? 1 : 0,
                        (x, y) => y.age - x.age,
                        ["meta.key", true],
                    ]),
                ),
            ).toEqual(["c", "b", "d", "a"]);
        });
    });

    describe("sortDesc", () => {
        it("should handle non-object data", () => {
            expect(Obj.sortDesc(null)).toEqual({});
            expect(Obj.sortDesc([])).toEqual({});
        });

        it("returns the object unchanged when the callback is neither a string nor a function", () => {
            const source = { a: 1, b: 3, c: 2 };

            // @ts-expect-error Testing edge case with invalid callback type
            expect(Obj.sortDesc(source, 123)).toEqual({ a: 1, b: 3, c: 2 });
            // @ts-expect-error Testing edge case with invalid callback type
            expect(Obj.sortDesc(source, { key: "value" })).toEqual({
                a: 1,
                b: 3,
                c: 2,
            });
        });

        describe("sort.objects", () => {
            it("should sort in descending order", () => {
                const obj = { y: 100, a: 1, c: 3, b: 2, x: 100 };
                const result = Obj.sortDesc(obj);
                expect(Object.values(result)).toEqual([100, 100, 3, 2, 1]);
            });

            it("compares numbers numerically, not lexicographically", () => {
                // PHP-verified: docs/php-parity/task-10-pluck-sort.json, "Arr::sortDesc
                // numeric comparison".
                expect(
                    Object.values(Obj.sortDesc({ a: 1, b: 10, c: 9 })),
                ).toEqual([10, 9, 1]);
            });
        });

        describe("sort callback is string", () => {
            it("should handle when the callback is a string key", () => {
                const obj = {
                    user1: { name: "John", age: 30 },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sortDesc(obj, "age");
                expect(Object.keys(result)).toEqual(["user1", "user2"]);
            });

            it("treats a falsy callback as no callback, like sort does", () => {
                // The mirror of sort's own row: "" left the object untouched while
                // Arr.sortDesc sorted it. PHP can't arbitrate — Collection::sortDesc("")
                // throws (docs/php-parity/task-16-final-review.json), so agreement decides.
                const source = { a: 3, b: 1, c: 2 };
                const descending: [string, number][] = [
                    ["a", 3],
                    ["c", 2],
                    ["b", 1],
                ];
                const values = Object.values(source);

                for (const falsy of ["", "   "]) {
                    expect(Object.entries(Obj.sortDesc(source, falsy))).toEqual(
                        descending,
                    );
                    expect(Object.values(Obj.sortDesc(source, falsy))).toEqual(
                        Arr.sortDesc(values, falsy),
                    );
                }
            });

            it("should handle missing keys", () => {
                const obj = {
                    user1: { name: "John" },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sortDesc(obj, "age");
                expect(Object.keys(result)).toEqual(["user2", "user1"]);
            });

            it("should handle when values are falsy", () => {
                const obj = {
                    user1: { name: "John", age: 0 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                };
                const result = Obj.sortDesc(obj, "age");
                expect(Object.keys(result)).toEqual([
                    "user3",
                    "user1",
                    "user2",
                ]);
            });

            it("should handle when some values are falsy", () => {
                const obj = {
                    user0: { name: "John", age: 100 },
                    user1: { name: "John", age: 30 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                    user4: { name: "Doe", age: [] },
                    user5: { name: "Jane", age: undefined },
                    user6: { name: "Jane", age: 100 },
                };
                const result = Obj.sortDesc(obj, "age");
                // The descending mirror of "should handle when some values are
                // falsy": null, [] and undefined tie, so they keep their
                // insertion order behind the numbers.
                expect(Object.keys(result)).toEqual([
                    "user0",
                    "user6",
                    "user1",
                    "user3",
                    "user2",
                    "user4",
                    "user5",
                ]);
            });

            // task-19-spaceship.json, "arsort over the same null and empty-array
            // fixture" - this port matches PHP's permutation exactly here, which
            // the asort row it mirrors does not (see compareValues' docblock).
            it("matches PHP's arsort over a null and empty-array fixture", () => {
                const obj = {
                    user0: 100,
                    user1: 30,
                    user2: null,
                    user3: 25,
                    user4: [],
                };

                expect(Object.keys(Obj.sortDesc(obj))).toEqual([
                    "user0",
                    "user1",
                    "user3",
                    "user2",
                    "user4",
                ]);
            });
        });

        describe("sort callback is function", () => {
            it("should handle when the callback is provided", () => {
                const obj = { a: 1, c: 3, b: 2 };
                const result = Obj.sortDesc(obj, (value) => -value);
                expect(Object.values(result)).toEqual([1, 2, 3]);

                const result2 = Obj.sortDesc(obj, (value) => value);
                expect(Object.values(result2)).toEqual([3, 2, 1]);

                const result3 = Obj.sortDesc(
                    { x: 100, a: 3, c: 3, b: 3, y: 100 },
                    (value) => value,
                );
                expect(Object.values(result3)).toEqual([100, 100, 3, 3, 3]);
            });

            it("should handle missing keys in callback", () => {
                const obj = {
                    user1: { name: "John" },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sortDesc(obj, (item) =>
                    "age" in item ? item.age : undefined,
                );
                // Descending: highest value first, null/undefined last
                expect(Object.keys(result)).toEqual(["user2", "user1"]);
            });

            it("should handle when values are falsy in callback", () => {
                const obj = {
                    user1: { name: "John", age: 0 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                };
                const result = Obj.sortDesc(obj, (item) => item.age);
                expect(Object.keys(result)).toEqual([
                    "user3",
                    "user1",
                    "user2",
                ]);
            });

            it("should handle when some values are falsy in callback", () => {
                const obj = {
                    user0: { name: "John", age: 100 },
                    user1: { name: "John", age: 30 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                    user4: { name: "Doe", age: null },
                    user5: { name: "Jane", age: undefined },
                    user6: { name: "Jane", age: 100 },
                };
                const result = Obj.sortDesc(obj, (item) => item.age);
                // Descending: highest values first, null/undefined last
                expect(Object.keys(result)).toEqual([
                    "user0",
                    "user6",
                    "user1",
                    "user3",
                    "user2",
                    "user4",
                    "user5",
                ]);
            });

            it("should handle when callback returns both null values", () => {
                const obj = {
                    a: { value: null },
                    b: { value: null },
                };
                // Both callback results are null, should return 0 (maintain order)
                const result = Obj.sortDesc(obj, (item) => item["value"]);
                expect(Object.keys(result)).toEqual(["a", "b"]);
            });
        });

        describe("multi-key descriptors", () => {
            it("reverses every descriptor's own direction", () => {
                // Mirrors Collection::sortByDesc (Collection.php:1683-1693): every
                // key/tuple descriptor's direction is overridden to descending,
                // regardless of what it specified.
                const unsorted = {
                    p: { name: "Apple", age: 5, meta: { key: 9 } },
                    r: { name: "Item", age: 12, meta: { key: 20 } },
                    q: { name: "Item", age: 2, meta: { key: 1 } },
                };
                expect(
                    Object.values(
                        Obj.sortDesc(unsorted, ["name", "age", "meta.key"]),
                    ),
                ).toEqual([
                    { name: "Item", age: 12, meta: { key: 20 } },
                    { name: "Item", age: 2, meta: { key: 1 } },
                    { name: "Apple", age: 5, meta: { key: 9 } },
                ]);
            });

            it("lets sortDesc override an explicit ascending direction", () => {
                // PHP-verified: docs/php-parity/task-18-sort-comparator.json,
                // "sortDesc overrides an explicit "asc" direction".
                expect(
                    Object.values(
                        Obj.sortDesc({ x: { age: 2 }, y: { age: 10 } }, [
                            ["age", "asc"],
                        ]),
                    ),
                ).toEqual([{ age: 10 }, { age: 2 }]);
            });

            it("does not override a comparator descriptor's own direction", () => {
                const unsorted = {
                    a: { age: 30 },
                    b: { age: 10 },
                    c: { age: 20 },
                };
                const byAgeAsc = (x: { age: number }, y: { age: number }) =>
                    x.age - y.age;
                // The comparator is authored ascending; sortDesc must not
                // flip it, matching sortByDesc's rewrite only ever
                // touching a comparison's [1] slot (never a callable).
                expect(
                    Object.values(Obj.sortDesc(unsorted, [byAgeAsc])),
                ).toEqual([{ age: 10 }, { age: 20 }, { age: 30 }]);
            });

            it("falls through to a stable no-op when every descriptor ties", () => {
                const unsorted = { a: { name: "Item" }, b: { name: "Item" } };
                expect(Object.keys(Obj.sortDesc(unsorted, ["name"]))).toEqual([
                    "a",
                    "b",
                ]);
            });

            it("preserves insertion order for an empty descriptor array", () => {
                // Same principle as sort's empty-array fix above.
                const unsorted = { x: 5, y: 1, z: 3 };
                expect(Object.entries(Obj.sortDesc(unsorted, []))).toEqual([
                    ["x", 5],
                    ["y", 1],
                    ["z", 3],
                ]);
            });
        });

        it("orders row objects naturally in descending order", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "sortDesc-rows-natural-keys"
            const sorted = Obj.sortDesc({
                a: { name: "Chair" },
                b: { name: "Desk" },
            });

            expect(Object.keys(sorted)).toEqual(["b", "a"]);
        });
    });

    describe("sortRecursive", () => {
        it("should handle non-object data", () => {
            expect(Obj.sortRecursive(null)).toEqual({});
            expect(Obj.sortRecursive([])).toEqual({});
        });

        it("should handle empty objects", () => {
            const obj = {};
            const result = Obj.sortRecursive(obj);
            expect(result).toEqual({});
        });

        it("should recursively sort object", () => {
            const obj = {
                b: { d: 2, c: 1, z: 50, y: 55, x: 50 },
                a: { f: 4, e: 3, x: 100, y: 100 },
            };
            const result = Obj.sortRecursive(obj);
            expect(Object.keys(result)).toEqual(["a", "b"]);
            expect(Object.keys(result["a"])).toEqual(["e", "f", "x", "y"]);
            expect(Object.keys(result["b"])).toEqual(["c", "d", "x", "y", "z"]);

            const resultDesc = Obj.sortRecursive(obj, true);
            expect(Object.keys(resultDesc)).toEqual(["b", "a"]);
            expect(Object.keys(resultDesc["a"])).toEqual(["y", "x", "f", "e"]);
            expect(Object.keys(resultDesc["b"])).toEqual([
                "z",
                "y",
                "x",
                "d",
                "c",
            ]);

            // Test SortDirection.Descending
            const resultSortDir = Obj.sortRecursive(
                obj,
                SortDirection.Descending,
            );
            expect(Object.keys(resultSortDir)).toEqual(["b", "a"]);
            expect(Object.keys(resultSortDir["a"])).toEqual([
                "y",
                "x",
                "f",
                "e",
            ]);
        });

        it("should recursively sort object with arrays", () => {
            const obj = { b: { d: [3, 1, 2, 3], c: 1 }, a: { f: 4, e: 3 } };
            const result = Obj.sortRecursive(obj);

            expect(Object.keys(result)).toEqual(["a", "b"]);
            expect(Object.keys(result["a"])).toEqual(["e", "f"]);
            expect(Object.keys(result["b"])).toEqual(["c", "d"]);
            expect(result["b"]["d"]).toEqual([1, 2, 3, 3]);

            const resultDesc = Obj.sortRecursive(obj, true);
            expect(Object.keys(resultDesc)).toEqual(["b", "a"]);
            expect(Object.keys(resultDesc["a"])).toEqual(["f", "e"]);
            expect(Object.keys(resultDesc["b"])).toEqual(["d", "c"]);
            expect(resultDesc["b"]["d"]).toEqual([3, 3, 2, 1]);
        });

        it("sorts lists by value, recurses into them, and sorts keys", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "sortRecursive-literal"
            const sorted = Obj.sortRecursive({
                users: [
                    {
                        name: "joe",
                        mail: "joe@example.com",
                        numbers: [2, 1, 0],
                    },
                    { name: "jane", age: 25 },
                ],
                repositories: [{ id: 1 }, { id: 0 }],
                20: [2, 1, 0],
                30: { 2: "a", 1: "b", 0: "c" },
            });

            expect(sorted).toEqual({
                20: [0, 1, 2],
                30: { 0: "c", 1: "b", 2: "a" },
                repositories: [{ id: 0 }, { id: 1 }],
                users: [
                    { age: 25, name: "jane" },
                    {
                        mail: "joe@example.com",
                        name: "joe",
                        numbers: [0, 1, 2],
                    },
                ],
            });
            expect(Object.keys(sorted)).toEqual([
                "20",
                "30",
                "repositories",
                "users",
            ]);
        });

        it("orders numbers numerically and strings byte-wise, in both directions", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "sortRecursive-numbers-lexical", "sortRecursiveDesc-numbers", "sortRecursive-key-case"
            // "sortRecursive-list-strings-case"
            expect(Obj.sortRecursive({ a: [10, 9, 1] })).toEqual({
                a: [1, 9, 10],
            });
            expect(Obj.sortRecursiveDesc({ a: [1, 9, 10] })).toEqual({
                a: [10, 9, 1],
            });
            expect(
                Object.keys(Obj.sortRecursive({ b: 1, B: 2, a: 3, _x: 4 })),
            ).toEqual(["B", "_x", "a", "b"]);
            expect(Obj.sortRecursive({ l: ["b", "B", "a"] })).toEqual({
                l: ["B", "a", "b"],
            });
        });

        it("sorts a list of objects by PHP's array rule, not by their JSON form", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "sortRecursive-list-of-objects";
            // task-25-spaceship-arrays.json, "Arr::sort orders equal-count rows element-wise"
            expect(
                Obj.sortRecursive({ r: [{ id: 2 }, { id: 10 }, { id: 1 }] }),
            ).toEqual({ r: [{ id: 1 }, { id: 2 }, { id: 10 }] });
        });

        it("keeps an object value that isn't a plain object whole, even inside a list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "sortRecursive-object-leaf"
            const date = new Date(0);
            const point = new Point();
            const map = new Map([
                ["b", 1],
                ["a", 2],
            ]);
            const sorted = Obj.sortRecursive({
                d: date,
                p: point,
                m: map,
                l: [date],
                a: 1,
            });

            expect(Object.keys(sorted)).toEqual(["a", "d", "l", "m", "p"]);
            expect(sorted.d).toBe(date);
            expect(sorted.p).toBe(point);
            expect(sorted.m).toBe(map);
            expect(sorted.l[0]).toBe(date);
        });
    });

    describe("sortRecursiveDesc", () => {
        it("should recursively sort in descending order", () => {
            const obj = { a: { e: 3, f: 4 }, b: { c: 1, d: 2 } };
            const result = Obj.sortRecursiveDesc(obj);
            expect(Object.keys(result)).toEqual(["b", "a"]);
        });

        it("should sort with equal keys in descending order", () => {
            const obj = { z: 1, a: 2, m: 3 };
            const result = Obj.sortRecursiveDesc(obj);
            expect(Object.keys(result)).toEqual(["z", "m", "a"]);
        });

        it("should handle nested objects in descending sort", () => {
            const obj = {
                alpha: { x: 1, y: 2 },
                beta: { a: 3, b: 4 },
                gamma: { m: 5, n: 6 },
            };
            const result = Obj.sortRecursiveDesc(obj);
            expect(Object.keys(result)).toEqual(["gamma", "beta", "alpha"]);
            expect(Object.keys(result["alpha"])).toEqual(["y", "x"]);
            expect(Object.keys(result["beta"])).toEqual(["b", "a"]);
        });

        it("should handle keys where first > second in descending", () => {
            const obj = { c: 1, a: 2, b: 3 };
            const result = Obj.sortRecursiveDesc(obj);
            expect(Object.keys(result)).toEqual(["c", "b", "a"]);
        });

        it("sorts keys and nested lists in descending order", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "sortRecursiveDesc-literal"
            const sorted = Obj.sortRecursiveDesc({
                empty: [],
                nested: {
                    level1: {
                        level2: { level3: [2, 3, 1] },
                        values: [4, 5, 6],
                    },
                },
                mixed: { a: 1, 2: "b", c: 3, 1: "d" },
                numbered_index: { 1: "e", 3: "c", 4: "b", 5: "a", 2: "d" },
            });

            expect(sorted).toEqual({
                empty: [],
                mixed: { c: 3, a: 1, 2: "b", 1: "d" },
                nested: {
                    level1: {
                        values: [6, 5, 4],
                        level2: { level3: [3, 2, 1] },
                    },
                },
                numbered_index: { 5: "a", 4: "b", 3: "c", 2: "d", 1: "e" },
            });
            // JS hoists integer-like keys, so only string-key order is asserted.
            expect(Object.keys(sorted)).toEqual([
                "numbered_index",
                "nested",
                "mixed",
                "empty",
            ]);
            expect(Object.keys(sorted.nested.level1)).toEqual([
                "values",
                "level2",
            ]);
        });
    });

    describe("splice", () => {
        it("leaves a prototype object untouched instead of clearing it", () => {
            // JS-only: a PHP array has no prototype; defineKey won't write into one, so the survivors would be lost.
            class Holder {}
            Object.defineProperty(Holder.prototype, "kept", {
                value: "str",
                enumerable: true,
                configurable: true,
                writable: true,
            });

            expect(Obj.splice(Holder.prototype, 0, 0)).toEqual({});
            expect(Object.entries(Holder.prototype)).toEqual([["kept", "str"]]);
        });

        it("renumbers negative integer keys in what it keeps and what it removes", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "splice-negative-int-keys"
            const one = { "-1": "a", x: "b", "-5": "c" };
            const two = { x: "a", "-3": "b", "-7": "c" };

            expect(Obj.splice(one, 1, 1, ["z"])).toEqual({ x: "b" });
            expect(one).toEqual({ 0: "a", 1: "z", 2: "c" });
            expect(Obj.splice(two, 0, 3)).toEqual({ x: "a", 0: "b", 1: "c" });
            expect(two).toEqual({});
        });

        it("should handle non-object data", () => {
            expect(Obj.splice(null, 0, 2)).toEqual({});
            expect(Obj.splice([], 0, 2)).toEqual({});
        });

        it("keeps the container an object and preserves keys on both halves", () => {
            // PHP-verified (task-03-splice.json): array_splice(["x"=>1, "y"=>2,"z"=>3],
            // 1, 1) leaves {"x":1,"z":3} and returns {"y":2} — string keys survive on
            // the remainder AND the removed portion, not just the remainder.
            const data = { a: 1, b: 2, c: 3 };
            const removed = Obj.splice(data, 1, 1);
            expect(Array.isArray(data)).toBe(false);
            expect(Array.isArray(removed)).toBe(false);
            expect(data).toEqual({ a: 1, c: 3 });
            expect(removed).toEqual({ b: 2 });
        });

        it("removes through to the end when no length is given", () => {
            // PHP branches on func_num_args === 1 (Collection.php:1757); the one-arg
            // form must remove everything from offset to the end, not nothing.
            const data = { foo: "f", baz: "z" };
            const removed = Obj.splice(data, 1);
            expect(removed).toEqual({ baz: "z" });
            expect(data).toEqual({ foo: "f" });
        });

        it("splice with length 0 (insert only)", () => {
            // PHP-verified (task-03-splice.json "insert"): key discarded, renumbered from
            // 0 regardless of length; "0" then sorts first here (JS integer-key order).
            const obj = { a: 1, b: 2, c: 3 };
            const removed = Obj.splice(obj, 1, 0, { x: 10 });
            expect(removed).toEqual({});
            expect(Object.entries(obj)).toEqual([
                ["0", 10],
                ["a", 1],
                ["b", 2],
                ["c", 3],
            ]);
        });

        it("discards the replacement object's keys, renumbering from zero", () => {
            // PHP-verified in docs/php-parity/task-03-splice.json ("simple").
            const data = { x: 1, y: 2, z: 3 };
            Obj.splice(data, 1, 1, { foo: "bar" });

            expect(Object.entries(data)).toEqual([
                ["0", "bar"],
                ["x", 1],
                ["z", 3],
            ]);
        });

        it("keeps every element when a replacement key collides with a survivor", () => {
            // PHP-verified (task-03-splice.json "collision"): 3 entries out, nothing dropped.
            const data = { a: 1, b: 2, c: 3 };
            Obj.splice(data, 1, 1, { a: 9 });

            expect(Object.keys(data)).toHaveLength(3);
            expect(data).toEqual({ a: 1, "0": 9, c: 3 });
        });

        it("splice without replacement", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const removed = Obj.splice(obj, 1, 1);
            expect(removed).toEqual({ b: 2 });
            expect(obj).toEqual({ a: 1, c: 3 });
        });

        it("handles multiple replacement objects", () => {
            // PHP-verified (task-03-splice.json "multi"): each replacement's values
            // renumber from 0 in turn; "0"/"1" then sort first (JS integer-key order).
            const obj = { a: 1, b: 2, c: 3 };
            const removed = Obj.splice(obj, 1, 1, { x: 10 }, { y: 20 });
            expect(removed).toEqual({ b: 2 });
            expect(Object.entries(obj)).toEqual([
                ["0", 10],
                ["1", 20],
                ["a", 1],
                ["c", 3],
            ]);
        });

        it("treats a negative length as counting back from the end, like array_splice", () => {
            // PHP-verified (task-03-splice.json "associative, single removal").
            const obj = { a: 1, b: 2, c: 3 };
            const removed = Obj.splice(obj, 1, -1);
            expect(removed).toEqual({ b: 2 });
            expect(obj).toEqual({ a: 1, c: 3 });
        });

        it("clamps an offset beyond the end to the end", () => {
            const obj = { a: 1, b: 2 };
            const removed = Obj.splice(obj, 5, 1);
            expect(removed).toEqual({});
            expect(obj).toEqual({ a: 1, b: 2 });
        });

        it("supports a negative offset, counting back from the end", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const removed = Obj.splice(obj, -1, 1);
            expect(removed).toEqual({ c: 3 });
            expect(obj).toEqual({ a: 1, b: 2 });
        });

        it("reindexes integer-like keys from 0, independently on the remainder and removed portion", () => {
            // PHP-verified in task-03-splice.json: array_splice([10=>a,20=>b,30=>c],1,1)
            // leaves ["a","c"] and returns ["b"] — integer keys never survive, only
            // string ones do, and each half restarts its own count at 0.
            const obj: Record<string, string> = { 10: "a", 20: "b", 30: "c" };
            const removed = Obj.splice(obj, 1, 1);
            expect(removed).toEqual({ 0: "b" });
            expect(obj).toEqual({ 0: "a", 1: "c" });
        });

        it("leaves string keys alone while reindexing integer-like keys in the same splice", () => {
            const obj: Record<string, string> = { 0: "n", x: "s", 1: "n2" };
            // Object.entries already reorders this to n, n2, s (JS sorts integer-like
            // keys ascending ahead of string keys) — offset 0 removes the first entry
            // by that order, not by literal source order.
            const removed = Obj.splice(obj, 0, 1);
            expect(removed).toEqual({ 0: "n" });
            expect(obj).toEqual({ 0: "n2", x: "s" });
        });

        it("classifies keys the way PHP casts an array key, not by Number()'s notion of numeric", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "splice-negative-int-keys": "0"/"1"/"42" and "-1"
            // are integer keys and reindex; the rest aren't (leading zero, fraction, exponent, whitespace, hex, empty).
            const obj: Record<string, string> = {
                "0": "A",
                "1": "B",
                "42": "C",
                "-1": "D",
                "1.5": "E",
                "01": "F",
                "": "G",
                " ": "H",
                "1e3": "I",
                "0x10": "J",
                Infinity: "K",
            };
            const removed = Obj.splice(obj, 0, 0);
            expect(removed).toEqual({});
            expect(obj).toEqual({
                "0": "A",
                "1": "B",
                "2": "C",
                "3": "D",
                "1.5": "E",
                "01": "F",
                "": "G",
                " ": "H",
                "1e3": "I",
                "0x10": "J",
                Infinity: "K",
            });
        });

        it("splices a scalar replacement in as one element", () => {
            // array_splice([10,20,30,40],1,2,99) leaves [10,99,40];
            // Object.entries(99) is empty, so the value used to vanish.
            const obj: Record<string, number> = { 0: 10, 1: 20, 2: 30, 3: 40 };
            const removed = Obj.splice(obj, 1, 2, 99);

            expect(removed).toEqual({ 0: 20, 1: 30 });
            expect(obj).toEqual({ 0: 10, 1: 99, 2: 40 });
        });

        it("splices a null replacement in rather than dropping it", () => {
            // array_splice([10,20,30],1,1,[null,null]) -> [10,null,null,30].
            const obj: Record<string, number | null> = { 0: 10, 1: 20, 2: 30 };
            const removed = Obj.splice(obj, 1, 1, null, null);

            expect(removed).toEqual({ 0: 20 });
            expect(obj).toEqual({ 0: 10, 1: null, 2: null, 3: 30 });
        });

        it("spreads an array replacement across the splice point", () => {
            const obj: Record<string, number> = { 0: 10, 1: 20, 2: 30 };
            const removed = Obj.splice(obj, 1, 1, [7, 8]);

            expect(removed).toEqual({ 0: 20 });
            expect(obj).toEqual({ 0: 10, 1: 7, 2: 8, 3: 30 });
        });

        it("does not reparent the object via a __proto__ entry (offset 0, the case that reproduces without the fix)", () => {
            // JSON.parse produces a real own enumerable "__proto__" key (a
            // literal `{ __proto__:... }` would set the prototype instead and never
            // reach this code path).
            const src = JSON.parse(
                '{"a":1,"__proto__":{"polluted":true},"c":3}',
            ) as Record<string, unknown>;
            Obj.splice(src, 0, 1);
            expect((src as { polluted?: boolean }).polluted).toBeUndefined();
            expect(Object.getPrototypeOf(src)).toBe(Object.prototype);
        });

        it("does not reparent the object via a __proto__ entry (offset 1, the case that looked clean without the fix)", () => {
            // Offset 1 moves the __proto__ entry into `removed` rather than back into
            // `src`, so the removed object is the one that must be built with defineKey
            // instead of a plain assignment that would reparent it.
            const src = JSON.parse(
                '{"a":1,"__proto__":{"polluted":true},"c":3}',
            ) as Record<string, unknown>;
            const removed = Obj.splice(src, 1, 1);
            expect(Object.getPrototypeOf(src)).toBe(Object.prototype);
            expect(
                (removed as { polluted?: boolean }).polluted,
            ).toBeUndefined();
            expect(Object.getPrototypeOf(removed)).toBe(Object.prototype);
        });

        it("does not reparent the object via a __proto__ key on a replacement object", () => {
            const src: Record<string, unknown> = { a: 1, b: 2 };
            const replacement = JSON.parse(
                '{"__proto__":{"polluted":true}}',
            ) as Record<string, unknown>;
            Obj.splice(src, 0, 0, replacement);
            expect((src as { polluted?: boolean }).polluted).toBeUndefined();
            expect(Object.getPrototypeOf(src)).toBe(Object.prototype);
        });

        it("splices a scalar replacement into string-keyed data under a fresh integer key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "S1 splice on assoc with scalar replacement mid"
            const data: Record<string, number | string> = { a: 1, b: 2, c: 3 };

            expect(Obj.splice(data, 1, 1, "bar")).toEqual({ b: 2 });
            expect(data).toEqual({ a: 1, 0: "bar", c: 3 });
        });
    });

    describe("toCssClasses", () => {
        it("should handle non-object data", () => {
            expect(Obj.toCssClasses(null)).toBe("");
            expect(Obj.toCssClasses([])).toBe("");
        });

        it("should convert to CSS classes", () => {
            const obj = { "font-bold": true, "text-red": false, "mt-4": true };
            expect(Obj.toCssClasses(obj)).toBe("font-bold mt-4");
        });

        it("should handle empty objects", () => {
            expect(Obj.toCssClasses({})).toBe("");
        });

        it("emits the value for numeric keys and the key for truthy string keys", () => {
            // Arr.php:1214, is_numeric($class) pushes the VALUE. Captured:
            // docs/php-parity/task-08-arr-parity.json ("Arr::toCssClasses mixed keys")
            // -> "font-bold mt-4 ml-2".
            expect(
                Obj.toCssClasses({
                    0: "font-bold",
                    1: "mt-4",
                    "ml-2": true,
                    "mr-2": false,
                }),
            ).toBe("font-bold mt-4 ml-2");
        });

        it("uses PHP's is_numeric for the key check, not Number()/isNaN", () => {
            // Captured: docs/php-parity/task-08-arr-parity.json ("Arr::toCssClasses
            // with is_numeric edge-case keys").
            expect(Obj.toCssClasses({ "": "foo" })).toBe("");
            expect(Obj.toCssClasses({ " ": "foo" })).toBe(" ");
            expect(Obj.toCssClasses({ "0x10": "foo" })).toBe("0x10");
            expect(Obj.toCssClasses({ "1e3": "foo" })).toBe("foo");
            expect(Obj.toCssClasses({ Infinity: "foo" })).toBe("Infinity");
        });

        it("PHP-casts non-string values at numeric keys instead of dropping them", () => {
            // Arr::toCssClasses pushes $constraint raw into the array before implode,
            // which casts null -> "", true -> "1", numbers via their decimal string.
            expect(
                Obj.toCssClasses({
                    0: 123,
                    1: null,
                    2: undefined,
                    3: true,
                }),
            ).toBe("123   1");

            // false -> "" too, not "0" (implode's bool cast, not
            // http_build_query's). Captured: docs/php-parity/task-08-arr-
            // parity.json ("Arr::toCssClasses false value at numeric key").
            expect(Obj.toCssClasses({ 0: false, 1: "x" })).toBe(" x");
        });

        it.each([
            ["0", ""],
            ["00", "foo"],
            ["0.0", "foo"],
        ])("applies PHP truthiness to the value %s", (value, expected) => {
            // Captured: docs/php-parity/task-08-arr-parity.json
            // ("CSS helpers use PHP truthiness for the value").
            expect(Obj.toCssClasses({ foo: value })).toBe(expected);
        });

        it("drops an empty container value", () => {
            // Captured: docs/php-parity/task-08-arr-parity.json
            // ("CSS helpers use PHP truthiness for the value").
            expect(Obj.toCssClasses({ foo: [] })).toBe("");
            expect(Obj.toCssClasses({ foo: {} })).toBe("");
        });
    });

    describe("toCssStyles", () => {
        it("should handle non-object data", () => {
            expect(Obj.toCssStyles(null)).toBe("");
            expect(Obj.toCssStyles([])).toBe("");
        });

        it("should convert to CSS styles", () => {
            const obj = {
                "font-weight: bold": true,
                "color: red": false,
                "margin-top: 4px": true,
            };
            expect(Obj.toCssStyles(obj)).toBe(
                "font-weight: bold; margin-top: 4px;",
            );
        });

        it("should handle styles with semicolons", () => {
            const obj = {
                "font-weight: bold;": true,
                "color: blue": false,
                "margin: 10px;": true,
            };
            expect(Obj.toCssStyles(obj)).toBe(
                "font-weight: bold; margin: 10px;",
            );
        });

        it("emits the value for numeric keys and the key for truthy string keys", () => {
            // Arr.php:1237, is_numeric($class) pushes the VALUE (finished with a
            // semicolon), not the key.
            expect(
                Obj.toCssStyles({
                    0: "font-weight: bold",
                    1: "margin-top: 4px;",
                    "margin-left: 2px;": true,
                    "margin-right: 2px": false,
                }),
            ).toBe("font-weight: bold; margin-top: 4px; margin-left: 2px;");
        });

        it("uses PHP's is_numeric for the key check, not Number()/isNaN", () => {
            // docs/php-parity/task-08-arr-parity.json
            // ("Arr::toCssStyles with is_numeric edge-case keys").
            expect(Obj.toCssStyles({ "": "foo" })).toBe(";");
            expect(Obj.toCssStyles({ " ": "foo" })).toBe(" ;");
            expect(Obj.toCssStyles({ "0x10": "foo" })).toBe("0x10;");
            expect(Obj.toCssStyles({ "1e3": "foo" })).toBe("foo;");
            expect(Obj.toCssStyles({ Infinity: "foo" })).toBe("Infinity;");
        });

        it("PHP-casts non-string values at numeric keys instead of dropping them", () => {
            // Same PHP-cast as toCssClasses, then each pushed value is finished with a
            // semicolon. Captured: docs/php-parity/task-08-arr-parity.json
            // ("Arr::toCssStyles non-string value at numeric key") -> "123; ; 1;".
            expect(
                Obj.toCssStyles({
                    0: 123,
                    1: null,
                    2: undefined,
                    3: true,
                }),
            ).toBe("123; ; ; 1;");

            // false -> "" too, not "0". Captured: docs/php-parity/task-08-
            // arr-parity.json ("Arr::toCssStyles false value at numeric key").
            expect(Obj.toCssStyles({ 0: false, 1: "x" })).toBe("; x;");
        });

        it.each([
            ["0", ""],
            ["00", "foo;"],
            ["0.0", "foo;"],
        ])("applies PHP truthiness to the value %s", (value, expected) => {
            // Captured: docs/php-parity/task-08-arr-parity.json
            // ("CSS helpers use PHP truthiness for the value").
            expect(Obj.toCssStyles({ foo: value })).toBe(expected);
        });

        it("drops an empty container value", () => {
            // Captured: docs/php-parity/task-08-arr-parity.json
            // ("CSS helpers use PHP truthiness for the value").
            expect(Obj.toCssStyles({ foo: [] })).toBe("");
            expect(Obj.toCssStyles({ foo: {} })).toBe("");
        });
    });

    describe("where", () => {
        it("should handle non-object data", () => {
            expect(Obj.where(null, () => true)).toEqual({});
            expect(Obj.where([], () => true)).toEqual({});
        });

        it("should filter with callback", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.where(obj, (value) => value > 2);
            expect(result).toEqual({ c: 3, d: 4 });
        });

        it("should pass key to callback", () => {
            const obj = { name: "John", age: null, city: "NYC" };
            const result = Obj.where(obj, (value) => value !== null);
            expect(result).toEqual({ name: "John", city: "NYC" });
        });

        it("filters on the key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "whereKey-numeric"
            expect(
                Obj.where({ 10: 1, foo: 3, 20: 2 }, (_value, key) =>
                    /^\d+$/.test(String(key)),
                ),
            ).toEqual({ 10: 1, 20: 2 });
        });
    });

    describe("reject", () => {
        it("should reject items that pass test", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.reject(obj, (value) => value > 2);
            expect(result).toEqual({ a: 1, b: 2 });
        });
    });

    describe("replace", () => {
        it("should replace values in object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const replacements = { b: 20, c: 30, d: 40 };
            const result = Obj.replace(obj, replacements);
            expect(result).toEqual({ a: 1, b: 20, c: 30, d: 40 });
        });

        it("does not mutate its argument", () => {
            // PHP is newInstance(array_replace(...)), Collection.php:1172.
            const data = { a: 1 };
            Obj.replace(data, { b: 2 });
            expect(data).toEqual({ a: 1 });
        });

        it("treats a null replacer as a no-op", () => {
            // getArrayableItems(null) -> [] (EnumeratesValues.php:1121); pinned by
            // CollectionTest.php:1490.
            expect(Obj.replace({ a: 1 }, null)).toEqual({ a: 1 });
        });

        it("does not reparent the object via a __proto__ key in the replacer", () => {
            const obj: Record<string, unknown> = { a: 1 };
            const replacer = JSON.parse(
                '{"__proto__":{"polluted":true}}',
            ) as Record<string, unknown>;
            const result = Obj.replace(obj, replacer);
            expect(result["polluted"]).toBeUndefined();
            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        });

        it("keeps constructor/prototype keys from the replacer — only __proto__ is hazardous", () => {
            // constructor/prototype are ordinary PHP array keys with no accessor
            // hazard, unlike __proto__. `replace` never special-cased them (every key
            // goes through `defineKey`), so this pins that they survive.
            const result = Obj.replace(
                { a: 1 },
                { constructor: "Acme", prototype: "P", normal: 1 },
            );
            expect(result).toEqual({
                a: 1,
                constructor: "Acme",
                prototype: "P",
                normal: 1,
            });
        });

        it("merges a list replacer by index, as array_replace does", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "replace-list-replacer"
            expect(Obj.replace({ a: 1 }, ["x"])).toEqual({ 0: "x", a: 1 });
        });

        it("unwraps a Collection-like replacer", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C16 replace assoc"
            expect(
                Obj.replace(
                    { name: "amir", family: "otwell" },
                    collectionLike({ name: "taylor", age: 26 }),
                ),
            ).toEqual({
                name: "taylor",
                family: "otwell",
                age: 26,
            });
        });
    });

    describe("pad", () => {
        it("renumbers a negative integer key when it pads, and keeps it when it doesn't", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "pad-negative-int-key"
            const data = { "-1": "a", x: "b" };

            expect(Obj.pad(data, 4, 0)).toEqual({ 0: "a", x: "b", 1: 0, 2: 0 });
            expect(Obj.pad(data, -4, 0)).toEqual({
                0: 0,
                1: 0,
                2: "a",
                x: "b",
            });
            expect(Obj.pad(data, 2, 0)).toEqual({ "-1": "a", x: "b" });
        });

        it("should handle non-object", () => {
            expect(Obj.pad(null, 3, 0)).toEqual({});
            expect(Obj.pad([], 2, "a")).toEqual({});
        });

        it("should pad object to desired size", () => {
            const obj = { a: 1, b: 2 };
            const result = Obj.pad(obj, 4, 0);
            expect(result).toEqual({ "0": 0, "1": 0, a: 1, b: 2 });
        });

        it("should not truncate if object is larger than size", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.pad(obj, 2, 0);
            expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
        });

        it("should not pad if size equals current length", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.pad(obj, 3, 0);
            expect(result).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("should pad with different types of values", () => {
            const obj = { a: "x" };
            const result = Obj.pad(obj, 3, "y");
            expect(result).toEqual({ "0": "y", "1": "y", a: "x" });
        });

        it("should handle zero size", () => {
            const obj = { a: 1, b: 2 };
            const result = Obj.pad(obj, 0, 0);
            expect(result).toEqual({ a: 1, b: 2 });
        });

        it("should handle negative size", () => {
            const obj = { a: 1, b: 2 };
            const result = Obj.pad(obj, -3, 0);
            expect(result).toEqual({ "0": 0, a: 1, b: 2 });

            const result2 = Obj.pad(obj, -5, 0);
            expect(result2).toEqual({ "0": 0, "1": 0, "2": 0, a: 1, b: 2 });
        });

        it("should handle negative size that equals current length", () => {
            const obj = { a: 1, b: 2 };
            const result = Obj.pad(obj, -2, 0);
            expect(result).toEqual({ a: 1, b: 2 });
        });

        it("numbers negative pad slots from zero, not backwards from -1", () => {
            // PHP-verified: array_pad(["a"=>1,"b"=>2], -5, 0) ->
            // {"0":0,"1":0,"2":0,"a":1,"b":2} (Collection.php:1906, captured in
            // docs/php-parity/task-07-pad-union.json).
            expect(Obj.pad({ a: 1, b: 2 }, -5, 0)).toEqual({
                0: 0,
                1: 0,
                2: 0,
                a: 1,
                b: 2,
            });
        });

        it("returns a copy even when no padding is needed", () => {
            // The old code returned `data` itself on the no-pad path, an aliasing
            // hazard: mutating the result mutated the caller's object too.
            const data = { a: 1, b: 2 };
            const result = Obj.pad(data, 2, 0);
            expect(result).not.toBe(data);
            expect(result).toEqual(data);
        });

        it("returns a copy even when size is zero", () => {
            const data = { a: 1, b: 2 };
            expect(Obj.pad(data, 0, 0)).not.toBe(data);
        });

        it("appends positive padding past the existing integer keys", () => {
            // array_pad([10,20,30,40],6,0) -> [10,20,30,40,0,0]. Numbering
            // the pad slots from 0 overwrote the first two entries.
            expect(Obj.pad({ 0: 10, 1: 20, 2: 30, 3: 40 }, 6, 0)).toEqual({
                0: 10,
                1: 20,
                2: 30,
                3: 40,
                4: 0,
                5: 0,
            });
        });

        it("continues the integer sequence across mixed keys", () => {
            // array_pad([0=>'a','x'=>1],4,'p') -> {0:'a',x:1,1:'p',2:'p'}.
            expect(Obj.pad({ 0: "a", x: 1 }, 4, "p")).toEqual({
                0: "a",
                1: "p",
                2: "p",
                x: 1,
            });
        });

        it("renumbers the originals after negative padding", () => {
            // array_pad([10,20,30,40],-6,0) -> [0,0,10,20,30,40].
            expect(Obj.pad({ 0: 10, 1: 20, 2: 30, 3: 40 }, -6, 0)).toEqual({
                0: 0,
                1: 0,
                2: 10,
                3: 20,
                4: 30,
                5: 40,
            });
        });

        it("leaves sparse integer keys alone when no padding is needed", () => {
            // array_pad([5=>'a',9=>'b'],2,0) keeps 5 and 9 as they are.
            expect(Obj.pad({ 5: "a", 9: "b" }, 2, 0)).toEqual({
                5: "a",
                9: "b",
            });
        });
    });

    describe("replaceRecursive", () => {
        it("should recursively replace values in object", () => {
            const obj = {
                user: { name: "John", address: { city: "NYC", zip: "10001" } },
                age: 30,
                locations: ["NYC", "LA", "CHI", "SF"],
            };
            const replacements = {
                user: { address: { city: "LA" } },
                age: 31,
                locations: ["DETROIT", "PORTLAND"],
            };
            const result = Obj.replaceRecursive(obj, replacements);
            expect(result).toEqual({
                user: { name: "John", address: { city: "LA", zip: "10001" } },
                age: 31,
                locations: ["DETROIT", "PORTLAND", "CHI", "SF"],
            });
        });

        it("does not mutate its argument, including nested objects", () => {
            // PHP is newInstance(array_replace_recursive(...)), Collection.php:1183.
            const nested = { a: { x: 1 } };
            Obj.replaceRecursive(nested, { a: { y: 2 } });
            expect(nested).toEqual({ a: { x: 1 } });
        });

        it("treats a null replacer as a no-op", () => {
            // getArrayableItems(null) -> [] (EnumeratesValues.php:1121); pinned by
            // CollectionTest.php:1532.
            expect(Obj.replaceRecursive({ a: 1 }, null)).toEqual({ a: 1 });
        });

        it("ignores __proto__ keys in replacer data, leaving the result's own prototype untouched", () => {
            // __proto__ skip is a deliberate JS-only divergence — PHP has no
            // accessor-key hazard for array_replace_recursive to guard against. `{
            // __proto__:...
            const obj = { a: 1 };
            const replacer = Object.create(null) as Record<string, unknown>;
            replacer["__proto__"] = { polluted: true };

            const result = Obj.replaceRecursive(obj, replacer);

            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
            expect(
                Object.prototype.hasOwnProperty.call(result, "__proto__"),
            ).toBe(false);
        });

        it("keeps constructor/prototype keys from the replacer — only __proto__ is hazardous", () => {
            // The old code skipped all three of __proto__/constructor/prototype
            // uniformly (isUnsafeKey), silently discarding legitimate replacer data for
            // the latter two — neither has an accessor hazard, unlike __proto__.
            const result = Obj.replaceRecursive(
                { a: 1 },
                { constructor: "Acme", prototype: "P", normal: 1 },
            );
            expect(result).toEqual({
                a: 1,
                constructor: "Acme",
                prototype: "P",
                normal: 1,
            });
        });

        it("merges a nested list with a nested object by key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "D7 replaceRecursive nested list replaced by offset map"
            // "R1 replaceRecursive nested map replaced by list", "replaceRecursive-list-with-assoc"
            expect(
                Obj.replaceRecursive({ k: ["c", "d"] }, { k: { 1: "e" } }),
            ).toEqual({ k: ["c", "e"] });
            expect(
                Obj.replaceRecursive({ k: { 0: "c", 1: "d" } }, { k: ["x"] }),
            ).toEqual({ k: ["x", "d"] });
            expect(Obj.replaceRecursive({ k: ["c"] }, { k: { x: 1 } })).toEqual(
                { k: { 0: "c", x: 1 } },
            );
        });

        it("keeps a replacer list's object element whole instead of spreading it into the list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "replaceRecursive-list-element-map"
            expect(
                Obj.replaceRecursive({ y: [1, 2] }, { y: [{ 1: "x" }] }),
            ).toEqual({ y: [{ 1: "x" }, 2] });
        });

        it("unwraps a Collection-like replacer", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "replaceRecursive-collection-operand"
            expect(
                Obj.replaceRecursive(
                    { a: { x: 1 } },
                    collectionLike({ a: { y: 2 } }),
                ),
            ).toEqual({ a: { x: 1, y: 2 } });
        });

        it("replaces a Date, a Map or a class instance whole, as PHP does an object", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "replaceRecursive-object-leaf".
            // JS-only: a Map has no PHP analogue; it is a leaf like any object.
            class Point {
                constructor(readonly x: number) {}
            }
            const date = new Date(1);
            const map = new Map([["b", 2]]);
            const point = new Point(2);

            expect(
                Obj.replaceRecursive(
                    {
                        d: new Date(0),
                        m: new Map([["a", 1]]),
                        p: new Point(1),
                        q: { a: 1 },
                    },
                    { d: date, m: map, p: { y: 2 }, q: point },
                ),
            ).toEqual({ d: date, m: map, p: { y: 2 }, q: point });
        });

        it("unwraps only the replacer itself, merging a nested toArray entry as data", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "replaceRecursive-nested-toArray-entry"
            const toArray = () => ["unwrapped"];

            expect(
                Obj.replaceRecursive({ a: { x: 1 } }, { a: { toArray } }),
            ).toEqual({ a: { x: 1, toArray } });
            expect(
                Obj.replaceRecursive(
                    { a: { x: 1 } },
                    collectionLike({ a: { toArray } }),
                ),
            ).toEqual({ a: { x: 1, toArray } });
        });

        it("treats nullish data as empty", () => {
            // JS-only: nullish data is treated as empty instead of throwing, like divide(null).
            expect(Obj.replaceRecursive(null, { k: 1 })).toEqual({ k: 1 });
            expect(Obj.replaceRecursive(undefined, { k: [1] })).toEqual({
                k: [1],
            });
        });
    });

    describe("reverse", () => {
        it("should reverse the order of object keys", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.reverse(obj);
            expect(Object.keys(result)).toEqual(["c", "b", "a"]);
        });

        it("should handle empty objects", () => {
            expect(Obj.reverse({})).toEqual({});
        });

        it("should handle non-object values", () => {
            expect(Obj.reverse(null)).toEqual({});
            expect(Obj.reverse([])).toEqual({});
        });

        it("renumbers integer-like keys so the values actually reverse", () => {
            // JS re-sorts integer-like keys ascending on write, so keeping
            // PHP's {1:'b',0:'a'} would leave the object untouched.
            // Renumbering keeps collect(['a','b'])->reverse()'s value order.
            expect(Obj.reverse({ 0: "a", 1: "b" })).toEqual({
                0: "b",
                1: "a",
            });
            expect(Object.values(Obj.reverse({ 0: 10, 1: 20, 2: 30 }))).toEqual(
                [30, 20, 10],
            );
        });

        it("renumbers integer keys but leaves string keys in place", () => {
            const result = Obj.reverse({ 0: "a", x: 1, 1: "b" });

            expect(result).toEqual({ 0: "b", 1: "a", x: 1 });
        });

        it("keeps a negative-string key as-is instead of renumbering it", () => {
            // array_reverse($items, true) keeps every key; JS keeps "-1" in insertion order, so only
            // non-negative integer keys, which JS sorts ascending, need renumbering.
            const result = Obj.reverse({ "-1": "x", b: "y", c: "z" });
            expect(result).toEqual({ c: "z", b: "y", "-1": "x" });
        });

        it("reverses string-keyed entries and keeps each value on its key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C5 reverse assoc"
            expect(
                Object.entries(
                    Obj.reverse({ name: "taylor", framework: "laravel" }),
                ),
            ).toEqual([
                ["framework", "laravel"],
                ["name", "taylor"],
            ]);
        });
    });

    describe("partition", () => {
        it("should handle non-object data", () => {
            const [passed, failed] = Obj.partition(null, () => true);
            expect(passed).toEqual({});
            expect(failed).toEqual({});

            const [passed2, failed2] = Obj.partition([], () => true);
            expect(passed2).toEqual({});
            expect(failed2).toEqual({});
        });

        it("should partition into passed and failed", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const [passed, failed] = Obj.partition(obj, (value) => value > 2);
            expect(passed).toEqual({ c: 3, d: 4 });
            expect(failed).toEqual({ a: 1, b: 2 });
        });
    });

    describe("whereNotNull", () => {
        it("should filter out null values", () => {
            const obj = { a: 1, b: null, c: 2, d: undefined, e: 3 };
            const result = Obj.whereNotNull(obj);
            expect(result).toEqual({ a: 1, c: 2, d: undefined, e: 3 });
        });

        it("keeps falsy non-null values", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "whereNotNull-assoc-falsy"
            expect(
                Obj.whereNotNull({
                    a: null,
                    b: 0,
                    c: false,
                    d: "",
                    e: null,
                    f: [],
                }),
            ).toEqual({ b: 0, c: false, d: "", f: [] });
        });
    });

    describe("wrap", () => {
        it("should wrap non-objects", () => {
            expect(Obj.wrap("hello")).toEqual({ 0: "hello" });
            expect(Obj.wrap(123)).toEqual({ 0: 123 });
        });

        it("should return objects as-is", () => {
            const obj = { hello: "world" };
            expect(Obj.wrap(obj)).toBe(obj);
        });

        it("should return empty object for null", () => {
            expect(Obj.wrap(null)).toEqual({});
        });

        it("returns a Map as-is but wraps a Set", () => {
            // JS-only: PHP has no Map or Set. A Map carries array entries, so it is
            // handed back like a plain object; a Set does not, so it is wrapped.
            const map = new Map([["a", 1]]);
            const set = new Set([1]);

            expect(Obj.wrap(map)).toBe(map);
            expect(Obj.wrap(set)).toEqual({ 0: set });
        });

        it("wraps a Date or class instance, as Arr::wrap does", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "wrap-datetime" and
            // "wrap-stdclass-is-wrapped": PHP wraps every value that is not an array.
            const date = new Date(0);
            const point = new Point();

            expect(Obj.wrap(date)).toEqual({ 0: date });
            expect(Obj.wrap(point)).toEqual({ 0: point });
        });

        it("wraps falsy scalars instead of dropping them", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "wrap-empty-string", "wrap-false", "wrap-zero"
            expect(Obj.wrap("")).toEqual({ 0: "" });
            expect(Obj.wrap(false)).toEqual({ 0: false });
            expect(Obj.wrap(0)).toEqual({ 0: 0 });
        });
    });

    describe("mapSpread", () => {
        it("spreads a list row and appends the key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "mapSpread-tuples", "mapSpread-tuples-key"
            const data = { x: [1, "a"], y: [2, "b"] };

            expect(
                Obj.mapSpread(data, (n, c) => `${String(n)}-${String(c)}`),
            ).toEqual({ x: "1-a", y: "2-b" });
            expect(
                Obj.mapSpread(
                    data,
                    (n, c, key) => `${String(n)}-${String(c)}-${String(key)}`,
                ),
            ).toEqual({ x: "1-a-x", y: "2-b-y" });
        });

        it("should spread object values as arguments", () => {
            const obj = {
                user1: { name: "John", age: 25 },
                user2: { name: "Jane", age: 30 },
            };
            const result = Obj.mapSpread(
                obj,
                (name, age) => `${name} is ${age}`,
            );
            expect(result).toEqual({
                user1: "John is 25",
                user2: "Jane is 30",
            });
        });

        it("should work with numeric values", () => {
            const obj = {
                point1: { x: 1, y: 2 },
                point2: { x: 3, y: 4 },
            };
            const result = Obj.mapSpread(
                obj,
                (x, y) => (x as number) + (y as number),
            );
            expect(result).toEqual({
                point1: 3,
                point2: 7,
            });
        });

        it("should handle non-object values", () => {
            const obj = {
                item1: { x: 1, y: 2 },
                item2: "simple_value",
            };
            const result = Obj.mapSpread(obj, (...args) => args.length);
            expect(result).toEqual({
                item1: 3, // 2 values + key = 3 args
                item2: 2, // value + key = 2 args
            });
        });

        it("should handle empty objects", () => {
            expect(Obj.mapSpread({}, () => "test")).toEqual({});
        });

        it("should handle non-accessible data", () => {
            expect(Obj.mapSpread(null, () => "test")).toEqual({});
            expect(Obj.mapSpread([], () => "test")).toEqual({});
        });

        it("spreads a Collection-like row's items, not its own fields", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "d6-map-spread-collection-row"
            const rows = {
                x: collectionLike([1, "a"]),
                y: collectionLike([2, "b"]),
            };

            expect(
                Obj.mapSpread(
                    rows,
                    (n, c, k) => `${String(n)}-${String(c)}-${String(k)}`,
                ),
            ).toEqual({ x: "1-a-x", y: "2-b-y" });
        });

        it("leaves the row alone where PHP appends the key to it", () => {
            // JS-only: the same row records `row-mutated-to` [1, "a", 0] — PHP's
            // `$chunk[] = $key` writes through the Collection handle. Only pop, shift,
            // splice and unshift mutate here, so the row is read, never written.
            const items = [1, "a"];

            Obj.mapSpread({ x: collectionLike(items) }, (n, c, k) => [n, c, k]);

            expect(items).toEqual([1, "a"]);
        });
    });

    describe("exceptValues", () => {
        it("drops every entry equal to a value in the list", () => {
            const obj1 = { name: "taylor", age: 26, city: "austin" };
            expect(Obj.exceptValues(obj1, [26])).toEqual({
                name: "taylor",
                city: "austin",
            });
        });

        it("accepts a single value instead of a list", () => {
            const obj1 = { name: "taylor", age: 26, city: "austin" };
            expect(Obj.exceptValues(obj1, 26)).toEqual({
                name: "taylor",
                city: "austin",
            });

            const obj2 = { a: 1, b: 2, c: 1, d: 3 };
            expect(Obj.exceptValues(obj2, 1)).toEqual({ b: 2, d: 3 });
        });

        it("compares loosely unless strict is true", () => {
            const obj3 = { a: true, b: false, c: 1, d: 0 };
            expect(Obj.exceptValues(obj3, [1, 0], true)).toEqual({
                a: true,
                b: false,
            });
            expect(Obj.exceptValues(obj3, [1, 0])).toEqual({});
        });

        it("returns an empty object for empty input", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "exceptValues-empty"
            expect(Obj.exceptValues({}, "foo")).toEqual({});
        });

        it("tells 1 and '1' apart only in strict mode", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "exceptValues-assoc-strict", "exceptValues-assoc-loose"
            const obj = { a: 1, b: "1", c: 2, d: "2", e: 3 };

            expect(Obj.exceptValues(obj, [1, 2, 3], true)).toEqual({
                b: "1",
                d: "2",
            });
            expect(Obj.exceptValues(obj, [1, 2, 3])).toEqual({});
        });

        it("returns an empty object for null or undefined data", () => {
            // JS-only: Arr::exceptValues(null, …) is a TypeError in PHP; obj returns {}, like divide(null).
            expect(Obj.exceptValues(null, 1)).toEqual({});
            expect(Obj.exceptValues(undefined, 1)).toEqual({});
        });
    });

    describe("onlyValues", () => {
        it("keeps only entries equal to a value in the list", () => {
            const obj1 = { name: "taylor", age: 26, city: "austin" };
            expect(Obj.onlyValues(obj1, [26])).toEqual({ age: 26 });
        });

        it("accepts a single value instead of a list", () => {
            const obj1 = { name: "taylor", age: 26, city: "austin" };
            expect(Obj.onlyValues(obj1, 26)).toEqual({ age: 26 });

            const obj2 = { a: 1, b: 2, c: 1, d: 3 };
            expect(Obj.onlyValues(obj2, 1)).toEqual({ a: 1, c: 1 });
        });

        it("compares loosely unless strict is true", () => {
            const obj3 = { a: true, b: false, c: 1, d: 0 };
            expect(Obj.onlyValues(obj3, [1, 0], true)).toEqual({
                c: 1,
                d: 0,
            });
            expect(Obj.onlyValues(obj3, [1, 0])).toEqual({
                a: true,
                b: false,
                c: 1,
                d: 0,
            });
        });

        it("returns an empty object for empty data or an empty value list", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "onlyValues-empty-data", "onlyValues-empty-values-assoc"
            expect(Obj.onlyValues({}, "foo")).toEqual({});
            expect(Obj.onlyValues({ a: "foo", b: "bar" }, [])).toEqual({});
        });

        it("splits numeric strings from numbers only when strict", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "onlyValues-strict-numstr-assoc", "onlyValues-loose-numstr-assoc"
            const data = { a: 1, b: "1", c: 2, d: "2", e: 3 };

            expect(Obj.onlyValues(data, [1, 2, 3], true)).toEqual({
                a: 1,
                c: 2,
                e: 3,
            });
            expect(Obj.onlyValues(data, [1, 2, 3])).toEqual(data);
        });

        it("returns an empty object for null or undefined data", () => {
            // JS-only: Arr::onlyValues(null, …) is a TypeError in PHP; obj returns {}, like divide(null).
            expect(Obj.onlyValues(null, 1)).toEqual({});
            expect(Obj.onlyValues(undefined, 1)).toEqual({});
        });
    });

    describe("diffAssoc", () => {
        it("should return entries whose key is missing or whose value differs", () => {
            expect(Obj.diffAssoc({ a: 1, b: 2, c: 3 }, { b: 2 })).toEqual({
                a: 1,
                c: 3,
            });
            expect(Obj.diffAssoc({ a: 1, b: 2, c: 3 }, { b: 3 })).toEqual({
                a: 1,
                b: 2,
                c: 3,
            });
            expect(Obj.diffAssoc({ a: 1, b: 2, c: 3 }, { d: 4 })).toEqual({
                a: 1,
                b: 2,
                c: 3,
            });
        });

        it("should return empty object for non-accessible data", () => {
            expect(Obj.diffAssoc(null, { a: 1 })).toEqual({});
            expect(Obj.diffAssoc([], { a: 1 })).toEqual({});
        });

        it("should return copy of data for non-accessible other", () => {
            expect(Obj.diffAssoc({ a: 1 }, null)).toEqual({ a: 1 });
            expect(Obj.diffAssoc({ a: 1 }, [])).toEqual({ a: 1 });
        });

        // docs/php-parity/task-17-second-review.json, "array_diff_assoc casts values to string"
        it("matches values by PHP's string cast", () => {
            expect(Obj.diffAssoc({ a: 0 }, { a: "0" })).toEqual({});
        });

        // docs/php-parity/task-17-second-review.json, "array_diff_assoc casts a float to string"
        it("casts a float the way PHP does", () => {
            expect(Obj.diffAssoc({ a: 1.0 }, { a: "1" })).toEqual({});
        });

        it("keeps an entry whose value appears in other only under a different key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C6 diffAssoc testDiffAssoc"
            expect(
                Obj.diffAssoc(
                    { id: 1, first_word: "Hello", not_affected: "value" },
                    { id: 123, foo_bar: "Hello", not_affected: "value" },
                ),
            ).toEqual({ id: 1, first_word: "Hello" });
        });

        it("compares keys case-sensitively and integer keys by key, not position", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C7 diffAssoc case keys"
            expect(
                Obj.diffAssoc(
                    { a: "green", b: "brown", c: "blue", 0: "red" },
                    { A: "green", 0: "yellow", 1: "red" },
                ),
            ).toEqual({
                a: "green",
                b: "brown",
                c: "blue",
                0: "red",
            });
        });

        it("unwraps a Collection-like operand in every key-aware set operation", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "C6 diffAssoc testDiffAssoc", "C19 intersectByKeys 2", "C22 diffKeysUsing", "intersectAssoc-collection"
            // "C8 diffAssocUsing strcasecmp", "C9 intersectAssocUsing strcasecmp"
            const strcasecmp = (a: unknown, b: unknown) =>
                String(a).toLowerCase() === String(b).toLowerCase();
            const colors = { a: "green", b: "brown", c: "blue", 0: "red" };

            expect(
                Obj.diffAssoc(
                    { id: 1, first_word: "Hello" },
                    collectionLike({ id: 123, foo_bar: "Hello" }),
                ),
            ).toEqual({ id: 1, first_word: "Hello" });
            // C6's fixture shares no key+value pair with its operand either wrapped or raw,
            // so this key-matching case is what actually pins diffAssoc's own unwrap.
            // docs/php-parity/task-23-obj-release-readiness.json, "diffAssoc-collection-matching-key"
            expect(
                Obj.diffAssoc(
                    { id: 1, name: "a" },
                    collectionLike({ id: 1, name: "b" }),
                ),
            ).toEqual({ name: "a" });
            expect(
                Obj.intersectByKeys(
                    { name: "taylor", family: "otwell", age: 26 },
                    collectionLike({
                        height: 180,
                        name: "amir",
                        family: "moharami",
                    }),
                ),
            ).toEqual({
                name: "taylor",
                family: "otwell",
            });
            expect(
                Obj.diffKeysUsing(
                    { id: 1, first_word: "Hello" },
                    collectionLike({ ID: 123, foo_bar: "Hello" }),
                    strcasecmp,
                ),
            ).toEqual({ first_word: "Hello" });
            expect(
                Obj.intersectAssoc(
                    colors,
                    collectionLike({
                        a: "green",
                        b: "yellow",
                        0: "blue",
                        1: "red",
                    }),
                ),
            ).toEqual({ a: "green" });
            expect(
                Obj.diffAssocUsing(
                    colors,
                    collectionLike({ A: "green", 0: "yellow", 1: "red" }),
                    strcasecmp,
                ),
            ).toEqual({ b: "brown", c: "blue", 0: "red" });
            expect(
                Obj.intersectAssocUsing(
                    colors,
                    collectionLike({
                        a: "GREEN",
                        B: "brown",
                        0: "yellow",
                        1: "red",
                    }),
                    strcasecmp,
                ),
            ).toEqual({ b: "brown" });
        });
    });

    describe("diffAssocUsing", () => {
        it("should diff using key callback and value comparison", () => {
            const strcasecmp = (a: unknown, b: unknown) =>
                String(a).toLowerCase() === String(b).toLowerCase();

            // Keys match case-insensitively and value differs
            expect(
                Obj.diffAssocUsing(
                    { a: "green", b: "brown" },
                    { A: "green", c: "blue" },
                    strcasecmp,
                ),
            ).toEqual({ b: "brown" });

            // Keys match case-insensitively but all values differ
            expect(
                Obj.diffAssocUsing(
                    { a: "green", b: "brown" },
                    { A: "yellow" },
                    strcasecmp,
                ),
            ).toEqual({ a: "green", b: "brown" });
        });

        it("should return empty object for non-accessible data", () => {
            const callback = (a: unknown, b: unknown) => a === b;
            expect(Obj.diffAssocUsing(null, { a: 1 }, callback)).toEqual({});
            expect(Obj.diffAssocUsing([], { a: 1 }, callback)).toEqual({});
        });

        it("should return copy of data for non-accessible other", () => {
            const callback = (a: unknown, b: unknown) => a === b;
            expect(Obj.diffAssocUsing({ a: 1 }, null, callback)).toEqual({
                a: 1,
            });
            expect(Obj.diffAssocUsing({ a: 1 }, [], callback)).toEqual({
                a: 1,
            });
        });

        // docs/php-parity/task-17-second-review.json, "array_diff_assoc casts values to string"
        it("compares values by PHP's string cast, like diffAssoc", () => {
            const strcasecmp = (a: unknown, b: unknown) =>
                String(a).toLowerCase() === String(b).toLowerCase();
            expect(
                Obj.diffAssocUsing({ a: 0 }, { a: "0" }, strcasecmp),
            ).toEqual({});
        });

        it("drops only entries whose key matches via the callback and whose value matches", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C8 diffAssocUsing strcasecmp"
            const strcasecmp = (a: unknown, b: unknown) =>
                String(a).toLowerCase() === String(b).toLowerCase();

            expect(
                Obj.diffAssocUsing(
                    { a: "green", b: "brown", c: "blue", 0: "red" },
                    { A: "green", 0: "yellow", 1: "red" },
                    strcasecmp,
                ),
            ).toEqual({
                b: "brown",
                c: "blue",
                0: "red",
            });
        });
    });

    describe("diffKeysUsing", () => {
        it("should diff using key callback only (ignoring values)", () => {
            const strcasecmp = (a: unknown, b: unknown) =>
                String(a).toLowerCase() === String(b).toLowerCase();

            // Keys match case-insensitively, values are ignored
            expect(
                Obj.diffKeysUsing(
                    { id: 1, first_word: "Hello" },
                    { ID: 123, foo_bar: "Hello" },
                    strcasecmp,
                ),
            ).toEqual({ first_word: "Hello" });

            // Only 'b' doesn't have matching key
            expect(
                Obj.diffKeysUsing({ a: 1, b: 2 }, { A: 999 }, strcasecmp),
            ).toEqual({ b: 2 });
        });

        it("should return empty object for non-accessible data", () => {
            const callback = (a: unknown, b: unknown) => a === b;
            expect(Obj.diffKeysUsing(null, { a: 1 }, callback)).toEqual({});
            expect(Obj.diffKeysUsing([], { a: 1 }, callback)).toEqual({});
        });

        it("should return copy of data for non-accessible other", () => {
            const callback = (a: unknown, b: unknown) => a === b;
            expect(Obj.diffKeysUsing({ a: 1 }, null, callback)).toEqual({
                a: 1,
            });
            expect(Obj.diffKeysUsing({ a: 1 }, [], callback)).toEqual({
                a: 1,
            });
        });
    });

    describe("callback keys", () => {
        const intKeyed = { 1: "a", x: "b" };

        it.each([
            [
                "every",
                (cb: (v: unknown, k: unknown) => boolean) =>
                    Obj.every(intKeyed, cb),
                true,
            ],
            [
                "some",
                (cb: (v: unknown, k: unknown) => boolean) =>
                    Obj.some(intKeyed, cb),
                false,
            ],
            [
                "first",
                (cb: (v: unknown, k: unknown) => boolean) =>
                    Obj.first(intKeyed, cb),
                false,
            ],
            [
                "map",
                (cb: (v: unknown, k: unknown) => boolean) =>
                    Obj.map(intKeyed, cb),
                true,
            ],
            [
                "where",
                (cb: (v: unknown, k: unknown) => boolean) =>
                    Obj.where(intKeyed, cb),
                true,
            ],
            [
                "reject",
                (cb: (v: unknown, k: unknown) => boolean) =>
                    Obj.reject(intKeyed, cb),
                true,
            ],
            [
                "partition",
                (cb: (v: unknown, k: unknown) => boolean) =>
                    Obj.partition(intKeyed, cb),
                true,
            ],
            [
                "filter",
                (cb: (v: unknown, k: unknown) => boolean) =>
                    Obj.filter(intKeyed, cb),
                true,
            ],
            [
                "contains",
                (cb: (v: unknown, k: unknown) => boolean) =>
                    Obj.contains(intKeyed, cb),
                false,
            ],
        ])(
            "hands %s's callback an integer key as a number",
            (_name, run, result) => {
                // docs/php-parity/task-23-obj-release-readiness.json, "callback-key every" …
                // "callback-key partition", "F1 filter callback key type for int key",
                // "F2 contains callback key type for int key"
                const seen: string[] = [];

                run((_value, key) => {
                    seen.push(typeof key);

                    return result;
                });

                expect(seen).toEqual(["number", "string"]);
            },
        );

        it("hands mapWithKeys, sort, sortDesc, sole, keyBy and mapSpread callbacks integer keys as numbers", () => {
            // docs/php-parity/task-23-obj-release-readiness.json,
            // "callback-key mapWithKeys", "callback-key sort", "callback-key sole", "callback-key keyBy"
            // "callback-key mapSpread"
            const seen: unknown[] = [];

            Obj.mapWithKeys(intKeyed, (value, key) => {
                seen.push(key);

                return { [String(key)]: value };
            });
            Obj.sort(intKeyed, (_value, key) => {
                seen.push(key);

                return 0;
            });
            Obj.sortDesc(intKeyed, (_value, key) => {
                seen.push(key);

                return 0;
            });
            expect(() =>
                Obj.sole(intKeyed, (_value, key) => {
                    seen.push(key);

                    return false;
                }),
            ).toThrow(ItemNotFoundException);
            Obj.keyBy({ 1: { id: 1 }, x: { id: 2 } }, (_item, key) => {
                seen.push(key);

                return String(key);
            });
            Obj.mapSpread({ 1: ["a"], x: ["b"] }, (...args) => {
                seen.push(args.at(-1));

                return args.length;
            });

            expect(seen.filter((key) => key === 1)).toHaveLength(6);
            expect(seen).not.toContain("1");
        });

        it("hands the key comparator integer keys as numbers", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "callback-key diffKeysUsing"
            const seen: unknown[] = [];
            const record = (a: unknown, b: unknown) => {
                seen.push(a, b);

                return a === b;
            };

            Obj.diffKeysUsing(intKeyed, { 1: "z" }, record);
            Obj.diffAssocUsing(intKeyed, { 1: "a" }, record);
            Obj.intersectAssocUsing(intKeyed, { 1: "a" }, record);

            expect(seen).toContain(1);
            expect(seen).not.toContain("1");
        });
    });
});

// Only JSON.parse produces a real own enumerable "__proto__" key; a literal
// `{ __proto__: ... }` sets the prototype at construction time instead.
const HOSTILE = () =>
    JSON.parse('{"a":1,"__proto__":{"polluted":true},"c":3}') as Record<
        string,
        unknown
    >;

describe("computed-key writes treat __proto__ as data, not a prototype", () => {
    afterEach(() => {
        // Every case below writes into a *fresh* result object; none of them
        // should ever be able to touch the shared Object.prototype itself.
        expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    });

    describe.each([
        [
            // Object.fromEntries uses CreateDataProperty, not [[Set]], so the inner
            // chunk object is already safe; this pins that behaviour against a future
            // refactor to a bracket-assign loop, which would reintroduce the bug.
            "chunk",
            () => Obj.chunk(HOSTILE(), 3, true)[0],
        ],
        ["map", () => Obj.map(HOSTILE(), (v) => v)],
        [
            "mapWithKeys",
            () => Obj.mapWithKeys(HOSTILE(), (v, k) => ({ [k]: v })),
        ],
        [
            "mapSpread",
            () => Obj.mapSpread(HOSTILE(), () => ({ polluted: true })),
        ],
        [
            "pluck",
            () =>
                Obj.pluck(
                    { item1: { flag: { polluted: true } } },
                    "flag",
                    () => "__proto__",
                ),
        ],
        [
            "keyBy",
            () => Obj.keyBy({ item1: { polluted: true } }, () => "__proto__"),
        ],
        ["prependKeysWith", () => Obj.prependKeysWith(HOSTILE(), "")],
        ["only", () => Obj.only(HOSTILE(), ["a", "__proto__"])],
        [
            "onlyValues",
            () => {
                const h = HOSTILE();
                return Obj.onlyValues(h, h["__proto__"]);
            },
        ],
        ["exceptValues", () => Obj.exceptValues(HOSTILE(), [999])],
        ["take", () => Obj.take(HOSTILE(), 3)],
        ["flattenDot", () => Obj.flattenDot(HOSTILE(), 0)],
        ["dot", () => Obj.dot(HOSTILE(), "", 0)],
        [
            "from (Map key)",
            () =>
                Obj.from(
                    new Map<string, unknown>([
                        ["a", 1],
                        ["__proto__", { polluted: true }],
                        ["c", 3],
                    ]),
                ),
        ],
        [
            "select",
            () =>
                Obj.select(
                    JSON.parse(
                        '{"__proto__":{"a":1,"__proto__":{"polluted":true}},"b":2}',
                    ),
                    ["a", "__proto__"],
                ),
        ],
        ["prepend", () => Obj.prepend(HOSTILE(), "prepended", "z")],
        ["random", () => Obj.random(HOSTILE(), 3, true)],
        ["sort", () => Obj.sort(HOSTILE())],
        ["sortDesc", () => Obj.sortDesc(HOSTILE())],
        ["sortRecursive", () => Obj.sortRecursive(HOSTILE())],
        ["where", () => Obj.where(HOSTILE(), () => true)],
        ["reject", () => Obj.reject(HOSTILE(), () => false)],
        ["whereNotNull", () => Obj.whereNotNull(HOSTILE())],
        ["reverse", () => Obj.reverse(HOSTILE())],
        ["pad", () => Obj.pad(HOSTILE(), 5, 0)],
        ["partition (passed)", () => Obj.partition(HOSTILE(), () => true)[0]],
        ["partition (failed)", () => Obj.partition(HOSTILE(), () => false)[1]],
        ["diff", () => Obj.diff(HOSTILE(), {})],
        [
            "diffAssocUsing",
            () => Obj.diffAssocUsing(HOSTILE(), {}, () => false),
        ],
        ["diffKeysUsing", () => Obj.diffKeysUsing(HOSTILE(), {}, () => false)],
        [
            "intersect",
            () => {
                const h = HOSTILE();
                return Obj.intersect(h, h);
            },
        ],
        [
            "intersectAssoc",
            () => {
                const h = HOSTILE();
                return Obj.intersectAssoc(h, h);
            },
        ],
        [
            "intersectAssocUsing",
            () => {
                const h = HOSTILE();
                return Obj.intersectAssocUsing(h, h, (a, b) => a === b);
            },
        ],
        [
            "intersectByKeys",
            () => {
                const h = HOSTILE();
                return Obj.intersectByKeys(h, h);
            },
        ],
        ["collapse", () => Obj.collapse({ group1: HOSTILE() })],
    ] as [string, () => unknown][])("%s", (_name, run) => {
        it("treats __proto__ as data, not as a prototype", () => {
            const result = run();

            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
            expect(Object.hasOwn(result as object, "__proto__")).toBe(true);
            expect((result as { polluted?: boolean }).polluted).toBeUndefined();
        });
    });

    it("shuffle renumbers a __proto__ key away and leaves Object.prototype untouched", () => {
        // docs/php-parity/task-23-obj-release-readiness.json, "shuffle-assoc-keys"
        const result = Obj.shuffle(HOSTILE());

        expect(Object.keys(result)).toEqual(["0", "1", "2"]);
        expect(Object.hasOwn(result, "__proto__")).toBe(false);
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    });
});

// Object.prototype passes `isObjectAny` and Array.prototype passes `isArray`,
// so a write target has to be refused by identity, not by its shape.
describe("prototype objects as write targets", () => {
    const prototypes: [string, object][] = [
        ["Object.prototype", Object.prototype],
        ["Array.prototype", Array.prototype],
        ["Function.prototype", Function.prototype],
    ];

    afterEach(() => {
        for (const [, prototype] of prototypes) {
            const record = prototype as Record<string, unknown>;
            delete record["PWNED"];
            delete record["0"];
        }
        Array.prototype.length = 0;
    });

    const unpolluted = (): void => {
        for (const [, prototype] of prototypes) {
            expect(Object.getOwnPropertyNames(prototype)).not.toContain(
                "PWNED",
            );
            expect(Object.getOwnPropertyNames(prototype)).not.toContain("0");
        }
        expect(Array.prototype.length).toBe(0);
        expect(({} as { PWNED?: unknown }).PWNED).toBeUndefined();
        expect(([] as unknown as { PWNED?: unknown }).PWNED).toBeUndefined();
    };

    it.each(prototypes)(
        "set never writes into %s reached through an object key",
        (_label, prototype) => {
            Obj.set({ p: prototype }, "p.PWNED", 1);
            Obj.set({ p: prototype }, "p.0", 1);
            Obj.set(prototype, "PWNED", 1);

            unpolluted();
        },
    );

    it.each(prototypes)(
        "set never writes into %s reached through an array element",
        (_label, prototype) => {
            Obj.set({ p: [prototype] }, "p.0.PWNED", 1);
            Obj.set({ p: [prototype] }, "p.0.0", 1);

            unpolluted();
        },
    );

    it.each(prototypes)(
        "add and unshift never write into %s",
        (_label, prototype) => {
            Obj.add({ p: prototype }, "p.PWNED", 1);
            Obj.add(prototype, "PWNED", 1);
            Obj.unshift(prototype, 1);

            unpolluted();
        },
    );
});

/**
 * The runtime half of follow-up F-17's type-soundness limits. Each case answers something the
 * declared type does not say; `obj-residuals.test-d.ts` pins the declared side, so a fix to
 * either one fails the other and both notes get rewritten together.
 */
describe("F-17 residual limits: what the runtime answers where the type disagrees", () => {
    class Pt {
        x = 1;

        m(): number {
            return 1;
        }
    }

    class Sized {
        x = 1;
        y = 2;
    }

    it("skips a class instance in collapse", () => {
        // docs/php-parity/task-23-obj-release-readiness.json, "collapse-skips-objects",
        // "assoc-object-item": ['g1' => ['a' => 1], 'g2' => (object) ['b' => 2]] answers
        // {"a": 1}, and "only-object" answers [] — an object contributes nothing.
        expect(Obj.collapse({ g1: { a: 1 }, g2: new Pt() })).toEqual({ a: 1 });
        expect(Obj.collapse({ g2: new Pt() })).toEqual({});
    });

    it("keeps a class instance as one leaf in flatten", () => {
        // docs/php-parity/task-23-obj-release-readiness.json, "flatten-object-leaf",
        // "map": Arr::flatten(['a' => $object, ...]) keeps $object itself as a leaf.
        expect(Obj.flatten({ a: new Sized() })).toEqual([new Sized()]);
        expect(Obj.flatten({ a: new Sized() })[0]).toBeInstanceOf(Sized);
    });

    it("replaces a class instance whole in replaceRecursive", () => {
        // docs/php-parity/task-23-obj-release-readiness.json, "replaceRecursive-object-leaf",
        // "p": ['p' => (object) ['x' => 1]] under ['p' => ['y' => 2]] answers {"y": 2} —
        // PHP recurses into two arrays only, so the object is replaced, never merged.
        expect(
            Obj.replaceRecursive({ a: new Sized() }, { a: { x: 5 } }),
        ).toEqual({ a: { x: 5 } });
    });

    it("keeps a typed array whole in flatten", () => {
        // JS-only: PHP has no typed array. It is not a plain object, so the same
        // leaf rule that keeps a Date keeps this.
        const flattened = Obj.flatten({ a: new Uint8Array([1]) });

        expect(flattened).toHaveLength(1);
        expect(flattened[0]).toBeInstanceOf(Uint8Array);
    });

    it("unwraps an optional all() member in collapse and flatten", () => {
        // JS-only: PHP has no optional method; the unwrap tests `is_callable`, which
        // an optional member passes at runtime and no type can promise.
        const row = { all: () => [1, 2] } as { all?: () => number[] };

        expect(Obj.collapse({ a: { all: () => ({ x: 1 }) } })).toEqual({
            x: 1,
        });
        expect(Obj.flatten({ a: row })).toEqual([1, 2]);
        expect(Obj.flatten({ a: row }, 1)).toEqual([1, 2]);
    });

    it("casts a combine key the way PHP's (string) cast prints a number", () => {
        // docs/php-parity/task-24-data-release-readiness.json,
        // "d6-combine-key-cast-minus-zero-and-1e19": PHP stores "-0" and "1.0E+19",
        // neither of which TypeScript's own `${n}` spells that way.
        expect(Object.keys(Obj.combine([-0, 1e19], ["a", "b"]))).toEqual([
            "-0",
            "1.0E+19",
        ]);
    });

    it("misses a user class's prototype method in get", () => {
        // JS-only: PHP has no prototype chain, so no call records this. Only own keys
        // are read, so the path resolves to the default.
        expect(Obj.get({ p: new Pt() }, "p.m")).toBeNull();
    });

    it("answers an empty object for top-level Date data and sorts a tuple in sortRecursive", () => {
        // JS-only: a Date has no own enumerable keys, so there is nothing to copy;
        // a tuple is a list at runtime, so its values sort like any other list's.
        expect(Obj.sortRecursive(new Date(0))).toEqual({});
        expect(Obj.sortRecursive({ t: [2, 1] })).toEqual({ t: [1, 2] });
    });

    it("mutates a Map in unshift and builds a fresh record for a Set", () => {
        // JS-only: PHP has neither. A Map is object-accessible, so unshift writes
        // through it; a Set is not, so it takes the fresh-record branch.
        const map = new Map([["a", 1]]);
        const mapResult = Obj.unshift(map, "x");

        expect(mapResult).toBe(map);
        expect(Object.keys(map)).toEqual(["0"]);
        expect([...map.entries()]).toEqual([["a", 1]]);

        const set = new Set([1]);
        const setResult = Obj.unshift(set, "x", "y");

        expect(setResult).not.toBe(set);
        expect(setResult).toEqual({ 0: "x", 1: "y" });
        expect([...set.values()]).toEqual([1]);
    });
});
