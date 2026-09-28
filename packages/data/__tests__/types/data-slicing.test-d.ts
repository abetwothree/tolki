import * as Arr from "@tolki/arr";
import * as Data from "@tolki/data";
import * as Obj from "@tolki/obj";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    box,
    nestedList,
    nestedRecord,
    numberList,
    numberMap,
    opaque,
    readonlyNumberList,
    settings,
    unionItems,
} from "./fixtures";

/** A non-literal default, so `TDefault` infers the same on both sides of a pin. */
const fallback: string = "fallback";

describe("data slicing type tests", () => {
    describe("dataTake", () => {
        it("matches arr.take for a list", () => {
            expectTypeOf(Data.dataTake(numberList, 2)).toEqualTypeOf(
                Arr.take(numberList, 2),
            );
        });

        it("matches obj.take for a record", () => {
            expectTypeOf(Data.dataTake(abc, 2)).toEqualTypeOf(Obj.take(abc, 2));
        });

        it("matches each backing for a negative limit", () => {
            expectTypeOf(Data.dataTake(numberList, -2)).toEqualTypeOf(
                Arr.take(numberList, -2),
            );
            expectTypeOf(Data.dataTake(abc, -2)).toEqualTypeOf(
                Obj.take(abc, -2),
            );
        });

        it("takes a read-only list", () => {
            expectTypeOf(Data.dataTake(readonlyNumberList, 2)).toEqualTypeOf(
                Arr.take(readonlyNumberList, 2),
            );
        });
    });

    describe("dataSlice", () => {
        it("matches arr.slice for a list", () => {
            expectTypeOf(Data.dataSlice(numberList, 1)).toEqualTypeOf(
                Arr.slice(numberList, 1),
            );
        });

        it("matches obj.slice for a record", () => {
            expectTypeOf(Data.dataSlice(abc, 1)).toEqualTypeOf(
                Obj.slice(abc, 1),
            );
        });

        it("matches each backing given a length", () => {
            expectTypeOf(Data.dataSlice(numberList, 1, 1)).toEqualTypeOf(
                Arr.slice(numberList, 1, 1),
            );
            expectTypeOf(Data.dataSlice(abc, 1, 1)).toEqualTypeOf(
                Obj.slice(abc, 1, 1),
            );
        });
    });

    describe("dataChunk", () => {
        // `preserveKeys` selects a different row on BOTH delegates, and the two disagree
        // about the omitted default, so each of the three forms is pinned separately.

        it("matches each backing with preserveKeys omitted", () => {
            expectTypeOf(Data.dataChunk(numberList, 2)).toEqualTypeOf(
                Arr.chunk(numberList, 2),
            );
            expectTypeOf(Data.dataChunk(abc, 2)).toEqualTypeOf(
                Obj.chunk(abc, 2),
            );
        });

        it("matches each backing with preserveKeys true", () => {
            expectTypeOf(Data.dataChunk(numberList, 2, true)).toEqualTypeOf(
                Arr.chunk(numberList, 2, true),
            );
            expectTypeOf(Data.dataChunk(abc, 2, true)).toEqualTypeOf(
                Obj.chunk(abc, 2, true),
            );
        });

        it("matches each backing with preserveKeys false", () => {
            expectTypeOf(Data.dataChunk(numberList, 2, false)).toEqualTypeOf(
                Arr.chunk(numberList, 2, false),
            );
            expectTypeOf(Data.dataChunk(abc, 2, false)).toEqualTypeOf(
                Obj.chunk(abc, 2, false),
            );
        });
    });

    describe("dataChunkWhile", () => {
        it("matches arr.chunkWhile for a list", () => {
            const keepSame = (
                value: number,
                _index: number,
                chunk: number[],
            ): boolean => chunk.at(-1) === value;
            expectTypeOf(
                Data.dataChunkWhile(numberList, keepSame),
            ).toEqualTypeOf(Arr.chunkWhile(numberList, keepSame));
        });

        it("matches obj.chunkWhile for a record", () => {
            expectTypeOf(
                Data.dataChunkWhile(
                    abc,
                    (value, _key, chunk) =>
                        Object.values(chunk).at(-1) === value,
                ),
            ).toEqualTypeOf(
                Obj.chunkWhile(
                    abc,
                    (value, _key, chunk) =>
                        Object.values(chunk).at(-1) === value,
                ),
            );
        });

        it("routes a record to the keyed overload", () => {
            // The callback is inline and unannotated on purpose: an annotation would
            // supply the very types these rows assert, making all three tautologies.
            const chunked = Data.dataChunkWhile(
                { a: 1 },
                (value, key, chunk) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<"a">();
                    expectTypeOf(chunk).toEqualTypeOf<Partial<{ a: number }>>();

                    return true;
                },
            );
            expectTypeOf(chunked).toEqualTypeOf(
                Obj.chunkWhile({ a: 1 }, () => true),
            );
        });

        it("routes an array to the positional overload", () => {
            const chunked = Data.dataChunkWhile(
                [1, 2],
                (value, index, chunk) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(index).toEqualTypeOf<number>();
                    expectTypeOf(chunk).toEqualTypeOf<number[]>();

                    return true;
                },
            );
            expectTypeOf(chunked).toEqualTypeOf(
                Arr.chunkWhile([1, 2], () => true),
            );
        });
    });

    describe("dataChunkBy", () => {
        it("matches arr.chunkBy for a list", () => {
            const byValue = (value: number): number => value;
            expectTypeOf(Data.dataChunkBy(numberList, byValue)).toEqualTypeOf(
                Arr.chunkBy(numberList, byValue),
            );
        });

        it("matches obj.chunkBy for a record", () => {
            expectTypeOf(Data.dataChunkBy(abc, "x")).toEqualTypeOf(
                Obj.chunkBy(abc, "x"),
            );
        });

        it("matches each backing given a bare path key", () => {
            expectTypeOf(Data.dataChunkBy([1, 2], "x")).toEqualTypeOf(
                Arr.chunkBy([1, 2], "x"),
            );
            expectTypeOf(Data.dataChunkBy({ a: 1 }, "x")).toEqualTypeOf(
                Obj.chunkBy({ a: 1 }, "x"),
            );
        });

        it("matches arr.chunkBy given a callback taking the index", () => {
            const sum = (value: number, index: number): number => value + index;
            expectTypeOf(Data.dataChunkBy([1, 2], sum)).toEqualTypeOf(
                Arr.chunkBy([1, 2], sum),
            );
        });
    });

    describe("dataFirst", () => {
        it("matches arr.first for a list", () => {
            expectTypeOf(Data.dataFirst(numberList)).toEqualTypeOf(
                Arr.first(numberList),
            );
        });

        it("matches obj.first for a record", () => {
            expectTypeOf(Data.dataFirst(abc)).toEqualTypeOf(Obj.first(abc));
        });

        it("matches each backing given a callback", () => {
            expectTypeOf(
                Data.dataFirst(numberList, (value) => value > 1),
            ).toEqualTypeOf(Arr.first(numberList, (value) => value > 1));
            expectTypeOf(
                Data.dataFirst(abc, (value) => value > 1),
            ).toEqualTypeOf(Obj.first(abc, (value) => value > 1));
        });

        it("matches each backing given a callback and a default", () => {
            expectTypeOf(
                Data.dataFirst(numberList, null, fallback),
            ).toEqualTypeOf(Arr.first(numberList, null, fallback));
            expectTypeOf(Data.dataFirst(abc, null, fallback)).toEqualTypeOf(
                Obj.first(abc, null, fallback),
            );
        });

        it("widens an inline literal default, which the delegate pin cannot hold", () => {
            // Recorded: `"fallback"` widens to `string` through the intersection where a
            // direct delegate call keeps the literal. The pre-dispatch overloads widened too.
            expectTypeOf(
                Data.dataFirst(numberList, null, "fallback"),
            ).toEqualTypeOf<number | string | null>();
        });

        it("types a Map from obj's widest row, not from the Map's own value type", () => {
            // Standing control for a narrowing `dispatch` lost: the hand-written
            // `Map<TKey, TValue>` overload answered `number | null` here. `KeyedMapRow`
            // precedes obj's own rows in the intersection and resolves obj's widest one.
            const widest = Obj.first(opaque);
            expectTypeOf(Data.dataFirst(numberMap)).toEqualTypeOf<
                typeof widest
            >();
            expectTypeOf(Data.dataFirst(numberMap)).not.toEqualTypeOf<
                number | null
            >();
        });
    });

    describe("dataLast", () => {
        it("matches arr.last for a list", () => {
            expectTypeOf(Data.dataLast(numberList)).toEqualTypeOf(
                Arr.last(numberList),
            );
        });

        it("matches obj.last for a record", () => {
            expectTypeOf(Data.dataLast(abc)).toEqualTypeOf(Obj.last(abc));
        });

        it("matches each backing given a callback", () => {
            expectTypeOf(
                Data.dataLast(numberList, (value) => value < 3),
            ).toEqualTypeOf(Arr.last(numberList, (value) => value < 3));
            expectTypeOf(
                Data.dataLast(abc, (value) => value < 3),
            ).toEqualTypeOf(Obj.last(abc, (value) => value < 3));
        });

        it("infers the value and the default from an iterable", () => {
            expectTypeOf(
                Data.dataLast(new Set([1, 2]), null, "fallback"),
            ).toEqualTypeOf<number | string | null>();
        });
    });

    describe("dataRandom", () => {
        // Non-deterministic at runtime; only the declared shape is pinned here.
        it("matches arr.random for a list", () => {
            expectTypeOf(Data.dataRandom(numberList)).toEqualTypeOf(
                Arr.random(numberList),
            );
        });

        it("matches obj.random for a record", () => {
            expectTypeOf(Data.dataRandom(abc)).toEqualTypeOf(Obj.random(abc));
        });

        it("matches each backing given a count", () => {
            expectTypeOf(Data.dataRandom(numberList, 2)).toEqualTypeOf(
                Arr.random(numberList, 2),
            );
            expectTypeOf(Data.dataRandom(abc, 2)).toEqualTypeOf(
                Obj.random(abc, 2),
            );
        });

        it("matches each backing given a count and preserveKeys", () => {
            expectTypeOf(Data.dataRandom(numberList, 2, true)).toEqualTypeOf(
                Arr.random(numberList, 2, true),
            );
            expectTypeOf(Data.dataRandom(abc, 2, true)).toEqualTypeOf(
                Obj.random(abc, 2, true),
            );
        });
    });

    describe("dataShuffle", () => {
        it("matches arr.shuffle for a list", () => {
            expectTypeOf(Data.dataShuffle(numberList)).toEqualTypeOf(
                Arr.shuffle(numberList),
            );
        });

        it("matches obj.shuffle for a record", () => {
            expectTypeOf(Data.dataShuffle(abc)).toEqualTypeOf(Obj.shuffle(abc));
        });
    });

    describe("dataReverse", () => {
        it("matches arr.reverse for a list", () => {
            expectTypeOf(Data.dataReverse(numberList)).toEqualTypeOf(
                Arr.reverse(numberList),
            );
        });

        it("matches obj.reverse for a record", () => {
            expectTypeOf(Data.dataReverse(abc)).toEqualTypeOf(Obj.reverse(abc));
        });

        it("takes a read-only list", () => {
            expectTypeOf(Data.dataReverse(readonlyNumberList)).toEqualTypeOf(
                Arr.reverse(readonlyNumberList),
            );
        });
    });

    describe("dataFlatten", () => {
        it("matches arr.flatten for a nested list", () => {
            expectTypeOf(Data.dataFlatten(nestedList)).toEqualTypeOf(
                Arr.flatten(nestedList),
            );
        });

        it("matches obj.flatten for a nested record", () => {
            expectTypeOf(Data.dataFlatten(nestedRecord)).toEqualTypeOf(
                Obj.flatten(nestedRecord),
            );
        });

        it("matches each backing at a bounded depth", () => {
            // The default depth is Infinity, a settled contract, so a bounded depth
            // is pinned separately to prove the argument reaches both delegates.
            expectTypeOf(Data.dataFlatten(nestedList, 1)).toEqualTypeOf(
                Arr.flatten(nestedList, 1),
            );
            expectTypeOf(Data.dataFlatten(nestedRecord, 1)).toEqualTypeOf(
                Obj.flatten(nestedRecord, 1),
            );
        });
    });

    describe("the DataItems union, the package's own canonical input", () => {
        it("answers each slicing function from obj, and still covers the list half", () => {
            const taken = Data.dataTake(unionItems, 2);
            expectTypeOf(taken).toEqualTypeOf(Obj.take(unionItems, 2));

            const sliced = Data.dataSlice(unionItems, 1);
            expectTypeOf(sliced).toEqualTypeOf(Obj.slice(unionItems, 1));

            const chunked = Data.dataChunk(unionItems, 2);
            expectTypeOf(chunked).toEqualTypeOf(Obj.chunk(unionItems, 2));

            const reversed = Data.dataReverse(unionItems);
            expectTypeOf(reversed).toEqualTypeOf(Obj.reverse(unionItems));

            const shuffled = Data.dataShuffle(unionItems);
            expectTypeOf(shuffled).toEqualTypeOf(Obj.shuffle(unionItems));

            const flattened = Data.dataFlatten(unionItems);
            expectTypeOf(flattened).toEqualTypeOf(Obj.flatten(unionItems));
        });

        it("answers dataFirst and dataLast from obj, and still covers the list half", () => {
            const firstValue = Data.dataFirst(unionItems);
            expectTypeOf(firstValue).toEqualTypeOf(Obj.first(unionItems));
            // Soundness: a union-typed value that is really a list reaches arr at runtime.
            expectTypeOf(Arr.first(numberList)).toExtend<typeof firstValue>();

            const lastValue = Data.dataLast(unionItems);
            expectTypeOf(lastValue).toEqualTypeOf(Obj.last(unionItems));
            expectTypeOf(Arr.last(numberList)).toExtend<typeof lastValue>();
        });
    });

    describe("Map backing agreement sweep, at the type level", () => {
        // JS-only: PHP has no Map. `dispatch`'s Map row is inferred from the last of obj's overloads,
        // so a Map gets obj's widest row, not obj's own Map row.

        it("types a Map on dataTake from obj's widest row", () => {
            const widest = Obj.take(opaque, 2);
            expectTypeOf(Data.dataTake(numberMap, 2)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataSlice from obj's widest row", () => {
            const widest = Obj.slice(opaque, 1);
            expectTypeOf(Data.dataSlice(numberMap, 1)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataChunk from obj's widest row", () => {
            const widest = Obj.chunk(opaque, 2);
            expectTypeOf(Data.dataChunk(numberMap, 2)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataReverse from obj's widest row", () => {
            const widest = Obj.reverse(opaque);
            expectTypeOf(Data.dataReverse(numberMap)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataShuffle from obj's widest row", () => {
            const widest = Obj.shuffle(opaque);
            expectTypeOf(Data.dataShuffle(numberMap)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types a Map on dataRandom from obj's widest row", () => {
            const widest = Obj.random(opaque, 2);
            expectTypeOf(Data.dataRandom(numberMap, 2)).toEqualTypeOf<
                typeof widest
            >();
        });

        it("types dataChunk(map, n, false) and dataRandom(map, n, true) from obj's own Map row", () => {
            // Not obj's widest row: the checker tries a row with a bare literal parameter first, so obj.chunk's
            // `false` and obj.random's `true` Map rows win over KeyedMapRow, with the narrower runtime answer.
            expectTypeOf(Data.dataChunk(numberMap, 2, false)).toEqualTypeOf<
                Record<number, Record<number, number>>
            >();
            expectTypeOf(Data.dataChunk(numberMap, 2, false)).toEqualTypeOf(
                Obj.chunk(numberMap, 2, false),
            );
            expectTypeOf(Data.dataRandom(numberMap, 2, true)).toEqualTypeOf<
                Record<string, number>
            >();
            expectTypeOf(Data.dataRandom(numberMap, 2, true)).toEqualTypeOf(
                Obj.random(numberMap, 2, true),
            );
        });

        it("types a Map on dataFlatten from obj's widest row", () => {
            const widest = Obj.flatten(opaque);
            expectTypeOf(Data.dataFlatten(numberMap)).toEqualTypeOf<
                typeof widest
            >();
        });
    });

    describe("inputs a Record<PropertyKey, unknown> constraint would reject", () => {
        it("accepts an interface-typed record", () => {
            expectTypeOf(Data.dataTake(settings, 2)).toEqualTypeOf(
                Obj.take(settings, 2),
            );
            expectTypeOf(Data.dataSlice(settings, 1)).toEqualTypeOf(
                Obj.slice(settings, 1),
            );
            expectTypeOf(Data.dataReverse(settings)).toEqualTypeOf(
                Obj.reverse(settings),
            );
            expectTypeOf(Data.dataFirst(settings)).toEqualTypeOf(
                Obj.first(settings),
            );
            expectTypeOf(Data.dataLast(settings)).toEqualTypeOf(
                Obj.last(settings),
            );
        });

        it("accepts a class instance", () => {
            expectTypeOf(Data.dataTake(box, 2)).toEqualTypeOf(Obj.take(box, 2));
            expectTypeOf(Data.dataFirst(box)).toEqualTypeOf(Obj.first(box));
        });
    });
});
