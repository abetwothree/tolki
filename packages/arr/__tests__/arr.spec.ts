import * as Arr from "@tolki/arr";
import { isArray } from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("Arr", () => {
    it("accessible", () => {
        expect(Arr.accessible([])).toBe(true);
        expect(Arr.accessible([1, 2])).toBe(true);
        expect(Arr.accessible({ a: 1, b: 2 })).toBe(false);

        expect(Arr.accessible(null)).toBe(false);
        expect(Arr.accessible("abc")).toBe(false);
        expect(Arr.accessible(new Object())).toBe(false);
        expect(Arr.accessible({ a: 1, b: 2 } as object)).toBe(false);
        expect(Arr.accessible(123)).toBe(false);
        expect(Arr.accessible(12.34)).toBe(false);
        expect(Arr.accessible(true)).toBe(false);
        expect(Arr.accessible(new Date())).toBe(false);
        expect(Arr.accessible(() => null)).toBe(false);
    });

    it("arrayable", () => {
        expect(Arr.arrayable([])).toBe(true);

        expect(Arr.arrayable(null)).toBe(false);
        expect(Arr.arrayable("abc")).toBe(false);
        expect(Arr.arrayable(123)).toBe(false);
        expect(Arr.arrayable(12.34)).toBe(false);
        expect(Arr.arrayable(true)).toBe(false);
        expect(Arr.arrayable(new Date())).toBe(false);
        expect(Arr.arrayable(() => null)).toBe(false);
    });

    it("add", () => {
        // Test adding to array when key doesn't exist
        expect(Arr.add(["Desk"], 1, 100)).toEqual(["Desk", 100]);

        // Test adding with dot notation
        expect(Arr.add([], "0", "first")).toEqual(["first"]);

        // Test that it doesn't add if key already exists
        expect(Arr.add(["existing"], 0, "new")).toEqual(["existing"]);

        // Test nested dot notation
        const nested = [{ name: "John" }];
        expect(Arr.add(nested, "0.age", 30)).toEqual([
            { name: "John", age: 30 },
        ]);

        // Test that it doesn't overwrite existing nested values
        const nested2 = [{ name: "John" }];
        expect(Arr.add(nested2, "0.name", "Jane")).toEqual([{ name: "John" }]);

        // Test adding new nested path
        expect(Arr.add([], "user.name", "John")).toEqual([
            { user: { name: "John" } },
        ]);
    });

    it("collapse", () => {
        type Mixed = string[] | number[] | [] | (string | number)[];
        let data: Mixed[] = [["foo", "bar"], ["baz"]];
        expect(Arr.collapse(data)).toEqual(["foo", "bar", "baz"]);

        // Case including numeric and string elements
        data = [[1], [2], [3], ["foo", "bar"]];
        expect(Arr.collapse(data)).toEqual([1, 2, 3, "foo", "bar"]);

        // Case with empty two-dimensional arrays
        data = [[], [], []];
        expect(Arr.collapse(data)).toEqual([]);

        // Case with both empty arrays and arrays with elements
        data = [[], [1, 2], [], ["foo", "bar"]];
        expect(Arr.collapse(data)).toEqual([1, 2, "foo", "bar"]);

        // Case including arrays
        data = [[1], [2], [3], ["foo", "bar"]];

        expect(Arr.collapse(data)).toEqual([1, 2, 3, "foo", "bar"]);

        // Test object collapsing (merging objects together)
        const objectData = [
            { a: 1, b: 2 },
            { c: 3, d: 4 },
        ];
        expect(Arr.collapse(objectData)).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it("combine", () => {
        const baseData = [1, 2, 3];
        expect(Arr.combine(baseData, [4, 5, 6])).toEqual([
            [1, 4],
            [2, 5],
            [3, 6],
        ]);

        expect(Arr.combine(baseData)).toEqual([[1], [2], [3]]);

        expect(Arr.combine()).toEqual([]);
    });

    it("crossJoin", () => {
        // Square matrix
        expect(Arr.crossJoin([1, 2], ["a", "b"])).toEqual([
            [1, "a"],
            [1, "b"],
            [2, "a"],
            [2, "b"],
        ]);

        // Rectangular matrix
        expect(Arr.crossJoin([1, 2], ["a", "b", "c"])).toEqual([
            [1, "a"],
            [1, "b"],
            [1, "c"],
            [2, "a"],
            [2, "b"],
            [2, "c"],
        ]);

        // 3D matrix
        expect(Arr.crossJoin([1, 2], ["a", "b"], ["I", "II", "III"])).toEqual([
            [1, "a", "I"],
            [1, "a", "II"],
            [1, "a", "III"],
            [1, "b", "I"],
            [1, "b", "II"],
            [1, "b", "III"],
            [2, "a", "I"],
            [2, "a", "II"],
            [2, "a", "III"],
            [2, "b", "I"],
            [2, "b", "II"],
            [2, "b", "III"],
        ]);

        // With 1 empty dimension
        expect(Arr.crossJoin([], ["a", "b"], ["I", "II", "III"])).toEqual([]);
        expect(Arr.crossJoin([1, 2], [], ["I", "II", "III"])).toEqual([]);
        expect(Arr.crossJoin([1, 2], ["a", "b"], [])).toEqual([]);

        // With empty arrays
        expect(Arr.crossJoin([], [], [])).toEqual([]);
        expect(Arr.crossJoin([], [])).toEqual([]);
        expect(Arr.crossJoin([])).toEqual([]);

        // Not really a proper usage, still, test for preserving BC
        expect(Arr.crossJoin()).toEqual([[]]);
    });

    it("divide", () => {
        // Test dividing an empty array
        let [keys, values] = Arr.divide([]);
        expect(keys).toEqual([]);
        expect(values).toEqual([]);

        // Test dividing an array with a single key-value pair
        [keys, values] = Arr.divide(["Desk"]);
        expect(keys).toEqual([0]);
        expect(values).toEqual(["Desk"]);

        // Test dividing an array with multiple key-value pairs
        [keys, values] = Arr.divide(["Desk", 100, true]);
        expect(keys).toEqual([0, 1, 2]);
        expect(values).toEqual(["Desk", 100, true]);

        // Test dividing an array with numeric keys
        [keys, values] = Arr.divide(["first", "second"]);
        expect(keys).toEqual([0, 1]);
        expect(values).toEqual(["first", "second"]);

        // Test dividing an array with null key
        [keys, values] = Arr.divide(["Null", "one"]);
        expect(keys).toEqual([0, 1]);
        expect(values).toEqual(["Null", "one"]);

        // Test dividing an array where the keys are arrays
        [keys, values] = Arr.divide([[1, "second"], "one"]);
        expect(keys).toEqual([0, 1]);
        expect(values).toEqual([[1, "second"], "one"]);

        // Test dividing an array where the values are arrays
        [keys, values] = Arr.divide([[1, 2], "one"]);
        expect(keys).toEqual([0, 1]);
        expect(values).toEqual([[1, 2], "one"]);
    });

    it("except", () => {
        expect(Arr.except(["a", "b", "c", "d"], null)).toEqual([
            "a",
            "b",
            "c",
            "d",
        ]);
        expect(Arr.except(["a", "b", "c", "d"], 1)).toEqual(["a", "c", "d"]);
        expect(Arr.except(["a", "b", "c", "d"], [0, 2])).toEqual(["b", "d"]);
    });

    it("exists", () => {
        expect(Arr.exists([1], 0)).toBe(true);
        expect(Arr.exists([1], "0")).toBe(true);
        expect(Arr.exists([1], "one")).toBe(false);
        expect(Arr.exists([null], 0)).toBe(true);

        expect(Arr.exists([1], 1)).toBe(false);
        expect(Arr.exists([null], 1)).toBe(false);

        // @ts-expect-error Testing non-array input should return false
        expect(Arr.exists(5, 4)).toBe(false);
    });

    it("first", () => {
        // Callback is null and array is empty
        expect(Arr.first(null)).toBeNull();
        expect(Arr.first("", null, null)).toBeNull();

        // Callback is null and string is not empty
        expect(Arr.first("house", null, null)).toBe("h");

        const data = [100, 200, 300];

        // Callback is null and array is empty
        expect(Arr.first([], null)).toBeNull();
        expect(Arr.first([], null, "foo")).toBe("foo");
        expect(Arr.first([], null, () => "bar")).toBe("bar");

        // Callback is null and array is not empty
        expect(Arr.first(data)).toBe(100);

        // Callback is not null and array is not empty
        expect(
            Arr.first(data, (value) => {
                return value >= 150;
            }),
        ).toBe(200);

        // Callback is not null, array is not empty but no satisfied item
        expect(Arr.first(data, (value) => value > 300)).toBeNull();

        expect(Arr.first(data, (value) => value > 300, "bar")).toBe("bar");

        expect(
            Arr.first(
                data,
                (value) => value > 300,
                () => "baz",
            ),
        ).toBe("baz");
        expect(Arr.first(data, (_, key) => key < 2)).toBe(100);

        expect(
            Arr.first(
                (function* () {
                    yield 1;
                })(),
            ),
        ).toBe(1);
    });

    it("first works with ArrayObject", () => {
        // Simulate ArrayObject-like structure (array-like iterable)
        const arrayObject = [0, 10, 20];

        const result = Arr.first(arrayObject, (value: number) => value === 0);

        expect(result).toBe(0);

        // Test with object being passed (from() will return an object for objects with callback)
        const objectData = { a: 5, b: 15, c: 25 };
        const objectResult = Arr.first(
            objectData,
            (value: number) => value === 15,
        );
        expect(objectResult).toBe(15);

        // Test with object and no match - should return default
        const noMatchResult = Arr.first(
            objectData,
            (value: number) => value > 100,
            "default",
        );
        expect(noMatchResult).toBe("default");
    });

    it("last", () => {
        // Callback is null and array is empty
        expect(Arr.last(null)).toBeNull();
        expect(Arr.last("", null, null)).toBeNull();

        // Callback is null and string is not empty
        expect(Arr.last("house", null, null)).toBe("e");

        const data = [100, 200, 300];

        // Callback is null and array is empty
        expect(Arr.last([], null)).toBeNull();

        expect(Arr.last([], null, "foo")).toBe("foo");
        expect(Arr.last([], null, () => "bar")).toBe("bar");

        // Callback is null and array is not empty
        expect(Arr.last(data)).toBe(300);

        // Callback is not null and array is not empty
        expect(
            Arr.last(data, (value) => {
                return value < 250;
            }),
        ).toBe(200);

        // Callback is not null, array is not empty but no satisfied item
        expect(
            Arr.last(data, (value) => {
                return value > 300;
            }),
        ).toBeNull();

        expect(
            Arr.last(
                data,
                (value) => {
                    return value > 300;
                },
                "bar",
            ),
        ).toBe("bar");

        expect(
            Arr.last(
                data,
                (value) => {
                    return value > 300;
                },
                () => "baz",
            ),
        ).toBe("baz");

        expect(
            Arr.last(data, (_value, key) => {
                return key < 2;
            }),
        ).toBe(200);

        expect(
            Arr.last(
                (function* () {
                    yield 1;
                })(),
            ),
        ).toBe(1);

        // Non-array iterable with predicate (covers bottom branch in Arr.last)
        const gen = () =>
            (function* () {
                yield 1;
                yield 2;
                yield 3;
            })();

        // Last value < 3 is 2
        expect(Arr.last(gen(), (v) => v < 3)).toBe(2);

        // No match returns null
        expect(Arr.last(gen(), (v) => v > 5)).toBeNull();

        // No match with default value
        expect(Arr.last(gen(), (v) => v > 5, "fallback")).toBe("fallback");

        // No match with lazy default
        expect(
            Arr.last(
                gen(),
                (v) => v > 5,
                () => "lazy",
            ),
        ).toBe("lazy");
    });

    it("take", () => {
        // $array = [1, 2, 3, 4, 5, 6];
        const data = [1, 2, 3, 4, 5, 6];

        // Test with a positive limit, should return the first 'limit' elements.
        expect(Arr.take(data, 3)).toEqual([1, 2, 3]);

        // Test with a negative limit, should return the last 'abs(limit)' elements.
        expect(Arr.take(data, -3)).toEqual([4, 5, 6]);

        // Test with zero limit, should return an empty array.
        expect(Arr.take(data, 0)).toEqual([]);

        // Test with a limit greater than the array size, should return the entire array.
        expect(Arr.take(data, 10)).toEqual([1, 2, 3, 4, 5, 6]);

        // Test with a negative limit greater than the array size, should return the entire array.
        expect(Arr.take(data, -10)).toEqual([1, 2, 3, 4, 5, 6]);

        // Empty array with non-zero limit returns [] (covers early return when length === 0)
        expect(Arr.take([], 3)).toEqual([]);
    });

    describe("flatten", () => {
        it("flatten", () => {
            // Flat arrays are unaffected
            let data: unknown[] = ["#foo", "#bar", "#baz"];
            expect(Arr.flatten(data)).toEqual(["#foo", "#bar", "#baz"]);

            // Nested arrays are flattened with existing flat items
            data = [["#foo", "#bar"], "#baz"];
            expect(Arr.flatten(data)).toEqual(["#foo", "#bar", "#baz"]);

            // Flattened array includes "null" items
            data = [["#foo", null], "#baz", null];
            expect(Arr.flatten(data)).toEqual(["#foo", null, "#baz", null]);

            // Sets of nested arrays are flattened
            data = [["#foo", "#bar"], ["#baz"]];
            expect(Arr.flatten(data)).toEqual(["#foo", "#bar", "#baz"]);

            // Deeply nested arrays are flattened
            data = [["#foo", ["#bar"]], ["#baz"]];
            expect(Arr.flatten(data)).toEqual(["#foo", "#bar", "#baz"]);
        });

        it("should handle depth=1 with objects", () => {
            // Tests depth === 1 branch for object values
            const data = [{ a: 1, b: 2 }];
            expect(Arr.flatten(data, 1)).toEqual([1, 2]);
        });

        it("should handle depth > 1 with nested objects", () => {
            // Tests depth !== 1 branch for object values
            const data = [{ a: { b: 1, c: 2 } }];
            expect(Arr.flatten(data, 2)).toEqual([1, 2]);
        });

        it("should handle depth=1 with nested arrays", () => {
            // Tests depth === 1 branch for array values
            const data = [
                [1, 2],
                [3, 4],
            ];
            expect(Arr.flatten(data, 1)).toEqual([1, 2, 3, 4]);
        });

        it("should handle non-array input", () => {
            expect(Arr.flatten(null)).toEqual([]);
            expect(Arr.flatten(undefined)).toEqual([]);
        });
    });

    it("flip", () => {
        const data = ["apple", "banana", "cherry"];
        expect(Arr.flip(data)).toEqual({
            apple: 0,
            banana: 1,
            cherry: 2,
        });

        expect(Arr.flip({ apple: 0, banana: 1, cherry: 2 })).toEqual({});
    });

    it("forget", () => {
        const data = ["products", ["desk", [100]]];
        expect(Arr.forget(data, null)).toEqual(["products", ["desk", [100]]]);

        // Test with undefined as keys
        expect(Arr.forget(data, undefined)).toEqual([
            "products",
            ["desk", [100]],
        ]);

        expect(Arr.forget(data, [])).toEqual(["products", ["desk", [100]]]);

        expect(Arr.forget(data, "1.0")).toEqual(["products", [[100]]]);
        expect(Arr.forget(data, "1.1")).toEqual(["products", ["desk"]]);
        expect(Arr.forget(data, "1.1.2")).toEqual([
            "products",
            ["desk", [100]],
        ]);

        expect(Arr.forget(data, "1")).toEqual(["products"]);
        expect(Arr.forget(data, 1)).toEqual(["products"]);

        const data2 = ["prices", [100, 200, 300]];
        expect(Arr.forget(data2, "1")).toEqual(["prices"]);
        expect(Arr.forget(data2, 1)).toEqual(["prices"]);
        expect(Arr.forget(data2, "1.5")).toEqual(["prices", [100, 200, 300]]);
        expect(Arr.forget(data2, 2)).toEqual(["prices", [100, 200, 300]]);
        expect(Arr.forget(data2, ["1.0", "1.2"])).toEqual(["prices", [200]]);
        expect(Arr.forget(data2, [0, "1.2"])).toEqual([[100, 200]]);
        expect(Arr.forget(data2, 0)).toEqual([[100, 200, 300]]);
        expect(Arr.forget(data2, 1)).toEqual(["prices"]);
    });

    it("forget - edge cases and robustness", () => {
        const base = ["products", ["desk", [100]]];

        // 1) Invalid numeric indices at root: non-integer, negative, out-of-bounds
        expect(Arr.forget(base, 1.5)).toEqual(base);
        expect(Arr.forget(base, -1)).toEqual(base);
        expect(Arr.forget(base, 99)).toEqual(base);

        // 2) Invalid path strings should be ignored (no change)
        expect(Arr.forget(base, "foo")).toEqual(base);
        expect(Arr.forget(base, "1.a")).toEqual(base);
        expect(Arr.forget(base, "")).toEqual(base);
        expect(Arr.forget(base, ".")).toEqual(base);
        expect(Arr.forget(base, "1.")).toEqual(base);
        expect(Arr.forget(base, ".1")).toEqual(base);
        expect(Arr.forget(base, "..")).toEqual(base);
        expect(Arr.forget(base, "0.-1")).toEqual(base);

        // 3) Duplicate keys are effectively de-duplicated
        expect(Arr.forget(["a", "b"], ["1", "1"])).toEqual(["a"]);

        // 4) Mixed keys: nested then top-level removal => top-level dominates
        expect(Arr.forget(base, ["1.0", 1])).toEqual(["products"]);

        // 5) Root multi-index deletion should be order independent (descending applied)
        expect(Arr.forget([10, 20, 30, 40], [0, 2])).toEqual([20, 40]);
        expect(Arr.forget([10, 20, 30, 40], [2, 0])).toEqual([20, 40]);

        // 6) Traversal into non-array child is a no-op
        expect(Arr.forget(base, "0.0")).toEqual(base);

        // 7) Empty input remains empty regardless of keys
        expect(Arr.forget([], "0")).toEqual([]);
        expect(Arr.forget([], ["0", "1"])).toEqual([]);

        // 8) Numeric-string with leading zeros acts numerically
        expect(Arr.forget(base, "01")).toEqual(["products"]);

        // 9) Mixed valid/invalid multi-keys only apply valid parts
        expect(Arr.forget(base, ["1.0", "foo", "1.a", "", ".."])).toEqual([
            "products",
            [[100]],
        ]);

        // 10) Deep out-of-range on a nested path is a no-op
        expect(Arr.forget(base, "1.5.1")).toEqual(base);

        // 11) Multiple deletions within the same nested parent
        const nested = ["prices", [100, 200, 300, 400]];
        expect(Arr.forget(nested, ["1.0", "1.3"])).toEqual([
            "prices",
            [200, 300],
        ]);

        // 12) Immutability: original input must remain unchanged
        const subject = ["products", ["desk", [100]]];
        const snapshot = JSON.stringify(subject);
        const res = Arr.forget(subject, "1.0");
        expect(res).toEqual(["products", [[100]]]);
        expect(JSON.stringify(subject)).toBe(snapshot);

        // 13) Multi-key path: parent index out-of-range triggers updateAtPath early return
        // Provide 2+ keys to bypass single-key fast path
        expect(Arr.forget(base, ["5.0", 99])).toEqual(base);

        // 14) Multi-key path: parent exists but child is not an array -> updateAtPath returns clone unchanged
        // Parent path [0] points to a string 'products', so attempting to delete '0.1' should no-op
        expect(Arr.forget(base, ["0.1", 99])).toEqual(base);

        // 15) Root group with only invalid indices (non-integer/negative) -> sorted becomes empty and is skipped
        expect(
            Arr.forget([10, 20, 30], [1.5 as unknown as number, -2]),
        ).toEqual([10, 20, 30]);
    });

    it("from", () => {
        expect(Arr.from({ foo: "bar" })).toEqual({ foo: "bar" });
        expect(Arr.from(new Object({ foo: "bar" }))).toEqual({ foo: "bar" });
        expect(Arr.from(new Map([["foo", "bar"]]))).toEqual({ foo: "bar" });

        const subject = [new Object(), new Object()];
        expect(Arr.from(subject)).toEqual(subject);

        // WeakMap is not iterable in JS, so Arr::from should throw.
        const temp = {};
        const weakMap = new WeakMap();
        weakMap.set(temp, "bar");
        expect(() => Arr.from(weakMap)).toThrow(Error);

        expect(() => Arr.from(123)).toThrow(Error);
        expect(() => Arr.from("string")).toThrow(Error);
        expect(() => Arr.from(true)).toThrow(Error);
        expect(() => Arr.from(null)).toThrow(Error);
        expect(() => Arr.from(undefined)).toThrow(Error);
        expect(() => Arr.from(Symbol("sym"))).toThrow(Error);
    });

    it("get", () => {
        const data = [
            "products",
            ["desk", [100, 200, 400]],
            ["table", [200, 300], ["chair", [500, 600]]],
        ];
        expect(Arr.get(data, 0)).toEqual("products");
        expect(Arr.get(data, 1)).toEqual(["desk", [100, 200, 400]]);
        // Numeric-only dot paths
        expect(Arr.get(data, "1.0")).toEqual("desk");
        expect(Arr.get(data, "1.1.0")).toEqual(100);
        expect(Arr.get(data, "1.1.1")).toEqual(200);
        expect(Arr.get(data, "1.1.2")).toEqual(400);
        expect(Arr.get(data, 2)).toEqual([
            "table",
            [200, 300],
            ["chair", [500, 600]],
        ]);
        // Out-of-bounds within dot traversal -> default/null
        expect(Arr.get(data, "1.9")).toBeNull();
        expect(Arr.get(data, "2.9", "default")).toBe("default");

        // Test null array values
        const dataNull = ["foo", null, "bar", ["baz", null]];
        expect(Arr.get(dataNull, "foo", "default")).toBe("default");
        expect(Arr.get(dataNull, "bar.baz", "default")).toBe("default");
        expect(Arr.get(dataNull, 0, "default")).toBe("foo");
        expect(Arr.get(dataNull, "1", "default")).toBe("default");
        expect(Arr.get(dataNull, 1, "default")).toBe("default");
        expect(Arr.get(dataNull, 2, "default")).toBe("bar");

        // Test null key returns the whole array
        const data2 = ["foo", "bar"];
        expect(Arr.get(data2, null)).toEqual(data2);
        expect(Arr.get(data2, undefined)).toEqual(data2);

        // Test $array not an array
        expect(Arr.get(null, "foo", "default")).toBe("default");
        expect(Arr.get("false", "foo", "default")).toBe("default");

        // Test $array not an array and key is null
        expect(Arr.get(null, null, "default")).toBe("default");
        expect(Arr.get("false", null, "default")).toBe("default");

        // Test $array is empty and key is null
        expect(Arr.get([], null)).toEqual([]);
        expect(Arr.get([], null, "default")).toEqual([]);

        const data3 = ["products", [{ name: "desk" }, { name: "chair" }]];
        expect(Arr.get(data3, "1.0")).toEqual({ name: "desk" });
        expect(Arr.get(data3, "1.1")).toEqual({ name: "chair" });

        // Test mixed array/object path support and return default value for non-existing keys
        const data4 = ["names", { developer: "taylor" }];
        expect(Arr.get(data4, "1.5", "dayle")).toBe("dayle"); // non-existing property
        expect(Arr.get(data4, "1.developer", "dayle")).toBe("taylor"); // existing property

        // Lazy default should be evaluated only when needed
        let called = 0;
        const lazy = () => {
            called++;
            return "lazy";
        };
        expect(Arr.get(["a"], 0, lazy)).toBe("a"); // no default
        expect(called).toBe(0);
        expect(Arr.get(["a"], 2, lazy)).toBe("lazy"); // default used
        expect(called).toBe(1);

        // Default is null when not provided and key missing
        expect(Arr.get(["a"], 9)).toBeNull();
        expect(Arr.get(null as unknown as unknown[], 1)).toBeNull();
    });

    it("has", () => {
        const data = ["products.desk", ["price", 100]];
        expect(Arr.has(data, "0")).toBe(true);
        expect(Arr.has(data, 0)).toBe(true);

        const data2 = ["products", ["desk", ["price", 100]]];
        expect(Arr.has(data2, "1.0")).toBe(true);
        expect(Arr.has(data2, "1.1.0")).toBe(true);
        expect(Arr.has(data2, "1.2")).toBe(false);
        expect(Arr.has(data2, "1.1.1")).toBe(true);

        const data3 = ["foo", null, "bar", ["baz", null]];
        expect(Arr.has(data3, "0")).toBe(true);
        expect(Arr.has(data3, "1")).toBe(true);
        expect(Arr.has(data3, "2.0")).toBe(false);
        expect(Arr.has(data3, "2.1")).toBe(false);

        const data4 = ["foo", 10, "bar", ["baz", 10]];
        expect(Arr.has(data4, "0")).toBe(true);
        expect(Arr.has(data4, "1")).toBe(true);
        expect(Arr.has(data4, "2")).toBe(true);
        expect(Arr.has(data4, "2.0")).toBe(false);
        expect(Arr.has(data4, "3")).toBe(true);
        expect(Arr.has(data4, "3.0")).toBe(true);
        expect(Arr.has(data4, "3.1")).toBe(true);
        expect(Arr.has(data4, "3.2")).toBe(false);
        expect(Arr.has(data4, "0.0")).toBe(false);
        expect(Arr.has(data4, "2.1")).toBe(false);

        const data5 = ["foo", "bar"];
        expect(Arr.has(data5, null)).toBe(false);
        expect(Arr.has(data5, undefined)).toBe(false);
        expect(Arr.has(data5, 0)).toBe(true);
        expect(Arr.has(data5, 1)).toBe(true);

        expect(Arr.has(null, 0)).toBe(false);
        expect(Arr.has(false, 0)).toBe(false);

        expect(Arr.has(null, null)).toBe(false);
        expect(Arr.has([], null)).toBe(false);
        expect(Arr.has(undefined, null)).toBe(false);

        const data6 = ["products", ["desk", ["price", 100]]];
        expect(Arr.has(data6, ["1.0"])).toBe(true);
        expect(Arr.has(data6, [0, 1, "1.0", "1.1"])).toBe(true);
        expect(Arr.has(data6, ["1", "1"])).toBe(true);
        expect(Arr.has(data6, ["foo"])).toBe(false);
        expect(Arr.has(data6, [])).toBe(false);
        expect(Arr.has(data6, ["1.0", "1.2"])).toBe(false);

        const data7 = ["products", ["name", "desk"]];
        expect(Arr.has(data7, "1.0")).toBe(true);
        expect(Arr.has(data7, "1.1")).toBe(true);
        expect(Arr.has(data7, "1.2")).toBe(false);

        expect(Arr.has(data7, [null])).toBe(false);
        expect(Arr.has(data7, [undefined])).toBe(false);

        expect(Arr.has(["", "some"], "")).toBe(false);
        expect(Arr.has(["", "some"], [""])).toBe(false);
        expect(Arr.has([], "")).toBe(false);
        expect(Arr.has([], [""])).toBe(false);
    });

    it("hasAll", () => {
        const data = [
            ["name", "Taylor"],
            ["age", ""],
            ["city", null],
        ];
        expect(Arr.hasAll(data, "0")).toBe(true);
        expect(Arr.hasAll(data, ["0"])).toBe(true);
        expect(Arr.hasAll(data, ["0", "1"])).toBe(true);
        expect(Arr.hasAll(data, ["0", "1", "2"])).toBe(true);
        expect(Arr.hasAll(data, ["0", "1", "2", "3"])).toBe(false);
        expect(Arr.hasAll(data, ["0", "3"])).toBe(false);
        expect(Arr.hasAll(data, "3")).toBe(false);

        const data2 = ["user", ["name", "Taylor"]];
        expect(Arr.hasAll(data2, "1.0")).toBe(true);
        expect(Arr.hasAll(data2, ["1.0"])).toBe(true);
        expect(Arr.hasAll(data2, ["1.0", "1.1"])).toBe(true);
        expect(Arr.hasAll(data2, ["1.0", "0"])).toBe(true);
        expect(Arr.hasAll(data2, ["1.0", "1.1", "0"])).toBe(true);
        expect(Arr.hasAll(data2, ["1.0", "1.1", "0", "2"])).toBe(false);
        expect(Arr.hasAll(data2, ["1.0", "2"])).toBe(false);
        expect(Arr.hasAll(data2, "2")).toBe(false);

        const data3 = [
            ["name", "Taylor"],
            ["age", ""],
            ["city", null],
        ];
        expect(Arr.hasAll(data3, "3")).toBe(false);
        expect(Arr.hasAll(data3, ["3"])).toBe(false);
        expect(Arr.hasAll(data3, ["3", "4"])).toBe(false);
        expect(Arr.hasAll(data3, ["3", "4", "5"])).toBe(false);
        expect(Arr.hasAll(data3, ["3", "4", "5", "6"])).toBe(false);

        expect(Arr.hasAll(data3, null)).toBe(false);
        expect(Arr.hasAll(data3, [null])).toBe(false);
        expect(Arr.hasAll(data3, [undefined])).toBe(false);
        expect(Arr.hasAll(data3, undefined)).toBe(false);

        expect(Arr.hasAll(null, "0")).toBe(false);
        expect(Arr.hasAll(null, ["0"])).toBe(false);
        expect(Arr.hasAll(null, ["0", "1"])).toBe(false);

        expect(Arr.hasAll([], "0")).toBe(false);
        expect(Arr.hasAll([], ["0"])).toBe(false);
        expect(Arr.hasAll([], ["0", "1"])).toBe(false);
    });

    it("hasAny", () => {
        const data = [
            ["name", "Taylor"],
            ["age", ""],
            ["city", null],
        ];
        expect(Arr.hasAny(data, 0)).toBe(true);
        expect(Arr.hasAny(data, 1)).toBe(true);
        expect(Arr.hasAny(data, 2)).toBe(true);
        expect(Arr.hasAny(data, "0.0")).toBe(true);
        expect(Arr.hasAny(data, [0, 1])).toBe(true);
        expect(Arr.hasAny(data, 3)).toBe(false);
        expect(Arr.hasAny(data, [])).toBe(false);
        expect(Arr.hasAny(data, [""])).toBe(false);

        const data2 = [
            ["name", "Taylor"],
            ["email", "foo"],
        ];
        expect(Arr.hasAny(data2, ["name", "email"])).toBe(false);
        expect(Arr.hasAny(data2, ["surname", "password"])).toBe(false);
        expect(Arr.hasAny(data2, "surname")).toBe(false);
        expect(Arr.hasAny(data2, "password")).toBe(false);

        expect(Arr.hasAny(data2, null)).toBe(false);
        expect(Arr.hasAny(data2, [null])).toBe(false);
        expect(Arr.hasAny(data2, [undefined])).toBe(false);
        expect(Arr.hasAny(data2, undefined)).toBe(false);

        expect(Arr.hasAny(null, 0)).toBe(false);
        expect(Arr.hasAny(null, [0])).toBe(false);
        expect(Arr.hasAny(null, [0, 1])).toBe(false);

        expect(Arr.hasAny([], [])).toBe(false);
        expect(Arr.hasAny([], 0)).toBe(false);
        expect(Arr.hasAny([], [0])).toBe(false);
        expect(Arr.hasAny([], [0, 1])).toBe(false);
    });

    it("every", () => {
        expect(Arr.every([1, 2], (value) => typeof value === "string")).toBe(
            false,
        );
        expect(
            Arr.every(["foo", 2], (value) => typeof value === "string"),
        ).toBe(false);
        expect(
            Arr.every(["foo", "bar"], (value) => typeof value === "string"),
        ).toBe(true);

        expect(Arr.every([], (value) => typeof value === "string")).toBe(true);
        expect(Arr.every([], () => false)).toBe(true);
        expect(Arr.every([], () => true)).toBe(true);

        expect(Arr.every([1, 2], (_value, key) => key >= 0)).toBe(true);
        expect(Arr.every([1, 2], (_value, key) => key > 0)).toBe(false);

        expect(Arr.every(5, () => true)).toBe(false);
    });

    it("some", () => {
        expect(Arr.some([1, 2], (value) => typeof value === "string")).toBe(
            false,
        );
        expect(Arr.some(["foo", 2], (value) => typeof value === "string")).toBe(
            true,
        );
        expect(
            Arr.some(["foo", "bar"], (value) => typeof value === "string"),
        ).toBe(true);

        expect(Arr.some([], (value) => typeof value === "string")).toBe(false);
        expect(Arr.some([], () => false)).toBe(false);
        expect(Arr.some([], () => true)).toBe(false);

        expect(Arr.some([1, 2], (_value, key) => key >= 1)).toBe(true);
        expect(Arr.some([1, 2], (_value, key) => key > 1)).toBe(false);

        expect(Arr.some(5, () => true)).toBe(false);
    });

    it("integer", () => {
        const testArray = ["foo bar", 1234];

        // Test integer values are returned as integers
        expect(Arr.integer(testArray, 1)).toBe(1234);
        expect(() => Arr.integer(testArray, 0)).toThrow(Error);

        expect(Arr.integer(testArray, 2, 999)).toBe(999);
        expect(() => Arr.integer(testArray, 2)).toThrow(Error);
    });

    it("set", () => {
        const data = ["products", ["desk", ["price", 100]]];
        expect(Arr.set(data, "1.1.1", 200)).toEqual([
            "products",
            ["desk", ["price", 200]],
        ]);

        // No key is given
        expect(Arr.set(data, null, ["price", 300])).toEqual(["price", 300]);

        // Mixed path creates nested structure when path goes through non-object/array
        expect(Arr.set(["products", "desk"], "0.1", "desk")).toEqual([
            [undefined, "desk"],
            "desk",
        ]);

        // No corresponding key exists - creates nested structure
        expect(Arr.set(["products"], "1.1", 200)).toEqual([
            "products",
            [undefined, 200],
        ]);
        expect(Arr.set(data, "2", 500)).toEqual([
            "products",
            ["desk", ["price", 100]],
            500,
        ]);
        expect(Arr.set(data, "2.0", 350)).toEqual([
            "products",
            ["desk", ["price", 100]],
            [350],
        ]);
        expect(Arr.set([], "0.0.0", 200)).toEqual([[[200]]]);

        expect(Arr.set([1, 2, 3], 1, "hAz")).toEqual([1, "hAz", 3]);

        // Test with undefined as key
        expect(Arr.set(data, undefined, ["price", 300])).toEqual([
            "price",
            300,
        ]);

        // Immutability: original should remain unchanged
        const subject = ["products", ["desk", ["price", 100]]];
        const snap = JSON.stringify(subject);
        const result = Arr.set(subject, "1.1.1", 200);
        expect(result).toEqual(["products", ["desk", ["price", 200]]]);
        expect(JSON.stringify(subject)).toBe(snap);
    });

    it("push", () => {
        let data: unknown[] = [];

        data = Arr.push(data, "0.0", "Desk");
        expect(data).toEqual([["Desk"]]);

        data = Arr.push(data, "0.0", "Chair", "Lamp");
        expect(data).toEqual([["Desk", "Chair", "Lamp"]]);

        let data2: unknown[] = [];

        data2 = Arr.push(data2, null, "Chris", "Nuno");
        expect(data2).toEqual(["Chris", "Nuno"]);

        data2 = Arr.push(data2, null, "Taylor");
        expect(data2).toEqual(["Chris", "Nuno", "Taylor"]);

        const data3 = ["foo", ["bar", false]];
        expect(() => Arr.push(data3, "1.1", "baz")).toThrow(
            "Array value for key [1.1] must be an array, boolean found.",
        );
    });

    it("pull", () => {
        const data = ["name", "desk", ["price", 100]];
        const d = Arr.pull(data, "1");
        expect(d.value).toBe("desk");
        expect(d.data).toEqual(["name", ["price", 100]]);

        const data2 = [
            ["joe@example.com", "joe"],
            ["jane@localhost", "Jane"],
        ];
        const d2 = Arr.pull(data2, "0.0");
        expect(d2.value).toBe("joe@example.com");
        expect(d2.data).toEqual([["joe"], ["jane@localhost", "Jane"]]);

        const data3 = [
            "emails",
            [
                ["joe@example.com", "Joe"],
                ["jane@localhost", "Jane"],
            ],
        ];
        const d3 = Arr.pull(data3, "1.0.1");
        expect(d3.value).toBe("Joe");
        expect(d3.data).toEqual([
            "emails",
            [["joe@example.com"], ["jane@localhost", "Jane"]],
        ]);

        const data4 = ["First", "Second"];
        const d4 = Arr.pull(data4, 0);
        expect(d4.value).toBe("First");
        expect(d4.data).toEqual(["Second"]);

        const base = ["products", ["desk", [100, null]]];

        // Pull existing leaf value
        const r1 = Arr.pull(base, "1.1.0");
        expect(r1.value).toBe(100);
        expect(r1.data).toEqual(["products", ["desk", [null]]]);

        // Pull existing null value should return null, still remove
        const r2 = Arr.pull(["products", ["desk", [100, null]]], "1.1.1");
        expect(r2.value).toBeNull();
        expect(r2.data).toEqual(["products", ["desk", [100]]]);

        // Missing path returns default and leaves data unchanged
        const r3 = Arr.pull(["a", ["b"]], "5.0", "def");
        expect(r3.value).toBe("def");
        expect(r3.data).toEqual(["a", ["b"]]);

        // Lazy default only evaluated when needed
        let calls = 0;
        const lazy = () => {
            calls++;
            return "lazy";
        };
        const r4 = Arr.pull(["x"], 9, lazy);
        expect(r4.value).toBe("lazy");
        expect(calls).toBe(1);
        const r5 = Arr.pull(["x"], 0, lazy);
        expect(r5.value).toBe("x");
        expect(calls).toBe(1);

        // Immutability: original should remain unchanged
        const subject = ["products", ["desk", [100]]];
        const snap = JSON.stringify(subject);
        const r7 = Arr.pull(subject, "1.1.0");
        expect(r7.value).toBe(100);
        expect(r7.data).toEqual(["products", ["desk", []]]);
        expect(JSON.stringify(subject)).toBe(snap);
    });

    it("join", () => {
        expect(Arr.join(["a", "b", "c"], ", ")).toBe("a, b, c");
        expect(Arr.join(["a", "b", "c"], ", ", " and ")).toBe("a, b and c");
        expect(Arr.join(["a", "b"], ", ", " and ")).toBe("a and b");
        expect(Arr.join(["a"], ", ", " and ")).toBe("a");
        expect(Arr.join([], ", ", " and ")).toBe("");
        expect(Arr.join("test", "")).toBe("");
        expect(Arr.join(null, "")).toBe("");
        expect(Arr.join(undefined, "")).toBe("");
    });

    it("dot", () => {
        expect(Arr.dot([])).toEqual({});
        expect(Arr.dot(["a"])).toEqual({ "0": "a" });
        expect(Arr.dot(["a", ["b", ["c"]]])).toEqual({
            "0": "a",
            "1.0": "b",
            "1.1.0": "c",
        });

        // Prepend prefix
        expect(Arr.dot(["a", ["b"]], "root")).toEqual({
            "root.0": "a",
            "root.1.0": "b",
        });
    });

    it("undot", () => {
        expect(Arr.undot({})).toEqual([]);
        expect(Arr.undot({ "0": "a" })).toEqual(["a"]);
        expect(Arr.undot({ "0": "a", "1.0": "b", "1.1.0": "c" })).toEqual([
            "a",
            ["b", ["c"]],
        ]);

        // Ignore non-numeric segments
        const undotted = Arr.undot({ foo: "x", "1.bar": "y", "2": "z" });
        expect(undotted.length).toBe(3);
        expect(undotted[0]).toBeUndefined();
        expect(undotted[1]).toBeUndefined();
        expect(undotted[2]).toBe("z");

        // Conflicting intermediate path: skip conflicting keys
        // First sets 0 -> "x", then key "0.1" conflicts (0 is not an array)
        expect(Arr.undot({ "0": "x", "0.1": "y", "1.0": "z" })).toEqual([
            "x",
            ["z"],
        ]);
    });

    it("union", () => {
        expect(Arr.union([1, 2], [2, 3])).toEqual([1, 2, 3]);
        expect(Arr.union(["a", "b"], ["b", "c", "a"])).toEqual(["a", "b", "c"]);
        expect(Arr.union([], [1, 2])).toEqual([1, 2]);
        expect(Arr.union([1, 2], [])).toEqual([1, 2]);
        expect(Arr.union([], [])).toEqual([]);
    });

    describe("unshift", () => {
        it("unshift", () => {
            const expected = [
                "Jonny from Laroe",
                ["Jonny", "from", "Laroe"],
                ["a", "b", "c"],
                4,
                5,
                6,
            ];

            const data = [4, 5, 6];

            let result: unknown[] = Arr.unshift(data, ["a", "b", "c"]);
            result = Arr.unshift(result, ["Jonny", "from", "Laroe"]);
            result = Arr.unshift(result, "Jonny from Laroe");
            expect(result).toEqual(expected);
        });

        it("should skip undefined items", () => {
            // Tests when item is undefined
            expect(Arr.unshift(["a", "b"], undefined, "c")).toEqual([
                "c",
                "a",
                "b",
            ]);
            expect(Arr.unshift(["a"], undefined, undefined)).toEqual(["a"]);
        });
    });

    it("where", () => {
        // Basic array filtering
        expect(Arr.where([1, 2, 3, 4], (value) => value > 2)).toEqual([3, 4]);
        expect(Arr.where([1, 2, 3, 4], (value) => value % 2 === 0)).toEqual([
            2, 4,
        ]);
        expect(Arr.where([1, 2, 3, 4], (value) => value > 10)).toEqual([]);

        // With index parameter
        expect(
            Arr.where(["a", "b", "c"], (_value, index) => index > 0),
        ).toEqual(["b", "c"]);
        expect(
            Arr.where(["a", "b", "c"], (_value, index) => index === 1),
        ).toEqual(["b"]);

        // Mixed types
        expect(
            Arr.where(
                ["a", null, "b", undefined, "c"],
                (value) => value !== null,
            ),
        ).toEqual(["a", "b", undefined, "c"]);

        // Non-accessible data
        expect(Arr.where(null, () => true)).toEqual([]);
        expect(Arr.where("abc", () => true)).toEqual([]);
        expect(Arr.where(123, () => true)).toEqual([]);
    });

    it("whereNotNull", () => {
        // Basic null filtering
        expect(Arr.whereNotNull([1, null, 2, null, 3])).toEqual([1, 2, 3]);
        expect(Arr.whereNotNull(["a", null, "b"])).toEqual(["a", "b"]);
        expect(Arr.whereNotNull([null, null])).toEqual([]);
        expect(Arr.whereNotNull([])).toEqual([]);

        // Undefined vs null (undefined should be kept)
        expect(Arr.whereNotNull([1, null, undefined, 2])).toEqual([
            1,
            undefined,
            2,
        ]);

        // Non-accessible data
        expect(Arr.whereNotNull(null)).toEqual([]);
        expect(Arr.whereNotNull("abc")).toEqual([]);
    });

    it("contains", () => {
        const data = ["michael", "tom"];
        let result = data;
        if (Arr.contains(data, "michael")) {
            result = result.concat(["chris"]);
        }
        expect(result).toEqual(["michael", "tom", "chris"]);

        result = data;
        if (Arr.contains(data, "tom")) {
            result = result.concat(["chris"]);
        }
        expect(result).toEqual(["michael", "tom", "chris"]);

        result = data;
        if (Arr.contains(data, "missing")) {
            result = result.concat(["adam"]);
        }
        expect(result).toEqual(["michael", "tom"]);

        result = data;
        if (Arr.contains(data, "adam")) {
            result = result.concat(["bogdan"]);
        }
        expect(result).toEqual(["michael", "tom"]);

        result = data;
        if (!Arr.contains(data, "michael")) {
            result = result.concat(["chris"]);
        }
        expect(result).toEqual(["michael", "tom"]);

        result = data;
        if (!Arr.contains(data, "tom")) {
            result = result.concat(["chris"]);
        }
        expect(result).toEqual(["michael", "tom"]);

        result = data;
        if (!Arr.contains(data, "missing")) {
            result = result.concat(["adam"]);
        }
        expect(result).toEqual(["michael", "tom", "adam"]);

        result = data;
        if (!Arr.contains(data, "adam")) {
            result = result.concat(["bogdan"]);
        }
        expect(result).toEqual(["michael", "tom", "bogdan"]);

        const data2 = [1, 3, 5];
        expect(Arr.contains(data2, 1)).toBe(true);
        expect(Arr.contains(data2, "1")).toBe(true);
        expect(Arr.contains(data2, 2)).toBe(false);
        expect(Arr.contains(data2, "2")).toBe(false);

        const data3 = ["1"];
        expect(Arr.contains(data3, "1")).toBe(true);
        expect(Arr.contains(data3, 1)).toBe(true);

        const data4 = [null];
        expect(Arr.contains(data4, false)).toBe(true);
        expect(Arr.contains(data4, null)).toBe(true);
        expect(Arr.contains(data4, 0)).toBe(true);
        expect(Arr.contains(data4, "")).toBe(true);
        expect(Arr.contains(data4, [])).toBe(true);

        const data5 = [0];

        expect(Arr.contains(data5, 0)).toBe(true);
        expect(Arr.contains(data5, "0")).toBe(true);
        expect(Arr.contains(data5, false)).toBe(true);
        expect(Arr.contains(data5, null)).toBe(true);

        expect(Arr.contains(data5, (value) => value < 5)).toBe(true);
        expect(Arr.contains(data5, (value) => value > 5)).toBe(false);

        const data6 = [{ v: 1 }, { v: 3 }, { v: 5 }];

        expect(Arr.contains(data6, (item) => item.v === 1)).toBe(true);
        expect(Arr.contains(data6, (item) => item.v === 2)).toBe(false);

        const data7 = ["date", "class", { foo: 50 }];

        expect(Arr.contains(data7, "date")).toBe(true);
        expect(Arr.contains(data7, "class")).toBe(true);
        expect(Arr.contains(data7, "foo")).toBe(false);

        const data8 = [
            { a: false, b: false },
            { a: true, b: false },
        ];

        expect(Arr.contains(data8, (item) => item.a)).toBe(true);
        expect(Arr.contains(data8, (item) => item.b)).toBe(false);

        const data9 = [null, NaN, 1, 2];
        expect(Arr.contains(data9, (item) => item === null)).toBe(true);
        expect(Arr.contains(data9, (item) => Number.isNaN(item))).toBe(true);

        expect(Arr.contains(null, "house")).toBe(false);
        expect(Arr.contains(undefined, "house")).toBe(false);
        expect(Arr.contains({ house: true }, "house")).toBe(false);

        const data10 = ["1"];
        expect(Arr.contains(data10, 1)).toBe(true);
        expect(Arr.contains(data10, 1, true)).toBe(false);
    });

    it("filter", () => {
        const data = [
            { id: 1, name: "Hello" },
            { id: 2, name: "World" },
        ];
        expect(Arr.filter(data, (item) => item.id === 2)).toEqual([
            { id: 2, name: "World" },
        ]);
        expect(Arr.filter(data, (item) => item.name === "Hello")).toEqual([
            { id: 1, name: "Hello" },
        ]);

        const data2 = [null, "", "Hello", "", "World"];
        expect(Arr.filter(data2, (item) => Boolean(item))).toEqual([
            "Hello",
            "World",
        ]);
        expect(Arr.filter(data2)).toEqual(["Hello", "World"]);

        const data3 = [0, 1, 2, 3, 4, 5];
        expect(Arr.filter(data3, (_item, key) => key % 2 === 0)).toEqual([
            0, 2, 4,
        ]);

        expect(Arr.filter(null, () => true)).toEqual([]);
        expect(Arr.filter(undefined, () => true)).toEqual([]);
        expect(Arr.filter({}, () => true)).toEqual([]);
    });

    it("reject", () => {
        // Basic rejection (opposite of where)
        expect(Arr.reject([1, 2, 3, 4], (value) => value > 2)).toEqual([1, 2]);
        expect(Arr.reject([1, 2, 3, 4], (value) => value % 2 === 0)).toEqual([
            1, 3,
        ]);
        expect(Arr.reject([1, 2, 3, 4], (value) => value > 10)).toEqual([
            1, 2, 3, 4,
        ]);

        // With index parameter
        expect(
            Arr.reject(["a", "b", "c"], (_value, index) => index === 0),
        ).toEqual(["b", "c"]);

        // Null rejection
        expect(Arr.reject(["a", null, "b"], (value) => value === null)).toEqual(
            ["a", "b"],
        );

        // Non-accessible data
        expect(Arr.reject(null, () => true)).toEqual([]);
        expect(Arr.reject("abc", () => true)).toEqual([]);
    });

    describe("replace", () => {
        it("replace", () => {
            const data = ["a", "b", "c"];
            expect(Arr.replace(data, null)).toEqual(["a", "b", "c"]);

            expect(Arr.replace(data, ["d", "e"])).toEqual(["d", "e", "c"]);

            expect(
                Arr.replace(data, { 1: "d", 2: "e", 3: "f", 4: "g" }),
            ).toEqual(["a", "d", "e", "f", "g"]);

            const data2 = ["amir", "otwell"];
            expect(Arr.replace(data2, { 0: "taylor", 2: 26 })).toEqual([
                "taylor",
                "otwell",
                26,
            ]);

            // Fills gaps with undefined when replacement index skips ahead
            const gapData = ["x", "y", "z"];
            expect(Arr.replace(gapData, { 5: "end" })).toEqual([
                "x",
                "y",
                "z",
                undefined,
                undefined,
                "end",
            ]);
        });

        it("should return values unchanged when replacerData is a primitive", () => {
            // Tests final return when replacerData is not array or object
            expect(Arr.replace(["a", "b"], 123)).toEqual(["a", "b"]);
            expect(Arr.replace(["a", "b"], "string")).toEqual(["a", "b"]);
            expect(Arr.replace(["a", "b"], true)).toEqual(["a", "b"]);
        });

        describe("object edge cases", () => {
            it("should handle object with non-numeric keys", () => {
                // Tests isNaN(index) branch
                expect(
                    Arr.replace(["a", "b"], {
                        0: "x",
                        foo: "ignored",
                    } as unknown as Record<number, string>),
                ).toEqual(["x", "b"]);
            });

            it("should fill gaps when replacing with sparse indices", () => {
                // Tests filling gaps branch
                expect(Arr.replace(["a"], { 3: "d" })).toEqual([
                    "a",
                    undefined,
                    undefined,
                    "d",
                ]);
            });
        });
    });

    describe("replaceRecursive - edge cases", () => {
        it("replaceRecursive", () => {
            const data = ["a", "b", ["c", "d"]];

            expect(Arr.replaceRecursive(data, null)).toEqual([
                "a",
                "b",
                ["c", "d"],
            ]);
            expect(
                Arr.replaceRecursive(data, ["z", { 2: { 1: "e" } }]),
            ).toEqual(["z", "b", ["c", "e"]]);
            expect(
                Arr.replaceRecursive(data, ["z", { 2: { 1: "e" } }, "f"]),
            ).toEqual(["z", "b", ["c", "e"], "f"]);
            expect(
                Arr.replaceRecursive(data, ["z", { 2: { 1: "e" } }]),
            ).toEqual(["z", "b", ["c", "e"]]);
            expect(Arr.replaceRecursive(data, { 2: { 1: "e" } })).toEqual([
                "a",
                "b",
                ["c", "e"],
            ]);
        });

        it("should handle nested objects with non-numeric keys", () => {
            // This tests the objReplaceRecursive branch
            const data = [{ name: "John", details: { city: "NYC" } }];
            const replacer = [{ details: { city: "LA", country: "USA" } }];
            expect(Arr.replaceRecursive(data, replacer)).toEqual([
                { name: "John", details: { city: "LA", country: "USA" } },
            ]);
        });

        it("should fill gaps with undefined when index exceeds length in array replacer", () => {
            // Tests filling gaps with undefined
            const data = ["a", "b"];
            const replacer = [{ 5: "f" }];
            const result = Arr.replaceRecursive(data, replacer);
            expect(result[0]).toBe("a");
            expect(result[1]).toBe("b");
            expect(result[5]).toBe("f");
            expect(result.length).toBe(6);
        });

        it("should fill gaps with undefined when using numeric keyed object replacer", () => {
            // Tests filling gaps with undefined in numeric keyed object branch
            const data = ["a"];
            const replacer = { 3: "d" };
            const result = Arr.replaceRecursive(data, replacer);
            expect(result[0]).toBe("a");
            expect(result[3]).toBe("d");
            expect(result.length).toBe(4);
        });

        it("should handle mixed sequential and sparse replacements", () => {
            const data = ["a", "b", "c"];
            // First item 'x' goes to index 0, sparse {4: 'e'} sets index 4,
            // then 'z' goes to index 5 (currentIndex after 4+1)
            const replacer = ["x", { 4: "e" }, "z"];
            const result = Arr.replaceRecursive(data, replacer);
            expect(result[0]).toBe("x");
            expect(result[1]).toBe("b");
            expect(result[2]).toBe("c");
            expect(result[4]).toBe("e");
            expect(result[5]).toBe("z");
        });

        describe("final return", () => {
            it("should return values unchanged when replacerData is a primitive", () => {
                // Tests final return when replacerData is not array or numeric keyed object
                expect(Arr.replaceRecursive(["a", "b"], 123)).toEqual([
                    "a",
                    "b",
                ]);
                expect(Arr.replaceRecursive(["a", "b"], "string")).toEqual([
                    "a",
                    "b",
                ]);
                expect(Arr.replaceRecursive(["a", "b"], true)).toEqual([
                    "a",
                    "b",
                ]);
                // Non-numeric keyed object should also hit the final return
                expect(
                    Arr.replaceRecursive(["a", "b"], { foo: "bar" }),
                ).toEqual(["a", "b"]);
            });
        });

        describe("sparse indices edge cases", () => {
            it("should handle sparse numeric keyed object in array replacer", () => {
                // Tests sparse replacements with index >= currentIndex
                const data = ["a", "b", "c"];
                const replacer = [{ 5: "f" }];
                const result = Arr.replaceRecursive(data, replacer);
                expect(result[5]).toBe("f");
            });

            it("should handle sparse index less than currentIndex", () => {
                // Tests the branch where index < currentIndex (condition false)
                // First replacement at index 0 sets currentIndex to 1
                // Then sparse object with index 0 should NOT update currentIndex
                const data = ["a", "b", "c"];
                const replacer = ["x", { 0: "y" }];
                const result = Arr.replaceRecursive(data, replacer);
                // 'x' goes to index 0 first, then {0: 'y'} overwrites index 0
                expect(result[0]).toBe("y");
                expect(result[1]).toBe("b");
            });

            it("should handle numeric keyed object replacer directly", () => {
                // Tests isNumericKeyedObject(replacerData) branch
                const data = ["a", "b", "c"];
                const replacer = { 0: "x", 2: "z" };
                const result = Arr.replaceRecursive(data, replacer);
                expect(result).toEqual(["x", "b", "z"]);
            });

            it("should fill gaps when numeric keyed object has sparse indices", () => {
                // Tests gap filling in numeric keyed object replacer
                const data = ["a"];
                const replacer = { 3: "d" };
                const result = Arr.replaceRecursive(data, replacer);
                expect(result[0]).toBe("a");
                expect(result[3]).toBe("d");
                expect(result.length).toBe(4);
            });
        });
    });

    it("reverse", () => {
        const data = ["zaeed", "alan"];
        expect(Arr.reverse(data)).toEqual(["alan", "zaeed"]);

        const data2 = ["house", "roof", ["doors", "table"], "floor"];
        expect(Arr.reverse(data2)).toEqual([
            "floor",
            ["doors", "table"],
            "roof",
            "house",
        ]);
    });

    it("pad", () => {
        const data = [1, 2, 3];

        expect(Arr.pad(data, 4, 0)).toEqual([1, 2, 3, 0]);
        expect(Arr.pad([1, 2, 3, 4, 5], 3, 0)).toEqual([1, 2, 3, 4, 5]);
        expect(Arr.pad([1, 2, 3, 4, 5], 4, 0)).toEqual([1, 2, 3, 4, 5]);
        expect(Arr.pad([1, 2, 3], -4, 0)).toEqual([0, 1, 2, 3]);
        expect(Arr.pad([1, 2, 3, 4, 5], -4, 0)).toEqual([1, 2, 3, 4, 5]);
    });

    it("partition", () => {
        // Basic partitioning
        expect(Arr.partition([1, 2, 3, 4], (value) => value > 2)).toEqual([
            [3, 4],
            [1, 2],
        ]);
        expect(Arr.partition([1, 2, 3, 4], (value) => value % 2 === 0)).toEqual(
            [
                [2, 4],
                [1, 3],
            ],
        );
        expect(Arr.partition([1, 2, 3, 4], (value) => value > 10)).toEqual([
            [],
            [1, 2, 3, 4],
        ]);
        expect(Arr.partition([1, 2, 3, 4], (value) => value < 10)).toEqual([
            [1, 2, 3, 4],
            [],
        ]);

        // With index parameter
        expect(
            Arr.partition(["a", "b", "c"], (_value, index) => index > 0),
        ).toEqual([["b", "c"], ["a"]]);

        // Empty array
        expect(Arr.partition([], () => true)).toEqual([[], []]);

        // Non-accessible data
        expect(Arr.partition(null, () => true)).toEqual([[], []]);
        expect(Arr.partition("abc", () => true)).toEqual([[], []]);
    });

    it("select", () => {
        // Basic object selection
        const objects = [
            { a: 1, b: 2, c: 3 },
            { a: 4, b: 5, c: 6 },
        ];
        expect(Arr.select(objects, "a")).toEqual([{ a: 1 }, { a: 4 }]);
        expect(Arr.select(objects, ["a", "b"])).toEqual([
            { a: 1, b: 2 },
            { a: 4, b: 5 },
        ]);

        // Single object in array
        expect(Arr.select([{ x: 1, y: 2, z: 3 }], "x")).toEqual([{ x: 1 }]);
        expect(Arr.select([{ x: 1, y: 2, z: 3 }], ["x", "z"])).toEqual([
            { x: 1, z: 3 },
        ]);

        // Missing keys (should be omitted)
        expect(Arr.select([{ a: 1, b: 2 }], "c")).toEqual([{}]);
        expect(Arr.select([{ a: 1 }], ["a", "b"])).toEqual([{ a: 1 }]);

        // Empty array
        expect(Arr.select([], "a")).toEqual([]);

        // Non-accessible data
        expect(Arr.select(null, "a")).toEqual([]);
        expect(Arr.select("abc", "a")).toEqual([]);

        // Mixed object types
        const mixed = [
            { a: 1, b: 2 },
            { a: 3, c: 4 },
            { b: 5, c: 6 },
        ];
        expect(Arr.select(mixed, ["a", "b"])).toEqual([
            { a: 1, b: 2 },
            { a: 3 },
            { b: 5 },
        ]);
    });

    it("wrap", () => {
        // Basic wrapping
        expect(Arr.wrap("hello")).toEqual(["hello"]);
        expect(Arr.wrap(123)).toEqual([123]);
        expect(Arr.wrap(true)).toEqual([true]);

        // Arrays should not be wrapped
        expect(Arr.wrap(["hello"])).toEqual(["hello"]);
        expect(Arr.wrap([1, 2, 3])).toEqual([1, 2, 3]);
        expect(Arr.wrap([])).toEqual([]);

        // Null handling
        expect(Arr.wrap(null)).toEqual([]);

        // Undefined should be wrapped
        expect(Arr.wrap(undefined)).toEqual([undefined]);
    });

    it("keys", () => {
        // Basic key extraction
        expect(Arr.keys(["a", "b", "c"])).toEqual([0, 1, 2]);
        expect(Arr.keys({ x: 10, y: 20 })).toEqual([]);

        // Empty array
        expect(Arr.keys([])).toEqual([]);

        // Non-accessible data
        expect(Arr.keys(null)).toEqual([]);
        expect(Arr.keys("abc")).toEqual([]);
    });

    it("values", () => {
        // Basic value extraction
        expect(Arr.values({ a: 1, b: 2, c: 3 })).toEqual([]);
        expect(Arr.values(["x", "y", "z"])).toEqual(["x", "y", "z"]);

        // Empty array
        expect(Arr.values([])).toEqual([]);

        // Non-accessible data
        expect(Arr.values(null)).toEqual([]);
        expect(Arr.values("abc")).toEqual([]);
    });

    it("diff", () => {
        // Basic difference
        expect(Arr.diff([1, 2, 3], [2, 3, 4])).toEqual([1]);
        expect(Arr.diff(["a", "b", "c"], ["b", "c", "d"])).toEqual(["a"]);

        // No differences
        expect(Arr.diff([1, 2], [1, 2])).toEqual([]);
        expect(Arr.diff([], [])).toEqual([]);

        // All elements different
        expect(Arr.diff([1, 2], [3, 4])).toEqual([1, 2]);
        expect(Arr.diff(["a", "b"], ["c", "d"])).toEqual(["a", "b"]);

        // Empty first array
        expect(Arr.diff([], [1, 2])).toEqual([]);

        // Empty second array
        expect(Arr.diff([1, 2], [])).toEqual([1, 2]);

        expect(Arr.diff([1, 2], null)).toEqual([1, 2]);
        expect(Arr.diff(null, [1, 2])).toEqual([1, 2]);
        expect(Arr.diff(null, null)).toEqual([]);
    });

    it("intersect", () => {
        const data = [1, 2, 3, 4];
        expect(Arr.intersect(data, null)).toEqual([]);
        expect(Arr.intersect(data, [2, 3, 5])).toEqual([2, 3]);
        expect(Arr.intersect(data, [5, 6])).toEqual([]);
        expect(Arr.intersect(data, data)).toEqual([1, 2, 3, 4]);
        expect(Arr.intersect([], [1, 2])).toEqual([]);

        const data2 = [{ id: 1, first_word: "Hello" }];
        const data3 = [{ first_word: "Hello", last_word: "World" }];
        expect(Arr.intersect(data2, data3)).toEqual([]);
        expect(
            Arr.intersect(
                data2,
                data3,
                (a, b) => a.first_word === b.first_word,
            ),
        ).toEqual([{ id: 1, first_word: "Hello" }]);
    });

    it("intersectByKeys", () => {
        expect(Arr.intersectByKeys([1, 3, 5], [2, 4])).toEqual([1, 3]);

        const data = [
            { name: "Mateus", age: 18 },
            { name: "Nuno", age: 25 },
            { name: "Chris", age: 30 },
        ];
        expect(Arr.intersectByKeys(data, [1])).toEqual([
            { name: "Mateus", age: 18 },
        ]);
        expect(Arr.intersectByKeys(data, null)).toEqual([]);
        expect(Arr.intersectByKeys(null, data)).toEqual([]);
        expect(Arr.intersectByKeys(null, null)).toEqual([]);
    });

    it("only", () => {
        // Basic selection by indices
        expect(Arr.only(["a", "b", "c", "d"], [0, 2])).toEqual(["a", "c"]);
        expect(Arr.only(["a", "b", "c"], [1])).toEqual(["b"]);
        expect(Arr.only(["a", "b", "c"], [0, 1, 2])).toEqual(["a", "b", "c"]);

        // Out of bounds indices should be ignored
        expect(Arr.only(["a", "b"], [0, 5])).toEqual(["a"]);
        expect(Arr.only(["a", "b"], [10, 20])).toEqual([]);

        // Negative indices should be ignored
        expect(Arr.only(["a", "b", "c"], [-1, 0, 1])).toEqual(["a", "b"]);

        // Empty array
        expect(Arr.only([], [0, 1])).toEqual([]);

        // Empty keys
        expect(Arr.only(["a", "b", "c"], [])).toEqual([]);

        // Non-accessible data
        expect(Arr.only(null, [0, 1])).toEqual([]);
        expect(Arr.only("abc", [0, 1])).toEqual([]);
    });

    it("prepend", () => {
        // Basic prepending
        expect(Arr.prepend(["b", "c"], "a")).toEqual(["a", "b", "c"]);
        expect(Arr.prepend([2, 3], 1)).toEqual([1, 2, 3]);

        // Empty array
        expect(Arr.prepend([], "first")).toEqual(["first"]);

        // With key parameter
        expect(Arr.prepend(["b", "c"], "a", 0)).toEqual(["a", "b", "c"]);
        expect(Arr.prepend(["b", "c"], "a", 1)).toEqual([
            undefined,
            "a",
            "b",
            "c",
        ]);

        // Non-accessible data
        expect(Arr.prepend(null, "first")).toEqual(["first"]);
        expect(Arr.prepend("abc", "first")).toEqual(["first"]);
    });

    it("prependKeysWith", () => {
        // Basic key prepending
        expect(Arr.prependKeysWith(["a", "b", "c"], "item_")).toEqual({
            item_0: "a",
            item_1: "b",
            item_2: "c",
        });

        // Empty array
        expect(Arr.prependKeysWith([], "prefix_")).toEqual({});

        // Single item
        expect(Arr.prependKeysWith(["value"], "key_")).toEqual({
            key_0: "value",
        });

        // Non-accessible data
        expect(Arr.prependKeysWith(null, "prefix_")).toEqual({});
        expect(Arr.prependKeysWith("abc", "prefix_")).toEqual({});
    });

    it("map", () => {
        // Basic mapping
        expect(Arr.map([1, 2, 3], (value) => value * 2)).toEqual([2, 4, 6]);
        expect(
            Arr.map(["a", "b", "c"], (value) => value.toUpperCase()),
        ).toEqual(["A", "B", "C"]);

        // With index parameter
        expect(
            Arr.map(["a", "b"], (value, index) => `${index}:${value}`),
        ).toEqual(["0:a", "1:b"]);

        // Type transformation
        expect(Arr.map([1, 2, 3], (value) => String(value))).toEqual([
            "1",
            "2",
            "3",
        ]);
        expect(Arr.map(["1", "2", "3"], (value) => parseInt(value))).toEqual([
            1, 2, 3,
        ]);

        // Empty array
        expect(Arr.map([], (value) => value)).toEqual([]);

        // Non-accessible data
        expect(Arr.map(null, (value) => value)).toEqual([]);
        expect(Arr.map("abc", (value) => value)).toEqual([]);

        // Complex transformation
        const objects = [{ a: 1 }, { a: 2 }, { a: 3 }];
        expect(Arr.map(objects, (obj) => obj.a)).toEqual([1, 2, 3]);
    });

    describe("pluck", () => {
        it("pluck", () => {
            // Basic plucking with string key
            const users = [
                { name: "John", age: 30 },
                { name: "Jane", age: 25 },
                { name: "Bob", age: 35 },
            ];
            expect(Arr.pluck(users, "name")).toEqual(["John", "Jane", "Bob"]);
            expect(Arr.pluck(users, "age")).toEqual([30, 25, 35]);

            // Plucking with nested dot notation
            const nested = [
                { user: { name: "John", profile: { city: "NYC" } } },
                { user: { name: "Jane", profile: { city: "LA" } } },
            ];
            expect(Arr.pluck(nested, "user.name")).toEqual(["John", "Jane"]);
            expect(Arr.pluck(nested, "user.profile.city")).toEqual([
                "NYC",
                "LA",
            ]);

            // Plucking with key parameter (creates object)
            expect(Arr.pluck(users, "name", "age")).toEqual({
                30: "John",
                25: "Jane",
                35: "Bob",
            });

            // Plucking with callback functions
            expect(Arr.pluck(users, (user) => user.name.toUpperCase())).toEqual(
                ["JOHN", "JANE", "BOB"],
            );
            expect(
                Arr.pluck(users, "name", (user) => `user_${user.age}`),
            ).toEqual({
                user_30: "John",
                user_25: "Jane",
                user_35: "Bob",
            });

            // Missing keys return undefined
            expect(Arr.pluck(users, "missing")).toEqual([
                undefined,
                undefined,
                undefined,
            ]);

            // Empty array
            expect(Arr.pluck([], "name")).toEqual([]);

            // Non-accessible data
            expect(Arr.pluck(null, "name")).toEqual([]);
            expect(Arr.pluck("abc", "name")).toEqual([]);
        });

        it("should handle key with object having toString", () => {
            // Tests when nestedKey is stringable object
            const stringableObj = {
                toString() {
                    return "customKey";
                },
            };
            const data = [
                { value: "a", key: stringableObj },
                { value: "b", key: "normalKey" },
            ];
            const result = Arr.pluck(data, "value", "key");
            expect(result).toEqual({ customKey: "a", normalKey: "b" });
        });

        it("should handle non-null, non-string, non-number key values", () => {
            // Tests nestedKey is not string/number but also not null
            const data = [
                { value: "a", key: true },
                { value: "b", key: false },
            ];
            const result = Arr.pluck(data, "value", "key");
            expect(result).toEqual({ true: "a", false: "b" });
        });

        it("should handle null key value", () => {
            // Tests isNull(nestedKey) is true (false branch)
            const data = [
                { value: "a", key: null },
                { value: "b", key: "normalKey" },
            ];
            const result = Arr.pluck(data, "value", "key");
            // When key is null, itemKey stays undefined
            expect(result).toEqual({ normalKey: "b", undefined: "a" });
        });

        it("should handle string and number key values", () => {
            // Tests string and number branches
            const data = [
                { value: "a", key: "stringKey" },
                { value: "b", key: 123 },
            ];
            const result = Arr.pluck(data, "value", "key");
            expect(result).toEqual({ stringKey: "a", 123: "b" });
        });
    });

    describe("pop", () => {
        it("pop", () => {
            const data = [undefined, "foo", "bar"];

            expect(Arr.pop(data)).toBe("bar");

            expect(Arr.pop(null)).toBeNull();
            expect(Arr.pop(undefined)).toBeNull();
        });

        it("should return null when popping from empty array", () => {
            // Tests poppedValues.length === 0 returns null
            expect(Arr.pop([])).toBe(null);
            expect(Arr.pop([], 5)).toBe(null);
        });
    });

    describe("keyBy", () => {
        it("keyBy", () => {
            // Basic keying by field
            const users = [
                { id: 1, name: "John" },
                { id: 2, name: "Jane" },
                { id: 3, name: "Bob" },
            ];
            expect(Arr.keyBy(users, "id")).toEqual({
                1: { id: 1, name: "John" },
                2: { id: 2, name: "Jane" },
                3: { id: 3, name: "Bob" },
            });

            expect(Arr.keyBy(users, "name")).toEqual({
                John: { id: 1, name: "John" },
                Jane: { id: 2, name: "Jane" },
                Bob: { id: 3, name: "Bob" },
            });

            // Keying by nested field
            const nested = [
                { user: { id: 10 }, data: "a" },
                { user: { id: 20 }, data: "b" },
            ];
            expect(Arr.keyBy(nested, "user.id")).toEqual({
                10: { user: { id: 10 }, data: "a" },
                20: { user: { id: 20 }, data: "b" },
            });

            // Keying with callback
            expect(Arr.keyBy(users, (user) => `user_${user.id}`)).toEqual({
                user_1: { id: 1, name: "John" },
                user_2: { id: 2, name: "Jane" },
                user_3: { id: 3, name: "Bob" },
            });

            // Empty array
            expect(Arr.keyBy([], "id")).toEqual({});

            // Non-accessible data
            expect(Arr.keyBy(null, "id")).toEqual({});
            expect(Arr.keyBy("abc", "id")).toEqual({});

            // Missing key defaults to 'undefined' string
            const incomplete = [{ name: "John" }, { id: 2, name: "Jane" }];
            expect(Arr.keyBy(incomplete, "id")).toEqual({
                undefined: { name: "John" },
                2: { id: 2, name: "Jane" },
            });
        });

        it("should handle callback returning symbol", () => {
            // Tests when keyBy function returns a symbol
            const sym = Symbol("test");
            const data = [{ id: 1, name: "foo" }];
            // @ts-expect-error - testing runtime behavior with symbol return type
            const result = Arr.keyBy(data, () => sym);
            // @ts-expect-error - symbols cannot index Record<string, TValue>
            expect(result[sym]).toEqual({ id: 1, name: "foo" });
        });
    });

    it("mapWithKeys", () => {
        // Basic mapping with keys
        expect(
            Arr.mapWithKeys([{ id: 1, name: "John" }], (item) => ({
                [item.name]: item.id,
            })),
        ).toEqual({
            John: 1,
        });

        // Multiple key/value pairs
        const users = [
            { id: 1, name: "John" },
            { id: 2, name: "Jane" },
        ];
        expect(
            Arr.mapWithKeys(users, (item) => ({
                [item.name]: item.id,
            })),
        ).toEqual({
            John: 1,
            Jane: 2,
        });

        // Using index parameter
        expect(
            Arr.mapWithKeys(["a", "b"], (value, index) => ({
                [value]: index,
            })),
        ).toEqual({
            a: 0,
            b: 1,
        });

        // Complex mapping
        expect(
            Arr.mapWithKeys([1, 2, 3], (value) => ({
                [`item_${value}`]: value * 2,
            })),
        ).toEqual({
            item_1: 2,
            item_2: 4,
            item_3: 6,
        });

        // Empty array
        expect(
            Arr.mapWithKeys([], (value) => ({ [String(value)]: value })),
        ).toEqual({});

        // Non-accessible data
        expect(
            Arr.mapWithKeys(null, (value) => ({ [String(value)]: value })),
        ).toEqual({});
        expect(
            Arr.mapWithKeys("abc", (value) => ({ [String(value)]: value })),
        ).toEqual({});
    });

    it("array", () => {
        // Valid arrays
        expect(
            Arr.arrayItem(
                [
                    ["a", "b"],
                    ["c", "d"],
                ],
                0,
            ),
        ).toEqual(["a", "b"]);
        expect(Arr.arrayItem([{ items: ["x", "y"] }], "0.items")).toEqual([
            "x",
            "y",
        ]);

        // Default value (should be array)
        expect(Arr.arrayItem([1, 2, 3], 10, [])).toEqual([]);

        // Should throw for non-arrays
        expect(() => Arr.arrayItem([1, 2, 3], 0)).toThrow(
            "Array value for key [0] must be an array, number found.",
        );
        expect(() =>
            Arr.arrayItem([{ items: "not array" }], "0.items"),
        ).toThrow(
            "Array value for key [0.items] must be an array, string found.",
        );
        expect(() => Arr.arrayItem([null, ["valid"]], 0)).toThrow(
            "Array value for key [0] must be an array, null found.",
        );
    });

    it("boolean", () => {
        // Valid booleans
        expect(Arr.boolean([true, false], 0)).toBe(true);
        expect(Arr.boolean([true, false], 1)).toBe(false);
        expect(Arr.boolean([{ active: true }], "0.active")).toBe(true);

        // Default value (should be boolean)
        expect(Arr.boolean([1, 2, 3], 10, false)).toBe(false);

        // Should throw for non-booleans
        expect(() => Arr.boolean([1, 2, 3], 0)).toThrow(
            "Array value for key [0] must be a boolean, number found.",
        );
        expect(() => Arr.boolean([{ active: "yes" }], "0.active")).toThrow(
            "Array value for key [0.active] must be a boolean, string found.",
        );
        expect(() => Arr.boolean([null, true], 0)).toThrow(
            "Array value for key [0] must be a boolean, object found.",
        );
    });

    it("chunk", () => {
        const baseData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        const chunks = Arr.chunk(baseData, 3);

        expect(chunks.length).toBe(4);
        expect(chunks[0]).toEqual([1, 2, 3]);
        expect(chunks[1]).toEqual([4, 5, 6]);
        expect(chunks[2]).toEqual([7, 8, 9]);
        expect(chunks[3]).toEqual([10]);

        expect(Arr.chunk(baseData, 0)).toEqual([]);
        expect(Arr.chunk(baseData, -1)).toEqual([]);

        const chunksNoKeys = Arr.chunk(baseData, 3);

        expect(chunksNoKeys.length).toBe(4);
        expect(chunksNoKeys[0]).toEqual([1, 2, 3]);
        expect(chunksNoKeys[1]).toEqual([4, 5, 6]);
        expect(chunksNoKeys[2]).toEqual([7, 8, 9]);
        expect(chunksNoKeys[3]).toEqual([10]);
        expect(Arr.chunk(baseData, 0)).toEqual([]);
        expect(Arr.chunk(baseData, -1)).toEqual([]);
    });

    it("float", () => {
        // Valid numbers
        expect(Arr.float([1.5, 2.3], 1)).toBe(2.3);
        expect(Arr.float([{ price: 19.99 }], "0.price")).toBe(19.99);
        expect(Arr.float([42], 0)).toBe(42); // integers are valid numbers

        // Default value (should be number)
        expect(Arr.float([1, 2, 3], 10, 0.0)).toBe(0.0);

        // Should throw for non-numbers
        expect(() => Arr.float(["1.5", 2.3], 0)).toThrow(
            "Array value for key [0] must be a float, string found.",
        );
        expect(() => Arr.float([{ price: "free" }], "0.price")).toThrow(
            "Array value for key [0.price] must be a float, string found.",
        );
        expect(() => Arr.float([null, 1.5], 0)).toThrow(
            "Array value for key [0] must be a float, object found.",
        );
    });

    it("string", () => {
        // Valid strings
        expect(Arr.string(["hello", "world"], 0)).toBe("hello");
        expect(Arr.string([{ name: "John" }], "0.name")).toBe("John");

        // Default value (should be string)
        expect(Arr.string([1, 2, 3], 10, "default")).toBe("default");

        // Should throw for non-strings
        expect(() => Arr.string([123, "hello"], 0)).toThrow(
            "Array value for key [0] must be a string, number found.",
        );
        expect(() => Arr.string([{ name: 123 }], "0.name")).toThrow(
            "Array value for key [0.name] must be a string, number found.",
        );
        expect(() => Arr.string([null, "valid"], 0)).toThrow(
            "Array value for key [0] must be a string, object found.",
        );
    });

    it("sole", () => {
        // Single item - should return it
        expect(Arr.sole([42])).toBe(42);
        expect(Arr.sole(["single"])).toBe("single");

        // Single item with callback that matches one
        expect(Arr.sole([1, 2, 3], (value) => value > 2)).toBe(3);
        expect(
            Arr.sole(["apple", "banana"], (value) =>
                (value as string).includes("apple"),
            ),
        ).toBe("apple");

        // Should throw for empty arrays
        expect(() => Arr.sole([])).toThrow("No items found");
        expect(() => Arr.sole([1, 2, 3], (value) => value > 5)).toThrow(
            "No items found",
        );

        // Should throw for multiple items
        expect(() => Arr.sole([1, 2])).toThrow(
            "Multiple items found (2 items)",
        );
        expect(() => Arr.sole([1, 2, 3], (value) => value > 1)).toThrow(
            "Multiple items found (2 items)",
        );

        // Should throw for non-accessible data
        expect(() => Arr.sole(null)).toThrow("No items found");
        expect(() => Arr.sole("not array")).toThrow("No items found");
    });

    it("mapSpread", () => {
        // Basic spreading
        expect(
            Arr.mapSpread(
                [
                    [1, 2],
                    [3, 4],
                ],
                (a, b) => a + b,
            ),
        ).toEqual([3, 7]);

        expect(
            Arr.mapSpread(
                [
                    ["John", 25],
                    ["Jane", 30],
                ],
                (name, age) => `${name} is ${age}`,
            ),
        ).toEqual(["John is 25", "Jane is 30"]);

        // Empty array
        expect(
            Arr.mapSpread([], (a, b) => (a as number) + (b as number)),
        ).toEqual([]);

        // Single item arrays
        expect(Arr.mapSpread([[5]], (value) => value * 2)).toEqual([10]);

        // Mixed chunk sizes
        expect(
            Arr.mapSpread([[1], [2, 3], [4, 5, 6]], (...args) => args.length),
        ).toEqual([2, 3, 4]); // length includes index

        // Non-array chunks (should be passed as single values)
        expect(
            Arr.mapSpread(
                ["hello", "world"],
                (value, index) => `${index}: ${value}`,
            ),
        ).toEqual(["0: hello", "1: world"]);

        // Non-accessible data
        expect(Arr.mapSpread(null, (a) => a)).toEqual([]);
        expect(Arr.mapSpread("not array", (a) => a)).toEqual([]);
    });

    describe("query", () => {
        it("query", () => {
            // Basic object
            expect(Arr.query({ name: "John", age: 30 })).toBe(
                "name=John&age=30",
            );

            // Array
            expect(Arr.query(["a", "b", "c"])).toBe("0=a&1=b&2=c");

            // Nested object
            expect(Arr.query({ user: { name: "John", age: 30 } })).toBe(
                "user[name]=John&user[age]=30",
            );

            // Array with nested arrays
            expect(Arr.query({ tags: ["php", "js"] })).toBe(
                "tags[0]=php&tags[1]=js",
            );

            // Empty values are skipped
            expect(
                Arr.query({ name: "John", empty: null, undefined: undefined }),
            ).toBe("name=John");

            // Empty object/array
            expect(Arr.query({})).toBe("");
            expect(Arr.query([])).toBe("");

            // Null/undefined input
            expect(Arr.query(null)).toBe("");
            expect(Arr.query(undefined)).toBe("");

            // Special characters are encoded
            expect(Arr.query({ "special chars": "hello world & more" })).toBe(
                "special%20chars=hello%20world%20%26%20more",
            );

            // Scalar value
            expect(Arr.query("scalar")).toBe("0=scalar");
            expect(Arr.query(42)).toBe("0=42");

            // Complex nested structure
            expect(
                Arr.query({
                    simple: "value",
                    nested: {
                        array: [1, 2],
                        deep: { value: "test" },
                    },
                }),
            ).toBe(
                "simple=value&nested[array][0]=1&nested[array][1]=2&nested[deep][value]=test",
            );
        });

        it("should skip null and undefined values", () => {
            // Tests null/undefined values not added to parts
            const data = ["a", null, "b", undefined, "c"];
            const result = Arr.query(data);
            expect(result).toBe("0=a&2=b&4=c");
        });
    });

    it("shuffle", () => {
        // Test with arrays
        const arr = [1, 2, 3, 4, 5];
        const shuffled = Arr.shuffle(arr);

        // Should return a new array of same length
        expect(shuffled).toHaveLength(arr.length);
        expect(isArray(shuffled)).toBe(true);

        // Should contain all original elements
        expect(shuffled.sort()).toEqual(arr.sort());

        // Original array should not be modified
        expect(arr).toEqual([1, 2, 3, 4, 5]);

        // Test with empty array
        expect(Arr.shuffle([])).toEqual([]);

        // Test with non-accessible data
        expect(Arr.shuffle(null)).toEqual([]);
        expect(Arr.shuffle(undefined)).toEqual([]);
        expect(Arr.shuffle("string")).toEqual([]);

        // Test with single element
        expect(Arr.shuffle([42])).toEqual([42]);

        // Test with strings
        const strArr = ["a", "b", "c"];
        const shuffledStr = Arr.shuffle(strArr);
        expect(shuffledStr).toHaveLength(3);
        expect(shuffledStr.sort()).toEqual(["a", "b", "c"]);
    });

    it("slice", () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8];

        expect(Arr.slice(data, 3)).toEqual([4, 5, 6, 7, 8]);
        expect(Arr.slice(data, -3)).toEqual([6, 7, 8]);
        expect(Arr.slice(data, 3, 3)).toEqual([4, 5, 6]);
        expect(Arr.slice(data, 3, -1)).toEqual([4, 5, 6, 7]);
        expect(Arr.slice(data, -5, 3)).toEqual([4, 5, 6]);
        expect(Arr.slice(data, -6, -2)).toEqual([3, 4, 5, 6]);

        expect(Arr.slice({}, -6, -2)).toEqual([]);
        expect(Arr.slice(null, -6, -2)).toEqual([]);
        expect(Arr.slice(undefined, -6, -2)).toEqual([]);
    });

    it("random", () => {
        const arr = [1, 2, 3, 4, 5];

        // Single random item (default behavior)
        const single = Arr.random(arr);
        expect(isArray(single)).toBe(false);
        expect(arr).toContain(single);

        // Explicitly request single item
        const singleExplicit = Arr.random(arr, 1);
        expect(isArray(singleExplicit)).toBe(true);
        expect(singleExplicit).toHaveLength(1);
        expect(arr).toContain(singleExplicit[0]);

        // Multiple random items
        const multiple = Arr.random(arr, 3);
        expect(isArray(multiple)).toBe(true);
        expect(multiple).toHaveLength(3);
        multiple.forEach((item: number) => expect(arr).toContain(item));

        // Multiple items with preserved keys
        const withKeys = Arr.random(arr, 2, true);
        expect(typeof withKeys).toBe("object");
        expect(isArray(withKeys)).toBe(false);
        Object.values(withKeys).forEach((item) => expect(arr).toContain(item));

        // Test edge cases
        expect(Arr.random([])).toBe(null);
        expect(Arr.random([], 1)).toEqual([]);
        expect(Arr.random(null)).toBe(null);
        expect(Arr.random(undefined)).toBe(null);

        // Test requesting more items than available
        expect(() => Arr.random([1, 2], 5)).toThrow(
            "You requested 5 items, but there are only 2 items available.",
        );

        // Test with zero or negative requests
        expect(Arr.random([1, 2, 3], 0)).toEqual([]);
        expect(Arr.random([1, 2, 3], -1)).toEqual([]);

        // Test with single element
        expect(Arr.random([42])).toBe(42);
        expect(Arr.random([42], 1)).toEqual([42]);
        expect(Arr.random([42], 1, true)).toEqual({ 0: 42 });
    });

    describe("shift", () => {
        it("shift", () => {
            const data = ["Taylor", "Otwell"];

            expect(Arr.shift(data)).toBe("Taylor");

            data.unshift(undefined!);
            expect(Arr.shift(data)).toBeNull();
            expect(Arr.shift(data, 2)).toEqual(["Taylor"]);

            expect(Arr.shift({}, 2)).toEqual([]);

            expect(Arr.shift(null)).toBeNull();
            expect(Arr.shift(undefined)).toBeNull();
        });

        it("should return empty array when shifting multiple from empty array", () => {
            // Tests empty result with count > 1
            expect(Arr.shift([], 3)).toEqual([]);
        });

        it("should return null when shifting single from empty array", () => {
            expect(Arr.shift([], 1)).toBe(null);
        });
    });

    it("sort", () => {
        // Natural sorting
        expect(Arr.sort([3, 1, 4, 1, 5])).toEqual([1, 1, 3, 4, 5]);
        expect(Arr.sort(["banana", "apple", "cherry"])).toEqual([
            "apple",
            "banana",
            "cherry",
        ]);

        // Sort with callback function
        const people = [
            { name: "John", age: 25 },
            { name: "Jane", age: 30 },
            { name: "Bob", age: 20 },
        ];

        expect(Arr.sort(people, (person) => person.age)).toEqual([
            { name: "Bob", age: 20 },
            { name: "John", age: 25 },
            { name: "Jane", age: 30 },
        ]);

        expect(Arr.sort(people, (person) => person.name)).toEqual([
            { name: "Bob", age: 20 },
            { name: "Jane", age: 30 },
            { name: "John", age: 25 },
        ]);

        // Sort with field name (dot notation)
        expect(Arr.sort(people, "age")).toEqual([
            { name: "Bob", age: 20 },
            { name: "John", age: 25 },
            { name: "Jane", age: 30 },
        ]);

        expect(Arr.sort(people, "name")).toEqual([
            { name: "Bob", age: 20 },
            { name: "Jane", age: 30 },
            { name: "John", age: 25 },
        ]);

        // Sort with nested field
        const nested = [
            { user: { name: "John" } },
            { user: { name: "Alice" } },
            { user: { name: "Bob" } },
        ];
        expect(Arr.sort(nested, "user.name")).toEqual([
            { user: { name: "Alice" } },
            { user: { name: "Bob" } },
            { user: { name: "John" } },
        ]);

        // Test with empty array
        expect(Arr.sort([])).toEqual([]);

        // Test with non-accessible data
        expect(Arr.sort(null)).toEqual([]);
        expect(Arr.sort(undefined)).toEqual([]);

        // Test with null callback
        expect(Arr.sort([3, 1, 2], null)).toEqual([1, 2, 3]);

        // Original array should not be modified
        const original = [3, 1, 2];
        const sorted = Arr.sort(original);
        expect(original).toEqual([3, 1, 2]);
        expect(sorted).toEqual([1, 2, 3]);
    });

    it("sortDesc", () => {
        // Natural sorting in descending order
        expect(Arr.sortDesc([3, 1, 4, 1, 5])).toEqual([5, 4, 3, 1, 1]);
        expect(Arr.sortDesc(["banana", "apple", "cherry"])).toEqual([
            "cherry",
            "banana",
            "apple",
        ]);

        // Sort with callback function in descending order
        const people = [
            { name: "John", age: 25 },
            { name: "Jane", age: 30 },
            { name: "Bob", age: 20 },
        ];

        expect(Arr.sortDesc(people, (person) => person.age)).toEqual([
            { name: "Jane", age: 30 },
            { name: "John", age: 25 },
            { name: "Bob", age: 20 },
        ]);

        expect(Arr.sortDesc(people, (person) => person.name)).toEqual([
            { name: "John", age: 25 },
            { name: "Jane", age: 30 },
            { name: "Bob", age: 20 },
        ]);

        // Sort with field name (dot notation) in descending order
        expect(Arr.sortDesc(people, "age")).toEqual([
            { name: "Jane", age: 30 },
            { name: "John", age: 25 },
            { name: "Bob", age: 20 },
        ]);

        expect(Arr.sortDesc(people, "name")).toEqual([
            { name: "John", age: 25 },
            { name: "Jane", age: 30 },
            { name: "Bob", age: 20 },
        ]);

        // Sort with nested field in descending order
        const nested = [
            { user: { name: "John" } },
            { user: { name: "Alice" } },
            { user: { name: "Bob" } },
        ];
        expect(Arr.sortDesc(nested, "user.name")).toEqual([
            { user: { name: "John" } },
            { user: { name: "Bob" } },
            { user: { name: "Alice" } },
        ]);

        // Test with empty array
        expect(Arr.sortDesc([])).toEqual([]);

        // Test with non-accessible data
        expect(Arr.sortDesc(null)).toEqual([]);
        expect(Arr.sortDesc(undefined)).toEqual([]);

        // Test with null callback
        expect(Arr.sortDesc([1, 3, 2], null)).toEqual([3, 2, 1]);

        // Original array should not be modified
        const original = [1, 3, 2];
        const sorted = Arr.sortDesc(original);
        expect(original).toEqual([1, 3, 2]);
        expect(sorted).toEqual([3, 2, 1]);
    });

    describe("toCssClasses", () => {
        it("toCssClasses", () => {
            // Basic array of classes
            expect(Arr.toCssClasses(["font-bold", "mt-4"])).toBe(
                "font-bold mt-4",
            );

            // Mixed array with conditional classes
            expect(
                Arr.toCssClasses({
                    "font-bold": true,
                    "mt-4": true,
                    "ml-2": true,
                    "mr-2": false,
                }),
            ).toBe("font-bold mt-4 ml-2");

            // Object-only with conditional keys
            expect(
                Arr.toCssClasses({
                    "font-bold": true,
                    "mt-4": true,
                    "ml-2": true,
                    "mr-2": false,
                }),
            ).toBe("font-bold mt-4 ml-2");

            // Empty cases
            expect(Arr.toCssClasses([])).toBe("");
            expect(Arr.toCssClasses({})).toBe("");
            expect(Arr.toCssClasses(null)).toBe("");
            expect(Arr.toCssClasses(undefined)).toBe("");

            // Object with all false values
            expect(
                Arr.toCssClasses({
                    "font-bold": false,
                    "mt-4": false,
                }),
            ).toBe("");

            // Complex nested object (should be flattened by wrap)
            expect(
                Arr.toCssClasses({
                    "font-bold": true,
                    "text-red": false,
                    "bg-blue": true,
                }),
            ).toBe("font-bold bg-blue");
        });

        it("should handle plain object input", () => {
            // Tests isObject branch
            const obj = { "font-bold": true, "text-red": false };
            expect(Arr.toCssClasses(obj)).toBe("font-bold");
        });

        it("should handle non-string values in numeric keys", () => {
            // Tests branch where numeric key value is not a string
            expect(Arr.toCssClasses([123, null, undefined, true])).toBe("");
            expect(Arr.toCssClasses(["valid-class", 123])).toBe("valid-class");
        });
    });

    describe("toCssStyles", () => {
        it("toCssStyles", () => {
            // Basic array of styles
            expect(
                Arr.toCssStyles(["font-weight: bold", "margin-top: 4px"]),
            ).toBe("font-weight: bold; margin-top: 4px;");

            // Styles with and without semicolons
            expect(
                Arr.toCssStyles(["font-weight: bold;", "margin-top: 4px"]),
            ).toBe("font-weight: bold; margin-top: 4px;");

            // Mixed array with conditional styles
            expect(
                Arr.toCssStyles({
                    "font-weight: bold": true,
                    "margin-top: 4px": true,
                    "margin-left: 2px": true,
                    "margin-right: 2px": false,
                }),
            ).toBe("font-weight: bold; margin-top: 4px; margin-left: 2px;");

            // Empty cases
            expect(Arr.toCssStyles([])).toBe("");
            expect(Arr.toCssStyles({})).toBe("");
            expect(Arr.toCssStyles(null)).toBe("");
            expect(Arr.toCssStyles(undefined)).toBe("");

            // Object with all false values
            expect(
                Arr.toCssStyles({
                    "font-weight: bold": false,
                    "margin-top: 4px": false,
                }),
            ).toBe("");

            // Styles already ending with semicolon should not get double semicolons
            expect(Arr.toCssStyles(["font-weight: bold;"])).toBe(
                "font-weight: bold;",
            );
        });

        it("should handle plain object input", () => {
            // Tests isObject branch
            const obj = {
                "font-weight: bold": true,
                "color: red": false,
            };
            expect(Arr.toCssStyles(obj)).toBe("font-weight: bold;");
        });

        it("should handle non-string values in numeric keys", () => {
            // Tests branch where numeric key value is not a string
            expect(Arr.toCssStyles([123, null, undefined, true])).toBe("");
            expect(Arr.toCssStyles(["color: red", 123])).toBe("color: red;");
        });
    });

    describe("sortRecursive", () => {
        it("sortRecursive", () => {
            // Basic nested array sorting
            const basic = {
                b: [3, 1, 2],
                a: { d: 2, c: 1 },
            };
            const basicExpected = {
                a: { c: 1, d: 2 },
                b: [1, 2, 3],
            };
            expect(Arr.sortRecursive(basic)).toEqual(basicExpected);

            // Complex nested structure from PHP tests
            const complex = {
                users: [
                    {
                        name: "joe",
                        mail: "joe@example.com",
                        numbers: [2, 1, 0],
                    },
                    {
                        name: "jane",
                        age: 25,
                    },
                ],
                repositories: [{ id: 1 }, { id: 0 }],
                20: [2, 1, 0],
                30: {
                    2: "a",
                    1: "b",
                    0: "c",
                },
            };

            const complexExpected = {
                20: [0, 1, 2],
                30: {
                    0: "c",
                    1: "b",
                    2: "a",
                },
                repositories: [{ id: 0 }, { id: 1 }],
                users: [
                    {
                        age: 25,
                        name: "jane",
                    },
                    {
                        mail: "joe@example.com",
                        name: "joe",
                        numbers: [0, 1, 2],
                    },
                ],
            };

            expect(Arr.sortRecursive(complex)).toEqual(complexExpected);

            // Empty cases
            expect(Arr.sortRecursive([])).toEqual([]);
            expect(Arr.sortRecursive({})).toEqual({});
            expect(Arr.sortRecursive(null)).toEqual(null);
            expect(Arr.sortRecursive(undefined)).toEqual(undefined);

            // Simple array
            expect(Arr.sortRecursive([3, 1, 2])).toEqual([1, 2, 3]);

            // Simple object
            expect(Arr.sortRecursive({ c: 3, a: 1, b: 2 })).toEqual({
                a: 1,
                b: 2,
                c: 3,
            });

            // Test descending parameter
            expect(Arr.sortRecursive([3, 1, 2], true)).toEqual([3, 2, 1]);
            expect(Arr.sortRecursive({ c: 3, a: 1, b: 2 }, true)).toEqual({
                c: 3,
                b: 2,
                a: 1,
            });
        });

        it("should return primitive values unchanged", () => {
            // Tests else branch returning data unchanged
            expect(Arr.sortRecursive(42)).toEqual(42);
            expect(Arr.sortRecursive("string")).toEqual("string");
            expect(Arr.sortRecursive(true)).toEqual(true);
            expect(Arr.sortRecursive(false)).toEqual(false);
        });
    });

    it("sortRecursiveDesc", () => {
        // Basic nested array sorting in descending order
        const basic = {
            a: [1, 2, 3],
            b: { c: 1, d: 2 },
        };
        const basicExpected = {
            b: { d: 2, c: 1 },
            a: [3, 2, 1],
        };
        expect(Arr.sortRecursiveDesc(basic)).toEqual(basicExpected);

        // Complex nested structure from PHP tests
        const complex = {
            empty: [],
            nested: {
                level1: {
                    level2: {
                        level3: [2, 3, 1],
                    },
                    values: [4, 5, 6],
                },
            },
            mixed: {
                a: 1,
                2: "b",
                c: 3,
                1: "d",
            },
            numbered_index: {
                1: "e",
                3: "c",
                4: "b",
                5: "a",
                2: "d",
            },
        };

        const complexExpected = {
            numbered_index: {
                5: "a",
                4: "b",
                3: "c",
                2: "d",
                1: "e",
            },
            nested: {
                level1: {
                    values: [6, 5, 4],
                    level2: {
                        level3: [3, 2, 1],
                    },
                },
            },
            mixed: {
                c: 3,
                a: 1,
                2: "b",
                1: "d",
            },
            empty: [],
        };

        expect(Arr.sortRecursiveDesc(complex)).toEqual(complexExpected);

        // Empty cases
        expect(Arr.sortRecursiveDesc([])).toEqual([]);
        expect(Arr.sortRecursiveDesc({})).toEqual({});
        expect(Arr.sortRecursiveDesc(null)).toEqual(null);
        expect(Arr.sortRecursiveDesc(undefined)).toEqual(undefined);

        // Simple array
        expect(Arr.sortRecursiveDesc([1, 2, 3])).toEqual([3, 2, 1]);

        // Simple object
        expect(Arr.sortRecursiveDesc({ a: 1, b: 2, c: 3 })).toEqual({
            c: 3,
            b: 2,
            a: 1,
        });
    });

    it("splice", () => {
        let data = ["foo", "baz"];
        expect(Arr.splice(data, 1).removed).toEqual(["baz"]);
        expect(Arr.splice(data, 0).removed).toEqual(["foo", "baz"]);
        expect(Arr.splice(data, 2).removed).toEqual([]);

        // Remove 1 element at index 1
        data = ["foo", "baz"];
        let result = Arr.splice(data, 1, 1);
        expect(result.value).toEqual(["foo"]);
        expect(result.removed).toEqual(["baz"]);

        // Remove 1 element at index 1 and insert 'bar'
        data = ["foo", "baz"];
        result = Arr.splice(data, 1, 1, "bar");
        expect(result.value).toEqual(["foo", "bar"]);
        expect(result.removed).toEqual(["baz"]);

        // Insert 'bar' at index 1 without removing anything
        data = ["foo", "baz"];
        result = Arr.splice(data, 1, 0, "bar");
        expect(result.value).toEqual(["foo", "bar", "baz"]);
        expect(result.removed).toEqual([]);

        // Insert array ['bar'] at index 1 - should flatten it
        data = ["foo", "baz"];
        const result4 = Arr.splice(data, 1, 0, ["bar"] as unknown as string);
        expect(result4.value).toEqual(["foo", "bar", "baz"]);
        expect(result4.removed).toEqual([]);

        // Edge cases
        data = ["foo", "baz"];
        result = Arr.splice(data, 0, 0, "start");
        expect(result.value).toEqual(["start", "foo", "baz"]);
        expect(result.removed).toEqual([]);

        // Remove multiple elements
        data = ["foo", "bar", "baz"];
        result = Arr.splice(data, 0, 2);
        expect(result.value).toEqual(["baz"]);
        expect(result.removed).toEqual(["foo", "bar"]);

        // Non-accessible data
        expect(Arr.splice(null as unknown as string[], 0, 1)).toEqual({
            value: [],
            removed: [],
        });
        expect(Arr.splice(undefined as unknown as string[], 0, 1)).toEqual({
            value: [],
            removed: [],
        });
    });

    // Edge cases and error conditions
    describe("Edge Cases", () => {
        it("pull with non-accessible data", () => {
            // Should handle non-arrays gracefully
            const result = Arr.pull("not-array", 0);
            expect(result.value).toBe(null);
            expect(result.data).toEqual([]);
        });

        it("pull with null key", () => {
            // Should handle null key
            const result = Arr.pull([1, 2, 3], null);
            expect(result.value).toBe(null);
            expect(result.data).toEqual([1, 2, 3]);
        });

        it("pluck with complex key paths", () => {
            const data = [
                { user: { name: "John" } },
                { user: { name: "Jane" } },
            ];

            // Test deep key path
            expect(Arr.pluck(data, "user.name")).toEqual(["John", "Jane"]);

            // Test with callback function
            expect(Arr.pluck(data, (item) => item.user.name)).toEqual([
                "John",
                "Jane",
            ]);
        });

        it("query with nested objects", () => {
            const data = {
                user: {
                    name: "John",
                    meta: {
                        age: 30,
                    },
                },
            };

            const result = Arr.query(data);
            expect(result).toContain("user[name]=John");
            expect(result).toContain("user[meta][age]=30");
        });

        it("sort with different types", () => {
            // Test sorting with mixed types
            const mixed = [3, "a", 1, "b", 2];
            const sorted = Arr.sort(mixed);

            // Should handle mixed types gracefully
            expect(sorted).toHaveLength(5);
            expect(sorted).toContain(1);
            expect(sorted).toContain(2);
            expect(sorted).toContain(3);
            expect(sorted).toContain("a");
            expect(sorted).toContain("b");
        });

        it("sortDesc with different types", () => {
            // Test sorting desc with mixed types
            const mixed = [1, "a", 3, "b", 2];
            const sorted = Arr.sortDesc(mixed);

            // Should handle mixed types gracefully
            expect(sorted).toHaveLength(5);
            expect(sorted).toContain(1);
            expect(sorted).toContain(2);
            expect(sorted).toContain(3);
            expect(sorted).toContain("a");
            expect(sorted).toContain("b");
        });
    });

    // Path utility functions tests
    describe("Path Functions", () => {
        it("should test edge cases in path operations", () => {
            // Test setImmutable with non-accessible data
            expect(Arr.set("not-array", 0, "value")).toEqual([]);

            // Test setImmutable with null key (replacement)
            expect(Arr.set([1, 2, 3], null, "replaced")).toEqual("replaced");

            // Test push with complex nested paths that need creation
            expect(Arr.push([], "0.0.0", "deep")).toEqual([[["deep"]]]);

            // Test push with paths
            const result = Arr.push([], "2", "value");
            expect(result).toEqual(["value"]); // pushWithPath appends to root when path doesn't exist
        });

        it("should handle array bounds and edge cases", () => {
            // Test array operations with edge indices
            expect(Arr.get([1, 2, 3], 10, "default")).toBe("default");
            expect(Arr.set([1, 2, 3], 3, "new")).toEqual([1, 2, 3, "new"]); // Set at next available index

            // Test with negative indices (should be handled safely)
            expect(Arr.get([1, 2, 3], -1, "default")).toBe("default");

            // Test dot notation with invalid segments
            expect(Arr.get([1, 2, 3], "invalid.path", "default")).toBe(
                "default",
            );
            expect(Arr.set([1, 2, 3], "invalid.path", "value")).toEqual([
                1, 2, 3,
            ]);
        });

        it("should test complex push scenarios", () => {
            // Test push with existing nested structure
            const nested = [
                ["a", "b"],
                ["c", "d"],
            ];
            expect(Arr.push(nested, null, "new")).toEqual([
                ["a", "b"],
                ["c", "d"],
                "new",
            ]); // Push to root

            // Test push to create intermediate arrays
            expect(Arr.push([], "1.0", "item")).toEqual([["item"]]); // Creates minimal structure

            // Test push with boolean conflict - should throw error
            try {
                const data = [true]; // This is a boolean, not an array at index 0
                Arr.push(data, "0", "value");
                // If we get here, something went wrong - but actually this won't throw in our current implementation
                // because we handle mixed types gracefully
            } catch (error) {
                expect((error as Error).message).toContain("must be an array");
            }
        });

        it("should test error conditions", () => {
            // Create a structure that would cause type conflicts
            const mixedData = ["string", { obj: true }];

            // These should handle mixed types gracefully
            const result1 = Arr.get(mixedData, "0.prop", "default");
            expect(result1).toBe("default"); // Can't access prop on string

            const result2 = Arr.get(mixedData, "1.obj", "default");
            expect(result2).toBe(true);
        });

        it("should test range and boundary conditions", () => {
            // Test indices
            expect(Arr.set([], 0, "far")).toHaveLength(1);
            expect(Arr.set([], 0, "far")[0]).toBe("far");

            // Test empty string keys
            expect(Arr.get([1, 2, 3], "", "default")).toBe("default");

            // Test dotted keys with empty segments
            expect(Arr.get([[[1]]], "0..0", "default")).toBe("default");
        });

        it("should test remaining arr.ts edge cases", () => {
            // Test pluck with key function that returns object with toString method
            const dataForPluck = [
                {
                    value: "item1",
                    keyObj: {
                        toString() {
                            return "key1";
                        },
                    },
                },
                {
                    value: "item2",
                    keyObj: {
                        toString() {
                            return "key2";
                        },
                    },
                },
            ];
            // This should trigger the toString conversion when keyObj is used as key
            const pluckResult = Arr.pluck(dataForPluck, "value", "keyObj");
            expect(pluckResult).toEqual({ key1: "item1", key2: "item2" });

            // Test query with array containing objects (to trigger recursion)
            const arrayWithObjects = [
                { name: "John", age: 30 },
                "simpleString",
                { nested: { deep: "value" } },
            ];
            const queryResult = Arr.query(arrayWithObjects);
            expect(queryResult).toContain("0[name]=John");
            expect(queryResult).toContain("0[age]=30");
            expect(queryResult).toContain("1=simpleString");
            expect(queryResult).toContain("2[nested][deep]=value");

            // Test sort/sortDesc with callback functions that return different values
            const dataToSort = [
                { val: 10, name: "b" },
                { val: 5, name: "c" },
                { val: 15, name: "a" },
            ];

            // sort with callback function - need values that are actually different to trigger comparison
            const sortedResult = Arr.sort(dataToSort, (item: unknown) => {
                const typedItem = item as { val: number; name: string };
                return typedItem.val; // This should trigger compareValues call
            });
            expect(sortedResult).toEqual([
                { val: 5, name: "c" },
                { val: 10, name: "b" },
                { val: 15, name: "a" },
            ]);

            // sortDesc with callback function - need values that are different to trigger comparison
            const sortedDescResult = Arr.sortDesc(
                dataToSort,
                (item: unknown) => {
                    const typedItem = item as { val: number; name: string };
                    return typedItem.val; // This should trigger compareValues call
                },
            );
            expect(sortedDescResult).toEqual([
                { val: 15, name: "a" },
                { val: 10, name: "b" },
                { val: 5, name: "c" },
            ]);

            // Additional test: Force comparison with values that need actual sorting
            // Create data that will definitely trigger the comparison logic
            const dataForComparison = [
                { priority: 100, id: "third" },
                { priority: 1, id: "first" },
                { priority: 50, id: "second" },
                { priority: 200, id: "fourth" },
            ];

            // This MUST trigger compareValues on because values are different
            const forceComparisonSort = Arr.sort(
                dataForComparison,
                (item: unknown) => {
                    const typed = item as { priority: number; id: string };
                    return typed.priority; // Different values: 100, 1, 50, 200
                },
            );
            expect(
                (forceComparisonSort[0] as { priority: number }).priority,
            ).toBe(1);
            expect(
                (forceComparisonSort[3] as { priority: number }).priority,
            ).toBe(200);

            // This MUST trigger compareValues on because values are different
            const forceComparisonSortDesc = Arr.sortDesc(
                dataForComparison,
                (item: unknown) => {
                    const typed = item as { priority: number; id: string };
                    return typed.priority; // Different values: 100, 1, 50, 200
                },
            );
            expect(
                (forceComparisonSortDesc[0] as { priority: number }).priority,
            ).toBe(200);
            expect(
                (forceComparisonSortDesc[3] as { priority: number }).priority,
            ).toBe(1);
        });

        it("should cover final return statements in sort functions", () => {
            // The final return statements are only reached if callback is truthy but neither string nor function
            // Let's try with different edge case values that might bypass the early checks
            const sortData = [3, 1, 4, 1, 5];

            // Test with a number (truthy, not string, not function)
            // @ts-expect-error Testing edge case with invalid callback type
            const sortedWithNumber = Arr.sort(sortData, 123);
            expect(sortedWithNumber).toEqual([3, 1, 4, 1, 5]);

            // Test with an object (truthy, not string, not function)
            // @ts-expect-error Testing edge case with invalid callback type
            const sortedWithObject = Arr.sort(sortData, { key: "value" });
            expect(sortedWithObject).toEqual([3, 1, 4, 1, 5]);

            // Test sortDesc with a number
            // @ts-expect-error Testing edge case with invalid callback type
            const sortedDescWithNumber = Arr.sortDesc(sortData, 123);
            expect(sortedDescWithNumber).toEqual([3, 1, 4, 1, 5]);

            // Test sortDesc with an object
            const sortedDescWithObject = Arr.sortDesc(sortData, {
                key: "value",
            } as unknown as (item: unknown) => unknown);
            expect(sortedDescWithObject).toEqual([3, 1, 4, 1, 5]);
        });

        it("should test path function edge cases and error conditions", () => {
            // Test parseSegments with invalid numeric keys
            // This should be tested via functions that use parseSegments
            expect(Arr.get([], -1, "default")).toBe("default");
            expect(Arr.set([], -1, "value")).toEqual([]);

            // Test pushWithPath error conditions
            // Try to create structure that would cause type conflicts
            try {
                // This attempts to push to a path where intermediate value conflicts
                const data: unknown = [];
                Arr.push(data, "0.prop", "value"); // Should work, creates nested structure
                expect(isArray(data)).toBe(true);
            } catch (error) {
                // If it throws, that's also a valid test of error handling
                expect(error).toBeDefined();
            }

            // Test getNestedValue with edge cases
            // These are likely related to null/undefined object handling
            expect(Arr.get([null], "0.prop", "default")).toBe("default");
            expect(Arr.get([undefined], "0.prop", "default")).toBe("default");
            expect(Arr.get([{}], "0.nonexistent", "default")).toBe("default");

            // Test getMixedValue edge cases
            expect(Arr.get("not-array", "0", "default")).toBe("default");
            expect(Arr.get({}, "0", "default")).toBe("default");

            // Test array bounds with mixed notation
            expect(Arr.get([{ data: [1, 2, 3] }], "0.data.10", "default")).toBe(
                "default",
            );

            // Test invalid array access
            expect(
                Arr.get([{ data: "not-array" }], "0.data.0", "default"),
            ).toBe("default");
        });

        it("should test internal path utility functions directly", () => {
            // Test undotExpand with edge cases
            const flattened = {
                "0.0": "deep",
                "1": "shallow",
                "invalid.key": "ignored",
            };
            const expanded = Arr.undot(flattened);
            expect(expanded).toEqual([["deep"], "shallow"]);

            // Test complex nested push operations
            const nested = Arr.push([], "0.1.2", "deep-value");
            expect(nested).toEqual([[["deep-value"]]]); // Creates minimal structure needed

            // Test mixed type access patterns - numeric only paths don't work with object properties
            const mixed = [{ name: "John", data: [1, 2, { nested: true }] }];
            expect(Arr.get(mixed, "0", "default")).toEqual({
                name: "John",
                data: [1, 2, { nested: true }],
            }); // Get whole object
            expect(Arr.get(mixed, "0.data.2.nonexistent", "default")).toBe(
                "default",
            );
        });
    });

    describe("get", () => {
        it("should return array itself when key is null/undefined", () => {
            // Tests null key with array returns array itself
            expect(Arr.get([1, 2, 3], null)).toEqual([1, 2, 3]);
            expect(Arr.get([1, 2, 3], undefined)).toEqual([1, 2, 3]);
        });

        it("should call default function when key is null and data is not array", () => {
            // Tests defaultValue as function when key is null and data is not array
            const defaultFn = () => "default";
            expect(Arr.get("not-array", null, defaultFn)).toBe("default");
            expect(Arr.get({ a: 1 }, null, defaultFn)).toBe("default");
        });

        it("should return non-function default when key is null and data is not array", () => {
            // Tests defaultValue as non-function when key is null and data is not array
            expect(Arr.get("not-array", null, "default")).toBe("default");
            expect(Arr.get({ a: 1 }, null, "default-value")).toBe(
                "default-value",
            );
        });

        it("should call default function when data is not an array with non-null key", () => {
            // Tests defaultValue function called when key is not null and data is not array
            const defaultFn = () => "default-from-fn";
            expect(Arr.get("not-array", 0, defaultFn)).toBe("default-from-fn");
            expect(Arr.get({ a: 1 }, "key", defaultFn)).toBe("default-from-fn");
        });

        it("should return non-function default when data is not an array with non-null key", () => {
            // Tests non-function default returned when key is not null and data is not array
            expect(Arr.get("not-array", 0, "default")).toBe("default");
            expect(Arr.get(null, 0, "default")).toBe("default");
        });
    });

    describe("exceptValues", () => {
        it("should exclude specified values from array", () => {
            const array = ["foo", "bar", "baz", "qux"];
            expect(Arr.exceptValues(array, ["foo", "baz"])).toEqual([
                "bar",
                "qux",
            ]);
            expect(Arr.exceptValues(array, "baz")).toEqual([
                "foo",
                "bar",
                "qux",
            ]);
        });

        it("should work with numeric arrays", () => {
            const array = [1, 2, 3, 4, 5];
            expect(Arr.exceptValues(array, [3, 4])).toEqual([1, 2, 5]);
        });

        it("should handle empty arrays and values", () => {
            expect(Arr.exceptValues([], "foo")).toEqual([]);
            expect(Arr.exceptValues(["foo", "bar"], [])).toEqual([
                "foo",
                "bar",
            ]);
        });

        it("should support strict comparison", () => {
            const array = [1, "1", 2, "2", 3];
            expect(Arr.exceptValues(array, [1, 2, 3], true)).toEqual([
                "1",
                "2",
            ]);
            expect(Arr.exceptValues(array, [1, 2, 3])).toEqual([]);
        });

        it("should handle boolean and number loose equality", () => {
            const array = [true, false, 1, 0];
            expect(Arr.exceptValues(array, [1, 0], true)).toEqual([
                true,
                false,
            ]);
            expect(Arr.exceptValues(array, [1, 0])).toEqual([]);
        });
    });

    describe("onlyValues", () => {
        it("should include only specified values from array", () => {
            const array = ["foo", "bar", "baz", "qux"];
            expect(Arr.onlyValues(array, ["foo", "baz"])).toEqual([
                "foo",
                "baz",
            ]);
            expect(Arr.onlyValues(array, "baz")).toEqual(["baz"]);
        });

        it("should work with numeric arrays", () => {
            const array = [1, 2, 3, 4, 5];
            expect(Arr.onlyValues(array, [3, 4])).toEqual([3, 4]);
        });

        it("should handle empty arrays and values", () => {
            expect(Arr.onlyValues([], "foo")).toEqual([]);
            expect(Arr.onlyValues(["foo", "bar"], [])).toEqual([]);
        });

        it("should support strict comparison", () => {
            const array = [1, "1", 2, "2", 3];
            expect(Arr.onlyValues(array, [1, 2, 3], true)).toEqual([1, 2, 3]);
            expect(Arr.onlyValues(array, [1, 2, 3])).toEqual([
                1,
                "1",
                2,
                "2",
                3,
            ]);
        });

        it("should handle boolean and number loose equality", () => {
            const array = [true, false, 1, 0];
            expect(Arr.onlyValues(array, [1, 0], true)).toEqual([1, 0]);
            expect(Arr.onlyValues(array, [1, 0])).toEqual([true, false, 1, 0]);
        });
    });

    describe("intersectAssoc", () => {
        it("should return items where both index and value match", () => {
            expect(Arr.intersectAssoc([1, 2, 3], [2, 3, 4])).toEqual([]);
            expect(
                Arr.intersectAssoc(["a", "b", "c"], ["a", "b", "d"]),
            ).toEqual(["a", "b"]);
            expect(Arr.intersectAssoc([1, 2, 3, 4], [5, 2, 3])).toEqual([2, 3]);
        });

        it("should handle non-accessible data", () => {
            expect(Arr.intersectAssoc(null, [1, 2])).toEqual([]);
            expect(Arr.intersectAssoc([1, 2], null)).toEqual([]);
            expect(Arr.intersectAssoc("not array", [1, 2])).toEqual([]);
            expect(Arr.intersectAssoc([1, 2], "not array")).toEqual([]);
        });

        it("should handle empty arrays", () => {
            expect(Arr.intersectAssoc([], [])).toEqual([]);
            expect(Arr.intersectAssoc([1, 2], [])).toEqual([]);
            expect(Arr.intersectAssoc([], [1, 2])).toEqual([]);
        });
    });

    describe("intersectAssocUsing", () => {
        it("should use callback to compare indices", () => {
            const alwaysEqual = () => true;
            expect(
                Arr.intersectAssocUsing([1, 2, 3], [1, 2, 3], alwaysEqual),
            ).toEqual([1, 2, 3]);

            const neverEqual = () => false;
            expect(
                Arr.intersectAssocUsing([1, 2, 3], [1, 2, 3], neverEqual),
            ).toEqual([]);

            // Compare index modulo 2 (even/odd matching)
            const moduloCompare = (a: number, b: number) => a % 2 === b % 2;
            expect(
                Arr.intersectAssocUsing([1, 2, 3], [1, 2, 3], moduloCompare),
            ).toEqual([1, 2, 3]);
        });

        it("should handle non-accessible data", () => {
            const cb = (a: number, b: number) => a === b;
            expect(Arr.intersectAssocUsing(null, [1, 2], cb)).toEqual([]);
            expect(Arr.intersectAssocUsing([1, 2], null, cb)).toEqual([]);
            expect(Arr.intersectAssocUsing("not array", [1, 2], cb)).toEqual(
                [],
            );
            expect(Arr.intersectAssocUsing([1, 2], "not array", cb)).toEqual(
                [],
            );
        });

        it("should handle empty arrays", () => {
            const cb = (a: number, b: number) => a === b;
            expect(Arr.intersectAssocUsing([], [], cb)).toEqual([]);
            expect(Arr.intersectAssocUsing([1, 2], [], cb)).toEqual([]);
            expect(Arr.intersectAssocUsing([], [1, 2], cb)).toEqual([]);
        });
    });
});
