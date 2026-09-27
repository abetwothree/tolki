import { collect, Collection, type CollectionShape } from "@tolki/collection";
import { describe, expectTypeOf, it } from "vitest";

import {
    abc,
    generic,
    mapBuilt,
    mixed,
    nestedLists,
    nullableRows,
    numberList,
    type Row,
    rows,
    Tagged,
} from "./fixtures";

declare const listOrKeyed: Collection<number, number, "list" | "keyed">;
declare const anyShape: Collection<unknown, PropertyKey, CollectionShape>;
declare const unknowns: Collection<unknown>;
declare const numbersOrRows: Collection<number | Row>;
declare const flag: boolean;
declare const maybeRetriever: ((value: number, key: number) => number) | null;
declare const maybeRowRetriever: ((row: Row, key: number) => number) | null;
declare const maybeIdPath: "id" | null;
declare const maybeNameOf: ((row: Row) => string) | null;
declare const maybePath: string | null;
declare const maybeGlue: string | null;
declare const maybeInitial: number | null;
declare const maybeDefault:
    | ((
          collection: Collection<number, number, "list">,
          value: boolean,
      ) => number)
    | null;

/** A class a collection is piped into, which reads only its count. */
class Counted {
    readonly size: number;

    /**
     * Read the collection's count.
     *
     * @param collection - The collection piped in
     */
    constructor(collection: { count(): number }) {
        this.size = collection.count();
    }
}

/** A class whose constructor takes only a list of numbers. */
class NumberSummary {
    readonly collection: Collection<number, number, "list">;

    /**
     * Keep the list piped in.
     *
     * @param collection - The list piped in
     */
    constructor(collection: Collection<number, number, "list">) {
        this.collection = collection;
    }
}

/** A generic subclass, whose methods call the family on a `this` typed by its own parameter. */
class Bag<TItem> extends Collection<TItem> {
    /**
     * Count the bag through sum()'s callback.
     *
     * @returns The count
     */
    counted() {
        return this.sum(() => 1);
    }

    /**
     * Average one per item through avg()'s callback.
     *
     * @returns The average
     */
    averaged() {
        return this.avg(() => 1);
    }

    /**
     * Average one per item through average()'s callback.
     *
     * @returns The average
     */
    averagedAlias() {
        return this.average(() => 1);
    }

    /**
     * Find the smallest item.
     *
     * @returns The smallest item, or null
     */
    smallest() {
        return this.min();
    }

    /**
     * Find the largest item.
     *
     * @returns The largest item, or null
     */
    largest() {
        return this.max();
    }

    /**
     * Find the median item.
     *
     * @returns The median, or null
     */
    middle() {
        return this.median();
    }

    /**
     * Find the most frequent items.
     *
     * @returns The keys the items were counted under, or null
     */
    commonest() {
        return this.mode();
    }

    /**
     * Find the share of items the callback passes.
     *
     * @param callback - The truth test
     * @returns The percentage, or null
     */
    share(callback: (item: TItem) => boolean) {
        return this.percentage(callback);
    }

    /**
     * Join the items with a comma.
     *
     * @returns The joined string
     */
    joined() {
        return this.implode(", ");
    }

    /**
     * List the items with "and" before the last.
     *
     * @returns The joined string, or the lone item
     */
    listed() {
        return this.join(", ", " and ");
    }

    /**
     * Count the bag through reduce().
     *
     * @returns The count
     */
    folded() {
        return this.reduce((count) => count + 1, 0);
    }

    /**
     * Count the bag through reduceInto().
     *
     * @returns The count
     */
    foldedInto() {
        return this.reduceInto(0, (count) => count + 1);
    }

    /**
     * Count the bag through reduceSpread().
     *
     * @returns The count, in a list
     */
    spread() {
        return this.reduceSpread((count) => [count + 1], 0);
    }

    /**
     * Count the bag through reduceWithKeys().
     *
     * @returns The count
     */
    foldedWithKeys() {
        return this.reduceWithKeys((count) => count + 1, 0);
    }

    /**
     * Pipe the bag to a callback returning it.
     *
     * @returns The bag's type
     */
    piped() {
        return this.pipe((bag) => bag);
    }

    /**
     * Pipe the bag into a class reading its count.
     *
     * @returns The class instance
     */
    boxed() {
        return this.pipeInto(Counted);
    }

    /**
     * Pipe the bag through a callback counting it.
     *
     * @returns The count
     */
    pipedThrough() {
        return this.pipeThrough([(bag) => bag.count()]);
    }

    /**
     * Tap the bag.
     *
     * @returns The bag's type
     */
    tapped() {
        return this.tap(() => undefined);
    }

    /**
     * Apply a callback returning null when the flag is truthy.
     *
     * @param condition - The flag
     * @returns The bag's type
     */
    whenever(condition: boolean) {
        return this.when(condition, () => null);
    }

    /**
     * Apply a callback returning null unless the flag is truthy.
     *
     * @param condition - The flag
     * @returns The bag's type
     */
    unlessever(condition: boolean) {
        return this.unless(condition, () => null);
    }

    /**
     * Apply a callback returning null when the bag is empty.
     *
     * @returns The bag's type
     */
    whenEmptyKept() {
        return this.whenEmpty(() => null);
    }

    /**
     * Apply a callback returning null when the bag is not empty.
     *
     * @returns The bag's type
     */
    whenNotEmptyKept() {
        return this.whenNotEmpty(() => null);
    }

    /**
     * Apply a callback returning null unless the bag is empty.
     *
     * @returns The bag's type
     */
    unlessEmptyKept() {
        return this.unlessEmpty(() => null);
    }

    /**
     * Apply a callback returning null unless the bag is not empty.
     *
     * @returns The bag's type
     */
    unlessNotEmptyKept() {
        return this.unlessNotEmpty(() => null);
    }
}

