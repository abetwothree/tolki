import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import {
    abPairs,
    idObjects,
    metaTagItems,
    numberGrid,
    readonlyNumbers,
    readonlyStrings,
    unionElements,
    users,
} from "./fixtures";

describe("arr keying type tests", () => {
    describe("keyBy", () => {
        it("preserves the element type with a string key", () => {
            const result = Arr.keyBy(users, "id");
            expectTypeOf(result).toEqualTypeOf<
                Record<string, { id: number; name: string }>
            >();
        });

        it("preserves the element type with a callback key", () => {
            const data = [{ name: "John" }, { name: "Jane" }];
            const result = Arr.keyBy(data, (item) => {
                expectTypeOf(item).toEqualTypeOf<{ name: string }>();
                return item.name;
            });
            expectTypeOf(result).toEqualTypeOf<
                Record<string, { name: string }>
            >();
        });

        it("preserves nested object element types", () => {
            const result = Arr.keyBy(metaTagItems, "id");
            expectTypeOf(result).toEqualTypeOf<
                Record<string, { id: number; meta: { tag: string } }>
            >();
        });

        it("accepts a dot-notated key path", () => {
            const data = [{ meta: { id: 1 } }];
            const result = Arr.keyBy(data, "meta.id");
            expectTypeOf(result).toEqualTypeOf<
                Record<string, { meta: { id: number } }>
            >();
        });

        it("accepts a readonly array", () => {
            const data: readonly { id: number }[] = idObjects;
            expectTypeOf(Arr.keyBy(data, "id")).toEqualTypeOf<
                Record<string, { id: number }>
            >();
        });
    });

    describe("prependKeysWith", () => {
        it("preserves a string element type", () => {
            expectTypeOf(
                Arr.prependKeysWith(["a", "b"], "item_"),
            ).toEqualTypeOf<Record<string, string>>();
        });

        it("preserves a number element type", () => {
            expectTypeOf(
                Arr.prependKeysWith(readonlyNumbers, "n_"),
            ).toEqualTypeOf<Record<string, number>>();
        });

        it("preserves an object element type", () => {
            expectTypeOf(Arr.prependKeysWith(idObjects, "row_")).toEqualTypeOf<
                Record<string, { id: number }>
            >();
        });

        it("preserves a union element type", () => {
            expectTypeOf(
                Arr.prependKeysWith(unionElements, "k_"),
            ).toEqualTypeOf<Record<string, string | number>>();
        });

        it("preserves a nested array element type", () => {
            expectTypeOf(Arr.prependKeysWith(numberGrid, "k_")).toEqualTypeOf<
                Record<string, number[]>
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(
                Arr.prependKeysWith(readonlyStrings, "k_"),
            ).toEqualTypeOf<Record<string, string>>();
        });

        it("returns Record<string, unknown> for unknown data", () => {
            const data: unknown = ["a"];
            expectTypeOf(Arr.prependKeysWith(data, "k_")).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });

    describe("select", () => {
        it("picks a single literal key from the element type", () => {
            const data = [{ a: 1, b: 2, c: 3 }];
            expectTypeOf(Arr.select(data, "a")).toEqualTypeOf<
                { a: number }[]
            >();
        });

        it("picks multiple literal keys from the element type", () => {
            const data = [{ a: 1, b: "x", c: true }];
            expectTypeOf(Arr.select(data, ["a", "b"])).toEqualTypeOf<
                { a: number; b: string }[]
            >();
        });

        it("picks all keys when every key is listed", () => {
            expectTypeOf(Arr.select(abPairs, ["a", "b"])).toEqualTypeOf<
                { a: number; b: number }[]
            >();
        });

        it("picks nested object values by their declared type", () => {
            expectTypeOf(Arr.select(metaTagItems, ["meta"])).toEqualTypeOf<
                { meta: { tag: string } }[]
            >();
        });

        it("falls back to Record<string, unknown>[] for a widened key", () => {
            const key: string = "a";
            expectTypeOf(Arr.select(abPairs, key)).toEqualTypeOf<
                Record<string, unknown>[]
            >();
        });

        it("falls back to Record<string, unknown>[] for a widened key array", () => {
            const keys: string[] = ["a"];
            expectTypeOf(Arr.select(abPairs, keys)).toEqualTypeOf<
                Record<string, unknown>[]
            >();
        });

        it("accepts a readonly array", () => {
            const data: readonly { a: number; b: number }[] = abPairs;
            expectTypeOf(Arr.select(data, ["a"])).toEqualTypeOf<
                { a: number }[]
            >();
        });

        it("returns Record<string, unknown>[] for unknown data", () => {
            const data: unknown = [{ a: 1 }];
            expectTypeOf(Arr.select(data, ["a"])).toEqualTypeOf<
                Record<string, unknown>[]
            >();
        });
    });
});
