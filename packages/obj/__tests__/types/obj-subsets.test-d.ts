import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    constRecord,
    numberList,
    numberMap,
    profile,
    scores,
    tree,
    unknownObject,
    user,
} from "./fixtures";

describe("obj subset type tests", () => {
    describe("get", () => {
        it("resolves a literal key and a nested dot path", () => {
            expectTypeOf(Obj.get(user, "name")).toEqualTypeOf<string>();
            expectTypeOf(Obj.get(user, "address.city")).toEqualTypeOf<string>();
        });

        it("reads a number-keyed record and a dotted top-level key the way get() does", () => {
            expectTypeOf(
                Obj.get({} as Record<number, string>, 1),
            ).toEqualTypeOf<string | null>();
            expectTypeOf(Obj.get({ "a.b": 1 }, "a.b")).toEqualTypeOf<number>();
        });

        it("drops the default for a path the type guarantees", () => {
            expectTypeOf(
                Obj.get(user, "age", "fallback"),
            ).toEqualTypeOf<number>();
        });

        it("adds the default only where the path may be missing", () => {
            expectTypeOf(Obj.get(profile, "nick")).toEqualTypeOf<
                string | null
            >();
            expectTypeOf(
                Obj.get(profile, "nick", "anon"),
            ).toEqualTypeOf<string>();
            expectTypeOf(Obj.get(profile, "boss.name")).toEqualTypeOf<
                string | null
            >();
            expectTypeOf(Obj.get(scores, "x", 0)).toEqualTypeOf<number>();
        });

        it("keeps a null leaf instead of the default", () => {
            expectTypeOf(Obj.get(profile, "boss")).toEqualTypeOf<{
                name: string;
            } | null>();
        });

        it("returns the default for a key the type does not have", () => {
            expectTypeOf(Obj.get(user, "missing")).toEqualTypeOf<null>();
            expectTypeOf(
                Obj.get(user, "missing", () => 5),
            ).toEqualTypeOf<number>();
        });

        it("traverses a nested list by index", () => {
            expectTypeOf(
                Obj.get({ products: [{ name: "desk" }] }, "products.0.name"),
            ).toEqualTypeOf<string | null>();
        });

        it("returns the whole object for a null key", () => {
            expectTypeOf(Obj.get(user, null)).toEqualTypeOf<{
                name: string;
                age: number;
                address: { city: string; zip: number };
            }>();
        });

        it("widens a non-literal key to every reachable value", () => {
            const key: string = "name";

            expectTypeOf(Obj.get(user, key)).toEqualTypeOf<
                string | number | { city: string; zip: number } | null
            >();
        });

        it("keeps literal value types and stays bounded on recursive types", () => {
            expectTypeOf(Obj.get(constRecord, "b")).toEqualTypeOf<"two">();
            expectTypeOf(Obj.get(tree, "children.0.value")).toEqualTypeOf<
                number | null
            >();
        });

        it("returns the default for a list or Map and unknown for unknown data", () => {
            expectTypeOf(Obj.get(numberList, 0)).toEqualTypeOf<null>();
            expectTypeOf(Obj.get(numberMap, "a", "d")).toEqualTypeOf<string>();
            expectTypeOf(Obj.get(unknownObject, "a")).toEqualTypeOf<unknown>();
        });
    });

    describe("only", () => {
        it("picks one key or a list of keys", () => {
            expectTypeOf(Obj.only(user, "name")).toEqualTypeOf<{
                name: string;
            }>();
            expectTypeOf(Obj.only(user, ["name", "age"])).toEqualTypeOf<{
                name: string;
                age: number;
            }>();
        });

        it("keeps an optional key optional", () => {
            expectTypeOf(Obj.only(profile, ["nick"])).toEqualTypeOf<{
                nick?: string;
            }>();
        });

        it("returns an empty record for null keys", () => {
            expectTypeOf(Obj.only(user, null)).toEqualTypeOf<
                Record<string, never>
            >();
        });

        it("makes the object partial for keys it cannot verify", () => {
            const keys: string[] = ["name"];

            expectTypeOf(Obj.only(user, keys)).toEqualTypeOf<
                Partial<{
                    name: string;
                    age: number;
                    address: { city: string; zip: number };
                }>
            >();
        });

        it("empties a list or a Map for a readonly keys constant, and still picks typed data's keys", () => {
            const indexes = [0] as const;
            const names = ["name"] as const;

            expectTypeOf(Obj.only(numberList, indexes)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.only(numberMap, names)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.only(user, names)).toEqualTypeOf<{
                name: string;
            }>();
        });

        it("accepts a readonly key list it cannot verify", () => {
            const keys: readonly string[] = ["name"];

            expectTypeOf(Obj.only(user, keys)).toEqualTypeOf<
                Partial<{
                    name: string;
                    age: number;
                    address: { city: string; zip: number };
                }>
            >();
            expectTypeOf(Obj.only(unknownObject, keys)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });

    describe("except and forget", () => {
        it("omit one key or a list of keys", () => {
            expectTypeOf(Obj.except(user, "age")).toEqualTypeOf<{
                name: string;
                address: { city: string; zip: number };
            }>();
            expectTypeOf(Obj.forget(user, ["age", "address"])).toEqualTypeOf<{
                name: string;
            }>();
        });

        it("omit a nested leaf through a dot path", () => {
            expectTypeOf(Obj.except(user, "address.city")).toEqualTypeOf<{
                name: string;
                age: number;
                address: { zip: number };
            }>();
            expectTypeOf(
                Obj.forget(user, ["name", "address.zip"]),
            ).toEqualTypeOf<{ age: number; address: { city: string } }>();
        });

        it("leave the object unchanged for a path it does not have", () => {
            expectTypeOf(Obj.except(abc, "z.y")).toEqualTypeOf<{
                a: number;
                b: number;
                c: number;
            }>();
        });

        it("make every level optional for keys they cannot verify", () => {
            const key: string = "a";

            expectTypeOf(Obj.except({ a: { b: 1 } }, key)).toEqualTypeOf<{
                a?: { b?: number };
            }>();
        });

        it("empty a list and fall back for unknown data", () => {
            expectTypeOf(Obj.except(numberList, 0)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.forget(unknownObject, "a")).toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("empty a list or a Map for a readonly keys constant, and still omit typed data's keys", () => {
            const hidden = ["password", "token"] as const;
            const account = { id: 1, password: "p", token: "t" };

            expectTypeOf(Obj.except(numberList, hidden)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.forget(numberMap, hidden)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.except(account, hidden)).toEqualTypeOf<{
                id: number;
            }>();
            expectTypeOf(Obj.forget(account, hidden)).toEqualTypeOf<{
                id: number;
            }>();
        });

        it("accept a readonly key list for nullable or unknown data", () => {
            const hidden: readonly (string | number)[] = ["name", 0];

            expectTypeOf(Obj.except(profile.boss, hidden)).toEqualTypeOf<
                Record<string, unknown>
            >();
            expectTypeOf(Obj.forget(unknownObject, hidden)).toEqualTypeOf<
                Record<string, unknown>
            >();
            expectTypeOf(Obj.except(abc, hidden)).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
        });
    });

    describe("onlyValues and exceptValues", () => {
        it("keep the per-key types as optional", () => {
            expectTypeOf(Obj.onlyValues(abc, [1, 2])).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
            expectTypeOf(Obj.exceptValues(abc, "1", true)).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
        });

        it("keeps a list's entries index-keyed for the rejects-first row", () => {
            expectTypeOf(Obj.onlyValues(numberList, 1)).toEqualTypeOf<
                Record<number, unknown>
            >();
            expectTypeOf(Obj.exceptValues(numberList, 1)).toEqualTypeOf<
                Record<number, unknown>
            >();
        });
    });
});
