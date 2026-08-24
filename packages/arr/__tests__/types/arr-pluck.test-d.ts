import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

describe("arr pluck type tests", () => {
    describe("literal string path without a key", () => {
        it("resolves a top-level property type", () => {
            const data = [{ name: "John" }, { name: "Jane" }];
            expectTypeOf(Arr.pluck(data, "name")).toEqualTypeOf<string[]>();
        });

        it("resolves a numeric property type", () => {
            const data = [{ age: 30 }, { age: 25 }];
            expectTypeOf(Arr.pluck(data, "age")).toEqualTypeOf<number[]>();
        });

        it("resolves a nested dot path", () => {
            const data = [{ user: { name: "John" } }];
            expectTypeOf(Arr.pluck(data, "user.name")).toEqualTypeOf<
                string[]
            >();
        });

        it("resolves a deeply nested dot path", () => {
            const data = [{ a: { b: { c: true } } }];
            expectTypeOf(Arr.pluck(data, "a.b.c")).toEqualTypeOf<boolean[]>();
        });

        it("resolves an object-valued property", () => {
            const data = [{ meta: { tag: "x" } }];
            expectTypeOf(Arr.pluck(data, "meta")).toEqualTypeOf<
                { tag: string }[]
            >();
        });

        it("resolves an array-valued property", () => {
            const data = [{ tags: ["a", "b"] }];
            expectTypeOf(Arr.pluck(data, "tags")).toEqualTypeOf<string[][]>();
        });

        it("resolves a union-valued property", () => {
            const data: { v: string | number }[] = [{ v: "a" }];
            expectTypeOf(Arr.pluck(data, "v")).toEqualTypeOf<
                (string | number)[]
            >();
        });

        it("falls back to unknown[] for a non-existent property", () => {
            const data = [{ name: "John" }];
            expectTypeOf(Arr.pluck(data, "missing")).toEqualTypeOf<unknown[]>();
        });

        it("falls back to unknown[] for a widened path", () => {
            const data = [{ name: "John" }];
            const path: string = "name";
            expectTypeOf(Arr.pluck(data, path)).toEqualTypeOf<unknown[]>();
        });
    });

    describe("wildcard paths", () => {
        it("resolves a wildcard segment to a nested array", () => {
            const data = [{ users: [{ first: "taylor" }] }];
            expectTypeOf(Arr.pluck(data, "users.*.first")).toEqualTypeOf<
                string[][]
            >();
        });

        it("resolves a wildcard over numeric values", () => {
            const data = [{ scores: [{ value: 1 }] }];
            expectTypeOf(Arr.pluck(data, "scores.*.value")).toEqualTypeOf<
                number[][]
            >();
        });

        it("resolves a trailing wildcard to the element array", () => {
            const data = [{ tags: ["a", "b"] }];
            expectTypeOf(Arr.pluck(data, "tags.*")).toEqualTypeOf<string[][]>();
        });
    });

    describe("array paths", () => {
        it("resolves an array path like a dot path", () => {
            const data = [{ developer: { name: "Taylor" } }];
            expectTypeOf(Arr.pluck(data, ["developer", "name"])).toEqualTypeOf<
                unknown[]
            >();
        });
    });

    describe("closure values", () => {
        it("resolves to the closure return type", () => {
            const data = [{ name: "John", age: 30 }];
            const result = Arr.pluck(data, (item) => {
                expectTypeOf(item).toEqualTypeOf<{
                    name: string;
                    age: number;
                }>();
                return item.name;
            });
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("resolves to a numeric closure return type", () => {
            const data = [{ age: 30 }];
            expectTypeOf(Arr.pluck(data, (i) => i.age * 2)).toEqualTypeOf<
                number[]
            >();
        });
    });

    describe("with a key argument", () => {
        it("returns a keyed record of the resolved value type", () => {
            const data = [
                { id: 1, name: "John" },
                { id: 2, name: "Jane" },
            ];
            expectTypeOf(Arr.pluck(data, "name", "id")).toEqualTypeOf<
                Record<string | number, string>
            >();
        });

        it("returns a keyed record for nested paths", () => {
            const data = [{ user: { name: "John", id: 1 } }];
            expectTypeOf(Arr.pluck(data, "user.name", "user.id")).toEqualTypeOf<
                Record<string | number, string>
            >();
        });

        it("returns a keyed record for a closure key", () => {
            const data = [{ id: 1, name: "John" }];
            expectTypeOf(
                Arr.pluck(data, "name", (item) => item.id),
            ).toEqualTypeOf<Record<string | number, string>>();
        });
    });

    describe("input variations", () => {
        it("accepts a readonly array", () => {
            const data: readonly { name: string }[] = [{ name: "a" }];
            expectTypeOf(Arr.pluck(data, "name")).toEqualTypeOf<string[]>();
        });

        it("returns the untyped fallback union for unknown data", () => {
            // When `data` is `unknown`, none of the literal-path/closure
            // overloads (which all require an array-shaped `data`) can
            // match, so this falls through to the pre-existing untyped
            // fallback overload. That overload covers both the keyed and
            // unkeyed call shapes in one signature, so its return type is
            // `unknown[] | Record<string | number, unknown>` rather than
            // a bare `unknown[]` — there is no way to know statically
            // which shape a caller intends when `data` itself is unknown.
            const data: unknown = [{ name: "a" }];
            expectTypeOf(Arr.pluck(data, "name")).toEqualTypeOf<
                unknown[] | Record<string | number, unknown>
            >();
        });
    });
});
