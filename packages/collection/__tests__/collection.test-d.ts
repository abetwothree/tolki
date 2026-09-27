import { collect } from "@tolki/collection";
import { describe, expectTypeOf, it } from "vitest";

describe("collection type tests", () => {
    describe("reduce", () => {
        it("answers a nullable item type for reduce without an initial value", () => {
            // An empty backing hands back $initial, which defaults to null
            // (packages/collection/stubs/EnumeratesValues.php, reduce()).
            expectTypeOf(
                collect([1, 2, 3]).reduce((carry, value) => carry + value),
            ).toEqualTypeOf<number | null>();
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
