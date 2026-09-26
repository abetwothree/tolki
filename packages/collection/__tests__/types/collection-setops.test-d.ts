import { collect, Collection } from "@tolki/collection";
import { describe, expectTypeOf, it } from "vitest";

declare const strings: Collection<string, "a">;

describe("collection set operation type tests", () => {
    const list = collect([1, 2, 3]);
    const record = collect({ a: 1, b: 2 });
    const rows = collect([{ id: 1, name: "Taylor" }]);

    describe("diff", () => {
        it("takes a collection of another value and key type", () => {
            expectTypeOf(list.diff(strings)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("takes a Map", () => {
            expectTypeOf(list.diff(new Map([["k", 1]]))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.diff(2);
        });
    });

    describe("diffUsing", () => {
        it("types the callback's second value as the operand's, not the item's", () => {
            rows.diffUsing([{ id: 1 }], (a, b) => {
                expectTypeOf(a).toEqualTypeOf<{ id: number; name: string }>();
                expectTypeOf(b).toEqualTypeOf<{ id: number }>();

                return a.id === b.id;
            });
        });
    });

    describe("diffAssoc", () => {
        it("takes null, which PHP reads as no items", () => {
            expectTypeOf(record.diffAssoc(null)).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
        });
    });

    describe("diffKeys", () => {
        it("takes null, which PHP reads as no items", () => {
            expectTypeOf(record.diffKeys(null)).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
        });
    });

    describe("intersect", () => {
        it("takes undefined, which is read as null", () => {
            expectTypeOf(list.intersect(undefined)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.intersect(2);
        });
    });

    describe("intersectUsing", () => {
        it("types the callback's second value as the operand's, not the item's", () => {
            rows.intersectUsing([{ id: 1 }], (a, b) => {
                expectTypeOf(a).toEqualTypeOf<{ id: number; name: string }>();
                expectTypeOf(b).toEqualTypeOf<{ id: number }>();

                return a.id === b.id;
            });
        });
    });

    describe("merge", () => {
        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.merge(1);
        });
    });

    describe("zip", () => {
        it("takes lists of different value types", () => {
            expectTypeOf(list.zip(["a"], [true])).toEqualTypeOf<
                Collection<
                    Collection<number | string | boolean, number>,
                    number
                >
            >();
        });
    });
});
