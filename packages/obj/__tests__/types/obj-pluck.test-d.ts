import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    accounts,
    mapOrList,
    numberList,
    type Row,
    rowsById,
    unknownObject,
} from "./fixtures";

declare const nullableKey: string | null;

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

            it("returns a list for an explicit null or undefined key", () => {
                expectTypeOf(Obj.pluck(rowsById, "name", null)).toEqualTypeOf<
                    string[]
                >();
                expectTypeOf(
                    Obj.pluck(rowsById, "name", undefined),
                ).toEqualTypeOf<string[]>();
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

            it("still types the row when the key is an explicit null", () => {
                const result = Obj.pluck(
                    rowsById,
                    (row) => {
                        expectTypeOf(row).toEqualTypeOf<Row>();

                        return row.id;
                    },
                    null,
                );

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

            it("keeps whole rows and array paths on their list rows for an explicit null or undefined key", () => {
                expectTypeOf(Obj.pluck(rowsById, null, null)).toEqualTypeOf<
                    Row[]
                >();
                expectTypeOf(
                    Obj.pluck(rowsById, undefined, undefined),
                ).toEqualTypeOf<Row[]>();
                expectTypeOf(Obj.pluck(rowsById, ["name"], null)).toEqualTypeOf<
                    unknown[]
                >();
            });
        });

        describe("forwarded nullable key", () => {
            it("keeps the typed rows instead of dropping to the unknown fallback", () => {
                // `nullableKey` is declared, not initialized: a const with a literal
                // initializer narrows back to `string` and would not exercise the row.
                expectTypeOf(
                    Obj.pluck(rowsById, "name", nullableKey),
                ).toEqualTypeOf<string[] | Record<string | number, string>>();
                expectTypeOf(
                    Obj.pluck(rowsById, (row) => row.id, nullableKey),
                ).toEqualTypeOf<number[] | Record<string | number, number>>();
                expectTypeOf(
                    Obj.pluck(rowsById, null, nullableKey),
                ).toEqualTypeOf<Row[] | Record<string | number, Row>>();
            });
        });

        describe("Map data", () => {
            const rowMap = new Map<number, Row>([[2, { id: 2, name: "c" }]]);

            it("resolves a literal path against the Map's items", () => {
                expectTypeOf(Obj.pluck(rowMap, "name")).toEqualTypeOf<
                    string[]
                >();
                expectTypeOf(Obj.pluck(rowMap, "name", "id")).toEqualTypeOf<
                    Record<string | number, string>
                >();
                expectTypeOf(Obj.pluck(rowMap, "name", null)).toEqualTypeOf<
                    string[]
                >();
            });

            it("hands both callbacks the Map's item", () => {
                const result = Obj.pluck(
                    rowMap,
                    (row) => {
                        expectTypeOf(row).toEqualTypeOf<Row>();

                        return row.id;
                    },
                    (row) => {
                        expectTypeOf(row).toEqualTypeOf<Row>();

                        return row.name;
                    },
                );

                expectTypeOf(result).toEqualTypeOf<
                    Record<string | number, number>
                >();
                expectTypeOf(Obj.pluck(rowMap, (row) => row.id)).toEqualTypeOf<
                    number[]
                >();
            });

            it("keeps whole items for a null value path and widens an array path", () => {
                expectTypeOf(Obj.pluck(rowMap, null)).toEqualTypeOf<Row[]>();
                expectTypeOf(
                    Obj.pluck(rowMap, undefined, "name"),
                ).toEqualTypeOf<Record<string | number, Row>>();
                expectTypeOf(Obj.pluck(rowMap, ["name"])).toEqualTypeOf<
                    unknown[]
                >();
                expectTypeOf(Obj.pluck(rowMap, ["name"], "id")).toEqualTypeOf<
                    Record<string | number, unknown>
                >();
            });

            it("resolves a path against a union of Maps' items, and answers the widest row for a Map in any other union", () => {
                const rowUnion = rowMap as
                    | Map<number, Row>
                    | Map<string, { id: string; name: number }>;
                const maybeRows = rowMap as Map<number, Row> | undefined;

                expectTypeOf(Obj.pluck(rowUnion, "name")).toEqualTypeOf<
                    (string | number)[]
                >();
                expectTypeOf(Obj.pluck(rowUnion, "name", "id")).toEqualTypeOf<
                    Record<string | number, string | number>
                >();
                // Not the non-object row's `never[]`: the Map member's items are plucked.
                expectTypeOf(Obj.pluck(maybeRows, "name")).toEqualTypeOf<
                    unknown[] | Record<string | number, unknown>
                >();
                expectTypeOf(Obj.pluck(mapOrList, "name")).toEqualTypeOf<
                    unknown[] | Record<string | number, unknown>
                >();
            });

            it("answers both shapes for a forwarded nullable key", () => {
                expectTypeOf(
                    Obj.pluck(rowMap, "name", nullableKey),
                ).toEqualTypeOf<Record<string | number, string> | string[]>();
                expectTypeOf(
                    Obj.pluck(rowMap, (row) => row.id, nullableKey),
                ).toEqualTypeOf<Record<string | number, number> | number[]>();
                expectTypeOf(
                    Obj.pluck(rowMap, null, nullableKey),
                ).toEqualTypeOf<Record<string | number, Row> | Row[]>();
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

            it("accepts an undefined value path for a list and for unknown data", () => {
                expectTypeOf(Obj.pluck(numberList, undefined)).toEqualTypeOf<
                    never[]
                >();
                expectTypeOf(
                    Obj.pluck(numberList, undefined, "id"),
                ).toEqualTypeOf<Record<string | number, never>>();
                expectTypeOf(Obj.pluck(unknownObject, undefined)).toEqualTypeOf<
                    unknown[] | Record<string | number, unknown>
                >();
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
