import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    box,
    numberList,
    numberMap,
    readonlyNumberList,
    settings,
} from "./fixtures";

describe("data foundation type tests", () => {
    describe("dataFrom", () => {
        it("matches arr.from for a list", () => {
            expectTypeOf(Data.dataFrom(numberList)).toEqualTypeOf(
                Arr.from(numberList),
            );
        });

        it("matches obj.from for a record", () => {
            expectTypeOf(Data.dataFrom(abc)).toEqualTypeOf(Obj.from(abc));
        });

        it("matches arr.from for a Map, which still owns the Map row", () => {
            // `arr.from` keeps a Map-shaped row (removing it would drop a Map onto arr's
            // Iterable row, typing it `[string, number][]`), so arr wins before obj here.
            expectTypeOf(Data.dataFrom(numberMap)).toEqualTypeOf(
                Arr.from(numberMap),
            );
            // Standing control: flip the row above to obj once these two agree.
            expectTypeOf(Arr.from(numberMap)).not.toEqualTypeOf(
                Obj.from(numberMap),
            );
        });
    });

    describe("dataKeys", () => {
        it("matches arr.keys for a list", () => {
            expectTypeOf(Data.dataKeys(numberList)).toEqualTypeOf(
                Arr.keys(numberList),
            );
        });

        it("matches obj.keys for a record", () => {
            expectTypeOf(Data.dataKeys(abc)).toEqualTypeOf(Obj.keys(abc));
        });
    });

    describe("dataValues", () => {
        it("matches arr.values for a list", () => {
            expectTypeOf(Data.dataValues(numberList)).toEqualTypeOf(
                Arr.values(numberList),
            );
        });

        it("matches obj.values for a record", () => {
            expectTypeOf(Data.dataValues(abc)).toEqualTypeOf(Obj.values(abc));
        });

        it("matches arr.values for a read-only list", () => {
            expectTypeOf(Data.dataValues(readonlyNumberList)).toEqualTypeOf(
                Arr.values(readonlyNumberList),
            );
        });
    });

    describe("dataDivide", () => {
        it("matches arr.divide for a list", () => {
            expectTypeOf(Data.dataDivide(numberList)).toEqualTypeOf(
                Arr.divide(numberList),
            );
        });

        it("matches obj.divide for a record", () => {
            expectTypeOf(Data.dataDivide(abc)).toEqualTypeOf(Obj.divide(abc));
        });
    });

    describe("dataCount", () => {
        it("returns a number for either backing", () => {
            // JS-only: no Arr::/Collection:: counterpart, so there is no delegate to pin against.
            expectTypeOf(Data.dataCount(numberList)).toEqualTypeOf<number>();
            expectTypeOf(Data.dataCount(abc)).toEqualTypeOf<number>();
        });
    });

    describe("inputs that fail to compile today (E2)", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataKeys(settings)).toEqualTypeOf(
                Obj.keys(settings),
            );
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataValues(box)).toEqualTypeOf(Obj.values(box));
            expectTypeOf(Data.dataKeys(box)).toEqualTypeOf(Obj.keys(box));
        });
    });
});
