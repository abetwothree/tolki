import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

declare const nullableOther: Record<string, number> | null;

describe("obj type tests", () => {
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
});
