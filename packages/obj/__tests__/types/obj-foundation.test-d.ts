import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    constRecord,
    integerKeyed,
    mapOrList,
    mapUnion,
    maybeMap,
    numberList,
    numberMap,
    type Profile,
    profile,
    readonlyRecord,
    scores,
    unknownObject,
    user,
} from "./fixtures";

describe("obj foundation type tests", () => {
    describe("accessible", () => {
        it("narrows unknown to a record", () => {
            if (Obj.accessible(unknownObject)) {
                expectTypeOf(unknownObject).toEqualTypeOf<
                    Record<PropertyKey, unknown>
                >();
            }
        });

        it("narrows a nullable interface value to the object", () => {
            const maybe = profile as Profile | null;

            if (Obj.accessible(maybe)) {
                // The guard yields Profile & Record<PropertyKey, unknown>; this pins only that null is gone.
                expectTypeOf(maybe).toExtend<Profile>();
            }
        });
    });

    describe("objectifiable", () => {
        it("narrows unknown to a string-keyed record", () => {
            if (Obj.objectifiable(unknownObject)) {
                expectTypeOf(unknownObject).toEqualTypeOf<
                    Record<string, unknown>
                >();
            }
        });
    });

    describe("from", () => {
        it("returns a plain object with its own type", () => {
            expectTypeOf(Obj.from(abc)).toEqualTypeOf<{
                a: number;
                b: number;
                c: number;
            }>();
        });

        it("keys a list by index", () => {
            expectTypeOf(Obj.from(numberList)).toEqualTypeOf<
                Record<number, number>
            >();
        });

        it("keys a Map by its value type", () => {
            expectTypeOf(Obj.from(numberMap)).toEqualTypeOf<
                Record<string, number>
            >();
        });

        it("keys a union of Maps by its members' values, and a Map or list by unknown", () => {
            expectTypeOf(Obj.from(mapUnion)).toEqualTypeOf<
                Record<string, string | number>
            >();
            expectTypeOf(Obj.from(mapOrList)).toEqualTypeOf<
                Record<string, unknown>
            >();
        });

        it("is never for a scalar, which throws", () => {
            expectTypeOf(Obj.from(123)).toEqualTypeOf<never>();
        });

        it("empties a Set, which has no own entries", () => {
            expectTypeOf(Obj.from(new Set([1]))).toEqualTypeOf<
                Record<string, never>
            >();
        });

        it("empties a Date, which keeps no data in own enumerable keys", () => {
            expectTypeOf(Obj.from(new Date(0))).toEqualTypeOf<
                Record<never, never>
            >();
        });
    });

    describe("wrap", () => {
        it("returns an empty record for null", () => {
            expectTypeOf(Obj.wrap(null)).toEqualTypeOf<Record<string, never>>();
        });

        it("returns an object unchanged, keeping readonly", () => {
            expectTypeOf(Obj.wrap(abc)).toEqualTypeOf<{
                a: number;
                b: number;
                c: number;
            }>();
            expectTypeOf(Obj.wrap(readonlyRecord)).toEqualTypeOf<
                Readonly<Record<string, number>>
            >();
        });

        it("wraps a scalar or a list under key 0", () => {
            expectTypeOf(Obj.wrap("x")).toEqualTypeOf<Record<0, string>>();
            expectTypeOf(Obj.wrap(numberList)).toEqualTypeOf<
                Record<0, number[]>
            >();
        });

        it("returns a Map or a Set unchanged, as it returns any object", () => {
            expectTypeOf(Obj.wrap(numberMap)).toEqualTypeOf<
                Map<string, number>
            >();
            expectTypeOf(Obj.wrap(new Set([1]))).toEqualTypeOf<Set<number>>();
        });

        it("splits a union between the object it returns and the value it wraps", () => {
            expectTypeOf(Obj.wrap(profile.boss)).toEqualTypeOf<
                { name: string } | Record<string, never>
            >();
            expectTypeOf(Obj.wrap(profile.nick ?? profile)).toEqualTypeOf<
                Record<0, string> | Profile
            >();
        });
    });

    describe("keys", () => {
        it("returns the literal key union", () => {
            expectTypeOf(Obj.keys(abc)).toEqualTypeOf<("a" | "b" | "c")[]>();
        });

        it("reports integer-like keys as numbers, the way PHP does", () => {
            expectTypeOf(Obj.keys(integerKeyed)).toEqualTypeOf<
                (0 | 1 | "name")[]
            >();
        });

        it("widens a dictionary to string | number", () => {
            expectTypeOf(Obj.keys(scores)).toEqualTypeOf<(string | number)[]>();
        });

        it("works for an interface", () => {
            expectTypeOf(Obj.keys(profile)).toEqualTypeOf<
                ("name" | "nick" | "boss" | "age")[]
            >();
        });

        it("returns an empty tuple for a list and falls back for unknown", () => {
            expectTypeOf(Obj.keys(numberList)).toEqualTypeOf<[]>();
            expectTypeOf(Obj.keys(unknownObject)).toEqualTypeOf<
                (string | number)[]
            >();
        });

        it("reports a Map's keys as the keys PHP stores", () => {
            // A Map<string, …> key "2" is stored as 2, as PHP casts it.
            expectTypeOf(Obj.keys(numberMap)).toEqualTypeOf<
                (string | number)[]
            >();
            expectTypeOf(
                Obj.keys(
                    new Map([
                        [2, "c"],
                        [0, "a"],
                    ]),
                ),
            ).toEqualTypeOf<number[]>();
            expectTypeOf(Obj.keys(new Map([[true, "t"]]))).toEqualTypeOf<
                (0 | 1)[]
            >();
            expectTypeOf(Obj.keys(new Map([[null, "n"]]))).toEqualTypeOf<
                ""[]
            >();
        });

        it("reports a union of Maps' keys, each as PHP stores it", () => {
            const flagsOrTwo = new Map([[true, "t"]]) as
                | Map<boolean, string>
                | Map<2, number>;

            expectTypeOf(Obj.keys(flagsOrTwo)).toEqualTypeOf<(0 | 1 | 2)[]>();
            expectTypeOf(Obj.keys(mapUnion)).toEqualTypeOf<
                (string | number)[]
            >();
        });

        it("answers the widest row, not an empty tuple, for a Map that may be missing or a list", () => {
            // The empty-result row takes no Map, so the Map member's keys are not declared away.
            expectTypeOf(Obj.keys(maybeMap)).toEqualTypeOf<
                (string | number)[]
            >();
            expectTypeOf(Obj.keys(mapOrList)).toEqualTypeOf<
                (string | number)[]
            >();
            expectTypeOf(Obj.keys(mapOrList)).not.toEqualTypeOf<[]>();
        });
    });

    describe("values", () => {
        it("returns the value union", () => {
            expectTypeOf(Obj.values(user)).toEqualTypeOf<
                (string | number | { city: string; zip: number })[]
            >();
        });

        it("keeps literal values from an as-const record", () => {
            expectTypeOf(Obj.values(constRecord)).toEqualTypeOf<
                (1 | "two")[]
            >();
        });

        it("includes undefined for an optional interface property", () => {
            expectTypeOf(Obj.values(profile)).toEqualTypeOf<
                (string | { name: string } | number | null | undefined)[]
            >();
        });

        it("accepts a readonly record", () => {
            expectTypeOf(Obj.values(readonlyRecord)).toEqualTypeOf<number[]>();
        });

        it("falls back for unknown", () => {
            expectTypeOf(Obj.values(unknownObject)).toEqualTypeOf<unknown[]>();
        });

        it("lists a Map's values", () => {
            expectTypeOf(Obj.values(numberMap)).toEqualTypeOf<number[]>();
            expectTypeOf(
                Obj.values(
                    new Map<string | number, string | boolean>([
                        [2, "c"],
                        ["x", true],
                    ]),
                ),
            ).toEqualTypeOf<(string | boolean)[]>();
        });

        it("lists a union of Maps' values, and unknown values for a Map in any other union", () => {
            expectTypeOf(Obj.values(mapUnion)).toEqualTypeOf<
                (string | number)[]
            >();
            expectTypeOf(Obj.values(maybeMap)).toEqualTypeOf<unknown[]>();
            expectTypeOf(Obj.values(mapOrList)).toEqualTypeOf<unknown[]>();
        });
    });

    describe("divide", () => {
        it("splits into typed keys and values", () => {
            expectTypeOf(Obj.divide(abc)).toEqualTypeOf<
                [("a" | "b" | "c")[], number[]]
            >();
        });

        it("destructures into typed halves", () => {
            const [keys, values] = Obj.divide(integerKeyed);

            expectTypeOf(keys).toEqualTypeOf<(0 | 1 | "name")[]>();
            expectTypeOf(values).toEqualTypeOf<string[]>();
        });

        it("splits a Map into the keys PHP stores and its values", () => {
            // A Map<string, …> key "2" is stored as 2, as PHP casts it.
            expectTypeOf(Obj.divide(numberMap)).toEqualTypeOf<
                [(string | number)[], number[]]
            >();
            expectTypeOf(Obj.divide(new Map([[2, "c"]]))).toEqualTypeOf<
                [number[], string[]]
            >();
            expectTypeOf(Obj.divide(new Map([[true, "t"]]))).toEqualTypeOf<
                [(0 | 1)[], string[]]
            >();
        });

        it("splits a union of Maps into its members' keys and values", () => {
            expectTypeOf(Obj.divide(mapUnion)).toEqualTypeOf<
                [(string | number)[], (string | number)[]]
            >();
        });

        it("falls back for unknown", () => {
            expectTypeOf(Obj.divide(unknownObject)).toEqualTypeOf<
                [(string | number)[], unknown[]]
            >();
        });
    });

    describe("combine", () => {
        it("keys the second object's values by the first object's values", () => {
            expectTypeOf(
                Obj.combine({ x: "a", y: "b" }, { p: 1, q: 2 }),
            ).toEqualTypeOf<Record<string, number>>();
        });

        it("keeps literal keys from an as-const operand", () => {
            expectTypeOf(
                Obj.combine({ x: "a", y: "b" } as const, { p: 1, q: 2 }),
            ).toEqualTypeOf<Record<"a" | "b", number>>();
        });

        it("widens a float literal key, which prints the way PHP prints a float", () => {
            expectTypeOf(Obj.combine([1.5] as const, ["a"])).toEqualTypeOf<
                Record<string, string>
            >();
        });

        it("makes a list's keys optional, since its element type names every key it may hold", () => {
            expectTypeOf(Obj.combine([true] as boolean[], ["a"])).toEqualTypeOf<
                Partial<Record<"1" | "", string>>
            >();
        });

        it("makes a key optional when its entry may print another, or the operand may hold any count", () => {
            expectTypeOf(Obj.combine(["a"] as ["a" | "b"], [1])).toEqualTypeOf<
                Partial<Record<"a" | "b", number>>
            >();
            expectTypeOf(
                Obj.combine(new Set(["a"]) as Set<"a" | "b">, [1]),
            ).toEqualTypeOf<Partial<Record<"a" | "b", number>>>();
            expectTypeOf(
                Obj.combine({ x: "a" } as { x: "a"; y?: "b" }, [1]),
            ).toEqualTypeOf<
                Record<"a", number> & Partial<Record<"b" | "", number>>
            >();
        });

        it("accepts list operands", () => {
            expectTypeOf(
                Obj.combine(["name", "family"] as const, ["taylor", "otwell"]),
            ).toEqualTypeOf<Record<"name" | "family", string>>();
        });

        it("reads a Collection-like operand's values", () => {
            expectTypeOf(
                Obj.combine(["a"] as const, { all: () => [1] }),
            ).toEqualTypeOf<Record<"a", number>>();
        });

        it("falls back for unknown operands", () => {
            expectTypeOf(
                Obj.combine(unknownObject, unknownObject),
            ).toEqualTypeOf<Record<string, unknown>>();
        });
    });
});
