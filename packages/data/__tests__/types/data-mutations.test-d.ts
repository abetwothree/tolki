import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    box,
    nestedRecord,
    numberList,
    numberMap,
    numberMapAsRecord,
    opaque,
    readonlyNumberList,
    settings,
    unionItems,
} from "./fixtures";

/** Mirrors `listWhenIndexed`, data's own step: obj's record, or that record's values. */
type ListWhenIndexed<TRecord> = TRecord | TRecord[keyof TRecord][];

describe("data mutations type tests", () => {
    describe("dataPop", () => {
        it("matches arr.pop for a list", () => {
            expectTypeOf(Data.dataPop(numberList)).toEqualTypeOf(
                Arr.pop(numberList),
            );
        });

        it("matches obj.pop for a record", () => {
            expectTypeOf(Data.dataPop(abc)).toEqualTypeOf(Obj.pop(abc));
        });

        it("matches each backing for an explicit count", () => {
            expectTypeOf(Data.dataPop(numberList, 2)).toEqualTypeOf(
                Arr.pop(numberList, 2),
            );
            expectTypeOf(Data.dataPop(abc, 2)).toEqualTypeOf(Obj.pop(abc, 2));
        });
    });

    describe("dataShift", () => {
        it("matches arr.shift for a list", () => {
            expectTypeOf(Data.dataShift(numberList)).toEqualTypeOf(
                Arr.shift(numberList),
            );
        });

        it("matches obj.shift for a record", () => {
            expectTypeOf(Data.dataShift(abc)).toEqualTypeOf(Obj.shift(abc));
        });

        it("matches each backing for an explicit count", () => {
            expectTypeOf(Data.dataShift(numberList, 2)).toEqualTypeOf(
                Arr.shift(numberList, 2),
            );
            expectTypeOf(Data.dataShift(abc, 2)).toEqualTypeOf(
                Obj.shift(abc, 2),
            );
        });
    });

    describe("dataUnshift", () => {
        it("matches arr.unshift for a list", () => {
            expectTypeOf(Data.dataUnshift(numberList, 0)).toEqualTypeOf(
                Arr.unshift(numberList, 0),
            );
        });

        it("matches obj.unshift for a record", () => {
            expectTypeOf(Data.dataUnshift(abc, 0)).toEqualTypeOf(
                Obj.unshift(abc, 0),
            );
        });

        it("matches each backing with no items to prepend", () => {
            expectTypeOf(Data.dataUnshift(numberList)).toEqualTypeOf(
                Arr.unshift(numberList),
            );
            expectTypeOf(Data.dataUnshift(abc)).toEqualTypeOf(Obj.unshift(abc));
        });
    });

    describe("dataSplice", () => {
        it("matches arr.splice for a list", () => {
            expectTypeOf(Data.dataSplice(numberList, 1)).toEqualTypeOf(
                Arr.splice(numberList, 1),
            );
        });

        it("matches obj.splice for a record", () => {
            expectTypeOf(Data.dataSplice(abc, 1)).toEqualTypeOf(
                Obj.splice(abc, 1),
            );
        });

        it("matches each backing for a length and a replacement", () => {
            expectTypeOf(Data.dataSplice(numberList, 1, 1, 9)).toEqualTypeOf(
                Arr.splice(numberList, 1, 1, 9),
            );
            expectTypeOf(Data.dataSplice(abc, 1, 1, 9)).toEqualTypeOf(
                Obj.splice(abc, 1, 1, 9),
            );
        });
    });

    describe("dataPad", () => {
        it("matches arr.pad for a list", () => {
            expectTypeOf(Data.dataPad(numberList, 5, 0)).toEqualTypeOf(
                Arr.pad(numberList, 5, 0),
            );
        });

        it("matches obj.pad for a record", () => {
            expectTypeOf(Data.dataPad(abc, 5, 0)).toEqualTypeOf(
                Obj.pad(abc, 5, 0),
            );
        });

        it("matches arr.pad for a read-only list", () => {
            // `DataItems`' `TValue[]` arm rejects a read-only list, so its `Record<TKey, TValue>`
            // arm matched instead and inferred the array's own method types as the values.
            expectTypeOf(Data.dataPad(readonlyNumberList, 5, 0)).toEqualTypeOf(
                Arr.pad(readonlyNumberList, 5, 0),
            );
        });
    });

    describe("dataReplace and dataReplaceRecursive, which stay hand-written", () => {
        // Standing control: these two are NOT `dispatch` pairs. `arr.replace` drops a string
        // key and fills a gap with `undefined` to keep its `TValue[]` return, where
        // `array_replace` keeps both, so obj serves the list backing too. See the JSDoc.

        it("still has an arr delegate whose return cannot hold PHP's keyed answer", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "replace-list-string-key-replacer"
            expectTypeOf(Arr.replace(["a", "b", "c"], { k: "x" })).toExtend<
                unknown[]
            >();
            expectTypeOf(
                Data.dataReplace(["a", "b", "c"], { k: "x" }),
            ).not.toExtend<unknown[]>();
        });

        it("still has an arr replaceRecursive delegate whose return cannot either", () => {
            // docs/php-parity/task-24-data-release-readiness.json, "replaceRecursive-list-string-key-replacer"
            expectTypeOf(
                Arr.replaceRecursive(["a", "b", "c"], { k: "x" }),
            ).toExtend<unknown[]>();
            expectTypeOf(
                Data.dataReplaceRecursive(["a", "b", "c"], { k: "x" }),
            ).not.toExtend<unknown[]>();
        });

        it("matches obj.replace for a keyed backing, which obj serves alone", () => {
            // arr.replace returns a list, so obj serves BOTH backings and the keyed row is
            // obj's own answer rather than the DataItems union, which erased it.
            expectTypeOf(Data.dataReplace(abc, { b: 20 })).toEqualTypeOf(
                Obj.replace(abc, { b: 20 }),
            );
            expectTypeOf(
                Data.dataReplaceRecursive(nestedRecord, { a: { x: 9 } }),
            ).toEqualTypeOf(
                Obj.replaceRecursive(nestedRecord, { a: { x: 9 } }),
            );
        });

        it("answers obj's own record for a list backing, or that record's values", () => {
            // The list backing reaches obj too, on the record `toIndexedRecord` builds;
            // `listWhenIndexed` then hands back its values while the keys stay 0..n-1.
            // That last step is data's own, and the only part these expectations state.
            expectTypeOf(
                Data.dataReplace(numberList, { k: "x" }),
            ).toEqualTypeOf<
                ListWhenIndexed<
                    ReturnType<
                        typeof Obj.replace<
                            Record<string, number>,
                            { k: string }
                        >
                    >
                >
            >();
            expectTypeOf(
                Data.dataReplaceRecursive(numberList, { k: "x" }),
            ).toEqualTypeOf<
                ListWhenIndexed<
                    ReturnType<
                        typeof Obj.replaceRecursive<
                            Record<string, number>,
                            { k: string }
                        >
                    >
                >
            >();
        });

        it("answers obj's widest row for a backing neither typed row claims", () => {
            expectTypeOf(Data.dataReplace(opaque, opaque)).toEqualTypeOf<
                ReturnType<typeof Obj.replace>
            >();
            expectTypeOf(
                Data.dataReplaceRecursive(opaque, opaque),
            ).toEqualTypeOf<ReturnType<typeof Obj.replaceRecursive>>();
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        it("answers dataPop from obj, and still covers the list half", () => {
            const declared = Data.dataPop(unionItems);
            expectTypeOf(declared).toEqualTypeOf(Obj.pop(unionItems));
            // Soundness: a union-typed value that is really a list reaches arr at runtime.
            expectTypeOf(Arr.pop(numberList)).toExtend<typeof declared>();
        });

        it("answers dataShift from obj, and still covers the list half", () => {
            const declared = Data.dataShift(unionItems);
            expectTypeOf(declared).toEqualTypeOf(Obj.shift(unionItems));
            expectTypeOf(Arr.shift(numberList)).toExtend<typeof declared>();
        });

        it("answers dataPad from obj, and still covers the list half", () => {
            const declared = Data.dataPad(unionItems, 5, 0);
            expectTypeOf(declared).toEqualTypeOf(Obj.pad(unionItems, 5, 0));
            expectTypeOf(Arr.pad(numberList, 5, 0)).toExtend<typeof declared>();
        });

        it("answers dataSplice from obj, and still covers the list half", () => {
            const declared = Data.dataSplice(unionItems, 1);
            expectTypeOf(declared).toEqualTypeOf(Obj.splice(unionItems, 1));
            expectTypeOf(Arr.splice(numberList, 1)).toExtend<typeof declared>();
        });

        it("answers dataUnshift from obj, and still covers the list half", () => {
            const declared = Data.dataUnshift(unionItems, 0);
            expectTypeOf(declared).toEqualTypeOf(Obj.unshift(unionItems, 0));
            expectTypeOf(Arr.unshift(numberList, 0)).toExtend<
                typeof declared
            >();
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row is inferred from the last of obj's overloads,
        // so a Map gets obj's widest row, not obj's own Map row.

        it("types a Map on dataPop from obj's widest row", () => {
            const widest = Obj.pop(opaque);
            expectTypeOf(Data.dataPop(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            // Soundness is the point of the row, so assignability, not equality.
            expectTypeOf(Data.dataPop(numberMapAsRecord)).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataShift from obj's widest row", () => {
            const widest = Obj.shift(opaque);
            expectTypeOf(Data.dataShift(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataShift(numberMapAsRecord)).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataUnshift from obj's widest row", () => {
            const widest = Obj.unshift(opaque, 0);
            expectTypeOf(Data.dataUnshift(numberMap, 0)).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataUnshift(numberMapAsRecord, 0)).toExtend<
                typeof widest
            >();
        });

        it("types a Map of any key type on dataUnshift as the record it returns", () => {
            // KeyedMapRow claims a Map of any key type ahead of obj.unshift's own Map row, which
            // answers the Map that obj rewrites.
            const widest = Obj.unshift(opaque, 0);
            const booleanKeyed = new Map<boolean, string>([[true, "a"]]);
            const objectKeyed = new Map<object, string>([[{}, "a"]]);

            expectTypeOf(Data.dataUnshift(booleanKeyed, "U")).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataUnshift(objectKeyed, "U")).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataSplice from obj's widest row", () => {
            const widest = Obj.splice(opaque, 1);
            expectTypeOf(Data.dataSplice(numberMap, 1)).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataSplice(numberMapAsRecord, 1)).toExtend<
                typeof widest
            >();
        });

        it("types a boolean- or object-keyed Map on dataShift, dataPop and dataSplice from obj's widest row", () => {
            // KeyedMapRow claims a Map of any key type, so these skip obj's own Map rows too.
            const booleanKeyed = new Map<boolean, string>([[true, "a"]]);
            const objectKeyed = new Map<object, string>([[{}, "a"]]);
            const shifted = Obj.shift(opaque);
            const popped = Obj.pop(opaque);
            const spliced = Obj.splice(opaque, 0, 1);

            expectTypeOf(Data.dataShift(booleanKeyed)).toEqualTypeOf<
                typeof shifted
            >();
            expectTypeOf(Data.dataShift(objectKeyed)).toEqualTypeOf<
                typeof shifted
            >();
            expectTypeOf(Data.dataPop(booleanKeyed, 2)).toEqualTypeOf<
                typeof popped
            >();
            expectTypeOf(Data.dataPop(objectKeyed)).toEqualTypeOf<
                typeof popped
            >();
            expectTypeOf(Data.dataSplice(booleanKeyed, 0, 1)).toEqualTypeOf<
                typeof spliced
            >();
            expectTypeOf(Data.dataSplice(objectKeyed, 0, 1)).toEqualTypeOf<
                typeof spliced
            >();
        });

        it("types a Map on dataPad from obj's widest row", () => {
            const widest = Obj.pad(opaque, 5, 0);
            expectTypeOf(Data.dataPad(numberMap, 5, 0)).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataPad(numberMapAsRecord, 5, 0)).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataReplace from obj's widest row", () => {
            // Without this row the Map fell to `<TData extends object>` and answered
            // `Map<string, number> | { b: number }` — a union whose first half is the
            // untouched Map, which the body never returns.
            const widest = Obj.replace(opaque, opaque);
            expectTypeOf(Data.dataReplace(numberMap, { b: 20 })).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(
                Data.dataReplace(numberMapAsRecord, { b: 20 }),
            ).toExtend<typeof widest>();
        });

        it("types a Map on dataReplaceRecursive from obj's widest row", () => {
            const widest = Obj.replaceRecursive(opaque, opaque);
            expectTypeOf(
                Data.dataReplaceRecursive(numberMap, { b: 20 }),
            ).toEqualTypeOf<typeof widest>();
            expectTypeOf(
                Data.dataReplaceRecursive(numberMapAsRecord, { b: 20 }),
            ).toExtend<typeof widest>();
        });
    });

    describe("inputs a Record<PropertyKey, unknown> constraint would reject", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataPop(settings)).toEqualTypeOf(
                Obj.pop(settings),
            );
            expectTypeOf(Data.dataShift(settings)).toEqualTypeOf(
                Obj.shift(settings),
            );
            expectTypeOf(Data.dataSplice(settings, 1)).toEqualTypeOf(
                Obj.splice(settings, 1),
            );
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataPad(box, 5, 0)).toEqualTypeOf(
                Obj.pad(box, 5, 0),
            );
            expectTypeOf(Data.dataUnshift(box, 0)).toEqualTypeOf(
                Obj.unshift(box, 0),
            );
        });
    });
});
