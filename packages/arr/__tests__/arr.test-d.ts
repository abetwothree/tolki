import * as Arr from "@tolki/arr";
import type { UndotValue } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

describe("arr type tests", () => {
    describe("accessible", () => {
        it("returns boolean for any input", () => {
            expectTypeOf(Arr.accessible([])).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.accessible([1, 2])).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.accessible("abc")).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.accessible(null)).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.accessible(123)).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.accessible(12.34)).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.accessible(true)).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.accessible(new Date())).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.accessible(() => null)).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.accessible(new Object())).toEqualTypeOf<boolean>();
            expectTypeOf(
                Arr.accessible({ a: 1, b: 2 } as object),
            ).toEqualTypeOf<boolean>();
        });

        it("narrows unknown to unknown[]", () => {
            const value: unknown = [1, 2, 3];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<unknown[]>();
            }
        });

        it("preserves number[] in true branch", () => {
            const value: number[] = [1, 2, 3];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<number[]>();
            }
        });

        it("preserves string[] in true branch", () => {
            const value: string[] = ["a", "b", "c"];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<string[]>();
            }
        });

        it("preserves nested number[][] in true branch", () => {
            const value: number[][] = [
                [1, 2],
                [3, 4],
            ];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<number[][]>();
            }
        });

        it("preserves tuple type in true branch", () => {
            const value: [number, string, boolean] = [1, "a", true];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<[number, string, boolean]>();
            }
        });

        it("preserves array of objects in true branch", () => {
            const value: { id: number; name: string }[] = [
                { id: 1, name: "a" },
            ];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<
                    { id: number; name: string }[]
                >();
            }
        });

        it("narrows union type to array branch in true branch", () => {
            const value: string | number[] = [1, 2];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<number[]>();
            }
        });

        it("narrows union type to non-array branch in false branch", () => {
            const value: string | number[] = "hello";
            if (!Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<string>();
            }
        });

        it("narrows complex union in true branch", () => {
            const value: null | undefined | string | number[] | boolean = [
                1, 2,
            ];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<number[]>();
            }
        });

        it("narrows non-array types to include unknown[] in true branch", () => {
            // TypeScript's structural type system keeps intersections with unknown[]
            // for non-array types (Record, Date, functions) rather than reducing to never,
            // because these types are structurally compatible with array-like shapes.
            const obj: Record<string, number> = { a: 1, b: 2 };
            if (Arr.accessible(obj)) {
                expectTypeOf(obj).toExtend<unknown[]>();
            }

            const date = new Date();
            if (Arr.accessible(date)) {
                expectTypeOf(date).toExtend<unknown[]>();
            }

            const fn = () => null;
            if (Arr.accessible(fn)) {
                expectTypeOf(fn).toExtend<unknown[]>();
            }
        });

        it("preserves Record in false branch", () => {
            const obj: Record<string, number> = { a: 1, b: 2 };
            if (!Arr.accessible(obj)) {
                expectTypeOf(obj).toEqualTypeOf<Record<string, number>>();
            }
        });

        it("preserves Date in false branch", () => {
            const date = new Date();
            if (!Arr.accessible(date)) {
                expectTypeOf(date).toEqualTypeOf<Date>();
            }
        });

        it("preserves function in false branch", () => {
            const fn = () => null;
            if (!Arr.accessible(fn)) {
                expectTypeOf(fn).toEqualTypeOf<() => null>();
            }
        });

        it("narrows union with multiple array types in true branch", () => {
            const value: string[] | number[] | boolean = ["a"];
            if (Arr.accessible(value)) {
                // TypeScript keeps the intersection; the narrowed type extends unknown[]
                expectTypeOf(value).toExtend<unknown[]>();
            }
        });

        it("narrows union with multiple array types excludes non-array in false branch", () => {
            const value: string[] | number[] | boolean = false;
            if (!Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<boolean>();
            }
        });

        it("preserves array of union elements", () => {
            const value: (string | number)[] = [1, "a", 2];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<(string | number)[]>();
            }
        });

        it("narrows deeply nested mixed structures", () => {
            const value: { nested: number[] } | string[][] = [["a"]];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<string[][]>();
            }
        });

        it("narrows union with null and array in true branch", () => {
            const value: number[] | null = [1, 2];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<number[]>();
            }
        });

        it("narrows union with undefined and array in true branch", () => {
            const value: string[] | undefined = ["a"];
            if (Arr.accessible(value)) {
                expectTypeOf(value).toEqualTypeOf<string[]>();
            }
        });
    });

    describe("arrayable", () => {
        it("returns boolean for any input", () => {
            expectTypeOf(Arr.arrayable([])).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.arrayable([1, 2])).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.arrayable("abc")).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.arrayable(null)).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.arrayable(123)).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.arrayable(12.34)).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.arrayable(true)).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.arrayable(new Date())).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.arrayable(() => null)).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.arrayable(new Object())).toEqualTypeOf<boolean>();
            expectTypeOf(
                Arr.arrayable({ a: 1, b: 2 } as object),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(Arr.arrayable(undefined)).toEqualTypeOf<boolean>();
            expectTypeOf(
                Arr.arrayable(new Map<string, number>()),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Arr.arrayable(new Set<number>()),
            ).toEqualTypeOf<boolean>();
        });

        it("narrows unknown to unknown[] in true branch", () => {
            const value: unknown = [1, 2, 3];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<unknown[]>();
            }
        });

        it("preserves number[] in true branch via intersection", () => {
            // TypeScript narrows by intersecting the original type with the
            // predicate type (unknown[]). Since number[] extends unknown[],
            // the intersection simplifies back to number[].
            const value: number[] = [1, 2, 3];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<number[]>();
            }
        });

        it("preserves string[] in true branch via intersection", () => {
            const value: string[] = ["a", "b", "c"];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<string[]>();
            }
        });

        it("preserves tuple type in true branch via intersection", () => {
            const value: [number, string, boolean] = [1, "a", true];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<[number, string, boolean]>();
            }
        });

        it("preserves nested number[][] in true branch via intersection", () => {
            const value: number[][] = [
                [1, 2],
                [3, 4],
            ];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<number[][]>();
            }
        });

        it("preserves array of objects in true branch via intersection", () => {
            const value: { id: number; name: string }[] = [
                { id: 1, name: "a" },
            ];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<
                    { id: number; name: string }[]
                >();
            }
        });

        it("narrows readonly array to extend unknown[] in true branch", () => {
            // readonly number[] & unknown[] is complex because ReadonlyArray
            // and mutable Array are structurally different. TypeScript keeps the
            // intersection, which still extends unknown[].
            const value: readonly number[] = [1, 2, 3] as const;
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toExtend<unknown[]>();
            }
        });

        it("narrows readonly tuple to extend unknown[] in true branch", () => {
            const value: readonly [1, 2, 3] = [1, 2, 3] as const;
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toExtend<unknown[]>();
            }
        });

        it("preserves array of union elements in true branch via intersection", () => {
            const value: (string | number | boolean)[] = [1, "a", true];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<
                    (string | number | boolean)[]
                >();
            }
        });

        it("preserves deeply nested mixed structures in true branch via intersection", () => {
            const value: { nested: number[] }[][] = [[{ nested: [1, 2] }]];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<{ nested: number[] }[][]>();
            }
        });

        it("preserves array of functions in true branch via intersection", () => {
            const value: Array<(x: number) => string> = [(x) => String(x)];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<((x: number) => string)[]>();
            }
        });

        it("preserves array with optional elements in true branch via intersection", () => {
            const value: (string | undefined)[] = ["a", undefined, "b"];
            if (Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<(string | undefined)[]>();
            }
        });

        it("narrows union of array and non-array to array branch in true branch", () => {
            const value: string | number[] = [1, 2];
            if (Arr.arrayable(value)) {
                // string & unknown[] is never; number[] & unknown[] = number[]
                expectTypeOf(value).toExtend<unknown[]>();
            }
        });

        it("narrows complex union to array members in true branch", () => {
            const value:
                | null
                | undefined
                | string
                | number[]
                | boolean
                | Map<string, number> = [1, 2];
            if (Arr.arrayable(value)) {
                // Only number[] survives the intersection with unknown[]
                expectTypeOf(value).toExtend<unknown[]>();
            }
        });

        it("narrows union with multiple array types to extend unknown[] in true branch", () => {
            const value: string[] | number[] | boolean = ["a"];
            if (Arr.arrayable(value)) {
                // string[] | number[] survives the intersection, boolean is excluded
                expectTypeOf(value).toExtend<unknown[]>();
            }
        });

        it("narrows union of tuple and primitive to tuple in true branch", () => {
            const value: [number, string] | Date = [1, "a"];
            if (Arr.arrayable(value)) {
                // [number, string] extends unknown[], Date does not
                expectTypeOf(value).toEqualTypeOf<[number, string]>();
            }
        });

        it("unknown stays unknown in false branch", () => {
            const value: unknown = "hello";
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<unknown>();
            }
        });

        it("preserves non-array type in false branch of union", () => {
            const value: string | number[] = "hello";
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<string>();
            }
        });

        it("narrows union to non-array members in false branch", () => {
            // For a non-generic type predicate (value: unknown): value is unknown[],
            // TypeScript's false branch narrowing may only preserve string from
            // the union, as other types may structurally overlap with unknown[].
            const value: null | undefined | string | number[] | boolean =
                "hello";
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).not.toExtend<unknown[]>();
                expectTypeOf(value).toEqualTypeOf<string>();
            }
        });

        it("excludes multiple array types in false branch", () => {
            const value: string[] | number[] | boolean = false;
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<boolean>();
            }
        });

        it("preserves Date in false branch of union", () => {
            const value: Date | number[] = new Date();
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<Date>();
            }
        });

        it("preserves Record in false branch of union", () => {
            const value: Record<string, number> | string[] = { a: 1 };
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<Record<string, number>>();
            }
        });

        it("preserves function type in false branch of union", () => {
            const value: (() => void) | number[] = () => {};
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<() => void>();
            }
        });

        it("preserves Map in false branch of union", () => {
            const value: Map<string, number> | boolean[] = new Map();
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<Map<string, number>>();
            }
        });

        it("preserves Set in false branch of union", () => {
            const value: Set<string> | string[] = new Set<string>();
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<Set<string>>();
            }
        });

        it("excludes tuple from union in false branch", () => {
            const value: [number, string] | Date = new Date();
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).toEqualTypeOf<Date>();
            }
        });

        it("narrows never when only array types in union (true branch covers all)", () => {
            const value: number[] | string[] = [1];
            if (!Arr.arrayable(value)) {
                expectTypeOf(value).toBeNever();
            }
        });

        it("accepts parameter typed as unknown", () => {
            expectTypeOf(Arr.arrayable).parameter(0).toEqualTypeOf<unknown>();
        });

        it("has a type guard return type", () => {
            expectTypeOf(Arr.arrayable).guards.toEqualTypeOf<unknown[]>();
        });
    });

    describe("add", () => {
        describe("Same-type additions (TValue === TAddValue → T[])", () => {
            it("returns number[] when adding number to number array", () => {
                const result = Arr.add([1, 2, 3], 3, 4);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] when adding string to string array", () => {
                const result = Arr.add(["a", "b"], 2, "c");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns boolean[] when adding boolean to boolean array", () => {
                const result = Arr.add([true, false], 2, true);
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });
        });

        describe("Mixed-type additions (TValue !== TAddValue → (TValue | TAddValue)[])", () => {
            it("returns (string | number)[] when adding number to string array", () => {
                const result = Arr.add(["a", "b"], 2, 5);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });

            it("returns (number | string)[] when adding string to number array", () => {
                const result = Arr.add([1, 2, 3], 3, "four");
                expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
            });

            it("returns (string | boolean)[] when adding boolean to string array", () => {
                const result = Arr.add(["hello"], 1, true);
                expectTypeOf(result).toEqualTypeOf<(string | boolean)[]>();
            });

            it("returns (number | null)[] when adding null to number array", () => {
                const result = Arr.add([1, 2], 2, null);
                expectTypeOf(result).toEqualTypeOf<(number | null)[]>();
            });

            it("returns (number | undefined)[] when adding undefined to number array", () => {
                const result = Arr.add([1, 2], 2, undefined);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[]>();
            });
        });

        describe("Empty array input", () => {
            it("infers never for TValue with empty array, result is TAddValue[]", () => {
                const result = Arr.add([], "0", "first");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("infers never for TValue with empty array, number value returns number[]", () => {
                const result = Arr.add([], 1, 42);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("infers never for TValue with empty array, object value returns object[]", () => {
                const result = Arr.add([], "user.name", {
                    first: "John",
                    last: "Doe",
                });
                expectTypeOf(result).toEqualTypeOf<
                    { first: string; last: string }[]
                >();
            });
        });

        describe("PathKey variations", () => {
            it("accepts numeric key", () => {
                const result = Arr.add([10, 20], 0, 30);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts string dot-notation key", () => {
                const result = Arr.add([{ name: "John" }], "0.age", 30);
                expectTypeOf(result).toEqualTypeOf<
                    ({ name: string } | number)[]
                >();
            });

            it("accepts null key", () => {
                const result = Arr.add([1, 2], null, 3);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts undefined key", () => {
                const result = Arr.add([1, 2], undefined, 3);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("Complex object arrays", () => {
            it("returns same type when adding matching complex object shape", () => {
                const data = [{ name: "John", age: 30, active: true }];
                const result = Arr.add(data, 1, {
                    name: "Jane",
                    age: 25,
                    active: false,
                });
                expectTypeOf(result).toExtend<
                    { name: string; age: number; active: boolean }[]
                >();
            });

            it("returns union when adding different object shape to object array", () => {
                const data = [{ id: 1, name: "Item" }];
                const result = Arr.add(data, 1, {
                    price: 9.99,
                    currency: "USD",
                });
                expectTypeOf(result).toEqualTypeOf<
                    (
                        | { id: number; name: string }
                        | { price: number; currency: string }
                    )[]
                >();
            });

            it("preserves nested object structure in TValue", () => {
                const data = [
                    { user: { profile: { name: "John", scores: [100, 200] } } },
                ];
                const result = Arr.add(data, 1, {
                    user: { profile: { name: "Jane", scores: [300] } },
                });
                expectTypeOf(result).toExtend<
                    { user: { profile: { name: string; scores: number[] } } }[]
                >();
            });

            it("handles adding primitive to deeply nested object array", () => {
                const data = [{ a: { b: { c: { d: 1 } } } }];
                const result = Arr.add(data, "0.a.b.c.e", "deep");
                expectTypeOf(result).toEqualTypeOf<
                    ({ a: { b: { c: { d: number } } } } | string)[]
                >();
            });
        });

        describe("Array of arrays", () => {
            it("returns nested array union when adding array to array of arrays", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                ];
                const result = Arr.add(data, 2, [5, 6]);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("returns mixed nested types when adding different array to array of arrays", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                ];
                const result = Arr.add(data, 2, ["a", "b"]);
                expectTypeOf(result).toEqualTypeOf<(number[] | string[])[]>();
            });
        });

        describe("Union type arrays", () => {
            it("preserves union TValue and adds to it", () => {
                const data: (string | number)[] = [1, "two", 3];
                const result = Arr.add(data, 3, true);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean)[]
                >();
            });

            it("collapses when TAddValue is subset of TValue union", () => {
                const data: (string | number | boolean)[] = [1, "two", true];
                const result = Arr.add(data, 3, 42);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean)[]
                >();
            });
        });

        describe("Tuple-like inputs", () => {
            it("infers union element type from tuple input", () => {
                const data: [number, string, boolean] = [1, "hello", true];
                const result = Arr.add(data, 3, null);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean | null)[]
                >();
            });

            it("collapses tuple when adding same-type element", () => {
                const data: [number, number, number] = [1, 2, 3];
                const result = Arr.add(data, 3, 4);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("Function and special type values", () => {
            it("handles adding a function as TAddValue", () => {
                const fn = (x: number) => x * 2;
                const result = Arr.add([1, 2], 2, fn);
                expectTypeOf(result).toEqualTypeOf<
                    (number | ((x: number) => number))[]
                >();
            });

            it("handles array of functions with function addition", () => {
                const data: ((x: number) => number)[] = [
                    (x: number) => x + 1,
                    (x: number) => x - 1,
                ];
                const result = Arr.add(data, 2, (x: number) => x * 2);
                expectTypeOf(result).toExtend<((x: number) => number)[]>();
            });

            it("handles Map as TAddValue", () => {
                const result = Arr.add([1, 2], 2, new Map<string, number>());
                expectTypeOf(result).toEqualTypeOf<
                    (number | Map<string, number>)[]
                >();
            });

            it("handles Set as TAddValue", () => {
                const result = Arr.add(["a", "b"], 2, new Set<string>());
                expectTypeOf(result).toEqualTypeOf<(string | Set<string>)[]>();
            });

            it("handles Date as TAddValue", () => {
                const result = Arr.add([1, 2, 3], 3, new Date());
                expectTypeOf(result).toEqualTypeOf<(number | Date)[]>();
            });

            it("handles RegExp as TAddValue", () => {
                const result = Arr.add(["pattern"], 1, /test/gi);
                expectTypeOf(result).toEqualTypeOf<(string | RegExp)[]>();
            });
        });

        describe("Arrays of Maps/Sets/Dates", () => {
            it("handles array of Dates with Date addition", () => {
                const data = [new Date("2024-01-01"), new Date("2024-06-15")];
                const result = Arr.add(data, 2, new Date("2025-01-01"));
                expectTypeOf(result).toEqualTypeOf<Date[]>();
            });

            it("handles array of Maps with primitive addition", () => {
                const data = [new Map<string, number>([["a", 1]])];
                const result = Arr.add(data, 1, "fallback");
                expectTypeOf(result).toEqualTypeOf<
                    (Map<string, number> | string)[]
                >();
            });
        });

        describe("Const and readonly array inputs", () => {
            it("accepts const array input (readonly is assignable to ArrayItems)", () => {
                const data = [1, 2, 3] as const;
                const result = Arr.add(data, 3, 4);
                expectTypeOf(result).toEqualTypeOf<(1 | 2 | 3 | number)[]>();
            });

            it("accepts readonly array input (readonly is assignable to ArrayItems)", () => {
                const data: readonly string[] = ["a", "b"];
                const result = Arr.add(data, 2, "c");
                expectTypeOf(result).toEqualTypeOf<(string | string)[]>();
            });
        });

        describe("Realistic use-cases mirroring functional tests", () => {
            it("models PHP testAdd: adding to typed array with dot key", () => {
                // Arr::add([], 'surname', 'Mövsümov')
                const result = Arr.add([], "surname", "Mövsümov");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("models PHP testAdd: nested dot notation with object creation", () => {
                // Arr::add([], 'developer.name', 'Ferid')
                const result = Arr.add([], "developer.name", "Ferid");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("models JS test: adding to array of objects with dot notation", () => {
                const data = [{ name: "John" }];
                const result = Arr.add(data, "0.age", 30);
                expectTypeOf(result).toEqualTypeOf<
                    ({ name: string } | number)[]
                >();
            });

            it("models JS test: adding to existing key doesn't change type", () => {
                const data = ["existing"];
                const result = Arr.add(data, 0, "new");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("Complex nested data structures", () => {
            it("handles array of records with string keys", () => {
                const data: Record<string, number>[] = [{ a: 1, b: 2 }];
                const result = Arr.add(data, 1, { c: 3 });
                expectTypeOf(result).toEqualTypeOf<
                    (Record<string, number> | { c: number })[]
                >();
            });

            it("handles mixed array of objects and primitives", () => {
                const data: ({ id: number } | string)[] = [{ id: 1 }, "hello"];
                const result = Arr.add(data, 2, 42);
                expectTypeOf(result).toEqualTypeOf<
                    (string | { id: number } | number)[]
                >();
            });

            it("handles array of arrays of objects", () => {
                const data = [[{ x: 1 }, { x: 2 }], [{ x: 3 }]];
                const result = Arr.add(data, 2, [{ x: 4 }]);
                expectTypeOf(result).toExtend<{ x: number }[][]>();
            });

            it("handles array with optional properties in objects", () => {
                const data: { name: string; age?: number }[] = [
                    { name: "Alice" },
                ];
                const result = Arr.add(data, 1, { name: "Bob", age: 30 });
                expectTypeOf(result).toExtend<
                    { name: string; age?: number | undefined }[]
                >();
            });
        });

        describe("Function signature", () => {
            it("first parameter accepts ArrayItems<TValue>", () => {
                expectTypeOf(Arr.add).parameter(0).toExtend<readonly unknown[]>();
            });

            it("second parameter accepts PathKey", () => {
                expectTypeOf(Arr.add)
                    .parameter(1)
                    .toEqualTypeOf<string | number | null | undefined>();
            });

            it("third parameter accepts TAddValue", () => {
                expectTypeOf(Arr.add).parameter(2).toExtend<unknown>();
            });

            it("returns an array type", () => {
                expectTypeOf(Arr.add).returns.toExtend<unknown[]>();
            });
        });
    });

    describe("arrayItem", () => {
        describe("Infers specific array types from literal paths", () => {
            it("infers number[] for array of number arrays at numeric index", () => {
                const result = Arr.arrayItem(
                    [
                        [1, 2],
                        [3, 4],
                    ],
                    0,
                );
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("infers string[] for array of string arrays at numeric index", () => {
                const result = Arr.arrayItem(
                    [
                        ["a", "b"],
                        ["c", "d"],
                    ],
                    0,
                );
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("infers string[] via dot notation into object array property", () => {
                const result = Arr.arrayItem(
                    [{ items: ["x", "y"] }],
                    "0.items",
                );
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("infers number[] through deeply nested dot path", () => {
                const data = [{ a: { b: { c: [1, 2, 3] } } }];
                const result = Arr.arrayItem(data, "0.a.b.c");
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("infers complex object array type from dot path", () => {
                const data = [
                    { users: [{ name: "John", scores: [100, 200] }] },
                    { users: [{ name: "Jane", scores: [300] }] },
                ];
                const result = Arr.arrayItem(data, "0.users");
                expectTypeOf(result).toEqualTypeOf<
                    { name: string; scores: number[] }[]
                >();
            });

            it("infers number[] for object with numeric array property", () => {
                const result = Arr.arrayItem([{ items: [1, 2] }], "0.items");
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("infers tuple type for array of tuples at index", () => {
                const data: [string, number][] = [
                    ["a", 1],
                    ["b", 2],
                ];
                const result = Arr.arrayItem(data, 0);
                expectTypeOf(result).toEqualTypeOf<[string, number]>();
            });

            it("infers number[] for single nested array at string key '0'", () => {
                const result = Arr.arrayItem([[1]], "0");
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("infers number[] via dot path into nested property", () => {
                const result = Arr.arrayItem([{ nested: [1] }], "0.nested");
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("infers number[] from Record<string, number[]> via dot path", () => {
                const data: Record<string, number[]>[] = [
                    { scores: [100, 200] },
                ];
                const result = Arr.arrayItem(data, "0.scores");
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("infers specific employee array from deeply nested path", () => {
                const data = [
                    {
                        department: {
                            employees: [
                                {
                                    name: "Alice",
                                    skills: ["TypeScript", "React"],
                                },
                                { name: "Bob", skills: ["Python", "Django"] },
                            ],
                        },
                    },
                ];
                const result = Arr.arrayItem(data, "0.department.employees");
                expectTypeOf(result).toEqualTypeOf<
                    { name: string; skills: string[] }[]
                >();
            });

            it("infers same type with numeric key 0 and string key '0'", () => {
                const data = [["a", "b"]];
                const resultNum = Arr.arrayItem(data, 0);
                const resultStr = Arr.arrayItem(data, "0");
                expectTypeOf(resultNum).toEqualTypeOf<string[]>();
                expectTypeOf(resultStr).toEqualTypeOf<string[]>();
            });
        });

        describe("Infers specific array types even with default value", () => {
            it("infers number[] even when default is empty array", () => {
                const result = Arr.arrayItem(
                    [
                        [1, 2],
                        [3, 4],
                    ],
                    0,
                    [],
                );
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("infers string[] via dot path when default is null", () => {
                const result = Arr.arrayItem(
                    [{ items: ["x", "y"] }],
                    "0.items",
                    null,
                );
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("infers string[] via dot path when default is closure", () => {
                const result = Arr.arrayItem(
                    [{ items: ["x", "y"] }],
                    "0.items",
                    () => ["fallback"],
                );
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("Falls back to unknown[] for non-array element types", () => {
            it("returns unknown[] when element type is number (not array)", () => {
                const result = Arr.arrayItem([1, 2, 3], 0);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });

            it("returns unknown[] for number element with default empty array", () => {
                const result = Arr.arrayItem([1, 2, 3], 10, []);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });

            it("returns unknown[] for number element with typed array default", () => {
                const result = Arr.arrayItem([1, 2, 3], 10, ["fallback"]);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });

            it("returns unknown[] for number element with closure default", () => {
                const result = Arr.arrayItem([1, 2, 3], 10, () => [42]);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });

            it("returns unknown[] for number element with null default", () => {
                const result = Arr.arrayItem([1, 2, 3], 10, null);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });

            it("returns unknown[] when element is a function returning array", () => {
                const data = [() => [1, 2, 3]];
                const result = Arr.arrayItem(data, 0);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("Falls back to unknown[] for union element types", () => {
            it("returns unknown[] | number[] for union element types (EnsureArray distributes)", () => {
                const data: (string | number[] | null)[] = [
                    "hello",
                    [1, 2],
                    null,
                ];
                const result = Arr.arrayItem(data, 1);
                expectTypeOf(result).toEqualTypeOf<unknown[] | number[]>();
            });
        });

        describe("Falls back to unknown[] for non-resolvable paths", () => {
            it("returns unknown[] for Map type via dot path (not indexable)", () => {
                const data = [new Map<string, number[]>([["key", [1, 2]]])];
                const result = Arr.arrayItem(data, "0.key");
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("Falls back to unknown[] for null/undefined keys", () => {
            it("returns unknown[] with null key", () => {
                const result = Arr.arrayItem([[1, 2]], null);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });

            it("returns unknown[] with undefined key", () => {
                const result = Arr.arrayItem([[1, 2]], undefined);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("Falls back to unknown[] for non-literal keys", () => {
            it("returns unknown[] when key is widened string type", () => {
                const key: string = "0";
                const result = Arr.arrayItem([[1, 2]], key);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });

            it("returns unknown[] when key is widened number type", () => {
                const key: number = 0;
                const result = Arr.arrayItem([[1, 2]], key);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("Falls back to unknown[] when data is untyped or unknown", () => {
            it("returns unknown[] when data is typed as unknown", () => {
                const data: unknown = [["a", "b"]];
                const result = Arr.arrayItem(data, 0);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("Edge cases with empty arrays and defaults", () => {
            it("returns unknown[] for empty array literal with default", () => {
                const result = Arr.arrayItem([], 0, ["default"]);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });

            it("returns unknown[] for number element without default", () => {
                const result = Arr.arrayItem([1, 2, 3], 10);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("models PHP Arr::array: homogeneous array resolves to element type", () => {
            it("models PHP Arr::array: heterogeneous array resolves to union element type", () => {
                // When data is a regular (non-tuple) array, TypeScript unifies all
                // elements into a single union type. Per-index type narrowing is not
                // possible because TypeScript doesn't track individual positions in
                // regular arrays — only tuples preserve per-index types.
                const data = [
                    ["a", "b"],
                    ["e", 1],
                    [1, 2, 3],
                    [{ name: "John", scores: [100, 200] }],
                ];
                // All indices resolve to the same widened union element type
                const result = Arr.arrayItem(data, 0);
                expectTypeOf(result).toExtend<unknown[]>();
                // Each index returns the same union since it's a regular array
                expectTypeOf(Arr.arrayItem(data, 1)).toEqualTypeOf(result);
                expectTypeOf(Arr.arrayItem(data, 2)).toEqualTypeOf(result);
                expectTypeOf(Arr.arrayItem(data, 3)).toEqualTypeOf(result);
            });

            it("resolves per-index types when data is a tuple", () => {
                // Tuples preserve per-index type information, enabling precise resolution
                const data: [
                    string[],
                    (string | number)[],
                    number[],
                    { name: string; scores: number[] }[],
                ] = [
                    ["a", "b"],
                    ["e", 1],
                    [1, 2, 3],
                    [{ name: "John", scores: [100, 200] }],
                ];
                expectTypeOf(Arr.arrayItem(data, 0)).toEqualTypeOf<string[]>();
                expectTypeOf(Arr.arrayItem(data, 1)).toEqualTypeOf<
                    (string | number)[]
                >();
                expectTypeOf(Arr.arrayItem(data, 2)).toEqualTypeOf<number[]>();
                expectTypeOf(Arr.arrayItem(data, 3)).toEqualTypeOf<
                    { name: string; scores: number[] }[]
                >();
            });

            it("resolves nested properties through homogeneous object arrays", () => {
                // For dot-path resolution into object properties, use a single-type array
                const nameData = [{ name: "John", scores: [100, 200] }];
                expectTypeOf(Arr.arrayItem(nameData, "0.scores")).toEqualTypeOf<
                    number[]
                >();
            });

            it("models PHP Arr::array: dot notation into object property returns specific type", () => {
                const result = Arr.arrayItem(
                    [{ items: ["x", "y"] }],
                    "0.items",
                );
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("models JS test: non-array element resolves to unknown[]", () => {
                const result = Arr.arrayItem([1, 2, 3], 0);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("Compile-check: all PathKey variants accepted for key parameter", () => {
            it("accepts all PathKey types for key parameter", () => {
                Arr.arrayItem([[1]], 0);
                Arr.arrayItem([[1]], "0");
                Arr.arrayItem([[1]], null);
                Arr.arrayItem([[1]], undefined);
            });

            it("generic fallback overload returns unknown[] for untyped calls", () => {
                const data: unknown = [];
                const result = Arr.arrayItem(data, 0);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });
    });

    describe("boolean", () => {
        describe("basic return type", () => {
            it("returns boolean from a boolean array with numeric key", () => {
                const result = Arr.boolean([true, false], 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from a boolean array with second index", () => {
                const result = Arr.boolean([true, false, true], 2);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from a mixed-type array with numeric key", () => {
                const result = Arr.boolean([1, "hello", true, null], 2);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from a string array (would throw at runtime)", () => {
                const result = Arr.boolean(["yes", "no"], 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from a number array (would throw at runtime)", () => {
                const result = Arr.boolean([42, 0, -1], 1);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("dot notation paths", () => {
            it("returns boolean with dot notation string key into nested object", () => {
                const result = Arr.boolean([{ active: true }], "0.active");
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with deeply nested dot notation path", () => {
                const result = Arr.boolean(
                    [
                        {
                            user: {
                                settings: { notifications: { email: true } },
                            },
                        },
                    ],
                    "0.user.settings.notifications.email",
                );
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with multi-level dot path into array of complex objects", () => {
                const data = [
                    {
                        config: {
                            features: {
                                darkMode: false,
                                betaAccess: true,
                            },
                        },
                    },
                ];
                const result = Arr.boolean(data, "0.config.features.darkMode");
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with string key on flat object array", () => {
                const result = Arr.boolean(
                    [{ enabled: false, visible: true }],
                    "0.enabled",
                );
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("default value variations", () => {
            it("returns boolean with boolean default value", () => {
                const result = Arr.boolean([1, 2, 3], 10, false);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with true as default value", () => {
                const result = Arr.boolean([1, 2, 3], 99, true);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with null default value", () => {
                const result = Arr.boolean([true], 5, null);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with no default value (implicit null)", () => {
                const result = Arr.boolean([true, false], 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with closure default returning boolean", () => {
                const result = Arr.boolean([true], 5, () => false);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with closure default returning true", () => {
                const result = Arr.boolean([], 0, () => true);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with closure default returning null", () => {
                const result = Arr.boolean([true], 5, () => null);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with number default (would throw at runtime)", () => {
                const result = Arr.boolean([true], 5, 42);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with string default (would throw at runtime)", () => {
                const result = Arr.boolean([true], 5, "fallback");
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("PathKey variations", () => {
            it("returns boolean with number key", () => {
                const result = Arr.boolean([true, false], 1);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with string key", () => {
                const result = Arr.boolean([{ active: true }], "0.active");
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with null key", () => {
                const result = Arr.boolean([true], null);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with undefined key", () => {
                const result = Arr.boolean([true], undefined);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with non-literal number key", () => {
                const key: number = 0;
                const result = Arr.boolean([true, false], key);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with non-literal string key", () => {
                const key: string = "0.active";
                const result = Arr.boolean([{ active: true }], key);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean with key from variable typed as PathKey", () => {
                const key: number | string | null | undefined = "0.active";
                const result = Arr.boolean([{ active: true }], key);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("complex data structures", () => {
            it("returns boolean from array of objects with mixed value types", () => {
                const data = [
                    { id: 1, name: "Alice", active: true, score: 95.5 },
                    { id: 2, name: "Bob", active: false, score: 82.0 },
                ];
                const result = Arr.boolean(data, "0.active");
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from heterogeneous tuple", () => {
                const data = [
                    42,
                    "hello",
                    true,
                    null,
                    { nested: false },
                ] as const;
                const result = Arr.boolean(data, 2);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from array with nested arrays and objects", () => {
                const data = [
                    {
                        users: [
                            {
                                profile: {
                                    verified: true,
                                    premium: false,
                                    settings: {
                                        twoFactor: true,
                                        marketing: false,
                                    },
                                },
                            },
                        ],
                    },
                ];
                const result = Arr.boolean(
                    data,
                    "0.users.0.profile.settings.twoFactor",
                );
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from array with optional properties", () => {
                const data: { enabled?: boolean; label: string }[] = [
                    { enabled: true, label: "test" },
                ];
                const result = Arr.boolean(data, "0.enabled");
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from array with union-typed elements", () => {
                const data: (string | number | boolean)[] = [true, 42, "hello"];
                const result = Arr.boolean(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from readonly array", () => {
                const data: readonly boolean[] = [true, false, true];
                const result = Arr.boolean(data, 1);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from deeply nested readonly structure", () => {
                const data = [
                    {
                        level1: {
                            level2: {
                                level3: {
                                    level4: {
                                        flag: true,
                                    },
                                },
                            },
                        },
                    },
                ] as const;
                const result = Arr.boolean(
                    data,
                    "0.level1.level2.level3.level4.flag",
                );
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from array with symbol and numeric keys in objects", () => {
                const data = [{ 0: true, 1: false, name: "test" }];
                const result = Arr.boolean(data, "0.0");
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from empty array with default", () => {
                const data: boolean[] = [];
                const result = Arr.boolean(data, 0, false);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("unknown and untyped data", () => {
            it("returns boolean from unknown data", () => {
                const data: unknown = [true, false];
                const result = Arr.boolean(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from unknown data with default", () => {
                const data: unknown = [true];
                const result = Arr.boolean(data, 5, true);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from unknown data with closure default", () => {
                const data: unknown = [true];
                const result = Arr.boolean(data, 5, () => false);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean from any-typed data", () => {
                const data: any = [true];
                const result = Arr.boolean(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("function signature", () => {
            it("accepts ArrayItems<TValue> as first parameter", () => {
                expectTypeOf(Arr.boolean).parameter(0).toExtend<unknown>();
            });

            it("accepts PathKey as second parameter", () => {
                expectTypeOf(Arr.boolean)
                    .parameter(1)
                    .toExtend<number | string | null | undefined>();
            });

            it("returns boolean type", () => {
                expectTypeOf(Arr.boolean).returns.toEqualTypeOf<boolean>();
            });
        });
    });

    describe("chunk", () => {
        describe("basic return type", () => {
            it("returns number[][] for number array", () => {
                const result = Arr.chunk([1, 2, 3, 4], 2);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("returns string[][] for string array", () => {
                const result = Arr.chunk(["a", "b", "c", "d"], 2);
                expectTypeOf(result).toEqualTypeOf<string[][]>();
            });

            it("returns boolean[][] for boolean array", () => {
                const result = Arr.chunk([true, false, true], 2);
                expectTypeOf(result).toEqualTypeOf<boolean[][]>();
            });

            it("returns bigint[][] for bigint array", () => {
                const result = Arr.chunk([1n, 2n, 3n], 2);
                expectTypeOf(result).toEqualTypeOf<bigint[][]>();
            });
        });

        describe("preserves element type for complex data structures", () => {
            it("returns object[][] for array of flat objects", () => {
                const data = [
                    { id: 1, name: "Alice" },
                    { id: 2, name: "Bob" },
                    { id: 3, name: "Charlie" },
                    { id: 4, name: "Diana" },
                ];
                const result = Arr.chunk(data, 2);
                expectTypeOf(result).toEqualTypeOf<
                    { id: number; name: string }[][]
                >();
            });

            it("returns nested object[][] for deeply nested objects", () => {
                const data = [
                    {
                        user: {
                            profile: {
                                name: "Alice",
                                settings: { darkMode: true, lang: "en" },
                            },
                        },
                    },
                    {
                        user: {
                            profile: {
                                name: "Bob",
                                settings: { darkMode: false, lang: "fr" },
                            },
                        },
                    },
                ];
                const result = Arr.chunk(data, 1);
                expectTypeOf(result).toEqualTypeOf<
                    {
                        user: {
                            profile: {
                                name: string;
                                settings: { darkMode: boolean; lang: string };
                            };
                        };
                    }[][]
                >();
            });

            it("returns array[][][] for array of arrays", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                    [5, 6],
                    [7, 8],
                ];
                const result = Arr.chunk(data, 2);
                expectTypeOf(result).toEqualTypeOf<number[][][]>();
            });

            it("preserves optional properties in element type", () => {
                const data: { name: string; age?: number }[] = [
                    { name: "Alice", age: 30 },
                    { name: "Bob" },
                ];
                const result = Arr.chunk(data, 1);
                expectTypeOf(result).toEqualTypeOf<
                    { name: string; age?: number }[][]
                >();
            });

            it("preserves readonly properties in element type", () => {
                const data: { readonly id: number; name: string }[] = [
                    { id: 1, name: "Alice" },
                    { id: 2, name: "Bob" },
                ];
                const result = Arr.chunk(data, 1);
                expectTypeOf(result).toEqualTypeOf<
                    { readonly id: number; name: string }[][]
                >();
            });
        });

        describe("union and mixed element types", () => {
            it("returns (string | number)[][] for mixed string/number array", () => {
                const data = [1, "two", 3, "four", 5];
                const result = Arr.chunk(data, 2);
                expectTypeOf(result).toEqualTypeOf<(string | number)[][]>();
            });

            it("returns wide union[][] for heterogeneous array", () => {
                const data = [42, "hello", true, null, undefined];
                const result = Arr.chunk(data, 2);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean | null | undefined)[][]
                >();
            });

            it("returns union of object shapes when elements differ", () => {
                const data: (
                    | { type: "a"; value: number }
                    | { type: "b"; label: string }
                )[] = [
                    { type: "a", value: 1 },
                    { type: "b", label: "test" },
                ];
                const result = Arr.chunk(data, 1);
                expectTypeOf(result).toEqualTypeOf<
                    (
                        | { type: "a"; value: number }
                        | { type: "b"; label: string }
                    )[][]
                >();
            });

            it("returns (T | null)[][] for nullable element arrays", () => {
                const data: (number | null)[] = [1, null, 3, null, 5];
                const result = Arr.chunk(data, 2);
                expectTypeOf(result).toEqualTypeOf<(number | null)[][]>();
            });
        });

        describe("empty and edge-case inputs", () => {
            it("returns never[][] for empty literal array", () => {
                const result = Arr.chunk([], 2);
                expectTypeOf(result).toEqualTypeOf<never[][]>();
            });

            it("returns typed[][] even with zero size", () => {
                const result = Arr.chunk([1, 2, 3], 0);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("returns typed[][] even with negative size", () => {
                const result = Arr.chunk([1, 2, 3], -1);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("returns typed[][] with size of 1", () => {
                const result = Arr.chunk(["a", "b", "c"], 1);
                expectTypeOf(result).toEqualTypeOf<string[][]>();
            });

            it("returns typed[][] when size exceeds array length", () => {
                const result = Arr.chunk([1, 2], 100);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });
        });

        describe("size parameter types", () => {
            it("accepts literal number for size", () => {
                const result = Arr.chunk([1, 2, 3], 2);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("accepts non-literal number for size", () => {
                const size: number = 3;
                const result = Arr.chunk([1, 2, 3, 4], size);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("accepts computed size value", () => {
                const data = [1, 2, 3, 4, 5, 6];
                const result = Arr.chunk(data, Math.ceil(data.length / 2));
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });
        });

        describe("inferred types without manual annotation", () => {
            it("infers element type from inline array of objects", () => {
                const result = Arr.chunk(
                    [
                        { id: 1, tags: ["a", "b"], active: true },
                        { id: 2, tags: ["c"], active: false },
                        { id: 3, tags: ["d", "e", "f"], active: true },
                    ],
                    2,
                );
                expectTypeOf(result).toEqualTypeOf<
                    { id: number; tags: string[]; active: boolean }[][]
                >();
            });

            it("infers element type from array with nested arrays and objects", () => {
                const result = Arr.chunk(
                    [
                        {
                            matrix: [
                                [1, 2],
                                [3, 4],
                            ],
                            labels: { x: "a", y: "b" },
                        },
                        {
                            matrix: [
                                [5, 6],
                                [7, 8],
                            ],
                            labels: { x: "c", y: "d" },
                        },
                    ],
                    1,
                );
                expectTypeOf(result).toEqualTypeOf<
                    {
                        matrix: number[][];
                        labels: { x: string; y: string };
                    }[][]
                >();
            });

            it("infers element type from array with functions as values", () => {
                const data = [
                    { name: "test", handler: (x: number) => x * 2 },
                    { name: "other", handler: (x: number) => x + 1 },
                ];
                const result = Arr.chunk(data, 1);
                expectTypeOf(result).toEqualTypeOf<
                    { name: string; handler: (x: number) => number }[][]
                >();
            });

            it("infers tuple element types as unions", () => {
                const data: [number, string, boolean] = [42, "hello", true];
                const result = Arr.chunk(data, 2);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean)[][]
                >();
            });
        });

        describe("data parameter variations", () => {
            it("accepts Array<T> typed input", () => {
                const data: Array<{ x: number; y: number }> = [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ];
                const result = Arr.chunk(data, 1);
                expectTypeOf(result).toEqualTypeOf<
                    { x: number; y: number }[][]
                >();
            });

            it("accepts typed array variable", () => {
                const data: string[] = ["a", "b", "c", "d"];
                const result = Arr.chunk(data, 2);
                expectTypeOf(result).toEqualTypeOf<string[][]>();
            });

            it("accepts array from Array.from()", () => {
                const data = Array.from({ length: 5 }, (_, i) => i);
                const result = Arr.chunk(data, 2);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("accepts array from map operation", () => {
                const data = [1, 2, 3].map((n) => ({
                    value: n,
                    label: `#${n}`,
                }));
                const result = Arr.chunk(data, 2);
                expectTypeOf(result).toEqualTypeOf<
                    { value: number; label: string }[][]
                >();
            });

            it("accepts array from filter operation", () => {
                const data = [1, 2, 3, 4, 5].filter((n) => n > 2);
                const result = Arr.chunk(data, 2);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });
        });

        describe("function signature", () => {
            it("has correct parameter types", () => {
                expectTypeOf(Arr.chunk).parameters.toExtend<
                    [readonly unknown[], number]
                >();
            });

            it("first parameter accepts arrays", () => {
                expectTypeOf(Arr.chunk).parameter(0).toExtend<readonly unknown[]>();
            });

            it("second parameter is number", () => {
                expectTypeOf(Arr.chunk).parameter(1).toEqualTypeOf<number>();
            });

            it("return type extends unknown[][]", () => {
                expectTypeOf(Arr.chunk).returns.toExtend<unknown[][]>();
            });
        });
    });

    describe("collapse", () => {
        describe("array of arrays → flat array (overload 1: TValue[][] → TValue[])", () => {
            it("flattens number[][] to number[]", () => {
                const result = Arr.collapse([
                    [1, 2],
                    [3, 4],
                ]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("flattens string[][] to string[]", () => {
                const result = Arr.collapse([["foo", "bar"], ["baz"]]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("flattens boolean[][] to boolean[]", () => {
                const result = Arr.collapse([[true, false], [true]]);
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });

            it("flattens (string | number)[][] to (string | number)[]", () => {
                const data: (string | number)[][] = [
                    [1],
                    [2],
                    [3],
                    ["foo", "bar"],
                ];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });

            it("flattens object[][] to object[]", () => {
                const result = Arr.collapse([
                    [{ id: 1, name: "Alice" }],
                    [{ id: 2, name: "Bob" }],
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    { id: number; name: string }[]
                >();
            });

            it("flattens deeply nested element types", () => {
                const result = Arr.collapse([
                    [
                        {
                            user: {
                                profile: { name: "Alice", scores: [90, 95] },
                            },
                        },
                    ],
                    [{ user: { profile: { name: "Bob", scores: [80, 85] } } }],
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    { user: { profile: { name: string; scores: number[] } } }[]
                >();
            });

            it("flattens array of arrays of arrays preserving nesting", () => {
                const result = Arr.collapse([
                    [
                        [1, 2],
                        [3, 4],
                    ],
                    [[5, 6]],
                ]);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("flattens empty typed arrays", () => {
                const data: number[][] = [[], [], []];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("handles arrays with optional-property objects", () => {
                const result = Arr.collapse([
                    [{ name: "Alice", age: 30 }],
                    [{ name: "Bob", age: undefined }],
                ] as { name: string; age: number | undefined }[][]);
                expectTypeOf(result).toEqualTypeOf<
                    { name: string; age: number | undefined }[]
                >();
            });
        });

        describe("array of records → merged record (overload 2: Record<TKey, TValue>[] → Record<TKey, TValue>)", () => {
            it("merges explicitly typed Record array into single record", () => {
                const data: Record<string, number>[] = [
                    { a: 1, b: 2 },
                    { c: 3, d: 4 },
                ];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
            });

            it("merges objects with different value types", () => {
                const data: Record<string, string | number>[] = [
                    { name: "Alice", age: 30 },
                    { city: "NYC", zip: 10001 },
                ];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, string | number>
                >();
            });

            it("merges single explicitly typed Record", () => {
                const data: Record<string, number>[] = [{ x: 1, y: 2, z: 3 }];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
            });

            it("merges objects with nested values", () => {
                const data: Record<string, { score: number; label: string }>[] =
                    [
                        { math: { score: 95, label: "A" } },
                        { science: { score: 88, label: "B" } },
                    ];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, { score: number; label: string }>
                >();
            });

            it("merges inline objects with same-shape keys via broadest overload", () => {
                const result = Arr.collapse([
                    { a: 1, b: 2 },
                    { c: 3, d: 4 },
                ]);
                expectTypeOf(result).toExtend<
                    Record<string, unknown> | unknown[]
                >();
            });
        });

        describe("union type arrays via overload 3", () => {
            it("collapses typed union of arrays", () => {
                type Mixed = string[] | number[] | [] | (string | number)[];
                const data: Mixed[] = [["foo", "bar"], ["baz"]];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });

            it("collapses empty union arrays", () => {
                type Mixed = string[] | number[] | [] | (string | number)[];
                const data: Mixed[] = [[], [], []];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });

            it("collapses union with mixed content", () => {
                type Mixed = string[] | number[] | [] | (string | number)[];
                const data: Mixed[] = [[], [1, 2], [], ["foo", "bar"]];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });
        });

        describe("complex data structures", () => {
            it("flattens array of arrays of complex objects", () => {
                const result = Arr.collapse([
                    [
                        {
                            id: 1,
                            tags: ["a", "b"],
                            meta: { created: new Date(), active: true },
                        },
                    ],
                    [
                        {
                            id: 2,
                            tags: ["c"],
                            meta: { created: new Date(), active: false },
                        },
                    ],
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    {
                        id: number;
                        tags: string[];
                        meta: { created: Date; active: boolean };
                    }[]
                >();
            });

            it("flattens array of arrays containing functions", () => {
                const result = Arr.collapse([
                    [(x: number) => x * 2],
                    [(x: number) => x + 1],
                ]);
                expectTypeOf(result).toEqualTypeOf<((x: number) => number)[]>();
            });

            it("flattens array of arrays with nullable elements", () => {
                const result = Arr.collapse([
                    [1, null, 2],
                    [null, 3],
                ]);
                expectTypeOf(result).toEqualTypeOf<(number | null)[]>();
            });

            it("flattens array of arrays with tuple-like inner arrays", () => {
                const result = Arr.collapse([
                    [[1, "a"] as [number, string]],
                    [[2, "b"] as [number, string]],
                ]);
                expectTypeOf(result).toEqualTypeOf<[number, string][]>();
            });

            it("flattens array of mutable arrays inferred from const-like values", () => {
                const data: number[][] = [
                    [1, 2],
                    [3, 4],
                ];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("empty and edge-case inputs", () => {
            it("returns typed empty array for typed empty input", () => {
                const data: number[][] = [];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("preserves element type from single inner array", () => {
                const result = Arr.collapse([[42]]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("preserves element type with many empty inner arrays", () => {
                const data: string[][] = [[], [], [], []];
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("inferred types from data transformations", () => {
            it("infers type from mapped data", () => {
                const users = ["Alice", "Bob", "Charlie"];
                const data = users.map((name) => [{ name, id: Math.random() }]);
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<
                    { name: string; id: number }[]
                >();
            });

            it("infers type from Array.from() result", () => {
                const data = Array.from({ length: 3 }, (_, i) => [i, i + 1]);
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("infers type from filtered nested arrays", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                    [5, 6],
                ].filter((arr) => arr[0]! > 2);
                const result = Arr.collapse(data);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("function signature", () => {
            it("first parameter accepts arrays", () => {
                expectTypeOf(Arr.collapse).parameter(0).toExtend<readonly unknown[]>();
            });

            it("return type is array or record", () => {
                expectTypeOf(Arr.collapse).returns.toExtend<
                    unknown[] | Record<string, unknown>
                >();
            });
        });
    });

    describe("combine", () => {
        // Note: combine returns (T | undefined)[][] because arrays may be of different lengths.
        // If all arrays are the same length, undefined will not appear in the result, but TypeScript cannot infer this.
        // See implementation: result uses array[i], which is undefined if i >= array.length.
        describe("basic return type with same-typed arrays", () => {
            it("returns (number | undefined)[][] for two number arrays", () => {
                const result = Arr.combine([1, 2], [3, 4]);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
            });

            it("returns (string | undefined)[][] for two string arrays", () => {
                const result = Arr.combine(["a", "b"], ["c", "d"]);
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[][]>();
            });

            it("returns (boolean | undefined)[][] for two boolean arrays", () => {
                const result = Arr.combine([true, false], [false, true]);
                expectTypeOf(result).toEqualTypeOf<(boolean | undefined)[][]>();
            });

            it("returns (number | undefined)[][] for three number arrays", () => {
                const result = Arr.combine([1, 2], [3, 4], [5, 6]);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
            });
        });

        describe("equal-length arrays (no undefined in runtime result)", () => {
            // These tests show that if all arrays are the same length, undefined will not appear in the runtime result,
            // but the type still includes undefined because TypeScript cannot guarantee length equality.
            it("runtime result has no undefined for equal-length arrays", () => {
                const arr1 = [1, 2, 3];
                const arr2 = [4, 5, 6];
                const result = Arr.combine(arr1, arr2);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
                // runtime check
                for (const row of result) {
                    for (const value of row) {
                        if (value === undefined) {
                            throw new Error(
                                "Should not be undefined when arrays are equal length",
                            );
                        }
                    }
                }
            });
        });

        describe("unequal-length arrays (undefined appears in runtime result)", () => {
            it("runtime result has undefined for shorter arrays", () => {
                const arr1 = [1, 2, 3];
                const arr2 = [4, 5];
                const result = Arr.combine(arr1, arr2);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
                // runtime check
                let foundUndefined = false;
                for (const row of result) {
                    for (const value of row) {
                        if (value === undefined) {
                            foundUndefined = true;
                        }
                    }
                }
                if (!foundUndefined) {
                    throw new Error(
                        "Should have undefined when arrays are unequal length",
                    );
                }
            });
        });

        describe("single array argument", () => {
            it("returns (number | undefined)[][] for single number array", () => {
                const result = Arr.combine([1, 2, 3]);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
            });

            it("returns (string | undefined)[][] for single string array", () => {
                const result = Arr.combine(["hello", "world"]);
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[][]>();
            });

            it("returns (object | undefined)[][] for single object array", () => {
                const result = Arr.combine([
                    { id: 1, name: "Alice" },
                    { id: 2, name: "Bob" },
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    ({ id: number; name: string } | undefined)[][]
                >();
            });
        });

        describe("no arguments", () => {
            it("returns (unknown | undefined)[][] for no arguments", () => {
                const result = Arr.combine();
                expectTypeOf(result).toEqualTypeOf<(unknown | undefined)[][]>();
            });
        });

        describe("complex element types", () => {
            it("returns (object | undefined)[][] for arrays of objects", () => {
                const result = Arr.combine(
                    [
                        { id: 1, name: "Alice", active: true },
                        { id: 2, name: "Bob", active: false },
                    ],
                    [
                        { id: 3, name: "Charlie", active: true },
                        { id: 4, name: "Diana", active: false },
                    ],
                );
                expectTypeOf(result).toEqualTypeOf<
                    (
                        | { id: number; name: string; active: boolean }
                        | undefined
                    )[][]
                >();
            });

            it("preserves nested structure in element type", () => {
                const result = Arr.combine(
                    [
                        {
                            user: {
                                profile: { name: "Alice", scores: [90, 95] },
                            },
                        },
                        { user: { profile: { name: "Bob", scores: [80] } } },
                    ],
                    [
                        {
                            user: {
                                profile: { name: "Charlie", scores: [70, 75] },
                            },
                        },
                    ],
                );
                expectTypeOf(result).toEqualTypeOf<
                    (
                        | {
                              user: {
                                  profile: { name: string; scores: number[] };
                              };
                          }
                        | undefined
                    )[][]
                >();
            });

            it("handles arrays with function elements", () => {
                const result = Arr.combine(
                    [(x: number) => x * 2, (x: number) => x + 1],
                    [(x: number) => x - 1, (x: number) => x / 2],
                );
                expectTypeOf(result).toEqualTypeOf<
                    (((x: number) => number) | undefined)[][]
                >();
            });

            it("handles arrays with nullable elements", () => {
                const data1: (number | null)[] = [1, null, 3];
                const data2: (number | null)[] = [null, 5, 6];
                const result = Arr.combine(data1, data2);
                expectTypeOf(result).toEqualTypeOf<
                    (number | null | undefined)[][]
                >();
            });
        });

        describe("union element types", () => {
            it("returns union[][] when arrays have union element types", () => {
                const data1: (string | number)[] = [1, "two", 3];
                const data2: (string | number)[] = ["four", 5, "six"];
                const result = Arr.combine(data1, data2);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | undefined)[][]
                >();
            });

            it("returns wide union[][] for heterogeneous typed arrays", () => {
                const data: (string | number | boolean | null)[] = [
                    1,
                    "two",
                    true,
                    null,
                ];
                const result = Arr.combine(data, data);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean | null | undefined)[][]
                >();
            });
        });

        describe("typed array variables", () => {
            it("accepts Array<T> typed input", () => {
                const data: Array<{ x: number; y: number }> = [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ];
                const result = Arr.combine(data, data);
                expectTypeOf(result).toEqualTypeOf<
                    ({ x: number; y: number } | undefined)[][]
                >();
            });

            it("accepts result from map operation", () => {
                const data = [1, 2, 3].map((n) => ({ value: n }));
                const labels = [1, 2, 3].map((n) => `#${n}`);
                const result = Arr.combine(data);
                expectTypeOf(result).toEqualTypeOf<
                    ({ value: number } | undefined)[][]
                >();

                const labelResult = Arr.combine(labels);
                expectTypeOf(labelResult).toEqualTypeOf<
                    (string | undefined)[][]
                >();
            });

            it("accepts result from Array.from()", () => {
                const data = Array.from({ length: 3 }, (_, i) => i * 10);
                const result = Arr.combine(data, data);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
            });

            it("accepts result from filter operation", () => {
                const data = [1, 2, 3, 4, 5].filter((n) => n > 2);
                const result = Arr.combine(data);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
            });
        });

        describe("many arrays (variadic rest params)", () => {
            it("accepts four arrays of same type", () => {
                const result = Arr.combine([1, 2], [3, 4], [5, 6], [7, 8]);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
            });

            it("accepts spread array of arrays", () => {
                const arrays: number[][] = [
                    [1, 2],
                    [3, 4],
                    [5, 6],
                ];
                const result = Arr.combine(...arrays);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
            });
        });

        describe("empty arrays", () => {
            it("returns typed empty result for empty typed arrays", () => {
                const data: number[] = [];
                const result = Arr.combine(data, data);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
            });

            it("returns typed result when mixing empty and non-empty", () => {
                const empty: string[] = [];
                const filled: string[] = ["a", "b"];
                const result = Arr.combine(empty, filled);
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[][]>();
            });
        });

        describe("function signature", () => {
            it("accepts rest parameter of arrays", () => {
                expectTypeOf(Arr.combine).parameters.toExtend<(readonly unknown[])[]>();
            });

            it("return type extends unknown[][]", () => {
                expectTypeOf(Arr.combine).returns.toExtend<unknown[][]>();
            });
        });
    });

    describe("crossJoin", () => {
        describe("two arrays with different primitive types", () => {
            it("number and string arrays", () => {
                const result = Arr.crossJoin([1, 2], ["a", "b"]);
                expectTypeOf(result).toEqualTypeOf<[number, string][]>();
            });

            it("number and boolean arrays", () => {
                const result = Arr.crossJoin([1, 2], [true, false]);
                expectTypeOf(result).toEqualTypeOf<[number, boolean][]>();
            });

            it("string and boolean arrays", () => {
                const result = Arr.crossJoin(["x", "y"], [true, false]);
                expectTypeOf(result).toEqualTypeOf<[string, boolean][]>();
            });
        });

        describe("two arrays with same type", () => {
            it("both number arrays", () => {
                const result = Arr.crossJoin([1, 2], [3, 4]);
                expectTypeOf(result).toEqualTypeOf<[number, number][]>();
            });

            it("both string arrays", () => {
                const result = Arr.crossJoin(["a", "b"], ["x", "y"]);
                expectTypeOf(result).toEqualTypeOf<[string, string][]>();
            });
        });

        describe("three arrays", () => {
            it("number, string, boolean arrays", () => {
                const result = Arr.crossJoin([1, 2], ["a", "b"], [true, false]);
                expectTypeOf(result).toEqualTypeOf<
                    [number, string, boolean][]
                >();
            });

            it("all different primitive types", () => {
                const result = Arr.crossJoin(["x"], [10], [Symbol("test")]);
                expectTypeOf(result).toEqualTypeOf<
                    [string, number, symbol][]
                >();
            });
        });

        describe("single array", () => {
            it("wraps element in single-element tuple", () => {
                const result = Arr.crossJoin([1, 2, 3]);
                expectTypeOf(result).toEqualTypeOf<[number][]>();
            });

            it("wraps string element in single-element tuple", () => {
                const result = Arr.crossJoin(["hello", "world"]);
                expectTypeOf(result).toEqualTypeOf<[string][]>();
            });
        });

        describe("no arguments", () => {
            it("returns unknown[][]", () => {
                const result = Arr.crossJoin();
                expectTypeOf(result).toEqualTypeOf<unknown[][]>();
            });
        });

        describe("four arrays", () => {
            it("infers 4-element tuple", () => {
                const result = Arr.crossJoin([1], ["a"], [true], [null]);
                expectTypeOf(result).toEqualTypeOf<
                    [number, string, boolean, null][]
                >();
            });
        });

        describe("five arrays", () => {
            it("infers 5-element tuple", () => {
                const result = Arr.crossJoin(
                    [1],
                    ["a"],
                    [true],
                    [null],
                    [undefined],
                );
                expectTypeOf(result).toEqualTypeOf<
                    [number, string, boolean, null, undefined][]
                >();
            });
        });

        describe("six arrays", () => {
            it("infers 6-element tuple", () => {
                const result = Arr.crossJoin(
                    [1],
                    ["a"],
                    [true],
                    [null],
                    [undefined],
                    [Symbol("s")],
                );
                expectTypeOf(result).toEqualTypeOf<
                    [number, string, boolean, null, undefined, symbol][]
                >();
            });
        });

        describe("object element types", () => {
            it("objects with different shapes", () => {
                const result = Arr.crossJoin(
                    [{ name: "Alice" }, { name: "Bob" }],
                    [{ age: 25 }, { age: 30 }],
                );
                expectTypeOf(result).toEqualTypeOf<
                    [{ name: string }, { age: number }][]
                >();
            });

            it("objects with nested structures", () => {
                const result = Arr.crossJoin(
                    [{ user: { id: 1 } }, { user: { id: 2 } }],
                    [{ tags: ["a", "b"] }],
                );
                expectTypeOf(result).toEqualTypeOf<
                    [{ user: { id: number } }, { tags: string[] }][]
                >();
            });

            it("mixed primitives and objects", () => {
                const result = Arr.crossJoin(
                    [1, 2],
                    [{ label: "x" }, { label: "y" }],
                    [true, false],
                );
                expectTypeOf(result).toEqualTypeOf<
                    [number, { label: string }, boolean][]
                >();
            });
        });

        describe("union types within arrays", () => {
            it("handles union element types", () => {
                const mixed: (string | number)[] = [1, "a"];
                const result = Arr.crossJoin(mixed, [true, false]);
                expectTypeOf(result).toEqualTypeOf<
                    [string | number, boolean][]
                >();
            });

            it("both arrays with union types", () => {
                const a: (string | number)[] = [1, "a"];
                const b: (boolean | null)[] = [true, null];
                const result = Arr.crossJoin(a, b);
                expectTypeOf(result).toEqualTypeOf<
                    [string | number, boolean | null][]
                >();
            });
        });

        describe("typed variable references", () => {
            it("preserves types from variable references", () => {
                const nums: number[] = [1, 2];
                const strs: string[] = ["a", "b"];
                const result = Arr.crossJoin(nums, strs);
                expectTypeOf(result).toEqualTypeOf<[number, string][]>();
            });

            it("preserves types from three variable references", () => {
                const nums: number[] = [1, 2];
                const strs: string[] = ["a", "b"];
                const bools: boolean[] = [true, false];
                const result = Arr.crossJoin(nums, strs, bools);
                expectTypeOf(result).toEqualTypeOf<
                    [number, string, boolean][]
                >();
            });
        });

        describe("empty arrays", () => {
            it("with literal empty array", () => {
                const result = Arr.crossJoin([], ["a", "b"]);
                expectTypeOf(result).toEqualTypeOf<[never, string][]>();
            });

            it("multiple empty arrays", () => {
                const result = Arr.crossJoin([], [], []);
                expectTypeOf(result).toEqualTypeOf<[never, never, never][]>();
            });
        });

        describe("arrays containing arrays as elements", () => {
            it("arrays of number arrays", () => {
                const result = Arr.crossJoin(
                    [
                        [1, 2],
                        [3, 4],
                    ],
                    [["a", "b"]],
                );
                expectTypeOf(result).toEqualTypeOf<[number[], string[]][]>();
            });
        });

        describe("complex nested data structures", () => {
            it("deeply nested object types across dimensions", () => {
                const result = Arr.crossJoin(
                    [
                        {
                            user: { name: "Alice", roles: ["admin"] },
                        },
                    ],
                    [
                        {
                            config: {
                                theme: "dark",
                                settings: { verbose: true },
                            },
                        },
                    ],
                );
                expectTypeOf(result).toEqualTypeOf<
                    [
                        { user: { name: string; roles: string[] } },
                        {
                            config: {
                                theme: string;
                                settings: { verbose: boolean };
                            };
                        },
                    ][]
                >();
            });

            it("Date and RegExp object types", () => {
                const dates = [new Date(), new Date()];
                const patterns = [/foo/, /bar/];
                const result = Arr.crossJoin(dates, patterns);
                expectTypeOf(result).toEqualTypeOf<[Date, RegExp][]>();
            });

            it("tuple arrays as element types", () => {
                const pairs: [number, string][] = [
                    [1, "a"],
                    [2, "b"],
                ];
                const flags: boolean[] = [true, false];
                const result = Arr.crossJoin(pairs, flags);
                expectTypeOf(result).toEqualTypeOf<
                    [[number, string], boolean][]
                >();
            });
        });

        describe("more than six arrays (variadic fallback)", () => {
            it("falls back to unknown[][]", () => {
                const result = Arr.crossJoin(
                    [1],
                    ["a"],
                    [true],
                    [null],
                    [undefined],
                    [Symbol("s")],
                    [42],
                );
                expectTypeOf(result).toEqualTypeOf<unknown[][]>();
            });
        });

        describe("single nested array argument", () => {
            it("treats nested array as single dimension", () => {
                const result = Arr.crossJoin([
                    [1, 2],
                    ["a", "b"],
                ]);
                expectTypeOf(result).toEqualTypeOf<[number[] | string[]][]>();
            });
        });

        describe("function signature", () => {
            it("accepts variadic arrays", () => {
                expectTypeOf(Arr.crossJoin).parameters.toExtend<unknown[][]>();
            });

            it("return type extends unknown[][]", () => {
                expectTypeOf(Arr.crossJoin).returns.toExtend<unknown[][]>();
            });
        });
    });

    describe("divide", () => {
        describe("homogeneous arrays", () => {
            it("returns [number[], number[]] for number array", () => {
                const result = Arr.divide([10, 20, 30]);
                expectTypeOf(result).toEqualTypeOf<[number[], number[]]>();
            });

            it("returns [number[], string[]] for string array", () => {
                const result = Arr.divide(["hello", "world"]);
                expectTypeOf(result).toEqualTypeOf<[number[], string[]]>();
            });

            it("returns [number[], boolean[]] for boolean array", () => {
                const result = Arr.divide([true, false, true]);
                expectTypeOf(result).toEqualTypeOf<[number[], boolean[]]>();
            });
        });

        describe("empty array", () => {
            it("returns [number[], unknown[]] for empty array literal", () => {
                const result = Arr.divide([]);
                expectTypeOf(result).toEqualTypeOf<[number[], unknown[]]>();
            });
        });

        describe("single element", () => {
            it("returns [number[], string[]] for single string element", () => {
                const result = Arr.divide(["Desk"]);
                expectTypeOf(result).toEqualTypeOf<[number[], string[]]>();
            });

            it("returns [number[], number[]] for single number element", () => {
                const result = Arr.divide([42]);
                expectTypeOf(result).toEqualTypeOf<[number[], number[]]>();
            });
        });

        describe("mixed type arrays", () => {
            it("returns union type for mixed string/number/boolean", () => {
                const result = Arr.divide(["Desk", 100, true]);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], (string | number | boolean)[]]
                >();
            });

            it("returns union type for mixed string/number", () => {
                const result = Arr.divide(["hello", 42]);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], (string | number)[]]
                >();
            });
        });

        describe("objects in arrays", () => {
            it("returns [number[], object[]] for array of same-shape objects", () => {
                const result = Arr.divide([
                    { name: "Desk", price: 100 },
                    { name: "Chair", price: 50 },
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], { name: string; price: number }[]]
                >();
            });

            it("handles array of objects with different shapes as union", () => {
                const result = Arr.divide([
                    { id: 1, name: "Alice" },
                    { id: 2, age: 30 },
                ]);
                const [keys, values] = result;
                expectTypeOf(keys).toEqualTypeOf<number[]>();
                // Union of different object shapes — verify shared property
                expectTypeOf(values).toExtend<{ id: number }[]>();
                // Verify each union member is assignable
                expectTypeOf(values).toExtend<
                    (
                        | { id: number; name: string }
                        | { id: number; age: number }
                    )[]
                >();
            });
        });

        describe("nested arrays", () => {
            it("returns [number[], number[][]] for array of number arrays", () => {
                const result = Arr.divide([
                    [1, 2],
                    [3, 4],
                ]);
                expectTypeOf(result).toEqualTypeOf<[number[], number[][]]>();
            });

            it("returns union for mixed nested arrays and primitives", () => {
                const result = Arr.divide([[1, "second"], "one"]);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], ((number | string)[] | string)[]]
                >();
            });

            it("handles array of tuples", () => {
                const result = Arr.divide([
                    [1, "a"],
                    [2, "b"],
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], (number | string)[][]]
                >();
            });
        });

        describe("union types", () => {
            it("handles string or null union", () => {
                const input: (string | null)[] = ["hello", null, "world"];
                const result = Arr.divide(input);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], (string | null)[]]
                >();
            });

            it("handles number or undefined union", () => {
                const input: (number | undefined)[] = [1, undefined, 3];
                const result = Arr.divide(input);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], (number | undefined)[]]
                >();
            });
        });

        describe("typed variable references", () => {
            it("infers from typed number array variable", () => {
                const nums: number[] = [1, 2, 3];
                const result = Arr.divide(nums);
                expectTypeOf(result).toEqualTypeOf<[number[], number[]]>();
            });

            it("infers from typed string array variable", () => {
                const strs: string[] = ["a", "b"];
                const result = Arr.divide(strs);
                expectTypeOf(result).toEqualTypeOf<[number[], string[]]>();
            });

            it("infers from typed object array variable", () => {
                const items: { id: number; name: string }[] = [
                    { id: 1, name: "one" },
                ];
                const result = Arr.divide(items);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], { id: number; name: string }[]]
                >();
            });
        });

        describe("readonly and const arrays", () => {
            it("handles readonly number array", () => {
                const input: readonly number[] = [1, 2, 3];
                const result = Arr.divide(input);
                expectTypeOf(result).toEqualTypeOf<[number[], number[]]>();
            });

            it("handles as const tuple with literal types", () => {
                const result = Arr.divide([1, 2, 3] as const);
                expectTypeOf(result).toEqualTypeOf<[number[], (1 | 2 | 3)[]]>();
            });

            it("handles as const with mixed literal types", () => {
                const result = Arr.divide(["hello", 42, true] as const);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], ("hello" | 42 | true)[]]
                >();
            });

            it("handles readonly string array", () => {
                const input: readonly string[] = ["a", "b", "c"];
                const result = Arr.divide(input);
                expectTypeOf(result).toEqualTypeOf<[number[], string[]]>();
            });
        });

        describe("complex data structures", () => {
            it("handles arrays of Date objects", () => {
                const result = Arr.divide([new Date(), new Date()]);
                expectTypeOf(result).toEqualTypeOf<[number[], Date[]]>();
            });

            it("handles arrays of RegExp objects", () => {
                const result = Arr.divide([/abc/, /def/]);
                expectTypeOf(result).toEqualTypeOf<[number[], RegExp[]]>();
            });

            it("handles arrays of mixed built-in types", () => {
                const result = Arr.divide([new Date(), /pattern/]);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], (Date | RegExp)[]]
                >();
            });

            it("handles deeply nested objects", () => {
                const result = Arr.divide([
                    { data: { inner: [1, 2] } },
                    { data: { inner: [3, 4] } },
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], { data: { inner: number[] } }[]]
                >();
            });

            it("handles arrays of functions", () => {
                const result = Arr.divide([() => 1, () => "hello"]);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], ((() => number) | (() => string))[]]
                >();
            });

            it("handles arrays of Map and Set", () => {
                const result = Arr.divide([
                    new Map<string, number>(),
                    new Set<string>(),
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    [number[], (Map<string, number> | Set<string>)[]]
                >();
            });
        });

        describe("destructuring return value", () => {
            it("destructured keys are number[]", () => {
                const [keys] = Arr.divide([10, 20, 30]);
                expectTypeOf(keys).toEqualTypeOf<number[]>();
            });

            it("destructured values match element type", () => {
                const [, values] = Arr.divide(["a", "b", "c"]);
                expectTypeOf(values).toEqualTypeOf<string[]>();
            });

            it("destructured values match union element type", () => {
                const [, values] = Arr.divide(["Desk", 100, true]);
                expectTypeOf(values).toEqualTypeOf<
                    (string | number | boolean)[]
                >();
            });

            it("destructured keys and values for objects in array", () => {
                const [keys, values] = Arr.divide([{ x: 1 }, { x: 2 }]);
                expectTypeOf(keys).toEqualTypeOf<number[]>();
                expectTypeOf(values).toEqualTypeOf<{ x: number }[]>();
            });
        });

        describe("function signature", () => {
            it("accepts readonly arrays", () => {
                expectTypeOf(Arr.divide).toBeCallableWith([
                    1, 2, 3,
                ] as readonly number[]);
            });

            it("accepts mutable arrays", () => {
                expectTypeOf(Arr.divide).toBeCallableWith([1, 2, 3]);
            });

            it("return type extends [number[], unknown[]]", () => {
                expectTypeOf(Arr.divide).returns.toExtend<
                    [number[], unknown[]]
                >();
            });
        });
    });

    describe("dot", () => {
        describe("flat arrays (no nesting)", () => {
            it("returns Record<string, number> for number array", () => {
                const result = Arr.dot([1, 2, 3]);
                expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
            });

            it("returns Record<string, string> for string array", () => {
                const result = Arr.dot(["a", "b", "c"]);
                expectTypeOf(result).toEqualTypeOf<Record<string, string>>();
            });

            it("returns Record<string, boolean> for boolean array", () => {
                const result = Arr.dot([true, false]);
                expectTypeOf(result).toEqualTypeOf<Record<string, boolean>>();
            });
        });

        describe("empty array", () => {
            it("returns Record<string, never> for empty array literal", () => {
                const result = Arr.dot([]);
                expectTypeOf(result).toEqualTypeOf<Record<string, never>>();
            });
        });

        describe("nested arrays without depth (fully flattened)", () => {
            it("flattens number[][] to Record<string, number>", () => {
                const result = Arr.dot([1, [2, 3]]);
                expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
            });

            it("flattens deeply nested number[][][] to Record<string, number>", () => {
                const result = Arr.dot([1, [2, [3, [4]]]]);
                expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
            });

            it("flattens string[][] to Record<string, string>", () => {
                const result = Arr.dot(["a", ["b", ["c"]]]);
                expectTypeOf(result).toEqualTypeOf<Record<string, string>>();
            });

            it("flattens mixed nested types to union of leaf values", () => {
                const result = Arr.dot(["a", [1, [true]]]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, string | number | boolean>
                >();
            });
        });

        describe("with prepend (no depth)", () => {
            it("returns flattened type with prepend for nested numbers", () => {
                const result = Arr.dot([1, [2, 3]], "root");
                expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
            });

            it("returns flattened type with prepend for nested strings", () => {
                const result = Arr.dot(["a", ["b"]], "prefix");
                expectTypeOf(result).toEqualTypeOf<Record<string, string>>();
            });
        });

        describe("with depth specified", () => {
            it("depth 0: preserves original element types", () => {
                const result = Arr.dot(["a", ["b"]], "", 0);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, string | string[]>
                >();
            });

            it("depth 1: preserves one level of nesting in type", () => {
                const result = Arr.dot([1, [2, [3, [4]]]], "", 1);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number | (number | (number | number[])[])[]>
                >();
            });

            it("depth 2: preserves two levels of nesting in type", () => {
                const result = Arr.dot([1, [2, [3, [4]]]], "", 2);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number | (number | (number | number[])[])[]>
                >();
            });

            it("depth Infinity: keeps original element types (depth is runtime number)", () => {
                const result = Arr.dot([1, [2, [3, [4]]]], "", Infinity);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number | (number | (number | number[])[])[]>
                >();
            });

            it("depth 1 with prepend: preserves element types", () => {
                const result = Arr.dot(["a", [["b"]]], "prefix", 1);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, string | string[][]>
                >();
            });
        });

        describe("objects in arrays", () => {
            it("flattens array of objects without depth", () => {
                const result = Arr.dot([
                    { name: "Alice", age: 30 },
                    { name: "Bob", age: 25 },
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, { name: string; age: number }>
                >();
            });

            it("flattens nested array of objects without depth", () => {
                const result = Arr.dot([[{ id: 1 }], [{ id: 2 }]]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, { id: number }>
                >();
            });
        });

        describe("union types in arrays", () => {
            it("handles string | null array without depth", () => {
                const input: (string | null)[] = ["a", null, "b"];
                const result = Arr.dot(input);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, string | null>
                >();
            });

            it("handles number | undefined array without depth", () => {
                const input: (number | undefined)[] = [1, undefined, 3];
                const result = Arr.dot(input);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number | undefined>
                >();
            });

            it("handles mixed primitives and arrays without depth", () => {
                const result = Arr.dot([1, "hello", [true, [null]]]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number | string | boolean | null>
                >();
            });
        });

        describe("typed variable references", () => {
            it("infers from typed number array variable", () => {
                const nums: number[] = [1, 2, 3];
                const result = Arr.dot(nums);
                expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
            });

            it("infers from typed nested number array variable", () => {
                const nums: (number | number[])[] = [1, [2, 3]];
                const result = Arr.dot(nums);
                expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
            });

            it("infers from typed object array variable", () => {
                const items: { id: number; name: string }[] = [
                    { id: 1, name: "one" },
                ];
                const result = Arr.dot(items);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, { id: number; name: string }>
                >();
            });

            it("infers from typed deeply nested variable", () => {
                const data: (string | (string | string[])[])[] = [
                    "a",
                    ["b", ["c"]],
                ];
                const result = Arr.dot(data);
                expectTypeOf(result).toEqualTypeOf<Record<string, string>>();
            });
        });

        describe("readonly and const arrays", () => {
            it("handles readonly number array", () => {
                const input: readonly number[] = [1, 2, 3];
                const result = Arr.dot(input);
                expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
            });

            it("handles as const flat array", () => {
                const result = Arr.dot([1, 2, 3] as const);
                expectTypeOf(result).toEqualTypeOf<Record<string, 1 | 2 | 3>>();
            });

            it("handles as const nested array", () => {
                const result = Arr.dot(["a", ["b"]] as const);
                expectTypeOf(result).toEqualTypeOf<Record<string, "a" | "b">>();
            });
        });

        describe("complex data structures", () => {
            it("handles arrays of Date objects", () => {
                const result = Arr.dot([new Date(), new Date()]);
                expectTypeOf(result).toEqualTypeOf<Record<string, Date>>();
            });

            it("handles arrays of RegExp objects", () => {
                const result = Arr.dot([/abc/, /def/]);
                expectTypeOf(result).toEqualTypeOf<Record<string, RegExp>>();
            });

            it("handles nested arrays of mixed built-in types", () => {
                const result = Arr.dot([[new Date()], [/pattern/]]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, Date | RegExp>
                >();
            });

            it("handles arrays of Map and Set", () => {
                const result = Arr.dot([
                    new Map<string, number>(),
                    new Set<string>(),
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, Map<string, number> | Set<string>>
                >();
            });

            it("handles arrays of functions", () => {
                const result = Arr.dot([() => 1, () => "hello"]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, (() => number) | (() => string)>
                >();
            });

            it("handles deeply nested mixed structures without depth", () => {
                const result = Arr.dot([1, ["hello", [true, [{ id: 1 }]]]]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number | string | boolean | { id: number }>
                >();
            });
        });

        describe("function signature", () => {
            it("accepts array as first parameter", () => {
                expectTypeOf(Arr.dot).toBeCallableWith([1, 2, 3]);
            });

            it("accepts array with prepend", () => {
                expectTypeOf(Arr.dot).toBeCallableWith([1, 2, 3], "prefix");
            });

            it("accepts array with prepend and depth", () => {
                expectTypeOf(Arr.dot).toBeCallableWith([1, 2, 3], "", 1);
            });

            it("return type extends Record<string, unknown>", () => {
                expectTypeOf(Arr.dot).returns.toExtend<
                    Record<string, unknown>
                >();
            });
        });
    });

    describe("undot", () => {
        describe("simple numeric keys (no dots)", () => {
            it("returns string[] for string values", () => {
                const result = Arr.undot({ "0": "a", "1": "b" });
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns number[] for number values", () => {
                const result = Arr.undot({ "0": 1, "1": 2, "2": 3 });
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns boolean[] for boolean values", () => {
                const result = Arr.undot({ "0": true, "1": false });
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });

            it("returns union type for mixed values", () => {
                const result = Arr.undot({ "0": "hello", "1": 42 });
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });
        });

        describe("empty record", () => {
            it("returns never[] for empty object", () => {
                const result = Arr.undot({});
                expectTypeOf(result).toEqualTypeOf<never[]>();
            });
        });

        describe("dot-notated keys (nested result)", () => {
            it("returns UndotValue<string>[] for single-level dots", () => {
                const result = Arr.undot({ "0": "a", "1.0": "b" });
                expectTypeOf(result).toEqualTypeOf<UndotValue<string>[]>();
            });

            it("returns UndotValue<string>[] for multi-level dots", () => {
                const result = Arr.undot({
                    "0": "a",
                    "1.0": "b",
                    "1.1.0": "c",
                });
                expectTypeOf(result).toEqualTypeOf<UndotValue<string>[]>();
            });

            it("returns UndotValue<number>[] for number values with dots", () => {
                const result = Arr.undot({
                    "0": 1,
                    "1.0": 2,
                    "1.1": 3,
                });
                expectTypeOf(result).toEqualTypeOf<UndotValue<number>[]>();
            });

            it("returns UndotValue with union for mixed values with dots", () => {
                const result = Arr.undot({
                    "0": "a",
                    "1.0": 42,
                });
                expectTypeOf(result).toEqualTypeOf<
                    UndotValue<string | number>[]
                >();
            });

            it("returns UndotValue for deeply nested dot paths", () => {
                const result = Arr.undot({
                    "0.0.0.0": "deep",
                });
                expectTypeOf(result).toEqualTypeOf<UndotValue<string>[]>();
            });
        });

        describe("mixed keys (some with dots, some without)", () => {
            it("returns UndotValue when any key has dots", () => {
                const result = Arr.undot({
                    "0": "x",
                    "1": "y",
                    "2.0": "z",
                });
                expectTypeOf(result).toEqualTypeOf<UndotValue<string>[]>();
            });

            it("non-numeric keys with dots still produce UndotValue", () => {
                const result = Arr.undot({
                    foo: "x",
                    "1.bar": "y",
                    "2": "z",
                });
                expectTypeOf(result).toEqualTypeOf<UndotValue<string>[]>();
            });
        });

        describe("generic string keys (typed variables)", () => {
            it("returns UndotValue for Record<string, string>", () => {
                const map: Record<string, string> = { "0": "a", "1": "b" };
                const result = Arr.undot(map);
                expectTypeOf(result).toEqualTypeOf<UndotValue<string>[]>();
            });

            it("returns UndotValue for Record<string, number>", () => {
                const map: Record<string, number> = { "0": 1, "1.0": 2 };
                const result = Arr.undot(map);
                expectTypeOf(result).toEqualTypeOf<UndotValue<number>[]>();
            });

            it("returns UndotValue for Record<PropertyKey, boolean>", () => {
                const map: Record<PropertyKey, boolean> = { "0": true };
                const result = Arr.undot(map);
                expectTypeOf(result).toEqualTypeOf<UndotValue<boolean>[]>();
            });
        });

        describe("object values", () => {
            it("returns array of objects for no-dot keys", () => {
                const map: Record<"0" | "1", { name: string; age: number }> = {
                    "0": { name: "Alice", age: 30 },
                    "1": { name: "Bob", age: 25 },
                };
                const result = Arr.undot(map);
                expectTypeOf(result).toEqualTypeOf<
                    { name: string; age: number }[]
                >();
            });

            it("returns UndotValue of objects for dot keys", () => {
                const result = Arr.undot({
                    "0": { id: 1 },
                    "1.0": { id: 2 },
                });
                expectTypeOf(result).toEqualTypeOf<
                    UndotValue<{ id: number }>[]
                >();
            });
        });

        describe("complex data structures", () => {
            it("handles Date values without dots", () => {
                const result = Arr.undot({
                    "0": new Date(),
                    "1": new Date(),
                });
                expectTypeOf(result).toEqualTypeOf<Date[]>();
            });

            it("handles Date values with dots", () => {
                const result = Arr.undot({
                    "0": new Date(),
                    "1.0": new Date(),
                });
                expectTypeOf(result).toEqualTypeOf<UndotValue<Date>[]>();
            });

            it("handles RegExp values without dots", () => {
                const result = Arr.undot({ "0": /abc/, "1": /def/ });
                expectTypeOf(result).toEqualTypeOf<RegExp[]>();
            });

            it("handles Map and Set values without dots", () => {
                const result = Arr.undot({
                    "0": new Map<string, number>(),
                    "1": new Set<string>(),
                });
                expectTypeOf(result).toEqualTypeOf<
                    (Map<string, number> | Set<string>)[]
                >();
            });

            it("handles function values without dots", () => {
                type Fn = (() => number) | (() => string);
                const map: Record<"0" | "1", Fn> = {
                    "0": () => 1,
                    "1": () => "hello",
                };
                const result = Arr.undot(map);
                expectTypeOf(result).toEqualTypeOf<Fn[]>();
            });

            it("handles mixed built-in types with dots", () => {
                const result = Arr.undot({
                    "0": new Date(),
                    "1.0": /pattern/,
                });
                expectTypeOf(result).toEqualTypeOf<
                    UndotValue<Date | RegExp>[]
                >();
            });
        });

        describe("union value types", () => {
            it("handles string | null values without dots", () => {
                const map: Record<"0" | "1", string | null> = {
                    "0": "a",
                    "1": null,
                };
                const result = Arr.undot(map);
                expectTypeOf(result).toEqualTypeOf<(string | null)[]>();
            });

            it("handles number | undefined values with dots", () => {
                const map: Record<"0" | "1.0", number | undefined> = {
                    "0": 1,
                    "1.0": undefined,
                };
                const result = Arr.undot(map);
                expectTypeOf(result).toEqualTypeOf<
                    UndotValue<number | undefined>[]
                >();
            });
        });

        describe("UndotValue recursive type behavior", () => {
            it("UndotValue<T> includes T itself", () => {
                expectTypeOf<string>().toExtend<UndotValue<string>>();
            });

            it("UndotValue<T> includes T[]", () => {
                expectTypeOf<string[]>().toExtend<UndotValue<string>[]>();
            });

            it("UndotValue<T> includes T[][] (nested arrays)", () => {
                expectTypeOf<string[][]>().toExtend<UndotValue<string>[]>();
            });

            it("nested UndotValue allows arbitrary depth", () => {
                type Deep = UndotValue<number>;
                expectTypeOf<number>().toExtend<Deep>();
                expectTypeOf<number[]>().toExtend<Deep>();
                expectTypeOf<number[][]>().toExtend<Deep>();
            });
        });

        describe("function signature", () => {
            it("accepts Record<string, TValue>", () => {
                expectTypeOf(Arr.undot).toBeCallableWith({ "0": "a" });
            });

            it("accepts Record with dot keys", () => {
                expectTypeOf(Arr.undot).toBeCallableWith({
                    "0": "a",
                    "1.0": "b",
                });
            });

            it("return type extends unknown[]", () => {
                expectTypeOf(Arr.undot).returns.toExtend<unknown[]>();
            });
        });
    });

    describe("union", () => {
        describe("same-type arrays (from functional tests)", () => {
            it("returns number[] for two number arrays", () => {
                const result = Arr.union([1, 2], [2, 3]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] for two string arrays", () => {
                const result = Arr.union(["a", "b"], ["b", "c", "a"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns boolean[] for two boolean arrays", () => {
                const result = Arr.union([true], [false, true]);
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });
        });

        describe("different-type arrays", () => {
            it("returns (number | string)[] for number[] + string[]", () => {
                const result = Arr.union([1, 2], ["a", "b"]);
                expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
            });

            it("returns (number | boolean)[] for number[] + boolean[]", () => {
                const result = Arr.union([1, 2], [true, false]);
                expectTypeOf(result).toEqualTypeOf<(number | boolean)[]>();
            });

            it("returns (string | number | boolean)[] for three different types", () => {
                const result = Arr.union(["a"], [1], [true]);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean)[]
                >();
            });

            it("returns (Date | RegExp)[] for Date[] + RegExp[]", () => {
                const result = Arr.union([new Date()], [/pattern/]);
                expectTypeOf(result).toEqualTypeOf<(Date | RegExp)[]>();
            });
        });

        describe("empty arrays (from functional tests)", () => {
            it("returns number[] for [] + number[]", () => {
                const result = Arr.union([], [1, 2]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns number[] for number[] + []", () => {
                const result = Arr.union([1, 2], []);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns never[] for [] + []", () => {
                const result = Arr.union([], []);
                expectTypeOf(result).toEqualTypeOf<never[]>();
            });
        });

        describe("single array", () => {
            it("returns number[] for single number array", () => {
                const result = Arr.union([1, 2, 3]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] for single string array", () => {
                const result = Arr.union(["a", "b"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("no arguments", () => {
            it("returns unknown[] with no args", () => {
                const result = Arr.union();
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("three or more arrays", () => {
            it("returns union of three different types", () => {
                const result = Arr.union([1], ["a"], [true]);
                expectTypeOf(result).toEqualTypeOf<
                    (number | string | boolean)[]
                >();
            });

            it("returns union of four different types", () => {
                const result = Arr.union([1], ["a"], [true], [new Date()]);
                expectTypeOf(result).toEqualTypeOf<
                    (number | string | boolean | Date)[]
                >();
            });

            it("returns union of five different types", () => {
                const result = Arr.union(
                    [1],
                    ["a"],
                    [true],
                    [new Date()],
                    [/pattern/],
                );
                expectTypeOf(result).toEqualTypeOf<
                    (number | string | boolean | Date | RegExp)[]
                >();
            });

            it("returns union of six different types", () => {
                const result = Arr.union(
                    [1],
                    ["a"],
                    [true],
                    [new Date()],
                    [/pattern/],
                    [Symbol("x")],
                );
                expectTypeOf(result).toEqualTypeOf<
                    (number | string | boolean | Date | RegExp | symbol)[]
                >();
            });
        });

        describe("7+ arrays (variadic fallback)", () => {
            it("returns unknown[] for more than 6 arrays", () => {
                const result = Arr.union(
                    [1],
                    ["a"],
                    [true],
                    [new Date()],
                    [/pattern/],
                    [Symbol("x")],
                    [null],
                );
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("object values in arrays", () => {
            it("returns same object type for matching arrays", () => {
                type User = { id: number; name: string };
                const a: User[] = [{ id: 1, name: "Alice" }];
                const b: User[] = [{ id: 2, name: "Bob" }];
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<User[]>();
            });

            it("returns union of different object shapes", () => {
                const result = Arr.union([{ id: 1 }], [{ name: "Alice" }]);
                expectTypeOf(result).toEqualTypeOf<
                    ({ id: number } | { name: string })[]
                >();
            });

            it("returns union of objects and primitives", () => {
                const result = Arr.union([{ id: 1 }], [42]);
                expectTypeOf(result).toEqualTypeOf<
                    ({ id: number } | number)[]
                >();
            });
        });

        describe("arrays containing unions", () => {
            it("preserves inner union types", () => {
                const a: (string | number)[] = [1, "a"];
                const b: (boolean | null)[] = [true, null];
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean | null)[]
                >();
            });

            it("merges overlapping union types", () => {
                const a: (string | number)[] = [1, "a"];
                const b: (number | boolean)[] = [2, true];
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean)[]
                >();
            });
        });

        describe("readonly and const arrays", () => {
            it("accepts readonly arrays", () => {
                const a: readonly number[] = [1, 2];
                const b: readonly string[] = ["a"];
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
            });

            it("accepts as const arrays", () => {
                const a = [1, 2, 3] as const;
                const b = ["x", "y"] as const;
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<(1 | 2 | 3 | "x" | "y")[]>();
            });

            it("mixes const and mutable arrays", () => {
                const a = [1, 2] as const;
                const b: string[] = ["a", "b"];
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<(1 | 2 | string)[]>();
            });
        });

        describe("typed variable references", () => {
            it("infers from number[] variables", () => {
                const a: number[] = [1, 2];
                const b: number[] = [3, 4];
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("infers from different typed variables", () => {
                const a: number[] = [1, 2];
                const b: string[] = ["a"];
                const c: boolean[] = [true];
                const result = Arr.union(a, b, c);
                expectTypeOf(result).toEqualTypeOf<
                    (number | string | boolean)[]
                >();
            });

            it("infers from Array<T> generic syntax", () => {
                const a: Array<number> = [1, 2];
                const b: Array<string> = ["a"];
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
            });
        });

        describe("nested arrays", () => {
            it("preserves nested array types", () => {
                const result = Arr.union([[1, 2]], [[3, 4]]);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("returns union of nested array types", () => {
                const result = Arr.union([[1, 2]], [["a", "b"]]);
                expectTypeOf(result).toEqualTypeOf<(number[] | string[])[]>();
            });

            it("handles deeply nested arrays", () => {
                const result = Arr.union([[[1]]], [[["a"]]]);
                expectTypeOf(result).toEqualTypeOf<
                    (number[][] | string[][])[]
                >();
            });
        });

        describe("complex data structures", () => {
            it("handles Map and Set arrays", () => {
                const result = Arr.union(
                    [new Map<string, number>()],
                    [new Set<string>()],
                );
                expectTypeOf(result).toEqualTypeOf<
                    (Map<string, number> | Set<string>)[]
                >();
            });

            it("handles Promise arrays", () => {
                const result = Arr.union(
                    [Promise.resolve(1)],
                    [Promise.resolve("a")],
                );
                expectTypeOf(result).toEqualTypeOf<
                    (Promise<number> | Promise<string>)[]
                >();
            });

            it("handles function arrays", () => {
                const fns1: (() => number)[] = [() => 1];
                const fns2: (() => string)[] = [() => "a"];
                const result = Arr.union(fns1, fns2);
                expectTypeOf(result).toEqualTypeOf<
                    ((() => number) | (() => string))[]
                >();
            });

            it("handles tuple arrays", () => {
                const result = Arr.union(
                    [[1, "a"] as [number, string]],
                    [[true, 42] as [boolean, number]],
                );
                expectTypeOf(result).toEqualTypeOf<
                    ([number, string] | [boolean, number])[]
                >();
            });
        });

        describe("nullable types", () => {
            it("returns (number | null)[] for arrays with nulls", () => {
                const a: (number | null)[] = [1, null];
                const b: (number | null)[] = [2, null];
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<(number | null)[]>();
            });

            it("returns (string | undefined)[] for arrays with undefined", () => {
                const a: (string | undefined)[] = ["a", undefined];
                const b: (string | undefined)[] = ["b"];
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });

            it("distinguishes null and undefined arrays", () => {
                const a: null[] = [null];
                const b: undefined[] = [undefined];
                const result = Arr.union(a, b);
                expectTypeOf(result).toEqualTypeOf<(null | undefined)[]>();
            });
        });

        describe("destructuring", () => {
            it("infers element type from destructured result", () => {
                const [first, ...rest] = Arr.union([1, 2], ["a"]);
                expectTypeOf(first).toEqualTypeOf<
                    number | string | undefined
                >();
                expectTypeOf(rest).toEqualTypeOf<(number | string)[]>();
            });

            it("infers element type for iteration", () => {
                const result = Arr.union([1], [true]);
                for (const item of result) {
                    expectTypeOf(item).toEqualTypeOf<number | boolean>();
                }
            });
        });

        describe("function signature", () => {
            it("is callable with no args", () => {
                expectTypeOf(Arr.union).toBeCallableWith();
            });

            it("is callable with one array", () => {
                expectTypeOf(Arr.union).toBeCallableWith([1, 2]);
            });

            it("is callable with multiple arrays", () => {
                expectTypeOf(Arr.union).toBeCallableWith([1], ["a"], [true]);
            });

            it("return type always extends unknown[]", () => {
                expectTypeOf(Arr.union).returns.toExtend<unknown[]>();
            });
        });
    });

    describe("unshift", () => {
        describe("same-type items (from functional tests)", () => {
            it("returns number[] when prepending number to number[]", () => {
                const result = Arr.unshift([1, 2, 3], 0);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] when prepending string to string[]", () => {
                const result = Arr.unshift(["one", "two"], "zero");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns boolean[] when prepending boolean to boolean[]", () => {
                const result = Arr.unshift([true, false], true);
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });
        });

        describe("different-type items (from functional tests)", () => {
            it("returns (number | string)[] for number[] + string item", () => {
                const result = Arr.unshift([1, 2], "a");
                expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
            });

            it("returns (string | string[]) when prepending string[] to string[]", () => {
                const result = Arr.unshift(["a", "b", "c"], ["x", "y", "z"]);
                expectTypeOf(result).toEqualTypeOf<(string | string[])[]>();
            });

            it("returns (number | boolean)[] for number[] + boolean item", () => {
                const result = Arr.unshift([1, 2], true);
                expectTypeOf(result).toEqualTypeOf<(number | boolean)[]>();
            });

            it("returns (number | Date)[] for number[] + Date item", () => {
                const result = Arr.unshift([1, 2], new Date());
                expectTypeOf(result).toEqualTypeOf<(number | Date)[]>();
            });
        });

        describe("multiple items of different types", () => {
            it("returns union of array + two different item types", () => {
                const result = Arr.unshift([1], "a", true);
                expectTypeOf(result).toEqualTypeOf<
                    (number | string | boolean)[]
                >();
            });

            it("returns union of array + three different item types", () => {
                const result = Arr.unshift([1], "a", true, new Date());
                expectTypeOf(result).toEqualTypeOf<
                    (number | string | boolean | Date)[]
                >();
            });

            it("returns union of array + four different item types", () => {
                const result = Arr.unshift(
                    [1],
                    "a",
                    true,
                    new Date(),
                    /pattern/,
                );
                expectTypeOf(result).toEqualTypeOf<
                    (number | string | boolean | Date | RegExp)[]
                >();
            });
        });

        describe("undefined items (from functional tests)", () => {
            it("includes undefined in union when undefined passed", () => {
                const result = Arr.unshift(["a", "b"], undefined, "c");
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });

            it("includes undefined for all-undefined items", () => {
                const result = Arr.unshift(["a"], undefined, undefined);
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });
        });

        describe("no items (data only)", () => {
            it("returns same type array when no items prepended", () => {
                const result = Arr.unshift([1, 2, 3]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] for empty data with no items", () => {
                const result = Arr.unshift(["a"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("empty array", () => {
            it("returns (never | string)[] prepending to empty array", () => {
                const result = Arr.unshift([], "hello");
                expectTypeOf(result).toEqualTypeOf<(never | string)[]>();
            });

            it("returns never[] for empty array with no items", () => {
                const result = Arr.unshift([]);
                expectTypeOf(result).toEqualTypeOf<never[]>();
            });
        });

        describe("object values", () => {
            it("preserves object type in array", () => {
                type User = { id: number; name: string };
                const users: User[] = [{ id: 1, name: "Alice" }];
                const newUser: User = { id: 0, name: "System" };
                const result = Arr.unshift(users, newUser);
                expectTypeOf(result).toEqualTypeOf<User[]>();
            });

            it("returns union of different object shapes", () => {
                const result = Arr.unshift([{ id: 1 }], { name: "Alice" });
                expectTypeOf(result).toEqualTypeOf<
                    ({ id: number } | { name: string })[]
                >();
            });

            it("returns union of objects and primitives", () => {
                const result = Arr.unshift([{ id: 1 }], 42);
                expectTypeOf(result).toEqualTypeOf<
                    ({ id: number } | number)[]
                >();
            });
        });

        describe("nested arrays", () => {
            it("preserves nested structure when prepending same type", () => {
                const result = Arr.unshift([[1, 2]], [3, 4]);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("returns union of nested array types", () => {
                const result = Arr.unshift([[1, 2]], ["a", "b"]);
                expectTypeOf(result).toEqualTypeOf<(number[] | string[])[]>();
            });
        });

        describe("readonly and const arrays", () => {
            it("accepts readonly input arrays", () => {
                const data: readonly number[] = [1, 2, 3];
                const result = Arr.unshift(data, 0);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts as const input arrays", () => {
                const data = [1, 2, 3] as const;
                const result = Arr.unshift(data, 0);
                expectTypeOf(result).toEqualTypeOf<(1 | 2 | 3 | number)[]>();
            });

            it("preserves const literal item types", () => {
                const result = Arr.unshift([1, 2] as const, "hello" as const);
                expectTypeOf(result).toEqualTypeOf<(1 | 2 | "hello")[]>();
            });
        });

        describe("typed variable references", () => {
            it("infers from number[] variables", () => {
                const data: number[] = [1, 2];
                const item: string = "a";
                const result = Arr.unshift(data, item);
                expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
            });

            it("infers from Array<T> generic syntax", () => {
                const data: Array<number> = [1, 2];
                const result = Arr.unshift(data, "a");
                expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
            });

            it("infers from variables with union types", () => {
                const data: (string | number)[] = [1, "a"];
                const result = Arr.unshift(data, true);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean)[]
                >();
            });
        });

        describe("complex data structures", () => {
            it("handles Map and Set items", () => {
                const data: Map<string, number>[] = [new Map([["a", 1]])];
                const result = Arr.unshift(data, new Set([1, 2]));
                expectTypeOf(result).toEqualTypeOf<
                    (Map<string, number> | Set<number>)[]
                >();
            });

            it("handles Promise items", () => {
                const data: Promise<number>[] = [Promise.resolve(1)];
                const result = Arr.unshift(data, Promise.resolve("a"));
                expectTypeOf(result).toEqualTypeOf<
                    (Promise<number> | Promise<string>)[]
                >();
            });

            it("handles function items", () => {
                const fns: (() => number)[] = [() => 1];
                const newFn: () => string = () => "a";
                const result = Arr.unshift(fns, newFn);
                expectTypeOf(result).toEqualTypeOf<
                    ((() => number) | (() => string))[]
                >();
            });

            it("handles tuple items", () => {
                const data: [number, string][] = [[1, "a"]];
                const result = Arr.unshift(data, [true, 42] as [
                    boolean,
                    number,
                ]);
                expectTypeOf(result).toEqualTypeOf<
                    ([number, string] | [boolean, number])[]
                >();
            });

            it("handles RegExp items", () => {
                const result = Arr.unshift([/abc/], /def/);
                expectTypeOf(result).toEqualTypeOf<RegExp[]>();
            });
        });

        describe("nullable types", () => {
            it("returns (number | null)[] when prepending null", () => {
                const result = Arr.unshift([1, 2], null);
                expectTypeOf(result).toEqualTypeOf<(number | null)[]>();
            });

            it("returns (string | null | undefined)[] for mixed nullables", () => {
                const result = Arr.unshift(["a"], null, undefined);
                expectTypeOf(result).toEqualTypeOf<
                    (string | null | undefined)[]
                >();
            });

            it("preserves nullable element types", () => {
                const data: (number | null)[] = [1, null];
                const result = Arr.unshift(data, 0);
                expectTypeOf(result).toEqualTypeOf<(number | null)[]>();
            });
        });

        describe("chained operations (from functional tests)", () => {
            it("accumulates types through multiple unshift calls", () => {
                const data = [4, 5, 6];
                const r1 = Arr.unshift(data, ["a", "b", "c"]);
                expectTypeOf(r1).toEqualTypeOf<(number | string[])[]>();

                const r2 = Arr.unshift(r1, ["Jonny", "from", "Laroe"]);
                expectTypeOf(r2).toEqualTypeOf<
                    (number | string[] | string[])[]
                >();

                const r3 = Arr.unshift(r2, "Jonny from Laroe");
                expectTypeOf(r3).toEqualTypeOf<
                    (number | string[] | string)[]
                >();
            });
        });

        describe("5+ items (variadic fallback)", () => {
            it("returns unknown[] for more than 4 items", () => {
                const result = Arr.unshift(
                    [1],
                    "a",
                    true,
                    new Date(),
                    /pattern/,
                    Symbol("x"),
                    null,
                );
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("destructuring", () => {
            it("infers element type from destructured result", () => {
                const [first, ...rest] = Arr.unshift([1, 2], "a");
                expectTypeOf(first).toEqualTypeOf<
                    number | string | undefined
                >();
                expectTypeOf(rest).toEqualTypeOf<(number | string)[]>();
            });

            it("infers element type for iteration", () => {
                const result = Arr.unshift([1], true);
                for (const item of result) {
                    expectTypeOf(item).toEqualTypeOf<number | boolean>();
                }
            });
        });

        describe("function signature", () => {
            it("is callable with data only", () => {
                expectTypeOf(Arr.unshift).toBeCallableWith([1, 2]);
            });

            it("is callable with data and single item", () => {
                expectTypeOf(Arr.unshift).toBeCallableWith([1], "a");
            });

            it("is callable with data and multiple items", () => {
                expectTypeOf(Arr.unshift).toBeCallableWith([1], "a", true, 42);
            });

            it("return type always extends unknown[]", () => {
                expectTypeOf(Arr.unshift).returns.toExtend<unknown[]>();
            });
        });
    });

    describe("except", () => {
        describe("string arrays", () => {
            it("returns string[] for string array input", () => {
                const result = Arr.except(["a", "b", "c"], [0, 2]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns string[] when removing single index", () => {
                const result = Arr.except(["hello", "world"], 0);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("number arrays", () => {
            it("returns number[] for number array input", () => {
                const result = Arr.except([1, 2, 3, 4], [1, 3]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns number[] when removing single index", () => {
                const result = Arr.except([10, 20, 30], 1);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("boolean arrays", () => {
            it("returns boolean[] for boolean array input", () => {
                const result = Arr.except([true, false, true], [0]);
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });
        });

        describe("object arrays", () => {
            it("returns object[] for object array input", () => {
                const data = [
                    { id: 1, name: "a" },
                    { id: 2, name: "b" },
                ];
                const result = Arr.except(data, [0]);
                expectTypeOf(result).toEqualTypeOf<
                    { id: number; name: string }[]
                >();
            });
        });

        describe("union type arrays", () => {
            it("returns (string | number)[] for mixed array", () => {
                const data: (string | number)[] = ["a", 1, "b", 2];
                const result = Arr.except(data, [0, 2]);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });

            it("returns (string | null)[] for nullable array", () => {
                const data: (string | null)[] = ["a", null, "b"];
                const result = Arr.except(data, [1]);
                expectTypeOf(result).toEqualTypeOf<(string | null)[]>();
            });

            it("returns (number | undefined)[] for optional array", () => {
                const data: (number | undefined)[] = [1, undefined, 3];
                const result = Arr.except(data, [1]);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[]>();
            });
        });

        describe("null and undefined keys", () => {
            it("returns TValue[] when keys is null", () => {
                const result = Arr.except(["a", "b", "c"], null);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns TValue[] when keys is undefined", () => {
                const result = Arr.except([1, 2, 3], undefined);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("string keys", () => {
            it("returns TValue[] when keys is a string", () => {
                const result = Arr.except(["a", "b", "c"], "1");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns TValue[] when keys is a dot-notation string", () => {
                const data = [["nested1"], ["nested2"]];
                const result = Arr.except(data, "0.0");
                expectTypeOf(result).toEqualTypeOf<string[][]>();
            });
        });

        describe("array of keys", () => {
            it("returns TValue[] when keys is number[]", () => {
                const result = Arr.except(["a", "b", "c", "d"], [0, 2]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns TValue[] when keys is string[]", () => {
                const result = Arr.except([1, 2, 3, 4], ["0", "2"]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns TValue[] when keys is mixed array", () => {
                const result = Arr.except(["a", "b", "c"], [0, "1"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("readonly arrays", () => {
            it("accepts readonly string[] input", () => {
                const data: readonly string[] = ["a", "b", "c"];
                const result = Arr.except(data, [0]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("accepts readonly number[] input", () => {
                const data: readonly number[] = [1, 2, 3];
                const result = Arr.except(data, 1);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns mutable TValue[] from readonly input", () => {
                const data: readonly string[] = ["x", "y", "z"];
                const result = Arr.except(data, [0]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
                // Should NOT be readonly
                expectTypeOf(result).not.toEqualTypeOf<readonly string[]>();
            });
        });

        describe("as const arrays", () => {
            it("preserves literal types from const arrays", () => {
                const data = ["a", "b", "c"] as const;
                const result = Arr.except(data, [0]);
                expectTypeOf(result).toEqualTypeOf<("a" | "b" | "c")[]>();
            });

            it("preserves numeric literal types", () => {
                const data = [1, 2, 3] as const;
                const result = Arr.except(data, [1]);
                expectTypeOf(result).toEqualTypeOf<(1 | 2 | 3)[]>();
            });
        });

        describe("empty arrays", () => {
            it("returns never[] for empty array", () => {
                const result = Arr.except([], [0]);
                expectTypeOf(result).toEqualTypeOf<never[]>();
            });

            it("returns TValue[] with empty keys array", () => {
                const result = Arr.except(["a", "b"], []);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("nested arrays", () => {
            it("returns nested array type", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                ];
                const result = Arr.except(data, [0]);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("returns deeply nested array type", () => {
                const data = [[[1]], [[2]], [[3]]];
                const result = Arr.except(data, [0, 2]);
                expectTypeOf(result).toEqualTypeOf<number[][][]>();
            });
        });

        describe("typed variables", () => {
            it("works with explicitly typed string[]", () => {
                const data: string[] = ["a", "b", "c"];
                const keys: number[] = [0, 2];
                const result = Arr.except(data, keys);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("works with explicitly typed number[]", () => {
                const data: number[] = [1, 2, 3];
                const keys: number = 1;
                const result = Arr.except(data, keys);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("complex data structures", () => {
            it("handles interface types", () => {
                interface User {
                    id: number;
                    name: string;
                    active: boolean;
                }
                const users: User[] = [
                    { id: 1, name: "Alice", active: true },
                    { id: 2, name: "Bob", active: false },
                ];
                const result = Arr.except(users, [0]);
                expectTypeOf(result).toEqualTypeOf<User[]>();
            });

            it("handles tuple element types", () => {
                const data: [string, number][] = [
                    ["a", 1],
                    ["b", 2],
                ];
                const result = Arr.except(data, [0]);
                expectTypeOf(result).toEqualTypeOf<[string, number][]>();
            });

            it("handles Map/Set value arrays", () => {
                const data: Map<string, number>[] = [
                    new Map([["a", 1]]),
                    new Map([["b", 2]]),
                ];
                const result = Arr.except(data, [0]);
                expectTypeOf(result).toEqualTypeOf<Map<string, number>[]>();
            });
        });

        describe("destructuring", () => {
            it("destructured element includes undefined", () => {
                const result = Arr.except(["a", "b", "c"], [0]);
                const [first] = result;
                expectTypeOf(first).toEqualTypeOf<string | undefined>();
            });
        });

        describe("function signature", () => {
            it("returns an array type", () => {
                expectTypeOf(Arr.except).returns.toExtend<unknown[]>();
            });

            it("accepts two parameters", () => {
                expectTypeOf(Arr.except).parameters.toExtend<
                    [readonly unknown[], unknown]
                >();
            });
        });
    });

    describe("exceptValues", () => {
        describe("string arrays", () => {
            it("excludes string values from string array", () => {
                const array = ["foo", "bar", "baz", "qux"];
                const result = Arr.exceptValues(array, ["foo", "baz"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("excludes single string value from string array", () => {
                const array = ["foo", "bar", "baz", "qux"];
                const result = Arr.exceptValues(array, "baz");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("number arrays", () => {
            it("excludes number values from number array", () => {
                const array = [1, 2, 3, 4, 5];
                const result = Arr.exceptValues(array, [3, 4]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("excludes single number value", () => {
                const result = Arr.exceptValues([10, 20, 30], 20);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("boolean arrays", () => {
            it("excludes boolean values from boolean array", () => {
                const array = [true, false, true, false];
                const result = Arr.exceptValues(array, [true]);
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });

            it("excludes single boolean value", () => {
                const result = Arr.exceptValues([true, false], false);
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });
        });

        describe("mixed type arrays", () => {
            it("handles mixed string and number array with strict", () => {
                const array: (string | number)[] = [1, "1", 2, "2", 3];
                const result = Arr.exceptValues(array, [1, 2, 3], true);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });

            it("handles mixed string and number array without strict", () => {
                const array: (string | number)[] = [1, "1", 2, "2", 3];
                const result = Arr.exceptValues(array, [1, 2, 3]);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });

            it("handles mixed boolean and number array with strict", () => {
                const array: (boolean | number)[] = [true, false, 1, 0];
                const result = Arr.exceptValues(array, [1, 0], true);
                expectTypeOf(result).toEqualTypeOf<(boolean | number)[]>();
            });

            it("handles mixed boolean and number array without strict", () => {
                const array: (boolean | number)[] = [true, false, 1, 0];
                const result = Arr.exceptValues(array, [1, 0]);
                expectTypeOf(result).toEqualTypeOf<(boolean | number)[]>();
            });
        });

        describe("empty arrays", () => {
            it("returns string[] for empty data with string values", () => {
                const result = Arr.exceptValues([] as string[], "foo");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns string[] with empty values array", () => {
                const data = ["foo", "bar"];
                const result = Arr.exceptValues(data, [] as string[]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("nullable type arrays", () => {
            it("handles (string | null)[] data", () => {
                const data: (string | null)[] = ["a", null, "b", null];
                const result = Arr.exceptValues(data, [null]);
                expectTypeOf(result).toEqualTypeOf<(string | null)[]>();
            });

            it("handles (number | undefined)[] data", () => {
                const data: (number | undefined)[] = [1, undefined, 3];
                const result = Arr.exceptValues(data, [undefined]);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[]>();
            });

            it("handles (string | null | undefined)[] data", () => {
                const data: (string | null | undefined)[] = [
                    "a",
                    null,
                    undefined,
                ];
                const result = Arr.exceptValues(data, [null, undefined]);
                expectTypeOf(result).toEqualTypeOf<
                    (string | null | undefined)[]
                >();
            });
        });

        describe("object arrays", () => {
            it("excludes objects from array of objects", () => {
                interface User {
                    id: number;
                    name: string;
                    active: boolean;
                }
                const users: User[] = [
                    { id: 1, name: "Alice", active: true },
                    { id: 2, name: "Bob", active: false },
                    { id: 3, name: "Charlie", active: true },
                ];
                const toExclude: User[] = [
                    { id: 2, name: "Bob", active: false },
                ];
                const result = Arr.exceptValues(users, toExclude);
                expectTypeOf(result).toEqualTypeOf<User[]>();
            });

            it("excludes single object from object array", () => {
                const data = [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ];
                const result = Arr.exceptValues(data, { x: 1, y: 2 });
                expectTypeOf(result).toEqualTypeOf<
                    { x: number; y: number }[]
                >();
            });
        });

        describe("nested arrays", () => {
            it("excludes nested arrays from array of arrays", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                    [5, 6],
                ];
                const result = Arr.exceptValues(data, [[1, 2]]);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("handles deeply nested arrays", () => {
                const data = [[[1]], [[2]], [[3]]];
                const result = Arr.exceptValues(data, [[[1]]]);
                expectTypeOf(result).toEqualTypeOf<number[][][]>();
            });
        });

        describe("tuple element arrays", () => {
            it("excludes tuples from array of tuples", () => {
                const data: [string, number][] = [
                    ["a", 1],
                    ["b", 2],
                    ["c", 3],
                ];
                const toExclude: [string, number][] = [["b", 2]];
                const result = Arr.exceptValues(data, toExclude);
                expectTypeOf(result).toEqualTypeOf<[string, number][]>();
            });
        });

        describe("Map and Set arrays", () => {
            it("excludes Maps from array of Maps", () => {
                const data: Map<string, number>[] = [
                    new Map([["a", 1]]),
                    new Map([["b", 2]]),
                ];
                const toExclude: Map<string, number>[] = [new Map([["a", 1]])];
                const result = Arr.exceptValues(data, toExclude);
                expectTypeOf(result).toEqualTypeOf<Map<string, number>[]>();
            });

            it("excludes Sets from array of Sets", () => {
                const data: Set<number>[] = [new Set([1, 2]), new Set([3, 4])];
                const toExclude: Set<number>[] = [new Set([1, 2])];
                const result = Arr.exceptValues(data, toExclude);
                expectTypeOf(result).toEqualTypeOf<Set<number>[]>();
            });
        });

        describe("readonly arrays", () => {
            it("accepts readonly data array", () => {
                const data: readonly string[] = ["a", "b", "c"];
                const result = Arr.exceptValues(data, ["a"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("accepts readonly values array", () => {
                const data = ["a", "b", "c"];
                const values: readonly string[] = ["a", "b"];
                const result = Arr.exceptValues(data, values);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("accepts both readonly data and values", () => {
                const data: readonly number[] = [1, 2, 3];
                const values: readonly number[] = [2, 3];
                const result = Arr.exceptValues(data, values);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns mutable array from readonly input", () => {
                const data: readonly string[] = ["x", "y", "z"];
                const result = Arr.exceptValues(data, ["x"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
                expectTypeOf(result).not.toEqualTypeOf<readonly string[]>();
            });
        });

        describe("as const arrays", () => {
            it("preserves literal types from const data and values", () => {
                const data = ["foo", "bar", "baz"] as const;
                const values = ["foo"] as const;
                const result = Arr.exceptValues(data, values);
                expectTypeOf(result).toEqualTypeOf<("foo" | "bar" | "baz")[]>();
            });

            it("preserves numeric literal types with const values", () => {
                const data = [1, 2, 3] as const;
                const values = [1] as const;
                const result = Arr.exceptValues(data, values);
                expectTypeOf(result).toEqualTypeOf<(1 | 2 | 3)[]>();
            });

            it("widens to base type when values is not const", () => {
                const data = ["foo", "bar", "baz"] as const;
                const result = Arr.exceptValues(data, ["foo"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("handles const values array", () => {
                const data = ["a", "b", "c"];
                const values = ["a", "c"] as const;
                const result = Arr.exceptValues(data, values);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("strict parameter", () => {
            it("accepts explicit true for strict", () => {
                const result = Arr.exceptValues([1, 2, 3], [1], true);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts explicit false for strict", () => {
                const result = Arr.exceptValues([1, 2, 3], [1], false);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("works without strict parameter (default)", () => {
                const result = Arr.exceptValues([1, 2, 3], [1]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts boolean variable for strict", () => {
                const strict: boolean = true;
                const result = Arr.exceptValues(["a", "b", "c"], ["a"], strict);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("complex data structures", () => {
            it("handles array of functions", () => {
                type Callback = (x: number) => string;
                const fns: Callback[] = [(x) => `${x}`, (x) => `value: ${x}`];
                const toExclude: Callback[] = [(x) => `${x}`];
                const result = Arr.exceptValues(fns, toExclude);
                expectTypeOf(result).toEqualTypeOf<Callback[]>();
            });

            it("handles array of Date objects", () => {
                const dates: Date[] = [
                    new Date("2024-01-01"),
                    new Date("2024-06-15"),
                ];
                const result = Arr.exceptValues(dates, [
                    new Date("2024-01-01"),
                ]);
                expectTypeOf(result).toEqualTypeOf<Date[]>();
            });

            it("handles array of RegExp objects", () => {
                const patterns: RegExp[] = [/foo/, /bar/, /baz/];
                const result = Arr.exceptValues(patterns, [/foo/]);
                expectTypeOf(result).toEqualTypeOf<RegExp[]>();
            });

            it("handles array of promises", () => {
                const promises: Promise<string>[] = [
                    Promise.resolve("a"),
                    Promise.resolve("b"),
                ];
                const toExclude: Promise<string>[] = [Promise.resolve("a")];
                const result = Arr.exceptValues(promises, toExclude);
                expectTypeOf(result).toEqualTypeOf<Promise<string>[]>();
            });

            it("handles discriminated union arrays", () => {
                type Shape =
                    | { kind: "circle"; radius: number }
                    | { kind: "square"; side: number };
                const shapes: Shape[] = [
                    { kind: "circle", radius: 5 },
                    { kind: "square", side: 10 },
                ];
                const toExclude: Shape[] = [{ kind: "circle", radius: 5 }];
                const result = Arr.exceptValues(shapes, toExclude);
                expectTypeOf(result).toEqualTypeOf<Shape[]>();
            });

            it("handles generic record arrays", () => {
                const data: Record<string, number>[] = [
                    { a: 1 },
                    { b: 2 },
                    { c: 3 },
                ];
                const toExclude: Record<string, number>[] = [{ a: 1 }];
                const result = Arr.exceptValues(data, toExclude);
                expectTypeOf(result).toEqualTypeOf<Record<string, number>[]>();
            });
        });

        describe("destructuring", () => {
            it("destructured element includes undefined due to noUncheckedIndexedAccess", () => {
                const result = Arr.exceptValues(["a", "b", "c"], ["a"]);
                const [first] = result;
                expectTypeOf(first).toEqualTypeOf<string | undefined>();
            });
        });

        describe("function signature", () => {
            it("returns an array type", () => {
                expectTypeOf(Arr.exceptValues).returns.toExtend<unknown[]>();
            });

            it("accepts two or three parameters", () => {
                expectTypeOf(Arr.exceptValues).parameters.toExtend<
                    [readonly unknown[], unknown, ...unknown[]]
                >();
            });
        });
    });

    describe("exists", () => {
        describe("number arrays", () => {
            it("returns boolean for number array with number key", () => {
                const result = Arr.exists([1, 2, 3], 1);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for number array with string key", () => {
                const result = Arr.exists([1, 2, 3], "0");
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("string arrays", () => {
            it("returns boolean for string array with number key", () => {
                const result = Arr.exists(["a", "b", "c"], 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for string array with string key", () => {
                const result = Arr.exists(["a", "b", "c"], "1");
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("boolean arrays", () => {
            it("returns boolean for boolean array", () => {
                const result = Arr.exists([true, false], 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("null and undefined keys", () => {
            it("returns boolean when key is null", () => {
                const result = Arr.exists([1, 2, 3], null);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean when key is undefined", () => {
                const result = Arr.exists([1, 2, 3], undefined);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("nullable value arrays", () => {
            it("returns boolean for array containing null values", () => {
                const data: (string | null)[] = ["a", null, "b"];
                const result = Arr.exists(data, 1);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for array of nulls", () => {
                const result = Arr.exists([null], 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for (number | undefined)[] data", () => {
                const data: (number | undefined)[] = [1, undefined, 3];
                const result = Arr.exists(data, 1);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("object arrays", () => {
            it("returns boolean for array of objects", () => {
                interface User {
                    id: number;
                    name: string;
                    active: boolean;
                }
                const users: User[] = [
                    { id: 1, name: "Alice", active: true },
                    { id: 2, name: "Bob", active: false },
                ];
                const result = Arr.exists(users, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for array of nested objects", () => {
                const data = [
                    { a: { b: { c: 1 } } },
                    { a: { b: { c: 2 } } },
                ];
                const result = Arr.exists(data, 1);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("union type arrays", () => {
            it("returns boolean for (string | number)[] data", () => {
                const data: (string | number)[] = ["a", 1, "b", 2];
                const result = Arr.exists(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for (boolean | number)[] data", () => {
                const data: (boolean | number)[] = [true, false, 1, 0];
                const result = Arr.exists(data, 2);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("nested arrays", () => {
            it("returns boolean for nested array", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                ];
                const result = Arr.exists(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for deeply nested array", () => {
                const data = [[[1]], [[2]], [[3]]];
                const result = Arr.exists(data, 2);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("readonly arrays", () => {
            it("accepts readonly array input", () => {
                const data: readonly string[] = ["a", "b", "c"];
                const result = Arr.exists(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("accepts readonly number array", () => {
                const data: readonly number[] = [1, 2, 3];
                const result = Arr.exists(data, 1);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("as const arrays", () => {
            it("accepts const array input", () => {
                const data = ["a", "b", "c"] as const;
                const result = Arr.exists(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("accepts const numeric array input", () => {
                const data = [1, 2, 3] as const;
                const result = Arr.exists(data, 2);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("empty arrays", () => {
            it("returns boolean for empty array", () => {
                const result = Arr.exists([], 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("complex data structures", () => {
            it("returns boolean for array of Maps", () => {
                const data: Map<string, number>[] = [
                    new Map([["a", 1]]),
                    new Map([["b", 2]]),
                ];
                const result = Arr.exists(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for array of Sets", () => {
                const data: Set<number>[] = [
                    new Set([1, 2]),
                    new Set([3, 4]),
                ];
                const result = Arr.exists(data, 1);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for array of tuples", () => {
                const data: [string, number][] = [
                    ["a", 1],
                    ["b", 2],
                ];
                const result = Arr.exists(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for array of Dates", () => {
                const data: Date[] = [
                    new Date("2024-01-01"),
                    new Date("2024-06-15"),
                ];
                const result = Arr.exists(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for discriminated union array", () => {
                type Shape =
                    | { kind: "circle"; radius: number }
                    | { kind: "square"; side: number };
                const shapes: Shape[] = [
                    { kind: "circle", radius: 5 },
                    { kind: "square", side: 10 },
                ];
                const result = Arr.exists(shapes, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for array of Records", () => {
                const data: Record<string, number>[] = [
                    { a: 1 },
                    { b: 2 },
                ];
                const result = Arr.exists(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("returns boolean for array of Promises", () => {
                const data: Promise<string>[] = [
                    Promise.resolve("a"),
                    Promise.resolve("b"),
                ];
                const result = Arr.exists(data, 0);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("typed key variables", () => {
            it("works with number variable key", () => {
                const data = [1, 2, 3];
                const key: number = 1;
                const result = Arr.exists(data, key);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("works with string variable key", () => {
                const data = ["a", "b", "c"];
                const key: string = "0";
                const result = Arr.exists(data, key);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });

            it("works with PathKey typed variable", () => {
                const data = [1, 2, 3];
                const key: number | string | null | undefined = 1;
                const result = Arr.exists(data, key);
                expectTypeOf(result).toEqualTypeOf<boolean>();
            });
        });

        describe("function signature", () => {
            it("returns boolean", () => {
                expectTypeOf(Arr.exists).returns.toEqualTypeOf<boolean>();
            });

            it("accepts two parameters", () => {
                expectTypeOf(Arr.exists).parameters.toExtend<
                    [readonly unknown[], unknown]
                >();
            });
        });
    });

    describe("first", () => {
        describe("array without callback", () => {
            it("returns TValue | null for number array", () => {
                const result = Arr.first([1, 2, 3]);
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });

            it("returns TValue | null for string array", () => {
                const result = Arr.first(["a", "b", "c"]);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns TValue | null for boolean array", () => {
                const result = Arr.first([true, false]);
                expectTypeOf(result).toEqualTypeOf<boolean | null>();
            });

            it("returns null for empty array", () => {
                const result = Arr.first([]);
                expectTypeOf(result).toEqualTypeOf<never | null>();
            });

            it("returns TValue | null with explicit null callback", () => {
                const result = Arr.first([1, 2, 3], null);
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });
        });

        describe("array with callback", () => {
            it("infers TValue in callback parameter", () => {
                Arr.first([1, 2, 3], (value) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    return value >= 150;
                });
            });

            it("infers key as number in callback", () => {
                Arr.first([1, 2, 3], (_, key) => {
                    expectTypeOf(key).toEqualTypeOf<number>();
                    return key < 2;
                });
            });

            it("returns TValue | null with callback", () => {
                const result = Arr.first(
                    [100, 200, 300],
                    (value) => value >= 150,
                );
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });

            it("returns TValue | null for string array with callback", () => {
                const result = Arr.first(
                    ["a", "b", "c"],
                    (v) => v === "b",
                );
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });
        });

        describe("array with default value", () => {
            it("returns TValue | TDefault | null with string default", () => {
                const result = Arr.first([1, 2, 3], null, "default");
                expectTypeOf(result).toEqualTypeOf<
                    number | string | null
                >();
            });

            it("returns TValue | TDefault | null with number default", () => {
                const result = Arr.first(["a", "b"], null, 0);
                expectTypeOf(result).toEqualTypeOf<
                    string | number | null
                >();
            });

            it("returns TValue | null | null with null default", () => {
                const result = Arr.first(["a", "b"], null, null);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns TValue | TDefault | null with boolean default", () => {
                const result = Arr.first([1, 2, 3], null, false);
                expectTypeOf(result).toEqualTypeOf<
                    number | boolean | null
                >();
            });
        });

        describe("array with callback and default", () => {
            it("returns TValue | TDefault | null with callback + string default", () => {
                const result = Arr.first(
                    [100, 200, 300],
                    (value) => value > 300,
                    "bar",
                );
                expectTypeOf(result).toEqualTypeOf<
                    number | string | null
                >();
            });

            it("returns TValue | TDefault | null with callback + function default", () => {
                const result = Arr.first(
                    [100, 200, 300],
                    (value) => value > 300,
                    () => "baz",
                );
                expectTypeOf(result).toEqualTypeOf<
                    number | string | null
                >();
            });

            it("infers callback value and key types together", () => {
                const result = Arr.first(
                    [100, 200, 300],
                    (_, key) => key < 2,
                );
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });
        });

        describe("default value as function", () => {
            it("unwraps function default to return type", () => {
                const result = Arr.first([], null, () => "bar");
                expectTypeOf(result).toEqualTypeOf<
                    never | string | null
                >();
            });

            it("unwraps function default with complex return type", () => {
                const result = Arr.first(
                    [] as number[],
                    null,
                    () => ({ fallback: true }),
                );
                expectTypeOf(result).toEqualTypeOf<
                    number | { fallback: boolean } | null
                >();
            });
        });

        describe("Generator and IterableIterator", () => {
            it("returns TValue | null for generator without callback", () => {
                function* gen(): Generator<number> {
                    yield 1;
                    yield 2;
                }
                const result = Arr.first(gen());
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });

            it("returns TValue | null for generator with callback", () => {
                function* gen(): Generator<string> {
                    yield "a";
                    yield "b";
                }
                const result = Arr.first(gen(), (v) => v === "b");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns TValue | TDefault | null for generator with default", () => {
                function* gen(): Generator<number> {
                    yield 1;
                }
                const result = Arr.first(gen(), null, "fallback");
                expectTypeOf(result).toEqualTypeOf<
                    number | string | null
                >();
            });

            it("returns TValue | null for IterableIterator", () => {
                const iter: IterableIterator<number> = [1, 2, 3][
                    Symbol.iterator
                ]();
                const result = Arr.first(iter);
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });
        });

        describe("unknown fallback overload", () => {
            it("returns TValue | null for null input", () => {
                const result = Arr.first(null);
                expectTypeOf(result).toEqualTypeOf<unknown | null>();
            });

            it("returns TValue | TDefault | null for null input with default", () => {
                const result = Arr.first(null, null, "fallback");
                expectTypeOf(result).toEqualTypeOf<
                    unknown | string | null
                >();
            });
        });

        describe("object arrays", () => {
            it("infers object type for array of objects", () => {
                interface User {
                    id: number;
                    name: string;
                    active: boolean;
                }
                const users: User[] = [
                    { id: 1, name: "Alice", active: true },
                    { id: 2, name: "Bob", active: false },
                ];
                const result = Arr.first(users);
                expectTypeOf(result).toEqualTypeOf<User | null>();
            });

            it("infers object type in callback", () => {
                interface User {
                    id: number;
                    name: string;
                    active: boolean;
                }
                const users: User[] = [
                    { id: 1, name: "Alice", active: true },
                    { id: 2, name: "Bob", active: false },
                ];
                const result = Arr.first(users, (user) => {
                    expectTypeOf(user).toEqualTypeOf<User>();
                    return user.active;
                });
                expectTypeOf(result).toEqualTypeOf<User | null>();
            });

            it("returns object or default", () => {
                interface Config {
                    key: string;
                    value: unknown;
                }
                const configs: Config[] = [];
                const result = Arr.first(
                    configs,
                    (c) => c.key === "theme",
                    { key: "theme", value: "dark" } as Config,
                );
                expectTypeOf(result).toEqualTypeOf<Config | null>();
            });
        });

        describe("union type arrays", () => {
            it("returns union type | null", () => {
                const data: (string | number)[] = ["a", 1, "b", 2];
                const result = Arr.first(data);
                expectTypeOf(result).toEqualTypeOf<
                    string | number | null
                >();
            });

            it("infers union in callback parameter", () => {
                const data: (string | number)[] = ["a", 1, "b", 2];
                Arr.first(data, (value) => {
                    expectTypeOf(value).toEqualTypeOf<string | number>();
                    return typeof value === "string";
                });
            });

            it("returns nullable union with default", () => {
                const data: (string | number)[] = [];
                const result = Arr.first(data, null, false);
                expectTypeOf(result).toEqualTypeOf<
                    string | number | boolean | null
                >();
            });
        });

        describe("nullable type arrays", () => {
            it("returns (T | null) | null for nullable array", () => {
                const data: (string | null)[] = ["a", null, "b"];
                const result = Arr.first(data);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns (T | undefined) | null for optional array", () => {
                const data: (number | undefined)[] = [1, undefined, 3];
                const result = Arr.first(data);
                expectTypeOf(result).toEqualTypeOf<
                    number | undefined | null
                >();
            });
        });

        describe("nested arrays", () => {
            it("returns nested array type | null", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                ];
                const result = Arr.first(data);
                expectTypeOf(result).toEqualTypeOf<number[] | null>();
            });

            it("infers nested array in callback", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                ];
                const result = Arr.first(
                    data,
                    (arr) => arr.length > 1,
                );
                expectTypeOf(result).toEqualTypeOf<number[] | null>();
            });
        });

        describe("complex data structures", () => {
            it("handles array of tuples", () => {
                const data: [string, number][] = [
                    ["a", 1],
                    ["b", 2],
                ];
                const result = Arr.first(data);
                expectTypeOf(result).toEqualTypeOf<
                    [string, number] | null
                >();
            });

            it("handles array of Maps", () => {
                const data: Map<string, number>[] = [
                    new Map([["a", 1]]),
                    new Map([["b", 2]]),
                ];
                const result = Arr.first(data);
                expectTypeOf(result).toEqualTypeOf<
                    Map<string, number> | null
                >();
            });

            it("handles discriminated union with callback", () => {
                type Shape =
                    | { kind: "circle"; radius: number }
                    | { kind: "square"; side: number };
                const shapes: Shape[] = [
                    { kind: "circle", radius: 5 },
                    { kind: "square", side: 10 },
                ];
                const result = Arr.first(
                    shapes,
                    (s) => s.kind === "circle",
                );
                expectTypeOf(result).toEqualTypeOf<Shape | null>();
            });

            it("handles array of Dates", () => {
                const dates: Date[] = [
                    new Date("2024-01-01"),
                    new Date("2024-06-15"),
                ];
                const result = Arr.first(dates);
                expectTypeOf(result).toEqualTypeOf<Date | null>();
            });

            it("handles array of Promises", () => {
                const promises: Promise<string>[] = [
                    Promise.resolve("a"),
                    Promise.resolve("b"),
                ];
                const result = Arr.first(promises);
                expectTypeOf(result).toEqualTypeOf<
                    Promise<string> | null
                >();
            });

            it("handles array of Records with callback", () => {
                const data: Record<string, number>[] = [
                    { a: 1 },
                    { b: 2 },
                ];
                const result = Arr.first(
                    data,
                    (obj) => obj["a"] !== undefined,
                );
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number> | null
                >();
            });
        });

        describe("readonly arrays", () => {
            it("accepts readonly string array", () => {
                const data: readonly string[] = ["a", "b", "c"];
                const result = Arr.first([...data]);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });
        });

        describe("as const arrays", () => {
            it("infers literal union from const array", () => {
                const data = ["a", "b", "c"] as const;
                const result = Arr.first([...data]);
                expectTypeOf(result).toEqualTypeOf<
                    "a" | "b" | "c" | null
                >();
            });
        });

        describe("function signature", () => {
            it("returns type that extends unknown | null", () => {
                expectTypeOf(Arr.first).returns.toExtend<unknown | null>();
            });
        });
    });

    describe("last", () => {
        describe("array without callback", () => {
            it("returns TValue | null for number array", () => {
                const result = Arr.last([1, 2, 3]);
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });

            it("returns TValue | null for string array", () => {
                const result = Arr.last(["a", "b", "c"]);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns TValue | null for boolean array", () => {
                const result = Arr.last([true, false]);
                expectTypeOf(result).toEqualTypeOf<boolean | null>();
            });

            it("returns null for empty array", () => {
                const result = Arr.last([]);
                expectTypeOf(result).toEqualTypeOf<never | null>();
            });

            it("returns TValue | null with explicit null callback", () => {
                const result = Arr.last([1, 2, 3], null);
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });
        });

        describe("array with callback", () => {
            it("infers TValue in callback parameter", () => {
                Arr.last([100, 200, 300], (value) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    return value < 250;
                });
            });

            it("infers key as number in callback", () => {
                Arr.last([100, 200, 300], (_, key) => {
                    expectTypeOf(key).toEqualTypeOf<number>();
                    return key < 2;
                });
            });

            it("returns TValue | null with callback", () => {
                const result = Arr.last(
                    [100, 200, 300],
                    (value) => value < 250,
                );
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });

            it("returns TValue | null for string array with callback", () => {
                const result = Arr.last(
                    ["a", "b", "c"],
                    (v) => v === "b",
                );
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });
        });

        describe("array with default value", () => {
            it("returns TValue | TDefault | null with string default", () => {
                const result = Arr.last([1, 2, 3], null, "foo");
                expectTypeOf(result).toEqualTypeOf<
                    number | string | null
                >();
            });

            it("returns TValue | TDefault | null with number default", () => {
                const result = Arr.last(["a", "b"], null, 0);
                expectTypeOf(result).toEqualTypeOf<
                    string | number | null
                >();
            });

            it("returns TValue | null | null with null default", () => {
                const result = Arr.last(["a", "b"], null, null);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns TValue | TDefault | null with boolean default", () => {
                const result = Arr.last([1, 2, 3], null, false);
                expectTypeOf(result).toEqualTypeOf<
                    number | boolean | null
                >();
            });
        });

        describe("array with callback and default", () => {
            it("returns TValue | TDefault | null with callback + string default", () => {
                const result = Arr.last(
                    [100, 200, 300],
                    (value) => value > 300,
                    "bar",
                );
                expectTypeOf(result).toEqualTypeOf<
                    number | string | null
                >();
            });

            it("returns TValue | TDefault | null with callback + function default", () => {
                const result = Arr.last(
                    [100, 200, 300],
                    (value) => value > 300,
                    () => "baz",
                );
                expectTypeOf(result).toEqualTypeOf<
                    number | string | null
                >();
            });

            it("infers callback value and key types together", () => {
                const result = Arr.last(
                    [100, 200, 300],
                    (_, key) => key < 2,
                );
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });
        });

        describe("default value as function", () => {
            it("unwraps function default to return type", () => {
                const result = Arr.last([], null, () => "bar");
                expectTypeOf(result).toEqualTypeOf<
                    never | string | null
                >();
            });

            it("unwraps function default with complex return type", () => {
                const result = Arr.last(
                    [] as number[],
                    null,
                    () => ({ fallback: true }),
                );
                expectTypeOf(result).toEqualTypeOf<
                    number | { fallback: boolean } | null
                >();
            });
        });

        describe("Generator and IterableIterator", () => {
            it("returns TValue | null for generator without callback", () => {
                function* gen(): Generator<number> {
                    yield 1;
                    yield 2;
                    yield 3;
                }
                const result = Arr.last(gen());
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });

            it("returns TValue | null for generator with callback", () => {
                function* gen(): Generator<string> {
                    yield "a";
                    yield "b";
                    yield "c";
                }
                const result = Arr.last(gen(), (v) => v === "b");
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns TValue | TDefault | null for generator with default", () => {
                function* gen(): Generator<number> {
                    yield 1;
                }
                const result = Arr.last(gen(), null, "fallback");
                expectTypeOf(result).toEqualTypeOf<
                    number | string | null
                >();
            });

            it("returns TValue | TDefault | null for generator with callback and default", () => {
                function* gen(): Generator<number> {
                    yield 1;
                    yield 2;
                    yield 3;
                }
                const result = Arr.last(
                    gen(),
                    (v) => v > 5,
                    "fallback",
                );
                expectTypeOf(result).toEqualTypeOf<
                    number | string | null
                >();
            });

            it("returns TValue | TDefault | null for generator with callback and lazy default", () => {
                function* gen(): Generator<number> {
                    yield 1;
                    yield 2;
                    yield 3;
                }
                const result = Arr.last(
                    gen(),
                    (v) => v > 5,
                    () => "lazy",
                );
                expectTypeOf(result).toEqualTypeOf<
                    number | string | null
                >();
            });

            it("returns TValue | null for IterableIterator", () => {
                const iter: IterableIterator<number> = [1, 2, 3][
                    Symbol.iterator
                ]();
                const result = Arr.last(iter);
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });

            it("infers callback value type for generator", () => {
                function* gen(): Generator<string> {
                    yield "x";
                    yield "y";
                }
                Arr.last(gen(), (value) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    return value === "y";
                });
            });
        });

        describe("unknown fallback overload", () => {
            it("returns TValue | null for null input", () => {
                const result = Arr.last(null);
                expectTypeOf(result).toEqualTypeOf<unknown | null>();
            });

            it("returns TValue | TDefault | null for null input with default", () => {
                const result = Arr.last(null, null, "fallback");
                expectTypeOf(result).toEqualTypeOf<
                    unknown | string | null
                >();
            });
        });

        describe("object arrays", () => {
            it("infers object type for array of objects", () => {
                interface User {
                    id: number;
                    name: string;
                    active: boolean;
                }
                const users: User[] = [
                    { id: 1, name: "Alice", active: true },
                    { id: 2, name: "Bob", active: false },
                ];
                const result = Arr.last(users);
                expectTypeOf(result).toEqualTypeOf<User | null>();
            });

            it("infers object type in callback", () => {
                interface User {
                    id: number;
                    name: string;
                    active: boolean;
                }
                const users: User[] = [
                    { id: 1, name: "Alice", active: true },
                    { id: 2, name: "Bob", active: false },
                ];
                const result = Arr.last(users, (user) => {
                    expectTypeOf(user).toEqualTypeOf<User>();
                    return user.active;
                });
                expectTypeOf(result).toEqualTypeOf<User | null>();
            });

            it("returns object or default", () => {
                interface Config {
                    key: string;
                    value: unknown;
                }
                const configs: Config[] = [];
                const result = Arr.last(
                    configs,
                    (c) => c.key === "theme",
                    { key: "theme", value: "dark" } as Config,
                );
                expectTypeOf(result).toEqualTypeOf<Config | null>();
            });

            it("infers deeply nested object in callback", () => {
                interface Order {
                    id: number;
                    items: { product: string; qty: number }[];
                    total: number;
                }
                const orders: Order[] = [
                    {
                        id: 1,
                        items: [{ product: "A", qty: 2 }],
                        total: 50,
                    },
                    {
                        id: 2,
                        items: [{ product: "B", qty: 1 }],
                        total: 30,
                    },
                ];
                const result = Arr.last(
                    orders,
                    (order) => order.total > 40,
                );
                expectTypeOf(result).toEqualTypeOf<Order | null>();
            });
        });

        describe("union type arrays", () => {
            it("returns union type | null", () => {
                const data: (string | number)[] = ["a", 1, "b", 2];
                const result = Arr.last(data);
                expectTypeOf(result).toEqualTypeOf<
                    string | number | null
                >();
            });

            it("infers union in callback parameter", () => {
                const data: (string | number)[] = ["a", 1, "b", 2];
                Arr.last(data, (value) => {
                    expectTypeOf(value).toEqualTypeOf<string | number>();
                    return typeof value === "string";
                });
            });

            it("returns nullable union with default", () => {
                const data: (string | number)[] = [];
                const result = Arr.last(data, null, false);
                expectTypeOf(result).toEqualTypeOf<
                    string | number | boolean | null
                >();
            });
        });

        describe("nullable type arrays", () => {
            it("returns (T | null) | null for nullable array", () => {
                const data: (string | null)[] = ["a", null, "b"];
                const result = Arr.last(data);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });

            it("returns (T | undefined) | null for optional array", () => {
                const data: (number | undefined)[] = [1, undefined, 3];
                const result = Arr.last(data);
                expectTypeOf(result).toEqualTypeOf<
                    number | undefined | null
                >();
            });
        });

        describe("nested arrays", () => {
            it("returns nested array type | null", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                ];
                const result = Arr.last(data);
                expectTypeOf(result).toEqualTypeOf<number[] | null>();
            });

            it("infers nested array in callback", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                ];
                const result = Arr.last(
                    data,
                    (arr) => arr.length > 1,
                );
                expectTypeOf(result).toEqualTypeOf<number[] | null>();
            });
        });

        describe("complex data structures", () => {
            it("handles array of tuples", () => {
                const data: [string, number][] = [
                    ["a", 1],
                    ["b", 2],
                ];
                const result = Arr.last(data);
                expectTypeOf(result).toEqualTypeOf<
                    [string, number] | null
                >();
            });

            it("handles array of Maps", () => {
                const data: Map<string, number>[] = [
                    new Map([["a", 1]]),
                    new Map([["b", 2]]),
                ];
                const result = Arr.last(data);
                expectTypeOf(result).toEqualTypeOf<
                    Map<string, number> | null
                >();
            });

            it("handles discriminated union with callback", () => {
                type Shape =
                    | { kind: "circle"; radius: number }
                    | { kind: "square"; side: number };
                const shapes: Shape[] = [
                    { kind: "circle", radius: 5 },
                    { kind: "square", side: 10 },
                ];
                const result = Arr.last(
                    shapes,
                    (s) => s.kind === "square",
                );
                expectTypeOf(result).toEqualTypeOf<Shape | null>();
            });

            it("handles array of Dates", () => {
                const dates: Date[] = [
                    new Date("2024-01-01"),
                    new Date("2024-06-15"),
                ];
                const result = Arr.last(dates);
                expectTypeOf(result).toEqualTypeOf<Date | null>();
            });

            it("handles array of Promises", () => {
                const promises: Promise<string>[] = [
                    Promise.resolve("a"),
                    Promise.resolve("b"),
                ];
                const result = Arr.last(promises);
                expectTypeOf(result).toEqualTypeOf<
                    Promise<string> | null
                >();
            });

            it("handles array of Records with callback", () => {
                const data: Record<string, number>[] = [
                    { a: 1 },
                    { b: 2 },
                ];
                const result = Arr.last(
                    data,
                    (obj) => obj["b"] !== undefined,
                );
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number> | null
                >();
            });

            it("handles array of Sets", () => {
                const data: Set<string>[] = [
                    new Set(["a"]),
                    new Set(["b"]),
                ];
                const result = Arr.last(data);
                expectTypeOf(result).toEqualTypeOf<Set<string> | null>();
            });

            it("handles generic type parameter arrays", () => {
                function lastOfType<T>(items: T[]): T | null {
                    return Arr.last(items);
                }
                const result = lastOfType([1, 2, 3]);
                expectTypeOf(result).toEqualTypeOf<number | null>();
            });
        });

        describe("readonly arrays", () => {
            it("accepts readonly string array via spread", () => {
                const data: readonly string[] = ["a", "b", "c"];
                const result = Arr.last([...data]);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });
        });

        describe("as const arrays", () => {
            it("infers literal union from const array", () => {
                const data = ["a", "b", "c"] as const;
                const result = Arr.last([...data]);
                expectTypeOf(result).toEqualTypeOf<
                    "a" | "b" | "c" | null
                >();
            });
        });

        describe("function signature", () => {
            it("returns type that extends unknown | null", () => {
                expectTypeOf(Arr.last).returns.toExtend<unknown | null>();
            });
        });
    });

    describe("take", () => {
        describe("basic type inference", () => {
            it("returns number[] for number array", () => {
                const result = Arr.take([1, 2, 3, 4, 5], 3);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] for string array", () => {
                const result = Arr.take(["a", "b", "c"], 2);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns boolean[] for boolean array", () => {
                const result = Arr.take([true, false, true], 1);
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });

            it("returns never[] for empty array", () => {
                const result = Arr.take([], 3);
                expectTypeOf(result).toEqualTypeOf<never[]>();
            });
        });

        describe("positive and negative limits", () => {
            it("returns same type with positive limit", () => {
                const data = [1, 2, 3, 4, 5, 6];
                const result = Arr.take(data, 3);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns same type with negative limit", () => {
                const data = [1, 2, 3, 4, 5, 6];
                const result = Arr.take(data, -3);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns same type with zero limit", () => {
                const data = [1, 2, 3, 4, 5, 6];
                const result = Arr.take(data, 0);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns same type with oversized limit", () => {
                const data = [1, 2, 3, 4, 5, 6];
                const result = Arr.take(data, 100);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns same type with oversized negative limit", () => {
                const data = [1, 2, 3, 4, 5, 6];
                const result = Arr.take(data, -100);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("null and undefined input", () => {
            it("accepts null and returns unknown[]", () => {
                const result = Arr.take(null, 3);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });

            it("accepts undefined and returns unknown[]", () => {
                const result = Arr.take(undefined, 3);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("union type arrays", () => {
            it("returns (string | number)[] for union array", () => {
                const data: (string | number)[] = ["a", 1, "b", 2];
                const result = Arr.take(data, 2);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });

            it("returns (boolean | null)[] for nullable union array", () => {
                const data: (boolean | null)[] = [true, null, false];
                const result = Arr.take(data, 2);
                expectTypeOf(result).toEqualTypeOf<(boolean | null)[]>();
            });

            it("returns (string | number | boolean)[] for triple union", () => {
                const data: (string | number | boolean)[] = [
                    "a",
                    1,
                    true,
                ];
                const result = Arr.take(data, 1);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | boolean)[]
                >();
            });
        });

        describe("object arrays", () => {
            it("returns User[] for array of objects", () => {
                interface User {
                    id: number;
                    name: string;
                    active: boolean;
                }
                const users: User[] = [
                    { id: 1, name: "Alice", active: true },
                    { id: 2, name: "Bob", active: false },
                    { id: 3, name: "Charlie", active: true },
                ];
                const result = Arr.take(users, 2);
                expectTypeOf(result).toEqualTypeOf<User[]>();
            });

            it("returns deeply nested object array type", () => {
                interface Order {
                    id: number;
                    items: { product: string; qty: number }[];
                    customer: {
                        name: string;
                        address: { city: string; zip: string };
                    };
                }
                const orders: Order[] = [
                    {
                        id: 1,
                        items: [{ product: "A", qty: 2 }],
                        customer: {
                            name: "Alice",
                            address: { city: "NYC", zip: "10001" },
                        },
                    },
                ];
                const result = Arr.take(orders, 1);
                expectTypeOf(result).toEqualTypeOf<Order[]>();
            });

            it("returns Record<string, number>[] for array of records", () => {
                const data: Record<string, number>[] = [
                    { a: 1 },
                    { b: 2 },
                    { c: 3 },
                ];
                const result = Arr.take(data, 2);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>[]
                >();
            });
        });

        describe("complex data structures", () => {
            it("returns tuple[] for array of tuples", () => {
                const data: [string, number][] = [
                    ["a", 1],
                    ["b", 2],
                    ["c", 3],
                ];
                const result = Arr.take(data, 2);
                expectTypeOf(result).toEqualTypeOf<[string, number][]>();
            });

            it("returns Map[] for array of Maps", () => {
                const data: Map<string, number>[] = [
                    new Map([["a", 1]]),
                    new Map([["b", 2]]),
                ];
                const result = Arr.take(data, 1);
                expectTypeOf(result).toEqualTypeOf<
                    Map<string, number>[]
                >();
            });

            it("returns Set[] for array of Sets", () => {
                const data: Set<string>[] = [
                    new Set(["a"]),
                    new Set(["b"]),
                ];
                const result = Arr.take(data, 1);
                expectTypeOf(result).toEqualTypeOf<Set<string>[]>();
            });

            it("returns Date[] for array of Dates", () => {
                const dates: Date[] = [
                    new Date("2024-01-01"),
                    new Date("2024-06-15"),
                    new Date("2024-12-31"),
                ];
                const result = Arr.take(dates, 2);
                expectTypeOf(result).toEqualTypeOf<Date[]>();
            });

            it("returns Promise<string>[] for array of Promises", () => {
                const promises: Promise<string>[] = [
                    Promise.resolve("a"),
                    Promise.resolve("b"),
                ];
                const result = Arr.take(promises, 1);
                expectTypeOf(result).toEqualTypeOf<Promise<string>[]>();
            });

            it("returns discriminated union array", () => {
                type Shape =
                    | { kind: "circle"; radius: number }
                    | { kind: "square"; side: number }
                    | { kind: "triangle"; base: number; height: number };
                const shapes: Shape[] = [
                    { kind: "circle", radius: 5 },
                    { kind: "square", side: 10 },
                    { kind: "triangle", base: 3, height: 4 },
                ];
                const result = Arr.take(shapes, 2);
                expectTypeOf(result).toEqualTypeOf<Shape[]>();
            });
        });

        describe("nested arrays", () => {
            it("returns number[][] for 2D array", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                    [5, 6],
                ];
                const result = Arr.take(data, 2);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("returns string[][] for 2D string array", () => {
                const data: string[][] = [
                    ["a", "b"],
                    ["c", "d"],
                ];
                const result = Arr.take(data, 1);
                expectTypeOf(result).toEqualTypeOf<string[][]>();
            });

            it("returns number[][][] for 3D array", () => {
                const data: number[][][] = [
                    [[1, 2], [3]],
                    [[4, 5], [6]],
                ];
                const result = Arr.take(data, 1);
                expectTypeOf(result).toEqualTypeOf<number[][][]>();
            });
        });

        describe("nullable element arrays", () => {
            it("returns (string | null)[] for nullable string array", () => {
                const data: (string | null)[] = ["a", null, "b"];
                const result = Arr.take(data, 2);
                expectTypeOf(result).toEqualTypeOf<(string | null)[]>();
            });

            it("returns (number | undefined)[] for optional number array", () => {
                const data: (number | undefined)[] = [1, undefined, 3];
                const result = Arr.take(data, 2);
                expectTypeOf(result).toEqualTypeOf<
                    (number | undefined)[]
                >();
            });
        });

        describe("readonly arrays", () => {
            it("accepts readonly array and returns mutable TValue[]", () => {
                const data: readonly number[] = [1, 2, 3, 4, 5];
                const result = Arr.take(data, 3);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts readonly string array", () => {
                const data: readonly string[] = ["a", "b", "c"];
                const result = Arr.take(data, 2);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("accepts readonly object array", () => {
                interface Config {
                    key: string;
                    value: unknown;
                }
                const configs: readonly Config[] = [
                    { key: "theme", value: "dark" },
                    { key: "lang", value: "en" },
                ];
                const result = Arr.take(configs, 1);
                expectTypeOf(result).toEqualTypeOf<Config[]>();
            });
        });

        describe("as const arrays", () => {
            it("infers literal union from const array", () => {
                const data = [1, 2, 3] as const;
                const result = Arr.take(data, 2);
                expectTypeOf(result).toEqualTypeOf<(1 | 2 | 3)[]>();
            });

            it("infers string literal union from const array", () => {
                const data = ["a", "b", "c"] as const;
                const result = Arr.take(data, 1);
                expectTypeOf(result).toEqualTypeOf<
                    ("a" | "b" | "c")[]
                >();
            });
        });

        describe("generic type propagation", () => {
            it("preserves generic type through wrapper function", () => {
                function takeFirst<T>(items: T[], n: number): T[] {
                    return Arr.take(items, n);
                }
                const result = takeFirst([1, 2, 3], 2);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("works with inferred generic function", () => {
                function takeTyped<T>(items: readonly T[]): T[] {
                    return Arr.take(items, 2);
                }
                const result = takeTyped(["x", "y", "z"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("function signature", () => {
            it("accepts number as limit parameter", () => {
                expectTypeOf(Arr.take).parameter(1).toEqualTypeOf<number>();
            });

            it("returns type that extends unknown[]", () => {
                expectTypeOf(Arr.take).returns.toExtend<unknown[]>();
            });
        });
    });

    describe("flatten", () => {
        describe("2D array overload (TValue[][])", () => {
            it("returns number[] for number[][]", () => {
                const result = Arr.flatten([
                    [1, 2],
                    [3, 4],
                ]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] for string[][]", () => {
                const result = Arr.flatten([
                    ["#foo", "#bar"],
                    ["#baz"],
                ]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns boolean[] for boolean[][]", () => {
                const result = Arr.flatten([
                    [true, false],
                    [true],
                ]);
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });

            it("returns (string | number)[] for (string | number)[][]", () => {
                const data: (string | number)[][] = [
                    ["a", 1],
                    ["b", 2],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });
        });

        describe("1D array overload (TValue[])", () => {
            it("returns string[] for flat string array", () => {
                const data = ["#foo", "#bar", "#baz"];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns number[] for flat number array", () => {
                const data = [1, 2, 3];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns (string | null)[] for nullable string array", () => {
                const data: (string | null)[] = ["a", null, "b"];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<(string | null)[]>();
            });
        });

        describe("unknown fallback overload", () => {
            it("returns unknown[] for null input", () => {
                const result = Arr.flatten(null);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });

            it("returns unknown[] for undefined input", () => {
                const result = Arr.flatten(undefined);
                expectTypeOf(result).toEqualTypeOf<unknown[]>();
            });
        });

        describe("depth parameter", () => {
            it("accepts optional depth for 2D array", () => {
                const result = Arr.flatten(
                    [
                        [1, 2],
                        [3, 4],
                    ],
                    1,
                );
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts optional depth for 1D array", () => {
                const result = Arr.flatten([1, 2, 3], 1);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts Infinity as depth", () => {
                const result = Arr.flatten(
                    [
                        ["a", "b"],
                        ["c"],
                    ],
                    Infinity,
                );
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("object arrays", () => {
            it("returns object type[] for array of objects", () => {
                interface User {
                    id: number;
                    name: string;
                }
                const data: User[][] = [
                    [
                        { id: 1, name: "Alice" },
                        { id: 2, name: "Bob" },
                    ],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<User[]>();
            });

            it("returns Record[] for array of records", () => {
                const data: Record<string, number>[][] = [
                    [{ a: 1 }, { b: 2 }],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>[]
                >();
            });

            it("returns deeply nested object types", () => {
                interface Order {
                    id: number;
                    items: { product: string; qty: number }[];
                    customer: { name: string };
                }
                const data: Order[][] = [
                    [
                        {
                            id: 1,
                            items: [{ product: "A", qty: 2 }],
                            customer: { name: "Alice" },
                        },
                    ],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<Order[]>();
            });
        });

        describe("complex data structures", () => {
            it("returns tuple[] for array of tuple arrays", () => {
                const data: [string, number][][] = [
                    [
                        ["a", 1],
                        ["b", 2],
                    ],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<[string, number][]>();
            });

            it("returns Map[] for array of Map arrays", () => {
                const data: Map<string, number>[][] = [
                    [new Map([["a", 1]])],
                    [new Map([["b", 2]])],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<
                    Map<string, number>[]
                >();
            });

            it("returns Set[] for array of Set arrays", () => {
                const data: Set<string>[][] = [
                    [new Set(["a"])],
                    [new Set(["b"])],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<Set<string>[]>();
            });

            it("returns Date[] for array of Date arrays", () => {
                const dates: Date[][] = [
                    [new Date("2024-01-01")],
                    [new Date("2024-06-15")],
                ];
                const result = Arr.flatten(dates);
                expectTypeOf(result).toEqualTypeOf<Date[]>();
            });

            it("returns Promise[] for array of Promise arrays", () => {
                const data: Promise<string>[][] = [
                    [Promise.resolve("a")],
                    [Promise.resolve("b")],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<Promise<string>[]>();
            });

            it("handles discriminated union arrays", () => {
                type Shape =
                    | { kind: "circle"; radius: number }
                    | { kind: "square"; side: number };
                const data: Shape[][] = [
                    [{ kind: "circle", radius: 5 }],
                    [{ kind: "square", side: 10 }],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<Shape[]>();
            });
        });

        describe("nested array depth behavior", () => {
            it("flattens 2D number arrays to number[]", () => {
                const data: number[][] = [
                    [1, 2],
                    [3, 4],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("flattens 2D string arrays to string[]", () => {
                const data: string[][] = [
                    ["a", "b"],
                    ["c", "d"],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("from 3D infers as inner-2D type via 2D overload", () => {
                const data: number[][][] = [
                    [[1, 2], [3]],
                    [[4, 5], [6]],
                ];
                const result = Arr.flatten(data);
                // 2D overload matches: TValue = number[], returns number[][]
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });
        });

        describe("mixed element type arrays", () => {
            it("handles nullable element 2D arrays", () => {
                const data: (string | null)[][] = [
                    ["a", null],
                    ["b"],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<(string | null)[]>();
            });

            it("handles undefined element 2D arrays", () => {
                const data: (number | undefined)[][] = [
                    [1, undefined],
                    [3],
                ];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<
                    (number | undefined)[]
                >();
            });

            it("handles union type 1D array", () => {
                const data: (string | number)[] = ["a", 1, "b", 2];
                const result = Arr.flatten(data);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });
        });

        describe("generic type propagation", () => {
            it("preserves generic type through wrapper function", () => {
                function flattenItems<T>(items: T[][]): T[] {
                    return Arr.flatten(items);
                }
                const result = flattenItems([
                    [1, 2],
                    [3, 4],
                ]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("works with inferred generic", () => {
                function flatWrapper<T>(data: T[]): T[] {
                    return Arr.flatten(data);
                }
                const result = flatWrapper(["x", "y", "z"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("function signature", () => {
            it("accepts optional depth parameter", () => {
                expectTypeOf(Arr.flatten).parameter(1).toEqualTypeOf<
                    number | undefined
                >();
            });

            it("returns type that extends unknown[]", () => {
                expectTypeOf(Arr.flatten).returns.toExtend<unknown[]>();
            });
        });
    });

    describe("flip", () => {
        describe("basic return type", () => {
            it("returns Record<string, number> for string array", () => {
                const result = Arr.flip(["a", "b", "c"]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });

            it("returns Record<string, number> for number array", () => {
                const result = Arr.flip([1, 2, 3]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });

            it("returns Record<string, number> for boolean array", () => {
                const result = Arr.flip([true, false]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });

            it("returns Record<string, number> for empty array", () => {
                const result = Arr.flip([]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });
        });

        describe("union type arrays", () => {
            it("returns Record<string, number> for string | number array", () => {
                const data: (string | number)[] = ["a", 1, "b", 2];
                const result = Arr.flip(data);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });

            it("returns Record<string, number> for nullable array", () => {
                const data: (string | null)[] = ["a", null, "b"];
                const result = Arr.flip(data);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });
        });

        describe("object arrays", () => {
            it("returns Record<string, number> for object array", () => {
                interface User {
                    id: number;
                    name: string;
                }
                const users: User[] = [
                    { id: 1, name: "Alice" },
                    { id: 2, name: "Bob" },
                ];
                const result = Arr.flip(users);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });

            it("returns Record<string, number> for Record array", () => {
                const data: Record<string, number>[] = [
                    { a: 1 },
                    { b: 2 },
                ];
                const result = Arr.flip(data);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });
        });

        describe("complex data structures", () => {
            it("returns Record<string, number> for tuple array", () => {
                const data: [string, number][] = [
                    ["a", 1],
                    ["b", 2],
                ];
                const result = Arr.flip(data);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });

            it("returns Record<string, number> for discriminated union array", () => {
                type Shape =
                    | { kind: "circle"; radius: number }
                    | { kind: "square"; side: number };
                const shapes: Shape[] = [
                    { kind: "circle", radius: 5 },
                    { kind: "square", side: 10 },
                ];
                const result = Arr.flip(shapes);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });

            it("returns Record<string, number> for Date array", () => {
                const dates: Date[] = [new Date(), new Date()];
                const result = Arr.flip(dates);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });
        });

        describe("unknown and non-array input", () => {
            it("returns Record<string, number> for non-array object", () => {
                const result = Arr.flip({
                    apple: 0,
                    banana: 1,
                    cherry: 2,
                });
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });

            it("returns Record<string, number> for null", () => {
                const result = Arr.flip(null);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });

            it("returns Record<string, number> for undefined", () => {
                const result = Arr.flip(undefined);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });
        });

        describe("readonly and as const arrays", () => {
            it("accepts readonly array", () => {
                const data: readonly string[] = ["a", "b", "c"];
                const result = Arr.flip(data);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });

            it("accepts as const array", () => {
                const data = ["a", "b", "c"] as const;
                const result = Arr.flip(data);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });
        });

        describe("generic type propagation", () => {
            it("preserves return type through wrapper function", () => {
                function flipItems<T>(items: T[]): Record<string, number> {
                    return Arr.flip(items);
                }
                const result = flipItems(["x", "y", "z"]);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>
                >();
            });
        });

        describe("function signature", () => {
            it("returns Record<string, number>", () => {
                expectTypeOf(Arr.flip).returns.toEqualTypeOf<
                    Record<string, number>
                >();
            });
        });
    });

    describe("float", () => {
        describe("basic return type", () => {
            it("returns number from a number array with numeric key", () => {
                const result = Arr.float([1.5, 2.3], 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from a number array with second index", () => {
                const result = Arr.float([1.1, 2.2, 3.3], 2);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from an integer array with numeric key", () => {
                const result = Arr.float([42, 100, 0], 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from a mixed-type array with numeric key", () => {
                const result = Arr.float([1, "hello", true, null], 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from a string array (would throw at runtime)", () => {
                const result = Arr.float(["1.5", "2.3"], 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from a boolean array (would throw at runtime)", () => {
                const result = Arr.float([true, false], 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });
        });

        describe("dot notation paths", () => {
            it("returns number with dot notation string key into nested object", () => {
                const result = Arr.float([{ price: 19.99 }], "0.price");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with deeply nested dot notation path", () => {
                const result = Arr.float(
                    [
                        {
                            order: {
                                items: {
                                    shipping: { cost: 5.99 },
                                },
                            },
                        },
                    ],
                    "0.order.items.shipping.cost",
                );
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with multi-level dot path into array of complex objects", () => {
                const data = [
                    {
                        config: {
                            pricing: {
                                baseRate: 29.99,
                                discount: 0.15,
                            },
                        },
                    },
                ];
                const result = Arr.float(data, "0.config.pricing.baseRate");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with string key on flat object array", () => {
                const result = Arr.float(
                    [{ weight: 1.5, height: 2.3 }],
                    "0.weight",
                );
                expectTypeOf(result).toEqualTypeOf<number>();
            });
        });

        describe("default value variations", () => {
            it("returns number with number default value", () => {
                const result = Arr.float([1, 2, 3], 10, 0.0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with integer default value", () => {
                const result = Arr.float([1.5, 2.5], 99, 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with null default value", () => {
                const result = Arr.float([1.5], 5, null);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with no default value (implicit null)", () => {
                const result = Arr.float([1.5, 2.5], 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with closure default returning number", () => {
                const result = Arr.float([1.5], 5, () => 0.0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with closure default returning null", () => {
                const result = Arr.float([1.5], 5, () => null);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with string default (would throw at runtime)", () => {
                const result = Arr.float([1.5], 5, "fallback");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with boolean default (would throw at runtime)", () => {
                const result = Arr.float([1.5], 5, true);
                expectTypeOf(result).toEqualTypeOf<number>();
            });
        });

        describe("PathKey variations", () => {
            it("returns number with number key", () => {
                const result = Arr.float([1.5, 2.5], 1);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with string key", () => {
                const result = Arr.float([{ price: 19.99 }], "0.price");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with null key", () => {
                const result = Arr.float([1.5], null);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with undefined key", () => {
                const result = Arr.float([1.5], undefined);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with non-literal number key", () => {
                const key: number = 0;
                const result = Arr.float([1.5, 2.5], key);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with non-literal string key", () => {
                const key: string = "0.price";
                const result = Arr.float([{ price: 19.99 }], key);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number with key from variable typed as PathKey", () => {
                const key: number | string | null | undefined = "0.price";
                const result = Arr.float([{ price: 19.99 }], key);
                expectTypeOf(result).toEqualTypeOf<number>();
            });
        });

        describe("complex data structures", () => {
            it("returns number from array of objects with mixed value types", () => {
                const data = [
                    { id: 1, name: "Alice", active: true, score: 95.5 },
                    { id: 2, name: "Bob", active: false, score: 82.0 },
                ];
                const result = Arr.float(data, "0.score");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from heterogeneous tuple", () => {
                const data = [
                    42.5,
                    "hello",
                    true,
                    null,
                    { nested: 99.9 },
                ] as const;
                const result = Arr.float(data, 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from array with nested arrays and objects", () => {
                const data = [
                    {
                        products: [
                            {
                                details: {
                                    price: 49.99,
                                    tax: 4.5,
                                    shipping: {
                                        domestic: 5.99,
                                        international: 19.99,
                                    },
                                },
                            },
                        ],
                    },
                ];
                const result = Arr.float(
                    data,
                    "0.products.0.details.shipping.domestic",
                );
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from array with optional properties", () => {
                const data: { price?: number; label: string }[] = [
                    { price: 9.99, label: "test" },
                ];
                const result = Arr.float(data, "0.price");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from array with union-typed elements", () => {
                const data: (string | number | boolean)[] = [42.5, "hello", true];
                const result = Arr.float(data, 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from readonly array", () => {
                const data: readonly number[] = [1.1, 2.2, 3.3];
                const result = Arr.float(data, 1);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from deeply nested readonly structure", () => {
                const data = [
                    {
                        level1: {
                            level2: {
                                level3: {
                                    level4: {
                                        amount: 123.456,
                                    },
                                },
                            },
                        },
                    },
                ] as const;
                const result = Arr.float(
                    data,
                    "0.level1.level2.level3.level4.amount",
                );
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from array with numeric string keys in objects", () => {
                const data = [{ 0: 1.1, 1: 2.2, name: "test" }];
                const result = Arr.float(data, "0.0");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from empty array with default", () => {
                const data: number[] = [];
                const result = Arr.float(data, 0, 0.0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from array of arrays accessed by dot path", () => {
                const data = [[10.5, 20.3], [30.1, 40.7]];
                const result = Arr.float(data, "0.1");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from array with Map-like nested records", () => {
                const data: { rates: Record<string, number> }[] = [
                    { rates: { usd: 1.0, eur: 0.85, gbp: 0.73 } },
                ];
                const result = Arr.float(data, "0.rates.usd");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from array with multiple nesting levels of arrays", () => {
                const data = [
                    {
                        matrix: [
                            [1.1, 2.2],
                            [3.3, 4.4],
                        ],
                    },
                ];
                const result = Arr.float(data, "0.matrix.0.0");
                expectTypeOf(result).toEqualTypeOf<number>();
            });
        });

        describe("unknown and untyped data", () => {
            it("returns number from unknown data", () => {
                const data: unknown = [1.5, 2.5];
                const result = Arr.float(data, 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from unknown data with default", () => {
                const data: unknown = [1.5];
                const result = Arr.float(data, 5, 0.0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from unknown data with closure default", () => {
                const data: unknown = [1.5];
                const result = Arr.float(data, 5, () => 0.0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns number from any-typed data", () => {
                const data: any = [1.5];
                const result = Arr.float(data, 0);
                expectTypeOf(result).toEqualTypeOf<number>();
            });
        });

        describe("function signature", () => {
            it("accepts ArrayItems<TValue> as first parameter", () => {
                expectTypeOf(Arr.float).parameter(0).toExtend<unknown>();
            });

            it("accepts PathKey as second parameter", () => {
                expectTypeOf(Arr.float)
                    .parameter(1)
                    .toExtend<number | string | null | undefined>();
            });

            it("returns number type", () => {
                expectTypeOf(Arr.float).returns.toEqualTypeOf<number>();
            });
        });
    });

    describe("forget", () => {
        describe("basic return type preserves element type", () => {
            it("returns number[] for number array", () => {
                const result = Arr.forget([1, 2, 3], [0]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] for string array", () => {
                const result = Arr.forget(["a", "b", "c"], 1);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns boolean[] for boolean array", () => {
                const result = Arr.forget([true, false, true], 0);
                expectTypeOf(result).toEqualTypeOf<boolean[]>();
            });

            it("returns bigint[] for bigint array", () => {
                const result = Arr.forget([1n, 2n, 3n], 2);
                expectTypeOf(result).toEqualTypeOf<bigint[]>();
            });

            it("returns object[] for array of objects", () => {
                const data = [
                    { id: 1, name: "Alice" },
                    { id: 2, name: "Bob" },
                ];
                const result = Arr.forget(data, 0);
                expectTypeOf(result).toEqualTypeOf<
                    { id: number; name: string }[]
                >();
            });

            it("returns union type array for mixed element types", () => {
                const data: (string | number)[] = ["hello", 42, "world"];
                const result = Arr.forget(data, 1);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });
        });

        describe("PathKeys variations", () => {
            it("accepts number key", () => {
                const result = Arr.forget([1, 2, 3], 1);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts string key", () => {
                const result = Arr.forget(["a", "b", "c"], "1");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("accepts null key", () => {
                const result = Arr.forget([1, 2, 3], null);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts undefined key", () => {
                const result = Arr.forget([1, 2, 3], undefined);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts array of number keys", () => {
                const result = Arr.forget([10, 20, 30, 40], [0, 2]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts array of string keys", () => {
                const result = Arr.forget(["a", "b", "c"], ["0", "2"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("accepts array of mixed PathKey types", () => {
                const result = Arr.forget([1, 2, 3], [0, "1", null]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("accepts non-literal number key", () => {
                const key: number = 1;
                const result = Arr.forget(["a", "b", "c"], key);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("accepts non-literal string key", () => {
                const key: string = "1.0";
                const result = Arr.forget(["a", ["b", "c"]], key);
                expectTypeOf(result).toEqualTypeOf<
                    (string | string[])[]
                >();
            });

            it("accepts key typed as full PathKeys union", () => {
                const key:
                    | number
                    | string
                    | null
                    | undefined
                    | Array<number | string | null | undefined> = 0;
                const result = Arr.forget([1, 2, 3], key);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });
        });

        describe("dot notation paths", () => {
            it("preserves type with dot notation string key for nested arrays", () => {
                const data: (string | string[])[] = [
                    "products",
                    ["desk", "chair"],
                ];
                const result = Arr.forget(data, "1.0");
                expectTypeOf(result).toEqualTypeOf<(string | string[])[]>();
            });

            it("preserves type with deeply nested dot notation path", () => {
                const data: (string | (string | number[])[])[] = [
                    "products",
                    ["desk", [100]],
                ];
                const result = Arr.forget(data, "1.1.0");
                expectTypeOf(result).toEqualTypeOf<
                    (string | (string | number[])[])[]
                >();
            });

            it("preserves type with multiple dot notation keys in array", () => {
                const data: (string | number[])[] = [
                    "prices",
                    [100, 200, 300],
                ];
                const result = Arr.forget(data, ["1.0", "1.2"]);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number[])[]
                >();
            });
        });

        describe("complex data structures", () => {
            it("returns typed array for array of complex nested objects", () => {
                const data = [
                    {
                        user: {
                            profile: {
                                name: "Alice",
                                settings: { darkMode: true, lang: "en" },
                            },
                        },
                    },
                    {
                        user: {
                            profile: {
                                name: "Bob",
                                settings: { darkMode: false, lang: "fr" },
                            },
                        },
                    },
                ];
                const result = Arr.forget(data, 0);
                expectTypeOf(result).toEqualTypeOf<
                    {
                        user: {
                            profile: {
                                name: string;
                                settings: {
                                    darkMode: boolean;
                                    lang: string;
                                };
                            };
                        };
                    }[]
                >();
            });

            it("preserves tuple-like union type for heterogeneous array", () => {
                const data: (
                    | string
                    | number
                    | boolean
                    | null
                    | { nested: number }
                )[] = [42, "hello", true, null, { nested: 99 }];
                const result = Arr.forget(data, [0, 3]);
                expectTypeOf(result).toEqualTypeOf<
                    (
                        | string
                        | number
                        | boolean
                        | null
                        | { nested: number }
                    )[]
                >();
            });

            it("preserves type for array with nested arrays and objects", () => {
                const data = [
                    {
                        products: [
                            {
                                details: {
                                    price: 49.99,
                                    tax: 4.5,
                                    shipping: {
                                        domestic: 5.99,
                                        international: 19.99,
                                    },
                                },
                            },
                        ],
                    },
                ];
                const result = Arr.forget(data, 0);
                expectTypeOf(result).toEqualTypeOf<
                    {
                        products: {
                            details: {
                                price: number;
                                tax: number;
                                shipping: {
                                    domestic: number;
                                    international: number;
                                };
                            };
                        }[];
                    }[]
                >();
            });

            it("preserves type for array with optional properties", () => {
                const data: { enabled?: boolean; label: string }[] = [
                    { enabled: true, label: "test" },
                    { label: "other" },
                ];
                const result = Arr.forget(data, 0);
                expectTypeOf(result).toEqualTypeOf<
                    { enabled?: boolean; label: string }[]
                >();
            });

            it("preserves type for array of arrays (2D array)", () => {
                const data = [
                    [1, 2, 3],
                    [4, 5, 6],
                    [7, 8, 9],
                ];
                const result = Arr.forget(data, 1);
                expectTypeOf(result).toEqualTypeOf<number[][]>();
            });

            it("preserves type for deeply nested 3D array", () => {
                const data = [
                    [
                        [1, 2],
                        [3, 4],
                    ],
                    [
                        [5, 6],
                        [7, 8],
                    ],
                ];
                const result = Arr.forget(data, 0);
                expectTypeOf(result).toEqualTypeOf<number[][][]>();
            });

            it("preserves Record value type in array of records", () => {
                const data: Record<string, number>[] = [
                    { a: 1, b: 2 },
                    { c: 3, d: 4 },
                ];
                const result = Arr.forget(data, 0);
                expectTypeOf(result).toEqualTypeOf<
                    Record<string, number>[]
                >();
            });

            it("preserves type for array with symbol-keyed objects", () => {
                const data = [{ 0: true, 1: false, name: "test" }];
                const result = Arr.forget(data, 0);
                expectTypeOf(result).toEqualTypeOf<
                    { 0: boolean; 1: boolean; name: string }[]
                >();
            });

            it("returns empty typed array from empty array", () => {
                const data: number[] = [];
                const result = Arr.forget(data, 0);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns empty typed array from empty array with array keys", () => {
                const data: string[] = [];
                const result = Arr.forget(data, ["0", "1"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("preserves type for array with deeply nested readonly-like structure", () => {
                const data: {
                    level1: {
                        level2: {
                            level3: {
                                level4: { value: number };
                            };
                        };
                    };
                }[] = [
                    {
                        level1: {
                            level2: {
                                level3: { level4: { value: 42 } },
                            },
                        },
                    },
                ];
                const result = Arr.forget(data, 0);
                expectTypeOf(result).toEqualTypeOf<
                    {
                        level1: {
                            level2: {
                                level3: {
                                    level4: { value: number };
                                };
                            };
                        };
                    }[]
                >();
            });

            it("preserves type for array with function-typed properties", () => {
                const data: { handler: () => void; name: string }[] = [
                    { handler: () => {}, name: "click" },
                    { handler: () => {}, name: "hover" },
                ];
                const result = Arr.forget(data, 1);
                expectTypeOf(result).toEqualTypeOf<
                    { handler: () => void; name: string }[]
                >();
            });

            it("preserves type for array with Date objects", () => {
                const data: { createdAt: Date; id: number }[] = [
                    { createdAt: new Date(), id: 1 },
                    { createdAt: new Date(), id: 2 },
                ];
                const result = Arr.forget(data, 0);
                expectTypeOf(result).toEqualTypeOf<
                    { createdAt: Date; id: number }[]
                >();
            });
        });

        describe("edge cases from functional tests", () => {
            it("preserves nested array union type when forgetting nested dot path", () => {
                const data: (string | (string | number[])[])[] = [
                    "products",
                    ["desk", [100]],
                ];
                const result = Arr.forget(data, "1.1.2");
                expectTypeOf(result).toEqualTypeOf<
                    (string | (string | number[])[])[]
                >();
            });

            it("preserves type when forgetting with invalid path", () => {
                const data = ["products", ["desk", [100]]];
                const result = Arr.forget(data, "foo");
                expectTypeOf(result).toEqualTypeOf<
                    (string | (string | number[])[])[]
                >();
            });

            it("preserves type when forgetting with empty string path", () => {
                const data = ["products", ["desk", [100]]];
                const result = Arr.forget(data, "");
                expectTypeOf(result).toEqualTypeOf<
                    (string | (string | number[])[])[]
                >();
            });

            it("preserves type when forgetting with out-of-bounds index", () => {
                const data = [10, 20, 30, 40];
                const result = Arr.forget(data, 99);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("preserves type when forgetting multiple indices", () => {
                const data = [10, 20, 30, 40];
                const result = Arr.forget(data, [0, 2]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("preserves type when forgetting mixed root and nested keys", () => {
                const data: (string | number[])[] = [
                    "prices",
                    [100, 200, 300],
                ];
                const result = Arr.forget(data, [0, "1.2"]);
                expectTypeOf(result).toEqualTypeOf<
                    (string | number[])[]
                >();
            });

            it("preserves type with duplicate keys in array", () => {
                const result = Arr.forget(["a", "b"], ["1", "1"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("preserves type for negative index key", () => {
                const data = ["a", "b", "c"];
                const result = Arr.forget(data, -1);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("preserves type for float index key", () => {
                const data = ["a", "b", "c"];
                const result = Arr.forget(data, 1.5);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("function signature", () => {
            it("accepts ArrayItems<TValue> as first parameter", () => {
                expectTypeOf(Arr.forget)
                    .parameter(0)
                    .toExtend<readonly unknown[]>();
            });

            it("accepts PathKeys as second parameter", () => {
                expectTypeOf(Arr.forget)
                    .parameter(1)
                    .toExtend<
                        | number
                        | string
                        | null
                        | undefined
                        | Array<
                              number | string | null | undefined
                          >
                    >();
            });

            it("returns TValue[] type", () => {
                expectTypeOf(
                    Arr.forget([1, 2, 3], 0),
                ).toEqualTypeOf<number[]>();
                expectTypeOf(
                    Arr.forget(["a", "b"], 0),
                ).toEqualTypeOf<string[]>();
            });
        });
    });

    describe("from", () => {
        it("returns TValue[] for array input", () => {
            const result = Arr.from([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("returns Record for Map input", () => {
            const result = Arr.from(new Map([["a", 1]]));
            expectTypeOf(result).toEqualTypeOf<Record<PropertyKey, number>>();
        });
    });

    describe("get", () => {
        it("returns TValue[] when key is null", () => {
            const result = Arr.get(["a", "b", "c"], null);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("returns TValue[] when key is undefined", () => {
            const result = Arr.get(["a", "b", "c"], undefined);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("returns resolved type when literal key provided without default", () => {
            const result = Arr.get(["a", "b", "c"], 1);
            expectTypeOf(result).toEqualTypeOf<string>();
        });

        it("returns resolved type when literal key and default provided", () => {
            const result = Arr.get(["a", "b", "c"], 1, 0);
            expectTypeOf(result).toEqualTypeOf<string>();
        });

        it("returns TValue | TDefault when non-literal key and default provided", () => {
            const key: number = 1;
            const result = Arr.get(["a", "b", "c"], key, 0);
            expectTypeOf(result).toEqualTypeOf<string | number>();
        });

        it("returns TValue | TDefault with callback default", () => {
            const result = Arr.get(["a", "b"], 5, () => "fallback");
            expectTypeOf(result).toEqualTypeOf<string>();
        });

        describe("Path resolution with dot notation resolves nested types", () => {
            it("resolves string property via dot path", () => {
                const result = Arr.get([{ name: "John" }], "0.name");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("resolves number property via dot path", () => {
                const result = Arr.get([{ age: 30 }], "0.age");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("resolves deeply nested property via dot path", () => {
                const data = [
                    { user: { profile: { email: "test@test.com" } } },
                ];
                const result = Arr.get(data, "0.user.profile.email");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("resolves array property via dot path", () => {
                const data = [{ tags: ["a", "b", "c"] }];
                const result = Arr.get(data, "0.tags");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("resolves nested array element via dot path", () => {
                const data = [
                    [10, 20],
                    [30, 40],
                ];
                const result = Arr.get(data, "0.1");
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("resolves complex nested object via dot path", () => {
                const data = [
                    { users: [{ name: "Alice", scores: [100, 200] }] },
                ];
                const result = Arr.get(data, "0.users");
                expectTypeOf(result).toEqualTypeOf<
                    { name: string; scores: number[] }[]
                >();

                const names = Arr.get(data, "0.users.0.name");
                expectTypeOf(names).toEqualTypeOf<string>();

                const scores = Arr.get(data, "0.users.0.scores");
                expectTypeOf(scores).toEqualTypeOf<number[]>();
            });
        });

        describe("Path resolution with default value still resolves nested types", () => {
            it("resolves nested type with default value", () => {
                const result = Arr.get([{ name: "John" }], "0.name", "unknown");
                expectTypeOf(result).toEqualTypeOf<string>();
            });

            it("resolves nested type with different default type", () => {
                const result = Arr.get([{ age: 30 }], "0.age", -1);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("resolves nested type with callback default", () => {
                const result = Arr.get(
                    [{ name: "John" }],
                    "0.name",
                    () => "fallback",
                );
                expectTypeOf(result).toEqualTypeOf<string>();
            });
        });

        describe("Non-literal keys fall back to TValue | null", () => {
            it("returns TValue | null for non-literal string key", () => {
                const key: string = "0.name";
                const result = Arr.get([{ name: "John" }], key);
                expectTypeOf(result).toEqualTypeOf<{ name: string } | null>();
            });

            it("returns TValue | null for non-literal number key", () => {
                const key: number = 0;
                const result = Arr.get(["a", "b"], key);
                expectTypeOf(result).toEqualTypeOf<string | null>();
            });
        });

        describe("Record<string, T> element type resolution", () => {
            it("resolves through Record<string, T> element", () => {
                const data: Record<string, number>[] = [{ score: 100 }];
                const result = Arr.get(data, "0.score");
                expectTypeOf(result).toEqualTypeOf<number>();
            });
        });
    });

    describe("has", () => {
        it("returns boolean", () => {
            expectTypeOf(Arr.has([1, 2, 3], 1)).toEqualTypeOf<boolean>();
            expectTypeOf(
                Arr.hasAll([1, 2, 3], [0, 1]),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Arr.hasAny([1, 2, 3], [0, 5]),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("every / some", () => {
        it("returns boolean", () => {
            expectTypeOf(
                Arr.every([1, 2, 3], (v) => v > 0),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Arr.some([1, 2, 3], (v) => v > 2),
            ).toEqualTypeOf<boolean>();
        });
    });

    describe("integer", () => {
        it("returns number", () => {
            const result = Arr.integer([1, 2, 3], 0);
            expectTypeOf(result).toEqualTypeOf<number>();
        });
    });

    describe("join", () => {
        it("returns string", () => {
            const result = Arr.join([1, 2, 3], ", ");
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("keyBy", () => {
        it("returns Record with string callback", () => {
            const data = [{ id: 1, name: "a" }];
            const result = Arr.keyBy(data, "id");
            expectTypeOf(result).toEqualTypeOf<
                Record<string, { id: number; name: string }>
            >();
        });
    });

    describe("only", () => {
        it("returns TValue[]", () => {
            const result = Arr.only(["a", "b", "c", "d"], [1, 3]);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("onlyValues", () => {
        it("returns TValue[]", () => {
            const result = Arr.onlyValues([1, 2, 3, 4, 5], [2, 4]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("select", () => {
        it("returns Record array", () => {
            const data = [{ id: 1, name: "a", age: 30 }];
            const result = Arr.select(data, ["id", "name"]);
            expectTypeOf(result).toEqualTypeOf<Record<string, unknown>[]>();
        });
    });

    describe("pluck", () => {
        it("returns unknown[] when no key", () => {
            const data = [{ name: "John" }, { name: "Jane" }];
            const result = Arr.pluck(data, "name");
            expectTypeOf(result).toEqualTypeOf<unknown[]>();
        });

        it("returns Record when key is provided", () => {
            const data = [
                { id: 1, name: "John" },
                { id: 2, name: "Jane" },
            ];
            const result = Arr.pluck(data, "name", "id");
            expectTypeOf(result).toEqualTypeOf<
                Record<string | number, unknown>
            >();
        });
    });

    describe("pop", () => {
        it("returns TValue | null without count", () => {
            const result = Arr.pop([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue[] with count", () => {
            const result = Arr.pop([1, 2, 3], 2);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("map", () => {
        it("returns mapped array type", () => {
            const result = Arr.map([1, 2, 3], (v) => String(v));
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("callback infers value and key types", () => {
            Arr.map([1, 2, 3], (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value;
            });
        });
    });

    describe("mapWithKeys", () => {
        it("returns Record when callback returns object", () => {
            const result = Arr.mapWithKeys(
                [{ id: 1, name: "John" }],
                (item) => ({ [item.id]: item.name }),
            );
            expectTypeOf(result).toExtend<
                Record<string, unknown> | Map<unknown, unknown>
            >();
        });
    });

    describe("mapSpread", () => {
        it("maps spread items", () => {
            const result = Arr.mapSpread(
                [
                    [1, "a"],
                    [2, "b"],
                ],
                (num: number, str: string) => `${num}-${str}`,
            );
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("prepend", () => {
        it("returns TValue[]", () => {
            const result = Arr.prepend([1, 2, 3], 0);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("pull", () => {
        it("returns object with value and data", () => {
            const result = Arr.pull([1, 2, 3], 1);
            expectTypeOf(result).toEqualTypeOf<{
                value: number | null;
                data: number[];
            }>();
        });
    });

    describe("query", () => {
        it("returns string", () => {
            const result = Arr.query([["key", "value"]]);
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("random", () => {
        it("returns TValue | null without count", () => {
            const result = Arr.random([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue[] with count", () => {
            const result = Arr.random([1, 2, 3], 2);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("returns Record with preserveKeys=true", () => {
            const result = Arr.random([1, 2, 3], 2, true);
            expectTypeOf(result).toEqualTypeOf<Record<number, number>>();
        });
    });

    describe("shift", () => {
        it("returns TValue | null without count", () => {
            const result = Arr.shift([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue[] with count", () => {
            const result = Arr.shift([1, 2, 3], 2);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("set", () => {
        describe("null/undefined key returns the value type (replaces entire array)", () => {
            it("returns string[] when value is string[]", () => {
                const result = Arr.set(["a", "b"], null, [
                    "price",
                    300,
                ] as string[]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns the value type for undefined key", () => {
                const result = Arr.set(["a", "b"], undefined, [
                    "price",
                    300,
                ] as (string | number)[]);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });

            it("returns number when value is number and key is null", () => {
                const result = Arr.set(["a", "b"], null, 42);
                expectTypeOf(result).toEqualTypeOf<number>();
            });

            it("returns string when value is string and key is null", () => {
                const result = Arr.set([1, 2, 3], null, "replaced");
                expectTypeOf(result).toEqualTypeOf<string>();
            });
        });

        describe("non-null key with same type preserves TValue[]", () => {
            it("returns string[] when setting string in string[]", () => {
                const result = Arr.set(["a", "b", "c"], 1, "x");
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns number[] when setting number in number[]", () => {
                const result = Arr.set([1, 2, 3], 1, 99);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] with dot-notation path and same type", () => {
                const result = Arr.set(["a", ["b", "c"]], "1.0", "x");
                expectTypeOf(result).toEqualTypeOf<(string | string[])[]>();
            });
        });

        describe("non-null key with different type returns union", () => {
            it("returns (number | string)[] when setting string in number[]", () => {
                const result = Arr.set([1, 2, 3], 1, "hAz");
                expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
            });

            it("returns (string | number)[] when setting number in string[]", () => {
                const result = Arr.set(["a", "b"], "2", 500);
                expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
            });
        });
    });

    describe("push", () => {
        it("returns TValue[]", () => {
            const result = Arr.push(["a", "b"], null, "c");
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("shuffle", () => {
        it("returns TValue[]", () => {
            const result = Arr.shuffle([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("slice", () => {
        it("returns TValue[]", () => {
            const result = Arr.slice([1, 2, 3, 4, 5], 1, 3);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("sole", () => {
        it("returns TValue", () => {
            const result = Arr.sole([42]);
            expectTypeOf(result).toEqualTypeOf<number>();
        });
    });

    describe("sort", () => {
        it("returns TValue[]", () => {
            const result = Arr.sort([3, 1, 2]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("callback infers types", () => {
            Arr.sort([3, 1, 2], (a, b) => {
                expectTypeOf(a).toEqualTypeOf<number>();
                expectTypeOf(b).toEqualTypeOf<number>();
                return a - b;
            });
        });
    });

    describe("sortDesc", () => {
        it("returns TValue[]", () => {
            const result = Arr.sortDesc([1, 3, 2]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("sortRecursive", () => {
        it("returns TValue[]", () => {
            const result = Arr.sortRecursive([3, 1, 2]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("sortRecursiveDesc", () => {
        it("returns TValue[]", () => {
            const result = Arr.sortRecursiveDesc([3, 1, 2]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("splice", () => {
        it("returns object with value and removed arrays", () => {
            const result = Arr.splice(["a", "b", "c"], 1, 1);
            expectTypeOf(result).toEqualTypeOf<{
                value: string[];
                removed: string[];
            }>();
        });
    });

    describe("string", () => {
        it("returns string", () => {
            const result = Arr.string(["hello", "world"], 0);
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("toCssClasses", () => {
        it("returns string", () => {
            const result = Arr.toCssClasses(["p-4", "font-bold"]);
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("toCssStyles", () => {
        it("returns string", () => {
            const result = Arr.toCssStyles(["color: red", "font-size: 14px"]);
            expectTypeOf(result).toEqualTypeOf<string>();
        });
    });

    describe("where", () => {
        it("returns TValue[]", () => {
            const result = Arr.where(
                [
                    { name: "a", age: 10 },
                    { name: "b", age: 20 },
                ],
                (item) => item.age > 15,
            );
            expectTypeOf(result).toEqualTypeOf<
                { name: string; age: number }[]
            >();
        });
    });

    describe("reject", () => {
        it("returns TValue[]", () => {
            const result = Arr.reject([1, 2, 3, 4], (v) => v > 2);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("callback infers value type", () => {
            Arr.reject(["a", "b", "c"], (value) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                return value === "b";
            });
        });
    });

    describe("replace", () => {
        describe("array replacer — no gaps, preserves type", () => {
            it("returns TValue[] for same-type array replacer", () => {
                const result = Arr.replace([1, 2, 3], [10, 20]);
                expectTypeOf(result).toEqualTypeOf<number[]>();
            });

            it("returns string[] for same-type string array replacer", () => {
                const result = Arr.replace(["a", "b", "c"], ["d", "e"]);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns (TValue | TReplace)[] for different-type array replacer", () => {
                const result = Arr.replace([1, 2, 3], ["a", "b"]);
                expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
            });
        });

        describe("object replacer — sparse indices can introduce undefined", () => {
            it("returns (TValue | undefined)[] for same-type object replacer", () => {
                const result = Arr.replace(["a", "b", "c"], {
                    1: "d",
                    2: "e",
                    3: "f",
                    4: "g",
                });
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });

            it("returns (TValue | TReplace | undefined)[] for different-type object replacer", () => {
                const result = Arr.replace(["a", "b"], { 5: 42 });
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | undefined)[]
                >();
            });

            it("returns (TValue | undefined)[] for sparse gap-filling case", () => {
                const result = Arr.replace(["x", "y", "z"], { 5: "end" });
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });
        });

        describe("null/undefined replacer — returns original type unchanged", () => {
            it("returns TValue[] for null replacer", () => {
                const result = Arr.replace(["a", "b"], null);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns TValue[] for undefined replacer", () => {
                const result = Arr.replace(["a", "b"], undefined);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });
    });

    describe("replaceRecursive", () => {
        describe("null/undefined replacer — returns original type unchanged", () => {
            it("returns TValue[] for null replacer", () => {
                const result = Arr.replaceRecursive(["a", "b"], null);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns TValue[] for undefined replacer", () => {
                const result = Arr.replaceRecursive(["a", "b"], undefined);
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });
        });

        describe("array replacer — may fill gaps with undefined", () => {
            it("returns (TValue | undefined)[] for same-type array replacer", () => {
                const result = Arr.replaceRecursive([1, 2, 3], [10]);
                expectTypeOf(result).toEqualTypeOf<(number | undefined)[]>();
            });

            it("returns (string | undefined)[] for same-type string array replacer", () => {
                const result = Arr.replaceRecursive(
                    ["a", "b", "c"],
                    ["z", "y"],
                );
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });

            it("returns (TValue | TReplace | undefined)[] for different-type array replacer", () => {
                const result = Arr.replaceRecursive([1, 2, 3], ["a", "b"]);
                expectTypeOf(result).toEqualTypeOf<
                    (number | string | undefined)[]
                >();
            });
        });

        describe("object replacer — sparse indices can introduce undefined", () => {
            it("returns (TValue | undefined)[] for same-type object replacer", () => {
                const result = Arr.replaceRecursive(["a", "b"], {
                    0: "x",
                    2: "z",
                });
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });

            it("returns (TValue | TReplace | undefined)[] for different-type object replacer", () => {
                const result = Arr.replaceRecursive(["a"], { 3: 42 });
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | undefined)[]
                >();
            });

            it("returns (TValue | undefined)[] for sparse gap-filling case", () => {
                const result = Arr.replaceRecursive(["a"], { 5: "f" });
                expectTypeOf(result).toEqualTypeOf<(string | undefined)[]>();
            });
        });
    });

    describe("reverse", () => {
        it("returns TValue[]", () => {
            const result = Arr.reverse([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("pad", () => {
        it("returns TValue[]", () => {
            const result = Arr.pad([1, 2], 5, 0);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("partition", () => {
        it("returns tuple of two TValue arrays", () => {
            const result = Arr.partition([1, 2, 3, 4], (v) => v > 2);
            expectTypeOf(result).toEqualTypeOf<[number[], number[]]>();
        });

        it("callback infers value type", () => {
            Arr.partition(["a", "b", "c"], (value) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                return value === "b";
            });
        });
    });

    describe("whereNotNull", () => {
        it("returns TValue[]", () => {
            const result = Arr.whereNotNull([1, null, 2, null, 3]);
            expectTypeOf(result).toEqualTypeOf<(number | null)[]>();
        });
    });

    describe("contains", () => {
        it("returns boolean", () => {
            const result = Arr.contains([1, 2, 3], 2);
            expectTypeOf(result).toEqualTypeOf<boolean>();
        });
    });

    describe("filter", () => {
        it("returns TValue[]", () => {
            const result = Arr.filter([1, 2, 3, 4], (v) => v > 2);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("callback infers value type", () => {
            Arr.filter(["a", "b", "c"], (value) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                return value === "b";
            });
        });
    });

    describe("wrap", () => {
        it("wraps null into empty array", () => {
            const result = Arr.wrap(null);
            expectTypeOf(result).toEqualTypeOf<[]>();
        });

        it("passes through arrays", () => {
            const result = Arr.wrap([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("wraps non-array value into tuple", () => {
            const result = Arr.wrap("hello");
            expectTypeOf(result).toEqualTypeOf<[string]>();
        });

        it("wraps number into tuple", () => {
            const result = Arr.wrap(42);
            expectTypeOf(result).toEqualTypeOf<[number]>();
        });
    });

    describe("keys", () => {
        it("returns number[]", () => {
            const result = Arr.keys([10, 20, 30]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("values", () => {
        it("returns TValue[]", () => {
            const result = Arr.values([10, 20, 30]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("diff", () => {
        it("returns TValue[]", () => {
            const result = Arr.diff([1, 2, 3, 4], [2, 4]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("intersect", () => {
        it("returns TValue[]", () => {
            const result = Arr.intersect([1, 2, 3], [2, 3, 4]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("intersectByKeys", () => {
        it("returns TValue[]", () => {
            const result = Arr.intersectByKeys(["a", "b", "c", "d"], [0, 2]);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("intersectAssocUsing", () => {
        it("returns TValue[]", () => {
            const result = Arr.intersectAssocUsing(
                [1, 2, 3],
                [1, 2, 3],
                (a, b) => a === b,
            );
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("callback infers key types", () => {
            Arr.intersectAssocUsing([1, 2], [3, 4], (keyA, keyB) => {
                expectTypeOf(keyA).toEqualTypeOf<number>();
                expectTypeOf(keyB).toEqualTypeOf<number>();
                return keyA === keyB;
            });
        });
    });
});
