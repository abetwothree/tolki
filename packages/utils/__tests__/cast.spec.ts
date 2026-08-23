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
});
