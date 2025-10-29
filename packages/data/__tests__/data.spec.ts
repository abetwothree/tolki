import * as Data from "@laravel-js/data";
import { assertType, describe, expect, it } from "vitest";

describe("Data", () => {
    describe("dataAdd", () => {
        it("is object", () => {
            const result = Data.dataAdd({ a: 1 }, "b", 2);
            expect(result).toEqual({ a: 1, b: 2 });

            assertType<Record<string, {a: number;}>>(result);
        });

        it("is array", () => {
            const result = Data.dataAdd([1, 2], 2, 3);
            expect(result).toEqual([1, 2, 3]);

            assertType<number[]>(result);
        });
    });

    describe("dataItem", () => {
        it("is object", () => {
            const result = Data.dataItem({ a: { f: 3 }, b: { g: 4 } }, "b");
            expect(result).toEqual({g: 4});

            assertType<Record<string, {a: {f: number;};b: {g: number;}}>>(result);
            
            expect(
                Data.dataItem({ a: { f: 3 }, b: { g: 4 } }, "x", {
                    error: "not found",
                }),
            ).toEqual({ error: "not found" });
        });

        it("is array", () => {
            const result = Data.dataItem(
                    [
                        [1, 2],
                        [2, 3],
                    ],
                    1,
                );
            expect(result).toEqual([2, 3]);

            expect(
                Data.dataItem(
                    [
                        [1, 2],
                        [2, 3],
                    ],
                    3,
                    ["not found"],
                ),
            ).toEqual(["not found"]);
        });
    });

    it("dataBoolean", () => {
        expect(Data.dataBoolean([true, false], 0, false)).toBe(true);
        expect(Data.dataBoolean({ active: true }, "active", false)).toBe(true);
        expect(Data.dataBoolean({ active: false }, "missing", true)).toBe(true);
    });

    describe("dataChunk", () => {
        it("is object", () => {
            const result = Data.dataChunk({ a: 1, b: 2, c: 3, d: 4, e: 5 }, 2);
            expect(result).toEqual({
                0: { a: 1, b: 2 },
                1: { c: 3, d: 4 },
                2: { e: 5 },
            });

            assertType<
                Record<
                    number,
                    Record<
                        number,
                        {
                            a: number;
                            b: number;
                            c: number;
                            d: number;
                            e: number;
                        }
                    >
                >
            >(result);

            const result1 = Data.dataChunk(
                { a: 1, b: 2, c: 3, d: 4, e: 5 },
                2,
                true,
            );
            expect(result1).toEqual({
                0: { a: 1, b: 2 },
                1: { c: 3, d: 4 },
                2: { e: 5 },
            });

            const result2 = Data.dataChunk(
                { a: 1, b: 2, c: 3, d: 4, e: 5 },
                2,
                false,
            );
            expect(result2).toEqual({
                0: { 0: 1, 1: 2 },
                1: { 0: 3, 1: 4 },
                2: { 0: 5 },
            });
        });

        it("is array", () => {
            const result = Data.dataChunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
            expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);

            assertType<number[][] | [number, number][][]>(result);

            const result2 = Data.dataChunk(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                3,
                false,
            );
            expect(result2).toEqual([
                [
                    [0, 1],
                    [1, 2],
                    [2, 3],
                ],
                [
                    [3, 4],
                    [4, 5],
                    [5, 6],
                ],
                [
                    [6, 7],
                    [7, 8],
                    [8, 9],
                ],
                [[9, 10]],
            ]);

            assertType<number[][] | [number, number][][]>(result2);
        });
    });

    describe("dataCollapse", () => {
        it("is object", () => {
            const obj = { a: { x: 1 }, b: { y: 2 }, c: { z: 3 } };
            expect(Data.dataCollapse(obj)).toEqual({ x: 1, y: 2, z: 3 });

            expect(Data.dataCollapse({ a: { x: 1 }, b: { y: 2 } })).toEqual({
                x: 1,
                y: 2,
            });
        });

        it("is array", () => {
            const data = [["foo", "bar"], ["baz"]];
            expect(Data.dataCollapse(data)).toEqual(["foo", "bar", "baz"]);

            expect(
                Data.dataCollapse([
                    [1, 2],
                    [3, 4],
                ]),
            ).toEqual([1, 2, 3, 4]);
        });
    });

    describe("dataCombine", () => {
        it("is object", () => {
            const keys = {
                1: "name",
                2: "family",
                3: () => "callback",
                4: undefined,
            };
            const values = { 0: "John", 1: "Doe", 2: 58 };
            const result = Data.dataCombine(keys, values);

            expect(result).toEqual({
                name: "John",
                family: "Doe",
                callback: 58,
            });
        });

        it("is array", () => {
            const baseData = [1, 2, 3];
            const result = Data.dataCombine(baseData, [4, 5, 6]);

            expect(result).toEqual([
                [1, 4],
                [2, 5],
                [3, 6],
            ]);
        });

        it("throws error on mismatched types", () => {
            // @ts-expect-error Testing runtime error for mismatched types
            expect(() => Data.dataCombine([1, 2, 3], { a: 1 })).toThrowError();
            // @ts-expect-error Testing runtime error for mismatched types
            expect(() => Data.dataCombine({ a: 1 }, [1, 2, 3])).toThrowError();
        });
    });

    describe("dataCount", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            expect(Data.dataCount(obj)).toBe(4);
        });

        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            expect(Data.dataCount(arr)).toBe(5);
        });
    });

    it("values", () => {
        expect(Data.dataValues([1, 2, 3])).toEqual([1, 2, 3]);
        expect(Data.dataValues({ a: 1, b: 2, c: 3 })).toEqual([1, 2, 3]);
    });

    it("keys", () => {
        expect(Data.dataKeys([1, 2, 3])).toEqual([0, 1, 2]);
        expect(Data.dataKeys({ a: 1, b: 2, c: 3 })).toEqual(["a", "b", "c"]);
    });

    it("filter", () => {
        expect(Data.dataFilter([1, 2, 3, 4], (value) => value > 2)).toEqual([
            3, 4,
        ]);
        expect(
            Data.dataFilter({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2),
        ).toEqual({ c: 3, d: 4 });
    });

    it("map", () => {
        expect(Data.dataMap([1, 2, 3], (value) => value * 2)).toEqual([
            2, 4, 6,
        ]);
        expect(
            Data.dataMap({ a: 1, b: 2, c: 3 }, (value) => value * 2),
        ).toEqual({ a: 2, b: 4, c: 6 });
    });

    it("first", () => {
        expect(Data.dataFirst([1, 2, 3])).toBe(1);
        expect(Data.dataFirst({ a: 1, b: 2, c: 3 })).toBe(1);
        expect(Data.dataFirst([1, 2, 3], (value) => value > 1)).toBe(2);
        expect(Data.dataFirst({ a: 1, b: 2, c: 3 }, (value) => value > 1)).toBe(
            2,
        );
        expect(Data.dataFirst([1, 2, 3], (value) => value > 3, 42)).toBe(42);
        expect(
            Data.dataFirst({ a: 1, b: 2, c: 3 }, (value) => value > 3, 42),
        ).toBe(42);
    });

    it("last", () => {
        expect(Data.dataLast([1, 2, 3])).toBe(3);
        expect(Data.dataLast({ a: 1, b: 2, c: 3 })).toBe(3);
        expect(Data.dataLast([1, 2, 3], (value) => value < 3)).toBe(2);
        expect(Data.dataLast({ a: 1, b: 2, c: 3 }, (value) => value < 3)).toBe(
            2,
        );
        expect(Data.dataLast([1, 2, 3], (value) => value < 1, 42)).toBe(42);
        expect(
            Data.dataLast({ a: 1, b: 2, c: 3 }, (value) => value < 1, 42),
        ).toBe(42);
    });

    it("contains", () => {
        expect(Data.dataContains([1, 2, 3], 2)).toBe(true);
        expect(Data.dataContains({ a: 1, b: 2, c: 3 }, 2)).toBe(true);
        expect(Data.dataContains([1, 2, 3], 42)).toBe(false);
        expect(Data.dataContains({ a: 1, b: 2, c: 3 }, 42)).toBe(false);
        expect(Data.dataContains([1, 2, 3], (value) => value > 2)).toBe(true);
        expect(
            Data.dataContains({ a: 1, b: 2, c: 3 }, (value) => value > 2),
        ).toBe(true);
        expect(Data.dataContains([1, 2, 3], (value) => value > 3)).toBe(false);
        expect(
            Data.dataContains({ a: 1, b: 2, c: 3 }, (value) => value > 3),
        ).toBe(false);
    });

    it("diff", () => {
        expect(Data.dataDiff([1, 2, 3], [2, 3, 4])).toEqual([1]);
        expect(
            Data.dataDiff<number, string>(
                { a: 1, b: 2, c: 3 },
                { b: 2, c: 3, d: 4 },
            ),
        ).toEqual({ a: 1 });
    });

    it("pluck", () => {
        expect(
            Data.dataPluck(
                [
                    { id: 1, name: "House" },
                    { id: 2, name: "Condo" },
                    { id: 3, name: "Apartment" },
                ],
                "name",
            ),
        ).toEqual(["House", "Condo", "Apartment"]);

        expect(
            Data.dataPluck(
                {
                    a: { id: 1, name: "House" },
                    b: { id: 2, name: "Condo" },
                    c: { id: 3, name: "Apartment" },
                },
                "name",
            ),
        ).toEqual(["House", "Condo", "Apartment"]);
    });

    it("divide", () => {
        expect(Data.dataDivide([1, 2, 3])).toEqual([
            [0, 1, 2],
            [1, 2, 3],
        ]);
        expect(Data.dataDivide({ a: 1, b: 2 })).toEqual([
            ["a", "b"],
            [1, 2],
        ]);
    });

    it("dot", () => {
        expect(Data.dataDot({ a: { b: 1, c: 2 } })).toEqual({
            "a.b": 1,
            "a.c": 2,
        });
    });

    it("except", () => {
        expect(Data.dataExcept([1, 2, 3, 4], [1, 3])).toEqual([1, 3]);
        expect(Data.dataExcept({ a: 1, b: 2, c: 3 }, ["b"])).toEqual({
            a: 1,
            c: 3,
        });
    });

    it("exists", () => {
        expect(Data.dataExists([1, 2, 3], 1)).toBe(true);
        expect(Data.dataExists({ a: 1, b: 2 }, "a")).toBe(true);
        expect(Data.dataExists([1, 2, 3], 5)).toBe(false);
        expect(Data.dataExists({ a: 1, b: 2 }, "c")).toBe(false);
    });

    it("take", () => {
        expect(Data.dataTake([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
        expect(Data.dataTake({ a: 1, b: 2, c: 3, d: 4 }, 2)).toEqual({
            a: 1,
            b: 2,
        });
    });

    it("get", () => {
        expect(Data.dataGet([1, 2, 3], 1, "default")).toBe(2);
        expect(Data.dataGet({ a: 1, b: 2 }, "c", "default")).toBe("default");
    });

    it("has", () => {
        expect(Data.dataHas([1, 2, 3], [0, 1])).toBe(true);
        expect(Data.dataHas({ a: 1, b: 2 }, ["a", "c"])).toBe(false);
    });

    it("hasAll", () => {
        expect(Data.dataHasAll([1, 2, 3], [0, 1])).toBe(true);
        expect(Data.dataHasAll({ a: 1, b: 2 }, ["a", "c"])).toBe(false);
    });

    it("hasAny", () => {
        expect(Data.dataHasAny([1, 2, 3], [0, 5])).toBe(true);
        expect(Data.dataHasAny({ a: 1, b: 2 }, ["c", "d"])).toBe(false);
    });

    it("every", () => {
        expect(Data.dataEvery([2, 4, 6], (value) => value % 2 === 0)).toBe(
            true,
        );
        expect(Data.dataEvery({ a: 2, b: 4 }, (value) => value % 2 === 0)).toBe(
            true,
        );
        expect(Data.dataEvery([1, 2, 3], (value) => value % 2 === 0)).toBe(
            false,
        );
    });

    it("some", () => {
        expect(Data.dataSome([1, 2, 3], (value) => value > 2)).toBe(true);
        expect(Data.dataSome({ a: 1, b: 2 }, (value) => value > 2)).toBe(false);
    });

    it("integer", () => {
        expect(Data.dataInteger([1, 2, 3], 0, 0)).toBe(1);
        expect(Data.dataInteger({ count: 42 }, "count", 0)).toBe(42);
        expect(Data.dataInteger({}, "missing", 5)).toBe(5);
    });

    it("join", () => {
        expect(Data.dataJoin([1, 2, 3], ", ")).toBe("1, 2, 3");
        expect(Data.dataJoin(["a", "b", "c"], ", ", " and ")).toBe(
            "a, b and c",
        );
    });

    it("keyBy", () => {
        const data = [
            { id: 1, name: "John" },
            { id: 2, name: "Jane" },
        ];
        const result = Data.dataKeyBy(data, "id");
        expect(result).toEqual({
            1: { id: 1, name: "John" },
            2: { id: 2, name: "Jane" },
        });
    });

    it("prependKeysWith", () => {
        const result = Data.dataPrependKeysWith(
            { name: "John", age: 30 },
            "user_",
        );
        expect(result).toEqual({ user_name: "John", user_age: 30 });
    });

    it("only", () => {
        expect(Data.dataOnly([1, 2, 3, 4], [0, 2])).toEqual([1, 3]);
        expect(Data.dataOnly({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({
            a: 1,
            c: 3,
        });
    });

    it("prepend", () => {
        expect(Data.dataPrepend([2, 3], 1)).toEqual([1, 2, 3]);
        expect(Data.dataPrepend({ b: 2, c: 3 }, 1, "a")).toEqual({
            a: 1,
            b: 2,
            c: 3,
        });
    });

    it("pull", () => {
        const result1 = Data.dataPull([1, 2, 3], 1, "default");
        expect(result1.value).toBe(2);
        expect(result1.data).toEqual([1, 3]);

        const result2 = Data.dataPull({ a: 1, b: 2 }, "b", "default");
        expect(result2.value).toBe(2);
        expect(result2.data).toEqual({ a: 1 });
    });

    it("query", () => {
        expect(Data.dataQuery({ name: "John", age: 30 })).toBe(
            "name=John&age=30",
        );
        expect(Data.dataQuery([1, 2, 3])).toBe("0=1&1=2&2=3");
    });

    it("set", () => {
        expect(Data.dataSet([1, 2, 3], 1, 99)).toEqual([1, 99, 3]);
        expect(Data.dataSet({ a: 1, b: 2 }, "c", 3)).toEqual({
            a: 1,
            b: 2,
            c: 3,
        });
    });

    it("shuffle", () => {
        const result = Data.dataShuffle([1, 2, 3, 4]);
        expect(result).toHaveLength(4);
        expect(result).toEqual(expect.arrayContaining([1, 2, 3, 4]));
    });

    it("string", () => {
        expect(Data.dataString(["hello", "world"], 0, "")).toBe("hello");
        expect(Data.dataString({ name: "John" }, "name", "")).toBe("John");
        expect(Data.dataString({}, "missing", "default")).toBe("default");
    });

    it("toCssClasses", () => {
        expect(Data.dataToCssClasses(["btn", "btn-primary"])).toBe(
            "btn btn-primary",
        );
        expect(
            Data.dataToCssClasses({
                btn: true,
                "btn-primary": true,
                disabled: false,
            }),
        ).toBe("btn btn-primary");
    });

    it("where", () => {
        expect(Data.dataWhere([1, 2, 3, 4], (value) => value > 2)).toEqual([
            3, 4,
        ]);
        expect(
            Data.dataWhere({ a: 1, b: 2, c: 3 }, (value) => value > 1),
        ).toEqual({ b: 2, c: 3 });
    });

    it("reject", () => {
        expect(Data.dataReject([1, 2, 3, 4], (value) => value > 2)).toEqual([
            1, 2,
        ]);
        expect(
            Data.dataReject({ a: 1, b: 2, c: 3 }, (value) => value > 1),
        ).toEqual({ a: 1 });
    });

    it("partition", () => {
        const [passing, failing] = Data.dataPartition(
            [1, 2, 3, 4],
            (value) => value > 2,
        );
        expect(passing).toEqual([3, 4]);
        expect(failing).toEqual([1, 2]);

        const [passing2, failing2] = Data.dataPartition(
            { a: 1, b: 2, c: 3 },
            (value) => value > 1,
        );
        expect(passing2).toEqual({ b: 2, c: 3 });
        expect(failing2).toEqual({ a: 1 });
    });

    it("whereNotNull", () => {
        expect(Data.dataWhereNotNull([1, null, 2, null, 3])).toEqual([1, 2, 3]);
        expect(Data.dataWhereNotNull({ a: 1, b: null, c: 2 })).toEqual({
            a: 1,
            c: 2,
        });
    });
});
