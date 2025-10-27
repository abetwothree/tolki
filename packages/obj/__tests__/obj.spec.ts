import * as Obj from "@laravel-js/obj";
import { describe, expect,it } from "vitest";

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
        });

        it("should not add a value if key exists", () => {
            const obj = { name: "John", age: 25 };
            const result = Obj.add(obj, "age", 30);
            expect(result).toEqual({ name: "John", age: 25 });
        });

        it("should add nested values using dot notation", () => {
            const obj = { user: { name: "John" } };
            const result = Obj.add(obj, "user.age", 30);
            expect(result).toEqual({ user: { name: "John", age: 30 } });
        });

        it("should add to empty objects", () => {
            const obj = {};
            const result = Obj.add(obj, "name", "John");
            expect(result).toEqual({ name: "John" });
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
        const baseData = {'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5};
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
        expect(Obj.chunk('', 5)).toEqual({});
        expect(Obj.chunk(false, 2)).toEqual({});
    });

    describe("combine", () => {
        it("should combine two objects into an object", () => {
            const keys = { 1: 'name', 2: 'family', 3: () => 'callback', 4: undefined };
            const values = { 0: "John", 1: "Doe", 2: 58 };
            expect(Obj.combine(keys, values)).toEqual({
                name: "John",
                family: "Doe",
                callback: 58,
            });
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
            expect(Obj.dot('')).toEqual({});
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
    });

    describe("union", () => {
        it("test union null", () => {
            expect(Obj.union(null, { a: 1 })).toEqual({ a: 1 });
            expect(Obj.union({ a: 1 }, null)).toEqual({ a: 1 });
        });

        it("union objects", () => {
            expect(Obj.union({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
            expect(Obj.union({ a: 1 }, { a: 2 })).toEqual({ a: 1 });
            expect(Obj.union({ a: "house", b: 3, c: 4 }, { a: "home", b: 2 }, {d: 5})).toEqual({ a: "house", b: 3, c: 4, d: 5});
        });
    });

    describe("unshift", () => {
        it("unshift objects", () => {
            expect(Obj.unshift({ b: 2 }, { a: 1 }, {d: "house"})).toEqual({ a: 1, d: "house", b: 2 }); 
        });

        it("test unshift null", () => {
            expect(Obj.unshift(null, { a: 1 })).toEqual({ a: 1 });
            expect(Obj.unshift({ a: 1 }, null)).toEqual({ a: 1 });
        });

        it("unshift with one object or none", () => {
            expect(Obj.unshift({ a: 1 })).toEqual({ a: 1 });
            expect(Obj.unshift()).toEqual({});
        });

        it('test order of keys', () => {
            expect(Obj.unshift({ c: 3 }, { a: 1, b: 2 })).toEqual({ a: 1, b: 2, c: 3 });
            expect(Obj.unshift({ a: 10, b: 20 }, { a: 1, b: 2 })).toEqual({ a: 1, b: 2});
        })
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
    });

    describe("from", () => {
        it("should create object from callback results", () => {
            const items = [1, 2, 3];
            const result = Obj.from(items);
            expect(result).toEqual({ 0: 1, 1: 2, 2: 3 });
        });

        it("should return an object", () => {
            const items = {a: 1, b: 2, c: 3};
            const result = Obj.from(items);
            expect(result).toEqual({a: 1, b: 2, c: 3 });
        });

        it("should return the values of a Map", () => {
            const keys = new Map([
                ['name', 'John'],
                ['age', 30],
                ['city', 'NYC'],
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
                "0": [
                    "name",
                    "John",
                ],
                "1": [
                    "age",
                    30,
                ],
                "2": [
                    "city",
                    "NYC",
                ],
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

        it("should handle non-object data", () => {
            expect(Obj.get("string", "key", "default")).toBe("default");
            expect(Obj.get(null, "key", "default")).toBe("default");
        });

        it("should handle numeric keys", () => {
            const obj = { "123": "value" };
            expect(Obj.get(obj, 123)).toBe("value");
        });

        it("should call function defaults", () => {
            expect(Obj.get({}, "missing", () => "function-default")).toBe(
                "function-default",
            );
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
    });

    describe("hasAny", () => {
        it("should return true when any key exists", () => {
            const obj = { name: "John", age: 30 };
            expect(Obj.hasAny(obj, ["name", "email"])).toBe(true);
            expect(Obj.hasAny(obj, ["email", "phone"])).toBe(false);
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

        it("should pass key to callback", () => {
            const obj = { a: 1, b: 2, aa: 3 };
            const result = Obj.filter(obj, (_value, key) => typeof key === "string" && key.length === 1);
            expect(result).toEqual({ a: 1, b: 2 });
        });

        it("should handle empty objects", () => {
            expect(Obj.filter({})).toEqual({});
        });

        it("should handle non-accessible data", () => {
            expect(Obj.filter(null)).toEqual({});
            expect(Obj.filter([])).toEqual({});
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
        it("should find values in object", () => {
            const obj = { name: "John", age: 30, city: "NYC" };
            expect(Obj.contains(obj, "John")).toBe(true);
            expect(Obj.contains(obj, 30)).toBe(true);
            expect(Obj.contains(obj, "Jane")).toBe(false);
        });

        it("should not find nested values", () => {
            const obj = { user: { name: "John" } };
            expect(Obj.contains(obj, "John")).toBe(false);
        });

        it("should handle non-accessible data", () => {
            expect(Obj.contains(null, "value")).toBe(false);
            expect(Obj.contains([], "value")).toBe(false);
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
            expect(result).toEqual([2, 3]);
            expect(obj).toEqual({ a: 1 });
        });

        it("should remove and return last items", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.pop(obj, 5);
            expect(result).toEqual([1, 2, 3]);
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
    });

    describe("flatten", () => {
        it("should flatten nested objects", () => {
            const obj = {
                users: { john: { name: "John" }, jane: { name: "Jane" } },
                posts: { "1": { title: "Hello" } },
            };
            expect(Obj.flatten(obj, 1)).toEqual({
                "users.john": { name: "John" },
                "users.jane": { name: "Jane" },
                "posts.1": { title: "Hello" },
            });
        });

        it("should handle depth parameter", () => {
            const obj = { a: { b: { c: { d: "value" } } } };
            expect(Obj.flatten(obj, 2)).toEqual({ "a.b.c": { d: "value" } });
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

        it("should handle recursively flip values with child objects and child arrays", () => {
            const obj = { a: 1, b: { x: 10, y: 20 }, c: [ 'p', 'q' ] };
            expect(Obj.flip(obj)).toEqual({ 1: "a", 10: "b.x", 20: "b.y", "c": { "p": 0, "q": 1}});
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
    });

    describe("join", () => {
        it("should return empty string for non-object values", () => {
            expect(Obj.join(null, ',')).toBe("");
            expect(Obj.join(undefined, ',')).toBe("");
            expect(Obj.join(42, ',')).toBe("");
            expect(Obj.join("string", ',')).toBe("");
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
            const obj = { tags: ["js", "ts", null, undefined, { home: "page" }] };
            expect(Obj.query(obj)).toBe("tags[0]=js&tags[1]=ts&tags[4][home]=page");
        });

        it("should handle when query is null or undefined", () => {
            expect(Obj.query(null)).toBe("");
            expect(Obj.query(undefined)).toBe("");
        });

        it("should handle passing in scalar values", () => {
            expect(Obj.query(42)).toBe("0=42");
            expect(Obj.query("house")).toBe("0=house");
        });
    });

    describe("random", () => {
        it("should return single random value", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Obj.random(obj);
            expect([1, 2, 3]).toContain(result);
        });

        it("handle a single item object", () => {
            const obj = {};
            expect(Obj.random(obj)).toBeNull();
            expect(Obj.random(obj, 0)).toEqual({});
        });

        it("should return multiple random values", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Obj.random(obj, 2) as Record<string, unknown>;
            expect(Object.keys(result)).toHaveLength(2);
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

            const resultMultiple = Obj.shift(obj, 3);
            expect(resultMultiple).toEqual([]);
            expect(obj).toEqual({});
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

            expect(() => Obj.sole(obj, (value) => (value as number) > 3)).toThrow("No items found");
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
                const obj = { a: 0, b: null, c: undefined, d: false, e: [] };
                const result = Obj.sort(obj);
                expect(Object.values(result)).toEqual([0, null, undefined, false, []]);
            });

            it("should handle a few values are falsy", () => {
                const obj = { x: 1000, a: {}, b: 1, c: 2, d: [], y: 1000 };
                const result = Obj.sort(obj);
                expect(Object.values(result)).toEqual([{}, [], 1, 2, 1000, 1000]);
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

            it("should handle missing keys", () => {
                const obj = {
                    user1: { name: "John" },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sort(obj, "age");
                expect(Object.keys(result)).toEqual(["user1", "user2"]);
            });

            it("should handle when values are falsy", () => {
                const obj = {
                    user1: { name: "John", age: 0 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                };
                const result = Obj.sort(obj, "age");
                expect(Object.keys(result)).toEqual(["user1", "user2", "user3"]);
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
                expect(Object.keys(result)).toEqual(["user2", "user4", "user5", "user3", "user1", "user0", "user6"]);
            });
        });

        describe("sort callback is function", () => {
            it("should sort by callback", () => {
                const obj = {
                    user1: { name: "John", age: 30 },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sort(
                    obj,
                    (item) => (item as Record<string, unknown>)["age"],
                );
                expect(Object.keys(result)).toEqual(["user2", "user1"]);
            });

            it("should handle missing keys in callback", () => {
                const obj = {
                    user1: { name: "John" },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sort(
                    obj,
                    (item) => (item as Record<string, unknown>)["age"],
                );
                expect(Object.keys(result)).toEqual(["user1", "user2"]);
            });

            it("should handle when values are falsy in callback", () => {
                const obj = {
                    user1: { name: "John", age: 0 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                };
                const result = Obj.sort(
                    obj,
                    (item) => (item as Record<string, unknown>)["age"],
                );
                expect(Object.keys(result)).toEqual(["user2", "user1", "user3"]);
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
                const result = Obj.sort(
                    obj,
                    (item) => (item as Record<string, unknown>)["age"],
                );
                expect(Object.keys(result)).toEqual(["user2", "user4", "user3", "user1", "user0", "user5", "user6"]);
            });
        });

        it("should handle non-objects", () => {
            expect(Obj.sort(null)).toEqual({});
            expect(Obj.sort([])).toEqual({});
        });
    });

    describe("sortDesc", () => {
        it("should handle non-object data", () => {
            expect(Obj.sortDesc(null)).toEqual({});
            expect(Obj.sortDesc([])).toEqual({});
        });

        describe("sort.objects", () => {
            it("should sort in descending order", () => {
                const obj = { y: 100, a: 1, c: 3, b: 2, x: 100 };
                const result = Obj.sortDesc(obj);
                expect(Object.values(result)).toEqual([100, 100, 3, 2, 1]);
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
                expect(Object.keys(result)).toEqual(["user3", "user1", "user2"]);
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
                expect(Object.keys(result)).toEqual(["user0", "user6", "user1", "user3", "user4", "user2", "user5"]);
            });
        });

        describe("sort callback is function", () => {
            it("should handle when the callback is provided", () => {
                const obj = { a: 1, c: 3, b: 2 };
                const result = Obj.sortDesc(obj, (value) => -(value as number));
                expect(Object.values(result)).toEqual([1, 2, 3]);

                const result2 = Obj.sortDesc(obj, (value) => (value as number));
                expect(Object.values(result2)).toEqual([3, 2, 1]);

                const result3 = Obj.sortDesc({x: 100, a: 3, c: 3, b: 3, y: 100 }, (value) => (value as number));
                expect(Object.values(result3)).toEqual([100, 100, 3, 3, 3]);
            });

            it("should handle missing keys in callback", () => {
                const obj = {
                    user1: { name: "John" },
                    user2: { name: "Jane", age: 25 },
                };
                const result = Obj.sortDesc(
                    obj,
                    (item) => (item as Record<string, unknown>)["age"],
                );
                expect(Object.keys(result)).toEqual(["user1", "user2"]);
            });

            it("should handle when values are falsy in callback", () => {
                const obj = {
                    user1: { name: "John", age: 0 },
                    user2: { name: "Jane", age: null },
                    user3: { name: "Doe", age: 25 },
                };
                const result = Obj.sortDesc(
                    obj,
                    (item) => (item as Record<string, unknown>)["age"],
                );
                expect(Object.keys(result)).toEqual(["user3", "user1", "user2"]);
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
                const result = Obj.sortDesc(
                    obj,
                    (item) => (item as Record<string, unknown>)["age"],
                );
                expect(Object.keys(result)).toEqual(["user0", "user1", "user3", "user5", "user6", "user2", "user4"]);
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
            const obj = { b: { d: 2, c: 1, z: 50, y: 55, x: 50 }, a: { f: 4, e: 3, x: 100, y: 100 } };
            const result = Obj.sortRecursive(obj);
            expect(Object.keys(result)).toEqual(["a", "b"]);
            expect(Object.keys(result["a"] as Record<string, unknown>)).toEqual(
                ["e", "f", "x", "y"],
            );
            expect(Object.keys(result["b"] as Record<string, unknown>)).toEqual(
                ["c", "d", "x", "y", "z"],
            );

            const resultDesc = Obj.sortRecursive(obj, true);
            expect(Object.keys(resultDesc)).toEqual(["b", "a"]);
            expect(Object.keys(resultDesc["a"] as Record<string, unknown>)).toEqual(
                ["y", "x", "f", "e"],
            );
            expect(Object.keys(resultDesc["b"] as Record<string, unknown>)).toEqual(
                ["z", "y", "x", "d", "c"],
            );
        });

        it("should recursively sort object with arrays", () => {
            const obj = { b: { d: [3, 1, 2, 3], c: 1 }, a: { f: 4, e: 3 } };
            const result = Obj.sortRecursive(obj);

            expect(Object.keys(result)).toEqual(["a", "b"]);
            expect(Object.keys(result["a"])).toEqual(
                ["e", "f"],
            );
            expect(Object.keys(result["b"])).toEqual(
                ["c", "d"],
            );
            expect(result["b"]["d"]).toEqual([1, 2, 3, 3]);

            const resultDesc = Obj.sortRecursive(obj, true);
            expect(Object.keys(resultDesc)).toEqual(["b", "a"]);
            expect(Object.keys(resultDesc["a"])).toEqual(
                ["f", "e"],
            );
            expect(Object.keys(resultDesc["b"])).toEqual(
                ["d", "c"],
            );
            expect(resultDesc["b"]["d"]).toEqual([3, 3, 2, 1]);
        });
    });

    describe("sortRecursiveDesc", () => {
        it("should recursively sort in descending order", () => {
            const obj = { a: { e: 3, f: 4 }, b: { c: 1, d: 2 } };
            const result = Obj.sortRecursiveDesc(obj);
            expect(Object.keys(result)).toEqual(["b", "a"]);
        });
    });

    describe("toCssClasses", () => {
        it("should convert to CSS classes", () => {
            const obj = { "font-bold": true, "text-red": false, "mt-4": true };
            expect(Obj.toCssClasses(obj)).toBe("font-bold mt-4");
        });

        it("should handle empty objects", () => {
            expect(Obj.toCssClasses({})).toBe("");
        });
    });

    describe("toCssStyles", () => {
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
    });

    describe("where", () => {
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

    describe("partition", () => {
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
});
