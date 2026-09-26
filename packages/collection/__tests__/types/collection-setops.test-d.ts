import { collect, Collection } from "@tolki/collection";
import { describe, expectTypeOf, it } from "vitest";

import {
    ArrayableRecord,
    ConvertsToJSON,
    JsonText,
    numbers,
    SerializesRecord,
    SerializesScalar,
    Tagged,
} from "./fixtures";

declare const strings: Collection<string, "a">;
declare const dates: Map<"p" | "q", Date>;

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

        it("types b as a collection's items, a subclass's too", () => {
            list.diffUsing(strings, (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return true;
            });
            list.diffUsing(new Tagged([4]), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<number>();

                return true;
            });
        });

        it("types b as a Map's values, which a literal key never leaves undefined", () => {
            list.diffUsing(dates, (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<Date>();

                return true;
            });
        });

        it("types b as a list's items", () => {
            list.diffUsing(["x"], (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return true;
            });
        });

        it("types b as an Arrayable's items", () => {
            list.diffUsing(new ArrayableRecord(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return true;
            });
        });

        it("types b as a generator's values", () => {
            list.diffUsing(numbers(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<number>();

                return true;
            });
        });

        it("types b as unknown for a Jsonable, whose JSON text no type can read", () => {
            list.diffUsing(new JsonText(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<unknown>();

                return true;
            });
        });

        it("types b as a JsonSerializable's answer, or the answer itself when it is a scalar", () => {
            list.diffUsing(new SerializesRecord(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return true;
            });
            list.diffUsing(new SerializesScalar(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return true;
            });
        });

        it("types b as a class's own fields, never its toJSON() answer", () => {
            list.diffUsing(new ConvertsToJSON(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<number>();

                return true;
            });
        });

        it("types b as never for a Date, which has no own fields", () => {
            list.diffUsing(new Date(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<never>();

                return true;
            });
        });

        it("types b as a record's values", () => {
            list.diffUsing({ x: 1, y: "s" }, (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<number | string>();

                return true;
            });
        });

        it("types b as never for null, which holds no items", () => {
            list.diffUsing(null, (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<never>();

                return true;
            });
        });

        it("takes a declared comparator for an operand typed any, as JSON.parse() answers", () => {
            const compare = (a: number, b: number) => a - b;

            list.diffUsing(JSON.parse("[2]"), compare);
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

        it("types b as a collection operand's items", () => {
            rows.intersectUsing(collect([{ id: 1 }]), (a, b) => {
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

    describe("mergeRecursive", () => {
        it("widens the values it may return with the operand's", () => {
            expectTypeOf(list.mergeRecursive(["x"])).toEqualTypeOf<
                | Collection<number, number, "list">
                | Collection<number | string, number, "list">
            >();
        });
    });

    describe("zip", () => {
        it("takes a collection's items as a list", () => {
            expectTypeOf(list.zip(collect(["a", "b", "c"]))).toEqualTypeOf<
                Collection<Collection<number | string, number>, number>
            >();
        });

        it("takes lists of different value types", () => {
            expectTypeOf(
                list.zip(["a", "b", "c"], [true, false, true]),
            ).toEqualTypeOf<
                Collection<
                    Collection<number | string | boolean, number>,
                    number
                >
            >();
        });
    });

    describe("splice", () => {
        it("takes one value of the collection's type as the replacement", () => {
            expectTypeOf(list.splice(0, 0, 4)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("rejects one value of another type", () => {
            // @ts-expect-error - PHP's replacement is array<array-key, TValue>
            list.splice(0, 0, "x");
        });
    });

    describe("crossJoin", () => {
        it("takes lists of different value types", () => {
            // Deferred: crossJoin() still declares the receiver's type, not the rows of values it builds
            expectTypeOf(list.crossJoin(["a"], [true])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });
    });

    describe("only", () => {
        it("takes a collection of key names", () => {
            expectTypeOf(record.only(collect(["a", "b"]))).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
        });

        it("rejects a collection whose values are not key names", () => {
            // @ts-expect-error - PHP's parameter is Enumerable<array-key, TKey>
            record.only(collect([{ a: 1 }]));
        });
    });

    describe("except", () => {
        it("takes a collection of key names", () => {
            expectTypeOf(record.except(collect(["c"]))).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
        });

        it("rejects a collection whose values are not key names", () => {
            // @ts-expect-error - PHP's parameter is Enumerable<array-key, TKey>
            record.except(collect([{ a: 1 }]));
        });
    });

    describe("forget", () => {
        it("takes a collection of key names", () => {
            expectTypeOf(record.forget(collect(["c"]))).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
        });

        it("rejects a collection whose values are not key names", () => {
            // @ts-expect-error - PHP's parameter is iterable<array-key, TKey>
            record.forget(collect([{ a: 1 }]));
        });
    });

    describe("concat", () => {
        it("rejects null, over which PHP's foreach warns", () => {
            // @ts-expect-error - PHP's parameter is iterable, which null is not
            list.concat(null);
        });
    });

    describe("whereBetween", () => {
        it("rejects null, which PHP's reset() refuses with a TypeError", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable, which null is not
            rows.whereBetween("id", null);
        });
    });

    describe("whereNotBetween", () => {
        it("rejects null, which PHP's reset() refuses with a TypeError", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable, which null is not
            rows.whereNotBetween("id", null);
        });
    });
});
