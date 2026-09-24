import { SortDirection } from "@tolki/enum";
import * as Obj from "@tolki/obj";
import type { CaseValue, SortSpec } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import {
    integerKeyed,
    mapOrList,
    mapUnion,
    maybeMap,
    numberList,
    numberMap,
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

        it("sort a Map's values under string keys instead of answering the NonObjectItems row", () => {
            // A Map's keys are only known at runtime, and integer ones are renumbered, so the
            // sorted result is a string-keyed record of the Map's values.
            expectTypeOf(Obj.sort(numberMap)).toEqualTypeOf<
                Record<string, number>
            >();
            expectTypeOf(Obj.sortDesc(numberMap)).toEqualTypeOf<
                Record<string, number>
            >();
            expectTypeOf(Obj.sort(new Map([[2, { n: 1 }]]), "n")).toEqualTypeOf<
                Record<string, { n: number }>
            >();
            expectTypeOf(Obj.sort(numberMap)).not.toEqualTypeOf<
                Record<string, never>
            >();
        });

        it("sort a union of Maps, and answer the widest row for a Map in any other union", () => {
            expectTypeOf(Obj.sort(mapUnion)).toEqualTypeOf<
                Record<string, string | number>
            >();
            Obj.sortDesc(mapUnion, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<string | number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value;
            });
            expectTypeOf(Obj.sort(maybeMap)).toEqualTypeOf<
                Record<string, unknown>
            >();
            expectTypeOf(Obj.sortDesc(mapOrList)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("hand a Map's callback its value and its key as PHP casts it", () => {
            const rows = new Map([[2, { n: 1, id: "p" }]]);

            expectTypeOf(
                Obj.sort(rows, (value, key) => {
                    expectTypeOf(value).toEqualTypeOf<{
                        n: number;
                        id: string;
                    }>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value.n;
                }),
            ).toEqualTypeOf<Record<string, { n: number; id: string }>>();
            // A Map<string, …> key "2" reaches the callback as 2, as PHP casts it.
            Obj.sortDesc(numberMap, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value;
            });
        });

        it("type a Map's multi-key descriptors by its values", () => {
            const rows = new Map([[2, { n: 1, id: "p" }]]);

            expectTypeOf(
                Obj.sortDesc(rows, [
                    "n",
                    ["id", "asc"],
                    (a, b) => {
                        expectTypeOf(a).toEqualTypeOf<{
                            n: number;
                            id: string;
                        }>();

                        return a.n - b.n;
                    },
                ]),
            ).toEqualTypeOf<Record<string, { n: number; id: string }>>();
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

        it("sort a Map into a string-keyed record of its values", () => {
            // A Map's keys are only known at runtime; each value keeps its type, as a nested
            // list or record is sorted in place of itself and a nested Map is kept as it is.
            expectTypeOf(Obj.sortRecursive(numberMap)).toEqualTypeOf<
                Record<string, number>
            >();
            expectTypeOf(
                Obj.sortRecursive(numberMap, SortDirection.Descending),
            ).toEqualTypeOf<Record<string, number>>();
            expectTypeOf(Obj.sortRecursive(numberMap, true)).toEqualTypeOf<
                Record<string, number>
            >();
            expectTypeOf(Obj.sortRecursiveDesc(numberMap)).toEqualTypeOf<
                Record<string, number>
            >();
            expectTypeOf(
                Obj.sortRecursiveDesc(new Map([[1, { b: 2, a: 1 }]])),
            ).toEqualTypeOf<Record<string, { b: number; a: number }>>();
            expectTypeOf(Obj.sortRecursiveDesc(numberMap)).not.toEqualTypeOf<
                Record<string, never>
            >();
        });
    });

    describe("SortSpec", () => {
        it("keeps CaseValue<typeof SortDirection> assignable to the direction slot", () => {
            // The tuple's direction slot also accepts boolean and 'asc'/'desc', so the enum is
            // a subset, not an exact match.
            expectTypeOf<CaseValue<typeof SortDirection>>().toExtend<
                SortSpecTupleDirection<SortSpec<unknown>>
            >();
        });
    });
});
