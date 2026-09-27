import { collect, Collection, type CollectionShape } from "@tolki/collection";
import * as Data from "@tolki/data";
import { SortDirection } from "@tolki/enum";
import type { CaseValue } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import type { ItemsOf } from "../helpers";
import {
    abc,
    generic,
    mapBuilt,
    numberList,
    type Row,
    rows,
    Tagged,
} from "./fixtures";

declare const partial: Collection<number, "a" | "b", "partial">;
declare const listOrKeyed: Collection<number, number, "list" | "keyed">;
declare const anyShape: Collection<unknown, PropertyKey, CollectionShape>;
declare const maybeLength: number | null;
declare const maybeCount: number | null;
declare const flag: boolean;
declare const maybeFlag: boolean | undefined;
declare const maybeName: string | null;
declare const maybeComparator: ((a: number, b: number) => number) | null;
declare const direction: CaseValue<typeof SortDirection> | boolean;

/**
 * Compare two rows by id, as PHP's <=> compares them.
 *
 * @param first - The first row
 * @param second - The second row
 * @returns A negative, zero or positive number
 */
function byId(first: Row, second: Row): number {
    return first.id - second.id;
}

/** A keyed subclass with state of its own, whose keys are all strings, which the ordering methods never renumber. */
class Settings extends Collection<number, "a" | "b"> {
    readonly scope = "app";
}

/** A keyed subclass whose keys are integers, which the ordering methods renumber, so its own type cannot survive. */
class Ranked extends Collection<string, 5 | 6, "keyed"> {}

/** A keyed subclass with state of its own, whose key type names any integer, so it still fits renumbered keys. */
class Lookup extends Collection<number, string | number, "keyed"> {
    readonly source = "cache";
}

/** A keyed subclass with state of its own, keyed by any number. */
class Tally extends Collection<number, number, "keyed"> {
    readonly unit = "count";
}

/** A generic subclass, whose methods call the family on a `this` typed by its own parameter. */
class Bag<TItem> extends Collection<TItem> {
    /**
     * Slice the bag from the given offset.
     *
     * @param offset - The offset
     * @returns The bag's type, since a list stays one
     */
    slicedFrom(offset: number) {
        return this.slice(offset);
    }

    /**
     * Skip the first items.
     *
     * @param count - How many to skip
     * @returns The bag's type, since a list stays one
     */
    skipped(count: number) {
        return this.skip(count);
    }

    /**
     * Take the first items.
     *
     * @param limit - How many to take
     * @returns The bag's type, since a list stays one
     */
    taken(limit: number) {
        return this.take(limit);
    }

    /**
     * Take one page of items.
     *
     * @param page - The page number
     * @returns The bag's type, since a list stays one
     */
    page(page: number) {
        return this.forPage(page, 2);
    }

    /**
     * Take every n-th item.
     *
     * @param step - The step
     * @returns The bag's type, since a list stays one
     */
    everyNth(step: number) {
        return this.nth(step);
    }

    /**
     * Chunk the bag.
     *
     * @param size - The chunk size
     * @returns The chunks
     */
    chunked(size: number) {
        return this.chunk(size);
    }

    /**
     * Chunk the bag into runs of equal items.
     *
     * @returns The runs
     */
    runs() {
        return this.chunkWhile((value, _key, chunk) => chunk.last() === value);
    }

    /**
     * Chunk the bag into runs the callback answers alike for.
     *
     * @param callback - The callback
     * @returns The runs
     */
    runsBy(callback: (value: TItem) => unknown) {
        return this.chunkBy(callback);
    }

    /**
     * Split the bag into two groups.
     *
     * @returns The groups
     */
    halves() {
        return this.split(2);
    }

    /**
     * Split the bag into two groups, filling the first completely.
     *
     * @returns The groups
     */
    halvesFilled() {
        return this.splitIn(2);
    }

    /**
     * View the bag through windows of two items.
     *
     * @returns The windows
     */
    windows() {
        return this.sliding(2);
    }

    /**
     * Sort the bag.
     *
     * @returns The bag's type, since a list stays one
     */
    ordered() {
        return this.sort();
    }

    /**
     * Sort the bag in descending order.
     *
     * @returns The bag's type, since a list stays one
     */
    orderedDesc() {
        return this.sortDesc();
    }

    /**
     * Sort the bag by the callback's answers.
     *
     * @param callback - The callback
     * @returns The bag's type, since a list stays one
     */
    orderedBy(callback: (value: TItem) => unknown) {
        return this.sortBy(callback);
    }

    /**
     * Sort the bag by the callback's answers, in descending order.
     *
     * @param callback - The callback
     * @returns The bag's type, since a list stays one
     */
    orderedByDesc(callback: (value: TItem) => unknown) {
        return this.sortByDesc(callback);
    }

    /**
     * Sort the bag's keys.
     *
     * @returns The bag's type, since a list stays one
     */
    keysOrdered() {
        return this.sortKeys();
    }

    /**
     * Sort the bag's keys in descending order.
     *
     * @returns The bag's type, since a list stays one
     */
    keysOrderedDesc() {
        return this.sortKeysDesc();
    }

    /**
     * Sort the bag's keys with a comparator.
     *
     * @returns The bag's type, since a list stays one
     */
    keysOrderedUsing() {
        return this.sortKeysUsing((first, second) => first - second);
    }

    /**
     * Reverse the bag.
     *
     * @returns The bag's type, since a list stays one
     */
    reversed() {
        return this.reverse();
    }

    /**
     * Shuffle the bag.
     *
     * @returns The bag's type, since a list stays one
     */
    shuffled() {
        return this.shuffle();
    }
}

