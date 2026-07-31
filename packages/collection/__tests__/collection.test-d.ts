import { collect } from "@tolki/collection";
import { describe, expectTypeOf, it } from "vitest";

describe("collection type tests", () => {
    describe("select", () => {
        const data = collect([{ first: "Taylor", last: "Otwell" }]);

        it("accepts key names as arguments and as an array", () => {
            expectTypeOf(data.select("first")).not.toBeNever();
            expectTypeOf(data.select("first", "last")).not.toBeNever();
            expectTypeOf(data.select(["first", "last"])).not.toBeNever();
            expectTypeOf(data.select(null)).not.toBeNever();
        });

        it("accepts a numerically indexed collection of key names", () => {
            expectTypeOf(
                data.select(collect(["first", "last"])),
            ).not.toBeNever();
        });

        it("rejects a collection whose values are not key names", () => {
            // select() looks the keys up inside each item, so a collection of
            // keys is always a numerically indexed collection of key names.
            // @ts-expect-error - a collection of objects is not a list of keys
            data.select(collect([{ first: "Taylor" }]));
        });
    });
});
