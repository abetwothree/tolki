import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    integerKeyed,
    mapOrList,
    mapUnion,
    maybeMap,
    numberList,
    numberMap,
    readonlyRecord,
    unknownObject,
} from "./fixtures";

declare const nullableB: { b: number } | null;
declare const maybeCount: number | undefined;
declare const literalKeyMap: Map<"a" | 2, number>;

describe("obj mutation type tests", () => {
    describe("pop and shift", () => {
        it("return one value, or null, without a count", () => {
            expectTypeOf(Obj.pop(abc)).toEqualTypeOf<number | null>();
            expectTypeOf(Obj.shift(abc)).toEqualTypeOf<number | null>();
            expectTypeOf(Obj.pop(abc, 1)).toEqualTypeOf<number | null>();
        });

        it("return a list for a literal count other than 1", () => {
            expectTypeOf(Obj.pop(abc, 2)).toEqualTypeOf<number[]>();
            expectTypeOf(Obj.shift(abc, 2)).toEqualTypeOf<number[] | null>();
        });

        it("cover both shapes for a widened count", () => {
            const count: number = 2;

            expectTypeOf(Obj.pop(abc, count)).toEqualTypeOf<
                number | number[] | null
            >();
            expectTypeOf(Obj.shift(abc, count)).toEqualTypeOf<
                number | number[] | null
            >();
        });

        it("return null for non-object data", () => {
            expectTypeOf(Obj.shift(numberList, 2)).toEqualTypeOf<null>();
            expectTypeOf(Obj.pop(null)).toEqualTypeOf<null | never[]>();
        });

        it("keep the typed rows for a forwarded `number | undefined` count", () => {
            // A caller forwarding an optional count used to drop to the `unknown` row.
            // `maybeCount` is declared, not initialized: a const with a literal
            // initializer narrows back to `number` and would not exercise the row.
            expectTypeOf(Obj.pop(abc, maybeCount)).toEqualTypeOf<
                number | number[] | null
            >();
            expectTypeOf(Obj.shift(abc, maybeCount)).toEqualTypeOf<
                number | number[] | null
            >();
        });

        it("return a Map's values, which they read in its insertion order", () => {
            const count: number = 2;

            expectTypeOf(Obj.pop(numberMap)).toEqualTypeOf<number | null>();
            expectTypeOf(Obj.shift(numberMap)).toEqualTypeOf<number | null>();
            expectTypeOf(Obj.pop(numberMap, 2)).toEqualTypeOf<number[]>();
            expectTypeOf(Obj.shift(numberMap, 2)).toEqualTypeOf<
                number[] | null
            >();
            expectTypeOf(Obj.pop(numberMap, count)).toEqualTypeOf<
                number | number[] | null
            >();
            expectTypeOf(Obj.shift(numberMap, maybeCount)).toEqualTypeOf<
                number | number[] | null
            >();
            // Not the non-object row, which answers that nothing was popped.
            expectTypeOf(Obj.pop(numberMap)).not.toEqualTypeOf<
                null | never[]
            >();
            expectTypeOf(Obj.shift(numberMap, 2)).not.toEqualTypeOf<null>();
        });

        it("take a Map typed read-only, as they take a readonly record, and write through it", () => {
            const readonlyMap: ReadonlyMap<string, number> = numberMap;

            expectTypeOf(Obj.pop(readonlyMap)).toEqualTypeOf<number | null>();
            expectTypeOf(Obj.shift(readonlyMap, 2)).toEqualTypeOf<
                number[] | null
            >();
        });

        it("return a union of Maps' values, and unknown for a Map in any other union", () => {
            expectTypeOf(Obj.pop(mapUnion)).toEqualTypeOf<
                string | number | null
            >();
            expectTypeOf(Obj.shift(mapUnion, 2)).toEqualTypeOf<
                (string | number)[] | null
            >();
            // Not the non-object row's `null | never[]`: the Map's values are removed and returned.
            expectTypeOf(Obj.pop(maybeMap)).toEqualTypeOf<unknown>();
            expectTypeOf(Obj.shift(maybeMap)).toEqualTypeOf<unknown>();
            expectTypeOf(Obj.pop(mapOrList, 2)).toEqualTypeOf<unknown>();
            expectTypeOf(Obj.shift(mapOrList)).toEqualTypeOf<unknown>();
        });
    });

    describe("unshift", () => {
        it("returns an empty object when called with no arguments", () => {
            expectTypeOf(Obj.unshift()).toEqualTypeOf<Record<string, never>>();
        });

        it("returns an object without integer keys unchanged with no items", () => {
            expectTypeOf(Obj.unshift(abc)).toEqualTypeOf<{
                a: number;
                b: number;
                c: number;
            }>();
        });

        it("renumbers the object's own integer keys even with no items", () => {
            expectTypeOf(Obj.unshift(integerKeyed)).toEqualTypeOf<
                { name: string } & Record<number, string>
            >();
        });

        it("adds each item under an integer key", () => {
            expectTypeOf(Obj.unshift({ b: 2 }, { a: 1 }, "x")).toEqualTypeOf<
                { b: number } & Record<number, { a: number } | string>
            >();
        });

        it("renumbers the object's own integer keys alongside the items", () => {
            expectTypeOf(Obj.unshift(integerKeyed, true)).toEqualTypeOf<
                { name: string } & Record<number, boolean | string>
            >();
        });

        it("returns a fresh object of the items for non-object data", () => {
            expectTypeOf(Obj.unshift(numberList, "x")).toEqualTypeOf<
                Record<number, string>
            >();
        });

        it("returns the Map itself, whose integer keys and items are renumbered number keys", () => {
            // Runtime: the same Map, rewritten as array_unshift leaves it, so "a" stays a
            // string key and every integer key, the items' included, is a number.
            expectTypeOf(Obj.unshift(numberMap, "x")).toEqualTypeOf<
                Map<string | number, number | string>
            >();
            expectTypeOf(Obj.unshift(literalKeyMap, true)).toEqualTypeOf<
                Map<"a" | number, number | boolean>
            >();
            expectTypeOf(Obj.unshift(literalKeyMap)).toEqualTypeOf<
                Map<"a" | number, number>
            >();
            expectTypeOf(Obj.unshift(numberMap, "x")).not.toEqualTypeOf<
                Record<number, string>
            >();
        });

        it("returns a union of Maps as one Map, and either shape for a Map in any other union", () => {
            expectTypeOf(Obj.unshift(mapUnion, true)).toEqualTypeOf<
                Map<string | number, string | number | boolean>
            >();
            // The Map member comes back as the Map; undefined or a list as a fresh record of the items.
            expectTypeOf(Obj.unshift(maybeMap, true)).toEqualTypeOf<
                Map<string | number, unknown> | Record<number, boolean>
            >();
            expectTypeOf(Obj.unshift(mapOrList, true)).toEqualTypeOf<
                Map<string | number, unknown> | Record<number, boolean>
            >();
        });

        it("answers a fresh record for a Set, which is not object-accessible", () => {
            expectTypeOf(Obj.unshift(new Set([1]), "x", "y")).toEqualTypeOf<
                Record<number, string>
            >();
        });
    });

    describe("splice", () => {
        it("returns the removed entries as a partial object", () => {
            expectTypeOf(Obj.splice(abc, 1, 1)).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
        });

        it("widens integer-keyed data, whose keys it renumbers", () => {
            expectTypeOf(Obj.splice(integerKeyed, 0, 1)).toEqualTypeOf<
                Partial<Record<string | number, string>>
            >();
        });

        it("empties a list and falls back for unknown data", () => {
            expectTypeOf(Obj.splice(numberList, 0)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.splice(unknownObject, 0)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("returns a Map's removed values under string keys", () => {
            expectTypeOf(Obj.splice(numberMap, 0, 1)).toEqualTypeOf<
                Record<string, number>
            >();
            expectTypeOf(Obj.splice(numberMap, 1, 1, ["x"])).toEqualTypeOf<
                Record<string, number>
            >();
            expectTypeOf(Obj.splice(numberMap, 0)).not.toEqualTypeOf<
                Record<string, never>
            >();
        });

        it("reads a union of Maps, and answers the widest row for a Map in any other union", () => {
            expectTypeOf(Obj.splice(mapUnion, 0, 1)).toEqualTypeOf<
                Record<string, string | number>
            >();
            expectTypeOf(Obj.splice(maybeMap, 0, 1)).toEqualTypeOf<
                Record<string, unknown>
            >();
            expectTypeOf(Obj.splice(mapOrList, 0, 1)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });

    describe("pad", () => {
        it("adds integer-keyed pad values", () => {
            expectTypeOf(Obj.pad(abc, 5, 0)).toEqualTypeOf<
                { a: number; b: number; c: number } & Record<number, number>
            >();
        });

        it("reads a Map's values under string keys, next to the pad values", () => {
            expectTypeOf(Obj.pad(numberMap, 5, "P")).toEqualTypeOf<
                Record<string, number | string>
            >();
        });

        it("reads a union of Maps, and answers the widest row for a Map in any other union", () => {
            expectTypeOf(Obj.pad(mapUnion, 5, null)).toEqualTypeOf<
                Record<string, string | number | null>
            >();
            // Not the non-object row's `Record<number, P>`: the Map's own values come back too.
            expectTypeOf(Obj.pad(maybeMap, 5, null)).toEqualTypeOf<
                Record<string | number, unknown>
            >();
            expectTypeOf(Obj.pad(mapOrList, 5, null)).toEqualTypeOf<
                Record<string | number, unknown>
            >();
        });
    });

    describe("replace", () => {
        it("lets the replacer's keys win", () => {
            expectTypeOf(
                Obj.replace({ a: 1, b: "x" }, { b: 2 }),
            ).toEqualTypeOf<{ a: number; b: number }>();
        });

        it("is a no-op for a null replacer", () => {
            expectTypeOf(Obj.replace({ a: 1 }, null)).toEqualTypeOf<{
                a: number;
            }>();
        });

        it("covers both outcomes for a nullable replacer", () => {
            expectTypeOf(Obj.replace({ a: 1 }, nullableB)).toEqualTypeOf<
                { a: number } | { a: number; b: number }
            >();
        });

        it("reads a Collection-like or list replacer the way arrayableItems does", () => {
            expectTypeOf(
                Obj.replace(
                    { name: "amir", family: "otwell" },
                    { all: () => ({ name: "taylor", age: 26 }) },
                ),
            ).toEqualTypeOf<{ name: string; family: string; age: number }>();
            expectTypeOf(Obj.replace({ a: 1 }, ["x"])).toEqualTypeOf<{
                [x: number]: string;
                a: number;
            }>();
        });

        it("returns a plain object for list data", () => {
            expectTypeOf(Obj.replace(numberList, { a: "x" })).toEqualTypeOf<{
                [x: number]: unknown;
                a: string;
            }>();
        });

        it("copies data's own entries the way { ...data } does, without unwrapping them", () => {
            expectTypeOf(
                Obj.replace({ all: () => ["x"], id: 1 }, { id: 2 }),
            ).toEqualTypeOf<{ all: () => string[]; id: number }>();
        });
    });

    describe("replaceRecursive", () => {
        it("merges nested objects by key and nested lists by index", () => {
            expectTypeOf(
                Obj.replaceRecursive(
                    { a: { x: 1, y: [1] }, b: 1 },
                    { a: { y: ["s"] }, c: true },
                ),
            ).toEqualTypeOf<{
                a: { x: number; y: (number | string)[] };
                b: number;
                c: boolean;
            }>();
        });

        it("merges a nested list meeting an object by key", () => {
            expectTypeOf(
                Obj.replaceRecursive({ k: ["c"] }, { k: { x: 1 } }),
            ).toEqualTypeOf<{ k: { [x: number]: string; x: number } }>();
            expectTypeOf(
                Obj.replaceRecursive({ k: ["c", "d"] }, { k: { 1: "e" } }),
            ).toEqualTypeOf<{
                k: string[] | { [x: number]: string; 1: string };
            }>();
        });

        it("unwraps a Collection-like replacer and returns a plain object for list data", () => {
            expectTypeOf(
                Obj.replaceRecursive(
                    { a: { x: 1 } },
                    { all: () => ({ a: { y: 2 } }) },
                ),
            ).toEqualTypeOf<{ a: { x: number; y: number } }>();
            expectTypeOf(
                Obj.replaceRecursive(numberList, { 0: "x" }),
            ).toEqualTypeOf<{ [x: number]: unknown; 0: string }>();
        });

        it("covers both outcomes for a nullable replacer", () => {
            expectTypeOf(
                Obj.replaceRecursive({ a: { x: 1 } }, nullableB),
            ).toEqualTypeOf<
                { a: { x: number } } | { a: { x: number }; b: number }
            >();
        });

        it("accepts a readonly record", () => {
            expectTypeOf(
                Obj.replaceRecursive(readonlyRecord, null),
            ).toEqualTypeOf<Readonly<Record<string, number>>>();
        });

        it("replaces a Date whole instead of merging it", () => {
            expectTypeOf(
                Obj.replaceRecursive(
                    { d: new Date(0), a: 1 },
                    { d: new Date(1) },
                ),
            ).toEqualTypeOf<{ d: Date; a: number }>();
        });
    });
});
