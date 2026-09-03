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

    describe("compareValues follows PHP 8's comparison rules", () => {
        // task-17-second-review.json, "spaceship on two numeric strings";
        // task-19-spaceship.json, "spaceship on two numeric strings, wider on the left"
        it("compares two numeric strings numerically", () => {
            expect(Utils.compareValues("5", "10")).toBe(-1);
            expect(Utils.compareValues("9", "10")).toBe(-1);
            expect(Utils.compareValues("10", "9")).toBe(1);
        });

        // task-19-spaceship.json, "spaceship on numeric strings spelled
        // differently", "spaceship on an int and its numeric string" and
        // "spaceship on a whitespace-padded integer string"
        it("ties numeric operands that spell the same number", () => {
            expect(Utils.compareValues("1", "01")).toBe(0);
            expect(Utils.compareValues(1, "1")).toBe(0);
            expect(Utils.compareValues(" 42 ", "42")).toBe(0);
        });

        // task-19-spaceship.json, "spaceship on integer strings one apart past
        // 2^53" and its ascending twin, "spaceship on negative integer strings
        // past 2^53", "spaceship on integer strings past the int64 range"
        it("compares integer strings past 2^53 exactly", () => {
            expect(
                Utils.compareValues("9007199254740993", "9007199254740992"),
            ).toBe(1);
            expect(
                Utils.compareValues("9007199254740993", "9007199254740994"),
            ).toBe(-1);
            expect(
                Utils.compareValues("-9007199254740993", "-9007199254740992"),
            ).toBe(-1);
            expect(
                Utils.compareValues(
                    "99999999999999999999",
                    "99999999999999999998",
                ),
            ).toBe(1);
        });

        // task-19-spaceship.json, "spaceship on a leading-zero integer string
        // that is larger" and "spaceship on a leading-zero integer string that
        // is smaller"
        it("compares integer strings by value, not by digit count", () => {
            expect(Utils.compareValues("0000123", "99")).toBe(1);
            expect(Utils.compareValues("00001", "99")).toBe(-1);
        });

        // task-19-spaceship.json, "spaceship on exponent strings that overflow
        // to infinity" and "spaceship on identical exponent strings that
        // overflow" - PHP's own fallback for a pair that overflows to one value
        it("orders exponent strings that overflow to infinity as strings", () => {
            expect(Utils.compareValues("1e400", "1e401")).toBe(-1);
            expect(Utils.compareValues("1e400", "1e400")).toBe(0);
        });

        // task-19-spaceship.json, "spaceship on decimal strings spelled
        // differently" and "spaceship on an integer string and a decimal string"
        it("compares decimal strings as numbers", () => {
            expect(Utils.compareValues("1.5", "1.50")).toBe(0);
            expect(Utils.compareValues("1.5", "2.5")).toBe(-1);
            expect(Utils.compareValues("2.5", "1.5")).toBe(1);
            expect(Utils.compareValues("42", "1.5")).toBe(1);
        });

        // task-17-second-review.json, "spaceship on a numeric and a non-numeric
        // string". A pin, not a RED test: JS's `<` on two strings is already
        // lexical, so this holds on the pre-fix source too.
        it("compares two strings lexically when either is non-numeric", () => {
            expect(Utils.compareValues("5", "abc")).toBe(-1);
        });

        // task-17-second-review.json, "spaceship on zero and empty string";
        // task-19-spaceship.json, "spaceship on an int and a non-numeric string",
        // "... a non-numeric string and an int", "... a negative int and an empty string"
        it("compares a number against a non-numeric string as strings", () => {
            expect(Utils.compareValues(0, "")).toBe(1);
            expect(Utils.compareValues(0, "abc")).toBe(-1);
            expect(Utils.compareValues("abc", 0)).toBe(1);
            expect(Utils.compareValues(5, "abc")).toBe(-1);
            expect(Utils.compareValues(-1, "")).toBe(1);
        });

        // task-17-second-review.json, "spaceship on null and false";
        // task-19-spaceship.json, "spaceship on null and zero" and
        // "spaceship on null and an empty string"
        it("treats null as equal to the other falsy scalars", () => {
            expect(Utils.compareValues(null, false)).toBe(0);
            expect(Utils.compareValues(null, 0)).toBe(0);
            expect(Utils.compareValues(null, "")).toBe(0);
        });

        // task-19-spaceship.json, "spaceship on null and a non-numeric string"
        // and "spaceship on null and the string zero"
        it("compares null against a string as the empty string", () => {
            expect(Utils.compareValues(null, "abc")).toBe(-1);
            expect(Utils.compareValues("abc", null)).toBe(1);
            expect(Utils.compareValues(null, "0")).toBe(-1);
            expect(Utils.compareValues("0", null)).toBe(1);
        });

        // task-19-spaceship.json, "spaceship on null and a positive int",
        // "spaceship on null and an empty array" and "spaceship on null and a
        // one-element array"
        it("compares null against a non-string as booleans", () => {
            expect(Utils.compareValues(null, 5)).toBe(-1);
            expect(Utils.compareValues(null, [])).toBe(0);
            expect(Utils.compareValues(null, [1])).toBe(-1);
        });

        // task-19-spaceship.json, "spaceship on false and a negative int",
        // "spaceship on false and a non-numeric string" and "spaceship on false
        // and an empty array"
        it("compares false against anything else as booleans", () => {
            expect(Utils.compareValues(false, -1)).toBe(-1);
            expect(Utils.compareValues(false, "abc")).toBe(-1);
            expect(Utils.compareValues(false, [])).toBe(0);
        });

        // task-19-spaceship.json, "spaceship on true and a positive int",
        // "spaceship on true and an empty string", "spaceship on true and the
        // string zero" and "spaceship on true and false"
        it("compares true against anything else as booleans", () => {
            expect(Utils.compareValues(true, 5)).toBe(0);
            expect(Utils.compareValues(true, "")).toBe(1);
            expect(Utils.compareValues(true, "0")).toBe(1);
            expect(Utils.compareValues(true, false)).toBe(1);
        });

        // Recorded divergence, not parity: PHP orders every array above every
        // scalar (task-19-spaceship.json, "spaceship on an int and a
        // one-element array" is -1), where this port keeps JS coercion.
        it("leaves an array against a number to JS coercion", () => {
            expect(Utils.compareValues([1], 5)).toBe(-1);
            expect(Utils.compareValues([1], 0)).toBe(1);
            expect(Utils.compareValues([5], 5)).toBe(0);
        });
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

        it("compares null against a string as an empty string (PHP 8)", () => {
            // docs/php-parity/task-20-loose-equal.json
            expect(Utils.looseEqual(null, "")).toBe(true);
            expect(Utils.looseEqual(null, "0")).toBe(false);
            expect(Utils.looseEqual(null, "a")).toBe(false);
            expect(Utils.looseEqual("", undefined)).toBe(true);
        });

        it("compares null against non-strings as booleans (PHP 8)", () => {
            expect(Utils.looseEqual(null, 0)).toBe(true);
            expect(Utils.looseEqual(null, 5)).toBe(false);
            expect(Utils.looseEqual([], null)).toBe(true);
            expect(Utils.looseEqual([1], null)).toBe(false);
            expect(Utils.looseEqual(null, undefined)).toBe(true);
        });

        it("does not treat 0, '' and [] as equal to each other (PHP 8)", () => {
            expect(Utils.looseEqual(0, "")).toBe(false);
            expect(Utils.looseEqual([], 0)).toBe(false);
            expect(Utils.looseEqual([], "")).toBe(false);
            expect(Utils.looseEqual([1], 1)).toBe(false);
            expect(Utils.looseEqual("", "0")).toBe(false);
        });

        it("compares two numeric strings, or a number and a numeric string, numerically", () => {
            expect(Utils.looseEqual("1e1", "10")).toBe(true);
            expect(Utils.looseEqual("1", "01")).toBe(true);
            expect(Utils.looseEqual(100, "1e2")).toBe(true);
            expect(Utils.looseEqual(1, " 1")).toBe(true);
            expect(Utils.looseEqual(1, "1 ")).toBe(true);
            expect(Utils.looseEqual(0, "0")).toBe(true);
            expect(Utils.looseEqual(-0, "-0")).toBe(true);
            expect(Utils.looseEqual(1n, "1")).toBe(true);
            expect(Utils.looseEqual(1n, 1)).toBe(true);
            // Rule 1, two strings: zendi_smart_strcmp, whose overflow fallback to a string
            // compare is the only reason PHP says these two are different.
            expect(Utils.looseEqual("1e999", "1e1000")).toBe(false);
            expect(
                Utils.looseEqual("9007199254740993", "9007199254740992"),
            ).toBe(false);
            // Rule 2, anything PHP holds as an int: exact BigInt compare. Number() collapses every
            // one of these pairs onto the single double 9007199254740992.
            expect(Utils.looseEqual(9007199254740992, "9007199254740993")).toBe(
                false,
            );
            expect(
                Utils.looseEqual("9007199254740992", 9007199254740993n),
            ).toBe(false);
            expect(Utils.looseEqual(9007199254740992, 9007199254740993n)).toBe(
                false,
            );
            expect(
                Utils.looseEqual(9007199254740993n, "9007199254740992"),
            ).toBe(false);
            // Rule 3, the float path: an infinity is not integral, so it never reaches BigInt().
            expect(Utils.looseEqual(Number.POSITIVE_INFINITY, "1e400")).toBe(
                true,
            );
            expect(Utils.looseEqual(Number.NEGATIVE_INFINITY, "-1e999")).toBe(
                true,
            );
            expect(Utils.looseEqual(0.1 + 0.2, 0.3)).toBe(false);
            expect(Utils.looseEqual(Number.NaN, Number.NaN)).toBe(false);
            expect(
                Utils.looseEqual(
                    Number.POSITIVE_INFINITY,
                    Number.POSITIVE_INFINITY,
                ),
            ).toBe(true);
        });

        it("compares a number against a non-numeric string as PHP would print the number", () => {
            expect(Utils.looseEqual(0, "a")).toBe(false);
            expect(Utils.looseEqual("abc", 0)).toBe(false);
            expect(Utils.looseEqual(1, "1abc")).toBe(false);
            expect(Utils.looseEqual(Number.POSITIVE_INFINITY, "INF")).toBe(
                true,
            );
            expect(Utils.looseEqual(Number.NEGATIVE_INFINITY, "-INF")).toBe(
                true,
            );
            // NaN is uncomparable in PHP before any cast, so it never reaches the string arm.
            expect(Utils.looseEqual(Number.NaN, "NAN")).toBe(false);
            expect(Utils.looseEqual("NAN", Number.NaN)).toBe(false);
            expect(Utils.looseEqual("abc", "ABC")).toBe(false);
        });

        // task-20-loose-equal.json, "float past the int range and its integer string",
        // "larger float past the int range and its integer string", its negative twin,
        // and "one and an integer string past the int range"
        it("ties a float and its integer string past PHP's int range", () => {
            expect(Utils.looseEqual(1e23, "100000000000000000000000")).toBe(
                true,
            );
            expect(
                Utils.looseEqual(1e30, "1000000000000000000000000000000"),
            ).toBe(true);
            expect(Utils.looseEqual(-1e23, "-100000000000000000000000")).toBe(
                true,
            );
            // The string is the left operand here, so it is the one leaving the int range.
            expect(Utils.looseEqual("100000000000000000000000", 1e23)).toBe(
                true,
            );
            expect(Utils.looseEqual(1, "100000000000000000000000")).toBe(false);
        });

        // task-20-loose-equal.json, "overflowing integer strings, one signed" and
        // "... one zero-padded", "underflowing integer strings, one zero-padded",
        // "... on opposite sides", "... of different magnitude", and the in-range
        // controls "one and signed one", "PHP_INT_MAX strings, one signed",
        // "PHP_INT_MIN strings, one zero-padded"
        it("separates two spellings of one integer once it overflows PHP's int", () => {
            expect(
                Utils.looseEqual("9223372036854775808", "+9223372036854775808"),
            ).toBe(false);
            expect(
                Utils.looseEqual("9223372036854775808", "09223372036854775808"),
            ).toBe(false);
            expect(
                Utils.looseEqual(
                    "-9223372036854775809",
                    "-09223372036854775809",
                ),
            ).toBe(false);
            // Overflowing on opposite sides, or to different doubles, never reaches the
            // byte compare: PHP orders those as the doubles they became.
            expect(
                Utils.looseEqual("9223372036854775808", "-9223372036854775808"),
            ).toBe(false);
            expect(
                Utils.looseEqual("9223372036854775808", "99999999999999999999"),
            ).toBe(false);
            // In range PHP holds both as ints, so the spelling stops mattering.
            expect(Utils.looseEqual("1", "+1")).toBe(true);
            expect(
                Utils.looseEqual("9223372036854775807", "+9223372036854775807"),
            ).toBe(true);
            expect(
                Utils.looseEqual(
                    "-9223372036854775808",
                    "-09223372036854775808",
                ),
            ).toBe(true);
        });

        it("compares an object with a custom toString against a string, both ways", () => {
            // PHP's __toString: $obj == "hello" is true. Cited by name, not line, so an
            // insertion above cannot invalidate it: collection.spec.ts, describe("where")
            // > describe("Laravel Tests") > it("test where") leans on this.
            class HtmlString {
                value: string;
                constructor(value: string) {
                    this.value = value;
                }
                toString() {
                    return this.value;
                }
            }

            expect(Utils.looseEqual(new HtmlString("hello"), "hello")).toBe(
                true,
            );
            expect(Utils.looseEqual("hello", new HtmlString("hello"))).toBe(
                true,
            );
            expect(Utils.looseEqual(new HtmlString("hello"), "world")).toBe(
                false,
            );
            expect(Utils.looseEqual({ a: 1 }, "hello")).toBe(false);
            // A plain object's toString IS Object.prototype.toString, so the arm never fires for it.
            expect(Utils.looseEqual({}, "[object Object]")).toBe(false);
            expect(Utils.looseEqual({ a: 1 }, "[object Object]")).toBe(false);
        });

        it("keeps boolean comparisons against bigint and empty objects", () => {
            expect(Utils.looseEqual(true, 1n)).toBe(true);
            expect(Utils.looseEqual(false, 0n)).toBe(true);
            // A JS object models a PHP associative array, not a stdClass, so these follow the
            // probed "empty array and false" (true) and "empty array and true" (false).
            expect(Utils.looseEqual(false, {})).toBe(true);
            expect(Utils.looseEqual(true, {})).toBe(false);
            expect(Utils.looseEqual(true, { a: 1 })).toBe(true);
        });

        // task-20-loose-equal.json, "plain object and true"/"...and false"/"...and null"
        // and their "stateless object" twins: an object is ALWAYS truthy in PHP, so only
        // the plain object standing in for an associative array may be empty-and-falsy.
        it("treats every non-plain object as truthy, however empty its own keys are", () => {
            class Sized {
                get size(): number {
                    return 0;
                }
            }

            const stateless: unknown[] = [
                new Date(0),
                new Map(),
                new Set(),
                /re/,
                new Sized(),
            ];

            for (const value of stateless) {
                expect(Utils.looseEqual(value, true)).toBe(true);
                expect(Utils.looseEqual(value, false)).toBe(false);
                expect(Utils.looseEqual(value, null)).toBe(false);
            }

            // Unchanged: a plain object still models a PHP array, so {} == false as [] does.
            expect(Utils.looseEqual({}, true)).toBe(false);
            expect(Utils.looseEqual({}, false)).toBe(true);
            expect(Utils.looseEqual({}, null)).toBe(true);
            expect(Utils.looseEqual({ a: 1 }, true)).toBe(true);
            expect(Utils.looseEqual({ a: 1 }, false)).toBe(false);
            expect(Utils.looseEqual({ a: 1 }, null)).toBe(false);
            // A null prototype is plain too: there is nowhere else for state to hide.
            expect(Utils.looseEqual(Object.create(null), false)).toBe(true);
        });

        // task-20-loose-equal.json, "assoc arrays in a different order",
        // "true and the string zero", "false and the string zero"
        it("ignores key order in an associative array and reads '0' as falsy", () => {
            expect(Utils.looseEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
            expect(Utils.looseEqual(true, "0")).toBe(false);
            expect(Utils.looseEqual(false, "0")).toBe(true);
        });

        // A hole reads as undefined; Array.prototype.every skips it outright, which would
        // let the hole match whatever sits opposite it.
        it("compares a sparse array's holes instead of skipping them", () => {
            const holeThenOne: unknown[] = new Array(2);

            holeThenOne[1] = 1;

            expect(Utils.looseEqual(holeThenOne, [9, 1])).toBe(false);
            expect(Utils.looseEqual(new Array(2), [1, 2])).toBe(false);
            expect(Utils.looseEqual(holeThenOne, [undefined, 1])).toBe(true);
        });

        it("never equates an array or object with a non-null scalar", () => {
            expect(Utils.looseEqual([1, 2], "1,2")).toBe(false);
            expect(Utils.looseEqual({ a: 1 }, "a")).toBe(false);
            expect(Utils.looseEqual({ a: 1 }, [1])).toBe(false);
            expect(Utils.looseEqual([1, "2"], ["1", 2])).toBe(true);
            expect(Utils.looseEqual([1, 2], [2, 1])).toBe(false);
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
