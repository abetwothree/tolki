import { describe, it, expect } from "vitest";
import * as Data from "@laravel-js/data";

describe("Data", () => {
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

    it("add", () => {
        expect(Data.dataAdd([1, 2], 2, 3)).toEqual([1, 2, 3]);
        expect(Data.dataAdd({ a: 1 }, "b", 2)).toEqual({ a: 1, b: 2 });
    });

    it("boolean", () => {
        expect(Data.dataBoolean([true, false], 0, false)).toBe(true);
        expect(Data.dataBoolean({ active: true }, "active", false)).toBe(true);
        expect(Data.dataBoolean({ active: false }, "missing", true)).toBe(true);
    });

    it("collapse", () => {
        expect(
            Data.dataCollapse([
                [1, 2],
                [3, 4],
            ]),
        ).toEqual([1, 2, 3, 4]);
        expect(Data.dataCollapse({ a: { x: 1 }, b: { y: 2 } })).toEqual({
            x: 1,
            y: 2,
        });
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
});
