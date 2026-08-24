import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import {
    idObjects,
    readonlyNumbers,
    readonlyStrings,
    unknownArray,
} from "./fixtures";

describe("arr slicing type tests", () => {
    describe("slice", () => {
        it("preserves number element type with offset and length", () => {
            expectTypeOf(Arr.slice([1, 2, 3, 4], 1, 2)).toEqualTypeOf<
                number[]
            >();
        });

        it("accepts a negative length", () => {
            expectTypeOf(Arr.slice([1, 2, 3, 4], 1, -1)).toEqualTypeOf<
                number[]
            >();
        });

        it("accepts an offset without a length", () => {
            expectTypeOf(Arr.slice([1, 2, 3, 4], 2)).toEqualTypeOf<number[]>();
        });

        it("accepts a null length", () => {
            expectTypeOf(Arr.slice(["a", "b"], 0, null)).toEqualTypeOf<
                string[]
            >();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.slice(idObjects, 0)).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.slice(readonlyNumbers, 0)).toEqualTypeOf<
                number[]
            >();
        });

        it("falls back to unknown[] for unknown data", () => {
            expectTypeOf(Arr.slice(unknownArray, 0)).toEqualTypeOf<unknown[]>();
        });
    });

    describe("splice", () => {
        it("preserves string element type in value and removed", () => {
            expectTypeOf(Arr.splice(["foo", "baz"], 1, 1)).toEqualTypeOf<{
                value: string[];
                removed: string[];
            }>();
        });

        it("preserves string element type with a replacement", () => {
            expectTypeOf(
                Arr.splice(["foo", "baz"], 1, 1, "bar"),
            ).toEqualTypeOf<{
                value: string[];
                removed: string[];
            }>();
        });

        it("preserves number element type without a length", () => {
            expectTypeOf(Arr.splice([1, 2, 3], 1)).toEqualTypeOf<{
                value: number[];
                removed: number[];
            }>();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.splice(idObjects, 0, 1)).toEqualTypeOf<{
                value: { id: number }[];
                removed: { id: number }[];
            }>();
        });

        it("destructures into typed value and removed", () => {
            const { value, removed } = Arr.splice([1, 2], 0, 1);
            expectTypeOf(value).toEqualTypeOf<number[]>();
            expectTypeOf(removed).toEqualTypeOf<number[]>();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.splice(readonlyStrings, 0, 1)).toEqualTypeOf<{
                value: string[];
                removed: string[];
            }>();
        });
    });

    describe("pad", () => {
        it("returns the array unchanged when already at the target size", () => {
            expectTypeOf(Arr.pad([1, 2, 3], 5, 0)).toEqualTypeOf<number[]>();
        });

        it("pads on the left for a negative size", () => {
            expectTypeOf(Arr.pad([1, 2, 3], -5, 0)).toEqualTypeOf<number[]>();
        });

        it("unions in a different pad value type", () => {
            expectTypeOf(Arr.pad([1, 2], 4, "x")).toEqualTypeOf<
                (number | string)[]
            >();
        });

        it("unions in a null pad value", () => {
            expectTypeOf(Arr.pad(["a"], 3, null)).toEqualTypeOf<
                (string | null)[]
            >();
        });

        it("preserves object element type", () => {
            // `TValue` and `TPadValue` both resolve to the structurally
            // identical `{ id: number }` here, but they're distinct type
            // parameters — expect-type@1.4.0's `toEqualTypeOf` throws a
            // misleading "Expected 1 arguments, but got 0" (TS2554) on a
            // generically-inferred object-array union like this instead
            // of a real mismatch (same root cause as the documented
            // partition/tuple limitation elsewhere in this package's type
            // tests). `toExtend` sidesteps the bug; it's still exact here
            // since `(TValue | TPadValue)[]` is structurally `{ id: number }[]`
            // either way.
            expectTypeOf(Arr.pad(idObjects, 2, { id: 0 })).toExtend<
                { id: number }[]
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.pad(readonlyNumbers, 3, 0)).toEqualTypeOf<
                number[]
            >();
        });
    });

    describe("replace", () => {
        describe("array replacer — no gaps, preserves type", () => {
            it("returns TValue[] for same-type array replacer", () => {
                const result = Arr.replace([1, 2, 3], [10, 20]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] for same-type string array replacer", () => {
                const result = Arr.replace(["a", "b", "c"], ["d", "e"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns (TValue | TReplace)[] for different-type array replacer", () => {
                const result = Arr.replace([1, 2, 3], ["a", "b"]);
                expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
            });
        });

        describe("object replacer — sparse indices can introduce undefined", () => {
            it("returns (TValue | undefined)[] for same-type object replacer", () => {
                const result = Arr.replace(["a", "b", "c"], {
                    1: "d",
                    2: "e",
                    3: "f",
                    4: "g",
                });
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });

            it("returns (TValue | TReplace | undefined)[] for different-type object replacer", () => {
                const result = Arr.replace(["a", "b"], { 5: 42 });
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | undefined)[]
                >();
            });

            it("returns (TValue | undefined)[] for sparse gap-filling case", () => {
                const result = Arr.replace(["x", "y", "z"], { 5: "end" });
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });
        });

        describe("null/undefined replacer — returns original type unchanged", () => {
            it("returns TValue[] for null replacer", () => {
                const result = Arr.replace(["a", "b"], null);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns TValue[] for undefined replacer", () => {
                const result = Arr.replace(["a", "b"], undefined);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("additional coverage", () => {
            it("preserves number element type for a same-type array replacer", () => {
                expectTypeOf(Arr.replace([1, 2, 3], [4, 5])).toEqualTypeOf<
                    number[]
                >();
            });

            it("unions in a different-type array replacer", () => {
                expectTypeOf(Arr.replace(["a", "b"], [1, 2])).toEqualTypeOf<
                    (string | number)[]
                >();
            });

            it("unions in undefined for a sparse object replacer", () => {
                expectTypeOf(
                    Arr.replace(["a", "b", "c"], { 1: "d" }),
                ).toEqualTypeOf<(string | undefined)[]>();
            });

            it("returns TValue[] unchanged for a null replacer", () => {
                expectTypeOf(Arr.replace([1, 2], null)).toEqualTypeOf<
                    number[]
                >();
            });

            it("returns TValue[] unchanged for an undefined replacer", () => {
                expectTypeOf(Arr.replace([1, 2], undefined)).toEqualTypeOf<
                    number[]
                >();
            });

            it("accepts a readonly array", () => {
                expectTypeOf(Arr.replace(readonlyNumbers, [1])).toEqualTypeOf<
                    number[]
                >();
            });
        });
    });

    describe("replaceRecursive", () => {
        describe("null/undefined replacer — returns original type unchanged", () => {
            it("returns TValue[] for null replacer", () => {
                const result = Arr.replaceRecursive(["a", "b"], null);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns TValue[] for undefined replacer", () => {
                const result = Arr.replaceRecursive(["a", "b"], undefined);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("array replacer — may fill gaps with undefined", () => {
            it("returns (TValue | undefined)[] for same-type array replacer", () => {
                const result = Arr.replaceRecursive([1, 2, 3], [10]);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[]>();
            });

            it("returns (string | undefined)[] for same-type string array replacer", () => {
                const result = Arr.replaceRecursive(
                    ["a", "b", "c"],
                    ["z", "y"],
                );
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });

            it("returns (TValue | TReplace | undefined)[] for different-type array replacer", () => {
                const result = Arr.replaceRecursive([1, 2, 3], ["a", "b"]);
                expectTypeOf(result).toEqualTypeOf<
                    (number | string | undefined)[]
                >();
            });
        });

        describe("object replacer — sparse indices can introduce undefined", () => {
            it("returns (TValue | undefined)[] for same-type object replacer", () => {
                const result = Arr.replaceRecursive(["a", "b"], {
                    0: "x",
                    2: "z",
                });
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });

            it("returns (TValue | TReplace | undefined)[] for different-type object replacer", () => {
                const result = Arr.replaceRecursive(["a"], { 3: 42 });
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | undefined)[]
                >();
            });

            it("returns (TValue | undefined)[] for sparse gap-filling case", () => {
                const result = Arr.replaceRecursive(["a"], { 5: "f" });
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });
        });

        describe("additional coverage", () => {
            it("unions in undefined for a same-type array replacer", () => {
                expectTypeOf(
                    Arr.replaceRecursive([1, 2, 3], [4, 5]),
                ).toEqualTypeOf<(number | undefined)[]>();
            });

            it("unions in undefined for a nested array replacer", () => {
                // Kept inline: needs a nested `number[][]` shape on both
                // sides to exercise the recursive array-in-array merge —
                // no shared fixture is two-dimensional and mutable.
                expectTypeOf(
                    Arr.replaceRecursive([[1], [2]], [[3]]),
                ).toEqualTypeOf<(number[] | undefined)[]>();
            });

            it("unions in undefined for a sparse object replacer", () => {
                expectTypeOf(
                    Arr.replaceRecursive(["a"], { 2: "c" }),
                ).toEqualTypeOf<(string | undefined)[]>();
            });

            it("returns TValue[] unchanged for a null replacer", () => {
                expectTypeOf(Arr.replaceRecursive([1, 2], null)).toEqualTypeOf<
                    number[]
                >();
            });

            it("accepts a readonly array", () => {
                expectTypeOf(
                    Arr.replaceRecursive(readonlyNumbers, [1]),
                ).toEqualTypeOf<(number | undefined)[]>();
            });
        });
    });
});
