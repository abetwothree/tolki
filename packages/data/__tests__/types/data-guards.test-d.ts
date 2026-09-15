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
    settings,
    unionItems,
} from "./fixtures";

describe("data guards type tests", () => {
    describe("dataExists", () => {
        it("matches arr.exists for a list", () => {
            expectTypeOf(Data.dataExists(numberList, 0)).toEqualTypeOf(
                Arr.exists(numberList, 0),
            );
        });

        it("matches obj.exists for a record", () => {
            expectTypeOf(Data.dataExists(abc, "a")).toEqualTypeOf(
                Obj.exists(abc, "a"),
            );
        });

        it("matches obj.exists for data no shape can be read off", () => {
            expectTypeOf(Data.dataExists(opaque, "a")).toEqualTypeOf(
                Obj.exists(opaque, "a"),
            );
        });

        it("matches arr.exists for a read-only list", () => {
            expectTypeOf(Data.dataExists(readonlyNumberList, 0)).toEqualTypeOf(
                Arr.exists(readonlyNumberList, 0),
            );
        });

        it("answers boolean whichever backing wins", () => {
            // Both delegates return a bare `boolean`, so no pin above can tell them
            // apart; this row is the one that fails if either delegate's return changes.
            expectTypeOf(
                Data.dataExists(numberList, 0),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        it("routes the union to obj's widest row on dataExists", () => {
            // A union matches none of arr's array-shaped rows, so obj's widest row wins.
            expectTypeOf(Data.dataExists(unionItems, "a")).toEqualTypeOf(
                Obj.exists(opaque, "a"),
            );
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row stands in for what `toKeyedData`
        // does at runtime, and a conditional over an overloaded delegate resolves only its
        // last signature, so the answer is obj's widest row, not the record's exact one.

        it("types a Map on dataExists from obj's widest row", () => {
            const widest = Obj.exists(opaque, "a");
            expectTypeOf(Data.dataExists(numberMap, "a")).toEqualTypeOf<
                typeof widest
            >();
            // Soundness is the point of the row, so assignability, not equality: the
            // record the runtime builds must satisfy what the Map input declares.
            expectTypeOf(Data.dataExists(numberMapAsRecord, "a")).toExtend<
                typeof widest
            >();
        });
    });

    describe("dataItem, which dispatch cannot serve yet", () => {
        // `arr.arrayItem` still carries an untightened `data: TValue[] | unknown` row and
        // `item` is not one of Part B's 75 swept pairs, so dispatch would route a record
        // to arr and answer `unknown[]`. The hand-written body keeps obj's own answer.

        it("keeps arrayItem's answer for a list", () => {
            expectTypeOf(Data.dataItem(nestedList, 0)).toEqualTypeOf(
                Arr.arrayItem(nestedList, 0),
            );
        });

        it("keeps objectItem's answer for a record", () => {
            expectTypeOf(Data.dataItem(nestedRecord, "a")).toEqualTypeOf(
                Obj.objectItem(nestedRecord, "a"),
            );
        });

        it("still has an arr row that swallows a record", () => {
            // Standing control: convert dataItem to dispatch once arr stops accepting a
            // record here, which is the only reason the conversion is deferred.
            expectTypeOf(Arr.arrayItem(nestedRecord, "a")).not.toEqualTypeOf(
                Obj.objectItem(nestedRecord, "a"),
            );
        });
    });

    describe("inputs that fail to compile today (E2)", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataExists(settings, "a")).toEqualTypeOf(
                Obj.exists(settings, "a"),
            );
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataExists(box, "a")).toEqualTypeOf(
                Obj.exists(box, "a"),
            );
        });
    });
});
