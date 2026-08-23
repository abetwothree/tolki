import * as Utils from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
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
