import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import { abc, booleanFlags, profile, unknownObject } from "./fixtures";

describe("obj output type tests", () => {
    describe("join", () => {
        it("returns string for typed, interface and unknown data", () => {
            expectTypeOf(Obj.join(abc, ", ")).toEqualTypeOf<string>();
            expectTypeOf(
                Obj.join(profile, ", ", " and "),
            ).toEqualTypeOf<string>();
            expectTypeOf(Obj.join(unknownObject, ",")).toEqualTypeOf<string>();
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
    });

    describe("query", () => {
        it("returns string for typed and unknown data", () => {
            expectTypeOf(
                Obj.query({ foo: "bar", bar: true }),
            ).toEqualTypeOf<string>();
            expectTypeOf(Obj.query(unknownObject)).toEqualTypeOf<string>();
        });
    });
});
