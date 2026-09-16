import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    integerKeyed,
    listsByKey,
    numberList,
    numberMap,
    profile,
    unknownObject,
    user,
} from "./fixtures";

declare const maybeCount: number | undefined;

describe("obj slicing type tests", () => {
    describe("take and slice", () => {
        it("keep the per-key types as optional", () => {
            expectTypeOf(Obj.take(abc, 2)).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
            expectTypeOf(Obj.slice(abc, 1, 1)).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
        });

        it("empty a list", () => {
            expectTypeOf(Obj.take(numberList, 1)).toEqualTypeOf<
                Record<string, never>
            >();
            expectTypeOf(Obj.slice(numberList, 0)).toEqualTypeOf<
                Record<string, never>
            >();
        });
    });

    describe("chunk", () => {
        it("keeps keys by default", () => {
            expectTypeOf(Obj.chunk(abc, 2)).toEqualTypeOf<
                Record<number, Partial<{ a: number; b: number; c: number }>>
            >();
        });

        it("renumbers chunk keys when preserveKeys is false", () => {
            expectTypeOf(Obj.chunk(abc, 2, false)).toEqualTypeOf<
                Record<number, Record<number, number>>
            >();
        });

        it("accepts a boolean variable", () => {
            const preserve: boolean = Math.random() > 0.5;

            expectTypeOf(Obj.chunk(abc, 2, preserve)).toEqualTypeOf<
                Record<
                    number,
                    | Partial<{ a: number; b: number; c: number }>
                    | Record<number, number>
                >
            >();
        });

        it("returns no chunks for a list", () => {
            expectTypeOf(Obj.chunk(numberList, 2)).toEqualTypeOf<
                Record<number, never>
            >();
        });
    });

    describe("chunkWhile and chunkBy", () => {
        it("type the callback and return key-preserving chunks", () => {
            const whileResult = Obj.chunkWhile(
                { a: 1, b: 2 },
                (value, key, chunk) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<"a" | "b">();
                    expectTypeOf(chunk).toEqualTypeOf<
                        Partial<{ a: number; b: number }>
                    >();

                    return true;
                },
            );

            expectTypeOf(whileResult).toEqualTypeOf<
                Record<number, Partial<{ a: number; b: number }>>
            >();
        });

        it("group by a callback or a key", () => {
            expectTypeOf(
                Obj.chunkBy({ a: { p: 1 } }, (value, key) => {
                    expectTypeOf(value).toEqualTypeOf<{ p: number }>();
                    expectTypeOf(key).toEqualTypeOf<"a">();

                    return value.p;
                }),
            ).toEqualTypeOf<Record<number, Partial<{ a: { p: number } }>>>();
            expectTypeOf(Obj.chunkBy({ a: { p: 1 } }, "p")).toEqualTypeOf<
                Record<number, Partial<{ a: { p: number } }>>
            >();
        });

        it("hand integer-like keys over as numbers", () => {
            Obj.chunkWhile(integerKeyed, (_value, key) => {
                expectTypeOf(key).toEqualTypeOf<0 | 1 | "name">();

                return true;
            });
        });
    });

    describe("first and last", () => {
        it("return the value type or null", () => {
            expectTypeOf(Obj.first(abc)).toEqualTypeOf<number | null>();
            expectTypeOf(Obj.last(abc)).toEqualTypeOf<number | null>();
        });

        it("replace null with the default's type", () => {
            expectTypeOf(Obj.first({ a: 1 }, null, "fallback")).toEqualTypeOf<
                number | string
            >();
            expectTypeOf(
                Obj.last(
                    abc,
                    (value) => value > 5,
                    () => "none",
                ),
            ).toEqualTypeOf<number | string>();
        });

        it("type the callback's value and key", () => {
            Obj.first(profile, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<
                    string | { name: string } | number | null | undefined
                >();
                expectTypeOf(key).toEqualTypeOf<
                    "name" | "nick" | "boss" | "age"
                >();

                return true;
            });
        });

        it("walk a Map and return the default for a list", () => {
            expectTypeOf(
                Obj.first(numberMap, (value, key) => value > 0 && key !== ""),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(Obj.last(numberMap, null, "fallback")).toEqualTypeOf<
                number | string
            >();
            expectTypeOf(
                Obj.first(numberList, null, "d"),
            ).toEqualTypeOf<string>();
        });

        it("fall back to unknown for unknown data", () => {
            expectTypeOf(Obj.first(unknownObject)).toEqualTypeOf<unknown>();
        });
    });

    describe("random", () => {
        it("returns one value without a count, since an empty object throws", () => {
            expectTypeOf(Obj.random(abc)).toEqualTypeOf<number>();
        });

        it("renumbers picked values unless keys are preserved", () => {
            expectTypeOf(Obj.random(abc, 2)).toEqualTypeOf<
                Record<number, number>
            >();
            expectTypeOf(Obj.random(abc, 2, false)).toEqualTypeOf<
                Record<number, number>
            >();
            expectTypeOf(Obj.random(abc, 2, true)).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
        });

        it("covers both shapes for a boolean variable", () => {
            const preserve: boolean = Math.random() > 0.5;

            expectTypeOf(Obj.random(abc, 2, preserve)).toEqualTypeOf<
                | Partial<{ a: number; b: number; c: number }>
                | Record<number, number>
            >();
        });

        it("keeps the typed rows for a forwarded nullable count", () => {
            // A caller forwarding an optional count used to drop to the `unknown` row.
            // `maybeCount` is declared, not initialized: a const with a literal
            // initializer narrows back to `number` and would not exercise the row.
            expectTypeOf(Obj.random(abc, maybeCount)).toEqualTypeOf<
                | number
                | Partial<{ a: number; b: number; c: number }>
                | Record<number, number>
            >();
        });
    });

    describe("shuffle and reverse", () => {
        it("shuffle renumbers the values", () => {
            expectTypeOf(Obj.shuffle(user)).toEqualTypeOf<
                Record<number, string | number | { city: string; zip: number }>
            >();
        });

        it("reverse keeps string keys and widens integer-keyed data", () => {
            expectTypeOf(Obj.reverse(abc)).toEqualTypeOf<{
                a: number;
                b: number;
                c: number;
            }>();
            expectTypeOf(Obj.reverse(integerKeyed)).toEqualTypeOf<
                Record<string | number, string>
            >();
        });
    });

    describe("flatten", () => {
        it("reaches the leaves at full depth", () => {
            expectTypeOf(Obj.flatten(listsByKey)).toEqualTypeOf<number[]>();
            expectTypeOf(
                Obj.flatten({ a: { x: "s" }, b: [[true]] }),
            ).toEqualTypeOf<(string | boolean)[]>();
        });

        it("widens to every reachable value for an explicit depth", () => {
            expectTypeOf(Obj.flatten(listsByKey, 1)).toEqualTypeOf<
                (number[] | number)[]
            >();
        });

        it("keeps a Date whole and reads a Collection-like item through all()", () => {
            expectTypeOf(
                Obj.flatten({ d: new Date(0), c: { all: () => [1, 2] } }),
            ).toEqualTypeOf<(Date | number)[]>();
            expectTypeOf(
                Obj.flatten({ c: { all: () => [[1]] } }, 1),
            ).toEqualTypeOf<
                ({ all: () => number[][] } | number[] | number)[]
            >();
        });

        it("falls back for unknown data", () => {
            expectTypeOf(Obj.flatten(unknownObject)).toEqualTypeOf<unknown[]>();
        });
    });
});
