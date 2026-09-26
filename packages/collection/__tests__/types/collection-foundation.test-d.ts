import type * as Exported from "@tolki/collection";
import { collect, Collection } from "@tolki/collection";
import type { MapArrayKey } from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import {
    ArrayableNumbers,
    ArrayableRecord,
    type DeclaredShape,
    JsonText,
    listCollection,
    listOrRecord,
    numberKeyedCollection,
    numbers,
    Point,
    readonlyNumbers,
    SerializesList,
    SerializesRecord,
    settings,
    Tagged,
} from "./fixtures";

describe("collection foundation type tests", () => {
    describe("collect", () => {
        it("types a list as a list of its values", () => {
            const collection = collect([1, 2, 3]);

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"list">();
        });

        it("takes a read-only list", () => {
            const collection = collect(readonlyNumbers);

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"list">();
        });

        it("keys a record by its literal keys", () => {
            const collection = collect({ a: 1, b: 2 });

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });

        it("takes an interface-typed record, which has no index signature", () => {
            const collection = collect(settings);

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });

        it("keys a Map by the keys PHP stores", () => {
            const collection = collect(new Map([["a", 1]]));

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, MapArrayKey<string>, "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });

        it("lists a Set's values", () => {
            const collection = collect(new Set([1, 2]));

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"list">();
        });

        it("lists a generator's values", () => {
            const collection = collect(numbers());

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"list">();
        });

        it("keeps another collection's types", () => {
            const collection = collect(listCollection);

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"list">();
        });

        it("keeps a keyed collection's shape, though its keys are numbers", () => {
            const collection = collect(numberKeyedCollection);

            expectTypeOf(collection).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });

        it("takes a collection's all(), which is a list or a record", () => {
            const collection = collect(listCollection.all());

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
            expectTypeOf<DeclaredShape<typeof collection>>().toEqualTypeOf<
                "list" | "keyed"
            >();
        });

        it("takes a value that may be a list or a record", () => {
            const collection = collect(listOrRecord);

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, number | "a" | "b", "list" | "keyed">
            >();
            expectTypeOf<DeclaredShape<typeof collection>>().toEqualTypeOf<
                "list" | "keyed"
            >();
        });

        it("wraps a scalar in a list, as PHP's Arr::wrap does", () => {
            const strings = collect("abc");
            const counts = collect(1);
            const flags = collect(true);
            const symbols = collect(Symbol("s"));

            expectTypeOf(strings).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(counts).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(flags).toEqualTypeOf<
                Collection<boolean, number, "list">
            >();
            expectTypeOf(symbols).toEqualTypeOf<
                Collection<symbol, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof strings>
            >().toEqualTypeOf<"list">();
            expectTypeOf<
                DeclaredShape<typeof counts>
            >().toEqualTypeOf<"list">();
            expectTypeOf<DeclaredShape<typeof flags>>().toEqualTypeOf<"list">();
            expectTypeOf<
                DeclaredShape<typeof symbols>
            >().toEqualTypeOf<"list">();
        });

        it("builds an empty list from null or nothing", () => {
            const fromNull = collect(null);
            const fromUndefined = collect(undefined);
            const fromNothing = collect();

            expectTypeOf(fromNull).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(fromUndefined).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(fromNothing).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof fromNull>
            >().toEqualTypeOf<"list">();
            expectTypeOf<
                DeclaredShape<typeof fromUndefined>
            >().toEqualTypeOf<"list">();
            expectTypeOf<
                DeclaredShape<typeof fromNothing>
            >().toEqualTypeOf<"list">();
        });

        it("reads an Arrayable's list", () => {
            const collection = collect(new ArrayableNumbers());

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"list">();
        });

        it("reads an Arrayable's record", () => {
            const collection = collect(new ArrayableRecord());

            expectTypeOf(collection).toEqualTypeOf<
                Collection<string, "foo", "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });

        it("reads a JsonSerializable's list", () => {
            const collection = collect(new SerializesList());

            expectTypeOf(collection).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"list">();
        });

        it("reads a JsonSerializable's record", () => {
            const collection = collect(new SerializesRecord());

            expectTypeOf(collection).toEqualTypeOf<
                Collection<string, "foo", "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });

        it("reads a Jsonable as items no type can know", () => {
            const collection = collect(new JsonText());

            expectTypeOf(collection).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
            expectTypeOf<DeclaredShape<typeof collection>>().toEqualTypeOf<
                "list" | "keyed"
            >();
        });

        it("reads a class instance as the record of its fields", () => {
            const collection = collect(new Point());

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, "x" | "y", "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });
    });

    describe("make", () => {
        it("keys a record by its literal keys", () => {
            const collection = Collection.make({ a: 1 });

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, "a", "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });

        it("reads a class instance as the record of its fields", () => {
            const collection = Collection.make(new Point());

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, "x" | "y", "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });

        it("types every input collect() takes the same way", () => {
            const list = Collection.make(readonlyNumbers);
            const map = Collection.make(new Map([["a", 1]]));
            const set = Collection.make(new Set([1, 2]));
            const copy = Collection.make(numberKeyedCollection);
            const either = Collection.make(listOrRecord);
            const text = Collection.make("abc");
            const empty = Collection.make(null);
            const arrayable = Collection.make(new ArrayableRecord());
            const serializable = Collection.make(new SerializesList());
            const jsonable = Collection.make(new JsonText());

            expectTypeOf(list).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(map).toEqualTypeOf<
                Collection<number, MapArrayKey<string>, "keyed">
            >();
            expectTypeOf(set).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(copy).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(either).toEqualTypeOf<
                Collection<number, number | "a" | "b", "list" | "keyed">
            >();
            expectTypeOf(text).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(empty).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(arrayable).toEqualTypeOf<
                Collection<string, "foo", "keyed">
            >();
            expectTypeOf(serializable).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(jsonable).toEqualTypeOf<
                Collection<unknown, string | number, "list" | "keyed">
            >();
            expectTypeOf<DeclaredShape<typeof list>>().toEqualTypeOf<"list">();
            expectTypeOf<DeclaredShape<typeof map>>().toEqualTypeOf<"keyed">();
            expectTypeOf<DeclaredShape<typeof set>>().toEqualTypeOf<"list">();
            expectTypeOf<DeclaredShape<typeof copy>>().toEqualTypeOf<"keyed">();
            expectTypeOf<DeclaredShape<typeof either>>().toEqualTypeOf<
                "list" | "keyed"
            >();
            expectTypeOf<DeclaredShape<typeof text>>().toEqualTypeOf<"list">();
            expectTypeOf<DeclaredShape<typeof empty>>().toEqualTypeOf<"list">();
            expectTypeOf<
                DeclaredShape<typeof arrayable>
            >().toEqualTypeOf<"keyed">();
            expectTypeOf<
                DeclaredShape<typeof serializable>
            >().toEqualTypeOf<"list">();
            expectTypeOf<DeclaredShape<typeof jsonable>>().toEqualTypeOf<
                "list" | "keyed"
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
            const collection = new Collection([1, 2]);

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"list">();
        });

        it("builds an empty list from null or nothing", () => {
            const fromNull = new Collection(null);
            const fromNothing = new Collection();

            expectTypeOf(fromNull).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf(fromNothing).toEqualTypeOf<
                Collection<never, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof fromNull>
            >().toEqualTypeOf<"list">();
            expectTypeOf<
                DeclaredShape<typeof fromNothing>
            >().toEqualTypeOf<"list">();
        });

        it("keeps another collection's types", () => {
            const collection = new Collection(numberKeyedCollection);

            expectTypeOf(collection).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });

        it("keys a record by its literal keys", () => {
            const collection = new Collection({ a: 1, b: 2 });

            expectTypeOf(collection).toEqualTypeOf<
                Collection<number, "a" | "b", "keyed">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"keyed">();
        });

        it("lists an iterable's values", () => {
            const collection = new Collection(new Set(["a"]));

            expectTypeOf(collection).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"list">();
        });

        it("wraps a scalar in a list, as PHP's Arr::wrap does", () => {
            const collection = new Collection("abc");

            expectTypeOf(collection).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf<
                DeclaredShape<typeof collection>
            >().toEqualTypeOf<"list">();
        });

        it("keeps a subclass assignable where the base collection is expected", () => {
            expectTypeOf(new Tagged()).toExtend<Collection<number, number>>();
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
});
