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

        // BLOCKED — three brief rows intentionally omitted here:
        //   - `Arr.set([["a"], ["b"]], "1.0", "x")` → brief expects
        //     `string[][]`; actual is `(string | string[])[]`.
        //   - `Arr.set([{ id: 1 }], "0.id", 2)` → brief expects
        //     `{ id: number }[]`; actual is `(number | { id: number })[]`.
        //   - `Arr.set([], 0, "a")` → brief expects `string[]`; actual is
        //     the unwidened literal `"a"[]`.
        // `set`'s typed overloads compare `value`'s type against the
        // *top-level* element type only — they have no dot-path
        // resolution, so a value meant for a nested position (`"1.0"`,
        // `"0.id"`) is compared against the whole element type and always
        // "wins" the different-type overload, unioning in the raw value
        // type instead of preserving the array's original shape. The
        // empty-array case fails for an unrelated reason: TypeScript
        // keeps `value`'s literal type unwidened while trial-matching the
        // "different type" overload against `array: never[]`. None of
        // this is the `TValue[]` → `ArrayItems<TValue>` readonly-widening
        // pattern this task's other fixes use, and fixing it for real
        // needs `set` to gain dot-path-aware typed overloads (comparable
        // to what `get`/`pluck` already do) — a signature redesign this
        // task does not own. Reported as a BLOCKED finding rather than
        // silently weakened or invented here.
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

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.pop(readonlyNumbers)).toEqualTypeOf<
                number | null
            >();
        });

        it("collapses to unknown for unknown data", () => {
            // TypeScript collapses `unknown | X` to `unknown`, so the
            // fallback overload's `TValue | TValue[] | null` return type
            // (with TValue defaulting to `unknown`) is unwritable as
            // anything but a bare `unknown`.
            expectTypeOf(Arr.pop(unknownArray)).toEqualTypeOf<unknown>();
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

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.shift(readonlyStrings)).toEqualTypeOf<
                string | null
            >();
        });
    });
});
