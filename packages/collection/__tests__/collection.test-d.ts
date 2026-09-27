import { collect, Collection } from "@tolki/collection";
import { describe, expectTypeOf, it } from "vitest";

describe("collection type tests", () => {
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

    describe("reduce", () => {
        it("answers a nullable item type for reduce without an initial value", () => {
            // An empty backing hands back $initial, which defaults to null
            // (packages/collection/stubs/EnumeratesValues.php, reduce()).
            expectTypeOf(
                collect([1, 2, 3]).reduce((carry, value) => carry + value),
            ).toEqualTypeOf<number | null>();
        });
    });

    describe("sort / sortDesc / sortByMany", () => {
        it("types sort()'s callback as a comparator of two items", () => {
            collect([{ n: 1 }, { n: 2 }]).sort((a, b) => {
                expectTypeOf(a).toEqualTypeOf<{ n: number }>();
                expectTypeOf(b).toEqualTypeOf<{ n: number }>();

                return a.n - b.n;
            });
        });

        it("rejects the forms PHP rejects", () => {
            const numbers = collect([3, 1, 2]);

            // @ts-expect-error - sort() takes a comparator, never a path, which PHP's asort() refuses as a flag
            numbers.sort("n");
            // @ts-expect-error - sortDesc() takes no callback; sortByDesc() does
            numbers.sortDesc((value: number) => value);
            // @ts-expect-error - sortByMany() is protected, as PHP's is; sortBy([...]) reaches it
            numbers.sortByMany(["n"]);
        });
    });

    describe("zip", () => {
        it("requires the list to zip with, as PHP's zip($items) does", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for a zip() with no list
            collect([1, 2]).zip();
        });
    });

    describe("implode", () => {
        it("requires the value, as PHP's implode($value) does", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for an implode() with no value
            collect(["a", "b"]).implode();
        });
    });

    describe("when / unless", () => {
        it("require a callback, which PHP calls on the branch it takes", () => {
            // @ts-expect-error - PHP throws "Value of type null is not callable" for a null callback
            collect([1]).when(true, null);
            // @ts-expect-error - PHP's when() with one argument returns a higher-order proxy, which is not ported
            collect([1]).when(true);
            // @ts-expect-error - PHP throws "Value of type null is not callable" for a null callback
            collect([1]).unless(false, null);
            // @ts-expect-error - PHP's unless() with one argument returns a higher-order proxy, which is not ported
            collect([1]).unless(false);
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
