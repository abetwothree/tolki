import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

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
});
