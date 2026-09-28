import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import { profile, unknownObject, user } from "./fixtures";

describe("obj guard type tests", () => {
    describe("objectItem", () => {
        it("resolves the object at a literal path", () => {
            expectTypeOf(Obj.objectItem(user, "address")).toEqualTypeOf<{
                city: string;
                zip: number;
            }>();
        });

        it("keeps the object member of a nullable property", () => {
            expectTypeOf(Obj.objectItem(profile, "boss")).toEqualTypeOf<{
                name: string;
            }>();
        });

        it("falls back to a loose record for a non-object path", () => {
            expectTypeOf(Obj.objectItem(user, "name")).toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("keeps only the reachable object for a widened path, and falls back for unknown data", () => {
            const key: string = "address";

            expectTypeOf(Obj.objectItem(user, key)).toEqualTypeOf<{
                city: string;
                zip: number;
            }>();
            expectTypeOf(Obj.objectItem(unknownObject, "a")).toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("takes an object default for a missing path", () => {
            expectTypeOf(
                Obj.objectItem(user, "missing", { fallback: true }),
            ).toEqualTypeOf<{ fallback: boolean }>();
        });
    });

    describe("boolean", () => {
        it("returns boolean for typed and unknown data", () => {
            expectTypeOf(
                Obj.boolean({ active: true }, "active"),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Obj.boolean(unknownObject, "active"),
            ).toEqualTypeOf<boolean>();
        });

        it("accepts a boolean or closure default", () => {
            expectTypeOf(
                Obj.boolean({}, "missing", false),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Obj.boolean({}, "missing", () => true),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("float", () => {
        it("returns number for typed and unknown data", () => {
            expectTypeOf(
                Obj.float({ price: 19.99 }, "price"),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                Obj.float(unknownObject, "price", 0),
            ).toEqualTypeOf<number>();
        });
    });

    describe("integer", () => {
        it("returns number for typed and unknown data", () => {
            expectTypeOf(Obj.integer(user, "age")).toEqualTypeOf<number>();
            expectTypeOf(
                Obj.integer(unknownObject, "age", () => 1),
            ).toEqualTypeOf<number>();
        });
    });

    describe("string", () => {
        it("returns string for typed and unknown data", () => {
            expectTypeOf(Obj.string(user, "name")).toEqualTypeOf<string>();
            expectTypeOf(
                Obj.string(unknownObject, "name", "fallback"),
            ).toEqualTypeOf<string>();
        });
    });
});
