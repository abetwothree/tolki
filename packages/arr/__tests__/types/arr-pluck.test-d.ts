import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import {
    ageItems,
    metaTagItems,
    nameItems,
    nestedUsers,
    tagItems,
    users,
} from "./fixtures";

describe("arr pluck type tests", () => {
    describe("literal string path without a key", () => {
        it("resolves a top-level property type", () => {
            expectTypeOf(Arr.pluck(nameItems, "name")).toEqualTypeOf<
                string[]
            >();
        });

        it("resolves a numeric property type", () => {
            expectTypeOf(Arr.pluck(ageItems, "age")).toEqualTypeOf<number[]>();
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
            // `metaTagItems` carries an extra `id` field the assertion
            // doesn't care about — plucking "meta" only depends on the
            // `meta` property's own type, so the extra field is harmless.
            expectTypeOf(Arr.pluck(metaTagItems, "meta")).toEqualTypeOf<
                { tag: string }[]
            >();
        });

        it("resolves an array-valued property", () => {
            expectTypeOf(Arr.pluck(tagItems, "tags")).toEqualTypeOf<
                string[][]
            >();
        });

        it("resolves a union-valued property", () => {
            const data: { v: string | number }[] = [{ v: "a" }];
            expectTypeOf(Arr.pluck(data, "v")).toEqualTypeOf<
                (string | number)[]
            >();
        });

        it("maps an optional property's undefined to null", () => {
            // `resolvePluckPath` substitutes `null` for any segment that
            // resolves to `undefined` (arr.ts), so an optional property
            // must type as `T | null`, not `T | undefined` — the runtime
            // never actually produces `undefined` in the result.
            const data: { a?: string }[] = [{ a: "x" }, {}];
            expectTypeOf(Arr.pluck(data, "a")).toEqualTypeOf<
                (string | null)[]
            >();
        });

        it("resolves through an optional intermediate as a nullable result", () => {
            // `resolvePluckPath` returns null for the whole item when an
            // intermediate segment is undefined, so the value type is the
            // leaf type unioned with null — not unknown.
            const data: { user?: { name: string } }[] = [
                { user: { name: "Taylor" } },
                {},
            ];
            expectTypeOf(Arr.pluck(data, "user.name")).toEqualTypeOf<
                (string | null)[]
            >();
        });

        it("resolves through a nullable intermediate as a nullable result", () => {
            const data: { user: { name: string } | null }[] = [
                { user: { name: "Abigail" } },
                { user: null },
            ];
            expectTypeOf(Arr.pluck(data, "user.name")).toEqualTypeOf<
                (string | null)[]
            >();
        });

        it("falls back to unknown[] for a non-existent property", () => {
            expectTypeOf(Arr.pluck(nameItems, "missing")).toEqualTypeOf<
                unknown[]
            >();
        });

        it("falls back to unknown[] for a widened path", () => {
            const path: string = "name";
            expectTypeOf(Arr.pluck(nameItems, path)).toEqualTypeOf<unknown[]>();
        });
    });

    describe("wildcard paths", () => {
        it("resolves a wildcard segment to a nested array", () => {
            expectTypeOf(
                Arr.pluck(nestedUsers, "friends.*.name"),
            ).toEqualTypeOf<string[][]>();
        });

        it("resolves a wildcard over numeric values", () => {
            expectTypeOf(Arr.pluck(nestedUsers, "friends.*.id")).toEqualTypeOf<
                number[][]
            >();
        });

        it("resolves a trailing wildcard to the element array", () => {
            expectTypeOf(Arr.pluck(tagItems, "tags.*")).toEqualTypeOf<
                string[][]
            >();
        });
    });

    describe("array paths", () => {
        it("resolves an array path like a dot path", () => {
            // Kept inline: "developer"/"Taylor" mirrors Laravel's own
            // `testPluckWithArrayValue` fixture in ArrTest.php, and no
            // shared fixture carries that exact shape.
            const data = [{ developer: { name: "Taylor" } }];
            expectTypeOf(Arr.pluck(data, ["developer", "name"])).toEqualTypeOf<
                unknown[]
            >();
        });
    });

    describe("closure values", () => {
        it("resolves to the closure return type", () => {
            // Kept inline: needs `name` and `age` together on one element
            // to prove the closure's inferred item type, which no single
            // fixture combines.
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
            expectTypeOf(Arr.pluck(ageItems, (i) => i.age * 2)).toEqualTypeOf<
                number[]
            >();
        });
    });

    describe("with a key argument", () => {
        it("returns a keyed record of the resolved value type", () => {
            expectTypeOf(Arr.pluck(users, "name", "id")).toEqualTypeOf<
                Record<string | number, string>
            >();
        });

        it("returns a keyed record for nested paths", () => {
            // Kept inline: the `user.name`/`user.id` dot-path pair needs a
            // wrapping `user` object no shared fixture has.
            const data = [{ user: { name: "John", id: 1 } }];
            expectTypeOf(Arr.pluck(data, "user.name", "user.id")).toEqualTypeOf<
                Record<string | number, string>
            >();
        });

        it("returns a keyed record for a closure key", () => {
            expectTypeOf(
                Arr.pluck(users, "name", (item) => item.id),
            ).toEqualTypeOf<Record<string | number, string>>();
        });
    });

    describe("null value", () => {
        it("keeps whole items, typed as the array element type", () => {
            expectTypeOf(Arr.pluck(nameItems, null)).toEqualTypeOf<
                { name: string }[]
            >();
        });

        it("returns a keyed record of whole items when a key is given", () => {
            expectTypeOf(Arr.pluck(users, null, "id")).toEqualTypeOf<
                Record<string | number, { id: number; name: string }>
            >();
        });
    });

    describe("input variations", () => {
        it("accepts a readonly array", () => {
            const data: readonly { name: string }[] = nameItems;
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
            const data: unknown = nameItems;
            expectTypeOf(Arr.pluck(data, "name")).toEqualTypeOf<
                unknown[] | Record<string | number, unknown>
            >();
        });
    });
});
