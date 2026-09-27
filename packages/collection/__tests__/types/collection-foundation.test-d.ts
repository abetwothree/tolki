import type * as Exported from "@tolki/collection";
import { collect, Collection, type CollectionShape } from "@tolki/collection";
import * as Data from "@tolki/data";
import type { Arrayable, MapArrayKey } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import { expectShape, type ItemsOf } from "../helpers";
import {
    abc,
    ArrayableNumbers,
    ArrayableRecord,
    box,
    generic,
    JsonText,
    listCollection,
    listOrRecord,
    mapBuilt,
    maybeNumbers,
    mixed,
    nestedLists,
    nullableRows,
    numberKeyedCollection,
    numberList,
    numbers,
    Point,
    readonlyNumbers,
    recordOfLists,
    rows,
    SerializesList,
    SerializesRecord,
    SerializesScalar,
    settings,
    Tagged,
    unionItems,
    User,
} from "./fixtures";

declare const partial: Collection<number, "a", "partial">;
declare const anyShape: Collection<number, "a", CollectionShape>;
declare const unknowns: Collection<unknown, number, "list">;
declare const unknownRecord: Collection<unknown, "a" | "b", "keyed">;
declare const typeName: string;
declare const oneOrMany: number | number[];
declare const oneOrManyOrNone: string | string[] | null;
declare const listOrCollection: number[] | Collection<number, number, "list">;
declare const numberOrCollection: number | Collection<number, number, "list">;
declare const textOrTexts:
    | string
    | string[]
    | Collection<string, number, "list">;
declare const recordOrNull: Record<string, number> | null;
declare const textOrRecord: string | Record<string, string>;
declare const pairOrNone: { a: number; b: number } | undefined;
declare const keyedOrNull: Collection<number, "a", "keyed"> | null;
declare const mapOrNull: Map<string, number> | null;
declare const maybeTagged: Tagged | null;
declare const taggedOrList: Tagged | number[];
declare const anything: unknown;
declare const maybeCallback: ((count: number) => string) | null;
declare const keyedOrRecord:
    | Collection<number, "a", "keyed">
    | Record<string, number>;
declare const setOrMap: Set<number> | Map<string, number>;
declare const jsonOrNull: JsonText | null;
declare const serializedOrNull: SerializesRecord | null;

/** An iterable that is also a JsonSerializable, which the constructor reads by iterating. */
class IterableRecord {
    /**
     * Iterate the values.
     *
     * @returns A generator yielding 1
     */
    *[Symbol.iterator](): Generator<number> {
        yield 1;
    }

    /**
     * Specify the data which should be serialized to JSON.
     *
     * @returns The record
     */
    jsonSerialize(): { from: string } {
        return { from: "jsonSerialize" };
    }
}

