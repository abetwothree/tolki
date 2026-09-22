import * as Path from "@tolki/path";
import type { UndotObjectValue, UndotValue } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

/** A Map with dotted string keys, which each expansion reads in its insertion order. */
const dottedMap = new Map([
    ["a.b", 1],
    ["c", 2],
]);

/** Two differently typed Maps in one union, which the Map rows read as their members combined. */
const mapUnion = dottedMap as Map<string, number> | Map<number, string>;

describe("path undot type tests", () => {
    describe("undotExpandObject", () => {
        it("keeps a record's own keys and values", () => {
            expectTypeOf(Path.undotExpandObject({ "a.b": 1 })).toEqualTypeOf<{
                "a.b": number;
            }>();
        });

        it("types a Map as what its values nest into, as obj.undot's Map row does", () => {
            // Not a record keyed by the Map's own members, such as `size` and `get`.
            expectTypeOf(Path.undotExpandObject(dottedMap)).toEqualTypeOf<
                Record<string, UndotObjectValue<number>>
            >();
        });

        it("reads a union of Maps as its members' values combined", () => {
            expectTypeOf(Path.undotExpandObject(mapUnion)).toEqualTypeOf<
                Record<string, UndotObjectValue<number | string>>
            >();
        });
    });

    describe("undotExpandArray", () => {
        it("keeps a record's value type", () => {
            expectTypeOf(Path.undotExpandArray({ "0": "a" })).toEqualTypeOf<
                string[]
            >();
        });

        it("types a Map as a list its values may nest in, since a string key may be a dotted path", () => {
            expectTypeOf(Path.undotExpandArray(dottedMap)).toEqualTypeOf<
                UndotValue<number>[]
            >();
            expectTypeOf(Path.undotExpandArray(mapUnion)).toEqualTypeOf<
                UndotValue<number | string>[]
            >();
        });
    });

    describe("undotExpand", () => {
        it("answers either shape for a record", () => {
            expectTypeOf(Path.undotExpand({ "a.b": 1 })).toEqualTypeOf<
                number[] | Record<"a.b", number>
            >();
        });

        it("answers undotExpandObject's Map type for a Map, which takes the object branch", () => {
            expectTypeOf(Path.undotExpand(dottedMap)).toEqualTypeOf(
                Path.undotExpandObject(dottedMap),
            );
        });
    });
});
