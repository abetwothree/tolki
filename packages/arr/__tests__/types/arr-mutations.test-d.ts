import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import {
    idObjects,
    readonlyNumbers,
    readonlyStrings,
    unknownArray,
} from "./fixtures";

describe("arr mutations type tests", () => {
    describe("set", () => {
        it("returns the value type when key is null", () => {
            expectTypeOf(Arr.set(["a", "b"], null, ["x", "y"])).toEqualTypeOf<
                string[]
            >();
        });

        it("returns the value type when key is undefined", () => {
            expectTypeOf(
                Arr.set(["a", "b"], undefined, 42),
            ).toEqualTypeOf<number>();
        });

        it("preserves string element type with a same-type value", () => {
            expectTypeOf(Arr.set(["a", "b", "c"], 1, "x")).toEqualTypeOf<
                string[]
            >();
        });

        it("returns a union element type for a different-type value", () => {
            expectTypeOf(Arr.set([1, 2, 3], 1, "x")).toEqualTypeOf<
                (string | number)[]
            >();
        });

        it("preserves nested array element type via a dot path", () => {
            expectTypeOf(Arr.set([["a"], ["b"]], "1.0", "x")).toEqualTypeOf<
                string[][]
            >();
        });

        it("preserves object element type via a dot path", () => {
            expectTypeOf(Arr.set(idObjects, "0.id", 2)).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("returns string[] for an empty array", () => {
            // Kept inline: the empty array is the value under test — no
            // fixture can stand in for "no elements" without losing the
            // point of the assertion.
            expectTypeOf(Arr.set([], 0, "a")).toEqualTypeOf<string[]>();
        });

        it("does not duplicate a same-shaped object value into a union", () => {
            // Regression coverage: dropping the same-type overload (and
            // then reinstating it without `NoInfer`) let `TValue` and a
            // second, independently-inferred type parameter both resolve
            // to the structurally identical `{ id: number }`, producing
            // `({ id: number } | { id: number })[]` instead of the plain
            // `{ id: number }[]` a same-shaped write should produce.
            expectTypeOf(Arr.set(idObjects, 0, { id: 3 })).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("gives the value callback a contextual type instead of implicit any", () => {
            // Regression coverage: without `NoInfer` blocking `value`
            // from driving `TValue` on its own, `value`'s position loses
            // its contextual type from the array's element type — silent
            // here because this repo sets `noImplicitAny: false`, so the
            // callback parameter would otherwise become `any` rather than
            // erroring.
            const fns: ((n: number) => number)[] = [(n) => n];
            const result = Arr.set(fns, 0, (x) => {
                expectTypeOf(x).toEqualTypeOf<number>();
                return x + 1;
            });
            expectTypeOf(result).toEqualTypeOf<((n: number) => number)[]>();
        });
    });

    describe("push", () => {
        it("preserves string element type", () => {
            expectTypeOf(Arr.push(["a", "b"], null, "c")).toEqualTypeOf<
                string[]
            >();
        });

        it("returns a union element type for a nested array push target", () => {
            expectTypeOf(Arr.push(["a", ["b"]], "1", "c", "d")).toEqualTypeOf<
                (string | string[])[]
            >();
        });

        it("preserves number element type", () => {
            expectTypeOf(Arr.push([1, 2], null, 3, 4)).toEqualTypeOf<
                number[]
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.push(readonlyStrings, null, "c")).toEqualTypeOf<
                string[]
            >();
        });
    });

    describe("pull", () => {
        it("returns value | null and the updated array without a default", () => {
            expectTypeOf(Arr.pull([1, 2, 3], 1)).toEqualTypeOf<{
                value: number | null;
                data: number[];
            }>();
        });

        it("returns the default's type when the key is missing", () => {
            expectTypeOf(Arr.pull(["a", "b"], 5, "x")).toEqualTypeOf<{
                value: string;
                data: string[];
            }>();
        });

        it("resolves a function default to its return type", () => {
            expectTypeOf(Arr.pull(["a"], 0, () => "x")).toEqualTypeOf<{
                value: string;
                data: string[];
            }>();
        });

        it("preserves object element type without a default", () => {
            expectTypeOf(Arr.pull(idObjects, 0)).toEqualTypeOf<{
                value: { id: number } | null;
                data: { id: number }[];
            }>();
        });

        it("destructures into typed value and data", () => {
            const { value, data } = Arr.pull([1, 2], 0);
            expectTypeOf(value).toEqualTypeOf<number | null>();
            expectTypeOf(data).toEqualTypeOf<number[]>();
        });

        it("unions a different-type default with the element type", () => {
            expectTypeOf(Arr.pull([1, 2], 0, "x")).toEqualTypeOf<{
                value: number | string;
                data: number[];
            }>();
        });

        it("accepts a readonly array", () => {
            // Regression coverage: pull's typed overloads previously
            // declared `TValue[]` (mutable-only), so a readonly array
            // fell through to a merged `ArrayItems<TValue> | unknown`
            // overload that silently dropped inference, resolving to
            // `{ value: unknown; data: unknown[] }` instead of the typed
            // shape below — the same defect class fixed in `push`.
            expectTypeOf(Arr.pull(readonlyNumbers, 1)).toEqualTypeOf<{
                value: number | null;
                data: number[];
            }>();
        });
    });

    describe("prepend", () => {
        it("preserves number element type", () => {
            expectTypeOf(Arr.prepend([2, 3], 1)).toEqualTypeOf<number[]>();
        });

        it("preserves string element type", () => {
            expectTypeOf(Arr.prepend(["b", "c"], "a")).toEqualTypeOf<
                string[]
            >();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.prepend(idObjects, { id: 0 })).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("preserves element type when a key is given", () => {
            expectTypeOf(Arr.prepend([2, 3], 1, 0)).toEqualTypeOf<number[]>();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.prepend(readonlyStrings, "a")).toEqualTypeOf<
                string[]
            >();
        });
    });

    describe("pop", () => {
        it("returns TValue | null without a count", () => {
            expectTypeOf(Arr.pop([1, 2, 3])).toEqualTypeOf<number | null>();
        });

        it("returns TValue[] with a count", () => {
            expectTypeOf(Arr.pop([1, 2, 3], 2)).toEqualTypeOf<number[]>();
        });

        it("preserves string element type", () => {
            expectTypeOf(Arr.pop(["a"])).toEqualTypeOf<string | null>();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.pop(idObjects)).toEqualTypeOf<{
                id: number;
            } | null>();
        });

        it("rejects a readonly array — pop mutates, so the source must be a known-mutable array", () => {
            // @ts-expect-error -- readonly arrays cannot be mutated by pop
            Arr.pop(readonlyNumbers);
        });

        it("rejects unknown-typed data — the fallback overload only serves TValue[] | Record<PropertyKey, unknown> | null | undefined, not a blanket `unknown`, so mutation safety isn't silently bypassed", () => {
            // @ts-expect-error -- a value whose static type is `unknown`
            // provides no proof it's actually a mutable array; narrow it
            // before calling a mutating function
            Arr.pop(unknownArray);
        });
    });

    describe("shift", () => {
        it("returns TValue | null without a count", () => {
            expectTypeOf(Arr.shift([1, 2, 3])).toEqualTypeOf<number | null>();
        });

        it("returns TValue[] with a count", () => {
            expectTypeOf(Arr.shift([1, 2, 3], 2)).toEqualTypeOf<number[]>();
        });

        it("preserves string element type", () => {
            expectTypeOf(Arr.shift(["a"])).toEqualTypeOf<string | null>();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.shift(idObjects)).toEqualTypeOf<{
                id: number;
            } | null>();
        });

        it("rejects a readonly array — shift mutates, so the source must be a known-mutable array", () => {
            // @ts-expect-error -- readonly arrays cannot be mutated by shift
            Arr.shift(readonlyStrings);
        });
    });

    describe("splice", () => {
        it("preserves string element type", () => {
            expectTypeOf(Arr.splice(["foo", "baz"], 1, 1)).toEqualTypeOf<
                string[]
            >();
        });

        it("preserves string element type with a replacement", () => {
            expectTypeOf(Arr.splice(["foo", "baz"], 1, 1, "bar")).toEqualTypeOf<
                string[]
            >();
        });

        it("preserves number element type without a length", () => {
            expectTypeOf(Arr.splice([1, 2, 3], 1)).toEqualTypeOf<number[]>();
        });

        it("preserves object element type", () => {
            expectTypeOf(Arr.splice(idObjects, 0, 1)).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("rejects a readonly array — splice mutates, so the source must be a known-mutable array", () => {
            // @ts-expect-error -- readonly arrays cannot be mutated by splice
            Arr.splice(readonlyStrings, 0, 1);
        });
    });
});
