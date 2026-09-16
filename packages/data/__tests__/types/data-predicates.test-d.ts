import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    box,
    names,
    numberList,
    numberMap,
    opaque,
    readonlyNumberList,
    rowList,
    rowsById,
    settings,
    unionItems,
} from "./fixtures";

describe("data predicates type tests", () => {
    // Six of the seven answer `boolean` on both backings, so a return pin cannot discriminate
    // which delegate ran. For those the gate is the PARAMETER side: `opaque` is the one input
    // `DataItems`/`DataIterableItems` reject, so the delegate pin is what makes the call compile.

    describe("dataHas", () => {
        it("matches arr.has for a list", () => {
            expectTypeOf(Data.dataHas(numberList, [0])).toEqualTypeOf(
                Arr.has(numberList, [0]),
            );
        });

        it("matches obj.has for a record", () => {
            expectTypeOf(Data.dataHas(abc, ["a"])).toEqualTypeOf(
                Obj.has(abc, ["a"]),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(Data.dataHas(readonlyNumberList, [0])).toEqualTypeOf(
                Arr.has(readonlyNumberList, [0]),
            );
        });

        it("takes data no shape can be read off, which DataItems rejects", () => {
            expectTypeOf(Data.dataHas(opaque, ["a"])).toEqualTypeOf(
                Obj.has(opaque, ["a"]),
            );
        });
    });

    describe("dataHasAll", () => {
        it("matches arr.hasAll for a list", () => {
            expectTypeOf(Data.dataHasAll(numberList, [0, 1])).toEqualTypeOf(
                Arr.hasAll(numberList, [0, 1]),
            );
        });

        it("matches obj.hasAll for a record", () => {
            expectTypeOf(Data.dataHasAll(abc, ["a", "b"])).toEqualTypeOf(
                Obj.hasAll(abc, ["a", "b"]),
            );
        });

        it("takes data no shape can be read off, which DataItems rejects", () => {
            expectTypeOf(Data.dataHasAll(opaque, ["a"])).toEqualTypeOf(
                Obj.hasAll(opaque, ["a"]),
            );
        });
    });

    describe("dataHasAny", () => {
        it("matches arr.hasAny for a list", () => {
            expectTypeOf(Data.dataHasAny(numberList, [0, 9])).toEqualTypeOf(
                Arr.hasAny(numberList, [0, 9]),
            );
        });

        it("matches obj.hasAny for a record", () => {
            expectTypeOf(Data.dataHasAny(abc, ["z", "a"])).toEqualTypeOf(
                Obj.hasAny(abc, ["z", "a"]),
            );
        });

        it("takes data no shape can be read off, which DataItems rejects", () => {
            expectTypeOf(Data.dataHasAny(opaque, ["a"])).toEqualTypeOf(
                Obj.hasAny(opaque, ["a"]),
            );
        });
    });

    describe("dataEvery", () => {
        it("matches arr.every for a list", () => {
            expectTypeOf(
                Data.dataEvery(numberList, (value) => value > 0),
            ).toEqualTypeOf(Arr.every(numberList, (value) => value > 0));
        });

        it("matches obj.every for a record", () => {
            expectTypeOf(
                Data.dataEvery(abc, (value) => value > 0),
            ).toEqualTypeOf(Obj.every(abc, (value) => value > 0));
        });

        it("takes data no shape can be read off, which DataIterableItems rejects", () => {
            expectTypeOf(
                Data.dataEvery(opaque, (value) => Number(value) > 0),
            ).toEqualTypeOf(Obj.every(opaque, (value) => Number(value) > 0));
        });

        // These pin which overload each backing selects, which a boolean return type cannot show.
        it("routes a Map to dispatch's Map row, not to obj's own ReadonlyMap row", () => {
            // Standing control for a narrowing `dispatch` lost: the hand-written `Map<TKey, TValue>`
            // overload typed this callback `(number, string)`, and `objEvery`'s `ReadonlyMap` row
            // would too, but `KeyedMapRow` precedes it and resolves obj's widest row instead.
            Data.dataEvery(new Map([["a", 1]]), (value, key) => {
                expectTypeOf(value).toEqualTypeOf<unknown>();
                expectTypeOf(key).toEqualTypeOf<string | number>();
                expectTypeOf(key).not.toEqualTypeOf<string>();
                return true;
            });
        });

        it("routes a Set to the positional overload", () => {
            Data.dataEvery(new Set(["a", "b"]), (value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value !== "";
            });
        });

        it("routes a plain object to the keyed overload", () => {
            Data.dataEvery({ a: 1, b: 2 }, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b">();
                return value > 0;
            });
        });
    });

    describe("dataSome", () => {
        it("matches arr.some for a list", () => {
            expectTypeOf(
                Data.dataSome(numberList, (value) => value > 2),
            ).toEqualTypeOf(Arr.some(numberList, (value) => value > 2));
        });

        it("matches obj.some for a record", () => {
            expectTypeOf(
                Data.dataSome(abc, (value) => value > 2),
            ).toEqualTypeOf(Obj.some(abc, (value) => value > 2));
        });

        it("takes data no shape can be read off, which DataIterableItems rejects", () => {
            expectTypeOf(
                Data.dataSome(opaque, (value) => Number(value) > 0),
            ).toEqualTypeOf(Obj.some(opaque, (value) => Number(value) > 0));
        });

        it("routes an array to the positional overload", () => {
            Data.dataSome([1, 2, 3], (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value > 2;
            });
        });

        it("routes a generator to the positional overload", () => {
            const generator = (function* (): Generator<number> {
                yield 1;
            })();

            Data.dataSome(generator, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value > 0;
            });
        });
    });

    describe("dataContains", () => {
        it("matches arr.contains for a list", () => {
            expectTypeOf(Data.dataContains(numberList, 2)).toEqualTypeOf(
                Arr.contains(numberList, 2),
            );
        });

        it("matches obj.contains for a record", () => {
            expectTypeOf(Data.dataContains(abc, 2)).toEqualTypeOf(
                Obj.contains(abc, 2),
            );
        });

        it("matches each backing with the strict flag set", () => {
            expectTypeOf(Data.dataContains(numberList, 2, true)).toEqualTypeOf(
                Arr.contains(numberList, 2, true),
            );
            expectTypeOf(Data.dataContains(abc, 2, true)).toEqualTypeOf(
                Obj.contains(abc, 2, true),
            );
        });

        it("matches each backing with the strict flag explicitly off", () => {
            expectTypeOf(Data.dataContains(numberList, 2, false)).toEqualTypeOf(
                Arr.contains(numberList, 2, false),
            );
            expectTypeOf(Data.dataContains(abc, 2, false)).toEqualTypeOf(
                Obj.contains(abc, 2, false),
            );
        });

        it("matches each backing given a callback", () => {
            expectTypeOf(
                Data.dataContains(numberList, (value) => value > 1),
            ).toEqualTypeOf(Arr.contains(numberList, (value) => value > 1));
            expectTypeOf(
                Data.dataContains(abc, (value) => value > 1),
            ).toEqualTypeOf(Obj.contains(abc, (value) => value > 1));
        });

        it("routes each backing's callback to its own key type", () => {
            Data.dataContains(numberList, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();
                return value > 1;
            });
            Data.dataContains(abc, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();
                return value > 1;
            });
        });

        it("takes data no shape can be read off, which DataItems rejects", () => {
            expectTypeOf(Data.dataContains(opaque, 2)).toEqualTypeOf(
                Obj.contains(opaque, 2),
            );
        });

        it("inherits arr and obj's NonBooleanValue cost on the key/value form", () => {
            // `dispatch` forwards both delegates' rows, so the four shapes their
            // `contains` docblocks name cost a `dataContains` caller too. Each is
            // written as the four-argument operator form instead.
            const cost = <TNeedle>(needle: TNeedle): void => {
                // @ts-expect-error - an unknown value belongs on the operator row
                Data.dataContains([{ v: 1 }], "v", opaque);
                // @ts-expect-error - and so does an unconstrained type parameter
                Data.dataContains({ a: { v: 1 } }, "v", needle);
                expectTypeOf(
                    Data.dataContains([{ v: 1 }], "v", "=", needle),
                ).toEqualTypeOf<boolean>();
            };

            expectTypeOf(cost).toBeFunction();
        });
    });

    describe("dataSole", () => {
        // The one function here whose return type discriminates: the throws are pinned
        // functionally, so these rows pin only the success return.
        it("matches arr.sole for a list", () => {
            expectTypeOf(
                Data.dataSole(numberList, (value) => value === 2),
            ).toEqualTypeOf(Arr.sole(numberList, (value) => value === 2));
        });

        it("matches obj.sole for a record", () => {
            expectTypeOf(
                Data.dataSole(names, (value) => value === "Ada"),
            ).toEqualTypeOf(Obj.sole(names, (value) => value === "Ada"));
        });

        it("matches each backing with the callback omitted", () => {
            expectTypeOf(Data.dataSole(rowList)).toEqualTypeOf(
                Arr.sole(rowList),
            );
            expectTypeOf(Data.dataSole(rowsById)).toEqualTypeOf(
                Obj.sole(rowsById),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(Data.dataSole(readonlyNumberList)).toEqualTypeOf(
                Arr.sole(readonlyNumberList),
            );
        });

        it("takes data no shape can be read off, which DataItems rejects", () => {
            // Angle brackets because obj's widest row answers `unknown`, which
            // `toEqualTypeOf(value)` refuses as an argument — still a delegate pin.
            const widest = Obj.sole(opaque);
            expectTypeOf(Data.dataSole(opaque)).toEqualTypeOf<typeof widest>();
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        it("answers every predicate from obj, and still covers the list half", () => {
            expectTypeOf(Data.dataHas(unionItems, ["a"])).toEqualTypeOf(
                Obj.has(unionItems, ["a"]),
            );
            expectTypeOf(Data.dataHasAll(unionItems, ["a"])).toEqualTypeOf(
                Obj.hasAll(unionItems, ["a"]),
            );
            expectTypeOf(Data.dataHasAny(unionItems, ["a"])).toEqualTypeOf(
                Obj.hasAny(unionItems, ["a"]),
            );
            expectTypeOf(
                Data.dataEvery(unionItems, (value) => Number(value) > 0),
            ).toEqualTypeOf(
                Obj.every(unionItems, (value) => Number(value) > 0),
            );
            expectTypeOf(
                Data.dataSome(unionItems, (value) => Number(value) > 0),
            ).toEqualTypeOf(Obj.some(unionItems, (value) => Number(value) > 0));
            expectTypeOf(Data.dataContains(unionItems, 2)).toEqualTypeOf(
                Obj.contains(unionItems, 2),
            );
            // Explicit, because all six answer `boolean` on both backings: the pins above
            // cannot discriminate, so this row records what the union really resolves to.
            expectTypeOf(
                Data.dataHas(unionItems, ["a"]),
            ).toEqualTypeOf<boolean>();
        });

        it("answers dataSole from obj, and still covers the list half", () => {
            const declared = Data.dataSole(unionItems);
            expectTypeOf(declared).toEqualTypeOf(Obj.sole(unionItems));
            // Soundness: the declared type still covers what a list backing really returns.
            expectTypeOf(Arr.sole(numberList)).toExtend<typeof declared>();
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row stands in for what `toKeyedData`
        // does at runtime; obj's widest row is what a Map resolves to.

        it("types a Map on every boolean predicate", () => {
            expectTypeOf(
                Data.dataHas(numberMap, ["a"]),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Data.dataHasAll(numberMap, ["a", "b"]),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Data.dataHasAny(numberMap, ["z", "a"]),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                Data.dataContains(numberMap, 2),
            ).toEqualTypeOf<boolean>();
        });

        it("hands a Map callback obj's widest parameters, not arr's", () => {
            // The only signal a Map route leaves: both delegates answer `boolean`, so a
            // return pin cannot move. arr's row would give `(number, number)` here.
            Data.dataEvery(numberMap, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<unknown>();
                expectTypeOf(key).toEqualTypeOf<string | number>();
                return Number(value) > 0;
            });
            Data.dataSome(numberMap, (value, key) => {
                expectTypeOf(value).toEqualTypeOf<unknown>();
                expectTypeOf(key).toEqualTypeOf<string | number>();
                return Number(value) > 0;
            });
        });

        it("types a Map on dataSole from obj's widest row", () => {
            const widest = Obj.sole(opaque);
            expectTypeOf(Data.dataSole(numberMap)).toEqualTypeOf<
                typeof widest
            >();
        });
    });

    describe("inputs a Record<PropertyKey, unknown> constraint would reject", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataHas(settings, ["a"])).toEqualTypeOf(
                Obj.has(settings, ["a"]),
            );
            expectTypeOf(Data.dataHasAll(settings, ["a", "b"])).toEqualTypeOf(
                Obj.hasAll(settings, ["a", "b"]),
            );
            expectTypeOf(Data.dataHasAny(settings, ["z", "a"])).toEqualTypeOf(
                Obj.hasAny(settings, ["z", "a"]),
            );
            expectTypeOf(Data.dataContains(settings, 2)).toEqualTypeOf(
                Obj.contains(settings, 2),
            );
            expectTypeOf(
                Data.dataEvery(settings, (value) => value > 0),
            ).toEqualTypeOf(Obj.every(settings, (value) => value > 0));
            expectTypeOf(
                Data.dataSome(settings, (value) => value > 0),
            ).toEqualTypeOf(Obj.some(settings, (value) => value > 0));
            expectTypeOf(
                Data.dataSole(settings, (value) => value === 1),
            ).toEqualTypeOf(Obj.sole(settings, (value) => value === 1));
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataHas(box, ["a"])).toEqualTypeOf(
                Obj.has(box, ["a"]),
            );
            expectTypeOf(
                Data.dataSole(box, (value) => value === 1),
            ).toEqualTypeOf(Obj.sole(box, (value) => value === 1));
        });
    });
});
