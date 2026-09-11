import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    accounts,
    numberList,
    type Row,
    rowsById,
    unknownObject,
} from "./fixtures";

describe("obj pluck type tests", () => {
    describe("pluck", () => {
        describe("literal string paths", () => {
            it("resolves the field type", () => {
                expectTypeOf(Obj.pluck(rowsById, "name")).toEqualTypeOf<
                    string[]
                >();
                expectTypeOf(Obj.pluck(rowsById, "id")).toEqualTypeOf<
                    number[]
                >();
            });

            it("keys the result by a second path", () => {
                expectTypeOf(Obj.pluck(rowsById, "name", "id")).toEqualTypeOf<
                    Record<string | number, string>
                >();
            });

            it("maps an absent optional leaf to null", () => {
                expectTypeOf(
                    Obj.pluck(accounts, "users.*.email"),
                ).toEqualTypeOf<(string | null)[][]>();
            });
        });

        describe("wildcard paths", () => {
            it("collects one list per row", () => {
                expectTypeOf(
                    Obj.pluck(accounts, "users.*.first"),
                ).toEqualTypeOf<string[][]>();
            });
        });

        describe("closure values", () => {
            it("types the row and returns the closure's result", () => {
                const result = Obj.pluck(rowsById, (row) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();

                    return row.id;
                });

                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("null and array paths", () => {
            it("keeps whole rows for a null value path", () => {
                expectTypeOf(Obj.pluck(rowsById, null, "name")).toEqualTypeOf<
                    Record<string | number, Row>
                >();
                expectTypeOf(Obj.pluck(rowsById, null)).toEqualTypeOf<Row[]>();
            });

            it("accepts numeric segments in an array path", () => {
                expectTypeOf(
                    Obj.pluck({ a: { user: ["taylor"] } }, ["user", 0]),
                ).toEqualTypeOf<unknown[]>();
            });
        });

        describe("input variations", () => {
            it("returns an empty list for a list and falls back for unknown data", () => {
                expectTypeOf(Obj.pluck(numberList, "id")).toEqualTypeOf<
                    never[]
                >();
                expectTypeOf(Obj.pluck(unknownObject, "name")).toEqualTypeOf<
                    unknown[] | Record<string | number, unknown>
                >();
            });

            it("returns an empty record for a list keyed by a second path", () => {
                expectTypeOf(Obj.pluck(numberList, "name", "id")).toEqualTypeOf<
                    Record<string | number, never>
                >();
            });

            it("still returns an empty list for a list given an explicit null key", () => {
                // Pin: an explicit null/undefined third arg must stay on the
                // never[] row, not fall through to the unknown-key overload.
                expectTypeOf(Obj.pluck(numberList, "id", null)).toEqualTypeOf<
                    never[]
                >();
                expectTypeOf(
                    Obj.pluck(numberList, "id", undefined),
                ).toEqualTypeOf<never[]>();
            });
        });
    });

    describe("select", () => {
        it("picks one key from every row", () => {
            expectTypeOf(Obj.select(rowsById, "name")).toEqualTypeOf<{
                r1: { name: string };
                r2: { name: string };
            }>();
        });

        it("picks several keys from every row", () => {
            expectTypeOf(Obj.select(rowsById, ["id", "name"])).toEqualTypeOf<{
                r1: Row;
                r2: Row;
            }>();
        });

        it("makes every row partial for a widened key list", () => {
            const keys: string[] = ["name"];

            expectTypeOf(Obj.select(rowsById, keys)).toEqualTypeOf<{
                r1: Partial<Row>;
                r2: Partial<Row>;
            }>();
        });

        it("falls back for unknown data", () => {
            expectTypeOf(Obj.select(unknownObject, "name")).toEqualTypeOf<
                Record<string, Record<string, unknown>>
            >();
        });

        it("empties a list for a readonly keys constant, and still picks typed rows' keys", () => {
            const keys = ["id", "name"] as const;

            expectTypeOf(Obj.select(numberList, keys)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.select(rowsById, keys)).toEqualTypeOf<{
                r1: Row;
                r2: Row;
            }>();
        });

        it("accepts a readonly key list it cannot verify", () => {
            const keys: readonly string[] = ["name"];

            expectTypeOf(Obj.select(rowsById, keys)).toEqualTypeOf<{
                r1: Partial<Row>;
                r2: Partial<Row>;
            }>();
            expectTypeOf(Obj.select(unknownObject, keys)).toEqualTypeOf<
                Record<string, Record<string, unknown>>
            >();
        });
    });
});
