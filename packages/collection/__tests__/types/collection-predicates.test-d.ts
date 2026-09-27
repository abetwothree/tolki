import { collect, Collection, type CollectionShape } from "@tolki/collection";
import * as Data from "@tolki/data";
import type { PathKey } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import type { ItemsOf } from "../helpers";
import {
    abc,
    generic,
    mapBuilt,
    type NullableRow,
    nullableRows,
    numberList,
    type Row,
    rows,
    Tagged,
} from "./fixtures";

declare const maybeCallback: ((value: number, key: number) => boolean) | null;
declare const callbackOrValue: ((value: number) => boolean) | number;
declare const wrongCallbackOrNull: ((value: string) => boolean) | null;
declare const pathKey: PathKey;
declare const text: string;
declare const keyOrIndex: string | number;
declare const flag: boolean;
declare const maybeCount: number | null;
declare const ada: Row;
declare const partial: Collection<number, "a" | "b", "partial">;
declare const unknownItems: Collection<unknown>;
declare const maybeName: string | null;

describe("collection predicate type tests", () => {
    const list = collect(numberList);
    const record = collect(abc);
    const mapped = collect(mapBuilt);
    const people = collect(rows);

    describe("contains", () => {
        it("answers a boolean for a value, a callback, or a key with an operator and a value", () => {
            expectTypeOf(list.contains(2)).toEqualTypeOf<boolean>();
            expectTypeOf(record.contains(1)).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.contains((value) => value > 1),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(people.contains("id", 1)).toEqualTypeOf<boolean>();
            expectTypeOf(
                people.contains("id", ">", 1),
            ).toEqualTypeOf<boolean>();
        });

        it("types the callback's value and key", () => {
            list.contains((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value > 1;
            });
            record.contains((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            people.contains((row, key) => {
                expectTypeOf(row).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return row.id > 1;
            });
        });

        it("types a generic or a Map-built collection's callback", () => {
            generic.contains((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
            mapped.contains((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a variable that may hold a callback or a value, as PHP takes either", () => {
            expectTypeOf(list.contains(maybeCallback)).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.contains(callbackOrValue),
            ).toEqualTypeOf<boolean>();
        });

        it("takes a needle whose type is a type parameter, as generic code hands one over", () => {
            const has = <T>(collection: Collection<T>, needle: T): boolean =>
                collection.contains(needle);
            const hasObject = <T extends object>(
                collection: Collection<T>,
                needle: T,
            ): boolean => collection.contains(needle);
            const hasNumber = <T extends number>(
                collection: Collection<T>,
                needle: T,
            ): boolean => collection.contains(needle);
            const hasKeyed = <T, K extends PropertyKey>(
                collection: Collection<T, K, "keyed">,
                needle: T | null,
            ): boolean => collection.contains(needle);

            expectTypeOf(has(list, 2)).toEqualTypeOf<boolean>();
            expectTypeOf(hasObject(people, ada)).toEqualTypeOf<boolean>();
            expectTypeOf(hasNumber(list, 2)).toEqualTypeOf<boolean>();
            expectTypeOf(hasKeyed(record, null)).toEqualTypeOf<boolean>();
        });

        it("takes an item of a generic subclass's type parameter in every member of the family", () => {
            /** A subclass generic in its items, whose member hands the contains family one of them. */
            class Bag<TItem> extends Collection<TItem> {
                /**
                 * Ask the contains family about an item.
                 *
                 * @param item - The item to look for
                 * @returns What contains(), containsStrict(), doesntContain(), doesntContainStrict() and some() answer
                 */
                ask(item: TItem): boolean[] {
                    return [
                        this.contains(item),
                        this.containsStrict(item),
                        this.doesntContain(item),
                        this.doesntContainStrict(item),
                        this.some(item),
                    ];
                }
            }

            expectTypeOf(new Bag([1, 2]).ask(1)).toEqualTypeOf<boolean[]>();
        });

        it("takes a callback over another type where the items may be functions, a cost of the generic needle row", () => {
            // The row a generic caller's needle needs takes any function when the items may be functions.
            expectTypeOf(
                unknownItems.contains((value: string) => value === "x"),
            ).toEqualTypeOf<boolean>();
        });

        it("rejects a callback over another item type, and a callback given an operator and a value", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.contains((value: string) => value === "x");
            // @ts-expect-error - a number list's callback takes a number
            list.contains(wrongCallbackOrNull);
            // @ts-expect-error - a callback takes no operator or value, which PHP would ignore
            list.contains((value) => value > 1, "=", 1);
        });
    });

    describe("containsStrict", () => {
        it("answers a boolean for a value, a callback, or a path and the value it must equal", () => {
            expectTypeOf(list.containsStrict(2)).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.containsStrict((value) => value > 1),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                people.containsStrict("id", 1),
            ).toEqualTypeOf<boolean>();
        });

        it("types the callback's value and key", () => {
            list.containsStrict((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value > 1;
            });
            record.containsStrict((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("types a generic or a Map-built collection's callback", () => {
            generic.containsStrict((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
            mapped.containsStrict((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a variable that may hold a callback or a value, as PHP takes either", () => {
            expectTypeOf(
                list.containsStrict(maybeCallback),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.containsStrict(callbackOrValue),
            ).toEqualTypeOf<boolean>();
        });

        it("takes a needle whose type is a type parameter, as generic code hands one over", () => {
            const has = <T>(
                collection: Collection<T>,
                needle: T | null,
            ): boolean => collection.containsStrict(needle);

            expectTypeOf(has(list, 2)).toEqualTypeOf<boolean>();
        });

        it("rejects a callback over another item type, and a callback given a value", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.containsStrict((value: string) => value === "x");
            // @ts-expect-error - PHP's data_get() cannot read a callback path, so a callback takes no value
            list.containsStrict((value) => value > 1, 1);
        });
    });

    describe("doesntContain", () => {
        it("answers a boolean for a value, a callback, or a key with an operator and a value", () => {
            expectTypeOf(list.doesntContain(2)).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.doesntContain((value) => value > 1),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                people.doesntContain("id", 1),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                people.doesntContain("id", ">", 1),
            ).toEqualTypeOf<boolean>();
        });

        it("types the callback's value and key", () => {
            record.doesntContain((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            generic.doesntContain((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
            mapped.doesntContain((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a variable that may hold a callback or a value, as PHP takes either", () => {
            expectTypeOf(
                list.doesntContain(maybeCallback),
            ).toEqualTypeOf<boolean>();
        });

        it("takes a needle whose type is a type parameter, as generic code hands one over", () => {
            const has = <T>(
                collection: Collection<T>,
                needle: T | null,
            ): boolean => collection.doesntContain(needle);

            expectTypeOf(has(list, 2)).toEqualTypeOf<boolean>();
        });

        it("rejects a callback over another item type, and a callback given an operator and a value", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.doesntContain((value: string) => value === "x");
            // @ts-expect-error - a callback takes no operator or value, which PHP would ignore
            list.doesntContain((value) => value > 1, "=", 1);
        });
    });

    describe("doesntContainStrict", () => {
        it("answers a boolean for a value, a callback, or a path and the value it must equal", () => {
            expectTypeOf(list.doesntContainStrict(2)).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.doesntContainStrict((value) => value > 1),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(
                people.doesntContainStrict("id", 1),
            ).toEqualTypeOf<boolean>();
        });

        it("takes the three parameters PHP declares", () => {
            expectTypeOf(
                people.doesntContainStrict("id", "=", 1),
            ).toEqualTypeOf<boolean>();
        });

        it("types the callback's value and key", () => {
            record.doesntContainStrict((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            generic.doesntContainStrict((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
            mapped.doesntContainStrict((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a variable that may hold a callback or a value, as PHP takes either", () => {
            expectTypeOf(
                list.doesntContainStrict(maybeCallback),
            ).toEqualTypeOf<boolean>();
        });

        it("takes a needle whose type is a type parameter, as generic code hands one over", () => {
            const has = <T>(
                collection: Collection<T>,
                needle: T | null,
            ): boolean => collection.doesntContainStrict(needle);

            expectTypeOf(has(list, 2)).toEqualTypeOf<boolean>();
        });

        it("rejects a callback over another item type, and a callback given a value", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.doesntContainStrict((value: string) => value === "x");
            // @ts-expect-error - PHP's data_get() cannot read a callback path, so a callback takes no value
            list.doesntContainStrict((value) => value > 1, 1);
        });
    });

    describe("some", () => {
        it("answers a boolean for a value, a callback, or a key with an operator and a value", () => {
            expectTypeOf(list.some(2)).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.some((value) => value > 1),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(people.some("id", 1)).toEqualTypeOf<boolean>();
            expectTypeOf(people.some("id", ">", 1)).toEqualTypeOf<boolean>();
        });

        it("types the callback's value and key", () => {
            record.some((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            generic.some((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
            mapped.some((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a variable that may hold a callback or a value, as PHP takes either", () => {
            expectTypeOf(list.some(maybeCallback)).toEqualTypeOf<boolean>();
        });

        it("takes a needle whose type is a type parameter, as generic code hands one over", () => {
            const has = <T>(
                collection: Collection<T>,
                needle: T | null,
            ): boolean => collection.some(needle);

            expectTypeOf(has(list, 2)).toEqualTypeOf<boolean>();
        });

        it("rejects a callback over another item type or given an operator and a value, and a call with no key", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.some((value: string) => value === "x");
            // @ts-expect-error - a callback takes no operator or value, which PHP would ignore
            list.some((value) => value > 1, "=", 1);
            // @ts-expect-error - PHP throws ArgumentCountError for some() with no key
            list.some();
        });
    });

    describe("every", () => {
        it("answers a boolean for a callback, a key, a key and a value, or a key, an operator and a value", () => {
            expectTypeOf(
                list.every((value) => value > 0),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(people.every("name")).toEqualTypeOf<boolean>();
            expectTypeOf(list.every(null)).toEqualTypeOf<boolean>();
            expectTypeOf(people.every("id", 1)).toEqualTypeOf<boolean>();
            expectTypeOf(people.every("id", ">", 0)).toEqualTypeOf<boolean>();
        });

        it("takes any operator, since PHP compares loosely for one it does not know", () => {
            expectTypeOf(people.every("id", null, 1)).toEqualTypeOf<boolean>();
        });

        it("types the callback's value and key", () => {
            list.every((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value > 0;
            });
            record.every((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 0;
            });
            people.every((row, key) => {
                expectTypeOf(row).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return row.id > 0;
            });
        });

        it("types a generic or a Map-built collection's callback", () => {
            generic.every((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 0;
            });
            mapped.every((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value !== "";
            });
        });

        it("takes a variable that may hold a callback or a key, as PHP takes either", () => {
            expectTypeOf(list.every(maybeCallback)).toEqualTypeOf<boolean>();
            expectTypeOf(people.every(pathKey)).toEqualTypeOf<boolean>();
        });

        it("takes an item, which PHP's PHPDoc names and reads as a path", () => {
            expectTypeOf(people.every(ada)).toEqualTypeOf<boolean>();
        });

        it("takes a callback over another type where the items may be functions, a cost of the generic item row", () => {
            // The row a generic caller's item needs takes any function when the items may be functions.
            expectTypeOf(
                unknownItems.every((value: string) => value === "x"),
            ).toEqualTypeOf<boolean>();
        });

        it("rejects a callback over another item type or given a value, and a call with no key", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.every((value: string) => value === "x");
            // @ts-expect-error - a callback takes no operator or value, which PHP would ignore
            list.every((value) => value > 0, 1);
            // @ts-expect-error - PHP throws ArgumentCountError for every() with no key
            list.every();
        });
    });

    describe("first", () => {
        it("adds null to the item only when no default is given", () => {
            expectTypeOf(list.first((value) => value > 1)).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(list.first(null, 0)).toEqualTypeOf<number>();
        });

        it("adds the default's type, or the type its callback answers", () => {
            // Named as a type argument, since expectTypeOf() widens a literal it infers from its argument.
            const withText = list.first(null, "x");
            const withCallback = list.first(null, () => "x");

            expectTypeOf<typeof withText>().toEqualTypeOf<number | "x">();
            expectTypeOf<typeof withCallback>().toEqualTypeOf<
                number | string
            >();
            expectTypeOf(list.first(null, null)).toEqualTypeOf<number | null>();
        });

        it("answers the item or the default, as dataFirst does", () => {
            const dataFirstOver = Data.dataFirst(
                numberList,
                (value) => value > 1,
            );
            const dataFirstOrText = Data.dataFirst(abc, null, text);

            expectTypeOf(list.first()).toEqualTypeOf(
                Data.dataFirst(numberList),
            );
            expectTypeOf(record.first()).toEqualTypeOf(Data.dataFirst(abc));
            expectTypeOf(list.first((value) => value > 1)).toEqualTypeOf<
                typeof dataFirstOver
            >();
            expectTypeOf(record.first(null, text)).toEqualTypeOf<
                typeof dataFirstOrText
            >();
            // Kept beside the pins, which answer number | null for both backings and so cannot tell them apart.
            expectTypeOf(list.first()).toEqualTypeOf<number | null>();
            expectTypeOf(record.first()).toEqualTypeOf<number | null>();
        });

        it("drops null beside a list's default, where dataFirst keeps it", () => {
            // Not pinned to dataFirst, whose list row keeps null beside a default, which Arr::first() never answers.
            expectTypeOf(list.first(null, text)).toEqualTypeOf<
                number | string
            >();
        });

        it("types the callback's value and key", () => {
            list.first((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value > 1;
            });
            record.first((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            people.first((row, key) => {
                expectTypeOf(row).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return row.id > 1;
            });
        });

        it("types a generic or a Map-built collection's item and callback", () => {
            // Not pinned to dataFirst, which types a Map's value as unknown.
            expectTypeOf(mapped.first()).toEqualTypeOf<string | null>();
            expectTypeOf(generic.first()).toEqualTypeOf<number | null>();
            mapped.first((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
            generic.first((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
        });

        it("takes a callback that may be null, with or without a default", () => {
            expectTypeOf(list.first(maybeCallback)).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(list.first(maybeCallback, text)).toEqualTypeOf<
                number | string
            >();
        });

        it("rejects a callback over another item type, and a key", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.first((value: string) => value === "x");
            // @ts-expect-error - PHP's ?callable parameter refuses a key
            people.first("id");
        });
    });

    describe("last", () => {
        it("adds null to the item only when no default is given", () => {
            expectTypeOf(list.last((value) => value > 1)).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(list.last(null, 0)).toEqualTypeOf<number>();
        });

        it("adds the default's type, or the type its callback answers", () => {
            // Named as a type argument, since expectTypeOf() widens a literal it infers from its argument.
            const withText = list.last(null, "x");
            const withCallback = list.last(null, () => "x");

            expectTypeOf<typeof withText>().toEqualTypeOf<number | "x">();
            expectTypeOf<typeof withCallback>().toEqualTypeOf<
                number | string
            >();
            expectTypeOf(list.last(null, null)).toEqualTypeOf<number | null>();
        });

        it("answers the item or the default, as dataLast does", () => {
            const dataLastOver = Data.dataLast(
                numberList,
                (value) => value > 1,
            );
            const dataLastOrText = Data.dataLast(abc, null, text);

            expectTypeOf(list.last()).toEqualTypeOf(Data.dataLast(numberList));
            expectTypeOf(record.last()).toEqualTypeOf(Data.dataLast(abc));
            expectTypeOf(list.last((value) => value > 1)).toEqualTypeOf<
                typeof dataLastOver
            >();
            expectTypeOf(record.last(null, text)).toEqualTypeOf<
                typeof dataLastOrText
            >();
            // Kept beside the pins, which answer number | null for both backings and so cannot tell them apart.
            expectTypeOf(list.last()).toEqualTypeOf<number | null>();
            expectTypeOf(record.last()).toEqualTypeOf<number | null>();
        });

        it("drops null beside a list's default, where dataLast keeps it", () => {
            // Not pinned to dataLast, whose list row keeps null beside a default, which Arr::last() never answers.
            expectTypeOf(list.last(null, text)).toEqualTypeOf<
                number | string
            >();
        });

        it("types the callback's value and key", () => {
            list.last((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value > 1;
            });
            record.last((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            people.last((row, key) => {
                expectTypeOf(row).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return row.id > 1;
            });
        });

        it("types a generic or a Map-built collection's item and callback", () => {
            // Not pinned to dataLast, which types a Map's value as unknown.
            expectTypeOf(mapped.last()).toEqualTypeOf<string | null>();
            expectTypeOf(generic.last()).toEqualTypeOf<number | null>();
            mapped.last((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
            generic.last((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
        });

        it("takes a callback that may be null, with or without a default", () => {
            expectTypeOf(list.last(maybeCallback)).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(list.last(maybeCallback, text)).toEqualTypeOf<
                number | string
            >();
        });

        it("rejects a callback over another item type, and a key", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.last((value: string) => value === "x");
            // @ts-expect-error - PHP's ?callable parameter refuses a key
            people.last("id");
        });
    });

    describe("firstWhere", () => {
        it("answers the first matching item or null", () => {
            expectTypeOf(
                people.firstWhere("id", 1),
            ).toEqualTypeOf<Row | null>();
            expectTypeOf(
                people.firstWhere("id", ">", 1),
            ).toEqualTypeOf<Row | null>();
            expectTypeOf(people.firstWhere("name")).toEqualTypeOf<Row | null>();
            expectTypeOf(list.firstWhere((value) => value > 1)).toEqualTypeOf<
                number | null
            >();
            expectTypeOf(
                collect(nullableRows).firstWhere("name", null),
            ).toEqualTypeOf<NullableRow | null>();
        });

        it("types the callback's value as the item, so reading a field it lacks is a compile error", () => {
            collect(rows).firstWhere((row) => {
                expectTypeOf(row).toEqualTypeOf<Row>();

                // @ts-expect-error - a Row has no nonexistent field
                return row.nonexistent === "key";
            });
        });

        it("types the callback's key", () => {
            record.firstWhere((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("types a generic or a Map-built collection's item and callback", () => {
            expectTypeOf(mapped.firstWhere(null, "a")).toEqualTypeOf<
                string | null
            >();
            mapped.firstWhere((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
            expectTypeOf(
                generic.firstWhere((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value > 1;
                }),
            ).toEqualTypeOf<number | null>();
        });

        it("takes a key or a callback that may be null", () => {
            expectTypeOf(
                people.firstWhere(pathKey, 1),
            ).toEqualTypeOf<Row | null>();
            expectTypeOf(list.firstWhere(maybeCallback)).toEqualTypeOf<
                number | null
            >();
        });

        it("rejects a call with no key, and a callback over another item type", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for firstWhere() with no key
            people.firstWhere();
            // @ts-expect-error - a number list's callback takes a number
            list.firstWhere((value: string) => value === "x");
        });
    });

    describe("firstOrFail", () => {
        it("answers the item type for firstOrFail, never a nullable one", () => {
            // It throws instead of returning a default, so neither the Symbol sentinel it
            // seeds first() with nor first()'s own `| null` belongs in the declared return.
            expectTypeOf(
                collect([1, 2, 3]).firstOrFail(),
            ).toEqualTypeOf<number>();
            expectTypeOf(
                collect({ a: "x" }).firstOrFail(),
            ).toEqualTypeOf<string>();
        });

        it("takes a callback, a key and the value it must equal, or a key, an operator and a value", () => {
            expectTypeOf(
                people.firstOrFail((row) => row.id === 1),
            ).toEqualTypeOf<Row>();
            expectTypeOf(people.firstOrFail("id", 1)).toEqualTypeOf<Row>();
            expectTypeOf(people.firstOrFail("id", ">", 1)).toEqualTypeOf<Row>();
            expectTypeOf(people.firstOrFail(null)).toEqualTypeOf<Row>();
        });

        it("types the callback's value and key", () => {
            list.firstOrFail((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value > 1;
            });
            record.firstOrFail((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("types a generic or a Map-built collection's item and callback", () => {
            expectTypeOf(mapped.firstOrFail()).toEqualTypeOf<string>();
            expectTypeOf(
                generic.firstOrFail((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value > 1;
                }),
            ).toEqualTypeOf<number>();
            mapped.firstOrFail((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a callback that may be null, or a key that may be null beside a value", () => {
            expectTypeOf(
                list.firstOrFail(maybeCallback),
            ).toEqualTypeOf<number>();
            expectTypeOf(people.firstOrFail(pathKey, 1)).toEqualTypeOf<Row>();
        });

        it("rejects a lone key, and a callback over another item type or given a value", () => {
            // @ts-expect-error - PHP's first() takes a callable or null, so a lone key throws TypeError
            people.firstOrFail("name");
            // @ts-expect-error - a number list's callback takes a number
            list.firstOrFail((value: string) => value === "x");
            // @ts-expect-error - a callback takes no operator or value, which PHP would ignore
            list.firstOrFail((value) => value > 1, 1);
        });
    });

    describe("sole", () => {
        it("answers the sole item for a callback, a key and a value, or a key, an operator and a value", () => {
            expectTypeOf(list.sole()).toEqualTypeOf<number>();
            expectTypeOf(people.sole("id", 1)).toEqualTypeOf<Row>();
            expectTypeOf(people.sole("id", "=", 1)).toEqualTypeOf<Row>();
            expectTypeOf(
                people.sole((row) => row.id === 1),
            ).toEqualTypeOf<Row>();
        });

        it("answers the item dataSole does", () => {
            const dataSoleRow = Data.dataSole(rows, (row) => row.id === 1);

            expectTypeOf(list.sole()).toEqualTypeOf(Data.dataSole(numberList));
            expectTypeOf(record.sole()).toEqualTypeOf(Data.dataSole(abc));
            expectTypeOf(people.sole((row) => row.id === 1)).toEqualTypeOf<
                typeof dataSoleRow
            >();
            // Kept beside the pins, which answer number for both backings and so cannot tell them apart.
            expectTypeOf(record.sole()).toEqualTypeOf<number>();
        });

        it("types the callback's value and key", () => {
            list.sole((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value > 1;
            });
            record.sole((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("types a generic or a Map-built collection's item and callback", () => {
            // Not pinned to dataSole, which types a Map's value as unknown.
            expectTypeOf(mapped.sole()).toEqualTypeOf<string>();
            expectTypeOf(
                generic.sole((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return value > 1;
                }),
            ).toEqualTypeOf<number>();
            mapped.sole((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a callback that may be null, or a key that may be null beside a value", () => {
            expectTypeOf(list.sole(maybeCallback)).toEqualTypeOf<number>();
            expectTypeOf(people.sole(pathKey, 1)).toEqualTypeOf<Row>();
        });

        it("rejects a lone key, and a callback over another item type or given a value", () => {
            // @ts-expect-error - PHP's filter() takes a callable or null, so a lone key throws TypeError
            people.sole("name");
            // @ts-expect-error - a number list's callback takes a number
            list.sole((value: string) => value === "x");
            // @ts-expect-error - a callback takes no operator or value, which PHP would ignore
            list.sole((value) => value > 1, 1);
        });
    });

    describe("hasSole", () => {
        it("answers a boolean for a callback, a key and a value, or a key, an operator and a value", () => {
            expectTypeOf(list.hasSole()).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.hasSole((value) => value > 1),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(people.hasSole("id", 1)).toEqualTypeOf<boolean>();
            expectTypeOf(people.hasSole("id", ">", 1)).toEqualTypeOf<boolean>();
        });

        it("types the callback's value and key", () => {
            record.hasSole((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            generic.hasSole((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
            mapped.hasSole((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a callback that may be null, or a key that may be null beside a value", () => {
            expectTypeOf(list.hasSole(maybeCallback)).toEqualTypeOf<boolean>();
            expectTypeOf(people.hasSole(pathKey, 1)).toEqualTypeOf<boolean>();
        });

        it("rejects a lone key, and a callback over another item type or given a value", () => {
            // @ts-expect-error - PHP's filter() takes a callable or null, so a lone key throws TypeError
            people.hasSole("name");
            // @ts-expect-error - a number list's callback takes a number
            list.hasSole((value: string) => value === "x");
            // @ts-expect-error - a callback takes no operator or value, which PHP would ignore
            list.hasSole((value) => value > 1, 1);
        });
    });

    describe("hasMany", () => {
        it("answers a boolean for a callback, a key and a value, or a key, an operator and a value", () => {
            expectTypeOf(list.hasMany()).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.hasMany((value) => value > 1),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(people.hasMany("id", 1)).toEqualTypeOf<boolean>();
            expectTypeOf(people.hasMany("id", ">", 1)).toEqualTypeOf<boolean>();
        });

        it("types the callback's value and key", () => {
            record.hasMany((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            generic.hasMany((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
            mapped.hasMany((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a callback that may be null, or a key that may be null beside a value", () => {
            expectTypeOf(list.hasMany(maybeCallback)).toEqualTypeOf<boolean>();
            expectTypeOf(people.hasMany(pathKey, 1)).toEqualTypeOf<boolean>();
        });

        it("rejects a lone key, and a callback over another item type or given a value", () => {
            // @ts-expect-error - PHP's filter() takes a callable or null, so a lone key throws TypeError
            people.hasMany("name");
            // @ts-expect-error - a number list's callback takes a number
            list.hasMany((value: string) => value === "x");
            // @ts-expect-error - a callback takes no operator or value, which PHP would ignore
            list.hasMany((value) => value > 1, 1);
        });
    });

    describe("value", () => {
        it("types the value at a path, or null when no item holds it", () => {
            expectTypeOf(people.value("name")).toEqualTypeOf<string | null>();
            expectTypeOf(people.value("id")).toEqualTypeOf<number | null>();
            expectTypeOf(collect(nullableRows).value("name")).toEqualTypeOf<
                string | null
            >();
            expectTypeOf(
                collect([{ user: { name: "Ada" } }]).value("user.name"),
            ).toEqualTypeOf<string | null>();
        });

        it("adds the default's type, or the type its callback answers", () => {
            // Named as a type argument, since expectTypeOf() widens a literal it infers from its argument.
            const withZero = people.value("name", 0);

            expectTypeOf<typeof withZero>().toEqualTypeOf<string | 0>();
            expectTypeOf(people.value("name", () => true)).toEqualTypeOf<
                string | boolean
            >();
            expectTypeOf(people.value("name", null)).toEqualTypeOf<
                string | null
            >();
        });

        it("types a path it cannot resolve, a numeric key or a key of either type as unknown", () => {
            expectTypeOf(people.value("missing")).toEqualTypeOf<unknown>();
            expectTypeOf(people.value(text)).toEqualTypeOf<unknown>();
            expectTypeOf(collect([[1, 2]]).value(0)).toEqualTypeOf<unknown>();
            expectTypeOf(people.value(keyOrIndex)).toEqualTypeOf<unknown>();
        });

        it("types a generic, a Map-built or a collection-row collection's value as unknown", () => {
            expectTypeOf(generic.value("a")).toEqualTypeOf<unknown>();
            expectTypeOf(mapped.value("a", "none")).toEqualTypeOf<unknown>();
            expectTypeOf(
                collect([collect({ v: 1 })]).value("v"),
            ).toEqualTypeOf<unknown>();
        });

        it("types the answer to a null key as null, whatever the default", () => {
            expectTypeOf(people.value(null)).toEqualTypeOf<null>();
            expectTypeOf(people.value(null, "d")).toEqualTypeOf<null>();
            expectTypeOf(
                people.value(undefined, () => 1),
            ).toEqualTypeOf<null>();
        });

        it("types a key that may be null as unknown", () => {
            expectTypeOf(people.value(maybeName)).toEqualTypeOf<unknown>();
            expectTypeOf(people.value(pathKey, "d")).toEqualTypeOf<unknown>();
        });

        it("rejects a call with no key, and an object key", () => {
            // @ts-expect-error - PHP's value() requires the key
            people.value();
            // @ts-expect-error - PHP's PHPDoc takes a string key
            people.value({});
        });
    });

    describe("search", () => {
        it("answers the key, the index or false, as dataSearch does", () => {
            const dataListFound = Data.dataSearch(numberList, 2);
            const dataRecordFound = Data.dataSearch(abc, 2);

            expectTypeOf(list.search(2)).toEqualTypeOf<typeof dataListFound>();
            expectTypeOf(record.search(2)).toEqualTypeOf<
                typeof dataRecordFound
            >();
            expectTypeOf(list.search(2)).toEqualTypeOf<number | false>();
            expectTypeOf(record.search(2)).toEqualTypeOf<
                "a" | "b" | "c" | number | false
            >();
        });

        it("answers the same for a callback or a strict search", () => {
            expectTypeOf(list.search((value) => value > 1)).toEqualTypeOf<
                number | false
            >();
            expectTypeOf(list.search(2, true)).toEqualTypeOf<number | false>();
            expectTypeOf(people.search(ada, true)).toEqualTypeOf<
                number | false
            >();
        });

        it("types the callback's value and key", () => {
            record.search((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("types a generic or a Map-built collection's key and callback", () => {
            // Not pinned to dataSearch, whose Map rows are typed apart from the collection's.
            expectTypeOf(mapped.search("a")).toEqualTypeOf<number | false>();
            expectTypeOf(generic.search(1)).toEqualTypeOf<
                string | number | false
            >();
            mapped.search((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a variable that may hold a callback or a value", () => {
            expectTypeOf(list.search(callbackOrValue)).toEqualTypeOf<
                number | false
            >();
        });

        it("rejects a callback over another item type, and a value of another type", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.search((value: string) => value === "x");
            // @ts-expect-error - PHP's PHPDoc types the needle as an item
            list.search("2");
        });
    });

    describe("before", () => {
        it("answers the item before the match, or null, as dataBefore does", () => {
            const dataListBefore = Data.dataBefore(numberList, 2);
            const dataRecordBefore = Data.dataBefore(abc, 2);

            expectTypeOf(list.before(2)).toEqualTypeOf<typeof dataListBefore>();
            expectTypeOf(record.before(2)).toEqualTypeOf<
                typeof dataRecordBefore
            >();
            // Kept beside the pins, which answer number | null for both backings and so cannot tell them apart.
            expectTypeOf(list.before(2)).toEqualTypeOf<number | null>();
            expectTypeOf(record.before(2)).toEqualTypeOf<number | null>();
            expectTypeOf(
                people.before((row) => row.id === 2),
            ).toEqualTypeOf<Row | null>();
        });

        it("types the callback's value and key", () => {
            record.before((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("types a generic or a Map-built collection's item and callback", () => {
            // Not pinned to dataBefore, whose Map rows are typed apart from the collection's.
            expectTypeOf(mapped.before("a")).toEqualTypeOf<string | null>();
            expectTypeOf(generic.before(1)).toEqualTypeOf<number | null>();
            generic.before((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
        });

        it("takes a variable that may hold a callback or a value", () => {
            expectTypeOf(list.before(callbackOrValue)).toEqualTypeOf<
                number | null
            >();
        });

        it("rejects a callback over another item type", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.before((value: string) => value === "x");
        });
    });

    describe("after", () => {
        it("answers the item after the match, or null, as dataAfter does", () => {
            const dataListAfter = Data.dataAfter(numberList, 2);
            const dataRecordAfter = Data.dataAfter(abc, 2);

            expectTypeOf(list.after(2)).toEqualTypeOf<typeof dataListAfter>();
            expectTypeOf(record.after(2)).toEqualTypeOf<
                typeof dataRecordAfter
            >();
            // Kept beside the pins, which answer number | null for both backings and so cannot tell them apart.
            expectTypeOf(list.after(2)).toEqualTypeOf<number | null>();
            expectTypeOf(record.after(2)).toEqualTypeOf<number | null>();
            expectTypeOf(
                people.after((row) => row.id === 1),
            ).toEqualTypeOf<Row | null>();
        });

        it("types the callback's value and key", () => {
            record.after((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
        });

        it("types a generic or a Map-built collection's item and callback", () => {
            // Not pinned to dataAfter, whose Map rows are typed apart from the collection's.
            expectTypeOf(mapped.after("a")).toEqualTypeOf<string | null>();
            expectTypeOf(generic.after(1)).toEqualTypeOf<number | null>();
            mapped.after((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a variable that may hold a callback or a value", () => {
            expectTypeOf(list.after(callbackOrValue)).toEqualTypeOf<
                number | null
            >();
        });

        it("rejects a callback over another item type", () => {
            // @ts-expect-error - a number list's callback takes a number
            list.after((value: string) => value === "x");
        });
    });

    describe("random", () => {
        it("answers one item for no count", () => {
            expectTypeOf(list.random()).toEqualTypeOf<number>();
            expectTypeOf(list.random(null)).toEqualTypeOf<number>();
            expectTypeOf(
                record.random(undefined, true),
            ).toEqualTypeOf<number>();
        });

        it("lists the picked items for a count, whatever the receiver's keys", () => {
            expectTypeOf(list.random(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.random(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.random("2", false)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(
                list.random((collection) => collection.count()),
            ).toEqualTypeOf<Collection<number, number, "list">>();
        });

        it("lists a list's picks, as dataRandom does", () => {
            const picked = list.random(2);
            const dataPicked = Data.dataRandom(numberList, 2);

            expectTypeOf<ItemsOf<typeof picked>>().toEqualTypeOf<
                typeof dataPicked
            >();
        });

        it("lists a record's picks, which dataRandom types as a record", () => {
            // Not pinned to dataRandom, which types a record's picks as a record keyed by number.
            const picked = record.random(2);

            expectTypeOf<ItemsOf<typeof picked>>().toEqualTypeOf<number[]>();
        });

        it("keeps the picked keys when asked to, as a list or a record that may lack some", () => {
            // Picked keys that run 0..n-1 in order, or none, make a list; any other pick lacks a key.
            expectTypeOf(list.random(2, true)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
            expectTypeOf(record.random(2, true)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "list" | "partial">
            >();
            expectTypeOf(partial.random(1, true)).toEqualTypeOf<
                Collection<number, "a" | "b", "list" | "partial">
            >();
            expectTypeOf(partial.random(1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("answers either for a flag or a count known only at run time", () => {
            expectTypeOf(list.random(2, flag)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
            expectTypeOf(record.random(maybeCount)).toEqualTypeOf<
                | number
                | Collection<
                      number,
                      "a" | "b" | "c" | number,
                      "list" | "partial"
                  >
            >();
        });

        it("hands a count callback the receiver", () => {
            record.random((collection) => {
                expectTypeOf(collection).toEqualTypeOf<
                    Collection<number, "a" | "b" | "c", "keyed">
                >();

                return 1;
            });
        });

        it("types a generic, a Map-built or a subclass collection's picks", () => {
            // Not pinned to dataRandom, which types a Map's items as unknown.
            expectTypeOf(mapped.random(2)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(mapped.random(2, true)).toEqualTypeOf<
                Collection<string, number, "list" | "partial">
            >();
            expectTypeOf(generic.random(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(generic.random(2, true)).toEqualTypeOf<
                Collection<number, string | number, "list" | "partial">
            >();
            expectTypeOf(new Tagged([1, 2]).random(1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("rejects a count or a flag of another type", () => {
            // @ts-expect-error - PHP's PHPDoc takes an int count or a callable
            list.random({});
            // @ts-expect-error - PHP's PHPDoc takes a bool preserveKeys
            list.random(2, "yes");
        });
    });

    describe("containsOneItem", () => {
        it("answers a boolean with or without a callback", () => {
            expectTypeOf(list.containsOneItem()).toEqualTypeOf<boolean>();
            expectTypeOf(list.containsOneItem(null)).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.containsOneItem((value) => value > 1),
            ).toEqualTypeOf<boolean>();
        });

        it("types the callback's value and key", () => {
            record.containsOneItem((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            generic.containsOneItem((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
            mapped.containsOneItem((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a callback that may be null", () => {
            expectTypeOf(
                list.containsOneItem(maybeCallback),
            ).toEqualTypeOf<boolean>();
        });

        it("rejects a key and a callback over another item type", () => {
            // @ts-expect-error - PHP's ?callable parameter refuses a key
            people.containsOneItem("id");
            // @ts-expect-error - a number list's callback takes a number
            list.containsOneItem((value: string) => value === "x");
        });
    });

    describe("containsManyItems", () => {
        it("answers a boolean with or without a callback", () => {
            expectTypeOf(list.containsManyItems()).toEqualTypeOf<boolean>();
            expectTypeOf(list.containsManyItems(null)).toEqualTypeOf<boolean>();
            expectTypeOf(
                list.containsManyItems((value) => value > 1),
            ).toEqualTypeOf<boolean>();
        });

        it("types the callback's value and key", () => {
            record.containsManyItems((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value > 1;
            });
            generic.containsManyItems((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<string | number>();

                return value > 1;
            });
            mapped.containsManyItems((value, key) => {
                expectTypeOf(value).toEqualTypeOf<string>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value === "a";
            });
        });

        it("takes a callback that may be null", () => {
            expectTypeOf(
                list.containsManyItems(maybeCallback),
            ).toEqualTypeOf<boolean>();
        });

        it("rejects a key and a callback over another item type", () => {
            // @ts-expect-error - PHP's ?callable parameter refuses a key
            people.containsManyItems("id");
            // @ts-expect-error - a number list's callback takes a number
            list.containsManyItems((value: string) => value === "x");
        });
    });

    describe("type-parameter callers", () => {
        it("compiles each method for a list whose item type is a type parameter", () => {
            // Each collection answer chains into filter(), which TypeScript calls on no union of collection types.
            function listed<TItem>(
                items: Collection<TItem>,
                item: TItem,
                needle: TItem | string,
            ) {
                return {
                    contains: [items.contains(item), items.contains(needle)],
                    containsStrict: [
                        items.containsStrict(item),
                        items.containsStrict(needle),
                    ],
                    doesntContain: [
                        items.doesntContain(item),
                        items.doesntContain(needle),
                    ],
                    doesntContainStrict: [
                        items.doesntContainStrict(item),
                        items.doesntContainStrict(needle),
                    ],
                    some: [items.some(item), items.some(needle)],
                    every: [items.every(item), items.every(needle)],
                    first: items.first(),
                    last: items.last(),
                    firstWhere: items.firstWhere("id", item),
                    firstOrFail: items.firstOrFail(),
                    sole: items.sole(),
                    hasSole: items.hasSole(),
                    hasMany: items.hasMany(),
                    value: items.value("id", item),
                    search: items.search(item),
                    before: items.before(item),
                    after: items.after(item),
                    random: items.random(2).filter(() => true),
                    containsOneItem: items.containsOneItem(),
                    containsManyItems: items.containsManyItems(),
                };
            }

            const answers = listed(list, 1, "x");

            expectTypeOf(answers.contains).toEqualTypeOf<boolean[]>();
            expectTypeOf(answers.containsStrict).toEqualTypeOf<boolean[]>();
            expectTypeOf(answers.doesntContain).toEqualTypeOf<boolean[]>();
            expectTypeOf(answers.doesntContainStrict).toEqualTypeOf<
                boolean[]
            >();
            expectTypeOf(answers.some).toEqualTypeOf<boolean[]>();
            expectTypeOf(answers.every).toEqualTypeOf<boolean[]>();
            expectTypeOf(answers.first).toEqualTypeOf<number | null>();
            expectTypeOf(answers.last).toEqualTypeOf<number | null>();
            expectTypeOf(answers.firstWhere).toEqualTypeOf<number | null>();
            expectTypeOf(answers.firstOrFail).toEqualTypeOf<number>();
            expectTypeOf(answers.sole).toEqualTypeOf<number>();
            expectTypeOf(answers.hasSole).toEqualTypeOf<boolean>();
            expectTypeOf(answers.hasMany).toEqualTypeOf<boolean>();
            expectTypeOf(answers.value).toEqualTypeOf<unknown>();
            expectTypeOf(answers.search).toEqualTypeOf<number | false>();
            expectTypeOf(answers.before).toEqualTypeOf<number | null>();
            expectTypeOf(answers.after).toEqualTypeOf<number | null>();
            expectTypeOf(answers.random).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.containsOneItem).toEqualTypeOf<boolean>();
            expectTypeOf(answers.containsManyItems).toEqualTypeOf<boolean>();
        });

        it("compiles each method for a collection whose item, key and shape types are type parameters", () => {
            function shaped<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(
                items: Collection<TItem, TItemKey, TItemShape>,
                item: TItem,
                needle: TItem | string,
            ) {
                return {
                    contains: [items.contains(item), items.contains(needle)],
                    containsStrict: [
                        items.containsStrict(item),
                        items.containsStrict(needle),
                    ],
                    doesntContain: [
                        items.doesntContain(item),
                        items.doesntContain(needle),
                    ],
                    doesntContainStrict: [
                        items.doesntContainStrict(item),
                        items.doesntContainStrict(needle),
                    ],
                    some: [items.some(item), items.some(needle)],
                    every: [items.every(item), items.every(needle)],
                    first: items.first(),
                    last: items.last(),
                    firstWhere: items.firstWhere("id", item),
                    firstOrFail: items.firstOrFail(),
                    sole: items.sole(),
                    hasSole: items.hasSole(),
                    hasMany: items.hasMany(),
                    value: items.value("id", item),
                    search: items.search(item),
                    before: items.before(item),
                    after: items.after(item),
                    random: items.random(2).filter(() => true),
                    containsOneItem: items.containsOneItem(),
                    containsManyItems: items.containsManyItems(),
                };
            }

            const answers = shaped(record, 1, "x");

            expectTypeOf(answers.contains).toEqualTypeOf<boolean[]>();
            expectTypeOf(answers.containsStrict).toEqualTypeOf<boolean[]>();
            expectTypeOf(answers.doesntContain).toEqualTypeOf<boolean[]>();
            expectTypeOf(answers.doesntContainStrict).toEqualTypeOf<
                boolean[]
            >();
            expectTypeOf(answers.some).toEqualTypeOf<boolean[]>();
            expectTypeOf(answers.every).toEqualTypeOf<boolean[]>();
            expectTypeOf(answers.first).toEqualTypeOf<number | null>();
            expectTypeOf(answers.last).toEqualTypeOf<number | null>();
            expectTypeOf(answers.firstWhere).toEqualTypeOf<number | null>();
            expectTypeOf(answers.firstOrFail).toEqualTypeOf<number>();
            expectTypeOf(answers.sole).toEqualTypeOf<number>();
            expectTypeOf(answers.hasSole).toEqualTypeOf<boolean>();
            expectTypeOf(answers.hasMany).toEqualTypeOf<boolean>();
            expectTypeOf(answers.value).toEqualTypeOf<unknown>();
            expectTypeOf(answers.search).toEqualTypeOf<
                number | false | "a" | "b" | "c"
            >();
            expectTypeOf(answers.before).toEqualTypeOf<number | null>();
            expectTypeOf(answers.after).toEqualTypeOf<number | null>();
            expectTypeOf(answers.random).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.containsOneItem).toEqualTypeOf<boolean>();
            expectTypeOf(answers.containsManyItems).toEqualTypeOf<boolean>();
        });

        it("compiles each method in a generic subclass, whose member calls it on itself", () => {
            /** A subclass generic in its items, whose member calls the family on itself. */
            class Bag<TItem> extends Collection<TItem> {
                /**
                 * Call each predicate and search method on this bag.
                 *
                 * @param item - One of the bag's items
                 * @param needle - An item, or a string that may be one
                 * @returns Each method's answer, by name
                 */
                called(
                    item: TItem,
                    needle: TItem | string,
                ): Record<string, unknown> {
                    return {
                        contains: [this.contains(item), this.contains(needle)],
                        containsStrict: [
                            this.containsStrict(item),
                            this.containsStrict(needle),
                        ],
                        doesntContain: [
                            this.doesntContain(item),
                            this.doesntContain(needle),
                        ],
                        doesntContainStrict: [
                            this.doesntContainStrict(item),
                            this.doesntContainStrict(needle),
                        ],
                        some: [this.some(item), this.some(needle)],
                        every: [this.every(item), this.every(needle)],
                        first: this.first(),
                        last: this.last(),
                        firstWhere: this.firstWhere("id", item),
                        firstOrFail: this.firstOrFail(),
                        sole: this.sole(),
                        hasSole: this.hasSole(),
                        hasMany: this.hasMany(),
                        value: this.value("id", item),
                        search: this.search(item),
                        before: this.before(item),
                        after: this.after(item),
                        random: this.random(2).filter(() => true),
                        containsOneItem: this.containsOneItem(),
                        containsManyItems: this.containsManyItems(),
                    };
                }
            }

            expectTypeOf(new Bag([1, 2]).called(1, "x")).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });
});
