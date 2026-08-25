import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

// Module-scope `declare const` (no initializer) — used below by the
// replace/replaceRecursive nullable-replacer regression tests. A `const`
// with a literal initializer gets narrowed by control-flow analysis to the
// initializer's type at every use site, which would silently defeat those
// tests by never presenting the true union type to overload resolution.
// `declare const` has no initializer to narrow from, and is only legal at
// module scope, not inside a function body — hence declaring it here.
declare const nullableReplacer: Record<PropertyKey, number> | null;
declare const nullableOrUndefinedReplacer:
    | Record<PropertyKey, number>
    | null
    | undefined;
declare const nullableOther: Record<string, number> | null;

describe("obj type tests", () => {
    describe("Map overloads", () => {
        it("every infers the key and value from a Map", () => {
            Obj.every(new Map([["a", 1]]), (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string>();
                return value > 0;
            });
        });

        it("some infers the key and value from a Map", () => {
            Obj.some(new Map([[1, "a"]]), (value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value === "a";
            });
        });

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
        it("every still infers from a plain object", () => {
            Obj.every({ a: 1, b: 2 }, (value: number, key: string) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string>();
                return value > 0;
            });
        });

        it("widens to unknown for a plain object, unlike the Map overload", () => {
            // The object signature accepts unknown, so the value type cannot be
            // inferred from the argument the way the Map overload infers it
            const result = Obj.first({ a: 1 }, null, "fallback");

            expectTypeOf(result).toEqualTypeOf<unknown>();
        });
    });

    describe("splice", () => {
        it("infers the value type instead of collapsing to unknown", () => {
            // Important 3 regression: splice's `data` parameter used to
            // be `Record<TKey, TValue> | unknown`, which collapses to
            // plain `unknown` — every argument matches it, so `TValue`
            // never infers. Narrowed to `Record<TKey, TValue> | null |
            // undefined`, matching what Task 2 did for `Obj.pop`.
            const result = Obj.splice({ a: 1, b: 2, c: 3 }, 1, 1);
            expectTypeOf(result.b).toEqualTypeOf<number>();
        });
    });

    describe("slice", () => {
        it("infers the value type instead of collapsing to unknown", () => {
            // Task 4: slice's `data` parameter used to be `Record<TKey,
            // TValue> | unknown`, the same collapse-to-unknown trap fixed
            // for splice/pop. Narrowed to `Record<TKey, TValue> | null |
            // undefined`.
            const result = Obj.slice({ a: 1, b: 2, c: 3 }, 1);
            expectTypeOf(result.b).toEqualTypeOf<number>();
        });
    });

    describe("filter", () => {
        it("infers the value type instead of collapsing to unknown", () => {
            // Task 4: filter's `data` parameter had the same
            // collapse-to-unknown trap as splice/slice/pop.
            const result = Obj.filter({ a: 1, b: 2, c: 3 });
            expectTypeOf(result.b).toEqualTypeOf<number>();
        });
    });

    describe("replace", () => {
        it("accepts a replacer typed as Record<PropertyKey, T> | null", () => {
            // Task 5 review round 2, Important 3: the two concrete
            // overloads (bare `null | undefined`, bare `Record<...>`)
            // correctly avoid the `X | unknown` collapse, but neither
            // matched a variable typed `Record<PropertyKey, T> | null` —
            // the realistic shape of "a replacer that might be absent",
            // and exactly the case X11 exists for. That failed with
            // TS2769 without a third, still-concrete overload for the
            // union itself. `nullableReplacer` is declared at module scope
            // (see top of file) so it is never narrowed away.
            const result = Obj.replace({ a: 1 }, nullableReplacer);
            expectTypeOf(result).toEqualTypeOf<Record<PropertyKey, number>>();
        });
    });

    describe("replaceRecursive", () => {
        it("accepts a replacer typed as Record<PropertyKey, T> | null | undefined", () => {
            // Same regression as "replace" above, for the sibling function.
            const result = Obj.replaceRecursive(
                { a: 1 },
                nullableOrUndefinedReplacer,
            );
            expectTypeOf(result).toEqualTypeOf<Record<PropertyKey, number>>();
        });
    });

    describe("diff", () => {
        it("preserves data's literal key type instead of collapsing to unknown", () => {
            // Task 6 review round 1, Minor 2: `data: Record<TKey, TValue> |
            // unknown` collapsed inference to `unknown` for every caller,
            // so `Obj.diff({id, first_word}, ...)` typed its result as
            // `Record<PropertyKey, unknown>` — no key or value information
            // survived. Now uses the same two-overload shape (typed +
            // unknown fallback) as `intersect` below, with a separate
            // `TOtherKey` so `other`'s key set need not match `data`'s
            // (they're allowed to differ, per X12/X13's whole premise).
            const result = Obj.diff(
                { id: 1, first_word: "Hello" },
                { x: "Hello" },
            );
            expectTypeOf(result).toEqualTypeOf<
                Record<"id" | "first_word", string | number>
            >();
        });

        it("accepts an other typed as Record<string, T> | null", () => {
            // Same "legitimately-typed nullable argument" regression Task 5
            // hit on `replace` (see above) — a concrete `null`-only overload
            // and a concrete `Record<...>`-only overload can still fail to
            // match a variable typed as their union, via TS2769.
            const result = Obj.diff({ a: 1 }, nullableOther);
            expectTypeOf(result).toEqualTypeOf<Record<"a", number>>();
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
    });
});
