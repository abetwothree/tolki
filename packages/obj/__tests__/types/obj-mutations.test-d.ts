import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    integerKeyed,
    numberList,
    readonlyRecord,
    unknownObject,
} from "./fixtures";

declare const nullableB: { b: number } | null;
declare const maybeCount: number | undefined;

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
    });

    describe("pad", () => {
        it("adds integer-keyed pad values", () => {
            expectTypeOf(Obj.pad(abc, 5, 0)).toEqualTypeOf<
                { a: number; b: number; c: number } & Record<number, number>
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
