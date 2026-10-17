import * as Utils from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
    describe("phpTypeName", () => {
        it("names every value the way PHP's gettype() does", () => {
            // docs/php-parity/Php/gettype.json, "gettype of an integer"
            expect(Utils.phpTypeName(1)).toBe("integer");
            // docs/php-parity/Php/gettype.json, "gettype of a float"
            expect(Utils.phpTypeName(1.5)).toBe("double");
            // docs/php-parity/Php/gettype.json, "gettype of a string"
            expect(Utils.phpTypeName("s")).toBe("string");
            // docs/php-parity/Php/gettype.json, "gettype of a boolean"
            expect(Utils.phpTypeName(true)).toBe("boolean");
            // docs/php-parity/Php/gettype.json, "gettype of null"
            expect(Utils.phpTypeName(null)).toBe("NULL");
            // docs/php-parity/Php/gettype.json, "gettype of an array"
            expect(Utils.phpTypeName([1])).toBe("array");
            // docs/php-parity/Php/gettype.json, "gettype of an object"
            expect(Utils.phpTypeName({})).toBe("object");
        });

        it("maps the shapes `typeof` disagrees with gettype() on", () => {
            // NAN and INF are both doubles in PHP; `typeof NaN` is "number".
            expect(Utils.phpTypeName(NaN)).toBe("double");
            expect(Utils.phpTypeName(Infinity)).toBe("double");
            // A PHP closure is an object; `typeof` says "function".
            expect(Utils.phpTypeName(() => 1)).toBe("object");
            expect(Utils.phpTypeName(function named() {})).toBe("object");
            // PHP has no `undefined`; an absent value reads NULL.
            expect(Utils.phpTypeName(undefined)).toBe("NULL");
        });

        it("differs from typeOf, which reports JavaScript names", () => {
            expect(Utils.typeOf(1)).toBe("number");
            expect(Utils.phpTypeName(1)).toBe("integer");
            expect(Utils.typeOf(null)).toBe("object");
            expect(Utils.phpTypeName(null)).toBe("NULL");
        });
    });

    describe("phpDebugType", () => {
        it("names a number past PHP's int range, or -0, float, as PHP holds each", () => {
            // docs/php-parity/Php/get_debug_type.json, "C32-A-debug-type-float-past-int-range"
            expect(
                [1e19, -1e19, -0, 2 ** 63, 2 ** 62].map((value) =>
                    Utils.phpDebugType(value),
                ),
            ).toEqual(["float", "float", "float", "float", "int"]);
        });

        it("names a scalar, null or an array as get_debug_type() does", () => {
            // docs/php-parity/Collection/ensure.json, "C32-A-ensure-debug-type-names",
            // "C32-A-ensure-scalar-message" and "C32-A-ensure-array-rejects-null"
            expect(
                [1, 1.5, NaN, true, { a: 1 }, [1], "foo", null].map((value) =>
                    Utils.phpDebugType(value),
                ),
            ).toEqual([
                "int",
                "float",
                "float",
                "bool",
                "array",
                "array",
                "string",
                "null",
            ]);
            // JS-only: PHP has no undefined; it is named as null
            expect(Utils.phpDebugType(undefined)).toBe("null");
        });

        it("names a function Closure, an object its class, and an anonymous class class@anonymous", () => {
            class Point {}

            // docs/php-parity/Collection/ensure.json,
            // "C32-A-ensure-closure-and-anonymous-class-names" and "C32-A-ensure-inheritance-message"
            expect(Utils.phpDebugType(() => 1)).toBe("Closure");
            expect(Utils.phpDebugType(new (class {})())).toBe(
                "class@anonymous",
            );
            expect(Utils.phpDebugType(new Point())).toBe("Point");
        });

        it("names an instance of an anonymous subclass after the class it extends, as get_debug_type() does", () => {
            class Parent {}
            class Child extends Parent {}

            // docs/php-parity/Collection/ensure.json, "C32-A-ensure-anonymous-subclass-name"
            expect(Utils.phpDebugType(new (class extends Parent {})())).toBe(
                "Parent@anonymous",
            );
            expect(Utils.phpDebugType(new (class extends Child {})())).toBe(
                "Child@anonymous",
            );
        });

        it("names what PHP has no type for by its JavaScript type", () => {
            // JS-only: a symbol, a bigint and an object with no class have no PHP type name
            expect(
                [Symbol("s"), 1n, Object.create(Object.create(null))].map(
                    (value) => Utils.phpDebugType(value),
                ),
            ).toEqual(["symbol", "bigint", "object"]);
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
});
