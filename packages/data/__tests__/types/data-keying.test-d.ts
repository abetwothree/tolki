import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
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

        it("answers dataKeyBy off an empty key set, covering neither backing", () => {
            // obj's `<T extends object>` row reads the union's collapsed `keyof`, which is
            // `never`, so the answer is `Record<string, never>` — narrower than either backing.
            const declared = Data.dataKeyBy(unionRows, "id");
            expectTypeOf(declared).toEqualTypeOf(Obj.keyBy(unionRows, "id"));
            // Standing control: delete this row once a union stops collapsing obj's `keyof`.
            expectTypeOf(Arr.keyBy(rowList, "id")).not.toExtend<
                typeof declared
            >();
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row stands in for what `toKeyedData`
        // does at runtime, and a conditional over an overloaded delegate resolves only its
        // last signature, so the answer is obj's widest row, not the record's exact one.

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
    });

    describe("inputs that fail to compile today (E2)", () => {
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
