import * as Data from "@laravel-js/data";
import { assertType, describe, expect, it } from "vitest";

describe("Data", () => {
    describe("dataAdd", () => {
        it("is object", () => {
            const result = Data.dataAdd({ a: 1 }, "b", 2);
            expect(result).toEqual({ a: 1, b: 2 });

            assertType<{ a: number; b: number; }>(result);
        });

        it("is array", () => {
            const result = Data.dataAdd([1, 2], 2, 3);
            expect(result).toEqual([1, 2, 3]);

            assertType<number[]>(result);

            const result2 = Data.dataAdd([1, "b"], 2, 3);
            expect(result2).toEqual([1, "b", 3]);

            assertType<(number | string)[]>(result2);
        });

        it("rejects readonly arrays at compile time", () => {
            const readonlyArray: readonly number[] = [1, 2, 3];
            
            // This should cause a TypeScript error because readonly arrays
            // cannot be passed to dataAdd (they cannot be mutated)
            // @ts-expect-error - readonly arrays should not be accepted
            Data.dataAdd(readonlyArray, 3, 4);
        });
    });

    describe("dataItem", () => {
        it("is object", () => {
            const result = Data.dataItem({ a: { f: 3 }, b: { g: 4 } }, "b");
            expect(result).toEqual({ g: 4 });
            assertType<{ g: number }>(result);

            const result2 = Data.dataItem({ a: { f: 3 }, b: { g: 4 } }, "c", {
                t: 4,
            });
            expect(result2).toEqual({ t: 4 });
            assertType<{ t: number }>(result2);

            const result3 = Data.dataItem(
                { a: { f: 3 }, b: { g: 4 } },
                "c",
                () => ({ x: 5 }),
            );
            expect(result3).toEqual({ x: 5 });
            assertType<{ x: number }>(result3);

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

            assertType<number[]>(result);

            // Use as const with explicit tuple type
            const tupleData = [
                [2, 3],
                ["a", "b"],
            ] as const;
            const result2 = Data.dataItem(tupleData, 1);
            expect(result2).toEqual(["a", "b"]);
            // TypeScript infers: readonly [2, 3] | readonly ["a", "b"]
            // We need to assert the specific type we expect
            assertType<readonly [2, 3] | readonly ["a", "b"]>(result2);

            // Explicit tuple type annotation
            const explicitTuple: [
                readonly [number, number],
                readonly [string, string],
            ] = [
                [2, 3],
                ["a", "b"],
            ];
            const result3 = Data.dataItem(explicitTuple, 1);
            expect(result3).toEqual(["a", "b"]);
            assertType<readonly [string, string] | readonly [number, number]>(
                result3,
            );

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

    describe("dataCrossJoin", () => {
        it("is object", () => {
            const result = Data.dataCrossJoin({ a: [1] }, { b: ["x"] });
            expect(result).toEqual([{ a: 1, b: "x" }]);
        });

        it("is array", () => {
            const result = Data.dataCrossJoin([1, 2], ["a", "b"]);
            expect(result).toEqual([
                [1, "a"],
                [1, "b"],
                [2, "a"],
                [2, "b"],
            ]);
        });
    });

    describe("dataDivide", () => {
        it("is object", () => {
            expect(Data.dataDivide({ a: 1, b: 2 })).toEqual([
                ["a", "b"],
                [1, 2],
            ]);
        });

        it("is array", () => {
            expect(Data.dataDivide([1, 2, 3])).toEqual([
                [0, 1, 2],
                [1, 2, 3],
            ]);
        });
    });

    describe("dataDot", () => {
        it("is object", () => {
            const result = Data.dataDot({ a: { b: 1, c: 2 } });
            expect(result).toEqual({
                "a.b": 1,
                "a.c": 2,
            });
        });

        it("is array", () => {
            const result = Data.dataDot(["a", ["b", ["c"]]]);
            expect(result).toEqual({
                "0": "a",
                "1.0": "b",
                "1.1.0": "c",
            });
        });
    });

    describe("dataUndot", () => {
        it("is object", () => {
            const result = Data.dataUndot({
                name: "John",
                "address.city": "NYC",
                "address.zip": "10001",
            });
            expect(result).toEqual({
                name: "John",
                address: {
                    city: "NYC",
                    zip: "10001",
                },
            });
        });

        it("is array", () => {
            const result = Data.dataUndot({ "0": "a", "1.0": "b", "1.1.0": "c" }, true);
            expect(result).toEqual([
                "a",
                ["b", ["c"]],
            ]);
        });
    });

    describe("dataExcept", () => {
        it("is object", () => {
            const result = Data.dataExcept({ name: "John", age: 30, city: "NYC" }, "age");
            expect(result).toEqual({
                name: "John",
                city: "NYC",
            });
        });

        it("is array", () => {
            const result = Data.dataExcept([1, 2, 3, 4], [1, 3]);
            expect(result).toEqual([1, 3]);
        });
    });

    describe("dataExists", () => {
        it("is object", () => {
            expect(Data.dataExists({ a: 1, b: 2 }, "a")).toBe(true);
            expect(Data.dataExists({ a: 1, b: 2 }, "c")).toBe(false);
        });

        it("is array", () => {
            expect(Data.dataExists([1, 2, 3], 1)).toBe(true);
            expect(Data.dataExists([1, 2, 3], 5)).toBe(false);
        });
    });

    describe("dataTake", () => {
        it("is object", () => {
            const result = Data.dataTake({ a: 1, b: 2, c: 3, d: 4 }, 2);
            expect(result).toEqual({
                a: 1,
                b: 2,
            });
        });

        it("is array", () => {
            const result = Data.dataTake([1, 2, 3, 4, 5], 3);
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe("dataFlatten", () => {
        it("is object", () => {
            const result = Data.dataFlatten({
                users: { john: { name: "John" }, jane: { name: "Jane" } },
                posts: { "1": { title: "Hello" } },
            }, 1);
            expect(result).toEqual({
                "users.john": { name: "John" },
                "users.jane": { name: "Jane" },
                "posts.1": { title: "Hello" },
            });
        });

        it("is array", () => {
            const result = Data.dataFlatten([["#foo", ["#bar"]], ["#baz"]]);
            expect(result).toEqual(["#foo", "#bar", "#baz"]);
        });
    });

    describe("dataFlip", () => {
        it("is object", () => {
            const result = Data.dataFlip({ a: 1, b: 2, c: 3 });
            expect(result).toEqual({ 1: "a", 2: "b", 3: "c" });
        });

        it("is array", () => {
            const result = Data.dataFlip(["apple", "banana", "cherry"]);
            expect(result).toEqual({
                apple: 0,
                banana: 1,
                cherry: 2,
            });
        });
    });

    describe("dataFloat", () => {
        it("is object", () => {
            const result = Data.dataFloat({ price: 19.99, discount: 0.1 }, "price");
            expect(result).toBe(19.99);
        });

        it("is array", () => {
            const result = Data.dataFloat([1.5, 2.3], 1);
            expect(result).toBe(2.3);
        });
    });

    describe("dataForget", () => {
        it("is object", () => {
            const result = Data.dataForget({ name: "John", age: 30, city: "NYC" }, "age");
            expect(result).toEqual({ name: "John", city: "NYC" });
        });

        it("is array", () => {
            const result = Data.dataForget(["products", ["desk", [100]]], "1.1");
            expect(result).toEqual(["products", ["desk"]]);
        });
    });

    describe("dataFrom", () => {
        it("is object", () => {
            const result = Data.dataFrom({ a: 1, b: 2, c: 3 });
            expect(result).toEqual({ a: 1, b: 2, c: 3 });
        });

        it("is array", () => {
            const result = Data.dataFrom([1, 2, 3]);
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe("dataGet", () => {
        it("is object", () => {
            const result = Data.dataGet({ a: 1, b: 2 }, "c", "default")
            expect(result).toBe("default");
        });

        it("is array", () => {
            const result = Data.dataGet([1, 2, 3], 1, "default");
            expect(result).toBe(2);
        });
    });

    describe("dataHas", () => {
        it("is object", () => {
            const result = Data.dataHas({ a: 1, b: 2 }, ["a", "c"]);
            expect(result).toBe(false);
        });

        it("is array", () => {
            const result = Data.dataHas([1, 2, 3], [0, 1]);
            expect(result).toBe(true);
        });
    });

    describe("dataHasAll", () => {
        it("is object", () => {
            const result = Data.dataHasAll({ a: 1, b: 2 }, ["a", "c"]);
            expect(result).toBe(false);
        });

        it("is array", () => {
            const result = Data.dataHasAll([1, 2, 3], [0, 1]);
            expect(result).toBe(true);
        });
    });

    describe("dataHasAny", () => {
        it("is object", () => {
            const result = Data.dataHasAny({ a: 1, b: 2 }, ["c", "d"]);
            expect(result).toBe(false);
        });

        it("is array", () => {
            const result = Data.dataHasAny([1, 2, 3], [0, 5]);
            expect(result).toBe(true);
        });
    });


    describe("dataEvery", () => {
        it("is object", () => {
            const result = Data.dataEvery({ a: 2, b: 4 }, (value) => value % 2 === 0);
            expect(result).toBe(true);
        });

        it("is array", () => {
            const result = Data.dataEvery([2, 4, 6], (value) => value % 2 === 0);
            expect(result).toBe(true);
            expect(Data.dataEvery([1, 2, 3], (value) => value % 2 === 0)).toBe(
                false,
            );
        });
    });

    describe("dataSome", () => {
        it("is object", () => {
            const result = Data.dataSome({ a: 1, b: 2 }, (value) => value > 2);
            expect(result).toBe(false);
        });

        it("is array", () => {
            const result = Data.dataSome([1, 2, 3], (value) => value > 2);
            expect(result).toBe(true);
        });
    });

    describe("dataInteger", () => {
        it("is object", () => {
            const result = Data.dataInteger({ count: 42 }, "count", 0);
            expect(result).toBe(42);
            
            expect(Data.dataInteger({}, "missing", 5)).toBe(5);
        });

        it("is array", () => {
            const result = Data.dataInteger([1, 2, 3], 0, 0);
            expect(result).toBe(1);
        });
    });

    describe("dataJoin", () => {
        it("is object", () => {
            const result = Data.dataJoin({ a: "hello", b: "world", c: "test" }, ", ",  " and ");
            expect(result).toBe("hello, world and test");

            expect(Data.dataJoin(["a", "b", "c"], ", ", " and ")).toBe(
                "a, b and c",
            );
        });

        it("is array", () => {
            const result = Data.dataJoin(["a", "b", "c"], ", ", " and ");
            expect(result).toBe("a, b and c");

            expect(Data.dataJoin([1, 2, 3], ", ")).toBe("1, 2, 3");
        });
    });

    describe("dataKeyBy", () => {
        it("is object", () => {
            const data = {
                user1: { id: 10, name: "John" },
                user2: { id: 20, name: "Jane" },
            };
            const result = Data.dataKeyBy(data, "id");
            expect(result).toEqual({
                10: { id: 10, name: "John" },
                20: { id: 20, name: "Jane" },
            });
        });

        it("is array", () => {
            const users = [
                { id: 1, name: "John" },
                { id: 2, name: "Jane" },
                { id: 3, name: "Bob" },
            ];
            const result = Data.dataKeyBy(users, "id");
            expect(result).toEqual({
                1: { id: 1, name: "John" },
                2: { id: 2, name: "Jane" },
                3: { id: 3, name: "Bob" },
            });
        });
    });

    describe("dataPrependKeysWith", () => {
        it("is object", () => {
            const result = Data.dataPrependKeysWith(
                { name: "John", age: 30 },
                "user_",
            );
            expect(result).toEqual({ user_name: "John", user_age: 30 });
        });

        it("is array", () => {
            const result = Data.dataPrependKeysWith(["a", "b", "c"], "item_");
            expect(result).toEqual({
                item_0: "a",
                item_1: "b",
                item_2: "c",
            });
        });
    });

    describe("dataOnly", () => {
        it("is object", () => {
            const result = Data.dataOnly({ a: 1, b: 2, c: 3 }, ["a", "c"]);
            expect(result).toEqual({
                a: 1,
                c: 3,
            });
        });
        it("is array", () => {
            const result = Data.dataOnly([1, 2, 3, 4], [0, 2]);
            expect(result).toEqual([1, 3]);
        });
    });

    describe("dataSelect", () => {
        it("is object", () => {
            const result = Data.dataSelect({
                user1: { name: "John", age: 30, city: "NYC" },
                user2: { name: "Jane", age: 25, city: "LA" },
            }, ["name", "city"]);
            expect(result).toEqual({
                user1: { name: "John", city: "NYC" },
                user2: { name: "Jane", city: "LA" },
            });
        });
        it("is array", () => {
            const result = Data.dataSelect([
                { a: 1, b: 2, c: 3 },
                { a: 4, b: 5, c: 6 },
            ], ["a", "b"]);
            expect(result).toEqual([
                { a: 1, b: 2 },
                { a: 4, b: 5 },
            ]);
        });
    });

    describe("dataMapWithKeys", () => {
        it("is object", () => {
            const obj = { user1: "John", user2: "Jane" };
            const result = Data.dataMapWithKeys(obj, (value, key) => ({
                [`name_${String(key)}`]: (value as string).toUpperCase(),
            }));
            expect(result).toEqual({ name_user1: "JOHN", name_user2: "JANE" });
        });
        it("is array", () => {
            const users = [
                { id: 1, name: "John" },
                { id: 2, name: "Jane" },
            ];
            const result = Data.dataMapWithKeys(users, (item) => ({
                [item.name]: item.id,
            }));
            expect(result).toEqual({
                John: 1,
                Jane: 2,
            });
        });
    });

    describe("dataMapSpread", () => {
        it("is object", () => {
            const obj = {
                user1: { name: "John", age: 25 },
                user2: { name: "Jane", age: 30 },
            };
            const result = Data.dataMapSpread(obj, (name, age) => `${name} is ${age}`);
            expect(result).toEqual({
                user1: "John is 25",
                user2: "Jane is 30",
            });
        });
        it("is array", () => {
            const data = [
                    [1, 2],
                    [3, 4],
                ];
            const result = Data.dataMapSpread(data, (a, b) => a + b);
            expect(result).toEqual([3, 7]);
        });
    });

    describe("dataPrepend", () => {
        it("is object", () => {
            const result = Data.dataPrepend({ b: 2, c: 3 }, 1, "a");
            expect(result).toEqual({
                a: 1,
                b: 2,
                c: 3,
            });
        });
        it("is array", () => {
            const result = Data.dataPrepend([2, 3], 1);
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe("dataValues", () => {
        it("values", () => {
            expect(Data.dataValues([1, 2, 3])).toEqual([1, 2, 3]);
            expect(Data.dataValues({ a: 1, b: 2, c: 3 })).toEqual([1, 2, 3]);
        });
    });

    describe("dataKeys", () => {
        it("keys", () => {
            expect(Data.dataKeys([1, 2, 3])).toEqual([0, 1, 2]);
            expect(Data.dataKeys({ a: 1, b: 2, c: 3 })).toEqual(["a", "b", "c"]);
        });
    });

    describe("dataFilter", () => {
        it("filter", () => {
            expect(Data.dataFilter([1, 2, 3, 4], (value) => value > 2)).toEqual([
                3, 4,
            ]);
            expect(
                Data.dataFilter({ a: 1, b: 2, c: 3, d: 4 }, (value) => value > 2),
            ).toEqual({ c: 3, d: 4 });
        });
    });

    describe("dataMap", () => {
        it("map", () => {
            expect(Data.dataMap([1, 2, 3], (value) => value * 2)).toEqual([
                2, 4, 6,
            ]);
            expect(
                Data.dataMap({ a: 1, b: 2, c: 3 }, (value) => value * 2),
            ).toEqual({ a: 2, b: 4, c: 6 });
        });
    });

    describe("dataFirst", () => {
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
    });

    describe("dataLast", () => {
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
    });

    describe("dataContains", () => {
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
    });

    describe("dataDiff", () => {
        it("diff", () => {
            expect(Data.dataDiff([1, 2, 3], [2, 3, 4])).toEqual([1]);
            expect(
                Data.dataDiff<number, string>(
                    { a: 1, b: 2, c: 3 },
                    { b: 2, c: 3, d: 4 },
                ),
            ).toEqual({ a: 1 });
        });
    });

    describe("dataPluck", () => {
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
    });

    describe("dataPull", () => {
        it("pull", () => {
            const result1 = Data.dataPull([1, 2, 3], 1, "default");
            expect(result1.value).toBe(2);
            expect(result1.data).toEqual([1, 3]);

            const result2 = Data.dataPull({ a: 1, b: 2 }, "b", "default");
            expect(result2.value).toBe(2);
            expect(result2.data).toEqual({ a: 1 });
        });
    });

    describe("dataQuery", () => {
        it("query", () => {
            expect(Data.dataQuery({ name: "John", age: 30 })).toBe(
                "name=John&age=30",
            );
            expect(Data.dataQuery([1, 2, 3])).toBe("0=1&1=2&2=3");
        });
    });

    describe("dataSet", () => {
        it("set", () => {
            expect(Data.dataSet([1, 2, 3], 1, 99)).toEqual([1, 99, 3]);
            expect(Data.dataSet({ a: 1, b: 2 }, "c", 3)).toEqual({
                a: 1,
                b: 2,
                c: 3,
            });
        });
    });

    describe("dataShuffle", () => {
        it("shuffle", () => {
            const result = Data.dataShuffle([1, 2, 3, 4]);
            expect(result).toHaveLength(4);
            expect(result).toEqual(expect.arrayContaining([1, 2, 3, 4]));
        });
    });

    describe("dataString", () => {
        it("string", () => {
            expect(Data.dataString(["hello", "world"], 0, "")).toBe("hello");
            expect(Data.dataString({ name: "John" }, "name", "")).toBe("John");
            expect(Data.dataString({}, "missing", "default")).toBe("default");
        });
    });

    describe("dataToCssClasses", () => {
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
    });

    describe("dataWhere", () => {
        it("where", () => {
            expect(Data.dataWhere([1, 2, 3, 4], (value) => value > 2)).toEqual([
                3, 4,
            ]);
            expect(
                Data.dataWhere({ a: 1, b: 2, c: 3 }, (value) => value > 1),
            ).toEqual({ b: 2, c: 3 });
        });
    });

    describe("dataReject", () => {
        it("reject", () => {
            expect(Data.dataReject([1, 2, 3, 4], (value) => value > 2)).toEqual([
                1, 2,
            ]);
            expect(
                Data.dataReject({ a: 1, b: 2, c: 3 }, (value) => value > 1),
            ).toEqual({ a: 1 });
        });
    });

    describe("dataPartition", () => {
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
    });

    describe("dataWhereNotNull", () => {
        it("whereNotNull", () => {
            expect(Data.dataWhereNotNull([1, null, 2, null, 3])).toEqual([1, 2, 3]);
            expect(Data.dataWhereNotNull({ a: 1, b: null, c: 2 })).toEqual({
                a: 1,
                c: 2,
            });
        });
    });
});
