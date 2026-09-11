import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

declare const nullableOther: Record<string, number> | null;

describe("obj type tests", () => {
    describe("Map overloads", () => {
        it("first infers the value and return type from a Map", () => {
            const result = Obj.first(new Map([["a", 1]]), (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string>();
                return value > 0;
            });

            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("last honours the default type alongside the Map value", () => {
            const result = Obj.last(new Map([["a", 1]]), null, "fallback");

            expectTypeOf(result).toEqualTypeOf<number | string | null>();
        });
    });

    describe("object overloads", () => {
        it("widens to unknown for a plain object, unlike the Map overload", () => {
            // The object signature accepts unknown, so the value type cannot be
            // inferred from the argument the way the Map overload infers it
            const result = Obj.first({ a: 1 }, null, "fallback");

            expectTypeOf(result).toEqualTypeOf<unknown>();
        });
    });

    describe("slice", () => {
        it("infers the value type instead of collapsing to unknown", () => {
            // slice's `data` parameter used to be `Record<TKey, TValue> | unknown`, the
            // same collapse-to-unknown trap fixed for splice/pop. Narrowed to
            // `Record<TKey, TValue> | null | undefined`.
            const result = Obj.slice({ a: 1, b: 2, c: 3 }, 1);
            expectTypeOf(result.b).toEqualTypeOf<number>();
        });
    });

    describe("diff", () => {
        it("preserves data's literal key type instead of collapsing to unknown", () => {
            // `data: Record<TKey, TValue> | unknown` collapsed inference to `unknown`
            // for every caller, so `Obj.diff({id, first_word},...)` typed its result as
            // `Record<PropertyKey, unknown>` — no key or value information survived.
            const result = Obj.diff(
                { id: 1, first_word: "Hello" },
                { x: "Hello" },
            );
            expectTypeOf(result).toEqualTypeOf<
                Record<"id" | "first_word", string | number>
            >();
        });

        it("accepts an other typed as Record<string, T> | null", () => {
            // Same nullable-argument regression as `replace` above: a null-only overload
            // and a record-only overload can both fail to match a variable typed as the
            // union of the two.
            const result = Obj.diff({ a: 1 }, nullableOther);
            expectTypeOf(result).toEqualTypeOf<Record<"a", number>>();
        });

        it("accepts an Enumerable-like operand without a cast", () => {
            const enumerable = { all: () => [20] };
            expectTypeOf(Obj.diff({ a: 10, b: 20 }, enumerable)).toEqualTypeOf<
                Record<PropertyKey, number>
            >();
        });
    });

    describe("intersect", () => {
        it("preserves data's value type instead of the phantom TResponse collapsing to unknown", () => {
            // Confirms the fix already landed for intersect (the
            // phantom-generic removal), pinned here so it can't regress
            // silently alongside diff's fix above.
            const result = Obj.intersect(
                { id: 1, first_word: "Hello" },
                { first_world: "Hello", last_word: "World" },
            );
            expectTypeOf(result).toEqualTypeOf<
                Record<PropertyKey, string | number>
            >();
        });

        it("accepts an other typed as Record<string, T> | null", () => {
            const result = Obj.intersect({ a: 1 }, nullableOther);
            expectTypeOf(result).toEqualTypeOf<Record<PropertyKey, number>>();
        });

        it("accepts an Enumerable-like operand without a cast", () => {
            const enumerable = { all: () => [20] };
            expectTypeOf(
                Obj.intersect({ a: 10, b: 20 }, enumerable),
            ).toEqualTypeOf<Record<PropertyKey, number>>();
        });
    });

    describe("intersectAssoc, intersectAssocUsing, intersectByKeys", () => {
        it("accept a nullish data operand at the type level, like intersect (R5)", () => {
            // Before this fix, these three declared `data: Record<PropertyKey, T1>`
            // with no `unknown` fallback, so `null` was rejected by `tsc`, unlike
            // `intersect` and `diff`, even though the runtime treats it as empty.
            expectTypeOf(Obj.intersect).toBeCallableWith(null, { a: 1 });
            expectTypeOf(Obj.intersectAssoc).toBeCallableWith(null, { a: 1 });
            expectTypeOf(Obj.intersectAssocUsing).toBeCallableWith(
                null,
                { a: 1 },
                (a, b) => a === b,
            );
            expectTypeOf(Obj.intersectByKeys).toBeCallableWith(null, {
                a: 1,
            });
        });
    });

    describe("chunkWhile", () => {
        it("returns a record of key-preserving chunks and types the callback", () => {
            const result = Obj.chunkWhile(
                { a: 1, b: 2 },
                (value, key, chunk) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<"a" | "b">();
                    expectTypeOf(chunk).toEqualTypeOf<
                        Record<"a" | "b", number>
                    >();

                    return true;
                },
            );

            expectTypeOf(result).toEqualTypeOf<
                Record<number, Record<"a" | "b", number>>
            >();
        });
    });

    describe("chunkBy", () => {
        it("returns a record of key-preserving chunks for a callback and for a key", () => {
            const byCallback = Obj.chunkBy({ a: { p: 1 } }, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<{ p: number }>();
                expectTypeOf(key).toEqualTypeOf<"a">();

                return value.p;
            });

            expectTypeOf(byCallback).toEqualTypeOf<
                Record<number, Record<"a", { p: number }>>
            >();
            expectTypeOf(Obj.chunkBy({ a: { p: 1 } }, "p")).toEqualTypeOf<
                Record<number, Record<"a", { p: number }>>
            >();
        });
    });
});
