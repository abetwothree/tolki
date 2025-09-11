import { describe, it, expect } from "vitest";
import * as Arr from "@laravel-js/arr";
import { Collection } from "@laravel-js/collection";

describe("Arr", () => {
    it("accessible", () => {
        expect(Arr.accessible([])).toBe(true);
        expect(Arr.accessible([1, 2])).toBe(true);
        expect(Arr.accessible({ a: 1, b: 2 })).toBe(false);
        expect(Arr.accessible(new Collection())).toBe(true);

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
        expect(Arr.arrayable(new Collection())).toBe(true);

        expect(Arr.arrayable(null)).toBe(false);
        expect(Arr.arrayable("abc")).toBe(false);
        expect(Arr.arrayable(123)).toBe(false);
        expect(Arr.arrayable(12.34)).toBe(false);
        expect(Arr.arrayable(true)).toBe(false);
        expect(Arr.arrayable(new Date())).toBe(false);
        expect(Arr.arrayable(() => null)).toBe(false);
    });

    it("add", () => {
        expect(Arr.add(["Desk"], 100)).toEqual(["Desk", 100]);

        expect(Arr.add([], "Ferid", "Mövsümov")).toEqual(["Ferid", "Mövsümov"]);

        expect(Arr.add([], "developer.name")).toEqual(["developer.name"]);
        expect(Arr.add([], 1, "hAz")).toEqual([1, "hAz"]);
        expect(Arr.add([], 1.1, "hAz")).toEqual([1.1, "hAz"]);
        expect(Arr.add([], 1.1, "hAz", new Date(), { k: "v" })).toEqual([
            1.1,
            "hAz",
            new Date(),
            { k: "v" },
        ]);
    });

    it("collapse", () => {
        type Mixed =
            | string[]
            | number[]
            | []
            | (string | number)[]
            | Collection<string[] | number[] | (string | number)[]>;
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

        // Case including collections and arrays
        const collection = new Collection(["baz", "boom"]);
        data = [
            [1],
            [2],
            [3],
            ["foo", "bar"],
            collection as unknown as Collection<(string | number)[]>,
        ];

        expect(Arr.collapse(data)).toEqual([
            1,
            2,
            3,
            "foo",
            "bar",
            "baz",
            "boom",
        ]);
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

    it("exists", () => {
        expect(Arr.exists([1], 0)).toBe(true);
        expect(Arr.exists([1], "0")).toBe(true);
        expect(Arr.exists([1], "one")).toBe(false);
        expect(Arr.exists([null], 0)).toBe(true);

        expect(Arr.exists([1], 1)).toBe(false);
        expect(Arr.exists([null], 1)).toBe(false);
        expect(Arr.exists(new Collection([null]), "b")).toBe(false);

        expect(Arr.exists(new Collection([1, 3, 5]), 3)).toBe(true);
        expect(Arr.exists(new Collection([1, 3, 5]), 4)).toBe(false);

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
    });

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

        // Nested arrays are flattened alongside arrays
        data = [new Collection(["#foo", "#bar"]), ["#baz"]];
        expect(Arr.flatten(data)).toEqual(["#foo", "#bar", "#baz"]);

        // Nested arrays containing plain arrays are flattened
        data = [new Collection(["#foo", ["#bar"]]), ["#baz"]];
        expect(Arr.flatten(data)).toEqual(["#foo", "#bar", "#baz"]);

        // Nested arrays containing arrays are flattened
        data = [["#foo", new Collection(["#bar"])], ["#baz"]];
        expect(Arr.flatten(data)).toEqual(["#foo", "#bar", "#baz"]);

        // Nested arrays containing arrays containing arrays are flattened
        data = [["#foo", new Collection(["#bar", ["#zap"]])], ["#baz"]];
        expect(Arr.flatten(data)).toEqual(["#foo", "#bar", "#zap", "#baz"]);
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
        expect(Arr.forget(["a", "b"], ["1", "1"]))
            .toEqual(["a"]);

        // 4) Mixed keys: nested then top-level removal => top-level dominates
        expect(Arr.forget(base, ["1.0", 1])).toEqual(["products"]);

        // 5) Root multi-index deletion should be order independent (descending applied)
        expect(Arr.forget([10, 20, 30, 40], [0, 2]))
            .toEqual([20, 40]);
        expect(Arr.forget([10, 20, 30, 40], [2, 0]))
            .toEqual([20, 40]);

        // 6) Traversal into non-array child is a no-op
        expect(Arr.forget(base, "0.0")).toEqual(base);

        // 7) Empty input remains empty regardless of keys
        expect(Arr.forget([], "0")).toEqual([]);
        expect(Arr.forget([], ["0", "1"]))
            .toEqual([]);

        // 8) Numeric-string with leading zeros acts numerically
        expect(Arr.forget(base, "01")).toEqual(["products"]);

        // 9) Mixed valid/invalid multi-keys only apply valid parts
        expect(Arr.forget(base, ["1.0", "foo", "1.a", "", ".."]))
            .toEqual(["products", [[100]]]);

        // 10) Deep out-of-range on a nested path is a no-op
        expect(Arr.forget(base, "1.5.1")).toEqual(base);

        // 11) Multiple deletions within the same nested parent
        const nested = ["prices", [100, 200, 300, 400]];
        expect(Arr.forget(nested, ["1.0", "1.3"]))
            .toEqual(["prices", [200, 300]]);

        // 12) Immutability: original input must remain unchanged
        const subject = ["products", ["desk", [100]]];
        const snapshot = JSON.stringify(subject);
        const res = Arr.forget(subject, "1.0");
        expect(res).toEqual(["products", [[100]]]);
        expect(JSON.stringify(subject)).toBe(snapshot);
    });

    it("from", () => {
        expect(Arr.from(new Collection([1, 2, 3]))).toEqual([1, 2, 3]);

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
});
