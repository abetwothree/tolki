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
    });

    describe("compareValues follows PHP's array comparison rule", () => {
        // docs/php-parity/task-25-spaceship-arrays.json, "spaceship on arrays of
        // different length, shorter on the left", "... longer on the left",
        // "spaceship where the longer array holds the smaller elements" and
        // "spaceship on an empty array and a one-element array"
        it("orders two arrays by entry count before it looks at an element", () => {
            expect(Utils.compareValues([1], [1, 2])).toBe(-1);
            expect(Utils.compareValues([1, 2], [1])).toBe(1);
            expect(Utils.compareValues([9, 9], [10])).toBe(1);
            expect(Utils.compareValues([], [1])).toBe(-1);
        });

        // task-25-spaceship-arrays.json, "spaceship on two empty arrays". A plain
        // object and an array both model a PHP array here, so an empty one of
        // either shape holds no entries and the pair ties.
        it("ties two empty containers, whichever shape they carry", () => {
            expect(Utils.compareValues([], [])).toBe(0);
            expect(Utils.compareValues({}, {})).toBe(0);
            expect(Utils.compareValues({}, [])).toBe(0);
            expect(Utils.compareValues([], {})).toBe(0);
        });

        // task-25-spaceship-arrays.json, "spaceship on equal-length arrays
        // differing in the last element", "... in the first element",
        // "spaceship on identical arrays" and "spaceship on arrays of numeric strings"
        it("compares two equal-length arrays element-wise", () => {
            expect(Utils.compareValues([1, 2], [1, 3])).toBe(-1);
            expect(Utils.compareValues([2, 1], [1, 9])).toBe(1);
            expect(Utils.compareValues([1, 2], [1, 2])).toBe(0);
            expect(Utils.compareValues(["9"], ["10"])).toBe(-1);
        });

        // task-25-spaceship-arrays.json, "spaceship on keyed arrays sharing their
        // keys", "... holding the same pairs in another order", and the stdClass
        // rows "spaceship on stdClass objects sharing a property" / "... with equal properties"
        it("compares two keyed objects by key, in whatever order they carry", () => {
            expect(Utils.compareValues({ x: 1 }, { x: 2 })).toBe(-1);
            expect(Utils.compareValues({ x: 2 }, { x: 1 })).toBe(1);
            expect(Utils.compareValues({ x: 1 }, { x: 1 })).toBe(0);
            expect(Utils.compareValues({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(0);
        });

        // task-25-spaceship-arrays.json, "spaceship on keyed arrays with disjoint
        // keys" and its reversed twin, "spaceship on a keyed array and a list of
        // the same length", "spaceship on stdClass objects with disjoint properties"
        it("answers 1 for a pair PHP calls uncomparable, from either side", () => {
            expect(Utils.compareValues({ a: 1 }, { b: 1 })).toBe(1);
            expect(Utils.compareValues({ b: 1 }, { a: 1 })).toBe(1);
            expect(Utils.compareValues({ a: 1 }, [1])).toBe(1);
        });

        // task-25-spaceship-arrays.json, "spaceship walks the left operand keys in
        // their own order" - the empty-string key decides nothing here because the
        // left operand reaches "z" first.
        it("walks the left operand's own key order, not a sorted one", () => {
            expect(Utils.compareValues({ z: 1, "": 9 }, { z: 2, "": 8 })).toBe(
                -1,
            );
        });

        // task-25-spaceship-arrays.json, "spaceship on nested arrays differing one
        // level down" and "... differing in an inner count"
        it("recurses, so an inner count outranks an inner element", () => {
            expect(Utils.compareValues([[1], [2]], [[1], [3]])).toBe(-1);
            expect(Utils.compareValues([[1]], [[1, 2]])).toBe(-1);
        });

        // task-25-spaceship-arrays.json, "spaceship on nested arrays differing one
        // level down". The same row twice on the left is the point: a pair that
        // tied must still be compared against the next right-hand operand.
        it("compares a repeated operand again for each right-hand side", () => {
            const row = { m: 1 };

            expect(Utils.compareValues([row, row], [{ m: 1 }, { m: 2 }])).toBe(
                -1,
            );
        });

        // task-25-spaceship-arrays.json, "spaceship on two DateTime objects,
        // earlier on the left", "... later on the left", "... of the same
        // instant" - a DateTime's state is not a property table, so PHP does
        // not take the array rule for it.
        it("orders two dates chronologically, not by their empty key sets", () => {
            expect(
                Utils.compareValues(
                    new Date("2020-01-01"),
                    new Date("2021-01-01"),
                ),
            ).toBe(-1);
            expect(
                Utils.compareValues(
                    new Date("2021-01-01"),
                    new Date("2020-01-01"),
                ),
            ).toBe(1);
            expect(
                Utils.compareValues(
                    new Date("2020-01-01"),
                    new Date("2020-01-01"),
                ),
            ).toBe(0);
        });

        // task-25-spaceship-arrays.json, "usort orders two DateTime objects
        // chronologically". Compared by identity, not by a serialised form.
        it("sorts a list of dates chronologically through the comparator", () => {
            const earlier = new Date("2020-01-01");
            const later = new Date("2021-01-01");

            const sorted = [later, earlier].sort(Utils.compareValues);

            expect(sorted[0]).toBe(earlier);
            expect(sorted[1]).toBe(later);
        });

        // JS-only: a Map, a Set and a RegExp have no PHP analogue at all, so
        // there is no rule to port - each keeps its state off its own
        // enumerable keys, and any two of them tie on the entry count.
        it("ties two Maps, two Sets or two RegExps", () => {
            expect(Utils.compareValues(new Map([["a", 1]]), new Map())).toBe(0);
            expect(Utils.compareValues(new Set([1, 2]), new Set())).toBe(0);
            expect(Utils.compareValues(/a/, /b/)).toBe(0);
        });

        // Recorded divergence, not parity: task-25-spaceship-arrays.json,
        // "spaceship on a DateTime and a stdClass", its reverse and "... and an
        // empty array" are all 1, where this port keeps the entry-count rule.
        it("leaves a date against a plain object or an array to the entry count", () => {
            expect(Utils.compareValues(new Date(0), {})).toBe(0);
            expect(Utils.compareValues({}, new Date(0))).toBe(0);
            expect(Utils.compareValues(new Date(0), [])).toBe(0);
            expect(Utils.compareValues(new Date(0), { x: 1 })).toBe(-1);
        });

        // task-25-spaceship-arrays.json, "spaceship on two self-referencing arrays"
        // and "... stdClass objects": PHP throws a catchable Error for both, where
        // this port ties the repeated pair so a sort over cyclic rows finishes.
        it("ties a cyclic pair instead of throwing", () => {
            const left: unknown[] = [1];
            left.push(left);
            const right: unknown[] = [1];
            right.push(right);

            expect(Utils.compareValues(left, right)).toBe(0);

            const leftObject: Record<string, unknown> = { x: 1 };
            leftObject["self"] = leftObject;
            const rightObject: Record<string, unknown> = { x: 1 };
            rightObject["self"] = rightObject;

            expect(Utils.compareValues(leftObject, rightObject)).toBe(0);
        });
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

        // The same recorded divergence, against the rows D1 probed for it:
        // task-25-spaceship-arrays.json, "spaceship on an empty array and zero",
        // "... and its only element as a string", "... and a numeric string" are all 1.
        it("leaves an array against a string to JS coercion too", () => {
            expect(Utils.compareValues([], 0)).toBe(0);
            expect(Utils.compareValues(["a"], "a")).toBe(0);
            expect(Utils.compareValues([1], "1")).toBe(0);
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
            // Probed as "plain object and a string": a plain object carries no __toString.
            expect(Utils.looseEqual({}, "[object Object]")).toBe(false);
            expect(Utils.looseEqual({ a: 1 }, "[object Object]")).toBe(false);

            // A class instance with no toString of its own inherits Object.prototype's, so it
            // reaches the arm as a non-plain object and still declines to cast.
            class Bare {}

            expect(Utils.looseEqual(new Bare(), "[object Object]")).toBe(false);
        });

        it("never casts a plain object to a string, however it spells toString", () => {
            // Probed as "array with a toString key and that string" and "object with a toString
            // property but no __toString", both false: a plain object models a PHP array here, and
            // an array never takes the __toString cast even when a "toString" key holds a closure.
            expect(Utils.looseEqual({ toString: () => "hello" }, "hello")).toBe(
                false,
            );
            expect(Utils.looseEqual("hello", { toString: () => "hello" })).toBe(
                false,
            );
            expect(Utils.looseEqual({ toString: () => "hello" }, "world")).toBe(
                false,
            );

            // Object.create(null) is plain too — its prototype is null, not Object.prototype.
            const nullPrototype = Object.create(null) as Record<
                string,
                unknown
            >;
            nullPrototype.toString = () => "hello";

            expect(Utils.looseEqual(nullPrototype, "hello")).toBe(false);
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

        it("requires a plain object's keys in the same order, like PHP's === on arrays", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "containsStrict-key-order"
            expect(Utils.strictEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(
                false,
            );
            expect(Utils.strictEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(
                true,
            );
            expect(
                Utils.strictEqual({ n: { x: 1, y: 2 } }, { n: { y: 2, x: 1 } }),
            ).toBe(false);
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

    describe("operatorMatch", () => {
        // docs/php-parity/task-24-data-release-readiness.json, "contains-three-args-operator"
        it("compares with each of PHP's where() operators", () => {
            expect(Utils.operatorMatch("4", "=", 4)).toBe(true);
            expect(Utils.operatorMatch("4", "==", 4)).toBe(true);
            expect(Utils.operatorMatch("4", "===", 4)).toBe(false);
            expect(Utils.operatorMatch(5, ">", 4)).toBe(true);
            expect(Utils.operatorMatch(1, ">", 4)).toBe(false);
            expect(Utils.operatorMatch("4", "!==", 4)).toBe(true);
            expect(Utils.operatorMatch(1, "!=", 4)).toBe(true);
            expect(Utils.operatorMatch(4, "<>", 4)).toBe(false);
            expect(Utils.operatorMatch(4, "<", 5)).toBe(true);
            expect(Utils.operatorMatch(5, "<=", 5)).toBe(true);
            expect(Utils.operatorMatch(5, ">=", 6)).toBe(false);
        });

        it("treats an unrecognised operator as PHP's switch default does", () => {
            // EnumeratesValues.php:1170-1173 — `default:` shares the `=` arm.
            expect(Utils.operatorMatch(1, "nonsense", "1")).toBe(true);
            expect(Utils.operatorMatch(1, "nonsense", 2)).toBe(false);
        });

        it("answers PHP's spaceship truthiness, so an incomparable pair is equal", () => {
            // `$a <=> $b` is truthy only when the pair orders; NAN and 1 vs "1" order neither way.
            expect(Utils.operatorMatch(1, "<=>", 2)).toBe(true);
            expect(Utils.operatorMatch(2, "<=>", 1)).toBe(true);
            expect(Utils.operatorMatch(1, "<=>", 1)).toBe(false);
            expect(Utils.operatorMatch(1, "<=>", "1")).toBe(false);
            expect(Utils.operatorMatch(Number.NaN, "<=>", 1)).toBe(false);
        });

        it("refuses to order a nullish operand, as PHP's relational operators do", () => {
            expect(Utils.operatorMatch(null, "<", 1)).toBe(false);
            expect(Utils.operatorMatch(1, ">", null)).toBe(false);
            expect(Utils.operatorMatch(undefined, "<=", 1)).toBe(false);
            expect(Utils.operatorMatch(1, ">=", undefined)).toBe(false);
        });

        it("answers only the inequality operators when one side alone is an object", () => {
            // EnumeratesValues.php:1166-1168 — PHP cannot order an object against a scalar.
            const stamp = new Date(0);

            expect(Utils.operatorMatch(stamp, "!=", 1)).toBe(true);
            expect(Utils.operatorMatch(stamp, "<>", 1)).toBe(true);
            expect(Utils.operatorMatch(stamp, "!==", 1)).toBe(true);
            expect(Utils.operatorMatch(stamp, "=", 1)).toBe(false);
            expect(Utils.operatorMatch(stamp, ">", 1)).toBe(false);
            // Two objects, or an object against a string, fall through to the switch.
            expect(Utils.operatorMatch({ a: 1 }, "=", { a: 1 })).toBe(true);
            expect(Utils.operatorMatch({ a: 1 }, "=", "x")).toBe(false);
        });
    });
});
