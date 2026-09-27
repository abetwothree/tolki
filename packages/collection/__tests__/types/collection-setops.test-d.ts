import { collect, Collection, type CollectionShape } from "@tolki/collection";
import * as Data from "@tolki/data";
import type { JsonSerializable } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import type { ItemsOf } from "../helpers";
import {
    abc,
    ArrayableRecord,
    ConvertsToJSON,
    generic,
    JsonText,
    mapBuilt,
    numberList,
    numbers,
    SerializesRecord,
    SerializesScalar,
    Tagged,
} from "./fixtures";

declare const strings: Collection<string, "a">;
declare const dates: Map<"p" | "q", Date>;
declare const partial: Collection<number, "a" | "b", "partial">;
declare const listOrKeyed: Collection<number, number, "list" | "keyed">;
declare const maybeList: readonly number[] | null;
declare const maybeFields: { c: string } | undefined;
declare const eitherFields: { c: string } | { d: string };
declare const optionalFields: { c?: string };
declare const maybeCount: number | null;
declare const serializable: JsonSerializable;
declare const unknownArrayable: { toArray(): unknown };

/** Operands declared apart, so a pin's data call is typed on its own, not by the answer it is checked against. */
const two = [2];
const onlyA = { a: 1 };
const words = ["x", "y"];

/** Items typed as literals, whose keys a combined result may lack. */
const letters = ["a", "b"] as const;

/**
 * Compare two strings case-insensitively, answering a number as PHP's strcasecmp() does.
 *
 * @param first - The first string
 * @param second - The second string
 * @returns 0 for equal strings, else a negative or positive number
 */
function strcasecmp(first: string, second: string): number {
    return first.toLowerCase().localeCompare(second.toLowerCase());
}

/**
 * Compare two keys by their text, answering a number as PHP's strcasecmp() does.
 *
 * @param first - The first key
 * @param second - The second key
 * @returns 0 for equal keys, else a negative or positive number
 */
function compareKeys(first: PropertyKey, second: PropertyKey): number {
    return String(first).localeCompare(String(second));
}

/**
 * Compare two numbers, answering -1, 0 or 1 as PHP's <=> does.
 *
 * @param first - The first number
 * @param second - The second number
 * @returns The sign of their difference
 */
function spaceship(first: number, second: number): number {
    return Math.sign(first - second);
}

/**
 * Test two values for equality, the boolean contract the data helpers take.
 *
 * @param first - The first value
 * @param second - The second value
 * @returns Whether the values are identical
 */
function equal(first: unknown, second: unknown): boolean {
    return first === second;
}

/** A generic subclass, whose methods call the family on a `this` typed by its own parameter. */
class Bag<TItem> extends Collection<TItem> {
    /**
     * Drop the given items.
     *
     * @param items - The items to drop
     * @returns The bag's type, since a list stays one
     */
    without(items: readonly TItem[]) {
        return this.diff(items);
    }

    /**
     * Drop the given items, compared by the given comparator.
     *
     * @param items - The items to drop
     * @param compare - The comparator
     * @returns The bag's type, since a list stays one
     */
    withoutMatching(
        items: readonly TItem[],
        compare: (first: TItem, second: TItem) => number,
    ) {
        return this.diffUsing(items, compare);
    }

    /**
     * Drop the items the given items hold under the same key.
     *
     * @param items - The items to drop
     * @returns The bag's type, since a list stays one
     */
    withoutPairs(items: readonly TItem[]) {
        return this.diffAssoc(items);
    }

    /**
     * Drop the items the given items hold under a key the comparator matches.
     *
     * @param items - The items to drop
     * @param compare - The key comparator
     * @returns The bag's type, since a list stays one
     */
    withoutPairsMatching(
        items: readonly TItem[],
        compare: (first: number, second: number) => number,
    ) {
        return this.diffAssocUsing(items, compare);
    }

    /**
     * Drop the items under the given items' keys.
     *
     * @param items - The items whose keys to drop
     * @returns The bag's type, since a list stays one
     */
    withoutKeys(items: readonly TItem[]) {
        return this.diffKeys(items);
    }

    /**
     * Drop the items under a key the comparator matches with one of the given items'.
     *
     * @param items - The items whose keys to drop
     * @param compare - The key comparator
     * @returns The bag's type, since a list stays one
     */
    withoutKeysMatching(
        items: readonly TItem[],
        compare: (first: number, second: number) => number,
    ) {
        return this.diffKeysUsing(items, compare);
    }

    /**
     * Keep the given items.
     *
     * @param items - The items to keep
     * @returns The bag's type, since a list stays one
     */
    within(items: readonly TItem[]) {
        return this.intersect(items);
    }

    /**
     * Keep the given items, compared by the given comparator.
     *
     * @param items - The items to keep
     * @param compare - The comparator
     * @returns The bag's type, since a list stays one
     */
    withinMatching(
        items: readonly TItem[],
        compare: (first: TItem, second: TItem) => number,
    ) {
        return this.intersectUsing(items, compare);
    }

    /**
     * Keep the items the given items hold under the same key.
     *
     * @param items - The items to keep
     * @returns The bag's type, since a list stays one
     */
    withinPairs(items: readonly TItem[]) {
        return this.intersectAssoc(items);
    }

    /**
     * Keep the items the given items hold under a key the comparator matches.
     *
     * @param items - The items to keep
     * @param compare - The key comparator
     * @returns The bag's type, since a list stays one
     */
    withinPairsMatching(
        items: readonly TItem[],
        compare: (first: number, second: number) => number,
    ) {
        return this.intersectAssocUsing(items, compare);
    }

    /**
     * Keep the items under the given items' keys.
     *
     * @param items - The items whose keys to keep
     * @returns The bag's type, since a list stays one
     */
    withinKeys(items: readonly TItem[]) {
        return this.intersectByKeys(items);
    }

    /**
     * Append the given items.
     *
     * @param items - The items to append
     * @returns A base collection, since the values may change
     */
    joined(items: readonly TItem[]) {
        return this.merge(items);
    }

    /**
     * Append the given items, merging those under a key both hold.
     *
     * @param items - The items to append
     * @returns A base collection, since the values may change
     */
    joinedDeep(items: readonly TItem[]) {
        return this.mergeRecursive(items);
    }

    /**
     * Add the given items under the keys the bag lacks.
     *
     * @param items - The items to add
     * @returns A base collection, since the values may change
     */
    united(items: readonly TItem[]) {
        return this.union(items);
    }

    /**
     * Replace the items under the given items' keys.
     *
     * @param items - The replacements
     * @returns A base collection, since the values may change
     */
    replaced(items: readonly TItem[]) {
        return this.replace(items);
    }

    /**
     * Replace the items under the given items' keys, at every depth.
     *
     * @param items - The replacements
     * @returns A base collection, since the values may change
     */
    replacedDeep(items: readonly TItem[]) {
        return this.replaceRecursive(items);
    }

    /**
     * Key the given values by the bag's items.
     *
     * @param values - The values to key
     * @returns A base collection, since the values and keys change
     */
    keying<TValue>(values: readonly TValue[]) {
        return this.combine(values);
    }

    /**
     * Pair each item with each of the given items.
     *
     * @param items - The items to pair with
     * @returns A base collection of the pairs
     */
    crossed(items: readonly TItem[]) {
        return this.crossJoin(items);
    }