describe("collection foundation type tests", () => {
    describe("collect", () => {
        it("types a list as a list of its values", () => {
            expectTypeOf(collect([1, 2, 3])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types a list of differently shaped items as their union, not a tuple", () => {
            // TypeScript gives each object literal in an array the other literals' keys, as optional undefined.
            expectTypeOf(collect([{ foo: 1 }, { try: 5 }])).toEqualTypeOf<
                Collection<
                    | { foo: number; try?: undefined }
                    | { try: number; foo?: undefined },
                    number,
                    "list"
                >
            >();
        });

        it("takes a read-only list", () => {
            expectTypeOf(collect(readonlyNumbers)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("keys a record by its literal keys", () => {
            expectTypeOf(collect({ a: 1, b: 2 })).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
        });

        it("keys a record by its literal integer keys, keyed though they are numbers", () => {
            expectTypeOf(collect({ 1: "a", 2: "b" })).toEqualTypeOf<
                Collection<string, 1 | 2, "keyed">
            >();
        });

        it("takes an interface-typed record, which has no index signature", () => {
            expectTypeOf(collect(settings)).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
        });

        it("keys a Map by the keys PHP stores", () => {
            expectTypeOf(collect(new Map([["a", 1]]))).toEqualTypeOf<
                Collection<number, MapArrayKey<string>, "keyed">
            >();
        });

        it("keys a Map with integer keys, keyed though they are numbers", () => {
            expectTypeOf(collect(mapBuilt)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("takes a Map's value type first, as the class does", () => {
            expectTypeOf(
                collect<string, number>(new Map<number, string>([[1, "a"]])),
            ).toEqualTypeOf<Collection<string, number, "keyed">>();
        });

        it("lists a Set's values", () => {
            expectTypeOf(collect(new Set([1, 2]))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("lists a generator's values", () => {
            expectTypeOf(collect(numbers())).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("keeps another collection's types", () => {
            expectTypeOf(collect(listCollection)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("keeps a keyed collection's shape, though its keys are numbers", () => {
            expectTypeOf(collect(numberKeyedCollection)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("keeps a subclass's types, as the collection it extends holds them", () => {
            expectTypeOf(collect(new Tagged([1]))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("takes a collection's all(), in the collection's own shape", () => {
            expectTypeOf(collect(listCollection.all())).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect(collect(abc).all())).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
        });

        it("takes a value that may be a list or a record", () => {
            expectTypeOf(collect(listOrRecord)).toEqualTypeOf<
                Collection<number, number | "a" | "b", "list" | "keyed">
            >();
        });

        it("wraps a scalar in a list, as PHP's Arr::wrap does", () => {
            expectTypeOf(collect("abc")).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(collect(1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect(true)).toEqualTypeOf<
                Collection<boolean, number, "list">
            >();
            expectTypeOf(collect(Symbol("s"))).toEqualTypeOf<
                Collection<symbol, number, "list">
            >();
        });

        it("builds an empty list from null or nothing", () => {
            expectTypeOf(collect(null)).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(collect(undefined)).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(collect()).toEqualTypeOf<
                Collection<never, number, "list">
            >();
        });

        it("takes a list that may be missing", () => {
            expectTypeOf(collect(maybeNumbers)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("reads an Arrayable's list", () => {
            expectTypeOf(collect(new ArrayableNumbers())).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("reads an Arrayable's record", () => {
            expectTypeOf(collect(new ArrayableRecord())).toEqualTypeOf<
                Collection<string, "foo", "keyed">
            >();
        });

        it("types a plain object with a toArray member as an Arrayable's list, though the runtime keeps it as data", () => {
            // TypeScript cannot tell an object literal from an Arrayable class, so the literal types as a list.
            expectTypeOf(collect({ toArray: () => [4, 5, 6] })).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("reads a JsonSerializable's list", () => {
            expectTypeOf(collect(new SerializesList())).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("reads a JsonSerializable's record", () => {
            expectTypeOf(collect(new SerializesRecord())).toEqualTypeOf<
                Collection<string, "foo", "keyed">
            >();
        });

        it("reads a JsonSerializable's scalar as items no type can know", () => {
            expectTypeOf(collect(new SerializesScalar())).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
        });

        it("reads a Jsonable as items no type can know", () => {
            expectTypeOf(collect(new JsonText())).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
        });

        it("reads a class instance as the record of its fields", () => {
            expectTypeOf(collect(new Point())).toEqualTypeOf<
                Collection<number, "x" | "y", "keyed">
            >();
        });

        it("types a class instance's methods among its items", () => {
            // TypeScript cannot tell a method from a function-valued field, so greet() is typed though never copied.
            expectTypeOf(collect(new User())).toEqualTypeOf<
                Collection<string | (() => number), "name" | "greet", "keyed">
            >();
        });

        it("types each member of a union as it types that member alone", () => {
            expectTypeOf(collect(keyedOrRecord)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(collect(listOrCollection)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect(maybeTagged)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect(setOrMap)).toEqualTypeOf<
                Collection<
                    number,
                    number | MapArrayKey<string>,
                    "list" | "keyed"
                >
            >();
            expectTypeOf(collect(jsonOrNull)).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
            expectTypeOf(collect(serializedOrNull)).toEqualTypeOf<
                Collection<string, "foo", "list" | "keyed">
            >();
        });

        it("types a record that may be missing as a list or a keyed collection", () => {
            expectTypeOf(collect(recordOrNull)).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
        });

        it("types a value of unknown type as unknown items in either shape", () => {
            expectTypeOf(collect(anything)).toEqualTypeOf<
                Collection<unknown, PropertyKey, CollectionShape>
            >();
        });

        it("reads an iterable that is also a JsonSerializable by iterating it, as the runtime does", () => {
            expectTypeOf(collect(new IterableRecord())).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("keeps a function or a class whole, in a one-item list, as the runtime does", () => {
            expectTypeOf(collect(() => 1)).toEqualTypeOf<
                Collection<() => 1, number, "list">
            >();
            expectTypeOf(collect(Point)).toEqualTypeOf<
                Collection<typeof Point, number, "list">
            >();
        });

        it("holds the items dataFrom answers for the same list or record", () => {
            const list = collect(numberList);
            const record = collect(abc);

            expectTypeOf<ItemsOf<typeof list>>().toEqualTypeOf(
                Data.dataFrom(numberList),
            );
            expectTypeOf<ItemsOf<typeof record>>().toEqualTypeOf(
                Data.dataFrom(abc),
            );
        });

        it("holds a Map's items under the keys PHP stores", () => {
            const map = collect(mapBuilt);

            // Not pinned to dataFrom, which types a Map as Record<string, unknown> and so loses its keys and values.
            expectTypeOf<ItemsOf<typeof map>>().toEqualTypeOf<
                Record<number, string>
            >();
        });
    });

    describe("make", () => {
        it("keys a record by its literal keys", () => {
            expectTypeOf(Collection.make({ a: 1 })).toEqualTypeOf<
                Collection<number, "a", "keyed">
            >();
        });

        it("reads a class instance as the record of its fields", () => {
            expectTypeOf(Collection.make(new Point())).toEqualTypeOf<
                Collection<number, "x" | "y", "keyed">
            >();
        });

        it("types every input collect() takes the same way", () => {
            expectTypeOf(Collection.make(readonlyNumbers)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.make(new Map([["a", 1]]))).toEqualTypeOf<
                Collection<number, MapArrayKey<string>, "keyed">
            >();
            expectTypeOf(Collection.make(new Set([1, 2]))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.make(numberKeyedCollection)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(Collection.make(listOrRecord)).toEqualTypeOf<
                Collection<number, number | "a" | "b", "list" | "keyed">
            >();
            expectTypeOf(Collection.make("abc")).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(Collection.make(null)).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(Collection.make(maybeNumbers)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(
                Collection.make<string, number>(
                    new Map<number, string>([[1, "a"]]),
                ),
            ).toEqualTypeOf<Collection<string, number, "keyed">>();
            expectTypeOf(Collection.make(new ArrayableRecord())).toEqualTypeOf<
                Collection<string, "foo", "keyed">
            >();
            expectTypeOf(Collection.make(new SerializesList())).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(Collection.make(new JsonText())).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
        });

        it("types each member of a union as it types that member alone", () => {
            expectTypeOf(Collection.make(keyedOrRecord)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(Collection.make(listOrCollection)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.make(recordOrNull)).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
        });

        it("types a value of unknown type as unknown items in either shape", () => {
            expectTypeOf(Collection.make(anything)).toEqualTypeOf<
                Collection<unknown, PropertyKey, CollectionShape>
            >();
        });

        it("takes the arguments a subclass's constructor adds", () => {
            expectTypeOf(Tagged.make([1, 2], "tag")).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });
    });

    describe("constructor", () => {
        it("types a list as a list of its values", () => {
            expectTypeOf(new Collection([1, 2])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("builds an empty list from null or nothing", () => {
            expectTypeOf(new Collection(null)).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(new Collection()).toEqualTypeOf<
                Collection<never, number, "list">
            >();
        });

        it("takes a list that may be missing", () => {
            expectTypeOf(new Collection(maybeNumbers)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("keys a Map by its own key type", () => {
            expectTypeOf(new Collection(new Map([["a", 1]]))).toEqualTypeOf<
                Collection<number, string, "keyed">
            >();
        });

        it("reads an Arrayable's list or record", () => {
            expectTypeOf(new Collection(new ArrayableNumbers())).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(new Collection(new ArrayableRecord())).toEqualTypeOf<
                Collection<string, "foo", "keyed">
            >();
        });

        it("reads a JsonSerializable's list or record", () => {
            expectTypeOf(new Collection(new SerializesList())).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(new Collection(new SerializesRecord())).toEqualTypeOf<
                Collection<string, "foo", "keyed">
            >();
        });

        it("keeps another collection's types", () => {
            expectTypeOf(new Collection(numberKeyedCollection)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("keys a record by its literal keys", () => {
            expectTypeOf(new Collection({ a: 1, b: 2 })).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
        });

        it("types a record with integer keys by its keys' default shape", () => {
            // A constructor declares no type parameters of its own, so nothing infers the keyed shape its backing has.
            expectTypeOf(new Collection({ 1: "a", 2: "b" })).toEqualTypeOf<
                Collection<string, 1 | 2, "list">
            >();
        });

        it("lists an iterable's values", () => {
            expectTypeOf(new Collection(new Set(["a"]))).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("wraps a scalar in a list, as PHP's Arr::wrap does", () => {
            expectTypeOf(new Collection("abc")).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("keeps a subclass assignable where the base collection is expected", () => {
            expectTypeOf(new Tagged()).toExtend<Collection<number, number>>();
        });

        it("takes an Arrayable, a list or a scalar a subclass's constructor hands on", () => {
            class Forwarding extends Collection<number, number> {
                constructor(
                    items?:
                        | number
                        | readonly number[]
                        | Arrayable<number>
                        | Iterable<number>
                        | null,
                ) {
                    super(items);
                }
            }

            expectTypeOf(new Forwarding(new ArrayableNumbers())).toExtend<
                Collection<number, number>
            >();
        });
    });

    describe("wrap", () => {
        it("wraps a scalar in a list of its type", () => {
            expectTypeOf(Collection.wrap(1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.wrap("foo")).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(Collection.wrap(false)).toEqualTypeOf<
                Collection<boolean, number, "list">
            >();
        });

        it("takes a list's items", () => {
            expectTypeOf(Collection.wrap(numberList)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.wrap(readonlyNumbers)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.wrap(maybeNumbers)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("lists the values of a value that is one item or a list of them", () => {
            expectTypeOf(Collection.wrap(oneOrMany)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.wrap(oneOrManyOrNone)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("keys a record by its literal keys", () => {
            expectTypeOf(Collection.wrap({ a: 1 })).toEqualTypeOf<
                Collection<number, "a", "keyed">
            >();
            expectTypeOf(Collection.wrap(settings)).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
        });

        it("keys a Map by the keys PHP stores", () => {
            expectTypeOf(Collection.wrap(mapBuilt)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("keeps another collection's types", () => {
            expectTypeOf(Collection.wrap(listCollection)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.wrap(numberKeyedCollection)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(Collection.wrap(generic)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(Collection.wrap(partial)).toEqualTypeOf<
                Collection<number, "a", "partial">
            >();
        });

        it("types a subclass instance by the collection it extends", () => {
            expectTypeOf(Collection.wrap(new Tagged([1]))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("builds an empty list from null or undefined", () => {
            expectTypeOf(Collection.wrap(null)).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(Collection.wrap(undefined)).toEqualTypeOf<
                Collection<never, number, "list">
            >();
        });

        it("takes a value that may be a list or a record", () => {
            expectTypeOf(Collection.wrap(listOrRecord)).toEqualTypeOf<
                Collection<number, number | "a" | "b", "list" | "keyed">
            >();
        });

        it("types a class instance as the record of its fields, though the runtime wraps it as one item", () => {
            // TypeScript cannot tell a class instance from the plain object wrap() takes as a record.
            expectTypeOf(Collection.wrap(new Point())).toEqualTypeOf<
                Collection<number, "x" | "y", "keyed">
            >();
        });

        it("keeps a built-in object, a function or a class whole, as the runtime does", () => {
            expectTypeOf(Collection.wrap(new Date())).toEqualTypeOf<
                Collection<Date, number, "list">
            >();
            expectTypeOf(Collection.wrap(new Set([1]))).toEqualTypeOf<
                Collection<Set<number>, number, "list">
            >();
            expectTypeOf(
                Collection.wrap(new WeakMap<object, number>()),
            ).toEqualTypeOf<
                Collection<WeakMap<object, number>, number, "list">
            >();
            expectTypeOf(Collection.wrap(new WeakSet<object>())).toEqualTypeOf<
                Collection<WeakSet<object>, number, "list">
            >();
            expectTypeOf(Collection.wrap(/a/)).toEqualTypeOf<
                Collection<RegExp, number, "list">
            >();
            expectTypeOf(Collection.wrap(Promise.resolve(1))).toEqualTypeOf<
                Collection<Promise<number>, number, "list">
            >();
            expectTypeOf(Collection.wrap(() => 1)).toEqualTypeOf<
                Collection<() => 1, number, "list">
            >();
            expectTypeOf(Collection.wrap(Point)).toEqualTypeOf<
                Collection<typeof Point, number, "list">
            >();
        });

        it("wraps each member of a union as it wraps that member alone", () => {
            expectTypeOf(Collection.wrap(listOrCollection)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.wrap(numberOrCollection)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.wrap(textOrTexts)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(Collection.wrap(maybeTagged)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types the items a union wraps, so a callback reads them", () => {
            Collection.wrap(textOrTexts).map((text) => {
                expectTypeOf(text).toEqualTypeOf<string>();

                return text.toUpperCase();
            });
        });

        it("types a record, a Map or a collection that may be missing as a list or a keyed collection", () => {
            expectTypeOf(Collection.wrap(recordOrNull)).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
            expectTypeOf(Collection.wrap(pairOrNone)).toEqualTypeOf<
                Collection<number, "a" | "b", "list" | "keyed">
            >();
            expectTypeOf(Collection.wrap(mapOrNull)).toEqualTypeOf<
                Collection<number, MapArrayKey<string>, "list" | "keyed">
            >();
            expectTypeOf(Collection.wrap(keyedOrNull)).toEqualTypeOf<
                Collection<number, "a", "list" | "keyed">
            >();
        });

        it("types a scalar or a record as a list or a keyed collection", () => {
            expectTypeOf(Collection.wrap(textOrRecord)).toEqualTypeOf<
                Collection<string, string | number, "list" | "keyed">
            >();
        });

        it("types a value of unknown type as unknown items in either shape", () => {
            expectTypeOf(Collection.wrap(anything)).toEqualTypeOf<
                Collection<unknown, PropertyKey, CollectionShape>
            >();
        });

        it("takes the arguments a subclass's constructor adds, and types the base collection", () => {
            expectTypeOf(Tagged.wrap([1], "tag")).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });
    });

    describe("unwrap", () => {
        it("answers a collection's items in its shape", () => {
            expectTypeOf(Collection.unwrap(listCollection)).toEqualTypeOf<
                number[]
            >();
            expectTypeOf(Collection.unwrap(collect(abc))).toEqualTypeOf<
                Record<"a" | "b" | "c", number>
            >();
            expectTypeOf(Collection.unwrap(collect(mapBuilt))).toEqualTypeOf<
                Record<number, string>
            >();
            expectTypeOf(Collection.unwrap(generic)).toEqualTypeOf<
                Record<string | number, number>
            >();
            expectTypeOf(Collection.unwrap(partial)).toEqualTypeOf<
                Partial<Record<"a", number>>
            >();
        });

        it("answers a subclass's items by the collection it extends", () => {
            expectTypeOf(Collection.unwrap(new Tagged([1]))).toEqualTypeOf<
                number[]
            >();
        });

        it("answers the items of a value that is a list or a collection", () => {
            expectTypeOf(Collection.unwrap(listOrCollection)).toEqualTypeOf<
                number[]
            >();
            expectTypeOf(Collection.unwrap(taggedOrList)).toEqualTypeOf<
                number[]
            >();
        });

        it("hands back anything else as it is", () => {
            expectTypeOf(Collection.unwrap(numberList)).toEqualTypeOf<
                number[]
            >();
            expectTypeOf(Collection.unwrap(abc)).toEqualTypeOf<{
                a: number;
                b: number;
                c: number;
            }>();
            expectTypeOf(Collection.unwrap("foo")).toEqualTypeOf<string>();
        });
    });

    describe("empty", () => {
        it("builds an empty list", () => {
            expectTypeOf(Collection.empty()).toEqualTypeOf<
                Collection<never, number, "list">
            >();
        });

        it("takes the value type the list is to hold", () => {
            expectTypeOf(Collection.empty<string>()).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("takes the arguments a subclass's constructor adds, and types the base collection", () => {
            expectTypeOf(Tagged.empty("tag")).toEqualTypeOf<
                Collection<never, number, "list">
            >();
        });

        it("takes no key type, since an empty collection is a list", () => {
            // @ts-expect-error - a list's keys are always numbers
            Collection.empty<string, "a">();
        });
    });

    describe("times", () => {
        it("lists the counts when no callback is given", () => {
            expectTypeOf(Collection.times(3)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.times(3, null)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("lists what the callback answers", () => {
            expectTypeOf(Collection.times(3, String)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
        });

        it("lists the counts or the callback's answers for a callback that may be null", () => {
            expectTypeOf(Collection.times(3, maybeCallback)).toEqualTypeOf<
                Collection<number | string, number, "list">
            >();
        });

        it("hands the callback the count", () => {
            Collection.times(2, (count) => {
                expectTypeOf(count).toEqualTypeOf<number>();

                return count;
            });
        });

        it("takes the arguments a subclass's constructor adds, and types the base collection", () => {
            expectTypeOf(
                Tagged.times(2, (count) => count * 2, "tag"),
            ).toEqualTypeOf<Collection<number, number, "list">>();
        });

        it("rejects a callback that is not a function", () => {
            // @ts-expect-error - the port calls the callback itself; a function's name is not callable in JavaScript
            Collection.times(3, "strtoupper");
        });
    });

    describe("range", () => {
        it("lists the numbers from one end to the other", () => {
            expectTypeOf(Collection.range(1, 5)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(Collection.range(10, 1, 3)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("takes the arguments a subclass's constructor adds, and types the base collection", () => {
            expectTypeOf(Tagged.range(1, 3, 1, "tag")).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("rejects bounds that are not numbers", () => {
            // @ts-expect-error - PHP's PHPDoc takes int bounds, and a letter range is not ported
            Collection.range("a", "e");
        });
    });

    describe("all", () => {
        it("answers a list's items as a list, whose reads may miss", () => {
            expectTypeOf(listCollection.all()).toEqualTypeOf<number[]>();
            expectTypeOf(collect([1, 2]).all()[0]).toEqualTypeOf<
                number | undefined
            >();
        });

        it("answers a record's items under its keys, so each destructured key reads its value", () => {
            const { a, b } = collect({ a: 1, b: 2 }).all();

            expectTypeOf(a).toEqualTypeOf<number>();
            expectTypeOf(b).toEqualTypeOf<number>();
        });

        it("rejects a key the record does not hold", () => {
            // @ts-expect-error - the record holds only the key a
            void collect({ a: 1 }).all().c;
        });

        it("answers a keyed collection that may lack keys as a record whose reads may miss", () => {
            expectTypeOf(
                collect({ a: 1, b: 2 })
                    .filter((value) => value > 1)
                    .all().a,
            ).toEqualTypeOf<number | undefined>();
            expectTypeOf(partial.all()).toEqualTypeOf<
                Partial<Record<"a", number>>
            >();
        });

        it("answers a keyed collection whose keys are numbers as a record", () => {
            expectTypeOf(collect(mapBuilt).all()).toEqualTypeOf<
                Record<number, string>
            >();
            expectTypeOf(numberKeyedCollection.all()).toEqualTypeOf<
                Record<number, string>
            >();
        });

        it("answers a generic collection's items as a record of its keys", () => {
            expectTypeOf(generic.all()).toEqualTypeOf<
                Record<string | number, number>
            >();
        });

        it("answers either shape for a collection that may be a list", () => {
            expectTypeOf(anyShape.all()).toEqualTypeOf<
                number[] | Partial<Record<"a", number>>
            >();
            expectTypeOf(collect(listOrRecord).all()).toEqualTypeOf<
                number[] | Partial<Record<number | "a" | "b", number>>
            >();
        });

        it("answers a subclass's items by the collection it extends", () => {
            expectTypeOf(new Tagged([1]).all()).toEqualTypeOf<number[]>();
        });
    });

    describe("fromJson", () => {
        it("types the decoded items as unknown, in either shape", () => {
            expectTypeOf(Collection.fromJson("[1]")).toEqualTypeOf<
                Collection<unknown, PropertyKey, CollectionShape>
            >();
        });

        it("takes the value and key types the caller knows the JSON holds", () => {
            expectTypeOf(
                Collection.fromJson<{ id: number }>("[]"),
            ).toEqualTypeOf<
                Collection<{ id: number }, PropertyKey, CollectionShape>
            >();
            expectTypeOf(
                Collection.fromJson<string, "a">('{"a":"b"}'),
            ).toEqualTypeOf<Collection<string, "a", CollectionShape>>();
        });

        it("takes json_decode's depth and flags, and the arguments a subclass's constructor adds", () => {
            expectTypeOf(Tagged.fromJson("[1]", 512, 0, "tag")).toEqualTypeOf<
                Collection<unknown, PropertyKey, CollectionShape>
            >();
        });

        it("rejects anything but JSON text", () => {
            // @ts-expect-error - json_decode decodes a string
            Collection.fromJson({ a: 1 });
        });
    });

    describe("getIterator", () => {
        it("iterates the values", () => {
            expectTypeOf(listCollection.getIterator()).toEqualTypeOf<
                ArrayIterator<number>
            >();
            expectTypeOf(collect(abc).getIterator()).toEqualTypeOf<
                ArrayIterator<number>
            >();
            expectTypeOf(collect(mapBuilt).getIterator()).toEqualTypeOf<
                ArrayIterator<string>
            >();
            expectTypeOf(generic.getIterator()).toEqualTypeOf<
                ArrayIterator<number>
            >();
        });
    });

    describe("Symbol.iterator", () => {
        it("hands out getIterator()'s iterator", () => {
            expectTypeOf(listCollection[Symbol.iterator]()).toEqualTypeOf<
                ArrayIterator<number>
            >();
            expectTypeOf(collect(abc)[Symbol.iterator]()).toEqualTypeOf<
                ArrayIterator<number>
            >();
            expectTypeOf(collect(mapBuilt)[Symbol.iterator]()).toEqualTypeOf<
                ArrayIterator<string>
            >();
            expectTypeOf(generic[Symbol.iterator]()).toEqualTypeOf<
                ArrayIterator<number>
            >();
        });

        it("types each value for...of reads", () => {
            for (const value of collect([1])) {
                expectTypeOf(value).toEqualTypeOf<number>();
            }

            for (const value of collect(abc)) {
                expectTypeOf(value).toEqualTypeOf<number>();
            }

            for (const value of collect(mapBuilt)) {
                expectTypeOf(value).toEqualTypeOf<string>();
            }

            for (const value of generic) {
                expectTypeOf(value).toEqualTypeOf<number>();
            }
        });

        it("spreads the values into a list", () => {
            expectTypeOf([...collect(abc)]).toEqualTypeOf<number[]>();
        });
    });

    describe("count", () => {
        it("counts the items of any collection", () => {
            expectTypeOf(listCollection.count()).toEqualTypeOf<number>();
            expectTypeOf(collect(abc).count()).toEqualTypeOf<number>();
            expectTypeOf(collect(mapBuilt).count()).toEqualTypeOf<number>();
            expectTypeOf(generic.count()).toEqualTypeOf<number>();
            expectTypeOf(new Tagged([1]).count()).toEqualTypeOf<number>();
        });

        it("takes no argument", () => {
            // @ts-expect-error - Collection::count() takes no argument
            listCollection.count(1);
        });
    });

    describe("length", () => {
        it("reads the count as a property", () => {
            expectTypeOf(listCollection.length).toEqualTypeOf<number>();
            expectTypeOf(collect(abc).length).toEqualTypeOf<number>();
            expectTypeOf(collect(mapBuilt).length).toEqualTypeOf<number>();
            expectTypeOf(generic.length).toEqualTypeOf<number>();
        });

        it("cannot be written", () => {
            // @ts-expect-error - a getter with no setter is read-only
            listCollection.length = 2;
        });
    });

    describe("isEmpty", () => {
        it("answers whether any collection holds no item", () => {
            expectTypeOf(listCollection.isEmpty()).toEqualTypeOf<boolean>();
            expectTypeOf(collect(abc).isEmpty()).toEqualTypeOf<boolean>();
            expectTypeOf(collect(mapBuilt).isEmpty()).toEqualTypeOf<boolean>();
            expectTypeOf(generic.isEmpty()).toEqualTypeOf<boolean>();
        });
    });

    describe("isNotEmpty", () => {
        it("answers whether any collection holds an item", () => {
            expectTypeOf(listCollection.isNotEmpty()).toEqualTypeOf<boolean>();
            expectTypeOf(collect(abc).isNotEmpty()).toEqualTypeOf<boolean>();
            expectTypeOf(
                collect(mapBuilt).isNotEmpty(),
            ).toEqualTypeOf<boolean>();
            expectTypeOf(generic.isNotEmpty()).toEqualTypeOf<boolean>();
        });
    });

    describe("toBase", () => {
        it("keeps a list's or a record's types", () => {
            expectTypeOf(listCollection.toBase()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect(abc).toBase()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
        });

        it("keeps a keyed shape whose keys are numbers", () => {
            expectTypeOf(collect(mapBuilt).toBase()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("keeps a generic or a partial collection's types", () => {
            expectTypeOf(generic.toBase()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(partial.toBase()).toEqualTypeOf<
                Collection<number, "a", "partial">
            >();
        });

        it("types a subclass's result as the base collection, which it is", () => {
            expectTypeOf(new Tagged([1]).toBase()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });
    });

    describe("dump", () => {
        it("returns the collection it dumped", () => {
            expectTypeOf(listCollection.dump()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect(abc).dump("one", 2)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(collect(mapBuilt).dump()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(generic.dump()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
        });

        it("keeps a subclass's own type", () => {
            expectTypeOf(new Tagged([1]).dump()).toEqualTypeOf<Tagged>();
        });
    });

    describe("ensure", () => {
        it("narrows the values to the type a JavaScript type name stands for", () => {
            expectTypeOf(unknowns.ensure("number")).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(unknowns.ensure("string")).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(unknowns.ensure("boolean")).toEqualTypeOf<
                Collection<boolean, number, "list">
            >();
            expectTypeOf(unknowns.ensure("symbol")).toEqualTypeOf<
                Collection<symbol, number, "list">
            >();
            expectTypeOf(unknowns.ensure("bigint")).toEqualTypeOf<
                Collection<bigint, number, "list">
            >();
            expectTypeOf(unknowns.ensure("undefined")).toEqualTypeOf<
                Collection<undefined, number, "list">
            >();
            expectTypeOf(unknowns.ensure("object")).toEqualTypeOf<
                Collection<object, number, "list">
            >();
            expectTypeOf(unknowns.ensure("function")).toEqualTypeOf<
                Collection<
                    | ((...args: never[]) => unknown)
                    | (abstract new (...args: never[]) => unknown),
                    number,
                    "list"
                >
            >();
        });

        it("narrows the values to the type a PHP type name stands for", () => {
            // CollectionTest passes get_debug_type()'s names, which Laravel's PHPDoc lists and the port reads.
            expectTypeOf(unknowns.ensure("int")).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(unknowns.ensure("float")).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(unknowns.ensure("bool")).toEqualTypeOf<
                Collection<boolean, number, "list">
            >();
        });

        it("reads a plain object as an array and undefined as null, as the runtime does", () => {
            expectTypeOf(unknowns.ensure("array")).toEqualTypeOf<
                Collection<
                    unknown[] | Record<PropertyKey, unknown>,
                    number,
                    "list"
                >
            >();
            expectTypeOf(unknowns.ensure("null")).toEqualTypeOf<
                Collection<null | undefined, number, "list">
            >();
        });

        it("narrows the values to a class's instances", () => {
            expectTypeOf(unknowns.ensure(Date)).toEqualTypeOf<
                Collection<Date, number, "list">
            >();
        });

        it("narrows the values to objects for a class named as a string", () => {
            expectTypeOf(unknowns.ensure("Child")).toEqualTypeOf<
                Collection<object, number, "list">
            >();
        });

        it("narrows nothing for a name only known to be a string", () => {
            expectTypeOf(unknowns.ensure(typeName)).toEqualTypeOf<
                Collection<unknown, number, "list">
            >();
        });

        it("narrows the values to any of a list's or a record's types", () => {
            expectTypeOf(unknowns.ensure(["number", "string"])).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(unknowns.ensure([Date, "null"])).toEqualTypeOf<
                Collection<Date | null | undefined, number, "list">
            >();
            expectTypeOf(
                unknowns.ensure({ a: "number", b: "string" }),
            ).toEqualTypeOf<Collection<string | number, number, "list">>();
        });

        it("keeps a keyed collection's keys and shape", () => {
            expectTypeOf(unknownRecord.ensure("number")).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
            expectTypeOf(collect(mapBuilt).ensure("string")).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(generic.ensure("int")).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(partial.ensure("int")).toEqualTypeOf<
                Collection<number, "a", "partial">
            >();
        });

        it("types a subclass's result as the base collection", () => {
            expectTypeOf(new Tagged([1]).ensure("int")).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("rejects what is neither a type name nor a class", () => {
            // @ts-expect-error - a number names no type
            unknowns.ensure(42);
        });
    });

    describe("collect method", () => {
        it("keeps a list's or a record's types", () => {
            expectTypeOf(listCollection.collect()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(collect(abc).collect()).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
        });

        it("keeps a keyed shape whose keys are numbers", () => {
            expectTypeOf(collect(mapBuilt).collect()).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("keeps a generic or a partial collection's types", () => {
            expectTypeOf(generic.collect()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(partial.collect()).toEqualTypeOf<
                Collection<number, "a", "partial">
            >();
        });

        it("types a subclass's result as the base collection, which PHP's collect() returns", () => {
            expectTypeOf(new Tagged([1]).collect()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });
    });

    describe("toArray", () => {
        it("answers a list's or a record's items in the collection's shape", () => {
            expectTypeOf(listCollection.toArray()).toEqualTypeOf<number[]>();
            expectTypeOf(collect(abc).toArray()).toEqualTypeOf<
                Record<"a" | "b" | "c", number>
            >();
            expectTypeOf(collect(mapBuilt).toArray()).toEqualTypeOf<
                Record<number, string>
            >();
            expectTypeOf(generic.toArray()).toEqualTypeOf<
                Record<string | number, number>
            >();
            expectTypeOf(partial.toArray()).toEqualTypeOf<
                Partial<Record<"a", number>>
            >();
            expectTypeOf(anyShape.toArray()).toEqualTypeOf<
                number[] | Partial<Record<"a", number>>
            >();
        });

        it("answers each Arrayable item as the array its toArray() gives", () => {
            expectTypeOf(collect([listCollection]).toArray()).toEqualTypeOf<
                number[][]
            >();
            expectTypeOf(collect({ a: collect(abc) }).toArray()).toEqualTypeOf<
                Record<"a", Record<"a" | "b" | "c", number>>
            >();
            expectTypeOf(
                collect([new ArrayableNumbers()]).toArray(),
            ).toEqualTypeOf<number[][]>();
            expectTypeOf(
                collect([new ArrayableRecord(), 1]).toArray(),
            ).toEqualTypeOf<({ foo: string } | number)[]>();
        });

        it("answers a subclass's items by the collection it extends", () => {
            expectTypeOf(new Tagged([1]).toArray()).toEqualTypeOf<number[]>();
            expectTypeOf(collect([new Tagged([1])]).toArray()).toEqualTypeOf<
                number[][]
            >();
        });
    });

    describe("jsonSerialize", () => {
        it("answers a list's items as a list of what each serializes to", () => {
            expectTypeOf(listCollection.jsonSerialize()).toEqualTypeOf<
                unknown[]
            >();
            expectTypeOf(new Tagged([1]).jsonSerialize()).toEqualTypeOf<
                unknown[]
            >();
        });

        it("answers a keyed collection's items as a record, or a list for keys 0..n-1 in order or none", () => {
            expectTypeOf(collect(abc).jsonSerialize()).toEqualTypeOf<
                unknown[] | Record<"a" | "b" | "c", unknown>
            >();
            expectTypeOf(collect(mapBuilt).jsonSerialize()).toEqualTypeOf<
                unknown[] | Record<number, unknown>
            >();
            expectTypeOf(generic.jsonSerialize()).toEqualTypeOf<
                unknown[] | Record<string | number, unknown>
            >();
        });

        it("answers a record that may lack keys for a collection that may lack them", () => {
            expectTypeOf(partial.jsonSerialize()).toEqualTypeOf<
                unknown[] | Partial<Record<"a", unknown>>
            >();
            expectTypeOf(anyShape.jsonSerialize()).toEqualTypeOf<
                unknown[] | Partial<Record<"a", unknown>>
            >();
        });
    });

    describe("toJson", () => {
        it("answers the JSON text of any collection", () => {
            expectTypeOf(listCollection.toJson()).toEqualTypeOf<string>();
            expectTypeOf(collect(abc).toJson(null, 2)).toEqualTypeOf<string>();
            expectTypeOf(
                collect(mapBuilt).toJson(["a"], "\t"),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                generic.toJson((key, value) => {
                    expectTypeOf(key).toEqualTypeOf<string>();
                    expectTypeOf(value).toEqualTypeOf<unknown>();

                    return value;
                }),
            ).toEqualTypeOf<string>();
        });

        it("rejects a replacer JSON.stringify() does not take", () => {
            // @ts-expect-error - JSON.stringify() takes a function or a list of keys
            listCollection.toJson("a");
        });
    });

    describe("toJSON", () => {
        it("answers unknown, whatever the items", () => {
            expectTypeOf(listCollection.toJSON()).toEqualTypeOf<unknown>();
            expectTypeOf(collect(mapBuilt).toJSON()).toEqualTypeOf<unknown>();
            expectTypeOf(generic.toJSON()).toEqualTypeOf<unknown>();
        });
    });

    describe("toPrettyJson", () => {
        it("answers the indented JSON text of any collection", () => {
            expectTypeOf(listCollection.toPrettyJson()).toEqualTypeOf<string>();
            expectTypeOf(
                collect(abc).toPrettyJson(null, 2),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                collect(mapBuilt).toPrettyJson(),
            ).toEqualTypeOf<string>();
            expectTypeOf(generic.toPrettyJson()).toEqualTypeOf<string>();
        });

        it("rejects an indent JSON.stringify() does not take", () => {
            // @ts-expect-error - JSON.stringify() indents by a count or a string
            listCollection.toPrettyJson(null, true);
        });
    });

    describe("toString", () => {
        it("answers the JSON text of any collection", () => {
            expectTypeOf(listCollection.toString()).toEqualTypeOf<string>();
            expectTypeOf(collect(abc).toString()).toEqualTypeOf<string>();
            expectTypeOf(collect(mapBuilt).toString()).toEqualTypeOf<string>();
            expectTypeOf(generic.toString()).toEqualTypeOf<string>();
        });
    });

    describe("Symbol.toPrimitive", () => {
        it("answers the count for the number hint", () => {
            expectTypeOf(
                listCollection[Symbol.toPrimitive]("number"),
            ).toEqualTypeOf<number>();
        });

        it("answers the JSON text for the string and default hints", () => {
            expectTypeOf(
                listCollection[Symbol.toPrimitive]("string"),
            ).toEqualTypeOf<string>();
            expectTypeOf(
                collect(mapBuilt)[Symbol.toPrimitive]("default"),
            ).toEqualTypeOf<string>();
        });

        it("answers either for a hint only known to be a string", () => {
            expectTypeOf(generic[Symbol.toPrimitive](typeName)).toEqualTypeOf<
                number | string
            >();
        });

        it("rejects a hint that is not a string", () => {
            // @ts-expect-error - JavaScript hands the method "number", "string" or "default"
            listCollection[Symbol.toPrimitive](1);
        });
    });

    describe("escapeWhenCastingToString", () => {
        it("returns the collection it configured", () => {
            expectTypeOf(
                listCollection.escapeWhenCastingToString(),
            ).toEqualTypeOf<Collection<number, number, "list">>();
            expectTypeOf(
                collect(abc).escapeWhenCastingToString(false),
            ).toEqualTypeOf<Collection<number, "a" | "b" | "c", "keyed">>();
            expectTypeOf(
                collect(mapBuilt).escapeWhenCastingToString(),
            ).toEqualTypeOf<Collection<string, number, "keyed">>();
            expectTypeOf(generic.escapeWhenCastingToString()).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
        });

        it("keeps a subclass's own type", () => {
            expectTypeOf(
                new Tagged([1]).escapeWhenCastingToString(),
            ).toEqualTypeOf<Tagged>();
        });

        it("rejects a flag that is not a boolean", () => {
            // @ts-expect-error - PHP's PHPDoc takes a bool
            listCollection.escapeWhenCastingToString("yes");
        });
    });

    describe("item access", () => {
        it("types no item as a property of the collection", () => {
            // @ts-expect-error - items are read with get(), offsetGet() or all(), never as properties
            void collect({ a: 1 }).a;
        });

        it("declares no index signature, which with length would make a collection ArrayLike", () => {
            expectTypeOf<
                0 extends keyof Collection<number> ? true : false
            >().toEqualTypeOf<false>();
        });
    });

    describe("shape", () => {
        it("tells a list from a keyed collection", () => {
            expectTypeOf(collect([1, 2, 3])).toEqualTypeOf<
                // @ts-expect-error - a list is not keyed
                Collection<number, number, "keyed">
            >();
        });

        it("keeps a named shape assignable where its key type's default shape is expected", () => {
            expectTypeOf<Collection<number, number, "list">>().toExtend<
                Collection<number, number>
            >();
            expectTypeOf<Collection<number, "a", "keyed">>().toExtend<
                Collection<number, "a">
            >();
        });

        it("refuses a keyed collection where a list is expected", () => {
            expectTypeOf<Collection<number, "a", "keyed">>().toExtend<
                // @ts-expect-error - a keyed collection is not a list
                Collection<number, "a", "list">
            >();
        });
    });

    describe("CollectionItems", () => {
        it("answers the backing each shape declares", () => {
            // Named through the namespace, so a missing export fails this row and not only the unreported import line.
            expectTypeOf<
                Exported.CollectionItems<number, number, "list">
            >().toEqualTypeOf<number[]>();
            expectTypeOf<
                Exported.CollectionItems<number, "a", "keyed">
            >().toEqualTypeOf<Record<"a", number>>();
            expectTypeOf<
                Exported.CollectionItems<number, "a", "partial">
            >().toEqualTypeOf<Partial<Record<"a", number>>>();
            expectTypeOf<
                Exported.CollectionItems<number, "a", Exported.CollectionShape>
            >().toEqualTypeOf<number[] | Partial<Record<"a", number>>>();
        });
    });

    describe("ItemsOf", () => {
        it("reads the items a collection's type arguments declare, by shape and not by key type", () => {
            expectTypeOf<ItemsOf<typeof listCollection>>().toEqualTypeOf<
                number[]
            >();
            expectTypeOf<ItemsOf<typeof numberKeyedCollection>>().toEqualTypeOf<
                Record<number, string>
            >();
            expectTypeOf<
                ItemsOf<Collection<number, "a", "partial">>
            >().toEqualTypeOf<Partial<Record<"a", number>>>();
            expectTypeOf<ItemsOf<typeof generic>>().toEqualTypeOf<
                Record<string | number, number>
            >();
        });

        it("reads a subclass's items through its all()", () => {
            expectTypeOf<ItemsOf<Tagged>>().toEqualTypeOf<number[]>();
        });
    });

    describe("expectShape", () => {
        it("rejects a shape name the collection's all() type rules out", () => {
            // @ts-expect-error - a record's all() is not a list
            expectShape(collect({ a: 1 }), "list");
            // @ts-expect-error - a list's all() is not a record
            expectShape(listCollection, "keyed");
        });
    });

    describe("fixtures", () => {
        it("keeps each fixture's type, which the family rows are written against", () => {
            expectTypeOf(numberList).toEqualTypeOf<number[]>();
            expectTypeOf(abc).toEqualTypeOf<{
                a: number;
                b: number;
                c: number;
            }>();
            expectTypeOf(rows).toEqualTypeOf<{ id: number; name: string }[]>();
            expectTypeOf(nullableRows).toEqualTypeOf<
                { id: number; name: string | null }[]
            >();
            expectTypeOf(nestedLists).toEqualTypeOf<number[][]>();
            expectTypeOf(recordOfLists).toEqualTypeOf<{
                a: number[];
                b: number[];
            }>();
            expectTypeOf(mixed).toEqualTypeOf<(string | number | null)[]>();
            expectTypeOf(mapBuilt).toEqualTypeOf<Map<number, string>>();
            expectTypeOf(box).toEqualTypeOf<{ a: number; b: number }>();
            expectTypeOf(unionItems).toEqualTypeOf<
                number[] | Record<string, number>
            >();
            expectTypeOf(generic).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
        });
    });

    describe("type-parameter callers", () => {
        it("compiles each method for a list whose item type is a type parameter", () => {
            // Each collection answer chains into filter(), which TypeScript calls on no union of collection types.
            function listed<TItem>(items: Collection<TItem>, item: TItem) {
                return {
                    all: items.all(),
                    count: items.count(),
                    length: items.length,
                    isEmpty: items.isEmpty(),
                    isNotEmpty: items.isNotEmpty(),
                    getIterator: items.getIterator(),
                    iterator: [...items],
                    toBase: items.toBase().filter(() => true),
                    dump: items.dump().filter(() => true),
                    ensure: items.ensure("int").filter(() => true),
                    collectMethod: items.collect().filter(() => true),
                    toArray: items.toArray(),
                    jsonSerialize: items.jsonSerialize(),
                    toJson: items.toJson(),
                    toJSON: items.toJSON(),
                    toPrettyJson: items.toPrettyJson(),
                    toString: items.toString(),
                    toPrimitive: items[Symbol.toPrimitive]("number"),
                    escapeWhenCastingToString: items
                        .escapeWhenCastingToString()
                        .filter(() => true),
                    collect: collect([item]).filter(() => true),
                    make: Collection.make([item]).filter(() => true),
                    constructor: new Collection([item]).filter(() => true),
                    wrap: Collection.wrap(item).filter(() => true),
                    unwrap: Collection.unwrap(items),
                    empty: Collection.empty<TItem>().filter(() => true),
                    times: Collection.times(2, () => item).filter(() => true),
                    fromJson: Collection.fromJson<TItem>("[]").filter(
                        () => true,
                    ),
                };
            }

            const answers = listed(listCollection, 1);

            expectTypeOf(answers.all).toEqualTypeOf<number[]>();
            expectTypeOf(answers.count).toEqualTypeOf<number>();
            expectTypeOf(answers.length).toEqualTypeOf<number>();
            expectTypeOf(answers.isEmpty).toEqualTypeOf<boolean>();
            expectTypeOf(answers.isNotEmpty).toEqualTypeOf<boolean>();
            expectTypeOf(answers.getIterator).toEqualTypeOf<
                ArrayIterator<number>
            >();
            expectTypeOf(answers.iterator).toEqualTypeOf<number[]>();
            expectTypeOf(answers.toBase).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.dump).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.ensure).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.collectMethod).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.toArray).toEqualTypeOf<number[]>();
            expectTypeOf(answers.jsonSerialize).toEqualTypeOf<unknown[]>();
            expectTypeOf(answers.toJson).toEqualTypeOf<string>();
            expectTypeOf(answers.toJSON).toEqualTypeOf<unknown>();
            expectTypeOf(answers.toPrettyJson).toEqualTypeOf<string>();
            expectTypeOf(answers.toString).toEqualTypeOf<string>();
            expectTypeOf(answers.toPrimitive).toEqualTypeOf<number>();
            expectTypeOf(answers.escapeWhenCastingToString).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.collect).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.make).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.constructor).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.wrap).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.unwrap).toEqualTypeOf<number[]>();
            expectTypeOf(answers.empty).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.times).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(answers.fromJson).toEqualTypeOf<
                Collection<number, PropertyKey, "list" | "partial">
            >();
        });

        it("compiles each method for a collection whose item, key and shape types are type parameters", () => {
            function shaped<
                TItem,
                TItemKey extends PropertyKey,
                TItemShape extends CollectionShape,
            >(items: Collection<TItem, TItemKey, TItemShape>) {
                return {
                    all: items.all(),
                    count: items.count(),
                    length: items.length,
                    isEmpty: items.isEmpty(),
                    isNotEmpty: items.isNotEmpty(),
                    getIterator: items.getIterator(),
                    iterator: [...items],
                    toBase: items.toBase().filter(() => true),
                    dump: items.dump().filter(() => true),
                    ensure: items.ensure("int").filter(() => true),
                    collectMethod: items.collect().filter(() => true),
                    toArray: items.toArray(),
                    jsonSerialize: items.jsonSerialize(),
                    toJson: items.toJson(),
                    toJSON: items.toJSON(),
                    toPrettyJson: items.toPrettyJson(),
                    toString: items.toString(),
                    toPrimitive: items[Symbol.toPrimitive]("number"),
                    escapeWhenCastingToString: items
                        .escapeWhenCastingToString()
                        .filter(() => true),
                    collect: collect(items).filter(() => true),
                    make: Collection.make(items).filter(() => true),
                    constructor: new Collection(items).filter(() => true),
                    wrap: Collection.wrap(items).filter(() => true),
                    unwrap: Collection.unwrap(items),
                    fromJson: Collection.fromJson<TItem, TItemKey>("{}").filter(
                        () => true,
                    ),
                };
            }

            const answers = shaped(collect(abc));

            expectTypeOf(answers.all).toEqualTypeOf<
                Record<"a" | "b" | "c", number>
            >();
            expectTypeOf(answers.count).toEqualTypeOf<number>();
            expectTypeOf(answers.length).toEqualTypeOf<number>();
            expectTypeOf(answers.isEmpty).toEqualTypeOf<boolean>();
            expectTypeOf(answers.isNotEmpty).toEqualTypeOf<boolean>();
            expectTypeOf(answers.getIterator).toEqualTypeOf<
                ArrayIterator<number>
            >();
            expectTypeOf(answers.iterator).toEqualTypeOf<number[]>();
            expectTypeOf(answers.toBase).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.dump).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.ensure).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.collectMethod).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.toArray).toEqualTypeOf<
                Record<"a" | "b" | "c", number>
            >();
            expectTypeOf(answers.jsonSerialize).toEqualTypeOf<
                unknown[] | Record<"a" | "b" | "c", unknown>
            >();
            expectTypeOf(answers.toJson).toEqualTypeOf<string>();
            expectTypeOf(answers.toJSON).toEqualTypeOf<unknown>();
            expectTypeOf(answers.toPrettyJson).toEqualTypeOf<string>();
            expectTypeOf(answers.toString).toEqualTypeOf<string>();
            expectTypeOf(answers.toPrimitive).toEqualTypeOf<number>();
            expectTypeOf(answers.escapeWhenCastingToString).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.collect).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.make).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.constructor).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.wrap).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(answers.unwrap).toEqualTypeOf<
                Record<"a" | "b" | "c", number>
            >();
            expectTypeOf(answers.fromJson).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "list" | "partial">
            >();
        });

        it("compiles each method in a generic subclass, whose member calls it on itself", () => {
            /** A subclass generic in its items, whose member calls the family on itself. */
            class Bag<TItem> extends Collection<TItem> {
                /**
                 * Call each construction and output method on this bag.
                 *
                 * @returns Each method's answer, by name
                 */
                called(): Record<string, unknown> {
                    return {
                        all: this.all(),
                        count: this.count(),
                        length: this.length,
                        isEmpty: this.isEmpty(),
                        isNotEmpty: this.isNotEmpty(),
                        getIterator: this.getIterator(),
                        iterator: [...this],
                        toBase: this.toBase().filter(() => true),
                        dump: this.dump().filter(() => true),
                        ensure: this.ensure("int").filter(() => true),
                        collectMethod: this.collect().filter(() => true),
                        toArray: this.toArray(),
                        jsonSerialize: this.jsonSerialize(),
                        toJson: this.toJson(),
                        toJSON: this.toJSON(),
                        toPrettyJson: this.toPrettyJson(),
                        toString: this.toString(),
                        toPrimitive: this[Symbol.toPrimitive]("number"),
                        escapeWhenCastingToString:
                            this.escapeWhenCastingToString().filter(() => true),
                    };
                }
            }

            expectTypeOf(new Bag([1, 2]).called()).toEqualTypeOf<
                Record<string, unknown>
            >();
        });
    });
});
