import * as Utils from "@tolki/utils";
import { describe, expect, it } from "vitest";

describe("Utils", () => {
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
