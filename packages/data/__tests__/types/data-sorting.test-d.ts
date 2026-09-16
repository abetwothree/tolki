import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import type { Row } from "./fixtures";
import {
    abc,
    box,
    nestedRecord,
    numberList,
    numberMap,
    opaque,
    readonlyNumberList,
    rowList,
    rowsById,
    settings,
    unionItems,
} from "./fixtures";

const byId = (row: Row): number => row.id;

describe("data sorting type tests", () => {
    describe("dataSort", () => {
        it("matches arr.sort for a list", () => {
            expectTypeOf(Data.dataSort(numberList)).toEqualTypeOf(
                Arr.sort(numberList),
            );
        });

        it("matches obj.sort for a record", () => {
            expectTypeOf(Data.dataSort(abc)).toEqualTypeOf(Obj.sort(abc));
        });

        it("matches each backing given a value extractor", () => {
            expectTypeOf(Data.dataSort(rowList, byId)).toEqualTypeOf(
                Arr.sort(rowList, byId),
            );
            expectTypeOf(Data.dataSort(rowsById, byId)).toEqualTypeOf(
                Obj.sort(rowsById, byId),
            );
        });

        it("matches each backing given a dot-notated key", () => {
            expectTypeOf(Data.dataSort(rowList, "id")).toEqualTypeOf(
                Arr.sort(rowList, "id"),
            );
            expectTypeOf(Data.dataSort(rowsById, "id")).toEqualTypeOf(
                Obj.sort(rowsById, "id"),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(Data.dataSort(readonlyNumberList)).toEqualTypeOf(
                Arr.sort(readonlyNumberList),
            );
        });

        it("hands each backing's comparator its own value and key type", () => {
            // An explicit row: the delegate pin above compares only RETURN types, so nothing
            // there would notice the comparator's parameters widening to `unknown`.
            Data.dataSort(numberList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value;
            });
            Data.dataSort(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value;
            });
        });
    });

    describe("dataSortDesc", () => {
        it("matches arr.sortDesc for a list", () => {
            expectTypeOf(Data.dataSortDesc(numberList)).toEqualTypeOf(
                Arr.sortDesc(numberList),
            );
        });

        it("matches obj.sortDesc for a record", () => {
            expectTypeOf(Data.dataSortDesc(abc)).toEqualTypeOf(
                Obj.sortDesc(abc),
            );
        });

        it("matches each backing given a value extractor", () => {
            expectTypeOf(Data.dataSortDesc(rowList, byId)).toEqualTypeOf(
                Arr.sortDesc(rowList, byId),
            );
            expectTypeOf(Data.dataSortDesc(rowsById, byId)).toEqualTypeOf(
                Obj.sortDesc(rowsById, byId),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(Data.dataSortDesc(readonlyNumberList)).toEqualTypeOf(
                Arr.sortDesc(readonlyNumberList),
            );
        });

        it("hands each backing's comparator its own value and key type", () => {
            // An explicit row, for the same reason as dataSort's.
            Data.dataSortDesc(numberList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value;
            });
            Data.dataSortDesc(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value;
            });
        });
    });

    describe("dataSortRecursive", () => {
        it("matches arr.sortRecursive for a list", () => {
            expectTypeOf(Data.dataSortRecursive(numberList)).toEqualTypeOf(
                Arr.sortRecursive(numberList),
            );
        });

        it("matches obj.sortRecursive for a record", () => {
            expectTypeOf(Data.dataSortRecursive(nestedRecord)).toEqualTypeOf(
                Obj.sortRecursive(nestedRecord),
            );
        });

        it("matches each backing given an explicit direction", () => {
            expectTypeOf(
                Data.dataSortRecursive(numberList, true),
            ).toEqualTypeOf(Arr.sortRecursive(numberList, true));
            expectTypeOf(
                Data.dataSortRecursive(nestedRecord, true),
            ).toEqualTypeOf(Obj.sortRecursive(nestedRecord, true));
        });

        it("takes a read-only list", () => {
            expectTypeOf(
                Data.dataSortRecursive(readonlyNumberList),
            ).toEqualTypeOf(Arr.sortRecursive(readonlyNumberList));
        });
    });

    describe("dataSortRecursiveDesc", () => {
        it("matches arr.sortRecursiveDesc for a list", () => {
            expectTypeOf(Data.dataSortRecursiveDesc(numberList)).toEqualTypeOf(
                Arr.sortRecursiveDesc(numberList),
            );
        });

        it("matches obj.sortRecursiveDesc for a record", () => {
            expectTypeOf(
                Data.dataSortRecursiveDesc(nestedRecord),
            ).toEqualTypeOf(Obj.sortRecursiveDesc(nestedRecord));
        });

        it("takes a read-only list", () => {
            expectTypeOf(
                Data.dataSortRecursiveDesc(readonlyNumberList),
            ).toEqualTypeOf(Arr.sortRecursiveDesc(readonlyNumberList));
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        it("answers each sorter from obj, and still covers the list half", () => {
            // Assignability, not equality: obj answers the whole union, so the arr row
            // below is only a lower bound on it and can never equal it.
            const sorted = Data.dataSort(unionItems);
            expectTypeOf(sorted).toEqualTypeOf(Obj.sort(unionItems));
            expectTypeOf(Arr.sort(numberList)).toExtend<typeof sorted>();

            expectTypeOf(Data.dataSortDesc(unionItems)).toEqualTypeOf(
                Obj.sortDesc(unionItems),
            );
            expectTypeOf(Data.dataSortRecursive(unionItems)).toEqualTypeOf(
                Obj.sortRecursive(unionItems),
            );
            expectTypeOf(Data.dataSortRecursiveDesc(unionItems)).toEqualTypeOf(
                Obj.sortRecursiveDesc(unionItems),
            );
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row stands in for what `toKeyedData`
        // does at runtime, and a conditional over an overloaded delegate resolves only its
        // last signature, so the answer is obj's widest row, not the record's exact one.

        it("types a Map on dataSort from obj's widest row", () => {
            const widest = Obj.sort(opaque);
            expectTypeOf(Data.dataSort(numberMap)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataSortDesc from obj's widest row", () => {
            const widest = Obj.sortDesc(opaque);
            expectTypeOf(Data.dataSortDesc(numberMap)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataSortRecursive from obj's widest row", () => {
            const widest = Obj.sortRecursive(opaque);
            expectTypeOf(Data.dataSortRecursive(numberMap)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataSortRecursiveDesc from obj's widest row", () => {
            const widest = Obj.sortRecursiveDesc(opaque);
            expectTypeOf(Data.dataSortRecursiveDesc(numberMap)).toEqualTypeOf<
                typeof widest
            >();
        });
    });

    describe("inputs that fail to compile today (E2)", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataSort(settings)).toEqualTypeOf(
                Obj.sort(settings),
            );
            expectTypeOf(Data.dataSortDesc(settings)).toEqualTypeOf(
                Obj.sortDesc(settings),
            );
            expectTypeOf(Data.dataSortRecursive(settings)).toEqualTypeOf(
                Obj.sortRecursive(settings),
            );
            expectTypeOf(Data.dataSortRecursiveDesc(settings)).toEqualTypeOf(
                Obj.sortRecursiveDesc(settings),
            );
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataSort(box)).toEqualTypeOf(Obj.sort(box));
            expectTypeOf(Data.dataSortRecursive(box)).toEqualTypeOf(
                Obj.sortRecursive(box),
            );
        });
    });
});
