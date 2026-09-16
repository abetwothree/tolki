import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import {
    idObjects,
    readonlyNumbers,
    readonlyStrings,
    unknownArray,
} from "./fixtures";

declare const maybeKey: string | null;
declare const maybeIndex: number | undefined;

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

        it("keeps the list element type even when the write widens it", () => {
            // KNOWN-UNSOUND: the runtime answers [["a"], [5]], so the true type is
            // (string | number)[][]. The index-rest row keeps TValue[] when the element
            // is already a list, so a value written under it reads back at the wrong type.
            expectTypeOf(Arr.set([["a"], ["b"]], "1.0", 5)).toEqualTypeOf<
                string[][]
            >();
        });

        it("preserves object element type via a dot path", () => {
            expectTypeOf(Arr.set(idObjects, "0.id", 2)).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("adds the record a dot path writes at a list index", () => {
            // F-24(a): the path row declared the element type unchanged, so this read as
            // `string[]` while the runtime returns `[{ x: 5 }, "b"]`.
            // docs/php-parity/task-24-data-release-readiness.json,
            // "set-dot-path-under-a-list-index"
            expectTypeOf(Arr.set(["a", "b"], "0.x", 5)).toEqualTypeOf<
                (string | { x: number })[]
            >();
        });

        it("rebuilds no element for a head that only looks like an index", () => {
            // Only an integer's canonical spelling is an array key, so "01" is stored as
            // the list's own property. docs/php-parity/task-24-data-release-readiness.json,
            // "r2-set-noncanonical-index-head-with-rest"
            expectTypeOf(Arr.set(["a", "b"], "01.x", 5)).toEqualTypeOf<
                string[]
            >();
        });

        it("rebuilds no element for a negative head", () => {
            // A negative index addresses no slot of a JS list, so the write lands on the
            // list's own "-1" property instead of rebuilding element 0.
            expectTypeOf(Arr.set(["a", "b"], "-1.x", 5)).toEqualTypeOf<
                string[]
            >();
        });

        it("widens a scalar element the rest rebuilds as a list", () => {
            // The rest starts with an index, so element 0 becomes a fresh list; its own
            // member types are deliberately approximated rather than spelled out.
            expectTypeOf(Arr.set(["a", "b"], "0.1", 5)).toEqualTypeOf<
                (string | unknown[])[]
            >();
        });

        it("rebuilds a record when the rest only looks like an index", () => {
            // The same canonical-spelling rule one segment deeper: "01" seeds a record,
            // not a list, so the element gains that key. docs/php-parity/
            // task-24-data-release-readiness.json, "set-then-get-noncanonical-index-nested"
            expectTypeOf(Arr.set(["a", "b"], "0.01", 5)).toEqualTypeOf<
                (string | { "01": number })[]
            >();
        });

        it("nests the record a deeper dot path writes at a list index", () => {
            expectTypeOf(Arr.set(["a", "b"], "0.x.y", 5)).toEqualTypeOf<
                (string | { x: { y: number } })[]
            >();
        });

        it("admits no padding for an out-of-range canonical head", () => {
            // KNOWN-UNSOUND: the runtime answers ["a", undefined, undefined, undefined,
            // undefined, { x: 1 }] — the head is past the end, so the write pads the gap.
            // The row names neither `undefined` nor the pad, so a read of one is mistyped.
            expectTypeOf(Arr.set(["a"], "5.x", 1)).toEqualTypeOf<
                (string | { x: number })[]
            >();
        });

        it("merges the write onto a record element already there", () => {
            expectTypeOf(Arr.set(idObjects, "0.name", "Ada")).toEqualTypeOf<
                ({ id: number } | { id: number; name: string })[]
            >();
        });

        it("leaves the element type alone for a path under a non-index key", () => {
            // A non-index head is a string key stored on the array itself, so no element
            // is rebuilt: Arr.set(["a"], "user.name", "x") -> ["a"] with a `user` property.
            expectTypeOf(Arr.set(["a"], "user.name", "x")).toEqualTypeOf<
                string[]
            >();
        });

        it("returns string[] for an empty array", () => {
            // Kept inline: the empty array is the value under test — no
            // fixture can stand in for "no elements" without losing the
            // point of the assertion.
            expectTypeOf(Arr.set([], 0, "a")).toEqualTypeOf<string[]>();
        });

        it("synthesizes just the written record for an empty array", () => {
            // An empty array's element type is `never`, which used to carry the fresh
            // container seed's own index signatures out into the public answer.
            expectTypeOf(Arr.set([], "0.x", 5)).toEqualTypeOf<
                { x: number }[]
            >();
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

        it("adds the value to the result for a key that may be null or undefined", () => {
            expectTypeOf(Arr.set(["a", "b"], maybeIndex, "x")).toEqualTypeOf<
                string[] | string
            >();
            expectTypeOf(Arr.set([1, 2], maybeKey, "x")).toEqualTypeOf<
                (number | string)[] | string
            >();
            // @ts-expect-error - arr's rows are array-shaped; bare `unknown` belongs to obj/data.
            Arr.set(unknownArray, maybeKey, 5);
            expectTypeOf(
                Arr.set(unknownArray as unknown[], maybeKey, 5),
            ).toEqualTypeOf<unknown[] | number>();
            expectTypeOf(
                Arr.set(unknownArray as unknown[], "a", 5),
            ).toEqualTypeOf<unknown[]>();
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

        it("rejects unknown-typed data — the fallback overload only serves TValue[] | null | undefined, not a blanket `unknown`, so mutation safety isn't silently bypassed", () => {
            // @ts-expect-error -- a value whose static type is `unknown`
            // provides no proof it's actually a mutable array; narrow it
            // before calling a mutating function
            Arr.pop(unknownArray);
        });

        it("rejects a plain record — keyed data belongs to Obj.pop", () => {
            // @ts-expect-error - keyed data belongs to Obj.pop
            Arr.pop({ a: 1, b: 2 });
            // @ts-expect-error - keyed data belongs to Obj.pop
            Arr.pop({ a: 1, b: 2 }, 2);
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

        it("rejects a plain record — keyed data belongs to Obj.shift", () => {
            // @ts-expect-error - keyed data belongs to Obj.shift
            Arr.shift({ a: 1, b: 2 });
            // @ts-expect-error - keyed data belongs to Obj.shift
            Arr.shift({ a: 1, b: 2 }, 2);
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
