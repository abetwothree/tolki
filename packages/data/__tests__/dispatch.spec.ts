import { collapse as arrCollapse, first as arrFirst } from "@tolki/arr";
import { collapse as objCollapse, first as objFirst } from "@tolki/obj";
import { describe, expect, it } from "vitest";

import {
    copyKeyedData,
    dispatch,
    isKeyedData,
    keepKeyedData,
    streamPositionalData,
    toKeyedData,
    toPositionalBacking,
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

    it("hands a Map to the object helper as it arrived", () => {
        const map = new Map([["a", { x: 1 }]]);
        const received: unknown[] = [];
        const dSpy = dispatch(arrCollapse, (data: unknown) => {
            received.push(data);

            return data;
        });

        dSpy(map);

        expect(received).toEqual([map]);
        expect(received[0]).toBe(map);
    });

    it("converts a Map to a record for a helper that addresses keys by path", () => {
        const map = new Map([["a", { x: 1 }]]);
        const dCollapseRecord = dispatch(
            arrCollapse,
            objCollapse,
            toPositionalBacking,
            toKeyedData,
        );

        expect(dCollapseRecord(map)).toEqual(objCollapse({ a: { x: 1 } }));
    });

    it("wraps a scalar into a list", () => {
        expect(dCollapse(5)).toEqual(arrCollapse([5]));
    });
});

describe("dispatch with a positional normalizer", () => {
    const dFirst = dispatch(arrFirst, objFirst, streamPositionalData);
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
        expect(streamPositionalData(set)).toBe(set);
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

describe("copyKeyedData", () => {
    it("copies a Map, entries and order included, so a mutator leaves the caller's Map alone", () => {
        const map = new Map([
            [2, "c"],
            [0, "a"],
        ]);
        const copy = copyKeyedData(map);

        expect(copy).not.toBe(map);
        expect(copy).toBeInstanceOf(Map);
        expect([...(copy as Map<number, string>)]).toEqual([
            [2, "c"],
            [0, "a"],
        ]);
    });

    it("hands a plain record on by reference, so a mutator writes through it", () => {
        const rec = { a: 1 };

        expect(copyKeyedData(rec)).toBe(rec);
    });
});

describe("keepKeyedData", () => {
    it("hands a Map on by reference, so its insertion order survives", () => {
        const map = new Map([
            [2, "c"],
            [0, "a"],
        ]);

        expect(keepKeyedData(map)).toBe(map);

        // The record toKeyedData builds cannot hold that order.
        expect(Object.keys(toKeyedData(map))).toEqual(["0", "2"]);
    });
});

describe("dispatch with a keyed normalizer", () => {
    const dFirstKeeping = dispatch(arrFirst, objFirst, streamPositionalData);
    const dFirstConverting = dispatch(
        arrFirst,
        objFirst,
        streamPositionalData,
        toKeyedData,
    );

    it("lets the object helper read the Map's own order by default", () => {
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
