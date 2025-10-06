import {
    castableToArray,
    compareValues,
    getAccessibleValues,
    isAccessibleData,
    normalizeToArray,
    resolveDefault,
} from "@laravel-js/utils";
import { describe, expect,it } from "vitest";

describe("Utils", () => {
    describe("castableToArray", () => {
        it("returns the array if value is an array", () => {
            const arr = [1, 2, 3];
            expect(castableToArray(arr)).toBe(arr);
        });

        it("returns null for non-array values", () => {
            expect(castableToArray("hello")).toBeNull();
            expect(castableToArray(123)).toBeNull();
            expect(castableToArray({})).toBeNull();
            expect(castableToArray(null)).toBeNull();
            expect(castableToArray(undefined)).toBeNull();
        });
    });
    it("compareValues", () => {
        // Basic comparisons
        expect(compareValues(1, 2)).toBe(-1);
        expect(compareValues(2, 1)).toBe(1);
        expect(compareValues(1, 1)).toBe(0);

        // String comparisons
        expect(compareValues("a", "b")).toBe(-1);
        expect(compareValues("b", "a")).toBe(1);
        expect(compareValues("a", "a")).toBe(0);

        // Null comparisons
        expect(compareValues(null, null)).toBe(0);
        expect(compareValues(null, 1)).toBe(-1);
        expect(compareValues(1, null)).toBe(1);
        expect(compareValues(undefined, undefined)).toBe(0);
        expect(compareValues(undefined, 1)).toBe(-1);
        expect(compareValues(1, undefined)).toBe(1);

        // Object comparisons
        expect(compareValues({ x: 1 }, { x: 1 })).toBe(0);
        expect(compareValues({ x: 1 }, { x: 2 })).toBe(-1);
        expect(compareValues({ x: 2 }, { x: 1 })).toBe(1);

        // Mixed type comparisons
        expect(compareValues({}, [])).toBe(1); // "{}" > "[]"
        expect(compareValues([], {})).toBe(-1); // "[]" < "{}"
    });

    it("resolveDefault", () => {
        // Direct values
        expect(resolveDefault("hello")).toBe("hello");
        expect(resolveDefault(42)).toBe(42);
        expect(resolveDefault(true)).toBe(true);
        expect(resolveDefault(null)).toBe(null);

        // Functions
        expect(resolveDefault(() => "world")).toBe("world");
        expect(resolveDefault(() => 123)).toBe(123);

        // Undefined
        expect(resolveDefault(undefined)).toBe(null);
    });

    it("normalizeToArray", () => {
        // Arrays
        expect(normalizeToArray([1, 2, 3])).toEqual([1, 2, 3]);
        expect(normalizeToArray([])).toEqual([]);

        // Non-arrays
        expect(normalizeToArray("hello")).toBe(null);
        expect(normalizeToArray(123)).toBe(null);
        expect(normalizeToArray({})).toBe(null);
        expect(normalizeToArray(null)).toBe(null);
        expect(normalizeToArray(undefined)).toBe(null);
    });

    it("isAccessibleData", () => {
        // Arrays
        expect(isAccessibleData([1, 2, 3])).toBe(true);
        expect(isAccessibleData([])).toBe(true);

        // Non-arrays
        expect(isAccessibleData("hello")).toBe(false);
        expect(isAccessibleData(123)).toBe(false);
        expect(isAccessibleData({})).toBe(false);
        expect(isAccessibleData(null)).toBe(false);
        expect(isAccessibleData(undefined)).toBe(false);
    });

    it("getAccessibleValues", () => {
        // Arrays
        expect(getAccessibleValues([1, 2, 3])).toEqual([1, 2, 3]);
        expect(getAccessibleValues([])).toEqual([]);

        // Non-arrays should return empty array
        expect(getAccessibleValues("hello")).toEqual([]);
        expect(getAccessibleValues(123)).toEqual([]);
        expect(getAccessibleValues({})).toEqual([]);
        expect(getAccessibleValues(null)).toEqual([]);
        expect(getAccessibleValues(undefined)).toEqual([]);
    });
});
