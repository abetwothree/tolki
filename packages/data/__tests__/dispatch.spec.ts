import { collapse as arrCollapse, first as arrFirst } from "@tolki/arr";
import { collapse as objCollapse, first as objFirst } from "@tolki/obj";
import { describe, expect, it } from "vitest";

import {
    dispatch,
    isKeyedData,
    keepKeyedData,
    toKeyedData,
    toPositionalBacking,
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

    it("normalizes a Set differently from the default, which answers first() the same", () => {
        const set = new Set([7, 8]);

        // The default materializes a Set; the streaming form hands the Set itself on, so a
        // callback-less `first` never reads an infinite generator past its first item.
        expect(toPositionalData(set)).toBe(set);
        expect(toPositionalBacking(set)).toEqual([7, 8]);
        expect(dFirstDefault(set)).toBe(7);
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

describe("toPositionalBacking", () => {
    it("materializes a generator into its elements", () => {
        const generated = (function* () {
            yield 1;
            yield 2;
        })();

        expect(toPositionalBacking(generated)).toEqual([1, 2]);
    });

    it("hands an array back by reference, so mutators write through it", () => {
        const list = [1, 2];

        expect(toPositionalBacking(list)).toBe(list);
    });

    it.each([
        ["a string", "abc", ["abc"]],
        ["a Map", new Map([["a", 1]]), [new Map([["a", 1]])]],
        ["a scalar", 5, [5]],
        ["null", null, []],
    ])("wraps %s instead of materializing it", (_label, value, expected) => {
        expect(toPositionalBacking(value)).toEqual(expected);
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

describe("keepKeyedData", () => {
    it("hands a Map on by reference, so its insertion order survives", () => {
        const map = new Map([
            [2, "c"],
            [0, "a"],
        ]);

        expect(keepKeyedData(map)).toBe(map);

        // The record the default normalizer builds cannot hold that order.
        expect(Object.keys(toKeyedData(map))).toEqual(["0", "2"]);
    });
});

describe("dispatch with a keyed normalizer", () => {
    const dFirstKeeping = dispatch(
        arrFirst,
        objFirst,
        toPositionalData,
        keepKeyedData,
    );
    const dFirstConverting = dispatch(arrFirst, objFirst, toPositionalData);

    it("lets the object helper read the Map's own order", () => {
        const map = new Map([
            [2, "c"],
            [0, "a"],
        ]);

        expect(dFirstKeeping(map)).toBe("c");
        expect(dFirstConverting(map)).toBe("a");
    });

    it("changes nothing for a plain record, which carries its own order", () => {
        const rec = { b: 7, a: 8 };

        expect(dFirstKeeping(rec)).toBe(dFirstConverting(rec));
    });
});
