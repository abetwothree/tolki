import * as Arr from "@tolki/arr";
import { describe, expectTypeOf, it } from "vitest";

describe("arr mapping type tests", () => {
    describe("map", () => {
        it("returns the callback return type as an array", () => {
            const result = Arr.map([1, 2, 3], (value, index) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(index).toEqualTypeOf<number>();
                return String(value);
            });
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("returns object arrays when the callback returns objects", () => {
            const result = Arr.map([1, 2], (v) => ({ value: v }));
            expectTypeOf(result).toEqualTypeOf<{ value: number }[]>();
        });

        it("infers callback params for object element arrays", () => {
            const data = [{ id: 1, name: "a" }];
            const result = Arr.map(data, (item) => {
                expectTypeOf(item).toEqualTypeOf<{
                    id: number;
                    name: string;
                }>();
                return item.name;
            });
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("infers callback params for union element arrays", () => {
            const data: (string | number)[] = ["a", 1];
            Arr.map(data, (value) => {
                expectTypeOf(value).toEqualTypeOf<string | number>();
                return value;
            });
        });

        it("returns a union array when the callback returns a union", () => {
            const result = Arr.map([1, 2], (v) => (v > 1 ? v : String(v)));
            expectTypeOf(result).toEqualTypeOf<(string | number)[]>();
        });

        it("returns nested arrays when the callback returns arrays", () => {
            const result = Arr.map([1, 2], (v) => [v, v]);
            expectTypeOf(result).toEqualTypeOf<number[][]>();
        });

        it("accepts a readonly array", () => {
            const data: readonly number[] = [1];
            expectTypeOf(Arr.map(data, (v) => v)).toEqualTypeOf<number[]>();
        });

        it("returns never[] for an empty array literal", () => {
            expectTypeOf(Arr.map([], (v) => v)).toEqualTypeOf<never[]>();
        });
    });

    describe("mapWithKeys", () => {
        it("returns a Record keyed by the callback keys", () => {
            const result = Arr.mapWithKeys(["a", "b"], (value, index) => ({
                [value]: index,
            }));
            expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
        });

        it("infers callback params", () => {
            Arr.mapWithKeys([{ id: 1, name: "John" }], (item, index) => {
                expectTypeOf(item).toEqualTypeOf<{
                    id: number;
                    name: string;
                }>();
                expectTypeOf(index).toEqualTypeOf<number>();
                return { [item.name]: item.id };
            });
        });

        it("carries the value type through to the Record", () => {
            const result = Arr.mapWithKeys([1, 2], (v) => ({
                [`k${v}`]: v * 2,
            }));
            expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
        });

        it("carries object value types through to the Record", () => {
            const data = [{ id: 1, name: "a" }];
            const result = Arr.mapWithKeys(data, (item) => ({
                [item.name]: item,
            }));
            expectTypeOf(result).toEqualTypeOf<
                Record<string, { id: number; name: string }>
            >();
        });

        it("accepts a readonly array", () => {
            const data: readonly string[] = ["a"];
            const result = Arr.mapWithKeys(data, (v, i) => ({ [v]: i }));
            expectTypeOf(result).toEqualTypeOf<Record<string, number>>();
        });
    });

    describe("mapSpread", () => {
        it("spreads a 2-tuple into two typed callback params", () => {
            const data: [number, string][] = [
                [1, "a"],
                [2, "b"],
            ];
            const result = Arr.mapSpread(data, (num, str, index) => {
                expectTypeOf(num).toEqualTypeOf<number>();
                expectTypeOf(str).toEqualTypeOf<string>();
                expectTypeOf(index).toEqualTypeOf<number>();
                return `${num}-${str}`;
            });
            expectTypeOf(result).toEqualTypeOf<string[]>();
        });

        it("spreads a 1-tuple", () => {
            const data: [number][] = [[1], [2]];
            const result = Arr.mapSpread(data, (num, index) => {
                expectTypeOf(num).toEqualTypeOf<number>();
                expectTypeOf(index).toEqualTypeOf<number>();
                return num;
            });
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("spreads a 3-tuple", () => {
            const data: [number, string, boolean][] = [[1, "a", true]];
            const result = Arr.mapSpread(data, (a, b, c) => {
                expectTypeOf(a).toEqualTypeOf<number>();
                expectTypeOf(b).toEqualTypeOf<string>();
                expectTypeOf(c).toEqualTypeOf<boolean>();
                return c;
            });
            expectTypeOf(result).toEqualTypeOf<boolean[]>();
        });

        it("spreads a 4-tuple", () => {
            const data: [number, string, boolean, null][] = [
                [1, "a", true, null],
            ];
            const result = Arr.mapSpread(data, (a, b, c, d) => {
                expectTypeOf(d).toEqualTypeOf<null>();
                return [a, b, c, d] as const;
            });
            // `readonly [number, string, boolean, null][]` (without the extra
            // parens) parses as `readonly ([number, string, boolean, null][])`
            // — a readonly *array* of mutable tuples. mapSpread's overload
            // always returns `TMapReturn[]`, a mutable array; with the
            // callback's `as const` return, TMapReturn is inferred as the
            // readonly tuple type itself, so the only type this call can ever
            // produce is a mutable array of readonly tuples — the parenthesized
            // form below. Confirmed independently with `tsc`: the two forms are
            // not assignable to each other (one lacks `push`, the other allows
            // writes into its tuple elements).
            expectTypeOf(result).toEqualTypeOf<
                (readonly [number, string, boolean, null])[]
            >();
        });

        it("spreads a 5-tuple", () => {
            const data: [1, 2, 3, 4, 5][] = [[1, 2, 3, 4, 5]];
            const result = Arr.mapSpread(
                data,
                (a, b, c, d, e) => a + b + c + d + e,
            );
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });

        it("returns the callback return type for object results", () => {
            const data: [string, number][] = [["a", 1]];
            const result = Arr.mapSpread(data, (name, age) => ({ name, age }));
            expectTypeOf(result).toEqualTypeOf<
                { name: string; age: number }[]
            >();
        });

        it("falls back to the variadic overload beyond five elements", () => {
            const data: number[][] = [[1, 2, 3, 4, 5, 6]];
            const result = Arr.mapSpread(
                data,
                (...args: unknown[]) => args.length,
            );
            expectTypeOf(result).toEqualTypeOf<number[]>();
        });
    });
});
