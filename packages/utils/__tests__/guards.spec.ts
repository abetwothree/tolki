import * as Utils from "@tolki/utils";
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

    describe("isIterable", () => {
        it("returns true for iterable values", () => {
            expect(Utils.isIterable([1, 2, 3])).toBe(true);
            expect(Utils.isIterable(new Set([1, 2]))).toBe(true);
            expect(Utils.isIterable(new Map())).toBe(true);
            expect(Utils.isIterable([1, 2][Symbol.iterator]())).toBe(true);
            expect(
                Utils.isIterable(
                    (function* () {
                        yield 1;
                    })(),
                ),
            ).toBe(true);
        });

        it("returns false for strings so they stay scalar values", () => {
            expect(Utils.isIterable("hello")).toBe(false);
            expect(Utils.isIterable("")).toBe(false);
        });

        it("returns false for non-iterable values", () => {
            expect(Utils.isIterable({ a: 1 })).toBe(false);
            expect(Utils.isIterable(123)).toBe(false);
            expect(Utils.isIterable(true)).toBe(false);
            expect(Utils.isIterable(null)).toBe(false);
            expect(Utils.isIterable(undefined)).toBe(false);
            expect(Utils.isIterable(new WeakMap())).toBe(false);
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

    describe("isPhpFalsy", () => {
        // array_filter's falsy set is narrower than isFalsy's — PHP-verified
        // (docs/php-parity/task-04-shared.json, "Collection::filter() falsy set"): drops
        // "0", "", 0, [], false, null, but keeps "00" and "0.0".
        it("returns true for the exact PHP-falsy set", () => {
            expect(Utils.isPhpFalsy(false)).toBe(true);
            expect(Utils.isPhpFalsy(null)).toBe(true);
            expect(Utils.isPhpFalsy(undefined)).toBe(true);
            expect(Utils.isPhpFalsy(0)).toBe(true);
            expect(Utils.isPhpFalsy("")).toBe(true);
            expect(Utils.isPhpFalsy("0")).toBe(true);
            expect(Utils.isPhpFalsy([])).toBe(true);
            expect(Utils.isPhpFalsy({})).toBe(true);
        });

        it("keeps strings that merely look like zero", () => {
            expect(Utils.isPhpFalsy("00")).toBe(false);
            expect(Utils.isPhpFalsy("0.0")).toBe(false);
        });

        // PHP-verified (docs/php-parity/task-04-shared.json, "NAN is truthy for array_filter").
        it("keeps NaN, unlike isFalsy", () => {
            expect(Utils.isPhpFalsy(NaN)).toBe(false);
            expect(Utils.isFalsy(NaN)).toBe(true);
        });

        it('keeps the exact string "0" falsy, unlike isFalsy', () => {
            expect(Utils.isPhpFalsy("0")).toBe(true);
            expect(Utils.isFalsy("0")).toBe(false);
        });

        it("keeps whitespace-only strings truthy, unlike isFalsy", () => {
            // PHP only treats the exact empty string as falsy, not
            // whitespace — isFalsy's `.trim() === ""` branch gets this
            // wrong (documented, not fixed, by this task).
            expect(Utils.isPhpFalsy(" ")).toBe(false);
            expect(Utils.isFalsy(" ")).toBe(true);
        });

        it("returns false for other truthy values", () => {
            expect(Utils.isPhpFalsy(1)).toBe(false);
            expect(Utils.isPhpFalsy(-1)).toBe(false);
            expect(Utils.isPhpFalsy("x")).toBe(false);
            expect(Utils.isPhpFalsy([1, 2, 3])).toBe(false);
            expect(Utils.isPhpFalsy({ a: 1 })).toBe(false);
            expect(Utils.isPhpFalsy(true)).toBe(false);
        });

        it("treats any own-key-less object as falsy, a documented non-PHP limitation", () => {
            // PHP has no equivalent of Date/Map/RegExp; these are objects with no own
            // enumerable keys, so isPhpFalsy treats them the same as an empty plain
            // object.
            expect(Utils.isPhpFalsy(new Date())).toBe(true);
            expect(Utils.isPhpFalsy(new Map())).toBe(true);
            expect(Utils.isPhpFalsy(/re/)).toBe(true);
        });
    });

    describe("isPhpNumeric", () => {
        // toCssClasses/toCssStyles used `!isNaN(Number(key))` for PHP's is_numeric,
        // which disagreed with real PHP on four of five probed edge cases. PHP-verified
        // in docs/php-parity/task-08-arr-parity.json.
        it("returns true for real PHP-numeric strings", () => {
            expect(Utils.isPhpNumeric("1e3")).toBe(true);
            expect(Utils.isPhpNumeric(" 42")).toBe(true);
            expect(Utils.isPhpNumeric("42 ")).toBe(true);
            expect(Utils.isPhpNumeric(" 42 ")).toBe(true);
            expect(Utils.isPhpNumeric("+42")).toBe(true);
            expect(Utils.isPhpNumeric("-42")).toBe(true);
            expect(Utils.isPhpNumeric("3.14")).toBe(true);
            expect(Utils.isPhpNumeric("-3.14")).toBe(true);
            expect(Utils.isPhpNumeric("1e-3")).toBe(true);
            expect(Utils.isPhpNumeric("1E3")).toBe(true);
            expect(Utils.isPhpNumeric("007")).toBe(true);
            expect(Utils.isPhpNumeric("0")).toBe(true);
            expect(Utils.isPhpNumeric("00")).toBe(true);
            expect(Utils.isPhpNumeric(".5")).toBe(true);
            expect(Utils.isPhpNumeric("5.")).toBe(true);
            expect(Utils.isPhpNumeric("5.5e2")).toBe(true);
            expect(Utils.isPhpNumeric("\t5")).toBe(true);
            expect(Utils.isPhpNumeric("5\n")).toBe(true);
            expect(Utils.isPhpNumeric("\n5\n")).toBe(true);
            expect(Utils.isPhpNumeric("5\t")).toBe(true);
        });

        it("returns false for strings that only look numeric to JS's Number()", () => {
            // Number("") === 0, Number(" ") === 0, Number("0x10") === 16,
            // Number("Infinity") === Infinity — all "numeric" to
            // `!isNaN(Number(x))`, none numeric to PHP's is_numeric.
            expect(Utils.isPhpNumeric("")).toBe(false);
            expect(Utils.isPhpNumeric(" ")).toBe(false);
            expect(Utils.isPhpNumeric("  ")).toBe(false);
            expect(Utils.isPhpNumeric("0x10")).toBe(false);
            expect(Utils.isPhpNumeric("Infinity")).toBe(false);
            expect(Utils.isPhpNumeric("NAN")).toBe(false);
            expect(Utils.isPhpNumeric("INF")).toBe(false);
        });

        it("returns false for non-numeric strings, including near-misses", () => {
            expect(Utils.isPhpNumeric("abc")).toBe(false);
            expect(Utils.isPhpNumeric("1abc")).toBe(false);
            expect(Utils.isPhpNumeric("abc1")).toBe(false);
            expect(Utils.isPhpNumeric("1_000")).toBe(false);
            expect(Utils.isPhpNumeric("0b101")).toBe(false);
            expect(Utils.isPhpNumeric("0o17")).toBe(false);
            expect(Utils.isPhpNumeric("5,5")).toBe(false);
        });

        it("treats any JS number as numeric, matching PHP's int|float", () => {
            expect(Utils.isPhpNumeric(42)).toBe(true);
            expect(Utils.isPhpNumeric(-3.14)).toBe(true);
            expect(Utils.isPhpNumeric(0)).toBe(true);
            expect(Utils.isPhpNumeric(NaN)).toBe(true);
            expect(Utils.isPhpNumeric(Infinity)).toBe(true);
        });

        it("returns false for non-string, non-number values", () => {
            expect(Utils.isPhpNumeric(null)).toBe(false);
            expect(Utils.isPhpNumeric(undefined)).toBe(false);
            expect(Utils.isPhpNumeric(true)).toBe(false);
            expect(Utils.isPhpNumeric(false)).toBe(false);
            expect(Utils.isPhpNumeric([])).toBe(false);
            expect(Utils.isPhpNumeric({})).toBe(false);
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

    describe("phpValueMatch", () => {
        it.each([
            [0, "0", true],
            [null, "", true],
            [true, "1", true],
            [0, "", false],
            [100, "1e2", false],
        ])(
            "matches %s against %s as PHP's string cast does",
            (a, b, expected) => {
                // Captured: docs/php-parity/task-06-setops.json ("diff and intersect
                // compare by string cast"): diff_int_string, diff_null_empty,
                // intersect_bool_one, diff_int_empty, diff_int_exponential_string.
                expect(Utils.phpValueMatch(a, b)).toBe(expected);
            },
        );

        it("casts false, null and non-exponential decimals the same way PHP does", () => {
            expect(Utils.phpValueMatch(false, "")).toBe(true);
            expect(Utils.phpValueMatch(0.5, "0.5")).toBe(true);
            expect(Utils.phpValueMatch(1, "01")).toBe(false);
        });

        it("does not port PHP's precision=14 float formatting for exponential numbers", () => {
            // String(1e21) is "1e+21", not PHP's "1.0E+21" — neither side of
            // this comparison is castable, so it falls back to identity.
            expect(Utils.phpValueMatch(1e21, "1e+21")).toBe(false);
            expect(Utils.phpValueMatch(1e-7, 1e-7)).toBe(true);
        });

        it("falls back to SameValueZero identity for NaN and Infinity", () => {
            expect(Utils.phpValueMatch(NaN, NaN)).toBe(true);
            expect(Utils.phpValueMatch(NaN, "x")).toBe(false);
            expect(Utils.phpValueMatch(NaN, 5)).toBe(false);
            expect(Utils.phpValueMatch(5, NaN)).toBe(false);
            expect(Utils.phpValueMatch(Infinity, Infinity)).toBe(true);
        });

        it("falls back to SameValueZero identity for types with no PHP analogue", () => {
            const obj = { id: 1 };
            const fn = () => true;
            const sym = Symbol("x");

            expect(Utils.phpValueMatch(undefined, undefined)).toBe(true);
            expect(Utils.phpValueMatch(0, undefined)).toBe(false);
            expect(Utils.phpValueMatch(obj, { id: 1 })).toBe(false);
            expect(Utils.phpValueMatch(obj, obj)).toBe(true);
            expect(Utils.phpValueMatch([1, 2], [1, 2])).toBe(false);
            expect(Utils.phpValueMatch(fn, fn)).toBe(true);
            expect(Utils.phpValueMatch(sym, sym)).toBe(true);
            expect(Utils.phpValueMatch(Symbol("x"), Symbol("x"))).toBe(false);
            expect(Utils.phpValueMatch(new Date(0), new Date(0))).toBe(false);
        });
    });
});
