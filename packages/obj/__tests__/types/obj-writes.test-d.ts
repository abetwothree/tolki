import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import { abc, numberList, profile, unknownObject, user } from "./fixtures";

declare const maybeKey: string | null;
declare const maybeAge: "age" | undefined;

describe("obj write type tests", () => {
    describe("set", () => {
        it("adds a new top-level key", () => {
            expectTypeOf(
                Obj.set(user, "email", "x@example.com"),
            ).toEqualTypeOf<{
                name: string;
                age: number;
                address: { city: string; zip: number };
                email: string;
            }>();
        });

        it("replaces an existing key's type", () => {
            expectTypeOf(Obj.set(abc, "a", "one")).toEqualTypeOf<{
                b: number;
                c: number;
                a: string;
            }>();
        });

        it("writes through a dot path, creating missing objects", () => {
            expectTypeOf(
                Obj.set(user, "address.street", "Main"),
            ).toEqualTypeOf<{
                name: string;
                age: number;
                address: { city: string; zip: number; street: string };
            }>();
            expectTypeOf(Obj.set({}, "a.b.c", true)).toEqualTypeOf<{
                a: { b: { c: boolean } };
            }>();
        });

        it("replaces a scalar segment with an object", () => {
            expectTypeOf(
                Obj.set({ products: "desk" }, "products.desk.price", 200),
            ).toEqualTypeOf<{ products: { desk: { price: number } } }>();
        });

        it("returns the value for a null key and a loose record for a widened key", () => {
            const key: string = "k";

            expectTypeOf(Obj.set(user, null, 5)).toEqualTypeOf<number>();
            expectTypeOf(Obj.set(user, key, 5)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("empties a list and falls back for unknown data", () => {
            expectTypeOf(Obj.set(numberList, "a", 1)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.set(unknownObject, "a", 1)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("adds the value to the result for a key that may be null or undefined", () => {
            expectTypeOf(Obj.set(user, maybeAge, 31)).toEqualTypeOf<
                | {
                      name: string;
                      age: number;
                      address: { city: string; zip: number };
                  }
                | number
            >();
            expectTypeOf(Obj.set(user, maybeKey, 5)).toEqualTypeOf<
                Record<string, unknown> | number
            >();
        });

        it("adds the value for a nullable key on a list or unknown data too", () => {
            expectTypeOf(Obj.set(numberList, maybeKey, 1)).toEqualTypeOf<
                Record<string, never> | number
            >();
            expectTypeOf(Obj.set(unknownObject, maybeKey, 1)).toEqualTypeOf<
                Record<string, unknown> | number
            >();
        });
    });

    describe("add", () => {
        it("unions the new value with a nullable existing one", () => {
            expectTypeOf(Obj.add(profile, "age", "unknown")).toEqualTypeOf<{
                name: string;
                nick?: string;
                boss: { name: string } | null;
                age: number | string;
            }>();
        });

        it("creates the parent for a missing dotted key", () => {
            expectTypeOf(Obj.add({}, "developer.name", "Ferid")).toEqualTypeOf<{
                developer: { name: string };
            }>();
        });
    });

    describe("push", () => {
        it("appends to the list at a path", () => {
            expectTypeOf(Obj.push({ tags: ["a"] }, "tags", "b")).toEqualTypeOf<{
                tags: string[];
            }>();
            expectTypeOf(
                Obj.push({}, "office.furniture", "Desk"),
            ).toEqualTypeOf<{ office: { furniture: string[] } }>();
        });

        it("appends under the next integer key for a null key", () => {
            expectTypeOf(Obj.push({ a: "x" }, null, 1)).toEqualTypeOf<
                { a: string } & Record<number, number>
            >();
        });
    });

    describe("prepend", () => {
        it("puts the new key first", () => {
            expectTypeOf(Obj.prepend(abc, 0, "zero")).toEqualTypeOf<{
                zero: number;
                a: number;
                b: number;
                c: number;
            }>();
        });

        it("lets the prepended value replace an existing key", () => {
            expectTypeOf(
                Obj.prepend({ a: 1, b: 2 }, "nine", "b"),
            ).toEqualTypeOf<{ b: string; a: number }>();
        });

        it("types a float key as the integer key PHP truncates it to, which it can't name", () => {
            expectTypeOf(
                Obj.prepend({ a: 1, 1: "x" }, "v", 1.5),
            ).toEqualTypeOf<{
                [x: `${number}`]: string;
                a: number;
            }>();
        });

        it("files a null key under the empty string", () => {
            expectTypeOf(Obj.prepend({ one: 1 }, 0, null)).toEqualTypeOf<{
                "": number;
                one: number;
            }>();
        });

        it("unshifts under integer keys when no key is given", () => {
            expectTypeOf(Obj.prepend({ one: 1 }, 0)).toEqualTypeOf<
                { one: number } & Record<number, number>
            >();
        });
    });

    describe("pull", () => {
        it("destructures a typed value and the remaining object", () => {
            const { value, data } = Obj.pull(user, "age");

            expectTypeOf(value).toEqualTypeOf<number>();
            expectTypeOf(data).toEqualTypeOf<{
                name: string;
                address: { city: string; zip: number };
            }>();
        });

        it("removes a nested leaf and honours a default", () => {
            const { value, data } = Obj.pull(user, "address.city", "none");

            expectTypeOf(value).toEqualTypeOf<string>();
            expectTypeOf(data).toEqualTypeOf<{
                name: string;
                age: number;
                address: { zip: number };
            }>();
        });

        it("adds null for a key that may be missing", () => {
            expectTypeOf(Obj.pull(profile, "nick").value).toEqualTypeOf<
                string | null
            >();
        });
    });
});
