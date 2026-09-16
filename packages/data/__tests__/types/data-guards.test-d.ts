import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    booleanList,
    box,
    flags,
    names,
    nestedList,
    nestedRecord,
    numberList,
    numberMap,
    numberMapAsRecord,
    opaque,
    readonlyNumberList,
    settings,
    stringList,
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

    describe("dataItem", () => {
        it("matches arr.arrayItem for a list", () => {
            expectTypeOf(Data.dataItem(nestedList, 0)).toEqualTypeOf(
                Arr.arrayItem(nestedList, 0),
            );
        });

        it("matches obj.objectItem for a record", () => {
            expectTypeOf(Data.dataItem(nestedRecord, "a")).toEqualTypeOf(
                Obj.objectItem(nestedRecord, "a"),
            );
        });

        it("matches arr.arrayItem for a read-only list", () => {
            expectTypeOf(Data.dataItem(readonlyNumberList, 0)).toEqualTypeOf(
                Arr.arrayItem(readonlyNumberList, 0),
            );
        });

        it("matches obj.objectItem for data no shape can be read off", () => {
            expectTypeOf(Data.dataItem(opaque, "a")).toEqualTypeOf(
                Obj.objectItem(opaque, "a"),
            );
        });

        it("keeps a record off arr's rows", () => {
            // Standing control for the Part B tightening this conversion needed: arr must
            // stay ineligible for a record, or dispatch answers `unknown[]` again.
            // @ts-expect-error - arr's rows are array-shaped; a record belongs to obj.
            Arr.arrayItem(nestedRecord, "a");
        });
    });

    describe("dataBoolean", () => {
        it("matches arr.boolean for a list", () => {
            expectTypeOf(Data.dataBoolean(booleanList, 0)).toEqualTypeOf(
                Arr.boolean(booleanList, 0),
            );
        });

        it("matches obj.boolean for a record", () => {
            expectTypeOf(Data.dataBoolean(flags, "on")).toEqualTypeOf(
                Obj.boolean(flags, "on"),
            );
        });

        it("matches obj.boolean for data no shape can be read off", () => {
            expectTypeOf(Data.dataBoolean(opaque, "on")).toEqualTypeOf(
                Obj.boolean(opaque, "on"),
            );
        });

        it("matches arr.boolean for a read-only list", () => {
            expectTypeOf(Data.dataBoolean(readonlyNumberList, 0)).toEqualTypeOf(
                Arr.boolean(readonlyNumberList, 0),
            );
        });

        it("answers boolean whichever backing wins", () => {
            // Both delegates return a bare `boolean`, so no pin above can tell them
            // apart; this row is the one that fails if either delegate's return changes.
            expectTypeOf(
                Data.dataBoolean(booleanList, 0),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("dataFloat", () => {
        it("matches arr.float for a list", () => {
            expectTypeOf(Data.dataFloat(numberList, 0)).toEqualTypeOf(
                Arr.float(numberList, 0),
            );
        });

        it("matches obj.float for a record", () => {
            expectTypeOf(Data.dataFloat(abc, "a")).toEqualTypeOf(
                Obj.float(abc, "a"),
            );
        });

        it("matches obj.float for data no shape can be read off", () => {
            expectTypeOf(Data.dataFloat(opaque, "a")).toEqualTypeOf(
                Obj.float(opaque, "a"),
            );
        });

        it("matches arr.float for a read-only list", () => {
            expectTypeOf(Data.dataFloat(readonlyNumberList, 0)).toEqualTypeOf(
                Arr.float(readonlyNumberList, 0),
            );
        });

        it("answers number whichever backing wins", () => {
            // Both delegates return a bare `number`, so no pin above can tell them apart.
            expectTypeOf(Data.dataFloat(numberList, 0)).toEqualTypeOf<number>();
        });
    });

    describe("dataInteger", () => {
        it("matches arr.integer for a list", () => {
            expectTypeOf(Data.dataInteger(numberList, 0)).toEqualTypeOf(
                Arr.integer(numberList, 0),
            );
        });

        it("matches obj.integer for a record", () => {
            expectTypeOf(Data.dataInteger(abc, "a")).toEqualTypeOf(
                Obj.integer(abc, "a"),
            );
        });

        it("matches obj.integer for data no shape can be read off", () => {
            expectTypeOf(Data.dataInteger(opaque, "a")).toEqualTypeOf(
                Obj.integer(opaque, "a"),
            );
        });

        it("matches arr.integer for a read-only list", () => {
            expectTypeOf(Data.dataInteger(readonlyNumberList, 0)).toEqualTypeOf(
                Arr.integer(readonlyNumberList, 0),
            );
        });

        it("answers number whichever backing wins", () => {
            // Both delegates return a bare `number`, so no pin above can tell them apart.
            expectTypeOf(
                Data.dataInteger(numberList, 0),
            ).toEqualTypeOf<number>();
        });
    });

    describe("dataString", () => {
        it("matches arr.string for a list", () => {
            expectTypeOf(Data.dataString(stringList, 0)).toEqualTypeOf(
                Arr.string(stringList, 0),
            );
        });

        it("matches obj.string for a record", () => {
            expectTypeOf(Data.dataString(names, "first")).toEqualTypeOf(
                Obj.string(names, "first"),
            );
        });

        it("matches obj.string for data no shape can be read off", () => {
            expectTypeOf(Data.dataString(opaque, "first")).toEqualTypeOf(
                Obj.string(opaque, "first"),
            );
        });

        it("matches arr.string for a read-only list", () => {
            expectTypeOf(Data.dataString(readonlyNumberList, 0)).toEqualTypeOf(
                Arr.string(readonlyNumberList, 0),
            );
        });

        it("answers string whichever backing wins", () => {
            // Both delegates return a bare `string`, so no pin above can tell them apart.
            expectTypeOf(
                Data.dataString(stringList, 0),
            ).toEqualTypeOf<string>();
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        // A union matches none of arr's array-shaped rows, so obj's widest row wins.

        it("routes the union to obj's widest row on dataExists", () => {
            expectTypeOf(Data.dataExists(unionItems, "a")).toEqualTypeOf(
                Obj.exists(opaque, "a"),
            );
        });

        it("routes the union to obj's widest row on dataItem", () => {
            const widest = Obj.objectItem(opaque, "a");
            expectTypeOf(Data.dataItem(unionItems, "a")).toEqualTypeOf(widest);
            // Standing control: obj's `Record<string, unknown>` does NOT cover the list a
            // list backing really returns, so the union's declared answer is unsound here.
            expectTypeOf(Arr.arrayItem(nestedList, 0)).not.toExtend<
                typeof widest
            >();
        });

        it("routes the union to obj's widest row on dataBoolean", () => {
            expectTypeOf(Data.dataBoolean(unionItems, "a")).toEqualTypeOf(
                Obj.boolean(opaque, "a"),
            );
        });

        it("routes the union to obj's widest row on dataFloat", () => {
            expectTypeOf(Data.dataFloat(unionItems, "a")).toEqualTypeOf(
                Obj.float(opaque, "a"),
            );
        });

        it("routes the union to obj's widest row on dataInteger", () => {
            expectTypeOf(Data.dataInteger(unionItems, "a")).toEqualTypeOf(
                Obj.integer(opaque, "a"),
            );
        });

        it("routes the union to obj's widest row on dataString", () => {
            expectTypeOf(Data.dataString(unionItems, "a")).toEqualTypeOf(
                Obj.string(opaque, "a"),
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

        it("types a Map on dataItem from obj's widest row", () => {
            const widest = Obj.objectItem(opaque, "a");
            expectTypeOf(Data.dataItem(numberMap, "a")).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataItem(numberMapAsRecord, "a")).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataBoolean from obj's widest row", () => {
            const widest = Obj.boolean(opaque, "a");
            expectTypeOf(Data.dataBoolean(numberMap, "a")).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataBoolean(numberMapAsRecord, "a")).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataFloat from obj's widest row", () => {
            const widest = Obj.float(opaque, "a");
            expectTypeOf(Data.dataFloat(numberMap, "a")).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataFloat(numberMapAsRecord, "a")).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataInteger from obj's widest row", () => {
            const widest = Obj.integer(opaque, "a");
            expectTypeOf(Data.dataInteger(numberMap, "a")).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataInteger(numberMapAsRecord, "a")).toExtend<
                typeof widest
            >();
        });

        it("types a Map on dataString from obj's widest row", () => {
            const widest = Obj.string(opaque, "a");
            expectTypeOf(Data.dataString(numberMap, "a")).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataString(numberMapAsRecord, "a")).toExtend<
                typeof widest
            >();
        });
    });

    describe("inputs a Record<PropertyKey, unknown> constraint would reject", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataExists(settings, "a")).toEqualTypeOf(
                Obj.exists(settings, "a"),
            );
            expectTypeOf(Data.dataItem(settings, "a")).toEqualTypeOf(
                Obj.objectItem(settings, "a"),
            );
            expectTypeOf(Data.dataBoolean(settings, "a")).toEqualTypeOf(
                Obj.boolean(settings, "a"),
            );
            expectTypeOf(Data.dataFloat(settings, "a")).toEqualTypeOf(
                Obj.float(settings, "a"),
            );
            expectTypeOf(Data.dataInteger(settings, "a")).toEqualTypeOf(
                Obj.integer(settings, "a"),
            );
            expectTypeOf(Data.dataString(settings, "a")).toEqualTypeOf(
                Obj.string(settings, "a"),
            );
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataExists(box, "a")).toEqualTypeOf(
                Obj.exists(box, "a"),
            );
            expectTypeOf(Data.dataItem(box, "a")).toEqualTypeOf(
                Obj.objectItem(box, "a"),
            );
            expectTypeOf(Data.dataBoolean(box, "a")).toEqualTypeOf(
                Obj.boolean(box, "a"),
            );
            expectTypeOf(Data.dataFloat(box, "a")).toEqualTypeOf(
                Obj.float(box, "a"),
            );
            expectTypeOf(Data.dataInteger(box, "a")).toEqualTypeOf(
                Obj.integer(box, "a"),
            );
            expectTypeOf(Data.dataString(box, "a")).toEqualTypeOf(
                Obj.string(box, "a"),
            );
        });
    });
});