    /**
     * Pair the items with the given items by position.
     *
     * @param items - The items to pair with
     * @returns A base collection of the pairs
     */
    zipped(items: readonly TItem[]) {
        return this.zip(items);
    }

    /**
     * Repeat the items.
     *
     * @param times - How many times to repeat them
     * @returns A base collection, since a record's items make a list
     */
    repeated(times: number) {
        return this.multiply(times);
    }
}

describe("collection set operation type tests", () => {
    const list = collect([1, 2, 3]);
    const record = collect({ a: 1, b: 2 });
    const rows = collect([{ id: 1, name: "Taylor" }]);
    const mapped = collect(mapBuilt);
    const tagged = new Tagged([1, 2, 3], "tag");

    describe("diff", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.diff([2])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.diff({ a: 1 })).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(partial.diff([1])).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(listOrKeyed.diff([1])).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
            expectTypeOf(tagged.diff([1])).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.diff([1])).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.diff(["a"])).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("takes a collection of another value and key type", () => {
            expectTypeOf(list.diff(strings)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("takes a Map", () => {
            expectTypeOf(list.diff(new Map([["k", 1]]))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(list.diff(maybeList)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.diff(maybeList)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function without<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                const kept = items.diff(other);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(without(list, [2]).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(without(record, [2]).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(without(record, [2]).chained).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).without([1])).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("agrees with dataDiff's items, a keyed result's partial", () => {
            const listDiffed = collect(numberList).diff(two);
            const recordDiffed = collect(abc).diff(onlyA);

            expectTypeOf<ItemsOf<typeof listDiffed>>().toEqualTypeOf(
                Data.dataDiff(numberList, two),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf(
                Data.dataDiff(abc, onlyA),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.diff(2);
        });
    });

    describe("diffUsing", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.diffUsing([2], spaceship)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.diffUsing([2], spaceship)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(
                tagged.diffUsing([2], spaceship),
            ).toEqualTypeOf<Tagged>();
        });

        it("types the callback's second value as the operand's, not the item's", () => {
            rows.diffUsing([{ id: 1 }], (a, b) => {
                expectTypeOf(a).toEqualTypeOf<{ id: number; name: string }>();
                expectTypeOf(b).toEqualTypeOf<{ id: number }>();

                return a.id === b.id;
            });
        });

        it("types b as a collection's items, a subclass's too", () => {
            list.diffUsing(strings, (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return true;
            });
            list.diffUsing(new Tagged([4]), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<number>();

                return true;
            });
        });

        it("types b as a Map's values, which a literal key never leaves undefined", () => {
            list.diffUsing(dates, (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<Date>();

                return true;
            });
        });

        it("types b as a list's items", () => {
            list.diffUsing(["x"], (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return true;
            });
        });

        it("types b as an Arrayable's items", () => {
            list.diffUsing(new ArrayableRecord(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return true;
            });
        });

        it("types b as a generator's values", () => {
            list.diffUsing(numbers(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<number>();

                return true;
            });
        });

        it("types b as unknown for a Jsonable, whose JSON text no type can read", () => {
            list.diffUsing(new JsonText(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<unknown>();

                return true;
            });
        });

        it("types b as a JsonSerializable's answer, or the answer itself when it is a scalar", () => {
            list.diffUsing(new SerializesRecord(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return true;
            });
            list.diffUsing(new SerializesScalar(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<string>();

                return true;
            });
        });

        it("types b as a class's own fields, never its toJSON() answer", () => {
            list.diffUsing(new ConvertsToJSON(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<number>();

                return true;
            });
        });

        it("types b as never for a Date, which has no own fields", () => {
            list.diffUsing(new Date(), (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<never>();

                return true;
            });
        });

        it("types b as a record's values", () => {
            list.diffUsing({ x: 1, y: "s" }, (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<number | string>();

                return true;
            });
        });

        it("types b as never for null, which holds no items", () => {
            list.diffUsing(null, (_a, b) => {
                expectTypeOf(b).toEqualTypeOf<never>();

                return true;
            });
        });

        it("takes a declared comparator for an operand typed any, as JSON.parse() answers", () => {
            const compare = (a: number, b: number) => a - b;

            list.diffUsing(JSON.parse("[2]"), compare);
        });

        it("types a generic or a Map-built collection's callback and result", () => {
            expectTypeOf(
                generic.diffUsing([1], (a, b) => {
                    expectTypeOf(a).toEqualTypeOf<number>();
                    expectTypeOf(b).toEqualTypeOf<number>();

                    return a - b;
                }),
            ).toEqualTypeOf<Collection<number, string | number, "partial">>();
            expectTypeOf(
                mapped.diffUsing(["A"], (a, b) => {
                    expectTypeOf(a).toEqualTypeOf<string>();
                    expectTypeOf(b).toEqualTypeOf<string>();

                    return strcasecmp(a, b);
                }),
            ).toEqualTypeOf<Collection<string, number, "partial">>();
        });

        it("takes a comparator answering a number, as PHP's strcasecmp() does", () => {
            expectTypeOf(
                collect(["en_GB", "fr"]).diffUsing(["en_gb"], strcasecmp),
            ).toEqualTypeOf<Collection<string, number, "list">>();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(list.diffUsing(maybeList, spaceship)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function without<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
                compare: (first: TItem, second: TItem) => number,
            ) {
                const kept = items.diffUsing(other, compare);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(without(list, [2], spaceship).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(without(record, [2], spaceship).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(without(record, [2], spaceship).chained).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(
                new Bag([1, 2]).withoutMatching([1], spaceship),
            ).toEqualTypeOf<Bag<number>>();
        });

        it("agrees with dataDiffUsing's items, given a boolean test", () => {
            const listDiffed = collect(numberList).diffUsing(two, equal);
            const recordDiffed = collect(abc).diffUsing(onlyA, equal);

            expectTypeOf<ItemsOf<typeof listDiffed>>().toEqualTypeOf(
                Data.dataDiffUsing(numberList, two, equal),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf(
                Data.dataDiffUsing(abc, onlyA, equal),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a callback over another item type, or one that is no function", () => {
            // @ts-expect-error - a number list's callback compares numbers
            list.diffUsing([2], (a: string, b: string) => a === b);
            // @ts-expect-error - PHP's callable name is a string, which JavaScript cannot call
            list.diffUsing([2], "strcasecmp");
            // @ts-expect-error - PHP's callback parameter is required, never null
            list.diffUsing([2], null);
        });
    });

    describe("diffAssoc", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.diffAssoc([1, 9])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.diffAssoc({ a: 1 })).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(tagged.diffAssoc([1])).toEqualTypeOf<Tagged>();
        });

        it("takes null, which PHP reads as no items", () => {
            // The operand's type cannot tell a null from items that remove keys, so a keyed result is partial.
            expectTypeOf(record.diffAssoc(null)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.diffAssoc({ a: 1 })).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.diffAssoc({ 0: "a" })).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(list.diffAssoc(maybeList)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function without<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                const kept = items.diffAssoc(other);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(without(list, [2]).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(without(record, [2]).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(without(record, [2]).chained).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).withoutPairs([1])).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("agrees with dataDiffAssoc's items, a keyed result's partial", () => {
            const listDiffed = collect(numberList).diffAssoc(two);
            const recordDiffed = collect(abc).diffAssoc(onlyA);

            expectTypeOf<ItemsOf<typeof listDiffed>>().toEqualTypeOf(
                Data.dataDiffAssoc(numberList, two),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf(
                Data.dataDiffAssoc(abc, onlyA),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            record.diffAssoc("a");
        });
    });

    describe("diffAssocUsing", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.diffAssocUsing([1], compareKeys)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(
                record.diffAssocUsing({ A: 1 }, compareKeys),
            ).toEqualTypeOf<Collection<number, "a" | "b", "partial">>();
            expectTypeOf(
                tagged.diffAssocUsing([1], compareKeys),
            ).toEqualTypeOf<Tagged>();
        });

        it("types both callback keys as the collection's keys, so they compare", () => {
            list.diffAssocUsing([1], (keyA, keyB) => {
                expectTypeOf(keyA).toEqualTypeOf<number>();
                expectTypeOf(keyB).toEqualTypeOf<number>();

                return keyA === keyB;
            });
            record.diffAssocUsing({ A: 1 }, (keyA, keyB) => {
                expectTypeOf(keyA).toEqualTypeOf<"a" | "b">();
                expectTypeOf(keyB).toEqualTypeOf<"a" | "b">();

                return keyA === keyB;
            });
        });

        it("types a generic or a Map-built collection's callback and result", () => {
            expectTypeOf(
                generic.diffAssocUsing({ A: 1 }, (keyA, keyB) => {
                    expectTypeOf(keyA).toEqualTypeOf<string | number>();
                    expectTypeOf(keyB).toEqualTypeOf<string | number>();

                    return compareKeys(keyA, keyB);
                }),
            ).toEqualTypeOf<Collection<number, string | number, "partial">>();
            expectTypeOf(
                mapped.diffAssocUsing({ 0: "a" }, (keyA, keyB) => {
                    expectTypeOf(keyA).toEqualTypeOf<number>();
                    expectTypeOf(keyB).toEqualTypeOf<number>();

                    return keyA - keyB;
                }),
            ).toEqualTypeOf<Collection<string, number, "partial">>();
        });

        it("takes a comparator answering a number, as PHP's strcasecmp() does", () => {
            expectTypeOf(
                collect({ a: "green" }).diffAssocUsing(
                    { A: "green" },
                    strcasecmp,
                ),
            ).toEqualTypeOf<Collection<string, "a", "partial">>();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(
                record.diffAssocUsing(maybeList, compareKeys),
            ).toEqualTypeOf<Collection<number, "a" | "b", "partial">>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function without<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
                compare: (first: TItemKey, second: TItemKey) => number,
            ) {
                const kept = items.diffAssocUsing(other, compare);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(without(list, [2], compareKeys).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(without(record, [2], compareKeys).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(
                without(record, [2], compareKeys).chained,
            ).toEqualTypeOf<Collection<number, "a" | "b", "partial">>();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(
                new Bag([1, 2]).withoutPairsMatching([1], spaceship),
            ).toEqualTypeOf<Bag<number>>();
        });

        it("agrees with dataDiffAssocUsing's items, given a boolean test", () => {
            const listDiffed = collect(numberList).diffAssocUsing(two, equal);
            const recordDiffed = collect(abc).diffAssocUsing(onlyA, equal);

            expectTypeOf<ItemsOf<typeof listDiffed>>().toEqualTypeOf(
                Data.dataDiffAssocUsing(numberList, two, equal),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf(
                Data.dataDiffAssocUsing(abc, onlyA, equal),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a callback over another key type, or one that is no function", () => {
            const byText = (keyA: string, keyB: string) => keyA === keyB;

            // @ts-expect-error - a list's keys are numbers
            list.diffAssocUsing([1], byText);
            // @ts-expect-error - PHP's callable name is a string, which JavaScript cannot call
            list.diffAssocUsing([1], "strcasecmp");
        });
    });

    describe("diffKeys", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.diffKeys([9])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.diffKeys({ a: 9 })).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(tagged.diffKeys([9])).toEqualTypeOf<Tagged>();
        });

        it("takes null, which PHP reads as no items", () => {
            // The operand's type cannot tell a null from items that remove keys, so a keyed result is partial.
            expectTypeOf(record.diffKeys(null)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.diffKeys({ a: 9 })).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.diffKeys({ 0: "x" })).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(list.diffKeys(maybeList)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function without<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                const kept = items.diffKeys(other);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(without(list, [2]).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(without(record, [2]).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(without(record, [2]).chained).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).withoutKeys([1])).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("agrees with dataDiffKeys' items, a keyed result's partial", () => {
            const listDiffed = collect(numberList).diffKeys(two);
            const recordDiffed = collect(abc).diffKeys(onlyA);

            expectTypeOf<ItemsOf<typeof listDiffed>>().toEqualTypeOf(
                Data.dataDiffKeys(numberList, two),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf(
                Data.dataDiffKeys(abc, onlyA),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            record.diffKeys(1);
        });
    });

    describe("diffKeysUsing", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.diffKeysUsing([9], compareKeys)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(
                record.diffKeysUsing({ A: 9 }, compareKeys),
            ).toEqualTypeOf<Collection<number, "a" | "b", "partial">>();
            expectTypeOf(
                tagged.diffKeysUsing([9], compareKeys),
            ).toEqualTypeOf<Tagged>();
        });

        it("types both callback keys as the collection's keys, so they compare", () => {
            list.diffKeysUsing([9], (keyA, keyB) => {
                expectTypeOf(keyA).toEqualTypeOf<number>();
                expectTypeOf(keyB).toEqualTypeOf<number>();

                return keyA === keyB;
            });
            record.diffKeysUsing({ A: 9 }, (keyA, keyB) => {
                expectTypeOf(keyA).toEqualTypeOf<"a" | "b">();
                expectTypeOf(keyB).toEqualTypeOf<"a" | "b">();

                return keyA === keyB;
            });
        });

        it("types a generic or a Map-built collection's callback and result", () => {
            expectTypeOf(
                generic.diffKeysUsing({ A: 9 }, (keyA, keyB) => {
                    expectTypeOf(keyA).toEqualTypeOf<string | number>();
                    expectTypeOf(keyB).toEqualTypeOf<string | number>();

                    return compareKeys(keyA, keyB);
                }),
            ).toEqualTypeOf<Collection<number, string | number, "partial">>();
            expectTypeOf(
                mapped.diffKeysUsing({ 0: "x" }, (keyA, keyB) => {
                    expectTypeOf(keyA).toEqualTypeOf<number>();
                    expectTypeOf(keyB).toEqualTypeOf<number>();

                    return keyA - keyB;
                }),
            ).toEqualTypeOf<Collection<string, number, "partial">>();
        });

        it("takes a comparator answering a number, as PHP's strcasecmp() does", () => {
            expectTypeOf(
                collect({ id: 1, first_word: "Hello" }).diffKeysUsing(
                    { ID: 123 },
                    strcasecmp,
                ),
            ).toEqualTypeOf<
                Collection<string | number, "id" | "first_word", "partial">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(
                record.diffKeysUsing(maybeList, compareKeys),
            ).toEqualTypeOf<Collection<number, "a" | "b", "partial">>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function without<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
                compare: (first: TItemKey, second: TItemKey) => number,
            ) {
                const kept = items.diffKeysUsing(other, compare);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(without(list, [2], compareKeys).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(without(record, [2], compareKeys).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(
                without(record, [2], compareKeys).chained,
            ).toEqualTypeOf<Collection<number, "a" | "b", "partial">>();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(
                new Bag([1, 2]).withoutKeysMatching([1], spaceship),
            ).toEqualTypeOf<Bag<number>>();
        });

        it("agrees with dataDiffKeysUsing's items, given a boolean test", () => {
            const listDiffed = collect(numberList).diffKeysUsing(two, equal);
            const recordDiffed = collect(abc).diffKeysUsing(onlyA, equal);

            expectTypeOf<ItemsOf<typeof listDiffed>>().toEqualTypeOf(
                Data.dataDiffKeysUsing(numberList, two, equal),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf(
                Data.dataDiffKeysUsing(abc, onlyA, equal),
            );
            expectTypeOf<ItemsOf<typeof recordDiffed>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a callback over another key type, or one that is no function", () => {
            const byText = (keyA: string, keyB: string) => keyA === keyB;

            // @ts-expect-error - a list's keys are numbers
            list.diffKeysUsing([1], byText);
            // @ts-expect-error - PHP's callable name is a string, which JavaScript cannot call
            list.diffKeysUsing([1], "strcasecmp");
        });
    });

    describe("intersect", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.intersect([2])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.intersect({ a: 1 })).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(tagged.intersect([2])).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.intersect([1])).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.intersect(["a"])).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("takes undefined, which is read as null", () => {
            expectTypeOf(list.intersect(undefined)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(record.intersect(maybeList)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function within<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                const kept = items.intersect(other);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(within(list, [2]).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(within(record, [2]).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(within(record, [2]).chained).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).within([1])).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("agrees with dataIntersect's items, a keyed result's partial", () => {
            const listKept = collect(numberList).intersect(two);
            const recordKept = collect(abc).intersect(onlyA);

            expectTypeOf<ItemsOf<typeof listKept>>().toEqualTypeOf(
                Data.dataIntersect(numberList, two),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf(
                Data.dataIntersect(abc, onlyA),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.intersect(2);
        });
    });

    describe("intersectUsing", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.intersectUsing([2], spaceship)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.intersectUsing([2], spaceship)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(
                tagged.intersectUsing([2], spaceship),
            ).toEqualTypeOf<Tagged>();
        });

        it("types the callback's second value as the operand's, not the item's", () => {
            rows.intersectUsing([{ id: 1 }], (a, b) => {
                expectTypeOf(a).toEqualTypeOf<{ id: number; name: string }>();
                expectTypeOf(b).toEqualTypeOf<{ id: number }>();

                return a.id === b.id;
            });
        });

        it("types b as a collection operand's items", () => {
            rows.intersectUsing(collect([{ id: 1 }]), (a, b) => {
                expectTypeOf(b).toEqualTypeOf<{ id: number }>();

                return a.id === b.id;
            });
        });

        it("types a generic or a Map-built collection's callback and result", () => {
            expectTypeOf(
                generic.intersectUsing([1], (a, b) => {
                    expectTypeOf(a).toEqualTypeOf<number>();
                    expectTypeOf(b).toEqualTypeOf<number>();

                    return a - b;
                }),
            ).toEqualTypeOf<Collection<number, string | number, "partial">>();
            expectTypeOf(
                mapped.intersectUsing(["A"], (a, b) => {
                    expectTypeOf(a).toEqualTypeOf<string>();
                    expectTypeOf(b).toEqualTypeOf<string>();

                    return strcasecmp(a, b);
                }),
            ).toEqualTypeOf<Collection<string, number, "partial">>();
        });

        it("takes a comparator answering a number, as PHP's strcasecmp() does", () => {
            expectTypeOf(
                collect(["green", "brown"]).intersectUsing(
                    ["GREEN"],
                    strcasecmp,
                ),
            ).toEqualTypeOf<Collection<string, number, "list">>();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(
                list.intersectUsing(maybeList, spaceship),
            ).toEqualTypeOf<Collection<number, number, "list">>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function within<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
                compare: (first: TItem, second: TItem) => number,
            ) {
                const kept = items.intersectUsing(other, compare);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(within(list, [2], spaceship).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(within(record, [2], spaceship).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(within(record, [2], spaceship).chained).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(
                new Bag([1, 2]).withinMatching([1], spaceship),
            ).toEqualTypeOf<Bag<number>>();
        });

        it("agrees with dataIntersectUsing's items, given a boolean test", () => {
            const listKept = collect(numberList).intersectUsing(two, equal);
            const recordKept = collect(abc).intersectUsing(onlyA, equal);

            expectTypeOf<ItemsOf<typeof listKept>>().toEqualTypeOf(
                Data.dataIntersectUsing(numberList, two, equal),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf(
                Data.dataIntersectUsing(abc, onlyA, equal),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a callback over another item type, or one that is no function", () => {
            // @ts-expect-error - a number list's callback compares numbers
            list.intersectUsing([2], (a: string, b: string) => a === b);
            // @ts-expect-error - PHP's callable name is a string, which JavaScript cannot call
            list.intersectUsing([2], "strcasecmp");
        });
    });

    describe("intersectAssoc", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.intersectAssoc([1, 9])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.intersectAssoc({ a: 1 })).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(tagged.intersectAssoc([1])).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.intersectAssoc({ a: 1 })).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.intersectAssoc({ 0: "a" })).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(record.intersectAssoc(maybeList)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function within<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                const kept = items.intersectAssoc(other);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(within(list, [2]).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(within(record, [2]).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(within(record, [2]).chained).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).withinPairs([1])).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("agrees with dataIntersectAssoc's items, a keyed result's partial", () => {
            const listKept = collect(numberList).intersectAssoc(two);
            const recordKept = collect(abc).intersectAssoc(onlyA);

            expectTypeOf<ItemsOf<typeof listKept>>().toEqualTypeOf(
                Data.dataIntersectAssoc(numberList, two),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf(
                Data.dataIntersectAssoc(abc, onlyA),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            record.intersectAssoc(true);
        });
    });

    describe("intersectAssocUsing", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(
                list.intersectAssocUsing([1], compareKeys),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            expectTypeOf(
                record.intersectAssocUsing({ A: 1 }, compareKeys),
            ).toEqualTypeOf<Collection<number, "a" | "b", "partial">>();
            expectTypeOf(
                tagged.intersectAssocUsing([1], compareKeys),
            ).toEqualTypeOf<Tagged>();
        });

        it("types both callback keys as the collection's keys, so they compare", () => {
            list.intersectAssocUsing([1], (keyA, keyB) => {
                expectTypeOf(keyA).toEqualTypeOf<number>();
                expectTypeOf(keyB).toEqualTypeOf<number>();

                return keyA === keyB;
            });
            record.intersectAssocUsing({ A: 1 }, (keyA, keyB) => {
                expectTypeOf(keyA).toEqualTypeOf<"a" | "b">();
                expectTypeOf(keyB).toEqualTypeOf<"a" | "b">();

                return keyA === keyB;
            });
        });

        it("types a generic or a Map-built collection's callback and result", () => {
            expectTypeOf(
                generic.intersectAssocUsing({ A: 1 }, (keyA, keyB) => {
                    expectTypeOf(keyA).toEqualTypeOf<string | number>();
                    expectTypeOf(keyB).toEqualTypeOf<string | number>();

                    return compareKeys(keyA, keyB);
                }),
            ).toEqualTypeOf<Collection<number, string | number, "partial">>();
            expectTypeOf(
                mapped.intersectAssocUsing({ 0: "a" }, (keyA, keyB) => {
                    expectTypeOf(keyA).toEqualTypeOf<number>();
                    expectTypeOf(keyB).toEqualTypeOf<number>();

                    return keyA - keyB;
                }),
            ).toEqualTypeOf<Collection<string, number, "partial">>();
        });

        it("takes a comparator answering a number, as PHP's strcasecmp() does", () => {
            expectTypeOf(
                collect({ b: "brown" }).intersectAssocUsing(
                    { B: "brown" },
                    strcasecmp,
                ),
            ).toEqualTypeOf<Collection<string, "b", "partial">>();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(
                record.intersectAssocUsing(maybeList, compareKeys),
            ).toEqualTypeOf<Collection<number, "a" | "b", "partial">>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function within<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
                compare: (first: TItemKey, second: TItemKey) => number,
            ) {
                const kept = items.intersectAssocUsing(other, compare);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(within(list, [2], compareKeys).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(within(record, [2], compareKeys).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(
                within(record, [2], compareKeys).chained,
            ).toEqualTypeOf<Collection<number, "a" | "b", "partial">>();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(
                new Bag([1, 2]).withinPairsMatching([1], spaceship),
            ).toEqualTypeOf<Bag<number>>();
        });

        it("agrees with dataIntersectAssocUsing's items, given a boolean test", () => {
            const listKept = collect(numberList).intersectAssocUsing(
                two,
                equal,
            );
            const recordKept = collect(abc).intersectAssocUsing(onlyA, equal);

            expectTypeOf<ItemsOf<typeof listKept>>().toEqualTypeOf(
                Data.dataIntersectAssocUsing(numberList, two, equal),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf(
                Data.dataIntersectAssocUsing(abc, onlyA, equal),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a callback over another key type, or one that is no function", () => {
            const byText = (keyA: string, keyB: string) => keyA === keyB;

            // @ts-expect-error - a list's keys are numbers
            list.intersectAssocUsing([1], byText);
            // @ts-expect-error - PHP's callable name is a string, which JavaScript cannot call
            list.intersectAssocUsing([1], "strcasecmp");
        });
    });

    describe("intersectByKeys", () => {
        it("keeps a list's own type and makes a keyed result partial, since it may drop keys", () => {
            expectTypeOf(list.intersectByKeys([9])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.intersectByKeys({ a: 9 })).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(tagged.intersectByKeys([9])).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.intersectByKeys({ a: 9 })).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.intersectByKeys({ 0: "x" })).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(record.intersectByKeys(maybeList)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function within<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                const kept = items.intersectByKeys(other);

                return {
                    kept,
                    chained: kept.filter((value) => value !== null),
                };
            }

            expectTypeOf(within(list, [2]).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(within(record, [2]).kept).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
            expectTypeOf(within(record, [2]).chained).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).withinKeys([1])).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("agrees with dataIntersectByKeys' items, a keyed result's partial", () => {
            const listKept = collect(numberList).intersectByKeys(two);
            const recordKept = collect(abc).intersectByKeys(onlyA);

            expectTypeOf<ItemsOf<typeof listKept>>().toEqualTypeOf(
                Data.dataIntersectByKeys(numberList, two),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf(
                Data.dataIntersectByKeys(abc, onlyA),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf<
                Partial<Record<"a" | "b" | "c", number>>
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            record.intersectByKeys("a");
        });
    });

    describe("merge", () => {
        it("widens the values and keeps a list a list", () => {
            expectTypeOf(list.merge(["x"])).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(list.merge(null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("adds a record's keys, which it holds", () => {
            expectTypeOf(record.merge({ c: "x" })).toEqualTypeOf<
                Collection<string | number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(list.merge({ c: "x" })).toEqualTypeOf<
                Collection<string | number, number | "c", "keyed">
            >();
            expectTypeOf(record.merge(["x"])).toEqualTypeOf<
                Collection<string | number, number | "a" | "b", "keyed">
            >();
            expectTypeOf(record.merge(null)).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
        });

        it("renumbers integer keys, so a result without a string key is a list", () => {
            expectTypeOf(list.merge({ 5: "x" })).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(collect({ 5: "x" }).merge(null)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(list.merge(mapBuilt)).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
        });

        it("may leave a list where no side surely holds a string key", () => {
            // A wide key, a Map's literal key and an optional field may each hold no key, which leaves a list.
            expectTypeOf(generic.merge(["x"])).toEqualTypeOf<
                Collection<string | number, string | number, "list" | "keyed">
            >();
            expectTypeOf(list.merge(dates)).toEqualTypeOf<
                Collection<
                    number | Date,
                    number | "p" | "q",
                    "list" | "partial"
                >
            >();
            expectTypeOf(list.merge(optionalFields)).toEqualTypeOf<
                Collection<string | number, number | "c", "list" | "partial">
            >();
        });

        it("makes a result partial where a side may lack a key its type names", () => {
            expectTypeOf(partial.merge({ c: 1 })).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.merge(dates)).toEqualTypeOf<
                Collection<number | Date, "a" | "b" | "p" | "q", "partial">
            >();
            expectTypeOf(list.merge(eitherFields)).toEqualTypeOf<
                Collection<string | number, number | "c" | "d", "partial">
            >();
        });

        it("takes an operand that may be null, whose keys it then may lack", () => {
            expectTypeOf(list.merge(maybeList)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.merge(maybeFields)).toEqualTypeOf<
                Collection<string | number, number | "c", "list" | "partial">
            >();
            expectTypeOf(record.merge(maybeFields)).toEqualTypeOf<
                Collection<string | number, "a" | "b" | "c", "partial">
            >();
        });

        it("reads a collection operand's values, keys and shape, a subclass's too", () => {
            expectTypeOf(list.merge(new Tagged([4]))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.merge(new Tagged([4]))).toEqualTypeOf<
                Collection<number, number | "a" | "b", "keyed">
            >();
            expectTypeOf(list.merge(record)).toEqualTypeOf<
                Collection<number, number | "a" | "b", "keyed">
            >();
            expectTypeOf(list.merge(partial)).toEqualTypeOf<
                Collection<number, number | "a" | "b", "list" | "partial">
            >();
        });

        it("reads each other operand's keys the way getArrayableItems() does", () => {
            expectTypeOf(list.merge(new ArrayableRecord())).toEqualTypeOf<
                Collection<string | number, number | "foo", "keyed">
            >();
            expectTypeOf(list.merge(numbers())).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.merge(new JsonText())).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
            expectTypeOf(list.merge(new SerializesRecord())).toEqualTypeOf<
                Collection<string | number, number | "foo", "keyed">
            >();
            expectTypeOf(list.merge(new SerializesScalar())).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(list.merge(new ConvertsToJSON())).toEqualTypeOf<
                Collection<number, number | "c", "keyed">
            >();
            expectTypeOf(list.merge(new Date())).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("reads a toArray() or jsonSerialize() answer typed unknown as either shape, whose keys it cannot name", () => {
            expectTypeOf(list.merge(serializable)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
            expectTypeOf(list.merge(unknownArrayable)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(mapped.merge(["d"])).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(generic.merge({ c: "x" })).toEqualTypeOf<
                Collection<string | number, string | number, "keyed">
            >();
        });

        it("types a subclass's result as a base collection, since its generics change", () => {
            expectTypeOf(tagged.merge([4])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(new Bag([1, 2]).joined([3])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function joined<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                return items.merge(other).filter((value) => value !== null);
            }

            expectTypeOf(joined(list, [4])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(joined(record, [4])).toEqualTypeOf<
                Collection<number, number | "a" | "b", "partial">
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.merge(1);
        });
    });

    describe("mergeRecursive", () => {
        it("widens the values it may return with the operand's", () => {
            // No string key is on both sides, so no value is joined into a list.
            expectTypeOf(list.mergeRecursive(["x"])).toEqualTypeOf<
                Collection<number | string, number, "list">
            >();
            expectTypeOf(record.mergeRecursive({ c: "x" })).toEqualTypeOf<
                Collection<number | string, "a" | "b" | "c", "keyed">
            >();
        });

        it("adds a list of both values for a string key both sides may hold", () => {
            expectTypeOf(record.mergeRecursive({ a: "x" })).toEqualTypeOf<
                Collection<
                    number | string | Array<number | string>,
                    "a" | "b",
                    "keyed"
                >
            >();
            expectTypeOf(
                collect({ tags: ["a"] }).mergeRecursive({ tags: [1] }),
            ).toEqualTypeOf<
                Collection<
                    string[] | number[] | Array<string | number>,
                    "tags",
                    "keyed"
                >
            >();
        });

        it("renumbers integer keys, so a result without a string key is a list", () => {
            expectTypeOf(
                collect({ 5: "x" }).mergeRecursive({ 5: "y" }),
            ).toEqualTypeOf<Collection<string, number, "list">>();
        });

        it("reads a toArray() or jsonSerialize() answer typed unknown as either shape, whose keys it cannot name", () => {
            expectTypeOf(list.mergeRecursive(serializable)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
            expectTypeOf(list.mergeRecursive(unknownArrayable)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(mapped.mergeRecursive(["d"])).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(generic.mergeRecursive({ c: "x" })).toEqualTypeOf<
                Collection<
                    number | string | Array<number | string>,
                    string | number,
                    "keyed"
                >
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(list.mergeRecursive(maybeList)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types a subclass's result as a base collection, since its generics change", () => {
            expectTypeOf(tagged.mergeRecursive([4])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(new Bag([1, 2]).joinedDeep([3])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function joined<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                return items
                    .mergeRecursive(other)
                    .filter((value) => value !== null);
            }

            expectTypeOf(joined(list, [4])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(joined(record, [4])).toEqualTypeOf<
                Collection<number, number | "a" | "b", "partial">
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.mergeRecursive(2);
        });
    });

    describe("union", () => {
        it("widens the values, keeps the keys, and keeps a list a list for a list", () => {
            expectTypeOf(list.union(["x"])).toEqualTypeOf<
                Collection<number | string, number, "list">
            >();
            expectTypeOf(list.union(null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("adds a record's keys, and keeps a record a record", () => {
            expectTypeOf(record.union({ c: "x" })).toEqualTypeOf<
                Collection<number | string, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(record.union(["x"])).toEqualTypeOf<
                Collection<number | string, number | "a" | "b", "keyed">
            >();
            expectTypeOf(record.union(null)).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
            expectTypeOf(list.union({ c: "x" })).toEqualTypeOf<
                Collection<number | string, number | "c", "keyed">
            >();
        });

        it("may keep a list a list for integer keys, which may extend it as 0..n-1", () => {
            expectTypeOf(list.union({ 3: "x" })).toEqualTypeOf<
                Collection<number | string, number, "list" | "keyed">
            >();
            expectTypeOf(list.union(mapped)).toEqualTypeOf<
                Collection<number | string, number, "list" | "keyed">
            >();
        });

        it("makes a result partial where a side may lack a key its type names", () => {
            expectTypeOf(partial.union({ c: 1 })).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.union(dates)).toEqualTypeOf<
                Collection<number | Date, "a" | "b" | "p" | "q", "partial">
            >();
            expectTypeOf(list.union(maybeFields)).toEqualTypeOf<
                Collection<number | string, number | "c", "list" | "partial">
            >();
        });

        it("reads a collection operand's values, keys and shape, a subclass's too", () => {
            expectTypeOf(list.union(new Tagged([4]))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.union(new Tagged([4]))).toEqualTypeOf<
                Collection<number, number | "a" | "b", "keyed">
            >();
        });

        it("reads a toArray() or jsonSerialize() answer typed unknown as either shape, whose keys it cannot name", () => {
            expectTypeOf(list.union(serializable)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
            expectTypeOf(list.union(unknownArrayable)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.union(["x"])).toEqualTypeOf<
                Collection<number | string, string | number, "keyed">
            >();
            expectTypeOf(mapped.union(["d"])).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(list.union(maybeList)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types a subclass's result as a base collection, since its generics change", () => {
            expectTypeOf(tagged.union([4])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(new Bag([1, 2]).united([3])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function united<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                return items.union(other).filter((value) => value !== null);
            }

            expectTypeOf(united(list, [4])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(united(record, [4])).toEqualTypeOf<
                Collection<number, number | "a" | "b", "partial">
            >();
        });

        it("differs from dataUnion, which types a list's result as either backing", () => {
            // PHP's + keeps a list's keys, 0..n-1 for a list operand, where dataUnion answers either backing.
            const listUnited = collect(numberList).union(two);
            const recordUnited = collect(abc).union(onlyA);

            expectTypeOf<ItemsOf<typeof listUnited>>().toEqualTypeOf<
                number[]
            >();
            expectTypeOf<ItemsOf<typeof recordUnited>>().toEqualTypeOf<
                Record<"a" | "b" | "c", number>
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.union("x");
        });
    });

    describe("replace", () => {
        it("widens the values, keeps the keys, and keeps a list a list for a list", () => {
            expectTypeOf(list.replace(["x"])).toEqualTypeOf<
                Collection<number | string, number, "list">
            >();
            expectTypeOf(list.replace(null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("adds a record's keys, and keeps a record a record", () => {
            expectTypeOf(record.replace({ c: "x" })).toEqualTypeOf<
                Collection<number | string, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(record.replace(["x"])).toEqualTypeOf<
                Collection<number | string, number | "a" | "b", "keyed">
            >();
            expectTypeOf(list.replace({ k: "y" })).toEqualTypeOf<
                Collection<number | string, number | "k", "keyed">
            >();
        });

        it("may keep a list a list for integer keys, which may extend it as 0..n-1", () => {
            expectTypeOf(list.replace({ 1: "d", 2: "e" })).toEqualTypeOf<
                Collection<number | string, number, "list" | "keyed">
            >();
        });

        it("makes a result partial where a side may lack a key its type names", () => {
            expectTypeOf(partial.replace({ c: 1 })).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.replace(eitherFields)).toEqualTypeOf<
                Collection<number | string, "a" | "b" | "c" | "d", "partial">
            >();
        });

        it("reads a collection operand's values, keys and shape, a subclass's too", () => {
            expectTypeOf(list.replace(new Tagged([4]))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.replace(new Tagged([4]))).toEqualTypeOf<
                Collection<number, number | "a" | "b", "keyed">
            >();
        });

        it("reads a toArray() or jsonSerialize() answer typed unknown as either shape, whose keys it cannot name", () => {
            expectTypeOf(list.replace(serializable)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
            expectTypeOf(list.replace(unknownArrayable)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.replace(["x"])).toEqualTypeOf<
                Collection<number | string, string | number, "keyed">
            >();
            expectTypeOf(mapped.replace(["d"])).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(list.replace(maybeList)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types a subclass's result as a base collection, since its generics change", () => {
            expectTypeOf(tagged.replace([4])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(new Bag([1, 2]).replaced([3])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function replaced<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                return items.replace(other).filter((value) => value !== null);
            }

            expectTypeOf(replaced(list, [4])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(replaced(record, [4])).toEqualTypeOf<
                Collection<number, number | "a" | "b", "partial">
            >();
        });

        it("differs from dataReplace, which types a list's result by the record it builds", () => {
            // PHP's array_replace keeps a list's keys, 0..n-1 for a list operand; dataReplace names a record's.
            const listReplaced = collect(numberList).replace(two);
            const recordReplaced = collect(abc).replace(onlyA);

            expectTypeOf<ItemsOf<typeof listReplaced>>().toEqualTypeOf<
                number[]
            >();
            expectTypeOf<ItemsOf<typeof recordReplaced>>().toEqualTypeOf<
                Record<"a" | "b" | "c", number>
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.replace(4);
        });
    });

    describe("replaceRecursive", () => {
        it("widens the values, keeps the keys, and keeps a list a list for a list", () => {
            expectTypeOf(list.replaceRecursive(["x"])).toEqualTypeOf<
                Collection<number | string, number, "list">
            >();
            expectTypeOf(list.replaceRecursive(null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types either side's value, as Laravel's type does, though nested arrays may mix them", () => {
            expectTypeOf(
                collect({ a: { b: 1 } }).replaceRecursive({ a: { c: 2 } }),
            ).toEqualTypeOf<
                Collection<{ b: number } | { c: number }, "a", "keyed">
            >();
        });

        it("adds a record's keys, and keeps a record a record", () => {
            expectTypeOf(record.replaceRecursive({ c: "x" })).toEqualTypeOf<
                Collection<number | string, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(list.replaceRecursive({ k: "y" })).toEqualTypeOf<
                Collection<number | string, number | "k", "keyed">
            >();
        });

        it("may keep a list a list for integer keys, which may extend it as 0..n-1", () => {
            expectTypeOf(list.replaceRecursive({ 3: "x" })).toEqualTypeOf<
                Collection<number | string, number, "list" | "keyed">
            >();
        });

        it("makes a result partial where a side may lack a key its type names", () => {
            expectTypeOf(partial.replaceRecursive({ c: 1 })).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("reads a toArray() or jsonSerialize() answer typed unknown as either shape, whose keys it cannot name", () => {
            expectTypeOf(list.replaceRecursive(serializable)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
            expectTypeOf(list.replaceRecursive(unknownArrayable)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.replaceRecursive(["x"])).toEqualTypeOf<
                Collection<number | string, string | number, "keyed">
            >();
            expectTypeOf(mapped.replaceRecursive(["d"])).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(list.replaceRecursive(maybeList)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types a subclass's result as a base collection, since its generics change", () => {
            expectTypeOf(tagged.replaceRecursive([4])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(new Bag([1, 2]).replacedDeep([3])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function replaced<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                return items
                    .replaceRecursive(other)
                    .filter((value) => value !== null);
            }

            expectTypeOf(replaced(list, [4])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(replaced(record, [4])).toEqualTypeOf<
                Collection<number, number | "a" | "b", "partial">
            >();
        });

        it("differs from dataReplaceRecursive, which types a list's result by the record it builds", () => {
            // array_replace_recursive keeps a list's keys, 0..n-1 for a list operand; the data helper names a record's.
            const listReplaced = collect(numberList).replaceRecursive(two);
            const recordReplaced = collect(abc).replaceRecursive(onlyA);

            expectTypeOf<ItemsOf<typeof listReplaced>>().toEqualTypeOf<
                number[]
            >();
            expectTypeOf<ItemsOf<typeof recordReplaced>>().toEqualTypeOf<
                Record<"a" | "b" | "c", number>
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.replaceRecursive(4);
        });
    });

    describe("combine", () => {
        it("keys the operand's values by the collection's values", () => {
            // An empty collection combines to [], so the result may be a list.
            expectTypeOf(collect(["a", "b"]).combine([1, 2])).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
            expectTypeOf(record.combine(["x", "y"])).toEqualTypeOf<
                Collection<string, string | number, "list" | "keyed">
            >();
        });

        it("types a literal key as one the result may lack, since no item may give it", () => {
            expectTypeOf(collect(letters).combine([1, 2])).toEqualTypeOf<
                Collection<number, "a" | "b", "list" | "partial">
            >();
        });

        it("keys a value by its string cast, so false and null file under the empty string", () => {
            expectTypeOf(
                collect([true, false]).combine(["t", "f"]),
            ).toEqualTypeOf<Collection<string, 1 | "", "list" | "partial">>();
            expectTypeOf(collect([null]).combine(["n"])).toEqualTypeOf<
                Collection<string, "", "list" | "partial">
            >();
        });

        it("types a key read from a collection operand's values, a subclass's too", () => {
            expectTypeOf(collect(["a"]).combine(new Tagged([4]))).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            // A number may be a float, whose string cast need not read back as an integer key.
            expectTypeOf(generic.combine(["x"])).toEqualTypeOf<
                Collection<string, string | number, "list" | "keyed">
            >();
            expectTypeOf(mapped.combine([1, 2, 3])).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
        });

        it("takes an operand that may be null, which PHP reads as no values", () => {
            expectTypeOf(list.combine(maybeList)).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
        });

        it("types a subclass's result as a base collection, since its generics change", () => {
            expectTypeOf(tagged.combine(["x", "y", "z"])).toEqualTypeOf<
                Collection<string, string | number, "list" | "keyed">
            >();
            expectTypeOf(new Bag([1, 2]).keying(["x", "y"])).toEqualTypeOf<
                Collection<string, string | number, "list" | "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function keying<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
                TCombined,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                values: readonly TCombined[],
            ) {
                return items.combine(values).filter((value) => value !== null);
            }

            expectTypeOf(keying(collect(["a"]), [1])).toEqualTypeOf<
                Collection<number, string | number, "list" | "partial">
            >();
        });

        it("differs from dataCombine, which answers a record and names only string keys", () => {
            // PHP stores a numeric string key as an integer, and an empty collection combines to [].
            const combined = collect(["a", "b"]).combine([1, 2]);

            expectTypeOf<ItemsOf<typeof combined>>().toEqualTypeOf<
                number[] | Partial<Record<string | number, number>>
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.combine(1);
        });
    });

    describe("crossJoin", () => {
        it("lists each permutation as a row of one value from each list", () => {
            expectTypeOf(list.crossJoin(["a", "b"])).toEqualTypeOf<
                Collection<[number, "a" | "b"], number, "list">
            >();
        });

        it("takes lists of different value types", () => {
            expectTypeOf(list.crossJoin(["a"], [true])).toEqualTypeOf<
                Collection<[number, "a", true], number, "list">
            >();
        });

        it("types a row of the collection's values alone for no list, and none for null", () => {
            expectTypeOf(list.crossJoin()).toEqualTypeOf<
                Collection<[number], number, "list">
            >();
            expectTypeOf(list.crossJoin(null)).toEqualTypeOf<
                Collection<[number, never], number, "list">
            >();
        });

        it("types a row of any length for lists spread from an array", () => {
            const lists: string[][] = [["a"], ["b"]];

            expectTypeOf(list.crossJoin(...lists)).toEqualTypeOf<
                Collection<[number, ...string[]], number, "list">
            >();
        });

        it("reads a keyed collection's values as one dimension", () => {
            expectTypeOf(record.crossJoin({ c: "x" })).toEqualTypeOf<
                Collection<[number, "x"], number, "list">
            >();
            expectTypeOf(list.crossJoin(new Tagged([4]))).toEqualTypeOf<
                Collection<[number, number], number, "list">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.crossJoin(["x"])).toEqualTypeOf<
                Collection<[number, "x"], number, "list">
            >();
            expectTypeOf(mapped.crossJoin(["x"])).toEqualTypeOf<
                Collection<[string, "x"], number, "list">
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(list.crossJoin(maybeList)).toEqualTypeOf<
                Collection<[number, number], number, "list">
            >();
        });

        it("types a subclass's result as a base collection, since its generics change", () => {
            expectTypeOf(tagged.crossJoin(["x"])).toEqualTypeOf<
                Collection<[number, "x"], number, "list">
            >();
            expectTypeOf(new Bag([1, 2]).crossed([3])).toEqualTypeOf<
                Collection<[number, number], number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function crossed<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                return items.crossJoin(other).filter((row) => row.length > 0);
            }

            expectTypeOf(crossed(record, [4])).toEqualTypeOf<
                Collection<[number, number], number, "list">
            >();
        });

        it("agrees with dataCrossJoin's rows for a list", () => {
            const crossed = collect(numberList).crossJoin(words);

            expectTypeOf<ItemsOf<typeof crossed>>().toEqualTypeOf(
                Data.dataCrossJoin(numberList, words),
            );
        });

        it("differs from dataCrossJoin for a record, whose rows it reads by key", () => {
            // Collection::crossJoin hands a record's values over as one dimension, where dataCrossJoin reads its keys.
            const crossed = collect(abc).crossJoin(words);

            expectTypeOf<ItemsOf<typeof crossed>>().toEqualTypeOf<
                [number, string][]
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.crossJoin("x");
        });
    });

    describe("zip", () => {
        it("takes a collection's items as a list", () => {
            expectTypeOf(list.zip(collect(["a", "b", "c"]))).toEqualTypeOf<
                Collection<
                    Collection<number | string | null, number, "list">,
                    number,
                    "list"
                >
            >();
        });

        it("takes lists of different value types", () => {
            expectTypeOf(
                list.zip(["a", "b", "c"], [true, false, true]),
            ).toEqualTypeOf<
                Collection<
                    Collection<
                        number | "a" | "b" | "c" | boolean | null,
                        number,
                        "list"
                    >,
                    number,
                    "list"
                >
            >();
            expectTypeOf(list.zip(["a"], [true])).toEqualTypeOf<
                Collection<
                    Collection<number | "a" | true | null, number, "list">,
                    number,
                    "list"
                >
            >();
        });

        it("pads a shorter side with null, the collection's own included", () => {
            expectTypeOf(collect([1]).zip(["a", "b"])).toEqualTypeOf<
                Collection<
                    Collection<number | "a" | "b" | null, number, "list">,
                    number,
                    "list"
                >
            >();
        });

        it("reads a keyed collection's values and a record operand's", () => {
            expectTypeOf(record.zip({ x: "p" })).toEqualTypeOf<
                Collection<
                    Collection<number | "p" | null, number, "list">,
                    number,
                    "list"
                >
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.zip(["x"])).toEqualTypeOf<
                Collection<
                    Collection<number | "x" | null, number, "list">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(mapped.zip([1])).toEqualTypeOf<
                Collection<
                    Collection<string | 1 | null, number, "list">,
                    number,
                    "list"
                >
            >();
        });

        it("takes an operand that may be null", () => {
            expectTypeOf(list.zip(maybeList)).toEqualTypeOf<
                Collection<
                    Collection<number | null, number, "list">,
                    number,
                    "list"
                >
            >();
        });

        it("types a subclass's result as a base collection, since its generics change", () => {
            expectTypeOf(tagged.zip([4])).toEqualTypeOf<
                Collection<
                    Collection<number | null, number, "list">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(new Bag([1, 2]).zipped([3])).toEqualTypeOf<
                Collection<
                    Collection<number | null, number, "list">,
                    number,
                    "list"
                >
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function zipped<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                other: readonly TItem[],
            ) {
                return items.zip(other).filter((row) => row.count() > 0);
            }

            expectTypeOf(zipped(record, [4])).toEqualTypeOf<
                Collection<
                    Collection<number | null, number, "list">,
                    number,
                    "list"
                >
            >();
        });

        it("requires the list to zip with, as PHP's zip($items) does", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for a zip() with no list
            collect([1, 2]).zip();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            list.zip(1);
        });
    });

    describe("multiply", () => {
        it("repeats the values as a list, a record's too", () => {
            expectTypeOf(list.multiply(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.multiply(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(partial.multiply(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.multiply(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(mapped.multiply(2)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("types a subclass's result as a base collection, since its generics change", () => {
            expectTypeOf(tagged.multiply(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(new Bag([1, 2]).repeated(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function repeated<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>, times: number) {
                return items.multiply(times).filter((value) => value !== null);
            }

            expectTypeOf(repeated(record, 2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("rejects a count that is no number, as PHP's int parameter does", () => {
            // @ts-expect-error - PHP's multiplier is an int
            list.multiply("2");
            // @ts-expect-error - PHP's multiplier is an int, never null
            list.multiply(maybeCount);
        });
    });

    describe("splice", () => {
        it("takes one value of the collection's type as the replacement", () => {
            expectTypeOf(list.splice(0, 0, 4)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("rejects one value of another type", () => {
            // @ts-expect-error - PHP's replacement is array<array-key, TValue>
            list.splice(0, 0, "x");
        });
    });

    describe("only", () => {
        it("takes a collection of key names", () => {
            // A collection's key names are not literal, so the keys it keeps are unknown and the result partial.
            expectTypeOf(record.only(collect(["a", "b"]))).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("rejects a collection whose values are not key names", () => {
            // @ts-expect-error - PHP's parameter is Enumerable<array-key, TKey>
            record.only(collect([{ a: 1 }]));
        });
    });

    describe("except", () => {
        it("takes a collection of key names", () => {
            // A collection's key names are not literal, so the keys they remove are unknown and the result partial.
            expectTypeOf(record.except(collect(["c"]))).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("rejects a collection whose values are not key names", () => {
            // @ts-expect-error - PHP's parameter is Enumerable<array-key, TKey>
            record.except(collect([{ a: 1 }]));
        });
    });

    describe("forget", () => {
        it("takes a collection of key names", () => {
            // A collection's key names are not literal, so the keys they remove are unknown and the result partial.
            expectTypeOf(record.forget(collect(["c"]))).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("rejects a collection whose values are not key names", () => {
            // @ts-expect-error - PHP's parameter is iterable<array-key, TKey>
            record.forget(collect([{ a: 1 }]));
        });
    });

    describe("concat", () => {
        it("rejects null, over which PHP's foreach warns", () => {
            // @ts-expect-error - PHP's parameter is iterable, which null is not
            list.concat(null);
        });
    });

    describe("whereBetween", () => {
        it("rejects null, which PHP's reset() refuses with a TypeError", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable, which null is not
            rows.whereBetween("id", null);
        });
    });

    describe("whereNotBetween", () => {
        it("rejects null, which PHP's reset() refuses with a TypeError", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable, which null is not
            rows.whereNotBetween("id", null);
        });
    });
});