describe("collection slicing, chunking and ordering type tests", () => {
    const list = collect(numberList);
    const record = collect(abc);
    const people = collect(rows);
    const mapped = collect(mapBuilt);
    const numbered = collect({ 5: "a", 6: "b" });
    const mixedKeys = collect({ 0: "a", x: "b" });
    const tagged = new Tagged([1, 2, 3], "tag");
    const settings = new Settings({ a: 1, b: 2 });
    const ranked = new Ranked({ 5: "a", 6: "b" });
    const lookup = new Lookup({ a: 1, 0: 2 });
    const tally = new Tally({ 5: 1, 2: 2 });

    describe("slice", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.slice(1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.slice(-2, 1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.slice(1)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.slice(0, 2)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(partial.slice(1)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(listOrKeyed.slice(1)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
            expectTypeOf(anyShape.slice(1)).toEqualTypeOf<
                Collection<unknown, PropertyKey, "list" | "partial">
            >();
            expectTypeOf(tagged.slice(1)).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.slice(1)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.slice(1)).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("takes a length that may be null, as PHP's ?int does", () => {
            expectTypeOf(list.slice(1, maybeLength)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.slice(1, maybeLength)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.slice(1, null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function sliced<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const kept = items.slice(1, 2);

                return { kept, chained: kept.filter(() => true) };
            }

            expectTypeOf(sliced(list).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(sliced(record).kept).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(sliced(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).slicedFrom(1)).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("agrees with dataSlice's items, a keyed result's partial", () => {
            const listSliced = collect(numberList).slice(1);
            const recordSliced = collect(abc).slice(1, 1);
            const dataList = Data.dataSlice(numberList, 1);
            const dataRecord = Data.dataSlice(abc, 1, 1);

            expectTypeOf<ItemsOf<typeof listSliced>>().toEqualTypeOf<
                typeof dataList
            >();
            expectTypeOf<ItemsOf<typeof recordSliced>>().toEqualTypeOf<
                typeof dataRecord
            >();
            expectTypeOf<ItemsOf<typeof recordSliced>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects an offset that is no number, and a missing one", () => {
            // @ts-expect-error - PHP's offset is an int
            list.slice("1");
            // @ts-expect-error - PHP throws ArgumentCountError without an offset
            list.slice();
        });
    });

    describe("skip", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.skip(1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(people.skip(1)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(record.skip(1)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(partial.skip(1)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(listOrKeyed.skip(1)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
            expectTypeOf(tagged.skip(1)).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.skip(1)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.skip(1)).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function skipped<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const kept = items.skip(1);

                return { kept, chained: kept.filter(() => true) };
            }

            expectTypeOf(skipped(list).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(skipped(record).kept).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(skipped(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).skipped(1)).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("types a keyed result's items as a record that may lack keys", () => {
            const skipped = collect(abc).skip(1);

            expectTypeOf<ItemsOf<typeof skipped>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a count that is no number, or that may be null", () => {
            // @ts-expect-error - PHP's count is an int
            list.skip("1");
            // @ts-expect-error - PHP's count is an int, never null
            list.skip(maybeCount);
        });
    });

    describe("take", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.take(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.take(-2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.take(2)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.take(-2)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(partial.take(1)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(listOrKeyed.take(1)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
            expectTypeOf(tagged.take(2)).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.take(1)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.take(-1)).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function taken<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const kept = items.take(2);

                return { kept, chained: kept.filter(() => true) };
            }

            expectTypeOf(taken(list).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(taken(record).kept).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(taken(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).taken(1)).toEqualTypeOf<Bag<number>>();
        });

        it("agrees with dataTake's items, a keyed result's partial", () => {
            const listTaken = collect(numberList).take(2);
            const recordTaken = collect(abc).take(-2);
            const dataList = Data.dataTake(numberList, 2);
            const dataRecord = Data.dataTake(abc, -2);

            expectTypeOf<ItemsOf<typeof listTaken>>().toEqualTypeOf<
                typeof dataList
            >();
            expectTypeOf<ItemsOf<typeof recordTaken>>().toEqualTypeOf<
                typeof dataRecord
            >();
            expectTypeOf<ItemsOf<typeof recordTaken>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a limit that is no number, or that may be null", () => {
            // @ts-expect-error - PHP's limit is an int
            list.take("2");
            // @ts-expect-error - PHP's limit is an int, never null
            list.take(maybeCount);
        });
    });

    describe("forPage", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.forPage(2, 2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.forPage(2, 1)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(partial.forPage(1, 1)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(listOrKeyed.forPage(1, 1)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
            expectTypeOf(tagged.forPage(1, 2)).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.forPage(1, 1)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.forPage(2, 1)).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function paged<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const kept = items.forPage(1, 2);

                return { kept, chained: kept.filter(() => true) };
            }

            expectTypeOf(paged(list).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(paged(record).kept).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(paged(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).page(1)).toEqualTypeOf<Bag<number>>();
        });

        it("types a keyed result's items as a record that may lack keys", () => {
            const paged = collect(abc).forPage(2, 1);

            expectTypeOf<ItemsOf<typeof paged>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a page that is no number or may be null, and a missing page size", () => {
            // @ts-expect-error - PHP's page is an int
            list.forPage("1", 2);
            // @ts-expect-error - PHP's page is an int, never null
            list.forPage(maybeCount, 2);
            // @ts-expect-error - PHP throws ArgumentCountError without a page size
            list.forPage(1);
        });
    });

    describe("nth", () => {
        it("collects every n-th item into a list, keeping a list's own type", () => {
            expectTypeOf(list.nth(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.nth(2, 1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.nth(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(partial.nth(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(listOrKeyed.nth(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(anyShape.nth(2)).toEqualTypeOf<
                Collection<unknown, number, "list">
            >();
            expectTypeOf(tagged.nth(2)).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.nth(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(mapped.nth(2)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function every<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const kept = items.nth(2);

                return { kept, chained: kept.filter(() => true) };
            }

            expectTypeOf(every(list).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(every(record).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(every(record).chained).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).everyNth(2)).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("rejects a step that is no number or may be null, and a missing one", () => {
            // @ts-expect-error - PHP's step is an int
            list.nth("2");
            // @ts-expect-error - PHP's step is an int, never null
            list.nth(maybeCount);
            // @ts-expect-error - PHP throws ArgumentCountError without a step
            list.nth();
        });
    });

    describe("chunk", () => {
        it("keeps each chunk's keys, so a list's chunks are records and a keyed one's lack keys", () => {
            expectTypeOf(list.chunk(2)).toEqualTypeOf<
                Collection<Collection<number, number, "keyed">, number, "list">
            >();
            expectTypeOf(list.chunk(2, true)).toEqualTypeOf<
                Collection<Collection<number, number, "keyed">, number, "list">
            >();
            expectTypeOf(record.chunk(2)).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(partial.chunk(1)).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b", "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(listOrKeyed.chunk(1)).toEqualTypeOf<
                Collection<
                    Collection<number, number, "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(tagged.chunk(2)).toEqualTypeOf<
                Collection<Collection<number, number, "keyed">, number, "list">
            >();
        });

        it("types a chunk as one that may lack keys when the list's key type names them", () => {
            const pair = new Collection<string, 0 | 1>(["a", "b"]);

            expectTypeOf(pair.chunk(1)).toEqualTypeOf<
                Collection<Collection<string, 0 | 1, "partial">, number, "list">
            >();
            expectTypeOf(pair.chunk(1, false)).toEqualTypeOf<
                Collection<Collection<string, number, "list">, number, "list">
            >();
        });

        it("makes each chunk a list when the keys are not preserved", () => {
            expectTypeOf(list.chunk(2, false)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
            expectTypeOf(record.chunk(2, false)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
        });

        it("types a chunk as either for a flag that may be either", () => {
            expectTypeOf(record.chunk(2, flag)).toEqualTypeOf<
                Collection<
                    Collection<
                        number,
                        "a" | "b" | "c" | number,
                        "list" | "partial"
                    >,
                    number,
                    "list"
                >
            >();
            expectTypeOf(list.chunk(2, maybeFlag)).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list" | "keyed">,
                    number,
                    "list"
                >
            >();
        });

        it("types a generic or a Map-built collection's chunks", () => {
            expectTypeOf(generic.chunk(2)).toEqualTypeOf<
                Collection<
                    Collection<number, string | number, "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(mapped.chunk(2)).toEqualTypeOf<
                Collection<
                    Collection<string, number, "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(mapped.chunk(2, false)).toEqualTypeOf<
                Collection<Collection<string, number, "list">, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function chunked<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>, keep: boolean) {
                const chunks = items.chunk(2, keep);

                return { chunks, chained: chunks.filter(() => true) };
            }

            expectTypeOf(chunked(list, true).chunks).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list" | "keyed">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(chunked(record, true).chained).toEqualTypeOf<
                Collection<
                    Collection<
                        number,
                        "a" | "b" | "c" | number,
                        "list" | "partial"
                    >,
                    number,
                    "list"
                >
            >();
        });

        it("types a generic subclass's chunks", () => {
            expectTypeOf(new Bag([1, 2]).chunked(1)).toEqualTypeOf<
                Collection<Collection<number, number, "keyed">, number, "list">
            >();
        });

        it("agrees with dataChunk's chunks for a record's kept keys and a list's dropped ones", () => {
            const recordChunks = collect(abc).chunk(2);
            const listLists = collect(numberList).chunk(2, false);
            const dataRecord = Data.dataChunk(abc, 2);
            const dataList = Data.dataChunk(numberList, 2, false);

            expectTypeOf<
                ItemsOf<ItemsOf<typeof recordChunks>[number]>
            >().toEqualTypeOf<(typeof dataRecord)[number]>();
            expectTypeOf<
                ItemsOf<ItemsOf<typeof listLists>[number]>
            >().toEqualTypeOf<(typeof dataList)[number]>();
            expectTypeOf<
                ItemsOf<ItemsOf<typeof recordChunks>[number]>
            >().toEqualTypeOf<Partial<Record<"a" | "b" | "c", number>>>();
        });

        it("differs from dataChunk for a list's kept keys and a record's dropped ones", () => {
            // dataChunk answers lists for a list's kept keys and records for a record's dropped ones, where the
            // runtime builds a record for the first and a list for the second, as array_chunk() does.
            const listChunks = collect(numberList).chunk(2);
            const recordLists = collect(abc).chunk(2, false);

            expectTypeOf<
                ItemsOf<ItemsOf<typeof listChunks>[number]>
            >().toEqualTypeOf<Record<number, number>>();
            expectTypeOf<
                ItemsOf<ItemsOf<typeof recordLists>[number]>
            >().toEqualTypeOf<number[]>();
        });

        it("rejects a size that is no number or may be null, a flag that is no bool, and a missing size", () => {
            // @ts-expect-error - PHP's size is an int
            list.chunk("2");
            // @ts-expect-error - PHP's size is an int, never null
            list.chunk(maybeCount);
            // @ts-expect-error - PHP's preserveKeys is a bool
            list.chunk(2, "yes");
            // @ts-expect-error - PHP throws ArgumentCountError without a size
            list.chunk();
        });
    });

    describe("chunkWhile", () => {
        it("keeps a list's chunks lists and makes a keyed one's partial", () => {
            expectTypeOf(
                list.chunkWhile((value, _key, chunk) => chunk.last() === value),
            ).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
            expectTypeOf(record.chunkWhile(() => true)).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(people.chunkWhile(() => true)).toEqualTypeOf<
                Collection<Collection<Row, number, "list">, number, "list">
            >();
            expectTypeOf(listOrKeyed.chunkWhile(() => true)).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list" | "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(tagged.chunkWhile(() => true)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
        });

        it("returns a collection of collections and types the callback", () => {
            const chunks = collect([1, 2, 3]).chunkWhile(
                (value, key, chunk) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();
                    expectTypeOf(chunk).toEqualTypeOf<
                        Collection<number, number>
                    >();
                    expectTypeOf(chunk.last()).toEqualTypeOf<number | null>();

                    return true;
                },
            );

            expectTypeOf(chunks).toEqualTypeOf<
                Collection<Collection<number, number>, number>
            >();
        });

        it("types a keyed callback's key and the chunk so far, which may lack keys", () => {
            record.chunkWhile((value, key, chunk) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();
                expectTypeOf(chunk).toEqualTypeOf<
                    Collection<number, "a" | "b" | "c", "partial">
                >();

                return "0";
            });
            numbered.chunkWhile((value, key, chunk) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<5 | 6>();
                expectTypeOf(chunk).toEqualTypeOf<
                    Collection<string, 5 | 6, "partial">
                >();

                return [];
            });
        });

        it("types a generic or a Map-built collection's chunks and callback", () => {
            expectTypeOf(
                generic.chunkWhile((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return true;
                }),
            ).toEqualTypeOf<
                Collection<
                    Collection<number, string | number, "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(
                mapped.chunkWhile((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return true;
                }),
            ).toEqualTypeOf<
                Collection<
                    Collection<string, number, "partial">,
                    number,
                    "list"
                >
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function runs<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const chunks = items.chunkWhile(
                    (value, _key, chunk) => chunk.last() === value,
                );

                return { chunks, chained: chunks.filter(() => true) };
            }

            expectTypeOf(runs(list).chunks).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
            expectTypeOf(runs(record).chained).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
        });

        it("types a generic subclass's chunks", () => {
            expectTypeOf(new Bag([1, 1, 2]).runs()).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
        });

        it("agrees with dataChunkWhile's chunks", () => {
            const listChunks = collect(numberList).chunkWhile(() => true);
            const recordChunks = collect(abc).chunkWhile(() => true);
            const dataList = Data.dataChunkWhile(numberList, () => true);
            const dataRecord = Data.dataChunkWhile(abc, () => true);

            expectTypeOf<
                ItemsOf<ItemsOf<typeof listChunks>[number]>
            >().toEqualTypeOf<(typeof dataList)[number]>();
            expectTypeOf<
                ItemsOf<ItemsOf<typeof recordChunks>[number]>
            >().toEqualTypeOf<(typeof dataRecord)[number]>();
            expectTypeOf<
                ItemsOf<ItemsOf<typeof recordChunks>[number]>
            >().toEqualTypeOf<Partial<Record<"a" | "b" | "c", number>>>();
        });

        it("rejects a callback over another item type, and a null one, which PHP's callable refuses", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.chunkWhile((value: string) => value === "x");
            // @ts-expect-error - PHP's callback is a callable, never null
            list.chunkWhile(null);
        });
    });

    describe("chunkBy", () => {
        it("keeps a list's chunks lists and makes a keyed one's partial", () => {
            expectTypeOf(list.chunkBy((value) => value > 1)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
            expectTypeOf(record.chunkBy((value) => value > 1)).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(listOrKeyed.chunkBy((value) => value)).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list" | "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(tagged.chunkBy((value) => value)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
        });

        it("accepts a key path or a callback for chunkBy", () => {
            const data = collect([{ parent: "a" }]);

            expectTypeOf(data.chunkBy("parent")).toEqualTypeOf<
                Collection<Collection<{ parent: string }, number>, number>
            >();
            expectTypeOf(data.chunkBy((value) => value.parent)).toEqualTypeOf<
                Collection<Collection<{ parent: string }, number>, number>
            >();
            expectTypeOf(people.chunkBy("name")).toEqualTypeOf<
                Collection<Collection<Row, number, "list">, number, "list">
            >();
        });

        it("takes a path that may be null, which reads each item itself", () => {
            expectTypeOf(people.chunkBy(maybeName)).toEqualTypeOf<
                Collection<Collection<Row, number, "list">, number, "list">
            >();
        });

        it("types the callback's value and key", () => {
            people.chunkBy((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value.name;
            });
            record.chunkBy((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return key;
            });
        });

        it("types a generic or a Map-built collection's chunks and callback", () => {
            expectTypeOf(
                generic.chunkBy((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value;
                }),
            ).toEqualTypeOf<
                Collection<
                    Collection<number, string | number, "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(
                mapped.chunkBy((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value;
                }),
            ).toEqualTypeOf<
                Collection<
                    Collection<string, number, "partial">,
                    number,
                    "list"
                >
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function runsBy<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>, path: string) {
                const chunks = items.chunkBy(path);

                return { chunks, chained: chunks.filter(() => true) };
            }

            expectTypeOf(runsBy(people, "name").chunks).toEqualTypeOf<
                Collection<Collection<Row, number, "list">, number, "list">
            >();
            expectTypeOf(runsBy(record, "a").chained).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
        });

        it("types a generic subclass's chunks", () => {
            expectTypeOf(
                new Bag([1, 2]).runsBy((value) => value > 1),
            ).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
        });

        it("agrees with dataChunkBy's chunks", () => {
            const listChunks = collect(numberList).chunkBy((value) => value);
            const recordChunks = collect(abc).chunkBy((value) => value);
            const dataList = Data.dataChunkBy(numberList, (value) => value);
            const dataRecord = Data.dataChunkBy(abc, (value) => value);

            expectTypeOf<
                ItemsOf<ItemsOf<typeof listChunks>[number]>
            >().toEqualTypeOf<(typeof dataList)[number]>();
            expectTypeOf<
                ItemsOf<ItemsOf<typeof recordChunks>[number]>
            >().toEqualTypeOf<(typeof dataRecord)[number]>();
            expectTypeOf<
                ItemsOf<ItemsOf<typeof recordChunks>[number]>
            >().toEqualTypeOf<Partial<Record<"a" | "b" | "c", number>>>();
        });

        it("rejects a callback over another item type, an object and a missing key", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.chunkBy((value: string) => value);
            // @ts-expect-error - PHP's key is a callable or a path
            list.chunkBy({});
            // @ts-expect-error - PHP throws ArgumentCountError without a key
            list.chunkBy();
        });
    });

    describe("split", () => {
        it("keeps a list's groups lists and makes a keyed one's partial", () => {
            expectTypeOf(list.split(2)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
            expectTypeOf(record.split(2)).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(partial.split(2)).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b", "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(tagged.split(2)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
        });

        it("renumbers a group's integer keys, so a group holding only those is a list", () => {
            expectTypeOf(numbered.split(2)).toEqualTypeOf<
                Collection<Collection<string, number, "list">, number, "list">
            >();
            expectTypeOf(mixedKeys.split(2)).toEqualTypeOf<
                Collection<
                    Collection<string, number | "x", "list" | "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(listOrKeyed.split(2)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
            expectTypeOf(anyShape.split(2)).toEqualTypeOf<
                Collection<
                    Collection<unknown, PropertyKey, "list" | "partial">,
                    number,
                    "list"
                >
            >();
        });

        it("types a generic or a Map-built collection's groups", () => {
            expectTypeOf(generic.split(2)).toEqualTypeOf<
                Collection<
                    Collection<number, string | number, "list" | "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(mapped.split(2)).toEqualTypeOf<
                Collection<Collection<string, number, "list">, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function halves<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const groups = items.split(2);

                return { groups, chained: groups.filter(() => true) };
            }

            expectTypeOf(halves(list).groups).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
            expectTypeOf(halves(record).chained).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
        });

        it("types a generic subclass's groups", () => {
            expectTypeOf(new Bag([1, 2]).halves()).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
        });

        it("rejects a number of groups that is no number or may be null, and a missing one", () => {
            // @ts-expect-error - PHP's number of groups is an int
            list.split("2");
            // @ts-expect-error - PHP's number of groups is an int, never null
            list.split(maybeCount);
            // @ts-expect-error - PHP throws ArgumentCountError without a number of groups
            list.split();
        });
    });

    describe("splitIn", () => {
        it("keeps each group's keys, so a list's groups are records and a keyed one's lack keys", () => {
            expectTypeOf(list.splitIn(2)).toEqualTypeOf<
                Collection<Collection<number, number, "keyed">, number, "list">
            >();
            expectTypeOf(record.splitIn(2)).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(partial.splitIn(2)).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b", "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(listOrKeyed.splitIn(2)).toEqualTypeOf<
                Collection<
                    Collection<number, number, "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(tagged.splitIn(2)).toEqualTypeOf<
                Collection<Collection<number, number, "keyed">, number, "list">
            >();
        });

        it("types a group as one that may lack keys when the list's key type names them", () => {
            expectTypeOf(
                new Collection<string, 0 | 1>(["a", "b"]).splitIn(2),
            ).toEqualTypeOf<
                Collection<Collection<string, 0 | 1, "partial">, number, "list">
            >();
        });

        it("types a generic or a Map-built collection's groups", () => {
            expectTypeOf(generic.splitIn(2)).toEqualTypeOf<
                Collection<
                    Collection<number, string | number, "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(mapped.splitIn(2)).toEqualTypeOf<
                Collection<
                    Collection<string, number, "partial">,
                    number,
                    "list"
                >
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function halvesFilled<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const groups = items.splitIn(2);

                return { groups, chained: groups.filter(() => true) };
            }

            expectTypeOf(halvesFilled(list).groups).toEqualTypeOf<
                Collection<Collection<number, number, "keyed">, number, "list">
            >();
            expectTypeOf(halvesFilled(record).chained).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
        });

        it("types a generic subclass's groups", () => {
            expectTypeOf(new Bag([1, 2]).halvesFilled()).toEqualTypeOf<
                Collection<Collection<number, number, "keyed">, number, "list">
            >();
        });

        it("rejects a number of groups that is no number, or that may be null", () => {
            // @ts-expect-error - PHP's number of groups is an int
            list.splitIn("2");
            // @ts-expect-error - PHP's number of groups is an int, never null
            list.splitIn(maybeCount);
        });
    });

    describe("sliding", () => {
        it("keeps a list's windows lists and makes a keyed one's partial", () => {
            expectTypeOf(list.sliding(2)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
            expectTypeOf(list.sliding()).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
            expectTypeOf(record.sliding(2, 1)).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(people.sliding(3, 2)).toEqualTypeOf<
                Collection<Collection<Row, number, "list">, number, "list">
            >();
            expectTypeOf(listOrKeyed.sliding()).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list" | "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(tagged.sliding()).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
        });

        it("types a generic or a Map-built collection's windows", () => {
            expectTypeOf(generic.sliding()).toEqualTypeOf<
                Collection<
                    Collection<number, string | number, "partial">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(mapped.sliding()).toEqualTypeOf<
                Collection<
                    Collection<string, number, "partial">,
                    number,
                    "list"
                >
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function windows<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const windowed = items.sliding(2);

                return { windowed, chained: windowed.filter(() => true) };
            }

            expectTypeOf(windows(list).windowed).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
            expectTypeOf(windows(record).chained).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "list"
                >
            >();
        });

        it("types a generic subclass's windows", () => {
            expectTypeOf(new Bag([1, 2]).windows()).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "list">
            >();
        });

        it("rejects a size that is no number, or that may be null", () => {
            // @ts-expect-error - PHP's size is an int
            list.sliding("2");
            // @ts-expect-error - PHP's size is an int, never null
            list.sliding(maybeCount);
        });
    });

    describe("sort", () => {
        it("keeps a list's own type, and a keyed one's whose key type survives renumbering", () => {
            expectTypeOf(lookup.sort()).toEqualTypeOf<Lookup>();
            expectTypeOf(tally.sort()).toEqualTypeOf<Tally>();
            expectTypeOf(list.sort()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.sort((a, b) => a - b)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.sort()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(partial.sort()).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(tagged.sort()).toEqualTypeOf<Tagged>();
            expectTypeOf(settings.sort()).toEqualTypeOf<Settings>();
        });

        it("renumbers a keyed collection's integer keys, keeping its string keys", () => {
            expectTypeOf(ranked.sort()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(numbered.sort()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(mixedKeys.sort()).toEqualTypeOf<
                Collection<string, number | "x", "keyed">
            >();
            expectTypeOf(listOrKeyed.sort()).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
            expectTypeOf(anyShape.sort()).toEqualTypeOf<
                Collection<unknown, PropertyKey, CollectionShape>
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.sort()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.sort()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("types sort()'s callback as a comparator of two items", () => {
            collect([{ n: 1 }, { n: 2 }]).sort((a, b) => {
                expectTypeOf(a).toEqualTypeOf<{ n: number }>();
                expectTypeOf(b).toEqualTypeOf<{ n: number }>();

                return a.n - b.n;
            });
            record.sort((a, b) => {
                expectTypeOf(a).toEqualTypeOf<number>();
                expectTypeOf(b).toEqualTypeOf<number>();

                return a > b;
            });
            generic.sort((a, b) => {
                expectTypeOf(a).toEqualTypeOf<number>();
                expectTypeOf(b).toEqualTypeOf<number>();

                return a - b;
            });
            mapped.sort((a, b) => {
                expectTypeOf(a).toEqualTypeOf<string>();
                expectTypeOf(b).toEqualTypeOf<string>();

                return a.localeCompare(b);
            });
        });

        it("takes a comparator that may be null, as PHP's does", () => {
            expectTypeOf(list.sort(maybeComparator)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(numbered.sort(null)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function ordered<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const sorted = items.sort();

                return { sorted, chained: sorted.filter(() => true) };
            }
            function orderedList<TItem>(items: Collection<TItem>) {
                return items.sort().filter(() => true);
            }

            expectTypeOf(ordered(record).sorted).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(ordered(numbered).sorted).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(ordered(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(orderedList(list)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([2, 1]).ordered()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("rejects the forms PHP rejects", () => {
            const numbers = collect([3, 1, 2]);

            // @ts-expect-error - sort() takes a comparator, never a path, which PHP's asort() refuses as a flag
            numbers.sort("n");
            // @ts-expect-error - sortDesc() takes no callback; sortByDesc() does
            numbers.sortDesc((value: number) => value);
            // @ts-expect-error - sortByMany() is protected, as PHP's is; sortBy([...]) reaches it
            numbers.sortByMany(["n"]);
        });

        it("rejects a comparator over another item type, or answering no number", () => {
            // @ts-expect-error - a number list's comparator takes numbers, which have no name
            list.sort((a, _b) => a.name);
            // @ts-expect-error - a comparator answers a number or a bool, never a string
            people.sort((a, _b) => a.name);
        });
    });

    describe("sortDesc", () => {
        it("keeps a list's own type, and a keyed one's whose key type survives renumbering", () => {
            expectTypeOf(lookup.sortDesc()).toEqualTypeOf<Lookup>();
            expectTypeOf(list.sortDesc()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.sortDesc()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(partial.sortDesc()).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(tagged.sortDesc()).toEqualTypeOf<Tagged>();
            expectTypeOf(settings.sortDesc()).toEqualTypeOf<Settings>();
        });

        it("renumbers a keyed collection's integer keys, keeping its string keys", () => {
            expectTypeOf(ranked.sortDesc()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(numbered.sortDesc()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(mixedKeys.sortDesc()).toEqualTypeOf<
                Collection<string, number | "x", "keyed">
            >();
            expectTypeOf(listOrKeyed.sortDesc()).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.sortDesc()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.sortDesc()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function orderedDesc<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const sorted = items.sortDesc();

                return { sorted, chained: sorted.filter(() => true) };
            }

            expectTypeOf(orderedDesc(list).sorted).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(orderedDesc(numbered).sorted).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(orderedDesc(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).orderedDesc()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("rejects a sort flag, which is not ported", () => {
            // @ts-expect-error - PHP's sort flags are not ported
            list.sortDesc(1);
        });
    });

    describe("sortBy", () => {
        it("keeps a list's own type, and a keyed one's whose key type survives renumbering", () => {
            expectTypeOf(
                lookup.sortBy((value) => value),
            ).toEqualTypeOf<Lookup>();
            expectTypeOf(people.sortBy("name")).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.sortBy((row) => row.name)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.sortBy(["name", "id"])).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(record.sortBy((value) => -value)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(partial.sortBy((value) => value)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(
                tagged.sortBy((value) => value),
            ).toEqualTypeOf<Tagged>();
            expectTypeOf(
                settings.sortBy((value) => value),
            ).toEqualTypeOf<Settings>();
        });

        it("renumbers a keyed collection's integer keys, keeping its string keys", () => {
            expectTypeOf(ranked.sortBy((value) => value)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(numbered.sortBy((value) => value)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(mixedKeys.sortBy((value) => value)).toEqualTypeOf<
                Collection<string, number | "x", "keyed">
            >();
            expectTypeOf(listOrKeyed.sortBy((value) => value)).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.sortBy((value) => value)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.sortBy((value) => value)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("types an array form's comparators as two items", () => {
            expectTypeOf(
                people.sortBy([
                    ["name", "asc"],
                    [
                        (a, b) => {
                            expectTypeOf(a).toEqualTypeOf<Row>();
                            expectTypeOf(b).toEqualTypeOf<Row>();

                            return a.id - b.id;
                        },
                    ],
                ]),
            ).toEqualTypeOf<Collection<Row, number, "list">>();
            expectTypeOf(
                people.sortBy([
                    (a, b) => {
                        expectTypeOf(a).toEqualTypeOf<Row>();
                        expectTypeOf(b).toEqualTypeOf<Row>();

                        return a.name > b.name;
                    },
                ]),
            ).toEqualTypeOf<Collection<Row, number, "list">>();
            expectTypeOf(people.sortBy([[byId]])).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
        });

        it("takes each descriptor form PHP takes, and a direction", () => {
            expectTypeOf(
                people.sortBy([
                    ["name"],
                    ["id", false],
                    ["name", "desc"],
                    ["id", SortDirection.Descending],
                    "name",
                    byId,
                ]),
            ).toEqualTypeOf<Collection<Row, number, "list">>();
            expectTypeOf(people.sortBy("name", true)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(
                people.sortBy("name", SortDirection.Descending),
            ).toEqualTypeOf<Collection<Row, number, "list">>();
            expectTypeOf(people.sortBy("name", direction)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
        });

        it("takes a path that may be null, which sorts the items themselves", () => {
            expectTypeOf(people.sortBy(maybeName)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(record.sortBy(null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
        });

        it("types the callback's value and key", () => {
            people.sortBy((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value.id;
            });
            record.sortBy((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return key;
            });
            numbered.sortBy((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<5 | 6>();

                return value;
            });
            generic.sortBy((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value;
            });
            mapped.sortBy((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return key;
            });
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function orderedBy<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>, path: string) {
                const sorted = items.sortBy(path);

                return { sorted, chained: sorted.filter(() => true) };
            }

            expectTypeOf(orderedBy(people, "name").sorted).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(orderedBy(numbered, "x").sorted).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(orderedBy(record, "x").chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(
                new Bag([2, 1]).orderedBy((value) => value),
            ).toEqualTypeOf<Bag<number>>();
        });

        it("rejects a descriptor direction PHP names no form of, and a comparator over another item type", () => {
            // @ts-expect-error - a descriptor's direction is a bool, "asc", "desc" or a SortDirection
            people.sortBy([["name", "up"]]);
            // @ts-expect-error - a rows collection's comparator takes rows
            people.sortBy([(a: string, b: string) => a.length - b.length]);
            // @ts-expect-error - a rows collection's nested comparator takes rows
            people.sortBy([[(a: string, b: string) => a.length - b.length]]);
        });

        it("rejects a direction that is no bool or SortDirection, an object and a missing callback", () => {
            // @ts-expect-error - PHP's descending flag is a bool or a SortDirection
            people.sortBy("name", "desc");
            // @ts-expect-error - PHP's callback is an array, a callable or a path
            people.sortBy({});
            // @ts-expect-error - PHP throws ArgumentCountError without a callback
            people.sortBy();
        });
    });

    describe("sortByDesc", () => {
        it("keeps a list's own type, and a keyed one's whose key type survives renumbering", () => {
            expectTypeOf(
                lookup.sortByDesc((value) => value),
            ).toEqualTypeOf<Lookup>();
            expectTypeOf(people.sortByDesc("name")).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.sortByDesc((row) => row.id)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.sortByDesc(["id"])).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(record.sortByDesc((value) => value)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(partial.sortByDesc((value) => value)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(
                tagged.sortByDesc((value) => value),
            ).toEqualTypeOf<Tagged>();
            expectTypeOf(
                settings.sortByDesc((value) => value),
            ).toEqualTypeOf<Settings>();
        });

        it("renumbers a keyed collection's integer keys, keeping its string keys", () => {
            expectTypeOf(ranked.sortByDesc((value) => value)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(numbered.sortByDesc((value) => value)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(mixedKeys.sortByDesc((value) => value)).toEqualTypeOf<
                Collection<string, number | "x", "keyed">
            >();
            expectTypeOf(
                listOrKeyed.sortByDesc((value) => value),
            ).toEqualTypeOf<Collection<number, number, "list" | "keyed">>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.sortByDesc((value) => value)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.sortByDesc((value) => value)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("types an array form's comparators as two items", () => {
            expectTypeOf(
                people.sortByDesc([
                    ["name", "asc"],
                    [
                        (a, b) => {
                            expectTypeOf(a).toEqualTypeOf<Row>();
                            expectTypeOf(b).toEqualTypeOf<Row>();

                            return a.id - b.id;
                        },
                    ],
                    byId,
                ]),
            ).toEqualTypeOf<Collection<Row, number, "list">>();
            expectTypeOf(
                people.sortByDesc([
                    (a, b) => {
                        expectTypeOf(a).toEqualTypeOf<Row>();
                        expectTypeOf(b).toEqualTypeOf<Row>();

                        return a.name > b.name;
                    },
                ]),
            ).toEqualTypeOf<Collection<Row, number, "list">>();
        });

        it("takes a path that may be null, which sorts the items themselves", () => {
            expectTypeOf(people.sortByDesc(maybeName)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
        });

        it("types the callback's value and key", () => {
            people.sortByDesc((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value.id;
            });
            record.sortByDesc((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return key;
            });
            generic.sortByDesc((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value;
            });
            mapped.sortByDesc((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return key;
            });
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function orderedByDesc<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const sorted = items.sortByDesc((value) => value);

                return { sorted, chained: sorted.filter(() => true) };
            }

            expectTypeOf(orderedByDesc(list).sorted).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(orderedByDesc(numbered).sorted).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(orderedByDesc(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(
                new Bag([1, 2]).orderedByDesc((value) => value),
            ).toEqualTypeOf<Bag<number>>();
        });

        it("rejects a descriptor direction PHP names no form of, a comparator of other items and a flag", () => {
            // @ts-expect-error - a descriptor's direction is a bool, "asc", "desc" or a SortDirection
            people.sortByDesc([["name", "up"]]);
            // @ts-expect-error - a rows collection's comparator takes rows
            people.sortByDesc([(a: string, b: string) => a.length - b.length]);
            // @ts-expect-error - PHP's sort flags are not ported
            people.sortByDesc("name", 1);
        });
    });

    describe("sortKeys", () => {
        it("keeps a list's own type, and a keyed one's whose key type survives renumbering", () => {
            expectTypeOf(lookup.sortKeys()).toEqualTypeOf<Lookup>();
            expectTypeOf(list.sortKeys()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.sortKeys()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(record.sortKeys(true)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(
                record.sortKeys(SortDirection.Descending),
            ).toEqualTypeOf<Collection<number, "a" | "b" | "c", "keyed">>();
            expectTypeOf(record.sortKeys(direction)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(partial.sortKeys()).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(tagged.sortKeys()).toEqualTypeOf<Tagged>();
            expectTypeOf(settings.sortKeys()).toEqualTypeOf<Settings>();
        });

        it("renumbers a keyed collection's integer keys, keeping its string keys", () => {
            expectTypeOf(ranked.sortKeys()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(numbered.sortKeys()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(mixedKeys.sortKeys(true)).toEqualTypeOf<
                Collection<string, number | "x", "keyed">
            >();
            expectTypeOf(listOrKeyed.sortKeys()).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.sortKeys()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.sortKeys()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function keysOrdered<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const sorted = items.sortKeys(true);

                return { sorted, chained: sorted.filter(() => true) };
            }

            expectTypeOf(keysOrdered(list).sorted).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(keysOrdered(numbered).sorted).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(keysOrdered(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).keysOrdered()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("rejects a direction that is no bool or SortDirection, and null", () => {
            // @ts-expect-error - PHP's descending flag is a bool or a SortDirection
            record.sortKeys("desc");
            // @ts-expect-error - PHP's match() has no arm for null
            record.sortKeys(null);
        });
    });

    describe("sortKeysDesc", () => {
        it("keeps a list's own type, and a keyed one's whose key type survives renumbering", () => {
            expectTypeOf(lookup.sortKeysDesc()).toEqualTypeOf<Lookup>();
            expectTypeOf(list.sortKeysDesc()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.sortKeysDesc()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(partial.sortKeysDesc()).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(tagged.sortKeysDesc()).toEqualTypeOf<Tagged>();
            expectTypeOf(settings.sortKeysDesc()).toEqualTypeOf<Settings>();
        });

        it("renumbers a keyed collection's integer keys, keeping its string keys", () => {
            expectTypeOf(ranked.sortKeysDesc()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(numbered.sortKeysDesc()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(mixedKeys.sortKeysDesc()).toEqualTypeOf<
                Collection<string, number | "x", "keyed">
            >();
            expectTypeOf(listOrKeyed.sortKeysDesc()).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.sortKeysDesc()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.sortKeysDesc()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function keysOrderedDesc<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const sorted = items.sortKeysDesc();

                return { sorted, chained: sorted.filter(() => true) };
            }

            expectTypeOf(keysOrderedDesc(list).sorted).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(keysOrderedDesc(numbered).sorted).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(keysOrderedDesc(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).keysOrderedDesc()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("rejects a sort flag, which is not ported", () => {
            // @ts-expect-error - PHP's sort flags are not ported
            record.sortKeysDesc(1);
        });
    });

    describe("sortKeysUsing", () => {
        it("keeps a list's own type, and a keyed one's whose key type survives renumbering", () => {
            expectTypeOf(
                lookup.sortKeysUsing((a, b) =>
                    String(a).localeCompare(String(b)),
                ),
            ).toEqualTypeOf<Lookup>();
            expectTypeOf(list.sortKeysUsing((a, b) => b - a)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(
                record.sortKeysUsing((a, b) => a.localeCompare(b)),
            ).toEqualTypeOf<Collection<number, "a" | "b" | "c", "keyed">>();
            expectTypeOf(partial.sortKeysUsing((a, b) => a > b)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(
                tagged.sortKeysUsing((a, b) => a - b),
            ).toEqualTypeOf<Tagged>();
            expectTypeOf(
                settings.sortKeysUsing((a, b) => a.localeCompare(b)),
            ).toEqualTypeOf<Settings>();
        });

        it("renumbers a keyed collection's integer keys, keeping its string keys", () => {
            expectTypeOf(ranked.sortKeysUsing((a, b) => a - b)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(numbered.sortKeysUsing((a, b) => b - a)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(
                mixedKeys.sortKeysUsing((a, b) =>
                    String(a).localeCompare(String(b)),
                ),
            ).toEqualTypeOf<Collection<string, number | "x", "keyed">>();
            expectTypeOf(
                listOrKeyed.sortKeysUsing((a, b) => a - b),
            ).toEqualTypeOf<Collection<number, number, "list" | "keyed">>();
        });

        it("types the callback's keys", () => {
            list.sortKeysUsing((a, b) => {
                expectTypeOf(a).toEqualTypeOf<number>();
                expectTypeOf(b).toEqualTypeOf<number>();

                return a - b;
            });
            record.sortKeysUsing((a, b) => {
                expectTypeOf(a).toEqualTypeOf<"a" | "b" | "c">();
                expectTypeOf(b).toEqualTypeOf<"a" | "b" | "c">();

                return a > b;
            });
            numbered.sortKeysUsing((a, b) => {
                expectTypeOf(a).toEqualTypeOf<5 | 6>();
                expectTypeOf(b).toEqualTypeOf<5 | 6>();

                return a - b;
            });
        });

        it("types a generic or a Map-built collection's result and callback", () => {
            expectTypeOf(
                generic.sortKeysUsing((a, b) => {
                    expectTypeOf(a).toEqualTypeOf<string | number>();
                    expectTypeOf(b).toEqualTypeOf<string | number>();

                    return String(a).localeCompare(String(b));
                }),
            ).toEqualTypeOf<Collection<number, string | number, "keyed">>();
            expectTypeOf(
                mapped.sortKeysUsing((a, b) => {
                    expectTypeOf(a).toEqualTypeOf<number>();
                    expectTypeOf(b).toEqualTypeOf<number>();

                    return a - b;
                }),
            ).toEqualTypeOf<Collection<string, number, "keyed">>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function keysOrderedUsing<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const sorted = items.sortKeysUsing((a, b) =>
                    String(a).localeCompare(String(b)),
                );

                return { sorted, chained: sorted.filter(() => true) };
            }

            expectTypeOf(keysOrderedUsing(list).sorted).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(keysOrderedUsing(numbered).sorted).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(keysOrderedUsing(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).keysOrderedUsing()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("rejects a comparator over another key type, and a null one, which PHP's callable refuses", () => {
            // @ts-expect-error - a record's keys are strings
            record.sortKeysUsing((a: number, b: number) => a - b);
            // @ts-expect-error - PHP's callback is a callable, never null
            record.sortKeysUsing(null);
        });
    });

    describe("reverse", () => {
        it("keeps a list's own type, and a keyed one's whose key type survives renumbering", () => {
            expectTypeOf(lookup.reverse()).toEqualTypeOf<Lookup>();
            expectTypeOf(list.reverse()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.reverse()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(partial.reverse()).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(tagged.reverse()).toEqualTypeOf<Tagged>();
            expectTypeOf(settings.reverse()).toEqualTypeOf<Settings>();
        });

        it("renumbers a keyed collection's integer keys, keeping its string keys", () => {
            expectTypeOf(ranked.reverse()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(numbered.reverse()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(mixedKeys.reverse()).toEqualTypeOf<
                Collection<string, number | "x", "keyed">
            >();
            expectTypeOf(listOrKeyed.reverse()).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
            expectTypeOf(anyShape.reverse()).toEqualTypeOf<
                Collection<unknown, PropertyKey, CollectionShape>
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.reverse()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.reverse()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function reversed<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const flipped = items.reverse();

                return { flipped, chained: flipped.filter(() => true) };
            }

            expectTypeOf(reversed(list).flipped).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(reversed(numbered).flipped).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(reversed(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).reversed()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("agrees with dataReverse's items", () => {
            const listReversed = collect(numberList).reverse();
            const recordReversed = collect(abc).reverse();
            const dataList = Data.dataReverse(numberList);
            const dataRecord = Data.dataReverse(abc);

            expectTypeOf<ItemsOf<typeof listReversed>>().toEqualTypeOf<
                typeof dataList
            >();
            expectTypeOf<ItemsOf<typeof recordReversed>>().toEqualTypeOf<
                typeof dataRecord
            >();
            expectTypeOf<ItemsOf<typeof recordReversed>>().toEqualTypeOf<
                Record<"a" | "b" | "c", number>
            >();
        });

        it("rejects an argument, which PHP's reverse() takes none of", () => {
            // @ts-expect-error - reverse() takes no argument
            list.reverse(true);
        });
    });

    describe("shuffle", () => {
        it("makes a list of the items, keeping a list's own type", () => {
            expectTypeOf(list.shuffle()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.shuffle()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(partial.shuffle()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(listOrKeyed.shuffle()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(anyShape.shuffle()).toEqualTypeOf<
                Collection<unknown, number, "list">
            >();
            expectTypeOf(tagged.shuffle()).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.shuffle()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(mapped.shuffle()).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function shuffled<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const mixed = items.shuffle();

                return { mixed, chained: mixed.filter(() => true) };
            }

            expectTypeOf(shuffled(list).mixed).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(shuffled(record).mixed).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(shuffled(record).chained).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).shuffled()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("agrees with dataShuffle's items for a list", () => {
            const listShuffled = collect(numberList).shuffle();
            const dataList = Data.dataShuffle(numberList);

            expectTypeOf<ItemsOf<typeof listShuffled>>().toEqualTypeOf<
                typeof dataList
            >();
        });

        it("differs from dataShuffle for a record, which the runtime makes a list", () => {
            // dataShuffle answers a record keyed by number for a record; the runtime hands back a list, as PHP does.
            const recordShuffled = collect(abc).shuffle();

            expectTypeOf<ItemsOf<typeof recordShuffled>>().toEqualTypeOf<
                number[]
            >();
        });

        it("rejects an argument, which PHP's shuffle() takes none of", () => {
            // @ts-expect-error - shuffle() takes no argument
            list.shuffle(1);
        });
    });
});
