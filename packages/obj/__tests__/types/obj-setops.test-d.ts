import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import { abc, numberList, unknownObject } from "./fixtures";

declare const nullableOther: Record<string, number> | null;
declare const records: Record<string, number>[];
declare const sizes: { size: string[] }[];

describe("obj set-operation type tests", () => {
    describe("union", () => {
        it("lets the left-most object win each key", () => {
            expectTypeOf(
                Obj.union({ a: 1 }, { a: "x", b: "y" }),
            ).toEqualTypeOf<{ a: number; b: string }>();
        });

        it("skips null operands", () => {
            expectTypeOf(Obj.union({ a: 1 }, null, { c: true })).toEqualTypeOf<{
                a: number;
                c: boolean;
            }>();
        });

        it("makes a spread of unknown length partial", () => {
            expectTypeOf(Obj.union(...records)).toEqualTypeOf<
                Partial<Record<string, number>>
            >();
        });

        it("reads each operand the way arrayableItems does", () => {
            expectTypeOf(
                Obj.union(
                    { name: "Hello" },
                    { all: () => ({ name: "World", id: 1 }) },
                ),
            ).toEqualTypeOf<{ name: string; id: number }>();
            expectTypeOf(Obj.union({ a: 1 }, [5])).toEqualTypeOf<{
                [x: number]: number;
                a: number;
            }>();
        });

        it("reads the first operand, the data, by its own entries", () => {
            expectTypeOf(
                Obj.union({ all: () => "x", b: 1 }, { c: true }),
            ).toEqualTypeOf<{ all: () => "x"; b: number; c: boolean }>();
        });

        it("widens to a loose record for an unknown operand", () => {
            expectTypeOf(Obj.union(unknownObject, { a: 1 })).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });

    describe("diff and diffAssoc", () => {
        it("keep the left operand's per-key types as optional", () => {
            expectTypeOf(
                Obj.diff({ id: 1, first_word: "Hello" }, { x: "Hello" }),
            ).toEqualTypeOf<{ id?: number; first_word?: string }>();
            expectTypeOf(Obj.diffAssoc(abc, { a: 1 })).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
        });

        it("accept a nullable or Enumerable-like operand without a cast", () => {
            expectTypeOf(Obj.diff({ a: 1 }, nullableOther)).toEqualTypeOf<{
                a?: number;
            }>();
            expectTypeOf(
                Obj.diff({ a: 10, b: 20 }, { all: () => [20] }),
            ).toEqualTypeOf<{ a?: number; b?: number }>();
        });

        it("empty a list", () => {
            expectTypeOf(Obj.diff(numberList, [1])).toEqualTypeOf<
                Record<string, never>
            >();
        });
    });

    describe("diffAssocUsing and diffKeysUsing", () => {
        it("type each comparator key as a key of either operand", () => {
            Obj.diffAssocUsing({ a: 1, 0: 2 }, { A: 1 }, (keyA, keyB) => {
                expectTypeOf(keyA).toEqualTypeOf<"a" | 0 | "A">();
                expectTypeOf(keyB).toEqualTypeOf<"a" | 0 | "A">();

                return (
                    String(keyA).toLowerCase() === String(keyB).toLowerCase()
                );
            });
            expectTypeOf(
                Obj.diffKeysUsing(
                    abc,
                    { A: 1 },
                    (keyA, keyB) =>
                        String(keyA).toLowerCase() ===
                        String(keyB).toLowerCase(),
                ),
            ).toEqualTypeOf<Partial<{ a: number; b: number; c: number }>>();
        });

        it("type a Collection-like operand's keys from its items", () => {
            Obj.diffKeysUsing(
                { a: 1 },
                { all: () => ({ B: 2 }) },
                (keyA, keyB) => {
                    expectTypeOf(keyB).toEqualTypeOf<"a" | "B">();

                    return (
                        String(keyA).toLowerCase() ===
                        String(keyB).toLowerCase()
                    );
                },
            );
        });
    });

    describe("intersect", () => {
        it("keeps the left operand's per-key types as optional", () => {
            expectTypeOf(
                Obj.intersect(
                    { id: 1, first_word: "Hello" },
                    { first_world: "Hello", last_word: "World" },
                ),
            ).toEqualTypeOf<{
                id?: number;
                first_word?: string;
            }>();
        });

        it("types a value comparator from both operands", () => {
            Obj.intersect(abc, { x: "1" }, (a, b) => {
                expectTypeOf(a).toEqualTypeOf<number>();
                expectTypeOf(b).toEqualTypeOf<string>();

                return String(a) === b;
            });
        });

        it("types a Collection-like operand's values from its items", () => {
            Obj.intersect(abc, { all: () => ["1"] }, (a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return String(a) === b;
            });
        });

        it("accepts a nullable or Enumerable-like operand without a cast", () => {
            expectTypeOf(Obj.intersect({ a: 1 }, nullableOther)).toEqualTypeOf<{
                a?: number;
            }>();
            expectTypeOf(
                Obj.intersect({ a: 10, b: 20 }, { all: () => [20] }),
            ).toEqualTypeOf<{ a?: number; b?: number }>();
        });

        it("accepts null data, which the runtime treats as empty", () => {
            expectTypeOf(Obj.intersect(null, { a: 1 })).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });

    describe("intersectAssoc, intersectAssocUsing and intersectByKeys", () => {
        it("keep the left operand's per-key types as optional", () => {
            expectTypeOf(Obj.intersectAssoc(abc, { a: 1 })).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
            expectTypeOf(
                Obj.intersectAssocUsing(
                    abc,
                    { A: 1 },
                    (keyA, keyB) =>
                        String(keyA).toLowerCase() ===
                        String(keyB).toLowerCase(),
                ),
            ).toEqualTypeOf<Partial<{ a: number; b: number; c: number }>>();
            expectTypeOf(Obj.intersectByKeys(abc, { a: 0 })).toEqualTypeOf<
                Partial<{ a: number; b: number; c: number }>
            >();
        });

        it("let a comparator compare keys of differently keyed operands", () => {
            expectTypeOf(
                Obj.intersectAssocUsing(
                    { a: 1, b: 2 },
                    { c: 1, d: 2 },
                    (keyA, keyB) => keyA === keyB,
                ),
            ).toEqualTypeOf<Partial<{ a: number; b: number }>>();
        });

        it("accept null data, which the runtime treats as empty", () => {
            expectTypeOf(Obj.intersectAssoc(null, { a: 1 })).toEqualTypeOf<
                Record<string, unknown>
            >();
            expectTypeOf(
                Obj.intersectAssocUsing(
                    null,
                    { a: 1 },
                    (keyA, keyB) => keyA === keyB,
                ),
            ).toEqualTypeOf<Record<string, unknown>>();
            expectTypeOf(Obj.intersectByKeys(null, { a: 1 })).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });

    describe("crossJoin", () => {
        it("multiplies each argument's keys into typed rows", () => {
            expectTypeOf(
                Obj.crossJoin({ size: ["S", "M"] }, { color: ["red"] }),
            ).toEqualTypeOf<{ size: string; color: string }[]>();
            expectTypeOf(
                Obj.crossJoin({ size: ["S"], color: ["red"] }),
            ).toEqualTypeOf<{ size: string; color: string }[]>();
        });

        it("keys a list argument's rows by index", () => {
            expectTypeOf(
                Obj.crossJoin([["S", "M"]], { color: ["red"] }),
            ).toEqualTypeOf<{ [x: number]: string; color: string }[]>();
        });

        it("lets a later argument overwrite a key an earlier one set", () => {
            expectTypeOf(Obj.crossJoin({ a: ["x"] }, { a: [1] })).toEqualTypeOf<
                { a: number }[]
            >();
        });

        it("makes the keys of a spread of unknown length optional", () => {
            expectTypeOf(Obj.crossJoin({ a: [1] }, ...sizes)).toEqualTypeOf<
                { a: number; size?: string }[]
            >();
        });

        it("walks a plain-object, Set or Map dimension's values, as PHP's foreach does", () => {
            expectTypeOf(
                Obj.crossJoin({ a: [1], b: { k: "x" } }),
            ).toEqualTypeOf<{ a: number; b: string }[]>();
            expectTypeOf(
                Obj.crossJoin({ s: new Set([true]), m: new Map([["k", 1]]) }),
            ).toEqualTypeOf<{ s: boolean; m: number }[]>();
        });

        it("skips a symbol key and a class's prototype method", () => {
            const sym = Symbol("k");

            expectTypeOf(Obj.crossJoin({ a: [1], [sym]: [2] })).toEqualTypeOf<
                { a: number }[]
            >();
            expectTypeOf(
                Obj.crossJoin({} as { items: number[]; total(): number }),
            ).toEqualTypeOf<{ items: number }[]>();
        });

        it("returns one empty row with no arguments", () => {
            expectTypeOf(Obj.crossJoin()).toEqualTypeOf<
                Record<string, never>[]
            >();
        });

        it("keys a Map argument's dimensions by string, walking each one's values", () => {
            // A Map's keys are only known at runtime, so its rows gain an index signature.
            expectTypeOf(
                Obj.crossJoin(new Map([[2, ["c1", "c2"]]])),
            ).toEqualTypeOf<{ [x: string]: string }[]>();
            // A later Map may hold the key "a" too, and would overwrite it.
            expectTypeOf(
                Obj.crossJoin({ a: [1] }, new Map([["b", new Set([true])]])),
            ).toEqualTypeOf<
                { [x: string]: number | boolean; a: number | boolean }[]
            >();
        });
    });

    describe("collapse", () => {
        it("merges the inner objects", () => {
            expectTypeOf(
                Obj.collapse({ a: { x: 1 }, b: { y: "s" } }),
            ).toEqualTypeOf<{ x: number; y: string }>();
        });

        it("widens when an inner value is a list, whose elements it appends", () => {
            expectTypeOf(Obj.collapse({ a: [1, 2], b: [3] })).toEqualTypeOf<
                Record<string | number, unknown>
            >();
        });

        it("reads a Collection-like item through all() and skips a Date", () => {
            expectTypeOf(
                Obj.collapse({
                    a: { all: () => ({ x: 1 }) },
                    b: new Date(0),
                    c: { y: "s" },
                }),
            ).toEqualTypeOf<{ x: number; y: string }>();
        });

        it("holds any item's value for a shared key, and keeps a key no item always has optional", () => {
            expectTypeOf(
                Obj.collapse({ a: { x: 1 }, b: { x: "s" } }),
            ).toEqualTypeOf<{ x: number | string }>();
            expectTypeOf(
                Obj.collapse({} as Record<string, { x: number }>),
            ).toEqualTypeOf<{ x?: number }>();
        });

        it("never copies a symbol key, and reads a string-index item's values at every key", () => {
            const sym = Symbol("k");

            expectTypeOf(
                Obj.collapse({ p: { [sym]: 1, a: 2 } }),
            ).toEqualTypeOf<{ a: number }>();
            expectTypeOf(
                Obj.collapse({
                    a: {} as Record<string, number>,
                    b: { y: "s" },
                }),
            ).toEqualTypeOf<Record<string, number | string>>();
        });

        it("collapses a list's items", () => {
            expectTypeOf(Obj.collapse([{ a: 1 }, { a: 2 }])).toEqualTypeOf<{
                a?: number;
            }>();
        });

        it("collapses a Map's items, none of whose keys is certain", () => {
            // A Map may hold no item at all, so no merged key is sure to be there.
            expectTypeOf(
                Obj.collapse(new Map([[1, { k: 1, j: "s" }]])),
            ).toEqualTypeOf<{ k?: number; j?: string }>();
            expectTypeOf(Obj.collapse(new Map([[0, [1, 2]]]))).toEqualTypeOf<
                Record<string | number, unknown>
            >();
        });
    });
});
