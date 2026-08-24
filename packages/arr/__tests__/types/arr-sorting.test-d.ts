import * as Arr from "@tolki/arr";
import type { CaseValue } from "@tolki/enum";
import { SortDirection } from "@tolki/enum";
import type { SortSpec } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import {
    ageItems,
    readonlyNumbers,
    readonlyStrings,
    unknownArray,
} from "./fixtures";

/**
 * Extracts the second slot of `SortSpec`'s `[key, direction]` tuple form.
 * `T` must be passed as a bare type parameter (not wrapped) so the
 * conditional distributes over `SortSpec`'s union members individually —
 * the `string` and comparator-function members fall out as `never`,
 * leaving only the tuple member's second element.
 */
type SortSpecTupleDirection<T> = T extends readonly [string, infer D]
    ? D
    : never;

describe("arr sorting type tests", () => {
    describe("sort", () => {
        it("preserves number element type with no callback", () => {
            expectTypeOf(Arr.sort([3, 1, 2])).toEqualTypeOf<number[]>();
        });

        it("preserves string element type with no callback", () => {
            expectTypeOf(Arr.sort(["b", "a"])).toEqualTypeOf<string[]>();
        });

        it("preserves object element type when sorting by dot-notated key", () => {
            expectTypeOf(Arr.sort(ageItems, "age")).toEqualTypeOf<
                { age: number }[]
            >();
        });

        it("preserves object element type when sorting by callback", () => {
            expectTypeOf(Arr.sort(ageItems, (item) => item.age)).toEqualTypeOf<
                { age: number }[]
            >();
        });

        it("preserves object element type for a multi-key descriptor of plain keys", () => {
            expectTypeOf(
                Arr.sort([{ name: "a", age: 1 }], ["name", "age"]),
            ).toEqualTypeOf<{ name: string; age: number }[]>();
        });

        it("preserves object element type for a multi-key descriptor mixing a key and a [key, direction] tuple", () => {
            expectTypeOf(
                Arr.sort([{ name: "a", age: 1 }], ["name", ["age", true]]),
            ).toEqualTypeOf<{ name: string; age: number }[]>();
        });

        it("preserves number element type with a null callback (natural sort)", () => {
            expectTypeOf(Arr.sort([1, 2], null)).toEqualTypeOf<number[]>();
        });

        it("infers callback value and key params from an object array", () => {
            Arr.sort(ageItems, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<{ age: number }>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value.age;
            });
        });

        it("accepts a readonly array with no callback", () => {
            expectTypeOf(Arr.sort(readonlyNumbers)).toEqualTypeOf<number[]>();
        });

        it("falls back to unknown[] for unknown data", () => {
            expectTypeOf(Arr.sort(unknownArray)).toEqualTypeOf<unknown[]>();
        });
    });

    describe("sortDesc", () => {
        it("preserves number element type with no callback", () => {
            expectTypeOf(Arr.sortDesc([3, 1, 2])).toEqualTypeOf<number[]>();
        });

        it("preserves object element type when sorting by dot-notated key", () => {
            expectTypeOf(Arr.sortDesc(ageItems, "age")).toEqualTypeOf<
                { age: number }[]
            >();
        });

        it("preserves object element type when sorting by callback", () => {
            expectTypeOf(
                Arr.sortDesc(ageItems, (item) => item.age),
            ).toEqualTypeOf<{ age: number }[]>();
        });

        it("preserves object element type for a multi-key descriptor of plain keys", () => {
            expectTypeOf(
                Arr.sortDesc([{ name: "a", age: 1 }], ["name", "age"]),
            ).toEqualTypeOf<{ name: string; age: number }[]>();
        });

        it("preserves number element type with a null callback (natural sort)", () => {
            expectTypeOf(Arr.sortDesc([1, 2], null)).toEqualTypeOf<number[]>();
        });

        it("accepts a readonly array with no callback", () => {
            expectTypeOf(Arr.sortDesc(readonlyStrings)).toEqualTypeOf<
                string[]
            >();
        });
    });

    describe("sortRecursive", () => {
        it("preserves number element type for a flat array", () => {
            expectTypeOf(Arr.sortRecursive([3, 1, 2])).toEqualTypeOf<
                number[]
            >();
        });

        it("preserves nested array element type", () => {
            expectTypeOf(Arr.sortRecursive([[3], [1]])).toEqualTypeOf<
                number[][]
            >();
        });

        it("accepts a boolean descending flag", () => {
            expectTypeOf(Arr.sortRecursive([3, 1], true)).toEqualTypeOf<
                number[]
            >();
        });

        it("accepts a SortDirection enum case", () => {
            expectTypeOf(
                Arr.sortRecursive([3, 1], SortDirection.Descending),
            ).toEqualTypeOf<number[]>();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.sortRecursive([{ b: 2, a: 1 }])).toEqualTypeOf<
                { b: number; a: number }[]
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.sortRecursive(readonlyNumbers)).toEqualTypeOf<
                number[]
            >();
        });
    });

    describe("sortRecursiveDesc", () => {
        it("preserves number element type for a flat array", () => {
            expectTypeOf(Arr.sortRecursiveDesc([1, 3, 2])).toEqualTypeOf<
                number[]
            >();
        });

        it("preserves nested array element type", () => {
            expectTypeOf(Arr.sortRecursiveDesc([[1], [3]])).toEqualTypeOf<
                number[][]
            >();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.sortRecursiveDesc([{ a: 1 }])).toEqualTypeOf<
                { a: number }[]
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.sortRecursiveDesc(readonlyStrings)).toEqualTypeOf<
                string[]
            >();
        });
    });

    describe("SortSpec tuple direction literals", () => {
        it("keeps CaseValue<typeof SortDirection> assignable to SortSpec's [key, direction] tuple slot", () => {
            // `SortSpec`'s tuple form inlines the literals "Ascending" |
            // "Descending" instead of importing `SortDirection` from
            // `@tolki/enum`, because `@tolki/enum` depends on `@tolki/types`
            // and importing back would create a workspace cycle. Nothing
            // at compile time otherwise ties the two together, so a rename
            // of a case in `packages/enum/src/php-enums.ts` would
            // desynchronize them silently. This assertion is the link: if
            // `CaseValue<typeof SortDirection>` ever contains a case name
            // that isn't one of `SortSpec`'s inlined literals, it fails.
            expectTypeOf<CaseValue<typeof SortDirection>>().toExtend<
                SortSpecTupleDirection<SortSpec<unknown>>
            >();
        });
    });
});
