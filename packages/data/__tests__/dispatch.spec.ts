import { collapse as arrCollapse } from "@tolki/arr";
import { collapse as objCollapse } from "@tolki/obj";
import { describe, expect, it } from "vitest";

import { dispatch, isKeyedData, toKeyedData } from "../src/dispatch";

describe("dispatch", () => {
    const dCollapse = dispatch(arrCollapse, objCollapse);

    it("sends a list to the array helper", () => {
        expect(dCollapse([[1, 2], [3]])).toEqual(arrCollapse([[1, 2], [3]]));
    });

    it("sends a record to the object helper", () => {
        const rec = { a: { x: 1 }, b: { y: 2 } };

        expect(dCollapse(rec)).toEqual(objCollapse(rec));
    });

    it("normalizes a Map to a record before delegating", () => {
        const map = new Map([["a", { x: 1 }]]);

        expect(dCollapse(map)).toEqual(objCollapse({ a: { x: 1 } }));
    });

    it("wraps a scalar into a list", () => {
        expect(dCollapse(5 as unknown as number[][])).toEqual(
            arrCollapse([5] as unknown as number[][]),
        );
    });
});

describe("isKeyedData", () => {
    it.each([
        ["a record", { a: 1 }, true],
        ["a Map", new Map(), true],
        ["a list", [1, 2], false],
        ["a Set", new Set([1]), false],
        ["a scalar", 5, false],
    ])("classifies %s", (_label, value, expected) => {
        expect(isKeyedData(value)).toBe(expected);
    });
});

describe("toKeyedData", () => {
    it("converts a Map to a record", () => {
        expect(toKeyedData(new Map([["a", 1]]))).toEqual({ a: 1 });
    });

    it("passes a plain object through unchanged", () => {
        const rec = { a: 1 };

        expect(toKeyedData(rec)).toBe(rec);
    });
});
