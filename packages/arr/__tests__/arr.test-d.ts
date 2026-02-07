import * as Arr from "@tolki/arr";
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
            it("rejects const array input (readonly not assignable to mutable)", () => {
                const data = [1, 2, 3] as const;
                // @ts-expect-error readonly tuple is not assignable to mutable ArrayItems
                Arr.add(data, 3, 4);
            });

            it("rejects readonly array input (readonly not assignable to mutable)", () => {
                const data: readonly string[] = ["a", "b"];
                // @ts-expect-error readonly array is not assignable to mutable ArrayItems
                Arr.add(data, 2, "c");
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
                expectTypeOf(Arr.add).parameter(0).toExtend<unknown[]>();
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
        it("returns boolean", () => {
            const result = Arr.boolean([true, false], 0);
            expectTypeOf(result).toEqualTypeOf<boolean>();
        });
    });

    describe("chunk", () => {
        it("returns nested arrays of the same type", () => {
            const result = Arr.chunk([1, 2, 3, 4], 2);
            expectTypeOf(result).toEqualTypeOf<number[][]>();
        });
    });

    describe("collapse", () => {
        it("flattens one level of nesting", () => {
            const result = Arr.collapse([
                [1, 2],
                [3, 4],
            ]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("combine", () => {
        it("returns combined tuple arrays", () => {
            const result = Arr.combine([1, 2], [3, 4]);
            expectTypeOf(result).toEqualTypeOf<(number | undefined)[][]>();
        });
    });

    describe("crossJoin", () => {
        it("returns arrays of tuples", () => {
            const result = Arr.crossJoin([
                [1, 2],
                ["a", "b"],
            ]);
            expectTypeOf(result).toExtend<unknown[][]>();
        });
    });

    describe("divide", () => {
        it("returns tuple of keys and values for typed array", () => {
            const result = Arr.divide([10, 20, 30]);
            expectTypeOf(result).toEqualTypeOf<[number[], number[]]>();
        });

        it("returns tuple for empty array", () => {
            const result = Arr.divide([]);
            expectTypeOf(result).toEqualTypeOf<[number[], unknown[]]>();
        });
    });

    describe("dot", () => {
        it("returns a record with string keys", () => {
            const result = Arr.dot([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
        });
    });

    describe("undot", () => {
        it("returns TValue array", () => {
            const result = Arr.undot({ "0": "a", "1": "b" });
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("union", () => {
        it("returns union of array types", () => {
            const result = Arr.union([1, 2], [3, 4]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("unshift", () => {
        it("returns array with new value type", () => {
            const result = Arr.unshift([1, 2], "a");
            expectTypeOf(result).toEqualTypeOf<(number | string)[]>();
        });
    });

    describe("except", () => {
        it("returns TValue[]", () => {
            const result = Arr.except(["a", "b", "c"], [0, 2]);
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });
    });

    describe("exceptValues", () => {
        it("returns TValue[]", () => {
            const result = Arr.exceptValues([1, 2, 3], [2]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("exists", () => {
        it("returns boolean", () => {
            const result = Arr.exists([1, 2, 3], 1);
            expectTypeOf(result).toEqualTypeOf<boolean>();
        });
    });

    describe("first", () => {
        it("returns TValue or null for array without callback", () => {
            const result = Arr.first([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue or null with callback", () => {
            const result = Arr.first([1, 2, 3], (v) => v > 1);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue or TDefault with default", () => {
            const result = Arr.first([1, 2, 3], null, "default");
            expectTypeOf(result).toExtend<number | string | null>();
        });
    });

    describe("last", () => {
        it("returns TValue or null for array without callback", () => {
            const result = Arr.last([1, 2, 3]);
            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("returns TValue or TDefault with default", () => {
            const result = Arr.last([1, 2, 3], null, "default");
            expectTypeOf(result).toExtend<number | string | null>();
        });
    });

    describe("take", () => {
        it("returns TValue[]", () => {
            const result = Arr.take([1, 2, 3, 4, 5], 3);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("flatten", () => {
        it("returns flattened array", () => {
            const result = Arr.flatten([
                [1, 2],
                [3, 4],
            ]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("flip", () => {
        it("returns Record<string, number>", () => {
            const result = Arr.flip(["a", "b", "c"]);
            expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
        });
    });

    describe("float", () => {
        it("returns number", () => {
            const result = Arr.float([1.5, 2.5], 0);
            expectTypeOf(result).toEqualTypeOf<number>();
        });
    });

    describe("forget", () => {
        it("returns TValue[]", () => {
            const result = Arr.forget([1, 2, 3], [0]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
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

        it("returns TValue | TDefault when key and default provided", () => {
            const result = Arr.get(["a", "b", "c"], 1, 0);
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
        it("returns TValue[]", () => {
            const result = Arr.set(["a", "b", "c"], 1, "x");
            expectTypeOf(result).toEqualTypeOf<string[]>();
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
        it("returns TValue[]", () => {
            const result = Arr.replace([1, 2, 3], [10, 20]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });

    describe("replaceRecursive", () => {
        it("returns TValue[]", () => {
            const result = Arr.replaceRecursive([1, 2, 3], [10]);
            expectTypeOf(result).toEqualTypeOf<number[]>();
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
