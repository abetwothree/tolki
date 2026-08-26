import * as Utils from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
    it("entriesKeyValue converts numeric-like strings and preserves others", () => {
        expect(Utils.entriesKeyValue("42" as unknown as PropertyKey)).toBe(42);
        expect(Utils.entriesKeyValue("004" as unknown as PropertyKey)).toBe(4);
        expect(Utils.entriesKeyValue("abc" as unknown as PropertyKey)).toBe(
            "abc",
        );
    });

    describe("isIntegerLikeKey", () => {
        it("returns true for canonical non-negative integer strings", () => {
            expect(Utils.isIntegerLikeKey("0")).toBe(true);
            expect(Utils.isIntegerLikeKey("1")).toBe(true);
            expect(Utils.isIntegerLikeKey("23")).toBe(true);
        });

        it("returns false for strings that merely look numeric", () => {
            expect(Utils.isIntegerLikeKey("01")).toBe(false);
            expect(Utils.isIntegerLikeKey("-1")).toBe(false);
            expect(Utils.isIntegerLikeKey("1.5")).toBe(false);
            expect(Utils.isIntegerLikeKey("")).toBe(false);
            expect(Utils.isIntegerLikeKey("x")).toBe(false);
        });
    });

    describe("isPhpArrayKey", () => {
        it("returns true for strings", () => {
            expect(Utils.isPhpArrayKey("taylor")).toBe(true);
            expect(Utils.isPhpArrayKey("")).toBe(true);
            expect(Utils.isPhpArrayKey("__proto__")).toBe(true);
        });

        it("returns true for integers inside PHP's 64-bit range", () => {
            expect(Utils.isPhpArrayKey(0)).toBe(true);
            expect(Utils.isPhpArrayKey(-0)).toBe(true);
            expect(Utils.isPhpArrayKey(1)).toBe(true);
            expect(Utils.isPhpArrayKey(-42)).toBe(true);
            expect(Utils.isPhpArrayKey(1e16)).toBe(true);
        });

        it("accepts PHP_INT_MIN, whose bound is inclusive", () => {
            // PHP_INT_MIN is exactly -2^63 and is a valid PHP array key, so
            // the lower bound has to be inclusive rather than a magnitude test
            expect(Utils.isPhpArrayKey(-(2 ** 63))).toBe(true);
        });

        it("rejects magnitudes at or beyond PHP's 64-bit range", () => {
            // 2^63 is PHP_INT_MAX + 1, so it is a float in PHP, not a key
            expect(Utils.isPhpArrayKey(2 ** 63)).toBe(false);
            expect(Utils.isPhpArrayKey(-(2 ** 63) - 4096)).toBe(false);
            expect(Utils.isPhpArrayKey(1e21)).toBe(false);
            expect(Utils.isPhpArrayKey(-1e21)).toBe(false);
        });

        it("accepts the largest double below the upper bound", () => {
            // 2^63 - 1 is not representable as a double, so this is the
            // largest candidate that can reach the check
            expect(Utils.isPhpArrayKey(9223372036854774784)).toBe(true);
        });

        it("returns false for floats", () => {
            expect(Utils.isPhpArrayKey(1.5)).toBe(false);
            expect(Utils.isPhpArrayKey(-0.1)).toBe(false);
            expect(Utils.isPhpArrayKey(NaN)).toBe(false);
            expect(Utils.isPhpArrayKey(Infinity)).toBe(false);
        });

        it("returns false for values PHP cannot use as keys", () => {
            expect(Utils.isPhpArrayKey(null)).toBe(false);
            expect(Utils.isPhpArrayKey(undefined)).toBe(false);
            expect(Utils.isPhpArrayKey(true)).toBe(false);
            expect(Utils.isPhpArrayKey(false)).toBe(false);
            expect(Utils.isPhpArrayKey([])).toBe(false);
            expect(Utils.isPhpArrayKey({})).toBe(false);
            expect(Utils.isPhpArrayKey(() => {})).toBe(false);
            expect(Utils.isPhpArrayKey(Symbol("k"))).toBe(false);
        });
    });

    describe("defineKey", () => {
        it("defines an own enumerable key", () => {
            const target: Record<string, number> = {};
            Utils.defineKey(target, "a", 1);

            expect(target["a"]).toBe(1);
            expect(Object.keys(target)).toEqual(["a"]);
            expect(Object.hasOwn(target, "a")).toBe(true);
        });

        it("defines a writable and configurable property", () => {
            const target: Record<string, number> = {};
            Utils.defineKey(target, "a", 1);

            expect(Object.getOwnPropertyDescriptor(target, "a")).toStrictEqual({
                value: 1,
                enumerable: true,
                writable: true,
                configurable: true,
            });
        });

        it("overwrites a key that was already defined", () => {
            const target: Record<string, number> = {};
            Utils.defineKey(target, "a", 1);
            Utils.defineKey(target, "a", 2);

            expect(target["a"]).toBe(2);
            expect(Object.keys(target)).toEqual(["a"]);
        });

        it("stores __proto__ as a real own key without polluting the prototype", () => {
            const target: Record<string, string> = {};
            Utils.defineKey(target, "__proto__", "safe");

            expect(Object.hasOwn(target, "__proto__")).toBe(true);
            expect(target["__proto__"]).toBe("safe");
            expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
            expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
        });

        it("stores other prototype-sensitive keys as own keys", () => {
            const target: Record<string, string> = {};
            Utils.defineKey(target, "constructor", "a");
            Utils.defineKey(target, "prototype", "b");

            expect(target["constructor"]).toBe("a");
            expect(target["prototype"]).toBe("b");
            expect(Object.keys(target)).toEqual(["constructor", "prototype"]);
        });
    });
});
