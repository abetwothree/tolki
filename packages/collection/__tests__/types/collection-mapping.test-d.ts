import { collect, Collection, type CollectionShape } from "@tolki/collection";
import * as Data from "@tolki/data";
import { defineEnum } from "@tolki/enum";
import type { PathKey, UndotObjectValue } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import type { ItemsOf } from "../helpers";
import {
    abc,
    generic,
    mapBuilt,
    mixed,
    nestedLists,
    type NullableRow,
    nullableRows,
    numberList,
    recordOfLists,
    type Row,
    rows,
    Tagged,
} from "./fixtures";

declare const partial: Collection<number, "a" | "b", "partial">;
declare const listOrKeyed: Collection<number, number, "list" | "keyed">;
declare const keyedPeople: Collection<Row, "ada" | "grace", "keyed">;
declare const unknowns: Collection<unknown>;
declare const maybeName: string | null;
declare const maybeDepth: number | undefined;
declare const flag: boolean;
declare const maybeTest: ((value: number, key: number) => boolean) | null;
declare const pathOrCallback: string | ((row: Row) => number);
declare const pathOrPaths: string | readonly string[];
declare const pathKey: PathKey;

/** Rows of one fixed length, which spread by position. */
const pairs: [number, string][] = [
    [1, "a"],
    [2, "b"],
];

/** Records keyed by any string, which collapse() merges. */
const records: Record<string, number>[] = [{ a: 1 }, { b: 2 }];

/** Records of two shapes, where a key one holds the other may lack. */
const eitherKey: ({ a: number } | { b: number })[] = [{ a: 1 }, { b: 2 }];

/** Items typed as literals, whose keys a keyed result may lack. */
const letters = ["a", "b"] as const;

/** Rows keyed by name, as a keyed rows collection holds them. */
const keyedRows: Record<"ada" | "grace", Row> = {
    ada: { id: 1, name: "Ada" },
    grace: { id: 2, name: "Grace" },
};

/** Dotted keys, which undot() expands. */
const dotted = { "a.b": 1, c: 2 };

/** A backed enum definition, whose from() resolves a value to its case. */
const Status = defineEnum({
    A: 1,
    B: 2,
    backed: true,
    _cases: ["A", "B"],
} as const);

/** A class whose constructor takes a number. */
class NumBox {
    constructor(readonly value: number) {}
}

/** A class whose constructor takes a string. */
class StrBox {
    constructor(readonly value: string) {}
}

/** A class whose constructor keeps any item, as a caller whose items are a type parameter hands it one. */
class Held {
    constructor(readonly value: unknown) {}
}

/** A class whose constructor takes the item and a number key, as a list hands them. */
class Indexed {
    constructor(
        readonly value: number,
        readonly index: number,
    ) {}
}

/** A generic subclass, whose methods call the family on a `this` typed by its own parameter. */
class Bag<TItem> extends Collection<TItem> {
    /**
     * Name each item.
     *
     * @param callback - The naming callback
     * @returns The names
     */
    names(callback: (value: TItem) => string) {
        return this.map(callback);
    }

    /**
     * Key each item by the name the given callback gives it.
     *
     * @param callback - The naming callback
     * @returns The items under their names
     */
    pairedBy(callback: (value: TItem) => string) {
        return this.mapWithKeys((value) => ({ [callback(value)]: value }));
    }

    /**
     * Visit each item.
     *
     * @param callback - The visitor
     * @returns The bag itself
     */
    visit(callback: (value: TItem) => unknown) {
        return this.each(callback);
    }

    /**
     * Key the items by the given callback.
     *
     * @param callback - The key callback
     * @returns The keyed items
     */
    indexed(callback: (value: TItem) => string) {
        return this.keyBy(callback);
    }

    /**
     * Group the items by the given callback.
     *
     * @param callback - The grouping callback
     * @returns The groups
     */
    grouped(callback: (value: TItem) => number) {
        return this.groupBy(callback);
    }

    /**
     * Read each item's name.
     *
     * @returns The names, read the way data_get() reads them
     */
    labels() {
        return this.pluck("name");
    }

    /**
     * Expand the dotted keys.
     *
     * @returns The bag's type, since a list's keys hold no dot
     */
    expanded() {
        return this.undot();
    }

    /**
     * Call each mapping, keying and grouping method on this bag.
     *
     * @returns Each method's answer, by name
     */
    called(): Record<string, unknown> {
        return {
            map: this.map((value) => [value]).filter(() => true),
            mapWithKeys: this.mapWithKeys((value) => ({ a: value })).filter(
                () => true,
            ),
            mapToDictionary: this.mapToDictionary((value) => ({
                a: value,
            })).filter(() => true),
            mapToGroups: this.mapToGroups((value) => ({ a: value })).filter(
                () => true,
            ),
            mapSpread: this.mapSpread((...values) => values).filter(() => true),
            mapInto: this.mapInto(Held).filter(() => true),
            flatMap: this.flatMap((value) => [value]).filter(() => true),
            each: this.each(() => undefined).filter(() => true),
            eachSpread: this.eachSpread(() => undefined).filter(() => true),
            groupBy: this.groupBy((value) => String(value)).filter(() => true),
            keyBy: this.keyBy((value) => String(value)).filter(() => true),
            countBy: this.countBy().filter(() => true),
            pluck: this.pluck("id").filter(() => true),
            flip: this.flip().filter(() => true),
            collapse: this.collapse().filter(() => true),
            collapseWithKeys: this.collapseWithKeys().filter(() => true),
            flatten: this.flatten().filter(() => true),
            dot: this.dot().filter(() => true),
            undot: this.undot().filter(() => true),
        };
    }
}

