import * as Arr from "@tolki/arr";
import { SortDirection } from "@tolki/enum";
import * as Obj from "@tolki/obj";
import { isString } from "@tolki/utils";
import { afterEach, assertType, describe, expect, it } from "vitest";

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
    });

    describe("add", () => {
        it("should add a value if key doesn't exist", () => {
            const obj = { name: "John" };
            const result = Obj.add(obj, "age", 30);
            expect(result).toEqual({ name: "John", age: 30 });
            expect(result).not.toBe(obj); // should be immutable
            // @ts-expect-error - add() returns Record<TKey, TValue>, not the expanded shape
            assertType<{ name: string; age: number }>(result);
        });

        it("should not add a value if key exists", () => {
            const obj = { name: "John", age: 25 };
            const result = Obj.add(obj, "age", 30);
            expect(result).toEqual({ name: "John", age: 25 });
            // @ts-expect-error - add() returns Record<TKey, TValue> with widened value union
            assertType<{ name: string; age: number }>(result);
        });

        it("should add nested values using dot notation", () => {
            const obj = { user: { name: "John" } };
            const result = Obj.add(obj, "user.age", 30);
            expect(result).toEqual({ user: { name: "John", age: 30 } });
            // @ts-expect-error - add() returns Record<TKey, TValue>, not the expanded nested shape
            assertType<{ user: { name: string; age: number } }>(result);
        });

        it("should add to empty objects", () => {
            const obj = {};
            const result = Obj.add(obj, "name", "John");
            expect(result).toEqual({ name: "John" });
            // @ts-expect-error - add() returns Record<never, never> for empty object input
            assertType<{ name: string }>(result);
        });

        it("should preserve type when nested key exists", () => {
            const obj = { user: { name: "John", age: 25 } };
            const result = Obj.add(obj, "user.age", 30);
            expect(result).toEqual({ user: { name: "John", age: 25 } });
            // Type should remain unchanged when nested key exists
            assertType<{ user: { name: string; age: number } }>(result);
        });
    });

    describe("array", () => {
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

        it("should throw error for non-array values", () => {
            const obj = [{ name: "John" }];
            expect(() => Obj.objectItem(obj, "name")).toThrow(
                "Object value for key [name] must be an object, null found.",
            );
        });

        it("should throw error for non-object scalar values", () => {
            const obj = { name: "John" };
            expect(() => Obj.objectItem(obj, "name")).toThrow(
                "Object value for key [name] must be an object, string found.",
            );
        });

        it("should return default value if key not found and default is array", () => {
            const obj = { name: "John" };
            expect(Obj.objectItem(obj, "missing", { default: 1 })).toEqual({
                default: 1,
            });
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

        it("should return default value if key not found and default is boolean", () => {
            const obj = { name: "John" };
            expect(Obj.boolean(obj, "missing", false)).toBe(false);
        });
    });

    it("chunk", () => {
        const baseData = { a: 1, b: 2, c: 3, d: 4, e: 5 };
        expect(Obj.chunk(baseData, 2)).toEqual({
            0: { a: 1, b: 2 },
            1: { c: 3, d: 4 },
            2: { e: 5 },
        });

        expect(Obj.chunk(baseData, 2, true)).toEqual({
            0: { a: 1, b: 2 },
            1: { c: 3, d: 4 },
            2: { e: 5 },
        });

        expect(Obj.chunk(baseData, 2, false)).toEqual({
            0: { 0: 1, 1: 2 },
            1: { 0: 3, 1: 4 },
            2: { 0: 5 },
        });

        expect(Obj.chunk(baseData, 0)).toEqual({});
        expect(Obj.chunk(baseData, -2)).toEqual({});
        expect(Obj.chunk(null, 4)).toEqual({});
        expect(Obj.chunk("", 5)).toEqual({});
        expect(Obj.chunk(false, 2)).toEqual({});
    });

    describe("combine", () => {
        it("should combine two objects into an object", () => {
            // Four keys, four values — equal counts, so this exercises an
            // `undefined`-valued key without tripping the count-mismatch guard.
            // Function-key resolution moved to its own test below.
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
                undefined: "N/A",
            });
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
    });

    describe("collapse", () => {
        it("should collapse object of objects into single object", () => {
            const obj = { a: { x: 1 }, b: { y: 2 }, c: { z: 3 } };
            expect(Obj.collapse(obj)).toEqual({ x: 1, y: 2, z: 3 });
        });

        it("should merge overlapping keys with later values winning", () => {
            const obj = { a: { x: 1, y: 2 }, b: { x: 3, z: 4 } };
            expect(Obj.collapse(obj)).toEqual({ x: 3, y: 2, z: 4 });
        });

        it("should handle empty objects", () => {
            expect(Obj.collapse({})).toEqual({});
        });

        it("should skip non-object values", () => {
            const obj = { a: { x: 1 }, b: "string", c: { y: 2 } };
            expect(
                Obj.collapse(
                    obj as unknown as Record<string, Record<string, unknown>>,
                ),
            ).toEqual({ x: 1, y: 2 });
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

        it("should handle prepend", () => {
            const obj = { name: "John" };
            expect(Obj.dot(obj, "user")).toEqual({ "user.name": "John" });
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

            // Depth 1 with prepend
            expect(Obj.dot({ user: { name: "Taylor" } }, "prefix", 1)).toEqual({
                "prefix.user.name": "Taylor",
            });
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

        it("does not reparent through unshift, which delegates to union", () => {
            const hostile = JSON.parse('{"a":1,"__proto__":{"polluted":true}}');

            const result = Obj.unshift(hostile, 9);

            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        });
    });

    describe("unshift", () => {
        it("prepends onto the source, like array_unshift", () => {
            const data = { b: 2 };
            Obj.unshift(data, { a: 1 });
            expect(data).toEqual({ a: 1, b: 2 });
        });

        it("unshift objects", () => {
            expect(Obj.unshift({ b: 2 }, { a: 1 }, { d: "house" })).toEqual({
                a: 1,
                d: "house",
                b: 2,
            });
        });

        it("test unshift null", () => {
            expect(Obj.unshift(null, { a: 1 })).toEqual({ a: 1 });
            expect(Obj.unshift({ a: 1 }, null)).toEqual({ a: 1 });
        });

        it("unshift with one object or none", () => {
            expect(Obj.unshift({ a: 1 })).toEqual({ a: 1 });
            expect(Obj.unshift()).toEqual({});
        });

        it("test order of keys", () => {
            expect(Obj.unshift({ c: 3 }, { a: 1, b: 2 })).toEqual({
                a: 1,
                b: 2,
                c: 3,
            });
            expect(Obj.unshift({ a: 10, b: 20 }, { a: 1, b: 2 })).toEqual({
                a: 1,
                b: 2,
            });
        });

        it("assigns a scalar prepend item the next integer key, like array_unshift", () => {
            expect(Obj.unshift({ x: 1, y: 2 }, 9)).toEqual({
                0: 9,
                x: 1,
                y: 2,
            });
        });

        it("skips an already-used integer key when assigning scalar prepend items", () => {
            // The merged object item already claims key "0"; the scalar
            // item that follows must not collide with it.
            expect(Obj.unshift({ z: 3 }, { 0: "zero" }, 9)).toEqual({
                0: "zero",
                1: 9,
                z: 3,
            });
        });

        it("does not walk the prototype chain when checking for an existing key", () => {
            // Object.hasOwn, not `in` — a plain object's inherited
            // `toString` must not be treated as an already-used key.
            expect(Obj.unshift({ toString: 1, b: 2 }, { a: 9 })).toEqual({
                a: 9,
                toString: 1,
                b: 2,
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

        it("renumbers past an integer key a prepended object already claimed", () => {
            expect(
                Obj.unshift({ 0: "keep", 1: "also" }, { 0: "zero" }),
            ).toEqual({ 0: "zero", 1: "keep", 2: "also" });
        });

        it("keeps a negative-string key as-is instead of renumbering it", () => {
            // "-1" isn't a canonical JS array index (see the same case under
            // splice), so it's left alone rather than renumbered.
            const result = Obj.unshift({ "-1": "x", b: "y" }, 9);
            expect(result).toEqual({ 0: 9, "-1": "x", b: "y" });
        });

        it("keeps __proto__ as data when prepended, not reparenting the result", () => {
            // PHP-verified: array_unshift keeps "__proto__" as an ordinary key.
            const data = { b: 2 };
            const hostile = JSON.parse('{"__proto__":{"polluted":true},"x":5}');

            const result = Obj.unshift(data, hostile);

            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
            expect(Object.hasOwn(result, "__proto__")).toBe(true);
            expect((result as Record<string, unknown>)["__proto__"]).toEqual({
                polluted: true,
            });
            expect(Object.keys(result)).toEqual(["__proto__", "x", "b"]);
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
    });

    describe("from", () => {
        it("should create object from callback results", () => {
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

        it("should handle dot notation", () => {
            const obj = { user: { name: "John" } };
            expect(Obj.exists(obj, "user.name")).toBe(true);
            expect(Obj.exists(obj, "user.age")).toBe(false);
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
            expect(Obj.first(obj, (x: number) => x > 1)).toBe(2);
        });

        it("should return default when predicate finds no match", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.first(obj, (x: number) => x > 5, "none")).toBe("none");
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
            expect(Obj.last(obj, (x: number) => x < 3)).toBe(2);
        });

        it("should return default when predicate finds no match", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.last(obj, (x: number) => x > 5, "none")).toBe("none");
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

        it("should return undefined value when key exists but is undefined", () => {
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
    });

    describe("map", () => {
        it("should transform values", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.map(obj, (value) => (value as number) * 2);
            expect(result).toEqual({ a: 2, b: 4, c: 6 });
        });

        it("should pass key to callback", () => {
            const obj = { name: "john", email: "JOHN@EXAMPLE.COM" };
            const result = Obj.map(obj, (value, key) =>
                key === "name"
                    ? (value as string).toUpperCase()
                    : (value as string).toLowerCase(),
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
    });

    describe("filter", () => {
        it("should filter values with callback", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.filter(obj, (value) => (value as number) > 2);
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
        // false and null, but keeps "00" and "0.0", and NaN is truthy. PHP-verified in
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
            const result = Obj.filter(src) as Record<string, unknown>;
            expect((result as { polluted?: boolean }).polluted).toBeUndefined();
            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
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

        it("should replace entire object when key is null", () => {
            const result = Obj.set({ name: "John" }, null, { age: 30 });
            expect(result).toEqual({ age: 30 });
        });

        it("should handle deep nesting creation", () => {
            const result = Obj.set({}, "a.b.c.d", "value");
            expect(result).toEqual({ a: { b: { c: { d: "value" } } } });
        });

        it("should handle non-objects", () => {
            expect(Obj.set(null, "key", "value")).toEqual({});
            expect(Obj.set("string", "key", "value")).toEqual({});
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
            const obj = { age: 30 };
            expect(() => Obj.string(obj, "age")).toThrow(
                "Object value for key [age] must be a string, number found.",
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

        it("should return default value if key not found and default is number", () => {
            const obj = { name: "John" };
            expect(Obj.float(obj, "missing", 0.0)).toBe(0.0);
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
            const obj = { price: 19.99 };
            expect(() => Obj.integer(obj, "price")).toThrow(
                "Object value for key [price] must be an integer, number found.",
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

        it("is case-sensitive", () => {
            // Captured via docs/php-parity/task-06-setops.json ("diff is
            // case-sensitive"). CollectionTest.php:1582.
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
    });

    describe("intersectAssoc", () => {
        it("should return items where both key and value match", () => {
            const obj1 = { a: 1, b: 2, c: 3 };
            const obj2 = { a: 1, b: 20, d: 4 };
            expect(Obj.intersectAssoc(obj1, obj2)).toEqual({ a: 1 });
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
            // intersectAssoc keeps array_intersect_assoc semantics (CollectionTest.php:1800),
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
            expect(
                Obj.pluck<Record<string, number | string>, string>(
                    obj,
                    (item) => (item["age"] as number) * 2,
                ),
            ).toEqual([60, 50]);
        });

        it("should pluck values with function key selector", () => {
            const obj = {
                user1: { name: "John", age: 30 },
                user2: { name: "Jane", age: 25 },
            };
            expect(
                Obj.pluck<Record<string, number | string>, string>(
                    obj,
                    "name",
                    (item) => `user_${item["age"]}`,
                ),
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

        it("should remove and return last items", () => {
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
    });

    describe("every", () => {
        it("should return true if all items pass test", () => {
            const obj = { a: 2, b: 4, c: 6 };
            expect(Obj.every(obj, (value) => (value as number) % 2 === 0)).toBe(
                true,
            );
        });

        it("should return false if any item fails test", () => {
            const obj = { a: 2, b: 3, c: 6 };
            expect(Obj.every(obj, (value) => (value as number) % 2 === 0)).toBe(
                false,
            );
        });

        it("should return true for empty objects", () => {
            expect(Obj.every({}, () => false)).toBe(true);
        });

        it("should return empty object when non-object value passed in", () => {
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
            expect(Obj.some(obj, (value) => (value as number) % 2 === 0)).toBe(
                true,
            );
        });

        it("should return false if no items pass test", () => {
            const obj = { a: 1, b: 3, c: 5 };
            expect(Obj.some(obj, (value) => (value as number) % 2 === 0)).toBe(
                false,
            );
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
    });

    describe("keyBy", () => {
        it("should key object by callback result", () => {
            const obj = {
                user1: { id: 10, name: "John" },
                user2: { id: 20, name: "Jane" },
            };
            const result = Obj.keyBy(obj, (item) =>
                ((item as Record<string, unknown>)["id"] as number).toString(),
            );
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
            expect(
                Obj.keyBy(obj, (item) => item["name"] as string | null),
            ).toEqual({
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
    });

    describe("mapWithKeys", () => {
        it("should map with new keys", () => {
            const obj = { user1: "John", user2: "Jane" };
            const result = Obj.mapWithKeys(obj, (value, key) => ({
                [`name_${String(key)}`]: (value as string).toUpperCase(),
            }));
            expect(result).toEqual({ name_user1: "JOHN", name_user2: "JANE" });
        });

        it("should handle object values", () => {
            const obj = {
                john: { name: "John", age: 30 },
                jane: { name: "Jane", age: 25 },
            };
            const result = Obj.mapWithKeys(obj, (value) => ({
                [(value as Record<string, unknown>)["name"] as string]: (
                    value as Record<string, unknown>
                )["age"],
            }));
            expect(result).toEqual({ John: 30, Jane: 25 });
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
            const result = Obj.random(obj, 2) as Record<string, unknown>;
            expect(Object.keys(result)).toHaveLength(2);
        });

        it("reindexes from zero by default", () => {
            // Arr.php:971 defaults $preserveKeys = false.
            const result = Obj.random(
                { one: "foo", two: "bar", three: "baz" },
                2,
            ) as Record<string, unknown>;
            expect(Object.keys(result)).toEqual(["0", "1"]);
        });

        it("preserves original keys when preserveKeys is explicitly true", () => {
            const obj = { one: "foo", two: "bar", three: "baz" };
            const result = Obj.random(obj, 2, true) as Record<string, unknown>;
            expect(Object.keys(result)).toHaveLength(2);
            for (const key of Object.keys(result)) {
                expect(obj).toHaveProperty(key);
            }
        });

        it("should return multiple random values while not preserving keys", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.random(obj, 2, false) as Record<string, unknown>;
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

        it("should return null when number is explicitly null", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.random(obj, null);
            expect([1, 2, 3]).toContain(result);
        });
    });

    describe("shift", () => {
        it("should handle non-object data", () => {
            expect(Obj.shift(null)).toBeNull();
            expect(Obj.shift([])).toBeNull();
            expect(Obj.shift(null, 2)).toEqual([]);
            expect(Obj.shift([], 2)).toEqual([]);
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

        it("keeps a negative-string key as-is when reindexing the survivors", () => {
            // "-1" isn't a canonical JS array index (see the same case under
            // splice), so it survives instead of being swept into the renumbering.
            const data: Record<string, string> = { b: "y", "-1": "x", c: "z" };

            expect(Obj.shift(data)).toBe("y");
            expect(data).toEqual({ "-1": "x", c: "z" });
        });
    });

    describe("push", () => {
        it("should push to nested array", () => {
            const obj = { items: ["a", "b"] };
            const result = Obj.push(obj, "items", "c", "d");
            expect(result).toEqual({ items: ["a", "b", "c", "d"] });
        });

        it("should create new array if path doesn't exist", () => {
            const obj = {};
            const result = Obj.push(obj, "items", "a", "b");
            expect(result).toEqual({ items: ["a", "b"] });
        });

        it("should throw error for non-array values", () => {
            const obj = { name: "John" };
            expect(() => Obj.push(obj, "name", "value")).toThrow(
                "Cannot push to non-array value at key [name]",
            );
        });

        it("should handle non-object values", () => {
            const result = Obj.push(null, "items", "a");
            expect(result).toEqual({ items: ["a"] });

            const result2 = Obj.push("string", "items", "a");
            expect(result2).toEqual({ items: ["a"] });

            expect(() => Obj.push(null, null, "value")).toThrow(
                "Cannot push to root of non-object data when key is null",
            );
        });

        it("should throw error for key being null", () => {
            const obj = { name: "John" };
            expect(() => Obj.push(obj, null, "value")).toThrow(
                "Cannot push to root of object without specifying a key (key is null)",
            );
        });
    });

    describe("shuffle", () => {
        it("should shuffle object keys", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
            const result = Obj.shuffle(obj);

            // Should have same values
            expect(Object.values(result).sort()).toEqual([1, 2, 3, 4, 5]);
            // Should have same keys
            expect(Object.keys(result).sort()).toEqual([
                "a",
                "b",
                "c",
                "d",
                "e",
            ]);
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
            const result = Obj.slice(src, 0, 3) as Record<string, unknown>;
            expect((result as { polluted?: boolean }).polluted).toBeUndefined();
            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        });
    });

    describe("sole", () => {
        it("should return single item", () => {
            const obj = { only: 42 };
            expect(Obj.sole(obj)).toBe(42);
        });

        it("should throw error for empty objects", () => {
            expect(() => Obj.sole({})).toThrow("No items found");
        });

        it("should throw error for multiple items", () => {
            const obj = { a: 1, b: 2 };
            expect(() => Obj.sole(obj)).toThrow(
                "Multiple items found (2 items)",
            );
        });

        it("should work with callback", () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(Obj.sole(obj, (value) => (value as number) > 2)).toBe(3);

            expect(() =>
                Obj.sole(obj, (value) => (value as number) > 3),
            ).toThrow("No items found");
        });

        it("should handle non-objects", () => {
            expect(() => Obj.sole(null)).toThrow("No items found");
            expect(() => Obj.sole([])).toThrow("No items found");
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

            it("should handle when values are falsy", () => {
                // PHP ties 0, null and false (null_vs_zero/false_vs_zero [0,0] in
                // "asort over PHP-falsy mixed values") and puts [] last; compareValues
                // also hoists null/undefined - arr.spec.ts pins Arr.sort([null,3,1]).
                const obj = { a: 0, b: null, c: undefined, d: false, e: [] };
                expect(Object.values(Obj.sort(obj))).toEqual([
                    null,
                    undefined,
                    0,
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

            it("orders two empty containers by their JSON form", () => {
                // Mixing {} with numbers is not orderable at all - compareValues
                // ties {} with every number while ranking [] below them - so the
                // two containers are only comparable against each other.
                expect(Object.values(Obj.sort({ a: {}, d: [] }))).toEqual([
                    [],
                    {},
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
                // The branches were if/if/if, so a falsy string ran the natural
                // sort and then the field sort over it, reversing this pair. PHP
                // cannot arbitrate - Collection::sort("") throws TypeError.
                const source = { a: { "": 10 }, b: { "": 9 } };

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
                // The string-path form now shares compareValues with the
                // callback form, so it must land where "should handle when
                // values are falsy in callback" does: null ahead of 0.
                const obj = {
                    user1: { name: "John", age: 0 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                };
                const result = Obj.sort(obj, "age");
                expect(Object.keys(result)).toEqual([
                    "user2",
                    "user1",
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
                // null/undefined lead, then [] (which coerces to 0 against a
                // number), then the numbers ascending - ties keeping their
                // original order, so user0 stays ahead of user6.
                expect(Object.keys(result)).toEqual([
                    "user2",
                    "user5",
                    "user4",
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
                const result = Obj.sort<{ name: string; age?: number }>(
                    obj,
                    (item) => item.age,
                );
                expect(Object.keys(result)).toEqual(["user1", "user2"]);
            });

            it("should handle when values are falsy in callback", () => {
                const obj = {
                    user1: { name: "John", age: 0 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                };
                const result = Obj.sort(obj, (item) => item.age);
                expect(Object.keys(result)).toEqual([
                    "user2",
                    "user1",
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
                expect(Object.keys(result)).toEqual([
                    "user0",
                    "user6",
                    "user1",
                    "user3",
                    "user4",
                    "user2",
                    "user5",
                ]);
            });
        });

        describe("sort callback is function", () => {
            it("should handle when the callback is provided", () => {
                const obj = { a: 1, c: 3, b: 2 };
                const result = Obj.sortDesc(obj, (value) => -(value as number));
                expect(Object.values(result)).toEqual([1, 2, 3]);

                const result2 = Obj.sortDesc(obj, (value) => value as number);
                expect(Object.values(result2)).toEqual([3, 2, 1]);

                const result3 = Obj.sortDesc(
                    { x: 100, a: 3, c: 3, b: 3, y: 100 },
                    (value) => value as number,
                );
                expect(Object.values(result3)).toEqual([100, 100, 3, 3, 3]);
            });

            it("should handle missing keys in callback", () => {
                const obj = {
                    user1: { name: "John" },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sortDesc<{ name: string; age?: number }>(
                    obj,
                    (item) => item.age,
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
    });

    describe("splice", () => {
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

        it("clamps a negative length to no removal (known divergence from PHP)", () => {
            // Deliberate divergence: array_splice's negative length counts that many
            // elements back from the end, but this clamps to "remove nothing", matching
            // JS Array.prototype.splice and arr.splice.
            const obj = { a: 1, b: 2, c: 3 };
            const removed = Obj.splice(obj, 1, -1);
            expect(removed).toEqual({});
            expect(obj).toEqual({ a: 1, b: 2, c: 3 });
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

        it("keeps a negative-string key as-is instead of renumbering it", () => {
            // "-1" isn't a canonical JS array index, so our grammar leaves it alone —
            // unlike PHP, which casts "-1" to int(-1) and array_splice renumbers it too.
            const obj: Record<string, string> = { "-1": "x", b: "y", c: "z" };
            const removed = Obj.splice(obj, 1, 1);
            expect(removed).toEqual({ b: "y" });
            expect(obj).toEqual({ "-1": "x", c: "z" });
        });

        it("classifies keys by the array-index grammar, not by Number()'s notion of numeric", () => {
            // "0"/"1"/"42" are canonical indices and reindex; none of the rest are
            // (leading zero, sign, fraction, exponent, whitespace, hex, or empty).
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
                "-1": "D",
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
            const removed = Obj.splice(src, 1, 1) as Record<string, unknown>;
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
            // Review round 1. Captured: docs/php-parity/task-08-arr-parity.json
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
            // ("Arr::toCssStyles non-string value at numeric key") -> "123;;; 1;".
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
            const result = Obj.where(obj, (value) => (value as number) > 2);
            expect(result).toEqual({ c: 3, d: 4 });
        });

        it("should pass key to callback", () => {
            const obj = { name: "John", age: null, city: "NYC" };
            const result = Obj.where(obj, (value) => value !== null);
            expect(result).toEqual({ name: "John", city: "NYC" });
        });
    });

    describe("reject", () => {
        it("should reject items that pass test", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.reject(obj, (value) => (value as number) > 2);
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
            // getArrayableItems(null) -> [] (EnumeratesValues.php:1106); pinned by
            // CollectionTest.php:1482.
            expect(Obj.replace({ a: 1 }, null)).toEqual({ a: 1 });
        });

        it("does not reparent the object via a __proto__ key in the replacer", () => {
            const obj: Record<string, unknown> = { a: 1 };
            const replacer = JSON.parse(
                '{"__proto__":{"polluted":true}}',
            ) as Record<string, unknown>;
            const result = Obj.replace(obj, replacer) as Record<
                string,
                unknown
            >;
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

        it("silently ignores an array-shaped replacer forced past the type guard", () => {
            // Pinned as deliberate: array_replace(['a'=>1],['x']) merges by numeric key
            // in PHP, but Obj.replace's type surface only accepts a record or nullish
            // replacer, so an array-shaped replacer is out of contract here.
            const replacer = ["x"] as unknown as Record<PropertyKey, string>;
            expect(Obj.replace({ a: 1 }, replacer)).toEqual({ a: 1 });
        });
    });

    describe("pad", () => {
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

        it("keeps a negative-string key as-is instead of folding it into the pad sequence", () => {
            // "-1" isn't a canonical JS array index (see the same case under
            // splice), so it never joins the integer sequence pad slots are numbered against.
            expect(Obj.pad({ "-1": "x", b: "y" }, 3, "p")).toEqual({
                "-1": "x",
                b: "y",
                "0": "p",
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
            // getArrayableItems(null) -> [] (EnumeratesValues.php:1106); pinned by
            // CollectionTest.php:1524.
            expect(Obj.replaceRecursive({ a: 1 }, null)).toEqual({ a: 1 });
        });

        it("ignores __proto__ keys in replacer data, leaving the result's own prototype untouched", () => {
            // __proto__ skip is a deliberate JS-only divergence — PHP has no
            // accessor-key hazard for array_replace_recursive to guard against. `{
            // __proto__:...
            const obj = { a: 1 };
            const replacer = Object.create(null) as Record<string, unknown>;
            replacer["__proto__"] = { polluted: true };

            const result = Obj.replaceRecursive(obj, replacer) as Record<
                string,
                unknown
            >;

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
            // "-1" isn't a canonical JS array index (see the same case under
            // splice), so it's left alone rather than renumbered.
            const result = Obj.reverse({ "-1": "x", b: "y", c: "z" });
            expect(result).toEqual({ c: "z", b: "y", "-1": "x" });
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
            const [passed, failed] = Obj.partition(
                obj,
                (value) => (value as number) > 2,
            );
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
    });

    describe("mapSpread", () => {
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
    });

    describe("exceptValues", () => {
        it("test exceptValues", () => {
            const obj1 = { name: "taylor", age: 26, city: "austin" };
            expect(Obj.exceptValues(obj1, [26])).toEqual({
                name: "taylor",
                city: "austin",
            });
            expect(Obj.exceptValues(obj1, 26)).toEqual({
                name: "taylor",
                city: "austin",
            });

            const obj2 = { a: 1, b: 2, c: 1, d: 3 };
            expect(Obj.exceptValues(obj2, 1)).toEqual({ b: 2, d: 3 });

            const obj3 = { a: true, b: false, c: 1, d: 0 };
            expect(Obj.exceptValues(obj3, [1, 0], true)).toEqual({
                a: true,
                b: false,
            });
            expect(Obj.exceptValues(obj3, [1, 0])).toEqual({});
        });
    });

    describe("onlyValues", () => {
        it("test onlyValues", () => {
            const obj1 = { name: "taylor", age: 26, city: "austin" };
            expect(Obj.onlyValues(obj1, [26])).toEqual({ age: 26 });
            expect(Obj.onlyValues(obj1, 26)).toEqual({ age: 26 });

            const obj2 = { a: 1, b: 2, c: 1, d: 3 };
            expect(Obj.onlyValues(obj2, 1)).toEqual({ a: 1, c: 1 });

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
        ["shuffle", () => Obj.shuffle(HOSTILE())],
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
        [
            "collapse",
            () =>
                Obj.collapse({ group1: HOSTILE() } as Record<
                    PropertyKey,
                    Record<PropertyKey, unknown>
                >),
        ],
    ] as [string, () => unknown][])("%s", (_name, run) => {
        it("treats __proto__ as data, not as a prototype", () => {
            const result = run();

            expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
            expect(Object.hasOwn(result as object, "__proto__")).toBe(true);
            expect((result as { polluted?: boolean }).polluted).toBeUndefined();
        });
    });
});
