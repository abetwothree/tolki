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
                expectTypeOf(Arr.boolean).parameter(0).toMatchTypeOf<unknown>();
            });

            it("accepts PathKey as second parameter", () => {
                expectTypeOf(Arr.boolean)
                    .parameter(1)
                    .toMatchTypeOf<number | string | null | undefined>();
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
                    [unknown[], number]
                >();
            });

            it("first parameter accepts arrays", () => {
                expectTypeOf(Arr.chunk).parameter(0).toExtend<unknown[]>();
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
                expectTypeOf(Arr.collapse).parameter(0).toExtend<unknown[]>();
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
                expectTypeOf(Arr.combine).parameters.toExtend<unknown[][]>();
            });

            it("return type extends unknown[][]", () => {
                expectTypeOf(Arr.combine).returns.toExtend<unknown[][]>();
            });
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
                const result = Arr.set(
                    ["a", "b"],
                    null,
                    ["price", 300] as string[],
                );
                expectTypeOf(result).toEqualTypeOf<string[]>();
            });

            it("returns the value type for undefined key", () => {
                const result = Arr.set(
                    ["a", "b"],
                    undefined,
                    ["price", 300] as (string | number)[],
                );
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
                expectTypeOf(result).toEqualTypeOf<
                    (string | undefined)[]
                >();
            });

            it("returns (TValue | TReplace | undefined)[] for different-type object replacer", () => {
                const result = Arr.replace(["a", "b"], { 5: 42 });
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | undefined)[]
                >();
            });

            it("returns (TValue | undefined)[] for sparse gap-filling case", () => {
                const result = Arr.replace(["x", "y", "z"], { 5: "end" });
                expectTypeOf(result).toEqualTypeOf<
                    (string | undefined)[]
                >();
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
                expectTypeOf(result).toEqualTypeOf<
                    (string | undefined)[]
                >();
            });

            it("returns (TValue | TReplace | undefined)[] for different-type object replacer", () => {
                const result = Arr.replaceRecursive(["a"], { 3: 42 });
                expectTypeOf(result).toEqualTypeOf<
                    (string | number | undefined)[]
                >();
            });

            it("returns (TValue | undefined)[] for sparse gap-filling case", () => {
                const result = Arr.replaceRecursive(["a"], { 5: "f" });
                expectTypeOf(result).toEqualTypeOf<
                    (string | undefined)[]
                >();
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
