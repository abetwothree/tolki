import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    box,
    numberList,
    numberMap,
    numberMapAsRecord,
    opaque,
    pairList,
    pairsById,
    rowList,
    rowsById,
    settings,
    unionItems,
} from "./fixtures";

const double = (value: number): number => value * 2;
const aboveOne = (value: number): boolean => value > 1;
/** obj's widest rows declare `(value: unknown, key: string | number)` callbacks. */
const widenedDouble = (value: unknown): number => Number(value) * 2;
const widenedAboveOne = (value: unknown): boolean => Number(value) > 1;
const widenedIdentity = (value: unknown): unknown => value;

describe("data mapping type tests", () => {
    describe("dataMap", () => {
        it("matches arr.map for a list", () => {
            expectTypeOf(Data.dataMap(numberList, double)).toEqualTypeOf(
                Arr.map(numberList, double),
            );
        });

        it("matches obj.map for a record", () => {
            expectTypeOf(Data.dataMap(abc, double)).toEqualTypeOf(
                Obj.map(abc, double),
            );
        });

        it("hands a list callback a numeric key", () => {
            Data.dataMap(numberList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value * 2;
            });
        });

        it("hands a record callback its own key union", () => {
            Data.dataMap(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();
                return value * 2;
            });
        });
    });

    describe("dataFilter", () => {
        it("matches arr.filter for a list", () => {
            expectTypeOf(Data.dataFilter(numberList, aboveOne)).toEqualTypeOf(
                Arr.filter(numberList, aboveOne),
            );
        });

        it("matches obj.filter for a record", () => {
            expectTypeOf(Data.dataFilter(abc, aboveOne)).toEqualTypeOf(
                Obj.filter(abc, aboveOne),
            );
        });

        it("matches arr.filter for a list with no callback", () => {
            expectTypeOf(Data.dataFilter(numberList)).toEqualTypeOf(
                Arr.filter(numberList),
            );
        });

        it("matches obj.filter for a record with no callback", () => {
            expectTypeOf(Data.dataFilter(abc)).toEqualTypeOf(Obj.filter(abc));
        });

        it("hands each backing's callback its own key type", () => {
            Data.dataFilter(numberList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value > 1;
            });
            Data.dataFilter(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();
                return value > 1;
            });
        });
    });

    describe("dataWhere", () => {
        it("matches arr.where for a list", () => {
            expectTypeOf(Data.dataWhere(numberList, aboveOne)).toEqualTypeOf(
                Arr.where(numberList, aboveOne),
            );
        });

        it("matches obj.where for a record", () => {
            expectTypeOf(Data.dataWhere(abc, aboveOne)).toEqualTypeOf(
                Obj.where(abc, aboveOne),
            );
        });

        it("hands a row callback the row type, not a widened one", () => {
            Data.dataWhere(rowList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<(typeof rowList)[number]>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value.id > 1;
            });
            Data.dataWhere(rowsById, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<(typeof rowsById)["r1"]>();
                expectTypeOf(key).toEqualTypeOf<"r1" | "r2">();
                return value.id > 1;
            });
        });
    });

    describe("dataReject", () => {
        it("matches arr.reject for a list", () => {
            expectTypeOf(Data.dataReject(numberList, aboveOne)).toEqualTypeOf(
                Arr.reject(numberList, aboveOne),
            );
        });

        it("matches obj.reject for a record", () => {
            expectTypeOf(Data.dataReject(abc, aboveOne)).toEqualTypeOf(
                Obj.reject(abc, aboveOne),
            );
        });

        it("hands each backing's callback its own key type", () => {
            Data.dataReject(numberList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value > 1;
            });
            Data.dataReject(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();
                return value > 1;
            });
        });
    });

    describe("dataWhereNotNull", () => {
        it("matches arr.whereNotNull for a list", () => {
            expectTypeOf(Data.dataWhereNotNull(numberList)).toEqualTypeOf(
                Arr.whereNotNull(numberList),
            );
        });

        it("matches obj.whereNotNull for a record", () => {
            expectTypeOf(Data.dataWhereNotNull(abc)).toEqualTypeOf(
                Obj.whereNotNull(abc),
            );
        });
    });

    describe("dataPartition", () => {
        it("matches arr.partition for a list", () => {
            expectTypeOf(
                Data.dataPartition(numberList, aboveOne),
            ).toEqualTypeOf(Arr.partition(numberList, aboveOne));
        });

        it("matches obj.partition for a record", () => {
            expectTypeOf(Data.dataPartition(abc, aboveOne)).toEqualTypeOf(
                Obj.partition(abc, aboveOne),
            );
        });

        it("hands each backing's callback its own key type", () => {
            Data.dataPartition(numberList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value > 1;
            });
            Data.dataPartition(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();
                return value > 1;
            });
        });
    });

    describe("dataMapSpread", () => {
        it("matches arr.mapSpread for a list of pairs", () => {
            expectTypeOf(
                Data.dataMapSpread(pairList, (id, name) => `${name}${id}`),
            ).toEqualTypeOf(
                Arr.mapSpread(pairList, (id, name) => `${name}${id}`),
            );
        });

        it("matches obj.mapSpread for a record of pairs", () => {
            expectTypeOf(
                Data.dataMapSpread(pairsById, (id, name) => `${name}${id}`),
            ).toEqualTypeOf(
                Obj.mapSpread(pairsById, (id, name) => `${name}${id}`),
            );
        });

        it("hands a pair callback its element types instead of any", () => {
            Data.dataMapSpread(pairList, (id, name) => {
                expectTypeOf(id).toEqualTypeOf<number>();
                expectTypeOf(name).toEqualTypeOf<string>();
                return 1;
            });
        });
    });

    describe("dataMapWithKeys, which dispatch cannot serve yet", () => {
        // `data` normalises a `[key, value]` tuple return into a single-pair record before
        // either delegate sees it; both fold with Object.entries, and dispatch has no hook
        // for the callback, so converting would turn a tuple into `{0: key, 1: value}`.

        it("still has delegates that mis-fold a [key, value] tuple", () => {
            // Standing control: convert dataMapWithKeys once both delegates fold a tuple
            // the way data does. arr rejects one outright; obj takes it and folds it wrong.
            // @ts-expect-error arr.mapWithKeys only folds a Record result.
            Arr.mapWithKeys(numberList, (value, index) => [`k${index}`, value]);
            expectTypeOf(
                Data.dataMapWithKeys(abc, (value, key) => [`k${key}`, value]),
            ).not.toEqualTypeOf(
                Obj.mapWithKeys(abc, (value, key) => [`k${key}`, value]),
            );
        });

        it("hands a Map's callback its values and the keys PHP stores, and files a pair under its key", () => {
            const byKey = Data.dataMapWithKeys(
                new Map([
                    [2, "c"],
                    [0, "a"],
                ]),
                (value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return [`k${key}`, value];
                },
            );

            // data folds the pair as a key and its value; obj would file it under 0 and 1.
            expectTypeOf(byKey).toEqualTypeOf<Record<`k${number}`, string>>();
            expectTypeOf(
                Data.dataMapWithKeys(numberMap, (value) => ["total", value]),
            ).toEqualTypeOf<Record<"total", number>>();
        });

        it("answers a Map's record callback as obj.mapWithKeys does", () => {
            const toRecord = (value: number, key: string | number) => ({
                [`k${String(key)}`]: value,
            });

            expectTypeOf(
                Data.dataMapWithKeys(numberMap, toRecord),
            ).toEqualTypeOf(Obj.mapWithKeys(numberMap, toRecord));
        });

        it("hands a union of Maps' callback its members' values and keys", () => {
            const maps = new Map([["a", 1]]) as
                | Map<string, number>
                | Map<boolean, string>;

            Data.dataMapWithKeys(maps, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number | string>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return [String(key), value];
            });
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        // Every other fixture here is a concrete literal; the union is the package's own
        // declared input type, and matches none of arr's array-shaped rows.

        it("takes only an unknown-typed callback on dataMap", () => {
            // @ts-expect-error obj's typed row resolves `ObjectValue<union>` to `never`,
            // so a concretely typed callback no longer fits the union it used to infer from.
            Data.dataMap(unionItems, double);
            const declared = Data.dataMap(unionItems, widenedDouble);
            expectTypeOf(declared).toEqualTypeOf(
                Obj.map(unionItems, widenedDouble),
            );
        });

        it("takes only an unknown-typed callback on dataFilter", () => {
            // @ts-expect-error same as dataMap: the union reaches obj's widest row only.
            Data.dataFilter(unionItems, aboveOne);
            const declared = Data.dataFilter(unionItems, widenedAboveOne);
            expectTypeOf(declared).toEqualTypeOf(
                Obj.filter(unionItems, widenedAboveOne),
            );
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row is inferred from the last of obj's overloads,
        // so a Map gets obj's widest row, not obj's own Map row.

        it("types a Map on dataMap from obj's widest row", () => {
            // The Map row resolves obj's last overload generically, so its mapped value
            // is `unknown`; an unknown-returning callback is what makes the two comparable.
            const widest = Obj.map(opaque, widenedIdentity);
            expectTypeOf(
                Data.dataMap(numberMap, widenedIdentity),
            ).toEqualTypeOf<typeof widest>();
            // Soundness is the point of the row, so assignability, not equality.
            expectTypeOf(
                Data.dataMap(numberMapAsRecord, widenedDouble),
            ).toExtend<typeof widest>();
        });

        it("types a Map on dataFilter from obj's widest row", () => {
            const widest = Obj.filter(opaque, widenedAboveOne);
            expectTypeOf(
                Data.dataFilter(numberMap, widenedAboveOne),
            ).toEqualTypeOf<typeof widest>();
            expectTypeOf(
                Data.dataFilter(numberMapAsRecord, widenedAboveOne),
            ).toExtend<typeof widest>();
        });

        it("types a Map on dataPartition from obj's widest row", () => {
            const widest = Obj.partition(opaque, widenedAboveOne);
            expectTypeOf(
                Data.dataPartition(numberMap, widenedAboveOne),
            ).toEqualTypeOf<typeof widest>();
            expectTypeOf(
                Data.dataPartition(numberMapAsRecord, widenedAboveOne),
            ).toExtend<typeof widest>();
        });

        it("types a Map on dataWhereNotNull from obj's widest row", () => {
            const widest = Obj.whereNotNull(opaque);
            expectTypeOf(Data.dataWhereNotNull(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataWhereNotNull(numberMapAsRecord)).toExtend<
                typeof widest
            >();
        });
    });

    describe("inputs a Record<PropertyKey, unknown> constraint would reject", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataMap(settings, double)).toEqualTypeOf(
                Obj.map(settings, double),
            );
            expectTypeOf(Data.dataFilter(settings, aboveOne)).toEqualTypeOf(
                Obj.filter(settings, aboveOne),
            );
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataWhere(box, aboveOne)).toEqualTypeOf(
                Obj.where(box, aboveOne),
            );
            expectTypeOf(Data.dataWhereNotNull(box)).toEqualTypeOf(
                Obj.whereNotNull(box),
            );
        });
    });
});
