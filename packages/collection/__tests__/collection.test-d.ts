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

    describe("firstOrFail / reduce", () => {
        it("answers the item type for firstOrFail, never a nullable one", () => {
            // It throws instead of returning a default, so neither the Symbol sentinel it
            // seeds first() with nor first()'s own `| null` belongs in the declared return.
            expectTypeOf(
                collect([1, 2, 3]).firstOrFail(),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                collect({ a: "x" }).firstOrFail(),
            ).toEqualTypeOf<string>();
        });

        it("answers a nullable item type for reduce without an initial value", () => {
            // An empty backing hands back $initial, which defaults to null
            // (packages/collection/stubs/EnumeratesValues.php, reduce()).
            expectTypeOf(
                collect([1, 2, 3]).reduce((carry, value) => carry + value),
            ).toEqualTypeOf<number | null>();
        });
    });

    describe("mode", () => {
        it("answers the PHP array keys the values were counted under, or null", () => {
            expectTypeOf(collect([1, 2, 2]).mode()).toEqualTypeOf<Array<
                string | number
            > | null>();
            expectTypeOf(
                collect([{ foo: "a" }, { foo: null }]).mode("foo"),
            ).toEqualTypeOf<Array<string | number> | null>();
        });
    });
});
