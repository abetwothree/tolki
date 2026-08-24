import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

import {
    idObjects,
    nullableElements,
    nullishNumbers,
    numberGrid,
    readonlyNumbers,
    readonlyStrings,
    unionElements,
} from "./fixtures";

describe("arr predicate type tests", () => {
    describe("every", () => {
        it("returns boolean and infers callback params for an array", () => {
            const result = Arr.every([1, 2, 3], (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value > 0;
            });
            expectTypeOf(result).toEqualTypeOf<boolean>();
        });

        it("infers callback params for a string array", () => {
            Arr.every(["a", "b"], (value) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                return true;
            });
        });

        it("infers callback params for an object array", () => {
            Arr.every(idObjects, (value) => {
                expectTypeOf(value).toEqualTypeOf<{ id: number }>();
                return true;
            });
        });

        it("infers callback params for a Set", () => {
            const result = Arr.every(new Set([2, 4]), (value) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                return value % 2 === 0;
            });
            expectTypeOf(result).toEqualTypeOf<boolean>();
        });

        it("infers callback params for a generator", () => {
            function* gen(): Generator<string> {
                yield "a";
            }
            Arr.every(gen(), (value) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                return true;
            });
        });

        it("accepts a readonly array", () => {
            expectTypeOf(
                Arr.every(readonlyNumbers, (v) => v > 0),
            ).toEqualTypeOf<boolean>();
        });

        it("accepts unknown data", () => {
            const data: unknown = [1];
            expectTypeOf(
                Arr.every(data, (v: number) => v > 0),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("some", () => {
        it("returns boolean and infers callback params for an array", () => {
            const result = Arr.some([1, 2, 3], (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value > 2;
            });
            expectTypeOf(result).toEqualTypeOf<boolean>();
        });

        it("infers callback params for a union array", () => {
            Arr.some(unionElements, (value) => {
                expectTypeOf(value).toEqualTypeOf<string | number>();
                return true;
            });
        });

        it("infers callback params for a Set", () => {
            expectTypeOf(
                Arr.some(new Set([1, 2]), (v) => v > 1),
            ).toEqualTypeOf<boolean>();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(
                Arr.some(readonlyStrings, (v) => v === "a"),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("where", () => {
        it("preserves the element type and infers callback params", () => {
            const result = Arr.where([1, 2, 3, 4], (value, index) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(index).toEqualTypeOf<number>();
                return value > 2;
            });
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("preserves object element types", () => {
            const data = [{ id: 1, active: true }];
            const result = Arr.where(data, (v) => v.active);
            expectTypeOf(result).toEqualTypeOf<
                { id: number; active: boolean }[]
            >();
        });

        it("preserves union element types", () => {
            expectTypeOf(Arr.where(unionElements, () => true)).toEqualTypeOf<
                (string | number)[]
            >();
        });

        it("preserves nested array element types", () => {
            expectTypeOf(Arr.where(numberGrid, () => true)).toEqualTypeOf<
                number[][]
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(Arr.where(readonlyNumbers, () => true)).toEqualTypeOf<
                number[]
            >();
        });
    });

    describe("reject", () => {
        it("preserves the element type and infers callback params", () => {
            const result = Arr.reject([1, 2, 3, 4], (value, index) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(index).toEqualTypeOf<number>();
                return value > 2;
            });
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("preserves object element types", () => {
            expectTypeOf(Arr.reject(idObjects, () => false)).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(
                Arr.reject(readonlyStrings, () => false),
            ).toEqualTypeOf<string[]>();
        });
    });

    describe("filter", () => {
        it("preserves the element type with a callback", () => {
            const result = Arr.filter([1, 2, 3, 4], (value, index) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(index).toEqualTypeOf<number>();
                return value > 2;
            });
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("drops null and undefined from the element type without a callback", () => {
            expectTypeOf(Arr.filter(nullishNumbers)).toEqualTypeOf<number[]>();
        });

        it("drops false from the element type without a callback", () => {
            const data: (string | false)[] = ["a", false];
            expectTypeOf(Arr.filter(data)).toEqualTypeOf<string[]>();
        });

        it("leaves a non-nullable element type unchanged without a callback", () => {
            expectTypeOf(Arr.filter([1, 2, 3])).toEqualTypeOf<number[]>();
        });

        it("preserves object element types without a callback", () => {
            expectTypeOf(Arr.filter(idObjects)).toEqualTypeOf<
                { id: number }[]
            >();
        });
    });

    describe("whereNotNull", () => {
        it("drops null from a nullable element type", () => {
            expectTypeOf(Arr.whereNotNull(nullableElements)).toEqualTypeOf<
                string[]
            >();
        });

        it("drops null but keeps undefined", () => {
            expectTypeOf(Arr.whereNotNull(nullishNumbers)).toEqualTypeOf<
                (number | undefined)[]
            >();
        });

        it("leaves a non-nullable element type unchanged", () => {
            expectTypeOf(Arr.whereNotNull([1, 2, 3])).toEqualTypeOf<number[]>();
        });

        it("drops null from an object union element type", () => {
            const data: ({ id: number } | null)[] = [{ id: 1 }, null];
            expectTypeOf(Arr.whereNotNull(data)).toEqualTypeOf<
                { id: number }[]
            >();
        });

        it("accepts a readonly array", () => {
            const data: readonly (string | null)[] = nullableElements;
            expectTypeOf(Arr.whereNotNull(data)).toEqualTypeOf<string[]>();
        });

        it("returns unknown[] for unknown data", () => {
            const data: unknown = [1, null];
            expectTypeOf(Arr.whereNotNull(data)).toEqualTypeOf<unknown[]>();
        });
    });

    describe("contains", () => {
        it("returns boolean for a value search", () => {
            expectTypeOf(Arr.contains([1, 2, 3], 2)).toEqualTypeOf<boolean>();
        });

        it("returns boolean for a strict value search", () => {
            expectTypeOf(
                Arr.contains([1, 2], 1, true),
            ).toEqualTypeOf<boolean>();
        });

        it("returns boolean and infers callback params", () => {
            const result = Arr.contains([1, 2, 3], (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value === 2;
            });
            expectTypeOf(result).toEqualTypeOf<boolean>();
        });

        it("returns boolean for object element searches", () => {
            expectTypeOf(
                Arr.contains(idObjects, (v) => v.id === 1),
            ).toEqualTypeOf<boolean>();
        });

        it("returns boolean for a union element array", () => {
            expectTypeOf(
                Arr.contains(unionElements, "a"),
            ).toEqualTypeOf<boolean>();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(
                Arr.contains(readonlyNumbers, 1),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("partition", () => {
        it("returns a tuple of two same-typed arrays", () => {
            const result = Arr.partition([1, 2, 3, 4], (value, index) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(index).toEqualTypeOf<number>();
                return value > 2;
            });
            expectTypeOf(result).toEqualTypeOf<[number[], number[]]>();
        });

        it("preserves object element types", () => {
            // expect-type's tuple-equality branding can't resolve a
            // generically-inferred [T[], T[]] tuple against a literal tuple
            // type when T is an object type: toEqualTypeOf<[...]>() on the
            // whole tuple throws a misleading "Expected 1 arguments, but got
            // 0" (TS2554) instead of a real mismatch. Reproduced independently
            // of this implementation with a minimal
            // `function identity<T>(a: T[], b: T[]): [T[], T[]]`, and confirmed
            // against expect-type@1.4.0 in review. toExtend<[...]>() on the
            // whole tuple sidesteps that bug — it still fails if partition
            // regresses to a loose `{ id: number }[][]` return — but toExtend
            // alone is weaker than toEqualTypeOf on excess properties (TS
            // array assignability is covariant), so it's paired with the
            // per-half toEqualTypeOf checks below: toExtend proves the strict
            // 2-tuple shape, toEqualTypeOf proves each half is exactly
            // `{ id: number }[]`.
            const result = Arr.partition(idObjects, () => true);
            expectTypeOf(result).toExtend<
                [{ id: number }[], { id: number }[]]
            >();
            const [passed, failed] = result;
            expectTypeOf(passed).toEqualTypeOf<{ id: number }[]>();
            expectTypeOf(failed).toEqualTypeOf<{ id: number }[]>();
        });

        it("preserves union element types", () => {
            expectTypeOf(
                Arr.partition(unionElements, () => true),
            ).toEqualTypeOf<[(string | number)[], (string | number)[]]>();
        });

        it("destructures into two typed arrays", () => {
            const [passed, failed] = Arr.partition([1, 2], (v) => v > 1);
            expectTypeOf(passed).toEqualTypeOf<number[]>();
            expectTypeOf(failed).toEqualTypeOf<number[]>();
        });

        it("accepts a readonly array", () => {
            expectTypeOf(
                Arr.partition(readonlyNumbers, () => true),
            ).toEqualTypeOf<[number[], number[]]>();
        });
    });
});
