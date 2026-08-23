import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import { readonlyStrings, stringTuple } from "./fixtures";

describe("arr type foundation", () => {
    describe("generic inference survives the implementation signature", () => {
        it("prependKeysWith preserves the element type", () => {
            const result = Arr.prependKeysWith(["a", "b"], "item_");
            expectTypeOf(result).toEqualTypeOf<Record<string, string>>();
        });

        it("prependKeysWith preserves object element types", () => {
            const result = Arr.prependKeysWith([{ id: 1 }], "row_");
            expectTypeOf(result).toEqualTypeOf<
                Record<string, { id: number }>
            >();
        });

        it("intersectAssoc preserves the element type", () => {
            const result = Arr.intersectAssoc([1, 2, 3], [2, 3]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("intersectAssoc preserves string element types", () => {
            const result = Arr.intersectAssoc(["a", "b"], ["a", "c"]);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("keys always returns number[]", () => {
            expectTypeOf(Arr.keys([1, 2, 3])).toEqualTypeOf<number[]>();
            expectTypeOf(Arr.keys(["a"])).toEqualTypeOf<number[]>();
        });

        it("join always returns string", () => {
            expectTypeOf(Arr.join([1, 2, 3], ", ")).toEqualTypeOf<string>();
            expectTypeOf(
                Arr.join(["a"], ", ", " and "),
            ).toEqualTypeOf<string>();
        });
    });

    describe("readonly arrays are accepted without casts", () => {
        it("accepts a readonly array", () => {
            expectTypeOf(
                Arr.intersectAssoc(readonlyStrings, ["a"]),
            ).toEqualTypeOf<string[]>();
        });

        it("accepts an as const array", () => {
            expectTypeOf(Arr.prependKeysWith(stringTuple, "k_")).toEqualTypeOf<
                Record<string, "a" | "b">
            >();
        });
    });
});
