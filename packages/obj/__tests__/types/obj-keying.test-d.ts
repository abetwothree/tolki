import * as Obj from "@tolki/obj";
import type { UndotObjectValue } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    bareObject,
    integerKeyed,
    numberList,
    numberMap,
    type Row,
    rowsById,
    unknownObject,
    user,
} from "./fixtures";

/** Rows whose key field may be missing. */
declare const maybeIds: Record<"a" | "b", { id?: number }>;

describe("obj keying type tests", () => {
    describe("keyBy", () => {
        it("keys rows by a field's value as PHP stores that key, keeping the row type", () => {
            expectTypeOf(Obj.keyBy(rowsById, "id")).toEqualTypeOf<
                Record<number, Row>
            >();
            // A string value such as "10" is stored as the integer 10.
            expectTypeOf(Obj.keyBy(rowsById, "name")).toEqualTypeOf<
                Record<string | number, Row>
            >();
            // A row without the field is keyed by null, which PHP stores as "".
            expectTypeOf(Obj.keyBy(maybeIds, "id")).toEqualTypeOf<
                Record<number | "", { id?: number }>
            >();
        });

        it("keys rows by a callback's answer as PHP stores that key", () => {
            expectTypeOf(Obj.keyBy(rowsById, (row) => row.id)).toEqualTypeOf<
                Record<number, Row>
            >();
            expectTypeOf(
                Obj.keyBy(rowsById, (row) => (row.id > 1 ? null : 1.5)),
            ).toEqualTypeOf<Record<number | "", Row>>();
        });

        it("types the callback's row and key", () => {
            Obj.keyBy(rowsById, (row, key) => {
                expectTypeOf(row).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<"r1" | "r2">();

                return row.id;
            });
        });

        it("keys by a boolean the way PHP does, and under a symbol a callback returns", () => {
            const sym = Symbol("k");

            expectTypeOf(
                Obj.keyBy(rowsById, (row) => row.id > 1),
            ).toEqualTypeOf<Record<0 | 1, Row>>();
            expectTypeOf(Obj.keyBy(rowsById, () => sym)).toEqualTypeOf<{
                [sym]?: Row;
            }>();
            expectTypeOf(
                Obj.keyBy(rowsById, (row) => (row.id > 1 ? sym : row.name)),
            ).toEqualTypeOf<Record<string | number, Row> & { [sym]?: Row }>();
            expectTypeOf(Obj.keyBy(rowsById, () => sym)[sym]).toEqualTypeOf<
                Row | undefined
            >();
            expectTypeOf(
                Obj.keyBy({ a: { id: sym } }, "id")[sym],
            ).toEqualTypeOf<{ id: symbol } | undefined>();
        });

        it("takes a field or a callback held in one value", () => {
            const keyer = "name" as "name" | ((row: Row) => number);

            expectTypeOf(Obj.keyBy(rowsById, keyer)).toEqualTypeOf<
                Record<string | number, Row>
            >();
        });

        it("empties a list and falls back for unknown data", () => {
            expectTypeOf(Obj.keyBy(numberList, "id")).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.keyBy(unknownObject, "id")).toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("keys a Map's items, handing the callback each key PHP stores", () => {
            const rows = new Map([[2, { id: "r" }]]);

            expectTypeOf(Obj.keyBy(rows, "id")).toEqualTypeOf<
                Record<string | number, { id: string }>
            >();
            Obj.keyBy(rows, (row, key) => {
                expectTypeOf(row).toEqualTypeOf<{ id: string }>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return row.id;
            });
            // A Map<string, …> key "2" reaches the callback as 2, as PHP casts it.
            Obj.keyBy(numberMap, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return key;
            });
            Obj.keyBy(
                new Map<"10" | "x", { id: number }>([["10", { id: 1 }]]),
                (_row, key) => {
                    expectTypeOf(key).toEqualTypeOf<10 | "x">();

                    return key;
                },
            );
        });

        it("keeps a symbol a callback returns for a Map as a key", () => {
            const sym = Symbol("k");

            expectTypeOf(
                Obj.keyBy(new Map([["a", { id: 1 }]]), () => sym),
            ).toEqualTypeOf<{ [sym]?: { id: number } }>();
        });
    });

    describe("prependKeysWith", () => {
        it("prefixes every key, including integer-like ones", () => {
            expectTypeOf(Obj.prependKeysWith(abc, "item_")).toEqualTypeOf<{
                item_a: number;
                item_b: number;
                item_c: number;
            }>();
            expectTypeOf(Obj.prependKeysWith(integerKeyed, "k")).toEqualTypeOf<{
                k0: string;
                k1: string;
                kname: string;
            }>();
        });

        it("keeps the key suffix for a widened prefix", () => {
            const prefix: string = "p";

            expectTypeOf(Obj.prependKeysWith({ a: 1 }, prefix)).toEqualTypeOf<{
                [x: `${string}a`]: number;
            }>();
        });

        it("keeps a Map's values under the string keys it builds", () => {
            expectTypeOf(
                Obj.prependKeysWith(new Map([[2, "c"]]), "k"),
            ).toEqualTypeOf<Record<string, string>>();
        });
    });

    describe("flip", () => {
        it("swaps literal keys and values", () => {
            expectTypeOf(Obj.flip({ name: "taylor" } as const)).toEqualTypeOf<{
                taylor: "name";
            }>();
        });

        it("collects keys that share a value type", () => {
            expectTypeOf(Obj.flip({ a: "x", b: "y" })).toEqualTypeOf<{
                [x: string]: "a" | "b";
            }>();
        });

        it("hands integer-like keys back as numbers", () => {
            expectTypeOf(Obj.flip({ 0: "zero" } as const)).toEqualTypeOf<{
                zero: 0;
            }>();
        });

        it("hands a Map's keys back as the keys PHP stores", () => {
            expectTypeOf(Obj.flip(new Map([[2, "c"]]))).toEqualTypeOf<
                Record<string, number>
            >();
            expectTypeOf(Obj.flip(new Map([["a", "x"]]))).toEqualTypeOf<
                Record<string, string | number>
            >();
        });
    });

    describe("dot", () => {
        it("keys every reachable value by its dot path", () => {
            expectTypeOf(Obj.dot(user)).toEqualTypeOf<
                Record<string, string | number | { city: string; zip: number }>
            >();
        });

        it("reads a nested keyless object type as reaching anything", () => {
            expectTypeOf(Obj.dot({ a: { b: 1 } as object })).toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("keeps an undefined leaf a declared type allows", () => {
            expectTypeOf(
                Obj.dot({ a: { b: 1 as number | undefined } }),
            ).toEqualTypeOf<
                Record<string, { b: number | undefined } | number | undefined>
            >();
        });

        it("keys a Map's reachable values by their dot paths", () => {
            expectTypeOf(
                Obj.dot(new Map([[2, { city: "NYC" }]])),
            ).toEqualTypeOf<Record<string, string | { city: string }>>();
            expectTypeOf(Obj.dot(new Map([["a", 1]]), "p", 1)).toEqualTypeOf<
                Record<string, number>
            >();
        });

        it("empties a list and falls back for unknown data", () => {
            expectTypeOf(Obj.dot(numberList)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.dot(unknownObject)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });

    describe("undot", () => {
        it("nests the values it was given", () => {
            expectTypeOf(Obj.undot({ "a.b": 1, c: 2 })).toEqualTypeOf<
                Record<string, UndotObjectValue<number>>
            >();
        });

        it("types a list's entries under their indexes", () => {
            expectTypeOf(Obj.undot(numberList)).toEqualTypeOf<
                Record<number, unknown>
            >();
        });

        it("nests a Map's values as it nests a record's", () => {
            expectTypeOf(Obj.undot(new Map([["a.b", 1]]))).toEqualTypeOf<
                Record<string, UndotObjectValue<number>>
            >();
        });
    });

    describe("the bare object row", () => {
        // `keyof object` is empty, so ObjectValue/ObjectKey collapse to `never` and every
        // row built on them answered a type nothing can inhabit. The runtime still walks whatever
        // entries the value carries, so the answer is the widest sound one.
        it("keeps keyBy usable for data typed as the bare object", () => {
            expectTypeOf(Obj.keyBy(bareObject, "id")).toEqualTypeOf<
                Record<string | number, unknown>
            >();
        });

        it("keeps keys, values and first usable for the bare object", () => {
            expectTypeOf(Obj.keys(bareObject)).toEqualTypeOf<
                (string | number)[]
            >();
            expectTypeOf(Obj.values(bareObject)).toEqualTypeOf<unknown[]>();
            expectTypeOf(Obj.first(bareObject)).toEqualTypeOf<unknown>();
        });

        it("keeps pluck usable for the bare object", () => {
            expectTypeOf(Obj.pluck(bareObject, "id")).toEqualTypeOf<
                unknown[]
            >();
        });

        // Found by a generated sweep of all 89 exports; the five rows above were fixed by
        // inspection and missed these two, which are the only other ones that collapsed.
        it("keeps random and sole usable for the bare object", () => {
            expectTypeOf(Obj.random(bareObject)).toEqualTypeOf<unknown>();
            expectTypeOf(Obj.random(bareObject, 2)).toEqualTypeOf<
                Record<number, unknown>
            >();
            expectTypeOf(Obj.sole(bareObject)).toEqualTypeOf<unknown>();
        });
    });

    describe("flattenDot", () => {
        it("keys every reachable value by its dot path", () => {
            expectTypeOf(Obj.flattenDot(user, 1)).toEqualTypeOf<
                Record<string, string | number | { city: string; zip: number }>
            >();
        });

        it("falls back for unknown data", () => {
            expectTypeOf(Obj.flattenDot(unknownObject)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });
});
