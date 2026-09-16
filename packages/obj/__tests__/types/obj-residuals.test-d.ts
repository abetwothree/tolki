import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

/**
 * The type-soundness limits follow-up F-17 parked, pinned in one place so a future change to any
 * of them is visible. Each `it` states what the runtime answers; the assertion pins what the type
 * DECLARES, so the pin fails the day a row is tightened and the note has to be rewritten.
 *
 * The matching runtime answers are pinned in `obj.spec.ts`, under
 * "F-17 residual limits: what the runtime answers where the type disagrees".
 */

/** A class instance with an own field and a prototype method, which no type can tell from a plain object. */
class Pt {
    x = 1;

    m(): number {
        return 1;
    }
}

/** A class instance with two own fields and no methods. */
class Point {
    x = 1;
    y = 2;
}

declare const optionalAll: { all?: () => number[] };
declare const optionalAllRecord: { all?: () => { x: number } };

describe("obj F-17 residual type-soundness limits", () => {
    describe("a class instance is walked where the runtime keeps it whole", () => {
        it("collapse types the instance's members as copied keys", () => {
            // Runtime: {} — collapse copies only a plain object's or a list's entries.
            expectTypeOf(Obj.collapse({ p: new Pt() })).toEqualTypeOf<{
                x: number;
                m: () => number;
            }>();
        });

        it("flatten walks into the instance", () => {
            // Runtime: [Point] — flatten keeps a class instance as one leaf value.
            expectTypeOf(Obj.flatten({ a: new Point() })).toEqualTypeOf<
                number[]
            >();
        });

        it("replaceRecursive merges onto the instance", () => {
            // Runtime: { a: { x: 5 } } — PHP recurses into two arrays only, so the
            // instance is replaced whole.
            expectTypeOf(
                Obj.replaceRecursive({ a: new Point() }, { a: { x: 5 } }),
            ).toEqualTypeOf<{ a: { x: number; y: number } }>();
        });
    });

    describe("a typed array is walked where the runtime keeps it whole", () => {
        it("flatten types the typed array's members as leaves", () => {
            // Runtime: [Uint8Array] — the leaf rule names Date, RegExp, Map, Set,
            // Promise and function, and a typed array is none of them. The declared
            // element union spells out ~40 members, so these two name it instead.
            type Leaf = ReturnType<
                typeof Obj.flatten<{ a: Uint8Array }>
            >[number];

            // toExtend, not toEqualTypeOf: the exact union is unwritable by hand. Both
            // members below are leaked from inside the typed array, so a sound
            // `Uint8Array[]` row — what the runtime answers — would reject each.
            expectTypeOf<number>().toExtend<Leaf>();
            expectTypeOf<"Uint8Array">().toExtend<Leaf>();
        });
    });

    describe("an optional all() member is not modelled as unwrapping", () => {
        it("collapse keeps the Collection-like row as it is", () => {
            // Runtime: { x: 1 } — the unwrap is `isFunction(item.all)`, which an
            // optional member satisfies at runtime but cannot guarantee in a type.
            expectTypeOf(Obj.collapse({ a: optionalAllRecord })).toEqualTypeOf<{
                all?: () => { x: number };
            }>();
        });

        it("flatten keeps the member itself as the leaf", () => {
            // Runtime: [1, 2] at every depth.
            expectTypeOf(Obj.flatten({ a: optionalAll })).toEqualTypeOf<
                ((() => number[]) | undefined)[]
            >();
            expectTypeOf(Obj.flatten({ a: optionalAll }, 1)).toEqualTypeOf<
                ({ all?: () => number[] } | (() => number[]) | undefined)[]
            >();
        });
    });

    describe("combine prints a key the way TypeScript prints a number", () => {
        it("types a literal -0 key as 0", () => {
            // Runtime: { "-0": "a" } — PHP's (string) cast keeps the sign
            // (task-24-data-release-readiness.json, "d6-combine-key-cast-minus-zero-and-1e19").
            expectTypeOf(Obj.combine([-0] as const, ["a"])).toEqualTypeOf<
                Record<"0", string>
            >();
        });

        it("types an integer-valued float past PHP_INT_MAX in full", () => {
            // Runtime: { "1.0E+19": "a" } — PHP prints such a float in exponent form
            // (same row); TypeScript's `${n}` expands it instead.
            expectTypeOf(Obj.combine([1e19] as const, ["a"])).toEqualTypeOf<
                Record<"10000000000000000000", string>
            >();
        });
    });

    describe("get reaches a user class's prototype method", () => {
        it("types the method where the runtime answers the default", () => {
            // Runtime: null — only own keys are read.
            expectTypeOf(Obj.get({ p: new Pt() }, "p.m")).toEqualTypeOf<
                () => number
            >();
        });
    });

    describe("sortRecursive", () => {
        it("keeps top-level Date data as a Date", () => {
            // Runtime: {} — a Date carries no own enumerable keys to copy.
            expectTypeOf(Obj.sortRecursive(new Date(0))).toEqualTypeOf<Date>();
        });

        it("keeps a tuple value's declared order", () => {
            // Runtime: { t: [1, 2] } — the values are sorted, so the positions move.
            expectTypeOf(
                Obj.sortRecursive({ t: [2, 1] as [2, 1] }),
            ).toEqualTypeOf<{ t: [2, 1] }>();
        });
    });

    describe("unshift on a Map and on a Set", () => {
        it("declares a fresh record for a Map, which is mutated and returned instead", () => {
            // Runtime: the same Map, with "0" set as an own key. A Map is
            // object-accessible, so unshift writes through it.
            expectTypeOf(Obj.unshift(new Map([["a", 1]]), "x")).toEqualTypeOf<
                Record<number, string>
            >();
        });

        it("declares and answers a fresh record for a Set", () => {
            // Runtime: { 0: "x", 1: "y" } — a Set is not object-accessible, so this
            // row is sound; it is kept beside the Map one so the pair stays visible.
            expectTypeOf(Obj.unshift(new Set([1]), "x", "y")).toEqualTypeOf<
                Record<number, string>
            >();
        });
    });
});
