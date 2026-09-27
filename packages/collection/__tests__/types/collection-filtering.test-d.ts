import { collect, Collection, type CollectionShape } from "@tolki/collection";
import * as Data from "@tolki/data";
import type { PathKey } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import type { ItemsOf } from "../helpers";
import {
    abc,
    generic,
    mapBuilt,
    mixed,
    type NullableRow,
    nullableRows,
    numberList,
    type Row,
    rows,
    Tagged,
} from "./fixtures";

declare const partial: Collection<number, "a" | "b", "partial">;
declare const listOrKeyed: Collection<number, number, "list" | "keyed">;
declare const anyShape: Collection<unknown, PropertyKey, CollectionShape>;
declare const keyedPeople: Collection<Row, "ada" | "grace", "keyed">;
declare const nullableRecord: Collection<number | null, "a" | "b", "keyed">;
declare const nullableFields: { a: number; b: number | null };
declare const maybeCallback: ((value: number, key: number) => boolean) | null;
declare const maybeRecordCallback:
    | ((value: number, key: "a" | "b" | "c") => boolean)
    | null;
declare const callbackOrValue: ((value: number) => boolean) | number;
declare const maybeRowCallback: ((value: Row, key: number) => string) | null;
declare const name: string;
declare const aOrB: "a" | "b";
declare const maybeName: string | null;
declare const pathKey: PathKey;
declare const users: Collection<number, `user-${number}`, "keyed">;
declare const userKey: `user-${number}`;
declare const byId: Collection<
    number,
    string & { readonly brand: "id" },
    "keyed"
>;
declare const idKey: string & { readonly brand: "id" };
declare const dateOrDates: DateConstructor | DateConstructor[];

/** A class whose constructor takes a typed parameter. */
class Tag {
    constructor(readonly label: string) {}
}

/** An abstract class, which only its subclasses construct. */
abstract class Shape {
    abstract readonly sides: number;
}

/** A concrete shape. */
class Square extends Shape {
    readonly sides = 4;
}

/** A generic subclass, whose methods call the family on a `this` typed by its own parameter. */
class Bag<TItem> extends Collection<TItem> {
    /**
     * Keep the items that pass the test.
     *
     * @param callback - The test
     * @returns The items that pass it
     */
    kept(callback: (value: TItem) => boolean) {
        return this.filter(callback);
    }

    /**
     * Drop the items equal to the given one.
     *
     * @param item - The item to drop
     * @returns The other items
     */
    without(item: TItem) {
        return this.reject(item);
    }

    /**
     * Keep the items whose path holds a value.
     *
     * @param path - The path to read
     * @returns The items holding a value there
     */
    present(path: string) {
        return this.whereNotNull(path);
    }

    /**
     * Keep the first of each value.
     *
     * @returns The unique items
     */
    distinct() {
        return this.unique();
    }

    /**
     * Keep the items from the given one on.
     *
     * @param item - The item to start at
     * @returns The items from it on
     */
    from(item: TItem) {
        return this.skipUntil(item);
    }
}

