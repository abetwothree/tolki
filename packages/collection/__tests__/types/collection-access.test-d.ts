import { collect, Collection } from "@tolki/collection";
import * as Data from "@tolki/data";
import type { PathKey } from "@tolki/types";
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
declare const count: number;
declare const name: string;
declare const aOrB: "a" | "b";
declare const someOfAB: ("a" | "b")[];
declare const maybeName: string | null;
declare const maybeIndex: number | undefined;
declare const pathKey: PathKey;
declare const users: Collection<number, `user-${number}`, "keyed">;
declare const userKey: `user-${number}`;
declare const lowered: Collection<number, Lowercase<string>, "keyed">;
declare const loweredKey: Lowercase<string>;
declare const byId: Collection<
    number,
    string & { readonly brand: "id" },
    "keyed"
>;
declare const idKey: string & { readonly brand: "id" };
declare const bySerial: Collection<
    string,
    number & { readonly brand: "serial" },
    "keyed"
>;
declare const serialKey: number & { readonly brand: "serial" };

describe("collection keyed access and mutation type tests", () => {
    const list = collect(numberList);
    const record = collect(abc);
    const mapped = collect(mapBuilt);
    const people = collect(rows);

    describe("get", () => {
        it("adds null to the item only when no default is given", () => {
            expectTypeOf(list.get(0)).toEqualTypeOf<number | null>();
            expectTypeOf(list.get(0, 5)).toEqualTypeOf<number>();
            expectTypeOf(record.get("a", 0)).toEqualTypeOf<number>();
        });

        it("adds the default's type, or the type its callback answers", () => {
            expectTypeOf(list.get(0, "x")).toEqualTypeOf<number | string>();
            expectTypeOf(list.get(0, () => "x")).toEqualTypeOf<
                number | string
            >();
            expectTypeOf(list.get(0, null)).toEqualTypeOf<number | null>();
        });

        it("reads a null key, which PHP looks up as the empty string", () => {
            expectTypeOf(record.get(null)).toEqualTypeOf<number | null>();
        });

        it("adds two keyed reads with defaults as numbers", () => {
            const pair = collect({ a: 1, b: 2 });

            expectTypeOf(
                pair.get("a", 0) + pair.get("b", 0),
            ).toEqualTypeOf<number>();
        });

        it("types a generic, a Map-built or a rows collection's item", () => {
            // Not pinned to dataGet, which reads a dot path where get() reads the key literally.
            expectTypeOf(generic.get("a", 0)).toEqualTypeOf<number>();
            expectTypeOf(mapped.get(2)).toEqualTypeOf<string | null>();
            expectTypeOf(people.get(0)).toEqualTypeOf<Row | null>();
        });

        it("rejects an object key, which no PHP array can hold", () => {
            // @ts-expect-error - array_key_exists() refuses an object key
            list.get({});
        });
    });

    describe("getOrPut", () => {
        it("answers the item or the value it puts", () => {
            expectTypeOf(list.getOrPut(3, 4)).toEqualTypeOf<number>();
            expectTypeOf(record.getOrPut("d", "s")).toEqualTypeOf<
                number | string
            >();
            expectTypeOf(record.getOrPut("d", () => true)).toEqualTypeOf<
                number | boolean
            >();
            expectTypeOf(list.getOrPut(null, 4)).toEqualTypeOf<number>();
        });

        it("types a generic or a Map-built collection's item", () => {
            expectTypeOf(generic.getOrPut("a", 0)).toEqualTypeOf<number>();
            expectTypeOf(mapped.getOrPut(3, "d")).toEqualTypeOf<string>();
        });

        it("rejects an object key, which no PHP array can hold", () => {
            // @ts-expect-error - array_key_exists() refuses an object key
            list.getOrPut({}, 4);
        });
    });

    describe("pull", () => {
        it("adds null to the item only when no default is given", () => {
            expectTypeOf(list.pull(0)).toEqualTypeOf<number | null>();
            expectTypeOf(record.pull("a", 0)).toEqualTypeOf<number>();
            expectTypeOf(record.pull("a", () => true)).toEqualTypeOf<
                number | boolean
            >();
        });

        it("answers every item for a null key, as Arr::get() does", () => {
            expectTypeOf(list.pull(null)).toEqualTypeOf<number[]>();
            expectTypeOf(record.pull(null)).toEqualTypeOf<
                Record<"a" | "b" | "c", number>
            >();
        });

        it("types a generic, a Map-built or a rows collection's item", () => {
            expectTypeOf(generic.pull("a")).toEqualTypeOf<number | null>();
            expectTypeOf(mapped.pull(2, "none")).toEqualTypeOf<string>();
            expectTypeOf(people.pull(0)).toEqualTypeOf<Row | null>();
        });

        it("answers every item or an item for a key that may be null", () => {
            expectTypeOf(record.pull(maybeName)).toEqualTypeOf<
                number | Record<"a" | "b" | "c", number> | null
            >();
            expectTypeOf(list.pull(pathKey)).toEqualTypeOf<
                number | number[] | null
            >();
            expectTypeOf(list.pull(pathKey, 0)).toEqualTypeOf<
                number | number[]
            >();
        });

        it("types a dot path's value like an item, as Laravel's PHPDoc does", () => {
            // Deferred: a dot path reads a value inside an item, and typing it needs a path type over the items
            expectTypeOf(people.pull("0.name")).toEqualTypeOf<Row | null>();
            expectTypeOf(people.pull("0.name")).not.toEqualTypeOf<
                string | null
            >();
        });

        it("rejects an object key and a missing one", () => {
            // @ts-expect-error - array_key_exists() refuses an object key
            list.pull({});
            // @ts-expect-error - PHP's pull() requires the key
            list.pull();
        });
    });

    describe("put", () => {
        it("widens a list's values and keys, and types a string key's list as keyed", () => {
            expectTypeOf(list.put("x", "s")).toEqualTypeOf<
                Collection<string | number, number | "x", "keyed">
            >();
        });

        it("keeps a list a list when a null key appends", () => {
            expectTypeOf(list.put(null, "s")).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
        });

        it("types an integer key's list as either shape, since only an index inside it keeps it a list", () => {
            expectTypeOf(list.put(5, "s")).toEqualTypeOf<
                Collection<string | number, number, "list" | "keyed">
            >();
            expectTypeOf(list.put(true, "s")).toEqualTypeOf<
                Collection<string | number, number, "list" | "keyed">
            >();
            expectTypeOf(list.put(name, "s")).toEqualTypeOf<
                Collection<string | number, string | number, "list" | "keyed">
            >();
        });

        it("casts a key the way PHP casts an array key", () => {
            expectTypeOf(list.put("5", "s")).toEqualTypeOf<
                Collection<string | number, number, "list" | "keyed">
            >();
            expectTypeOf(list.put("01", "s")).toEqualTypeOf<
                Collection<string | number, number | "01", "keyed">
            >();
            expectTypeOf(record.put("1", 4)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c" | 1, "keyed">
            >();
        });

        it("adds the key to a keyed collection's", () => {
            expectTypeOf(record.put("d", true)).toEqualTypeOf<
                Collection<number | boolean, "a" | "b" | "c" | "d", "keyed">
            >();
            expectTypeOf(record.put(0, "z")).toEqualTypeOf<
                Collection<number | string, "a" | "b" | "c" | 0, "keyed">
            >();
        });

        it("keeps a partial collection partial, since the keys it lacked stay missing", () => {
            expectTypeOf(partial.put("c", 1)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(partial.put(null, 1)).toEqualTypeOf<
                Collection<number, "a" | "b" | number, "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.put("k", 1)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.put(3, "d")).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("types a key that may be null as either an append or a write under the key", () => {
            expectTypeOf(record.put(maybeName, 1)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(list.put(maybeName, "s")).toEqualTypeOf<
                Collection<string | number, string | number, "list" | "keyed">
            >();
            expectTypeOf(list.put(maybeIndex, 1)).toEqualTypeOf<
                Collection<number, number, "list" | "keyed">
            >();
            expectTypeOf(list.put(pathKey, 1)).toEqualTypeOf<
                Collection<number, string | number, "list" | "keyed">
            >();
            expectTypeOf(partial.put(maybeName, 1)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
        });

        it("rejects an object key, which no PHP array can hold", () => {
            // @ts-expect-error - PHP cannot store an object key
            list.put({}, 1);
        });
    });

    describe("forget", () => {
        it("drops the literal keys it removes from a keyed collection", () => {
            expectTypeOf(collect({ a: 1, b: 2 }).forget("a")).toEqualTypeOf<
                Collection<number, "b", "keyed">
            >();
            expectTypeOf(record.forget(["a", "b"])).toEqualTypeOf<
                Collection<number, "c", "keyed">
            >();
            expectTypeOf(partial.forget("a")).toEqualTypeOf<
                Collection<number, "b", "partial">
            >();
        });

        it("keeps a list a list, which reindexes", () => {
            expectTypeOf(list.forget(1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.forget([0, 2])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.forget(collect([0]))).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types a keyed collection as partial for keys it cannot name", () => {
            expectTypeOf(record.forget("z")).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.forget(collect(["a"]))).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.forget(null)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps every key it may not remove: a wide key's, a union's or a list's that is no literal list", () => {
            expectTypeOf(list.forget(count)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(generic.forget(name)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(record.forget(aOrB)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(record.forget(someOfAB)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("keeps every key a key pattern or a branded key may name, since only one of them goes", () => {
            expectTypeOf(users.forget(userKey)).toEqualTypeOf<
                Collection<number, `user-${number}`, "partial">
            >();
            expectTypeOf(users.forget([userKey])).toEqualTypeOf<
                Collection<number, `user-${number}`, "partial">
            >();
            expectTypeOf(lowered.forget(loweredKey)).toEqualTypeOf<
                Collection<number, Lowercase<string>, "partial">
            >();
            expectTypeOf(byId.forget(idKey)).toEqualTypeOf<
                Collection<number, string & { readonly brand: "id" }, "partial">
            >();
            expectTypeOf(bySerial.forget(serialKey)).toEqualTypeOf<
                Collection<
                    string,
                    number & { readonly brand: "serial" },
                    "partial"
                >
            >();
        });

        it("keeps every key of a keyed collection for an empty list, which removes none", () => {
            expectTypeOf(record.forget([])).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "keyed">
            >();
        });

        it("keeps each shape a collection of either shape may have", () => {
            expectTypeOf(listOrKeyed.forget(collect([0]))).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.forget("a")).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.forget(2)).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });

        it("rejects a closure, which PHP cannot unset as an offset", () => {
            // @ts-expect-error - unset() refuses a Closure offset
            list.forget(() => 1);
        });
    });

    describe("has", () => {
        it("takes keys as arguments, as one array, or null", () => {
            expectTypeOf(record.has("a")).toEqualTypeOf<boolean>();
            expectTypeOf(record.has("a", "b")).toEqualTypeOf<boolean>();
            expectTypeOf(record.has(["a", "b"])).toEqualTypeOf<boolean>();
            expectTypeOf(record.has(null)).toEqualTypeOf<boolean>();
            expectTypeOf(record.has([null, "a"])).toEqualTypeOf<boolean>();
            expectTypeOf(list.has(0, 1)).toEqualTypeOf<boolean>();
            expectTypeOf(generic.has(0)).toEqualTypeOf<boolean>();
            expectTypeOf(mapped.has(2)).toEqualTypeOf<boolean>();
        });

        it("requires a key, as PHP's has() does", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for a has() with no key
            record.has();
        });
    });

    describe("hasAny", () => {
        it("takes keys as arguments, as one array, or null", () => {
            expectTypeOf(record.hasAny("a")).toEqualTypeOf<boolean>();
            expectTypeOf(record.hasAny("z", "a")).toEqualTypeOf<boolean>();
            expectTypeOf(record.hasAny(["z", "a"])).toEqualTypeOf<boolean>();
            expectTypeOf(record.hasAny(null)).toEqualTypeOf<boolean>();
            expectTypeOf(record.hasAny([null])).toEqualTypeOf<boolean>();
            expectTypeOf(list.hasAny([0, 5])).toEqualTypeOf<boolean>();
            expectTypeOf(generic.hasAny(0)).toEqualTypeOf<boolean>();
            expectTypeOf(mapped.hasAny(2)).toEqualTypeOf<boolean>();
        });

        it("requires a key, as PHP's hasAny() does", () => {
            // @ts-expect-error - PHP throws ArgumentCountError for a hasAny() with no key
            record.hasAny();
        });
    });

    describe("offsetExists", () => {
        it("answers whether the key holds a value", () => {
            expectTypeOf(record.offsetExists("a")).toEqualTypeOf<boolean>();
            expectTypeOf(list.offsetExists(0)).toEqualTypeOf<boolean>();
            expectTypeOf(generic.offsetExists("a")).toEqualTypeOf<boolean>();
            expectTypeOf(mapped.offsetExists(2)).toEqualTypeOf<boolean>();
        });

        it("rejects an object key, which isset() refuses", () => {
            // @ts-expect-error - isset() refuses an object offset
            list.offsetExists({});
        });
    });

    describe("offsetGet", () => {
        it("adds undefined to the item for a key the items may lack", () => {
            expectTypeOf(collect({ a: 1, b: 2 }).offsetGet("a")).toEqualTypeOf<
                number | undefined
            >();
            expectTypeOf(list.offsetGet(0)).toEqualTypeOf<number | undefined>();
            expectTypeOf(generic.offsetGet(0)).toEqualTypeOf<
                number | undefined
            >();
            expectTypeOf(mapped.offsetGet(2)).toEqualTypeOf<
                string | undefined
            >();
        });
    });

    describe("offsetSet", () => {
        it("takes the collection's own key, or null to append, and its own value", () => {
            expectTypeOf(record.offsetSet("a", 5)).toEqualTypeOf<void>();
            expectTypeOf(record.offsetSet(null, 5)).toEqualTypeOf<void>();
            expectTypeOf(list.offsetSet(0, 5)).toEqualTypeOf<void>();
            expectTypeOf(generic.offsetSet("k", 5)).toEqualTypeOf<void>();
            expectTypeOf(mapped.offsetSet(3, "d")).toEqualTypeOf<void>();
        });

        it("rejects another key or value, which it returns no collection to carry", () => {
            // @ts-expect-error - a list's keys are numbers; put() types the keyed collection a string key makes
            list.offsetSet("x", 1);
            // @ts-expect-error - the record holds numbers; put() types a collection holding another value
            record.offsetSet("a", "x");
        });
    });

    describe("offsetUnset", () => {
        it("unsets a key and answers nothing", () => {
            expectTypeOf(record.offsetUnset("a")).toEqualTypeOf<void>();
            expectTypeOf(list.offsetUnset(0)).toEqualTypeOf<void>();
            expectTypeOf(generic.offsetUnset("a")).toEqualTypeOf<void>();
            expectTypeOf(mapped.offsetUnset(2)).toEqualTypeOf<void>();
        });

        it("rejects an object key, which unset() refuses", () => {
            // @ts-expect-error - unset() refuses an object offset
            record.offsetUnset({});
        });
    });

    describe("add", () => {
        it("widens the values, and the keys with the integer key it appends", () => {
            expectTypeOf(list.add("s")).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(record.add("s")).toEqualTypeOf<
                Collection<string | number, "a" | "b" | "c" | number, "keyed">
            >();
            expectTypeOf(partial.add(1)).toEqualTypeOf<
                Collection<number, "a" | "b" | number, "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.add(1)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.add("d")).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });
    });

    describe("push", () => {
        it("takes values of several types at once", () => {
            expectTypeOf(list.push("s", true)).toEqualTypeOf<
                Collection<string | number | boolean, number, "list">
            >();
            expectTypeOf(record.push("s", true)).toEqualTypeOf<
                Collection<
                    string | number | boolean,
                    "a" | "b" | "c" | number,
                    "keyed"
                >
            >();
        });

        it("keeps the values when given none", () => {
            expectTypeOf(list.push()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.push("x")).toEqualTypeOf<
                Collection<string | number, string | number, "keyed">
            >();
            expectTypeOf(mapped.push(true)).toEqualTypeOf<
                Collection<string | boolean, number, "keyed">
            >();
        });

        it("types a subclass's result as the base collection, since the push may change its types", () => {
            expectTypeOf(new Tagged([1]).push(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });
    });

    describe("unshift", () => {
        it("takes values of several types at once", () => {
            expectTypeOf(list.unshift("a", 1, true)).toEqualTypeOf<
                Collection<string | number | boolean, number, "list">
            >();
            expectTypeOf(record.unshift("s")).toEqualTypeOf<
                Collection<string | number, "a" | "b" | "c" | number, "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.unshift(1)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.unshift("z")).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
        });
    });

    describe("prepend", () => {
        it("keeps a list a list without a key, as array_unshift() does", () => {
            expectTypeOf(list.prepend("s")).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(record.prepend("s")).toEqualTypeOf<
                Collection<string | number, "a" | "b" | "c" | number, "keyed">
            >();
        });

        it("types a list given a string or null key as keyed", () => {
            expectTypeOf(list.prepend("s", "k")).toEqualTypeOf<
                Collection<string | number, number | "k", "keyed">
            >();
            expectTypeOf(list.prepend("s", null)).toEqualTypeOf<
                Collection<string | number, number | "", "keyed">
            >();
        });

        it("types a list given an integer key as either shape, since key 0 keeps it a list", () => {
            expectTypeOf(list.prepend("s", 0)).toEqualTypeOf<
                Collection<string | number, number, "list" | "keyed">
            >();
            expectTypeOf(list.prepend("s", "1")).toEqualTypeOf<
                Collection<string | number, number, "list" | "keyed">
            >();
        });

        it("adds the key to a keyed or a partial collection's", () => {
            expectTypeOf(record.prepend(0, "zero")).toEqualTypeOf<
                Collection<number, "a" | "b" | "c" | "zero", "keyed">
            >();
            expectTypeOf(partial.prepend(0, "c")).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.prepend(1, "k")).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(mapped.prepend("z", "k")).toEqualTypeOf<
                Collection<string, number | "k", "keyed">
            >();
        });

        it("types a key that may be null as either the empty-string key or the key", () => {
            // A string key may be a numeric one, which casts to an index: "0" keeps a list a list.
            expectTypeOf(list.prepend("s", maybeName)).toEqualTypeOf<
                Collection<string | number, string | number, "list" | "keyed">
            >();
            expectTypeOf(list.prepend("s", maybeIndex)).toEqualTypeOf<
                Collection<string | number, number | "", "list" | "keyed">
            >();
            expectTypeOf(record.prepend(0, maybeName)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
            expectTypeOf(partial.prepend(0, maybeIndex)).toEqualTypeOf<
                Collection<number, "a" | "b" | "" | number, "partial">
            >();
        });

        it("rejects an object key, which no PHP array can hold", () => {
            // @ts-expect-error - PHP cannot store an object key
            list.prepend("s", {});
        });
    });

    describe("pop", () => {
        it("answers the item for no count or a count of 1, as dataPop does", () => {
            expectTypeOf(list.pop()).toEqualTypeOf(Data.dataPop(numberList));
            expectTypeOf(record.pop()).toEqualTypeOf(Data.dataPop(abc));
            // Kept beside the pins, which answer number | null for both backings and so cannot tell them apart.
            expectTypeOf(list.pop()).toEqualTypeOf<number | null>();
            expectTypeOf(record.pop()).toEqualTypeOf<number | null>();
            expectTypeOf(list.pop(1)).toEqualTypeOf<number | null>();
        });

        it("answers a list of the items for any other count", () => {
            expectTypeOf(list.pop(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(record.pop(0)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("answers either for a count that is only known to be a number", () => {
            expectTypeOf(list.pop(count)).toEqualTypeOf<
                number | Collection<number, number, "list"> | null
            >();
        });

        it("types a generic or a Map-built collection's items", () => {
            // Not pinned to dataPop, which types a Map's value as unknown.
            expectTypeOf(mapped.pop()).toEqualTypeOf<string | null>();
            expectTypeOf(mapped.pop(2)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(generic.pop(2)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });
    });

    describe("shift", () => {
        it("answers the item for no count or a count of 1, as dataShift does", () => {
            expectTypeOf(list.shift()).toEqualTypeOf(
                Data.dataShift(numberList),
            );
            expectTypeOf(record.shift()).toEqualTypeOf(Data.dataShift(abc));
            // Kept beside the pins, which answer number | null for both backings and so cannot tell them apart.
            expectTypeOf(list.shift()).toEqualTypeOf<number | null>();
            expectTypeOf(record.shift()).toEqualTypeOf<number | null>();
            expectTypeOf(list.shift(1)).toEqualTypeOf<number | null>();
        });

        it("answers a list of the items for any other count, or null for an empty collection", () => {
            expectTypeOf(list.shift(2)).toEqualTypeOf<Collection<
                number,
                number,
                "list"
            > | null>();
            expectTypeOf(record.shift(0)).toEqualTypeOf<Collection<
                number,
                number,
                "list"
            > | null>();
        });

        it("answers either for a count that is only known to be a number", () => {
            expectTypeOf(list.shift(count)).toEqualTypeOf<
                number | Collection<number, number, "list"> | null
            >();
        });

        it("types a generic or a Map-built collection's items", () => {
            // Not pinned to dataShift, which types a Map's value as unknown.
            expectTypeOf(mapped.shift()).toEqualTypeOf<string | null>();
            expectTypeOf(mapped.shift(2)).toEqualTypeOf<Collection<
                string,
                number,
                "list"
            > | null>();
            expectTypeOf(generic.shift(2)).toEqualTypeOf<Collection<
                number,
                number,
                "list"
            > | null>();
        });
    });

    describe("splice", () => {
        it("answers a list's removed items as a list", () => {
            expectTypeOf(list.splice(1)).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(list.splice(1, null, [4, 5])).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("types a keyed collection's removed items as partial", () => {
            expectTypeOf(record.splice(1)).toEqualTypeOf<
                Collection<number, "a" | "b" | "c", "partial">
            >();
            expectTypeOf(partial.splice(0, 1)).toEqualTypeOf<
                Collection<number, "a" | "b", "partial">
            >();
        });

        it("renumbers integer keys, as array_splice() does", () => {
            expectTypeOf(
                collect({ 1: "a", x: "b" }).splice(0, 1),
            ).toEqualTypeOf<Collection<string, number | "x", "partial">>();
        });

        it("keeps each shape a collection of either shape may have", () => {
            expectTypeOf(listOrKeyed.splice(0)).toEqualTypeOf<
                Collection<number, number, "list" | "partial">
            >();
        });

        it("types a generic or a Map-built collection's removed items", () => {
            expectTypeOf(generic.splice(0)).toEqualTypeOf<
                Collection<number, string | number, "partial">
            >();
            expectTypeOf(mapped.splice(0, 1)).toEqualTypeOf<
                Collection<string, number, "partial">
            >();
        });
    });

    describe("pad", () => {
        it("widens a list's values with the padding, as dataPad does", () => {
            const padded = list.pad(5, "s");

            expectTypeOf<ItemsOf<typeof padded>>().toEqualTypeOf(
                Data.dataPad(numberList, 5, "s"),
            );
            expectTypeOf(padded).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
        });

        it("keeps a record's keys and adds the integer keys it pads with", () => {
            // Not pinned to dataPad, which types each of a record's own keys apart from the padding.
            expectTypeOf(record.pad(5, "s")).toEqualTypeOf<
                Collection<string | number, "a" | "b" | "c" | number, "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            // Not pinned to dataPad, which types a Map's values as unknown.
            expectTypeOf(mapped.pad(5, "p")).toEqualTypeOf<
                Collection<string, number, "keyed">
            >();
            expectTypeOf(generic.pad(4, 0)).toEqualTypeOf<
                Collection<number, string | number, "keyed">
            >();
        });
    });

    describe("transform", () => {
        it("types the values as the callback's answers, keeping the keys and the shape", () => {
            expectTypeOf(list.transform(String)).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(record.transform((value) => [value])).toEqualTypeOf<
                Collection<number[], "a" | "b" | "c", "keyed">
            >();
            expectTypeOf(partial.transform(String)).toEqualTypeOf<
                Collection<string, "a" | "b", "partial">
            >();
        });

        it("types the callback's value and key", () => {
            list.transform((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value;
            });
            record.transform((value, key) => {
                expectTypeOf(value).toEqualTypeOf<number>();
                expectTypeOf(key).toEqualTypeOf<"a" | "b" | "c">();

                return value;
            });
            people.transform((value, key) => {
                expectTypeOf(value).toEqualTypeOf<Row>();
                expectTypeOf(key).toEqualTypeOf<number>();

                return value.name;
            });
        });

        it("types a generic or a Map-built collection's callback and result", () => {
            expectTypeOf(
                mapped.transform((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<string>();
                    expectTypeOf(key).toEqualTypeOf<number>();

                    return value.length;
                }),
            ).toEqualTypeOf<Collection<number, number, "keyed">>();
            expectTypeOf(
                generic.transform((value, key) => {
                    expectTypeOf(value).toEqualTypeOf<number>();
                    expectTypeOf(key).toEqualTypeOf<string | number>();

                    return `${key}`;
                }),
            ).toEqualTypeOf<Collection<string, string | number, "keyed">>();
        });
    });

    describe("keys", () => {
        it("lists the keys, as dataKeys does", () => {
            const listKeys = list.keys();
            const recordKeys = record.keys();

            expectTypeOf<ItemsOf<typeof listKeys>>().toEqualTypeOf(
                Data.dataKeys(numberList),
            );
            expectTypeOf<ItemsOf<typeof recordKeys>>().toEqualTypeOf(
                Data.dataKeys(abc),
            );
            expectTypeOf(recordKeys).toEqualTypeOf<
                Collection<"a" | "b" | "c", number, "list">
            >();
        });

        it("lists a generic, a Map-built or a partial collection's keys", () => {
            // Not pinned to dataKeys, which types a Map's keys as string | number.
            expectTypeOf(mapped.keys()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(generic.keys()).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(partial.keys()).toEqualTypeOf<
                Collection<"a" | "b", number, "list">
            >();
        });
    });

    describe("values", () => {
        it("lists the values, as dataValues does", () => {
            const listValues = list.values();
            const recordValues = record.values();

            expectTypeOf<ItemsOf<typeof listValues>>().toEqualTypeOf(
                Data.dataValues(numberList),
            );
            expectTypeOf<ItemsOf<typeof recordValues>>().toEqualTypeOf(
                Data.dataValues(abc),
            );
            // Kept beside the pins, which answer number[] for both backings and so cannot tell them apart.
            expectTypeOf(listValues).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(recordValues).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });

        it("lists a generic, a Map-built or a partial collection's values", () => {
            // Not pinned to dataValues, which types a Map's values as unknown.
            expectTypeOf(mapped.values()).toEqualTypeOf<
                Collection<string, number, "list">
            >();
            expectTypeOf(generic.values()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
            expectTypeOf(partial.values()).toEqualTypeOf<
                Collection<number, number, "list">
            >();
        });
    });

    describe("concat", () => {
        it("widens the values with the source's, and the keys with the integer keys it appends", () => {
            expectTypeOf(list.concat(["x"])).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(list.concat(collect(["x"]))).toEqualTypeOf<
                Collection<string | number, number, "list">
            >();
            expectTypeOf(record.concat({ x: true })).toEqualTypeOf<
                Collection<boolean | number, "a" | "b" | "c" | number, "keyed">
            >();
        });

        it("types a generic or a Map-built collection's result", () => {
            expectTypeOf(generic.concat(["x"])).toEqualTypeOf<
                Collection<string | number, string | number, "keyed">
            >();
            expectTypeOf(mapped.concat(new Map([["k", 1]]))).toEqualTypeOf<
                Collection<string | number, number, "keyed">
            >();
        });

        it("rejects a string, which PHP's foreach warns over", () => {
            // @ts-expect-error - PHP's parameter is iterable, which a string is not
            list.concat("abc");
        });
    });
});
