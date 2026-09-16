import * as Data from "@tolki/data";
import { describe, expectTypeOf, it } from "vitest";

import { abc, numberList, readonlyNumberList, rowsById } from "./fixtures";

describe("data search type tests", () => {
    describe("dataSearch", () => {
        it("returns the index or false for a list", () => {
            // JS-only: no Arr::search / Collection::search counterpart to pin against.
            expectTypeOf(Data.dataSearch(numberList, 2)).toEqualTypeOf<
                number | false
            >();
        });

        it("returns the literal key or false for a record", () => {
            // JS-only: as above.
            expectTypeOf(Data.dataSearch(abc, 2)).toEqualTypeOf<
                "a" | "b" | "c" | false
            >();
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
                "a" | "b" | "c" | false
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
});
