import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    booleanFlags,
    numberMap,
    profile,
    unknownObject,
} from "./fixtures";

describe("obj output type tests", () => {
    describe("join", () => {
        it("returns string for typed, interface and unknown data", () => {
            expectTypeOf(Obj.join(abc, ", ")).toEqualTypeOf<string>();
            expectTypeOf(
                Obj.join(profile, ", ", " and "),
            ).toEqualTypeOf<string>();
            expectTypeOf(Obj.join(unknownObject, ",")).toEqualTypeOf<string>();
        });

        it("still returns string for a Map", () => {
            // A control, not a guard: the Map row and the unknown row both answer `string`.
            expectTypeOf(
                Obj.join(new Map([[2, "c"]]), ", ", " and "),
            ).toEqualTypeOf<string>();
            expectTypeOf(Obj.join(numberMap, ",")).toEqualTypeOf<string>();
        });
    });

    describe("toCssClasses and toCssStyles", () => {
        it("return string for a boolean map, a mixed map and unknown data", () => {
            expectTypeOf(
                Obj.toCssClasses(booleanFlags),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                Obj.toCssClasses({ 0: "font-bold", "mt-4": true }),
            ).toEqualTypeOf<string>();
            expectTypeOf(Obj.toCssStyles(booleanFlags)).toEqualTypeOf<string>();
            expectTypeOf(
                Obj.toCssStyles(unknownObject),
            ).toEqualTypeOf<string>();
        });

        it("still return string for a Map of mixed keys", () => {
            // A control, not a guard: the Map row and the unknown row both answer `string`.
            const flags = new Map<string | number, string | boolean>([
                [2, "c2"],
                ["x", true],
            ]);

            expectTypeOf(Obj.toCssClasses(flags)).toEqualTypeOf<string>();
            expectTypeOf(Obj.toCssStyles(flags)).toEqualTypeOf<string>();
        });
    });

    describe("query", () => {
        it("returns string for typed and unknown data", () => {
            expectTypeOf(
                Obj.query({ foo: "bar", bar: true }),
            ).toEqualTypeOf<string>();
            expectTypeOf(Obj.query(unknownObject)).toEqualTypeOf<string>();
        });

        it("still returns string for a Map and for a record holding one", () => {
            // A control, not a guard: the Map row and the unknown row both answer `string`.
            expectTypeOf(
                Obj.query(new Map([[2, "c"]])),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                Obj.query({ u: new Map([[1, "p"]]), v: 1 }),
            ).toEqualTypeOf<string>();
        });
    });
});
