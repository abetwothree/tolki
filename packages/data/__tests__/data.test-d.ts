import * as Data from "@tolki/data";
import { describe, expectTypeOf, it } from "vitest";

describe("data type tests", () => {
    describe("three way overloads", () => {
        it("routes a Map to the keyed overload", () => {
            Data.dataEvery(new Map([["a", 1]]), (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string>();
                return value > 0;
            });
        });

        it("routes an array to the positional overload", () => {
            Data.dataSome([1, 2, 3], (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value > 2;
            });
        });

        it("routes a Set to the positional overload", () => {
            Data.dataEvery(new Set(["a", "b"]), (value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value !== "";
            });
        });

        it("routes a generator to the positional overload", () => {
            const generator = (function* (): Generator<number> {
                yield 1;
            })();

            Data.dataSome(generator, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value > 0;
            });
        });

        it("routes a plain object to the keyed overload", () => {
            Data.dataEvery({ a: 1, b: 2 }, (value: number, key: string) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string>();
                return value > 0;
            });
        });
    });

    describe("first and last return types", () => {
        it("infers the value from a Map", () => {
            const result = Data.dataFirst(new Map([["a", 1]]));

            expectTypeOf(result).toEqualTypeOf<number | null>();
        });

        it("infers the value and the default from an iterable", () => {
            const result = Data.dataLast(new Set([1, 2]), null, "fallback");

            expectTypeOf(result).toEqualTypeOf<number | string | null>();
        });
    });

    describe("dataShift", () => {
        it("returns a value, a list of values, or null", () => {
            expectTypeOf(Data.dataShift([1, 2, 3])).toEqualTypeOf<
                number | number[] | null
            >();
        });
    });

    describe("dataChunkWhile / dataChunkBy overloads", () => {
        it("routes a record to the keyed overload", () => {
            const result = Data.dataChunkWhile(
                { a: 1 },
                (value, key, chunk) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<"a">();
                    expectTypeOf(chunk).toEqualTypeOf<Record<"a", number>>();

                    return true;
                },
            );

            expectTypeOf(result).toEqualTypeOf<
                Record<number, Record<"a", number>>
            >();
            expectTypeOf(Data.dataChunkBy({ a: 1 }, "x")).toEqualTypeOf<
                Record<number, Record<"a", number>>
            >();
        });

        it("routes an array to the positional overload", () => {
            const result = Data.dataChunkWhile(
                [1, 2],
                (value, index, chunk) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(index).toEqualTypeOf<number>();
                    expectTypeOf(chunk).toEqualTypeOf<number[]>();

                    return true;
                },
            );

            expectTypeOf(result).toEqualTypeOf<number[][]>();
            expectTypeOf(
                Data.dataChunkBy([1, 2], (value, index) => value + index),
            ).toEqualTypeOf<number[][]>();
        });
    });
});
