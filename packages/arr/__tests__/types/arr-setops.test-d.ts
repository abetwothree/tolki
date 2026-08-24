import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import { readonlyNumbers, readonlyStrings, unknownArray } from "./fixtures";

describe("arr set operation type tests", () => {
    describe("diff", () => {
        it("preserves number element type", () => {
            expectTypeOf(Arr.diff([1, 2, 3], [2, 3, 4])).toEqualTypeOf<
                number[]
            >();
        });

        it("preserves string element type", () => {
            expectTypeOf(Arr.diff(["a", "b"], ["b"])).toEqualTypeOf<string[]>();
        });

        it("preserves object element type", () => {
            // Kept inline rather than the shared `idObjects` fixture: the
            // expected type here is exactly `{ id: number }[]`, and
            // `idObjects` carries an extra `name` field that would make
            // that expectation wrong.
            expectTypeOf(Arr.diff([{ id: 1 }], [{ id: 2 }])).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("preserves nested array element type", () => {
            expectTypeOf(Arr.diff([[1], [2]], [[1]])).toEqualTypeOf<
                number[][]
            >();
        });

        it("accepts readonly arrays for both parameters", () => {
            expectTypeOf(
                Arr.diff(readonlyNumbers, readonlyNumbers),
            ).toEqualTypeOf<number[]>();
        });

        it("falls back to unknown[] for unknown data", () => {
            expectTypeOf(Arr.diff(unknownArray, unknownArray)).toEqualTypeOf<
                unknown[]
            >();
        });

        it("returns number[] for an empty data array against a typed other array", () => {
            // `data` is an empty array literal, contributing no inference
            // candidate of its own; `TValue` is inferred solely from
            // `other: [1]`, so the result is `number[]`, not `never[]` —
            // an empty array is a valid `number[]` at the value level.
            expectTypeOf(Arr.diff([], [1])).toEqualTypeOf<number[]>();
        });
    });

    describe("intersect", () => {
        it("preserves number element type with no callback", () => {
            expectTypeOf(Arr.intersect([1, 2, 3], [2, 3])).toEqualTypeOf<
                number[]
            >();
        });

        it("preserves string element type with a null callback", () => {
            expectTypeOf(Arr.intersect(["a"], ["a"], null)).toEqualTypeOf<
                string[]
            >();
        });

        it("preserves number element type with a cross-type callback", () => {
            expectTypeOf(
                Arr.intersect([1, 2], ["1"], (a, b) => String(a) === b),
            ).toEqualTypeOf<number[]>();
        });

        it("infers callback params from data and other element types", () => {
            Arr.intersect([1, 2], ["1"], (a, b) => {
                expectTypeOf(a).toEqualTypeOf<number>();
                expectTypeOf(b).toEqualTypeOf<string>();
                return String(a) === b;
            });
        });

        it("preserves object element type", () => {
            // Kept inline rather than the shared `idObjects` fixture, for
            // the same reason as `diff`'s object-element case above.
            expectTypeOf(Arr.intersect([{ id: 1 }], [{ id: 1 }])).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("accepts readonly arrays for both parameters", () => {
            expectTypeOf(
                Arr.intersect(readonlyStrings, readonlyStrings),
            ).toEqualTypeOf<string[]>();
        });
    });

    describe("intersectAssoc", () => {
        it("preserves number element type", () => {
            expectTypeOf(Arr.intersectAssoc([1, 2, 3], [2, 3])).toEqualTypeOf<
                number[]
            >();
        });

        it("preserves string element type", () => {
            expectTypeOf(
                Arr.intersectAssoc(["a", "b"], ["a", "c"]),
            ).toEqualTypeOf<string[]>();
        });

        it("preserves object element type", () => {
            // Kept inline rather than the shared `idObjects` fixture, for
            // the same reason as `diff`'s object-element case above.
            expectTypeOf(
                Arr.intersectAssoc([{ id: 1 }], [{ id: 1 }]),
            ).toEqualTypeOf<{ id: number }[]>();
        });

        it("accepts readonly arrays for both parameters", () => {
            expectTypeOf(
                Arr.intersectAssoc(readonlyNumbers, readonlyNumbers),
            ).toEqualTypeOf<number[]>();
        });

        it("falls back to unknown[] for unknown data", () => {
            expectTypeOf(
                Arr.intersectAssoc(unknownArray, unknownArray),
            ).toEqualTypeOf<unknown[]>();
        });
    });

    describe("intersectAssocUsing", () => {
        it("preserves number element type", () => {
            expectTypeOf(
                Arr.intersectAssocUsing([1, 2], [1, 2], (a, b) => a === b),
            ).toEqualTypeOf<number[]>();
        });

        it("infers both callback params as number (index comparator)", () => {
            Arr.intersectAssocUsing([1, 2], [1, 2], (keyA, keyB) => {
                expectTypeOf(keyA).toEqualTypeOf<number>();
                expectTypeOf(keyB).toEqualTypeOf<number>();
                return keyA === keyB;
            });
        });

        it("preserves string element type", () => {
            expectTypeOf(
                Arr.intersectAssocUsing(["a"], ["a"], (a, b) => a === b),
            ).toEqualTypeOf<string[]>();
        });

        it("accepts readonly arrays for both parameters", () => {
            expectTypeOf(
                Arr.intersectAssocUsing(
                    readonlyStrings,
                    readonlyStrings,
                    (a, b) => a === b,
                ),
            ).toEqualTypeOf<string[]>();
        });
    });

    describe("intersectByKeys", () => {
        it("preserves number element type", () => {
            expectTypeOf(Arr.intersectByKeys([1, 2, 3], [0, 1])).toEqualTypeOf<
                number[]
            >();
        });

        it("preserves string element type when other is a different element type (only its indices matter)", () => {
            expectTypeOf(Arr.intersectByKeys(["a", "b"], ["x"])).toEqualTypeOf<
                string[]
            >();
        });

        it("preserves object element type", () => {
            // Kept inline rather than the shared `idObjects` fixture, for
            // the same reason as `diff`'s object-element case above.
            expectTypeOf(Arr.intersectByKeys([{ id: 1 }], [0])).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("accepts readonly arrays for both parameters", () => {
            expectTypeOf(
                Arr.intersectByKeys(readonlyNumbers, readonlyNumbers),
            ).toEqualTypeOf<number[]>();
        });

        it("falls back to unknown[] for unknown data", () => {
            expectTypeOf(
                Arr.intersectByKeys(unknownArray, unknownArray),
            ).toEqualTypeOf<unknown[]>();
        });
    });
});
