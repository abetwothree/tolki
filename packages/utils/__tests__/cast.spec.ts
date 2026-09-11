import * as Utils from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
    describe("toArrayable", () => {
        it("returns the array if value is an array", () => {
            const arr = { toArray: () => [1, 2, 3] };
            expect(Utils.toArrayable(arr)).toBe(true);
            expect(arr.toArray()).toEqual([1, 2, 3]);
            expect(Utils.isArray(arr.toArray())).toBe(true);
        });

        it("returns false for non-arrayable values", () => {
            expect(Utils.toArrayable("hello")).toBe(false);
            expect(Utils.toArrayable(123)).toBe(false);
            expect(Utils.toArrayable({})).toBe(false);
            expect(Utils.toArrayable([])).toBe(false);
            expect(Utils.toArrayable(null)).toBe(false);
            expect(Utils.toArrayable(undefined)).toBe(false);
        });
    });

    describe("toJsonable", () => {
        it("returns the object if value is jsonable", () => {
            const obj = { toJSON: () => '{"a":1,"b":2}' };
            expect(Utils.toJsonable(obj)).toBe(true);
            expect(JSON.parse(obj.toJSON())).toEqual({ a: 1, b: 2 });
            expect(Utils.isObject(JSON.parse(obj.toJSON()))).toBe(true);
            expect(Utils.isString(obj.toJSON())).toBe(true);
        });

        it("returns false for non-jsonable values", () => {
            expect(Utils.toJsonable("hello")).toBe(false);
            expect(Utils.toJsonable(123)).toBe(false);
            expect(Utils.toJsonable({})).toBe(false);
            expect(Utils.toJsonable([])).toBe(false);
            expect(Utils.toJsonable(null)).toBe(false);
            expect(Utils.toJsonable(undefined)).toBe(false);
        });
    });

    describe("toJsonSerializable", () => {
        it("returns the object if value is json serializable", () => {
            const obj = { jsonSerialize: () => '{"a":1,"b":2}' };
            expect(Utils.toJsonSerializable(obj)).toBe(true);
            expect(JSON.parse(obj.jsonSerialize())).toEqual({ a: 1, b: 2 });
            expect(Utils.isObject(JSON.parse(JSON.stringify(obj)))).toBe(true);
            expect(Utils.isString(obj.jsonSerialize())).toBe(true);
        });

        it("returns false for non-json-serializable values", () => {
            expect(Utils.toJsonSerializable("hello")).toBe(false);
            expect(Utils.toJsonSerializable(123)).toBe(false);
            expect(Utils.toJsonSerializable(null)).toBe(false);
            expect(Utils.toJsonSerializable(undefined)).toBe(false);
            expect(Utils.toJsonSerializable(() => {})).toBe(false);
            expect(Utils.toJsonSerializable(Symbol("test"))).toBe(false);
        });
    });

    describe("castableToArray", () => {
        it("returns the array if value is an array", () => {
            const arr = [1, 2, 3];
            expect(Utils.castableToArray(arr)).toBe(arr);
        });

        it("returns null for non-array values", () => {
            expect(Utils.castableToArray("hello")).toBeNull();
            expect(Utils.castableToArray(123)).toBeNull();
            expect(Utils.castableToArray({})).toBeNull();
            expect(Utils.castableToArray(null)).toBeNull();
            expect(Utils.castableToArray(undefined)).toBeNull();
        });
    });

    it("normalizeToArray", () => {
        // Arrays
        expect(Utils.normalizeToArray([1, 2, 3])).toEqual([1, 2, 3]);
        expect(Utils.normalizeToArray([])).toEqual([]);

        // Non-arrays
        expect(Utils.normalizeToArray("hello")).toBe(null);
        expect(Utils.normalizeToArray(123)).toBe(null);
        expect(Utils.normalizeToArray({})).toBe(null);
        expect(Utils.normalizeToArray(null)).toBe(null);
        expect(Utils.normalizeToArray(undefined)).toBe(null);
    });

    it("getAccessibleValues", () => {
        // Arrays
        expect(Utils.getAccessibleValues([1, 2, 3])).toEqual([1, 2, 3]);
        expect(Utils.getAccessibleValues([])).toEqual([]);

        // Non-arrays should return empty array
        expect(Utils.getAccessibleValues("hello")).toEqual([]);
        expect(Utils.getAccessibleValues(123)).toEqual([]);
        expect(Utils.getAccessibleValues({})).toEqual([]);
        expect(Utils.getAccessibleValues(null)).toEqual([]);
        expect(Utils.getAccessibleValues(undefined)).toEqual([]);
    });

    it("arrayableValues", () => {
        // The EnumeratesValues::getArrayableItems() rule the diff/intersect
        // operands share. PHP-verified in docs/php-parity/task-16-final-review.json
        // ("diff accepts an operand of any shape").
        expect(Utils.arrayableValues([1, 2])).toEqual([1, 2]);
        expect(Utils.arrayableValues({ x: 20, y: 30 })).toEqual([20, 30]);
        expect(Utils.arrayableValues(null)).toEqual([]);
        expect(Utils.arrayableValues(undefined)).toEqual([]);
        expect(Utils.arrayableValues("x")).toEqual(["x"]);
        expect(Utils.arrayableValues(0)).toEqual([0]);

        // A copy, never the caller's array.
        const source = [1, 2];
        expect(Utils.arrayableValues(source)).not.toBe(source);
    });

    describe("arrayableValues unwrapping", () => {
        it("unwraps an object exposing all(), like Enumerable", () => {
            const enumerable = { all: () => [10, 20] };
            expect(Utils.arrayableValues(enumerable)).toEqual([10, 20]);
        });

        it("unwraps an object exposing toArray(), like Arrayable", () => {
            const arrayable = { toArray: () => ({ b: 20 }) };
            expect(Utils.arrayableValues(arrayable)).toEqual([20]);
        });

        it("unwraps an iterable", () => {
            expect(Utils.arrayableValues(new Set([10, 20]))).toEqual([10, 20]);
            expect(Utils.arrayableValues(new Map([["a", 10]]))).toEqual([10]);
        });

        it("unwraps an object exposing toJSON(), like JsonSerializable", () => {
            const jsonable = { toJSON: () => ({ b: 20 }) };
            expect(Utils.arrayableValues(jsonable)).toEqual([20]);
        });

        it("prefers all() over toArray() when both are present", () => {
            expect(
                Utils.arrayableValues({ all: () => [1], toArray: () => [2] }),
            ).toEqual([1]);
        });

        it("still returns own values for a plain object", () => {
            expect(Utils.arrayableValues({ x: 20 })).toEqual([20]);
        });

        it("does not leak a class instance's own fields", () => {
            class Box {
                readonly secret = "leak";
                all() {
                    return [1];
                }
            }
            expect(Utils.arrayableValues(new Box())).toEqual([1]);
        });
    });

    describe("arrayableItems", () => {
        it("unwraps Enumerable- and Arrayable-like operands", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "C18 union collection"
            expect(
                Utils.arrayableItems({ all: () => ({ name: "World", id: 1 }) }),
            ).toEqual({ name: "World", id: 1 });
            expect(Utils.arrayableItems({ toArray: () => ["x"] })).toEqual({
                0: "x",
            });
        });

        it("keys a Map, a list and another iterable", () => {
            // JS-only: Map/Set/iterable unwrapping has no PHP array analogue.
            expect(Utils.arrayableItems(new Map([["a", 1]]))).toEqual({
                a: 1,
            });
            expect(Utils.arrayableItems([5, 6])).toEqual({ 0: 5, 1: 6 });
            expect(Utils.arrayableItems(new Set(["x"]))).toEqual({ 0: "x" });
        });

        it("treats nullish as empty and wraps a scalar", () => {
            // JS-only: null/undefined-as-empty and scalar-wrapping are this helper's own contract.
            expect(Utils.arrayableItems(null)).toEqual({});
            expect(Utils.arrayableItems(undefined)).toEqual({});
            expect(Utils.arrayableItems("x")).toEqual({ 0: "x" });
        });

        it("returns a plain object as it is", () => {
            // JS-only: a plain object needs no unwrapping; asserts identity, not a ported PHP case.
            const plain = { a: 1 };

            expect(Utils.arrayableItems(plain)).toBe(plain);
        });
    });

    describe("toPhpKeyString", () => {
        it("casts null, undefined and false to the empty string and true to '1'", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D5 combine null/bool/float keys"
            // JS-only: PHP has no undefined; toPhpKeyString casts it like null.
            expect(Utils.toPhpKeyString(null)).toBe("");
            expect(Utils.toPhpKeyString(undefined)).toBe("");
            expect(Utils.toPhpKeyString(false)).toBe("");
            expect(Utils.toPhpKeyString(true)).toBe("1");
        });

        it("stringifies numbers and strings", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "D5 combine null/bool/float keys"
            expect(Utils.toPhpKeyString(1.5)).toBe("1.5");
            expect(Utils.toPhpKeyString("7")).toBe("7");
        });
    });
});
