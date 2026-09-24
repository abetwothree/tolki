import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    box,
    flags,
    numberList,
    numberMap,
    numberMapAsRecord,
    opaque,
    readonlyNumberList,
    settings,
    stringList,
    unionItems,
} from "./fixtures";

describe("data output type tests", () => {
    // Every function here answers `string` on both backings, so a return-type pin cannot
    // discriminate which delegate ran. The gate is the PARAMETER side: each row below is an
    // input `DataItems<TValue, TKey>` rejects, so the delegate pin is what makes it compile.

    describe("dataJoin", () => {
        it("matches arr.join for a list", () => {
            expectTypeOf(Data.dataJoin(numberList, ", ")).toEqualTypeOf(
                Arr.join(numberList, ", "),
            );
        });

        it("matches obj.join for a record", () => {
            expectTypeOf(Data.dataJoin(abc, ", ")).toEqualTypeOf(
                Obj.join(abc, ", "),
            );
        });

        it("matches each backing given a final glue", () => {
            expectTypeOf(
                Data.dataJoin(stringList, ", ", " and "),
            ).toEqualTypeOf(Arr.join(stringList, ", ", " and "));
            expectTypeOf(Data.dataJoin(abc, ", ", " and ")).toEqualTypeOf(
                Obj.join(abc, ", ", " and "),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(Data.dataJoin(readonlyNumberList, ", ")).toEqualTypeOf(
                Arr.join(readonlyNumberList, ", "),
            );
        });

        it("takes data no shape can be read off, which DataItems rejects", () => {
            expectTypeOf(Data.dataJoin(opaque, ", ")).toEqualTypeOf(
                Obj.join(opaque, ", "),
            );
        });
    });

    describe("dataToCssClasses", () => {
        it("matches arr.toCssClasses for a list", () => {
            expectTypeOf(Data.dataToCssClasses(stringList)).toEqualTypeOf(
                Arr.toCssClasses(stringList),
            );
        });

        it("matches obj.toCssClasses for a record", () => {
            expectTypeOf(Data.dataToCssClasses(flags)).toEqualTypeOf(
                Obj.toCssClasses(flags),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(
                Data.dataToCssClasses(readonlyNumberList),
            ).toEqualTypeOf(Arr.toCssClasses(readonlyNumberList));
        });

        it("takes data no shape can be read off, which DataItems rejects", () => {
            expectTypeOf(Data.dataToCssClasses(opaque)).toEqualTypeOf(
                Obj.toCssClasses(opaque),
            );
        });
    });

    describe("dataToCssStyles", () => {
        it("matches arr.toCssStyles for a list", () => {
            expectTypeOf(Data.dataToCssStyles(stringList)).toEqualTypeOf(
                Arr.toCssStyles(stringList),
            );
        });

        it("matches obj.toCssStyles for a record", () => {
            expectTypeOf(Data.dataToCssStyles(flags)).toEqualTypeOf(
                Obj.toCssStyles(flags),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(
                Data.dataToCssStyles(readonlyNumberList),
            ).toEqualTypeOf(Arr.toCssStyles(readonlyNumberList));
        });

        it("takes data no shape can be read off, which DataItems rejects", () => {
            expectTypeOf(Data.dataToCssStyles(opaque)).toEqualTypeOf(
                Obj.toCssStyles(opaque),
            );
        });
    });

    describe("dataQuery", () => {
        it("matches arr.query for a list", () => {
            expectTypeOf(Data.dataQuery(numberList)).toEqualTypeOf(
                Arr.query(numberList),
            );
        });

        it("matches obj.query for a record", () => {
            expectTypeOf(Data.dataQuery(abc)).toEqualTypeOf(Obj.query(abc));
        });

        it("takes a read-only list", () => {
            expectTypeOf(Data.dataQuery(readonlyNumberList)).toEqualTypeOf(
                Arr.query(readonlyNumberList),
            );
        });

        it("takes data no shape can be read off, which DataItems rejects", () => {
            expectTypeOf(Data.dataQuery(opaque)).toEqualTypeOf(
                Obj.query(opaque),
            );
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        it("answers every output function from obj, all four as string", () => {
            expectTypeOf(Data.dataJoin(unionItems, ", ")).toEqualTypeOf(
                Obj.join(unionItems, ", "),
            );
            expectTypeOf(Data.dataToCssClasses(unionItems)).toEqualTypeOf(
                Obj.toCssClasses(unionItems),
            );
            expectTypeOf(Data.dataToCssStyles(unionItems)).toEqualTypeOf(
                Obj.toCssStyles(unionItems),
            );
            expectTypeOf(Data.dataQuery(unionItems)).toEqualTypeOf(
                Obj.query(unionItems),
            );
            // Explicit, because both backings answer `string`: the pins above cannot
            // discriminate, so this row records what the union really resolves to.
            expectTypeOf(Data.dataQuery(unionItems)).toEqualTypeOf<string>();
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map; obj's widest row answers `string` for all four.

        it("types a Map on every output function from obj's widest row", () => {
            const joined = Obj.join(opaque, ", ");
            expectTypeOf(Data.dataJoin(numberMap, ", ")).toEqualTypeOf<
                typeof joined
            >();
            expectTypeOf(Data.dataJoin(numberMapAsRecord, ", ")).toExtend<
                typeof joined
            >();

            const classes = Obj.toCssClasses(opaque);
            expectTypeOf(Data.dataToCssClasses(numberMap)).toEqualTypeOf<
                typeof classes
            >();

            const styles = Obj.toCssStyles(opaque);
            expectTypeOf(Data.dataToCssStyles(numberMap)).toEqualTypeOf<
                typeof styles
            >();

            const queried = Obj.query(opaque);
            expectTypeOf(Data.dataQuery(numberMap)).toEqualTypeOf<
                typeof queried
            >();
        });
    });

    describe("inputs a Record<PropertyKey, unknown> constraint would reject", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataJoin(settings, ", ")).toEqualTypeOf(
                Obj.join(settings, ", "),
            );
            expectTypeOf(Data.dataToCssClasses(settings)).toEqualTypeOf(
                Obj.toCssClasses(settings),
            );
            expectTypeOf(Data.dataToCssStyles(settings)).toEqualTypeOf(
                Obj.toCssStyles(settings),
            );
            expectTypeOf(Data.dataQuery(settings)).toEqualTypeOf(
                Obj.query(settings),
            );
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataJoin(box, ", ")).toEqualTypeOf(
                Obj.join(box, ", "),
            );
            expectTypeOf(Data.dataQuery(box)).toEqualTypeOf(Obj.query(box));
        });
    });
});
