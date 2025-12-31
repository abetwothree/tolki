import * as Utils from "@zinaid/utils";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
    describe("isArray", () => {
        it("returns true for arrays", () => {
            expect(Utils.isArray([1, 2, 3])).toBe(true);
            expect(Utils.isArray([])).toBe(true);
        });

        it("returns false for non-array values", () => {
            expect(Utils.isArray("hello")).toBe(false);
            expect(Utils.isArray(123)).toBe(false);
            expect(Utils.isArray({})).toBe(false);
            expect(Utils.isArray(null)).toBe(false);
            expect(Utils.isArray(undefined)).toBe(false);
        });
    });

    describe("isObject", () => {
        it("returns true for objects", () => {
            expect(Utils.isObject({})).toBe(true);
            expect(Utils.isObject({ a: 1 })).toBe(true);
        });

        it("returns false for non-object values", () => {
            expect(Utils.isObject("hello")).toBe(false);
            expect(Utils.isObject(123)).toBe(false);
            expect(Utils.isObject([])).toBe(false);
            expect(Utils.isObject(null)).toBe(false);
            expect(Utils.isObject(undefined)).toBe(false);
        });
    });

    describe("isObjectAny", () => {
        it("returns true for types that return typeof as 'object'", () => {
            expect(Utils.isObjectAny({})).toBe(true);
            expect(Utils.isObjectAny({ a: 1 })).toBe(true);
            expect(Utils.isObjectAny([1, 2, 3])).toBe(true);
            expect(Utils.isObjectAny([])).toBe(true);
            expect(Utils.isObjectAny(new Date())).toBe(true);
            expect(Utils.isObjectAny(null)).toBe(true); // typeof null is 'object'
        });

        it("returns false for non-object and non-array values", () => {
            expect(Utils.isObjectAny("hello")).toBe(false);
            expect(Utils.isObjectAny(123)).toBe(false);
            expect(Utils.isObjectAny(undefined)).toBe(false);
        });
    });

    describe("isTruthyObject", () => {
        it("returns true for non-null, non-undefined objects", () => {
            expect(Utils.isTruthyObject({})).toBe(true);
            expect(Utils.isTruthyObject({ a: 1 })).toBe(true);
            expect(Utils.isTruthyObject([1, 2, 3])).toBe(true);
            expect(Utils.isTruthyObject([])).toBe(true);
            expect(Utils.isTruthyObject(new Date())).toBe(true);
        });

        it("returns false for null, undefined, and non-object values", () => {
            expect(Utils.isTruthyObject(null)).toBe(false);
            expect(Utils.isTruthyObject(undefined)).toBe(false);
            expect(Utils.isTruthyObject("hello")).toBe(false);
            expect(Utils.isTruthyObject(123)).toBe(false);
        });
    });

    describe("isString", () => {
        it("returns true for strings", () => {
            expect(Utils.isString("hello")).toBe(true);
            expect(Utils.isString("")).toBe(true);
        });

        it("returns false for non-string values", () => {
            expect(Utils.isString(123)).toBe(false);
            expect(Utils.isString({})).toBe(false);
            expect(Utils.isString([])).toBe(false);
            expect(Utils.isString(null)).toBe(false);
            expect(Utils.isString(undefined)).toBe(false);
        });
    });

    describe("isStringable", () => {
        it("returns true for stringable values", () => {
            expect(Utils.isStringable("hello")).toBe(true);
            expect(Utils.isStringable(123)).toBe(true);
            expect(Utils.isStringable({ toString: () => "custom" })).toBe(true);
        });

        it("returns false for non-stringable values", () => {
            expect(Utils.isStringable({})).toBe(true);
            expect(Utils.isStringable([])).toBe(false);
            expect(Utils.isStringable(null)).toBe(false);
            expect(Utils.isStringable(undefined)).toBe(false);
        });
    });

    describe("isNumber", () => {
        it("returns true for numbers", () => {
            expect(Utils.isNumber(123)).toBe(true);
            expect(Utils.isNumber(0)).toBe(true);
            expect(Utils.isNumber(-45.67)).toBe(true);
        });

        it("returns false for non-number values", () => {
            expect(Utils.isNumber("hello")).toBe(false);
            expect(Utils.isNumber({})).toBe(false);
            expect(Utils.isNumber([])).toBe(false);
            expect(Utils.isNumber(null)).toBe(false);
            expect(Utils.isNumber(undefined)).toBe(false);
        });
    });

    describe("isInteger", () => {
        it("returns true for integers", () => {
            expect(Utils.isInteger(123)).toBe(true);
            expect(Utils.isInteger(0)).toBe(true);
            expect(Utils.isInteger(-45)).toBe(true);
        });

        it("returns false for non-integer values", () => {
            expect(Utils.isInteger(45.67)).toBe(false);
            expect(Utils.isInteger("hello")).toBe(false);
            expect(Utils.isInteger({})).toBe(false);
            expect(Utils.isInteger([])).toBe(false);
            expect(Utils.isInteger(null)).toBe(false);
            expect(Utils.isInteger(undefined)).toBe(false);
        });
    });

    describe("isFloat", () => {
        it("returns true for floats", () => {
            expect(Utils.isFloat(45.67)).toBe(true);
            expect(Utils.isFloat(-0.123)).toBe(true);
        });

        it("returns false for non-float values", () => {
            expect(Utils.isFloat(123)).toBe(false);
            expect(Utils.isFloat("hello")).toBe(false);
            expect(Utils.isFloat({})).toBe(false);
            expect(Utils.isFloat([])).toBe(false);
            expect(Utils.isFloat(null)).toBe(false);
            expect(Utils.isFloat(undefined)).toBe(false);
        });
    });

    describe("isPositiveNumber", () => {
        it("returns true for positive numbers", () => {
            expect(Utils.isPositiveNumber(123)).toBe(true);
            expect(Utils.isPositiveNumber(0.1)).toBe(true);
            expect(Utils.isPositiveNumber(0)).toBe(true);
        });

        it("returns false for zero, negative numbers, and non-number values", () => {
            expect(Utils.isPositiveNumber(-45)).toBe(false);
            expect(Utils.isPositiveNumber("hello")).toBe(false);
            expect(Utils.isPositiveNumber({})).toBe(false);
            expect(Utils.isPositiveNumber([])).toBe(false);
            expect(Utils.isPositiveNumber(null)).toBe(false);
            expect(Utils.isPositiveNumber(undefined)).toBe(false);
        });
    });

    describe("isNegativeNumber", () => {
        it("returns true for negative numbers", () => {
            expect(Utils.isNegativeNumber(-123)).toBe(true);
            expect(Utils.isNegativeNumber(-0.1)).toBe(true);
        });

        it("returns false for zero, positive numbers, and non-number values", () => {
            expect(Utils.isNegativeNumber(0)).toBe(false);
            expect(Utils.isNegativeNumber(45)).toBe(false);
            expect(Utils.isNegativeNumber("hello")).toBe(false);
            expect(Utils.isNegativeNumber({})).toBe(false);
            expect(Utils.isNegativeNumber([])).toBe(false);
            expect(Utils.isNegativeNumber(null)).toBe(false);
            expect(Utils.isNegativeNumber(undefined)).toBe(false);
        });
    });

    describe("isBoolean", () => {
        it("returns true for boolean values", () => {
            expect(Utils.isBoolean(true)).toBe(true);
            expect(Utils.isBoolean(false)).toBe(true);
        });

        it("returns false for non-boolean values", () => {
            expect(Utils.isBoolean("hello")).toBe(false);
            expect(Utils.isBoolean(123)).toBe(false);
            expect(Utils.isBoolean({})).toBe(false);
            expect(Utils.isBoolean([])).toBe(false);
            expect(Utils.isBoolean(null)).toBe(false);
            expect(Utils.isBoolean(undefined)).toBe(false);
        });
    });

    describe("isFunction", () => {
        it("returns true for functions", () => {
            expect(Utils.isFunction(() => {})).toBe(true);
            expect(Utils.isFunction(function () {})).toBe(true);
        });

        it("returns false for non-function values", () => {
            expect(Utils.isFunction("hello")).toBe(false);
            expect(Utils.isFunction(123)).toBe(false);
            expect(Utils.isFunction({})).toBe(false);
            expect(Utils.isFunction([])).toBe(false);
            expect(Utils.isFunction(null)).toBe(false);
            expect(Utils.isFunction(undefined)).toBe(false);
        });
    });

    describe("isUndefined", () => {
        it("returns true for undefined", () => {
            expect(Utils.isUndefined(undefined)).toBe(true);
        });

        it("returns false for defined values", () => {
            expect(Utils.isUndefined("hello")).toBe(false);
            expect(Utils.isUndefined(123)).toBe(false);
            expect(Utils.isUndefined({})).toBe(false);
            expect(Utils.isUndefined([])).toBe(false);
            expect(Utils.isUndefined(null)).toBe(false);
        });
    });

    describe("isSymbol", () => {
        it("returns true for symbols", () => {
            expect(Utils.isSymbol(Symbol("test"))).toBe(true);
        });

        it("returns false for non-symbol values", () => {
            expect(Utils.isSymbol("hello")).toBe(false);
            expect(Utils.isSymbol(123)).toBe(false);
            expect(Utils.isSymbol({})).toBe(false);
            expect(Utils.isSymbol([])).toBe(false);
            expect(Utils.isSymbol(null)).toBe(false);
            expect(Utils.isSymbol(undefined)).toBe(false);
        });
    });

    describe("isNull", () => {
        it("returns true for null", () => {
            expect(Utils.isNull(null)).toBe(true);
        });

        it("returns false for non-null values", () => {
            expect(Utils.isNull("hello")).toBe(false);
            expect(Utils.isNull(123)).toBe(false);
            expect(Utils.isNull({})).toBe(false);
            expect(Utils.isNull([])).toBe(false);
            expect(Utils.isNull(undefined)).toBe(false);
        });
    });

    describe("isMap", () => {
        it("returns true for Map instances", () => {
            expect(Utils.isMap(new Map())).toBe(true);
            const map = new Map();
            map.set("a", 1);
            expect(Utils.isMap(map)).toBe(true);
        });

        it("returns false for non-Map values", () => {
            expect(Utils.isMap({})).toBe(false);
            expect(Utils.isMap([])).toBe(false);
            expect(Utils.isMap("hello")).toBe(false);
            expect(Utils.isMap(123)).toBe(false);
            expect(Utils.isMap(null)).toBe(false);
            expect(Utils.isMap(undefined)).toBe(false);
        });
    });

    describe("isSet", () => {
        it("returns true for Set instances", () => {
            expect(Utils.isSet(new Set())).toBe(true);
            const set = new Set();
            set.add(1);
            expect(Utils.isSet(set)).toBe(true);
        });

        it("returns false for non-Set values", () => {
            expect(Utils.isSet({})).toBe(false);
            expect(Utils.isSet([])).toBe(false);
            expect(Utils.isSet("hello")).toBe(false);
            expect(Utils.isSet(123)).toBe(false);
            expect(Utils.isSet(null)).toBe(false);
            expect(Utils.isSet(undefined)).toBe(false);
        });
    });

    describe("isWeakMap", () => {
        it("returns true for WeakMap instances", () => {
            expect(Utils.isWeakMap(new WeakMap())).toBe(true);
            const weakMap = new WeakMap();
            weakMap.set({}, 1);
            expect(Utils.isWeakMap(weakMap)).toBe(true);
        });

        it("returns false for non-WeakMap values", () => {
            expect(Utils.isWeakMap({})).toBe(false);
            expect(Utils.isWeakMap([])).toBe(false);
            expect(Utils.isWeakMap("hello")).toBe(false);
            expect(Utils.isWeakMap(123)).toBe(false);
            expect(Utils.isWeakMap(null)).toBe(false);
            expect(Utils.isWeakMap(undefined)).toBe(false);
        });
    });

    describe("isWeakSet", () => {
        it("returns true for WeakSet instances", () => {
            expect(Utils.isWeakSet(new WeakSet())).toBe(true);
            const weakSet = new WeakSet();
            weakSet.add({});
            expect(Utils.isWeakSet(weakSet)).toBe(true);
        });

        it("returns false for non-WeakSet values", () => {
            expect(Utils.isWeakSet({})).toBe(false);
            expect(Utils.isWeakSet([])).toBe(false);
            expect(Utils.isWeakSet("hello")).toBe(false);
            expect(Utils.isWeakSet(123)).toBe(false);
            expect(Utils.isWeakSet(null)).toBe(false);
            expect(Utils.isWeakSet(undefined)).toBe(false);
        });
    });

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

    describe("isFalsy", () => {
        it("returns true for falsy values", () => {
            expect(Utils.isFalsy(false)).toBe(true);
            expect(Utils.isFalsy(0)).toBe(true);
            expect(Utils.isFalsy("")).toBe(true);
            expect(Utils.isFalsy(null)).toBe(true);
            expect(Utils.isFalsy(undefined)).toBe(true);
            expect(Utils.isFalsy(NaN)).toBe(true);
            expect(Utils.isFalsy({})).toBe(true);
            expect(Utils.isFalsy([])).toBe(true);
            expect(Utils.isFalsy(new Map())).toBe(true);
            expect(Utils.isFalsy(new Set())).toBe(true);
        });

        it("returns false for truthy values", () => {
            expect(Utils.isFalsy(true)).toBe(false);
            expect(Utils.isFalsy(123)).toBe(false);
            expect(Utils.isFalsy(-123)).toBe(false);
            expect(Utils.isFalsy(12.5)).toBe(false);
            expect(Utils.isFalsy("hello")).toBe(false);
            expect(Utils.isFalsy({ a: 1 })).toBe(false);
            expect(Utils.isFalsy([1, 2, 3])).toBe(false);
            expect(Utils.isFalsy(new Map([["a", 1]]))).toBe(false);
            expect(Utils.isFalsy(new Set([1]))).toBe(false);
            expect(Utils.isFalsy(() => {})).toBe(false);
            expect(Utils.isFalsy(Symbol("test"))).toBe(false);
        });
    });

    describe("isTruthy", () => {
        it("returns true for truthy values", () => {
            expect(Utils.isTruthy(true)).toBe(true);
            expect(Utils.isTruthy(123)).toBe(true);
            expect(Utils.isTruthy(-123)).toBe(true);
            expect(Utils.isTruthy(12.5)).toBe(true);
            expect(Utils.isTruthy("hello")).toBe(true);
            expect(Utils.isTruthy({ a: 1 })).toBe(true);
            expect(Utils.isTruthy([1, 2, 3])).toBe(true);
            expect(Utils.isTruthy(new Map([["a", 1]]))).toBe(true);
            expect(Utils.isTruthy(new Set([1]))).toBe(true);
        });

        it("returns false for falsy values", () => {
            expect(Utils.isTruthy(false)).toBe(false);
            expect(Utils.isTruthy(0)).toBe(false);
            expect(Utils.isTruthy("")).toBe(false);
            expect(Utils.isTruthy(null)).toBe(false);
            expect(Utils.isTruthy(undefined)).toBe(false);
            expect(Utils.isTruthy(NaN)).toBe(false);
            expect(Utils.isTruthy({})).toBe(false);
            expect(Utils.isTruthy([])).toBe(false);
            expect(Utils.isTruthy(new Map())).toBe(false);
            expect(Utils.isTruthy(new Set())).toBe(false);
        });
    });

    describe("typeOf", () => {
        it("returns correct type strings", () => {
            expect(Utils.typeOf([])).toBe("array");
            expect(Utils.typeOf({})).toBe("object");
            expect(Utils.typeOf("hello")).toBe("string");
            expect(Utils.typeOf(123)).toBe("number");
            expect(Utils.typeOf(true)).toBe("boolean");
            expect(Utils.typeOf(() => {})).toBe("function");
            expect(Utils.typeOf(undefined)).toBe("undefined");
            expect(Utils.typeOf(null)).toBe("object");
            expect(Utils.typeOf(new Map())).toBe("object");
            expect(Utils.typeOf(new Set())).toBe("object");
            expect(Utils.typeOf(new WeakMap())).toBe("object");
            expect(Utils.typeOf(new WeakSet())).toBe("object");
            expect(Utils.typeOf(Symbol("test"))).toBe("symbol");
        });
    });

    describe("isPrimitive", () => {
        it("returns true for primitive values", () => {
            expect(Utils.isPrimitive("hello")).toBe(true);
            expect(Utils.isPrimitive(123)).toBe(true);
            expect(Utils.isPrimitive(true)).toBe(true);
            expect(Utils.isPrimitive(null)).toBe(true);
            expect(Utils.isPrimitive(undefined)).toBe(true);
            expect(Utils.isPrimitive(Symbol("test"))).toBe(true);
        });

        it("returns false for non-primitive values", () => {
            expect(Utils.isPrimitive({})).toBe(false);
            expect(Utils.isPrimitive([])).toBe(false);
            expect(Utils.isPrimitive(() => {})).toBe(false);
            expect(Utils.isPrimitive(new Map())).toBe(false);
            expect(Utils.isPrimitive(new Set())).toBe(false);
        });
    });

    describe("isNonPrimitive", () => {
        it("returns true for non-primitive values", () => {
            expect(Utils.isNonPrimitive({})).toBe(true);
            expect(Utils.isNonPrimitive([])).toBe(true);
            expect(Utils.isNonPrimitive(() => {})).toBe(true);
            expect(Utils.isNonPrimitive(new Map())).toBe(true);
            expect(Utils.isNonPrimitive(new Set())).toBe(true);
        });

        it("returns false for primitive values", () => {
            expect(Utils.isNonPrimitive("hello")).toBe(false);
            expect(Utils.isNonPrimitive(123)).toBe(false);
            expect(Utils.isNonPrimitive(true)).toBe(false);
            expect(Utils.isNonPrimitive(null)).toBe(false);
            expect(Utils.isNonPrimitive(undefined)).toBe(false);
            expect(Utils.isNonPrimitive(Symbol("test"))).toBe(false);
        });
    });

    describe("isFiniteNumber", () => {
        it("returns true for finite numbers", () => {
            expect(Utils.isFiniteNumber(123)).toBe(true);
            expect(Utils.isFiniteNumber(-45.67)).toBe(true);
            expect(Utils.isFiniteNumber(0)).toBe(true);
        });

        it("returns false for non-finite numbers and non-number values", () => {
            expect(Utils.isFiniteNumber(Infinity)).toBe(false);
            expect(Utils.isFiniteNumber(-Infinity)).toBe(false);
            expect(Utils.isFiniteNumber(NaN)).toBe(false);
            expect(Utils.isFiniteNumber("hello")).toBe(false);
            expect(Utils.isFiniteNumber({})).toBe(false);
            expect(Utils.isFiniteNumber([])).toBe(false);
            expect(Utils.isFiniteNumber(null)).toBe(false);
            expect(Utils.isFiniteNumber(undefined)).toBe(false);
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
    it("compareValues", () => {
        // Basic comparisons
        expect(Utils.compareValues(1, 2)).toBe(-1);
        expect(Utils.compareValues(2, 1)).toBe(1);
        expect(Utils.compareValues(1, 1)).toBe(0);

        // String comparisons
        expect(Utils.compareValues("a", "b")).toBe(-1);
        expect(Utils.compareValues("b", "a")).toBe(1);
        expect(Utils.compareValues("a", "a")).toBe(0);

        // Null comparisons
        expect(Utils.compareValues(null, null)).toBe(0);
        expect(Utils.compareValues(null, 1)).toBe(-1);
        expect(Utils.compareValues(1, null)).toBe(1);
        expect(Utils.compareValues(undefined, undefined)).toBe(0);
        expect(Utils.compareValues(undefined, 1)).toBe(-1);
        expect(Utils.compareValues(1, undefined)).toBe(1);

        // Object comparisons
        expect(Utils.compareValues({ x: 1 }, { x: 1 })).toBe(0);
        expect(Utils.compareValues({ x: 1 }, { x: 2 })).toBe(-1);
        expect(Utils.compareValues({ x: 2 }, { x: 1 })).toBe(1);

        // Mixed type comparisons
        expect(Utils.compareValues({}, [])).toBe(1); // "{}" > "[]"
        expect(Utils.compareValues([], {})).toBe(-1); // "[]" < "{}"
    });

    it("resolveDefault", () => {
        // Direct values
        expect(Utils.resolveDefault("hello")).toBe("hello");
        expect(Utils.resolveDefault(42)).toBe(42);
        expect(Utils.resolveDefault(true)).toBe(true);
        expect(Utils.resolveDefault(null)).toBe(null);

        // Functions
        expect(Utils.resolveDefault(() => "world")).toBe("world");
        expect(Utils.resolveDefault(() => 123)).toBe(123);

        // Undefined
        expect(Utils.resolveDefault(undefined)).toBe(null);
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

    it("isAccessibleData", () => {
        // Arrays
        expect(Utils.isAccessibleData([1, 2, 3])).toBe(true);
        expect(Utils.isAccessibleData([])).toBe(true);

        // Non-arrays
        expect(Utils.isAccessibleData("hello")).toBe(false);
        expect(Utils.isAccessibleData(123)).toBe(false);
        expect(Utils.isAccessibleData({})).toBe(false);
        expect(Utils.isAccessibleData(null)).toBe(false);
        expect(Utils.isAccessibleData(undefined)).toBe(false);
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

    it("entriesKeyValue converts numeric-like strings and preserves others", () => {
        expect(Utils.entriesKeyValue("42" as unknown as PropertyKey)).toBe(42);
        expect(Utils.entriesKeyValue("004" as unknown as PropertyKey)).toBe(4);
        expect(Utils.entriesKeyValue("abc" as unknown as PropertyKey)).toBe(
            "abc",
        );
    });

    it("strictEqual handles class instances vs plain objects and key mismatches", () => {
        class Foo {
            x: number;
            constructor(x: number) {
                this.x = x;
            }
        }
        expect(Utils.strictEqual(new Foo(1), { x: 1 })).toBe(false);
        expect(Utils.strictEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        expect(Utils.strictEqual([1, 2], [1])).toBe(false);
    });

    describe("toLower", () => {
        it("should convert a string to lowercase", () => {
            expect(Utils.toLower("HELLO")).toBe("hello");
            expect(Utils.toLower("Hello World")).toBe("hello world");
            expect(Utils.toLower("")).toBe("");
            expect(Utils.toLower("already lowercase")).toBe(
                "already lowercase",
            );
        });
    });

    describe("toUpper", () => {
        it("should convert a string to uppercase", () => {
            expect(Utils.toUpper("hello")).toBe("HELLO");
            expect(Utils.toUpper("Hello World")).toBe("HELLO WORLD");
            expect(Utils.toUpper("")).toBe("");
            expect(Utils.toUpper("ALREADY UPPERCASE")).toBe(
                "ALREADY UPPERCASE",
            );
        });
    });

    describe("lowerFirst", () => {
        it("should convert the first character to lowercase", () => {
            expect(Utils.lowerFirst("Hello")).toBe("hello");
            expect(Utils.lowerFirst("HELLO")).toBe("hELLO");
            expect(Utils.lowerFirst("hello")).toBe("hello");
            expect(Utils.lowerFirst("A")).toBe("a");
        });

        it("should return empty string unchanged", () => {
            expect(Utils.lowerFirst("")).toBe("");
        });
    });

    describe("upperFirst", () => {
        it("should convert the first character to uppercase", () => {
            expect(Utils.upperFirst("hello")).toBe("Hello");
            expect(Utils.upperFirst("HELLO")).toBe("HELLO");
            expect(Utils.upperFirst("Hello")).toBe("Hello");
            expect(Utils.upperFirst("a")).toBe("A");
        });

        it("should return empty string unchanged", () => {
            expect(Utils.upperFirst("")).toBe("");
        });
    });

    describe("looseEqual", () => {
        it("should return true for JavaScript loosely equal values", () => {
            expect(Utils.looseEqual(1, 1)).toBe(true);
            expect(Utils.looseEqual("hello", "hello")).toBe(true);
            expect(Utils.looseEqual(null, undefined)).toBe(true);
            expect(Utils.looseEqual(1, "1")).toBe(true);
        });

        it("should handle boolean true comparisons (PHP rules)", () => {
            // true == any truthy value
            expect(Utils.looseEqual(true, 1)).toBe(true);
            expect(Utils.looseEqual(true, "hello")).toBe(true);
            expect(Utils.looseEqual(true, [1, 2, 3])).toBe(true);
            expect(Utils.looseEqual(1, true)).toBe(true);
            // true != falsy values
            expect(Utils.looseEqual(true, null)).toBe(false);
            expect(Utils.looseEqual(true, false)).toBe(false);
            expect(Utils.looseEqual(true, 0)).toBe(false);
            expect(Utils.looseEqual(true, "")).toBe(false);
            expect(Utils.looseEqual(true, [])).toBe(false);
        });

        it("should handle boolean false comparisons (PHP rules)", () => {
            // false == any falsy value
            expect(Utils.looseEqual(false, null)).toBe(true);
            expect(Utils.looseEqual(false, 0)).toBe(true);
            expect(Utils.looseEqual(false, "")).toBe(true);
            expect(Utils.looseEqual(false, [])).toBe(true);
            expect(Utils.looseEqual(null, false)).toBe(true);
            // Test the otherValue === false branch (when boolean is second argument)
            expect(Utils.looseEqual(0, false)).toBe(true);
            expect(Utils.looseEqual("", false)).toBe(true);
            // Test empty array with false as second argument
            expect(Utils.looseEqual([], false)).toBe(true);
            // false != truthy values
            expect(Utils.looseEqual(false, 1)).toBe(false);
            expect(Utils.looseEqual(false, "hello")).toBe(false);
        });

        it("should consider PHP falsy values as equal to each other", () => {
            // null, false, 0, '', [] are loosely equal in PHP
            expect(Utils.looseEqual(null, 0)).toBe(true);
            expect(Utils.looseEqual(null, "")).toBe(true);
            expect(Utils.looseEqual(0, "")).toBe(true);
            expect(Utils.looseEqual([], null)).toBe(true);
            expect(Utils.looseEqual([], 0)).toBe(true);
            expect(Utils.looseEqual([], "")).toBe(true);
        });

        it("should perform deep comparison for arrays", () => {
            expect(Utils.looseEqual([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(Utils.looseEqual(["a", "b"], ["a", "b"])).toBe(true);
            expect(Utils.looseEqual([[1], [2]], [[1], [2]])).toBe(true);
            // Different lengths
            expect(Utils.looseEqual([1, 2], [1, 2, 3])).toBe(false);
            // Different values
            expect(Utils.looseEqual([1, 2], [1, 3])).toBe(false);
        });

        it("should perform deep comparison for plain objects", () => {
            expect(Utils.looseEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
            expect(Utils.looseEqual({ x: { y: 1 } }, { x: { y: 1 } })).toBe(
                true,
            );
            // Different key count
            expect(Utils.looseEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
            // Missing key
            expect(Utils.looseEqual({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(
                false,
            );
            // Different values
            expect(Utils.looseEqual({ a: 1 }, { a: 2 })).toBe(false);
        });

        it("should return false for non-equal non-falsy values", () => {
            expect(Utils.looseEqual("hello", "world")).toBe(false);
            expect(Utils.looseEqual(1, 2)).toBe(false);
            expect(Utils.looseEqual({ a: 1 }, [1])).toBe(false);
        });
    });

    describe("strictEqual", () => {
        it("should return true for strictly equal primitives", () => {
            expect(Utils.strictEqual(1, 1)).toBe(true);
            expect(Utils.strictEqual("hello", "hello")).toBe(true);
            expect(Utils.strictEqual(true, true)).toBe(true);
            expect(Utils.strictEqual(null, null)).toBe(true);
        });

        it("should return false for different types", () => {
            expect(Utils.strictEqual(1, "1")).toBe(false);
            expect(Utils.strictEqual(true, 1)).toBe(false);
            expect(Utils.strictEqual(null, undefined)).toBe(false);
        });

        it("should perform deep comparison for arrays", () => {
            expect(Utils.strictEqual([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(Utils.strictEqual(["a", "b"], ["a", "b"])).toBe(true);
            expect(Utils.strictEqual([[1], [2]], [[1], [2]])).toBe(true);
            // Different lengths
            expect(Utils.strictEqual([1, 2], [1, 2, 3])).toBe(false);
            // Different values
            expect(Utils.strictEqual([1, 2], [1, 3])).toBe(false);
            // Type mismatches within arrays
            expect(Utils.strictEqual([1], ["1"])).toBe(false);
        });

        it("should perform deep comparison for plain objects", () => {
            expect(Utils.strictEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(
                true,
            );
            expect(Utils.strictEqual({ x: { y: 1 } }, { x: { y: 1 } })).toBe(
                true,
            );
            // Different key count
            expect(Utils.strictEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
            // Missing key
            expect(Utils.strictEqual({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(
                false,
            );
            // Different values
            expect(Utils.strictEqual({ a: 1 }, { a: 2 })).toBe(false);
        });

        it("should use reference equality for class instances", () => {
            class TestClass {
                value: number;
                constructor(v: number) {
                    this.value = v;
                }
            }
            const instance1 = new TestClass(1);
            const instance2 = new TestClass(1);
            // Same reference
            expect(Utils.strictEqual(instance1, instance1)).toBe(true);
            // Different references (same content)
            expect(Utils.strictEqual(instance1, instance2)).toBe(false);
            // Class instance vs plain object
            expect(Utils.strictEqual(instance1, { value: 1 })).toBe(false);
            // Plain object vs class instance
            expect(Utils.strictEqual({ value: 1 }, instance1)).toBe(false);
        });

        it("should return false for different types of objects", () => {
            expect(Utils.strictEqual({ a: 1 }, [1])).toBe(false);
            expect(Utils.strictEqual([], {})).toBe(false);
        });
    });
});