describe("collection mapping, keying and grouping type tests", () => {
    const list = collect(numberList);
    const record = collect(abc);
    const people = collect(rows);
    const mapped = collect(mapBuilt);
    const tagged = new Tagged([1, 2, 3], "tag");

    describe("map", () => {
        it("types the mapped values and keeps the keys and shape", () => {
            expectTypeOf(list.map(String)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(record.map((value) => value > 1)).toEqualTypeOf<
                Collection<boolean, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(people.map((row) => row.name)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(partial.map(String)).toEqualTypeOf<
                Collection<string, "a" | "b", "partial">
            >();
            expectTypeOf(listOrKeyed.map(String)).toEqualTypeOf<
                Collection<string, number, "list" | "keyed">
            >();
        });

        it("types the callback's value and key", () => {
            list.map((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value;
            });
            record.map((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value;
            });
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(
                generic.map((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return String(value);
                }),
            ).toEqualTypeOf<Collection<string, string | number, "keyed">>();
            expectTypeOf(
                mapped.map((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value.length;
                }),
            ).toEqualTypeOf<Collection<number, number, "keyed">>();
        });

        it("types a subclass's result as a base collection, since its generics change", () => {
            expectTypeOf(tagged.map(String)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(new Bag([1, 2]).names(String)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function named<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                callback: (value: TItem) => string,
            ) {
                return items.map(callback).filter((name) => name !== "");
            }

            expectTypeOf(named(list, String)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(named(record, String)).toEqualTypeOf<
                Collection<string, "a" | "b" | "c", "partial">
            >();
        });

        it("agrees with dataMap's items", () => {
            const listMapped = list.map(String);
            const recordMapped = record.map((value) => value > 1);
            const dataRecordMapped = Data.dataMap(abc, (value) => value > 1);

            expectTypeOf<ItemsOf<typeof listMapped>>().toEqualTypeOf(
                Data.dataMap(numberList, String),
            );
            expectTypeOf<ItemsOf<typeof recordMapped>>().toEqualTypeOf<
                typeof dataRecordMapped
            >();
        });

        it("rejects a callback over another item type", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.map((value: string) => value);
        });
    });

    describe("mapWithKeys", () => {
        it("keys the values the way PHP stores each key", () => {
            expectTypeOf(
                people.mapWithKeys((row) => ({ [row.name]: row.id })),
            ).toEqualTypeOf<Collection<number, string | number, "keyed">>();
            expectTypeOf(
                people.mapWithKeys((row) => ({ [row.id]: row })),
            ).toEqualTypeOf<Collection<Row, number, "keyed">>();
        });

        it("types a literal key as one the result may lack, since no item may give it", () => {
            expectTypeOf(
                list.mapWithKeys((value) => ({ fixed: value > 1 })),
            ).toEqualTypeOf<Collection<boolean, "fixed", "partial">>();
        });

        it("walks a collection, a Map or a list the callback returns", () => {
            expectTypeOf(
                list.mapWithKeys((value) => collect({ [`k${value}`]: value })),
            ).toEqualTypeOf<Collection<number, string | number, "keyed">>();
            expectTypeOf(
                list.mapWithKeys((value) => new Tagged([value])),
            ).toEqualTypeOf<Collection<number, number, "keyed">>();
            expectTypeOf(
                list.mapWithKeys(
                    () =>
                        new Map([
                            [2, "c"],
                            [0, "a"],
                        ]),
                ),
            ).toEqualTypeOf<Collection<string, number, "keyed">>();
            expectTypeOf(list.mapWithKeys((value) => [value])).toEqualTypeOf<
                Collection<number, number, "keyed">
            >();
        });

        it("types any key and value for a callback that may return either form", () => {
            expectTypeOf(
                list.mapWithKeys((value) =>
                    value > 1 ? { a: value } : [value],
                ),
            ).toEqualTypeOf<Collection<unknown, string | number, "keyed">>();
        });

        it("types the callback's value and key", () => {
            expectTypeOf(
                record.mapWithKeys((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return { [key]: value };
                }),
            ).toEqualTypeOf<Collection<number, string | number, "keyed">>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(
                generic.mapWithKeys((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return { [value]: key };
                }),
            ).toEqualTypeOf<Collection<string | number, number, "keyed">>();
            expectTypeOf(
                mapped.mapWithKeys((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return { [value]: key };
                }),
            ).toEqualTypeOf<Collection<number, string | number, "keyed">>();
        });

        it("types a subclass's result as a base collection, a generic subclass's too", () => {
            expectTypeOf(
                tagged.mapWithKeys((value) => ({ [value]: value })),
            ).toEqualTypeOf<Collection<number, number, "keyed">>();
            expectTypeOf(new Bag([1, 2]).pairedBy(String)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function byName<TItem extends { name: string }>(
                items: Collection<TItem>,
            ) {
                return items
                    .mapWithKeys((item) => ({ [item.name]: item }))
                    .filter(() => true);
            }

            expectTypeOf(byName(people)).toEqualTypeOf<
                Collection<Row, string | number, "partial">
            >();
        });

        it("differs from dataMapWithKeys, which keeps a string key a string", () => {
            // PHP stores a numeric string key as an integer, which dataMapWithKeys types as a string.
            const byName = people.mapWithKeys((row) => ({
                [row.name]: row.id,
            }));

            expectTypeOf<ItemsOf<typeof byName>>().toEqualTypeOf<
                Record<string | number, number>
            >();
            expectTypeOf(
                Data.dataMapWithKeys(rows, (row) => ({ [row.name]: row.id })),
            ).toEqualTypeOf<Record<string, number>>();
        });

        it("rejects a scalar the callback returns, which PHP cannot walk", () => {
            // @ts-expect-error - the callback returns an array of pairs, never a scalar
            list.mapWithKeys((value) => value);
            // @ts-expect-error - a number list's callback takes a number
            list.mapWithKeys((value: string) => ({ [value]: value }));
        });
    });

    describe("mapToDictionary", () => {
        it("files each value in a list under its key", () => {
            expectTypeOf(
                people.mapToDictionary((row) => ({ [row.name]: row.id })),
            ).toEqualTypeOf<Collection<number[], string | number, "keyed">>();
            expectTypeOf(
                list.mapToDictionary((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return { [value]: key };
                }),
            ).toEqualTypeOf<Collection<number[], number, "keyed">>();
            expectTypeOf(
                record.mapToDictionary((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return { [value]: key };
                }),
            ).toEqualTypeOf<Collection<("a" | "b" | "c")[], number, "keyed">>();
        });

        it("types a literal key as one the result may lack", () => {
            expectTypeOf(
                list.mapToDictionary((value) => ({ a: value })),
            ).toEqualTypeOf<Collection<number[], "a", "partial">>();
        });

        it("files a list's first value under 0, and false under an empty key for an empty list", () => {
            expectTypeOf(
                people.mapToDictionary((row) => [row.name, row.id]),
            ).toEqualTypeOf<
                Collection<(string | number | false)[], 0 | "", "partial">
            >();
            expectTypeOf(list.mapToDictionary(() => [])).toEqualTypeOf<
                Collection<false[], 0 | "", "partial">
            >();
        });

        it("types any key and value for a callback that may return either form", () => {
            expectTypeOf(
                list.mapToDictionary((value) =>
                    value > 1 ? { a: value } : [value],
                ),
            ).toEqualTypeOf<Collection<unknown[], string | number, "keyed">>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(
                generic.mapToDictionary((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return { [value]: key };
                }),
            ).toEqualTypeOf<Collection<(string | number)[], number, "keyed">>();
            expectTypeOf(
                mapped.mapToDictionary((value, key) => ({ [value]: key })),
            ).toEqualTypeOf<Collection<number[], string | number, "keyed">>();
        });

        it("types a subclass's result as a base collection", () => {
            expectTypeOf(
                tagged.mapToDictionary((value) => ({ [value]: value })),
            ).toEqualTypeOf<Collection<number[], number, "keyed">>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function byName<TItem extends { name: string }>(
                items: Collection<TItem>,
            ) {
                return items
                    .mapToDictionary((item) => ({ [item.name]: item }))
                    .filter(() => true);
            }

            expectTypeOf(byName(people)).toEqualTypeOf<
                Collection<Row[], string | number, "partial">
            >();
        });

        it("rejects a scalar the callback returns, which PHP cannot read a pair from", () => {
            // @ts-expect-error - the callback returns a pair, never a scalar
            list.mapToDictionary((value) => value);
            // @ts-expect-error - a number list's callback takes a number
            list.mapToDictionary((value: string) => ({ [value]: value }));
        });
    });

    describe("mapToGroups", () => {
        it("files each value in a list collection under its key", () => {
            expectTypeOf(
                people.mapToGroups((row) => ({ [row.name]: row.id })),
            ).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list">,
                    string | number,
                    "keyed"
                >
            >();
            expectTypeOf(
                record.mapToGroups((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                    return { [key]: value };
                }),
            ).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list">,
                    string | number,
                    "keyed"
                >
            >();
        });

        it("types a literal key as one the result may lack, and a list return's first value", () => {
            expectTypeOf(
                list.mapToGroups((value) => ({ a: value })),
            ).toEqualTypeOf<
                Collection<Collection<number, number, "list">, "a", "partial">
            >();
            expectTypeOf(people.mapToGroups((row) => [row.name])).toEqualTypeOf<
                Collection<
                    Collection<string | false, number, "list">,
                    0 | "",
                    "partial"
                >
            >();
        });

        it("types any key and value for a callback that may return either form", () => {
            expectTypeOf(
                list.mapToGroups((value) =>
                    value > 1 ? { a: value } : [value],
                ),
            ).toEqualTypeOf<
                Collection<
                    Collection<unknown, number, "list">,
                    string | number,
                    "keyed"
                >
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(
                generic.mapToGroups((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return { [value]: key };
                }),
            ).toEqualTypeOf<
                Collection<
                    Collection<string | number, number, "list">,
                    number,
                    "keyed"
                >
            >();
            expectTypeOf(
                mapped.mapToGroups((value, key) => ({ [value]: key })),
            ).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list">,
                    string | number,
                    "keyed"
                >
            >();
        });

        it("types a subclass's result as a base collection", () => {
            expectTypeOf(
                tagged.mapToGroups((value) => ({ [value]: value })),
            ).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function byName<TItem extends { name: string }>(
                items: Collection<TItem>,
            ) {
                return items
                    .mapToGroups((item) => ({ [item.name]: item }))
                    .filter(() => true);
            }

            expectTypeOf(byName(people)).toEqualTypeOf<
                Collection<
                    Collection<Row, number, "list">,
                    string | number,
                    "partial"
                >
            >();
        });

        it("rejects a scalar the callback returns", () => {
            // @ts-expect-error - the callback returns a pair, never a scalar
            list.mapToGroups((value) => value);
            // @ts-expect-error - a number list's callback takes a number
            list.mapToGroups((value: string) => ({ [value]: value }));
        });
    });

    describe("mapSpread", () => {
        it("spreads a row of one fixed length by position, then its key", () => {
            expectTypeOf(
                collect(pairs).mapSpread((number, letter, key) => {
                    expectTypeOf(number).toEqualTypeOf<number>();
                    expectTypeOf(letter).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return `${number}${letter}`;
                }),
            ).toEqualTypeOf<Collection<string, number, "list">>();
        });

        it("types each argument of a row of open length as any item or the key", () => {
            collect(nestedLists).mapSpread((first, second) => {
                expectTypeOf(first).toEqualTypeOf<number>();
                expectTypeOf(second).toEqualTypeOf<number>();

                return first;
            });
            collect({ x: [1, "a"] }).mapSpread((first) => {
                expectTypeOf(first).toEqualTypeOf<string | number>();

                return first;
            });
        });

        it("spreads a collection row's items, a subclass's too", () => {
            collect([collect([1, 2])]).mapSpread((first) => {
                expectTypeOf(first).toEqualTypeOf<number>();

                return first;
            });
            collect([new Tagged([1])]).mapSpread((first) => {
                expectTypeOf(first).toEqualTypeOf<number>();

                return first;
            });
        });

        it("spreads a plain object or a Map row's values, then its key, as dataMapSpread does", () => {
            collect([{ a: 1 }]).mapSpread((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value;
            });
            collect({ x: { a: 1, b: 2 } }).mapSpread((...args) => {
                expectTypeOf(args).toEqualTypeOf<(number | "x")[]>();

                return args;
            });
            Data.dataMapSpread({ x: { a: 1, b: 2 } }, (...args) => {
                expectTypeOf(args).toEqualTypeOf<(number | "x")[]>();

                return args;
            });
            collect([new Map([["a", 1]])]).mapSpread((...args) => {
                expectTypeOf(args).toEqualTypeOf<number[]>();

                return args;
            });
        });

        it("hands a scalar or a Date row whole, then its key", () => {
            collect([new Date(0)]).mapSpread((...args) => {
                expectTypeOf(args).toEqualTypeOf<[Date, number]>();

                return args;
            });
            expectTypeOf(
                list.mapSpread((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value > key;
                }),
            ).toEqualTypeOf<Collection<boolean, number, "list">>();
        });

        it("hands a null row on as no items, so only its key follows, as Arr::wrap(null) is empty", () => {
            collect([null]).mapSpread((...args) => {
                expectTypeOf(args).toEqualTypeOf<[number]>();

                return args;
            });
            // Rows of differing lengths spread in the open form, where each argument may be an item or the key.
            collect([5, null]).mapSpread((...args) => {
                expectTypeOf(args).toEqualTypeOf<number[]>();

                return args;
            });
            collect([5, undefined]).mapSpread((...args) => {
                expectTypeOf(args).toEqualTypeOf<
                    [number | undefined, number]
                >();

                return args;
            });
        });

        it("keeps a keyed receiver's keys and shape", () => {
            expectTypeOf(
                collect({ x: [1, "a"] as [number, string] }).mapSpread(
                    (number, letter, key) => {
                        expectTypeOf(key).toEqualTypeOf<"x">();

                        return `${number}${letter}`;
                    },
                ),
            ).toEqualTypeOf<Collection<string, "x", "keyed">>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(
                generic.mapSpread((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value;
                }),
            ).toEqualTypeOf<Collection<number, string | number, "keyed">>();
            expectTypeOf(
                mapped.mapSpread((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value;
                }),
            ).toEqualTypeOf<Collection<string, number, "keyed">>();
        });

        it("types a subclass's result as a base collection", () => {
            expectTypeOf(
                tagged.mapSpread((value, key) => value + key),
            ).toEqualTypeOf<Collection<number, number, "list">>();
        });

        it("compiles for a caller whose rows are a type parameter, and chains", () => {
            function joined<TRow extends readonly unknown[]>(
                items: Collection<TRow>,
            ) {
                return items
                    .mapSpread((...args) => args.join(""))
                    .filter((text) => text !== "");
            }

            expectTypeOf(joined(collect(pairs))).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("agrees with dataMapSpread's items", () => {
            const listSpread = collect(pairs).mapSpread(
                (number, letter) => `${number}${letter}`,
            );
            const recordSpread = collect({
                x: [1, "a"] as [number, string],
            }).mapSpread((number, letter) => `${number}${letter}`);

            const dataListSpread = Data.dataMapSpread(
                pairs,
                (number, letter) => `${number}${letter}`,
            );
            const dataRecordSpread = Data.dataMapSpread(
                { x: [1, "a"] as [number, string] },
                (number, letter) => `${number}${letter}`,
            );

            expectTypeOf<ItemsOf<typeof listSpread>>().toEqualTypeOf<
                typeof dataListSpread
            >();
            expectTypeOf<ItemsOf<typeof recordSpread>>().toEqualTypeOf<
                typeof dataRecordSpread
            >();
        });

        it("rejects a callback over another row type", () => {
            // @ts-expect-error - a row's first item is a number
            collect(pairs).mapSpread((number: string) => number);
        });
    });

    describe("mapInto", () => {
        it("constructs the class from each item and its key", () => {
            expectTypeOf(list.mapInto(NumBox)).toEqualTypeOf<
                Collection<NumBox, number, "list">
            >();
            expectTypeOf(list.mapInto(Indexed)).toEqualTypeOf<
                Collection<Indexed, number, "list">
            >();
            expectTypeOf(record.mapInto(NumBox)).toEqualTypeOf<
                Collection<NumBox, "a" | "b" | "c", "keyed">
            >();
        });

        it("resolves each value through a backed enum's from()", () => {
            expectTypeOf(collect([1, 2]).mapInto(Status)).toEqualTypeOf<
                Collection<ReturnType<typeof Status.from>, number, "list">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.mapInto(NumBox)).toEqualTypeOf<
                Collection<NumBox, string | number, "keyed">
            >();
            expectTypeOf(mapped.mapInto(StrBox)).toEqualTypeOf<
                Collection<StrBox, number, "keyed">
            >();
            expectTypeOf(tagged.mapInto(NumBox)).toEqualTypeOf<
                Collection<NumBox, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function boxed<TItem>(
                items: Collection<TItem>,
                target: new (value: TItem) => { value: TItem },
            ) {
                return items.mapInto(target).filter(() => true);
            }

            expectTypeOf(boxed(list, NumBox)).toEqualTypeOf<
                Collection<{ value: number }, number, "list">
            >();
        });

        it("rejects a class whose constructor takes another item or key type", () => {
            // @ts-expect-error - a string box takes a string, never a number
            list.mapInto(StrBox);
            // @ts-expect-error - a record's keys are strings, where the class takes a number key
            record.mapInto(Indexed);
        });
    });

    describe("flatMap", () => {
        it("joins the lists the callback returns into a list", () => {
            expectTypeOf(list.flatMap((value) => [value, value])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(
                people.flatMap((row) => [row.id, row.name]),
            ).toEqualTypeOf<Collection<string | number, number, "list">>();
            expectTypeOf(record.flatMap((value) => [value])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("reads a returned collection through its base class, a subclass's too", () => {
            expectTypeOf(
                list.flatMap((value) => collect([value])),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            expectTypeOf(
                list.flatMap((value) => new Tagged([value])),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            expectTypeOf(
                list.flatMap((value) => collect(new Map([[value, "x"]]))),
            ).toEqualTypeOf<Collection<string, number, "list">>();
        });

        it("types a record or string-keyed collection as either shape, since an empty result is a list", () => {
            expectTypeOf(
                list.flatMap((value) => ({ [`k${value}`]: value })),
            ).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
            expectTypeOf(
                list.flatMap((value) => collect({ a: value })),
            ).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
        });

        it("types the callback's value and key", () => {
            record.flatMap((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return [value];
            });
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(
                generic.flatMap((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return [value];
                }),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            expectTypeOf(
                mapped.flatMap((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return [value];
                }),
            ).toEqualTypeOf<Collection<string, number, "list">>();
        });

        it("types a subclass's result as a base collection", () => {
            expectTypeOf(tagged.flatMap((value) => [value])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function named<TItem>(items: Collection<TItem>) {
                return items
                    .flatMap((item) => [item, String(item)])
                    .filter(() => true);
            }

            expectTypeOf(named(people)).toEqualTypeOf<
                Collection<Row | string, number, "list">
            >();
        });

        it("rejects a scalar the callback returns, as PHP's callable returns an array or a collection", () => {
            // @ts-expect-error - the callback returns a list, a record or a collection
            list.flatMap((value) => value);
            // @ts-expect-error - a number list's callback takes a number
            list.flatMap((value: string) => [value]);
        });
    });

    describe("each", () => {
        it("returns the receiver's own type, a subclass's included", () => {
            expectTypeOf(list.each(() => undefined)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.each(() => false)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(tagged.each(() => undefined)).toEqualTypeOf<Tagged>();
            expectTypeOf(new Bag([1, 2]).visit(() => undefined)).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("types the callback's value and key", () => {
            people.each((row, key) => {
                expectTypeOf(row).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();
            });
            record.each((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();
            });
        });

        it("types a generic or a Map-built collection's callback", () => {
            expectTypeOf(
                generic.each((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();
                }),
            ).toEqualTypeOf<Collection<number, string | number>>();
            expectTypeOf(
                mapped.each((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();
                }),
            ).toEqualTypeOf<Collection<string, number, "keyed">>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function visited<TItem>(
                items: Collection<TItem>,
                callback: (value: TItem) => void,
            ) {
                return items.each(callback).filter(() => true);
            }

            expectTypeOf(visited(list, () => undefined)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("rejects a callback over another item type", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.each((value: string) => value);
        });
    });

    describe("eachSpread", () => {
        it("spreads each row's items, then its key, and returns the receiver's own type", () => {
            expectTypeOf(
                collect(pairs).eachSpread((number, letter, key) => {
                    expectTypeOf(number).toEqualTypeOf<number>();
                    expectTypeOf(letter).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();
                }),
            ).toEqualTypeOf<Collection<[number, string], number, "list">>();
            expectTypeOf(
                tagged.eachSpread((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<number>();
                }),
            ).toEqualTypeOf<Tagged>();
        });

        it("hands an object row whole and spreads a collection row's items", () => {
            collect([{ a: 1 }]).eachSpread((row) => {
                expectTypeOf(row).toEqualTypeOf<{ a: number }>();
            });
            collect([collect([1, 2])]).eachSpread((first) => {
                expectTypeOf(first).toEqualTypeOf<number>();
            });
        });

        it("hands a null row on as no items, so only its key follows, as Arr::wrap(null) is empty", () => {
            collect([null]).eachSpread((...args) => {
                expectTypeOf(args).toEqualTypeOf<[number]>();
            });
            collect([5, null]).eachSpread((...args) => {
                expectTypeOf(args).toEqualTypeOf<number[]>();
            });
            collect([5, undefined]).eachSpread((...args) => {
                expectTypeOf(args).toEqualTypeOf<
                    [number | undefined, number]
                >();
            });
        });

        it("types a generic or a Map-built collection's callback", () => {
            expectTypeOf(
                generic.eachSpread((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();
                }),
            ).toEqualTypeOf<Collection<number, string | number>>();
            expectTypeOf(
                mapped.eachSpread((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();
                }),
            ).toEqualTypeOf<Collection<string, number, "keyed">>();
        });

        it("compiles for a caller whose rows are a type parameter, and chains", () => {
            function visited<TRow extends readonly unknown[]>(
                items: Collection<TRow>,
            ) {
                return items.eachSpread(() => undefined).filter(() => true);
            }

            expectTypeOf(visited(collect(pairs))).toEqualTypeOf<
                Collection<[number, string], number, "list">
            >();
        });

        it("rejects a callback over another row type", () => {
            // @ts-expect-error - a row's first item is a number
            collect(pairs).eachSpread((number: string) => number);
        });
    });

    describe("groupBy", () => {
        it("groups rows by a path into list collections, keyed the way PHP stores each key", () => {
            expectTypeOf(people.groupBy("name")).toEqualTypeOf<
                Collection<
                    Collection<Row, number, "list">,
                    string | number,
                    "keyed"
                >
            >();
            expectTypeOf(people.groupBy("id")).toEqualTypeOf<
                Collection<Collection<Row, number, "list">, number, "keyed">
            >();
            expectTypeOf(keyedPeople.groupBy("id")).toEqualTypeOf<
                Collection<Collection<Row, number, "list">, number, "keyed">
            >();
        });

        it("groups by what a callback gives, each member of a list it gives, and 0/1 for a boolean", () => {
            expectTypeOf(
                people.groupBy((row, key) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return row.id;
                }),
            ).toEqualTypeOf<
                Collection<Collection<Row, number, "list">, number, "keyed">
            >();
            expectTypeOf(
                people.groupBy((row) => [row.id, row.id * 10]),
            ).toEqualTypeOf<
                Collection<Collection<Row, number, "list">, number, "keyed">
            >();
            expectTypeOf(list.groupBy((value) => value > 1)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, 0 | 1, "partial">
            >();
        });

        it("keeps the items' keys in each group when preserving them", () => {
            // A list's items keep their keys, which run 0..n-1 in only some groups.
            expectTypeOf(
                list.groupBy((value) => value % 2, true),
            ).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list" | "partial">,
                    number,
                    "keyed"
                >
            >();
            expectTypeOf(
                record.groupBy((value) => value % 2, true),
            ).toEqualTypeOf<
                Collection<
                    Collection<number, "a" | "b" | "c", "partial">,
                    number,
                    "keyed"
                >
            >();
            expectTypeOf(
                record.groupBy((value) => value % 2, flag),
            ).toEqualTypeOf<
                Collection<
                    Collection<
                        number,
                        number | "a" | "b" | "c",
                        "list" | "partial"
                    >,
                    number,
                    "keyed"
                >
            >();
        });

        it("types a multi-level grouping's inner groups as unknown collections", () => {
            expectTypeOf(
                people.groupBy([
                    "id",
                    (row, key) => {
                        expectTypeOf(row).toEqualTypeOf<Row>();
                        expectTypeOf(key).toEqualTypeOf<number>();

                        return row.name;
                    },
                ]),
            ).toEqualTypeOf<
                Collection<
                    Collection<unknown, string | number, CollectionShape>,
                    string | number,
                    "keyed"
                >
            >();
            expectTypeOf(list.groupBy([])).toEqualTypeOf<
                Collection<
                    Collection<unknown, string | number, CollectionShape>,
                    string | number,
                    "keyed"
                >
            >();
        });

        it("keeps the items' type for a nullable path or a path-or-callback variable", () => {
            expectTypeOf(people.groupBy(maybeName)).toEqualTypeOf<
                Collection<
                    Collection<Row, number, "list">,
                    string | number,
                    "keyed"
                >
            >();
            expectTypeOf(people.groupBy(pathOrCallback)).toEqualTypeOf<
                Collection<
                    Collection<Row, number, "list">,
                    string | number,
                    "keyed"
                >
            >();
            expectTypeOf(people.groupBy(maybeName, flag)).toEqualTypeOf<
                Collection<
                    Collection<Row, number, "list" | "partial">,
                    string | number,
                    "keyed"
                >
            >();
            expectTypeOf(
                keyedPeople.groupBy(pathOrCallback, true),
            ).toEqualTypeOf<
                Collection<
                    Collection<Row, "ada" | "grace", "partial">,
                    string | number,
                    "keyed"
                >
            >();
        });

        it("types unknown groups for a variable that may be a list of groupings", () => {
            expectTypeOf(people.groupBy(pathOrPaths)).toEqualTypeOf<
                Collection<
                    Collection<unknown, PropertyKey, CollectionShape>,
                    string | number,
                    "keyed"
                >
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(
                generic.groupBy((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value;
                }),
            ).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "keyed">
            >();
            expectTypeOf(mapped.groupBy((value) => value, true)).toEqualTypeOf<
                Collection<
                    Collection<string, number, "partial">,
                    string | number,
                    "keyed"
                >
            >();
            expectTypeOf(tagged.groupBy((value) => value)).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "keyed">
            >();
            expectTypeOf(
                new Bag([1, 2]).grouped((value) => value),
            ).toEqualTypeOf<
                Collection<Collection<number, number, "list">, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function byKey<TItem, TGroupKey extends string>(
                items: Collection<TItem>,
                callback: (value: TItem) => TGroupKey,
            ) {
                return items.groupBy(callback).filter(() => true);
            }

            expectTypeOf(byKey(people, (row) => row.name)).toEqualTypeOf<
                Collection<
                    Collection<Row, number, "list">,
                    string | number,
                    "partial"
                >
            >();
        });

        it("rejects a callback over another item or key type, and a path that is no key", () => {
            // @ts-expect-error - a list's key is a number
            list.groupBy((_value, key: string) => key);
            // @ts-expect-error - a number list's callback takes a number
            list.groupBy((value: string) => value);
            // @ts-expect-error - PHP's data_get() takes a string or int key
            people.groupBy({});
        });
    });

    describe("keyBy", () => {
        it("keys rows by a path, the way PHP stores each key", () => {
            expectTypeOf(people.keyBy("id")).toEqualTypeOf<
                Collection<Row, number, "keyed">
            >();
            expectTypeOf(people.keyBy("name")).toEqualTypeOf<
                Collection<Row, string | number, "keyed">
            >();
            expectTypeOf(collect(nullableRows).keyBy("name")).toEqualTypeOf<
                Collection<NullableRow, string | number, "keyed">
            >();
            expectTypeOf(collect(nestedLists).keyBy(0)).toEqualTypeOf<
                Collection<number[], number, "keyed">
            >();
            expectTypeOf(people.keyBy(["id"])).toEqualTypeOf<
                Collection<Row, string | number, "keyed">
            >();
        });

        it("keys items by what a callback gives", () => {
            expectTypeOf(
                keyedPeople.keyBy((row, key) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();
                    expectTypeOf(key).toEqualTypeOf<"ada" | "grace">();

                    return row.name;
                }),
            ).toEqualTypeOf<Collection<Row, string | number, "keyed">>();
        });

        it("keys by 0 or 1 for a boolean, which a result may lack", () => {
            // Not pinned: dataKeyBy's list row takes no boolean key, which PHP casts to 0 or 1.
            expectTypeOf(list.keyBy((value) => value > 1)).toEqualTypeOf<
                Collection<number, 0 | 1, "partial">
            >();
            expectTypeOf(
                collect(letters).keyBy((value) => value),
            ).toEqualTypeOf<Collection<"a" | "b", "a" | "b", "partial">>();
        });

        it("compiles for a path-or-callback variable", () => {
            expectTypeOf(people.keyBy(pathOrCallback)).toEqualTypeOf<
                Collection<Row, string | number, "keyed">
            >();
            expectTypeOf(people.keyBy(pathKey)).toEqualTypeOf<
                Collection<Row, string | number, "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(
                generic.keyBy((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value;
                }),
            ).toEqualTypeOf<Collection<number, number, "keyed">>();
            expectTypeOf(mapped.keyBy((value) => value)).toEqualTypeOf<
                Collection<string, string | number, "keyed">
            >();
            expectTypeOf(tagged.keyBy((value) => value)).toEqualTypeOf<
                Collection<number, number, "keyed">
            >();
            expectTypeOf(
                new Bag([1, 2]).indexed((value) => String(value)),
            ).toEqualTypeOf<Collection<number, string | number, "keyed">>();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function byId<TItem extends { id: number }>(
                items: Collection<TItem>,
            ) {
                return items.keyBy((item) => item.id).filter(() => true);
            }

            expectTypeOf(byId(people)).toEqualTypeOf<
                Collection<Row, number, "partial">
            >();
        });

        it("agrees with dataKeyBy's items", () => {
            const byId = people.keyBy("id");
            const keyedById = collect(keyedRows).keyBy("id");
            const dataById = Data.dataKeyBy(rows, "id");
            const dataKeyedById = Data.dataKeyBy(keyedRows, "id");

            expectTypeOf<ItemsOf<typeof byId>>().toEqualTypeOf<
                typeof dataById
            >();
            expectTypeOf<ItemsOf<typeof keyedById>>().toEqualTypeOf<
                typeof dataKeyedById
            >();
            // Kept beside the pins, which answer Record<number, Row> for both backings and so cannot tell them apart.
            expectTypeOf<ItemsOf<typeof keyedById>>().toEqualTypeOf<
                Record<number, Row>
            >();
        });

        it("rejects a callback over another item type, and a path that is no key", () => {
            // @ts-expect-error - a rows collection's callback takes a row
            people.keyBy((value: number) => value);
            // @ts-expect-error - PHP's data_get() takes a string or int key
            people.keyBy({});
        });
    });

    describe("countBy", () => {
        it("counts the values themselves, keyed the way PHP stores each value", () => {
            expectTypeOf(list.countBy()).toEqualTypeOf<
                Collection<number, number, "keyed">
            >();
            expectTypeOf(list.countBy(null)).toEqualTypeOf<
                Collection<number, number, "keyed">
            >();
            expectTypeOf(collect(letters).countBy()).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("counts what a path or a callback gives", () => {
            expectTypeOf(people.countBy("name")).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(
                people.countBy((row, key) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return row.id;
                }),
            ).toEqualTypeOf<Collection<number, number, "keyed">>();
            expectTypeOf(list.countBy((value) => value > 1)).toEqualTypeOf<
                Collection<number, 0 | 1, "partial">
            >();
            expectTypeOf(
                keyedPeople.countBy((row, key) => {
                    expectTypeOf(key).toEqualTypeOf<"ada" | "grace">();

                    return row.name;
                }),
            ).toEqualTypeOf<Collection<number, string | number, "keyed">>();
        });

        it("compiles for a nullable callback or a path variable", () => {
            // Without a callback the values are counted, so the keys are a number's or a boolean's.
            expectTypeOf(list.countBy(maybeTest)).toEqualTypeOf<
                Collection<number, number, "keyed">
            >();
            expectTypeOf(people.countBy(pathKey)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(
                generic.countBy((value, key) => {
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value;
                }),
            ).toEqualTypeOf<Collection<number, number, "keyed">>();
            expectTypeOf(mapped.countBy()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(tagged.countBy()).toEqualTypeOf<
                Collection<number, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function tally<TItem>(items: Collection<TItem>) {
                return items.countBy().filter((count) => count > 1);
            }

            expectTypeOf(tally(list)).toEqualTypeOf<
                Collection<number, number, "partial">
            >();
        });

        it("rejects a callback over another item type, and a path that is no key", () => {
            // @ts-expect-error - a rows collection's callback takes a row
            people.countBy((value: number) => value);
            // @ts-expect-error - PHP's data_get() takes a string or int key
            people.countBy({});
        });
    });

    describe("pluck", () => {
        it("lists what a path reads without a key", () => {
            expectTypeOf(people.pluck("name")).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(keyedPeople.pluck("name")).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(collect(nullableRows).pluck("name")).toEqualTypeOf<
                Collection<string | null, number, "list">
            >();
            expectTypeOf(
                collect([{ tags: ["a"] }]).pluck("tags.*"),
            ).toEqualTypeOf<Collection<string[], number, "list">>();
            expectTypeOf(people.pluck("nope")).toEqualTypeOf<
                Collection<unknown, number, "list">
            >();
            expectTypeOf(people.pluck(["name"])).toEqualTypeOf<
                Collection<unknown, number, "list">
            >();
        });

        it("keys what it reads by a key path or a key callback", () => {
            expectTypeOf(people.pluck("name", "id")).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(people.pluck("id", "name")).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(
                people.pluck("name", (row) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();

                    return row.id > 1;
                }),
            ).toEqualTypeOf<Collection<string, 0 | 1, "partial">>();
        });

        it("reads a value callback, with or without a key", () => {
            expectTypeOf(
                people.pluck((row) => {
                    expectTypeOf(row).toEqualTypeOf<Row>();

                    return row.id;
                }),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            expectTypeOf(people.pluck((row) => row.id, "name")).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(
                people.pluck(
                    (row) => row.name,
                    (row) => row.id,
                ),
            ).toEqualTypeOf<Collection<string, number, "keyed">>();
        });

        it("types a nullable key variable's result as either shape", () => {
            expectTypeOf(people.pluck("name", maybeName)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.pluck("x")).toEqualTypeOf<
                Collection<unknown, number, "list">
            >();
            expectTypeOf(mapped.pluck("length")).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(tagged.pluck("x")).toEqualTypeOf<
                Collection<unknown, number, "list">
            >();
        });

        it("types a generic subclass's result as a base collection", () => {
            expectTypeOf(new Bag(rows).labels()).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function names<TItem extends { name: string }>(
                items: Collection<TItem>,
            ) {
                return items.pluck("name").filter(() => true);
            }

            expectTypeOf(names(people)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("agrees with dataPluck's items without a key", () => {
            const names = people.pluck("name");
            const keyedNames = keyedPeople.pluck("name");
            const dataNames = Data.dataPluck(rows, "name");
            const dataKeyedNames = Data.dataPluck(keyedRows, "name");

            expectTypeOf<ItemsOf<typeof names>>().toEqualTypeOf<
                typeof dataNames
            >();
            expectTypeOf<ItemsOf<typeof keyedNames>>().toEqualTypeOf<
                typeof dataKeyedNames
            >();
            // Kept beside the pins, which answer string[] for both backings and so cannot tell them apart.
            expectTypeOf<ItemsOf<typeof keyedNames>>().toEqualTypeOf<
                string[]
            >();
        });

        it("differs from dataPluck with a key, which types every key as any array key", () => {
            // PHP keys each value by the id it reads, a number here, where dataPluck answers string | number.
            const byId = people.pluck("name", "id");

            expectTypeOf<ItemsOf<typeof byId>>().toEqualTypeOf<
                Record<number, string>
            >();
            expectTypeOf(Data.dataPluck(rows, "name", "id")).toEqualTypeOf<
                Record<string | number, string>
            >();
        });

        it("rejects a path that is no key, and a key callback over another item type", () => {
            // @ts-expect-error - PHP's data_get() takes a string or int key
            people.pluck({});
            // @ts-expect-error - a rows collection's key callback takes a row
            people.pluck("name", (value: number) => value);
        });
    });

    describe("flip", () => {
        it("keys each key by its value, the way PHP stores it", () => {
            expectTypeOf(collect({ a: 1, b: 2 }).flip()).toEqualTypeOf<
                Collection<"a" | "b", number, "keyed">
            >();
            expectTypeOf(collect(["a", "b"]).flip()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(collect(mixed).flip()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(unknowns.flip()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
        });

        it("types a literal value's key as one the result may lack", () => {
            expectTypeOf(collect(letters).flip()).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.flip()).toEqualTypeOf<
                Collection<string | number, number, "keyed">
            >();
            expectTypeOf(mapped.flip()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(tagged.flip()).toEqualTypeOf<
                Collection<number, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function flipped<
                TItem extends string,
                TItemKey extends PropertyKey,
            >(items: Collection<TItem, TItemKey, "keyed">) {
                return items.flip().filter(() => true);
            }

            expectTypeOf(
                flipped(collect({ a: "x" as string, b: "y" as string })),
            ).toEqualTypeOf<
                Collection<"a" | "b", string | number, "partial">
            >();
        });

        it("differs from dataFlip, which keys a list's or a record's values by string", () => {
            // PHP stores a value that reads as an integer under that integer, which dataFlip types as a string.
            const listFlipped = collect(["a", "b"]).flip();
            const recordFlipped = record.flip();

            expectTypeOf<ItemsOf<typeof listFlipped>>().toEqualTypeOf<
                Record<string | number, number>
            >();
            expectTypeOf(Data.dataFlip(["a", "b"])).toEqualTypeOf<
                Record<string, number>
            >();
            expectTypeOf<ItemsOf<typeof recordFlipped>>().toEqualTypeOf<
                Record<number, "a" | "b" | "c">
            >();
        });
    });

    describe("collapse", () => {
        it("joins a list's lists, or a record's, into a list", () => {
            expectTypeOf(collect(nestedLists).collapse()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect(recordOfLists).collapse()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("joins collection items through their base class, a subclass's too", () => {
            expectTypeOf(
                collect([collect([1, 2]), collect([3])]).collapse(),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            expectTypeOf(
                collect([new Tagged([1]), new Tagged([2])]).collapse(),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            // A collection's integer keys are renumbered into a list, whatever its shape.
            expectTypeOf(collect([mapped]).collapse()).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("types a result that may keep string keys as either shape, since an empty collection gives a list", () => {
            expectTypeOf(collect(records).collapse()).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
            expectTypeOf(collect([collect({ a: 1 })]).collapse()).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
            expectTypeOf(unknowns.collapse()).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
        });

        it("skips a scalar item, as PHP skips anything but an array", () => {
            expectTypeOf(list.collapse()).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(generic.collapse()).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(mapped.collapse()).toEqualTypeOf<
                Collection<never, number, "list">
            >();
        });

        it("types a subclass's result as a base collection", () => {
            expectTypeOf(tagged.collapse()).toEqualTypeOf<
                Collection<never, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function joined<TItem>(items: Collection<TItem[]>) {
                return items.collapse().filter(() => true);
            }
            function anyJoined<TItem>(items: Collection<TItem>) {
                return items.collapse().filter(() => true);
            }

            expectTypeOf(joined(collect(nestedLists))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(anyJoined(collect(nestedLists))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("agrees with dataCollapse's items for a list of lists", () => {
            const joined = collect(nestedLists).collapse();

            expectTypeOf<ItemsOf<typeof joined>>().toEqualTypeOf(
                Data.dataCollapse(nestedLists),
            );
        });

        it("agrees with dataCollapse's items for a list of list collections", () => {
            const lists = [collect([1, 2]), collect([3])];
            const joined = collect(lists).collapse();
            const collapsed = Data.dataCollapse(lists);

            expectTypeOf<ItemsOf<typeof joined>>().toEqualTypeOf<
                typeof collapsed
            >();
            // Stated too: dataCollapse reads each item's all(), which answers a list collection's items as a list.
            expectTypeOf(collapsed).toEqualTypeOf<number[]>();
        });

        it("differs from dataCollapse for a record of lists, which it types as a record", () => {
            // Arr::collapse merges a record's lists into a list, which dataCollapse types as obj's record.
            const joined = collect(recordOfLists).collapse();

            expectTypeOf<ItemsOf<typeof joined>>().toEqualTypeOf<number[]>();
            expectTypeOf(Data.dataCollapse(recordOfLists)).toEqualTypeOf<
                Record<string | number, unknown>
            >();
        });
    });

    describe("collapseWithKeys", () => {
        it("keeps a list of lists a list", () => {
            expectTypeOf(collect(nestedLists).collapseWithKeys()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(
                collect([new Tagged([1]), new Tagged([2])]).collapseWithKeys(),
            ).toEqualTypeOf<Collection<number, number, "list">>();
        });

        it("keeps each record's own keys, which another record may lack", () => {
            expectTypeOf(collect(eitherKey).collapseWithKeys()).toEqualTypeOf<
                Collection<number, "a" | "b", "list" | "partial">
            >();
            expectTypeOf(
                collect([collect({ a: 1 })]).collapseWithKeys(),
            ).toEqualTypeOf<Collection<number, "a", "list" | "partial">>();
            expectTypeOf(collect([mapped]).collapseWithKeys()).toEqualTypeOf<
                Collection<string, number, "list" | "partial">
            >();
            expectTypeOf(unknowns.collapseWithKeys()).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "partial">
            >();
        });

        it("types a generic or a Map-built collection's scalars as skipped", () => {
            expectTypeOf(generic.collapseWithKeys()).toEqualTypeOf<
                Collection<never, never, "list">
            >();
            expectTypeOf(mapped.collapseWithKeys()).toEqualTypeOf<
                Collection<never, never, "list">
            >();
        });

        it("types a subclass's result as a base collection", () => {
            expectTypeOf(tagged.collapseWithKeys()).toEqualTypeOf<
                Collection<never, never, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function joined<TItem>(items: Collection<TItem[]>) {
                return items.collapseWithKeys().filter(() => true);
            }

            expectTypeOf(joined(collect(nestedLists))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });
    });

    describe("flatten", () => {
        it("flattens every level into a list", () => {
            expectTypeOf(collect(nestedLists).flatten()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect([[1, [2]], [3]]).flatten()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect(recordOfLists).flatten()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(people.flatten()).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(collect([new Tagged([1])]).flatten()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types a depth's result as any level below the items", () => {
            expectTypeOf(collect([[1, [2]], [3]]).flatten(1)).toEqualTypeOf<
                Collection<number | number[], number, "list">
            >();
            expectTypeOf(
                collect(nestedLists).flatten(maybeDepth),
            ).toEqualTypeOf<Collection<number, number, "list">>();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.flatten()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(mapped.flatten(1)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(tagged.flatten()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function flat<TItem>(items: Collection<TItem[]>) {
                return items.flatten().filter(() => true);
            }

            expectTypeOf(flat(collect(nestedLists))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("agrees with dataFlatten's items, with and without a depth", () => {
            const listFlat = collect(nestedLists).flatten();
            const listFlatOne = collect(nestedLists).flatten(1);
            const recordFlat = collect(recordOfLists).flatten();
            const dataListFlatOne = Data.dataFlatten(nestedLists, 1);

            expectTypeOf<ItemsOf<typeof listFlat>>().toEqualTypeOf(
                Data.dataFlatten(nestedLists),
            );
            expectTypeOf<ItemsOf<typeof listFlatOne>>().toEqualTypeOf<
                typeof dataListFlatOne
            >();
            expectTypeOf<ItemsOf<typeof recordFlat>>().toEqualTypeOf(
                Data.dataFlatten(recordOfLists),
            );
            // Kept beside the pins, which answer number[] for both backings and so cannot tell them apart.
            expectTypeOf<ItemsOf<typeof recordFlat>>().toEqualTypeOf<
                number[]
            >();
        });

        it("differs from dataFlatten's depth for a record, which keeps each item itself too", () => {
            // Arr::flatten opens every list item at least once, which obj's depth row does not.
            const recordFlatOne = collect(recordOfLists).flatten(1);

            expectTypeOf<ItemsOf<typeof recordFlatOne>>().toEqualTypeOf<
                number[]
            >();
            expectTypeOf(Data.dataFlatten(recordOfLists, 1)).toEqualTypeOf<
                (number | number[])[]
            >();
        });

        it("rejects a depth that is no number", () => {
            // @ts-expect-error - the depth is a number
            list.flatten("1");
        });
    });

    describe("dot", () => {
        it("keys each value by its dot path, the way PHP stores it", () => {
            expectTypeOf(collect({ a: { b: 1 }, c: 2 }).dot()).toEqualTypeOf<
                Collection<number | { b: number }, string | number, "keyed">
            >();
            expectTypeOf(collect(nestedLists).dot()).toEqualTypeOf<
                Collection<number | number[], string | number, "keyed">
            >();
            expectTypeOf(people.dot()).toEqualTypeOf<
                Collection<string | number | Row, string | number, "keyed">
            >();
        });

        it("types a depth's result as any level below the items", () => {
            expectTypeOf(collect(nestedLists).dot(1)).toEqualTypeOf<
                Collection<number | number[], string | number, "keyed">
            >();
            expectTypeOf(collect(nestedLists).dot(maybeDepth)).toEqualTypeOf<
                Collection<number | number[], string | number, "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.dot()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.dot()).toEqualTypeOf<
                Collection<string, string | number, "keyed">
            >();
            expectTypeOf(tagged.dot()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function dotted<TItem>(items: Collection<TItem>) {
                return items.dot().filter(() => true);
            }

            expectTypeOf(dotted(list)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
        });

        it("differs from dataDot, which keys every path by string", () => {
            // PHP stores a path that reads as an integer under that integer, which dataDot types as a string.
            const flat = collect(nestedLists).dot(1);

            expectTypeOf<ItemsOf<typeof flat>>().toEqualTypeOf<
                Record<string | number, number | number[]>
            >();
            expectTypeOf(Data.dataDot(nestedLists, "", 1)).toEqualTypeOf<
                Record<string, number | number[]>
            >();
        });

        it("rejects a depth that is no number", () => {
            // @ts-expect-error - the depth is a number
            list.dot("1");
        });
    });

    describe("undot", () => {
        it("keeps a list, whose keys hold no dot, a list of its own type", () => {
            expectTypeOf(list.undot()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(tagged.undot()).toEqualTypeOf<Tagged>();
            expectTypeOf(new Bag([1, 2]).expanded()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("expands a keyed collection's dotted keys", () => {
            expectTypeOf(collect(dotted).undot()).toEqualTypeOf<
                Collection<UndotObjectValue<number>, string | number, "keyed">
            >();
            expectTypeOf(partial.undot()).toEqualTypeOf<
                Collection<UndotObjectValue<number>, string | number, "keyed">
            >();
            expectTypeOf(listOrKeyed.undot()).toEqualTypeOf<
                Collection<
                    UndotObjectValue<number>,
                    string | number,
                    "list" | "keyed"
                >
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.undot()).toEqualTypeOf<
                Collection<UndotObjectValue<number>, string | number, "keyed">
            >();
            expectTypeOf(mapped.undot()).toEqualTypeOf<
                Collection<UndotObjectValue<string>, string | number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter, and chains", () => {
            function expanded<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                return items.undot().filter(() => true);
            }

            expectTypeOf(expanded(collect(dotted))).toEqualTypeOf<
                Collection<UndotObjectValue<number>, string | number, "partial">
            >();
        });

        it("agrees with dataUndot's items for a list", () => {
            const expanded = list.undot();

            expectTypeOf<ItemsOf<typeof expanded>>().toEqualTypeOf(
                Data.dataUndot(numberList),
            );
        });

        it("differs from dataUndot for a record, which keys every expanded key by string", () => {
            // PHP stores a key that reads as an integer under that integer, which dataUndot types as a string.
            const expanded = collect(dotted).undot();

            expectTypeOf<ItemsOf<typeof expanded>>().toEqualTypeOf<
                Record<string | number, UndotObjectValue<number>>
            >();
            expectTypeOf(Data.dataUndot(dotted)).toEqualTypeOf<
                Record<string, UndotObjectValue<number>>
            >();
        });
    });

    describe("type-parameter callers", () => {
        it("compiles each method for a list whose item type is a type parameter", () => {
            // Each collection answer chains into filter(), which TypeScript calls on no union of collection types.
            function listed<TItem>(items: Collection<TItem>) {
                return {
                    map: items.map((value) => [value]).filter(() => true),
                    mapWithKeys: items
                        .mapWithKeys((value) => ({ a: value }))
                        .filter(() => true),
                    mapToDictionary: items
                        .mapToDictionary((value) => ({ a: value }))
                        .filter(() => true),
                    mapToGroups: items
                        .mapToGroups((value) => ({ a: value }))
                        .filter(() => true),
                    mapSpread: items
                        .mapSpread((...values) => values)
                        .filter(() => true),
                    mapInto: items.mapInto(Held).filter(() => true),
                    flatMap: items
                        .flatMap((value) => [value])
                        .filter(() => true),
                    each: items.each(() => undefined).filter(() => true),
                    eachSpread: items
                        .eachSpread(() => undefined)
                        .filter(() => true),
                    groupBy: items
                        .groupBy((value) => String(value))
                        .filter(() => true),
                    keyBy: items
                        .keyBy((value) => String(value))
                        .filter(() => true),
                    countBy: items.countBy().filter(() => true),
                    pluck: items.pluck("id").filter(() => true),
                    flip: items.flip().filter(() => true),
                    collapse: items.collapse().filter(() => true),
                    collapseWithKeys: items
                        .collapseWithKeys()
                        .filter(() => true),
                    flatten: items.flatten().filter(() => true),
                    dot: items.dot().filter(() => true),
                    undot: items.undot().filter(() => true),
                };
            }

            const answers = listed(list);

            expectTypeOf(answers.map).toEqualTypeOf<
                Collection<number[], number, "list">
            >();
            expectTypeOf(answers.mapWithKeys).toEqualTypeOf<
                Collection<number, "a", "partial">
            >();
            expectTypeOf(answers.mapToDictionary).toEqualTypeOf<
                Collection<number[], "a", "partial">
            >();
            expectTypeOf(answers.mapToGroups).toEqualTypeOf<
                Collection<Collection<number, number, "list">, "a", "partial">
            >();
            expectTypeOf(answers.mapSpread).toEqualTypeOf<
                Collection<[number, number], number, "list">
            >();
            expectTypeOf(answers.mapInto).toEqualTypeOf<
                Collection<Held, number, "list">
            >();
            expectTypeOf(answers.flatMap).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.each).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.eachSpread).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.groupBy).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list">,
                    string | number,
                    "partial"
                >
            >();
            expectTypeOf(answers.keyBy).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(answers.countBy).toEqualTypeOf<
                Collection<number, number, "partial">
            >();
            expectTypeOf(answers.pluck).toEqualTypeOf<
                Collection<unknown, number, "list">
            >();
            expectTypeOf(answers.flip).toEqualTypeOf<
                Collection<number, number, "partial">
            >();
            expectTypeOf(answers.collapse).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(answers.collapseWithKeys).toEqualTypeOf<
                Collection<never, never, "list">
            >();
            expectTypeOf(answers.flatten).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.dot).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(answers.undot).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("compiles each method for a collection whose item, key and shape types are type parameters", () => {
            function shaped<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                return {
                    map: items.map((value) => [value]).filter(() => true),
                    mapWithKeys: items
                        .mapWithKeys((value) => ({ a: value }))
                        .filter(() => true),
                    mapToDictionary: items
                        .mapToDictionary((value) => ({ a: value }))
                        .filter(() => true),
                    mapToGroups: items
                        .mapToGroups((value) => ({ a: value }))
                        .filter(() => true),
                    mapSpread: items
                        .mapSpread((...values) => values)
                        .filter(() => true),
                    mapInto: items.mapInto(Held).filter(() => true),
                    flatMap: items
                        .flatMap((value) => [value])
                        .filter(() => true),
                    each: items.each(() => undefined).filter(() => true),
                    eachSpread: items
                        .eachSpread(() => undefined)
                        .filter(() => true),
                    groupBy: items
                        .groupBy((value) => String(value))
                        .filter(() => true),
                    keyBy: items
                        .keyBy((value) => String(value))
                        .filter(() => true),
                    countBy: items.countBy().filter(() => true),
                    pluck: items.pluck("id").filter(() => true),
                    flip: items.flip().filter(() => true),
                    collapse: items.collapse().filter(() => true),
                    collapseWithKeys: items
                        .collapseWithKeys()
                        .filter(() => true),
                    flatten: items.flatten().filter(() => true),
                    dot: items.dot().filter(() => true),
                    undot: items.undot().filter(() => true),
                };
            }

            const answers = shaped(record);

            expectTypeOf(answers.map).toEqualTypeOf<
                Collection<number[], "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.mapWithKeys).toEqualTypeOf<
                Collection<number, "a", "partial">
            >();
            expectTypeOf(answers.mapToDictionary).toEqualTypeOf<
                Collection<number[], "a", "partial">
            >();
            expectTypeOf(answers.mapToGroups).toEqualTypeOf<
                Collection<Collection<number, number, "list">, "a", "partial">
            >();
            expectTypeOf(answers.mapSpread).toEqualTypeOf<
                Collection<
                    [number, "a" | "b" | "c"],
                    "a" | "b" | "c",
                    "partial"
                >
            >();
            expectTypeOf(answers.mapInto).toEqualTypeOf<
                Collection<Held, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.flatMap).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.each).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.eachSpread).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.groupBy).toEqualTypeOf<
                Collection<
                    Collection<number, number, "list">,
                    string | number,
                    "partial"
                >
            >();
            expectTypeOf(answers.keyBy).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(answers.countBy).toEqualTypeOf<
                Collection<number, number, "partial">
            >();
            expectTypeOf(answers.pluck).toEqualTypeOf<
                Collection<unknown, number, "list">
            >();
            expectTypeOf(answers.flip).toEqualTypeOf<
                Collection<"a" | "b" | "c", number, "partial">
            >();
            expectTypeOf(answers.collapse).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(answers.collapseWithKeys).toEqualTypeOf<
                Collection<never, never, "list">
            >();
            expectTypeOf(answers.flatten).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.dot).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(answers.undot).toEqualTypeOf<
                Collection<UndotObjectValue<number>, string | number, "partial">
            >();
        });

        it("compiles each method in a generic subclass, whose member calls it on itself", () => {
            expectTypeOf(new Bag([1, 2]).called()).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });
});
