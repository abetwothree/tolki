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
            expectTypeOf(Arr.hasAll(data, ["0", "2.1"])).toEqualTypeOf<boolean>();
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
            expectTypeOf(Arr.hasAny(data, ["0", "2.2"])).toEqualTypeOf<boolean>();
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
});
