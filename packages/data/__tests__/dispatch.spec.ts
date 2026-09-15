import { collapse as arrCollapse, first as arrFirst } from "@tolki/arr";
import { collapse as objCollapse, first as objFirst } from "@tolki/obj";
import { describe, expect, it } from "vitest";

import {
    dispatch,
    isKeyedData,
    toKeyedData,
    toPositionalData,
} from "../src/dispatch";

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
        expect(dCollapse(5)).toEqual(arrCollapse([5]));
    });
});

describe("dispatch with a positional normalizer", () => {
    const dFirst = dispatch(arrFirst, objFirst, toPositionalData);
    const dFirstDefault = dispatch(arrFirst, objFirst);

    it("walks a Set's elements instead of wrapping the Set", () => {
        expect(dFirst(new Set([7, 8]))).toBe(7);
    });

    it("treats missing data as nothing to walk", () => {
        expect(dFirst(undefined)).toBeNull();
    });

    it("still sends a record to the object helper", () => {
        const rec = { a: 7, b: 8 };

        expect(dFirst(rec)).toEqual(objFirst(rec));
    });

    it("wraps a scalar the default normalizer would also wrap", () => {
        expect(dFirst(7)).toBe(7);
    });

    it("differs from the default normalizer on a Set", () => {
        const set = new Set([7, 8]);

        expect(dFirstDefault(set)).toBe(set);
    });

    it("differs from the default normalizer on missing data", () => {
        expect(dFirstDefault(undefined)).toBeUndefined();
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
