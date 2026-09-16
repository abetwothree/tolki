import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    box,
    names,
    numberList,
    numberMap,
    numberMapAsRecord,
    opaque,
    readonlyNumberList,
    settings,
    stringList,
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

    describe("dataCombine, which stays hand-written", () => {
        // Its rows are written as `ReturnType<typeof arrCombine>` / `<typeof objCombine>`,
        // so a full delegate-call pin is impossible: the row erases the arguments. Each
        // assertion pins the delegate's own widest answer instead, never a hand-written one.

        it("answers arr.combine's own return for a list", () => {
            expectTypeOf(
                Data.dataCombine(stringList, numberList),
            ).toEqualTypeOf<ReturnType<typeof Arr.combine>>();
        });

        it("answers obj.combine's own return for a record", () => {
            expectTypeOf(Data.dataCombine(names, numberList)).toEqualTypeOf<
                ReturnType<typeof Obj.combine>
            >();
        });
    });

    describe("dataCount", () => {
        it("returns a number for either backing", () => {
            // JS-only: no Arr::/Collection:: counterpart, so there is no delegate to pin against.
            expectTypeOf(Data.dataCount(numberList)).toEqualTypeOf<number>();
            expectTypeOf(Data.dataCount(abc)).toEqualTypeOf<number>();
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row stands in for what `toKeyedData`
        // does at runtime, and a conditional over an overloaded delegate resolves only its
        // last signature, so the answer is obj's widest row, not the record's exact one.

        it("types a Map on dataKeys from obj's widest row", () => {
            const widest = Obj.keys(opaque);
            expectTypeOf(Data.dataKeys(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            // Soundness is the point of the row, so assignability, not equality: the
            // record the runtime builds must satisfy what the Map input declares.
            expectTypeOf(Data.dataKeys(numberMapAsRecord)).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataValues from obj's widest row", () => {
            const widest = Obj.values(opaque);
            expectTypeOf(Data.dataValues(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            // Assignability again: `unknown[]` is wider than the record's `number[]`.
            expectTypeOf(Data.dataValues(numberMapAsRecord)).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataDivide from obj's widest row", () => {
            const widest = Obj.divide(opaque);
            expectTypeOf(Data.dataDivide(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            // Assignability again: the values half is `unknown[]`, not `number[]`.
            expectTypeOf(Data.dataDivide(numberMapAsRecord)).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataFrom from obj's widest row", () => {
            const widest = Obj.from(opaque);
            expectTypeOf(Data.dataFrom(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            // Assignability again: the values are `unknown`, not `number`.
            expectTypeOf(Data.dataFrom(numberMapAsRecord)).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataCombine from obj's widest row", () => {
            // The row this task added; before it, a Map matched none and had to be cast.
            expectTypeOf(Data.dataCombine(numberMap, numberList)).toEqualTypeOf<
                ReturnType<typeof Obj.combine>
            >();
        });

        it("types a Map on dataCount like the record it mirrors", () => {
            // JS-only: no Arr::/Collection:: counterpart, so there is no delegate to pin against.
            expectTypeOf(Data.dataCount(numberMap)).toEqualTypeOf(
                Data.dataCount(numberMapAsRecord),
            );
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
