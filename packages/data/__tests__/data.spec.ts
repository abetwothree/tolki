import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { afterEach, assertType, describe, expect, it } from "vitest";

const strcasecmp = (a: unknown, b: unknown) =>
    String(a).toLowerCase() === String(b).toLowerCase();

describe("Data", () => {
    describe("dataAdd", () => {
        it("is object", () => {
            const result = Data.dataAdd({ a: 1 }, "b", 2);
            expect(result).toEqual({ a: 1, b: 2 });

            assertType<{ a: number; b: number }>(result);
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

    describe("dataBoolean", () => {
        it("is object", () => {
            expect(Data.dataBoolean({ active: true }, "active", false)).toBe(
                true,
            );
            expect(Data.dataBoolean({ active: false }, "missing", true)).toBe(
                true,
            );
            // Test with default value (false) - not explicitly passed
            expect(Data.dataBoolean({ active: true }, "active")).toBe(true);
            expect(Data.dataBoolean({ active: false }, "missing")).toBe(false);
        });

        it("is array", () => {
            expect(Data.dataBoolean([true, false], 0, false)).toBe(true);
            // Test with default value (false) - not explicitly passed
            expect(Data.dataBoolean([true, false], 0)).toBe(true);
            expect(Data.dataBoolean([true, false], 5)).toBe(false);
        });
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
            expect(result2).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);

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
            // Four keys, four values — equal counts. Plain String coercion, not
            // function-calling — see obj.spec.ts's combine tests for the dedicated
            // function-key case.
            const keys = {
                1: "name",
                2: "family",
                3: "role",
                4: undefined,
            };
            const values = { 0: "John", 1: "Doe", 2: "admin", 3: "N/A" };
            const result = Data.dataCombine(keys, values);

            expect(result).toEqual({
                name: "John",
                family: "Doe",
                role: "admin",
                undefined: "N/A",
            });
        });

        // `Arr.combine` used to zip arrays into tuples (`[[1,4],[2,5],[3,6]]`),
        // diverging in *shape* from the object branch above, which already produced a
        // keyed map — a unison-rule violation this test was pinning.
        it("is array", () => {
            const baseData = [1, 2, 3];
            const result = Data.dataCombine(baseData, [4, 5, 6]);

            expect(result).toEqual({ 1: 4, 2: 5, 3: 6 });
        });

        it("throws error on mismatched types", () => {
            // @ts-expect-error Testing runtime error for mismatched types
            expect(() => Data.dataCombine([1, 2, 3], { a: 1 })).toThrowError();
            // @ts-expect-error Testing runtime error for mismatched types
            expect(() => Data.dataCombine({ a: 1 }, [1, 2, 3])).toThrowError();
        });

        // PHP raises a ValueError on a key/value count mismatch; PHP-verified message
        // (docs/php-parity/task-04-shared.json, "array_combine mismatch"). Asserted for
        // both shapes, per the unison rule.
        it("throws when the key and value counts differ — both shapes agree", () => {
            expect(() => Data.dataCombine(["a", "b"], [1])).toThrow(
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
            );
            expect(() =>
                Data.dataCombine({ x: "a", y: "b" }, { p: 1 }),
            ).toThrow(
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements",
            );
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

        it("dot with depth on object", () => {
            const result = Data.dataDot(
                { user: { name: "Taylor", address: { city: "Dallas" } } },
                "",
                1,
            );
            expect(result).toEqual({
                "user.name": "Taylor",
                "user.address": { city: "Dallas" },
            });
        });

        it("dot with depth on array", () => {
            const result = Data.dataDot([1, [2, [3, [4]]]], "", 1);
            expect(result).toEqual({
                "0": 1,
                "1.0": 2,
                "1.1": [3, [4]],
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
            const result = Data.dataUndot(
                { "0": "a", "1.0": "b", "1.1.0": "c" },
                true,
            );
            expect(result).toEqual(["a", ["b", ["c"]]]);
        });

        it("rebuilds a list from consecutive integer segments starting at 0, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::undot
            // — integer segments rebuild a list".
            const result = Data.dataUndot({
                "user.languages.0": "PHP",
                "user.languages.1": "C#",
                "user.name": "Taylor",
            });
            expect(result).toEqual({
                user: { languages: ["PHP", "C#"], name: "Taylor" },
            });
        });
    });

    describe("dataUnion", () => {
        it("is object", () => {
            const result = Data.dataUnion({ a: 1 }, { b: 2 });
            expect(result).toEqual({ a: 1, b: 2 });
        });

        it("is array", () => {
            // PHP-verified directly (`+` is a native operator, ): [1,2] + [2,3] ->
            // [1,2] — both indices the right side could fill are already occupied by
            // the left, so it contributes nothing.
            const result = Data.dataUnion([1, 2], [2, 3]);
            expect(result).toEqual([1, 2]);
        });

        it("extends the tail once the left operand runs out of indices", () => {
            // PHP-verified: [1,2] + [3,4,5] -> [1,2,5].
            const result = Data.dataUnion([1, 2], [3, 4, 5]);
            expect(result).toEqual([1, 2, 5]);
        });

        it("throws error on mismatched types", () => {
            expect(() => Data.dataUnion({ a: 1 }, [1, 2])).toThrowError();
            expect(() => Data.dataUnion([1, 2], { a: 1 })).toThrowError();
        });

        it("lets the left operand win even when its value is undefined", () => {
            // PHP-verified: ["a"=>null] + ["a"=>1] -> {"a":null}
            // (docs/php-parity/task-07-pad-union.json).
            const result = Data.dataUnion({ a: undefined }, { a: 1 });
            expect(result).toEqual({ a: undefined });
            // toEqual({ a: undefined }) alone would also pass against {}
            // (Vitest 4 treats an undefined-valued key as equal to an
            // absent one); assert the key actually exists too.
            expect(result).toHaveProperty("a");
        });

        it("treats a nullish operand as empty rather than a shape mismatch", () => {
            // collect([10,20])->union(null) -> [10,20]: getArrayableItems
            // casts null to [], so it says nothing about the backing.
            expect(Data.dataUnion([10, 20], null)).toEqual([10, 20]);
            expect(Data.dataUnion({ a: 1 }, undefined)).toEqual({ a: 1 });
            expect(Data.dataUnion(null, [10, 20])).toEqual([10, 20]);
        });
    });

    describe("dataExcept", () => {
        it("is object", () => {
            const result = Data.dataExcept(
                { name: "John", age: 30, city: "NYC" },
                "age",
            );
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

        it("dataExists resolves a literal dotted key before traversing, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::exists
            // — literal dotted key".
            expect(
                Data.dataExists({ "products.desk": {} }, "products.desk"),
            ).toBe(true);
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
            // Arr::flatten(..., 1) spends its last level of depth on each
            // container's own values, so one level of nesting survives.
            const result = Data.dataFlatten(
                {
                    users: { john: { name: "John" }, jane: { name: "Jane" } },
                    posts: { "1": { title: "Hello" } },
                },
                1,
            );

            expect(result).toEqual([
                { name: "John" },
                { name: "Jane" },
                { title: "Hello" },
            ]);
        });

        it("is object with array values", () => {
            const result = Data.dataFlatten({ list: ["x", "y"] }, 1);
            expect(result).toEqual(["x", "y"]);
        });

        it("is object with deeper nesting", () => {
            const data = { a: { b: { c: 1 } } };

            expect(Data.dataFlatten(data, 2)).toEqual([1]);
            expect(Data.dataFlatten(data)).toEqual([1]);
        });

        // docs/php-parity/task-17-second-review.json, "Arr::flatten defaults to unlimited depth"
        it("flattens to unlimited depth by default", () => {
            const data = { a: { b: { c: { d: 1 } } } };

            expect(Data.dataFlatten(data)).toEqual([1]);
        });

        // docs/php-parity/task-17-second-review.json, "Arr::flatten honours an explicit depth of 2"
        it("stops at an explicit depth", () => {
            const data = { a: { b: { c: { d: 1 } } } };

            expect(Data.dataFlatten(data, 2)).toEqual([{ d: 1 }]);
        });
        it("is array", () => {
            const result = Data.dataFlatten([["#foo", ["#bar"]], ["#baz"]]);
            expect(result).toEqual(["#foo", "#bar", "#baz"]);

            const result2 = ["#foo", { key: "#bar" }, { key: "#baz" }, "#zap"];
            expect(Data.dataFlatten(result2, 1)).toEqual([
                "#foo",
                "#bar",
                "#baz",
                "#zap",
            ]);
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

        it("is object with unsupported values skipped", () => {
            const result = Data.dataFlip({
                string: "taylor",
                integer: 1,
                null: null,
                false: false,
                true: true,
                float: 1.5,
                array: [],
                object: {},
            });
            expect(result).toEqual({ taylor: "string", 1: "integer" });
        });

        it("is array with unsupported values skipped", () => {
            const result = Data.dataFlip([
                "a",
                1,
                null,
                false,
                true,
                1.5,
                [],
                {},
            ]);
            expect(result).toEqual({ a: 0, 1: 1 });
        });

        it("is object with numbers beyond PHP's integer range skipped", () => {
            expect(Data.dataFlip({ huge: 1e21 })).toEqual({});
        });

        it("is array with numbers beyond PHP's integer range skipped", () => {
            expect(Data.dataFlip([1e21])).toEqual({});
        });

        it("is object keeping __proto__ as an own key", () => {
            const result = Data.dataFlip({ a: "__proto__" });

            expect(Object.hasOwn(result, "__proto__")).toBe(true);
            expect(result["__proto__"]).toBe("a");
        });

        it("is array keeping __proto__ as an own key", () => {
            const result = Data.dataFlip(["__proto__"]);

            expect(Object.hasOwn(result, "__proto__")).toBe(true);
            expect(result["__proto__"]).toBe(0);
        });
    });

    describe("dataFloat", () => {
        it("is object", () => {
            const result = Data.dataFloat(
                { price: 19.99, discount: 0.1 },
                "price",
            );
            expect(result).toBe(19.99);
        });

        it("is array", () => {
            const result = Data.dataFloat([1.5, 2.3], 1);
            expect(result).toBe(2.3);
        });
    });

    describe("dataForget", () => {
        it("is object", () => {
            const result = Data.dataForget(
                { name: "John", age: 30, city: "NYC" },
                "age",
            );
            expect(result).toEqual({ name: "John", city: "NYC" });
        });

        it("is array", () => {
            const result = Data.dataForget(
                ["products", ["desk", [100]]],
                "1.1",
            );
            expect(result).toEqual(["products", ["desk"]]);
        });

        it("resolves a top-level key following a dot key against the top level", () => {
            const result = Data.dataForget(
                { users: { name: "Joe", id: 1 }, id: 99 },
                ["users.name", "id"],
            );
            expect(result).toEqual({ users: { id: 1 } });
        });

        it("resolves a top-level key following a deeper dot key against the top level", () => {
            const result = Data.dataForget(
                { products: { desk: { price: 100 } }, desk: "top-level" },
                ["products.desk.price", "desk"],
            );
            expect(result).toEqual({ products: { desk: {} } });
        });

        it("resolves a dot key following a deeper dot key from the top level", () => {
            const result = Data.dataForget(
                { a: { b: { c: 1, "e.d": "literal" } }, e: { d: 3 } },
                ["a.b.c", "e.d"],
            );
            expect(result).toEqual({
                a: { b: { "e.d": "literal" } },
                e: {},
            });
        });

        it("resolves a top-level index following a dot key against the top-level array", () => {
            const result = Data.dataForget([["x", "y"], "z"], ["0.1", 1]);
            expect(result).toEqual([["x"]]);
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

        it("is a Map", () => {
            expect(
                Data.dataFrom(
                    new Map([
                        ["a", 1],
                        ["b", 2],
                    ]),
                ),
            ).toEqual({ a: 1, b: 2 });
        });

        it("is an iterable", () => {
            expect(Data.dataFrom(new Set([1, 2]))).toEqual([1, 2]);
            expect(
                Data.dataFrom(
                    (function* () {
                        yield 1;
                        yield 2;
                    })(),
                ),
            ).toEqual([1, 2]);
        });
    });

    describe("dataGet", () => {
        it("is object", () => {
            const result = Data.dataGet({ a: 1, b: 2 }, "c", "default");
            expect(result).toBe("default");
        });

        it("is array", () => {
            const result = Data.dataGet([1, 2, 3], 1, "default");
            expect(result).toBe(2);
        });

        it("dataGet resolves a literal dotted key before traversing, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::get
            // — literal dotted key wins".
            const result = Data.dataGet(
                { "products.desk": { price: 100 } },
                "products.desk",
            );
            expect(result).toEqual({ price: 100 });
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

        it("dataHas resolves a literal dotted key before traversing, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::has
            // — literal dotted key".
            expect(
                Data.dataHas(
                    { "products.desk": { price: 100 } },
                    "products.desk",
                ),
            ).toBe(true);
        });

        it("finds a numeric key on a plain object, not only on arrays", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::has
            // — numeric key".
            expect(Data.dataHas({ 123: "x" }, 123)).toBe(true);
        });

        it("does not leak Array.prototype through the array backing", () => {
            expect(Data.dataHas([1, 2], "length")).toBe(false);
            expect(Data.dataHas([1, 2], "toString")).toBe(false);
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
            const result = Data.dataEvery(
                { a: 2, b: 4 },
                (value) => value % 2 === 0,
            );
            expect(result).toBe(true);
        });

        it("is array", () => {
            const result = Data.dataEvery(
                [2, 4, 6],
                (value) => value % 2 === 0,
            );
            expect(result).toBe(true);
            expect(Data.dataEvery([1, 2, 3], (value) => value % 2 === 0)).toBe(
                false,
            );
        });

        it("is a Map", () => {
            const items = new Map([
                ["first", 2],
                ["second", 4],
            ]);

            expect(Data.dataEvery(items, (value) => value % 2 === 0)).toBe(
                true,
            );
            expect(
                Data.dataEvery(items, (_value, key) => key === "first"),
            ).toBe(false);
        });

        it("is an iterable", () => {
            const items = () =>
                (function* () {
                    yield 2;
                    yield 4;
                })();

            expect(Data.dataEvery(items(), (value) => value % 2 === 0)).toBe(
                true,
            );
            expect(Data.dataEvery(items(), (value) => value > 2)).toBe(false);
            expect(
                Data.dataEvery(new Set([2, 4]), (value) => value % 2 === 0),
            ).toBe(true);
        });

        it("is a scalar", () => {
            expect(Data.dataEvery(5 as unknown as number[], () => true)).toBe(
                true,
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

        it("is a Map", () => {
            const items = new Map([
                ["first", 1],
                ["second", 2],
            ]);

            expect(
                Data.dataSome(
                    items,
                    (value, key) => key === "second" && value === 2,
                ),
            ).toBe(true);
            expect(Data.dataSome(items, (value) => value > 5)).toBe(false);
        });

        it("is an iterable", () => {
            const items = () =>
                (function* () {
                    yield 1;
                    yield 2;
                })();

            expect(Data.dataSome(items(), (value) => value % 2 === 0)).toBe(
                true,
            );
            expect(Data.dataSome(items(), (value) => value > 5)).toBe(false);
            expect(Data.dataSome(new Set([1, 2]), (value) => value > 1)).toBe(
                true,
            );
        });

        it("is a scalar", () => {
            expect(Data.dataSome(5 as unknown as number[], () => true)).toBe(
                true,
            );
        });
    });

    describe("dataInteger", () => {
        it("is object", () => {
            const result = Data.dataInteger({ count: 42 }, "count", 0);
            expect(result).toBe(42);

            expect(Data.dataInteger({}, "missing", 5)).toBe(5);

            // Test with default value (0) - not explicitly passed
            expect(Data.dataInteger({ count: 42 }, "count")).toBe(42);
            expect(Data.dataInteger({}, "missing")).toBe(0);
        });

        it("is array", () => {
            const result = Data.dataInteger([1, 2, 3], 0, 0);
            expect(result).toBe(1);

            // Test with default value (0) - not explicitly passed
            expect(Data.dataInteger([10, 20, 30], 1)).toBe(20);
            expect(Data.dataInteger([], 0)).toBe(0);
        });
    });

    describe("dataJoin", () => {
        it("is object", () => {
            const result = Data.dataJoin(
                { a: "hello", b: "world", c: "test" },
                ", ",
                " and ",
            );
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

        it("keys array items with a null key value under an empty string key", () => {
            const users = [
                { rating: 1, name: "1" },
                { rating: 2, name: null },
            ];
            const result = Data.dataKeyBy(users, "name");
            expect(result).toEqual({
                1: { rating: 1, name: "1" },
                "": { rating: 2, name: null },
            });
        });

        it("keys object items with a null key value under an empty string key", () => {
            const users = {
                first: { rating: 1, name: "1" },
                second: { rating: 2, name: null },
            };
            const result = Data.dataKeyBy(users, "name");
            expect(result).toEqual({
                1: { rating: 1, name: "1" },
                "": { rating: 2, name: null },
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
            const result = Data.dataSelect(
                {
                    user1: { name: "John", age: 30, city: "NYC" },
                    user2: { name: "Jane", age: 25, city: "LA" },
                },
                ["name", "city"],
            );
            expect(result).toEqual({
                user1: { name: "John", city: "NYC" },
                user2: { name: "Jane", city: "LA" },
            });
        });
        it("is array", () => {
            const result = Data.dataSelect(
                [
                    { a: 1, b: 2, c: 3 },
                    { a: 4, b: 5, c: 6 },
                ],
                ["a", "b"],
            );
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

        it("is array with a [key, value] tuple callback", () => {
            const result = Data.dataMapWithKeys([1, 2], (value, index) => [
                `key_${String(index)}`,
                value * 2,
            ]);
            expect(result).toEqual({ key_0: 2, key_1: 4 });
        });

        it("is object with a [key, value] tuple callback", () => {
            const obj = { a: 1, b: 2 };
            const result = Data.dataMapWithKeys(obj, (value, key) => [
                `key_${String(key)}`,
                value * 2,
            ]);
            expect(result).toEqual({ key_a: 2, key_b: 4 });
        });

        // Arr::mapWithKeys (Arr.php:880) builds one plain array; there is no Map in
        // PHP. Array- and object-backed data must agree, per the unison rule.
        it("returns a plain object even for numeric-like mapped keys, either backing", () => {
            const fromArray = Data.dataMapWithKeys([1, 2], (value) => ({
                [value]: value,
            }));
            expect(fromArray instanceof Map).toBe(false);
            expect(fromArray).toEqual({ 1: 1, 2: 2 });

            const fromObject = Data.dataMapWithKeys(
                { a: 1, b: 2 },
                (value) => ({ [value]: value }),
            );
            expect(fromObject instanceof Map).toBe(false);
            expect(fromObject).toEqual({ 1: 1, 2: 2 });
        });
    });

    describe("dataMapSpread", () => {
        it("is object", () => {
            const obj = {
                user1: { name: "John", age: 25 },
                user2: { name: "Jane", age: 30 },
            };
            const result = Data.dataMapSpread(
                obj,
                (name, age) => `${name} is ${age}`,
            );
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

    describe("dataPull", () => {
        it("is object", () => {
            const result2 = Data.dataPull({ a: 1, b: 2 }, "b", "default");
            expect(result2.value).toBe(2);
            expect(result2.data).toEqual({ a: 1 });
        });
        it("is array", () => {
            const result1 = Data.dataPull([1, 2, 3], 1, "default");
            expect(result1.value).toBe(2);
            expect(result1.data).toEqual([1, 3]);
        });

        it("pulls a first-level key that contains dots, through the object backing", () => {
            // PHP-verified: docs/php-parity/task-09-paths.json, "Arr::pull
            // — first-level key containing dots".
            const result = Data.dataPull(
                { "joe@example.com": "Joe", "jane@localhost": "Jane" },
                "joe@example.com",
            );
            expect(result.value).toBe("Joe");
            expect(result.data).toEqual({ "jane@localhost": "Jane" });
        });
    });

    describe("dataQuery", () => {
        it("is object", () => {
            expect(Data.dataQuery({ name: "John", age: 30 })).toBe(
                "name=John&age=30",
            );
        });
        it("is array", () => {
            expect(Data.dataQuery([1, 2, 3])).toBe("0=1&1=2&2=3");
        });

        // Both backings must cast booleans like PHP's http_build_query: true -> "1",
        // false -> "0".
        it("casts booleans like PHP's http_build_query, either backing", () => {
            expect(Data.dataQuery({ foo: "bar", bar: true })).toBe(
                "foo=bar&bar=1",
            );
            expect(Data.dataQuery({ foo: "bar", bar: false })).toBe(
                "foo=bar&bar=0",
            );
            expect(Data.dataQuery([true, false])).toBe("0=1&1=0");
        });
    });

    describe("dataRandom", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataRandom(obj);
            // dataRandom with no count returns a single value
            expect([1, 2, 3]).toContain(result);
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            const result = Data.dataRandom(arr);
            // dataRandom with no count returns a single value
            expect(arr).toContain(result);
        });

        // Arr.php:977 throws above the empty guard, and Arr.php:971 defaults
        // preserveKeys to false. Both backings agree.
        it("throws on an empty source and reindexes by default, either backing", () => {
            expect(() => Data.dataRandom([])).toThrow(
                "You requested 1 items, but there are only 0 items available.",
            );
            expect(() => Data.dataRandom({})).toThrow(
                "You requested 1 items, but there are only 0 items available.",
            );

            const fromArray = Data.dataRandom([10, 20, 30], 2) as unknown[];
            expect(Array.isArray(fromArray)).toBe(true);
            expect(Object.keys(fromArray)).toEqual(["0", "1"]);

            const fromObject = Data.dataRandom(
                { one: 10, two: 20, three: 30 },
                2,
            );
            expect(Object.keys(fromObject as Record<string, unknown>)).toEqual([
                "0",
                "1",
            ]);
        });
    });

    describe("dataSearch", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataSearch(obj, "2");
            expect(result).toBe("b");

            const result1 = Data.dataSearch(obj, "2", true);
            expect(result1).toBe(false);

            const result2 = Data.dataSearch(obj, 2, true);
            expect(result2).toBe("b");

            const result3 = Data.dataSearch(obj, (value) => value > 3);
            expect(result3).toBe(false);

            const result4 = Data.dataSearch(obj, (value) => value == 3);
            expect(result4).toBe("c");
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            const result = Data.dataSearch(arr, "3");
            expect(result).toBe(2);

            const result1 = Data.dataSearch(arr, "3", true);
            expect(result1).toBe(false);

            const result2 = Data.dataSearch(arr, 3, true);
            expect(result2).toBe(2);

            const result3 = Data.dataSearch(arr, (value) => value > 5);
            expect(result3).toBe(false);

            const result4 = Data.dataSearch(arr, (value) => value == 4);
            expect(result4).toBe(3);
        });
    });

    describe("dataBefore", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataBefore(obj, "2");
            expect(result).toBe(1);

            const result1 = Data.dataBefore(obj, "2", true);
            expect(result1).toBeNull();

            const result2 = Data.dataBefore(obj, 2, true);
            expect(result2).toBe(1);

            const result3 = Data.dataBefore(obj, (value) => value > 3);
            expect(result3).toBeNull();

            const result4 = Data.dataBefore(obj, (value) => value === 3);
            expect(result4).toBe(2);

            // When searching for the first element, there is no "before"
            const result5 = Data.dataBefore(obj, 1, true);
            expect(result5).toBeNull();
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            const result = Data.dataBefore(arr, "3");
            expect(result).toBe(2);

            const result1 = Data.dataBefore(arr, "3", true);
            expect(result1).toBeNull();

            const result2 = Data.dataBefore(arr, 3, true);
            expect(result2).toBe(2);

            const result3 = Data.dataBefore(arr, (value) => value > 5);
            expect(result3).toBeNull();

            const result4 = Data.dataBefore(arr, (value) => value === 4);
            expect(result4).toBe(3);

            // When searching for the first element, there is no "before"
            const result5 = Data.dataBefore(arr, 1, true);
            expect(result5).toBeNull();
        });
    });

    describe("dataAfter", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataAfter(obj, "2");
            expect(result).toBe(3);

            const result1 = Data.dataAfter(obj, "2", true);
            expect(result1).toBeNull();

            const result2 = Data.dataAfter(obj, 2, true);
            expect(result2).toBe(3);

            const result3 = Data.dataAfter(obj, (value) => value < 1);
            expect(result3).toBeNull();

            const result4 = Data.dataAfter(obj, (value) => value === 1);
            expect(result4).toBe(2);

            // When searching for the last element, there is no "after"
            const result5 = Data.dataAfter(obj, 3, true);
            expect(result5).toBeNull();
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            const result = Data.dataAfter(arr, "3");
            expect(result).toBe(4);

            const result1 = Data.dataAfter(arr, "3", true);
            expect(result1).toBeNull();

            const result2 = Data.dataAfter(arr, 3, true);
            expect(result2).toBe(4);

            const result3 = Data.dataAfter(arr, (value) => value < 1);
            expect(result3).toBeNull();

            const result4 = Data.dataAfter(arr, (value) => value === 4);
            expect(result4).toBe(5);

            // When searching for the last element, there is no "after"
            const result5 = Data.dataAfter(arr, 5, true);
            expect(result5).toBeNull();
        });
    });

    describe("dataShift", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataShift(obj);
            expect(result).toBe(1);
            expect(obj).toEqual({ b: 2, c: 3 });
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4, 5];
            const result = Data.dataShift(arr);
            expect(result).toBe(1);
            expect(arr).toEqual([2, 3, 4, 5]);
        });
        it("throws when the shift count is negative, for either backing", () => {
            expect(() => Data.dataShift([1], -1)).toThrow(
                "Number of shifted items may not be less than zero.",
            );
            expect(() => Data.dataShift({ a: 1 }, -1)).toThrow(
                "Number of shifted items may not be less than zero.",
            );
        });
        it("returns null when shifting an empty source, for any count and either backing", () => {
            expect(Data.dataShift([], 3)).toBeNull();
            expect(Data.dataShift({}, 3)).toBeNull();
        });
    });

    describe("dataSet", () => {
        it("is object", () => {
            const result = Data.dataSet({ a: 1, b: 2 }, "c", 3);
            expect(result).toEqual({
                a: 1,
                b: 2,
                c: 3,
            });
        });
        it("is array", () => {
            const result = Data.dataSet([1, 2, 3], 1, 99);
            expect(result).toEqual([1, 99, 3]);
        });

        // docs/php-parity/task-17-second-review.json: "Arr::set writes a
        // \"constructor\" key", "...a \"prototype\" key", "...a \"__proto__\" key"
        describe("unsafe-key write policy", () => {
            afterEach(() => {
                expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
                expect(Object.getPrototypeOf({})).toBe(Object.prototype);
            });

            it.each(["constructor", "prototype", "__proto__"])(
                "keeps a %s key as own data",
                (key) => {
                    expect(
                        Object.hasOwn(Data.dataSet({}, key, 5) as object, key),
                    ).toBe(true);
                },
            );

            // docs/php-parity/task-17-second-review.json, "Arr::set writes a nested \"constructor.prototype\" path"
            it("builds a nested constructor.prototype path without polluting", () => {
                const result = Data.dataSet(
                    {},
                    "constructor.prototype.polluted",
                    5,
                ) as Record<string, unknown>;
                expect(result).toEqual({
                    constructor: { prototype: { polluted: 5 } },
                });
            });

            // The 4 hostile paths from the Task 0 audit: neither the accessor
            // (__proto__) nor the ordinary data properties (constructor,
            // prototype) reach a global prototype through Arr.set or dataSet.
            it("cannot pollute a global prototype through any write path", () => {
                for (const path of [
                    "__proto__.PWN",
                    "constructor.prototype.PWN",
                    "0.__proto__.PWN",
                    "0.constructor.prototype.PWN",
                ]) {
                    Arr.set([{}], path, 1);
                    Data.dataSet({}, path, 1);
                }
                expect(({} as { PWN?: unknown }).PWN).toBeUndefined();
                expect(
                    ([] as unknown as { PWN?: unknown }).PWN,
                ).toBeUndefined();
                expect(
                    (function () {} as unknown as { PWN?: unknown }).PWN,
                ).toBeUndefined();
            });

            // A pre-existing own key aliasing a global, not a fresh container,
            // is the only fixture exposing this. Arr.add exercises it (Arr.set's
            // own deep copy happens to flatten the alias first).
            it("cannot pollute a global prototype when an own key aliases one", () => {
                const aliasing = (target: object): Record<string, unknown> => {
                    const a = Object.create(null) as Record<string, unknown>;
                    a["__proto__"] = target;
                    return a;
                };

                for (const target of [Object.prototype, Array.prototype]) {
                    for (const path of [
                        "__proto__.PWN",
                        "constructor.prototype.PWN",
                        "0.__proto__.PWN",
                        "0.constructor.prototype.PWN",
                    ]) {
                        Arr.set([aliasing(target)], path, 1);
                        Arr.add([aliasing(target)], path, 1);
                    }
                    Data.dataSet(aliasing(target), "__proto__.PWN", 1);
                    Data.dataSet(
                        aliasing(target),
                        "constructor.prototype.PWN",
                        1,
                    );
                }

                expect(({} as { PWN?: unknown }).PWN).toBeUndefined();
                expect(
                    ([] as unknown as { PWN?: unknown }).PWN,
                ).toBeUndefined();
                expect(
                    (function () {} as unknown as { PWN?: unknown }).PWN,
                ).toBeUndefined();
            });
        });
    });

    describe("dataPush", () => {
        it("is object", () => {
            const obj = { items: ["a", "b"] };
            const result = Data.dataPush(obj, "items", "c", "d");
            expect(result).toEqual({ items: ["a", "b", "c", "d"] });
        });
        it("appends with the next integer key when the key is null", () => {
            // docs/php-parity/task-17-second-review.json, "Arr::push with a null key appends"
            expect(Data.dataPush({ a: 1 }, null, 9)).toEqual({ a: 1, 0: 9 });
        });
        it("is array", () => {
            // PHP-verified in docs/php-parity/task-16-final-review.json ("push appends
            // into the array AT the key, never beside it").
            const result = Data.dataPush(
                [
                    ["a", "b"],
                    ["c", "d"],
                ],
                1,
                ["x", "y"],
            );
            expect(result).toEqual([
                ["a", "b"],
                ["c", "d", ["x", "y"]],
            ]);
        });
    });

    describe("dataUnshift", () => {
        it("is object", () => {
            const source = { b: 2 };
            const result = Data.dataUnshift(source, { a: 1 }, { d: "house" });
            expect(result).toEqual({
                a: 1,
                d: "house",
                b: 2,
            });
            expect(source).toEqual({ a: 1, d: "house", b: 2 });
        });
        it("mutates the source array in place, like array_unshift", () => {
            const data = [2];
            Data.dataUnshift(data, 1);
            expect(data).toEqual([1, 2]);
        });
        it("is array", () => {
            const expected = [
                "Jonny from Laroe",
                ["Jonny", "from", "Laroe"],
                ["a", "b", "c"],
                4,
                5,
                6,
            ];

            const data = [4, 5, 6];

            let result: unknown[] = Data.dataUnshift(data, ["a", "b", "c"]);
            result = Data.dataUnshift(result, ["Jonny", "from", "Laroe"]);
            result = Data.dataUnshift(result, "Jonny from Laroe");
            expect(result).toEqual(expected);
        });
    });

    describe("dataShuffle", () => {
        it("is object", () => {
            const result = Data.dataShuffle({ a: 1, b: 2, c: 3, d: 4, e: 5 });
            // Should have same values
            expect(Object.values(result).sort()).toEqual([1, 2, 3, 4, 5]);
            // Should have same keys
            expect(Object.keys(result).sort()).toEqual([
                "a",
                "b",
                "c",
                "d",
                "e",
            ]);

            const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
            const shuffled = Data.dataShuffle(obj);

            expect(Object.values(shuffled).length).toBe(5);
            expect(Object.keys(shuffled).length).toBe(5);
            expect(Object.values(shuffled).sort()).toEqual([1, 2, 3, 4, 5]);
            expect(Object.keys(shuffled).sort()).toEqual([
                "a",
                "b",
                "c",
                "d",
                "e",
            ]);
        });
        it("is array", () => {
            const result = Data.dataShuffle([1, 2, 3, 4]);
            expect(result).toHaveLength(4);
            expect(result).toEqual(expect.arrayContaining([1, 2, 3, 4]));
        });
    });

    describe("dataSlice", () => {
        it("is object", () => {
            const result = Data.dataSlice(
                { a: 1, b: 2, c: 3, d: 4, e: 5 },
                1,
                -1,
            );
            expect(result).toEqual({ b: 2, c: 3, d: 4 });

            // Test with default length (null) - not explicitly passed
            expect(Data.dataSlice({ a: 1, b: 2, c: 3 }, 1)).toEqual({
                b: 2,
                c: 3,
            });
        });
        it("is array", () => {
            const result = Data.dataSlice([1, 2, 3, 4, 5, 6, 7, 8], 1, -1);
            expect(result).toEqual([2, 3, 4, 5, 6, 7]);

            // Test with default length (null) - not explicitly passed
            expect(Data.dataSlice([1, 2, 3, 4, 5], 2)).toEqual([3, 4, 5]);
        });

        // A negative offset combined with a length beyond the remaining tail used to
        // return an empty result instead of the last N items — PHP-verified
        // (docs/php-parity/task-04-shared.json, "slice(-2,5) preserve_keys").
        it("slices from the end for a negative offset with a length — both shapes agree", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8];
            const obj = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };

            expect(Data.dataSlice(arr, -2, 5)).toEqual([7, 8]);
            expect(Data.dataSlice(obj, -2, 5)).toEqual({ g: 7, h: 8 });

            // The arr/obj layers also pin slice(-2,2) — PHP-verified
            // (docs/php-parity/task-04-shared.json, "slice(-2,2) preserve_keys") — add
            // it here too, both shapes.
            expect(Data.dataSlice(arr, -2, 2)).toEqual([7, 8]);
            expect(Data.dataSlice(obj, -2, 2)).toEqual({ g: 7, h: 8 });
        });

        // The arr/obj layers pin a zero length — PHP-verified
        // (docs/php-parity/task-04-shared.json, "slice(1,0)"):
        // array_slice(['a'=>1,'b'=>2,'c'=>3], 1, 0, true) -> []. Both shapes.
        it("returns an empty result for a zero length — both shapes agree", () => {
            expect(Data.dataSlice([1, 2, 3], 1, 0)).toEqual([]);
            expect(Data.dataSlice({ a: 1, b: 2, c: 3 }, 1, 0)).toEqual({});
        });
    });

    describe("dataSole", () => {
        it("is object", () => {
            const obj = { only: 42 };
            const result = Data.dataSole(obj);
            expect(result).toBe(42);
        });
        it("is array", () => {
            const result = Data.dataSole([42]);
            expect(result).toBe(42);
        });
    });

    describe("dataSort", () => {
        it("is object", () => {
            const obj = { c: 3, a: 1, b: 2 };
            const result = Data.dataSort(obj);
            expect(result).toEqual({ a: 1, b: 2, c: 3 });
        });
        it("is array", () => {
            const arr = [3, 1, 2];
            const result = Data.dataSort(arr);
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe("dataSortDesc", () => {
        it("is object", () => {
            const obj = { c: 3, a: 1, b: 2 };
            const result = Data.dataSortDesc(obj);
            expect(result).toEqual({ c: 3, b: 2, a: 1 });
        });
        it("is array", () => {
            const arr = [3, 1, 2];
            const result = Data.dataSortDesc(arr);
            expect(result).toEqual([3, 2, 1]);
        });
    });

    describe("data sort recursive", () => {
        const obj = {
            b: { d: 2, c: 1, z: 50, y: 55, x: 50 },
            a: { f: 4, e: 3, x: 100, y: 100 },
        };

        const arr = [
            {
                b: [3, 1, 2],
                a: { d: 2, c: 1 },
            },
        ];

        describe("dataSortRecursive", () => {
            it("is object", () => {
                const result = Data.dataSortRecursive(obj);
                expect(Object.keys(result)).toEqual(["a", "b"]);
                expect(Object.keys(result["a"])).toEqual(["e", "f", "x", "y"]);
                expect(Object.keys(result["b"])).toEqual([
                    "c",
                    "d",
                    "x",
                    "y",
                    "z",
                ]);
            });
            it("is array", () => {
                const result = Data.dataSortRecursive(arr);
                expect(result).toEqual([
                    {
                        a: { c: 1, d: 2 },
                        b: [1, 2, 3],
                    },
                ]);
            });
        });

        describe("dataSortRecursiveDesc", () => {
            it("is object", () => {
                const result = Data.dataSortRecursiveDesc(obj);
                expect(Object.keys(result)).toEqual(["b", "a"]);
                expect(Object.keys(result["a"])).toEqual(["y", "x", "f", "e"]);
                expect(Object.keys(result["b"])).toEqual([
                    "z",
                    "y",
                    "x",
                    "d",
                    "c",
                ]);
            });
            it("is array", () => {
                const result = Data.dataSortRecursiveDesc(arr);
                expect(result).toEqual([
                    {
                        b: [3, 2, 1],
                        a: { d: 2, c: 1 },
                    },
                ]);
            });
        });
    });

    describe("dataSplice", () => {
        it("is object", () => {
            // An object-backed source stays object-backed and keeps its keys on the
            // removed portion; the replacement's own keys are discarded and renumbered
            // from 0 (array_splice), which then sorts first — JS integer-key ordering.
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = Data.dataSplice(obj, 1, 2, {
                x: 99,
                y: 100,
            });
            expect(Array.isArray(obj)).toBe(false);
            expect(result).toEqual({ b: 2, c: 3 });
            expect(obj).toEqual({ "0": 99, "1": 100, a: 1, d: 4 });
        });
        it("is array", () => {
            const arr = [1, 2, 3, 4];
            const result = Data.dataSplice(arr, 1, 2, [99, 100]);
            expect(result).toEqual([2, 3]);
            expect(arr).toEqual([1, 99, 100, 4]);
        });
        it("removes through to the end when no length is given, for either backing", () => {
            // The one-arg form removes offset -> end, not nothing.
            const obj = { foo: "f", baz: "z" };
            expect(Data.dataSplice(obj, 1)).toEqual({ baz: "z" });
            expect(obj).toEqual({ foo: "f" });

            const arr = ["foo", "baz"];
            expect(Data.dataSplice(arr, 1)).toEqual(["baz"]);
            expect(arr).toEqual(["foo"]);
        });
    });

    describe("dataString", () => {
        it("is object", () => {
            expect(Data.dataString({ name: "John" }, "name", "")).toBe("John");
            expect(Data.dataString({}, "missing", "default")).toBe("default");

            // Test with default value ("") - not explicitly passed
            expect(Data.dataString({ name: "Jane" }, "name")).toBe("Jane");
            expect(Data.dataString({}, "missing")).toBe("");
        });

        it("is array", () => {
            expect(Data.dataString(["hello", "world"], 0, "")).toBe("hello");
            expect(Data.dataString([], 0, "default")).toBe("default");

            // Test with default value ("") - not explicitly passed
            expect(Data.dataString(["foo", "bar"], 1)).toBe("bar");
            expect(Data.dataString([], 0)).toBe("");
        });
    });

    describe("dataToCssClasses", () => {
        it("is object", () => {
            expect(
                Data.dataToCssClasses({
                    btn: true,
                    "btn-primary": true,
                    disabled: false,
                }),
            ).toBe("btn btn-primary");
        });
        it("is array", () => {
            expect(Data.dataToCssClasses(["btn", "btn-primary"])).toBe(
                "btn btn-primary",
            );
        });

        // Arr.php:1214, is_numeric($class) pushes the VALUE. Both backings must agree,
        // per the unison rule.
        it("emits the value for numeric keys, either backing", () => {
            expect(
                Data.dataToCssClasses({
                    0: "font-bold",
                    1: "mt-4",
                    "ml-2": true,
                    "mr-2": false,
                }),
            ).toBe("font-bold mt-4 ml-2");
            expect(Data.dataToCssClasses(["font-bold", "mt-4", "ml-2"])).toBe(
                "font-bold mt-4 ml-2",
            );
        });
    });

    describe("dataToCssStyles", () => {
        it("is object", () => {
            expect(
                Data.dataToCssStyles({
                    "font-weight: bold": true,
                    "color: red": false,
                    "margin-top: 4px": true,
                }),
            ).toBe("font-weight: bold; margin-top: 4px;");
        });
        it("is array", () => {
            expect(
                Data.dataToCssStyles(["font-weight: bold", "margin-top: 4px"]),
            ).toBe("font-weight: bold; margin-top: 4px;");
        });

        // Arr.php:1237, is_numeric($class) pushes the VALUE, finished with a semicolon.
        // Both backings must agree, per the unison rule.
        it("emits the value for numeric keys, either backing", () => {
            expect(
                Data.dataToCssStyles({
                    0: "font-weight: bold",
                    "margin-left: 2px;": true,
                }),
            ).toBe("font-weight: bold; margin-left: 2px;");
            expect(
                Data.dataToCssStyles(["font-weight: bold", "margin-left: 2px"]),
            ).toBe("font-weight: bold; margin-left: 2px;");
        });
    });

    describe("dataWhere", () => {
        it("is object", () => {
            expect(
                Data.dataWhere({ a: 1, b: 2, c: 3 }, (value) => value > 1),
            ).toEqual({ b: 2, c: 3 });
        });
        it("is array", () => {
            expect(Data.dataWhere([1, 2, 3, 4], (value) => value > 2)).toEqual([
                3, 4,
            ]);
        });
    });

    describe("dataReplace", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const replacements = { b: 20, c: 30, d: 40 };
            const result = Data.dataReplace(obj, replacements);
            expect(result).toEqual({ a: 1, b: 20, c: 30, d: 40 });
        });
        it("is array", () => {
            const data = ["a", "b", "c"];
            const replacements = ["d", "e"];
            const result = Data.dataReplace(data, replacements);
            expect(result).toEqual(["d", "e", "c"]);
        });

        it("throws when values do not match type", () => {
            expect(() => {
                Data.dataReplace({ a: 1, b: 2 }, [3, 4]);
            }).toThrowError(
                "Data to replace and items must be of the same type (both array or both object).",
            );
        });

        it("treats a null/undefined replacer as a no-op, for either backing", () => {
            // dataReplace's same-type guard used to reject `null` outright for an
            // object-backed `data` (there is no object-shaped spelling of "null"), so
            // Collection.replace(null) threw for an object-backed source.
            expect(Data.dataReplace({ a: 1, b: 2 }, null)).toEqual({
                a: 1,
                b: 2,
            });
            expect(Data.dataReplace({ a: 1, b: 2 }, undefined)).toEqual({
                a: 1,
                b: 2,
            });
            expect(Data.dataReplace(["a", "b"], null)).toEqual(["a", "b"]);
            expect(Data.dataReplace(["a", "b"], undefined)).toEqual(["a", "b"]);
        });
    });

    describe("dataReplaceRecursive", () => {
        it("is object", () => {
            const obj = {
                user: { name: "John", address: { city: "NYC", zip: "10001" } },
                age: 30,
                locations: ["NYC", "LA", "CHI", "SF"],
            };
            const replacements = {
                user: { address: { city: "LA" } },
                age: 31,
                locations: ["DETROIT", "PORTLAND"],
            };
            const result = Data.dataReplaceRecursive(obj, replacements);
            expect(result).toEqual({
                user: { name: "John", address: { city: "LA", zip: "10001" } },
                age: 31,
                locations: ["DETROIT", "PORTLAND", "CHI", "SF"],
            });
        });
        it("is array", () => {
            const data = ["a", "b", ["c", "d"]];
            const replacements = ["d", "e", ["f", "g"]];
            const result = Data.dataReplaceRecursive(data, replacements);
            expect(result).toEqual(["d", "e", ["f", "g"]]);
        });

        it("accepts a sparse object-shaped replacer for array-backed data", () => {
            // PHP-verified: array_replace_recursive([['a'=>1],['b'=>2]],
            // [0=>['a'=>99]]) -> [{a:99},{b:2}].
            const result = Data.dataReplaceRecursive([{ a: 1 }, { b: 2 }], {
                0: { a: 99 },
            });
            expect(result).toEqual([{ a: 99 }, { b: 2 }]);
        });

        it("throws when values do not match type", () => {
            expect(() => {
                Data.dataReplaceRecursive({ a: 1, b: 2 }, [3, 4]);
            }).toThrowError(
                "Data to replace and items must be of the same type (both array or both object).",
            );
        });

        it("treats a null/undefined replacer as a no-op, for either backing", () => {
            // Same rationale as dataReplace's null pin above.
            expect(Data.dataReplaceRecursive({ a: 1 }, null)).toEqual({
                a: 1,
            });
            expect(Data.dataReplaceRecursive({ a: 1 }, undefined)).toEqual({
                a: 1,
            });
            expect(Data.dataReplaceRecursive(["a", "b"], null)).toEqual([
                "a",
                "b",
            ]);
            expect(Data.dataReplaceRecursive(["a", "b"], undefined)).toEqual([
                "a",
                "b",
            ]);
        });
    });

    describe("dataReject", () => {
        it("is object", () => {
            expect(
                Data.dataReject({ a: 1, b: 2, c: 3 }, (value) => value > 1),
            ).toEqual({ a: 1 });
        });
        it("is array", () => {
            expect(Data.dataReject([1, 2, 3, 4], (value) => value > 2)).toEqual(
                [1, 2],
            );
        });
    });

    describe("dataReverse", () => {
        it("is object", () => {
            const result = Data.dataReverse({ a: 1, b: 2, c: 3 });
            expect(Object.keys(result)).toEqual(["c", "b", "a"]);
        });
        it("is array", () => {
            const result = Data.dataReverse([
                "house",
                "roof",
                ["doors", "table"],
                "floor",
            ]);
            expect(result).toEqual([
                "floor",
                ["doors", "table"],
                "roof",
                "house",
            ]);
        });
    });

    describe("dataPad", () => {
        it("is object", () => {
            const result = Data.dataPad({ a: 1, b: 2 }, 4, 0);
            expect(Object.keys(result)).toEqual(["0", "1", "a", "b"]);
        });
        it("is array", () => {
            const result = Data.dataPad([1, 2, 3, 4, 5], 7, 0);
            expect(result).toEqual([1, 2, 3, 4, 5, 0, 0]);
        });

        it("numbers negative pad slots from zero for object-backed data", () => {
            // PHP-verified: array_pad(["a"=>1,"b"=>2], -5, 0) ->
            // {"0":0,"1":0,"2":0,"a":1,"b":2} (docs/php-parity/task-07-pad-union.json).
            const result = Data.dataPad({ a: 1, b: 2 }, -5, 0);
            expect(result).toEqual({ 0: 0, 1: 0, 2: 0, a: 1, b: 2 });
        });

        it("returns a copy even when no padding is needed for object-backed data", () => {
            const data = { a: 1, b: 2 };
            expect(Data.dataPad(data, 2, 0)).not.toBe(data);
        });
    });

    describe("dataPartition", () => {
        it("is object", () => {
            const [passing2, failing2] = Data.dataPartition(
                { a: 1, b: 2, c: 3 },
                (value) => value > 1,
            );
            expect(passing2).toEqual({ b: 2, c: 3 });
            expect(failing2).toEqual({ a: 1 });
        });
        it("is array", () => {
            const [passing, failing] = Data.dataPartition(
                [1, 2, 3, 4],
                (value) => value > 2,
            );
            expect(passing).toEqual([3, 4]);
            expect(failing).toEqual([1, 2]);
        });
    });

    describe("dataWhereNotNull", () => {
        it("is object", () => {
            expect(Data.dataWhereNotNull({ a: 1, b: null, c: 2 })).toEqual({
                a: 1,
                c: 2,
            });
        });
        it("is array", () => {
            expect(Data.dataWhereNotNull([1, null, 2, null, 3])).toEqual([
                1, 2, 3,
            ]);
        });
    });

    describe("dataValues", () => {
        it("is object", () => {
            expect(Data.dataValues({ a: 1, b: 2, c: 3 })).toEqual([1, 2, 3]);
        });
        it("is array", () => {
            expect(Data.dataValues([1, 2, 3])).toEqual([1, 2, 3]);
        });
    });

    describe("dataKeys", () => {
        it("is object", () => {
            expect(Data.dataKeys({ a: 1, b: 2, c: 3 })).toEqual([
                "a",
                "b",
                "c",
            ]);
        });
        it("is array", () => {
            expect(Data.dataKeys([1, 2, 3])).toEqual([0, 1, 2]);
        });

        it("reports the same number of keys as dataValues for object-backed data", () => {
            const data = Object.defineProperty({ a: 1 }, "hidden", {
                value: 2,
                enumerable: false,
            });
            expect(Data.dataKeys(data).length).toBe(
                Data.dataValues(data).length,
            );
        });
    });

    describe("dataFilter", () => {
        it("is object", () => {
            expect(
                Data.dataFilter(
                    { a: 1, b: 2, c: 3, d: 4 },
                    (value) => value > 2,
                ),
            ).toEqual({ c: 3, d: 4 });
        });
        it("is array", () => {
            expect(Data.dataFilter([1, 2, 3, 4], (value) => value > 2)).toEqual(
                [3, 4],
            );
        });

        // array_filter's falsy set is narrower than Boolean — PHP-verified
        // (docs/php-parity/task-04-shared.json, "Collection::filter() falsy set"): it
        // drops "0", "", 0, [], false, null, but keeps "00" and "0.0".
        it("drops PHP-falsy values including the string zero — both shapes agree", () => {
            expect(Data.dataFilter(["0", "", 0, "x"])).toEqual(["x"]);
            expect(Data.dataFilter({ a: "0", b: "", c: 0, d: "x" })).toEqual({
                d: "x",
            });
        });

        it("keeps strings that merely look like zero — both shapes agree", () => {
            expect(Data.dataFilter(["00", "0.0", "0"])).toEqual(["00", "0.0"]);
            expect(Data.dataFilter({ a: "00", b: "0.0", c: "0" })).toEqual({
                a: "00",
                b: "0.0",
            });
        });

        // The arr/obj layers pin NaN's truthiness — add it here too, both shapes.
        it("keeps NaN, which is truthy in PHP — both shapes agree", () => {
            expect(Data.dataFilter([NaN, 0, 1])).toEqual([NaN, 1]);
            expect(Data.dataFilter({ a: NaN, b: 0, c: 1 })).toEqual({
                a: NaN,
                c: 1,
            });
        });
    });

    describe("dataMap", () => {
        it("is object", () => {
            expect(
                Data.dataMap({ a: 1, b: 2, c: 3 }, (value) => value * 2),
            ).toEqual({ a: 2, b: 4, c: 6 });
        });
        it("is array", () => {
            expect(Data.dataMap([1, 2, 3], (value) => value * 2)).toEqual([
                2, 4, 6,
            ]);
        });
    });

    describe("dataFirst", () => {
        it("is object", () => {
            expect(Data.dataFirst({ a: 1, b: 2, c: 3 })).toBe(1);
            expect(
                Data.dataFirst({ a: 1, b: 2, c: 3 }, (value) => value > 1),
            ).toBe(2);
            expect(
                Data.dataFirst({ a: 1, b: 2, c: 3 }, (value) => value > 3, 42),
            ).toBe(42);

            expect(
                Data.dataFirst(
                    { a: 1, b: 2, c: 3 },
                    (value) => value > 3,
                    undefined,
                ),
            ).toBeNull();

            // Test empty object returns null (no default)
            expect(Data.dataFirst({})).toBeNull();
            expect(Data.dataFirst({}, null, 99)).toBe(99);
        });
        it("is array", () => {
            expect(Data.dataFirst([1, 2, 3])).toBe(1);
            expect(Data.dataFirst([1, 2, 3], (value) => value > 1)).toBe(2);
            expect(Data.dataFirst([1, 2, 3], (value) => value > 3, 42)).toBe(
                42,
            );

            // Test empty array returns null when no default is provided
            // (triggers the true branch of isUndefined(result))
            expect(Data.dataFirst([])).toBeNull();
            expect(Data.dataFirst([], null)).toBeNull();

            // Test with default value
            expect(Data.dataFirst([], null, 99)).toBe(99);

            // Test callback that matches nothing without default
            expect(Data.dataFirst([1, 2, 3], (value) => value > 5)).toBeNull();
        });

        it("is a Map", () => {
            const items = new Map([
                ["first", 100],
                ["second", 200],
                ["third", 300],
            ]);

            expect(Data.dataFirst(items)).toBe(100);
            expect(
                Data.dataFirst(items, (_value, key) => key === "second"),
            ).toBe(200);
            expect(
                Data.dataFirst(items, (value) => value > 500, "default"),
            ).toBe("default");
            expect(Data.dataFirst(new Map(), null, "default")).toBe("default");
        });

        it("is an iterable", () => {
            const items = () =>
                (function* () {
                    yield 100;
                    yield 200;
                    yield 300;
                })();

            expect(Data.dataFirst(items())).toBe(100);
            expect(Data.dataFirst(items(), (value) => value > 150)).toBe(200);
            expect(Data.dataFirst(new Set([100, 200]))).toBe(100);
            expect(Data.dataFirst(new Set<number>(), null, "default")).toBe(
                "default",
            );
        });

        it("treats scalars as single positional items", () => {
            // Strings stay scalar rather than being walked character by
            // character, matching how PHP treats a string passed as iterable
            expect(Data.dataFirst("abc" as never)).toBe("abc");
            expect(Data.dataFirst(5 as never)).toBe(5);

            // Missing data resolves to the default, like null does
            expect(Data.dataFirst(undefined as never, null, "default")).toBe(
                "default",
            );
            expect(Data.dataFirst(null as never, null, "default")).toBe(
                "default",
            );
        });
    });

    describe("dataLast", () => {
        it("is object", () => {
            expect(Data.dataLast({ a: 1, b: 2, c: 3 })).toBe(3);
            expect(
                Data.dataLast({ a: 1, b: 2, c: 3 }, (value) => value < 3),
            ).toBe(2);
            expect(
                Data.dataLast({ a: 1, b: 2, c: 3 }, (value) => value < 1, 42),
            ).toBe(42);

            // Test with null callback (triggers else branch)
            expect(Data.dataLast({ a: 1, b: 2, c: 3 }, null)).toBe(3);
            expect(Data.dataLast({ a: 1, b: 2, c: 3 }, null, 42)).toBe(3);

            // Test empty object returns null
            expect(Data.dataLast({}, null)).toBeNull();
            expect(Data.dataLast({}, undefined, 99)).toBe(99);
        });
        it("is array", () => {
            expect(Data.dataLast([1, 2, 3])).toBe(3);
            expect(Data.dataLast([1, 2, 3], (value) => value < 3)).toBe(2);
            expect(Data.dataLast([1, 2, 3], (value) => value < 1, 42)).toBe(42);

            // Test with null callback (triggers else branch)
            expect(Data.dataLast([1, 2, 3], null)).toBe(3);
            expect(Data.dataLast([1, 2, 3], null, 42)).toBe(3);

            // Test empty array returns null
            expect(Data.dataLast([], null)).toBeNull();
            expect(Data.dataLast([], undefined, 99)).toBe(99);
        });

        it("is a Map", () => {
            const items = new Map([
                ["first", 100],
                ["second", 200],
                ["third", 300],
            ]);

            expect(Data.dataLast(items)).toBe(300);
            expect(Data.dataLast(items, (_value, key) => key !== "third")).toBe(
                200,
            );
            expect(Data.dataLast(new Map(), null, "default")).toBe("default");
        });

        it("is an iterable", () => {
            const items = () =>
                (function* () {
                    yield 100;
                    yield 200;
                    yield 300;
                })();

            expect(Data.dataLast(items())).toBe(300);
            expect(Data.dataLast(items(), (value) => value < 300)).toBe(200);
            expect(Data.dataLast(new Set([100, 200]))).toBe(200);
            expect(Data.dataLast(new Set<number>(), null, "default")).toBe(
                "default",
            );
        });

        it("treats scalars as single positional items", () => {
            expect(Data.dataLast("abc" as never)).toBe("abc");
            expect(Data.dataLast(5 as never)).toBe(5);
            expect(Data.dataLast(undefined as never, null, "default")).toBe(
                "default",
            );
            expect(Data.dataLast(null as never, null, "default")).toBe(
                "default",
            );
        });
    });

    describe("dataContains", () => {
        it("is object", () => {
            expect(Data.dataContains({ a: 1, b: 2, c: 3 }, 2)).toBe(true);
            expect(Data.dataContains({ a: 1, b: 2, c: 3 }, 42)).toBe(false);
            expect(
                Data.dataContains({ a: 1, b: 2, c: 3 }, (value) => value > 2),
            ).toBe(true);
            expect(
                Data.dataContains({ a: 1, b: 2, c: 3 }, (value) => value > 3),
            ).toBe(false);
        });
        it("is array", () => {
            expect(Data.dataContains([1, 2, 3], 2)).toBe(true);
            expect(Data.dataContains([1, 2, 3], 42)).toBe(false);
            expect(Data.dataContains([1, 2, 3], (value) => value > 2)).toBe(
                true,
            );
            expect(Data.dataContains([1, 2, 3], (value) => value > 3)).toBe(
                false,
            );
        });
    });

    describe("dataDiff", () => {
        it("is object", () => {
            expect(
                Data.dataDiff<number, string>(
                    { a: 1, b: 2, c: 3 },
                    { b: 2, c: 3, d: 4 },
                ),
            ).toEqual({ a: 1 });
        });
        it("is array", () => {
            expect(Data.dataDiff([1, 2, 3], [2, 3, 4])).toEqual([1]);
        });

        it("diffs on values only regardless of backing", () => {
            // Captured via docs/php-parity/task-06-setops.json ("diff — values only"):
            // neither "id" nor "first_word" exists as a key on `other`, so an
            // assoc-style diff would keep both.
            expect(
                Data.dataDiff({ id: 1, first_word: "Hello" }, { x: "Hello" }),
            ).toEqual({ id: 1 });
            expect(Data.dataDiff([1, 20], [99, 20])).toEqual([1]);
        });

        it("treats a null other as an unchanged copy rather than throwing", () => {
            expect(Data.dataDiff({ id: 1 }, null)).toEqual({ id: 1 });
        });

        it("treats a null/undefined other as empty for array-backed data too", () => {
            // Exercises the array branch's explicit nullish check (arrWrap(undefined)
            // would otherwise wrap it to [undefined] instead of [], see the source doc
            // comment).
            expect(Data.dataDiff([1, 2], null)).toEqual([1, 2]);
            expect(Data.dataDiff([1, 2], undefined)).toEqual([1, 2]);
        });

        it("diffs an object against a list by value, as PHP does", () => {
            // PHP-verified via docs/php-parity/task-06-setops.json ("diff and
            // intersect accept any array operand"): collect(['a'=>10,'b'=>20])
            // ->diff([20]) === ['a'=>10]; collect([10,20])->diff(['x'=>20]) === [10].
            expect(Data.dataDiff({ a: 10, b: 20 }, [20])).toEqual({ a: 10 });
            expect(Data.dataDiff([10, 20], { x: 20 })).toEqual([10]);
        });
    });

    describe("dataPluck", () => {
        it("is object", () => {
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
        it("is array", () => {
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
        });

        it("plucks a wildcard path the same way for array and object backing", () => {
            // dataPluck routes object input to Obj.pluck and array input to Arr.pluck.
            // The wildcard target here is a plain object, not a JS array: a list-shaped
            // target cannot catch arr's wildcard resolving an object target to [].
            const shape = { meta: { x: { v: 1 }, y: { v: 2 } } };
            const expected = [[1, 2]];
            expect(Data.dataPluck({ a: shape }, "meta.*.v")).toEqual(expected);
            expect(Data.dataPluck([shape], "meta.*.v")).toEqual(expected);
        });
    });

    describe("dataPop", () => {
        it("is object", () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = Data.dataPop(obj, 2);
            expect(result).toEqual([3, 2]);
            expect(obj).toEqual({ a: 1 });

            // Test with default count (1)
            const obj2 = { x: 10, y: 20 };
            const result2 = Data.dataPop(obj2);
            expect(result2).toBe(20);
            expect(obj2).toEqual({ x: 10 });
        });
        it("is array", () => {
            const arr = [1, 2, 3];
            const result = Data.dataPop(arr, 2);
            expect(result).toEqual([3, 2]);
            expect(arr).toEqual([1]);

            // Test with default count (1)
            const arr2 = [10, 20, 30];
            const result2 = Data.dataPop(arr2);
            expect(result2).toBe(30);
            expect(arr2).toEqual([10, 20]);
        });
    });

    describe("dataIntersect", () => {
        it("is object", () => {
            const obj1 = { a: 1, b: 2, c: 3 };
            const obj2 = { b: 2, c: 4 };
            const result = Data.dataIntersect(obj1, obj2);
            expect(result).toEqual({ b: 2 });
        });
        it("is array", () => {
            const data1 = [1, 2, 3, 4];
            const data2 = [3, 4, 5, 6];
            const result = Data.dataIntersect(data1, data2);
            expect(result).toEqual([3, 4]);
        });
        it("accepts an operand of any shape, like diff", () => {
            // A mismatched shape threw "Data to intersect must be of the same type".
            // PHP-verified in docs/php-parity/task-06-setops.json ("diff and intersect
            // accept any array operand"): array_intersect compares by value only.
            expect(Data.dataIntersect({ a: 1, b: 2 }, [2])).toEqual({ b: 2 });
            expect(Data.dataIntersect([10, 20], { x: 20 })).toEqual([20]);
        });

        it("intersects on values only regardless of backing", () => {
            // Captured via docs/php-parity/task-06-setops.json ("intersect — values
            // only, left keys"): the keys differ ("first_word" vs "first_world") and
            // the value still matches, keeping the left key.
            expect(
                Data.dataIntersect(
                    { id: 1, first_word: "Hello" },
                    { first_world: "Hello", last_word: "World" },
                ),
            ).toEqual({ first_word: "Hello" });
            expect(Data.dataIntersect([1, 20], [99, 20])).toEqual([20]);
        });

        it("treats a null/undefined other as empty rather than throwing", () => {
            expect(Data.dataIntersect({ a: 1 }, null)).toEqual({});
            expect(Data.dataIntersect([1, 2], null)).toEqual([]);
            expect(Data.dataIntersect({ a: 1 }, undefined)).toEqual({});
        });
    });

    describe("dataIntersectByKeys", () => {
        it("is object", () => {
            const obj1 = { a: 1, b: 2, c: 3 };
            const obj2 = { b: 20, d: 40 };
            const result = Data.dataIntersectByKeys(obj1, obj2);
            expect(result).toEqual({ b: 2 });
        });
        it("is array", () => {
            const data1 = [1, 3, 5];
            const data2 = [2, 4];
            const result = Data.dataIntersectByKeys(data1, data2);
            expect(result).toEqual([1, 3]);
        });
        it("throws when values do not match type", () => {
            expect(() => {
                Data.dataIntersectByKeys({ a: 1, b: 2 }, [2, 3]);
            }).toThrowError();
        });

        it("treats a null other as empty rather than throwing", () => {
            expect(Data.dataIntersectByKeys({ name: "M" }, null)).toEqual({});
            expect(Data.dataIntersectByKeys([1, 2], null)).toEqual([]);
        });
    });

    describe("dataExceptValues", () => {
        it("is object", () => {
            const obj1 = { name: "taylor", age: 26, city: "austin" };
            const result1 = Data.dataExceptValues(obj1, [26]);
            expect(result1).toEqual({ name: "taylor", city: "austin" });

            const result2 = Data.dataExceptValues(obj1, 26);
            expect(result2).toEqual({ name: "taylor", city: "austin" });

            const obj2 = { a: 1, b: 2, c: 1, d: 3 };
            const result3 = Data.dataExceptValues(obj2, 1);
            expect(result3).toEqual({ b: 2, d: 3 });

            const obj3 = { a: true, b: false, c: 1, d: 0 };
            const result4 = Data.dataExceptValues(obj3, [1, 0], true);
            expect(result4).toEqual({ a: true, b: false });

            const result5 = Data.dataExceptValues(obj3, [1, 0]);
            expect(result5).toEqual({});
        });

        it("is array", () => {
            const arr1 = ["foo", "bar", "baz", "qux"];
            const result1 = Data.dataExceptValues(arr1, ["foo", "baz"]);
            expect(result1).toEqual(["bar", "qux"]);

            const result2 = Data.dataExceptValues(arr1, "baz");
            expect(result2).toEqual(["foo", "bar", "qux"]);

            const arr2 = [1, 2, 3, 4, 5];
            const result3 = Data.dataExceptValues(arr2, [3, 4]);
            expect(result3).toEqual([1, 2, 5]);

            const arr3: unknown[] = [];
            const result4 = Data.dataExceptValues(arr3, "foo");
            expect(result4).toEqual([]);

            const arr4 = ["foo", "bar"];
            const result5 = Data.dataExceptValues(arr4, []);
            expect(result5).toEqual(["foo", "bar"]);

            const arr5 = [1, "1", 2, "2", 3];
            const result6 = Data.dataExceptValues(arr5, [1, 2, 3], true);
            expect(result6).toEqual(["1", "2"]);

            const result7 = Data.dataExceptValues(arr5, [1, 2, 3]);
            expect(result7).toEqual([]);
        });
    });

    describe("dataDiffAssoc", () => {
        it("is object", () => {
            const result = Data.dataDiffAssoc(
                { a: "green", b: "brown" },
                { a: "green", b: "yellow" },
            );
            expect(result).toEqual({ b: "brown" });
        });

        it("is array", () => {
            expect(Data.dataDiffAssoc([1, 2, 3], [1, 9, 3])).toEqual([2]);
        });
    });

    describe("dataDiffAssocUsing", () => {
        it("is object", () => {
            const result = Data.dataDiffAssocUsing(
                { a: "green", b: "brown" },
                { A: "green", c: "blue" },
                strcasecmp,
            );
            expect(result).toEqual({ b: "brown" });
        });

        it("is array — compares by index (key) via the callback, then value", () => {
            // PHP-verified directly : array_diff_uassoc([1,2,3],[2,3,4],strcasecmp) ->
            // [1,2,3].
            const result = Data.dataDiffAssocUsing(
                [1, 2, 3],
                [2, 3, 4],
                strcasecmp,
            );
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe("dataDiffKeysUsing", () => {
        it("is object", () => {
            const result = Data.dataDiffKeysUsing(
                { id: 1, first_word: "Hello" },
                { ID: 123, foo_bar: "Hello" },
                strcasecmp,
            );
            expect(result).toEqual({ first_word: "Hello" });
        });

        it("is array — compares by index (key) via the callback only", () => {
            // PHP-verified directly : array_diff_ukey([1,2,3],[2,3,4],strcasecmp) -> []
            // (values are ignored entirely; every index 0-2 matches positionally, so
            // every entry is excluded).
            const result = Data.dataDiffKeysUsing(
                [1, 2, 3],
                [2, 3, 4],
                strcasecmp,
            );
            expect(result).toEqual([]);
        });
    });

    describe("dataIntersectAssoc", () => {
        it("is object", () => {
            const result = Data.dataIntersectAssoc(
                { a: "green", b: "brown" },
                { a: "green", b: "yellow" },
            );
            expect(result).toEqual({ a: "green" });
        });

        it("is array", () => {
            const result = Data.dataIntersectAssoc([1, 2, 3], [1, 2, 4]);
            expect(result).toEqual([1, 2]);

            const result2 = Data.dataIntersectAssoc([1, 2, 3], [2, 3, 4]);
            expect(result2).toEqual([]);
        });

        it("throws when values do not match type", () => {
            expect(() => {
                Data.dataIntersectAssoc({ a: 1, b: 2 }, [2]);
            }).toThrowError(
                "Data to intersect must be of the same type (both array or both object).",
            );
        });

        it("treats a null other as empty rather than throwing", () => {
            expect(Data.dataIntersectAssoc({ a: "green" }, null)).toEqual({});
            expect(Data.dataIntersectAssoc([1, 2], null)).toEqual([]);
        });
    });

    describe("dataIntersectAssocUsing", () => {
        it("is object", () => {
            const strcasecmpKeys = (a: unknown, b: unknown) =>
                String(a).toLowerCase() === String(b).toLowerCase();
            const result = Data.dataIntersectAssocUsing(
                { a: "green", b: "brown" },
                { A: "GREEN", B: "brown" },
                strcasecmpKeys,
            );
            expect(result).toEqual({ b: "brown" });
        });

        it("is array", () => {
            const indexCallback = (a: number, b: number) => a === b;
            const result = Data.dataIntersectAssocUsing(
                [1, 2, 3],
                [1, 2, 4],
                indexCallback,
            );
            expect(result).toEqual([1, 2]);
        });

        it("throws when values do not match type", () => {
            const strcasecmpKeys = (a: unknown, b: unknown) =>
                String(a).toLowerCase() === String(b).toLowerCase();
            expect(() => {
                Data.dataIntersectAssocUsing(
                    { a: 1, b: 2 },
                    [2],
                    strcasecmpKeys,
                );
            }).toThrowError(
                "Data to intersect must be of the same type (both array or both object).",
            );
        });

        it("treats a null other as empty rather than throwing", () => {
            const strcasecmpKeys = (a: unknown, b: unknown) =>
                String(a).toLowerCase() === String(b).toLowerCase();
            expect(
                Data.dataIntersectAssocUsing(
                    { a: "green" },
                    null,
                    strcasecmpKeys,
                ),
            ).toEqual({});
            expect(
                Data.dataIntersectAssocUsing(
                    [1, 2],
                    null,
                    (a: number, b: number) => a === b,
                ),
            ).toEqual([]);
        });
    });

    describe("dataOnlyValues", () => {
        it("is object", () => {
            const obj1 = { name: "taylor", age: 26, city: "austin" };
            const result1 = Data.dataOnlyValues(obj1, [26]);
            expect(result1).toEqual({ age: 26 });

            const result2 = Data.dataOnlyValues(obj1, 26);
            expect(result2).toEqual({ age: 26 });

            const obj2 = { a: 1, b: 2, c: 1, d: 3 };
            const result3 = Data.dataOnlyValues(obj2, 1);
            expect(result3).toEqual({ a: 1, c: 1 });

            const obj3 = { a: true, b: false, c: 1, d: 0 };
            const result4 = Data.dataOnlyValues(obj3, [1, 0], true);
            expect(result4).toEqual({ c: 1, d: 0 });

            const result5 = Data.dataOnlyValues(obj3, [1, 0]);
            expect(result5).toEqual({ a: true, b: false, c: 1, d: 0 });
        });

        it("is array", () => {
            const arr1 = ["foo", "bar", "baz", "qux"];
            const result1 = Data.dataOnlyValues(arr1, ["foo", "baz"]);
            expect(result1).toEqual(["foo", "baz"]);

            const result2 = Data.dataOnlyValues(arr1, "baz");
            expect(result2).toEqual(["baz"]);

            const arr2 = [1, 2, 3, 4, 5];
            const result3 = Data.dataOnlyValues(arr2, [3, 4]);
            expect(result3).toEqual([3, 4]);

            const arr3: unknown[] = [];
            const result4 = Data.dataOnlyValues(arr3, "foo");
            expect(result4).toEqual([]);

            const arr4 = ["foo", "bar"];
            const result5 = Data.dataOnlyValues(arr4, []);
            expect(result5).toEqual([]);

            const arr5 = [1, "1", 2, "2", 3];
            const result6 = Data.dataOnlyValues(arr5, [1, 2, 3], true);
            expect(result6).toEqual([1, 2, 3]);

            const result7 = Data.dataOnlyValues(arr5, [1, 2, 3]);
            expect(result7).toEqual([1, "1", 2, "2", 3]);
        });
    });

    // Cross-backing agreement sweep, the plan's exit criterion: one test per
    // defect-matrix row, run over the same conceptual PHP array in both backings — a
    // real array and a plain object whose own keys are exactly that array's indices.
    describe("cross-backing agreement sweep (plan exit criterion)", () => {
        /** Own key/value pairs — the one view an array and a plain object share. */
        const entriesOf = (value: unknown): [string, unknown][] =>
            Object.entries(value as object);

        /**
         * Pin each backing's exact key/value pairs, then assert the value
         * sequence both produce is the same. `objEntries` defaults to
         * `arrEntries` for the rows where the keys match too.
         */
        function agree(
            arrResult: unknown,
            objResult: unknown,
            arrEntries: [string, unknown][],
            objEntries: [string, unknown][] = arrEntries,
        ): void {
            expect(entriesOf(arrResult)).toEqual(arrEntries);
            expect(entriesOf(objResult)).toEqual(objEntries);
            expect(Object.values(arrResult as object)).toEqual(
                Object.values(objResult as object),
            );
        }

        const nums = (): number[] => [10, 20, 30, 40];
        const numsObj = (): Record<string, number> => ({
            0: 10,
            1: 20,
            2: 30,
            3: 40,
        });
        const numsEntries: [string, unknown][] = [
            ["0", 10],
            ["1", 20],
            ["2", 30],
            ["3", 40],
        ];
        const records = () => [
            { id: 3, name: "c" },
            { id: 1, name: "a" },
            { id: 2, name: "b" },
        ];
        const recordsObj = (): Record<
            string,
            { id: number; name: string }
        > => ({
            0: { id: 3, name: "c" },
            1: { id: 1, name: "a" },
            2: { id: 2, name: "b" },
        });

        it("pop mutates and returns the last value", () => {
            // collect([10,20,30,40])->pop() -> 40, leaving [10,20,30];
            // ->pop(2) -> [40,30], leaving [10,20].
            const arrOne = nums();
            const objOne = numsObj();
            expect(Arr.pop(arrOne)).toBe(40);
            expect(Obj.pop(objOne)).toBe(40);
            agree(arrOne, objOne, [
                ["0", 10],
                ["1", 20],
                ["2", 30],
            ]);

            const arrTwo = nums();
            const objTwo = numsObj();
            agree(Arr.pop(arrTwo, 2), Obj.pop(objTwo, 2), [
                ["0", 40],
                ["1", 30],
            ]);
            agree(arrTwo, objTwo, [
                ["0", 10],
                ["1", 20],
            ]);

            const arrData = nums();
            const objData = numsObj();
            expect(Data.dataPop(arrData)).toBe(40);
            expect(Data.dataPop(objData)).toBe(40);
            agree(arrData, objData, [
                ["0", 10],
                ["1", 20],
                ["2", 30],
            ]);
        });

        it("shift mutates, returns the first value and renumbers", () => {
            // collect([10,20,30,40])->shift() -> 10, leaving [20,30,40] —
            // array_shift renumbers, so {1:20,2:30,3:40} is not the answer.
            const arrOne = nums();
            const objOne = numsObj();
            expect(Arr.shift(arrOne)).toBe(10);
            expect(Obj.shift(objOne)).toBe(10);
            agree(arrOne, objOne, [
                ["0", 20],
                ["1", 30],
                ["2", 40],
            ]);

            const arrTwo = nums();
            const objTwo = numsObj();
            agree(Arr.shift(arrTwo, 2), Obj.shift(objTwo, 2), [
                ["0", 10],
                ["1", 20],
            ]);
            agree(arrTwo, objTwo, [
                ["0", 30],
                ["1", 40],
            ]);

            const arrData = nums();
            const objData = numsObj();
            expect(Data.dataShift(arrData)).toBe(10);
            expect(Data.dataShift(objData)).toBe(10);
            agree(arrData, objData, [
                ["0", 20],
                ["1", 30],
                ["2", 40],
            ]);
        });

        it("shift throws on a negative count", () => {
            const message =
                "Number of shifted items may not be less than zero.";

            expect(() => Arr.shift(nums(), -1)).toThrow(message);
            expect(() => Obj.shift(numsObj(), -1)).toThrow(message);
            expect(() => Data.dataShift(nums(), -1)).toThrow(message);
            expect(() => Data.dataShift(numsObj(), -1)).toThrow(message);
        });

        it("shift on empty returns null for any count", () => {
            // The isEmpty() guard precedes every count branch.
            expect(Arr.shift([], 3)).toBeNull();
            expect(Obj.shift({}, 3)).toBeNull();
            expect(Arr.shift([])).toBeNull();
            expect(Obj.shift({})).toBeNull();
            expect(Data.dataShift([], 3)).toBeNull();
            expect(Data.dataShift({}, 3)).toBeNull();
        });

        it("push agrees on the array-guard message across both backings", () => {
            // dataPush([1,2,3],0,9) never threw at all, and the object path threw a
            // different, non-PHP message. PHP-verified in
            // docs/php-parity/task-12-regression-pins.json ("push requires an array at the key").
            const message =
                "Array value for key [0] must be an array, integer found.";

            expect(() => Arr.push([1, 2, 3], 0, 9)).toThrow(message);
            expect(() => Obj.push({ 0: 1, 1: 2, 2: 3 }, "0", 9)).toThrow(
                message,
            );
            expect(() => Data.dataPush([1, 2, 3], 0, 9)).toThrow(message);
            expect(() => Data.dataPush({ 0: 1, 1: 2, 2: 3 }, "0", 9)).toThrow(
                message,
            );
        });

        it("push creates the array at a missing key but rejects an explicit null", () => {
            // PHP-verified in docs/php-parity/task-12-regression-pins.json
            // ("push at a missing key creates the array" / "push through an explicit null").
            expect(Obj.push({}, "name", 9)).toEqual({ name: [9] });
            expect(Data.dataPush({}, "name", 9)).toEqual({ name: [9] });

            const nullMessage =
                "Array value for key [name] must be an array, NULL found.";
            expect(() => Obj.push({ name: null }, "name", 9)).toThrow(
                nullMessage,
            );
            expect(() => Data.dataPush({ name: null }, "name", 9)).toThrow(
                nullMessage,
            );
        });

        it("push appends into the array at the key on both backings", () => {
            // Both backings pushed the values NEXT TO the array at the key instead of
            // into it. PHP-verified in docs/php-parity/task-16-final-review.json
            // ("push appends into the array AT the key, never beside it").
            agree(
                Arr.push([["Desk"]], "0", "Chair"),
                Obj.push({ 0: ["Desk"] }, "0", "Chair"),
                [["0", ["Desk", "Chair"]]],
            );
            agree(
                Arr.push(["a", ["b"]], "1", "c", "d"),
                Obj.push({ 0: "a", 1: ["b"] }, "1", "c", "d"),
                [
                    ["0", "a"],
                    ["1", ["b", "c", "d"]],
                ],
            );
            agree(
                Data.dataPush([], "0", "value"),
                Data.dataPush({}, "0", "value"),
                [["0", ["value"]]],
            );

            // A multi-segment key creates the leaf array and pushes inside it.
            expect(Arr.push([], "0.0", "value")).toEqual([[["value"]]]);
            expect(Obj.push({}, "0.0", "value")).toEqual({
                0: { 0: ["value"] },
            });
            expect(Arr.push([[[1]]], "0.0", 9)).toEqual([[[1, 9]]]);
            expect(Obj.push({ a: { b: [1] } }, "a.b", 9)).toEqual({
                a: { b: [1, 9] },
            });
        });

        it("push appends with the next integer key when the key is null", () => {
            // docs/php-parity/task-17-second-review.json, "Arr::push with a null key on a list"
            agree(
                Data.dataPush([1, 2], null, 9),
                Data.dataPush({ 0: 1, 1: 2 }, null, 9),
                [
                    ["0", 1],
                    ["1", 2],
                    ["2", 9],
                ],
            );
        });

        it("unshift mutates and renumbers the existing integer keys", () => {
            // array_unshift([10,20,30,40],1,2) -> [1,2,10,20,30,40]. Writing
            // the prepended values at 0 and 1 destroyed 10 and 20 instead.
            const expected: [string, unknown][] = [
                ["0", 1],
                ["1", 2],
                ["2", 10],
                ["3", 20],
                ["4", 30],
                ["5", 40],
            ];

            const arrOne = nums();
            const objOne = numsObj();
            Arr.unshift(arrOne, 1, 2);
            Obj.unshift(objOne, 1, 2);
            agree(arrOne, objOne, expected);

            const arrData = nums();
            const objData = numsObj();
            Data.dataUnshift(arrData, 1, 2);
            Data.dataUnshift(objData, 1, 2);
            agree(arrData, objData, expected);
        });

        it("splice mutates and returns the removed items", () => {
            // collect([10,20,30,40])->splice(1,2) removes [20,30],
            // leaving [10,40].
            const arrSource = nums();
            const objSource = numsObj();
            agree(Arr.splice(arrSource, 1, 2), Obj.splice(objSource, 1, 2), [
                ["0", 20],
                ["1", 30],
            ]);
            agree(arrSource, objSource, [
                ["0", 10],
                ["1", 40],
            ]);

            const arrData = nums();
            const objData = numsObj();
            agree(
                Data.dataSplice(arrData, 1, 2),
                Data.dataSplice(objData, 1, 2),
                [
                    ["0", 20],
                    ["1", 30],
                ],
            );
            agree(arrData, objData, [
                ["0", 10],
                ["1", 40],
            ]);
        });

        it("splice with no length removes through to the end", () => {
            const arrSource = nums();
            const objSource = numsObj();

            agree(Arr.splice(arrSource, 1), Obj.splice(objSource, 1), [
                ["0", 20],
                ["1", 30],
                ["2", 40],
            ]);
            agree(arrSource, objSource, [["0", 10]]);
        });

        it("splice keeps string keys and reindexes integer keys", () => {
            // array_splice(['x'=>1,'y'=>2,'z'=>3],1,1) leaves {x:1,z:3} and
            // returns {y:2}; [10=>'a',20=>'b',30=>'c'] reindexes to
            // ['a','c'] and returns ['b'].
            const strings: Record<string, number> = { x: 1, y: 2, z: 3 };
            expect(entriesOf(Obj.splice(strings, 1, 1))).toEqual([["y", 2]]);
            expect(entriesOf(strings)).toEqual([
                ["x", 1],
                ["z", 3],
            ]);

            const sparse: Record<string, string> = {
                10: "a",
                20: "b",
                30: "c",
            };
            expect(entriesOf(Obj.splice(sparse, 1, 1))).toEqual([["0", "b"]]);
            expect(entriesOf(sparse)).toEqual([
                ["0", "a"],
                ["1", "c"],
            ]);
        });

        it("splice takes a bare scalar as one spliced-in element", () => {
            // array_splice([10,20,30,40],1,2,99) leaves [10,99,40].
            const arrSource = nums();
            const objSource = numsObj();

            agree(
                Arr.splice(arrSource, 1, 2, 99),
                Obj.splice(objSource, 1, 2, 99),
                [
                    ["0", 20],
                    ["1", 30],
                ],
            );
            agree(arrSource, objSource, [
                ["0", 10],
                ["1", 99],
                ["2", 40],
            ]);
        });

        it("splice with an object replacement discards its keys", () => {
            // docs/php-parity/task-17-second-review.json, "splice with an assoc replacement on a list"
            const arrSource = [1, 2, 3];
            const objSource: Record<string, number> = { 0: 1, 1: 2, 2: 3 };

            agree(
                Data.dataSplice(arrSource, 1, 1, { foo: "bar" } as never),
                Data.dataSplice(objSource, 1, 1, { foo: "bar" } as never),
                [["0", 2]],
            );
            agree(arrSource, objSource, [
                ["0", 1],
                ["1", "bar"],
                ["2", 3],
            ]);
        });

        it("replace does not mutate its source", () => {
            // array_replace([10,20,30,40],[1=>'d']) -> [10,'d',30,40].
            const arrSource = nums();
            const objSource = numsObj();
            const expected: [string, unknown][] = [
                ["0", 10],
                ["1", "d"],
                ["2", 30],
                ["3", 40],
            ];

            agree(
                Arr.replace(arrSource, { 1: "d" }),
                Obj.replace(objSource, { 1: "d" }),
                expected,
            );
            agree(arrSource, objSource, numsEntries);
        });

        it("replaceRecursive does not mutate its source", () => {
            // array_replace_recursive([['a'=>1],['b'=>2]],[['c'=>3]]) ->
            // [{a:1,c:3},{b:2}].
            const arrSource = [{ a: 1 }, { b: 2 }];
            const objSource: Record<string, Record<string, number>> = {
                0: { a: 1 },
                1: { b: 2 },
            };

            agree(
                Arr.replaceRecursive(arrSource, [{ c: 3 }]),
                Obj.replaceRecursive(objSource, { 0: { c: 3 } }),
                [
                    ["0", { a: 1, c: 3 }],
                    ["1", { b: 2 }],
                ],
            );
            agree(arrSource, objSource, [
                ["0", { a: 1 }],
                ["1", { b: 2 }],
            ]);
        });

        it("replace and replaceRecursive treat null as a no-op", () => {
            agree(
                Arr.replace(nums(), null),
                Obj.replace(numsObj(), null),
                numsEntries,
            );
            agree(
                Arr.replaceRecursive(nums(), null),
                Obj.replaceRecursive(numsObj(), null),
                numsEntries,
            );
            agree(
                Data.dataReplace(nums(), null),
                Data.dataReplace(numsObj(), null),
                numsEntries,
            );
        });

        it("intersect compares values only", () => {
            // collect([10,20,30,40])->intersect([20,40]) -> {1:20,3:40}.
            agree(
                Arr.intersect(nums(), [20, 40]),
                Obj.intersect(numsObj(), { 0: 20, 1: 40 }),
                [
                    ["0", 20],
                    ["1", 40],
                ],
                [
                    ["1", 20],
                    ["3", 40],
                ],
            );
            agree(
                Data.dataIntersect(nums(), [20, 40]),
                Data.dataIntersect(numsObj(), { 0: 20, 1: 40 }),
                [
                    ["0", 20],
                    ["1", 40],
                ],
                [
                    ["1", 20],
                    ["3", 40],
                ],
            );
        });

        it("diff compares values only", () => {
            // collect([10,20,30,40])->diff([20,40]) -> {0:10,2:30}.
            agree(
                Arr.diff(nums(), [20, 40]),
                Obj.diff(numsObj(), { 0: 20, 1: 40 }),
                [
                    ["0", 10],
                    ["1", 30],
                ],
                [
                    ["0", 10],
                    ["2", 30],
                ],
            );
            agree(
                Data.dataDiff(nums(), [20, 40]),
                Data.dataDiff(numsObj(), { 0: 20, 1: 40 }),
                [
                    ["0", 10],
                    ["1", 30],
                ],
                [
                    ["0", 10],
                    ["2", 30],
                ],
            );
        });

        it("diff also compares values across a mismatched operand shape (C5)", () => {
            // Every other row above pairs same-shape operands. PHP-verified via
            // docs/php-parity/task-06-setops.json ("diff and intersect accept any
            // array operand"): array_diff compares by value only, so shape doesn't matter.
            expect(Data.dataDiff({ a: 10, b: 20 }, [20])).toEqual({ a: 10 });
            expect(Data.dataDiff([10, 20], { x: 20 })).toEqual([10]);
        });

        it("diff wraps a scalar operand the same way on both backings", () => {
            // The array branch wrapped the scalar and the object branch treated it as
            // empty, so the two disagreed on the same call. PHP-verified:
            // docs/php-parity/task-16-final-review.json ("diff accepts an operand of any shape").
            expect(Arr.diff([1, "x"], "x")).toEqual([1]);
            expect(Obj.diff({ a: 1, b: "x" }, "x")).toEqual({ a: 1 });
            expect(Data.dataDiff([1, "x"], "x")).toEqual([1]);
            expect(Data.dataDiff({ a: 1, b: "x" }, "x")).toEqual({ a: 1 });
        });

        it("diffAssocUsing and diffKeysUsing run their comparator", () => {
            // array_diff_uassoc([10,20,30,40],[10,999,30,40],cmp) -> {1:20};
            // array_diff_ukey([10,20,30,40],[1=>'x',3=>'y'],cmp) -> {0:10,2:30}.
            const same = (a: PropertyKey, b: PropertyKey) => a === b;
            const sparseArray = Object.assign([] as unknown[], {
                1: "x",
                3: "y",
            });

            agree(
                Data.dataDiffAssocUsing(nums(), [10, 999, 30, 40], same),
                Data.dataDiffAssocUsing(
                    numsObj(),
                    { 0: 10, 1: 999, 2: 30, 3: 40 },
                    same,
                ),
                [["0", 20]],
                [["1", 20]],
            );
            const numsMixed: Record<string, unknown> = numsObj();
            agree(
                Data.dataDiffKeysUsing(nums(), sparseArray, same),
                Data.dataDiffKeysUsing(numsMixed, { 1: "x", 3: "y" }, same),
                [
                    ["0", 10],
                    ["1", 30],
                ],
                [
                    ["0", 10],
                    ["2", 30],
                ],
            );
        });

        it("intersect also compares values across a mismatched operand shape", () => {
            // The row diff's own mismatched-shape case sits next to: intersect kept
            // the same-type guard until the final review. PHP-verified:
            // docs/php-parity/task-06-setops.json ("diff and intersect accept any array operand").
            expect(Arr.intersect([10, 20], { x: 20 })).toEqual([20]);
            expect(Obj.intersect({ a: 1, b: 2 }, [2])).toEqual({ b: 2 });
            expect(Data.dataIntersect([10, 20], { x: 20 })).toEqual([20]);
            expect(Data.dataIntersect({ a: 1, b: 2 }, [2])).toEqual({ b: 2 });
        });

        it("the intersect family treats null as empty", () => {
            agree(
                Arr.intersect(nums(), null),
                Obj.intersect(numsObj(), null),
                [],
            );
            agree(
                Arr.intersectAssoc(nums(), null),
                Obj.intersectAssoc(numsObj(), null),
                [],
            );
            agree(
                Arr.intersectByKeys(nums(), null),
                Obj.intersectByKeys(numsObj(), null),
                [],
            );
        });

        it("intersectAssoc, intersectAssocUsing and intersectByKeys", () => {
            // array_intersect_assoc([10,20,30,40],[10,999,30]) -> {0:10,2:30};
            // array_intersect_key([10,20,30,40],[1=>'x',3=>'y']) -> {1:20,3:40}.
            const same = (a: PropertyKey, b: PropertyKey) => a === b;
            const sparseArray = Object.assign([] as unknown[], {
                1: "x",
                3: "y",
            });

            agree(
                Arr.intersectAssoc(nums(), [10, 999, 30]),
                Obj.intersectAssoc(numsObj(), { 0: 10, 1: 999, 2: 30 }),
                [
                    ["0", 10],
                    ["1", 30],
                ],
                [
                    ["0", 10],
                    ["2", 30],
                ],
            );
            agree(
                Arr.intersectAssocUsing(nums(), [10, 999, 30], same),
                Obj.intersectAssocUsing(
                    numsObj(),
                    { 0: 10, 1: 999, 2: 30 },
                    same,
                ),
                [
                    ["0", 10],
                    ["1", 30],
                ],
                [
                    ["0", 10],
                    ["2", 30],
                ],
            );
            agree(
                Arr.intersectByKeys(nums(), sparseArray),
                Obj.intersectByKeys(numsObj(), { 1: "x", 3: "y" }),
                [
                    ["0", 20],
                    ["1", 40],
                ],
                [
                    ["1", 20],
                    ["3", 40],
                ],
            );
        });

        it("slice handles a negative offset with a length", () => {
            // collect([10,20,30,40])->slice(-3,2) -> {1:20,2:30}.
            agree(
                Arr.slice(nums(), -3, 2),
                Obj.slice(numsObj(), -3, 2),
                [
                    ["0", 20],
                    ["1", 30],
                ],
                [
                    ["1", 20],
                    ["2", 30],
                ],
            );
        });

        it("filter drops PHP-falsy '0' but keeps '00' and '0.0'", () => {
            const mixed = ["0", "00", "0.0", "", 0, false, null, [], "a"];
            const mixedObj: Record<string, unknown> = {
                0: "0",
                1: "00",
                2: "0.0",
                3: "",
                4: 0,
                5: false,
                6: null,
                7: [],
                8: "a",
            };

            agree(
                Arr.filter(mixed),
                Obj.filter(mixedObj),
                [
                    ["0", "00"],
                    ["1", "0.0"],
                    ["2", "a"],
                ],
                [
                    ["1", "00"],
                    ["2", "0.0"],
                    ["8", "a"],
                ],
            );
        });

        it("pad numbers negative pad slots from zero", () => {
            // array_pad(['a'=>1,'b'=>2],-5,0) -> {0:0,1:0,2:0,a:1,b:2};
            // array_pad([10,20,30,40],-6,0) -> [0,0,10,20,30,40].
            expect(entriesOf(Obj.pad({ a: 1, b: 2 }, -5, 0))).toEqual([
                ["0", 0],
                ["1", 0],
                ["2", 0],
                ["a", 1],
                ["b", 2],
            ]);
            agree(Arr.pad(nums(), -6, 0), Obj.pad(numsObj(), -6, 0), [
                ["0", 0],
                ["1", 0],
                ["2", 10],
                ["3", 20],
                ["4", 30],
                ["5", 40],
            ]);
        });

        it("positive padding appends past the existing keys", () => {
            // array_pad([10,20,30,40],6,0) -> [10,20,30,40,0,0]. Numbering
            // the pad slots from 0 overwrote the first two entries, which a
            // value-list assertion could not see.
            agree(Arr.pad(nums(), 6, 0), Obj.pad(numsObj(), 6, 0), [
                ["0", 10],
                ["1", 20],
                ["2", 30],
                ["3", 40],
                ["4", 0],
                ["5", 0],
            ]);
            agree(Data.dataPad(nums(), 6, 0), Data.dataPad(numsObj(), 6, 0), [
                ["0", 10],
                ["1", 20],
                ["2", 30],
                ["3", 40],
                ["4", 0],
                ["5", 0],
            ]);
        });

        it("pad returns a copy when no padding is needed", () => {
            const source = numsObj();
            const result = Obj.pad(source, 2, 0);

            expect(result).not.toBe(source);
            agree(Arr.pad(nums(), 2, 0), result, numsEntries);
        });

        it("combine throws on a key/value count mismatch", () => {
            const message =
                "array_combine(): Argument #1 ($keys) and argument #2 ($values) must have the same number of elements";

            expect(() => Arr.combine(["a", "b"], [1])).toThrow(message);
            expect(() => Obj.combine({ 0: "a", 1: "b" }, { 0: 1 })).toThrow(
                message,
            );
            agree(
                Arr.combine(["a", "b", "c"], [1, 2, 3]),
                Obj.combine({ 0: "a", 1: "b", 2: "c" }, { 0: 1, 1: 2, 2: 3 }),
                [
                    ["a", 1],
                    ["b", 2],
                    ["c", 3],
                ],
            );
        });

        it("union lets the left operand win, null value included", () => {
            // ['a'=>null] + ['a'=>1] -> {a:null}; collect([10,20])
            // ->union([1,1,50,60]) -> [10,20,50,60].
            expect(entriesOf(Obj.union({ a: undefined }, { a: 1 }))).toEqual([
                ["a", undefined],
            ]);
            agree(
                Arr.union([10, 20], [1, 1, 50, 60]),
                Obj.union({ 0: 10, 1: 20 }, { 0: 1, 1: 1, 2: 50, 3: 60 }),
                [
                    ["0", 10],
                    ["1", 20],
                    ["2", 50],
                    ["3", 60],
                ],
            );
        });

        it("union treats a nullish operand as empty", () => {
            // getArrayableItems casts null to [], so collect([10,20])
            // ->union(null) -> [10,20] on either backing.
            agree(
                Arr.union(nums(), null),
                Obj.union(numsObj(), null),
                numsEntries,
            );
            agree(
                Data.dataUnion(nums(), null),
                Data.dataUnion(numsObj(), null),
                numsEntries,
            );
        });

        it("query casts booleans to 1 and 0", () => {
            expect(Arr.query({ a: true, b: false })).toBe("a=1&b=0");
            expect(Obj.query({ a: true, b: false })).toBe("a=1&b=0");
            expect(Arr.query(["a", "b"])).toBe("0=a&1=b");
            expect(Obj.query({ 0: "a", 1: "b" })).toBe("0=a&1=b");
            expect(Data.dataQuery(["a", "b"])).toBe("0=a&1=b");
            expect(Data.dataQuery({ 0: "a", 1: "b" })).toBe("0=a&1=b");
        });

        it("the CSS helpers emit the value for numeric keys", () => {
            expect(Arr.toCssClasses(["font-bold", "text-red"])).toBe(
                "font-bold text-red",
            );
            expect(Obj.toCssClasses({ 0: "font-bold", 1: "text-red" })).toBe(
                "font-bold text-red",
            );
            expect(Arr.toCssStyles(["color:red", "font-size:14px"])).toBe(
                "color:red; font-size:14px;",
            );
            expect(
                Obj.toCssStyles({ 0: "color:red", 1: "font-size:14px" }),
            ).toBe("color:red; font-size:14px;");
            expect(Data.dataToCssClasses(["font-bold", "text-red"])).toBe(
                "font-bold text-red",
            );
            expect(
                Data.dataToCssClasses({ 0: "font-bold", 1: "text-red" }),
            ).toBe("font-bold text-red");
        });

        it("random throws before the empty guard", () => {
            const message =
                "You requested 1 items, but there are only 0 items available.";

            expect(() => Arr.random([], 1)).toThrow(message);
            expect(() => Obj.random({}, 1)).toThrow(message);
            expect(() => Data.dataRandom([], 1)).toThrow(message);
            expect(() => Data.dataRandom({}, 1)).toThrow(message);
        });

        it("random's preserveKeys defaults to false", () => {
            // No value pin: random is non-deterministic by design. The keys
            // are the deterministic part — reindexed unless asked otherwise.
            expect(Object.keys(Arr.random(nums(), 2) as object)).toEqual([
                "0",
                "1",
            ]);
            expect(Object.keys(Obj.random(numsObj(), 2) as object)).toEqual([
                "0",
                "1",
            ]);
            expect(
                Object.keys(Obj.random(numsObj(), 2, true) as object).every(
                    (key) => Object.hasOwn(numsObj(), key),
                ),
            ).toBe(true);
        });

        it("only accepts a bare key and null", () => {
            // Arr::only([10,20,30,40],1) -> {1:20}; with null -> [].
            agree(
                Arr.only(nums(), 1),
                Obj.only(numsObj(), "1"),
                [["0", 20]],
                [["1", 20]],
            );
            agree(Arr.only(nums(), null), Obj.only(numsObj(), null), []);
            agree(
                Arr.only(nums(), [1, 3]),
                Obj.only(numsObj(), ["1", "3"]),
                [
                    ["0", 20],
                    ["1", 40],
                ],
                [
                    ["1", 20],
                    ["3", 40],
                ],
            );
        });

        it("get, has and exists resolve a literal dotted key first", () => {
            const dotted = { "a.b": "literal", a: { b: "nested" } };

            expect(Obj.get(dotted, "a.b")).toBe("literal");
            expect(Obj.has(dotted, "a.b")).toBe(true);
            expect(Obj.exists(dotted, "a.b")).toBe(true);

            expect(Arr.get(nums(), 2)).toBe(30);
            expect(Obj.get(numsObj(), 2)).toBe(30);
            expect(Arr.has(nums(), 2)).toBe(true);
            expect(Obj.has(numsObj(), 2)).toBe(true);
            expect(Arr.exists(nums(), 2)).toBe(true);
            expect(Obj.exists(numsObj(), 2)).toBe(true);
            expect(Data.dataExists(nums(), 2)).toBe(true);
            expect(Data.dataExists(numsObj(), 2)).toBe(true);
            expect(Data.dataExists(nums(), 9)).toBe(false);
            expect(Data.dataExists(numsObj(), 9)).toBe(false);
        });

        it("pluck supports keyed and wildcard paths", () => {
            // Arr::pluck(records,'name','id') -> {3:'c',1:'a',2:'b'}; JS
            // hoists those integer keys ascending, so the pairs are the
            // same and only the iteration order differs.
            const nested = [{ posts: [{ title: "p1" }, { title: "p2" }] }];
            const nestedObj = {
                0: { posts: [{ title: "p1" }, { title: "p2" }] },
            };

            agree(
                Arr.pluck(records(), "name"),
                Obj.pluck(recordsObj(), "name"),
                [
                    ["0", "c"],
                    ["1", "a"],
                    ["2", "b"],
                ],
            );
            agree(
                Arr.pluck(records(), "name", "id"),
                Obj.pluck(recordsObj(), "name", "id"),
                [
                    ["1", "a"],
                    ["2", "b"],
                    ["3", "c"],
                ],
            );
            agree(
                Arr.pluck(nested, "posts.*.title"),
                Obj.pluck(nestedObj, "posts.*.title"),
                [["0", ["p1", "p2"]]],
            );
        });

        it("sort accepts a key, a descriptor and an empty list", () => {
            // Integer-like keys are renumbered over the sorted sequence, so an
            // all-integer-keyed object reorders like the array does; PHP keeps the
            // key names instead (sort_all {"1":1,"2":2,"0":3} in the task-10 probe).
            agree(Arr.sort(records(), "id"), Obj.sort(recordsObj(), "id"), [
                ["0", { id: 1, name: "a" }],
                ["1", { id: 2, name: "b" }],
                ["2", { id: 3, name: "c" }],
            ]);
            expect(
                entriesOf(
                    Obj.sort(
                        { c: { id: 3 }, a: { id: 1 }, b: { id: 2 } },
                        "id",
                    ),
                ),
            ).toEqual([
                ["a", { id: 1 }],
                ["b", { id: 2 }],
                ["c", { id: 3 }],
            ]);

            // Arr::sort([3,1,2],[]) -> [3,1,2]: no comparisons, no reorder.
            agree(Arr.sort([3, 1, 2], []), Obj.sort({ 0: 3, 1: 1, 2: 2 }, []), [
                ["0", 3],
                ["1", 1],
                ["2", 2],
            ]);
        });

        it("sortDesc reverses the comparison, not the container", () => {
            // A negative alongside a zero: arsort(['a'=>-1,'b'=>0,'c'=>5]) is
            // {"c":5,"b":0,"a":-1} ("asort over PHP-falsy mixed values"), and an
            // integer-keyed object reorders now that the family renumbers its keys.
            agree(
                Arr.sortDesc([-1, 0, 5]),
                Obj.sortDesc({ 0: -1, 1: 0, 2: 5 }),
                [
                    ["0", 5],
                    ["1", 0],
                    ["2", -1],
                ],
            );
            expect(entriesOf(Obj.sortDesc({ a: -1, b: 0, c: 5 }))).toEqual([
                ["c", 5],
                ["b", 0],
                ["a", -1],
            ]);
            expect(entriesOf(Arr.sortDesc([30, 10, 20]))).toEqual([
                ["0", 30],
                ["1", 20],
                ["2", 10],
            ]);
            expect(entriesOf(Obj.sortDesc({ c: 30, a: 10, b: 20 }))).toEqual([
                ["c", 30],
                ["b", 20],
                ["a", 10],
            ]);
            expect(entriesOf(Data.dataSortDesc([30, 10, 20]))).toEqual([
                ["0", 30],
                ["1", 20],
                ["2", 10],
            ]);
        });

        it("flatten defaults to Infinity and stops only at depth 1", () => {
            // Arr::flatten([1,[2,[3]]]) -> [1,2,3]; at depth 1 -> [1,2,[3]];
            // at depth 2 -> [1,2,3]; at depth 0 it keeps descending.
            const nested = [1, [2, [3]]];
            const nestedObj = { 0: 1, 1: { 0: 2, 1: { 0: 3 } } };
            const flat: [string, unknown][] = [
                ["0", 1],
                ["1", 2],
                ["2", 3],
            ];

            agree(Arr.flatten(nested), Obj.flatten(nestedObj), flat);
            agree(Arr.flatten(nested, 2), Obj.flatten(nestedObj, 2), flat);
            agree(Arr.flatten(nested, 0), Obj.flatten(nestedObj, 0), flat);
            expect(entriesOf(Arr.flatten(nested, 1))).toEqual([
                ["0", 1],
                ["1", 2],
                ["2", [3]],
            ]);
            expect(entriesOf(Obj.flatten(nestedObj, 1))).toEqual([
                ["0", 1],
                ["1", 2],
                ["2", { 0: 3 }],
            ]);
            agree(
                Data.dataFlatten(nested, 2),
                Data.dataFlatten(nestedObj, 2),
                flat,
            );
        });

        it("mapWithKeys returns one plain container", () => {
            // Arr::mapWithKeys(records, fn -> [name => id]) -> {c:3,a:1,b:2};
            // with numeric keys -> {3:'c',1:'a',2:'b'}, which JS hoists
            // ascending. Neither backing may hand back a Map.
            agree(
                Arr.mapWithKeys(records(), (item) => ({
                    [item.name]: item.id,
                })),
                Obj.mapWithKeys(
                    recordsObj(),
                    (item: { id: number; name: string }) => ({
                        [item.name]: item.id,
                    }),
                ),
                [
                    ["c", 3],
                    ["a", 1],
                    ["b", 2],
                ],
            );
            agree(
                Arr.mapWithKeys(records(), (item) => ({
                    [item.id]: item.name,
                })),
                Obj.mapWithKeys(
                    recordsObj(),
                    (item: { id: number; name: string }) => ({
                        [item.id]: item.name,
                    }),
                ),
                [
                    ["1", "a"],
                    ["2", "b"],
                    ["3", "c"],
                ],
            );
        });

        it("keys and values read the same pairs off either backing", () => {
            agree(Arr.keys(nums()), Obj.keys(numsObj()), [
                ["0", 0],
                ["1", 1],
                ["2", 2],
                ["3", 3],
            ]);
            agree(Arr.values(nums()), Obj.values(numsObj()), numsEntries);
            agree(Data.dataKeys(nums()), Data.dataKeys(numsObj()), [
                ["0", 0],
                ["1", 1],
                ["2", 2],
                ["3", 3],
            ]);
        });

        it("reverse actually reverses an integer-keyed object", () => {
            // collect([10,20,30,40])->reverse() iterates 40,30,20,10.
            // Preserving PHP's keys would make this a no-op, because JS
            // re-sorts integer keys ascending on write.
            const reversed: [string, unknown][] = [
                ["0", 40],
                ["1", 30],
                ["2", 20],
                ["3", 10],
            ];

            agree(Arr.reverse(nums()), Obj.reverse(numsObj()), reversed);
            agree(
                Data.dataReverse(nums()),
                Data.dataReverse(numsObj()),
                reversed,
            );
            expect(entriesOf(Obj.reverse({ a: 1, b: 2, c: 3 }))).toEqual([
                ["c", 3],
                ["b", 2],
                ["a", 1],
            ]);
        });

        it("pull removes its key without renumbering the rest", () => {
            // collect([10,20,30,40])->pull(1) -> 20, leaving {0:10,2:30,3:40}
            // — unset, not array_splice, so no renumbering here.
            const arrSource = nums();
            const objSource = numsObj();

            expect(Data.dataPull(arrSource, 1).value).toBe(20);
            expect(Data.dataPull(objSource, 1).value).toBe(20);
            expect(entriesOf(Obj.pull(objSource, 1).data)).toEqual([
                ["0", 10],
                ["2", 30],
                ["3", 40],
            ]);
        });

        it("undot rebuilds the same nested list from either backing", () => {
            // Arr::undot(['0'=>'a','1.0'=>'b','1.1'=>'c']) -> ['a',['b','c']].
            const flat = { 0: "a", "1.0": "b", "1.1": "c" };

            agree(Arr.undot(flat), Obj.undot(flat), [
                ["0", "a"],
                ["1", ["b", "c"]],
            ]);
        });

        it("add stores a key that is no array index on either backing", () => {
            // Arr::add(['a','b'],'foo','X') -> {0:'a',1:'b',foo:'X'}.
            agree(
                Arr.add(["a", "b"], "foo", "X"),
                Obj.add({ 0: "a", 1: "b" }, "foo", "X"),
                [
                    ["0", "a"],
                    ["1", "b"],
                    ["foo", "X"],
                ],
            );
        });
    });
});
