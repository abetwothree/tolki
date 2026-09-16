import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    booleanList,
    box,
    nestedList,
    nestedRecord,
    numberList,
    numberMap,
    opaque,
    readonlyNumberList,
    settings,
    stringList,
    unionItems,
} from "./fixtures";

describe("data setops type tests", () => {
    describe("dataDiff", () => {
        it("matches arr.diff for a list", () => {
            expectTypeOf(Data.dataDiff(numberList, [2])).toEqualTypeOf(
                Arr.diff(numberList, [2]),
            );
        });

        it("matches obj.diff for a record", () => {
            expectTypeOf(Data.dataDiff(abc, { b: 2 })).toEqualTypeOf(
                Obj.diff(abc, { b: 2 }),
            );
        });

        it("matches each backing given a nullish other", () => {
            expectTypeOf(Data.dataDiff(numberList, null)).toEqualTypeOf(
                Arr.diff(numberList, null),
            );
            expectTypeOf(Data.dataDiff(abc, null)).toEqualTypeOf(
                Obj.diff(abc, null),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(Data.dataDiff(readonlyNumberList, [2])).toEqualTypeOf(
                Arr.diff(readonlyNumberList, [2]),
            );
        });
    });

    describe("dataDiffAssoc", () => {
        it("matches arr.diffAssoc for a list", () => {
            expectTypeOf(
                Data.dataDiffAssoc(numberList, [1, 9, 3]),
            ).toEqualTypeOf(Arr.diffAssoc(numberList, [1, 9, 3]));
        });

        it("matches obj.diffAssoc for a record", () => {
            expectTypeOf(
                Data.dataDiffAssoc(abc, { a: 1, b: 9, c: 3 }),
            ).toEqualTypeOf(Obj.diffAssoc(abc, { a: 1, b: 9, c: 3 }));
        });

        it("takes a read-only list", () => {
            expectTypeOf(
                Data.dataDiffAssoc(readonlyNumberList, [1, 9, 3]),
            ).toEqualTypeOf(Arr.diffAssoc(readonlyNumberList, [1, 9, 3]));
        });
    });

    describe("the two hand-written exceptions, pinned against obj only", () => {
        // Both serve BOTH backings from obj, so obj's call is the only delegate to pin against.
        // Their hand-written `DataItems` return cannot hold obj's `Partial<T>`, so the pin is the
        // negative one: it fails the day Task D6 adds arr.diffKeys/diffUsing and converts them.
        const sameKey = (keyA: PropertyKey, keyB: PropertyKey): boolean =>
            String(keyA) === String(keyB);

        it("does not yet forward obj.diffAssocUsing's own return type", () => {
            expectTypeOf(
                Data.dataDiffAssocUsing(abc, { a: 1, b: 9 }, sameKey),
            ).not.toEqualTypeOf(
                Obj.diffAssocUsing(abc, { a: 1, b: 9 }, sameKey),
            );
        });

        it("does not yet forward obj.diffKeysUsing's own return type", () => {
            expectTypeOf(
                Data.dataDiffKeysUsing(abc, { a: 1, b: 9 }, sameKey),
            ).not.toEqualTypeOf(
                Obj.diffKeysUsing(abc, { a: 1, b: 9 }, sameKey),
            );
        });

        it("keeps obj.diffAssocUsing's return assignable to the declared one", () => {
            const declaredAssoc = Data.dataDiffAssocUsing(
                abc,
                { a: 1, b: 9 },
                sameKey,
            );

            // Downgraded to assignability: equality is impossible while the return is hand-written.
            expectTypeOf(
                Obj.diffAssocUsing(abc, { a: 1, b: 9 }, sameKey),
            ).toExtend<typeof declaredAssoc>();
        });

        it("keeps obj.diffKeysUsing's return assignable to the declared one", () => {
            const declaredKeys = Data.dataDiffKeysUsing(
                abc,
                { a: 1, b: 9 },
                sameKey,
            );

            // Downgraded to assignability: equality is impossible while the return is hand-written.
            expectTypeOf(
                Obj.diffKeysUsing(abc, { a: 1, b: 9 }, sameKey),
            ).toExtend<typeof declaredKeys>();
        });
    });

    describe("dataIntersect", () => {
        it("matches arr.intersect for a list", () => {
            expectTypeOf(Data.dataIntersect(numberList, [1, 2])).toEqualTypeOf(
                Arr.intersect(numberList, [1, 2]),
            );
        });

        it("matches obj.intersect for a record", () => {
            expectTypeOf(Data.dataIntersect(abc, { a: 1, b: 2 })).toEqualTypeOf(
                Obj.intersect(abc, { a: 1, b: 2 }),
            );
        });

        it("matches each backing given a comparison callback", () => {
            const same = (a: number, b: number): boolean => a === b;
            expectTypeOf(
                Data.dataIntersect(numberList, [1, 2], same),
            ).toEqualTypeOf(Arr.intersect(numberList, [1, 2], same));
            expectTypeOf(Data.dataIntersect(abc, { a: 1 }, same)).toEqualTypeOf(
                Obj.intersect(abc, { a: 1 }, same),
            );
        });
    });

    describe("dataIntersectAssoc", () => {
        it("matches arr.intersectAssoc for a list", () => {
            expectTypeOf(
                Data.dataIntersectAssoc(numberList, [1, 9, 3]),
            ).toEqualTypeOf(Arr.intersectAssoc(numberList, [1, 9, 3]));
        });

        it("matches obj.intersectAssoc for a record", () => {
            expectTypeOf(
                Data.dataIntersectAssoc(abc, { a: 1, b: 9, c: 3 }),
            ).toEqualTypeOf(Obj.intersectAssoc(abc, { a: 1, b: 9, c: 3 }));
        });

        it("matches each backing given a nullish other", () => {
            expectTypeOf(
                Data.dataIntersectAssoc(numberList, null),
            ).toEqualTypeOf(Arr.intersectAssoc(numberList, null));
            expectTypeOf(Data.dataIntersectAssoc(abc, null)).toEqualTypeOf(
                Obj.intersectAssoc(abc, null),
            );
        });
    });

    describe("dataIntersectAssocUsing", () => {
        const sameIndex = (keyA: number, keyB: number): boolean =>
            keyA === keyB;
        const sameKey = (keyA: PropertyKey, keyB: PropertyKey): boolean =>
            String(keyA) === String(keyB);

        it("matches arr.intersectAssocUsing for a list", () => {
            expectTypeOf(
                Data.dataIntersectAssocUsing(numberList, [1, 9, 3], sameIndex),
            ).toEqualTypeOf(
                Arr.intersectAssocUsing(numberList, [1, 9, 3], sameIndex),
            );
        });

        it("matches obj.intersectAssocUsing for a record", () => {
            expectTypeOf(
                Data.dataIntersectAssocUsing(abc, { a: 1, b: 9 }, sameKey),
            ).toEqualTypeOf(
                Obj.intersectAssocUsing(abc, { a: 1, b: 9 }, sameKey),
            );
        });
    });

    describe("dataIntersectByKeys", () => {
        it("matches arr.intersectByKeys for a list", () => {
            expectTypeOf(
                Data.dataIntersectByKeys(numberList, [1]),
            ).toEqualTypeOf(Arr.intersectByKeys(numberList, [1]));
        });

        it("matches obj.intersectByKeys for a record", () => {
            expectTypeOf(Data.dataIntersectByKeys(abc, { a: 1 })).toEqualTypeOf(
                Obj.intersectByKeys(abc, { a: 1 }),
            );
        });

        it("matches each backing given a nullish other", () => {
            expectTypeOf(
                Data.dataIntersectByKeys(numberList, null),
            ).toEqualTypeOf(Arr.intersectByKeys(numberList, null));
            expectTypeOf(Data.dataIntersectByKeys(abc, null)).toEqualTypeOf(
                Obj.intersectByKeys(abc, null),
            );
        });
    });

    describe("dataCrossJoin", () => {
        it("matches arr.crossJoin for a list", () => {
            expectTypeOf(Data.dataCrossJoin(numberList, [3, 4])).toEqualTypeOf(
                Arr.crossJoin(numberList, [3, 4]),
            );
        });

        it("matches obj.crossJoin for a record", () => {
            expectTypeOf(
                Data.dataCrossJoin({ a: [1, 2] }, { b: [3, 4] }),
            ).toEqualTypeOf(Obj.crossJoin({ a: [1, 2] }, { b: [3, 4] }));
        });

        it("matches arr.crossJoin for three lists", () => {
            expectTypeOf(
                Data.dataCrossJoin(numberList, stringList, booleanList),
            ).toEqualTypeOf(Arr.crossJoin(numberList, stringList, booleanList));
        });

        it("matches arr.crossJoin for three one-item operands", () => {
            // Hoisted, so both calls see `string[]`/`boolean[]`: inference through the
            // intersection widens an INLINE literal operand where the delegate keeps it.
            const letters = ["a"];
            const switches = [true];
            expectTypeOf(
                Data.dataCrossJoin(numberList, letters, switches),
            ).toEqualTypeOf(Arr.crossJoin(numberList, letters, switches));
        });
    });

    describe("dataCollapse", () => {
        it("matches arr.collapse for a nested list", () => {
            expectTypeOf(Data.dataCollapse(nestedList)).toEqualTypeOf(
                Arr.collapse(nestedList),
            );
        });

        it("matches obj.collapse for a nested record", () => {
            expectTypeOf(Data.dataCollapse(nestedRecord)).toEqualTypeOf(
                Obj.collapse(nestedRecord),
            );
        });

        it("takes data no shape can be read off, which DataItems rejects", () => {
            expectTypeOf(Data.dataCollapse(opaque)).toEqualTypeOf(
                Obj.collapse(opaque),
            );
        });
    });

    describe("dataUnion, which stays hand-written", () => {
        // Standing control: `dataUnion` is NOT a `dispatch` pair. `arr.union` drops a
        // non-integer-like key and fills a gap with `undefined` to keep its `unknown[]`
        // return, where PHP's `+` keeps both, so obj serves the list backing too.

        it("still has an arr delegate whose return cannot hold PHP's keyed answer", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-list-keyed-operand"
            expectTypeOf(Arr.union([1, 2], [3])).toExtend<unknown[]>();
            expectTypeOf(Data.dataUnion([1, 2], { a: 5 })).not.toExtend<
                unknown[]
            >();
        });

        it("still answers an object for a list backing with a gap", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "union-list-backing-keyed-result"
            expectTypeOf(Arr.union([1], [4])).toExtend<unknown[]>();
            expectTypeOf(Data.dataUnion([1], { 3: 4 })).not.toExtend<
                unknown[]
            >();
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        it("answers each converted setop from obj, and still covers the list half", () => {
            const diffed = Data.dataDiff(unionItems, [2]);
            expectTypeOf(diffed).toEqualTypeOf(Obj.diff(unionItems, [2]));
            expectTypeOf(Arr.diff(numberList, [2])).toExtend<typeof diffed>();

            const diffedAssoc = Data.dataDiffAssoc(unionItems, [1, 9, 3]);
            expectTypeOf(diffedAssoc).toEqualTypeOf(
                Obj.diffAssoc(unionItems, [1, 9, 3]),
            );

            const intersected = Data.dataIntersect(unionItems, [1, 2]);
            expectTypeOf(intersected).toEqualTypeOf(
                Obj.intersect(unionItems, [1, 2]),
            );

            const intersectedAssoc = Data.dataIntersectAssoc(
                unionItems,
                [1, 2],
            );
            expectTypeOf(intersectedAssoc).toEqualTypeOf(
                Obj.intersectAssoc(unionItems, [1, 2]),
            );

            const byKeys = Data.dataIntersectByKeys(unionItems, [1]);
            expectTypeOf(byKeys).toEqualTypeOf(
                Obj.intersectByKeys(unionItems, [1]),
            );
        });

        it("answers dataCollapse from obj, and still covers the list half", () => {
            const declared = Data.dataCollapse(unionItems);
            expectTypeOf(declared).toEqualTypeOf(Obj.collapse(unionItems));
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row stands in for what `toKeyedData`
        // does at runtime, and a conditional over an overloaded delegate resolves only its
        // last signature, so the answer is obj's widest row, not the record's exact one.

        it("types a Map on dataDiff from obj's widest row", () => {
            const widest = Obj.diff(opaque, [2]);
            expectTypeOf(Data.dataDiff(numberMap, [2])).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataDiffAssoc from obj's widest row", () => {
            const widest = Obj.diffAssoc(opaque, [2]);
            expectTypeOf(Data.dataDiffAssoc(numberMap, [2])).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataIntersect from obj's widest row", () => {
            const widest = Obj.intersect(opaque, [2]);
            expectTypeOf(Data.dataIntersect(numberMap, [2])).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataIntersectAssoc from obj's widest row", () => {
            const widest = Obj.intersectAssoc(opaque, [2]);
            expectTypeOf(Data.dataIntersectAssoc(numberMap, [2])).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataIntersectByKeys from obj's widest row", () => {
            const widest = Obj.intersectByKeys(opaque, [2]);
            expectTypeOf(
                Data.dataIntersectByKeys(numberMap, [2]),
            ).toEqualTypeOf<typeof widest>();
        });

        it("types a Map on dataCollapse from obj's widest row", () => {
            const widest = Obj.collapse(opaque);
            expectTypeOf(Data.dataCollapse(numberMap)).toEqualTypeOf<
                typeof widest
            >();
        });
    });

    describe("inputs that fail to compile today (E2)", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataDiff(settings, { b: 2 })).toEqualTypeOf(
                Obj.diff(settings, { b: 2 }),
            );
            expectTypeOf(
                Data.dataDiffAssoc(settings, { a: 1, b: 9 }),
            ).toEqualTypeOf(Obj.diffAssoc(settings, { a: 1, b: 9 }));
            expectTypeOf(Data.dataIntersect(settings, { a: 1 })).toEqualTypeOf(
                Obj.intersect(settings, { a: 1 }),
            );
            expectTypeOf(
                Data.dataIntersectAssoc(settings, { a: 1 }),
            ).toEqualTypeOf(Obj.intersectAssoc(settings, { a: 1 }));
            expectTypeOf(
                Data.dataIntersectByKeys(settings, { a: 1 }),
            ).toEqualTypeOf(Obj.intersectByKeys(settings, { a: 1 }));
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataDiff(box, { b: 2 })).toEqualTypeOf(
                Obj.diff(box, { b: 2 }),
            );
            expectTypeOf(Data.dataCollapse(box)).toEqualTypeOf(
                Obj.collapse(box),
            );
        });
    });
});
