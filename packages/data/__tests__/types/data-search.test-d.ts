import * as Data from "@tolki/data";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    numberList,
    readonlyNumberList,
    rowsById,
    unionItems,
} from "./fixtures";

/** A record whose keys survive `phpArrayKey` differently: "10" becomes 10, "foo" does not. */
const numericKeyedRecord = { "10": "x", foo: "y" };

describe("data search type tests", () => {
    describe("dataSearch", () => {
        it("returns the index or false for a list", () => {
            // JS-only: no Arr::search / Collection::search counterpart to pin against.
            expectTypeOf(Data.dataSearch(numberList, 2)).toEqualTypeOf<
                number | false
            >();
        });

        it("returns the literal key, an index or false for a record", () => {
            // JS-only: `phpArrayKey` turns a canonical integer-string key into a number, so the
            // record row answers an index too, exactly as the list and union rows do.
            expectTypeOf(Data.dataSearch(abc, 2)).toEqualTypeOf<
                "a" | "b" | "c" | number | false
            >();
        });

        it("answers a numeric-string-keyed record with a number", () => {
            // JS-only: the runtime answers 10 for { "10": "x" }, not "10", so a row without
            // `number` would be unsound. That is the whole reason the row is this wide.
            expectTypeOf(
                Data.dataSearch(numericKeyedRecord, "x"),
            ).toEqualTypeOf<"10" | "foo" | number | false>();
        });

        it("infers the callback's value and key", () => {
            // JS-only: pins that the callback is not widened to unknown.
            Data.dataSearch(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("hands a list callback a numeric key", () => {
            // JS-only: the list row's key is the index, not the record's key union.
            Data.dataSearch(numberList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value > 1;
            });
        });

        it("keeps its answer under strict comparison", () => {
            // JS-only: the strict flag must not change the key type.
            expectTypeOf(Data.dataSearch(numberList, 2, true)).toEqualTypeOf<
                number | false
            >();
            expectTypeOf(Data.dataSearch(abc, 2, true)).toEqualTypeOf<
                "a" | "b" | "c" | number | false
            >();
        });

        it("takes a read-only list", () => {
            // JS-only: a readonly backing is only ever read here.
            expectTypeOf(Data.dataSearch(readonlyNumberList, 2)).toEqualTypeOf<
                number | false
            >();
        });

        it("reads a record of rows without widening the row type", () => {
            // JS-only: the value the callback sees must stay the row, not unknown.
            Data.dataSearch(rowsById, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<(typeof rowsById)["r1"]>();
                expectTypeOf(key).toEqualTypeOf<"r1" | "r2">();

                return value.id > 1;
            });
        });
    });

    describe("dataBefore", () => {
        it("returns the value or null for either backing", () => {
            // JS-only: no PHP counterpart.
            expectTypeOf(Data.dataBefore(numberList, 2)).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(Data.dataBefore(abc, 2)).toEqualTypeOf<
                number | null
            >();
        });

        it("infers each backing's callback value and key", () => {
            // JS-only: as above.
            Data.dataBefore(numberList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value > 1;
            });
            Data.dataBefore(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("takes a read-only list", () => {
            // JS-only: as above.
            expectTypeOf(Data.dataBefore(readonlyNumberList, 2)).toEqualTypeOf<
                number | null
            >();
        });
    });

    describe("dataAfter", () => {
        it("returns the value or null for either backing", () => {
            // JS-only: no PHP counterpart.
            expectTypeOf(Data.dataAfter(numberList, 2)).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(Data.dataAfter(abc, 2)).toEqualTypeOf<number | null>();
        });

        it("infers each backing's callback value and key", () => {
            // JS-only: as above.
            Data.dataAfter(numberList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value > 1;
            });
            Data.dataAfter(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("keeps the row type on a record of rows", () => {
            // JS-only: as above.
            expectTypeOf(Data.dataAfter(rowsById, rowsById.r1)).toEqualTypeOf<
                (typeof rowsById)["r1"] | null
            >();
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        // No delegate exists for these three, so the expected types are written out; the
        // rows exist because per-shape overloads alone turned the union away with TS2769.

        it("answers dataSearch with either half's key", () => {
            // JS-only: the record half answers TKey, the list half its index.
            expectTypeOf(Data.dataSearch(unionItems, 2)).toEqualTypeOf<
                string | number | false
            >();
        });

        it("answers dataBefore and dataAfter with the value", () => {
            // JS-only: both halves hold the same value type, so the key shape drops out.
            expectTypeOf(Data.dataBefore(unionItems, 2)).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(Data.dataAfter(unionItems, 2)).toEqualTypeOf<
                number | null
            >();
        });
    });
});
