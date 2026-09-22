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
        // Its rows apply each delegate to the call the body actually makes, so these are
        // full delegate-call pins. obj is handed the backing's VALUES, never the backing,
        // so the record pin passes `Object.values(...)` — as the body does.

        it("matches arr.combine for a list", () => {
            const own = Arr.combine(stringList, numberList);

            expectTypeOf(
                Data.dataCombine(stringList, numberList),
            ).toEqualTypeOf(own);
        });

        it("matches obj.combine for a record", () => {
            const own = Obj.combine(Object.values(names), numberList);

            expectTypeOf(Data.dataCombine(names, numberList)).toEqualTypeOf(
                own,
            );
        });

        it("routes a list and a record to different delegates", () => {
            // The pin that discriminates: arr promises every key, obj's CombineRecord makes
            // a key built from a list of values optional, so the two rows cannot coincide.
            const viaArr = Data.dataCombine(stringList, numberList);
            const viaObj = Data.dataCombine(names, numberList);

            expectTypeOf(viaArr).not.toEqualTypeOf(viaObj);
        });

        it("matches arr.combine for a Set, a generator and a scalar", () => {
            const own = Arr.combine(stringList, numberList);
            const generator = (function* () {
                yield "a";
            })();

            expectTypeOf(
                Data.dataCombine(new Set(stringList), numberList),
            ).toEqualTypeOf(own);
            expectTypeOf(Data.dataCombine(generator, numberList)).toEqualTypeOf(
                Arr.combine(["a"], numberList),
            );
            expectTypeOf(Data.dataCombine("k", numberList)).toEqualTypeOf(
                Arr.combine(["k"], numberList),
            );
        });

        it("turns away undefined, which the runtime cannot serve", () => {
            // `toPositionalBacking` keeps `undefined` as a one-element list, so
            // `array_combine` throws for every values set but a one-element one.
            // @ts-expect-error - undefined is not one of dataCombine's keys backings
            Data.dataCombine(undefined, numberList);
            // null is served: `arrWrap` drops it, so an empty values set combines to `{}`.
            expectTypeOf(Data.dataCombine(null, [])).toEqualTypeOf(
                Arr.combine([], []),
            );
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
        // JS-only: PHP has no Map. `dispatch`'s Map row is inferred from the last of obj's overloads,
        // so a Map gets obj's widest row, not obj's own Map row.

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

        it("types a boolean- or object-keyed Map on dataKeys and dataValues from obj's widest row", () => {
            // KeyedMapRow claims a Map of any key type, so these skip obj's own Map rows, which would
            // answer `(0 | 1)[]` and `string[]` for the boolean-keyed one.
            const booleanKeyed = new Map<boolean, string>([[true, "a"]]);
            const objectKeyed = new Map<object, string>([[{}, "a"]]);
            const keys = Obj.keys(opaque);
            const values = Obj.values(opaque);

            expectTypeOf(Data.dataKeys(booleanKeyed)).toEqualTypeOf<
                typeof keys
            >();
            expectTypeOf(Data.dataKeys(objectKeyed)).toEqualTypeOf<
                typeof keys
            >();
            expectTypeOf(Data.dataValues(booleanKeyed)).toEqualTypeOf<
                typeof values
            >();
            expectTypeOf(Data.dataValues(objectKeyed)).toEqualTypeOf<
                typeof values
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

        it("types a Map on dataCombine like the record it mirrors", () => {
            // The row this task added; before it, a Map matched none and had to be cast.
            // A delegate-call pin, on the call the body makes: obj sees the VALUES.
            const own = Obj.combine(
                Object.values(numberMapAsRecord),
                numberList,
            );

            expectTypeOf(Data.dataCombine(numberMap, numberList)).toEqualTypeOf(
                own,
            );
        });

        it("types a Map on dataCount like the record it mirrors", () => {
            // JS-only: no Arr::/Collection:: counterpart, so there is no delegate to pin against.
            expectTypeOf(Data.dataCount(numberMap)).toEqualTypeOf(
                Data.dataCount(numberMapAsRecord),
            );
        });
    });

    describe("inputs a Record<PropertyKey, unknown> constraint would reject", () => {
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
