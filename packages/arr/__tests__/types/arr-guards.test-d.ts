import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

describe("arr key-guard type tests", () => {
    describe("has", () => {
        it("returns boolean for a numeric key", () => {
            expectTypeOf(Arr.has([1, 2, 3], 1)).toEqualTypeOf<boolean>();
        });

        it("returns boolean for a string key", () => {
            expectTypeOf(Arr.has(["a", "b"], "1")).toEqualTypeOf<boolean>();
        });

        it("returns boolean for a dot-notated key", () => {
            const data = [["a"], ["b", "c"]];
            expectTypeOf(Arr.has(data, "1.0")).toEqualTypeOf<boolean>();
        });

        it("returns boolean for an array of keys", () => {
            const data = ["foo", "bar", ["baz", "qux"]];
            expectTypeOf(Arr.has(data, ["0", "2.1"])).toEqualTypeOf<boolean>();
        });

        it("returns boolean for a null key", () => {
            expectTypeOf(Arr.has([1, 2], null)).toEqualTypeOf<boolean>();
        });

        it("returns boolean for an undefined key", () => {
            expectTypeOf(Arr.has([1, 2], undefined)).toEqualTypeOf<boolean>();
        });

        it("accepts an object element array without a cast", () => {
            const data = [{ user: { name: "Alice" } }];
            expectTypeOf(Arr.has(data, "0.user.name")).toEqualTypeOf<boolean>();
        });

        it("accepts a readonly array without a cast", () => {
            const data: readonly number[] = [1, 2, 3];
            expectTypeOf(Arr.has(data, 0)).toEqualTypeOf<boolean>();
        });

        it("accepts an as const array without a cast", () => {
            const data = [1, 2, 3] as const;
            expectTypeOf(Arr.has(data, 0)).toEqualTypeOf<boolean>();
        });

        it("accepts unknown data without a cast", () => {
            const data: unknown = [1, 2, 3];
            expectTypeOf(Arr.has(data, 0)).toEqualTypeOf<boolean>();
        });

        it("accepts a union element array without a cast", () => {
            const data: (string | number)[] = [1, "a"];
            expectTypeOf(Arr.has(data, 1)).toEqualTypeOf<boolean>();
        });

        it("accepts an empty array without a cast", () => {
            expectTypeOf(Arr.has([], 0)).toEqualTypeOf<boolean>();
        });
    });

    describe("hasAll", () => {
        it("returns boolean for an array of keys", () => {
            const data = ["foo", "bar", ["baz", "qux"]];
            expectTypeOf(
                Arr.hasAll(data, ["0", "2.1"]),
            ).toEqualTypeOf<boolean>();
        });

        it("returns boolean for a single key", () => {
            expectTypeOf(Arr.hasAll([1, 2], 0)).toEqualTypeOf<boolean>();
        });

        it("returns boolean for an empty key list", () => {
            expectTypeOf(Arr.hasAll([1, 2], [])).toEqualTypeOf<boolean>();
        });

        it("accepts nested object arrays without a cast", () => {
            const data = [{ a: { b: 1 } }, { a: { b: 2 } }];
            expectTypeOf(
                Arr.hasAll(data, ["0.a.b", "1.a.b"]),
            ).toEqualTypeOf<boolean>();
        });

        it("accepts a readonly array without a cast", () => {
            const data: readonly string[] = ["a"];
            expectTypeOf(Arr.hasAll(data, [0])).toEqualTypeOf<boolean>();
        });

        it("accepts unknown data without a cast", () => {
            const data: unknown = ["a"];
            expectTypeOf(Arr.hasAll(data, [0])).toEqualTypeOf<boolean>();
        });
    });

    describe("hasAny", () => {
        it("returns boolean for an array of keys", () => {
            const data = ["foo", "bar", ["baz", "qux"]];
            expectTypeOf(
                Arr.hasAny(data, ["0", "2.2"]),
            ).toEqualTypeOf<boolean>();
        });

        it("returns boolean for a single key", () => {
            expectTypeOf(Arr.hasAny([1, 2], 5)).toEqualTypeOf<boolean>();
        });

        it("returns boolean for a null key", () => {
            expectTypeOf(Arr.hasAny([1, 2], null)).toEqualTypeOf<boolean>();
        });

        it("accepts nested object arrays without a cast", () => {
            const data = [{ a: [1, 2] }];
            expectTypeOf(
                Arr.hasAny(data, ["0.a.0", "0.a.9"]),
            ).toEqualTypeOf<boolean>();
        });

        it("accepts an as const array without a cast", () => {
            const data = ["a", "b"] as const;
            expectTypeOf(Arr.hasAny(data, [0, 1])).toEqualTypeOf<boolean>();
        });

        it("accepts unknown data without a cast", () => {
            const data: unknown = ["a"];
            expectTypeOf(Arr.hasAny(data, [0])).toEqualTypeOf<boolean>();
        });
    });

    describe("integer", () => {
        describe("basic return type", () => {
            it("returns number for a numeric key", () => {
                expectTypeOf(
                    Arr.integer([10, 20, 30], 1),
                ).toEqualTypeOf<number>();
            });

            it("returns number for a string key", () => {
                expectTypeOf(
                    Arr.integer([10, 20], "0"),
                ).toEqualTypeOf<number>();
            });

            it("returns number for a mixed-element array", () => {
                const data: (number | string)[] = [1, "a"];
                expectTypeOf(Arr.integer(data, 0)).toEqualTypeOf<number>();
            });
        });

        describe("dot notation paths", () => {
            it("returns number for a nested object path", () => {
                const data = [{ count: 3 }];
                expectTypeOf(
                    Arr.integer(data, "0.count"),
                ).toEqualTypeOf<number>();
            });

            it("returns number for a deeply nested path", () => {
                const data = [{ stats: { views: 10 } }];
                expectTypeOf(
                    Arr.integer(data, "0.stats.views"),
                ).toEqualTypeOf<number>();
            });

            it("returns number for a nested array path", () => {
                const data = [
                    [1, 2],
                    [3, 4],
                ];
                expectTypeOf(Arr.integer(data, "1.0")).toEqualTypeOf<number>();
            });
        });

        describe("default value variations", () => {
            it("returns number with a numeric default", () => {
                expectTypeOf(Arr.integer([1], 5, 100)).toEqualTypeOf<number>();
            });

            it("returns number with a closure default", () => {
                expectTypeOf(
                    Arr.integer([1], 5, () => 100),
                ).toEqualTypeOf<number>();
            });

            it("returns number with a null default", () => {
                expectTypeOf(Arr.integer([1], 5, null)).toEqualTypeOf<number>();
            });
        });

        describe("PathKey variations", () => {
            it("accepts a null key", () => {
                expectTypeOf(Arr.integer([1], null, 0)).toEqualTypeOf<number>();
            });

            it("accepts an undefined key", () => {
                expectTypeOf(
                    Arr.integer([1], undefined, 0),
                ).toEqualTypeOf<number>();
            });

            it("accepts a widened string key", () => {
                const key: string = "0";
                expectTypeOf(Arr.integer([1], key)).toEqualTypeOf<number>();
            });

            it("accepts a widened number key", () => {
                const key: number = 0;
                expectTypeOf(Arr.integer([1], key)).toEqualTypeOf<number>();
            });
        });

        describe("complex and untyped data", () => {
            it("accepts a readonly array", () => {
                const data: readonly number[] = [1, 2];
                expectTypeOf(Arr.integer(data, 0)).toEqualTypeOf<number>();
            });

            it("accepts an as const array", () => {
                const data = [1, 2] as const;
                expectTypeOf(Arr.integer(data, 0)).toEqualTypeOf<number>();
            });

            it("accepts unknown data", () => {
                const data: unknown = [1];
                expectTypeOf(Arr.integer(data, 0)).toEqualTypeOf<number>();
            });

            it("accepts an empty array", () => {
                expectTypeOf(Arr.integer([], 0, 7)).toEqualTypeOf<number>();
            });
        });

        describe("function signature", () => {
            it("returns number regardless of parameter arity", () => {
                expectTypeOf(Arr.integer).returns.toEqualTypeOf<number>();
            });
        });
    });

    describe("string", () => {
        describe("basic return type", () => {
            it("returns string for a numeric key", () => {
                expectTypeOf(Arr.string(["a", "b"], 0)).toEqualTypeOf<string>();
            });

            it("returns string for a string key", () => {
                expectTypeOf(
                    Arr.string(["a", "b"], "1"),
                ).toEqualTypeOf<string>();
            });

            it("returns string for a mixed-element array", () => {
                const data: (string | number)[] = ["a", 1];
                expectTypeOf(Arr.string(data, 0)).toEqualTypeOf<string>();
            });
        });

        describe("dot notation paths", () => {
            it("returns string for a nested object path", () => {
                const data = [{ name: "John" }];
                expectTypeOf(
                    Arr.string(data, "0.name"),
                ).toEqualTypeOf<string>();
            });

            it("returns string for a deeply nested path", () => {
                const data = [{ user: { profile: { name: "Alice" } } }];
                expectTypeOf(
                    Arr.string(data, "0.user.profile.name"),
                ).toEqualTypeOf<string>();
            });

            it("returns string for a nested array path", () => {
                const data = [["a", "b"], ["c"]];
                expectTypeOf(Arr.string(data, "0.1")).toEqualTypeOf<string>();
            });
        });

        describe("default value variations", () => {
            it("returns string with a string default", () => {
                expectTypeOf(Arr.string(["a"], 5, "x")).toEqualTypeOf<string>();
            });

            it("returns string with a closure default", () => {
                expectTypeOf(
                    Arr.string(["a"], 5, () => "x"),
                ).toEqualTypeOf<string>();
            });

            it("returns string with a null default", () => {
                expectTypeOf(
                    Arr.string(["a"], 5, null),
                ).toEqualTypeOf<string>();
            });
        });

        describe("PathKey variations", () => {
            it("accepts a null key", () => {
                expectTypeOf(
                    Arr.string(["a"], null, "x"),
                ).toEqualTypeOf<string>();
            });

            it("accepts an undefined key", () => {
                expectTypeOf(
                    Arr.string(["a"], undefined, "x"),
                ).toEqualTypeOf<string>();
            });

            it("accepts a widened string key", () => {
                const key: string = "0";
                expectTypeOf(Arr.string(["a"], key)).toEqualTypeOf<string>();
            });
        });

        describe("complex and untyped data", () => {
            it("accepts a readonly array", () => {
                const data: readonly string[] = ["a"];
                expectTypeOf(Arr.string(data, 0)).toEqualTypeOf<string>();
            });

            it("accepts an as const array", () => {
                const data = ["a", "b"] as const;
                expectTypeOf(Arr.string(data, 0)).toEqualTypeOf<string>();
            });

            it("accepts unknown data", () => {
                const data: unknown = ["a"];
                expectTypeOf(Arr.string(data, 0)).toEqualTypeOf<string>();
            });
        });

        describe("function signature", () => {
            it("returns string regardless of parameter arity", () => {
                expectTypeOf(Arr.string).returns.toEqualTypeOf<string>();
            });
        });
    });

    describe("join", () => {
        describe("basic return type", () => {
            it("returns string for a string array", () => {
                expectTypeOf(
                    Arr.join(["a", "b"], ", "),
                ).toEqualTypeOf<string>();
            });

            it("returns string for a number array", () => {
                expectTypeOf(Arr.join([1, 2, 3], "-")).toEqualTypeOf<string>();
            });

            it("returns string with a final glue", () => {
                expectTypeOf(
                    Arr.join(["a", "b", "c"], ", ", " and "),
                ).toEqualTypeOf<string>();
            });

            it("returns string for an empty array", () => {
                expectTypeOf(Arr.join([], ", ")).toEqualTypeOf<string>();
            });
        });

        describe("input variations", () => {
            it("accepts an object element array", () => {
                const data = [{ toString: () => "x" }];
                expectTypeOf(Arr.join(data, ", ")).toEqualTypeOf<string>();
            });

            it("accepts a union element array", () => {
                const data: (string | number)[] = ["a", 1];
                expectTypeOf(Arr.join(data, ", ")).toEqualTypeOf<string>();
            });

            it("accepts a readonly array", () => {
                const data: readonly string[] = ["a"];
                expectTypeOf(Arr.join(data, ", ")).toEqualTypeOf<string>();
            });

            it("accepts an as const array", () => {
                const data = ["a", "b"] as const;
                expectTypeOf(Arr.join(data, ", ")).toEqualTypeOf<string>();
            });

            it("accepts unknown data", () => {
                const data: unknown = ["a"];
                expectTypeOf(Arr.join(data, ", ")).toEqualTypeOf<string>();
            });

            it("accepts a nullable element array", () => {
                const data: (string | null)[] = ["a", null];
                expectTypeOf(Arr.join(data, ", ")).toEqualTypeOf<string>();
            });
        });

        describe("function signature", () => {
            it("returns string regardless of parameter arity", () => {
                expectTypeOf(Arr.join).returns.toEqualTypeOf<string>();
            });
        });
    });
});
