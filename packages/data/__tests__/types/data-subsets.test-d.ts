import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    box,
    nestedRecord,
    nestedRowList,
    numberList,
    numberMap,
    opaque,
    readonlyNumberList,
    rowsById,
    settings,
    stringList,
    unionItems,
} from "./fixtures";

/** F-23: the key list a caller builds with `as const`, which `PathKeys` alone rejects. */
const readonlyKeys = ["a", "b"] as const;
const readonlyIndices = [0, 1] as const;

describe("data subsets type tests", () => {
    describe("dataGet", () => {
        it("matches arr.get for a list", () => {
            expectTypeOf(Data.dataGet(numberList, 0)).toEqualTypeOf(
                Arr.get(numberList, 0),
            );
        });

        it("matches obj.get for a record", () => {
            expectTypeOf(Data.dataGet(abc, "a")).toEqualTypeOf(
                Obj.get(abc, "a"),
            );
        });

        it("matches each backing for a dot path", () => {
            expectTypeOf(
                Data.dataGet(nestedRowList, "0.user.name"),
            ).toEqualTypeOf(Arr.get(nestedRowList, "0.user.name"));
            expectTypeOf(Data.dataGet(nestedRecord, "a.x")).toEqualTypeOf(
                Obj.get(nestedRecord, "a.x"),
            );
        });

        it("matches each backing for a missing key with a default", () => {
            // Hoisted: written inline, obj.get infers TDefault from toEqualTypeOf's own
            // Mismatch parameter rather than from the argument, so the delegate side is
            // only its real answer once it is bound to a const first.
            const listAnswer = Arr.get(numberList, 9, "none");
            const recordAnswer = Obj.get(abc, "z", "none");
            expectTypeOf(Data.dataGet(numberList, 9, "none")).toEqualTypeOf(
                listAnswer,
            );
            expectTypeOf(Data.dataGet(abc, "z", "none")).toEqualTypeOf(
                recordAnswer,
            );
        });

        it("matches each backing for a missing key with a closure default", () => {
            const fallback = (): string => "none";
            expectTypeOf(Data.dataGet(numberList, 9, fallback)).toEqualTypeOf(
                Arr.get(numberList, 9, fallback),
            );
            expectTypeOf(Data.dataGet(abc, "z", fallback)).toEqualTypeOf(
                Obj.get(abc, "z", fallback),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(Data.dataGet(readonlyNumberList, 0)).toEqualTypeOf(
                Arr.get(readonlyNumberList, 0),
            );
        });
    });

    describe("dataOnly", () => {
        it("matches arr.only for a list", () => {
            expectTypeOf(Data.dataOnly(numberList, [0, 2])).toEqualTypeOf(
                Arr.only(numberList, [0, 2]),
            );
        });

        it("matches obj.only for a record", () => {
            expectTypeOf(Data.dataOnly(abc, ["a", "c"])).toEqualTypeOf(
                Obj.only(abc, ["a", "c"]),
            );
        });

        it("matches obj.only for a read-only key list (F-23)", () => {
            expectTypeOf(Data.dataOnly(abc, readonlyKeys)).toEqualTypeOf(
                Obj.only(abc, readonlyKeys),
            );
        });
    });

    describe("dataExcept", () => {
        it("matches arr.except for a list", () => {
            expectTypeOf(Data.dataExcept(numberList, [1])).toEqualTypeOf(
                Arr.except(numberList, [1]),
            );
        });

        it("matches obj.except for a record", () => {
            expectTypeOf(Data.dataExcept(abc, ["b"])).toEqualTypeOf(
                Obj.except(abc, ["b"]),
            );
        });

        it("matches obj.except for a read-only key list (F-23)", () => {
            expectTypeOf(Data.dataExcept(abc, readonlyKeys)).toEqualTypeOf(
                Obj.except(abc, readonlyKeys),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(
                Data.dataExcept(readonlyNumberList, [1]),
            ).toEqualTypeOf(Arr.except(readonlyNumberList, [1]));
        });
    });

    describe("dataForget", () => {
        it("matches arr.forget for a list", () => {
            expectTypeOf(Data.dataForget(numberList, [1])).toEqualTypeOf(
                Arr.forget(numberList, [1]),
            );
        });

        it("matches obj.forget for a record", () => {
            expectTypeOf(Data.dataForget(abc, ["b"])).toEqualTypeOf(
                Obj.forget(abc, ["b"]),
            );
        });

        it("matches obj.forget for a read-only key list (F-23)", () => {
            expectTypeOf(Data.dataForget(abc, readonlyKeys)).toEqualTypeOf(
                Obj.forget(abc, readonlyKeys),
            );
        });
    });

    describe("dataHas, converted earlier but named by F-23", () => {
        it("matches obj.has for a read-only key list", () => {
            expectTypeOf(Data.dataHas(abc, readonlyKeys)).toEqualTypeOf(
                Obj.has(abc, readonlyKeys),
            );
        });

        it("takes a read-only key list on a list backing", () => {
            // The obj pin below compiles but cannot discriminate: both delegates answer
            // boolean, so it would hold whichever one ran. The `@ts-expect-error` is the
            // real control — `arr.has` declares `PathKeys`, whose `Array<PathKey>` is mutable.
            expectTypeOf(
                Data.dataHas(numberList, readonlyIndices),
            ).toEqualTypeOf(Obj.has(numberList, readonlyIndices));
            // @ts-expect-error arr.has's PathKeys rejects a read-only index tuple
            Arr.has(numberList, readonlyIndices);
        });
    });

    describe("a read-only key list on a list backing mis-routes to obj", () => {
        // Standing control, reported as a concern: arr's key parameters are `PathKeys`
        // (mutable), so a read-only tuple skips every arr row and lands on obj's
        // NonObjectItems row, which answers `{}` while the runtime still answers arr's list.
        it("types dataExcept from obj's array-rejecting row", () => {
            expectTypeOf(
                Data.dataExcept(numberList, readonlyIndices),
            ).toEqualTypeOf(Obj.except(numberList, readonlyIndices));
        });

        it("types dataOnly and dataForget the same way", () => {
            expectTypeOf(
                Data.dataOnly(numberList, readonlyIndices),
            ).toEqualTypeOf(Obj.only(numberList, readonlyIndices));
            expectTypeOf(
                Data.dataForget(numberList, readonlyIndices),
            ).toEqualTypeOf(Obj.forget(numberList, readonlyIndices));
        });
    });

    describe("dataOnlyValues", () => {
        it("matches arr.onlyValues for a list", () => {
            expectTypeOf(
                Data.dataOnlyValues(stringList, ["Ada"]),
            ).toEqualTypeOf(Arr.onlyValues(stringList, ["Ada"]));
        });

        it("matches obj.onlyValues for a record", () => {
            expectTypeOf(Data.dataOnlyValues(abc, [1])).toEqualTypeOf(
                Obj.onlyValues(abc, [1]),
            );
        });

        it("matches each backing under strict comparison", () => {
            expectTypeOf(
                Data.dataOnlyValues(stringList, ["Ada"], true),
            ).toEqualTypeOf(Arr.onlyValues(stringList, ["Ada"], true));
            expectTypeOf(Data.dataOnlyValues(abc, [1], true)).toEqualTypeOf(
                Obj.onlyValues(abc, [1], true),
            );
        });
    });

    describe("dataExceptValues", () => {
        it("matches arr.exceptValues for a list", () => {
            expectTypeOf(
                Data.dataExceptValues(stringList, ["Ada"]),
            ).toEqualTypeOf(Arr.exceptValues(stringList, ["Ada"]));
        });

        it("matches obj.exceptValues for a record", () => {
            expectTypeOf(Data.dataExceptValues(abc, [1])).toEqualTypeOf(
                Obj.exceptValues(abc, [1]),
            );
        });

        it("matches each backing under strict comparison", () => {
            expectTypeOf(
                Data.dataExceptValues(stringList, ["Ada"], true),
            ).toEqualTypeOf(Arr.exceptValues(stringList, ["Ada"], true));
            expectTypeOf(Data.dataExceptValues(abc, [1], true)).toEqualTypeOf(
                Obj.exceptValues(abc, [1], true),
            );
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        it("answers each subset helper from obj, and still covers the list half", () => {
            const only = Data.dataOnly(unionItems, ["a"]);
            expectTypeOf(only).toEqualTypeOf(Obj.only(unionItems, ["a"]));

            const except = Data.dataExcept(unionItems, ["a"]);
            expectTypeOf(except).toEqualTypeOf(Obj.except(unionItems, ["a"]));

            const forgotten = Data.dataForget(unionItems, ["a"]);
            expectTypeOf(forgotten).toEqualTypeOf(
                Obj.forget(unionItems, ["a"]),
            );

            const onlyValues = Data.dataOnlyValues(unionItems, [1]);
            expectTypeOf(onlyValues).toEqualTypeOf(
                Obj.onlyValues(unionItems, [1]),
            );
            expectTypeOf(Arr.onlyValues(numberList, [1])).toExtend<
                typeof onlyValues
            >();

            const exceptValues = Data.dataExceptValues(unionItems, [1]);
            expectTypeOf(exceptValues).toEqualTypeOf(
                Obj.exceptValues(unionItems, [1]),
            );
        });

        it("answers dataGet from obj", () => {
            expectTypeOf(Data.dataGet(unionItems, "a")).toEqualTypeOf(
                Obj.get(unionItems, "a"),
            );
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row stands in for what `toKeyedData`
        // does at runtime, and a conditional over an overloaded delegate resolves only its
        // last signature, so the answer is obj's widest row, not the record's exact one.

        it("types a Map on dataGet from obj's widest row", () => {
            const widest = Obj.get(opaque, "a");
            expectTypeOf(Data.dataGet(numberMap, "a")).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataOnly from obj's widest row", () => {
            const widest = Obj.only(opaque, ["a"]);
            expectTypeOf(Data.dataOnly(numberMap, ["a"])).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataExcept from obj's widest row", () => {
            const widest = Obj.except(opaque, ["a"]);
            expectTypeOf(Data.dataExcept(numberMap, ["a"])).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataForget from obj's widest row", () => {
            const widest = Obj.forget(opaque, ["a"]);
            expectTypeOf(Data.dataForget(numberMap, ["a"])).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataOnlyValues from obj's widest row", () => {
            const widest = Obj.onlyValues(opaque, [1]);
            expectTypeOf(Data.dataOnlyValues(numberMap, [1])).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataExceptValues from obj's widest row", () => {
            const widest = Obj.exceptValues(opaque, [1]);
            expectTypeOf(Data.dataExceptValues(numberMap, [1])).toEqualTypeOf<
                typeof widest
            >();
        });
    });

    describe("inputs that fail to compile today (E2)", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataGet(settings, "a")).toEqualTypeOf(
                Obj.get(settings, "a"),
            );
            expectTypeOf(Data.dataOnly(settings, ["a"])).toEqualTypeOf(
                Obj.only(settings, ["a"]),
            );
            expectTypeOf(Data.dataExcept(settings, ["a"])).toEqualTypeOf(
                Obj.except(settings, ["a"]),
            );
            expectTypeOf(Data.dataForget(settings, ["a"])).toEqualTypeOf(
                Obj.forget(settings, ["a"]),
            );
            expectTypeOf(Data.dataOnlyValues(settings, [1])).toEqualTypeOf(
                Obj.onlyValues(settings, [1]),
            );
            expectTypeOf(Data.dataExceptValues(settings, [1])).toEqualTypeOf(
                Obj.exceptValues(settings, [1]),
            );
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataGet(box, "a")).toEqualTypeOf(
                Obj.get(box, "a"),
            );
            expectTypeOf(Data.dataExcept(box, ["a"])).toEqualTypeOf(
                Obj.except(box, ["a"]),
            );
        });

        it("keeps a record of rows' own shape through dataOnly", () => {
            expectTypeOf(Data.dataOnly(rowsById, ["r1"])).toEqualTypeOf(
                Obj.only(rowsById, ["r1"]),
            );
        });
    });
});