describe("collection aggregate type tests", () => {
    const list = collect(numberList);
    const record = collect(abc);
    const people = collect(rows);
    const nullablePeople = collect(nullableRows);
    const mapped = collect(mapBuilt);
    const strings = collect(["a", "b"]);
    const tagged = new Tagged([1, 2, 3], "tag");

    describe("sum", () => {
        it("sums items PHP's + adds without a callback, whichever scalar types they mix", () => {
            expectTypeOf(list.sum()).toEqualTypeOf<number>();
            expectTypeOf(list.sum(null)).toEqualTypeOf<number>();
            expectTypeOf(record.sum()).toEqualTypeOf<number>();
            expectTypeOf(collect(["1", "2"]).sum()).toEqualTypeOf<number>();
            expectTypeOf(collect(mixed).sum()).toEqualTypeOf<number>();
            expectTypeOf(collect([true, false]).sum()).toEqualTypeOf<number>();
            expectTypeOf(collect([1, undefined]).sum()).toEqualTypeOf<number>();
            expectTypeOf(collect([]).sum()).toEqualTypeOf<number>();
            expectTypeOf(tagged.sum()).toEqualTypeOf<number>();
        });

        it("reads each item through a key or a callback, which receives its key too", () => {
            expectTypeOf(people.sum("id")).toEqualTypeOf<number>();
            expectTypeOf(
                people.sum((row, key) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return row.id;
                }),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                record.sum((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return value;
                }),
            ).toEqualTypeOf<number>();
        });

        it("types a generic or a Map-built collection's sum", () => {
            expectTypeOf(generic.sum()).toEqualTypeOf<number>();
            expectTypeOf(
                generic.sum((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value;
                }),
            ).toEqualTypeOf<number>();
            expectTypeOf(mapped.sum()).toEqualTypeOf<number>();
            expectTypeOf(
                mapped.sum((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value.length;
                }),
            ).toEqualTypeOf<number>();
        });

        it("takes a callback that may be null over items PHP's + adds", () => {
            expectTypeOf(list.sum(maybeRetriever)).toEqualTypeOf<number>();
        });

        it("compiles for a caller whose items are a type parameter, given a callback or numeric items", () => {
            function counted<TItem>(items: Collection<TItem>) {
                return items.sum(() => 1);
            }

            function totalled<TItem extends number>(items: Collection<TItem>) {
                return items.sum();
            }

            expectTypeOf(counted(people)).toEqualTypeOf<number>();
            expectTypeOf(totalled(list)).toEqualTypeOf<number>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag([1, 2]).counted()).toEqualTypeOf<number>();
        });

        it("rejects summing items PHP's + cannot add, unless a key or a callback reads them", () => {
            // @ts-expect-error - PHP's + throws TypeError for an array or an object
            people.sum();
            // @ts-expect-error - a null callback sums the rows themselves
            people.sum(null);
            // @ts-expect-error - a callback that may be null may sum the rows themselves
            people.sum(maybeRowRetriever);
            // @ts-expect-error - PHP's + throws TypeError for an array
            collect(nestedLists).sum();
            // @ts-expect-error - one item PHP's + cannot add is enough for it to throw
            numbersOrRows.sum();
            // @ts-expect-error - an item of unknown type may be one PHP's + cannot add
            unknowns.sum();

            function untyped<TItem>(items: Collection<TItem>) {
                // @ts-expect-error - a type parameter may stand for items PHP's + cannot add
                return items.sum();
            }

            expectTypeOf(untyped(list)).toEqualTypeOf<number>();
        });

        it("rejects a value that is neither a key nor callable, and a callback reading the wrong type", () => {
            // @ts-expect-error - PHP takes a callable, a key or null
            list.sum(true);
            // @ts-expect-error - the callback receives each row
            people.sum((row: string) => row.length);
        });
    });

    describe("avg", () => {
        it("averages items PHP's + adds without a callback, or answers null", () => {
            expectTypeOf(list.avg()).toEqualTypeOf<number | null>();
            expectTypeOf(list.avg(null)).toEqualTypeOf<number | null>();
            expectTypeOf(record.avg()).toEqualTypeOf<number | null>();
            expectTypeOf(collect(mixed).avg()).toEqualTypeOf<number | null>();
            expectTypeOf(collect([]).avg()).toEqualTypeOf<number | null>();
            expectTypeOf(tagged.avg()).toEqualTypeOf<number | null>();
        });

        it("reads each item through a key or a callback", () => {
            expectTypeOf(people.avg("id")).toEqualTypeOf<number | null>();
            expectTypeOf(
                people.avg((row, key) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();
                    // JS-only: avg() hands the callback each key too, which PHP's does not
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return row.id;
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(
                record.avg((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return value;
                }),
            ).toEqualTypeOf<number | null>();
        });

        it("types a generic or a Map-built collection's average", () => {
            expectTypeOf(generic.avg()).toEqualTypeOf<number | null>();
            expectTypeOf(
                generic.avg((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value;
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(mapped.avg()).toEqualTypeOf<number | null>();
            expectTypeOf(
                mapped.avg((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value.length;
                }),
            ).toEqualTypeOf<number | null>();
        });

        it("takes a callback that may be null over items PHP's + adds", () => {
            expectTypeOf(list.avg(maybeRetriever)).toEqualTypeOf<
                number | null
            >();
        });

        it("compiles for a caller whose items are a type parameter, given a callback or numeric items", () => {
            function averaged<TItem>(items: Collection<TItem>) {
                return items.avg(() => 1);
            }

            function numericAverage<TItem extends number>(
                items: Collection<TItem>,
            ) {
                return items.avg();
            }

            expectTypeOf(averaged(people)).toEqualTypeOf<number | null>();
            expectTypeOf(numericAverage(list)).toEqualTypeOf<number | null>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag([1, 2]).averaged()).toEqualTypeOf<
                number | null
            >();
        });

        it("rejects averaging items PHP's + cannot add, unless a key or a callback reads them", () => {
            // @ts-expect-error - PHP's + throws TypeError for an array or an object
            people.avg();
            // @ts-expect-error - a callback that may be null may average the rows themselves
            people.avg(maybeRowRetriever);
            // @ts-expect-error - one item PHP's + cannot add is enough for it to throw
            numbersOrRows.avg();
            // @ts-expect-error - PHP takes a callable, a key or null
            list.avg(true);
        });
    });

    describe("average", () => {
        it("averages as avg() does", () => {
            expectTypeOf(list.average()).toEqualTypeOf<number | null>();
            expectTypeOf(record.average()).toEqualTypeOf<number | null>();
            expectTypeOf(people.average("id")).toEqualTypeOf<number | null>();
            expectTypeOf(
                people.average((row, key) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return row.id;
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(tagged.average()).toEqualTypeOf<number | null>();
        });

        it("types a generic or a Map-built collection's average", () => {
            expectTypeOf(generic.average()).toEqualTypeOf<number | null>();
            expectTypeOf(mapped.average()).toEqualTypeOf<number | null>();
            expectTypeOf(
                mapped.average((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value.length;
                }),
            ).toEqualTypeOf<number | null>();
        });

        it("takes a callback that may be null over items PHP's + adds", () => {
            expectTypeOf(list.average(maybeRetriever)).toEqualTypeOf<
                number | null
            >();
        });

        it("compiles for a caller whose items are a type parameter, given a callback or numeric items", () => {
            function averaged<TItem>(items: Collection<TItem>) {
                return items.average(() => 1);
            }

            function numericAverage<TItem extends number>(
                items: Collection<TItem>,
            ) {
                return items.average();
            }

            expectTypeOf(averaged(people)).toEqualTypeOf<number | null>();
            expectTypeOf(numericAverage(list)).toEqualTypeOf<number | null>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag([1, 2]).averagedAlias()).toEqualTypeOf<
                number | null
            >();
        });

        it("rejects averaging items PHP's + cannot add, unless a key or a callback reads them", () => {
            // @ts-expect-error - PHP's + throws TypeError for an array or an object
            people.average();
            // @ts-expect-error - PHP's + throws TypeError for an array
            collect(nestedLists).average();
        });
    });

    describe("min", () => {
        it("answers the smallest item that is not null, or null", () => {
            expectTypeOf(list.min()).toEqualTypeOf<number | null>();
            expectTypeOf(list.min(null)).toEqualTypeOf<number | null>();
            expectTypeOf(strings.min()).toEqualTypeOf<string | null>();
            expectTypeOf(collect(mixed).min()).toEqualTypeOf<
                string | number | null
            >();
            // JS-only: undefined stands for PHP's null, which min() skips
            expectTypeOf(collect([1, undefined]).min()).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(people.min()).toEqualTypeOf<Row | null>();
            expectTypeOf(record.min()).toEqualTypeOf<number | null>();
            expectTypeOf(tagged.min()).toEqualTypeOf<number | null>();
        });

        it("answers what a key reads, or what a callback given the value alone returns", () => {
            expectTypeOf(people.min("id")).toEqualTypeOf<number | null>();
            expectTypeOf(people.min("name")).toEqualTypeOf<string | null>();
            expectTypeOf(nullablePeople.min("name")).toEqualTypeOf<
                string | null
            >();
            expectTypeOf(
                people.min((row) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();

                    return row.name;
                }),
            ).toEqualTypeOf<string | null>();
            expectTypeOf(
                people.min((row) => (row.id > 1 ? row.id : undefined)),
            ).toEqualTypeOf<number | null>();
        });

        it("types a generic or a Map-built collection's minimum", () => {
            expectTypeOf(generic.min()).toEqualTypeOf<number | null>();
            expectTypeOf(mapped.min()).toEqualTypeOf<string | null>();
            expectTypeOf(
                mapped.min((value) => {
                    expectTypeOf(value).toEqualTypeOf<string>();

                    return value.length;
                }),
            ).toEqualTypeOf<number | null>();
        });

        it("takes a key or a callback that may be null", () => {
            expectTypeOf(people.min(maybeIdPath)).toEqualTypeOf<
                Row | number | null
            >();
            expectTypeOf(people.min(maybeNameOf)).toEqualTypeOf<
                Row | string | null
            >();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function smallest<TItem>(items: Collection<TItem>) {
                return items.min();
            }

            expectTypeOf(smallest(list)).toEqualTypeOf<number | null>();
            expectTypeOf(smallest(people)).toEqualTypeOf<Row | null>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag(["a", "b"]).smallest()).toEqualTypeOf<
                string | null
            >();
        });

        it("rejects a callback taking the key, which PHP never passes, and a value that is no key", () => {
            // @ts-expect-error - PHP's min() hands the callback the value alone
            people.min((row, key) => row.id + key);
            // @ts-expect-error - PHP takes a callable, a key or null
            people.min(true);
        });
    });

    describe("max", () => {
        it("answers the largest item that is not null, or null", () => {
            expectTypeOf(list.max()).toEqualTypeOf<number | null>();
            expectTypeOf(list.max(null)).toEqualTypeOf<number | null>();
            expectTypeOf(strings.max()).toEqualTypeOf<string | null>();
            expectTypeOf(collect(mixed).max()).toEqualTypeOf<
                string | number | null
            >();
            // JS-only: undefined stands for PHP's null, which max() skips
            expectTypeOf(collect([1, undefined]).max()).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(people.max()).toEqualTypeOf<Row | null>();
            expectTypeOf(record.max()).toEqualTypeOf<number | null>();
            expectTypeOf(tagged.max()).toEqualTypeOf<number | null>();
        });

        it("answers what a key reads, or what a callback given the value alone returns", () => {
            expectTypeOf(people.max("id")).toEqualTypeOf<number | null>();
            expectTypeOf(nullablePeople.max("name")).toEqualTypeOf<
                string | null
            >();
            expectTypeOf(
                people.max((row) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();

                    return row.name;
                }),
            ).toEqualTypeOf<string | null>();
            expectTypeOf(
                people.max((row) => (row.id > 1 ? row.id : null)),
            ).toEqualTypeOf<number | null>();
        });

        it("types a generic or a Map-built collection's maximum", () => {
            expectTypeOf(generic.max()).toEqualTypeOf<number | null>();
            expectTypeOf(mapped.max()).toEqualTypeOf<string | null>();
            expectTypeOf(
                mapped.max((value) => {
                    expectTypeOf(value).toEqualTypeOf<string>();

                    return value.length;
                }),
            ).toEqualTypeOf<number | null>();
        });

        it("takes a key or a callback that may be null", () => {
            expectTypeOf(people.max(maybeIdPath)).toEqualTypeOf<
                Row | number | null
            >();
            expectTypeOf(people.max(maybeNameOf)).toEqualTypeOf<
                Row | string | null
            >();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function largest<TItem>(items: Collection<TItem>) {
                return items.max();
            }

            expectTypeOf(largest(list)).toEqualTypeOf<number | null>();
            expectTypeOf(largest(people)).toEqualTypeOf<Row | null>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag(["a", "b"]).largest()).toEqualTypeOf<
                string | null
            >();
        });

        it("rejects a callback taking the key, which PHP never passes, and a value that is no key", () => {
            // @ts-expect-error - PHP's max() hands the callback the value alone
            people.max((row, key) => row.id + key);
            // @ts-expect-error - PHP takes a callable, a key or null
            people.max(true);
        });
    });

    describe("median", () => {
        it("answers the middle item, the average of the middle two, or null", () => {
            expectTypeOf(list.median()).toEqualTypeOf<number | null>();
            expectTypeOf(record.median()).toEqualTypeOf<number | null>();
            // An odd count answers the middle item itself, which may be a numeric string or a row
            expectTypeOf(collect(["10", "9", "8"]).median()).toEqualTypeOf<
                string | number | null
            >();
            expectTypeOf(people.median()).toEqualTypeOf<Row | number | null>();
            expectTypeOf(tagged.median()).toEqualTypeOf<number | null>();
        });

        it("answers what a key reads, or a number", () => {
            expectTypeOf(people.median("id")).toEqualTypeOf<number | null>();
            expectTypeOf(nullablePeople.median("name")).toEqualTypeOf<
                string | number | null
            >();
            // A path of segments reads a value no type follows, which an odd count answers as it is
            expectTypeOf(people.median(["id"])).toEqualTypeOf<unknown>();
        });

        it("types a generic or a Map-built collection's median", () => {
            expectTypeOf(generic.median()).toEqualTypeOf<number | null>();
            expectTypeOf(mapped.median()).toEqualTypeOf<
                string | number | null
            >();
        });

        it("takes a key that may be null", () => {
            expectTypeOf(people.median(maybeIdPath)).toEqualTypeOf<
                Row | number | null
            >();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function middle<TItem>(items: Collection<TItem>) {
                return items.median();
            }

            expectTypeOf(middle(list)).toEqualTypeOf<number | null>();
            expectTypeOf(middle(people)).toEqualTypeOf<Row | number | null>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag(["a", "b"]).middle()).toEqualTypeOf<
                string | number | null
            >();
        });

        it("rejects a callback, which PHP's key cannot be", () => {
            // @ts-expect-error - PHP's key is a string, a list of segments or null
            people.median((row) => row.id);
        });
    });

    describe("mode", () => {
        it("answers the PHP array keys the values were counted under, or null", () => {
            expectTypeOf(collect([1, 2, 2]).mode()).toEqualTypeOf<Array<
                string | number
            > | null>();
            expectTypeOf(
                collect([{ foo: "a" }, { foo: null }]).mode("foo"),
            ).toEqualTypeOf<Array<string | number> | null>();
            expectTypeOf(record.mode()).toEqualTypeOf<Array<
                string | number
            > | null>();
            expectTypeOf(people.mode(["name"])).toEqualTypeOf<Array<
                string | number
            > | null>();
            expectTypeOf(tagged.mode()).toEqualTypeOf<Array<
                string | number
            > | null>();
        });

        it("types a generic or a Map-built collection's mode", () => {
            expectTypeOf(generic.mode()).toEqualTypeOf<Array<
                string | number
            > | null>();
            expectTypeOf(mapped.mode()).toEqualTypeOf<Array<
                string | number
            > | null>();
        });

        it("takes a key that may be null", () => {
            expectTypeOf(people.mode(maybePath)).toEqualTypeOf<Array<
                string | number
            > | null>();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function commonest<TItem>(items: Collection<TItem>) {
                return items.mode();
            }

            expectTypeOf(commonest(people)).toEqualTypeOf<Array<
                string | number
            > | null>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag([1, 2]).commonest()).toEqualTypeOf<Array<
                string | number
            > | null>();
        });

        it("rejects a callback or a symbol, which PHP's key cannot be", () => {
            // @ts-expect-error - PHP's key is a string, a list of segments or null
            people.mode((row) => row.name);
            // @ts-expect-error - PHP's array keys are never symbols
            people.mode(Symbol("name"));
        });
    });

    describe("percentage", () => {
        it("answers the share of items the callback passes, or null", () => {
            expectTypeOf(
                list.percentage((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value > 1;
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(
                list.percentage((value) => value > 1, 0),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(
                record.percentage((_value, key) => {
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return key === "a";
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(people.percentage((row) => row.id > 1)).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(tagged.percentage((value) => value > 1)).toEqualTypeOf<
                number | null
            >();
        });

        it("types a generic or a Map-built collection's percentage", () => {
            expectTypeOf(
                generic.percentage((_value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return key === "a";
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(
                mapped.percentage((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return key > 0;
                }),
            ).toEqualTypeOf<number | null>();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function share<TItem>(items: Collection<TItem>) {
                return items.percentage((item) => item !== null);
            }

            expectTypeOf(share(people)).toEqualTypeOf<number | null>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(
                new Bag([1, 2]).share((item) => item > 1),
            ).toEqualTypeOf<number | null>();
        });

        it("rejects a missing callback, a key, and a precision that is no int", () => {
            // @ts-expect-error - PHP's callback is required
            list.percentage();
            // @ts-expect-error - PHP's callback is a callable, not a key
            people.percentage("id");
            // @ts-expect-error - PHP's precision is an int
            list.percentage((value) => value > 1, "2");
            // @ts-expect-error - PHP's precision is not nullable
            list.percentage((value) => value > 1, null);
        });
    });

    describe("implode", () => {
        it("joins the items with the glue it is given first", () => {
            expectTypeOf(strings.implode(", ")).toEqualTypeOf<string>();
            expectTypeOf(list.implode("-")).toEqualTypeOf<string>();
            expectTypeOf(strings.implode(null)).toEqualTypeOf<string>();
            expectTypeOf(tagged.implode(", ")).toEqualTypeOf<string>();
        });

        it("joins what a key or a callback reads, which receives the key too", () => {
            expectTypeOf(people.implode("name", ", ")).toEqualTypeOf<string>();
            expectTypeOf(
                people.implode((row, key) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return row.name;
                }, ", "),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                record.implode((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return key;
                }, "-"),
            ).toEqualTypeOf<string>();
        });

        it("types a generic or a Map-built collection's implode", () => {
            expectTypeOf(generic.implode(", ")).toEqualTypeOf<string>();
            expectTypeOf(
                generic.implode((_value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return key;
                }, ", "),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                mapped.implode((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value;
                }, ", "),
            ).toEqualTypeOf<string>();
        });

        it("takes a glue that may be null", () => {
            expectTypeOf(
                people.implode("name", maybeGlue),
            ).toEqualTypeOf<string>();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function joined<TItem>(items: Collection<TItem>) {
                return items.implode((item) => String(item), ", ");
            }

            expectTypeOf(joined(people)).toEqualTypeOf<string>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag([1, 2]).joined()).toEqualTypeOf<string>();
        });

        it("requires the value, as PHP's implode($value) does", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for an implode() with no value
            collect(["a", "b"]).implode();
            // @ts-expect-error - PHP's glue is a string or null
            people.implode("name", 1);
        });
    });

    describe("join", () => {
        it("answers a string, or the lone item itself when a final glue is given", () => {
            expectTypeOf(list.join(", ", " and ")).toEqualTypeOf<
                string | number
            >();
            expectTypeOf(list.join(", ")).toEqualTypeOf<string | number>();
            expectTypeOf(strings.join(", ")).toEqualTypeOf<string>();
            expectTypeOf(strings.join(", ", " and ")).toEqualTypeOf<string>();
            expectTypeOf(people.join(", ", " and ")).toEqualTypeOf<
                Row | string
            >();
            expectTypeOf(
                collect(["a", null]).join(", ", " and "),
            ).toEqualTypeOf<string | null>();
            expectTypeOf(record.join(", ")).toEqualTypeOf<string | number>();
            expectTypeOf(tagged.join(", ", " and ")).toEqualTypeOf<
                string | number
            >();
        });

        it("types a generic or a Map-built collection's join", () => {
            expectTypeOf(generic.join(", ", " and ")).toEqualTypeOf<
                string | number
            >();
            expectTypeOf(mapped.join(", ", " and ")).toEqualTypeOf<string>();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function listed<TItem>(items: Collection<TItem>) {
                return items.join(", ", " and ");
            }

            expectTypeOf(listed(list)).toEqualTypeOf<string | number>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag([1, 2]).listed()).toEqualTypeOf<
                string | number
            >();
        });

        it("rejects a missing glue, and a glue that is no string", () => {
            // @ts-expect-error - PHP throws ArgumentCountError without a glue
            list.join();
            // @ts-expect-error - PHP's glue is a string
            list.join(1);
            // @ts-expect-error - PHP's final glue is a string
            list.join(", ", null);
        });
    });

    describe("reduce", () => {
        it("starts the carry at null without an initial value, as PHP's $initial does", () => {
            expectTypeOf(
                list.reduce((carry, value, key) => {
                    expectTypeOf(carry).toEqualTypeOf<number | null>();
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return (carry ?? 0) + value;
                }),
            ).toEqualTypeOf<number | null>();
            // An empty backing hands back $initial, which defaults to null
            expectTypeOf(
                collect([1, 2, 3]).reduce(
                    (carry, value) => (carry ?? 0) + value,
                ),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(
                record.reduce((carry, value, key) => {
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return (carry ?? 0) + value;
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(
                tagged.reduce((carry, value) => (carry ?? 0) + value),
            ).toEqualTypeOf<number | null>();
        });

        it("reads a carry of another type from its annotation", () => {
            expectTypeOf(
                people.reduce(
                    (carry: string | null, row) => `${carry ?? ""}${row.name}`,
                ),
            ).toEqualTypeOf<string | null>();
        });

        it("types the carry as the initial value's type", () => {
            expectTypeOf(
                list.reduce((carry, value) => {
                    expectTypeOf(carry).toEqualTypeOf<number>();

                    return carry + value;
                }, 0),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                list.reduce((carry, value) => `${carry}${value}`, ""),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                record.reduce((carry, value, key) => {
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return `${carry}${key}${value}`;
                }, ""),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                people.reduce((total, row) => total + row.id, 0),
            ).toEqualTypeOf<number>();
        });

        it("types a generic or a Map-built collection's reduction", () => {
            expectTypeOf(
                generic.reduce((carry, value, key) => {
                    expectTypeOf(carry).toEqualTypeOf<number | null>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return (carry ?? 0) + value;
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(
                mapped.reduce((carry, value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return `${carry}${key}${value}`;
                }, ""),
            ).toEqualTypeOf<string>();
        });

        it("takes an initial value that may be null", () => {
            expectTypeOf(
                list.reduce(
                    (carry, value) => (carry ?? 0) + value,
                    maybeInitial,
                ),
            ).toEqualTypeOf<number | null>();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function counted<TItem>(items: Collection<TItem>) {
                return items.reduce((count) => count + 1, 0);
            }

            function firstSeen<TItem>(items: Collection<TItem>) {
                return items.reduce((carry, item) => carry ?? item);
            }

            expectTypeOf(counted(people)).toEqualTypeOf<number>();
            expectTypeOf(firstSeen(people)).toEqualTypeOf<Row | null>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag([1, 2]).folded()).toEqualTypeOf<number>();
        });

        it("rejects a carry read as if it could not be null, and a missing callback", () => {
            // @ts-expect-error - the carry starts as null without an initial value
            collect([1, 2]).reduce((carry, value) => carry + value);
            // @ts-expect-error - PHP's callback is required
            list.reduce();
        });
    });

    describe("reduceInto", () => {
        it("types the result as the initial value's type, which the callback may replace", () => {
            expectTypeOf(
                list.reduceInto(new Set<number>(), (result, value, key) => {
                    expectTypeOf(result).toEqualTypeOf<Set<number>>();
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    result.add(value);
                }),
            ).toEqualTypeOf<Set<number>>();
            expectTypeOf(
                list.reduceInto(0, (result, value) => result + value),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                record.reduceInto("", (result, _value, key) => {
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return `${result}${key}`;
                }),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                people.reduceInto(0, (total, row) => total + row.id),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                tagged.reduceInto(0, (total, value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return total + value;
                }),
            ).toEqualTypeOf<number>();
        });

        it("types a generic or a Map-built collection's reduction", () => {
            expectTypeOf(
                generic.reduceInto(0, (total, value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return total + value;
                }),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                mapped.reduceInto("", (result, value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return `${result}${value}`;
                }),
            ).toEqualTypeOf<string>();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function counted<TItem>(items: Collection<TItem>) {
                return items.reduceInto(0, (count) => count + 1);
            }

            expectTypeOf(counted(people)).toEqualTypeOf<number>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag([1, 2]).foldedInto()).toEqualTypeOf<number>();
        });

        it("rejects a missing callback, and one answering another type", () => {
            // @ts-expect-error - PHP's callback is required
            list.reduceInto(0);
            // @ts-expect-error - the callback's answer replaces the initial value, so it keeps its type
            list.reduceInto(0, () => "x");
        });
    });

    describe("reduceSpread", () => {
        it("spreads the carries, then the value and its key, into the reducer", () => {
            expectTypeOf(
                list.reduceSpread(
                    (total, count, value, key) => {
                        expectTypeOf(total).toEqualTypeOf<number>();
                        expectTypeOf(count).toEqualTypeOf<number>();
                        expectTypeOf(value).toEqualTypeOf<number>();
                        expectTypeOf(key).toEqualTypeOf<number>();

                        return [total + value, count + 1];
                    },
                    0,
                    0,
                ),
            ).toEqualTypeOf<[number, number]>();
            expectTypeOf(
                list.reduceSpread(
                    (text, count, value) => [`${text}${value}`, count + 1],
                    "",
                    0,
                ),
            ).toEqualTypeOf<[string, number]>();
            expectTypeOf(
                record.reduceSpread((total, value, key) => {
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return [total + value];
                }, 0),
            ).toEqualTypeOf<[number]>();
            expectTypeOf(
                people.reduceSpread((ids, row) => [ids + row.id], 0),
            ).toEqualTypeOf<[number]>();
            expectTypeOf(
                tagged.reduceSpread((total, value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return [total + value];
                }, 0),
            ).toEqualTypeOf<[number]>();
        });

        it("types a generic or a Map-built collection's reduction", () => {
            expectTypeOf(
                generic.reduceSpread((total, value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return [total + value];
                }, 0),
            ).toEqualTypeOf<[number]>();
            expectTypeOf(
                mapped.reduceSpread((text, value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return [`${text}${value}`];
                }, ""),
            ).toEqualTypeOf<[string]>();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function counted<TItem>(items: Collection<TItem>) {
                return items.reduceSpread((count) => [count + 1], 0);
            }

            expectTypeOf(counted(people)).toEqualTypeOf<[number]>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag([1, 2]).spread()).toEqualTypeOf<[number]>();
        });

        it("rejects a reducer that returns no list, which PHP throws UnexpectedValueException for", () => {
            collect(numberList).reduceSpread(
                // @ts-expect-error - the reducer's return is spread into its next call, so it must be a list
                () => false,
                null,
            );
        });

        it("rejects a reducer whose list holds another number of carries", () => {
            list.reduceSpread(
                // @ts-expect-error - the reducer's list is spread into its next call, one carry per initial value
                (total, value) => [total + value, 1],
                0,
            );
        });
    });

    describe("reduceWithKeys", () => {
        it("starts the carry at null without an initial value, as PHP's $initial does", () => {
            expectTypeOf(
                list.reduceWithKeys((carry, value, key) => {
                    expectTypeOf(carry).toEqualTypeOf<number | null>();
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return (carry ?? 0) + value;
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(
                record.reduceWithKeys((carry, value, key) => {
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return (carry ?? 0) + value;
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(
                tagged.reduceWithKeys((carry, value) => (carry ?? 0) + value),
            ).toEqualTypeOf<number | null>();
        });

        it("types the carry as the initial value's type", () => {
            expectTypeOf(
                record.reduceWithKeys((carry, value, key) => {
                    expectTypeOf(carry).toEqualTypeOf<string>();

                    return `${carry}${key}${value}`;
                }, ""),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                people.reduceWithKeys((total, row) => total + row.id, 0),
            ).toEqualTypeOf<number>();
        });

        it("types a generic or a Map-built collection's reduction", () => {
            expectTypeOf(
                generic.reduceWithKeys((carry, value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return (carry ?? 0) + value;
                }),
            ).toEqualTypeOf<number | null>();
            expectTypeOf(
                mapped.reduceWithKeys((carry, value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return `${carry}${key}${value}`;
                }, ""),
            ).toEqualTypeOf<string>();
        });

        it("takes an initial value that may be null", () => {
            expectTypeOf(
                list.reduceWithKeys(
                    (carry, value) => (carry ?? 0) + value,
                    maybeInitial,
                ),
            ).toEqualTypeOf<number | null>();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function counted<TItem>(items: Collection<TItem>) {
                return items.reduceWithKeys((count) => count + 1, 0);
            }

            expectTypeOf(counted(people)).toEqualTypeOf<number>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(
                new Bag([1, 2]).foldedWithKeys(),
            ).toEqualTypeOf<number>();
        });

        it("rejects a carry read as if it could not be null, and a missing callback", () => {
            // @ts-expect-error - the carry starts as null without an initial value
            list.reduceWithKeys((carry, value) => carry + value);
            // @ts-expect-error - PHP's callback is required
            list.reduceWithKeys();
        });
    });

    describe("pipe", () => {
        it("answers what the callback returns, handing it the collection itself", () => {
            expectTypeOf(
                list.pipe((collection) => {
                    expectTypeOf(collection).toEqualTypeOf<
                        Collection<number, number, "list">
                    >();

                    return collection.sum();
                }),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                record.pipe((collection) => collection.keys()),
            ).toEqualTypeOf<Collection<"a" | "b" | "c", number, "list">>();
            expectTypeOf(
                tagged.pipe((collection) => {
                    expectTypeOf(collection).toEqualTypeOf<Tagged>();

                    return collection;
                }),
            ).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's pipe", () => {
            expectTypeOf(
                generic.pipe((collection) => collection),
            ).toEqualTypeOf<Collection<number, string | number, "keyed">>();
            expectTypeOf(
                mapped.pipe((collection) => collection.count()),
            ).toEqualTypeOf<number>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function piped<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const kept = items.pipe((collection) => collection.values());

                return { kept, chained: kept.filter(() => true) };
            }

            expectTypeOf(piped(record).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(piped(record).chained).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).piped()).toEqualTypeOf<Bag<number>>();
        });

        it("rejects a missing callback, and one that is not callable", () => {
            // @ts-expect-error - PHP's callback is required
            list.pipe();
            // @ts-expect-error - PHP's callback is callable
            list.pipe("sum");
        });
    });

    describe("pipeInto", () => {
        it("answers an instance of the class the collection is passed to", () => {
            expectTypeOf(list.pipeInto(Counted)).toEqualTypeOf<Counted>();
            expectTypeOf(
                list.pipeInto(NumberSummary),
            ).toEqualTypeOf<NumberSummary>();
            expectTypeOf(record.pipeInto(Counted)).toEqualTypeOf<Counted>();
            expectTypeOf(
                tagged.pipeInto(NumberSummary),
            ).toEqualTypeOf<NumberSummary>();
        });

        it("types a generic or a Map-built collection's pipe", () => {
            expectTypeOf(generic.pipeInto(Counted)).toEqualTypeOf<Counted>();
            expectTypeOf(mapped.pipeInto(Counted)).toEqualTypeOf<Counted>();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function counted<TItem>(items: Collection<TItem>) {
                return items.pipeInto(Counted);
            }

            expectTypeOf(counted(people)).toEqualTypeOf<Counted>();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(new Bag([1, 2]).boxed()).toEqualTypeOf<Counted>();
        });

        it("rejects a class whose constructor cannot take the collection, and a class name", () => {
            // @ts-expect-error - the constructor takes a list, which a keyed collection is not
            record.pipeInto(NumberSummary);
            // @ts-expect-error - a class name is PHP's class-string, which JavaScript cannot construct
            list.pipeInto("Counted");
        });
    });

    describe("pipeThrough", () => {
        it("hands each callback what the one before it returned, and answers the last one's result", () => {
            expectTypeOf(
                list.pipeThrough([
                    (collection) => collection.merge([4]),
                    (collection) => collection.count(),
                ]),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                collect(["a"]).pipeThrough([
                    (collection) => collection.push("b"),
                    (collection) => collection.implode(""),
                    (value) => {
                        expectTypeOf(value).toEqualTypeOf<string>();

                        return value.toUpperCase();
                    },
                ]),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                list.pipeThrough([
                    (collection) => {
                        expectTypeOf(collection).toEqualTypeOf<
                            Collection<number, number, "list">
                        >();

                        return collection.sum();
                    },
                    (total) => {
                        expectTypeOf(total).toEqualTypeOf<number>();

                        return total * 10;
                    },
                ]),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                tagged.pipeThrough([(collection) => collection]),
            ).toEqualTypeOf<Tagged>();
        });

        it("answers the collection itself for no callbacks", () => {
            expectTypeOf(list.pipeThrough([])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.pipeThrough([])).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(tagged.pipeThrough([])).toEqualTypeOf<Tagged>();
        });

        it("answers unknown past three callbacks, which then name their own parameter types", () => {
            expectTypeOf(
                list.pipeThrough([
                    (collection: Collection<number, number, "list">) =>
                        collection.sum(),
                    (total: number) => total + 1,
                    (total: number) => total * 2,
                    (total: number) => String(total),
                ]),
            ).toEqualTypeOf<unknown>();
        });

        it("types a generic or a Map-built collection's pipeline", () => {
            expectTypeOf(
                generic.pipeThrough([(collection) => collection.keys()]),
            ).toEqualTypeOf<Collection<string | number, number, "list">>();
            expectTypeOf(
                mapped.pipeThrough([
                    (collection) => collection.values(),
                    (values) => values.count(),
                ]),
            ).toEqualTypeOf<number>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function piped<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const kept = items.pipeThrough([
                    (collection) => collection.values(),
                ]);

                return { kept, chained: kept.filter(() => true) };
            }

            expectTypeOf(piped(record).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(piped(record).chained).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a generic subclass", () => {
            expectTypeOf(
                new Bag([1, 2]).pipedThrough(),
            ).toEqualTypeOf<number>();
        });

        it("answers unknown for a callback annotated with a type the one before it does not return", () => {
            // A mistyped annotation misses the rows that type each position, and falls to the untyped one
            expectTypeOf(
                list.pipeThrough([
                    (collection) => collection.sum(),
                    (text: string) => text.length,
                ]),
            ).toEqualTypeOf<unknown>();
        });

        it("rejects a callback reading what the one before it returns as another type, and no callbacks", () => {
            list.pipeThrough([
                (collection) => collection.sum(),
                // @ts-expect-error - the second callback receives the first one's number
                (total) => total.toUpperCase(),
            ]);
            // @ts-expect-error - PHP's callbacks are required
            list.pipeThrough();
        });
    });

    describe("tap", () => {
        it("hands the callback the collection itself, and answers it", () => {
            expectTypeOf(
                list.tap((collection) => {
                    expectTypeOf(collection).toEqualTypeOf<
                        Collection<number, number, "list">
                    >();
                }),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            expectTypeOf(record.tap(() => undefined)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(listOrKeyed.tap(() => undefined)).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
            expectTypeOf(anyShape.tap(() => undefined)).toEqualTypeOf<
                Collection<unknown, PropertyKey, CollectionShape>
            >();
            expectTypeOf(
                tagged.tap((collection) => {
                    expectTypeOf(collection).toEqualTypeOf<Tagged>();
                }),
            ).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's tap", () => {
            expectTypeOf(generic.tap(() => undefined)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.tap(() => undefined)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function tapped<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const kept = items.tap(() => undefined);

                return { kept, chained: kept.filter(() => true) };
            }

            expectTypeOf(tapped(list).kept).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(tapped(record).kept).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(tapped(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).tapped()).toEqualTypeOf<Bag<number>>();
        });

        it("rejects a missing callback, and one that is not callable", () => {
            // @ts-expect-error - PHP's callback is required
            list.tap();
            // @ts-expect-error - PHP's callback is callable
            list.tap("dump");
        });
    });

    describe("when", () => {
        it("answers the collection itself or what the callback returns", () => {
            expectTypeOf(
                list.when(true, (collection) => collection.sum()),
            ).toEqualTypeOf<Collection<number, number, "list"> | number>();
            expectTypeOf(
                list.when(flag, (collection) => collection.map(String)),
            ).toEqualTypeOf<
                | Collection<number, number, "list">
                | Collection<string, number, "list">
            >();
            expectTypeOf(
                list.when(
                    flag,
                    () => "yes",
                    () => "no",
                ),
            ).toEqualTypeOf<Collection<number, number, "list"> | string>();
            expectTypeOf(
                record.when(flag, (collection) => collection.count()),
            ).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed"> | number
            >();
            expectTypeOf(
                tagged.when(flag, (collection) => collection.count()),
            ).toEqualTypeOf<Tagged | number>();
        });

        it("answers the collection itself for a callback returning null, undefined or nothing", () => {
            expectTypeOf(list.when(flag, () => null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.when(flag, () => undefined)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(
                list.when(flag, (collection) => {
                    collection.all();
                }),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            expectTypeOf(
                list.when(flag, (collection) =>
                    collection.isEmpty() ? null : collection.count(),
                ),
            ).toEqualTypeOf<Collection<number, number, "list"> | number>();
            expectTypeOf(tagged.when(flag, () => null)).toEqualTypeOf<Tagged>();
        });

        it("hands the callbacks the collection and the resolved value", () => {
            list.when("adam", (collection, name) => {
                expectTypeOf(collection).toEqualTypeOf<
                    Collection<number, number, "list">
                >();
                expectTypeOf(name).toEqualTypeOf<string>();

                return null;
            });
            list.when(
                (collection) => {
                    expectTypeOf(collection).toEqualTypeOf<
                        Collection<number, number, "list">
                    >();

                    return collection.count();
                },
                (_collection, count) => {
                    expectTypeOf(count).toEqualTypeOf<number>();

                    return count * 10;
                },
            );
            list.when(
                0,
                () => "callback",
                (_collection, value) => {
                    expectTypeOf(value).toEqualTypeOf<number>();

                    return String(value);
                },
            );
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.when(flag, () => null)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(
                mapped.when(flag, (collection) => collection.count()),
            ).toEqualTypeOf<Collection<string, number, "keyed"> | number>();
        });

        it("takes a default callback that may be null", () => {
            expectTypeOf(
                list.when(
                    flag,
                    (collection) => collection.count(),
                    maybeDefault,
                ),
            ).toEqualTypeOf<Collection<number, number, "list"> | number>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function kept<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const result = items.when(flag, () => null);

                return { result, chained: result.filter(() => true) };
            }

            expectTypeOf(kept(list).result).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(kept(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(kept(listOrKeyed).result).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).whenever(flag)).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("requires a callback, which PHP calls on the branch it takes", () => {
            // @ts-expect-error - PHP throws "Value of type null is not callable" for a null callback
            collect([1]).when(true, null);
            // @ts-expect-error - PHP's when() with one argument returns a higher-order proxy, which is not ported
            collect([1]).when(true);
            // @ts-expect-error - PHP's callback is callable
            list.when(true, "sum");
            // @ts-expect-error - PHP's default is callable or null
            list.when(true, () => null, "sum");
        });
    });

    describe("unless", () => {
        it("answers the collection itself or what the callback returns", () => {
            expectTypeOf(
                list.unless(false, (collection) => collection.sum()),
            ).toEqualTypeOf<Collection<number, number, "list"> | number>();
            expectTypeOf(
                list.unless(flag, (collection) => collection.map(String)),
            ).toEqualTypeOf<
                | Collection<number, number, "list">
                | Collection<string, number, "list">
            >();
            expectTypeOf(
                record.unless(flag, (collection) => collection.count()),
            ).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed"> | number
            >();
            expectTypeOf(
                tagged.unless(flag, (collection) => collection.count()),
            ).toEqualTypeOf<Tagged | number>();
        });

        it("answers the collection itself for a callback returning null, undefined or nothing", () => {
            expectTypeOf(list.unless(flag, () => null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(
                list.unless(flag, (collection) => {
                    collection.all();
                }),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            expectTypeOf(
                tagged.unless(flag, () => undefined),
            ).toEqualTypeOf<Tagged>();
        });

        it("hands the callbacks the collection and the resolved value", () => {
            list.unless("", (collection, name) => {
                expectTypeOf(collection).toEqualTypeOf<
                    Collection<number, number, "list">
                >();
                expectTypeOf(name).toEqualTypeOf<string>();

                return null;
            });
            list.unless(
                (collection) => collection.count(),
                () => "callback",
                (_collection, count) => {
                    expectTypeOf(count).toEqualTypeOf<number>();

                    return String(count);
                },
            );
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.unless(flag, () => null)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(
                mapped.unless(flag, (collection) => collection.count()),
            ).toEqualTypeOf<Collection<string, number, "keyed"> | number>();
        });

        it("takes a default callback that may be null", () => {
            expectTypeOf(
                list.unless(
                    flag,
                    (collection) => collection.count(),
                    maybeDefault,
                ),
            ).toEqualTypeOf<Collection<number, number, "list"> | number>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function kept<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const result = items.unless(flag, () => null);

                return { result, chained: result.filter(() => true) };
            }

            expectTypeOf(kept(list).result).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(kept(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(kept(listOrKeyed).result).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).unlessever(flag)).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("requires a callback, which PHP calls on the branch it takes", () => {
            // @ts-expect-error - PHP throws "Value of type null is not callable" for a null callback
            collect([1]).unless(false, null);
            // @ts-expect-error - PHP's unless() with one argument returns a higher-order proxy, which is not ported
            collect([1]).unless(false);
            // @ts-expect-error - PHP's callback is callable
            list.unless(false, "sum");
        });
    });

    describe("whenEmpty", () => {
        it("answers the collection itself or what the callback returns", () => {
            expectTypeOf(
                list.whenEmpty((collection, empty) => {
                    expectTypeOf(collection).toEqualTypeOf<
                        Collection<number, number, "list">
                    >();
                    expectTypeOf(empty).toEqualTypeOf<boolean>();

                    return "empty";
                }),
            ).toEqualTypeOf<Collection<number, number, "list"> | string>();
            expectTypeOf(
                list.whenEmpty(
                    (collection) => collection.count(),
                    (collection, empty) => {
                        expectTypeOf(empty).toEqualTypeOf<boolean>();

                        return collection.sum();
                    },
                ),
            ).toEqualTypeOf<Collection<number, number, "list"> | number>();
            expectTypeOf(list.whenEmpty(() => null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.whenEmpty(() => null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(tagged.whenEmpty(() => null)).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.whenEmpty(() => null)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(
                mapped.whenEmpty((collection) => collection.count()),
            ).toEqualTypeOf<Collection<string, number, "keyed"> | number>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function kept<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const result = items.whenEmpty(() => null);

                return { result, chained: result.filter(() => true) };
            }

            expectTypeOf(kept(record).result).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(kept(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(kept(listOrKeyed).result).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).whenEmptyKept()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("rejects a missing callback, a null one, and one that is not callable", () => {
            // @ts-expect-error - PHP's callback is required
            list.whenEmpty();
            // @ts-expect-error - PHP's callback is callable
            list.whenEmpty(null);
            // @ts-expect-error - PHP's callback is callable
            list.whenEmpty("sum");
        });
    });

    describe("whenNotEmpty", () => {
        it("answers the collection itself or what the callback returns", () => {
            expectTypeOf(
                list.whenNotEmpty((collection, notEmpty) => {
                    expectTypeOf(collection).toEqualTypeOf<
                        Collection<number, number, "list">
                    >();
                    expectTypeOf(notEmpty).toEqualTypeOf<boolean>();

                    return collection.sum();
                }),
            ).toEqualTypeOf<Collection<number, number, "list"> | number>();
            expectTypeOf(list.whenNotEmpty(() => null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.whenNotEmpty(() => null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(
                tagged.whenNotEmpty(() => null),
            ).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.whenNotEmpty(() => null)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(
                mapped.whenNotEmpty((collection) => collection.count()),
            ).toEqualTypeOf<Collection<string, number, "keyed"> | number>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function kept<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const result = items.whenNotEmpty(() => null);

                return { result, chained: result.filter(() => true) };
            }

            expectTypeOf(kept(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(kept(listOrKeyed).result).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).whenNotEmptyKept()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("rejects a missing callback, and a null one", () => {
            // @ts-expect-error - PHP's callback is required
            list.whenNotEmpty();
            // @ts-expect-error - PHP's callback is callable
            list.whenNotEmpty(null);
        });
    });

    describe("unlessEmpty", () => {
        it("answers the collection itself or what the callback returns", () => {
            expectTypeOf(
                list.unlessEmpty((collection, notEmpty) => {
                    expectTypeOf(collection).toEqualTypeOf<
                        Collection<number, number, "list">
                    >();
                    expectTypeOf(notEmpty).toEqualTypeOf<boolean>();

                    return collection.sum();
                }),
            ).toEqualTypeOf<Collection<number, number, "list"> | number>();
            expectTypeOf(list.unlessEmpty(() => null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.unlessEmpty(() => null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(
                tagged.unlessEmpty(() => null),
            ).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.unlessEmpty(() => null)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(
                mapped.unlessEmpty((collection) => collection.count()),
            ).toEqualTypeOf<Collection<string, number, "keyed"> | number>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function kept<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const result = items.unlessEmpty(() => null);

                return { result, chained: result.filter(() => true) };
            }

            expectTypeOf(kept(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(kept(listOrKeyed).result).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).unlessEmptyKept()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("rejects a missing callback, and a null one", () => {
            // @ts-expect-error - PHP's callback is required
            list.unlessEmpty();
            // @ts-expect-error - PHP's callback is callable
            list.unlessEmpty(null);
        });
    });

    describe("unlessNotEmpty", () => {
        it("answers the collection itself or what the callback returns", () => {
            expectTypeOf(
                list.unlessNotEmpty((collection, empty) => {
                    expectTypeOf(collection).toEqualTypeOf<
                        Collection<number, number, "list">
                    >();
                    expectTypeOf(empty).toEqualTypeOf<boolean>();

                    return "empty";
                }),
            ).toEqualTypeOf<Collection<number, number, "list"> | string>();
            expectTypeOf(list.unlessNotEmpty(() => null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.unlessNotEmpty(() => null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(
                tagged.unlessNotEmpty(() => null),
            ).toEqualTypeOf<Tagged>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.unlessNotEmpty(() => null)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(
                mapped.unlessNotEmpty((collection) => collection.count()),
            ).toEqualTypeOf<Collection<string, number, "keyed"> | number>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function kept<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                const result = items.unlessNotEmpty(() => null);

                return { result, chained: result.filter(() => true) };
            }

            expectTypeOf(kept(record).chained).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(kept(listOrKeyed).result).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
        });

        it("keeps a generic subclass's own type", () => {
            expectTypeOf(new Bag([1, 2]).unlessNotEmptyKept()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("rejects a missing callback, and a null one", () => {
            // @ts-expect-error - PHP's callback is required
            list.unlessNotEmpty();
            // @ts-expect-error - PHP's callback is callable
            list.unlessNotEmpty(null);
        });
    });
});
