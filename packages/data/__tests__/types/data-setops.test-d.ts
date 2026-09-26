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
    numberMapAsRecord,
    opaque,
    readonlyNumberList,
    rowList,
    settings,
    stringList,
    unionItems,
} from "./fixtures";

/** Not a fixture: the Set keeps its own type here, since the point is that a row takes one. */
const numberSet = new Set([7, 8]);

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

    describe("dataDiffKeys", () => {
        it("matches arr.diffKeys for a list", () => {
            expectTypeOf(Data.dataDiffKeys(numberList, [9, 9])).toEqualTypeOf(
                Arr.diffKeys(numberList, [9, 9]),
            );
        });

        it("matches obj.diffKeys for a record", () => {
            expectTypeOf(Data.dataDiffKeys(abc, { b: 2 })).toEqualTypeOf(
                Obj.diffKeys(abc, { b: 2 }),
            );
        });

        it("matches each backing given a nullish other", () => {
            expectTypeOf(Data.dataDiffKeys(numberList, null)).toEqualTypeOf(
                Arr.diffKeys(numberList, null),
            );
            expectTypeOf(Data.dataDiffKeys(abc, null)).toEqualTypeOf(
                Obj.diffKeys(abc, null),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(
                Data.dataDiffKeys(readonlyNumberList, [9]),
            ).toEqualTypeOf(Arr.diffKeys(readonlyNumberList, [9]));
        });
    });

    describe("dataDiffUsing and dataIntersectUsing", () => {
        const same = (a: number, b: number): boolean => a === b;

        it("match arr for a list", () => {
            expectTypeOf(
                Data.dataDiffUsing(numberList, [2], same),
            ).toEqualTypeOf(Arr.diffUsing(numberList, [2], same));
            expectTypeOf(
                Data.dataIntersectUsing(readonlyNumberList, [2], same),
            ).toEqualTypeOf(Arr.intersectUsing(readonlyNumberList, [2], same));
        });

        it("match obj for a record", () => {
            expectTypeOf(Data.dataDiffUsing(abc, { a: 1 }, same)).toEqualTypeOf(
                Obj.diffUsing(abc, { a: 1 }, same),
            );
            expectTypeOf(
                Data.dataIntersectUsing(abc, { a: 1 }, same),
            ).toEqualTypeOf(Obj.intersectUsing(abc, { a: 1 }, same));
        });

        it("match each backing given a nullish other", () => {
            const loose = (a: unknown, b: unknown): boolean => a === b;

            expectTypeOf(
                Data.dataDiffUsing(numberList, null, loose),
            ).toEqualTypeOf(Arr.diffUsing(numberList, null, loose));
            expectTypeOf(Data.dataDiffUsing(abc, null, loose)).toEqualTypeOf(
                Obj.diffUsing(abc, null, loose),
            );
            expectTypeOf(
                Data.dataIntersectUsing(numberList, null, loose),
            ).toEqualTypeOf(Arr.intersectUsing(numberList, null, loose));
            expectTypeOf(
                Data.dataIntersectUsing(abc, null, loose),
            ).toEqualTypeOf(Obj.intersectUsing(abc, null, loose));
        });

        it("type a callback from the delegate each backing reaches", () => {
            // The callbacks are inline and unannotated on purpose: an annotation would supply the types they assert.
            const diffed = Data.dataDiffUsing([1, 2], ["x"], (value, other) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(other).toEqualTypeOf<string>();

                return true;
            });
            expectTypeOf(diffed).toEqualTypeOf<number[]>();

            const intersected = Data.dataIntersectUsing(
                { a: 1 },
                { b: "x" },
                (value, other) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(other).toEqualTypeOf<string>();

                    return true;
                },
            );
            expectTypeOf(intersected).toEqualTypeOf(
                Obj.intersectUsing({ a: 1 }, { b: "x" }, () => true),
            );
        });
    });

    describe("dataDiffAssocUsing and dataDiffKeysUsing", () => {
        const sameKey = (keyA: PropertyKey, keyB: PropertyKey): boolean =>
            String(keyA) === String(keyB);

        it("matches arr.diffAssocUsing for a list", () => {
            const delegate = Arr.diffAssocUsing(numberList, [1, 9, 3], sameKey);

            expectTypeOf(
                Data.dataDiffAssocUsing(numberList, [1, 9, 3], sameKey),
            ).toEqualTypeOf(delegate);
        });

        it("matches obj.diffAssocUsing for a record", () => {
            const delegate = Obj.diffAssocUsing(abc, { a: 1, b: 9 }, sameKey);

            expectTypeOf(
                Data.dataDiffAssocUsing(abc, { a: 1, b: 9 }, sameKey),
            ).toEqualTypeOf(delegate);
        });

        it("matches arr.diffKeysUsing for a list", () => {
            const delegate = Arr.diffKeysUsing(numberList, [1, 9, 3], sameKey);

            expectTypeOf(
                Data.dataDiffKeysUsing(numberList, [1, 9, 3], sameKey),
            ).toEqualTypeOf(delegate);
        });

        it("matches obj.diffKeysUsing for a record", () => {
            const delegate = Obj.diffKeysUsing(abc, { a: 1, b: 9 }, sameKey);

            expectTypeOf(
                Data.dataDiffKeysUsing(abc, { a: 1, b: 9 }, sameKey),
            ).toEqualTypeOf(delegate);
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

        it("matches arr.collapse for a list of records, merging their keys", () => {
            expectTypeOf(Data.dataCollapse(rowList)).toEqualTypeOf(
                Arr.collapse(rowList),
            );
            // Stated too: the pin above would still hold if both sides answered the same wrong record.
            expectTypeOf(Data.dataCollapse(rowList)).toEqualTypeOf<{
                id?: number;
                name?: string;
            }>();
            expectTypeOf(
                Data.dataCollapse([{ a: 1 }, { b: "x" }]),
            ).toEqualTypeOf<{ a?: number; b?: string }>();
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

        it("takes the backings its body now normalizes, answering the record's own type", () => {
            // No delegate to pin against: the body picks obj or arr per backing and the
            // rows are its own, so the Map, Set and scalar rows answer the record mirror's
            // type. Narrowing any of them would fail here rather than silently.
            const record = Data.dataUnion(numberMapAsRecord, { d: 4 });
            expectTypeOf(Data.dataUnion(numberMap, { d: 4 })).toEqualTypeOf<
                typeof record
            >();
            expectTypeOf(Data.dataUnion(numberSet, [9])).toEqualTypeOf<
                typeof record
            >();
            expectTypeOf(Data.dataUnion(5, [9])).toEqualTypeOf<typeof record>();
            expectTypeOf(Data.dataUnion("x", [9])).toEqualTypeOf<
                typeof record
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

            const same = (a: unknown, b: unknown): boolean => a === b;
            expectTypeOf(Data.dataDiffKeys(unionItems, [1])).toEqualTypeOf(
                Obj.diffKeys(unionItems, [1]),
            );
            expectTypeOf(
                Data.dataDiffUsing(unionItems, [1], same),
            ).toEqualTypeOf(Obj.diffUsing(unionItems, [1], same));
            expectTypeOf(
                Data.dataIntersectUsing(unionItems, [1], same),
            ).toEqualTypeOf(Obj.intersectUsing(unionItems, [1], same));
        });

        it("answers dataCollapse from obj, and still covers the list half", () => {
            const declared = Data.dataCollapse(unionItems);
            expectTypeOf(declared).toEqualTypeOf(Obj.collapse(unionItems));
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row is inferred from the last of obj's overloads,
        // so a Map gets obj's widest row, not obj's own Map row.

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

        it("types a Map on dataDiffKeys from obj's widest row", () => {
            const widest = Obj.diffKeys(opaque, [2]);
            expectTypeOf(Data.dataDiffKeys(numberMap, [2])).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataDiffUsing and dataIntersectUsing from obj's widest row", () => {
            const same = (a: unknown, b: unknown): boolean => a === b;
            const diffed = Obj.diffUsing(opaque, [2], same);
            const intersected = Obj.intersectUsing(opaque, [2], same);

            expectTypeOf(
                Data.dataDiffUsing(numberMap, [2], same),
            ).toEqualTypeOf<typeof diffed>();
            expectTypeOf(
                Data.dataIntersectUsing(numberMap, [2], same),
            ).toEqualTypeOf<typeof intersected>();
        });

        it("types a Map on dataDiffAssocUsing from obj's widest row", () => {
            const sameKey = (keyA: PropertyKey, keyB: PropertyKey): boolean =>
                String(keyA) === String(keyB);
            const widest = Obj.diffAssocUsing(opaque, [2], sameKey);

            expectTypeOf(
                Data.dataDiffAssocUsing(numberMap, [2], sameKey),
            ).toEqualTypeOf<typeof widest>();
        });

        it("types a Map on dataDiffKeysUsing from obj's widest row", () => {
            const sameKey = (keyA: PropertyKey, keyB: PropertyKey): boolean =>
                String(keyA) === String(keyB);
            const widest = Obj.diffKeysUsing(opaque, [2], sameKey);

            expectTypeOf(
                Data.dataDiffKeysUsing(numberMap, [2], sameKey),
            ).toEqualTypeOf<typeof widest>();
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

    describe("inputs a Record<PropertyKey, unknown> constraint would reject", () => {
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
            expectTypeOf(Data.dataDiffKeys(settings, { a: 1 })).toEqualTypeOf(
                Obj.diffKeys(settings, { a: 1 }),
            );

            const same = (a: number, b: number): boolean => a === b;
            expectTypeOf(
                Data.dataDiffUsing(settings, { a: 1 }, same),
            ).toEqualTypeOf(Obj.diffUsing(settings, { a: 1 }, same));
            expectTypeOf(
                Data.dataIntersectUsing(settings, { a: 1 }, same),
            ).toEqualTypeOf(Obj.intersectUsing(settings, { a: 1 }, same));
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataDiff(box, { b: 2 })).toEqualTypeOf(
                Obj.diff(box, { b: 2 }),
            );
            expectTypeOf(Data.dataDiffKeys(box, { b: 2 })).toEqualTypeOf(
                Obj.diffKeys(box, { b: 2 }),
            );

            const same = (a: number, b: number): boolean => a === b;
            expectTypeOf(Data.dataDiffUsing(box, { b: 2 }, same)).toEqualTypeOf(
                Obj.diffUsing(box, { b: 2 }, same),
            );
            expectTypeOf(
                Data.dataIntersectUsing(box, { b: 2 }, same),
            ).toEqualTypeOf(Obj.intersectUsing(box, { b: 2 }, same));
            expectTypeOf(Data.dataCollapse(box)).toEqualTypeOf(
                Obj.collapse(box),
            );
        });
    });
});
