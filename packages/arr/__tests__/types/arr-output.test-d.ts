import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import { booleanFlags, readonlyStrings, unknownArray } from "./fixtures";

describe("arr output type tests", () => {
    describe("query", () => {
        it("returns string for a flat string array", () => {
            expectTypeOf(Arr.query(["a", "b", "c"])).toEqualTypeOf<string>();
        });

        it("rejects a plain object, which belongs to obj/data", () => {
            // @ts-expect-error - arr's rows are array-shaped so dispatch can route keyed data to obj.
            Arr.query({ name: "John", age: 30 });
            // @ts-expect-error - arr's rows are array-shaped so dispatch can route keyed data to obj.
            Arr.query({ tags: ["php", "js"] });
            // @ts-expect-error - arr's rows are array-shaped so dispatch can route keyed data to obj.
            Arr.query({});
        });

        it("returns string for an array of objects", () => {
            expectTypeOf(
                Arr.query([{ user: { name: "John", age: 30 } }]),
            ).toEqualTypeOf<string>();
        });

        it("returns string for an empty array", () => {
            expectTypeOf(Arr.query([])).toEqualTypeOf<string>();
        });

        it("returns string for null", () => {
            expectTypeOf(Arr.query(null)).toEqualTypeOf<string>();
        });

        it("returns string for undefined", () => {
            expectTypeOf(Arr.query(undefined)).toEqualTypeOf<string>();
        });

        it("rejects unknown data and returns string once narrowed", () => {
            // @ts-expect-error - arr's rows are array-shaped; bare `unknown` belongs to obj/data.
            Arr.query(unknownArray);
            expectTypeOf(
                Arr.query(unknownArray as unknown[]),
            ).toEqualTypeOf<string>();
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

        it("rejects a bare conditional map, which belongs to obj/data", () => {
            // @ts-expect-error - arr's rows are array-shaped so dispatch can route keyed data to obj.
            Arr.toCssClasses({ "font-bold": true, "text-red": false });
            // @ts-expect-error - arr's rows are array-shaped so dispatch can route keyed data to obj.
            Arr.toCssClasses({});
        });

        it("returns string for an empty array", () => {
            expectTypeOf(Arr.toCssClasses([])).toEqualTypeOf<string>();
        });

        it("rejects unknown data and returns string once narrowed", () => {
            // @ts-expect-error - arr's rows are array-shaped; bare `unknown` belongs to obj/data.
            Arr.toCssClasses(unknownArray);
            expectTypeOf(
                Arr.toCssClasses(unknownArray as unknown[]),
            ).toEqualTypeOf<string>();
        });

        it("returns string for a readonly string array", () => {
            expectTypeOf(
                Arr.toCssClasses(readonlyStrings),
            ).toEqualTypeOf<string>();
        });

        it("rejects a Record<string, boolean>", () => {
            // @ts-expect-error - arr's rows are array-shaped so dispatch can route keyed data to obj.
            Arr.toCssClasses(booleanFlags);
            expectTypeOf(
                Arr.toCssClasses([booleanFlags]),
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

        it("rejects a bare conditional map, which belongs to obj/data", () => {
            const styleMap = {
                "font-weight: bold": true,
                "color: red": false,
            };
            // @ts-expect-error - arr's rows are array-shaped so dispatch can route keyed data to obj.
            Arr.toCssStyles(styleMap);
            // @ts-expect-error - arr's rows are array-shaped so dispatch can route keyed data to obj.
            Arr.toCssStyles({});
        });

        it("returns string for an array mixing style strings and a conditional map", () => {
            expectTypeOf(
                Arr.toCssStyles(["color: red", { "margin: 0": true }]),
            ).toEqualTypeOf<string>();
        });

        it("returns string for an empty array", () => {
            expectTypeOf(Arr.toCssStyles([])).toEqualTypeOf<string>();
        });

        it("rejects unknown data and returns string once narrowed", () => {
            // @ts-expect-error - arr's rows are array-shaped; bare `unknown` belongs to obj/data.
            Arr.toCssStyles(unknownArray);
            expectTypeOf(
                Arr.toCssStyles(unknownArray as unknown[]),
            ).toEqualTypeOf<string>();
        });

        it("returns string for a readonly string array", () => {
            expectTypeOf(
                Arr.toCssStyles(readonlyStrings),
            ).toEqualTypeOf<string>();
        });

        it("rejects a Record<string, boolean>", () => {
            // @ts-expect-error - arr's rows are array-shaped so dispatch can route keyed data to obj.
            Arr.toCssStyles(booleanFlags);
            expectTypeOf(
                Arr.toCssStyles([booleanFlags]),
            ).toEqualTypeOf<string>();
        });

        it("returns string regardless of parameter arity", () => {
            expectTypeOf(Arr.toCssStyles).returns.toEqualTypeOf<string>();
        });
    });
});
