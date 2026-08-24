import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import { booleanFlags, readonlyStrings, unknownArray } from "./fixtures";

describe("arr output type tests", () => {
    describe("query", () => {
        it("returns string for a flat string array", () => {
            expectTypeOf(Arr.query(["a", "b", "c"])).toEqualTypeOf<string>();
        });

        it("returns string for a flat object", () => {
            expectTypeOf(
                Arr.query({ name: "John", age: 30 }),
            ).toEqualTypeOf<string>();
        });

        it("returns string for an object with an array-valued property", () => {
            expectTypeOf(
                Arr.query({ tags: ["php", "js"] }),
            ).toEqualTypeOf<string>();
        });

        it("returns string for an object with a nested object property", () => {
            expectTypeOf(
                Arr.query({ user: { name: "John", age: 30 } }),
            ).toEqualTypeOf<string>();
        });

        it("returns string for an empty array", () => {
            expectTypeOf(Arr.query([])).toEqualTypeOf<string>();
        });

        it("returns string for an empty object", () => {
            expectTypeOf(Arr.query({})).toEqualTypeOf<string>();
        });

        it("returns string for null", () => {
            expectTypeOf(Arr.query(null)).toEqualTypeOf<string>();
        });

        it("returns string for undefined", () => {
            expectTypeOf(Arr.query(undefined)).toEqualTypeOf<string>();
        });

        it("returns string for unknown data", () => {
            expectTypeOf(Arr.query(unknownArray)).toEqualTypeOf<string>();
        });

        it("returns string for a readonly string array", () => {
            expectTypeOf(Arr.query(readonlyStrings)).toEqualTypeOf<string>();
        });

        it("returns string for an array of differently-shaped objects", () => {
            expectTypeOf(
                Arr.query([{ a: 1 }, { b: 2 }]),
            ).toEqualTypeOf<string>();
        });

        it("returns string regardless of parameter arity", () => {
            expectTypeOf(Arr.query).returns.toEqualTypeOf<string>();
        });
    });

    describe("toCssClasses", () => {
        it("returns string for a flat string array", () => {
            expectTypeOf(
                Arr.toCssClasses(["font-bold", "mt-4"]),
            ).toEqualTypeOf<string>();
        });

        it("returns string for an array mixing string classes and a conditional map", () => {
            expectTypeOf(
                Arr.toCssClasses([
                    "font-bold",
                    { "ml-2": true, "mr-2": false },
                ]),
            ).toEqualTypeOf<string>();
        });

        it("returns string for a conditional map", () => {
            expectTypeOf(
                Arr.toCssClasses({ "font-bold": true, "text-red": false }),
            ).toEqualTypeOf<string>();
        });

        it("returns string for an empty array", () => {
            expectTypeOf(Arr.toCssClasses([])).toEqualTypeOf<string>();
        });

        it("returns string for an empty object", () => {
            expectTypeOf(Arr.toCssClasses({})).toEqualTypeOf<string>();
        });

        it("returns string for unknown data", () => {
            expectTypeOf(
                Arr.toCssClasses(unknownArray),
            ).toEqualTypeOf<string>();
        });

        it("returns string for a readonly string array", () => {
            expectTypeOf(
                Arr.toCssClasses(readonlyStrings),
            ).toEqualTypeOf<string>();
        });

        it("returns string for a Record<string, boolean>", () => {
            expectTypeOf(
                Arr.toCssClasses(booleanFlags),
            ).toEqualTypeOf<string>();
        });

        it("returns string regardless of parameter arity", () => {
            expectTypeOf(Arr.toCssClasses).returns.toEqualTypeOf<string>();
        });
    });

    describe("toCssStyles", () => {
        it("returns string for a flat string array", () => {
            expectTypeOf(
                Arr.toCssStyles(["font-weight: bold", "margin-top: 4px"]),
            ).toEqualTypeOf<string>();
        });

        it("returns string for a conditional map", () => {
            expectTypeOf(
                Arr.toCssStyles({
                    "font-weight: bold": true,
                    "color: red": false,
                }),
            ).toEqualTypeOf<string>();
        });

        it("returns string for an array mixing style strings and a conditional map", () => {
            expectTypeOf(
                Arr.toCssStyles(["color: red", { "margin: 0": true }]),
            ).toEqualTypeOf<string>();
        });

        it("returns string for an empty array", () => {
            expectTypeOf(Arr.toCssStyles([])).toEqualTypeOf<string>();
        });

        it("returns string for an empty object", () => {
            expectTypeOf(Arr.toCssStyles({})).toEqualTypeOf<string>();
        });

        it("returns string for unknown data", () => {
            expectTypeOf(Arr.toCssStyles(unknownArray)).toEqualTypeOf<string>();
        });

        it("returns string for a readonly string array", () => {
            expectTypeOf(
                Arr.toCssStyles(readonlyStrings),
            ).toEqualTypeOf<string>();
        });

        it("returns string for a Record<string, boolean>", () => {
            expectTypeOf(Arr.toCssStyles(booleanFlags)).toEqualTypeOf<string>();
        });

        it("returns string regardless of parameter arity", () => {
            expectTypeOf(Arr.toCssStyles).returns.toEqualTypeOf<string>();
        });
    });
});
