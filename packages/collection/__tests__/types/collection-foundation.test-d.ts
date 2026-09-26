import type * as Exported from "@tolki/collection";
import { collect, Collection } from "@tolki/collection";
import type { Arrayable, MapArrayKey } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import type { ItemsOf } from "../helpers";
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

        it("takes a collection's all(), which is a list or a record", () => {
            expectTypeOf(collect(listCollection.all())).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
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
});
