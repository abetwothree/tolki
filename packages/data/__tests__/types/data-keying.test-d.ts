import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import type { UndotValue } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    box,
    nestedList,
    nestedRecord,
    numberList,
    numberMap,
    numberMapAsRecord,
    opaque,
    readonlyNumberList,
    rowList,
    rowsById,
    settings,
    unionItems,
    unionRows,
} from "./fixtures";

/** Not a fixture: the dotted keys are what undot reads, and only these two blocks need them. */
const dottedRecord = { "a.b": 1, "a.c": 2 };

/** The same shape with index-path keys, which is all `Arr.undot` accepts. */
const indexedRecord = { "0.0": 1, "0.1": 2 };

describe("data keying type tests", () => {
    describe("dataKeyBy", () => {
        it("matches arr.keyBy for a list", () => {
            expectTypeOf(Data.dataKeyBy(rowList, "id")).toEqualTypeOf(
                Arr.keyBy(rowList, "id"),
            );
        });

        it("matches obj.keyBy for a record", () => {
            expectTypeOf(Data.dataKeyBy(rowsById, "id")).toEqualTypeOf(
                Obj.keyBy(rowsById, "id"),
            );
        });

        it("matches obj.keyBy for a record given a callback", () => {
            expectTypeOf(
                Data.dataKeyBy(rowsById, (row) => row.id),
            ).toEqualTypeOf(Obj.keyBy(rowsById, (row) => row.id));
        });
    });

    describe("dataPrependKeysWith", () => {
        it("matches arr.prependKeysWith for a list", () => {
            expectTypeOf(
                Data.dataPrependKeysWith(numberList, "u_"),
            ).toEqualTypeOf(Arr.prependKeysWith(numberList, "u_"));
        });

        it("matches arr.prependKeysWith for a read-only list", () => {
            // `DataItems`' `TValue[]` rejects a read-only list, so its `Record<TKey, TValue>`
            // arm matched instead and inferred the array's own method types as the values.
            expectTypeOf(
                Data.dataPrependKeysWith(readonlyNumberList, "u_"),
            ).toEqualTypeOf(Arr.prependKeysWith(readonlyNumberList, "u_"));
        });

        it("matches obj.prependKeysWith for a record", () => {
            expectTypeOf(Data.dataPrependKeysWith(abc, "u_")).toEqualTypeOf(
                Obj.prependKeysWith(abc, "u_"),
            );
        });
    });

    describe("dataFlip", () => {
        it("matches arr.flip for a list", () => {
            expectTypeOf(Data.dataFlip(numberList)).toEqualTypeOf(
                Arr.flip(numberList),
            );
        });

        it("matches obj.flip for a record", () => {
            expectTypeOf(Data.dataFlip(abc)).toEqualTypeOf(Obj.flip(abc));
        });
    });

    describe("dataDot", () => {
        it("matches arr.dot for a list", () => {
            expectTypeOf(Data.dataDot(nestedList)).toEqualTypeOf(
                Arr.dot(nestedList),
            );
        });

        it("matches obj.dot for a record", () => {
            expectTypeOf(Data.dataDot(nestedRecord)).toEqualTypeOf(
                Obj.dot(nestedRecord),
            );
        });

        it("matches obj.dot for a record given a prefix and a depth", () => {
            expectTypeOf(Data.dataDot(nestedRecord, "p", 1)).toEqualTypeOf(
                Obj.dot(nestedRecord, "p", 1),
            );
        });

        it("matches arr.dot for a list given a prefix and a depth", () => {
            expectTypeOf(Data.dataDot(nestedList, "p", 1)).toEqualTypeOf(
                Arr.dot(nestedList, "p", 1),
            );
        });
    });

    describe("dataUndot, which stays hand-written", () => {
        // No dispatch pair serves it: `asArray` picks the delegate, not the backing. Its rows
        // still answer from the delegate the matching branch calls, so a `DataItems` union
        // return no longer erases the per-shape answer either delegate computed.

        it("matches obj.undot for a record", () => {
            expectTypeOf(Data.dataUndot(dottedRecord)).toEqualTypeOf(
                Obj.undot(dottedRecord),
            );
        });

        it("answers arr.undot for every positional backing, as the body does", () => {
            // These rows once answered obj's `<T extends object>` row, which is unsound:
            // the body runs `arrUndot(toPositionalBacking(data))` and a list is not a record.
            expectTypeOf(Data.dataUndot(nestedList)).toEqualTypeOf<
                ReturnType<
                    typeof Arr.undot<(typeof nestedList)[number], number>
                >
            >();
            expectTypeOf(Data.dataUndot(readonlyNumberList)).toEqualTypeOf<
                number[]
            >();
            expectTypeOf(Data.dataUndot(new Set([1, 2]))).toEqualTypeOf<
                number[]
            >();
        });

        it("answers arr.undot for a scalar and for null, which wrap into a list", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "undot-noncanonical-index"
            // is the keyed row; these two have no PHP analogue.
            // JS-only: PHP has no scalar undot; `toPositionalBacking` wraps, so the answer
            // is a list whose member type nothing narrows.
            expectTypeOf(Data.dataUndot(5)).toEqualTypeOf<unknown[]>();
            expectTypeOf(Data.dataUndot(null)).toEqualTypeOf<unknown[]>();
        });

        it("matches arr.undot once asArray picks the array-shaped rebuild", () => {
            expectTypeOf(Data.dataUndot(indexedRecord, true)).toEqualTypeOf(
                Arr.undot(indexedRecord),
            );
        });

        it("answers obj.undot's own widest row for an unnarrowed asArray", () => {
            const asArray = Date.now() > 0;
            expectTypeOf(Data.dataUndot(dottedRecord, asArray)).toEqualTypeOf<
                ReturnType<typeof Obj.undot>
            >();
        });

        it("rebuilds a Map with asArray as arr.undot rebuilds the record of its entries", () => {
            // Arr.undot turns a Map away at the type level, so the Map is compared with the
            // record it reads: a number key holds no dot, so each value lands whole.
            const numberKeyed = new Map<number, string>([[1, "b"]]);

            expectTypeOf(Data.dataUndot(numberKeyed, true)).toEqualTypeOf(
                Arr.undot({} as Record<number, string>),
            );
            // A string key may be a dotted path, so a value may sit inside nested lists.
            expectTypeOf(Data.dataUndot(numberMap, true)).toEqualTypeOf<
                UndotValue<number>[]
            >();
            // Not a list of [key, value] tuples: the Iterable row does not claim a Map.
            expectTypeOf(Data.dataUndot(numberMap, true)).not.toEqualTypeOf<
                [string, number][]
            >();
        });

        it("answers either rebuild for a Map with an unnarrowed asArray", () => {
            const asArray = Date.now() > 0;
            expectTypeOf(Data.dataUndot(numberMap, asArray)).toEqualTypeOf<
                ReturnType<typeof Obj.undot> | UndotValue<number>[]
            >();
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        // Neither delegate really serves a union: every arr row is array-shaped and rejects
        // it, and obj's `<T extends object>` rows compute their per-key types from
        // `keyof (A | B)` = `keyof A & keyof B`, which collapses to `never` for this union.

        it("answers dataFlip from obj, and still covers the list half", () => {
            const declared = Data.dataFlip(unionItems);
            expectTypeOf(declared).toEqualTypeOf(Obj.flip(unionItems));
            // Soundness: a union-typed value that is really a list reaches arr at runtime.
            expectTypeOf(Arr.flip(numberList)).toExtend<typeof declared>();
        });

        it("answers dataDot from obj, and still covers the list half", () => {
            const declared = Data.dataDot(unionItems);
            expectTypeOf(declared).toEqualTypeOf(Obj.dot(unionItems));
            expectTypeOf(Arr.dot(numberList)).toExtend<typeof declared>();
        });

        it("answers dataPrependKeysWith from obj, and still covers the list half", () => {
            const declared = Data.dataPrependKeysWith(unionItems, "u_");
            expectTypeOf(declared).toEqualTypeOf(
                Obj.prependKeysWith(unionItems, "u_"),
            );
            expectTypeOf(Arr.prependKeysWith(numberList, "u_")).toExtend<
                typeof declared
            >();
        });

        it("answers dataKeyBy off an empty key set, covering both backings", () => {
            // The union's `keyof` still collapses to `never`, but obj's bare-object row
            // answers `unknown` for it rather than `never`, so the list backing fits too.
            const declared = Data.dataKeyBy(unionRows, "id");
            expectTypeOf(declared).toEqualTypeOf(Obj.keyBy(unionRows, "id"));
            expectTypeOf(Arr.keyBy(rowList, "id")).toExtend<typeof declared>();
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row is inferred from the last of obj's overloads,
        // so a Map gets obj's widest row, not obj's own Map row.

        it("types a Map on dataFlip from obj's widest row", () => {
            const widest = Obj.flip(opaque);
            expectTypeOf(Data.dataFlip(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            // Soundness is the point of the row, so assignability, not equality.
            expectTypeOf(Data.dataFlip(numberMapAsRecord)).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataDot from obj's widest row", () => {
            const widest = Obj.dot(opaque);
            expectTypeOf(Data.dataDot(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataDot(numberMapAsRecord)).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataPrependKeysWith from obj's widest row", () => {
            const widest = Obj.prependKeysWith(opaque, "u_");
            expectTypeOf(
                Data.dataPrependKeysWith(numberMap, "u_"),
            ).toEqualTypeOf<typeof widest>();
            expectTypeOf(
                Data.dataPrependKeysWith(numberMapAsRecord, "u_"),
            ).toExtend<typeof widest>();
        });

        it("types a Map on dataKeyBy from obj's widest row", () => {
            const widest = Obj.keyBy(opaque, "a");
            expectTypeOf(Data.dataKeyBy(numberMap, "a")).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataKeyBy(numberMapAsRecord, "a")).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataUndot from obj's widest row", () => {
            // Without this row a Map would fall to `<TData extends object>`, typing its values from
            // `ObjectValue<Map<...>>`, the Map's own members, rather than from its entries.
            const widest = Obj.undot(opaque);
            expectTypeOf(Data.dataUndot(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataUndot(numberMapAsRecord)).toExtend<
                typeof widest
            >();
            // A Map keyed by booleans is taken too, rather than read as a list of entries.
            expectTypeOf(Data.dataUndot(new Map([[true, "t"]]))).toEqualTypeOf<
                typeof widest
            >();
        });
    });

    describe("inputs a Record<PropertyKey, unknown> constraint would reject", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataFlip(settings)).toEqualTypeOf(
                Obj.flip(settings),
            );
            expectTypeOf(Data.dataDot(settings)).toEqualTypeOf(
                Obj.dot(settings),
            );
            expectTypeOf(
                Data.dataPrependKeysWith(settings, "u_"),
            ).toEqualTypeOf(Obj.prependKeysWith(settings, "u_"));
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataFlip(box)).toEqualTypeOf(Obj.flip(box));
            expectTypeOf(Data.dataKeyBy(box, "a")).toEqualTypeOf(
                Obj.keyBy(box, "a"),
            );
        });
    });
});
