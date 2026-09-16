import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    box,
    nestedRecord,
    numberList,
    numberMap,
    opaque,
    readonlyNumberList,
    settings,
    unionItems,
} from "./fixtures";

/** A record whose value is a list, so push has something to append to. */
const listValued = { a: [1, 2] };

/** Not a fixture: the Set keeps its own type here, since the point is that a row takes one. */
const numberSet = new Set([7, 8]);

/** The nested read-only backing `arr.add`'s shallow copy would write through (F-18). */
const deepReadonlyList: readonly (string | readonly string[])[] = [
    "products",
    ["desk"],
];

describe("data writes type tests", () => {
    describe("dataSet", () => {
        it("matches arr.set for a list", () => {
            expectTypeOf(Data.dataSet(numberList, 0, 9)).toEqualTypeOf(
                Arr.set(numberList, 0, 9),
            );
        });

        it("matches obj.set for a record", () => {
            expectTypeOf(Data.dataSet(abc, "a", 9)).toEqualTypeOf(
                Obj.set(abc, "a", 9),
            );
        });

        it("matches each backing for a dot path", () => {
            expectTypeOf(Data.dataSet(nestedRecord, "a.x", 9)).toEqualTypeOf(
                Obj.set(nestedRecord, "a.x", 9),
            );
        });

        it("matches obj.set for a null key (F-23)", () => {
            // F-23: the old hand-written row typed this as DataItems; obj answers the
            // value itself, because PHP's `$data[null] = $v` replaces the whole array.
            expectTypeOf(Data.dataSet(abc, null, 9)).toEqualTypeOf(
                Obj.set(abc, null, 9),
            );
            expectTypeOf(Data.dataSet(numberList, null, 9)).toEqualTypeOf(
                Arr.set(numberList, null, 9),
            );
        });
    });

    describe("dataAdd", () => {
        it("matches arr.add for a list", () => {
            expectTypeOf(Data.dataAdd(numberList, 3, 9)).toEqualTypeOf(
                Arr.add(numberList, 3, 9),
            );
        });

        it("matches obj.add for a record", () => {
            expectTypeOf(Data.dataAdd(abc, "d", 9)).toEqualTypeOf(
                Obj.add(abc, "d", 9),
            );
        });

        it("matches obj.add for a Set, whose type does not follow its runtime", () => {
            // Observed: dispatch materializes the Set and arr.add answers [7, 8], while
            // obj.add answers {"0": 9}. Typed from obj here, as every sibling is; Part B owns it.
            expectTypeOf(Data.dataAdd(numberSet, 0, 9)).toEqualTypeOf(
                Obj.add(numberSet, 0, 9),
            );
            expectTypeOf(Data.dataAdd(numberSet, 0, 9)).not.toEqualTypeOf(
                Arr.add([...numberSet], 0, 9),
            );
        });

        it("matches obj's widest row for a scalar, string or nullish backing", () => {
            // The delegate that runs is arr.add, on the wrapped backing, but arr.add takes
            // no such input, so the row answers obj's widest — as the Map row does.
            const widest = Obj.add(opaque, "b", 9);
            expectTypeOf(Data.dataAdd("abc", "b", 9)).toEqualTypeOf(widest);
            expectTypeOf(Data.dataAdd(7, "b", 9)).toEqualTypeOf(widest);
            expectTypeOf(Data.dataAdd(true, "b", 9)).toEqualTypeOf(widest);
            expectTypeOf(Data.dataAdd(null, "b", 9)).toEqualTypeOf(widest);
            expectTypeOf(Data.dataAdd(undefined, "b", 9)).toEqualTypeOf(widest);
        });

        it("rejects a read-only list, which no row claims", () => {
            // Task D5 (F-18) made arr.add copy along the written path, so this is a limit
            // of the row shapes now, not a mutation risk. Widening it needs its own task.
            // @ts-expect-error a read-only list is not a mutable backing
            Data.dataAdd(readonlyNumberList, 3, 9);
            // @ts-expect-error and neither is one whose nested list is read-only
            Data.dataAdd(deepReadonlyList, "1.1", 200);
        });

        it("rejects a backing the compiler has not narrowed", () => {
            // The only row that could take `unknown` would take a read-only list with it,
            // and the rows above pin that dataAdd keeps turning both away.
            // @ts-expect-error an unnarrowed backing matches no row
            Data.dataAdd(opaque, "b", 9);
        });
    });

    describe("dataPush", () => {
        it("matches arr.push for a list", () => {
            expectTypeOf(Data.dataPush(numberList, null, 9)).toEqualTypeOf(
                Arr.push(numberList, null, 9),
            );
        });

        it("matches obj.push for a record", () => {
            expectTypeOf(Data.dataPush(listValued, "a", 3)).toEqualTypeOf(
                Obj.push(listValued, "a", 3),
            );
        });

        it("matches each backing for several values at once", () => {
            expectTypeOf(Data.dataPush(numberList, null, 9, 10)).toEqualTypeOf(
                Arr.push(numberList, null, 9, 10),
            );
            expectTypeOf(Data.dataPush(listValued, "a", 3, 4)).toEqualTypeOf(
                Obj.push(listValued, "a", 3, 4),
            );
        });
    });

    describe("dataPrepend, which stays hand-written", () => {
        // Standing control: no dispatch pair is possible while `arr.prepend` declares
        // `key?: number` and returns `TValue[]`, which cannot express PHP's keyed answer at
        // all. Only the non-integer key's entry vanishing is an arr defect; Task D5 owns it.

        it("still has an arr delegate that answers a list for any key", () => {
            // docs/php-parity/task-23-obj-release-readiness.json, "prepend-list-with-key"
            expectTypeOf(Arr.prepend(["b", "c"], "a", 0)).toExtend<string[]>();
            expectTypeOf(Data.dataPrepend(["b", "c"], "a", "k")).not.toExtend<
                string[]
            >();
        });

        it("still admits each delegate's answer, one direction only", () => {
            // Downgraded to assignability: the hand-written return is a DataItems union,
            // which no delegate's exact answer can equal, so the pin is a lower bound.
            const listOut = Data.dataPrepend(numberList, 9);
            expectTypeOf(Arr.prepend(numberList, 9)).toExtend<typeof listOut>();

            const recordOut = Data.dataPrepend(abc, 9, "z");
            expectTypeOf(Obj.prepend(abc, 9, "z")).toExtend<typeof recordOut>();
        });
    });

    describe("dataPull", () => {
        it("matches arr.pull for a list", () => {
            expectTypeOf(Data.dataPull(numberList, 0)).toEqualTypeOf(
                Arr.pull(numberList, 0),
            );
        });

        it("matches obj.pull for a record", () => {
            expectTypeOf(Data.dataPull(abc, "a")).toEqualTypeOf(
                Obj.pull(abc, "a"),
            );
        });

        it("matches each backing given a default", () => {
            // Hoisted for the same reason as dataGet's default row: written inline, the
            // delegate infers TDefault from toEqualTypeOf's Mismatch parameter instead.
            const listAnswer = Arr.pull(numberList, 9, "none");
            const recordAnswer = Obj.pull(abc, "z", "none");
            expectTypeOf(Data.dataPull(numberList, 9, "none")).toEqualTypeOf(
                listAnswer,
            );
            expectTypeOf(Data.dataPull(abc, "z", "none")).toEqualTypeOf(
                recordAnswer,
            );
        });
    });

    describe("a read-only list backing", () => {
        it("takes a read-only list", () => {
            // dataAdd is absent on purpose: it rejects a read-only list until Task D5
            // Step 1 (F-18) makes arr.add deep-copy along the written path.
            expectTypeOf(Data.dataSet(readonlyNumberList, 0, 9)).toEqualTypeOf(
                Arr.set(readonlyNumberList, 0, 9),
            );
            expectTypeOf(
                Data.dataPush(readonlyNumberList, null, 9),
            ).toEqualTypeOf(Arr.push(readonlyNumberList, null, 9));
            expectTypeOf(Data.dataPull(readonlyNumberList, 0)).toEqualTypeOf(
                Arr.pull(readonlyNumberList, 0),
            );

            // Assignability, not equality: dataPrepend stays hand-written and answers the
            // DataItems union, which no delegate's exact answer can equal.
            const prepended = Data.dataPrepend(readonlyNumberList, 9);
            expectTypeOf(Arr.prepend(readonlyNumberList, 9)).toExtend<
                typeof prepended
            >();
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        it("answers each converted write from obj", () => {
            expectTypeOf(Data.dataSet(unionItems, "a", 9)).toEqualTypeOf(
                Obj.set(unionItems, "a", 9),
            );
            expectTypeOf(Data.dataAdd(unionItems, "d", 9)).toEqualTypeOf(
                Obj.add(unionItems, "d", 9),
            );
            expectTypeOf(Data.dataPush(unionItems, null, 9)).toEqualTypeOf(
                Obj.push(unionItems, null, 9),
            );
            expectTypeOf(Data.dataPull(unionItems, "a")).toEqualTypeOf(
                Obj.pull(unionItems, "a"),
            );
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row stands in for what `toKeyedData`
        // does at runtime, and a conditional over an overloaded delegate resolves only its
        // last signature, so the answer is obj's widest row, not the record's exact one.

        it("types a Map on dataSet from obj's widest row", () => {
            // `dispatch`'s KeyedMapRow resolves objFn's widest overload, whose answer unions
            // a record with NullishKeyValue at an unresolved key, so the union widens to
            // unknown. The fix belongs in dispatch.ts's KeyedMapRow, not in obj.set.
            expectTypeOf(Data.dataSet(numberMap, "a", 9)).toEqualTypeOf<
                ReturnType<typeof Obj.set>
            >();
        });

        it("types a Map on dataAdd from obj's widest row", () => {
            const widest = Obj.add(opaque, "d", 9);
            expectTypeOf(Data.dataAdd(numberMap, "d", 9)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataPush from obj's widest row", () => {
            const widest = Obj.push(opaque, "a", 9);
            expectTypeOf(Data.dataPush(numberMap, "a", 9)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataPull from obj's widest row", () => {
            const widest = Obj.pull(opaque, "a");
            expectTypeOf(Data.dataPull(numberMap, "a")).toEqualTypeOf<
                typeof widest
            >();
        });
    });

    describe("inputs that fail to compile today (E2)", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataSet(settings, "a", 9)).toEqualTypeOf(
                Obj.set(settings, "a", 9),
            );
            expectTypeOf(Data.dataAdd(settings, "c", 9)).toEqualTypeOf(
                Obj.add(settings, "c", 9),
            );
            expectTypeOf(Data.dataPull(settings, "a")).toEqualTypeOf(
                Obj.pull(settings, "a"),
            );
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataSet(box, "a", 9)).toEqualTypeOf(
                Obj.set(box, "a", 9),
            );
            expectTypeOf(Data.dataPull(box, "a")).toEqualTypeOf(
                Obj.pull(box, "a"),
            );
        });
    });
});
