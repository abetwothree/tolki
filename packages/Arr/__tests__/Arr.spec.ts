import { describe, it, expect } from "vitest";
import { Arr } from "@laravel-js/arr";
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
});
