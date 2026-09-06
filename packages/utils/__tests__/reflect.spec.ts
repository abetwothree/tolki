import * as Utils from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
    describe("phpTypeName", () => {
        it("names every value the way PHP's gettype() does", () => {
            // docs/php-parity/task-17-second-review.json, "gettype of an integer"
            expect(Utils.phpTypeName(1)).toBe("integer");
            // docs/php-parity/task-17-second-review.json, "gettype of a float"
            expect(Utils.phpTypeName(1.5)).toBe("double");
            // docs/php-parity/task-17-second-review.json, "gettype of a string"
            expect(Utils.phpTypeName("s")).toBe("string");
            // docs/php-parity/task-17-second-review.json, "gettype of a boolean"
            expect(Utils.phpTypeName(true)).toBe("boolean");
            // docs/php-parity/task-17-second-review.json, "gettype of null"
            expect(Utils.phpTypeName(null)).toBe("NULL");
            // docs/php-parity/task-17-second-review.json, "gettype of an array"
            expect(Utils.phpTypeName([1])).toBe("array");
            // docs/php-parity/task-17-second-review.json, "gettype of an object"
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
