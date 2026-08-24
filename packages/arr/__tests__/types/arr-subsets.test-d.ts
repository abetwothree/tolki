import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import {
    idObjects,
    nullableElements,
    numberGrid,
    readonlyNumbers,
    readonlyStrings,
    unionElements,
    unknownArray,
} from "./fixtures";

describe("arr subsets type tests", () => {
    describe("only", () => {
        it("preserves string element type", () => {
            expectTypeOf(Arr.only(["a", "b", "c"], [0, 2])).toEqualTypeOf<
                string[]
            >();
        });

        it("preserves number element type", () => {
            expectTypeOf(Arr.only([1, 2, 3], [1])).toEqualTypeOf<number[]>();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.only(idObjects, [0])).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("preserves nested array element type", () => {
            expectTypeOf(Arr.only(numberGrid, [0])).toEqualTypeOf<number[][]>();
        });

        it("preserves a union element type", () => {
            expectTypeOf(Arr.only(unionElements, [0])).toEqualTypeOf<
                (string | number)[]
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.only(readonlyStrings, [0])).toEqualTypeOf<
                string[]
            >();
        });

        it("falls back to unknown[] for unknown data", () => {
            expectTypeOf(Arr.only(unknownArray, [0])).toEqualTypeOf<
                unknown[]
            >();
        });

        it("resolves to never[] for an empty array", () => {
            // Kept inline: the empty array is the value under test — no
            // fixture can stand in for "no elements" without losing the
            // point of the assertion.
            expectTypeOf(Arr.only([], [0])).toEqualTypeOf<never[]>();
        });
    });

    describe("onlyValues", () => {
        it("filters by a value array, preserving number element type", () => {
            // Kept inline: needs five elements so indices 3 and 4 both
            // exist — no shared fixture has five elements.
            expectTypeOf(Arr.onlyValues([1, 2, 3, 4, 5], [3, 4])).toEqualTypeOf<
                number[]
            >();
        });

        it("filters by a single value, preserving string element type", () => {
            expectTypeOf(Arr.onlyValues(["a", "b"], "a")).toEqualTypeOf<
                string[]
            >();
        });

        it("accepts a strict-comparison flag", () => {
            expectTypeOf(Arr.onlyValues([1, 2], [1], true)).toEqualTypeOf<
                number[]
            >();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.onlyValues(idObjects, [{ id: 1 }])).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("accepts a readonly array for data", () => {
            expectTypeOf(Arr.onlyValues(readonlyStrings, ["a"])).toEqualTypeOf<
                string[]
            >();
        });

        it("preserves a nullable element type", () => {
            expectTypeOf(
                Arr.onlyValues(nullableElements, [null]),
            ).toEqualTypeOf<(string | null)[]>();
        });
    });

    describe("keys", () => {
        it("returns number[] for a number array", () => {
            expectTypeOf(Arr.keys([1, 2, 3])).toEqualTypeOf<number[]>();
        });

        it("returns number[] for a string array", () => {
            expectTypeOf(Arr.keys(["a"])).toEqualTypeOf<number[]>();
        });

        it("returns number[] for an empty array", () => {
            expectTypeOf(Arr.keys([])).toEqualTypeOf<number[]>();
        });

        it("returns number[] for unknown data", () => {
            expectTypeOf(Arr.keys(unknownArray)).toEqualTypeOf<number[]>();
        });
    });

    describe("values", () => {
        it("preserves number element type", () => {
            expectTypeOf(Arr.values([1, 2, 3])).toEqualTypeOf<number[]>();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.values(idObjects)).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("preserves nested array element type", () => {
            expectTypeOf(Arr.values(numberGrid)).toEqualTypeOf<number[][]>();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.values(readonlyStrings)).toEqualTypeOf<string[]>();
        });

        it("falls back to unknown[] for unknown data", () => {
            expectTypeOf(Arr.values(unknownArray)).toEqualTypeOf<unknown[]>();
        });
    });

    describe("wrap", () => {
        it("wraps null into an empty tuple", () => {
            expectTypeOf(Arr.wrap(null)).toEqualTypeOf<[]>();
        });

        it("wraps a string into a one-tuple", () => {
            expectTypeOf(Arr.wrap("hello")).toEqualTypeOf<[string]>();
        });

        it("wraps a number into a one-tuple", () => {
            expectTypeOf(Arr.wrap(42)).toEqualTypeOf<[number]>();
        });

        it("passes an array through unchanged", () => {
            expectTypeOf(Arr.wrap(["a", "b"])).toEqualTypeOf<string[]>();
        });

        it("wraps an object into a one-tuple", () => {
            // Kept inline: wrap takes a single value, not an array of
            // values, so the array fixtures don't fit — this needs one
            // bare `{ id: number }` object.
            expectTypeOf(Arr.wrap({ id: 1 })).toEqualTypeOf<[{ id: number }]>();
        });

        it("wraps undefined into a one-tuple", () => {
            expectTypeOf(Arr.wrap(undefined)).toEqualTypeOf<[undefined]>();
        });

        it("passes a nested array through unchanged", () => {
            expectTypeOf(Arr.wrap(numberGrid)).toEqualTypeOf<number[][]>();
        });

        it("passes a readonly array through unchanged, rather than wrapping it as a single value", () => {
            // Regression: without a `readonly TValue[]` overload above the
            // scalar `TValue` overload, a readonly array only matched the
            // scalar case and resolved to `[readonly string[]]` (the whole
            // array wrapped as one element) instead of `string[]`.
            expectTypeOf(Arr.wrap(readonlyStrings)).toEqualTypeOf<string[]>();
        });
    });

    describe("flatten", () => {
        it("flattens a mutable 2D array by one level", () => {
            expectTypeOf(Arr.flatten(numberGrid)).toEqualTypeOf<number[]>();
        });

        it("flattens an array of readonly arrays, rather than leaving it un-flattened", () => {
            // Regression: without an `ArrayItems<ArrayItems<TValue>>`
            // overload, `[readonlyNumbers, readonlyNumbers]` only matched
            // the single-level `TValue[]` overload (with TValue inferred as
            // the inner `readonly number[]` itself), resolving to
            // `(readonly number[])[]` instead of the flattened `number[]`.
            expectTypeOf(
                Arr.flatten([readonlyNumbers, readonlyNumbers]),
            ).toEqualTypeOf<number[]>();
        });

        it("falls back to unknown[] for unknown data", () => {
            expectTypeOf(Arr.flatten(unknownArray)).toEqualTypeOf<unknown[]>();
        });
    });

    describe("reverse", () => {
        it("preserves number element type", () => {
            expectTypeOf(Arr.reverse([1, 2, 3])).toEqualTypeOf<number[]>();
        });

        it("preserves string element type", () => {
            expectTypeOf(Arr.reverse(["a"])).toEqualTypeOf<string[]>();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.reverse(idObjects)).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.reverse(readonlyNumbers)).toEqualTypeOf<
                number[]
            >();
        });

        it("falls back to unknown[] for unknown data", () => {
            expectTypeOf(Arr.reverse(unknownArray)).toEqualTypeOf<unknown[]>();
        });
    });

    describe("shuffle", () => {
        it("preserves number element type", () => {
            expectTypeOf(Arr.shuffle([1, 2, 3])).toEqualTypeOf<number[]>();
        });

        it("preserves string element type", () => {
            expectTypeOf(Arr.shuffle(["a"])).toEqualTypeOf<string[]>();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.shuffle(idObjects)).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.shuffle(readonlyStrings)).toEqualTypeOf<
                string[]
            >();
        });

        it("falls back to unknown[] for unknown data", () => {
            expectTypeOf(Arr.shuffle(unknownArray)).toEqualTypeOf<unknown[]>();
        });
    });

    describe("random", () => {
        it("returns TValue | null without a count", () => {
            expectTypeOf(Arr.random([1, 2, 3])).toEqualTypeOf<number | null>();
        });

        it("returns TValue[] with a count", () => {
            expectTypeOf(Arr.random([1, 2, 3], 2)).toEqualTypeOf<number[]>();
        });

        it("returns a keyed Record when preserveKeys is true", () => {
            expectTypeOf(Arr.random(["a", "b"], 2, true)).toEqualTypeOf<
                Record<number, string>
            >();
        });

        it("returns TValue[] when preserveKeys is explicitly false", () => {
            expectTypeOf(Arr.random(["a", "b"], 2, false)).toEqualTypeOf<
                string[]
            >();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.random(idObjects)).toEqualTypeOf<{
                id: number;
            } | null>();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.random(readonlyNumbers)).toEqualTypeOf<
                number | null
            >();
        });
    });

    describe("sole", () => {
        it("returns the element type for a single-item array", () => {
            expectTypeOf(Arr.sole([42])).toEqualTypeOf<number>();
        });

        it("returns the element type for a single string item", () => {
            expectTypeOf(Arr.sole(["single"])).toEqualTypeOf<string>();
        });

        it("returns the element type with a filtering callback", () => {
            expectTypeOf(
                Arr.sole([1, 2, 3], (v) => v > 2),
            ).toEqualTypeOf<number>();
        });

        it("preserves object element type", () => {
            // Type-only check: `sole` throws at runtime when more than one
            // item matches, but this file never executes — only the
            // resolved type is under test, so `idObjects`'s two elements
            // are harmless here.
            expectTypeOf(Arr.sole(idObjects)).toEqualTypeOf<{
                id: number;
            }>();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.sole(readonlyStrings)).toEqualTypeOf<string>();
        });

        it("accepts a readonly array with a callback, without widening the callback parameter to unknown", () => {
            // Regression: the callback overload used to declare `data:
            // TValue[]` (mutable-only), so a readonly array fell through
            // to the `unknown` fallback overload and `v` below resolved to
            // `unknown` instead of `number`.
            expectTypeOf(
                Arr.sole(readonlyNumbers, (v) => v > 0),
            ).toEqualTypeOf<number>();
        });

        it("infers the callback's value and index parameter types", () => {
            Arr.sole([1, 2], (value, index) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(index).toEqualTypeOf<number>();
                return value > 1;
            });
        });
    });
});