describe("collection filtering and subsets type tests", () => {
    const list = collect(numberList);
    const record = collect(abc);
    const people = collect(rows);
    const mapped = collect(mapBuilt);
    const tagged = new Tagged([1, 2, 3], "tag");

    describe("filter", () => {
        it("keeps a list a list and its own type, a subclass's included", () => {
            expectTypeOf(list.filter((value) => value > 1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(people.filter((row) => row.id > 1)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(
                tagged.filter((value) => value > 1),
            ).toEqualTypeOf<Tagged>();
        });

        it("types a keyed result as partial, since a key may be dropped", () => {
            expectTypeOf(record.filter((value) => value > 1)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(partial.filter((value) => value > 1)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("keeps each shape a collection of either shape may have", () => {
            expectTypeOf(
                listOrKeyed.filter((value) => value > 1),
            ).toEqualTypeOf<Collection<number, number, "list" | "partial">>();
            expectTypeOf(anyShape.filter(() => true)).toEqualTypeOf<
                Collection<unknown, PropertyKey, "list" | "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.filter((value) => value > 1)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.filter((value) => value > "a")).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("narrows the items to a type guard's type", () => {
            expectTypeOf(
                collect(mixed).filter(
                    (value): value is string => typeof value === "string",
                ),
            ).toEqualTypeOf<Collection<string, number, "list">>();
            expectTypeOf(
                collect({ a: 1, b: "x" }).filter(
                    (value): value is string => typeof value === "string",
                ),
            ).toEqualTypeOf<Collection<string, "a" | "b", "partial">>();
        });

        it("narrows the items to a predicate TypeScript infers", () => {
            expectTypeOf(
                collect([1, null]).filter((value) => value !== null),
            ).toEqualTypeOf<Collection<number, number, "list">>();
        });

        it("drops PHP's falsy types without a callback", () => {
            expectTypeOf(list.filter()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect(mixed).filter(null)).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(
                collect([0, 1, false, "", null, "x"]).filter(),
            ).toEqualTypeOf<
                Collection<number | true | string, number, "list">
            >();
            expectTypeOf(record.filter()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("answers a base collection for a subclass without a callback, since the items' type may narrow", () => {
            expectTypeOf(tagged.filter()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("takes a callback that may be null, as PHP's ?callable does", () => {
            expectTypeOf(list.filter(maybeCallback)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.filter(maybeRecordCallback)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("types the callback's value and key", () => {
            list.filter((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return true;
            });
            record.filter((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return "0";
            });
            people.filter((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return 1;
            });
            generic.filter((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
            mapped.filter((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return true;
            });
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function kept<TItem>(
                items: Collection<TItem>,
                callback: (value: TItem) => boolean,
            ) {
                return items.filter(callback);
            }
            function keptKeyed<TItem, TItemKey extends PropertyKey>(
                items: Collection<TItem, TItemKey, "keyed">,
                callback: (value: TItem) => boolean,
            ) {
                return items.filter(callback);
            }

            expectTypeOf(kept(list, (value) => value > 1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(keptKeyed(record, (value) => value > 1)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(
                new Bag([1, 2]).kept((value) => value > 1),
            ).toEqualTypeOf<Bag<number>>();
        });

        it("agrees with dataFilter's items", () => {
            const listKept = list.filter((value) => value > 1);
            const recordKept = record.filter((value) => value > 1);
            const listTruthy = list.filter();
            const mixedTruthy = collect(mixed).filter();
            const recordTruthy = record.filter();

            expectTypeOf<ItemsOf<typeof listKept>>().toEqualTypeOf(
                Data.dataFilter(numberList, (value) => value > 1),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf(
                Data.dataFilter(abc, (value) => value > 1),
            );
            expectTypeOf<ItemsOf<typeof listTruthy>>().toEqualTypeOf(
                Data.dataFilter(numberList),
            );
            expectTypeOf<ItemsOf<typeof mixedTruthy>>().toEqualTypeOf(
                Data.dataFilter(mixed),
            );
            expectTypeOf<ItemsOf<typeof recordTruthy>>().toEqualTypeOf(
                Data.dataFilter(abc),
            );
        });

        it("narrows a type guard's items where dataFilter keeps the unnarrowed ones", () => {
            // Not pinned to dataFilter, which answers the unnarrowed items for a type guard.
            const strings = collect(mixed).filter(
                (value): value is string => typeof value === "string",
            );

            expectTypeOf<ItemsOf<typeof strings>>().toEqualTypeOf<string[]>();
        });

        it("rejects a callback over another item type, and a value, which PHP's ?callable refuses", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.filter((value: string) => value === "x");
            // @ts-expect-error - filter() takes a callback or null, never a value
            list.filter(1);
        });
    });

    describe("reject", () => {
        it("keeps a list a list and its own type, a subclass's included", () => {
            expectTypeOf(list.reject((value) => value > 1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(people.reject((row) => row.id > 1)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(
                tagged.reject((value) => value > 1),
            ).toEqualTypeOf<Tagged>();
            expectTypeOf(tagged.reject(2)).toEqualTypeOf<Tagged>();
        });

        it("types a keyed result as partial", () => {
            expectTypeOf(record.reject((value) => value > 1)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.reject(2)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(listOrKeyed.reject(1)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
        });

        it("takes any value, which PHP compares loosely, or none", () => {
            expectTypeOf(list.reject()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.reject(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.reject(null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.reject("2")).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.reject(false)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.reject([1, 2])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("takes a variable that may hold a callback, null or a value", () => {
            expectTypeOf(list.reject(maybeCallback)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.reject(callbackOrValue)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.reject(maybeRecordCallback)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.reject((value) => value > 1)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.reject("a")).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("types the callback's value and key", () => {
            list.reject((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return true;
            });
            record.reject((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return 0;
            });
            people.reject((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return null;
            });
            generic.reject((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return true;
            });
            mapped.reject((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return true;
            });
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function without<TItem>(items: Collection<TItem>, item: TItem) {
                return items.reject(item);
            }

            expectTypeOf(without(list, 2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(new Bag([1, 2]).without(1)).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("agrees with dataReject's items", () => {
            const listKept = list.reject((value) => value > 1);
            const recordKept = record.reject((value) => value > 1);

            expectTypeOf<ItemsOf<typeof listKept>>().toEqualTypeOf(
                Data.dataReject(numberList, (value) => value > 1),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf(
                Data.dataReject(abc, (value) => value > 1),
            );
        });

        it("rejects a callback over another item type", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.reject((value: string) => value === "x");
        });
    });

    describe("where", () => {
        it("keeps a list a list and its own type, for a path, an operator or a callback", () => {
            expectTypeOf(people.where("id", 1)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.where("id", ">", 1)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.where("name")).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.where((row) => row.id > 1)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(list.where(null, ">", 1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(tagged.where(null, ">", 1)).toEqualTypeOf<Tagged>();
        });

        it("types a keyed result as partial", () => {
            expectTypeOf(keyedPeople.where("id", 1)).toEqualTypeOf<
                Collection<Row, "ada" | "grace", "partial">
            >();
            expectTypeOf(generic.where(null, ">", 1)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.where(null, "a")).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
            expectTypeOf(listOrKeyed.where(null, 1)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
        });

        it("takes a path variable that may be null", () => {
            expectTypeOf(people.where(maybeName, 1)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
        });

        it("types the callback's value and key", () => {
            people.where((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return true;
            });
            keyedPeople.where((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<"ada" | "grace">();

                return true;
            });
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function matching<TItem>(items: Collection<TItem>, path: string) {
                return items.where(path, 1);
            }

            expectTypeOf(matching(people, "id")).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
        });

        it("rejects a callback over another item type, and an object key", () => {
            // @ts-expect-error - a rows collection's callback takes a row
            people.where((value: string) => value === "x");
            // @ts-expect-error - PHP's data_get() takes a string or int key
            people.where({}, 1);
        });
    });

    describe("whereNull", () => {
        it("keeps a list a list and its own type", () => {
            expectTypeOf(collect(nullableRows).whereNull("name")).toEqualTypeOf<
                Collection<NullableRow, number, "list">
            >();
            expectTypeOf(collect(mixed).whereNull()).toEqualTypeOf<
                Collection<string | number | null, number, "list">
            >();
            expectTypeOf(tagged.whereNull()).toEqualTypeOf<Tagged>();
        });

        it("types a keyed result as partial", () => {
            expectTypeOf(nullableRecord.whereNull()).toEqualTypeOf<
                Collection<number | null, "a" | "b", "partial">
            >();
            expectTypeOf(generic.whereNull()).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.whereNull()).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("takes a path variable that may be null", () => {
            expectTypeOf(
                collect(nullableRows).whereNull(maybeName),
            ).toEqualTypeOf<Collection<NullableRow, number, "list">>();
        });

        it("rejects a callback and an object key, which PHP's string key refuses", () => {
            // @ts-expect-error - whereNull() takes a key, never a callback
            people.whereNull((row: Row) => row.name);
            // @ts-expect-error - PHP's data_get() takes a string or int key
            people.whereNull({});
        });
    });

    describe("whereNotNull", () => {
        it("drops null from the items' type without a key", () => {
            expectTypeOf(collect(mixed).whereNotNull()).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(nullableRecord.whereNotNull()).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("keeps undefined in the items' type, which the comparison with null keeps", () => {
            expectTypeOf(collect([1, undefined]).whereNotNull()).toEqualTypeOf<
                Collection<number | undefined, number, "list">
            >();
        });

        it("keeps a list a list and its own type for a path", () => {
            expectTypeOf(
                collect(nullableRows).whereNotNull("name"),
            ).toEqualTypeOf<Collection<NullableRow, number, "list">>();
            expectTypeOf(tagged.whereNotNull("x")).toEqualTypeOf<Tagged>();
            expectTypeOf(new Bag([1, null]).present("x")).toEqualTypeOf<
                Bag<number | null>
            >();
        });

        it("answers a base collection for a subclass without a key, since the items' type may narrow", () => {
            expectTypeOf(tagged.whereNotNull()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("takes a path variable that may be null", () => {
            expectTypeOf(
                collect(nullableRows).whereNotNull(maybeName),
            ).toEqualTypeOf<Collection<NullableRow, number, "list">>();
            expectTypeOf(keyedPeople.whereNotNull(pathKey)).toEqualTypeOf<
                Collection<Row, "ada" | "grace", "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.whereNotNull()).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.whereNotNull("x")).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("agrees with dataWhereNotNull's items for a list", () => {
            const present = collect(mixed).whereNotNull();

            expectTypeOf<ItemsOf<typeof present>>().toEqualTypeOf(
                Data.dataWhereNotNull(mixed),
            );
        });

        it("types a record's result as partial, where dataWhereNotNull keeps a never-null key", () => {
            // Not pinned to dataWhereNotNull, which keeps a key whose value type holds no null required.
            const present = collect(nullableFields).whereNotNull();

            expectTypeOf<ItemsOf<typeof present>>().toEqualTypeOf<
                Partial<Record<"a" | "b", number>>
            >();
        });

        it("rejects an object key, which PHP's string key refuses", () => {
            // @ts-expect-error - PHP's data_get() takes a string or int key
            people.whereNotNull({});
        });
    });

    describe("whereStrict", () => {
        it("keeps a list a list and its own type", () => {
            expectTypeOf(people.whereStrict("id", 1)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(tagged.whereStrict(null, 1)).toEqualTypeOf<Tagged>();
        });

        it("types a keyed result as partial", () => {
            expectTypeOf(keyedPeople.whereStrict("id", 1)).toEqualTypeOf<
                Collection<Row, "ada" | "grace", "partial">
            >();
            expectTypeOf(generic.whereStrict(null, 1)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.whereStrict(null, "a")).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("requires the value, as PHP's whereStrict($key, $value) does", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for a whereStrict() with no value
            people.whereStrict("id");
        });
    });

    describe("whereIn", () => {
        it("keeps a list a list and its own type, for any operand", () => {
            expectTypeOf(people.whereIn("id", [1, 2])).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(
                people.whereIn("id", collect([1]), true),
            ).toEqualTypeOf<Collection<Row, number, "list">>();
            expectTypeOf(
                people.whereIn("id", new Map([["a", 1]])),
            ).toEqualTypeOf<Collection<Row, number, "list">>();
            expectTypeOf(people.whereIn("id", null)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(tagged.whereIn(null, [1])).toEqualTypeOf<Tagged>();
        });

        it("types a keyed result as partial", () => {
            expectTypeOf(keyedPeople.whereIn("id", [1])).toEqualTypeOf<
                Collection<Row, "ada" | "grace", "partial">
            >();
            expectTypeOf(generic.whereIn(null, [1])).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.whereIn(null, ["a"])).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            people.whereIn("id", 1);
        });
    });

    describe("whereInStrict", () => {
        it("keeps a list a list and a keyed result partial", () => {
            expectTypeOf(people.whereInStrict("id", [1])).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(
                tagged.whereInStrict(null, [1]),
            ).toEqualTypeOf<Tagged>();
            expectTypeOf(keyedPeople.whereInStrict("id", [1])).toEqualTypeOf<
                Collection<Row, "ada" | "grace", "partial">
            >();
            expectTypeOf(mapped.whereInStrict(null, ["a"])).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            people.whereInStrict("id", 1);
        });
    });

    describe("whereNotIn", () => {
        it("keeps a list a list and a keyed result partial", () => {
            expectTypeOf(people.whereNotIn("id", [1], true)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(tagged.whereNotIn(null, [1])).toEqualTypeOf<Tagged>();
            expectTypeOf(keyedPeople.whereNotIn("id", [1])).toEqualTypeOf<
                Collection<Row, "ada" | "grace", "partial">
            >();
            expectTypeOf(generic.whereNotIn(null, collect([1]))).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            people.whereNotIn("id", 1);
        });
    });

    describe("whereNotInStrict", () => {
        it("keeps a list a list and a keyed result partial", () => {
            expectTypeOf(people.whereNotInStrict("id", [1])).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(
                tagged.whereNotInStrict(null, [1]),
            ).toEqualTypeOf<Tagged>();
            expectTypeOf(keyedPeople.whereNotInStrict("id", [1])).toEqualTypeOf<
                Collection<Row, "ada" | "grace", "partial">
            >();
            expectTypeOf(mapped.whereNotInStrict(null, ["a"])).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            people.whereNotInStrict("id", 1);
        });
    });

    describe("whereBetween", () => {
        it("keeps a list a list and a keyed result partial", () => {
            expectTypeOf(people.whereBetween("id", [1, 2])).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(
                people.whereBetween("id", collect([1, 2])),
            ).toEqualTypeOf<Collection<Row, number, "list">>();
            expectTypeOf(
                tagged.whereBetween(null, [1, 2]),
            ).toEqualTypeOf<Tagged>();
            expectTypeOf(keyedPeople.whereBetween("id", [1, 2])).toEqualTypeOf<
                Collection<Row, "ada" | "grace", "partial">
            >();
            expectTypeOf(generic.whereBetween(null, [1, 2])).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            people.whereBetween("id", 1);
        });
    });

    describe("whereNotBetween", () => {
        it("keeps a list a list and a keyed result partial", () => {
            expectTypeOf(people.whereNotBetween("id", [1, 2])).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(
                tagged.whereNotBetween(null, [1, 2]),
            ).toEqualTypeOf<Tagged>();
            expectTypeOf(
                keyedPeople.whereNotBetween("id", [1, 2]),
            ).toEqualTypeOf<Collection<Row, "ada" | "grace", "partial">>();
            expectTypeOf(
                mapped.whereNotBetween(null, ["a", "b"]),
            ).toEqualTypeOf<Collection<string, number, "partial">>();
        });

        it("rejects a scalar, which is neither Arrayable nor iterable", () => {
            // @ts-expect-error - PHP's parameter is Arrayable|iterable
            people.whereNotBetween("id", 1);
        });
    });

    describe("whereInstanceOf", () => {
        it("narrows the items to the class's instances", () => {
            expectTypeOf(
                collect([new Date(), "x"]).whereInstanceOf(Date),
            ).toEqualTypeOf<Collection<Date, number, "list">>();
            expectTypeOf(
                collect({ a: new Date(), b: "x" }).whereInstanceOf(Date),
            ).toEqualTypeOf<Collection<Date, "a" | "b", "partial">>();
        });

        it("takes a class whose constructor has typed parameters, or an abstract class", () => {
            expectTypeOf(
                collect([new Tag("a"), 1]).whereInstanceOf(Tag),
            ).toEqualTypeOf<Collection<Tag, number, "list">>();
            expectTypeOf(
                collect<Shape | string>([new Square(), "x"]).whereInstanceOf(
                    Shape,
                ),
            ).toEqualTypeOf<Collection<Shape, number, "list">>();
        });

        it("types the class's instances when no item type is one", () => {
            expectTypeOf(list.whereInstanceOf(Date)).toEqualTypeOf<
                Collection<Date, number, "list">
            >();
            expectTypeOf(generic.whereInstanceOf(Date)).toEqualTypeOf<
                Collection<Date, string | number, "partial">
            >();
            expectTypeOf(mapped.whereInstanceOf(Date)).toEqualTypeOf<
                Collection<Date, number, "partial">
            >();
        });

        it("takes a list or a record of classes", () => {
            const mixedItems = collect([new Date(), new Tag("a"), "x"]);

            expectTypeOf(mixedItems.whereInstanceOf([Date, Tag])).toEqualTypeOf<
                Collection<Date | Tag, number, "list">
            >();
            expectTypeOf(
                mixedItems.whereInstanceOf({ date: Date, tag: Tag }),
            ).toEqualTypeOf<Collection<Date | Tag, number, "list">>();
        });

        it("takes a variable that may hold a class or a list of them", () => {
            expectTypeOf(
                collect([new Date(), "x"]).whereInstanceOf(dateOrDates),
            ).toEqualTypeOf<Collection<Date, number, "list">>();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function datesOf<TItem>(items: Collection<TItem>) {
                return items.whereInstanceOf(Date);
            }

            expectTypeOf(datesOf(collect([new Date(), 1]))).toEqualTypeOf<
                Collection<Date, number, "list">
            >();
        });

        it("rejects a class name, which is not portable, and a function that is no class", () => {
            // @ts-expect-error - a class-string names no class in JavaScript
            list.whereInstanceOf("Date");
            // @ts-expect-error - an arrow function constructs nothing
            list.whereInstanceOf(() => new Date());
            // @ts-expect-error - every member of a list names a class
            list.whereInstanceOf([Date, "Tag"]);
        });
    });

    describe("unique", () => {
        it("keeps a list a list and its own type", () => {
            expectTypeOf(list.unique()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.unique(null, true)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(people.unique("name")).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.unique((row) => row.name)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(tagged.unique()).toEqualTypeOf<Tagged>();
            expectTypeOf(new Bag([1, 1]).distinct()).toEqualTypeOf<
                Bag<number>
            >();
        });

        it("types a keyed result as partial", () => {
            expectTypeOf(record.unique()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(generic.unique()).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.unique()).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
            expectTypeOf(listOrKeyed.unique()).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
        });

        it("takes a key or a callback variable that may be null", () => {
            expectTypeOf(people.unique(maybeName)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.unique(maybeRowCallback)).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
        });

        it("types the callback's value and key", () => {
            people.unique((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value.name;
            });
            record.unique((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value;
            });
        });

        it("rejects a callback over another item type, and an object key", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.unique((value: string) => value);
            // @ts-expect-error - PHP's data_get() takes a string or int key
            list.unique({});
        });
    });

    describe("uniqueStrict", () => {
        it("keeps a list a list and a keyed result partial", () => {
            expectTypeOf(list.uniqueStrict()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(people.uniqueStrict("id")).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(tagged.uniqueStrict()).toEqualTypeOf<Tagged>();
            expectTypeOf(record.uniqueStrict()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(mapped.uniqueStrict()).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("types the callback's value and key", () => {
            people.uniqueStrict((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value.id;
            });
        });

        it("rejects a callback over another item type", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.uniqueStrict((value: string) => value);
        });
    });

    describe("duplicates", () => {
        it("keeps the duplicates' own keys, so the result may lack some", () => {
            expectTypeOf(list.duplicates()).toEqualTypeOf<
                Collection<number, number, "partial">
            >();
            expectTypeOf(list.duplicates(null, true)).toEqualTypeOf<
                Collection<number, number, "partial">
            >();
            expectTypeOf(record.duplicates()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(tagged.duplicates()).toEqualTypeOf<
                Collection<number, number, "partial">
            >();
        });

        it("types the values a path or a callback reads", () => {
            expectTypeOf(people.duplicates("name")).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
            expectTypeOf(people.duplicates((row) => row.name)).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
            expectTypeOf(
                collect([{ a: { b: 1 } }]).duplicates("a.b"),
            ).toEqualTypeOf<Collection<number, number, "partial">>();
            expectTypeOf(people.duplicates("missing")).toEqualTypeOf<
                Collection<unknown, number, "partial">
            >();
        });

        it("takes a callback variable that may be null, or any path", () => {
            expectTypeOf(people.duplicates(maybeRowCallback)).toEqualTypeOf<
                Collection<Row | string, number, "partial">
            >();
            expectTypeOf(people.duplicates(pathKey)).toEqualTypeOf<
                Collection<unknown, number, "partial">
            >();
            expectTypeOf(people.duplicates(0)).toEqualTypeOf<
                Collection<unknown, number, "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.duplicates()).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(
                mapped.duplicates((value) => value.length),
            ).toEqualTypeOf<Collection<number, number, "partial">>();
        });

        it("types the callback's value and key", () => {
            people.duplicates((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value.name;
            });
            record.duplicates((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return key;
            });
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function repeated<TItem>(
                items: Collection<TItem>,
                callback: (value: TItem) => string,
            ) {
                return items.duplicates(callback);
            }

            expectTypeOf(repeated(people, (row) => row.name)).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("rejects a callback over another item type, and an object key", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.duplicates((value: string) => value);
            // @ts-expect-error - PHP's data_get() takes a string or int key
            list.duplicates({});
        });
    });

    describe("duplicatesStrict", () => {
        it("types the values the items, a path or a callback give, under the duplicates' own keys", () => {
            expectTypeOf(list.duplicatesStrict()).toEqualTypeOf<
                Collection<number, number, "partial">
            >();
            expectTypeOf(people.duplicatesStrict("name")).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
            expectTypeOf(
                people.duplicatesStrict((row) => row.id),
            ).toEqualTypeOf<Collection<number, number, "partial">>();
            expectTypeOf(record.duplicatesStrict()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(mapped.duplicatesStrict()).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("takes a callback variable that may be null, or any path", () => {
            expectTypeOf(
                people.duplicatesStrict(maybeRowCallback),
            ).toEqualTypeOf<Collection<Row | string, number, "partial">>();
            expectTypeOf(people.duplicatesStrict(pathKey)).toEqualTypeOf<
                Collection<unknown, number, "partial">
            >();
        });

        it("types the callback's value and key, as duplicates() passes both", () => {
            people.duplicatesStrict((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return key;
            });
        });

        it("rejects a callback over another item type", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.duplicatesStrict((value: string) => value);
        });
    });

    describe("only", () => {
        it("keeps exactly the literal keys it names", () => {
            expectTypeOf(record.only("a")).toEqualTypeOf<
                Collection<number, "a", "keyed">
            >();
            expectTypeOf(record.only("a", "b")).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
            expectTypeOf(record.only(["a", "c"])).toEqualTypeOf<
                Collection<number, "a" | "c", "keyed">
            >();
            expectTypeOf(partial.only("a")).toEqualTypeOf<
                Collection<number, "a", "partial">
            >();
        });

        it("reads only the array when one comes first, as PHP does", () => {
            expectTypeOf(record.only(["a"], "b")).toEqualTypeOf<
                Collection<number, "a", "keyed">
            >();
        });

        it("keeps no key for an empty array", () => {
            expectTypeOf(record.only([])).toEqualTypeOf<
                Collection<number, never, "keyed">
            >();
        });

        it("keeps every item for a null first argument", () => {
            expectTypeOf(record.only(null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(record.only(null, "a")).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(tagged.only(null)).toEqualTypeOf<Tagged>();
        });

        it("keeps a list a list and its own type", () => {
            expectTypeOf(list.only(0, 2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.only([0, 2])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(tagged.only(0)).toEqualTypeOf<Tagged>();
        });

        it("types a keyed result as partial for keys it cannot name exactly", () => {
            expectTypeOf(record.only(aOrB)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.only(name)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.only(maybeName)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.only(collect(["a"]))).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.only("a", null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps every key a wide, patterned or branded key type may name", () => {
            expectTypeOf(generic.only("a")).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.only(2)).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
            expectTypeOf(users.only(userKey)).toEqualTypeOf<
                Collection<number, `user-${number}`, "partial">
            >();
            expectTypeOf(byId.only(idKey)).toEqualTypeOf<
                Collection<number, string & { readonly brand: "id" }, "partial">
            >();
        });

        it("keeps each shape a collection of either shape may have", () => {
            expectTypeOf(listOrKeyed.only(0)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
        });

        it("compiles for a caller whose keys are a type parameter", () => {
            function pick<TItem, TItemKey extends PropertyKey>(
                items: Collection<TItem, TItemKey, "keyed">,
                key: TItemKey,
            ) {
                return items.only(key);
            }

            expectTypeOf(pick(record, aOrB)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps a chained call compiling for keys typed by a type parameter", () => {
            function keptWhere<TItem, TItemKey extends string>(
                items: Collection<TItem, TItemKey, "keyed">,
                key: TItemKey,
                callback: (value: TItem) => boolean,
            ) {
                return items.only(key).filter(callback);
            }
            function keptOf<
                TItem,
                TItemKey extends string,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                keys: TItemKey[],
                callback: (value: TItem) => boolean,
            ) {
                return items.only(keys).filter(callback);
            }

            expectTypeOf(
                keptWhere(record, "a", (value) => value > 1),
            ).toEqualTypeOf<Collection<number, "a" | "b" | "c", "partial">>();
            expectTypeOf(
                keptOf(record, ["a"], (value) => value > 1),
            ).toEqualTypeOf<Collection<number, "a" | "b" | "c", "partial">>();
        });

        it("agrees with dataOnly's items", () => {
            const listKept = list.only([0, 2]);
            const recordKept = record.only(["a"]);

            expectTypeOf<ItemsOf<typeof listKept>>().toEqualTypeOf(
                Data.dataOnly(numberList, [0, 2]),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf(
                Data.dataOnly(abc, ["a"]),
            );
        });

        it("requires the keys and takes no object key", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for an only() with no keys
            record.only();
            // @ts-expect-error - PHP's array_flip() stores no object as a key
            record.only({});
        });
    });

    describe("except", () => {
        it("drops exactly the literal keys it names", () => {
            expectTypeOf(record.except("a")).toEqualTypeOf<
                Collection<number, "b" | "c", "keyed">
            >();
            expectTypeOf(record.except("a", "c")).toEqualTypeOf<
                Collection<number, "b", "keyed">
            >();
            expectTypeOf(record.except(["a", "c"])).toEqualTypeOf<
                Collection<number, "b", "keyed">
            >();
            expectTypeOf(partial.except("a")).toEqualTypeOf<
                Collection<number, "b", "partial">
            >();
        });

        it("keeps every key for an empty array or a null first argument", () => {
            expectTypeOf(record.except([])).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(record.except(null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(tagged.except(null)).toEqualTypeOf<Tagged>();
        });

        it("keeps a list a list and its own type", () => {
            expectTypeOf(list.except(0)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.except([0, 2])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(tagged.except(0, 1)).toEqualTypeOf<Tagged>();
        });

        it("types a keyed result as partial for keys it cannot name exactly", () => {
            expectTypeOf(record.except(aOrB)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.except("z")).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.except(maybeName)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.except([null])).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.except("a", null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps every key a wide, patterned or branded key type may name", () => {
            expectTypeOf(generic.except("a")).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.except(2)).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
            expectTypeOf(users.except(userKey)).toEqualTypeOf<
                Collection<number, `user-${number}`, "partial">
            >();
            expectTypeOf(byId.except(idKey)).toEqualTypeOf<
                Collection<number, string & { readonly brand: "id" }, "partial">
            >();
        });

        it("keeps each shape a collection of either shape may have", () => {
            expectTypeOf(listOrKeyed.except(0)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
        });

        it("keeps a chained call compiling for keys typed by a type parameter", () => {
            function droppedWhere<TItem, TItemKey extends string>(
                items: Collection<TItem, TItemKey, "keyed">,
                key: TItemKey,
            ) {
                return items.except(key).where("id", 1);
            }
            function droppedOf<
                TItem,
                TItemKey extends string,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                keys: TItemKey[],
                callback: (value: TItem) => boolean,
            ) {
                return items.except(keys).filter(callback);
            }

            expectTypeOf(droppedWhere(keyedPeople, "ada")).toEqualTypeOf<
                Collection<Row, "ada" | "grace", "partial">
            >();
            expectTypeOf(
                droppedOf(record, ["a"], (value) => value > 1),
            ).toEqualTypeOf<Collection<number, "a" | "b" | "c", "partial">>();
        });

        it("agrees with dataExcept's items", () => {
            const listKept = list.except([0, 2]);
            const recordKept = record.except(["a"]);

            expectTypeOf<ItemsOf<typeof listKept>>().toEqualTypeOf(
                Data.dataExcept(numberList, [0, 2]),
            );
            expectTypeOf<ItemsOf<typeof recordKept>>().toEqualTypeOf(
                Data.dataExcept(abc, ["a"]),
            );
        });

        it("requires the keys and takes no object key", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for an except() with no keys
            record.except();
            // @ts-expect-error - PHP's unset() takes no object as an offset
            record.except({});
        });
    });

    describe("select", () => {
        const data = collect([{ first: "Taylor", last: "Otwell" }]);

        it("picks the named fields as arguments or as an array", () => {
            expectTypeOf(data.select("first")).toEqualTypeOf<
                Collection<
                    Pick<{ first: string; last: string }, "first">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(data.select("first", "last")).toEqualTypeOf<
                Collection<
                    Pick<{ first: string; last: string }, "first" | "last">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(data.select(["first", "last"])).toEqualTypeOf<
                Collection<
                    Pick<{ first: string; last: string }, "first" | "last">,
                    number,
                    "list"
                >
            >();
            expectTypeOf(people.select("id")).toEqualTypeOf<
                Collection<Pick<Row, "id">, number, "list">
            >();
        });

        it("keeps a keyed collection's keys and shape", () => {
            expectTypeOf(keyedPeople.select("name")).toEqualTypeOf<
                Collection<Pick<Row, "name">, "ada" | "grace", "keyed">
            >();
        });

        it("keeps every item for a null first argument", () => {
            expectTypeOf(data.select(null)).toEqualTypeOf<
                Collection<{ first: string; last: string }, number, "list">
            >();
            expectTypeOf(people.select(null, "id")).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(tagged.select(null)).toEqualTypeOf<Tagged>();
        });

        it("types a record of unknown fields for a key it cannot name", () => {
            expectTypeOf(people.select("missing")).toEqualTypeOf<
                Collection<Record<string, unknown>, number, "list">
            >();
            expectTypeOf(people.select(maybeName)).toEqualTypeOf<
                Collection<Record<string, unknown>, number, "list">
            >();
            expectTypeOf(data.select(collect(["first", "last"]))).toEqualTypeOf<
                Collection<Record<string, unknown>, number, "list">
            >();
            expectTypeOf(generic.select("a")).toEqualTypeOf<
                Collection<Record<string, unknown>, string | number, "keyed">
            >();
            expectTypeOf(mapped.select(["a"])).toEqualTypeOf<
                Collection<Record<string, unknown>, number, "keyed">
            >();
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function ids<TItem extends { id: number }>(
                items: Collection<TItem>,
            ) {
                return items.select("id");
            }

            expectTypeOf(ids(people)).toEqualTypeOf<
                Collection<Pick<Row, "id">, number, "list">
            >();
        });

        it("agrees with dataSelect's items", () => {
            const picked = people.select("id");

            expectTypeOf<ItemsOf<typeof picked>>().toEqualTypeOf(
                Data.dataSelect(rows, ["id"]),
            );
        });

        it("rejects a collection whose values are not key names", () => {
            // select() looks the keys up inside each item, so a collection of
            // keys is always a numerically indexed collection of key names.
            // @ts-expect-error - a collection of objects is not a list of keys
            data.select(collect([{ first: "Taylor" }]));
        });
    });

    describe("partition", () => {
        it("types both halves of a list as lists, destructured or indexed", () => {
            const [pass, fail] = list.partition((value) => value > 1);

            expectTypeOf(pass).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(fail).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.partition((value) => value > 1)[0]).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.partition((value) => value > 1)[1]).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("answers a list of exactly the two halves", () => {
            expectTypeOf(
                list.partition((value) => value > 1).all(),
            ).toEqualTypeOf<
                [
                    Collection<number, number, "list">,
                    Collection<number, number, "list">,
                ]
            >();
            expectTypeOf(list.partition((value) => value > 1)).toExtend<
                Collection<Collection<number, number, "list">, number, "list">
            >();
        });

        it("types a keyed collection's halves as partial", () => {
            const [pass, fail] = record.partition((value) => value > 1);

            expectTypeOf(pass).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(fail).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(generic.partition(null)[0]).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.partition(null)[1]).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("reads a path, an operator or a callback", () => {
            expectTypeOf(people.partition("id", ">", 1)[0]).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.partition("name")[1]).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.partition(maybeName, 1)[0]).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
            expectTypeOf(people.partition(maybeRowCallback)[0]).toEqualTypeOf<
                Collection<Row, number, "list">
            >();
        });

        it("types a subclass's halves as base collections", () => {
            expectTypeOf(
                tagged.partition((value) => value > 1)[0],
            ).toEqualTypeOf<Collection<number, number, "list">>();
        });

        it("types the callback's value and key", () => {
            list.partition((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return true;
            });
            record.partition((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return key === "a";
            });
        });

        it("compiles for a caller whose items are a type parameter", () => {
            function split<TItem>(
                items: Collection<TItem>,
                callback: (value: TItem) => boolean,
            ) {
                return items.partition(callback)[0];
            }

            expectTypeOf(split(list, (value) => value > 1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("agrees with dataPartition's halves", () => {
            const [listPass] = list.partition((value) => value > 1);
            const [recordPass] = record.partition((value) => value > 1);

            expectTypeOf<ItemsOf<typeof listPass>>().toEqualTypeOf(
                Data.dataPartition(numberList, (value) => value > 1)[0],
            );
            expectTypeOf<ItemsOf<typeof recordPass>>().toEqualTypeOf(
                Data.dataPartition(abc, (value) => value > 1)[0],
            );
        });

        it("requires the key, and rejects a callback over another item type", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for a partition() with no key
            list.partition();
            // @ts-expect-error - a number list's callback takes a number
            list.partition((value: string) => value === "x");
        });
    });

    describe("skipUntil / skipWhile / takeUntil / takeWhile", () => {
        it("keep a list a list and its own type, for a value or a callback", () => {
            const numbers = collect([1, 2, 3]);

            expectTypeOf(numbers.skipUntil(2)).toEqualTypeOf<
                Collection<number, number>
            >();
            expectTypeOf(numbers.skipWhile(1)).toEqualTypeOf<
                Collection<number, number>
            >();
            expectTypeOf(numbers.takeUntil(() => true)).toEqualTypeOf<
                Collection<number, number>
            >();
            expectTypeOf(numbers.takeWhile((value) => value < 3)).toEqualTypeOf<
                Collection<number, number>
            >();
            expectTypeOf(tagged.skipUntil(2)).toEqualTypeOf<Tagged>();
            expectTypeOf(tagged.takeWhile(1)).toEqualTypeOf<Tagged>();
            expectTypeOf(new Bag([1, 2]).from(1)).toEqualTypeOf<Bag<number>>();
        });

        it("type a keyed result as partial", () => {
            expectTypeOf(collect({ a: 1 }).takeWhile(1)).toEqualTypeOf<
                Collection<number, "a", "partial">
            >();
            expectTypeOf(record.skipUntil(2)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.skipWhile(1)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.takeUntil((value) => value > 2)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(listOrKeyed.takeUntil(3)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
        });

        it("type a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.skipUntil(2)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.takeUntil("b")).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });

        it("type the callback's value and key", () => {
            collect([1, 2]).skipUntil((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return "0";
            });
            collect({ a: "x" }).takeWhile((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<"a">();

                return [];
            });
            people.skipWhile((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value.id < 2;
            });
            mapped.takeUntil((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return key > 1;
            });
        });

        it("compile for a caller whose items are a type parameter", () => {
            function after<TItem>(items: Collection<TItem>, item: TItem) {
                return items.skipUntil(item).takeWhile(item);
            }

            expectTypeOf(after(list, 2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("agree with the data helpers' items", () => {
            const skippedUntil = list.skipUntil(2);
            const skippedWhile = record.skipWhile((value) => value < 2);
            const takenUntil = list.takeUntil(2);
            const takenWhile = record.takeWhile(1);

            expectTypeOf<ItemsOf<typeof skippedUntil>>().toEqualTypeOf(
                Data.dataSkipUntil(numberList, 2),
            );
            expectTypeOf<ItemsOf<typeof skippedWhile>>().toEqualTypeOf(
                Data.dataSkipWhile(abc, (value) => value < 2),
            );
            expectTypeOf<ItemsOf<typeof takenUntil>>().toEqualTypeOf(
                Data.dataTakeUntil(numberList, 2),
            );
            expectTypeOf<ItemsOf<typeof takenWhile>>().toEqualTypeOf(
                Data.dataTakeWhile(abc, 1),
            );
        });

        it("reject a value of another type, which no item is identical to", () => {
            // @ts-expect-error - a string is === to no number
            collect([1, 2]).skipUntil("1");
            // @ts-expect-error - a string is === to no number
            collect([1, 2]).takeWhile("1");
        });

        it("reject a callback over another item type", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.skipWhile((value: string) => value === "x");
            // @ts-expect-error - a number list's callback takes a number
            list.takeUntil((value: string) => value === "x");
        });
    });
});
