import { SortDirection } from "@tolki/enum";
import * as Obj from "@tolki/obj";
import type { CaseValue, SortSpec } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import {
    integerKeyed,
    numberList,
    type Profile,
    profile,
    type Row,
    rowsById,
    unknownObject,
    user,
} from "./fixtures";

/**
 * Extracts the second slot of `SortSpec`'s `[key, direction]` tuple form.
 * `T` must be a bare type parameter so the conditional distributes over SortSpec's members.
 */
type SortSpecTupleDirection<T> = T extends readonly [string, infer D]
    ? D
    : never;

describe("obj sorting type tests", () => {
    describe("sort and sortDesc", () => {
        it("keep a string-keyed object's own type", () => {
            expectTypeOf(Obj.sort(user)).toEqualTypeOf<{
                name: string;
                age: number;
                address: { city: string; zip: number };
            }>();
            expectTypeOf(Obj.sortDesc(profile)).toEqualTypeOf<Profile>();
        });

        it("widen integer-keyed data, whose keys they renumber", () => {
            expectTypeOf(Obj.sort(integerKeyed)).toEqualTypeOf<
                Record<string | number, string>
            >();
        });

        it("type a key-extractor callback", () => {
            Obj.sort(rowsById, (row, key) => {
                expectTypeOf(row).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<"r1" | "r2">();

                return row.name;
            });
        });

        it("accept multi-key descriptors typed by the row", () => {
            expectTypeOf(
                Obj.sort(rowsById, [
                    "name",
                    ["id", "desc"],
                    (a, b) => a.id - b.id,
                ]),
            ).toEqualTypeOf<Record<"r1" | "r2", Row>>();
        });

        it("empty a list and fall back for unknown data", () => {
            expectTypeOf(Obj.sort(numberList)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.sortDesc(unknownObject)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });

    describe("sortRecursive and sortRecursiveDesc", () => {
        it("keep the object's own type", () => {
            expectTypeOf(Obj.sortRecursive(user)).toEqualTypeOf<{
                name: string;
                age: number;
                address: { city: string; zip: number };
            }>();
            expectTypeOf(
                Obj.sortRecursive(user, SortDirection.Descending),
            ).toEqualTypeOf<{
                name: string;
                age: number;
                address: { city: string; zip: number };
            }>();
            expectTypeOf(
                Obj.sortRecursiveDesc(profile),
            ).toEqualTypeOf<Profile>();
        });
    });

    describe("SortSpec", () => {
        it("keeps CaseValue<typeof SortDirection> assignable to the direction slot", () => {
            // The tuple's direction slot also accepts boolean and 'asc'/'desc', so the enum is a subset, not an exact match.
            expectTypeOf<CaseValue<typeof SortDirection>>().toExtend<
                SortSpecTupleDirection<SortSpec<unknown>>
            >();
        });
    });
});
