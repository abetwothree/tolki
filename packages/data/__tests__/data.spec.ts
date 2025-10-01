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
            Data.dataDiff({ a: 1, b: 2, c: 3 }, { b: 2, c: 3, d: 4 }),
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
});
