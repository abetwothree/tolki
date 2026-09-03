import { collect, Collection } from "@tolki/collection";
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

    describe("chunkWhile / chunkBy", () => {
        // first()/last() take a default-type parameter that widens to `unknown` when omitted,
        // so assert on the outer collection type rather than on what first() returns.
        it("returns a collection of collections and types the callback", () => {
            const chunks = collect([1, 2, 3]).chunkWhile(
                (value, key, chunk) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();
                    expectTypeOf(chunk).toEqualTypeOf<
                        Collection<number, number>
                    >();

                    return true;
                },
            );

            expectTypeOf(chunks).toEqualTypeOf<
                Collection<Collection<number, number>, number>
            >();
        });

        it("accepts a key path or a callback for chunkBy", () => {
            const data = collect([{ parent: "a" }]);

            expectTypeOf(data.chunkBy("parent")).toEqualTypeOf<
                Collection<Collection<{ parent: string }, number>, number>
            >();
            expectTypeOf(data.chunkBy((value) => value.parent)).toEqualTypeOf<
                Collection<Collection<{ parent: string }, number>, number>
            >();
        });
    });
});
