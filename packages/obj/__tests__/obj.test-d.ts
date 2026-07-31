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
});
